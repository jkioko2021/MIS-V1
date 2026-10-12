import { AML_ORIGINATING_SYSTEMS } from "../lib/aml-systems";
import { Router } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { query, txQuery, withTransaction } from "../lib/postgres";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/document-storage";
import { MedicalError, medicalFile, medicalFailure, requireMedicalAccess, assertReviewable, medJoin, medPending, medOwner } from "../lib/medical-underwriting";
import { safeUploadFilename, uploadDocumentValidation } from "./business";
import { queueMedicalNotification } from "../lib/business-notifications";
import { queueCorporatePricing } from "../lib/pricing-review";

const router = Router();
router.use("/medical-underwriting", requireAuth, requireMedicalAccess);
const storage = new ObjectStorageService();
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const reviewSchema = z.object({
  action: z.enum(["C", "F", "RI", "H", "D"]),
  comments: z.string().trim().min(1, "Review notes are required.").max(250),
  hpc: z.boolean(), lateral_movement: z.boolean(),
  expected_updated_at: z.string().datetime({ offset: true }),
  invoice_no: optionalText(25),
  paid_status: z.enum(["FULL", "PART", "NOT-PAID", ""]).optional().default(""),
});
const validDate = z.string().refine(value => {
  if (!value) return true;
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}, "Enter a valid date.");
const hpcSchema = z.object({
  member_no: z.string().trim().min(1).max(100), member_name: z.string().trim().min(1).max(200),
  proposer_name: z.string().trim().min(1).max(200), client_type: z.enum(["R", "C"]),
  condition: z.string().trim().min(1).max(4000), disease_code: optionalText(100),
  diagnosed_date: validDate.optional().default(""), mobile: optionalText(40),
  email: z.union([z.string().email().max(254), z.literal("")]).optional().default(""),
  source: optionalText(200), followup_date: validDate.optional().default(""), notes: optionalText(4000),
});
const uploadSchema = z.object({
  req_id: z.number().int().positive(), filename: z.string().min(1).max(255),
  filesize: z.number().int().positive().max(10 * 1024 * 1024),
  mime_type: z.string().max(200), storage_key: z.string().regex(/^\/objects\/uploads\/[a-zA-Z0-9-]+$/),
  invoice_no: optionalText(25), amount: optionalText(50), policy_code: optionalText(100),
  risk_rate: optionalText(20), risk_reason: optionalText(4000),
  originating_system: z.enum(AML_ORIGINATING_SYSTEMS).optional(),
});
const fileNoOf = (value: string | string[]) => Array.isArray(value) ? value[0]! : value;

