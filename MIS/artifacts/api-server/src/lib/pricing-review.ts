import type { Request, Response, NextFunction } from "express";
import type { PoolClient } from "pg";
import { queryOne, txQuery } from "./postgres";
import { MedicalError } from "./medical-underwriting";

export const ratesMatrixRequirement = `LOWER(TRIM(r.req_name)) IN ('rates and benefit matrix','approved rates matrix')`;
export const pricingJoin = `JOIN crm.business_work_items pw ON pw.file_no=b.file_no AND pw.queue_name='PRICING_REVIEW'`;
export const pricingPending = `b.is_active AND NOT b.is_declined AND b.rate_type='C'
  AND b.allocated AND b.file_status='BENEFIT VERIFICATION' AND COALESCE(b.benefit_verified,'NO')<>'YES'
  AND pw.work_status='OPEN'`;
export async function requirePricingAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await queryOne<{ username: string; profile_name: string }>(
      `SELECT e.username,p.profile_name FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
       WHERE e.employee_id=$1 AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active`,
      [req.user!.sub]);
    if (!employee || !["pricing", "superadmin", "system admin"].includes(employee.profile_name.trim().toLowerCase())) {
      res.status(403).json({ ok: false, error: "Pricing Review requires an active Pricing profile." }); return;
    }
    res.locals.pricingUsername = employee.username;
    next();
  } catch (err) { next(err); }
}
export async function pricingFile(client: PoolClient, fileNo: string) {
  await txQuery(client, `SELECT pg_advisory_xact_lock(hashtext($1))`, [fileNo]);
  const [file] = await txQuery<{ file_no: string; updated_at: string | Date; entered_by: string; allocated_to: string | null }>(
    client, `SELECT b.* FROM crm.business_tracking b ${pricingJoin}
      WHERE b.file_no=$1 AND ${pricingPending} FOR UPDATE OF b,pw`, [fileNo]);
  if (!file) throw new MedicalError(409, "This file is no longer awaiting Pricing Review.");
  return file;
}
/** Only custom-rate corporate/SME allocations pause for Pricing. */
export async function queueCorporatePricing(client: PoolClient, fileNo: string, actor: string, alreadyStaged = false) {
  if (!alreadyStaged) {
    const rows = await txQuery(client, `UPDATE crm.business_tracking SET
    file_status='BENEFIT VERIFICATION',benefit_verified='NO',benefit_ver_by=NULL,benefit_ver_date=NULL,
    allocate_dt=NULL,to_pricing_dt=NOW(),ready_for_update=TRUE,forwarded=TRUE,updated_at=NOW()
    WHERE file_no=$1 AND is_active AND NOT is_declined AND allocated AND client_type IN ('C','S')
      AND rate_type='C' RETURNING file_no`, [fileNo]);
    if (!rows.length) {
      const released = await txQuery(client, `UPDATE crm.business_tracking SET file_status='ALLOCATED',
        benefit_verified='YES',allocate_dt=COALESCE(allocate_dt,NOW()),ready_for_update=TRUE,forwarded=TRUE,updated_at=NOW()
        WHERE file_no=$1 AND is_active AND NOT is_declined AND allocated AND client_type IN ('C','S')
          AND rate_type IS DISTINCT FROM 'C' RETURNING file_no`, [fileNo]);
      if (released.length) await txQuery(client, `UPDATE crm.business_work_items SET
        work_status=CASE WHEN queue_name=$2 THEN 'CANCELLED' ELSE 'COMPLETED' END,updated_at=NOW()
        WHERE file_no=$1 AND work_status='OPEN'`, [fileNo, "PRICING_REVIEW"]);
      return false;
    }
  }
  await txQuery(client, `UPDATE crm.business_work_items SET work_status='COMPLETED',updated_at=NOW()
    WHERE file_no=$1 AND work_status='OPEN' AND queue_name<>$2`, [fileNo, "PRICING_REVIEW"]);
  await txQuery(client, `INSERT INTO crm.business_work_items
    (file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by,forwarded_at)
    VALUES($1,$2,'OPEN',NULL,$3,$3,NOW()) ON CONFLICT(file_no,queue_name) DO UPDATE SET
    work_status='OPEN',assigned_to=NULL,assigned_by=EXCLUDED.assigned_by,
    forwarded_by=EXCLUDED.forwarded_by,forwarded_at=NOW(),updated_at=NOW()`, [fileNo, "PRICING_REVIEW", actor]);
  return true;
}
