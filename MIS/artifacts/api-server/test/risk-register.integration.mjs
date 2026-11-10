// Development-only live PostgreSQL/API verification. --keep leaves a private
// /tmp fixture for browser verification; --cleanup <manifest> removes only that
// run's rows. Bare --cleanup still supports the old, fixed-path manifest.
import assert from "node:assert/strict";
import { readFile,writeFile,rm } from "node:fs/promises";
import { randomBytes,randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyRankingStability } from "./risk-ranking-scenarios.mjs";

if(process.env.NODE_ENV==="production") throw new Error("Development tests only.");
const cleanupIndex=process.argv.indexOf("--cleanup");
const cleanupMode=cleanupIndex!==-1;
let fixturePath=cleanupMode ? (process.argv[cleanupIndex+1]??"/tmp/mis-risk-fixtures.json") : undefined;
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
let f;
let ownsManifest=false;
async function save(){
  await writeFile(fixturePath,JSON.stringify(f),{mode:0o600,flag:ownsManifest?"w":"wx"});
  ownsManifest=true;
}
async function cleanup(){
  if(!f || !ownsManifest) return;
  assert.match(f.prefix,/^RTEST_[a-f0-9]{8}$/);
  // Validate every destructive selector before opening the transaction. Never
  // use a wildcard to remove accounts or departments from other fixture runs.
  assert(Array.isArray(f.users) && f.users.every(user=>
    ["admin","manager","champion","owner","unrelated","unmapped"].some(label=>user===`${f.prefix}_${label}`)));
  assert(Array.isArray(f.departments) && f.departments.every(code=>
    code===`${f.prefix}A` || code===`${f.prefix}B`));
  assert(Array.isArray(f.periods) && f.periods.every(id=>Number.isSafeInteger(id) && id>0));
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const notificationTable=await client.query("SELECT to_regclass('risk.review_notifications') AS name");
    if(notificationTable.rows[0]?.name) await client.query(`DELETE FROM risk.review_notifications WHERE summary_id IN
      (SELECT summary_id FROM risk.department_summary WHERE depart_code=ANY($1::text[]))`,[f.departments]);
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
    await client.query("COMMIT");await rm(fixturePath,{force:true});ownsManifest=false;
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
async function createTestPeriod(){
  // Select an unused full year so the later April-June period is also free.
  // Retry a 409 if another independent fixture wins the same dates first.
  const {rows}=await pool.query(`SELECT year FROM generate_series(2100,2399) year
    WHERE NOT EXISTS(SELECT 1 FROM risk.periods
      WHERE period_from<=make_date(year,12,31) AND period_to>=make_date(year,1,1))
    ORDER BY random()`);
  for(const {year} of rows){
    const result=await api("/periods","admin","POST",{
      period_from:`${year}-01-01`,period_to:`${year}-03-31`});
    if(result.status===409) continue;
    assert.equal(result.status,201,result.body.error);
    assert.equal(result.body.ok,true);
    f.period=result.body.data.period_id;f.periods.push(f.period);await save();
    return year;
  }
  throw new Error("No unused synthetic reporting year is available.");
}
try{
  if(cleanupMode){
    assert(!fixturePath.startsWith("--"),"Pass the manifest path after --cleanup.");
    f=JSON.parse(await readFile(fixturePath,"utf8"));ownsManifest=true;
    await cleanup();console.log("Risk fixtures removed.");
  }else{
    f={prefix:`RTEST_${randomBytes(4).toString("hex")}`,users:[],departments:[],periods:[],cookies:{},accounts:{}};
    fixturePath=`/tmp/mis-risk-fixtures-${f.prefix}.json`;
    await save();
    console.log(`Risk fixture manifest: ${fixturePath}`);
    const password=`RiskT!${randomBytes(18).toString("hex")}`,hash=await bcrypt.hash(password,10);
    const {rows:[managementProfile]}=await pool.query(
      "SELECT profile_id FROM crm.profiles WHERE LOWER(TRIM(profile_name))='risk management' AND is_active");
    assert(managementProfile,"Apply the Risk Management profile migration before testing its overall view");
    for(const [label,profile] of [["admin",1],["manager",managementProfile.profile_id],["champion",9],["owner",9],["unrelated",8],["unmapped",9]]){
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
        [department,`Synthetic risk department ${label} ${f.prefix}`]);
      await pool.query("INSERT INTO risk.objectives(obj_code,obj_name,depart_code) VALUES($1,$2,$3)",
        [objective,`Synthetic objective ${label}`,department]);
    }
    f.department=f.departments[0];f.objective=`${f.prefix}OA`;
    const year=await createTestPeriod();
    await ok("/assignments","admin","POST",{depart_code:f.department,
      champion_username:f.accounts.champion.username,owner_username:f.accounts.owner.username});
    const options=await ok("/options","champion","GET");
    assert(options.actor.champion_departments.includes(f.department));
    assert.equal(options.actor.can_manage,false);
    f.category=options.categories[0].category_code;await save();
    const activeActionStatus=options.action_statuses.find(item=>item.status!=="Closed")?.status;
    assert.ok(activeActionStatus,"The approved action-status list needs an active non-closed choice for workflow verification.");
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
    assert.equal(detail.risk.risk_status,"Open","Risks without root causes stay Open");
    assert.equal(detail.risk.at_risk,false);
    const pendingUrl=`/records?access=update&view=pending_assessment&depart_code=${f.department}&period_id=${f.period}`;
    assert((await ok(pendingUrl,"champion","GET")).some(row=>row.risk_code===risk.risk_code));
    const assessment={...input,i_rate:4,l_rate:5,control_effectiveness:.3333,
      current_contr:"Current mitigation controls",desired_contr_effe:"Strengthen controls",
      expected_updated_at:detail.risk.updated_at,comments:"Synthetic assessment retained note"};
    let assessed=await ok(`/records/${risk.risk_code}`,"champion","PUT",assessment);
    assert.equal(Number(assessed.r_risk_exposure),13.33);
    assert(!(await ok(pendingUrl,"champion","GET")).some(row=>row.risk_code===risk.risk_code),"Saved risks leave the assessment queue");
    assert((await ok(`/records?access=update&depart_code=${f.department}&period_id=${f.period}`,"champion","GET")).some(row=>row.risk_code===risk.risk_code),"Saved risks remain available to the summary");
    assert.equal((await api(`/records/${risk.risk_code}`,"champion","PUT",assessment)).status,409);
    assessed=await verifyRankingStability({pool,ok,api,assessment,assessed,prefix:f.prefix,riskCode:risk.risk_code});
    const originalRoot=await ok(`/records/${risk.risk_code}/root-causes`,"champion","POST",{
      root_cause:"Process dependency",current_contr:"Existing operational control",mitigations:"Strengthen review checks",
      due_date:`${year}-03-01`,action_owner:f.accounts.champion.username,action_status:activeActionStatus,
      expected_updated_at:assessed.updated_at});
    // Exercise aggregate status without changing shared action-status catalogs.
    const extraRoot=await pool.query(`INSERT INTO risk.root_causes(risk_code,root_cause,action_status)
      VALUES($1,'Synthetic aggregate-status check','Closed') RETURNING root_id`,[risk.risk_code]);
    for(const [actionStatus,expectedStatus,flagged] of [
      ["Planned","Open",false],["In progress","Open",false],
      ["Behind schedule","Open",true],["Closed","Closed",false],
    ]){
      await pool.query("UPDATE risk.root_causes SET action_status=$2 WHERE root_id=$1",[originalRoot.root_id,actionStatus]);
      const snapshot=(await ok(`/records/${risk.risk_code}`,"champion","GET")).risk;
      assert.equal(snapshot.risk_status,expectedStatus,actionStatus);
      assert.equal(snapshot.at_risk,flagged,actionStatus);
      assert.equal(snapshot.root_cause_count,2);
      assert.equal(snapshot.completed_action_count,actionStatus==="Closed"?2:1);
      assert.equal(snapshot.behind_schedule_count,flagged?1:0);
      assert.equal(snapshot.workflow_status,"OPEN","Root closure does not close the review workflow");
      assert.equal(snapshot.can_edit,true);
      assert.equal(Number(snapshot.r_risk_exposure),13.33,"Action flags do not change exposure scores");
      const closedRows=await ok(`/records?access=update&view=closed&depart_code=${f.department}&period_id=${f.period}`,"champion","GET");
      assert.equal(closedRows.some(row=>row.risk_code===risk.risk_code),expectedStatus==="Closed","Partial root closure must not mark a risk closed");
      const allRows=await ok(`/records?access=update&depart_code=${f.department}&period_id=${f.period}`,"champion","GET");
      assert.equal(allRows.find(row=>row.risk_code===risk.risk_code).risk_status,expectedStatus);
      // Assessment completion is independent of root-action closure.
      await pool.query("UPDATE risk.risk_master SET assessment_updated=FALSE WHERE risk_code=$1",[risk.risk_code]);
      const pendingRows=await ok(pendingUrl,"champion","GET");
      assert(pendingRows.some(row=>row.risk_code===risk.risk_code),
        "Every active unassessed risk remains in the queue, including all-closed roots");
      await pool.query("UPDATE risk.risk_master SET assessment_updated=TRUE WHERE risk_code=$1",[risk.risk_code]);
    }
    await pool.query("DELETE FROM risk.root_causes WHERE root_id=$1",[extraRoot.rows[0].root_id]);
    await pool.query("UPDATE risk.root_causes SET action_status=$2 WHERE root_id=$1",[originalRoot.root_id,activeActionStatus]);
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
    assert.equal((await api("/workflow","admin","POST",wf("PROCESS"))).status,400,
      "Manual ranking processing is no longer a supported workflow action");
    const processed=await ok(`/records/${risk.risk_code}`,"champion","GET");
    assert.equal(Number(processed.risk.r_risk_exposure),13.33);
    await ok("/workflow","champion","POST",wf("SUBMIT"));
    await ok("/workflow","owner","POST",wf("REVIEW"));
    const reviewedSummary = await ok(`/summary?depart_code=${f.department}&period_id=${f.period}`,"admin","GET");
    assert.equal(reviewedSummary[0].workflow_status,"REVIEWED","Review forwards the register to sign-off without signing it off");
    const reviewedRisk = await ok(`/records/${risk.risk_code}`,"owner","GET");
    assert.equal(reviewedRisk.risk.workflow_status,"REVIEWED");
    const signoffRecords = await ok(`/records?access=view&view=reviewed&depart_code=${f.department}&period_id=${f.period}`,"owner","GET");
    assert(signoffRecords.some(row=>row.risk_code===risk.risk_code),"The department's reviewed risks are available to the Signoff summary");
    assert(signoffRecords.every(row=>row.depart_code===f.department && row.period_id===f.period && row.workflow_status==="REVIEWED"),
      "Signoff summary records stay within the selected department, reporting period and reviewed state");
    assert.equal((await api("/workflow","owner","POST",wf("REVERT_REVIEW"))).status,403);
    await ok("/workflow","admin","POST",wf("REVERT_REVIEW"));
    const reverted=await ok(`/records/${risk.risk_code}`,"owner","GET");
    assert.equal(reverted.risk.workflow_status,"SUBMITTED");
    assert.equal(reverted.risk.assessment_updated,true);
    assert.deepEqual(reverted.risk.ranking_snapshot,reviewedRisk.risk.ranking_snapshot);
    assert.equal(reverted.risk.r_risk_exposure,reviewedRisk.risk.r_risk_exposure);
    assert.deepEqual(reverted.root_causes,reviewedRisk.root_causes);
    assert(reverted.history.some(event=>event.action==="REVERT_REVIEW"));
    assert.equal((await ok(`/records?view=reviewed&depart_code=${f.department}&period_id=${f.period}`,"admin","GET")).length,0);
    const submittedAgain=await ok(`/records?view=submitted&depart_code=${f.department}&period_id=${f.period}`,"owner","GET");
    assert(submittedAgain.some(row=>row.risk_code===risk.risk_code));
    await ok("/workflow","owner","POST",wf("REVIEW"));
    await ok("/workflow","admin","POST",wf("SIGN_OFF"));
    const signed=await ok(`/records/${risk.risk_code}`,"admin","GET");
    assert.equal(signed.risk.workflow_status,"SIGNED_OFF");
    assert.deepEqual(signed.risk.ranking_snapshot,reviewedRisk.risk.ranking_snapshot);
    assert.equal((await ok(`/records?view=reviewed&depart_code=${f.department}&period_id=${f.period}`,"admin","GET")).length,0);
    assert((await ok(`/records?view=signed&depart_code=${f.department}&period_id=${f.period}`,"admin","GET")).some(row=>row.risk_code===risk.risk_code));
    await ok("/workflow","admin","POST",wf("REVERT_REVIEW"));
    assert.equal((await ok(`/records/${risk.risk_code}`,"owner","GET")).risk.workflow_status,"SUBMITTED");
    await ok("/workflow","owner","POST",wf("REVIEW"));
    await ok("/workflow","admin","POST",wf("SIGN_OFF"));
    const analytics=await ok(`/analytics?depart_code=${f.department}&period_id=${f.period}&population=all`,"champion","GET");
    assert.equal(analytics.totals.total_risks,1);
    assert.equal(analytics.heatmap.length,25);
    assert.equal(analytics.heatmap.reduce((sum,cell)=>sum+cell.count,0),analytics.totals.ranked_risks);
    assert(analytics.departments.every(d=>d.depart_code===f.department));
    assert(analytics.top_ten_overall.length<=10);
    assert(analytics.top_ten_overall.every(r=>r.depart_code===f.department),"Champion overall rankings remain inside authorized departments");
    assert(analytics.top_ten_departments.every(d=>d.depart_code===f.department&&d.risks.length<=10));
    assert.equal(analytics.overall_ranked_count+analytics.overall_unranked_count,1);
    assert.equal((await api(`/analytics?depart_code=${f.departments[1]}&period_id=${f.period}`,"champion")).status,403);
    assert.equal((await api(`/analytics?population=invalid`,"admin")).status,400);
    assert.equal((await api("/analytics",null)).status,401);
    const unsignedBefore=(await pool.query(`SELECT to_jsonb(s) AS snapshot FROM risk.department_summary s
      JOIN risk.periods p ON p.period_from=s.period_from AND p.period_to=s.period_to
      WHERE p.period_id=$1 AND s.depart_code=$2`,[f.period,f.departments[1]])).rows;
    assert.equal((await api(`/periods/${f.period}/close`,"champion","POST",{comments:"Unauthorized close"})).status,403);
    assert.equal((await api(`/periods/${f.period}/close`,"admin","POST",{comments:""})).status,400);
    const batch=await ok(`/periods/${f.period}/close`,"admin","POST",{comments:"Close signed registers, preserve unsigned departments"});
    assert.equal(batch.status,"OPEN");assert.equal(batch.closed_registers,1);
    assert.deepEqual(batch.closed_departments,[f.department]);
    const unsignedAfter=(await pool.query(`SELECT to_jsonb(s) AS snapshot FROM risk.department_summary s
      JOIN risk.periods p ON p.period_from=s.period_from AND p.period_to=s.period_to
      WHERE p.period_id=$1 AND s.depart_code=$2`,[f.period,f.departments[1]])).rows;
    assert.deepEqual(unsignedAfter,unsignedBefore,"Unsigned register data and workflow remain unchanged");
    assert.equal((await api(`/periods/${f.period}/close`,"admin","POST",{comments:"Repeat close must not duplicate events"})).status,409);
    const closed=await ok(`/records/${risk.risk_code}`,"champion","GET");
    assert.equal(closed.risk.workflow_status,"CLOSED");assert.equal(closed.risk.can_edit,false);
    assert.equal((await ok(`/summary?period_id=${f.period}`,"admin","GET")).find(row=>row.depart_code===f.department).workflow_status,"CLOSED");
    assert.equal((await api("/workflow","admin","POST",wf("REVERT_REVIEW"))).status,409);
    assert.equal((await api(`/records/${risk.risk_code}`,"admin","PUT",{...assessment,expected_updated_at:closed.risk.updated_at})).status,409);
    const reopenScope=await ok(`/workflow/reopen-scope?depart_code=${f.departments[0]}&period_id=${f.period}`,"admin","GET");
    await ok("/workflow","admin","POST",{...wf("REOPEN"),confirmation_token:reopenScope.confirmation_token});
    await ok("/assignments","admin","POST",{depart_code:f.departments[1],
      champion_username:f.accounts.unrelated.username,owner_username:f.accounts.owner.username});
    // Stale legacy champion rows must not override an explicit department map.
    await pool.query("INSERT INTO risk.champions(emp_code,username,department) VALUES($1,$1,$2)",
      [f.accounts.champion.username,f.departments[1]]);
    assert.equal((await api("/records?access=review","champion")).status,403);
    assert.equal((await api("/records?access=update","owner")).status,403);
    assert.equal((await api("/summary?access=review","champion")).status,403);
    assert.equal((await api("/summary?access=update","owner")).status,403);
    assert.equal((await api(`/records?access=update&depart_code=${f.departments[1]}`,"champion")).status,403);
    const ownerOptions=await ok("/options","owner","GET");
    assert.deepEqual([...ownerOptions.actor.owner_departments].sort(),[...f.departments].sort());
    const ownerRows=await ok(`/records?access=review&period_id=${f.period}`,"owner","GET");
    assert.equal(ownerRows.length,2);
    const ownerSummaries=await ok(`/summary?access=review&period_id=${f.period}`,"owner","GET");
    assert.deepEqual(ownerSummaries.map(row=>row.depart_code).sort(),[...f.departments].sort());
    // Dashboard defaults omit depart_code, but the server still scopes both data contracts.
    for (const [label,expected] of [["admin",f.departments],["manager",f.departments],["owner",f.departments],["champion",[f.department]]]) {
      const dashboardRows=await ok(`/records?access=view&period_id=${f.period}`,label,"GET");
      assert.deepEqual(dashboardRows.map(row=>row.depart_code).sort(),[...expected].sort());
      assert(dashboardRows.every(row=>row.risk_code && row.risk_title),"Dashboard receives risks, not history events.");
      const dashboardSummary=await ok(`/summary?access=view&period_id=${f.period}`,label,"GET");
      assert(dashboardSummary.filter(row=>expected.includes(row.depart_code)).every(row=>row.total_risks===1));
      if (label!=="admin"&&label!=="manager") assert.deepEqual(dashboardSummary.map(row=>row.depart_code).sort(),[...expected].sort());
      const dashboardAnalytics=await ok(`/analytics?period_id=${f.period}&population=all`,label,"GET");
      assert.deepEqual(dashboardAnalytics.departments.map(row=>row.depart_code).sort(),[...expected].sort());
      assert.deepEqual(dashboardAnalytics.top_ten_departments.map(row=>row.depart_code).sort(),[...expected].sort());
      assert(dashboardAnalytics.priorities.every(row=>expected.includes(row.depart_code)));
      assert(dashboardAnalytics.top_ten_overall.every(row=>expected.includes(row.depart_code)));
      const roleOptions=await ok("/options",label,"GET");
      assert.equal(roleOptions.actor.can_manage,["admin","manager"].includes(label));
      if(label==="champion"||label==="owner") {
        assert(roleOptions.departments.every(row=>expected.includes(row.depart_code)));
      }
    }
    const unmappedAnalytics=await ok(`/analytics?period_id=${f.period}&population=all`,"unmapped","GET");
    assert.equal(unmappedAnalytics.totals.total_risks,0);
    assert.deepEqual(unmappedAnalytics.top_ten_overall,[]);
    assert.deepEqual(unmappedAnalytics.top_ten_departments,[]);
    assert.equal((await api(`/analytics?depart_code=${f.department}&period_id=${f.period}`,"unmapped")).status,403);
    const championRows=await ok(`/records?access=update&period_id=${f.period}`,"champion","GET");
    assert.deepEqual(championRows.map(row=>row.depart_code),[f.department]);
    await ok("/assignments","admin","POST",{depart_code:f.departments[1],
      champion_username:f.accounts.unrelated.username,owner_username:f.accounts.champion.username});
    const dualUpdate=await ok(`/records?access=update&period_id=${f.period}`,"champion","GET");
    const dualReview=await ok(`/records?access=review&period_id=${f.period}`,"champion","GET");
    assert.deepEqual(dualUpdate.map(row=>row.depart_code),[f.department]);
    assert.deepEqual(dualReview.map(row=>row.depart_code),[f.departments[1]]);
    await ok("/assignments","admin","POST",{depart_code:f.departments[1],
      champion_username:f.accounts.unrelated.username,owner_username:f.accounts.owner.username});
    // Dashboard counts must cover the full filtered scope, not the 500-row
    // display sample. Keep these fixtures isolated from ordinary register data.
    const extraPeriod=await ok("/periods","admin","POST",{
      period_from:`${year}-04-01`,period_to:`${year}-06-30`},201);
    f.periods.push(extraPeriod.period_id);await save();
    const bulkPrefix=`${f.prefix}X`;
    for(const [suffix,department,count,assessed,periodId,active] of [
      ["A",f.department,620,600,f.period,true],
      ["B",f.departments[1],550,550,f.period,true],
      ["P",f.department,30,30,extraPeriod.period_id,true],
      ["I",f.department,10,10,f.period,false],
    ]){
      await pool.query(`INSERT INTO risk.risk_master
        (risk_code,depart_code,period_from,period_to,risk_title,entered_by,is_active,assessment_updated)
        SELECT $1||n::text,$2,p.period_from,p.period_to,
          $3||CASE WHEN n<=20 THEN ' needle' ELSE ' ordinary' END,$4,$5,n<=$6
        FROM risk.periods p CROSS JOIN generate_series(1,$7::integer) n WHERE p.period_id=$8`,
        [bulkPrefix+suffix,department,bulkPrefix,f.accounts.admin.username,active,assessed,count,periodId]);
    }
    const checkTotals=async(label,params,active,assessed,departments)=>{
      const result=await api(`/records?${new URLSearchParams(params)}`,label);
      assert.equal(result.status,200);
      assert.equal(result.body.ok,true);
      assert.deepEqual(result.body.totals,{active_risks:active,assessed_risks:assessed});
      assert.equal(result.body.data.length,Math.min(active,500));
      assert(result.body.data.every(row=>departments.includes(row.depart_code)));
      assert(result.body.data.every(row=>!("scope_active_risks" in row) && !("scope_assessed_risks" in row)));
    };
    const selected={access:"view",period_id:String(f.period)};
    await checkTotals("champion",selected,621,600,[f.department]);
    await checkTotals("owner",selected,1172,1150,f.departments);
    await checkTotals("admin",selected,1172,1150,f.departments);
    await checkTotals("owner",{...selected,depart_code:f.department},621,600,[f.department]);
    await checkTotals("champion",{access:"view"},651,630,[f.department]);
    await checkTotals("owner",{access:"view"},1202,1180,f.departments);
    await checkTotals("champion",{...selected,search:"needle"},20,20,[f.department]);
    await checkTotals("owner",{...selected,search:"needle"},40,40,f.departments);
    await checkTotals("owner",{...selected,search:bulkPrefix+"A620"},1,0,[f.department]);
    await checkTotals("owner",{...selected,search:"no-such-risk"},0,0,[]);
    await checkTotals("champion",{...selected,view:"open"},621,600,[f.department]);
    await checkTotals("champion",{...selected,access:"update",view:"pending_assessment"},21,0,[f.department]);
    await pool.query(`INSERT INTO risk.department_summary(depart_code,period_from,period_to,submitted)
      SELECT $1,period_from,period_to,TRUE FROM risk.periods WHERE period_id=$2
      ON CONFLICT(depart_code,period_from,period_to) DO UPDATE SET submitted=TRUE`,
      [f.departments[1],f.period]);
    await checkTotals("owner",{...selected,view:"submitted",access:"review"},551,550,[f.departments[1]]);
    await checkTotals("champion",{...selected,view:"submitted"},0,0,[]);
    await checkTotals("unrelated",{...selected,depart_code:f.departments[1]},551,550,[f.departments[1]]);
    assert.equal((await api(`/records?${new URLSearchParams({...selected,depart_code:f.departments[1]})}`,"champion")).status,403);
    // A dual-role actor must not receive owner totals in the champion queue.
    await ok("/assignments","admin","POST",{depart_code:f.departments[1],
      champion_username:f.accounts.unrelated.username,owner_username:f.accounts.champion.username});
    await checkTotals("champion",{...selected,access:"update"},621,600,[f.department]);
    await checkTotals("champion",{...selected,access:"review",view:"submitted"},551,550,[f.departments[1]]);
    await ok("/assignments","admin","POST",{depart_code:f.departments[1],
      champion_username:f.accounts.unrelated.username,owner_username:f.accounts.owner.username});
    await pool.query("DELETE FROM risk.risk_master WHERE risk_code LIKE $1",[bulkPrefix+"%"]);
    await pool.query("DELETE FROM risk.register_history WHERE period_id=$1",[extraPeriod.period_id]);
    await pool.query("DELETE FROM risk.periods WHERE period_id=$1",[extraPeriod.period_id]);
    // Fixture-only sign-offs let us verify one batch closes both departments,
    // rather than silently following a client-supplied department filter.
    const beforeBatch=await ok(`/records/${risk.risk_code}`,"admin","GET");
    await pool.query(`UPDATE risk.department_summary s SET submitted=TRUE,reviewed=TRUE,sign_off=TRUE
      FROM risk.periods p WHERE p.period_id=$1 AND s.period_from=p.period_from
      AND s.period_to=p.period_to AND s.depart_code=ANY($2::text[])`,[f.period,f.departments]);
    const wholePeriod=await ok(`/periods/${f.period}/close`,"admin","POST",
      {comments:"Close every signed fixture register in this period",depart_code:f.department});
    assert.equal(wholePeriod.closed_registers,2);
    assert.equal(wholePeriod.status,"CLOSED");assert.equal(wholePeriod.remaining_registers,0);
    assert.deepEqual(wholePeriod.closed_departments,[...f.departments].sort());
    const afterBatch=await ok(`/records/${risk.risk_code}`,"admin","GET");
    assert.deepEqual(afterBatch.risk.ranking_snapshot,beforeBatch.risk.ranking_snapshot);
    assert.deepEqual(afterBatch.root_causes,beforeBatch.root_causes,"Batch closure preserves every saved root cause and action");
    const closedRegisters=await ok(`/summary?period_id=${f.period}`,"admin","GET");
    assert(closedRegisters.filter(row=>f.departments.includes(row.depart_code)).every(row=>row.workflow_status==="CLOSED"));
    assert.equal((await api(`/periods/${f.period}/close`,"admin","POST",{comments:"Do not close twice"})).status,409);
    const batchReopen=await ok(`/workflow/reopen-scope?depart_code=${f.department}&period_id=${f.period}`,"admin","GET");
    await ok("/workflow","admin","POST",{...wf("REOPEN"),confirmation_token:batchReopen.confirmation_token});
    // Remove only the extra synthetic private risk, so the browser can close
    // the remaining registered department without modifying real departments.
    await pool.query("DELETE FROM risk.register_history WHERE risk_code=$1",[privateRisk.risk_code]);
    await pool.query("DELETE FROM risk.risk_master WHERE risk_code=$1",[privateRisk.risk_code]);
    await pool.query("DELETE FROM risk.department_summary WHERE depart_code=$1",[f.departments[1]]);
    if(process.argv.includes("--keep")){
      const fresh=await ok(`/records/${risk.risk_code}`,"champion","GET");
      await ok(`/records/${risk.risk_code}`,"champion","PUT",{...assessment,expected_updated_at:fresh.risk.updated_at});
      await ok("/workflow","champion","POST",wf("SUBMIT"));
    }
    await save();
    console.log("Risk live checks passed: full-scope totals above 500 rows, department/period/search/workflow isolation, multi-department owner and dual-role page scopes, stale champion-map rejection, role gates, stale updates, exact scoring, return/reassessment, review/sign-off, closure guards, and retained history.");
    if(!process.argv.includes("--keep")) await cleanup();
    else console.log(`Private browser fixture ready at ${fixturePath}.\nRemove it with: node test/risk-register.integration.mjs --cleanup ${fixturePath}`);
  }
}catch(e){
  // --keep retains successful fixtures only. A failed setup/workflow must not
  // leave accounts behind or touch a previously retained run's manifest.
  if(!cleanupMode){
    try{await cleanup();}catch(cleanupError){
      throw new AggregateError([e,cleanupError],`Risk check and cleanup failed; retry --cleanup ${fixturePath}`);
    }
  }
  throw e;
}finally{await pool.end();}
