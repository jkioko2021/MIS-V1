import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../lib/postgres";
import { requireAuth } from "../lib/auth-middleware";
import { logger } from "../lib/logger";

const router = Router();

function handleError(res: Response, err: unknown, ctx: string) {
  logger.error({ err, ctx }, "Business route error");
  res.status(500).json({ ok: false, error: String(err) });
}

// ─── Reference data (no auth needed) ─────────────────────────────────────────
export const COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi",
  "Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos",
  "Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi",
  "Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya",
  "Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia","Turkana",
  "Uasin Gishu","Vihiga","Wajir","West Pokot",
];

router.get("/business/counties", (_req: Request, res: Response) => {
  res.json({ ok: true, data: COUNTIES });
});

router.get("/business/requirements", async (req: Request, res: Response) => {
  try {
    const { client_type } = req.query as { client_type?: string };
    const matchCode = client_type === "R" ? "R" : "C";
    const rows = await query(
      `SELECT req_id, req_code, req_name, applies_to
       FROM crm.business_req
       WHERE is_active = TRUE
         AND (applies_to = 'ALL' OR applies_to = $1)
       ORDER BY req_code`,
      [matchCode]
    );
    res.json({ ok: true, data: rows });
  } catch (err) { handleError(res, err, "get requirements"); }
});

// ─── All write routes require auth ────────────────────────────────────────────
router.use(requireAuth);

