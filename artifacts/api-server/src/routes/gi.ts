import { Router } from "express";
import { Readable } from "node:stream";
import { query, queryOne, txQuery, withTransaction } from "../lib/postgres";
import { requireAuth } from "../lib/auth-middleware";
import { requireGiAccess, GI_ALLOCATE_SQL, GI_STAFF_SQL, ACTIVE_STAFF_SQL, recordGiDecision } from "../lib/gi-workflow";
import { logger } from "../lib/logger";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { safeUploadFilename } from "./business";

const router = Router();
router.use("/gi", requireAuth, requireGiAccess);
class GiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function fail(res: import("express").Response, err: unknown) {
  if (err instanceof GiError) { res.status(err.status).json({ok:false,error:err.message}); return; }
  logger.error({err},"GI workflow failed");
  res.status(500).json({ok:false,error:"Unable to complete the GI request."});
}
const allowed = `(${GI_ALLOCATE_SQL} OR (b.is_active AND b.business='N' AND b.allocated
  AND b.file_status='ALLOCATED' AND ($2::boolean OR b.allocated_to=$3)
  AND EXISTS (SELECT 1 FROM crm.business_work_items w WHERE w.file_no=b.file_no
    AND w.queue_name='GI_ALLOCATED' AND w.work_status='OPEN')))`;

