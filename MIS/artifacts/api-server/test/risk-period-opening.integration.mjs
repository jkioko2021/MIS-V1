// Uses only a private fixture produced by risk-register.integration.mjs --keep.
// Leaves a second synthetic closed department available for the browser test.
import assert from "node:assert/strict";
import {readFile,writeFile} from "node:fs/promises";
import pg from "pg";
if(process.env.NODE_ENV==="production") throw new Error("Development only");
const path=process.argv[2],f=JSON.parse(await readFile(path,"utf8"));
assert.match(f.prefix,/^RTEST_[a-f0-9]{8}$/);
assert(f.departments.every(d=>[`${f.prefix}A`,`${f.prefix}B`].includes(d)));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
async function api(route,label="admin",method="GET",body,status=200){
  const response=await fetch(`http://localhost:80/api/risk-register${route}`,{method,
    headers:{"Content-Type":"application/json",Cookie:`mis_session=${f.cookies[label]}`},
    ...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json();
  assert.equal(response.status,status,`${method} ${route}: ${result.error??response.status}`);
  return result.data;
}
async function snapshot(){
  const {rows}=await pool.query(`SELECT to_jsonb(r) AS risk,
    (SELECT jsonb_agg(c ORDER BY c.root_id) FROM risk.root_causes c WHERE c.risk_code=r.risk_code) AS roots
    FROM risk.risk_master r JOIN risk.periods p ON p.period_from=r.period_from AND p.period_to=r.period_to
    WHERE r.depart_code=ANY($1::text[]) AND p.period_id=$2 ORDER BY r.risk_code`,[f.departments,f.period]);
  const {rows:summaries}=await pool.query(`SELECT to_jsonb(s) AS summary FROM risk.department_summary s
    JOIN risk.periods p ON p.period_from=s.period_from AND p.period_to=s.period_to
    WHERE s.depart_code=ANY($1::text[]) AND p.period_id=$2 ORDER BY s.depart_code`,[f.departments,f.period]);
  return {rows,summaries};
}
try {
  const {rows:[source]}=await pool.query(`SELECT r.*,r.period_from::text,r.period_to::text,p.period_id FROM risk.risk_master r
    JOIN risk.periods p ON p.period_from=r.period_from AND p.period_to=r.period_to
    WHERE r.depart_code=$1 AND p.period_id=$2 ORDER BY r.risk_code LIMIT 1`,[f.department,f.period]);
  assert(source);
  let opened;
  if(process.argv.includes("--verify-existing")) {
    assert(Number.isSafeInteger(f.opening_target));
    opened={target_period_id:f.opening_target};
  } else {
  await pool.query(`UPDATE risk.root_causes SET action_status='Behind schedule'
    WHERE root_id=(SELECT min(root_id) FROM risk.root_causes WHERE risk_code=$1)`,[source.risk_code]);
  await pool.query(`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,action_owner,action_status)
    VALUES($1,'Completed action retained in new cycle','Existing control','Completed improvement','Fixture owner','Closed')`,[source.risk_code]);
  const clone=async(code,department,title,closed)=>{
    await pool.query(`INSERT INTO risk.risk_master
      (risk_code,depart_code,period_from,period_to,objective_code,risk_title,risk_description,risk_category,risk_consequence,current_contr,desired_contr_effe,entered_by)
      SELECT $2::varchar,$3::varchar,period_from,period_to,
        CASE WHEN $3::varchar=depart_code THEN objective_code ELSE NULL END,$4::text,risk_description,risk_category,risk_consequence,current_contr,desired_contr_effe,entered_by
      FROM risk.risk_master WHERE risk_code=$1`,[source.risk_code,code,department,title]);
    await pool.query(`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,action_owner,action_status)
      VALUES($1,'Fixture root cause','Existing control','Action plan','Fixture owner',$2)`,[code,closed?"Closed":"Planned"]);
  };
  await clone(`${f.prefix}-C`,f.department,"Completed risk retained only in history",true);
  await api("/workflow","owner","POST",{depart_code:f.department,period_id:f.period,action:"REVIEW",comments:"Fixture review"});
  await api("/workflow","admin","POST",{depart_code:f.department,period_id:f.period,action:"SIGN_OFF",comments:"Fixture signoff"});
  await api(`/periods/${f.period}/close`,"admin","POST",{comments:"Fixture closure"});
  await clone(`${f.prefix}-B`,f.departments[1],"Browser ongoing risk for next reporting period",false);
  await pool.query(`INSERT INTO risk.department_summary(depart_code,period_from,period_to,submitted,reviewed,sign_off,closed)
    VALUES($1,$2,$3,TRUE,TRUE,TRUE,TRUE)`,[f.departments[1],source.period_from,source.period_to]);
  const before=await snapshot();
  const candidates=await api(`/closed-registers?depart_code=${f.department}&period_id=${f.period}`);
  assert.equal(candidates.length,1);assert.equal(candidates[0].historical,false);
  const {rows:[year]}=await pool.query(`SELECT y FROM generate_series(2400,2499) y
    WHERE NOT EXISTS(SELECT 1 FROM risk.periods WHERE period_from<=make_date(y,12,31) AND period_to>=make_date(y,1,1)) LIMIT 1`);
  const input={source_period_id:f.period,period_from:`${year.y}-01-01`,period_to:`${year.y}-12-31`,comments:"Open a fresh cycle and preserve the closed source"};
  await api(`/closed-registers/${f.department}/open`,"champion","POST",input,403);
  await api(`/closed-registers/${f.department}/open`,"admin","POST",{...input,period_from:source.period_from,period_to:source.period_to},409);
  opened=await api(`/closed-registers/${f.department}/open`,"admin","POST",input);
  f.periods.push(opened.target_period_id);f.opening_target=opened.target_period_id;
  await writeFile(path,JSON.stringify(f),{mode:0o600});
  assert.equal(opened.carried_risks,1);
  assert.deepEqual(await snapshot(),before,"Every source risk, root action and both department summaries must stay unchanged");
  }
  const history=await api(`/historical-risks?depart_code=${f.department}&period_id=${f.period}&page_size=1`);
  assert.equal(history.total,2);assert.equal(history.records.length,1);assert.equal(history.records[0].can_edit,false);
  const closed=await api(`/historical-risks?depart_code=${f.department}&period_id=${f.period}&search=Completed%20risk`);
  assert.equal(closed.records[0].risk_status,"Closed");
  const newRows=await pool.query(`SELECT r.* FROM risk.risk_master r JOIN risk.periods p
    ON p.period_from=r.period_from AND p.period_to=r.period_to WHERE r.depart_code=$1 AND p.period_id=$2`,[f.department,opened.target_period_id]);
  assert.equal(newRows.rows.length,1);assert.equal(newRows.rows[0].assessment_updated,false);
  assert.equal(newRows.rows[0].ranking_snapshot,null);
  const {rows:oldRoots}=await pool.query(`SELECT root_cause,current_contr,mitigations,due_date,action_owner,action_status
    FROM risk.root_causes WHERE risk_code=$1 ORDER BY root_id`,[source.risk_code]);
  const {rows:newRoots}=await pool.query(`SELECT root_cause,current_contr,mitigations,due_date,action_owner,action_status
    FROM risk.root_causes WHERE risk_code=$1 ORDER BY root_id`,[newRows.rows[0].risk_code]);
  assert.deepEqual(newRoots,oldRoots,"Closed as well as ongoing action plans must be retained");
  await api(`/closed-registers/${f.department}/open`,"admin","POST",
    {source_period_id:f.period,target_period_id:opened.target_period_id,comments:"Do not open a historical source twice"},409);
  await api("/workflow","admin","POST",{depart_code:f.department,period_id:f.period,action:"REOPEN",comments:"Do not alter history"},409);
  await api(`/historical-risks?depart_code=${f.department}&period_id=${f.period}`,"unrelated","GET",undefined,403);
  const archived=await api(`/closed-registers?depart_code=${f.department}`);
  assert.equal(archived[0].historical,true);assert.equal(archived[0].can_open,false);
  assert.equal(archived[0].target_period_id,opened.target_period_id);
  console.log("PASS: scoped opening, immutable source history, Closed risk statuses, complete root plans, fresh assessment, duplicate/reopen rejection, pagination and role isolation.");
  console.log(`Browser fixture: ${path}; source period ${f.period}; existing target ${opened.target_period_id}; department ${f.departments[1]}`);
} finally {await pool.end();}
