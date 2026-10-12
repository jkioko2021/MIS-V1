// Development-only fixtures. --keep supports one authenticated browser pass;
// --cleanup removes only this script's synthetic metadata/accounts.
import assert from "node:assert/strict";
import { readFile, writeFile, rm } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const fixturePath = "/tmp/mis-client-rating-fixtures.json";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let f;
async function save() { await writeFile(fixturePath, JSON.stringify(f), { mode: 0o600 }); }
async function cleanup() {
  if (!f) return;
  assert.match(f.prefix, /^CRTEST_[a-f0-9]{8}$/);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM crm.business_uploads WHERE file_no=ANY($1::varchar[])", [f.files]);
    await client.query("DELETE FROM crm.business_tracking WHERE file_no=ANY($1::varchar[])", [f.files]);
    await client.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])", [f.users]);
    await client.query("DELETE FROM crm.employees WHERE username=ANY($1::varchar[])", [f.users]);
    if (f.createdProfile) await client.query("DELETE FROM crm.profiles WHERE profile_id=$1", [f.createdProfile]);
    await client.query("COMMIT");
    await rm(fixturePath, { force: true });
  } catch (err) { await client.query("ROLLBACK"); throw err; }
  finally { client.release(); }
}
async function api(path = "", role = "admin") {
  const response = await fetch(`http://localhost:80/api/client-ratings${path}`, {
    headers: role ? { Cookie: `mis_session=${f.cookies[role]}` } : {},
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, text,
    body: response.headers.get("content-type")?.includes("application/json") ? JSON.parse(text) : null };
}
try {
  if (process.argv.includes("--cleanup")) {
    f = JSON.parse(await readFile(fixturePath, "utf8"));
    await cleanup();
    console.log("Client Rating synthetic fixtures removed.");
  } else {
    f = { prefix: `CRTEST_${randomBytes(4).toString("hex")}`, users: [], files: [], accounts: {}, cookies: {} };
    await save();
    const { rows: [existing] } = await pool.query(`SELECT profile_id FROM crm.profiles
      WHERE is_active AND LOWER(TRIM(profile_name)) IN ('risk manager','risk management','risk administrator') LIMIT 1`);
    let managerProfile = existing?.profile_id;
    if (!managerProfile) {
      const { rows: [profile] } = await pool.query(`INSERT INTO crm.profiles(profile_name,is_active)
        VALUES('Risk Management',TRUE) RETURNING profile_id`);
      managerProfile = profile.profile_id;
      f.createdProfile = managerProfile;
      await save();
    }
    const password = `ClientT!${randomBytes(18).toString("hex")}`;
    const hash = await bcrypt.hash(password, 10);
    for (const [role, profileId] of [["admin", 1], ["champion", 9], ["manager", managerProfile]]) {
      const username = `${f.prefix}_${role}`;
      f.users.push(username);
      await save();
      const { rows: [employee] } = await pool.query(`INSERT INTO crm.employees
        (emp_code,username,password_hash,employee_name,profile_id,department,activated,approved,last_password_reset)
        VALUES($1,$1,$2,$3,$4,'RISK',TRUE,TRUE,CURRENT_DATE) RETURNING employee_id,session_version`,
      [username, hash, `Synthetic Client Rating ${role}`, profileId]);
      const { rows: [profile] } = await pool.query("SELECT session_version FROM crm.profiles WHERE profile_id=$1", [profileId]);
      const sid = randomUUID();
      await pool.query(`INSERT INTO crm.auth_sessions(session_id,employee_id,employee_version,profile_id,profile_version)
        VALUES($1,$2,$3,$4,$5)`, [sid, employee.employee_id, employee.session_version, profileId, profile.session_version]);
      f.cookies[role] = jwt.sign({ sub: employee.employee_id, username, name: `Synthetic Client Rating ${role}`,
        profileId, sid }, process.env.SESSION_SECRET ?? "dev-secret-change-me", { expiresIn: "2h" });
      f.accounts[role] = { username, password };
      await save();
    }
    const { rows: [reason] } = await pool.query("SELECT reason_name FROM crm.aml_risk_reasons WHERE is_active ORDER BY reason_id LIMIT 1");
    assert(reason);
    f.reason = reason.reason_name;
    for (let i = 0; i < 3; i++) {
      const file = `${f.prefix}_FILE_${i}`;
      f.files.push(file);
      await save();
      await pool.query(`INSERT INTO crm.business_tracking
        (file_no,proposer_name,business_type,client_type,business,rate_type,benefit_verified,entered_by)
        VALUES($1,$2,'N','R','M','S','YES',$3)`,
      [file, `@${f.prefix} Synthetic Client ${i}`, f.accounts.champion.username]);
    }
    for (let i = 0; i < 23; i++) {
      await pool.query(`INSERT INTO crm.business_uploads
        (file_no,filename,storage_key,uploaded_by,policy_code,risk_rate,risk_reason,uploaded_at,is_active)
        VALUES($1,'Synthetic AML classification.pdf',$2,$3,$4,$5,$6,CURRENT_TIMESTAMP,$7)`,
      [f.files[i % 3], `/objects/uploads/${randomUUID()}`, f.accounts.champion.username,
        `${f.prefix}_POLICY_${i}`, ["Low", "Medium", "High"][i % 3], f.reason, i !== 22]);
    }
    const search = `?search=${f.prefix}`;
    for (const suffix of ["", "/options", "/report"]) {
      assert.equal((await api(suffix, null)).status, 401);
      const denied = await api(suffix, "champion");
      assert.equal(denied.status, 403);
      assert(!denied.text.includes(f.files[0]));
      assert.match(denied.headers.get("cache-control"), /no-store/);
    }
    const page = await api(`${search}&page_size=20`);
    assert.equal(page.status, 200, page.body?.error);
    assert.equal(page.body.data.records.length, 20);
    assert.equal(page.body.data.total, 23);
    assert.match(page.headers.get("cache-control"), /private.*no-store/);
    assert.match(page.headers.get("vary"), /Cookie/i);
    assert(page.body.data.records.every(r => r.system === null));
    const next = await api(`${search}&page_size=20&page=2`);
    assert.equal(next.body.data.records.length, 3);
    const expectedPolicy = `${f.prefix}_POLICY_2`;
    const exact = await api(`?search_by=policy&search=${expectedPolicy.toLowerCase()}`);
    assert.equal(exact.body.data.total, 1);
    assert.equal(exact.body.data.records[0].risk_rating, "High");
    assert.equal((await api(`?search_by=policy&search=${f.prefix}_POLICY`)).body.data.total, 0);
    assert.equal((await api(`${search}&rating=High`)).body.data.total, 7);
    assert.equal((await api(`${search}&reason=${encodeURIComponent(f.reason)}`)).body.data.total, 23);
    assert.equal((await api("?search=never-present-client-rating")).body.data.total, 0);
    assert.equal((await api("?page_size=101")).status, 400);
    assert.equal((await api("?search_by=unrecognized")).status, 400);
    assert.equal((await api(search, "manager")).status, 200);
    const options = await api("/options");
    assert(options.body.data.reasons.includes(f.reason));
    assert.equal(options.body.data.system_captured, false);
    const report = await api(`/report${search}`);
    assert.equal(report.status, 200);
    assert.match(report.headers.get("content-type"), /text\/csv/);
    assert.match(report.headers.get("content-disposition"), /attachment/);
    assert.equal(report.text.trim().split("\r\n").length, 24);
    assert(report.text.includes(`"'@${f.prefix}`)); // Excel formula neutralization.
    const filtered = await api(`/report${search}&rating=High`);
    assert.equal(filtered.text.trim().split("\r\n").length, 8);
    await pool.query("UPDATE crm.employees SET activated=FALSE WHERE username=$1", [f.accounts.admin.username]);
    assert([401, 403].includes((await api(search)).status));
    await pool.query("UPDATE crm.employees SET activated=TRUE WHERE username=$1", [f.accounts.admin.username]);
    f.expectedPolicy = expectedPolicy;
    await save();
    console.log("Client Rating checks passed: admin/manager authorization; staff, anonymous and inactive denial; filters; exact policy search; pagination; inactive-upload history retained; CSV parity and formula protection.");
  }
} finally {
  if (f && !process.argv.includes("--keep") && !process.argv.includes("--cleanup")) await cleanup();
  await pool.end();
}
