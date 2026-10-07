import type { NextFunction, Request, Response } from "express";
import type { PoolClient } from "pg";
import { queryOne, txQuery } from "./postgres";
import { logger } from "./logger";

export const GI_STAFF_SQL = `(LOWER(TRIM(p.profile_name)) IN ('gi','nonmedical','non medical','general insurance')
  OR UPPER(TRIM(e.department)) IN ('GI','NONMEDICAL','NON MEDICAL','GENERAL INSURANCE'))`;
export const ACTIVE_STAFF_SQL = `e.activated AND e.approved AND NOT e.employee_locked
  AND NOT e.is_deleted AND p.is_active`;

export async function giActor(employeeId: string | number) {
  return queryOne<{ username: string; is_gi: boolean; is_admin: boolean }>(
    `SELECT e.username,${GI_STAFF_SQL} AS is_gi,
      (e.profile_id IN (1,2)) AS is_admin
     FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
     WHERE e.employee_id=$1 AND ${ACTIVE_STAFF_SQL}`, [employeeId]);
}

export async function requireGiAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = await giActor(req.user!.sub);
    if (!actor || !(actor.is_gi || actor.is_admin)) {
      res.status(403).json({ ok: false, error: "GI team access is required." });
      return;
    }
    res.locals.giActor = actor;
    next();
  } catch (err) {
    logger.error({ err }, "GI access check failed");
    res.status(500).json({ ok: false, error: "Unable to verify GI access." });
  }
}

export const GI_ALLOCATE_SQL = `b.is_active AND NOT b.is_declined AND NOT b.filed
  AND b.business='N' AND b.forwarded AND b.ready_for_update
  AND NOT b.allocated AND NOT b.invoiced AND NOT b.receipted AND b.file_status='FORWARDED'
  AND EXISTS (SELECT 1 FROM crm.business_work_items w WHERE w.file_no=b.file_no
    AND w.queue_name='GI_ALLOCATE' AND w.work_status='OPEN')`;

export async function recordGiDecision(client: PoolClient, fileNo: string, actor: string,
  action: "A" | "RI", recipient: string, comments: string) {
  const [review] = await txQuery<{ gi_review_id: number }>(client,
    `INSERT INTO crm.gi_reviews(file_no,action,reviewed_by,recipient_username,comments)
     VALUES($1,$2,$3,$4,$5) RETURNING gi_review_id`, [fileNo,action,actor,recipient,comments]);
  const [employee] = await txQuery<{ email: string | null }>(client,
    `SELECT email FROM crm.employees WHERE username=$1 AND NOT is_deleted`, [recipient]);
  const validEmail = !!employee?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email.trim());
  const status = !validEmail ? "NO_RECIPIENT" : process.env.MIS_EMAIL_FROM?.trim()
    ? "PENDING" : "WAITING_CONFIGURATION";
  const title = action === "RI" ? "GI review: returned incomplete" : "GI business allocated";
  await txQuery(client, `INSERT INTO crm.business_notifications
    (file_no,gi_review_id,recipient_username,title,message,email_status)
    VALUES($1,$2,$3,$4,$5,$6)`, [fileNo,review.gi_review_id,recipient,title,
    `${fileNo}: ${action === "RI" ? "Returned to your Register Queue" : "Assigned to your GI-Allocated queue"} by ${actor}. ${comments}`,status]);
  return status;
}
