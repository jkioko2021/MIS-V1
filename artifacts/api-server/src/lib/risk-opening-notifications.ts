import type { PoolClient } from "pg";
import { txQuery, withTransaction } from "./postgres";
import { configuredEmailSender, sendResendEmail, type EmailSender } from "./business-notifications";
import { activeDepartmentOwner } from "./risk-notifications";
import { riskUpdateLink } from "./risk-review-link";
import { logger } from "./logger";

const usable=(email:unknown):email is string=>typeof email==="string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const address=(value:string|null|undefined)=>value?.trim().toLowerCase() || null;
async function champions(client:PoolClient,department:string) {
  const assignments=await txQuery<{champion_username:string|null}>(client,
    "SELECT champion_username FROM risk.department_assignments WHERE depart_code=$1 FOR SHARE",[department]);
  const legacy=await txQuery<{username:string}>(client,
    "SELECT username FROM risk.champions WHERE department=$1 AND is_active FOR SHARE",[department]);
  const names=[...new Set([...assignments.map(a=>a.champion_username),...legacy.map(a=>a.username)].filter(Boolean))];
  return txQuery<{username:string;email:string|null}>(client,`SELECT e.username,e.email FROM crm.employees e
    JOIN crm.profiles p ON p.profile_id=e.profile_id WHERE e.username=ANY($1::text[])
      AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active
    ORDER BY e.username FOR SHARE OF e,p`,[names]);
}

export async function queueRiskOpeningNotifications(client:PoolClient,input:{
  summaryId:unknown;department:string;sourcePeriodId:number;periodId:number;
  periodFrom:string;periodTo:string;openedBy:string;
}) {
  const recipients=await champions(client,input.department),owner=await activeDepartmentOwner(client,input.department);
  const [department]=await txQuery<{depart_name:string}>(client,
    "SELECT depart_name FROM risk.departments WHERE depart_code=$1",[input.department]);
  const link=riskUpdateLink(input.department,input.periodId);
  let pending=0;
  for(const champion of recipients) {
    const status=!usable(champion.email) || !owner || !usable(owner.email) ? "NO_RECIPIENT"
      : configuredEmailSender() && link ? "PENDING" : "WAITING_CONFIGURATION";
    if(status==="PENDING") pending++;
    const message=`Hello ${champion.username},

The next reporting period is now open for your department's risk register.

Department: ${department.depart_name} (${input.department})
Reporting period: ${input.periodFrom} to ${input.periodTo}
Opened by: ${input.openedBy}

As the assigned Risk Champion, please update the ongoing risks, root causes and action plans, complete the new assessments, and submit the register for Risk Owner review. The previous period remains available as read-only history, including its recorded risk statuses.

Your assigned Risk Owner is copied for awareness.
${link ? `\nOpen Update Register (sign-in required):\n${link}\n` : ""}
In MIS, open Risk Management > Update Register, then select this department and reporting period. Your existing access permissions apply.

MIS Risk Management`;
    await txQuery(client,`INSERT INTO risk.opening_notifications
      (summary_id,depart_code,source_period_id,period_id,champion_username,champion_email,owner_username,owner_email,title,message,email_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(depart_code,source_period_id,period_id,champion_username) DO NOTHING`,
      [input.summaryId,input.department,input.sourcePeriodId,input.periodId,champion.username,champion.email,
        owner?.username ?? null,owner?.email ?? null,`Action required: Update ${department.depart_name} risk register`,message,status]);
  }
  return {queued:recipients.length,email_status:!recipients.length ? "NO_RECIPIENT"
    : pending===recipients.length ? "PENDING" : pending ? "PARTIAL" : !owner || !usable(owner.email)
      || recipients.some(r=>!usable(r.email)) ? "NO_RECIPIENT" : "WAITING_CONFIGURATION"};
}

