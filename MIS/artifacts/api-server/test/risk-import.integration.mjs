// Development-only verification of the real authenticated API and PostgreSQL atomicity.
// --keep retains a private fixture for one browser pass; --cleanup removes only that fixture.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile, rm } from "node:fs/promises";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
const fixturePath = "/tmp/mis-risk-import-fixture.json";
let f;
const save = () => writeFile(fixturePath,JSON.stringify(f),{mode:0o600});
async function cleanup() {
  if (!f) return;
  assert.match(f.prefix,/^IMPTEST_[a-f0-9]{8}$/);
  const departments = [f.department,...(f.otherDepartment ? [f.otherDepartment] : [])];
  const trigger = f.prefix.toLowerCase();
  await pool.query(`DROP TRIGGER IF EXISTS ${trigger} ON risk.root_causes`);
  await pool.query(`DROP FUNCTION IF EXISTS risk.${trigger}()`);
  await pool.query(`DELETE FROM risk.register_history WHERE depart_code=ANY($1::text[])
    OR (action='LEGACY_IMPORT_SOURCE' AND actor=ANY($2::text[]))`,[departments,f.users]);
  await pool.query("DELETE FROM risk.root_causes WHERE risk_code IN (SELECT risk_code FROM risk.risk_master WHERE depart_code=ANY($1::text[]))",[departments]);
  await pool.query("DELETE FROM risk.risk_master WHERE depart_code=ANY($1::text[])",[departments]);
  for (const table of ["department_summary","department_assignments","objectives","departments"])
    await pool.query(`DELETE FROM risk.${table} WHERE depart_code=ANY($1::text[])`,[departments]);
  if (f.period) await pool.query("DELETE FROM risk.periods WHERE period_id=$1",[f.period]);
  await pool.query("DELETE FROM crm.auth_sessions WHERE employee_id IN (SELECT employee_id FROM crm.employees WHERE username=ANY($1::text[]))",[f.users]);
  await pool.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::text[])",[f.users]);
  await pool.query("DELETE FROM crm.employees WHERE username=ANY($1::text[])",[f.users]);
  await rm(fixturePath,{force:true});
}
async function api(path,label="admin",body) {
  const res = await fetch(`http://localhost:80/api/risk-register${path}`,{
    method:body ? "POST" : "GET",headers:{"Content-Type":"application/json",
      ...(label ? {Cookie:`mis_session=${f.cookies[label]}`} : {})},
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  return {status:res.status,body:await res.json()};
}
const preview = async (records,label="admin",extra={}) => api("/import/preview",label,{
  source_name:"Synthetic legacy export",source_text:JSON.stringify({records}),...extra,
});
const confirmation = (records,p) => ({
  source_name:"Synthetic legacy export",source_text:JSON.stringify({records}),
  preview_token:p.body.data.preview_token,environment:p.body.data.environment,confirm:true,
});
const count = async () => Number((await pool.query("SELECT count(*) FROM risk.risk_master WHERE depart_code=$1",[f.department])).rows[0].count);
try {
  if (process.argv.includes("--cleanup")) {
    f = JSON.parse(await readFile(fixturePath,"utf8")); await cleanup();
    console.log("Synthetic import fixtures removed.");
  } else {
    f = {prefix:`IMPTEST_${randomBytes(4).toString("hex")}`,users:[],cookies:{},accounts:{}};
    f.department = f.prefix; f.objective = f.prefix; await save();
    const password = `ImportT!${randomBytes(18).toString("hex")}`;
    const hash = await bcrypt.hash(password,10);
    for (const [label,profile] of [["admin",1],["champion",9],["owner",9],["unrelated",8]]) {
      const username = `${f.prefix}_${label}`; f.users.push(username); await save();
      const {rows:[e]} = await pool.query(`INSERT INTO crm.employees
        (emp_code,username,password_hash,employee_name,profile_id,department,activated,approved,last_password_reset)
        VALUES($1,$1,$2,$3,$4,'RISK',TRUE,TRUE,CURRENT_DATE) RETURNING employee_id,session_version`,
      [username,hash,`Synthetic import ${label}`,profile]);
      const {rows:[p]} = await pool.query("SELECT session_version FROM crm.profiles WHERE profile_id=$1",[profile]);
      const sid = randomUUID();
      await pool.query(`INSERT INTO crm.auth_sessions(session_id,employee_id,employee_version,profile_id,profile_version)
        VALUES($1,$2,$3,$4,$5)`,[sid,e.employee_id,e.session_version,profile,p.session_version]);
      f.cookies[label] = jwt.sign({sub:e.employee_id,username,name:`Synthetic import ${label}`,profileId:profile,sid},
        process.env.SESSION_SECRET ?? "dev-secret-change-me",{expiresIn:"2h"});
      f.accounts[label] = {username,password}; await save();
    }
    await pool.query("INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,'Synthetic import department')",[f.department]);
    await pool.query("INSERT INTO risk.objectives(obj_code,obj_name,depart_code) VALUES($1,'Synthetic import objective',$2)",[f.objective,f.department]);
    await pool.query(`INSERT INTO risk.department_assignments(depart_code,champion_username,owner_username,assigned_by)
      VALUES($1,$2,$3,$4)`,[f.department,f.accounts.champion.username,f.accounts.owner.username,f.accounts.admin.username]);
    const year = 6000+Math.floor(Math.random()*3000);
    const {rows:[p]} = await pool.query(`INSERT INTO risk.periods(period_from,period_to)
      VALUES($1,$2) RETURNING period_id,period_from::text,period_to::text`,[`${year}-01-01`,`${year}-03-31`]);
    f.period = p.period_id; await save();
    const optionsResponse = await api("/options");
    assert.equal(optionsResponse.status,200,optionsResponse.body.error);
    const options = optionsResponse.body.data;
    assert(options.categories.length && options.action_statuses.length,"Approved categories and statuses required.");
    const closed = options.action_statuses.find(s => s.status === "Closed");
    const row = {
      legacy_risk_code:`${f.prefix}_LEGACY_1`,risk_id:1234,entered_by:"historical.username",
      depart_code:f.department,objective_code:f.objective,risk_category:options.categories[0].category_code,
      period_from:p.period_from,period_to:p.period_to,risk_title:"Synthetic multiline imported risk",
      risk_description:"  Description line one\nDescription line two  ",risk_consequence:"Consequence\nsecond line",
      i_rate:10,l_rate:5,control_effectiveness:0.333333,i_risk_exposure:50,r_risk_exposure:33.33,
      current_contr:"  First control\nSecond control  ",desired_contr_effe:"Desired\ncontrol",
      submitted:true,reviewed:true,sign_off:true,closed:true,
      root_causes:[{root_id:456,root_cause:"  Cause one\nCause two  ",current_contr:"Root control\nsecond line",
        mitigations:"  Mitigation one\nMitigation two  ",due_date:p.period_to,
        action_owner:"historical.username",action_status:closed?.status ?? options.action_statuses[0].status}],
    };
    f.sample = {records:[{...row,legacy_risk_code:`${f.prefix}_BROWSER`}]}; await save();
    assert.equal((await preview([row],null)).status,401);
    for (const role of ["champion","owner","unrelated"]) {
      assert.equal((await preview([row],role)).status,403);
      assert.equal((await api("/import/confirm",role,{})).status,403);
    }
    const cases = [
      {depart_code:"NOT_APPROVED"},{objective_code:"NOT_APPROVED"},{risk_category:"NOT_APPROVED"},
      {control_effectiveness:33.3333},{control_effectiveness:-0.1},{control_effectiveness:"0.5"},
      {control_effectiveness:0.1234567},{i_rate:0},{l_rate:101},{i_rate:1.234},
      {period_from:"2026-02-30"},{period_from:p.period_to,period_to:p.period_from},
      {period_from:"2025-01-01",period_to:"2025-01-30"},{r_risk_exposure:99},
      {i_risk_rate:99},{root_causes:[{...row.root_causes[0],action_status:"Unapproved"}]},
      {root_causes:[{...row.root_causes[0],due_date:"2026-02-30"}]},
    ];
    for (const override of cases) {
      const invalid = await preview([{...row,...override}]);
      assert.equal(invalid.status,200);
      assert.equal(invalid.body.data.valid,false,JSON.stringify(override));
      assert.equal(invalid.body.data.preview_token,undefined);
    }
    assert.equal((await preview([row,{...row,legacy_risk_code:row.legacy_risk_code.toLowerCase()}])).body.data.valid,false);
    assert.equal((await preview([], "admin",{source_text:"broken JSON"})).body.data.valid,false);
    assert.equal((await preview([], "admin",{source_text:"x".repeat(61441)})).status,400);
    assert.equal((await preview([], "admin",{source_text:JSON.stringify({records:[{...row,extra:"\0"}]})})).body.data.valid,false);
    const good = await preview([row]); assert.equal(good.body.data.valid,true);
    assert.equal(good.body.data.rows[0].residual,33.33);
    assert.equal(await count(),0,"Preview must not write risks");
    assert.equal((await pool.query("SELECT count(*) FROM risk.department_summary WHERE depart_code=$1",[f.department])).rows[0].count,"0");
    for (const override of [{confirm:false},{environment:"Wrong environment"},{preview_token:"forged"},{source_name:"Changed"}]) {
      assert([400,409].includes((await api("/import/confirm","admin",{...confirmation([row],good),...override})).status));
    }
    const changed = [{...row,risk_title:"Changed after preview"}];
    assert.equal((await api("/import/confirm","admin",confirmation(changed,good))).status,409);
    const invalidBatch = await preview([row,{...row,legacy_risk_code:`${f.prefix}_BAD`,risk_category:"BAD"}]);
    assert.equal((await api("/import/confirm","admin",confirmation([row],invalidBatch))).status,400);
    assert.equal(await count(),0);
    // Force a second-row INSERT failure, demonstrating rollback of the first record and its history.
    const trigger = f.prefix.toLowerCase();
    await pool.query(`CREATE FUNCTION risk.${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.mitigations='${f.prefix}_FAIL' THEN RAISE EXCEPTION 'Synthetic rollback'; END IF; RETURN NEW; END $$`);
    await pool.query(`CREATE TRIGGER ${trigger} BEFORE INSERT ON risk.root_causes FOR EACH ROW EXECUTE FUNCTION risk.${trigger}()`);
    const failing = {...row,legacy_risk_code:`failing_${f.prefix}`,root_causes:[{...row.root_causes[0],mitigations:`${f.prefix}_FAIL`}]};
    const rollbackPreview = await preview([row,failing]); assert.equal(rollbackPreview.body.data.valid,true);
    assert.equal((await api("/import/confirm","admin",confirmation([row,failing],rollbackPreview))).status,500);
    assert.equal(await count(),0);
    assert.equal((await pool.query("SELECT count(*) FROM risk.register_history WHERE depart_code=$1",[f.department])).rows[0].count,"0");
    assert.equal((await pool.query("SELECT count(*) FROM risk.register_history WHERE action='LEGACY_IMPORT_SOURCE' AND actor=$1",[f.accounts.admin.username])).rows[0].count,"0");
    await pool.query(`DROP TRIGGER ${trigger} ON risk.root_causes`);
    await pool.query(`DROP FUNCTION risk.${trigger}()`);
    // A retired reference between preview and confirmation is rejected before any writes.
    await pool.query("UPDATE risk.objectives SET is_active=FALSE WHERE depart_code=$1 AND obj_code=$2",[f.department,f.objective]);
    assert.equal((await api("/import/confirm","admin",confirmation([row],good))).status,409);
    await pool.query("UPDATE risk.objectives SET is_active=TRUE WHERE depart_code=$1 AND obj_code=$2",[f.department,f.objective]);
    const finalPreview = await preview([row]);
    const attempts = await Promise.all([1,2].map(() => api("/import/confirm","admin",confirmation([row],finalPreview))));
    assert.deepEqual(attempts.map(r => r.status).sort(),[201,409],"Concurrent confirmation imports only once");
    const success = attempts.find(r=>r.status===201);
    f.riskCode = success.body.data.risk_codes[0]; await save();
    const detail = (await api(`/records/${f.riskCode}`)).body.data;
    assert.notEqual(f.riskCode,row.legacy_risk_code);
    assert.notEqual(detail.risk.risk_id,1234);
    assert.equal(detail.risk.entered_by,f.accounts.admin.username);
    assert.equal(Number(detail.risk.perceived_rate),0.333333);
    for (const field of ["risk_description","current_contr","desired_contr_effe"])
      assert.equal(detail.risk[field],row[field]);
    assert.equal(detail.risk.workflow_status,"OPEN");
    assert.equal(detail.root_causes[0].root_cause,row.root_causes[0].root_cause);
    assert.equal(detail.root_causes[0].mitigations,row.root_causes[0].mitigations);
    assert.equal(detail.root_causes[0].action_owner,null);
    const event = detail.history.find(e=>e.action==="LEGACY_IMPORTED");
    assert.deepEqual(event.snapshot.raw_source,row);
    assert.equal(event.snapshot.source_text,undefined,"Department history must not contain full batch source");
    const batchEvent = (await api("/history")).body.data.find(e=>e.action==="LEGACY_IMPORT_SOURCE" && e.snapshot.batch_id===event.snapshot.batch_id);
    assert.equal(batchEvent.depart_code,null);
    assert.equal(batchEvent.snapshot.source_text,JSON.stringify({records:[row]}));
    assert.equal(event.snapshot.legacy_risk_code,row.legacy_risk_code);
    assert.equal((await preview([row])).body.data.valid,false,"Previously imported code blocked");
    assert.equal((await preview([{...row,legacy_risk_code:f.riskCode}])).body.data.valid,false,"Live code collision blocked");
    assert.equal((await pool.query("SELECT status FROM risk.periods WHERE period_id=$1",[f.period])).rows[0].status,"OPEN");
    const assignments = (await pool.query("SELECT * FROM risk.department_assignments WHERE depart_code=$1",[f.department])).rows[0];
    assert.equal(assignments.champion_username,f.accounts.champion.username);
    assert.equal(assignments.owner_username,f.accounts.owner.username);
    await pool.query("UPDATE risk.department_summary SET sign_off=TRUE WHERE depart_code=$1",[f.department]);
    assert.equal((await preview([{...row,legacy_risk_code:`signed_${f.prefix}`}])).body.data.valid,false);
    await pool.query("UPDATE risk.department_summary SET sign_off=FALSE WHERE depart_code=$1",[f.department]);
    // Mixed-department batch evidence must not cross either detail or history authorization.
    f.otherDepartment = `${f.prefix}B`; await save();
    await pool.query("INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,'Synthetic private import department')",[f.otherDepartment]);
    await pool.query("INSERT INTO risk.objectives(obj_code,obj_name,depart_code) VALUES($1,'Synthetic private import objective',$2)",[f.otherDepartment,f.otherDepartment]);
    const privateMarker = `${f.prefix}_PRIVATE_DEPARTMENT_B`;
    const mixed = [
      {...row,legacy_risk_code:`${f.prefix}_MIX_A`},
      {...row,legacy_risk_code:`${f.prefix}_MIX_B`,depart_code:f.otherDepartment,objective_code:f.otherDepartment,
        risk_title:privateMarker,risk_description:`Confidential ${privateMarker}`,entered_by:`private_owner_${privateMarker}`},
    ];
    const mixedPreview = await preview(mixed); assert.equal(mixedPreview.body.data.valid,true);
    const mixedResult = await api("/import/confirm","admin",confirmation(mixed,mixedPreview));
    assert.equal(mixedResult.status,201);
    const [codeA,codeB] = mixedResult.body.data.risk_codes;
    for (const label of ["champion","owner"]) {
      const scopedDetail = await api(`/records/${codeA}`,label);
      assert.equal(scopedDetail.status,200);
      assert(!JSON.stringify(scopedDetail.body).includes(privateMarker),"Detail leaked another department's source");
      assert(scopedDetail.body.data.history.every(e=>e.action!=="LEGACY_IMPORT_SOURCE"));
      const scopedHistory = await api("/history",label);
      assert.equal(scopedHistory.status,200);
      assert(!JSON.stringify(scopedHistory.body).includes(privateMarker),"History leaked another department's source");
      assert(scopedHistory.body.data.every(e=>e.action!=="LEGACY_IMPORT_SOURCE"));
      assert.equal((await api(`/records/${codeB}`,label)).status,403);
      assert.equal((await api(`/history?depart_code=${f.otherDepartment}`,label)).status,403);
    }
    const managementHistory = (await api("/history")).body.data;
    const fullMixed = managementHistory.find(e=>e.action==="LEGACY_IMPORT_SOURCE" && e.snapshot.source_text===JSON.stringify({records:mixed}));
    assert(fullMixed,"Management must retain the exact full batch source");
    assert.equal(fullMixed.depart_code,null);
    assert.equal(fullMixed.period_id,null);
    const scopedEvent = managementHistory.find(e=>e.risk_code===codeA && e.action==="LEGACY_IMPORTED");
    assert.deepEqual(scopedEvent.snapshot.raw_source,mixed[0]);
    assert.equal(scopedEvent.snapshot.source_text,undefined);
    console.log("PASS: import permissions, references, dates, fractions, scores, no-write preview, confirmation binding, DB rollback, concurrent duplicates, provenance, mixed-department history isolation and unchanged workflow/access.");
    if (!process.argv.includes("--keep")) await cleanup();
  }
} catch (err) {
  console.error(err);
  await cleanup();
  process.exitCode=1;
} finally { await pool.end(); }
