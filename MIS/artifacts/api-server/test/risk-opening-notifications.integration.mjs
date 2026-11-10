// Real PostgreSQL, rollback-only fixture changes, injected sender: no external email.
import assert from "node:assert/strict";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {build} from "esbuild";
import pg from "pg";
if(process.env.NODE_ENV==="production") throw new Error("Development only");
const f=JSON.parse(await readFile(process.argv[2],"utf8"));
assert.match(f.prefix,/^RTEST_[a-f0-9]{8}$/);
assert.equal(f.department,`${f.prefix}A`);
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL}),client=await pool.connect();
const directory=await mkdtemp(path.join(tmpdir(),"risk-opening-mail-"));
try {
  await client.query("BEGIN");
  globalThis.__openingMailClient=client;
  await build({
    stdin:{contents:'export * from "./src/lib/risk-opening-notifications"; export {openDepartmentCycle} from "./src/lib/risk-period-opening";',resolveDir:path.resolve("artifacts/api-server")},
    outfile:path.join(directory,"test.mjs"),bundle:true,platform:"node",format:"esm",
    banner:{js:'import {createRequire} from "node:module"; const require=createRequire(import.meta.url);'},
    plugins:[{name:"rollback-only",setup(builder){
      builder.onResolve({filter:/(?:^|\/)postgres$/},()=>({path:"postgres",namespace:"test"}));
      builder.onResolve({filter:/(?:^|\/)logger$/},()=>({path:"logger",namespace:"test"}));
      builder.onLoad({filter:/.*/,namespace:"test"},args=>({contents:args.path==="logger"
        ? "export const logger={warn(){},error(){},info(){}};"
        : `
        export async function txQuery(_,sql,params){ return (await globalThis.__openingMailClient.query(sql,params)).rows; }
        export const query=(sql,params)=>txQuery(null,sql,params);
        export async function withTransaction(fn){ return fn(globalThis.__openingMailClient); }
      `,loader:"js"}));
    }}],
  });
  const {queueRiskOpeningNotifications:queue,dispatchRiskOpeningEmails:dispatch,openDepartmentCycle}=await import(pathToFileURL(path.join(directory,"test.mjs")));
  const championEmail=`${f.prefix}.champion@example.test`,ownerEmail=`${f.prefix}.owner@example.test`;
  for(const [label,email] of [["champion",championEmail],["owner",ownerEmail]]) {
    assert.equal(f.accounts[label].username,`${f.prefix}_${label}`);
    await client.query("UPDATE crm.employees SET email=$2 WHERE username=$1",[f.accounts[label].username,email]);
  }
  const {rows:[summary]}=await client.query(`SELECT s.summary_id,p.period_from::text,p.period_to::text
    FROM risk.department_summary s JOIN risk.periods p ON p.period_from=s.period_from AND p.period_to=s.period_to
    WHERE s.depart_code=$1 AND p.period_id=$2`,[f.department,f.opening_target]);
  assert(summary);
  const input={summaryId:summary.summary_id,department:f.department,sourcePeriodId:f.period,periodId:f.opening_target,
    periodFrom:summary.period_from,periodTo:summary.period_to,openedBy:f.accounts.admin.username};
  const queued=await queue(client,input);assert(queued.queued>=1);
  const {rows:notifications}=await client.query(`SELECT notification_id FROM risk.opening_notifications
    WHERE depart_code=$1 AND period_id=$2 ORDER BY notification_id`,[f.department,f.opening_target]);
  const notificationIds=notifications.map(r=>r.notification_id);
  assert(notificationIds.length>=1);
  const options={from:"MIS <alerts@example.test>",publicAppUrl:"https://mis.example.test/mis/",notificationIds};
  const capture=[];const send=async email=>{capture.push(email);};
  assert.equal(await dispatch(send,options),notificationIds.length);
  const message=capture.find(email=>email.to===championEmail);
  assert(message,"The assigned champion must be a direct recipient");
  assert.deepEqual(message.cc,[ownerEmail],"The assigned Risk Owner must be copied, not BCC or a separate unrelated notice");
  assert(message.text.includes(summary.period_from) && message.text.includes(summary.period_to));
  assert(message.text.includes("/risk/update?") && message.text.includes(`period_id=${f.opening_target}`));
  assert(message.text.includes("submit the register for Risk Owner review"));
  await queue(client,input);
  assert.equal(await dispatch(send,options),0,"The committed event must not send twice");
  const id=notificationIds[0];
  const reset=()=>client.query(`UPDATE risk.opening_notifications SET email_status='PENDING',
    email_attempts=0,next_attempt_at=NOW() WHERE notification_id=$1`,[id]);
  await reset();
  assert.equal(await dispatch(send,{...options,notificationIds:[id],from:"invalid",publicAppUrl:"http://localhost"}),0);
  let state=(await client.query("SELECT email_status FROM risk.opening_notifications WHERE notification_id=$1",[id])).rows[0];
  assert.equal(state.email_status,"WAITING_CONFIGURATION");
  await reset();
  await dispatch(async()=>{throw new Error("Injected provider failure");},{...options,notificationIds:[id]});
  state=(await client.query("SELECT email_status,email_attempts FROM risk.opening_notifications WHERE notification_id=$1",[id])).rows[0];
  assert.equal(state.email_status,"RETRY");assert.equal(state.email_attempts,1);
  await client.query("UPDATE risk.opening_notifications SET next_attempt_at=NOW() WHERE notification_id=$1",[id]);
  assert.equal(await dispatch(send,{...options,notificationIds:[id]}),1);
  assert.deepEqual(capture.at(-1),capture.find(email=>email.idempotencyKey===capture.at(-1).idempotencyKey));
  await reset();
  const {rows:[row]}=await client.query("SELECT champion_username FROM risk.opening_notifications WHERE notification_id=$1",[id]);
  await client.query("UPDATE crm.employees SET email=$2 WHERE username=$1",[row.champion_username,`${f.prefix}.changed@example.test`]);
  const sent=capture.length;
  assert.equal(await dispatch(send,{...options,notificationIds:[id]}),0);
  state=(await client.query("SELECT email_status FROM risk.opening_notifications WHERE notification_id=$1",[id])).rows[0];
  assert.equal(state.email_status,"CANCELLED");assert.equal(capture.length,sent);
  await client.query("UPDATE crm.employees SET email=$2 WHERE username=$1",[f.accounts.champion.username,championEmail]);
  await client.query("UPDATE risk.department_summary SET closed=TRUE WHERE summary_id=$1",[summary.summary_id]);
  const {rows:[year]}=await client.query(`SELECT y FROM generate_series(2500,2599) y WHERE NOT EXISTS
    (SELECT 1 FROM risk.periods WHERE period_from<=make_date(y,12,31) AND period_to>=make_date(y,1,1)) LIMIT 1`);
  const cycle=await openDepartmentCycle(f.department,{source_period_id:f.opening_target,period_from:`${year.y}-01-01`,
    period_to:`${year.y}-12-31`,comments:"Rollback-only check of automatic opening email"},
    {is_admin:true,is_manager:false,username:f.accounts.admin.username});
  assert(cycle.notification.queued>=1,"The actual opening transaction must automatically queue its Champion notification");
  const {rows:[automatic]}=await client.query(`SELECT count(*)::integer AS count FROM risk.opening_notifications
    WHERE depart_code=$1 AND source_period_id=$2 AND period_id=$3`,[f.department,f.opening_target,cycle.target_period_id]);
  assert.equal(automatic.count,cycle.notification.queued);
  console.log("PASS: Champion To, Risk Owner CC, period-specific update link/instructions, duplicate protection, retry, configuration warning and stale-address cancellation. Injected sender only; no external delivery.");
} finally {
  await client.query("ROLLBACK");client.release();await pool.end();
  delete globalThis.__openingMailClient;await rm(directory,{recursive:true,force:true});
}