export async function dispatchRiskOpeningEmails(send:EmailSender=sendResendEmail,options:{
  from?:string;publicAppUrl?:string;notificationIds?:number[];
}={}) {
  const from=configuredEmailSender(options.from);
  return withTransaction(async client=>{
    const rows=await txQuery<{notification_id:number;summary_id:number;depart_code:string;period_id:number;
      champion_username:string;champion_email:string|null;owner_username:string|null;owner_email:string|null;
      title:string;message:string;email_attempts:number}>(client,`SELECT * FROM risk.opening_notifications
      WHERE email_status IN ('PENDING','WAITING_CONFIGURATION','NO_RECIPIENT','RETRY')
        AND email_attempts<5 AND next_attempt_at<=NOW()
        AND ($1::integer[] IS NULL OR notification_id=ANY($1::integer[]))
      ORDER BY created_at LIMIT 5 FOR UPDATE SKIP LOCKED`,[options.notificationIds ?? null]);
    let accepted=0;
    for(const row of rows) {
      const [current]=await txQuery(client,`SELECT s.summary_id FROM risk.department_summary s
        JOIN risk.departments d ON d.depart_code=s.depart_code AND d.is_active
        JOIN risk.periods p ON p.period_from=s.period_from AND p.period_to=s.period_to
        WHERE s.summary_id=$1 AND p.period_id=$2 AND p.status='OPEN'
          AND NOT s.submitted AND NOT s.reviewed AND NOT s.sign_off AND NOT s.closed FOR SHARE OF s,d`,
        [row.summary_id,row.period_id]);
      const recipient=(await champions(client,row.depart_code)).find(c=>c.username===row.champion_username);
      const owner=await activeDepartmentOwner(client,row.depart_code);
      if(!current || !recipient || (owner?.username ?? null)!==row.owner_username
        || address(recipient.email)!==address(row.champion_email) || address(owner?.email)!==address(row.owner_email)) {
        await txQuery(client,`UPDATE risk.opening_notifications SET email_status='CANCELLED',
          email_error='Register availability, recipient authorization or original email address changed.' WHERE notification_id=$1`,[row.notification_id]);
        continue;
      }
      const link=riskUpdateLink(row.depart_code,row.period_id,options.publicAppUrl);
      if(!from || !link || !usable(row.champion_email) || !usable(row.owner_email)) {
        await txQuery(client,`UPDATE risk.opening_notifications SET email_status=$2,
          email_error='Check champion and owner email details, verified sender and published frontend URL.',
          next_attempt_at=NOW()+INTERVAL '5 minutes' WHERE notification_id=$1`,
          [row.notification_id,!usable(row.champion_email)||!usable(row.owner_email) ? "NO_RECIPIENT" : "WAITING_CONFIGURATION"]);
        continue;
      }
      if(!row.message.includes("Open Update Register (sign-in required):")) {
        row.message+=`\n\nOpen Update Register (sign-in required):\n${link}`;
        await txQuery(client,"UPDATE risk.opening_notifications SET message=$2 WHERE notification_id=$1",[row.notification_id,row.message]);
      }
      try {
        await send({from,to:row.champion_email.trim(),
          cc:address(row.owner_email)===address(row.champion_email) ? [] : [row.owner_email.trim()],
          subject:row.title,text:row.message,idempotencyKey:`mis-risk-opening-${row.notification_id}`});
      } catch {
        await txQuery(client,`UPDATE risk.opening_notifications SET email_status=$2,email_attempts=email_attempts+1,
          email_error='Provider request failed; opening remains saved.',next_attempt_at=NOW()+INTERVAL '5 minutes'
          WHERE notification_id=$1`,[row.notification_id,row.email_attempts+1>=5?"FAILED":"RETRY"]);
        logger.warn({notificationId:row.notification_id},"Period opening email request failed; register remains open");
        continue;
      }
      await txQuery(client,`UPDATE risk.opening_notifications SET email_status='SENT',email_sent_at=NOW(),
        email_attempts=email_attempts+1,email_error=NULL WHERE notification_id=$1`,[row.notification_id]);
      accepted++;
    }
    return accepted;
  });
}

export function startRiskOpeningEmailWorker() {
  let busy=false;
  const tick=async()=>{
    if(busy) return;
    busy=true;
    try {await dispatchRiskOpeningEmails();}
    catch {logger.error("Risk opening email outbox unavailable; committed openings are unchanged");}
    finally {busy=false;}
  };
  setInterval(()=>void tick(),60_000).unref();
  void tick();
}
