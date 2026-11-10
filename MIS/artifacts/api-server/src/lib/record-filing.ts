import type { Response } from "express";
import { queryOne, txQuery } from "./postgres";
import type { PoolClient } from "pg";
import { logger } from "./logger";

// Receipting sets receipted only on full payment; Allocation Files marks its
// Closed action with the CLOSED status. Either outcome hands off to DPU.
export const filingPending = `b.is_active AND NOT b.is_declined AND NOT b.filed
  AND b.file_status<>'FILED'
  AND (b.receipted OR b.file_status='CLOSED')`;
export class FilingError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function filingFailure(res: Response, err: unknown) {
  if (err instanceof FilingError) {
    res.status(err.status).json({ ok: false, error: err.message });
  } else {
    logger.error({ err }, "Record Filing failed");
    res.status(500).json({ ok: false, error: "Unable to complete the Record Filing request." });
  }
}
export type FilingRecord = {
  file_no: string; file_status: string; reviewable: boolean; filed: boolean;
  entered_by: string | null; allocated_to: string | null; updated_at: Date | string;
};
export async function filingFile(fileNo: string, client?: PoolClient): Promise<FilingRecord> {
  const sql = `SELECT b.*,(${filingPending}) AS reviewable FROM crm.business_tracking b
    WHERE b.file_no=$1 AND b.is_active ${client ? "FOR UPDATE OF b" : ""}`;
  const file = client
    ? (await txQuery<FilingRecord>(client, sql, [fileNo]))[0]
    : await queryOne<FilingRecord>(sql, [fileNo]);
  if (!file || !(file.reviewable || file.filed || file.file_status === "FILED")) {
    throw new FilingError(404, "Record is not available in Record Filing.");
  }
  return file;
}
