// Real routes and PostgreSQL, with every synthetic write inside one rollback-only
// transaction. Notifications have no recipient and are never visible to workers.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { build } from "esbuild";
import pg from "pg";
import express from "express";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
const dir = await mkdtemp(path.join(tmpdir(), "risk-reassessment-"));
const require = createRequire(import.meta.url);
let server;
try {
  await client.query("BEGIN");
  globalThis.reassessmentQuery = async (sql, params) => (await client.query(sql, params)).rows;
  globalThis.reassessmentTransaction = async fn => {
    await client.query("SAVEPOINT request");
    try {
      const result = await fn(client);
      await client.query("RELEASE SAVEPOINT request");
      return result;
    } catch (error) {
      await client.query("ROLLBACK TO SAVEPOINT request");
      await client.query("RELEASE SAVEPOINT request");
      throw error;
    }
  };
  const deps = {
    db: `export const query=(s,p)=>globalThis.reassessmentQuery(s,p);
      export const txQuery=(c,s,p)=>query(s,p);
      export const withTransaction=fn=>globalThis.reassessmentTransaction(fn);`,
    auth: `export function requireAuth(req,res,next){
      const id=Number(req.headers['x-test-employee']);
      if(!id){res.status(401).json({ok:false});return;}
      req.user={sub:id};next();
    }`,
  };
  await build({
    entryPoints: [fileURLToPath(new URL("../src/routes/risk-register.ts", import.meta.url))],
    outfile: path.join(dir, "route.mjs"), bundle: true, platform: "node", format: "esm", logLevel: "silent",
    plugins: [{ name: "rollback-only-db", setup(b) {
      b.onResolve({ filter: /\/(postgres|auth-middleware)$/ }, args => ({
        path: args.path.endsWith("postgres") ? "db" : "auth", namespace: "fixture",
      }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: deps[args.path], loader: "js" }));
      b.onResolve({ filter: /^[^./]/ }, args => args.path.startsWith("@workspace/") ? undefined : ({
        path: args.path.startsWith("node:") ? args.path : require.resolve(args.path), external: true,
      }));
    } }],
  });
  const { default: router } = await import(pathToFileURL(path.join(dir, "route.mjs")).href);
  const prefix = `RA${randomBytes(4).toString("hex")}`, department = `${prefix}D`;
  const users = {};
  for (const [label, profile] of [["champion", 9], ["owner", 9], ["admin", 1], ["unrelated", 8]]) {
    const { rows: [user] } = await client.query(`INSERT INTO crm.employees
      (emp_code,username,password_hash,employee_name,profile_id,department,activated,approved,last_password_reset,email)
      VALUES($1,$1,'not-a-login-hash',$1,$2,'RISK',TRUE,TRUE,CURRENT_DATE,NULL) RETURNING employee_id`,
    [`${prefix}${label}`, profile]);
    users[label] = user.employee_id;
  }
  await client.query("INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,$1)", [department]);
  await client.query(`INSERT INTO risk.department_assignments(depart_code,champion_username,owner_username,assigned_by)
    VALUES($1,$2,$3,$2)`, [department, `${prefix}champion`, `${prefix}owner`]);
  const objective = `${prefix}O`, category = `${prefix}C`;
  await client.query("INSERT INTO risk.objectives(obj_code,obj_name,depart_code) VALUES($1,$1,$2)", [objective, department]);
  await client.query("INSERT INTO risk.categories(category_code,category_name) VALUES($1,$1)", [category]);
  const { rows: [period] } = await client.query(`INSERT INTO risk.periods(period_from,period_to,status)
    SELECT make_date(y,1,1),make_date(y,3,31),'OPEN' FROM generate_series(2500,2900) y
    WHERE NOT EXISTS(SELECT 1 FROM risk.periods p
      WHERE p.period_from<=make_date(y,3,31) AND p.period_to>=make_date(y,1,1))
    ORDER BY y LIMIT 1 RETURNING period_id,period_from::text,period_to::text`);
  assert(period, "An unused synthetic period must be available");
  const snapshot = {
    impact: { code: "saved-impact", label: "Historical impact", ordinal: 4 },
    likelihood: { code: "saved-likelihood", label: "Historical likelihood", ordinal: 3 },
  };
  const codes = ["OPEN", "CLOSED", "INACTIVE"].map(s => `${prefix}${s}`);
  for (const [index, code] of codes.entries()) {
    await client.query(`INSERT INTO risk.risk_master
      (risk_code,depart_code,period_from,period_to,objective_code,risk_category,risk_title,risk_description,
       risk_consequence,entered_by,is_active,assessment_updated,i_rate,l_rate,perceived_rate,
       perceived_contr_eff,i_risk_exposure,i_risk_rate,r_risk_exposure,r_risk_rate,ranking_snapshot,current_contr)
      VALUES($1,$2,$3,$4,$5,$6,'Synthetic risk','Synthetic description','Synthetic consequence',$7,$8,TRUE,
        4,5,.25,25,20,20,15,15,$9::jsonb,'Saved controls')`,
    [code, department, period.period_from, period.period_to, objective, category, `${prefix}champion`, index !== 2, JSON.stringify(snapshot)]);
    // The closed risk has two closed roots, the open risk a mix of statuses.
    await client.query(`INSERT INTO risk.root_causes(risk_code,root_cause,mitigations,action_status)
      VALUES($1,'First saved cause','First saved mitigation',$2),($1,'Second saved cause','Second saved mitigation','Closed')`,
    [code, index === 1 ? "Closed" : "In progress"]);
  }
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.log = { error() {} }; next(); });
  app.use(router);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/risk-register`;
  async function request(url, label = "champion", method = "GET", data, status = 200) {
    const response = await fetch(base + url, {
      method, headers: { "Content-Type": "application/json", "x-test-employee": String(users[label]) },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const body = await response.json();
    assert.equal(response.status, status, `${method} ${url}: ${body.error ?? "status"}`);
    return body.data;
  }
  const scope = `depart_code=${department}&period_id=${period.period_id}`;
  const pending = `/records?access=update&view=pending_assessment&${scope}`;
  const saved = `/records?access=update&view=open&${scope}`;
  const readiness = () => request(`/readiness/${department}/${period.period_id}`);
  const detail = code => request(`/records/${code}`);
  const workflow = async (action, label, status = 200) => {
    const preview = action === "REOPEN" ? await request(`/workflow/reopen-scope?${scope}`, label) : null;
    return request("/workflow", label, "POST", {
      depart_code: department, period_id: period.period_id, action, comments: `Synthetic ${action} note`,
      ...(preview ? { confirmation_token: preview.confirmation_token } : {}),
    }, status);
  };
  async function assess(code) {
    const { risk } = await detail(code);
    return request(`/records/${code}`, "champion", "PUT", {
      depart_code: department, period_id: period.period_id, objective_code: objective, risk_category: category,
      risk_title: risk.risk_title, risk_description: risk.risk_description, risk_consequence: risk.risk_consequence,
      i_rate: 4, l_rate: 5, control_effectiveness: .25, current_contr: risk.current_contr,
      expected_updated_at: risk.updated_at, comments: "Explicit synthetic reassessment",
    });
  }
  const preserved = risk => ({
    i_rate: risk.i_rate, l_rate: risk.l_rate, i_risk_exposure: risk.i_risk_exposure,
    r_risk_exposure: risk.r_risk_exposure, ranking_snapshot: risk.ranking_snapshot,
  });
  async function checkReset(action, actor) {
    const before = await Promise.all(codes.map(detail));
    assert.equal((await workflow(action, actor)).workflow_status, "OPEN");
    const after = await Promise.all(codes.map(detail));
    for (let i = 0; i < codes.length; i++) {
      assert.deepEqual(preserved(after[i].risk), preserved(before[i].risk), "Reset must not recalculate saved scores or rankings");
      assert.deepEqual(after[i].root_causes, before[i].root_causes, "Reset must leave root statuses and notes untouched");
      assert.equal(after[i].risk.assessment_updated, i === 2, "Only active assessments are reset");
      for (const event of before[i].history) {
        assert.deepEqual(after[i].history.find(h => h.history_id === event.history_id), event, "History stays immutable");
      }
    }
    assert.equal(after[1].risk.risk_status, "Closed");
    assert.equal(after[1].risk.can_edit, true);
    assert.deepEqual((await request(pending)).map(r => r.risk_code).sort(), codes.slice(0, 2).sort());
    await request(pending, "owner", "GET", undefined, 403);
    await request(pending, "unrelated", "GET", undefined, 403);
    let read = await readiness();
    assert.equal(read.total_active_risks, 2); assert.equal(read.assessed_risks, 0);
    assert.equal(read.risks_missing_root_causes, 0);
    await workflow("SUBMIT", "champion", 409);
    await assess(codes[0]);
    read = await readiness(); assert.equal(read.assessed_risks, 1);
    assert.deepEqual((await request(pending)).map(r => r.risk_code), [codes[1]]);
    assert.deepEqual((await request(saved)).filter(r => r.assessment_updated).map(r => r.risk_code), [codes[0]]);
    await workflow("SUBMIT", "champion", 409);
    await workflow("PROCESS", "admin", 409);
    await assess(codes[1]);
    assert.equal((await readiness()).assessed_risks, 2);
    assert.equal((await request(pending)).length, 0);
    const summaryRows = (await request(saved)).filter(r => r.assessment_updated);
    assert.equal(summaryRows.length, 2);
    assert.equal(summaryRows.find(r => r.risk_code === codes[1]).risk_status, "Closed");
    assert(summaryRows.every(r => r.can_edit));
    const afterSave = await detail(codes[1]);
    assert.deepEqual(afterSave.root_causes, before[1].root_causes);
    assert.deepEqual(afterSave.risk.ranking_snapshot, snapshot, "No implicit historical rank refresh on an unchanged save");
    assert.equal((await workflow("SUBMIT", "champion")).workflow_status, "SUBMITTED");
    assert.equal((await request(pending)).length, 0);
    assert.equal((await request(saved)).length, 0);
    assert.equal((await request(`/records?access=review&view=submitted&${scope}`, "owner")).length, 2);
  }
  await workflow("SUBMIT", "champion");
  await checkReset("RETURN", "owner");
  await workflow("REVIEW", "owner");
  await checkReset("RETURN", "owner"); // Reviewed registers may also be returned.
  await workflow("REVIEW", "owner");
  await workflow("SIGN_OFF", "admin");
  await workflow("CLOSE", "admin");
  assert.equal((await detail(codes[1])).risk.can_edit, false);
  assert.equal((await request(pending)).length, 0);
  await checkReset("REOPEN", "admin");
  await workflow("REVIEW", "owner");
  await workflow("SIGN_OFF", "admin");
  const untouched = [`${prefix}D2`, `${prefix}D3`];
  for (const d of untouched) {
    await client.query("INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,$1)", [d]);
    await client.query(`INSERT INTO risk.risk_master
      (risk_code,depart_code,period_from,period_to,objective_code,risk_category,risk_title,risk_description,
       risk_consequence,entered_by,is_active,assessment_updated,i_rate,l_rate,perceived_rate,
       perceived_contr_eff,i_risk_exposure,i_risk_rate,r_risk_exposure,r_risk_rate,ranking_snapshot,current_contr)
      SELECT $1,$2,period_from,period_to,objective_code,risk_category,risk_title,risk_description,
       risk_consequence,entered_by,is_active,assessment_updated,i_rate,l_rate,perceived_rate,
       perceived_contr_eff,i_risk_exposure,i_risk_rate,r_risk_exposure,r_risk_rate,ranking_snapshot,current_contr
      FROM risk.risk_master WHERE risk_code=$3`, [`${d}R`, d, codes[1]]);
    await client.query(`INSERT INTO risk.root_causes(risk_code,root_cause,mitigations,action_status)
      VALUES($1,'Retained cause','Retained mitigation','Closed')`, [`${d}R`]);
    await client.query(`INSERT INTO risk.department_summary
      (depart_code,period_from,period_to,submitted,reviewed,sign_off,signed_off_by)
      VALUES($1,$2,$3,TRUE,TRUE,TRUE,$4)`,
    [d,period.period_from,period.period_to,`${prefix}admin`]);
  }
  await request(`/periods/${period.period_id}/close`, "admin", "POST", { comments: "Synthetic period closure" });
  async function retainedDepartments() {
    const result = {};
    for (const [name, sql] of Object.entries({
      summaries: "SELECT * FROM risk.department_summary WHERE depart_code=ANY($1) ORDER BY depart_code",
      risks: "SELECT * FROM risk.risk_master WHERE depart_code=ANY($1) ORDER BY risk_code",
      roots: "SELECT c.* FROM risk.root_causes c JOIN risk.risk_master r USING(risk_code) WHERE r.depart_code=ANY($1) ORDER BY c.root_id",
      history: "SELECT * FROM risk.register_history WHERE depart_code=ANY($1) ORDER BY history_id",
    })) result[name] = (await client.query(sql,[untouched])).rows;
    return result;
  }
  const retained = await retainedDepartments();
  await request(`/workflow/reopen-scope?${scope}`, "champion", "GET", undefined, 403);
  const preview = await request(`/workflow/reopen-scope?${scope}`, "admin");
  assert.equal(preview.period_status,"CLOSED");
  assert.equal(preview.departments.length,3);
  assert.deepEqual(preview.departments.filter(d=>d.affected).map(d=>d.depart_code),[department]);
  const reopenInput = {depart_code:department,period_id:period.period_id,action:"REOPEN",comments:"Scope confirmation"};
  await request("/workflow","admin","POST",reopenInput,409);
  await client.query("UPDATE risk.department_summary SET updated_at=updated_at+interval '1 second' WHERE depart_code=$1",[department]);
  await request("/workflow","admin","POST",{...reopenInput,confirmation_token:preview.confirmation_token},409);
  assert.equal((await client.query("SELECT status FROM risk.periods WHERE period_id=$1",[period.period_id])).rows[0].status,"CLOSED");
  await checkReset("REOPEN", "admin");
  assert.equal((await client.query("SELECT status FROM risk.periods WHERE period_id=$1",[period.period_id])).rows[0].status,"OPEN");
  assert.deepEqual(await retainedDepartments(),retained,"Untouched departments keep assessments, roots, closure details and history");
  await request(`/periods/${period.period_id}/close`,"admin","POST",{comments:"Premature close"},409);
  await workflow("REVIEW","owner"); await workflow("SIGN_OFF","admin");
  await request(`/periods/${period.period_id}/close`,"admin","POST",{comments:"Close after reassessment"});
  assert.equal((await client.query("SELECT status FROM risk.periods WHERE period_id=$1",[period.period_id])).rows[0].status,"CLOSED");
  assert.deepEqual(await retainedDepartments(),retained,"Reclosing the period must not rewrite previously closed departments");
  const { rows: notifications } = await client.query(
    "SELECT email_status FROM risk.review_notifications WHERE depart_code=$1", [department]);
  assert(notifications.length > 0);
  assert(notifications.every(n => n.email_status === "NO_RECIPIENT"), "No real email destination");
  console.log("PASS: mixed open/closed roots, return/reopen reassessment, three-department period scope, stale/missing confirmation rejected, untouched assessments/closure/history retained through reclosure, access isolation; all fixtures rolled back and no emails sent.");
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await client.query("ROLLBACK");
  client.release(); await pool.end();
  delete globalThis.reassessmentQuery; delete globalThis.reassessmentTransaction;
  await rm(dir, { recursive: true, force: true });
}
