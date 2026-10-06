import type { PoolClient } from "pg";
import { query, txQuery } from "./postgres";
import { MedicalError } from "./medical-underwriting";

export const cashierJoin = `JOIN crm.business_work_items cw ON cw.file_no=b.file_no
  AND cw.queue_name IN ('CASHIER','CREDIT_CONTROL')`;
export const cashierOwner = `(cw.assigned_to IS NULL OR cw.assigned_to=$1 OR $2::boolean)`;
export const cashierPending = `b.is_active AND NOT b.is_declined AND NOT b.receipted AND cw.work_status='OPEN'
  AND ((cw.queue_name='CASHIER' AND b.file_status='CASHIER')
    OR (cw.queue_name='CREDIT_CONTROL' AND b.file_status='PENDING PAYMENT'))`;
export const receiptRequirement = `r.is_active AND r.code=3 AND LOWER(TRIM(r.req_name))='system receipt'`;
export type CashierRecord = {
  file_no: string; updated_at: Date | string; invoice_no: string | null; invoiced: boolean;
  entered_by: string; forwarded_by: string; business: string; client_type: string;
  pay_ref_no: string | null; to_cashier_dt: Date | string | null; queue_name: string;
};
export async function cashierFile(fileNo: string, username: string, admin: boolean, client?: PoolClient) {
  if (client) await txQuery(client, `SELECT pg_advisory_xact_lock(hashtext($1))`, [fileNo]);
  const sql = `SELECT b.*,cw.assigned_to,cw.forwarded_by,cw.queue_name FROM crm.business_tracking b ${cashierJoin}
    WHERE b.file_no=$3 AND ${cashierPending} AND ${cashierOwner}${client ? ' FOR UPDATE OF b,cw' : ''}`;
  const [row] = client
    ? await txQuery<CashierRecord>(client, sql, [username, admin, fileNo])
    : await query<CashierRecord>(sql, [username, admin, fileNo]);
  if (!row) throw new MedicalError(client ? 409 : 404, "Cashier file is no longer pending or is assigned to another cashier.");
  return row;
}
export async function receiptExists(fileNo: string, client?: PoolClient) {
  const sql = `SELECT EXISTS(SELECT 1 FROM crm.business_uploads u JOIN crm.business_req r ON r.req_id=u.req_id
    JOIN crm.business_tracking b ON b.file_no=u.file_no WHERE u.file_no=$1 AND u.is_active
    AND u.filesize>0 AND ${receiptRequirement}
    AND (b.to_cashier_dt IS NULL OR u.uploaded_at>=b.to_cashier_dt)) AS exists`;
  const [row] = client ? await txQuery<{ exists: boolean }>(client, sql, [fileNo])
    : await query<{ exists: boolean }>(sql, [fileNo]);
  return row?.exists ?? false;
}
export async function membershipRecipient(username: string | null, client?: PoolClient) {
  if (!username) return null;
  const sql = `SELECT e.username FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE e.username=$1 AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active
    AND LOWER(TRIM(REGEXP_REPLACE(p.profile_name,'[[:space:]]+',' ','g')))
      IN ('bpo','bpo admin','bpo review','membership admin','superadmin','system admin')
    ${client ? 'FOR SHARE OF e,p' : ''}`;
  const [row] = client ? await txQuery<{ username: string }>(client, sql, [username])
    : await query<{ username: string }>(sql, [username]);
  return row?.username ?? null;
}
