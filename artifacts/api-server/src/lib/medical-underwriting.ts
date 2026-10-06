import type { Request, Response, NextFunction } from "express";
import type { PoolClient } from "pg";
import { query, queryOne, txQuery } from "./postgres";
import { logger } from "./logger";

export type MedicalRecord = {
  file_no: string; file_status: string; updated_at: Date | string;
  is_active: boolean; is_declined: boolean; medical_uw: boolean;
  forwarded: boolean; ready_for_update: boolean; mu_revert: boolean;
  entered_by: string; client_type: string; assigned_to: string | null;
  work_status: string | null; business_type: string; rate_type: string;
};
export class MedicalError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const medJoin = `LEFT JOIN crm.business_work_items mw
 ON mw.file_no=b.file_no AND mw.queue_name='MEDICAL_UNDERWRITING'`;
export const medPending = `(mw.work_status='OPEN' OR
 (mw.work_item_id IS NULL AND b.forwarded=TRUE AND b.medical_uw=TRUE AND b.ready_for_update=FALSE
 AND b.file_status IN ('MEDICAL UW-REVIEW','ON HOLD','FORWARDED')))`;
export const medOwner = `(mw.assigned_to IS NULL OR mw.assigned_to=$1 OR $2::boolean)`;

export async function requireMedicalAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await queryOne<{ username: string; profile_name: string }>(
      `SELECT e.username,p.profile_name FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
       WHERE e.employee_id=$1 AND e.activated AND e.approved AND NOT e.employee_locked
       AND NOT e.is_deleted AND p.is_active`, [req.user!.sub]);
    const role = employee?.profile_name.trim().replace(/\s+/g, " ").toLowerCase();
    if (!employee || !["medical uw", "superadmin", "system admin"].includes(role!)) {
      res.status(403).json({ ok: false, error: "Medical Underwriting requires a medical underwriter profile." });
      return;
    }
    res.locals.medUsername = employee.username;
    res.locals.medAdmin = role !== "medical uw";
    next();
  } catch (err) {
    logger.error({ err }, "Medical underwriting access check failed");
    res.status(500).json({ ok: false, error: "Unable to verify medical underwriting access." });
  }
}
export async function medicalFile(fileNo: string, username: string, admin: boolean, client?: PoolClient): Promise<MedicalRecord> {
  if (client) await txQuery(client, `SELECT pg_advisory_xact_lock(hashtext($1))`, [fileNo]);
  const sql = `SELECT b.*,mw.assigned_to,mw.work_status FROM crm.business_tracking b ${medJoin}
    WHERE b.file_no=$3 AND b.is_active AND (${medPending} OR b.mu_revert OR
      (b.is_declined AND b.medical_uw AND b.file_status='DECLINED'))
    AND ${medOwner} ${client ? "FOR UPDATE OF b" : ""}`;
  const rows = client ? await txQuery<MedicalRecord>(client, sql, [username, admin, fileNo])
    : await query<MedicalRecord>(sql, [username, admin, fileNo]);
  if (!rows[0]) throw new MedicalError(404, "Medical underwriting file not found or assigned to another reviewer.");
  return rows[0];
}
export function assertReviewable(file: MedicalRecord) {
  const legacy = !file.work_status && file.forwarded && file.medical_uw && !file.ready_for_update
    && ["MEDICAL UW-REVIEW", "ON HOLD", "FORWARDED"].includes(file.file_status);
  if (file.is_declined || !(file.work_status === "OPEN" || legacy)) {
    throw new MedicalError(409, "This file has already left medical review and is read-only.");
  }
}
export function medicalFailure(res: Response, err: unknown) {
  if (err instanceof MedicalError) {
    res.status(err.status).json({ ok: false, error: err.message }); return;
  }
  logger.error({ err }, "Medical underwriting request failed");
  res.status(500).json({ ok: false, error: "Unable to complete the medical underwriting request." });
}
