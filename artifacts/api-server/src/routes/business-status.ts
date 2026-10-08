import { Router, type Response } from "express";
import { Readable } from "node:stream";
import { query, queryOne } from "../lib/postgres";
import { requireAuth } from "../lib/auth-middleware";
import { logger } from "../lib/logger";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";
import { safeUploadFilename } from "./business";
import {
  requireStatusAccess, STATUS_SCOPE_SQL, STATUS_RECORD_SQL, statusScopeParams,
  publicStatusFile, canViewStatusDetails, type StatusActor, type StatusRecord,
} from "../lib/business-status-access";

const router = Router();
router.use("/business-status", requireAuth, requireStatusAccess);
router.use("/business-status", (_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});
class StatusError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function fail(res: Response, err: unknown) {
  if (res.headersSent) { res.destroy(); return; }
  if (err instanceof StatusError) {
    res.status(err.status).json({ ok: false, error: err.message }); return;
  }
  if (err instanceof ObjectNotFoundError) {
    res.status(404).json({ ok: false, error: "Document bytes are unavailable." }); return;
  }
  logger.error({ err }, "Business status query failed");
  res.status(500).json({ ok: false, error: "Unable to load business status." });
}
async function accessibleFile(actor: StatusActor, fileNo: unknown) {
  if (typeof fileNo !== "string" || !fileNo.trim() || fileNo.length > 128)
    throw new StatusError(400, "A valid file number is required.");
  const file = await queryOne<StatusRecord>(`${STATUS_RECORD_SQL}
    WHERE ${STATUS_SCOPE_SQL} AND b.file_no=$5::varchar`, [...statusScopeParams(actor), fileNo]);
  if (!file) throw new StatusError(404, "Business record not found in your permitted view.");
  return file;
}
function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error("Invalid numeric business metadata");
  return result;
}

router.get("/business-status/options", async (_req, res) => {
  try {
    const actor = res.locals.statusActor as StatusActor;
    const rows = await query<{ file_status: string; business_type: string }>(
      `SELECT DISTINCT b.file_status,b.business_type FROM crm.business_tracking b
       WHERE ${STATUS_SCOPE_SQL} ORDER BY b.file_status,b.business_type`, statusScopeParams(actor));
    res.json({ ok: true, data: {
      statuses: [...new Set(rows.map(r => r.file_status))],
      businessTypes: [...new Set(["N", "R", "A", "T", "RT", "CC", "PR", ...rows.map(r => r.business_type)])],
      scopeLabel: actor.scopeLabel,
    } });
  } catch (err) { fail(res, err); }
});

router.get("/business-status", async (req, res) => {
  try {
    const actor = res.locals.statusActor as StatusActor;
    const value = (key: string, max: number) => {
      const v = req.query[key];
      if (v === undefined) return "";
      if (typeof v !== "string" || v.length > max) throw new StatusError(400, `Invalid ${key} filter.`);
      return v.trim();
    };
    const search = value("search", 150), searchBy = value("search_by", 1) || "F";
    const type = value("business_type", 8), client = value("client_type", 1);
    const status = value("status", 80), completed = value("include_completed", 5);
    const rawPage = value("page", 8) || "1";
    if (!["F", "P"].includes(searchBy) || type && !/^[A-Z][A-Z0-9-]{0,7}$/.test(type)
      || client && !["R", "C", "S"].includes(client)
      || !["", "true", "false"].includes(completed)
      || !/^[1-9][0-9]*$/.test(rawPage))
      throw new StatusError(400, "Invalid business status filters.");
    const page = Number(rawPage), pageSize = 25;
    if (page > 1_000_000) throw new StatusError(400, "The requested page is out of range.");
    const params = statusScopeParams(actor), conditions = [STATUS_SCOPE_SQL];
    const add = (expression: string, v: string) => {
      params.push(v); conditions.push(`${expression} $${params.length}::varchar`);
    };
    if (completed !== "true")
      conditions.push("NOT COALESCE(b.filed,FALSE) AND b.file_status NOT IN ('FILED','UPDATED & DISPATCHED')");
    if (search) add(searchBy === "F" ? "b.file_no ILIKE" : "b.proposer_name ILIKE", `%${search}%`);
    if (type) add("b.business_type =", type);
    if (client) add("b.client_type =", client);
    if (status) add("b.file_status =", status);
    const where = conditions.join(" AND ");
    const [rows, count] = await Promise.all([
      query<StatusRecord>(`${STATUS_RECORD_SQL} WHERE ${where}
        ORDER BY b.updated_at DESC,b.file_no ASC LIMIT 25 OFFSET $${params.length + 1}::integer`,
      [...params, (page - 1) * pageSize]),
      queryOne<{ total: string }>(`SELECT COUNT(*)::text AS total FROM crm.business_tracking b
        WHERE ${where}`, params),
    ]);
    res.json({ ok: true, data: rows.map(r => publicStatusFile(r, actor)),
      total: Number(count?.total ?? 0), page, pageSize, scopeLabel: actor.scopeLabel });
  } catch (err) { fail(res, err); }
});

