import type { PoolClient } from "pg";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { txQuery, withTransaction } from "./postgres";
import { logger } from "./logger";
import { isLocalRuntime } from "./local-runtime";
import { captureLocalEmail } from "./local-mail";

export type OutboundEmail = { from: string; to: string; subject: string; text: string; idempotencyKey: string };
export type EmailSender = (email: OutboundEmail) => Promise<void>;
const validEmail = (value: unknown): value is string =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export async function queueMedicalNotification(
  client: PoolClient, fileNo: string, reviewId: number, tracker: string, action: "RI" | "D", comments: string,
) {
  const [employee] = await txQuery<{ email: string | null }>(client,
    `SELECT email FROM crm.employees WHERE username=$1 AND NOT is_deleted`, [tracker]);
  const emailStatus = !validEmail(employee?.email) ? "NO_RECIPIENT"
    : process.env.MIS_EMAIL_FROM?.trim() ? "PENDING" : "WAITING_CONFIGURATION";
  const title = action === "RI" ? "Medical review: returned incomplete" : "Medical review: declined";
  const message = `File ${fileNo} was ${action === "RI" ? "returned to your Register Queue for correction" : "declined by Medical Underwriting"}. Review notes: ${comments}`;
  await txQuery(client, `INSERT INTO crm.business_notifications
    (file_no,review_id,recipient_username,title,message,email_status)
    VALUES($1,$2,$3,$4,$5,$6)`, [fileNo, reviewId, tracker, title, message, emailStatus]);
  return { email_status: emailStatus };
}

export const sendResendEmail: EmailSender = async email => {
  if (isLocalRuntime()) {
    await captureLocalEmail(email);
    return;
  }
  const connectors = new ReplitConnectors();
  const response = await fetch(`${connectors.getProxyUrl()}/emails`, {
    method: "POST",
    headers: { ...await connectors.getProxyHeaders("resend"),
      "Content-Type": "application/json", "Idempotency-Key": email.idempotencyKey },
    body: JSON.stringify({ from: email.from, to: [email.to], subject: email.subject, text: email.text }),
    signal: AbortSignal.timeout(15000),
  });
  // Never log provider response bodies: they can contain recipients or content.
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}.`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error("Email provider did not confirm message acceptance.");
};

// The review and notification commit together. Delivery runs after commit,
// independently of the staff request, and failures remain visible/retryable.
export async function dispatchMedicalEmails(send: EmailSender = sendResendEmail, from = process.env.MIS_EMAIL_FROM?.trim()) {
  if (!from) return 0;
  return withTransaction(async client => {
    const rows = await txQuery<{
      notification_id: number; email: string | null; title: string; message: string; email_attempts: number;
    }>(client, `SELECT n.notification_id,n.title,n.message,n.email_attempts,e.email
      FROM crm.business_notifications n LEFT JOIN crm.employees e
        ON e.username=n.recipient_username AND NOT e.is_deleted
      WHERE n.email_status<>'SENT' AND n.email_attempts<5 AND n.next_attempt_at<=NOW()
      ORDER BY n.created_at LIMIT 5 FOR UPDATE OF n SKIP LOCKED`);
    let delivered = 0;
    for (const row of rows) {
      if (!validEmail(row.email)) {
        await txQuery(client, `UPDATE crm.business_notifications SET email_status='NO_RECIPIENT',
          next_attempt_at=NOW()+INTERVAL '5 minutes' WHERE notification_id=$1`, [row.notification_id]);
        continue;
      }
      try {
        await send({ from, to: row.email.trim(), subject: row.title, text: row.message,
          idempotencyKey: `mis-medical-notification-${row.notification_id}` });
        await txQuery(client, `UPDATE crm.business_notifications SET email_status='SENT',email_sent_at=NOW(),
          email_attempts=email_attempts+1,email_error=NULL WHERE notification_id=$1`, [row.notification_id]);
        delivered++;
      } catch {
        await txQuery(client, `UPDATE crm.business_notifications SET email_status='RETRY',
          email_attempts=email_attempts+1,next_attempt_at=NOW()+INTERVAL '5 minutes',
          email_error='Email delivery failed. Check the Resend connection and verified sender.'
          WHERE notification_id=$1`, [row.notification_id]);
        logger.warn({ notificationId: row.notification_id }, "Medical notification email delivery failed");
      }
    }
    return delivered;
  });
}

export function startMedicalEmailWorker() {
  let busy = false;
  const tick = async () => {
    if (busy || !process.env.MIS_EMAIL_FROM?.trim()) return;
    busy = true;
    try { await dispatchMedicalEmails(); }
    catch (err) { logger.error({ err }, "Medical notification outbox unavailable"); }
    finally { busy = false; }
  };
  const timer = setInterval(() => { void tick(); }, 60_000);
  timer.unref();
  void tick();
}
