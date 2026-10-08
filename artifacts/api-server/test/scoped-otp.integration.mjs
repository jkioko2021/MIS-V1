// Isolated development router and synthetic accounts: never change real admin credentials.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { build } from "esbuild";
import express from "express";
import cookieParser from "cookie-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production") throw new Error("Development test only");
process.env.NODE_ENV = "development";
const prefix = `OTP_${randomUUID().slice(0, 8)}`;
const fixturePath = "/tmp/mis-scoped-otp-fixtures.json";
const bundlePath = new URL("./.tmp-otp-router.mjs", import.meta.url);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const f = { ids: [], users: {}, authOrigin: "http://127.0.0.1:3011/api/auth", code: "" };
const save = () => writeFile(fixturePath, JSON.stringify(f), { mode: 0o600 });
const cleanup = async () => {
  await pool.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])",
    [Object.values(f.users).map(u => u.username)]);
  await pool.query("DELETE FROM crm.password_history WHERE employee_id=ANY($1::int[])", [f.ids]);
  await pool.query("DELETE FROM crm.employees WHERE employee_id=ANY($1::int[])", [f.ids]);
  await unlink(fixturePath).catch(() => {});
  await unlink(bundlePath).catch(() => {});
  await pool.end();
};
// Background task cancellation can terminate before async signal cleanup finishes.
if (process.argv.includes("--cleanup")) {
  Object.assign(f, JSON.parse(await readFile(fixturePath, "utf8")));
  await cleanup();
  console.log("Scoped OTP fixtures removed.");
  process.exit(0);
}
let server;
let failDelivery = false;
try {
  const password = `Fixture-Aa9!${randomUUID()}`;
  const hash = await bcrypt.hash(password, 10);
  for (const role of ["otp", "normal"]) {
    const username = `${prefix}_${role}`;
    const { rows: [e] } = await pool.query(`INSERT INTO crm.employees
      (username,password_hash,employee_name,department,profile_id,activated,approved,last_password_reset)
      VALUES($1,$2,$3,'SALES',3,TRUE,TRUE,$4) RETURNING employee_id`,
    [username, hash, `OTP test ${role}`, role === "otp" ? null : new Date()]);
    f.ids.push(e.employee_id); f.users[role] = { username, password }; await save();
  }
  // Only this isolated process changes the configured account; managed workflows remain admin-only.
  process.env.MIS_LOGIN_OTP_USERNAME = f.users.otp.username;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith("/emails") && init?.method === "POST") {
      const message = JSON.parse(init.body);
      assert.deepEqual(message.to, [process.env.MIS_LOGIN_OTP_EMAIL]);
      f.code = message.text.match(/code is (\d{6})/)[1]; await save();
      return new Response(JSON.stringify(failDelivery ? { message: "Synthetic delivery failure" } : { id: randomUUID() }),
        { status: failDelivery ? 503 : 200, headers: { "Content-Type": "application/json" } });
    }
    return realFetch(input, init);
  };
  await build({ entryPoints: ["src/routes/auth.ts"], outfile: bundlePath.pathname,
    bundle: true, platform: "node", format: "esm", packages: "external", logLevel: "silent" });
  const { default: router } = await import(bundlePath.href);
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use("/api", router);
  server = await new Promise(resolve => { const s = app.listen(3011, "127.0.0.1", () => resolve(s)); });
  const request = async (path, body, cookie) => {
    const r = await realFetch(`${f.authOrigin}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: r.status, body: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] };
  };
  const login = role => request("/login", f.users[role]);
  const verify = (challenge, code = f.code) => request("/verify-otp", { tempToken: challenge.body.tempToken, otp: code });
  const cooldown = () => pool.query(`UPDATE crm.login_otp_challenges
    SET generated_at=NOW()-INTERVAL '61 seconds' WHERE employee_id=$1`, [f.ids[0]]);

  const normal = await login("normal");
  assert.equal(normal.body.step, "authenticated"); assert(normal.cookie);
  const challenge = await login("otp");
  assert.equal(challenge.body.step, "otp");
  assert.equal(challenge.cookie, "mis_session=");
  assert(!("devOtp" in challenge.body) && !("user" in challenge.body));
  assert.equal((await login("otp")).status, 429);
  const { rows: [stored] } = await pool.query("SELECT token_hash FROM crm.login_otp_challenges WHERE employee_id=$1 ORDER BY generated_at DESC LIMIT 1", [f.ids[0]]);
  assert.equal(stored.token_hash.length, 64); assert.notEqual(stored.token_hash, f.code);
  const wrong = f.code[0] === "9" ? `1${f.code.slice(1)}` : `9${f.code.slice(1)}`;
  assert.equal((await verify(challenge, wrong)).status, 401);
  assert.equal((await request("/me", undefined, `mis_session=${challenge.body.tempToken}`)).status, 401);
  const verified = await verify(challenge);
  assert.equal(verified.status, 200); assert(verified.cookie);
  assert.equal(verified.body.passwordExpired, true); assert(verified.body.user.profileName);
  assert.equal((await verify(challenge)).status, 401); // no replay
  const legacy = jwt.sign({ sub: f.ids[0], username: f.users.otp.username, name: "Test", profileId: 3 },
    process.env.SESSION_SECRET ?? "dev-secret-change-me");
  assert.equal((await request("/me", undefined, `mis_session=${legacy}`)).status, 401);
  const changedPassword = `Changed-Aa9!${randomUUID()}`;
  const changed = await request("/change-password", { currentPassword: password, newPassword: changedPassword }, verified.cookie);
  assert.equal(changed.status, 200);
  assert.equal((await request("/me", undefined, changed.cookie)).body.passwordExpired, false);
  f.users.otp.password = changedPassword;

  await cooldown();
  const expired = await login("otp");
  await pool.query("UPDATE crm.login_otp_challenges SET expires_at=NOW()-INTERVAL '1 second' WHERE employee_id=$1", [f.ids[0]]);
  assert.equal((await verify(expired)).status, 401);
  await cooldown();
  const exhausted = await login("otp");
  const bad = f.code[0] === "9" ? `1${f.code.slice(1)}` : `9${f.code.slice(1)}`;
  for (const status of [401, 401, 403]) assert.equal((await verify(exhausted, bad)).status, status);
  assert.equal((await verify(exhausted)).status, 403);
  await cooldown();
  const race = await login("otp");
  assert.deepEqual((await Promise.all([verify(race), verify(race)])).map(r => r.status).sort(), [200, 401]);
  await cooldown();
  const stale = await login("otp");
  await pool.query("UPDATE crm.employees SET approved=FALSE WHERE employee_id=$1", [f.ids[0]]);
  assert.equal((await verify(stale)).status, 401);
  await pool.query("UPDATE crm.employees SET approved=TRUE WHERE employee_id=$1", [f.ids[0]]);
  await cooldown(); failDelivery = true;
  const failed = await login("otp");
  assert.equal(failed.status, 503); assert(!failed.body.tempToken);
  failDelivery = false;
  // Restore only the synthetic account for UI OTP -> required password change.
  await pool.query("UPDATE crm.employees SET password_hash=$1,last_password_reset=NULL WHERE employee_id=$2", [hash, f.ids[0]]);
  f.users.otp.password = password; await cooldown(); await save();
  console.log("Scoped OTP API checks passed: password-only peers, digest storage, delivery failure, cooldown, code attempts/expiry/replay/races, account revocation, legacy sessions and password-change continuity.");
  if (process.argv.includes("--serve")) {
    process.on("SIGTERM", async () => { server.close(); await cleanup(); process.exit(0); });
    console.log("Isolated OTP browser fixture ready on 127.0.0.1:3011 (private fixture file).");
    await new Promise(() => {});
  }
} finally {
  server?.close(); await cleanup();
}