router.get("/business-status/files/:fileNo", async (req, res) => {
  try {
    const actor = res.locals.statusActor as StatusActor;
    const file = await accessibleFile(actor, req.params.fileNo);
    const allowed = canViewStatusDetails(actor, file);
    const [movements, notes, documents] = await Promise.all([
      query(`SELECT w.work_item_id,w.queue_name,w.work_status,w.assigned_to,
        e.employee_name AS assigned_name,w.assigned_by,w.forwarded_by,w.forwarded_at,w.created_at,w.updated_at
        FROM crm.business_work_items w LEFT JOIN crm.employees e ON e.username=w.assigned_to
        WHERE w.file_no=$1 ORDER BY w.created_at ASC,w.work_item_id ASC`, [file.file_no]),
      allowed ? query(`SELECT note_id,note_from,note_date,notes
        FROM crm.business_tracking_notes WHERE file_no=$1 ORDER BY note_date DESC,note_id DESC`,
      [file.file_no]) : Promise.resolve([]),
      allowed ? query(`SELECT u.upload_id,u.filename,u.filesize,u.mime_type,u.uploaded_by,u.uploaded_at,
        u.invoice_no,u.amount,u.policy_code,u.risk_rate,u.risk_reason,r.req_name,r.code::text AS code
        FROM crm.business_uploads u LEFT JOIN crm.business_req r ON r.req_id=u.req_id
        WHERE u.file_no=$1 AND u.is_active ORDER BY u.uploaded_at DESC,u.upload_id DESC`,
      [file.file_no]) : Promise.resolve([]),
    ]);
    res.json({ ok: true, data: {
      file: publicStatusFile(file, actor), movements, notes,
      documents: documents.map(d => ({ ...d, amount: numberOrNull(d.amount) })),
      financial: allowed ? {
        premium: numberOrNull(file.premium), paid_amt: numberOrNull(file.paid_amt),
        pay_ref_no: file.pay_ref_no, paid_status: file.paid_status,
        invoice_no: file.invoice_no, invoice_date: file.invoice_date,
        receipt_no: file.receipt_no, receipt_date: file.receipt_date,
      } : null,
      restriction_reason: allowed ? null
        : "Status and handoff history are visible. Notes, financial details and documents are restricted to the current responsible user/team or an administrator.",
    } });
  } catch (err) { fail(res, err); }
});

router.get("/business-status/files/:fileNo/documents/:uploadId/download", async (req, res) => {
  try {
    const actor = res.locals.statusActor as StatusActor;
    const file = await accessibleFile(actor, req.params.fileNo);
    if (!canViewStatusDetails(actor, file))
      throw new StatusError(403, "Document access is restricted to the current responsible user/team.");
    const rawId = String(req.params.uploadId);
    if (!/^[1-9][0-9]*$/.test(rawId) || !Number.isSafeInteger(Number(rawId)))
      throw new StatusError(400, "A valid document ID is required.");
    const upload = await queryOne<{ storage_key: string; filename: string; mime_type: string | null }>(
      `SELECT storage_key,filename,mime_type FROM crm.business_uploads
       WHERE upload_id=$1 AND file_no=$2 AND is_active`, [Number(rawId), file.file_no]);
    if (!upload) throw new StatusError(404, "Document not found.");
    const service = new ObjectStorageService();
    const response = await service.downloadObject(await service.getObjectEntityFile(upload.storage_key));
    if (!response.ok || !response.body) throw new StatusError(502, "Document storage is unavailable.");
    res.setHeader("Content-Type", upload.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${safeUploadFilename(upload.filename)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    Readable.fromWeb(response.body as never).on("error", () => res.destroy()).pipe(res);
  } catch (err) { fail(res, err); }
});
export default router;
