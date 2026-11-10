// Uses the synthetic fixtures from risk-administration.integration.mjs --keep.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";
if (process.env.NODE_ENV === "production") throw new Error("Development only.");
const path = "/tmp/mis-risk-admin-fixtures.json";
const f = JSON.parse(await readFile(path, "utf8"));
assert.match(f.prefix, /^RATEST_[A-F0-9]{8}$/);
const department = `${f.prefix}A`;
const objective = `TEST-${f.prefix.slice(7)}`;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function api(url, method = "GET", data) {
  const r = await fetch(`http://localhost:80/api${url}`, {
    method, headers: { Cookie: `mis_session=${f.cookies.admin}`, "Content-Type": "application/json" },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  return { status: r.status, body: await r.json() };
}
async function cleanup() {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const own = await c.query("SELECT risk_code FROM risk.risk_master WHERE risk_code=$1 AND depart_code=$2",
      [f.catalogRiskCode ?? "", department]);
    if (own.rows.length) {
      await c.query("DELETE FROM risk.register_history WHERE risk_code=$1", [f.catalogRiskCode]);
      await c.query("DELETE FROM risk.root_causes WHERE risk_code=$1", [f.catalogRiskCode]);
      await c.query("DELETE FROM risk.risk_master WHERE risk_code=$1", [f.catalogRiskCode]);
    }
    await c.query("DELETE FROM risk.objectives WHERE depart_code=$1 AND obj_code=$2", [department, objective]);
    await c.query("DELETE FROM risk.department_summary WHERE depart_code=$1", [department]);
    await c.query("COMMIT");
  } catch (e) { await c.query("ROLLBACK"); throw e; }
  finally { c.release(); }
}
try {
  if (process.argv.includes("--cleanup")) {
    await cleanup();
    console.log("Synthetic risk catalog records removed.");
  } else {
    const options = await api("/risk-register/options");
    assert.equal(options.status, 200);
    const statuses = options.body.data.action_statuses;
    assert.deepEqual(statuses.map(s => [s.code,s.status]), [
      ["AC_01","Behind schedule"],["AC_02","Planned"],["AC_03","In progress"],["AC_06","Closed"],
    ]);
    assert.equal(statuses[3].description, null);
    assert.deepEqual(options.body.data.control_effectiveness.map(s => [s.eff_factor,s.rating]), [
      ["Very Good",0.9],["Good",0.8],["Satisfactory",0.65],["Weak",0.4],["Ineffective",0.2],
    ]);
    assert.equal(options.body.data.categories.filter(s => /^CAT_\d\d$/.test(s.category_code)).length, 10);
    const period = options.body.data.periods.find(p => p.status === "OPEN");
    await pool.query("INSERT INTO risk.objectives(obj_code,obj_name,depart_code) VALUES($1,$2,$3)",
      [objective,"Synthetic catalog objective",department]);
    const created = await api("/risk-register/records","POST",{
      depart_code:department,period_id:period.period_id,objective_code:objective,
      risk_title:"Synthetic risk catalog validation",risk_description:"Synthetic description",
      risk_category:"CAT_01",risk_consequence:"Synthetic consequence",
    });
    assert.equal(created.status,201,created.body.error);
    f.catalogRiskCode = created.body.data.risk_code;
    await writeFile(path,JSON.stringify(f),{mode:0o600});
    const detail = () => api(`/risk-register/records/${f.catalogRiskCode}`);
    let rootId;
    const owner = f.accounts.owner.username;
    const base = {root_cause:"Synthetic root cause",current_contr:"Preserve this synthetic control note",
      mitigations:"Preserve this synthetic mitigation note",due_date:"2026-12-31",action_owner:owner};
    for (const action_status of ["Planned","In progress","Behind schedule","Closed"]) {
      const fresh = await detail();
      const saved = await api(`/risk-register/records/${f.catalogRiskCode}/root-causes`,"POST",{
        ...base,...(rootId ? {root_id:rootId} : {}),action_status,expected_updated_at:fresh.body.data.risk.updated_at,
      });
      assert.equal(saved.status,200,saved.body.error);
      rootId = saved.body.data.root_id;
      assert.equal(saved.body.data.action_status,action_status);
      assert.equal(saved.body.data.current_contr,base.current_contr);
      assert.equal(saved.body.data.mitigations,base.mitigations);
    }
    for (const action_status of ["Open","Unapproved status"]) {
      const fresh = await detail();
      const rejected = await api(`/risk-register/records/${f.catalogRiskCode}/root-causes`,"POST",{
        ...base,action_status,expected_updated_at:fresh.body.data.risk.updated_at,
      });
      assert.equal(rejected.status,400);
    }
    const inserted = await pool.query(`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,due_date,action_owner,action_status)
      VALUES($1,$2,$3,$4,$5,$6,'Open') RETURNING root_id`,
      [f.catalogRiskCode,"Legacy synthetic root",base.current_contr,base.mitigations,base.due_date,owner]);
    const fresh = await detail();
    const legacy = await api(`/risk-register/records/${f.catalogRiskCode}/root-causes`,"POST",{
      ...base,root_cause:"Legacy synthetic root",root_id:inserted.rows[0].root_id,action_status:"Open",
      expected_updated_at:fresh.body.data.risk.updated_at,
    });
    assert.equal(legacy.status,200,legacy.body.error);
    console.log("Risk catalogs passed: 4 active statuses; all 10 supplied categories; 5 fractional ratings; approved saves and note retention; unknown/new legacy status rejection; existing legacy status retention.");
  }
} finally { await pool.end(); }
