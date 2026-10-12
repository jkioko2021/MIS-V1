import { Router } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { query, queryOne, txQuery, withTransaction } from "../lib/postgres";
import { filingFile, filingPending, FilingError, filingFailure } from "../lib/record-filing";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/document-storage";
import { safeUploadFilename } from "./business";

const router = Router();
const storage = new ObjectStorageService();
router.use("/record-filing", requireAuth, async (req, res, next) => {
  try {
    const staff = await queryOne<{ username: string; profile_name: string }>(
      `SELECT e.username,p.profile_name FROM crm.employees e
       JOIN crm.profiles p ON p.profile_id=e.profile_id WHERE e.employee_id=$1
       AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active`,
      [req.user!.sub]);
    if (!staff || !["dpu","superadmin","system admin"].includes(staff.profile_name.trim().toLowerCase())) {
      throw new FilingError(403, "Record Filing requires DPU access.");
    }
    res.locals.filingUsername = staff.username;
    next();
  } catch (err) { filingFailure(res, err); }
});
const listSchema = z.object({
  bucket: z.enum(["pending","filed"]).default("pending"),
  business_type: z.enum(["N","R","A","all"]).default("all"),
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
router.get("/record-filing", async (req, res) => {
  try {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) throw new FilingError(400, "Invalid Record Filing filters.");
    const { bucket, business_type, search, page } = parsed.data;
    const gate = bucket === "pending" ? filingPending : "b.is_active AND (b.filed OR b.file_status='FILED')";
    const searchGate = `${gate} AND (b.file_no ILIKE $1 OR b.proposer_name ILIKE $1 OR COALESCE(b.invoice_no,'') ILIKE $1)`;
    const filter = `${searchGate} AND ($2::text='all' OR b.business_type=$2::text)`;
    const params = [`%${search}%`, business_type];
    const [rows, count, typeCounts] = await Promise.all([
      query(`SELECT b.* FROM crm.business_tracking b WHERE ${filter}
        ORDER BY ${bucket === "filed" ? "b.filed_date DESC NULLS LAST" : "b.receive_dt ASC"},b.file_no
        LIMIT 25 OFFSET $3`, [...params, (page-1)*25]),
      queryOne<{ total: string }>(`SELECT COUNT(*) AS total FROM crm.business_tracking b WHERE ${filter}`, params),
      query<{ business_type: string; total: number }>(`SELECT b.business_type,COUNT(*)::int AS total
        FROM crm.business_tracking b WHERE ${searchGate} GROUP BY b.business_type`, [params[0]]),
    ]);
    const counts = { N: 0, R: 0, A: 0 };
    for (const row of typeCounts) if (row.business_type in counts) counts[row.business_type as keyof typeof counts] = row.total;
    res.json({ ok: true, data: rows, total: Number(count?.total ?? 0), page, pageSize: 25, counts });
  } catch (err) { filingFailure(res, err); }
});
router.get("/record-filing/files/:fileNo", async (req, res) => {
  try {
    const fileNo = String(req.params.fileNo);
    const file = await filingFile(fileNo);
    const [notes, uploads, reviews] = await Promise.all([
      query(`SELECT note_id,note_from,note_date,notes FROM crm.business_tracking_notes
        WHERE file_no=$1 AND is_active ORDER BY note_date DESC,note_id DESC`, [fileNo]),
      query(`SELECT u.upload_id,u.filename,u.uploaded_by,u.uploaded_at,u.filed,u.filed_by,u.filed_date,
        COALESCE(r.req_name,'Document') AS req_name FROM crm.business_uploads u
        LEFT JOIN crm.business_req r ON r.req_id=u.req_id
        WHERE u.file_no=$1 AND u.is_active ORDER BY u.uploaded_at DESC,u.upload_id DESC`, [fileNo]),
      query(`SELECT filing_id,filed_by,filed_at,comments,upload_ids FROM crm.record_filing_reviews
        WHERE file_no=$1 ORDER BY filed_at DESC,filing_id DESC`, [fileNo]),
    ]);
    res.json({ ok: true, data: { file, reviewable: file.reviewable, notes, uploads, reviews } });
  } catch (err) { filingFailure(res, err); }
});
router.get("/record-filing/files/:fileNo/uploads/:uploadId/download", async (req, res) => {
  try {
    const fileNo = String(req.params.fileNo);
    await filingFile(fileNo);
    const uploadId = Number(req.params.uploadId);
    if (!Number.isSafeInteger(uploadId) || uploadId < 1) throw new FilingError(400, "Invalid document ID.");
    const upload = await queryOne<{ storage_key: string; filename: string; mime_type: string }>(
      `SELECT storage_key,filename,mime_type FROM crm.business_uploads WHERE upload_id=$1 AND file_no=$2 AND is_active`,
      [uploadId, fileNo]);
    if (!upload) throw new FilingError(404, "Document not found.");
    const response = await storage.downloadObject(await storage.getObjectEntityFile(upload.storage_key));
    if (!response.ok || !response.body) throw new FilingError(502, "Document storage is unavailable.");
    res.setHeader("Content-Type", upload.mime_type);
    res.setHeader("Content-Disposition", `attachment; filename="${safeUploadFilename(upload.filename)}"`);
    Readable.fromWeb(response.body as never).on("error", () => res.destroy()).pipe(res);
  } catch (err) {
    filingFailure(res, err instanceof ObjectNotFoundError ? new FilingError(404, "Document not found.") : err);
  }
});
const fileSchema = z.object({
  action: z.literal("F"),
  expected_updated_at: z.string().datetime({ offset: true }),
  upload_ids: z.array(z.number().int().positive()).max(500).default([]),
  comments: z.string().trim().max(250).default(""),
});
router.post("/record-filing/files/:fileNo/file", async (req, res) => {
  try {
    const parsed = fileSchema.safeParse(req.body);
    if (!parsed.success) throw new FilingError(400, "Select Filed and provide valid document IDs, notes and current file version.");
    const input = parsed.data;
    if (new Set(input.upload_ids).size !== input.upload_ids.length) throw new FilingError(400, "Duplicate document selection.");
    const fileNo = String(req.params.fileNo);
    const actor: string = res.locals.filingUsername;
    const result = await withTransaction(async client => {
      await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [fileNo]);
      const file = await filingFile(fileNo, client);
      if (!file.reviewable) throw new FilingError(409, "This record has already been filed or is no longer ready for filing.");
      if (new Date(file.updated_at).getTime() !== new Date(input.expected_updated_at).getTime()) {
        throw new FilingError(409, "The record changed. Refresh it before filing.");
      }
      const documents = await txQuery(client, `SELECT upload_id FROM crm.business_uploads
        WHERE file_no=$1 AND upload_id=ANY($2::integer[]) AND is_active AND NOT filed FOR UPDATE`,
        [fileNo, input.upload_ids]);
      if (documents.length !== input.upload_ids.length) throw new FilingError(400, "A selected document is unavailable, already filed, or belongs to another record.");
      await txQuery(client, `UPDATE crm.business_uploads SET filed=TRUE,filed_by=$3,filed_date=NOW()
        WHERE file_no=$1 AND upload_id=ANY($2::integer[])`, [fileNo, input.upload_ids, actor]);
      await txQuery(client, `UPDATE crm.business_tracking SET file_status='FILED',filed=TRUE,
        filed_by=$2,filed_date=NOW(),updated_at=NOW() WHERE file_no=$1`, [fileNo, actor]);
      await txQuery(client, `UPDATE crm.business_work_items SET work_status='COMPLETED',updated_at=NOW()
        WHERE file_no=$1 AND work_status='OPEN'`, [fileNo]);
      const [review] = await txQuery<{ filing_id: number }>(client,
        `INSERT INTO crm.record_filing_reviews(file_no,filed_by,comments,upload_ids)
         VALUES($1,$2,$3,$4::integer[]) RETURNING filing_id`, [fileNo, actor, input.comments, input.upload_ids]);
      await txQuery(client, `INSERT INTO crm.business_tracking_notes(file_no,note_from,notes)
        VALUES($1,$2,$3)`, [fileNo, actor, `Record Filing: FILED${input.comments ? `. ${input.comments}` : ""}`]);
      await txQuery(client, `INSERT INTO crm.admin_audit_trail(username,action_type,description)
        VALUES($1,'RECORD_FILED',$2)`, [actor, `${fileNo}: Filed ${documents.length} documents; filing review ${review.filing_id}.`]);
      const statuses: string[] = [];
      const recipients = new Set([file.entered_by, file.allocated_to].filter((u): u is string => !!u));
      for (const recipient of recipients) {
        const [employee] = await txQuery<{ email: string | null }>(client,
          "SELECT email FROM crm.employees WHERE username=$1 AND NOT is_deleted", [recipient]);
        const hasEmail = typeof employee?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email.trim());
        const emailStatus = !hasEmail ? "NO_RECIPIENT" : process.env.MIS_EMAIL_FROM?.trim() ? "PENDING" : "WAITING_CONFIGURATION";
        await txQuery(client, `INSERT INTO crm.business_notifications
          (file_no,filing_id,recipient_username,title,message,email_status) VALUES($1,$2,$3,$4,$5,$6)`,
          [fileNo, review.filing_id, recipient, "Record filing completed",
            `Documents for file ${fileNo} have been filed.${input.comments ? ` Notes: ${input.comments}` : ""}`, emailStatus]);
        statuses.push(emailStatus);
      }
      return { file_status: "FILED", filed_documents: documents.length, notification_statuses: statuses };
    });
    res.json({ ok: true, data: result });
  } catch (err) { filingFailure(res, err); }
});
export default router;
