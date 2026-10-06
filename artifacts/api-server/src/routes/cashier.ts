import { Router } from "express";
import { Readable } from "stream";
import { requireAuth } from "../lib/auth-middleware";
import { query, queryOne } from "../lib/postgres";
import { MedicalError, medicalFailure } from "../lib/medical-underwriting";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { safeUploadFilename } from "./business";

const router = Router();
const storage = new ObjectStorageService();
const join = `JOIN crm.business_work_items cw ON cw.file_no=b.file_no AND cw.queue_name='CASHIER'`;
const owner = `(cw.assigned_to IS NULL OR cw.assigned_to=$1 OR $2::boolean)`;
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
async function cashierFile(fileNo: string, username: string, admin: boolean) {
  const row = await queryOne(`SELECT b.*,cw.assigned_to FROM crm.business_tracking b ${join}
    WHERE b.file_no=$3 AND b.is_active AND b.file_status='CASHIER' AND cw.work_status='OPEN'
    AND ${owner}`, [username, admin, fileNo]);
  if (!row) throw new MedicalError(404, "Cashier file not found or assigned to another cashier.");
  return row;
}
router.get("/cashier", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
    if (!Number.isInteger(page)) throw new MedicalError(400, "Page must be a whole number.");
    const filter = `b.is_active AND b.file_status='CASHIER' AND cw.work_status='OPEN' AND ${owner}
      AND (b.file_no ILIKE $3 OR b.proposer_name ILIKE $3 OR COALESCE(b.invoice_no,'') ILIKE $3)`;
    const params = [res.locals.cashierUsername, res.locals.cashierAdmin, `%${search}%`];
    const [rows, count] = await Promise.all([
      query(`SELECT b.*,cw.assigned_to FROM crm.business_tracking b ${join} WHERE ${filter}
        ORDER BY cw.forwarded_at,b.file_no LIMIT 25 OFFSET $4`, [...params, (page - 1) * 25]),
      queryOne<{ total: string }>(`SELECT COUNT(*) AS total FROM crm.business_tracking b ${join} WHERE ${filter}`, params),
    ]);
    res.json({ ok: true, data: rows, total: Number(count?.total ?? 0), page, pageSize: 25 });
  } catch (err) { medicalFailure(res, err); }
});
router.get("/cashier/files/:fileNo", async (req, res) => {
  try {
    const fileNo = String(req.params.fileNo);
    const file = await cashierFile(fileNo, res.locals.cashierUsername, res.locals.cashierAdmin);
    const [notes, uploads] = await Promise.all([
      query(`SELECT note_id,note_from,notes,note_date FROM crm.business_tracking_notes
        WHERE file_no=$1 AND is_active ORDER BY note_date DESC,note_id DESC`, [fileNo]),
      query(`SELECT u.upload_id,u.filename,r.req_name,u.uploaded_by,u.uploaded_at FROM crm.business_uploads u
        JOIN crm.business_req r ON r.req_id=u.req_id WHERE u.file_no=$1 AND u.is_active ORDER BY u.uploaded_at DESC`, [fileNo]),
    ]);
    res.json({ ok: true, data: { file, notes, uploads } });
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
export default router;
