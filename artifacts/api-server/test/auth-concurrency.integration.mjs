// Real development PostgreSQL, isolated router and synthetic accounts only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { build } from "esbuild";
import express from "express";
import cookieParser from "cookie-parser";
import pg from "pg";
import bcrypt from "bcrypt";

if (process.env.NODE_ENV === "production") throw new Error("Development test only");
process.env.NODE_ENV = "development";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const bundle = new URL(`./.tmp-auth-race-${process.pid}.mjs`, import.meta.url);
const prefix = `RACE_${randomUUID().slice(0, 8)}`;
const ids = [], profileIds = [], usernames = [];
let server, appPool;
let compareHook = async () => {};
let sessionHook = async () => {};
let elapsed = 0;
const codes = [];
// Test-only hooks are compiled into the isolated router, never the managed app.
globalThis.__authRaceCompare = async (password, hash) => {
  const valid = await bcrypt.compare(password, hash);
  await compareHook(valid);
  return valid;
};
globalThis.__authRaceEmail = async message => { codes.push(message.text.match(/code is (\d{6})/)[1]); };
globalThis.__authRaceSession = () => sessionHook();
globalThis.__authThrottleNow = () => Date.now() + elapsed;

try {
  const { rows: profiles } = await pool.query(`INSERT INTO crm.profiles(profile_name,profile_type,is_active)
    VALUES($1,'STAFF',TRUE),($2,'STAFF',TRUE) RETURNING profile_id`, [`${prefix}_A`, `${prefix}_B`]);
  profileIds.push(...profiles.map(p => p.profile_id));
  const password = `Fixture-Aa9!${randomUUID()}`, hash = await bcrypt.hash(password, 10);
  for (const role of ["password", "otp"]) {
    const username = `${prefix}_${role}`;
    const { rows: [row] } = await pool.query(`INSERT INTO crm.employees
      (username,password_hash,employee_name,department,profile_id,activated,approved,last_password_reset)
      VALUES($1,$2,'Concurrency fixture','SALES',$3,TRUE,TRUE,CURRENT_DATE) RETURNING employee_id`,
    [username, hash, profileIds[0]]);
    ids.push(row.employee_id); usernames.push(username);
  }
  const { rows: [policy] } = await pool.query("SELECT lockout_count FROM crm.password_config LIMIT 1");
  const lockout = policy?.lockout_count ?? 3;
  assert(lockout >= 1 && lockout <= 6, "Integration fixture expects a lockout policy within the username allowance");
  // No provider calls or secrets: isolated process uses a synthetic email sender.
  process.env.MIS_LOGIN_OTP_USERNAME = usernames[1];
  process.env.MIS_LOGIN_OTP_ENABLED = "true";
  process.env.MIS_LOGIN_OTP_EMAIL = "fixture@example.test";
  process.env.MIS_LOGIN_OTP_FROM = "MIS <fixture@example.test>";
  await build({ stdin: { contents: `export { default } from "./src/routes/auth";
    export { getPool } from "./src/lib/postgres";`, resolveDir: new URL("..", import.meta.url).pathname, loader: "ts" },
    outfile: bundle.pathname, bundle: true, platform: "node", format: "esm", packages: "external", logLevel: "silent",
    plugins: [{ name: "isolated-auth-hooks", setup(builder) {
      builder.onResolve({ filter: /^bcrypt$/ }, () => ({ path: "bcrypt", namespace: "auth-test" }));
      builder.onResolve({ filter: /\/business-notifications$/ }, () => ({ path: "email", namespace: "auth-test" }));
      builder.onLoad({ filter: /.*/, namespace: "auth-test" }, args => ({
        contents: args.path === "bcrypt" ? "export default { compare: globalThis.__authRaceCompare };"
          : "export const sendResendEmail = globalThis.__authRaceEmail;", loader: "js" }));
      // Pause between OTP consumption and session recheck, retaining the real account query.
      builder.onLoad({ filter: /login-account\.ts$/ }, async args => {
        const { readFile } = await import("node:fs/promises");
        const source = await readFile(args.path, "utf8");
        return { contents: source.replace("const { rows: [fresh] }",
          "await globalThis.__authRaceSession(); const { rows: [fresh] }"), loader: "ts" };
      });
      builder.onLoad({ filter: /auth-throttle\.ts$/ }, async args => {
        const { readFile } = await import("node:fs/promises");
        return { contents: (await readFile(args.path, "utf8")).replace("now = Date.now()", "now = globalThis.__authThrottleNow()"), loader: "ts" };
      });
    } }] });
  const { default: router, getPool } = await import(bundle.href);
  appPool = getPool();
  const app = express(); app.use(express.json()); app.use(cookieParser()); app.use("/api", router);
  server = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/auth`;
  const request = async (path, body, headers = {}) => {
    const r = await fetch(`${base}${path}`, { method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: r.status, body: await r.json(), cookie: r.headers.get("set-cookie"),
      retry: r.headers.get("retry-after") };
  };
  const login = (index = 0, secret = password) => request("/login", { username: usernames[index], password: secret });
  const verify = (challenge, otp) => request("/verify-otp", { tempToken: challenge.body.tempToken, otp });
  const reset = () => pool.query(`UPDATE crm.employees SET failed_attempts=0,employee_locked=FALSE,
    activated=TRUE,approved=TRUE,is_deleted=FALSE,password_hash=$1,profile_id=$2 WHERE employee_id=ANY($3::int[])`,
  [hash, profileIds[0], ids]);
  const state = async () => (await pool.query("SELECT failed_attempts,employee_locked FROM crm.employees WHERE employee_id=$1", [ids[0]])).rows[0];
  const cooldown = () => pool.query("UPDATE crm.login_otp_challenges SET generated_at=NOW()-INTERVAL '61 seconds' WHERE employee_id=$1", [ids[1]]);

  // All comparisons start with the same snapshot; release together so SQL must count each failure.
  let arrivals = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  compareHook = async () => { if (++arrivals === 6) release(); await gate; };
  const failures = await Promise.all(Array.from({ length: 6 }, () => login(0, "incorrect")));
  compareHook = async () => {};
  assert(failures.every(r => [401, 403].includes(r.status) && !r.cookie));
  assert.deepEqual(await state(), { failed_attempts: 6, employee_locked: true });
  assert.equal((await login()).status, 403);
  console.log("Parallel failed passwords retain all increments and never unlock an account.");

  // Correct password was checked before concurrent failures locked the account.
  await reset(); elapsed += 60001;
  let validReady, finishValid;
  const ready = new Promise(resolve => { validReady = resolve; });
  const waitValid = new Promise(resolve => { finishValid = resolve; });
  compareHook = async valid => { if (valid) { validReady(); await waitValid; } };
  const successfulPassword = login();
  await ready;
  for (let i = 0; i < lockout; i++) await login(0, "incorrect");
  finishValid();
  const blocked = await successfulPassword;
  assert.equal(blocked.status, 403); assert(!blocked.cookie);
  assert.equal((await state()).employee_locked, true);
  compareHook = async () => {};

  // Reset only the isolated limiter clock between independent scenarios.
  {
    for (const mutation of ["activated=FALSE", "approved=FALSE", "is_deleted=TRUE",
      "employee_locked=TRUE", "password_hash='synthetic-changed-hash'"]) {
      await reset(); elapsed += 60001;
      compareHook = async () => { await pool.query(`UPDATE crm.employees SET ${mutation} WHERE employee_id=$1`, [ids[0]]); };
      const result = await login();
      assert.equal(result.status, 403); assert(!result.cookie);
    }
    await reset(); elapsed += 60001;
    compareHook = async () => { await pool.query("UPDATE crm.profiles SET is_active=FALSE WHERE profile_id=$1", [profileIds[0]]); };
    assert.equal((await login()).status, 403);
    await pool.query("UPDATE crm.profiles SET is_active=TRUE WHERE profile_id=$1", [profileIds[0]]);
    await reset(); elapsed += 60001;
    compareHook = async () => { await pool.query("UPDATE crm.employees SET profile_id=$1 WHERE employee_id=$2", [profileIds[1], ids[0]]); };
    const reassigned = await login();
    assert.equal(reassigned.status, 403); assert(!reassigned.cookie);
    compareHook = async () => {};
    const refreshed = await login();
    assert.equal(refreshed.status, 200);
    assert.equal(refreshed.body.user.profileId, profileIds[1]);
    assert.equal((await request("/me", undefined, { Cookie: refreshed.cookie.split(";")[0] })).status, 200);
    await pool.query("UPDATE crm.employees SET activated=FALSE WHERE employee_id=$1", [ids[0]]);
    assert.equal((await request("/me", undefined, { Cookie: refreshed.cookie.split(";")[0] })).status, 401);
    console.log("Session issuance rechecks lock, activation, approval, deletion, profile and credential changes.");

    // OTP issuance must recheck the same eligibility without resetting a concurrent lock.
    elapsed += 60001; await reset();
    const beforeCodes = codes.length;
    compareHook = async () => { await pool.query("UPDATE crm.employees SET employee_locked=TRUE,failed_attempts=$1 WHERE employee_id=$2", [lockout, ids[1]]); };
    const lockedOtp = await login(1);
    assert.equal(lockedOtp.status, 403); assert(!lockedOtp.body.tempToken);
    assert.equal(codes.length, beforeCodes);
    const { rows: [otpLock] } = await pool.query("SELECT failed_attempts,employee_locked FROM crm.employees WHERE employee_id=$1", [ids[1]]);
    assert.deepEqual(otpLock, { failed_attempts: lockout, employee_locked: true });
    compareHook = async () => {};

    elapsed += 60001; await reset();
    const issuance = await Promise.all([login(1), login(1), login(1)]);
    assert.deepEqual(issuance.map(r => r.status).sort(), [200, 429, 429]);
    assert.equal(codes.length, 1);
    for (const r of issuance.filter(r => r.status === 429)) {
      assert(Number(r.retry) > 0); assert.equal(Number(r.retry), r.body.retryAfterSeconds);
    }
    const challenge = issuance.find(r => r.status === 200);
    const wrong = codes.at(-1) === "000000" ? "111111" : "000000";
    const guesses = await Promise.all(Array.from({ length: 6 }, () => verify(challenge, wrong)));
    assert(guesses.every(r => [401, 403].includes(r.status)));
    const { rows: [attempts] } = await pool.query("SELECT attempts FROM crm.login_otp_challenges WHERE employee_id=$1 AND NOT used", [ids[1]]);
    assert.equal(attempts.attempts, 3);
    assert.equal((await verify(challenge, codes.at(-1))).status, 403);

    elapsed += 60001; await cooldown();
    const singleUse = await login(1);
    const verifiedRace = await Promise.all([verify(singleUse, codes.at(-1)), verify(singleUse, codes.at(-1))]);
    assert.deepEqual(verifiedRace.map(r => r.status).sort(), [200, 401]);
    const verifiedCookie = verifiedRace.find(r => r.status === 200).cookie.split(";")[0];
    assert.equal((await request("/me", undefined, { Cookie: verifiedCookie })).status, 200);
    // A verify/resend overlap may invalidate the old challenge, but must not deadlock.
    elapsed += 60001; await cooldown();
    const [resend, oldVerification] = await Promise.all([login(1), verify(singleUse, codes.at(-1))]);
    assert.equal(resend.status, 200); assert.equal(oldVerification.status, 401);
    assert.equal((await verify(resend, codes.at(-1))).status, 200);
    elapsed += 60001; await cooldown();
    const revoked = await login(1);
    sessionHook = async () => { await pool.query("UPDATE crm.employees SET approved=FALSE WHERE employee_id=$1", [ids[1]]); };
    const revokedResult = await verify(revoked, codes.at(-1));
    assert.equal(revokedResult.status, 403); assert(!revokedResult.cookie);
    sessionHook = async () => {};
    console.log("OTP races preserve cooldown, three guesses, single use and final session eligibility.");

    elapsed += 60001;
    const sprayed = await Promise.all(Array.from({ length: 65 }, (_, i) =>
      request("/login", { username: `${prefix}_missing_${i}`, password: "incorrect" },
        { "X-Forwarded-For": `192.0.2.${i}` })));
    assert.equal(sprayed.filter(r => r.status === 401).length, 60);
    assert.equal(sprayed.filter(r => r.status === 429).length, 5);
    assert(sprayed.filter(r => r.status === 429).every(r => Number(r.retry) > 0 && !r.cookie));
    elapsed += 60001;
    const named = await Promise.all(Array.from({ length: 15 }, (_, i) =>
      request("/login", { username: i % 2 ? `  ${prefix}_ABSENT  ` : `${prefix}_absent`, password: "incorrect" })));
    assert.equal(named.filter(r => r.status === 401).length, 10);
    assert.equal(named.filter(r => r.status === 429).length, 5);
    elapsed += 60001;
    await reset(); await cooldown();
    const limitedOtp = await login(1);
    const otpBurst = await Promise.all(Array.from({ length: 25 }, () => verify(limitedOtp, "000000")));
    assert.equal(otpBurst.filter(r => r.status === 429).length, 5);
    elapsed += 60001;
    const invalidChallenges = await Promise.all(Array.from({ length: 65 }, () =>
      request("/verify-otp", { tempToken: "invalid", otp: "000000" })));
    assert.equal(invalidChallenges.filter(r => r.status === 401).length, 60);
    assert.equal(invalidChallenges.filter(r => r.status === 429).length, 5);
    for (const r of [...sprayed, ...named, ...otpBurst, ...invalidChallenges]) {
      const output = JSON.stringify(r.body);
      assert(!output.includes(password) && !output.includes(hash));
      assert(!("otp" in r.body) && !("password" in r.body) && !("devOtp" in r.body));
    }
    console.log("Login and OTP bursts are bounded by account and IP with clear retry responses.");
  }
} finally {
  compareHook = async () => {}; sessionHook = async () => {};
  if (server) await new Promise(resolve => server.close(resolve));
  await appPool?.end();
  await pool.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])", [usernames]);
  await pool.query("DELETE FROM crm.employees WHERE employee_id=ANY($1::int[])", [ids]);
  await pool.query("DELETE FROM crm.profiles WHERE profile_id=ANY($1::int[])", [profileIds]);
  await pool.end();
  delete globalThis.__authRaceCompare; delete globalThis.__authRaceEmail; delete globalThis.__authRaceSession;
  delete globalThis.__authThrottleNow;
  await unlink(bundle).catch(() => {});
}
