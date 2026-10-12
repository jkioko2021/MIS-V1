// Development-only PostgreSQL verification. All fixtures are rolled back and the
// sender is a capture function: this test never sends external email.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "esbuild";
import pg from "pg";
import express from "express";

if (process.env.NODE_ENV === "production") throw new Error("Run only against the development database.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = await mkdtemp(path.join(tmpdir(), "risk-notification-tests-"));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
const prefix = `nt${Date.now().toString(36)}`;
const codes = [`${prefix}a`, `${prefix}b`, `${prefix}c`];
const owner = `${prefix}_owner`, other = `${prefix}_other`, champion = `${prefix}_champ`;
const oldFrom = process.env.MIS_EMAIL_FROM;
const oldPublicUrl = process.env.MIS_PUBLIC_APP_URL;
let server;
try {
  process.env.MIS_PUBLIC_APP_URL = "https://mis.example.test/mis/";
  await client.query("BEGIN");
  globalThis.__riskNotificationTest = { client, codes };
  await build({
    stdin: {
      contents: `export * from "./src/lib/risk-notifications";
        export { riskWorkflowRouter } from "./src/routes/risk-workflow";
        export { default as registerRouter } from "./src/routes/risk-register";`,
      resolveDir: root,
    },
    outfile: path.join(dir, "test.mjs"), bundle: true, platform: "node", format: "esm",
    banner: { js: 'import { createRequire } from "node:module"; const require=createRequire(import.meta.url);' },
    plugins: [{
      name: "rollback-only-database",
      setup(b) {
        b.onResolve({ filter: /(?:^|\/)postgres$/ }, () => ({ path: "test-postgres", namespace: "test" }));
        b.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents: `
            export async function txQuery(_client, sql, params) {
              // Only the outbox enumeration is restricted to our synthetic rows.
              // Account authorization and every other SQL statement run unchanged.
              if (sql.includes("SELECT *,submitted_at::text FROM risk.review_notifications")) {
                sql = sql.replace("WHERE email_status", "WHERE depart_code=ANY($1::text[]) AND email_status");
                params = [globalThis.__riskNotificationTest.codes];
              }
              return (await globalThis.__riskNotificationTest.client.query(sql,params)).rows;
            }
            export const query = (sql,params) => txQuery(null,sql,params);
            export const queryOne = async (sql,params) => (await query(sql,params))[0] ?? null;
            export async function withTransaction(fn) {
              const client = globalThis.__riskNotificationTest.client;
              await client.query("SAVEPOINT notification_test");
              try { const result = await fn(client); await client.query("RELEASE SAVEPOINT notification_test"); return result; }
              catch (err) { await client.query("ROLLBACK TO SAVEPOINT notification_test"); throw err; }
            }`,
        }));
        b.onResolve({ filter: /auth-middleware$/ }, () => ({ path: "test-auth", namespace: "auth-test" }));
        b.onLoad({ filter: /.*/, namespace: "auth-test" }, () => ({
          contents: "export const requireAuth = (_req,_res,next) => next();",
        }));
        b.onResolve({ filter: /(?:^|\/)logger$/ }, () => ({ path: "test-logger", namespace: "logger-test" }));
        b.onLoad({ filter: /.*/, namespace: "logger-test" }, () => ({
          contents: "export const logger = { info() {}, warn() {}, error() {}, debug() {} };",
        }));
      },
    }],
  });
  const lib = await import(pathToFileURL(path.join(dir, "test.mjs")).href);
  const profile = (await client.query(`INSERT INTO crm.profiles(profile_name) VALUES($1) RETURNING profile_id`,
    [`${prefix} test profile`])).rows[0].profile_id;
  const employees = {};
  for (const username of [owner, other, champion]) {
    employees[username] = (await client.query(`INSERT INTO crm.employees
      (username,password_hash,employee_name,email,profile_id,activated,approved)
      VALUES($1,'unusable-test-hash',$1,$2,$3,TRUE,TRUE) RETURNING employee_id`,
      [username,`${username}@example.test`,profile])).rows[0].employee_id;
  }
  const period = (await client.query(`INSERT INTO risk.periods(period_from,period_to)
    VALUES('2190-01-01','2190-03-31') RETURNING period_id`)).rows[0].period_id;
  for (const code of codes) {
    await client.query("INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,$2)", [code,`Test department ${code}`]);
    await client.query(`INSERT INTO risk.department_assignments
      (depart_code,champion_username,owner_username,assigned_by) VALUES($1,$2,$3,$2)`,
      [code,champion,code === codes[2] ? other : owner]);
    await client.query(`INSERT INTO risk.risk_master
      (risk_code,depart_code,period_from,period_to,risk_title,entered_by,assessment_updated)
      VALUES($1,$2,'2190-01-01','2190-03-31','Private synthetic risk',$3,TRUE)`, [`${code}_risk`,code,champion]);
    await client.query(`INSERT INTO risk.root_causes(risk_code,root_cause,mitigations)
      VALUES($1,'Private cause','Private mitigation')`, [`${code}_risk`]);
  }
  let actorId = employees[champion];
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { sub: actorId };
    req.log = { error() {}, warn() {} };
    next();
  });
  app.use(lib.registerRouter);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const submit = async (code, action = "SUBMIT") => {
    const response = await fetch(`${base}/risk-register/workflow`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depart_code: code, period_id: period, action, comments: "Synthetic test decision" }),
    });
    return { status: response.status, body: await response.json() };
  };
  const notifications = async () => (await client.query(`SELECT *,submitted_at::text FROM risk.review_notifications
    WHERE depart_code=ANY($1::text[]) ORDER BY notification_id`, [codes])).rows;
  const readiness = async (code = codes[0]) => {
    const response = await fetch(`${base}/risk-register/readiness/${code}/${period}`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body.data).sort(), [
      "depart_code", "period_id", "total_active_risks", "assessed_risks", "risks_missing_root_causes",
      "active_owner_available", "owner_email_usable", "sender_configured",
    ].sort(), "Readiness exposes scoped flags and counts only");
    return body.data;
  };
  delete process.env.MIS_EMAIL_FROM;
  assert.equal((await readiness()).sender_configured, false);
  process.env.MIS_EMAIL_FROM = "   ";
  assert.equal((await readiness()).sender_configured, false, "Blank sender settings are not usable");
  delete process.env.MIS_EMAIL_FROM;
  assert.equal((await fetch(`${base}/risk-register/readiness/unassigned-department/${period}`)).status, 403,
    "Readiness must not reveal configuration to an unassigned champion");
  await client.query("UPDATE crm.employees SET email='not-an-address' WHERE username=$1", [owner]);
  assert.equal((await readiness()).owner_email_usable, false);
  assert.equal((await readiness()).active_owner_available, true);
  await client.query("UPDATE crm.employees SET employee_locked=TRUE WHERE username=$1", [owner]);
  assert.equal((await readiness()).active_owner_available, false);
  assert.equal((await submit(codes[0])).status, 409, "An inactive owner still blocks submission");
  await client.query("UPDATE crm.employees SET employee_locked=FALSE,email=NULL WHERE username=$1", [owner]);
  assert.equal((await readiness()).owner_email_usable, false);
  assert.equal((await submit(codes[0])).body.data.notification.email_status, "NO_RECIPIENT");
  await client.query("UPDATE crm.employees SET email=$1 WHERE username=$2", [`${owner}@example.test`,owner]);
  assert.equal((await readiness(codes[1])).owner_email_usable, true);
  assert.equal((await submit(codes[1])).body.data.notification.email_status, "WAITING_CONFIGURATION");
  assert.equal((await client.query("SELECT count(*)::int AS n FROM risk.department_summary WHERE depart_code=ANY($1::text[]) AND submitted", [codes])).rows[0].n, 2,
    "Email setup problems do not roll back submissions");
  process.env.MIS_EMAIL_FROM = "MIS Test <sender@example.test>";
  process.env.MIS_PUBLIC_APP_URL = "https://mis.example.test/mis/";
  assert.equal((await readiness()).sender_configured, true);
  assert.equal((await readiness()).owner_email_usable, true, "Repaired configuration is reflected on refresh");
  for (const code of codes.slice(2)) {
    const result = await submit(code);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.data.notification.email_status, "PENDING");
  }
  assert.equal((await submit(codes[0])).status, 409);
  assert.equal((await notifications()).length, 3, "repeated submissions must not queue again");
  const sent = [];
  assert.equal(await lib.dispatchRiskReviewEmails(async email => sent.push(email)), 3);
  assert.equal(sent.filter(email => email.to === `${owner}@example.test`).length, 2);
  for (let i = 0; i < sent.length; i++) {
    assert.match(sent[i].subject, /^Action required: Review .* risk register$/);
    assert.ok(sent[i].text.includes("requires your review as the assigned Risk Owner"));
    assert.ok(sent[i].text.includes("Please review the risk details, root causes, action plans and saved risk assessments."));
    assert.ok(sent[i].text.includes("select Review and record your decision comments"));
    assert.ok(sent[i].text.includes("select Return and explain what the Risk Champion must correct"));
    assert.ok(sent[i].text.includes("Sign in to MIS"));
    assert.match(sent[i].text, new RegExp(codes[i]));
    for (const code of codes.filter(code => code !== codes[i])) assert.ok(!sent[i].text.includes(code));
    assert.ok(sent[i].text.includes("2190-01-01 to 2190-03-31"));
    assert.ok(sent[i].text.includes(champion));
    assert.ok(sent[i].text.includes("/risk/review"));
    const link = new URL(sent[i].text.match(/https:\/\/[^\s]+/)[0]);
    assert.equal(link.origin, "https://mis.example.test");
    assert.equal(link.pathname, "/mis/risk/review");
    assert.deepEqual([...link.searchParams.keys()], ["depart_code", "period_id"]);
    assert.equal(link.searchParams.get("depart_code"), codes[i]);
    assert.equal(link.searchParams.get("period_id"), String(period));
    assert.ok(!sent[i].text.includes("Private"));
  }
  assert.equal(await lib.dispatchRiskReviewEmails(async email => sent.push(email)), 0);
  assert.equal(sent.length, 3, "sent notices must not be resent");

  // Current owner access remains scoped even when the same owner owns two departments.
  actorId = employees[owner];
  assert.equal((await fetch(`${base}/risk-register/readiness/${codes[2]}/${period}`)).status, 403, "Owner cannot inspect a champion's readiness");
  const summary = await (await fetch(`${base}/risk-register/summary?access=review&period_id=${period}`)).json();
  assert.deepEqual(summary.data.map(row => row.depart_code).sort(), codes.slice(0, 2).sort());
  assert.ok(summary.data.every(row => row.review_email_status === "SENT"));
  assert.equal((await submit(codes[2], "REVIEW")).status, 403);
  const linkedRead = async code => fetch(`${base}/risk-register/summary?access=review&depart_code=${code}&period_id=${period}`);
  assert.deepEqual((await (await linkedRead(codes[1])).json()).data.map(row => row.depart_code), [codes[1]],
    "email scope selects the second of a multi-department owner's departments");
  assert.equal((await linkedRead(codes[2])).status, 403, "tampered department is forbidden");
  await client.query("UPDATE risk.department_assignments SET owner_username=$1 WHERE depart_code=$2", [other,codes[1]]);
  assert.equal((await linkedRead(codes[1])).status, 403, "stale links recheck current assignments");
  await client.query("UPDATE risk.department_assignments SET owner_username=$1 WHERE depart_code=$2", [owner,codes[1]]);
  assert.equal((await notifications()).length, 3);
  assert.equal((await submit(codes[0], "RETURN")).status, 200);
  assert.equal((await (await linkedRead(codes[0])).json()).data[0].workflow_status, "OPEN", "Return restores the open register");
  assert.equal((await submit(codes[0], "REVIEW")).status, 409, "a returned register cannot be reviewed through an old link");
  await client.query("UPDATE risk.department_summary SET closed=TRUE WHERE depart_code=$1", [codes[1]]);
  assert.equal((await (await linkedRead(codes[1])).json()).data[0].workflow_status, "CLOSED");
  assert.equal((await submit(codes[1], "REVIEW")).status, 409, "a closed register cannot be reviewed through an old link");
  await client.query("UPDATE risk.department_summary SET closed=FALSE WHERE depart_code=$1", [codes[1]]);
  actorId = employees[champion];
  assert.equal((await submit(codes[0])).status, 409, "reassessment is still required");
  await client.query("UPDATE risk.risk_master SET assessment_updated=TRUE WHERE depart_code=$1", [codes[0]]);
  // NOW() is constant within this rollback-only outer transaction; represent a fresh event.
  await client.query(`UPDATE risk.review_notifications SET submitted_at=submitted_at-INTERVAL '1 second'
    WHERE depart_code=$1`, [codes[0]]);
  assert.equal((await submit(codes[0])).status, 200);
  assert.equal((await notifications()).length, 4, "new submissions notify again");
  let key;
  for (let attempt = 1; attempt <= 5; attempt++) {
    await client.query(`UPDATE risk.review_notifications SET next_attempt_at=NOW()
      WHERE depart_code=$1 AND email_status<>'SENT'`, [codes[0]]);
    assert.equal(await lib.dispatchRiskReviewEmails(async email => {
      if (key) assert.equal(email.idempotencyKey, key);
      key = email.idempotencyKey;
      throw new Error("Provider failure with private details");
    }), 0);
    const failure = (await notifications()).at(-1);
    assert.equal(failure.email_attempts, attempt);
    assert.equal(failure.email_status, attempt === 5 ? "FAILED" : "RETRY");
    assert.ok(failure.email_error.includes("submission remains saved"));
    assert.ok(!failure.email_error.includes("private details"));
  }
  const saved = (await client.query("SELECT submitted FROM risk.department_summary WHERE depart_code=$1", [codes[0]])).rows[0];
  assert.equal(saved.submitted, true, "email failure must never undo submission");
  const failedSummary = await (await fetch(`${base}/risk-register/summary?depart_code=${codes[0]}&period_id=${period}`)).json();
  assert.equal(failedSummary.data[0].review_email_status, "FAILED");

  // A reassigned, locked, or inactive owner must never receive queued email.
  for (const condition of ["remapped", "locked", "inactive", "unapproved", "deleted", "profile"]) {
    await client.query(`UPDATE risk.review_notifications SET email_status='PENDING',email_attempts=0,next_attempt_at=NOW()
      WHERE notification_id=(SELECT max(notification_id) FROM risk.review_notifications WHERE depart_code=$1)`, [codes[0]]);
    if (condition === "remapped") await client.query("UPDATE risk.department_assignments SET owner_username=$1 WHERE depart_code=$2", [other,codes[0]]);
    else if (condition === "profile") await client.query("UPDATE crm.profiles SET is_active=FALSE WHERE profile_id=$1", [profile]);
    else {
      const columns = { locked: "employee_locked=TRUE", inactive: "activated=FALSE", unapproved: "approved=FALSE", deleted: "is_deleted=TRUE" };
      await client.query(`UPDATE crm.employees SET ${columns[condition]} WHERE username=$1`, [owner]);
    }
    assert.equal(await lib.dispatchRiskReviewEmails(async () => assert.fail("Unauthorized email")), 0);
    assert.equal((await notifications()).at(-1).email_status, "CANCELLED");
    await client.query("UPDATE risk.department_assignments SET owner_username=$1 WHERE depart_code=$2", [owner,codes[0]]);
    await client.query("UPDATE crm.employees SET activated=TRUE,approved=TRUE,is_deleted=FALSE,employee_locked=FALSE WHERE username=$1", [owner]);
    await client.query("UPDATE crm.profiles SET is_active=TRUE WHERE profile_id=$1", [profile]);
  }
  await client.query(`UPDATE risk.review_notifications SET email_status='PENDING',email_attempts=0,next_attempt_at=NOW()
    WHERE notification_id=(SELECT max(notification_id) FROM risk.review_notifications WHERE depart_code=$1)`, [codes[0]]);
  delete process.env.MIS_EMAIL_FROM;
  await lib.dispatchRiskReviewEmails(async () => assert.fail("Sender is not configured"));
  assert.equal((await notifications()).at(-1).email_status, "WAITING_CONFIGURATION");
  process.env.MIS_EMAIL_FROM = "MIS Test <sender@example.test>";
  delete process.env.MIS_PUBLIC_APP_URL;
  await client.query(`UPDATE risk.review_notifications SET next_attempt_at=NOW()
    WHERE notification_id=(SELECT max(notification_id) FROM risk.review_notifications WHERE depart_code=$1)`, [codes[0]]);
  await lib.dispatchRiskReviewEmails(async () => assert.fail("Published URL is not configured"));
  assert.equal((await notifications()).at(-1).email_status, "WAITING_CONFIGURATION");
  process.env.MIS_PUBLIC_APP_URL = "https://mis.example.test/mis/";
  process.env.MIS_EMAIL_FROM = "get default";
  await client.query(`UPDATE risk.review_notifications SET next_attempt_at=NOW()
    WHERE notification_id=(SELECT max(notification_id) FROM risk.review_notifications WHERE depart_code=$1)`, [codes[0]]);
  const attemptsBeforeInvalidSender = (await notifications()).at(-1).email_attempts;
  await lib.dispatchRiskReviewEmails(async () => assert.fail("Invalid sender must never call the provider"));
  assert.equal((await notifications()).at(-1).email_status, "WAITING_CONFIGURATION");
  assert.equal((await notifications()).at(-1).email_attempts, attemptsBeforeInvalidSender);
  delete process.env.MIS_EMAIL_FROM;
  await client.query("UPDATE crm.employees SET email=NULL WHERE username=$1", [owner]);
  await client.query(`UPDATE risk.review_notifications SET next_attempt_at=NOW()
    WHERE notification_id=(SELECT max(notification_id) FROM risk.review_notifications WHERE depart_code=$1)`, [codes[0]]);
  await lib.dispatchRiskReviewEmails(async () => assert.fail("Owner has no email"));
  assert.equal((await notifications()).at(-1).email_status, "NO_RECIPIENT");
  actorId = employees[owner];
  assert.equal((await submit(codes[1], "RETURN")).status, 200);
  actorId = employees[champion];
  await client.query("UPDATE risk.risk_master SET assessment_updated=TRUE WHERE depart_code=$1", [codes[1]]);
  await client.query(`UPDATE risk.review_notifications SET submitted_at=submitted_at-INTERVAL '1 second'
    WHERE depart_code=$1`, [codes[1]]);
  assert.equal((await submit(codes[1])).body.data.notification.email_status, "NO_RECIPIENT");
  await client.query("UPDATE crm.employees SET email=$1 WHERE username=$2", [`${owner}@example.test`,owner]);
  await lib.dispatchRiskReviewEmails(async () => assert.fail("Missing sender"));
  assert.equal((await notifications()).at(-1).email_status, "WAITING_CONFIGURATION");
  process.env.MIS_EMAIL_FROM = "MIS Test <sender@example.test>";
  actorId = employees[owner];
  assert.equal((await submit(codes[1], "RETURN")).status, 200);
  await client.query(`UPDATE risk.review_notifications SET next_attempt_at=NOW()
    WHERE notification_id=(SELECT max(notification_id) FROM risk.review_notifications WHERE depart_code=$1)`, [codes[1]]);
  await lib.dispatchRiskReviewEmails(async () => assert.fail("Register no longer awaiting review"));
  assert.equal((await notifications()).at(-1).email_status, "CANCELLED");
  // A notice queued while the published URL is missing gets a durable link
  // when configuration is restored, without losing the saved submission.
  actorId = employees[champion];
  await client.query("UPDATE risk.risk_master SET assessment_updated=TRUE WHERE depart_code=$1", [codes[1]]);
  await client.query(`UPDATE risk.review_notifications SET submitted_at=submitted_at-INTERVAL '2 seconds'
    WHERE depart_code=$1`, [codes[1]]);
  process.env.MIS_EMAIL_FROM = "get default";
  assert.equal((await submit(codes[1])).body.data.notification.email_status, "WAITING_CONFIGURATION");
  await lib.dispatchRiskReviewEmails(async () => assert.fail("Placeholder sender must not be used"));
  assert.equal((await notifications()).at(-1).email_attempts, 0);
  // Represent another returned-and-resubmitted event for the URL-only failure.
  actorId = employees[owner];
  assert.equal((await submit(codes[1], "RETURN")).status, 200);
  actorId = employees[champion];
  await client.query("UPDATE risk.risk_master SET assessment_updated=TRUE WHERE depart_code=$1", [codes[1]]);
  await client.query(`UPDATE risk.review_notifications SET submitted_at=submitted_at-INTERVAL '3 seconds'
    WHERE depart_code=$1`, [codes[1]]);
  process.env.MIS_EMAIL_FROM = "MIS Test <sender@example.test>";
  delete process.env.MIS_PUBLIC_APP_URL;
  assert.equal((await submit(codes[1])).body.data.notification.email_status, "WAITING_CONFIGURATION");
  assert.ok(!(await notifications()).at(-1).message.includes("https://"));
  process.env.MIS_PUBLIC_APP_URL = "https://mis.example.test/mis/";
  const configuredEmails = [];
  assert.equal(await lib.dispatchRiskReviewEmails(async email => configuredEmails.push(email)), 1);
  assert.ok(configuredEmails[0].text.includes(`depart_code=${codes[1]}&period_id=${period}`));
  assert.equal((await notifications()).at(-1).message, configuredEmails[0].text);
  console.log("PASS: scoped recipients, route authorization, duplicate/rejected submissions, retry exhaustion, durable status and configuration failures.");
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await client.query("ROLLBACK");
  client.release();
  await pool.end();
  delete globalThis.__riskNotificationTest;
  if (oldFrom === undefined) delete process.env.MIS_EMAIL_FROM;
  else process.env.MIS_EMAIL_FROM = oldFrom;
  if (oldPublicUrl === undefined) delete process.env.MIS_PUBLIC_APP_URL;
  else process.env.MIS_PUBLIC_APP_URL = oldPublicUrl;
  await rm(dir, { recursive: true, force: true });
}
