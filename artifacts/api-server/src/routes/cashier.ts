import { Router } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { query, queryOne, txQuery, withTransaction } from "../lib/postgres";
import { MedicalError, medicalFailure } from "../lib/medical-underwriting";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { safeUploadFilename, uploadDocumentValidation } from "./business";
import { cashierFile, cashierJoin as join, cashierOwner as owner, cashierPending, membershipRecipient, receiptExists, receiptRequirement } from "../lib/cashier-review";

const router = Router();
const storage = new ObjectStorageService();
router.use("/cashier", requireAuth, async (req, res, next) => {
  try {
    const staff = await queryOne<{ username: string; profile_name: string }>(`SELECT e.username,p.profile_name
      FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id WHERE e.employee_id=$1
      AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active`, [req.user!.sub]);
    const role = staff?.profile_name.trim().toLowerCase();
    if (!staff || !["finance", "cashier", "superadmin", "system admin"].includes(role!)) {
      res.status(403).json({ ok: false, error: "Cashier Review requires Finance or Cashier access." }); return;
    }
    res.locals.cashierUsername = staff.username;
    res.locals.cashierAdmin = ["superadmin", "system admin"].includes(role!);
    next();
  } catch (err) { medicalFailure(res, err); }
});
router.get("/cashier", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
    if (!Number.isInteger(page)) throw new MedicalError(400, "Page must be a whole number.");
    const bucket = req.query.bucket ?? "inbox";
    if (bucket !== "inbox" && bucket !== "credit-control") throw new MedicalError(400, "Invalid Cashier bucket.");
    const filter = `${cashierPending} AND ${owner} AND cw.queue_name=$4
      AND (b.file_no ILIKE $3 OR b.proposer_name ILIKE $3 OR COALESCE(b.invoice_no,'') ILIKE $3)`;
    const params = [res.locals.cashierUsername, res.locals.cashierAdmin, `%${search}%`, bucket === "inbox" ? "CASHIER" : "CREDIT_CONTROL"];
    const [rows, count] = await Promise.all([
      query(`SELECT b.*,cw.assigned_to,cw.forwarded_by,cw.queue_name FROM crm.business_tracking b ${join} WHERE ${filter}
        ORDER BY cw.forwarded_at,b.file_no LIMIT 25 OFFSET $5`, [...params, (page - 1) * 25]),
      queryOne<{ total: string }>(`SELECT COUNT(*) AS total FROM crm.business_tracking b ${join} WHERE ${filter}`, params),
    ]);
    res.json({ ok: true, data: rows, total: Number(count?.total ?? 0), page, pageSize: 25 });
  } catch (err) { medicalFailure(res, err); }
});
router.get("/cashier/files/:fileNo", async (req, res) => {
  try {
    const fileNo = String(req.params.fileNo);
    const file = await cashierFile(fileNo, res.locals.cashierUsername, res.locals.cashierAdmin);
    const [notes, uploads, requirements, has_system_receipt, return_membership_to, related_payments, reviews] = await Promise.all([
      query(`SELECT note_id,note_from,notes,note_date FROM crm.business_tracking_notes
        WHERE file_no=$1 AND is_active ORDER BY note_date DESC,note_id DESC`, [fileNo]),
      query(`SELECT u.upload_id,u.filename,r.req_name,u.uploaded_by,u.uploaded_at FROM crm.business_uploads u
        JOIN crm.business_req r ON r.req_id=u.req_id WHERE u.file_no=$1 AND u.is_active ORDER BY u.uploaded_at DESC`, [fileNo]),
      query(`SELECT r.req_id,r.req_name FROM crm.business_req r WHERE ${receiptRequirement} ORDER BY r.req_id`),
      receiptExists(fileNo),
      membershipRecipient(file.forwarded_by),
      file.pay_ref_no ? query(`SELECT file_no,proposer_name,premium,paid_amt,paid_status FROM crm.business_tracking
        WHERE pay_ref_no=$1 AND is_active ORDER BY receive_dt DESC LIMIT 50`, [file.pay_ref_no]) : [],
      query(`SELECT * FROM crm.cashier_reviews WHERE file_no=$1 ORDER BY reviewed_at DESC,review_id DESC`, [fileNo]),
    ]);
    res.json({ ok: true, data: { file, notes, uploads, requirements, has_system_receipt, return_membership_to, related_payments, reviews } });
  } catch (err) { medicalFailure(res, err); }
});
router.get("/cashier/files/:fileNo/uploads/:uploadId/download", async (req, res) => {
  try {
    const fileNo = String(req.params.fileNo);
    await cashierFile(fileNo, res.locals.cashierUsername, res.locals.cashierAdmin);
    const id = Number(req.params.uploadId);
    if (!Number.isSafeInteger(id) || id < 1) throw new MedicalError(400, "Invalid document.");
    const upload = await queryOne<{ storage_key: string; filename: string }>(
      `SELECT storage_key,filename FROM crm.business_uploads WHERE file_no=$1 AND upload_id=$2 AND is_active`, [fileNo, id]);
    if (!upload) throw new MedicalError(404, "Document not found.");
    const response = await storage.downloadObject(await storage.getObjectEntityFile(upload.storage_key));
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Disposition", `attachment; filename="${safeUploadFilename(upload.filename)}"`);
    if (response.body) Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    else res.end();
  } catch (err) {
    if (err instanceof ObjectNotFoundError) { res.status(404).json({ ok: false, error: "Document bytes not found." }); return; }
    medicalFailure(res, err);
  }
});
const reviewSchema = z.object({
  action: z.enum(["M", "RM", "RI", "CC"]),
  paid_status: z.enum(["FULL-PAID", "PART-PAID", "NOT-PAID"]),
  comments: z.string().trim().min(1, "Short notes are required.").max(250),
  receipt_no: z.string().trim().max(50).optional(),
  expected_updated_at: z.string().datetime({ offset: true }),
});
router.post("/cashier/files/:fileNo/review", async (req, res) => {
  try {
    const input = reviewSchema.parse(req.body);
    const fileNo = String(req.params.fileNo);
    const actor = res.locals.cashierUsername;
    const result = await withTransaction(async client => {
      const file = await cashierFile(fileNo, actor, res.locals.cashierAdmin, client);
      if (new Date(file.updated_at).getTime() !== new Date(input.expected_updated_at).getTime())
        throw new MedicalError(409, "This file changed. Refresh before saving the Cashier review.");
      if (input.action === "M") {
        if (!file.invoiced || !file.invoice_no?.trim()) throw new MedicalError(400, "An invoice is required before receipting.");
        if (!input.receipt_no) throw new MedicalError(400, "Enter the receipt number.");
        if (input.paid_status === "NOT-PAID") throw new MedicalError(400, "Receipting requires FULL-PAID or PART-PAID.");
        if (!await receiptExists(fileNo, client)) throw new MedicalError(400, "Upload a System Receipt for this Cashier handoff before receipting.");
      }
      if (input.action === "CC" && input.paid_status === "FULL-PAID")
        throw new MedicalError(400, "Credit Control requires an outstanding payment.");
      const membership = input.action === "RM" ? await membershipRecipient(file.forwarded_by, client) : null;
      if (input.action === "RM" && !membership)
        throw new MedicalError(400, "The original allocation sender cannot receive Allocation Files. An administrator must correct the assignment.");
      const fullReceipt = input.action === "M" && input.paid_status === "FULL-PAID";
      const credit = input.action === "CC" || (input.action === "M" && !fullReceipt);
      const status = fullReceipt ? (file.business === "N" ? "FILING" : "RECEIPTED")
        : credit ? "PENDING PAYMENT" : input.action === "RM" ? "ALLOCATED" : "RETURNED-INCOMPLETE";
      const queue = credit ? "CREDIT_CONTROL" : input.action === "RI" ? "REGISTER_CORRECTION" : null;
      await txQuery(client, `UPDATE crm.business_work_items SET work_status='COMPLETED',updated_at=NOW()
        WHERE file_no=$1 AND work_status='OPEN'`, [fileNo]);
      if (queue) await txQuery(client, `INSERT INTO crm.business_work_items
        (file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by,forwarded_at)
        VALUES($1,$2,'OPEN',$3,$4,$4,NOW()) ON CONFLICT(file_no,queue_name) DO UPDATE SET
          work_status='OPEN',assigned_to=EXCLUDED.assigned_to,assigned_by=EXCLUDED.assigned_by,
          forwarded_by=EXCLUDED.forwarded_by,forwarded_at=NOW(),updated_at=NOW()`,
        [fileNo, queue, input.action === "RI" ? file.entered_by : null, actor]);
      // Credit Control retains the original sender for a subsequent membership return.
      if (credit) await txQuery(client, `UPDATE crm.business_work_items SET forwarded_by=$2
        WHERE file_no=$1 AND queue_name='CREDIT_CONTROL'`, [fileNo, file.forwarded_by]);
      await txQuery(client, `UPDATE crm.business_tracking SET file_status=$2,paid_status=$3::varchar,
        paid=($3::varchar='FULL-PAID'),receipted=$4,cashier_by=$5,
        receipt_no=CASE WHEN $6::boolean THEN $7::varchar ELSE receipt_no END,
        receipt_date=CASE WHEN $6::boolean THEN NOW() ELSE receipt_date END,
        allocated=$8,allocated_to=$9,allocate_dt=CASE WHEN $8::boolean THEN NOW() ELSE NULL END,
        benefit_verified=CASE WHEN $8::boolean THEN 'YES' ELSE benefit_verified END,
        forwarded=CASE WHEN $10::boolean THEN FALSE ELSE forwarded END,
        is_complete=CASE WHEN $10::boolean THEN FALSE ELSE is_complete END,
        ready_for_update=NOT $10::boolean,updated_at=NOW() WHERE file_no=$1`,
        [fileNo, status, input.paid_status, fullReceipt, actor, input.action === "M",
          input.receipt_no ?? null, input.action === "RM", membership, input.action === "RI"]);
      await txQuery(client, `INSERT INTO crm.cashier_reviews(file_no,action,paid_status,invoice_no,receipt_no,comments,reviewed_by)
        VALUES($1,$2,$3,$4,$5,$6,$7)`, [fileNo, input.action, input.paid_status, file.invoice_no,
          input.action === "M" ? input.receipt_no : null, input.comments, actor]);
      await txQuery(client, `INSERT INTO crm.business_tracking_notes(file_no,note_from,notes)
        VALUES($1,$2,$3)`, [fileNo, actor, `Cashier ${input.action} → ${status}; payment ${input.paid_status}${input.action === "M" ? `; receipt ${input.receipt_no}` : ""}: ${input.comments}`]);
      await txQuery(client, `INSERT INTO crm.admin_audit_trail(username,action_type,description)
        VALUES($1,$2,$3)`, [actor, `BT_CASHIER_${input.action}`, `${fileNo}: Cashier → ${status}; invoice ${file.invoice_no ?? "none"}; ${input.comments}`]);
      return { file_status: status, queue_name: queue };
    });
    res.json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ ok: false, error: err.issues[0]?.message }); return; }
    medicalFailure(res, err);
  }
});
const uploadSchema = z.object({
  req_id: z.number().int().positive(), filename: z.string().min(1).max(255),
  filesize: z.number().int().positive().max(10 * 1024 * 1024), mime_type: z.string().max(200),
  storage_key: z.string().regex(/^\/objects\/uploads\/[a-zA-Z0-9-]+$/),
});
router.post("/cashier/files/:fileNo/uploads", async (req, res) => {
  try {
    const input = uploadSchema.parse(req.body);
    const fileNo = String(req.params.fileNo);
    const result = await withTransaction(async client => {
      await cashierFile(fileNo, res.locals.cashierUsername, res.locals.cashierAdmin, client);
      const [requirement] = await txQuery(client, `SELECT r.req_id FROM crm.business_req r WHERE r.req_id=$1 AND ${receiptRequirement}`, [input.req_id]);
      if (!requirement) throw new MedicalError(400, "Select the active System Receipt requirement.");
      const filename = safeUploadFilename(input.filename);
      const invalid = uploadDocumentValidation({ filename, filesize: input.filesize, reqName: "System Receipt" });
      if (invalid) throw new MedicalError(400, invalid);
      const object = await storage.getObjectEntityFile(input.storage_key);
      const [metadata] = await object.getMetadata();
      if (Number(metadata.size) !== input.filesize) throw new MedicalError(400, "Receipt size does not match the stored document.");
      const [row] = await txQuery<{ upload_id: number }>(client, `INSERT INTO crm.business_uploads
        (file_no,req_id,filename,filesize,mime_type,storage_key,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7)
        RETURNING upload_id`, [fileNo, input.req_id, filename, input.filesize, input.mime_type, input.storage_key, res.locals.cashierUsername]);
      await txQuery(client, `UPDATE crm.business_doc_checklist SET upload_id=$3,acknowledged_by=$4,acknowledged_at=NOW()
        WHERE file_no=$1 AND req_id=$2 AND is_selected`, [fileNo, input.req_id, row.upload_id, res.locals.cashierUsername]);
      await txQuery(client, `UPDATE crm.business_tracking SET updated_at=NOW() WHERE file_no=$1`, [fileNo]);
      return row;
    });
    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ ok: false, error: err.issues[0]?.message }); return; }
    if (err instanceof ObjectNotFoundError) { res.status(400).json({ ok: false, error: "Receipt bytes were not uploaded." }); return; }
    medicalFailure(res, err);
  }
});
export default router;