// ─── File number generator ────────────────────────────────────────────────────
async function generateFileNo(clientType: string): Promise<string> {
  const prefix = clientType === "R" ? "R" : "C";
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const pattern = `${prefix}-${mm}/${yy}/-%`;

  const last = await queryOne<{ file_no: string }>(
    `SELECT file_no FROM crm.business_tracking
     WHERE file_no LIKE $1 ORDER BY created_at DESC LIMIT 1`,
    [pattern]
  );

  let seq = 1;
  if (last?.file_no) {
    const parts = last.file_no.split("-");
    const lastSeq = parseInt(parts[parts.length - 1] ?? "0", 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return `${prefix}-${mm}/${yy}/-${String(seq).padStart(6, "0")}`;
}

// ─── POST /business/register ──────────────────────────────────────────────────
router.post("/business/register", async (req: Request, res: Response) => {
  const {
    client_type, business_type, business, proposer_name, receive_dt,
    nid, pin_no, walk_in_client, walk_in_auth, card_type,
    cr12, corp_category, sector,
    agent_id, county_code, gi_category,
    pay_ref_no, paid_amt, pay_mode, rate_type, family_code,
    is_mtiba, is_ipf,
  } = req.body as Record<string, unknown>;

  if (!client_type || !business_type || !business || !proposer_name) {
    res.status(400).json({ ok: false, error: "client_type, business_type, business, proposer_name are required." });
    return;
  }

  try {
    const file_no = await generateFileNo(String(client_type));
    await query(
      `INSERT INTO crm.business_tracking (
         file_no, proposer_name, family_code, receive_dt,
         file_status, business_type, client_type, business,
         agent_id, is_mtiba, is_ipf, walk_in_client,
         rate_type, benefit_verified, medical_uw,
         allocated, invoiced, forwarded, is_complete, ready_for_update,
         is_active, is_declined,
         pay_ref_no, paid_amt, entered_by,
         nid, pin_no, county_code, card_type, gi_category,
         pay_mode, sector, cr12, corp_category, walk_in_auth
       ) VALUES (
         $1,$2,$3,$4,
         'REGISTERED',$5,$6,$7,
         $8,$9,$10,$11,
         $12,'NO',FALSE,
         FALSE,FALSE,FALSE,FALSE,FALSE,
         TRUE,FALSE,
         $13,$14,$15,
         $16,$17,$18,$19,$20,
         $21,$22,$23,$24,$25
       )`,
      [
        file_no, String(proposer_name), family_code || null,
        receive_dt || new Date().toISOString().split("T")[0],
        String(business_type), String(client_type), String(business),
        agent_id || null, !!is_mtiba, !!is_ipf,
        client_type === "R" && walk_in_client === "Y" ? "Y" : "N",
        rate_type || "S",
        pay_ref_no || null, paid_amt ? Number(paid_amt) : null,
        req.user!.username,
        nid || null, pin_no || null, county_code || null,
        card_type || null, gi_category || null,
        pay_mode || null, sector || null,
        cr12 === true || cr12 === "true", corp_category || null,
        walk_in_auth || null,
      ]
    );

    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1, 'BT_REGISTER', $2)`,
      [req.user!.sub, `Registered ${file_no} — ${proposer_name}`]
    ).catch(() => {});

    res.status(201).json({ ok: true, data: { file_no } });
  } catch (err) { handleError(res, err, "register file"); }
});

// ─── PUT /business/:fileNo ────────────────────────────────────────────────────
router.put("/business/:fileNo", async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  const {
    proposer_name, family_code, receive_dt,
    business_type, business, agent_id,
    nid, pin_no, walk_in_client, walk_in_auth, card_type,
    cr12, corp_category, sector,
    county_code, gi_category,
    pay_ref_no, paid_amt, pay_mode, rate_type,
    is_mtiba, is_ipf,
    allocated_to, medical_uw, benefit_verified, invoiced,
  } = req.body as Record<string, unknown>;

  try {
    const exists = await queryOne(`SELECT file_no, client_type FROM crm.business_tracking WHERE file_no=$1`, [fileNo]);
    if (!exists) { res.status(404).json({ ok: false, error: "File not found." }); return; }

    await query(
      `UPDATE crm.business_tracking SET
         proposer_name=$1, family_code=$2, receive_dt=$3,
         business_type=$4, business=$5, agent_id=$6,
         nid=$7, pin_no=$8, walk_in_client=$9, walk_in_auth=$10, card_type=$11,
         cr12=$12, corp_category=$13, sector=$14,
         county_code=$15, gi_category=$16,
         pay_ref_no=$17, paid_amt=$18, pay_mode=$19, rate_type=$20,
         is_mtiba=$21, is_ipf=$22,
         allocated_to=$23, medical_uw=$24, benefit_verified=$25, invoiced=$26,
         updated_at=NOW()
       WHERE file_no=$27`,
      [
        String(proposer_name), family_code || null,
        receive_dt || null,
        String(business_type), String(business), agent_id || null,
        nid || null, pin_no || null,
        walk_in_client === "Y" ? "Y" : "N",
        walk_in_auth || null, card_type || null,
        cr12 === true || cr12 === "true", corp_category || null, sector || null,
        county_code || null, gi_category || null,
        pay_ref_no || null, paid_amt ? Number(paid_amt) : null, pay_mode || null,
        rate_type || "S",
        !!is_mtiba, !!is_ipf,
        allocated_to || null, !!medical_uw,
        benefit_verified || "NO", !!invoiced,
        fileNo,
      ]
    );

    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,'BT_UPDATE',$2)`,
      [req.user!.sub, `Updated ${fileNo}`]
    ).catch(() => {});

    res.json({ ok: true });
  } catch (err) { handleError(res, err, "update file"); }
});