router.get("/gi/allocate", async (req,res) => {
  try {
    const page = Number(req.query.page ?? 1);
    if (!Number.isInteger(page) || page<1 || page>100000) throw new GiError(400,"Invalid page.");
    if (req.query.search && typeof req.query.search !== "string") throw new GiError(400,"Invalid search.");
    const search = String(req.query.search ?? "").trim();
    if (search.length>100) throw new GiError(400,"Search must be 100 characters or fewer.");
    const where = `${GI_ALLOCATE_SQL} AND (b.file_no ILIKE $1 OR b.proposer_name ILIKE $1)`;
    const params = [`%${search}%`];
    const [rows,total] = await Promise.all([
      query(`SELECT b.* FROM crm.business_tracking b WHERE ${where}
        ORDER BY b.walk_in_client DESC,b.receive_dt ASC,b.file_no LIMIT 25 OFFSET $2`,[...params,(page-1)*25]),
      queryOne<{total:number}>(`SELECT COUNT(*)::int AS total FROM crm.business_tracking b WHERE ${where}`,params),
    ]);
    res.json({ok:true,data:rows,total:total?.total ?? 0,page,pageSize:25});
  } catch(err) { fail(res,err); }
});
router.get("/gi/staff", async (_req,res) => {
  try {
    res.json({ok:true,data:await query(`SELECT e.username,e.employee_name
      FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
      WHERE ${ACTIVE_STAFF_SQL} AND ${GI_STAFF_SQL} ORDER BY e.employee_name,e.username`)});
  } catch(err) { fail(res,err); }
});
router.get("/gi/files/:fileNo", async (req,res) => {
  try {
    const actor=res.locals.giActor;
    const file=await queryOne(`SELECT b.* FROM crm.business_tracking b WHERE b.file_no=$1 AND ${allowed}`,
      [req.params.fileNo,actor.is_admin,actor.username]);
    if(!file) throw new GiError(404,"GI file not found or no longer available in this queue.");
    const [notes,uploads]=await Promise.all([
      query(`SELECT * FROM crm.business_tracking_notes WHERE file_no=$1 ORDER BY note_date DESC,note_id DESC`,[req.params.fileNo]),
      query(`SELECT u.*,r.req_name FROM crm.business_uploads u JOIN crm.business_req r ON r.req_id=u.req_id
        WHERE u.file_no=$1 AND u.is_active ORDER BY u.upload_id DESC`,[req.params.fileNo]),
    ]);
    res.json({ok:true,data:{file,notes,uploads}});
  } catch(err) { fail(res,err); }
});
router.get("/gi/files/:fileNo/uploads/:uploadId/download", async(req,res) => {
  try {
    const actor=res.locals.giActor;
    const id=Number(req.params.uploadId);
    if(!Number.isInteger(id)||id<1) throw new GiError(400,"Invalid document.");
    const file=await queryOne(`SELECT b.file_no FROM crm.business_tracking b WHERE b.file_no=$1 AND ${allowed}`,
      [req.params.fileNo,actor.is_admin,actor.username]);
    if(!file) throw new GiError(404,"GI file not found.");
    const upload=await queryOne<{storage_key:string;filename:string;mime_type:string}>(
      `SELECT storage_key,filename,mime_type FROM crm.business_uploads WHERE upload_id=$1 AND file_no=$2 AND is_active`,
      [id,req.params.fileNo]);
    if(!upload) throw new GiError(404,"Document not found.");
    const object=await new ObjectStorageService().getObjectEntityFile(upload.storage_key);
    const response=await new ObjectStorageService().downloadObject(object);
    if(!response.ok||!response.body) throw new GiError(502,"Document storage is unavailable.");
    res.setHeader("Content-Type",upload.mime_type);
    res.setHeader("Content-Disposition",`attachment; filename="${safeUploadFilename(upload.filename)}"`);
    Readable.fromWeb(response.body as never).on("error",()=>res.destroy()).pipe(res);
  } catch(err) {
    if(err instanceof ObjectNotFoundError) { res.status(404).json({ok:false,error:"Document bytes are unavailable."}); return; }
    fail(res,err);
  }
});
router.post("/gi/files/:fileNo/decision", async(req,res) => {
  try {
    const {action,assigned_to,comments,expected_updated_at}=req.body ?? {};
    const note=typeof comments==="string"?comments.trim():"";
    if(!["A","RI"].includes(action)||!note||note.length>250)
      throw new GiError(400,"Choose Allocate or Return Incomplete and enter a note (1–250 characters).");
    if(typeof expected_updated_at!=="string"||!Number.isFinite(Date.parse(expected_updated_at)))
      throw new GiError(400,"Reload the file before submitting.");
    const result=await withTransaction(async client => {
      await txQuery(client,"SELECT pg_advisory_xact_lock(hashtext($1))",[req.params.fileNo]);
      const [file]=await txQuery<{entered_by:string;updated_at:Date}>(client,
        `SELECT b.* FROM crm.business_tracking b WHERE b.file_no=$1 AND ${GI_ALLOCATE_SQL} FOR UPDATE`,
        [req.params.fileNo]);
      if(!file) throw new GiError(409,"The file has already moved. Refresh the queue.");
      if(new Date(file.updated_at).getTime()!==Date.parse(expected_updated_at))
        throw new GiError(409,"The file changed. Reload it before submitting.");
      let recipient=file.entered_by;
      if(action==="A") {
        if(typeof assigned_to!=="string"||!assigned_to.trim()) throw new GiError(400,"Select an active GI recipient.");
        const [staff]=await txQuery<{username:string}>(client,
          `SELECT e.username FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
           WHERE e.username=$1 AND ${ACTIVE_STAFF_SQL} AND ${GI_STAFF_SQL} FOR SHARE OF e,p`,[assigned_to.trim()]);
        if(!staff) throw new GiError(400,"The selected user is not an active GI team member.");
        recipient=staff.username;
      }
      const status=action==="A"?"ALLOCATED":"RETURNED-INCOMPLETE";
      const queue=action==="A"?"GI_ALLOCATED":"REGISTER_CORRECTION";
      await txQuery(client,`UPDATE crm.business_work_items SET work_status='COMPLETED',updated_at=NOW()
        WHERE file_no=$1 AND work_status='OPEN'`,[req.params.fileNo]);
      await txQuery(client,`INSERT INTO crm.business_work_items(file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by,forwarded_at)
        VALUES($1,$2,'OPEN',$3,$4,$4,NOW()) ON CONFLICT(file_no,queue_name) DO UPDATE SET
        work_status='OPEN',assigned_to=EXCLUDED.assigned_to,assigned_by=EXCLUDED.assigned_by,
        forwarded_by=EXCLUDED.forwarded_by,forwarded_at=NOW(),updated_at=NOW()`,
        [req.params.fileNo,queue,recipient,req.user!.username]);
      await txQuery(client,`UPDATE crm.business_tracking SET file_status=$2,allocated=$3::boolean,
        allocated_to=CASE WHEN $3::boolean THEN $4::varchar ELSE NULL END,
        allocate_dt=CASE WHEN $3::boolean THEN NOW() ELSE NULL END,
        benefit_verified=CASE WHEN $3::boolean THEN 'YES' ELSE benefit_verified END,
        forwarded=$3::boolean,ready_for_update=$3::boolean,
        is_complete=CASE WHEN $3::boolean THEN is_complete ELSE FALSE END,
        updated_at=NOW() WHERE file_no=$1`,[req.params.fileNo,status,action==="A",recipient]);
      await txQuery(client,`INSERT INTO crm.business_tracking_notes(file_no,note_from,notes)
        VALUES($1,$2,$3)`,[req.params.fileNo,req.user!.username,`GI ${action} → ${queue}: ${note}`]);
      const notification_status=await recordGiDecision(client,String(req.params.fileNo),req.user!.username,action,recipient,note);
      await txQuery(client,`INSERT INTO crm.admin_audit_trail(username,action_type,description)
        VALUES($1,$2,$3)`,[req.user!.username,`GI_${action}`,`${req.params.fileNo} → ${queue}; recipient ${recipient}`]);
      return {file_status:status,queue_name:queue,notification_status};
    });
    res.json({ok:true,data:result});
  } catch(err) { fail(res,err); }
});
export default router;
