import { getPool, sql } from "./sqlserver";
import { logger } from "./logger";

export interface AllocatedRefund {
  refund_id: number | null;
  refund_no: string | null;
  file_no: string | null;
  amount_paid: number | null;
  refund_amount: number | null;
  payee_name: string | null;
  payee_email: string | null;
  payee_mobile: string | null;
  refund_status: string | null;
  refund_type: string | null;
  request_dt: string | null;
  allocate_dt: string | null;
  allocate_to: string | null;
  entered_by: string | null;
  client_type: string | null;
}

export interface AllocatedRefundLedger {
  available: boolean;
  source: "legacy-crm" | "unavailable";
  records: AllocatedRefund[];
  message?: string;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function mapRefund(row: Record<string, unknown>): AllocatedRefund {
  return {
    refund_id: nullableNumber(row.refund_id),
    refund_no: nullableString(row.refund_no),
    file_no: nullableString(row.file_no),
    amount_paid: nullableNumber(row.amount_paid),
    refund_amount: nullableNumber(row.refund_amount),
    payee_name: nullableString(row.payee_name),
    payee_email: nullableString(row.payee_email),
    payee_mobile: nullableString(row.payee_mobile),
    refund_status: nullableString(row.refund_status),
    refund_type: nullableString(row.refund_type),
    request_dt: nullableString(row.request_dt),
    allocate_dt: nullableString(row.allocate_dt),
    allocate_to: nullableString(row.allocate_to),
    entered_by: nullableString(row.entered_by),
    client_type: nullableString(row.client_type),
  };
}

/**
 * Read the legacy CRM refund ledger without allowing it to affect the
 * PostgreSQL allocation queue. The legacy page's filters are intentionally
 * preserved: requested, allocated, unprocessed, and active refunds only.
 * This read deliberately does not use the legacy page's NOLOCK hint because
 * refund values must not be displayed from an uncommitted financial update.
 */
export async function getAllocatedRefundLedger(
  allocatedTo: string,
  isSuperAdmin: boolean,
): Promise<AllocatedRefundLedger> {
  try {
    const pool = await getPool("CRM");
    const request = pool.request();

    if (!isSuperAdmin) {
      request.input("allocatedTo", sql.VarChar(100), allocatedTo);
    }

    const result = await request.query(`
      SELECT
        [Refund_Id] AS refund_id,
        [Refund_No] AS refund_no,
        [File_No] AS file_no,
        [Amount_Paid] AS amount_paid,
        [Refund_Amt] AS refund_amount,
        [Payee_Name] AS payee_name,
        [Payee_eMail] AS payee_email,
        [Payee_Mobile] AS payee_mobile,
        [Refund_Status] AS refund_status,
        [Refund_Type] AS refund_type,
        [Request_Dt] AS request_dt,
        [Allocate_Dt] AS allocate_dt,
        [Allocate_To] AS allocate_to,
        [Entered_By] AS entered_by,
        [Client_Type] AS client_type
      FROM [dbo].[TBL_MIS_BUSINESS_TRACKING_REFUNDS]
      WHERE [Requested] = 1
        AND [Allocated] = 1
        AND [Processed] = 0
        AND [Is_Active] = 1
        ${isSuperAdmin ? "" : "AND [Allocate_To] = @allocatedTo"}
      ORDER BY [Allocate_Dt] ASC, [Refund_No] ASC
    `);

    return {
      available: true,
      source: "legacy-crm",
      records: (result.recordset as Record<string, unknown>[]).map(mapRefund),
    };
  } catch (err: unknown) {
    logger.warn({ err }, "Authoritative CRM refund ledger unavailable");
    return {
      available: false,
      source: "unavailable",
      records: [],
      message: "The authoritative refund ledger is temporarily unavailable.",
    };
  }
}