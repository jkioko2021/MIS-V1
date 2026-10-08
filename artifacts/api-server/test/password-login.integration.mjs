// Development-only isolated sign-in fixtures. Never print credentials or cookies.
import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production") throw new Error("Development fixtures only");
const fixturePath = "/tmp/mis-password-login-fixtures.json";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const base = "http://localhost:80/api/auth";
const cleanup = async f => {
  await pool.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])",
    [Object.values(f.users).map(u => u.username)]);
  for (const table of ["password_history", "otp_tokens"]) {
    await pool.query(`DELETE FROM crm.${table} WHERE employee_id=ANY($1::int[])`, [f.ids]);
  }
  await pool.query("DELETE FROM crm.employees WHERE employee_id=ANY($1::int[])", [f.ids]);
  await unlink(fixturePath).catch(() => {});
};

if (process.argv.includes("--cleanup")) {
  try { await cleanup(JSON.parse(await readFile(fixturePath, "utf8"))); }
  finally { await pool.end(); }
  console.log("Password-login fixtures removed.");
  process.exit(0);
}

const f = { prefix: `AUTH_${randomUUID().slice(0, 8)}`, ids: [], users: {} };
const save = () => writeFile(fixturePath, JSON.stringify(f), { mode: 0o600 });
const cookie = r => r.headers.get("set-cookie")?.split(";")[0];
const request = async (path, body, session) => {
  const r = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(session ? { Cookie: session } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, body: await r.json(), cookie: cookie(r), headers: r.headers };
};
const login = role => request("/login", f.users[role]);

try {
  const password = `Test-Aa9!${randomUUID()}`;
  const hash = await bcrypt.hash(password, 10);
  for (const role of ["valid", "expired", "locked", "inactive", "pending", "deleted", "locktest"]) {
    const username = `${f.prefix}_${role}`;
    const { rows: [e] } = await pool.query(`INSERT INTO crm.employees
      (username,password_hash,employee_name,department,profile_id,activated,approved,
       employee_locked,is_deleted,last_password_reset)
      VALUES($1,$2,$3,'SALES',3,$4,$5,$6,$7,$8) RETURNING employee_id`,
    [username, hash, `Login test ${role}`, role !== "inactive", role !== "pending",
      role === "locked", role === "deleted", role === "expired" ? null : new Date()]);
    f.ids.push(e.employee_id); f.users[role] = { username, password }; await save();
  }
  assert.equal((await request("/login", {})).status, 400);
  assert.equal((await request("/login", { username: [], password })).status, 400);
  const wrong = await request("/login", { username: f.users.valid.username, password: "incorrect" });
  assert.equal(wrong.status, 401); assert(!wrong.cookie);
  for (const role of ["locked", "inactive", "pending"]) {
    const r = await login(role); assert.equal(r.status, 403); assert(!r.cookie);
  }
  assert.equal((await login("deleted")).status, 401);
  const valid = await login("valid");
  assert.equal(valid.status, 200); assert(valid.cookie);
  assert.equal(valid.body.user.username, f.users.valid.username);
  assert.equal(valid.body.user.profileId, 3); assert(valid.body.user.profileName);
  assert.equal(valid.body.user.department, "SALES");
  assert.equal(valid.body.passwordExpired, false);
  for (const key of ["tempToken", "devOtp", "password_hash"]) assert(!(key in valid.body));
  assert.equal(valid.body.step, "authenticated");
  assert.match(valid.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(valid.headers.get("set-cookie"), /SameSite=Lax/i);
  assert.match(valid.headers.get("set-cookie"), /Path=\//i);
  assert.equal((await request("/me", undefined, valid.cookie)).body.passwordExpired, false);
  assert.equal((await request("/verify-otp", { tempToken: "old", otp: "123456" })).status, 401);
  const legacy = jwt.sign({ sub: f.ids[0], temp: true }, process.env.SESSION_SECRET ?? "dev-secret-change-me");
  assert.equal((await request("/me", undefined, `mis_session=${legacy}`)).status, 401);
  const expired = await login("expired");
  assert.equal(expired.body.passwordExpired, true); assert(expired.cookie);
  assert.equal((await request("/me", undefined, expired.cookie)).body.passwordExpired, true);
  const restricted = await fetch("http://localhost:80/api/business-status", { headers: { Cookie: expired.cookie } });
  assert.equal(restricted.status, 403);
  assert.equal((await restricted.json()).code, "PASSWORD_CHANGE_REQUIRED");
  assert.equal((await request("/change-password", { currentPassword: "incorrect", newPassword: password }, expired.cookie)).status, 401);
  assert.equal((await request("/change-password", { currentPassword: password, newPassword: "short" }, expired.cookie)).status, 400);
  const nextPassword = `New-Aa9!${randomUUID()}`;
  const changed = await request("/change-password", { currentPassword: password, newPassword: nextPassword }, expired.cookie);
  assert.equal(changed.status, 200); assert(changed.cookie);
  assert.equal((await request("/me", undefined, changed.cookie)).body.passwordExpired, false);
  assert.equal((await fetch("http://localhost:80/api/business-status", { headers: { Cookie: changed.cookie } })).status, 200);
  const { rows: [config] } = await pool.query("SELECT lockout_count FROM crm.password_config LIMIT 1");
  for (let i = 0; i < (config?.lockout_count ?? 3); i++) {
    await request("/login", { username: f.users.locktest.username, password: "incorrect" });
  }
  assert.equal((await login("locktest")).status, 403);
  const { rows: [otpCount] } = await pool.query("SELECT COUNT(*)::int AS total FROM crm.otp_tokens WHERE employee_id=ANY($1::int[])", [f.ids]);
  assert.equal(otpCount.total, 0);
  await request("/logout", {}, valid.cookie);
  // Restore only the synthetic expired account for the browser's password-change flow.
  await pool.query("UPDATE crm.employees SET password_hash=$1,last_password_reset=NULL WHERE employee_id=$2", [hash, f.ids[1]]);
  console.log("Password-only login passed: session/role claims, no OTP, account guards, lockout, expired-password restriction, password change and legacy challenge rejection.");
} finally {
  if (process.argv.includes("--keep")) await save();
  else await cleanup(f);
  await pool.end();
}
