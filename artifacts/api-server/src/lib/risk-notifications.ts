import type { PoolClient } from "pg";
import { txQuery, withTransaction } from "./postgres";
import { sendResendEmail, type EmailSender } from "./business-notifications";
import { logger } from "./logger";

const validEmail = (email: unknown): email is string =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// This is the same account eligibility boundary used by riskActor.
export async function activeDepartmentOwner(client: PoolClient, department: string) {
  const [owner] = await txQuery<{ username: string; email: string | null }>(client, `SELECT e.username,e.email
    FROM risk.department_assignments a
    JOIN crm.employees e ON e.username=a.owner_username
    JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE a.depart_code=$1 AND e.activated AND e.approved AND NOT e.employee_locked
      AND NOT e.is_deleted AND p.is_active
    FOR SHARE OF a,e,p`, [department]);
  return owner;
}

export async function queueRiskReviewNotification(client: PoolClient, input: {
  summaryId: unknown; department: string; departmentName: string;
  periodId: number; periodFrom: string; periodTo: string; submittedBy: string;
  owner: { username: string; email: string | null };
}) {
  const status = !validEmail(input.owner.email) ? "NO_RECIPIENT"
    : process.env.MIS_EMAIL_FROM?.trim() ? "PENDING" : "WAITING_CONFIGURATION";
  // No risk snapshots, import identifiers, comments, or other departments enter the email.
  // Navigation instructions do not need a deployment URL and never bypass sign-in.
  const title = `Risk register ready for review: ${input.departmentName}`;
  const message = `Department: ${input.departmentName} (${input.department})
Reporting period: ${input.periodFrom} to ${input.periodTo}
Submitted by: ${input.submittedBy}

This department's register is now available in Risk Register Review.
Sign in to MIS, open Risk Management > Risk Register Review (/risk/review),
and select department ${input.department} and reporting period ${input.periodFrom} to ${input.periodTo}.
Your current department access permissions apply.`;
  const [row] = await txQuery<{ notification_id: number; email_status: string }>(client, `INSERT INTO risk.review_notifications
    (summary_id,submitted_at,depart_code,period_id,recipient_username,submitted_by,title,message,email_status)
    SELECT summary_id,submitted_at,$2,$3,$4,$5,$6,$7,$8 FROM risk.department_summary WHERE summary_id=$1
    ON CONFLICT(summary_id,submitted_at) DO NOTHING RETURNING notification_id,email_status`,
    [input.summaryId,input.department,input.periodId,input.owner.username,input.submittedBy,title,message,status]);
  return row;
}

export async function dispatchRiskReviewEmails(send: EmailSender = sendResendEmail, from = process.env.MIS_EMAIL_FROM?.trim()) {
  return withTransaction(async client => {
    const rows = await txQuery<{
      notification_id: number; summary_id: number; submitted_at: string; depart_code: string;
      recipient_username: string; title: string; message: string; email_attempts: number;
    }>(client, `SELECT *,submitted_at::text FROM risk.review_notifications
      WHERE email_status IN ('PENDING','WAITING_CONFIGURATION','NO_RECIPIENT','RETRY')
        AND email_attempts<5 AND next_attempt_at<=NOW()
      ORDER BY created_at LIMIT 5 FOR UPDATE SKIP LOCKED`);
    let delivered = 0;
    for (const row of rows) {
      const [current] = await txQuery(client, `SELECT s.summary_id FROM risk.department_summary s
        JOIN risk.departments d ON d.depart_code=s.depart_code AND d.is_active
        WHERE s.summary_id=$1 AND s.submitted_at=$2 AND s.submitted AND NOT s.reviewed AND NOT s.closed
        FOR SHARE OF s,d`, [row.summary_id,row.submitted_at]);
      const owner = await activeDepartmentOwner(client, row.depart_code);
      if (!current || owner?.username !== row.recipient_username) {
        await txQuery(client, `UPDATE risk.review_notifications SET email_status='CANCELLED',
          email_error='Notification cancelled: owner authorization or review availability changed.'
          WHERE notification_id=$1`, [row.notification_id]);
        continue;
      }
      if (!validEmail(owner.email) || !from) {
        const status = !validEmail(owner.email) ? "NO_RECIPIENT" : "WAITING_CONFIGURATION";
        await txQuery(client, `UPDATE risk.review_notifications SET email_status=$2,
          email_error=$3,next_attempt_at=NOW()+INTERVAL '5 minutes' WHERE notification_id=$1`,
          [row.notification_id,status,status === "NO_RECIPIENT"
            ? "Owner email address is missing or invalid." : "Configure a verified MIS_EMAIL_FROM sender."]);
        continue;
      }
      try {
        await send({ from, to: owner.email.trim(), subject: row.title, text: row.message,
          idempotencyKey: `mis-risk-review-${row.notification_id}` });
      } catch {
        await txQuery(client, `UPDATE risk.review_notifications SET email_status=$2,
          email_attempts=email_attempts+1,next_attempt_at=NOW()+INTERVAL '5 minutes',
          email_error='Email delivery failed. Check the Resend connection and verified sender; submission remains saved.'
          WHERE notification_id=$1`, [row.notification_id,row.email_attempts + 1 >= 5 ? "FAILED" : "RETRY"]);
        logger.warn({ notificationId: row.notification_id }, "Risk review email delivery failed; submission remains saved");
        continue;
      }
      await txQuery(client, `UPDATE risk.review_notifications SET email_status='SENT',email_sent_at=NOW(),
        email_attempts=email_attempts+1,email_error=NULL WHERE notification_id=$1`, [row.notification_id]);
      delivered++;
    }
    return delivered;
  });
}

export function startRiskReviewEmailWorker() {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try { await dispatchRiskReviewEmails(); }
    catch { logger.error("Risk review notification outbox unavailable; committed submissions are unchanged"); }
    finally { busy = false; }
  };
  const timer = setInterval(() => { void tick(); }, 60_000);
  timer.unref();
  void tick();
}