router.get("/medical-underwriting", async (req, res) => {
  try {
    const queue = req.query.queue ?? "pending";
    if (!["pending", "hold", "declined", "reverted"].includes(String(queue))) throw new MedicalError(400, "Choose a valid queue.");
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
    if (!Number.isInteger(page)) throw new MedicalError(400, "Page must be a whole number.");
    const predicate = queue === "reverted" ? "b.mu_revert=TRUE"
      : queue === "declined" ? "b.medical_uw AND b.is_declined AND b.file_status='DECLINED'"
      : queue === "hold" ? `NOT b.is_declined AND b.file_status='ON HOLD' AND ${medPending}`
      : `NOT b.is_declined AND b.file_status<>'ON HOLD' AND ${medPending}`;
    const filter = `b.is_active AND ${predicate} AND ${medOwner}
      AND (b.file_no ILIKE $3 OR b.proposer_name ILIKE $3 OR COALESCE(b.family_code,'') ILIKE $3)`;
    const params = [res.locals.medUsername, res.locals.medAdmin, `%${search}%`];
    const [rows, count] = await Promise.all([
      query(`SELECT b.*,mw.assigned_to,(NOT b.is_declined AND ${medPending}) AS reviewable
        FROM crm.business_tracking b ${medJoin} WHERE ${filter}
        ORDER BY b.receive_dt,b.file_no LIMIT 25 OFFSET $4`, [...params, (page - 1) * 25]),
      query<{ total: string }>(`SELECT COUNT(*) AS total FROM crm.business_tracking b ${medJoin} WHERE ${filter}`, params),
    ]);
    res.json({ ok: true, data: rows, total: Number(count[0]?.total ?? 0), page, pageSize: 25 });
  } catch (err) { medicalFailure(res, err); }
});
router.get("/medical-underwriting/files/:fileNo", async (req, res) => {
  try {
    const fileNo = fileNoOf(req.params.fileNo);
    const file = await medicalFile(fileNo, res.locals.medUsername, res.locals.medAdmin);
    const [notes, uploads, reviews, requirements, hpc] = await Promise.all([
      query(`SELECT note_id,note_from,notes,note_date FROM crm.business_tracking_notes WHERE file_no=$1 AND is_active ORDER BY note_date DESC`, [fileNo]),
      query(`SELECT u.upload_id,u.filename,u.uploaded_by,u.uploaded_at,u.invoice_no,u.amount,u.policy_code,r.req_name
        FROM crm.business_uploads u JOIN crm.business_req r ON r.req_id=u.req_id
        WHERE u.file_no=$1 AND u.is_active ORDER BY u.uploaded_at DESC`, [fileNo]),
      query(`SELECT * FROM crm.medical_underwriting_reviews WHERE file_no=$1 ORDER BY reviewed_at DESC`, [fileNo]),
      query(`SELECT req_id,req_name FROM crm.business_req WHERE is_active AND applies_to IN ('ALL',$1) ORDER BY req_name,req_id`, [file.client_type === "R" ? "R" : "C"]),
      query(`SELECT * FROM crm.medical_hpc_registrations WHERE file_no=$1 ORDER BY registered_at DESC`, [fileNo]),
    ]);
    let reviewable = true;
    try { assertReviewable(file); } catch { reviewable = false; }
    res.json({ ok: true, data: { file: { ...file, reviewable }, notes, uploads, reviews, requirements, hpc } });
  } catch (err) { medicalFailure(res, err); }
});
router.post("/medical-underwriting/files/:fileNo/review", async (req, res) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) throw new MedicalError(400, parsed.error.issues[0]?.message ?? "Invalid review.");
    const input = parsed.data;
    if (input.action === "C" && (!input.invoice_no || !input.paid_status))
      throw new MedicalError(400, "Cashier requires an invoice number and payment status.");
    const fileNo = fileNoOf(req.params.fileNo);
    const actor = res.locals.medUsername as string;
    const result = await withTransaction(async client => {
      const file = await medicalFile(fileNo, actor, res.locals.medAdmin, client);
      assertReviewable(file);
      if (new Date(file.updated_at).getTime() !== new Date(input.expected_updated_at).getTime())
        throw new MedicalError(409, "The file changed since you opened it. Refresh before reviewing.");
      let allocationRecipient: string | null = null;
      if (input.action === "F" && file.allocated_to) {
        const staff = await txQuery(client, `SELECT e.username FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
          WHERE e.username=$1 AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted
          AND e.department='BPO' AND p.is_active
          AND LOWER(TRIM(p.profile_name)) IN ('bpo','bpo admin','bpo review') FOR SHARE OF e,p`, [file.allocated_to]);
        if (staff.length) allocationRecipient = file.allocated_to;
      }
      const returningToBpo = input.action === "F" && !allocationRecipient;
      const corporatePricing = input.action === "F" && !!allocationRecipient
        && ["C", "S"].includes(file.client_type) && file.rate_type === "C" && file.benefit_verified !== "YES";
      const status = corporatePricing ? "BENEFIT VERIFICATION"
        : returningToBpo ? "FORWARDED"
        : { C: "CASHIER", F: "ALLOCATED", RI: "RETURNED-INCOMPLETE", H: "ON HOLD", D: "DECLINED" }[input.action];
      const queue = returningToBpo ? (file.client_type === "R" ? "BPO_REVIEW_RETAIL" : "BPO_REVIEW_CORPORATE_SME")
        : input.action === "C" ? "CASHIER" : input.action === "RI" ? "REGISTER_CORRECTION" : null;
      const assignee = input.action === "F" ? allocationRecipient : input.action === "RI" ? file.entered_by : null;
      if (input.action !== "H") {
        await txQuery(client, `UPDATE crm.business_work_items SET work_status='COMPLETED',updated_at=NOW() WHERE file_no=$1 AND work_status='OPEN'`, [fileNo]);
        await txQuery(client, `INSERT INTO crm.business_work_items
          (file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by)
          VALUES($1,'MEDICAL_UNDERWRITING','COMPLETED',$2,$2,$2)
          ON CONFLICT(file_no,queue_name) DO UPDATE SET work_status='COMPLETED',updated_at=NOW()`,[fileNo,actor]);
      } else {
        await txQuery(client, `INSERT INTO crm.business_work_items (file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by)
          VALUES ($1,'MEDICAL_UNDERWRITING','OPEN',$2,$2,$2) ON CONFLICT(file_no,queue_name) DO UPDATE SET
          work_status='OPEN',assigned_to=COALESCE(crm.business_work_items.assigned_to,EXCLUDED.assigned_to),updated_at=NOW()`, [fileNo, actor]);
      }
      if (queue) {
        await txQuery(client, `INSERT INTO crm.business_work_items (file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by,forwarded_at)
          VALUES($1,$2,'OPEN',$3,$4,$4,NOW()) ON CONFLICT(file_no,queue_name) DO UPDATE SET
          work_status='OPEN',assigned_to=EXCLUDED.assigned_to,assigned_by=EXCLUDED.assigned_by,
          forwarded_by=EXCLUDED.forwarded_by,forwarded_at=NOW(),updated_at=NOW()`, [fileNo, queue, assignee, actor]);
      }
      await txQuery(client, `UPDATE crm.business_tracking SET file_status=$2,mu_revert=$3,lateral_movement=$4,
        medical_uw=TRUE,is_declined=($5='D'),allocated=($5='F' AND $6::varchar IS NOT NULL),
        allocated_to=CASE WHEN $5='H' THEN allocated_to ELSE $6::varchar END,
        allocate_dt=CASE WHEN $5='F' AND $6::varchar IS NOT NULL THEN COALESCE(allocate_dt,NOW())
          WHEN $5='H' THEN allocate_dt ELSE NULL END,
        ready_for_update=($5='C' OR ($5='F' AND $6::varchar IS NOT NULL)),
        forwarded=CASE WHEN $5='RI' THEN FALSE WHEN $5='F' THEN TRUE ELSE forwarded END,
        is_complete=CASE WHEN $5='RI' THEN FALSE ELSE is_complete END,
        invoice_no=CASE WHEN $5='C' THEN $7 ELSE invoice_no END,
        paid_status=CASE WHEN $5='C' THEN $8 ELSE paid_status END,
        paid=CASE WHEN $5='C' THEN $8 IN ('FULL','PART') ELSE paid END,updated_at=NOW() WHERE file_no=$1`,
      [fileNo, status, input.hpc, input.lateral_movement, input.action, input.action === "F" ? assignee : null, input.invoice_no, input.paid_status]);
      if (corporatePricing) await queueCorporatePricing(client, fileNo, actor);
      const [review] = await txQuery<{ review_id: number }>(client, `INSERT INTO crm.medical_underwriting_reviews
        (file_no,action,comments,hpc,lateral_movement,destination,invoice_no,paid_status,reviewed_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING review_id`,
      [fileNo, input.action, input.comments, input.hpc, input.lateral_movement, assignee ?? queue ?? status, input.invoice_no || null, input.paid_status || null, actor]);
      await txQuery(client, `INSERT INTO crm.business_tracking_notes(file_no,note_from,notes) VALUES($1,$2,$3)`, [fileNo, actor, input.comments]);
      await txQuery(client, `INSERT INTO crm.admin_audit_trail(username,action_type,description) VALUES($1,'MEDICAL_UW_REVIEW',$2)`,
        [actor, `${fileNo}: ${input.action} → ${status}. ${input.comments}`]);
      const notification = input.action === "RI" || input.action === "D"
        ? await queueMedicalNotification(client, fileNo, review!.review_id, file.entered_by, input.action, input.comments)
        : undefined;
      return { file_status: status, notification };
    });
    res.json({ ok: true, data: result });
  } catch (err) { medicalFailure(res, err); }
});
router.post("/medical-underwriting/files/:fileNo/hpc", async (req, res) => {
  try {
    const parsed = hpcSchema.safeParse(req.body);
    if (!parsed.success) throw new MedicalError(400, parsed.error.issues[0]?.message ?? "Invalid HPC registration.");
    const input = parsed.data;
    const fileNo = fileNoOf(req.params.fileNo);
    const actor = res.locals.medUsername as string;
    const result = await withTransaction(async client => {
      const file = await medicalFile(fileNo, actor, res.locals.medAdmin, client);
      if (file.is_declined && !file.mu_revert) throw new MedicalError(409, "This declined file is read-only.");
      const [record] = await txQuery(client, `INSERT INTO crm.medical_hpc_registrations
        (file_no,member_no,member_name,proposer_name,client_type,condition,disease_code,diagnosed_date,mobile,email,source,followup_date,notes,registered_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING hpc_id`,
      [fileNo, input.member_no, input.member_name, input.proposer_name, input.client_type, input.condition,
        input.disease_code || null, input.diagnosed_date || null, input.mobile || null, input.email || null,
        input.source || null, input.followup_date || null, input.notes || null, actor]);
      await txQuery(client, `UPDATE crm.business_tracking SET mu_revert=FALSE,updated_at=NOW() WHERE file_no=$1`, [fileNo]);
      await txQuery(client, `INSERT INTO crm.admin_audit_trail(username,action_type,description)
        VALUES($1,'MEDICAL_UW_HPC',$2)`, [actor, `HPC registration recorded for ${fileNo}`]);
      return record;
    });
    res.status(201).json({ ok: true, data: result });
  } catch (err) { medicalFailure(res, err); }
});
router.post("/medical-underwriting/files/:fileNo/uploads", async (req, res) => {
  try {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) throw new MedicalError(400, parsed.error.issues[0]?.message ?? "Invalid document.");
    const input = parsed.data;
    const fileNo = fileNoOf(req.params.fileNo);
    const result = await withTransaction(async client => {
      const file = await medicalFile(fileNo, res.locals.medUsername, res.locals.medAdmin, client);
      assertReviewable(file);
      const [requirement] = await txQuery<{ req_name: string }>(client,
        `SELECT req_name FROM crm.business_req WHERE req_id=$1 AND is_active AND applies_to IN ('ALL',$2)`,
        [input.req_id, file.client_type === "R" ? "R" : "C"]);
      if (!requirement) throw new MedicalError(400, "Select an active document requirement applicable to this file.");
      const validation = uploadDocumentValidation({ filename: input.filename, filesize: input.filesize,
        reqName: requirement.req_name, invoiceNo: input.invoice_no, amount: input.amount,
        policyCode: input.policy_code, riskRate: input.risk_rate, riskReason: input.risk_reason,
        originatingSystem: input.originating_system });
      if (validation) throw new MedicalError(400, validation);
      if (input.amount && (!Number.isFinite(Number(input.amount)) || Number(input.amount) < 0))
        throw new MedicalError(400, "Amount must be a non-negative number.");
      // Verify the object exists before recording document metadata.
      const object = await storage.getObjectEntityFile(input.storage_key);
      const [metadata] = await object.getMetadata();
      if (Number(metadata.size) !== input.filesize) throw new MedicalError(400, "Uploaded document size does not match.");
      const [upload] = await txQuery(client, `INSERT INTO crm.business_uploads
        (file_no,req_id,filename,filesize,mime_type,storage_key,uploaded_by,invoice_no,amount,policy_code,risk_rate,risk_reason,originating_system)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING upload_id`,
      [fileNo, input.req_id, safeUploadFilename(input.filename), input.filesize, input.mime_type, input.storage_key,
        res.locals.medUsername, input.invoice_no || null, input.amount ? Number(input.amount) : null,
        input.policy_code || null, input.risk_rate || null, input.risk_reason || null, input.originating_system || null]);
      await txQuery(client, `UPDATE crm.business_doc_checklist SET upload_id=$3,acknowledged_by=$4,acknowledged_at=NOW()
        WHERE file_no=$1 AND req_id=$2 AND is_selected`, [fileNo, input.req_id, upload!.upload_id, res.locals.medUsername]);
      await txQuery(client, `UPDATE crm.business_tracking SET updated_at=NOW() WHERE file_no=$1`, [fileNo]);
      await txQuery(client, `INSERT INTO crm.admin_audit_trail(username,action_type,description)
        VALUES($1,'MEDICAL_UW_UPLOAD',$2)`, [res.locals.medUsername, `Document uploaded for ${fileNo}`]);
      return upload;
    });
    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof ObjectNotFoundError) { res.status(400).json({ ok: false, error: "Upload the document bytes first." }); return; }
    medicalFailure(res, err);
  }
});
router.get("/medical-underwriting/files/:fileNo/uploads/:uploadId/download", async (req, res) => {
  try {
    const fileNo = fileNoOf(req.params.fileNo);
    await medicalFile(fileNo, res.locals.medUsername, res.locals.medAdmin);
    const id = Number(req.params.uploadId);
    if (!Number.isInteger(id) || id <= 0) throw new MedicalError(400, "Invalid document ID.");
    const [upload] = await query<{ storage_key: string; filename: string }>(
      `SELECT storage_key,filename FROM crm.business_uploads WHERE upload_id=$1 AND file_no=$2 AND is_active`, [id, fileNo]);
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
export default router;