// ─── POST /business/:fileNo/forward ──────────────────────────────────────────
router.post("/business/:fileNo/forward", async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  try {
    const file = await queryOne<{
      file_status: string; is_complete: boolean; allocated: boolean;
      business: string; medical_uw: boolean; invoiced: boolean;
    }>(
      `SELECT file_status, is_complete, allocated, business, medical_uw, invoiced
       FROM crm.business_tracking WHERE file_no=$1 AND is_active=TRUE`,
      [fileNo]
    );
    if (!file) { res.status(404).json({ ok: false, error: "File not found." }); return; }

    // Validation per legacy state machine
    if (!file.is_complete) {
      res.status(400).json({ ok: false, error: "Documentation checklist is not complete. Acknowledge all required documents first." });
      return;
    }
    if (file.business === "M" && !file.medical_uw) {
      res.status(400).json({ ok: false, error: "Medical UW review is required before forwarding." });
      return;
    }
    if (!file.allocated) {
      res.status(400).json({ ok: false, error: "File must be allocated before forwarding." });
      return;
    }
    if (!file.invoiced) {
      res.status(400).json({ ok: false, error: "File must be invoiced before forwarding." });
      return;
    }

    await query(
      `UPDATE crm.business_tracking SET
         forwarded=TRUE, forwarded_by=$1, forward_date=NOW(),
         file_status='FORWARDED', ready_for_update=TRUE,
         is_complete=TRUE, updated_at=NOW()
       WHERE file_no=$2`,
      [req.user!.username, fileNo]
    );

    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,'BT_FORWARD',$2)`,
      [req.user!.sub, `Forwarded ${fileNo}`]
    ).catch(() => {});

    res.json({ ok: true });
  } catch (err) { handleError(res, err, "forward file"); }
});

// ─── POST /business/:fileNo/notes ────────────────────────────────────────────
router.post("/business/:fileNo/notes", async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  const { notes } = req.body as { notes: string };
  if (!notes?.trim()) { res.status(400).json({ ok: false, error: "Note content is required." }); return; }
  try {
    const row = await queryOne<{ note_id: number }>(
      `INSERT INTO crm.business_tracking_notes
         (file_no, note_from, notes, note_date, is_active)
       VALUES ($1,$2,$3,NOW(),TRUE)
       RETURNING note_id`,
      [fileNo, req.user!.username, notes.trim()]
    );
    res.status(201).json({ ok: true, data: { note_id: row?.note_id } });
  } catch (err) { handleError(res, err, "add note"); }
});

// ─── DELETE /business/:fileNo/notes/:id ──────────────────────────────────────
router.delete("/business/:fileNo/notes/:id", async (req: Request, res: Response) => {
  try {
    await query(
      `UPDATE crm.business_tracking_notes SET is_active=FALSE WHERE note_id=$1 AND file_no=$2`,
      [req.params.id, req.params.fileNo]
    );
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "delete note"); }
});

// ─── POST /business/:fileNo/checklist/:reqId ─────────────────────────────────
router.post("/business/:fileNo/checklist/:reqId", async (req: Request, res: Response) => {
  const { fileNo, reqId } = req.params;
  try {
    await query(
      `INSERT INTO crm.business_doc_checklist (file_no, req_id, acknowledged_by, acknowledged_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (file_no, req_id) DO UPDATE
         SET acknowledged_by=$3, acknowledged_at=NOW()`,
      [fileNo, Number(reqId), req.user!.username]
    );
    // Check if all required docs are acknowledged → set is_complete
    await query(
      `UPDATE crm.business_tracking bt SET is_complete = (
         SELECT COUNT(*) = (
           SELECT COUNT(*) FROM crm.business_req
           WHERE is_active=TRUE AND (applies_to='ALL' OR applies_to=bt.client_type)
         )
         FROM crm.business_doc_checklist dc
         WHERE dc.file_no=bt.file_no
       ), updated_at=NOW()
       WHERE bt.file_no=$1`,
      [fileNo]
    );
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "acknowledge doc"); }
});

// ─── DELETE /business/:fileNo/checklist/:reqId ───────────────────────────────
router.delete("/business/:fileNo/checklist/:reqId", async (req: Request, res: Response) => {
  try {
    await query(
      `DELETE FROM crm.business_doc_checklist WHERE file_no=$1 AND req_id=$2`,
      [req.params.fileNo, Number(req.params.reqId)]
    );
    await query(
      `UPDATE crm.business_tracking SET is_complete=FALSE, updated_at=NOW() WHERE file_no=$1`,
      [req.params.fileNo]
    );
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "remove doc ack"); }
});

// ─── POST /business/:fileNo/allocate ─────────────────────────────────────────
router.post("/business/:fileNo/allocate", async (req: Request, res: Response) => {
  const { allocated_to } = req.body as { allocated_to: string };
  if (!allocated_to) { res.status(400).json({ ok: false, error: "allocated_to is required." }); return; }
  try {
    await query(
      `UPDATE crm.business_tracking SET
         allocated=TRUE, allocated_to=$1, allocate_dt=NOW(),
         file_status='ALLOCATED', updated_at=NOW()
       WHERE file_no=$2`,
      [allocated_to, req.params.fileNo]
    );
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "allocate file"); }
});

// ─── GET /business/:fileNo/uploads ───────────────────────────────────────────
router.get("/business/:fileNo/uploads", async (req: Request, res: Response) => {
  try {
    const rows = await query<{
      upload_id: number; req_id: number | null; filename: string;
      filesize: number | null; mime_type: string | null;
      storage_key: string; uploaded_by: string; uploaded_at: string;
    }>(
      `SELECT upload_id, req_id, filename, filesize, mime_type,
              storage_key, uploaded_by, uploaded_at
       FROM crm.business_uploads
       WHERE file_no=$1 AND is_active=TRUE
       ORDER BY uploaded_at DESC`,
      [req.params.fileNo]
    );
    res.json({ ok: true, data: rows });
  } catch (err) { handleError(res, err, "list uploads"); }
});

// ─── POST /business/:fileNo/uploads ──────────────────────────────────────────
// Records a GCS upload (presigned URL upload done client-side) and auto-acknowledges the doc.
router.post("/business/:fileNo/uploads", async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  const { req_id, filename, filesize, mime_type, storage_key } =
    req.body as {
      req_id?: number; filename: string; filesize?: number;
      mime_type?: string; storage_key: string;
    };
  if (!filename || !storage_key) {
    res.status(400).json({ ok: false, error: "filename and storage_key are required." });
    return;
  }
  try {
    // Insert upload record
    const row = await queryOne<{ upload_id: number }>(
      `INSERT INTO crm.business_uploads
         (file_no, req_id, filename, filesize, mime_type, storage_key, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING upload_id`,
      [fileNo, req_id ?? null, filename, filesize ?? null, mime_type ?? null,
       storage_key, req.user!.username]
    );

    // Auto-acknowledge the requirement if req_id provided
    if (req_id && row?.upload_id) {
      await query(
        `INSERT INTO crm.business_doc_checklist
           (file_no, req_id, acknowledged_by, acknowledged_at, upload_id)
         VALUES ($1,$2,$3,NOW(),$4)
         ON CONFLICT (file_no, req_id) DO UPDATE
           SET acknowledged_by=$3, acknowledged_at=NOW(), upload_id=$4`,
        [fileNo, req_id, req.user!.username, row.upload_id]
      );
      // Recompute is_complete
      await query(
        `UPDATE crm.business_tracking bt SET is_complete = (
           SELECT COUNT(*) = (
             SELECT COUNT(*) FROM crm.business_req
             WHERE is_active=TRUE AND (applies_to='ALL' OR applies_to=bt.client_type)
           )
           FROM crm.business_doc_checklist dc
           WHERE dc.file_no=bt.file_no
         ), updated_at=NOW()
         WHERE bt.file_no=$1`,
        [fileNo]
      );
    }

    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,'BT_UPLOAD',$2)`,
      [req.user!.sub, `Uploaded ${filename} for ${fileNo}`]
    ).catch(() => {});

    res.status(201).json({ ok: true, data: { upload_id: row?.upload_id } });
  } catch (err) { handleError(res, err, "record upload"); }
});

// ─── DELETE /business/:fileNo/uploads/:uploadId ───────────────────────────────
router.delete("/business/:fileNo/uploads/:uploadId", async (req: Request, res: Response) => {
  try {
    await query(
      `UPDATE crm.business_uploads SET is_active=FALSE
       WHERE upload_id=$1 AND file_no=$2`,
      [Number(req.params.uploadId), req.params.fileNo]
    );
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "delete upload"); }
});

export default router;
