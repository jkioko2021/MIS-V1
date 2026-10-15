// Rollback-only development database checks. Captured sender; never sends real email.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import pg from "pg";

if (process.env.NODE_ENV === "production" || !process.env.DATABASE_URL) throw new Error("Development database required.");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = await mkdtemp(path.join(tmpdir(), "risk-reminders-"));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
const previousFrom = process.env.MIS_EMAIL_FROM;
const prefix = `rem${Date.now().toString(36)}`;
try {
  await client.query("BEGIN");
  globalThis.__reminderDB = client;
  await build({
    stdin: { contents: 'export * from "./src/lib/risk-reminders";', resolveDir: root },
    outfile: path.join(dir, "test.mjs"), bundle: true, platform: "node", format: "esm",
    banner: { js: 'import { createRequire } from "node:module"; const require=createRequire(import.meta.url);' },
    plugins: [{
      name: "rollback-database",
      setup(b) {
        b.onResolve({ filter: /(?:^|\/)logger$/ }, () => ({ path: "logger", namespace: "test-logger" }));
        b.onLoad({ filter: /.*/, namespace: "test-logger" }, () => ({ contents: "export const logger={info(){},warn(){},error(){},debug(){}};" }));
        b.onResolve({ filter: /(?:^|\/)postgres$/ }, () => ({ path: "db", namespace: "test" }));
        b.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: `
          export async function txQuery(_,sql,params){return (await globalThis.__reminderDB.query(sql,params)).rows;}
          export async function query(sql,params){return txQuery(null,sql,params);}
          export async function withTransaction(fn){
            const c=globalThis.__reminderDB;await c.query("SAVEPOINT reminder_check");
            try {const r=await fn(c);await c.query("RELEASE SAVEPOINT reminder_check");return r;}
            catch(e){await c.query("ROLLBACK TO SAVEPOINT reminder_check");throw e;}
          }` }));
      },
    }],
  });
  const lib = await import(pathToFileURL(path.join(dir, "test.mjs")).href);
  process.env.MIS_EMAIL_FROM = "MIS Tests <mis@example.test>";
  const profile = (await client.query("INSERT INTO crm.profiles(profile_name) VALUES($1) RETURNING profile_id", [prefix])).rows[0].profile_id;
  const champion = `${prefix}_champ`, owner = `${prefix}_owner`, code = prefix;
  for (const name of [champion, owner]) await client.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,email,profile_id,activated,approved)
    VALUES($1,'unusable-test-hash',$1,$2,$3,TRUE,TRUE)`, [name, `${name}@example.test`, profile]);
  await client.query("INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,$2)", [code, prefix]);
  await client.query("INSERT INTO risk.department_assignments(depart_code,champion_username,owner_username,assigned_by) VALUES($1,$2,$3,$2)", [code, champion, owner]);
  const p = (await client.query(`INSERT INTO risk.periods(period_from,period_to)
    SELECT (max(period_to)+INTERVAL '10 years')::date,(max(period_to)+INTERVAL '10 years 3 months')::date
    FROM risk.periods RETURNING period_id,period_from::text,period_to::text`)).rows[0];
  await client.query(`INSERT INTO risk.risk_master(risk_code,depart_code,period_from,period_to,risk_title,entered_by)
    VALUES($1,$2,$3,$4,'Synthetic reminder test',$5)`, [`${prefix}_risk`, code, p.period_from, p.period_to, champion]);
  await client.query("INSERT INTO risk.department_summary(depart_code,period_from,period_to) VALUES($1,$2,$3)", [code, p.period_from, p.period_to]);
  const actor = { username: champion, is_admin: false, is_manager: false, champion_departments: [code], owner_departments: [] };
  const input = { depart_code: code, period_id: p.period_id, expected_status: "OPEN", comments: "Please complete the assessment." };
  const captured = [];
  const send = async email => { captured.push(email); };
  const responsibility = await lib.pendingResponsibility(code, "OPEN", 1);
  assert.equal(responsibility.pending_role, "Risk Champion");
  assert.equal(responsibility.pending_users[0].username, champion);
  assert.equal(responsibility.reminder_available, true);
  assert.equal("email" in responsibility.pending_users[0], false, "Do not expose mailboxes through status.");
  assert.equal(lib.pendingStage("SUBMITTED", 1).role, "Risk Owner");
  assert.match(lib.pendingStage("REVIEWED", 1).action, /Sign off/);
  assert.match(lib.pendingStage("SIGNED_OFF", 1).action, /Close/);
  assert.equal(lib.pendingStage("CLOSED", 1).path, "");
  assert.equal(lib.pendingStage("OPEN", 0).role, "No register");
  await assert.rejects(lib.sendRiskReminder({ ...actor, champion_departments: [] }, input, send), error => error.status === 403);
  await assert.rejects(lib.sendRiskReminder(actor, { ...input, expected_status: "SUBMITTED" }, send), error => error.status === 409);
  const accepted = await lib.sendRiskReminder(actor, input, send);
  assert.equal(accepted.accepted, 1);
  assert.equal(accepted.failed, 0);
  assert.equal(captured[0].to, `${champion}@example.test`);
  assert.match(captured[0].text, /Complete assessments and submit/);
  assert.match(captured[0].text, /Please complete the assessment/);
  assert.match(captured[0].text, new RegExp(p.period_from));
  assert.match(accepted.message, /Inbox delivery is not confirmed/);
  await assert.rejects(lib.sendRiskReminder(actor, input, send), error => error.status === 429);
  assert.equal(captured.length, 1);
  await client.query("DELETE FROM risk.register_history WHERE depart_code=$1 AND action='WORKFLOW_REMINDER'", [code]);
  await client.query("UPDATE risk.department_summary SET submitted=TRUE WHERE depart_code=$1", [code]);
  const ownerResponsibility = await lib.pendingResponsibility(code, "SUBMITTED", 1);
  assert.equal(ownerResponsibility.pending_users[0].username, owner);
  await client.query("UPDATE crm.employees SET email=NULL WHERE username=$1", [owner]);
  assert.equal((await lib.pendingResponsibility(code, "SUBMITTED", 1)).reminder_available, false);
  await assert.rejects(lib.sendRiskReminder(actor, { ...input, expected_status: "SUBMITTED" }, send), error => error.status === 409);
  await client.query("UPDATE crm.employees SET email=$2 WHERE username=$1", [owner, `${owner}@example.test`]);
  const failed = await lib.sendRiskReminder(actor, { ...input, expected_status: "SUBMITTED" }, async () => { throw new Error("Provider rejected"); });
  assert.equal(failed.accepted, 0);
  assert.equal(failed.failed, 1);
  const audit = (await client.query("SELECT snapshot FROM risk.register_history WHERE depart_code=$1 AND action='WORKFLOW_REMINDER'", [code])).rows[0];
  assert.equal(audit.snapshot.outcomes[0].accepted, false);
  assert.equal(audit.snapshot.outcomes[0].username, owner);
  await client.query("DELETE FROM risk.register_history WHERE depart_code=$1 AND action='WORKFLOW_REMINDER'", [code]);
  const newer = (await client.query(`INSERT INTO risk.periods(period_from,period_to) VALUES(($1::date+1),($1::date+90)) RETURNING period_id`, [p.period_to])).rows[0];
  await assert.rejects(lib.sendRiskReminder(actor, { ...input, expected_status: "SUBMITTED" }, send), error => error.status === 409 && /current open/.test(error.message));
  await client.query("UPDATE risk.periods SET status='CLOSED' WHERE period_id=$1", [newer.period_id]);
  process.env.MIS_EMAIL_FROM = "";
  await assert.rejects(lib.sendRiskReminder(actor, { ...input, expected_status: "SUBMITTED" }, send), error => error.status === 503);
  console.log("PASS: actual SQL recipients, scoped access, current period, fresh workflow, missing email/config, accepted/failure auditing and cooldown. No external email sent.");
} finally {
  await client.query("ROLLBACK"); client.release(); await pool.end();
  if (previousFrom === undefined) delete process.env.MIS_EMAIL_FROM; else process.env.MIS_EMAIL_FROM = previousFrom;
  delete globalThis.__reminderDB;
  await rm(dir, { recursive: true, force: true });
}
