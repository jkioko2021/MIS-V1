// Development-only synthetic accounts and departments; --keep supports browser checks.
import assert from "node:assert/strict";
import { readFile, writeFile, rm } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const fixturePath = "/tmp/mis-risk-admin-fixtures.json";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let f;
async function save() { await writeFile(fixturePath, JSON.stringify(f), { mode: 0o600 }); }
async function api(path, role = "admin", method = "GET", body) {
  const r = await fetch(`http://localhost:80/api${path}`, {
    method, headers: { "Content-Type": "application/json", ...(role ? { Cookie: `mis_session=${f.cookies[role]}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
async function ok(path, role, method, body, status = 200) {
  const r = await api(path, role, method, body);
  assert.equal(r.status, status, r.body.error);
  assert.equal(r.body.ok, true);
  return r.body.data;
}
async function cleanup() {
  if (!f) return;
  assert.match(f.prefix, /^RATEST_[a-f0-9]{8}$/i);
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const { rows } = await c.query("SELECT depart_code FROM risk.departments WHERE UPPER(LEFT(depart_code,LENGTH($1)))=UPPER($1)", [f.prefix]);
    const codes = rows.map(r => r.depart_code);
    await c.query("DELETE FROM risk.register_history WHERE depart_code=ANY($1::varchar[])", [codes]);
    await c.query("DELETE FROM risk.department_assignments WHERE depart_code=ANY($1::varchar[])", [codes]);
    await c.query("DELETE FROM risk.champions WHERE department=ANY($1::varchar[])", [codes]);
    await c.query("DELETE FROM risk.departments WHERE depart_code=ANY($1::varchar[])", [codes]);
    await c.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])", [f.users]);
    await c.query("DELETE FROM crm.employees WHERE username=ANY($1::varchar[])", [f.users]);
    if (f.createdProfile) await c.query("DELETE FROM crm.profiles WHERE profile_id=$1", [f.createdProfile]);
    await c.query("COMMIT");
    await rm(fixturePath, { force: true });
  } catch (err) { await c.query("ROLLBACK"); throw err; }
  finally { c.release(); }
}
try {
  if (process.argv.includes("--cleanup")) {
    f = JSON.parse(await readFile(fixturePath, "utf8"));
    await cleanup();
    console.log("Risk administration fixtures removed.");
  } else {
    f = { prefix: `RATEST_${randomBytes(4).toString("hex").toUpperCase()}`, users: [], accounts: {}, cookies: {} };
    await save();
    const { rows: [profile] } = await pool.query("SELECT profile_id FROM crm.profiles WHERE is_active AND LOWER(TRIM(profile_name)) IN ('risk management','risk manager','risk administrator') LIMIT 1");
    let managerId = profile?.profile_id;
    if (!managerId) {
      const { rows: [created] } = await pool.query("INSERT INTO crm.profiles(profile_name,is_active) VALUES('Risk Management',TRUE) RETURNING profile_id");
      managerId = created.profile_id; f.createdProfile = managerId; await save();
    }
    const password = `RiskAdminT!${randomBytes(18).toString("hex")}`;
    const hash = await bcrypt.hash(password, 10);
    for (const [role, profileId] of [["admin", 1], ["manager", managerId], ["champion", 9], ["owner", 9]]) {
      const username = `${f.prefix}_${role}`;
      f.users.push(username); await save();
      const { rows: [e] } = await pool.query(`INSERT INTO crm.employees
        (emp_code,username,password_hash,employee_name,profile_id,department,activated,approved,last_password_reset)
        VALUES($1,$1,$2,$3,$4,'RISK',TRUE,TRUE,CURRENT_DATE) RETURNING employee_id,session_version`,
      [username, hash, `Synthetic risk administration ${role}`, profileId]);
      const { rows: [p] } = await pool.query("SELECT session_version FROM crm.profiles WHERE profile_id=$1", [profileId]);
      const sid = randomUUID();
      await pool.query("INSERT INTO crm.auth_sessions(session_id,employee_id,employee_version,profile_id,profile_version) VALUES($1,$2,$3,$4,$5)",
        [sid, e.employee_id, e.session_version, profileId, p.session_version]);
      f.cookies[role] = jwt.sign({ sub: e.employee_id, username, name: `Synthetic ${role}`, profileId, sid }, process.env.SESSION_SECRET, { expiresIn: "2h" });
      f.accounts[role] = { username, password };
      await save();
    }
    const root = "/risk-administration/departments";
    f.departments = [`${f.prefix}A`, `${f.prefix}B`]; await save();
    assert.equal((await api(root, null)).status, 401);
    await ok(root, "admin", "POST", { depart_code: f.departments[0], depart_name: "Synthetic administration A" }, 201);
    await ok(root, "manager", "POST", { depart_code: f.departments[1], depart_name: "Synthetic administration B" }, 201);
    assert.equal((await api(root, "admin", "POST", { depart_code: f.departments[0].toLowerCase(), depart_name: "Duplicate" })).status, 409);
    assert.equal((await api(root, "manager", "POST", { depart_code: "X".repeat(21), depart_name: "Invalid" })).status, 400);
    assert.equal((await api(`${root}/${f.departments[0]}`, "manager", "PATCH", { depart_name: " " })).status, 400);
    assert.equal((await api(`${root}/${f.departments[0]}`, "admin", "PATCH", { depart_name: "Illegal code edit", depart_code: "NEW" })).status, 400);
    const edited = await ok(`${root}/${f.departments[0]}`, "manager", "PATCH", { depart_name: "Synthetic administration A renamed" });
    assert.equal(edited.depart_code, f.departments[0]); assert.equal(edited.is_active, true);
    for (const depart_code of f.departments) await ok("/risk-register/assignments", "manager", "POST", {
      depart_code, champion_username: f.accounts.champion.username, owner_username: f.accounts.owner.username,
    });
    const owners = await ok("/risk-register/options", "owner", "GET");
    assert.deepEqual(owners.actor.owner_departments.sort(), f.departments.slice().sort());
    for (const role of ["champion", "owner"]) {
      assert.equal((await api(root, role)).status, 403);
      assert.equal((await api(root, role, "POST", { depart_code: `${f.prefix}Z`, depart_name: "Unauthorized" })).status, 403);
      assert.equal((await api(`${root}/${f.departments[0]}`, role, "PATCH", { depart_name: "Unauthorized" })).status, 403);
      assert.equal((await api("/risk-register/assignments", role, "POST", { depart_code: f.departments[0],
        champion_username: f.accounts.owner.username, owner_username: f.accounts.champion.username })).status, 403);
    }
    const list = await api(root, "manager");
    assert.match(list.headers.get("cache-control"), /no-store/);
    assert(list.body.data.some(d => d.depart_code === f.departments[0] && d.depart_name.endsWith("renamed")));
    const { rows: audits } = await pool.query("SELECT action,snapshot FROM risk.register_history WHERE depart_code=$1 AND action LIKE 'DEPARTMENT_%'", [f.departments[0]]);
    assert.equal(audits.length, 2);
    assert(audits.some(row => row.action === "DEPARTMENT_UPDATE" && row.snapshot.before.depart_name === "Synthetic administration A"));
    console.log("Risk administration API checks passed: admin/management create-edit-map; validation, stable codes, duplicate protection, audit history, multi-department owners and denied champion/owner requests.");
    if (!process.argv.includes("--keep")) await cleanup();
    else console.log("Private browser fixture available at /tmp/mis-risk-admin-fixtures.json.");
  }
} catch (err) {
  if (!process.argv.includes("--keep")) await cleanup();
  throw err;
} finally { await pool.end(); }
