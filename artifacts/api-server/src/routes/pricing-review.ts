import { Router, type Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { query, queryOne, txQuery, withTransaction } from "../lib/postgres";
import { MedicalError } from "../lib/medical-underwriting";
import { logger } from "../lib/logger";
import { pricingFile, pricingJoin, pricingPending, ratesMatrixRequirement, requirePricingAccess } from "../lib/pricing-review";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { safeUploadFilename, uploadDocumentValidation } from "./business";

const router = Router();
function pricingFailure(res: Response, err: unknown) {
  if (err instanceof MedicalError) {
    res.status(err.status).json({ ok: false, error: err.message });
    return;
  }
  logger.error({ err }, "Pricing review request failed");
  res.status(500).json({ ok: false, error: "Unable to complete the Pricing Review request." });
}
const storage = new ObjectStorageService();
router.use("/pricing-review", requireAuth, requirePricingAccess);
const reviewSchema = z.object({
  action: z.enum(["YES", "NO"]),
  comments: z.string().trim().min(1, "Review notes are required.").max(250),
  expected_updated_at: z.string().datetime({ offset: true }),
  allocated_to: z.string().trim().min(1).max(100).optional(),
});
// Use the same active-account and profile rules as Allocation Files access.
const allocationRecipientsSql = `SELECT e.username,e.employee_name FROM crm.employees e
  JOIN crm.profiles p ON p.profile_id=e.profile_id
  WHERE e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted
  AND p.is_active AND LOWER(TRIM(REGEXP_REPLACE(p.profile_name,'[[:space:]]+',' ','g')))
    IN ('membership admin','bpo','bpo admin','bpo review','superadmin','system admin')`;
const uploadSchema = z.object({
  req_id: z.number().int().positive(), filename: z.string().min(1).max(255),
  filesize: z.number().int().positive().max(10 * 1024 * 1024),
  mime_type: z.string().max(200), storage_key: z.string().regex(/^\/objects\/uploads\/[a-zA-Z0-9-]+$/),
});
const matrixExists = async (fileNo: string) => {
  const row = await queryOne<{ exists: boolean }>(`SELECT EXISTS(SELECT 1 FROM crm.business_uploads u
    JOIN crm.business_req r ON r.req_id=u.req_id WHERE u.file_no=$1 AND u.is_active AND r.is_active
    AND u.filesize>0 AND ${ratesMatrixRequirement}) AS exists`, [fileNo]);
  return row?.exists ?? false;
};
async function visibleFile(fileNo: string) {
  const file = await queryOne(`SELECT b.*,(${pricingPending}) AS reviewable FROM crm.business_tracking b ${pricingJoin}
    WHERE b.file_no=$1 AND b.is_active AND b.client_type IN ('C','S')`, [fileNo]);
  if (!file) throw new MedicalError(404, "Pricing file not found.");
  return file;
}
router.get("/pricing-review", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
    if (!Number.isInteger(page)) throw new MedicalError(400, "Page must be a whole number.");
    const filter = `${pricingPending} AND (b.file_no ILIKE $1 OR b.proposer_name ILIKE $1 OR COALESCE(b.allocated_to,'') ILIKE $1)`;
    const [rows, count] = await Promise.all([
      query(`SELECT b.*,TRUE AS reviewable FROM crm.business_tracking b ${pricingJoin} WHERE ${filter}
        ORDER BY b.to_pricing_dt,b.file_no LIMIT 25 OFFSET $2`, [`%${search}%`, (page - 1) * 25]),
      queryOne<{ total: string }>(`SELECT COUNT(*) AS total FROM crm.business_tracking b ${pricingJoin} WHERE ${filter}`, [`%${search}%`]),
    ]);
    res.json({ ok: true, data: rows, total: Number(count?.total ?? 0), page, pageSize: 25 });
  } catch (err) { pricingFailure(res, err); }
});
router.get("/pricing-review/files/:fileNo", async (req, res) => {
  try {
    const fileNo = String(req.params.fileNo);
    const file = await visibleFile(fileNo);
    const [notes, uploads, reviews, requirements, has_rates_matrix, allocation_recipients] = await Promise.all([
      query(`SELECT note_id,note_from,notes,note_date FROM crm.business_tracking_notes WHERE file_no=$1 AND is_active ORDER BY note_date DESC,note_id DESC`, [fileNo]),
      query(`SELECT u.upload_id,u.filename,r.req_name,u.uploaded_by,u.uploaded_at FROM crm.business_uploads u
        JOIN crm.business_req r ON r.req_id=u.req_id WHERE u.file_no=$1 AND u.is_active ORDER BY u.uploaded_at DESC`, [fileNo]),
      query(`SELECT * FROM crm.pricing_reviews WHERE file_no=$1 ORDER BY reviewed_at DESC,review_id DESC`, [fileNo]),
      query(`SELECT r.req_id,r.req_name FROM crm.business_req r WHERE r.is_active AND r.applies_to IN ('ALL','C')
        AND ${ratesMatrixRequirement} ORDER BY r.req_id`),
      matrixExists(fileNo),
      query(`${allocationRecipientsSql} AND e.username=$1`, [file.allocated_to]),
    ]);
    res.json({ ok: true, data: { file, notes, uploads, reviews, requirements, has_rates_matrix, allocation_recipients } });
  } catch (err) { pricingFailure(res, err); }
});
router.post("/pricing-review/files/:fileNo/review", async (req, res) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) throw new MedicalError(400, parsed.error.issues[0]?.message ?? "Invalid pricing decision.");
    const input = parsed.data;
    const fileNo = String(req.params.fileNo);
    const actor = res.locals.pricingUsername;
    const result = await withTransaction(async client => {
      const file = await pricingFile(client, fileNo);
      if (new Date(file.updated_at).getTime() !== new Date(input.expected_updated_at).getTime())
        throw new MedicalError(409, "This file changed. Refresh it before recording the decision.");
      const allocatedTo = file.allocated_to;
      if (input.action === "YES" && input.allocated_to && input.allocated_to !== allocatedTo)
        throw new MedicalError(400, "Pricing approval must retain the BPO Admin already allocated to this business. Change allocation through BPO Review first.");
      if (input.action === "YES") {
        const [matrix] = await txQuery<{ exists: boolean }>(client, `SELECT EXISTS(SELECT 1 FROM crm.business_uploads u
          JOIN crm.business_req r ON r.req_id=u.req_id WHERE u.file_no=$1 AND u.is_active AND r.is_active
          AND u.filesize>0 AND ${ratesMatrixRequirement}) AS exists`, [fileNo]);
        if (!matrix?.exists) throw new MedicalError(400, "Upload the approved Rates and benefit Matrix before approval.");
        if (!allocatedTo) throw new MedicalError(400, "This business has no allocated recipient. Allocate it through BPO Review before Pricing approval.");
        const recipient = await txQuery(client, `${allocationRecipientsSql} AND e.username=$1 FOR SHARE OF e,p`, [allocatedTo]);
        if (!recipient.length) throw new MedicalError(400, "The allocated recipient is no longer eligible. Correct the allocation through BPO Review before Pricing approval.");
      }
      const status = input.action === "YES" ? "ALLOCATED" : "RETURNED-INCOMPLETE";
      await txQuery(client, `UPDATE crm.business_work_items SET work_status='COMPLETED',updated_at=NOW()
        WHERE file_no=$1 AND queue_name='PRICING_REVIEW' AND work_status='OPEN'`, [fileNo]);
      if (input.action === "NO") {
        await txQuery(client, `INSERT INTO crm.business_work_items(file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by,forwarded_at)
          VALUES($1,'REGISTER_CORRECTION','OPEN',$2,$3,$3,NOW()) ON CONFLICT(file_no,queue_name) DO UPDATE SET
          work_status='OPEN',assigned_to=EXCLUDED.assigned_to,assigned_by=EXCLUDED.assigned_by,
          forwarded_by=EXCLUDED.forwarded_by,forwarded_at=NOW(),updated_at=NOW()`, [fileNo, file.entered_by, actor]);
      }
      await txQuery(client, `UPDATE crm.business_tracking SET file_status=$2,benefit_verified=$3::varchar,
        benefit_ver_by=$4,benefit_ver_date=NOW(),allocated=($3::varchar='YES'),
        allocated_to=CASE WHEN $3::varchar='YES' THEN $5::varchar ELSE NULL END,
        allocate_dt=CASE WHEN $3::varchar='YES' THEN NOW() ELSE NULL END,
        forwarded=($3::varchar='YES'),is_complete=CASE WHEN $3::varchar='NO' THEN FALSE ELSE is_complete END,
        ready_for_update=($3::varchar='YES'),updated_at=NOW() WHERE file_no=$1`, [fileNo, status, input.action, actor, allocatedTo]);
      await txQuery(client, `INSERT INTO crm.pricing_reviews(file_no,action,comments,reviewed_by,allocated_to)
        VALUES($1,$2,$3,$4,$5)`, [fileNo, input.action, input.comments, actor, allocatedTo]);
      await txQuery(client, `INSERT INTO crm.business_tracking_notes(file_no,note_from,notes) VALUES($1,$2,$3)`, [fileNo, actor, input.comments]);
      await txQuery(client, `INSERT INTO crm.admin_audit_trail(username,action_type,description)
        VALUES($1,'PRICING_REVIEW',$2)`, [actor, `${fileNo}: ${input.action} → ${status}. Recipient: ${allocatedTo ?? "unassigned"} (previous: ${file.allocated_to ?? "unassigned"}). ${input.comments}`]);
      return { file_status: status, allocated_to: input.action === "YES" ? allocatedTo : null };
    });
    res.json({ ok: true, data: result });
  } catch (err) { pricingFailure(res, err); }
});
router.post("/pricing-review/files/:fileNo/uploads", async (req, res) => {
  try {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) throw new MedicalError(400, parsed.error.issues[0]?.message ?? "Invalid rates matrix.");
    const input = parsed.data;
    const fileNo = String(req.params.fileNo);
    const result = await withTransaction(async client => {
      await pricingFile(client, fileNo);
      const [requirement] = await txQuery<{ req_name: string }>(client, `SELECT r.req_name FROM crm.business_req r
        WHERE r.req_id=$1 AND r.is_active AND r.applies_to IN ('ALL','C') AND ${ratesMatrixRequirement}`, [input.req_id]);
      if (!requirement) throw new MedicalError(400, "Choose the active Rates and benefit Matrix requirement.");
      const validation = uploadDocumentValidation({ filename: input.filename, filesize: input.filesize, reqName: requirement.req_name });
      if (validation) throw new MedicalError(400, validation);
      const object = await storage.getObjectEntityFile(input.storage_key);
      const [metadata] = await object.getMetadata();
      if (Number(metadata.size) !== input.filesize) throw new MedicalError(400, "Document size does not match the uploaded bytes.");
      const [upload] = await txQuery(client, `INSERT INTO crm.business_uploads(file_no,req_id,filename,filesize,mime_type,storage_key,uploaded_by)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING upload_id`,
      [fileNo, input.req_id, safeUploadFilename(input.filename), input.filesize, input.mime_type, input.storage_key, res.locals.pricingUsername]);
      await txQuery(client, `UPDATE crm.business_doc_checklist SET upload_id=$3,acknowledged_by=$4,acknowledged_at=NOW()
        WHERE file_no=$1 AND req_id=$2 AND is_selected`, [fileNo, input.req_id, upload!.upload_id, res.locals.pricingUsername]);
      await txQuery(client, `UPDATE crm.business_tracking SET updated_at=NOW() WHERE file_no=$1`, [fileNo]);
      return upload;
    });
    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof ObjectNotFoundError) { res.status(400).json({ ok: false, error: "Upload the document bytes first." }); return; }
    pricingFailure(res, err);
  }
});
router.get("/pricing-review/files/:fileNo/uploads/:uploadId/download", async (req, res) => {
  try {
    const fileNo = String(req.params.fileNo);
    await visibleFile(fileNo);
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
    pricingFailure(res, err);
  }
});
export default router;
