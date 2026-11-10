// Real development PostgreSQL + HTTP checks. All writes use isolated synthetic fixtures.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { readFile, writeFile, rm } from "node:fs/promises";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prefix = `RFTEST_${randomBytes(4).toString("hex").toUpperCase()}`;
let users = [], departments = [`${prefix}A`, `${prefix}B`], cookies = {};
let createdProfile, periodId, kept = false, cleaned = false;
const fixturePath = "/tmp/mis-risk-references-fixtures.json";
let codes = { "action-statuses": `${prefix}S`, categories: `${prefix}C`,
  "control-effectiveness": `${prefix} Factor`, objectives: `${prefix}O` };
const root = "/risk-administration/references";
async function api(path, role = "admin", method = "GET", data) {
  const r = await fetch(`http://localhost:80/api${path}`, {
    method, headers: { "Content-Type": "application/json", ...(role ? { Cookie: `mis_session=${cookies[role]}` } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { error: text }; }
  return { status: r.status, body, headers: r.headers };
}
async function ok(path, role = "admin", method = "GET", data, status = 200) {
  const r = await api(path, role, method, data);
  assert.equal(r.status, status, r.body.error);
  assert.equal(r.body.ok, true);
  return r.body.data;
}
async function cleanup() {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("DELETE FROM risk.register_history WHERE actor=ANY($1::varchar[])", [users]);
    await c.query("DELETE FROM risk.root_causes WHERE risk_code IN (SELECT risk_code FROM risk.risk_master WHERE depart_code=ANY($1::varchar[]))", [departments]);
    await c.query("DELETE FROM risk.risk_master WHERE depart_code=ANY($1::varchar[])", [departments]);
    await c.query("DELETE FROM risk.department_summary WHERE depart_code=ANY($1::varchar[])", [departments]);
    await c.query("DELETE FROM risk.objectives WHERE depart_code=ANY($1::varchar[])", [departments]);
    await c.query("DELETE FROM risk.categories WHERE category_code IN ($1,$2)", [codes.categories, `${codes.categories}_UI`]);
    await c.query("DELETE FROM risk.control_effectiveness WHERE eff_factor IN ($1,$2)", [codes["control-effectiveness"], `${codes["control-effectiveness"]}_UI`]);
    await c.query("DELETE FROM risk.action_statuses WHERE status_code IN ($1,$2)", [codes["action-statuses"], `${codes["action-statuses"]}_UI`]);
    await c.query("DELETE FROM risk.department_assignments WHERE depart_code=ANY($1::varchar[])", [departments]);
    await c.query("DELETE FROM risk.champions WHERE department=ANY($1::varchar[])", [departments]);
    await c.query("DELETE FROM risk.departments WHERE depart_code=ANY($1::varchar[])", [departments]);
    await c.query("DELETE FROM crm.employees WHERE username=ANY($1::varchar[])", [users]);
    if (createdProfile) await c.query("DELETE FROM crm.profiles WHERE profile_id=$1", [createdProfile]);
    await c.query("COMMIT");
  } catch (e) { await c.query("ROLLBACK"); throw e; }
  finally { c.release(); }
}
try {
  if (process.argv.includes("--cleanup")) {
    const f = JSON.parse(await readFile(fixturePath, "utf8"));
    assert.match(f.codes.categories, /^RFTEST_[A-F0-9]{8}C$/);
    ({ users, departments, cookies, codes, createdProfile } = f);
    await cleanup(); cleaned = true;
    await rm(fixturePath, { force: true });
    console.log("Synthetic risk reference fixtures removed.");
  } else {
  const { rows: [profile] } = await pool.query("SELECT profile_id FROM crm.profiles WHERE is_active AND LOWER(TRIM(profile_name))='risk management' LIMIT 1");
  let managerId = profile?.profile_id;
  if (!managerId) {
    const { rows: [p] } = await pool.query("INSERT INTO crm.profiles(profile_name,is_active) VALUES('Risk Management',TRUE) RETURNING profile_id");
    createdProfile = managerId = p.profile_id;
  }
  const hash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  for (const [role, profileId] of [["admin", 1], ["manager", managerId], ["champion", 9], ["owner", 9]]) {
    const username = `${prefix}_${role}`;
    const { rows: [e] } = await pool.query(`INSERT INTO crm.employees
      (emp_code,username,employee_name,profile_id,password_hash,department,activated,approved,last_password_reset)
      VALUES($1,$1,$2,$3,$4,'RISK',TRUE,TRUE,CURRENT_DATE) RETURNING employee_id,session_version`,
    [username, `Synthetic references ${role}`, profileId, hash]);
    users.push(username);
    const { rows: [p] } = await pool.query("SELECT session_version FROM crm.profiles WHERE profile_id=$1", [profileId]);
    const sid = randomUUID();
    await pool.query("INSERT INTO crm.auth_sessions(session_id,employee_id,employee_version,profile_id,profile_version) VALUES($1,$2,$3,$4,$5)",
      [sid, e.employee_id, e.session_version, profileId, p.session_version]);
    cookies[role] = jwt.sign({ sub: e.employee_id, username, name: `Synthetic ${role}`, profileId, sid },
      process.env.SESSION_SECRET, { expiresIn: "10m" });
  }
  for (const depart_code of departments) {
    await ok("/risk-administration/departments", "admin", "POST", { depart_code, depart_name: `Synthetic ${depart_code}` }, 201);
    await ok("/risk-register/assignments", "manager", "POST", {
      depart_code, champion_username: users[2], owner_username: users[3],
    });
  }
  // Department creation canonicalizes codes.
  for (let i = 0; i < departments.length; i++) departments[i] = departments[i].toUpperCase();
  const inputs = {
    "action-statuses": { code: codes["action-statuses"], label: `${prefix} status`, description: "Synthetic status" },
    categories: { code: codes.categories, label: "Synthetic category" },
    "control-effectiveness": { code: codes["control-effectiveness"], label: codes["control-effectiveness"], description: "Synthetic criteria", rating: 0.654321 },
    objectives: { code: codes.objectives, label: "Synthetic objective", depart_code: departments[0] },
  };
  for (const [catalog, input] of Object.entries(inputs)) {
    const path = `${root}/${catalog}`, item = `${path}/${encodeURIComponent(input.code)}`;
    assert.equal((await api(path, null)).status, 401);
    for (const role of ["champion", "owner"]) {
      assert.equal((await api(path, role)).status, 403);
      assert.equal((await api(path, role, "POST", input)).status, 403);
      assert.equal((await api(item, role, "PATCH", { label: input.label, is_active: false })).status, 403);
    }
    await ok(path, "manager", "POST", input, 201);
    assert.equal((await api(path, "admin", "POST", input)).status, 409);
    assert.equal((await api(path, "admin", "POST", { ...input, code: input.code.toUpperCase(),
      ...(catalog === "control-effectiveness" ? { label: input.code.toUpperCase() } : {}) })).status, 409);
    const { code, ...update } = input;
    assert.equal((await api(item, "admin", "PATCH", { ...update, code: "NEW", is_active: true })).status, 400);
    if (catalog === "action-statuses" || catalog === "control-effectiveness")
      assert.equal((await api(item, "admin", "PATCH", { ...update, label: "New name", is_active: true })).status, 400);
    const changed = { ...update, is_active: true };
    if (catalog === "categories" || catalog === "objectives") changed.label += " renamed";
    if (catalog === "action-statuses") changed.description = null;
    if (catalog === "control-effectiveness") { changed.description = "Updated synthetic criteria"; changed.rating = 0.4; }
    const row = await ok(item, "admin", "PATCH", changed);
    assert.equal(row.code, input.code);
    assert.equal(row.label, changed.label);
    const retired = await ok(item, "manager", "PATCH", { ...changed, is_active: false });
    assert.equal(retired.is_active, false);
    assert.equal((await api(item, "admin", "PATCH", { ...changed, expected: row })).status, 409,
      "A stale edit must not reactivate a reference retired by another administrator.");
    const listed = await api(path, "manager");
    assert.match(listed.headers.get("cache-control"), /no-store/);
    assert(listed.body.data.some(r => r.code === input.code && !r.is_active));
    const options = await ok("/risk-register/options");
    const found = {
      "action-statuses": options.action_statuses.some(r => r.code === input.code),
      categories: options.categories.some(r => r.category_code === input.code),
      "control-effectiveness": options.control_effectiveness.some(r => r.eff_factor === input.code),
      objectives: options.objectives.some(r => r.obj_code === input.code && r.depart_code === input.depart_code),
    };
    assert.equal(found[catalog], false);
    // No delete operation can remove historical choices.
    assert.equal((await api(item, "admin", "DELETE")).status, 404);
    await ok(item, "admin", "PATCH", changed);
  }
  assert.equal((await api(`${root}/unknown`)).status, 400);
  for (const rating of [-0.1, 1.1, 0.1234567, "0.5"]) {
    assert.equal((await api(`${root}/control-effectiveness/${encodeURIComponent(codes["control-effectiveness"])}`, "admin", "PATCH",
      { label: codes["control-effectiveness"], description: "Criteria", rating, is_active: true })).status, 400);
  }
  assert.equal((await api(`${root}/objectives`, "admin", "POST", { code: "INVALID", label: "No department", depart_code: "MISSING" })).status, 400);
  // Reused objective codes in different departments remain separate identities.
  await ok(`${root}/objectives`, "admin", "POST", { ...inputs.objectives, depart_code: departments[1] }, 201);
  await ok(`${root}/objectives/${codes.objectives}`, "manager", "PATCH",
    { label: "Second department objective", depart_code: departments[1], is_active: false });
  const objectives = await ok(`${root}/objectives`);
  assert.equal(objectives.find(r => r.code === codes.objectives && r.depart_code === departments[0]).is_active, true);
  assert.equal(objectives.find(r => r.code === codes.objectives && r.depart_code === departments[1]).is_active, false);
  assert.equal((await api(`${root}/objectives/${codes.objectives}`, "admin", "PATCH", { label: "Missing department", is_active: true })).status, 400);
  // Historical actions retain their own retired status, but new actions/transitions cannot select it.
  const options = await ok("/risk-register/options");
  periodId = options.periods.find(p => p.status === "OPEN")?.period_id;
  assert(periodId, "An open development reporting period is required.");
  const record = await ok("/risk-register/records", "admin", "POST", {
    depart_code: departments[0], period_id: periodId, objective_code: codes.objectives,
    risk_title: "Synthetic reference retirement", risk_description: "Synthetic risk",
    risk_category: codes.categories, risk_consequence: "Synthetic consequence",
  }, 201);
  const detail = () => ok(`/risk-register/records/${record.risk_code}`);
  const base = { root_cause: "Synthetic cause", current_contr: "Original control", mitigations: "Original mitigation",
    due_date: "2099-12-31", action_owner: users[3], action_status: inputs["action-statuses"].label };
  async function saveCause(extra = {}) {
    const fresh = await detail();
    return api(`/risk-register/records/${record.risk_code}/root-causes`, "admin", "POST",
      { ...base, ...extra, expected_updated_at: fresh.risk.updated_at });
  }
  const initial = await saveCause();
  assert.equal(initial.status, 200, initial.body.error);
  await ok(`${root}/action-statuses/${codes["action-statuses"]}`, "manager", "PATCH",
    { label: base.action_status, description: null, is_active: false });
  const preserved = await saveCause({ root_id: initial.body.data.root_id, mitigations: "Updated mitigation" });
  assert.equal(preserved.status, 200, preserved.body.error);
  assert.equal(preserved.body.data.action_status, base.action_status);
  assert.equal((await saveCause()).status, 400);
  const activeStatus = options.action_statuses.find(r => r.code !== codes["action-statuses"]);
  assert(activeStatus, "An active baseline status is required.");
  const other = await saveCause({ action_status: activeStatus.status });
  assert.equal(other.status, 200, other.body.error);
  assert.equal((await saveCause({ root_id: other.body.data.root_id })).status, 400);
  // Retiring referenced categories/objectives leaves saved identifiers readable and records in place.
  await ok(`${root}/categories/${codes.categories}`, "admin", "PATCH", { label: "Synthetic category renamed", is_active: false });
  await ok(`${root}/objectives/${codes.objectives}`, "admin", "PATCH",
    { label: "Synthetic objective renamed", depart_code: departments[0], is_active: false });
  const historical = await detail();
  assert.equal(historical.risk.risk_category, codes.categories);
  assert.equal(historical.risk.objective_code, codes.objectives);
  // Assessment edits can keep their own retired choices, but must never choose retired choices on another risk.
  await pool.query("UPDATE risk.risk_master SET risk_impact='IMP_01',risk_likelihood='LIK_01' WHERE risk_code=$1", [record.risk_code]);
  const assessment = {
    depart_code: departments[0], period_id: periodId, objective_code: codes.objectives,
    risk_title: record.risk_title, risk_description: record.risk_description,
    risk_category: codes.categories, risk_consequence: record.risk_consequence,
    i_rate: 17.31, l_rate: 0.33, control_effectiveness: 0.321654,
    current_contr: "Historical controls retained", desired_contr_effe: "Keep historical factor classifications",
    comments: "Synthetic assessment after reference retirement",
  };
  const fresh = await detail();
  const savedAssessment = await ok(`/risk-register/records/${record.risk_code}`, "admin", "PUT",
    { ...assessment, expected_updated_at: fresh.risk.updated_at });
  assert.equal(savedAssessment.risk_category, codes.categories);
  assert.equal(savedAssessment.objective_code, codes.objectives);
  assert.equal(savedAssessment.risk_impact, "IMP_01", "Unmatched numeric impact must not erase historical classification");
  assert.equal(savedAssessment.risk_likelihood, "LIK_01", "Unmatched numeric likelihood must not erase historical classification");
  assert.equal((await api("/risk-register/records", "admin", "POST", {
    depart_code: departments[0], period_id: periodId, objective_code: codes.objectives,
    risk_title: "Reject new retired choices", risk_description: "Synthetic",
    risk_category: codes.categories, risk_consequence: "Synthetic",
  })).status, 400);
  const currentOptions = await ok("/risk-register/options");
  const activeCategory = currentOptions.categories.find(c => c.category_code !== codes.categories);
  assert(activeCategory);
  // Reuse an active objective in the fixture department to make another risk with active choices.
  await ok(`${root}/objectives/${codes.objectives}`, "admin", "PATCH",
    { label: "Second department objective", depart_code: departments[1], is_active: true });
  const otherRisk = await ok("/risk-register/records", "admin", "POST", {
    depart_code: departments[1], period_id: periodId, objective_code: codes.objectives,
    risk_title: "Synthetic risk with active choices", risk_description: "Synthetic",
    risk_category: activeCategory.category_code, risk_consequence: "Synthetic",
  }, 201);
  assert.equal((await api(`/risk-register/records/${otherRisk.risk_code}`, "admin", "PUT", {
    ...assessment, depart_code: departments[1], expected_updated_at: otherRisk.updated_at,
  })).status, 400, "Another risk cannot newly choose a retired category");
  const otherFresh = await ok(`/risk-register/records/${otherRisk.risk_code}`);
  const retiredObjective = `${codes.objectives}_T`;
  await ok(`${root}/objectives`, "admin", "POST",
    { code: retiredObjective, label: "Synthetic retired alternative", depart_code: departments[1] }, 201);
  await ok(`${root}/objectives/${retiredObjective}`, "admin", "PATCH",
    { label: "Synthetic retired alternative", depart_code: departments[1], is_active: false });
  assert.equal((await api(`/risk-register/records/${otherRisk.risk_code}`, "admin", "PUT", {
    ...assessment, depart_code: departments[1], risk_category: activeCategory.category_code,
    objective_code: retiredObjective, expected_updated_at: otherFresh.risk.updated_at,
  })).status, 400, "Another risk cannot newly select a retired objective");
  const { rows: audits } = await pool.query("SELECT action,actor,snapshot FROM risk.register_history WHERE actor=ANY($1::varchar[]) AND action LIKE 'REFERENCE_%'", [users]);
  for (const catalog of Object.keys(inputs)) {
    const matching = audits.filter(r => r.snapshot.catalog === catalog);
    for (const action of ["REFERENCE_CREATE", "REFERENCE_UPDATE", "REFERENCE_RETIRE", "REFERENCE_REACTIVATE"])
      assert(matching.some(r => r.action === action), `${catalog}: ${action} is audited`);
    assert(matching.some(r => r.snapshot.before && r.snapshot.after));
  }
  console.log("Risk reference API checks passed: all four catalogs, manager/admin access, denied department-only actors, immutable identifiers, composite objectives, duplicates, rating validation, retirement/reactivation, options freshness, historical actions and audit snapshots.");
  if (process.argv.includes("--keep")) {
    await writeFile(fixturePath, JSON.stringify({ users, departments, cookies, codes, createdProfile }), { mode: 0o600 });
    kept = true;
    console.log("Private browser fixture available at /tmp/mis-risk-references-fixtures.json.");
  }
  }
} finally {
  try { if (!kept && !cleaned) await cleanup(); } finally { await pool.end(); }
}
