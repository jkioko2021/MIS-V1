// Development-only live PostgreSQL/API verification. --keep leaves a private
// /tmp fixture for browser verification; --cleanup removes only this test's rows.
import assert from "node:assert/strict";
import { readFile,writeFile,rm } from "node:fs/promises";
import { randomBytes,randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if(process.env.NODE_ENV==="production") throw new Error("Development tests only.");
const fixturePath="/tmp/mis-risk-fixtures.json";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
let f;
async function save(){await writeFile(fixturePath,JSON.stringify(f),{mode:0o600});}
async function cleanup(){
  if(!f) return;
  assert.match(f.prefix,/^RTEST_[a-f0-9]{8}$/);
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("DELETE FROM risk.register_history WHERE depart_code=ANY($1::text[]) OR period_id=ANY($2::int[])",[f.departments,f.periods]);
    await client.query("DELETE FROM risk.root_causes WHERE risk_code IN(SELECT risk_code FROM risk.risk_master WHERE depart_code=ANY($1::text[]))",[f.departments]);
    await client.query("DELETE FROM risk.master_summary WHERE depart_code=ANY($1::text[])",[f.departments]);
    await client.query("DELETE FROM risk.risk_master WHERE depart_code=ANY($1::text[])",[f.departments]);
    for(const table of ["department_summary","department_assignments","champions","objectives","departments"]){
      const field=table==="champions" ? "department" : "depart_code";
      await client.query(`DELETE FROM risk.${table} WHERE ${field}=ANY($1::text[])`,[f.departments]);
    }
    await client.query("DELETE FROM risk.periods WHERE period_id=ANY($1::int[])",[f.periods]);
    await client.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::text[])",[f.users]);
    await client.query("DELETE FROM crm.employees WHERE username=ANY($1::text[])",[f.users]);
    await client.query("COMMIT");await rm(fixturePath,{force:true});
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
}
async function api(path="",label="admin",method="GET",data){
  const r=await fetch(`http://localhost:80/api/risk-register${path}`,{
    method,headers:{"Content-Type":"application/json",...(label?{Cookie:`mis_session=${f.cookies[label]}`}:{})},
    ...(data ? {body:JSON.stringify(data)}:{}),
  });
  return {status:r.status,body:await r.json()};
}
async function ok(path,label,method,data,status=200){
  const r=await api(path,label,method,data);
  assert.equal(r.status,status,`${method} ${path}: ${r.body.error??"unexpected status"}`);
  assert.equal(r.body.ok,true);return r.body.data;
}
try{
  if(process.argv.includes("--cleanup")){
    f=JSON.parse(await readFile(fixturePath,"utf8"));await cleanup();console.log("Risk fixtures removed.");
  }else{
    f={prefix:`RTEST_${randomBytes(4).toString("hex")}`,users:[],departments:[],periods:[],cookies:{},accounts:{}};
    await save();
    const password=`RiskT!${randomBytes(18).toString("hex")}`,hash=await bcrypt.hash(password,10);
    for(const [label,profile] of [["admin",1],["champion",9],["owner",9],["unrelated",8]]){
      const username=`${f.prefix}_${label}`;
      f.users.push(username);await save();
      const {rows:[e]}=await pool.query(`INSERT INTO crm.employees
        (emp_code,username,password_hash,employee_name,profile_id,department,activated,approved,last_password_reset)
        VALUES($1,$1,$2,$3,$4,'RISK',TRUE,TRUE,CURRENT_DATE) RETURNING employee_id,session_version`,
      [username,hash,`Synthetic risk ${label}`,profile]);
      const {rows:[p]}=await pool.query("SELECT session_version FROM crm.profiles WHERE profile_id=$1",[profile]);
      const sid=randomUUID();
      await pool.query(`INSERT INTO crm.auth_sessions(session_id,employee_id,employee_version,profile_id,profile_version)
        VALUES($1,$2,$3,$4,$5)`,[sid,e.employee_id,e.session_version,profile,p.session_version]);
      f.cookies[label]=jwt.sign({sub:e.employee_id,username,name:`Synthetic risk ${label}`,profileId:profile,sid},
        process.env.SESSION_SECRET??"dev-secret-change-me",{expiresIn:"2h"});
      f.accounts[label]={username,password};await save();
    }
    for(const label of ["A","B"]){
      const department=`${f.prefix}${label}`,objective=`${f.prefix}O${label}`;
      f.departments.push(department);await save();
      await pool.query("INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,$2)",
        [department,`Synthetic risk department ${label}`]);
      await pool.query("INSERT INTO risk.objectives(obj_code,obj_name,depart_code) VALUES($1,$2,$3)",
        [objective,`Synthetic objective ${label}`,department]);
    }
    f.department=f.departments[0];f.objective=`${f.prefix}OA`;
    const year=2100+Math.floor(Math.random()*300);
    const p=await ok("/periods","admin","POST",{period_from:`${year}-01-01`,period_to:`${year}-03-31`},201);
    f.period=p.period_id;f.periods.push(p.period_id);await save();
    await ok("/assignments","admin","POST",{depart_code:f.department,
      champion_username:f.accounts.champion.username,owner_username:f.accounts.owner.username});
    const options=await ok("/options","champion","GET");
    assert(options.actor.champion_departments.includes(f.department));
    assert.equal(options.actor.can_manage,false);
    f.category=options.categories[0].category_code;await save();
    assert.equal((await api("/options",null)).status,401);
    const input={depart_code:f.department,period_id:f.period,objective_code:f.objective,
      risk_title:"Synthetic operational risk",risk_description:"Temporary verification record",
      risk_category:f.category,risk_consequence:"Delayed operational service"};
    assert.equal((await api("/records","owner","POST",input)).status,403);
    const risk=await ok("/records","champion","POST",input,201);f.riskCode=risk.risk_code;await save();
    const privateRisk=await ok("/records","admin","POST",{...input,depart_code:f.departments[1],
      objective_code:`${f.prefix}OB`,risk_title:"Synthetic private department risk"},201);
    assert.equal((await api(`/records/${privateRisk.risk_code}`,"champion")).status,403);
    assert.equal((await api(`/records/${risk.risk_code}`,"unrelated")).status,403);
    assert.equal((await ok("/records","unrelated","GET")).length,0);
    const unmappedOptions = await ok("/options","unrelated","GET");
    for (const key of ["departments","categories","objectives","periods","staff","assignments"]) {
      assert.deepEqual(unmappedOptions[key],[],`Unmapped staff must not see ${key} options`);
    }
    const wf=action=>({depart_code:f.department,period_id:f.period,action,comments:`Synthetic ${action} note`});
    assert.equal((await api("/workflow","champion","POST",wf("SUBMIT"))).status,409);
    const detail=await ok(`/records/${risk.risk_code}`,"champion","GET");
    const assessment={...input,i_rate:4,l_rate:5,control_effectiveness:.3333,
      current_contr:"Current mitigation controls",desired_contr_effe:"Strengthen controls",
      expected_updated_at:detail.risk.updated_at,comments:"Synthetic assessment retained note"};
    const assessed=await ok(`/records/${risk.risk_code}`,"champion","PUT",assessment);
    assert.equal(Number(assessed.r_risk_exposure),13.33);
    assert.equal((await api(`/records/${risk.risk_code}`,"champion","PUT",assessment)).status,409);
    await ok(`/records/${risk.risk_code}/root-causes`,"champion","POST",{
      root_cause:"Process dependency",current_contr:"Existing operational control",mitigations:"Strengthen review checks",
      due_date:`${year}-03-01`,action_owner:f.accounts.champion.username,action_status:"Open",
      expected_updated_at:assessed.updated_at});
    await ok("/workflow","champion","POST",wf("SUBMIT"));
    assert.equal((await api("/workflow","champion","POST",wf("SIGN_OFF"))).status,403);
    const ownerDetail=await ok(`/records/${risk.risk_code}`,"owner","GET");
    assert.equal(ownerDetail.risk.can_edit,true);
    await ok(`/records/${risk.risk_code}`,"owner","PUT",{...assessment,
      expected_updated_at:ownerDetail.risk.updated_at,comments:"Synthetic owner correction retained"});
    await ok("/workflow","owner","POST",wf("RETURN"));
    const returned=await ok(`/records/${risk.risk_code}`,"champion","GET");
    assert.equal(returned.risk.assessment_updated,false);
    assert(returned.history.some(h=>h.comments==="Synthetic assessment retained note"));
    await ok(`/records/${risk.risk_code}`,"champion","PUT",{...assessment,expected_updated_at:returned.risk.updated_at});
    await ok("/workflow","admin","POST",wf("PROCESS"));
    const processed=await ok(`/records/${risk.risk_code}`,"champion","GET");
    assert.equal(Number(processed.risk.r_risk_exposure),13.33);
    await ok("/workflow","champion","POST",wf("SUBMIT"));
    await ok("/workflow","owner","POST",wf("REVIEW"));
    await ok("/workflow","admin","POST",wf("SIGN_OFF"));
    assert.equal((await api(`/periods/${f.period}/close`,"admin","POST",{comments:"Must reject unsigned department"})).status,409);
    await ok("/workflow","admin","POST",wf("CLOSE"));
    const closed=await ok(`/records/${risk.risk_code}`,"champion","GET");
    assert.equal(closed.risk.workflow_status,"CLOSED");assert.equal(closed.risk.can_edit,false);
    assert.equal((await api(`/records/${risk.risk_code}`,"admin","PUT",{...assessment,expected_updated_at:closed.risk.updated_at})).status,409);
    await ok("/workflow","admin","POST",wf("REOPEN"));
    // Remove only the extra synthetic private risk, so the browser can close
    // the remaining registered department without modifying real departments.
    await pool.query("DELETE FROM risk.register_history WHERE risk_code=$1",[privateRisk.risk_code]);
    await pool.query("DELETE FROM risk.risk_master WHERE risk_code=$1",[privateRisk.risk_code]);
    await pool.query("DELETE FROM risk.department_summary WHERE depart_code=$1",[f.departments[1]]);
    await save();
    console.log("Risk live checks passed: department isolation, role gates, stale updates, exact scoring, return/reassessment, review/sign-off, closure guards, and retained history.");
    if(!process.argv.includes("--keep")) await cleanup();
    else console.log("Private browser fixture ready at /tmp/mis-risk-fixtures.json.");
  }
}catch(e){
  if(!process.argv.includes("--keep")) await cleanup();
  throw e;
}finally{await pool.end();}
