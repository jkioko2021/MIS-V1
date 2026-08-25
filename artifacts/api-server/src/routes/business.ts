import { Readable } from "node:stream";
import { Router, type Request, type Response } from "express";
import { query, queryOne, withTransaction, txQuery } from "../lib/postgres";
import { requireAuth } from "../lib/auth-middleware";
import { requireAllocatedFileReadAccess, requireBpoAllocatedAccess, requireBpoForwardAccess, requireBpoReviewAccess, requireBusinessDeleteAccess, requireBusinessFileAccess, requireBusinessTrackingAccess } from "../lib/business-permissions";
import { logger } from "../lib/logger";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const objectStorageService = new ObjectStorageService();

function handleError(res: Response, err: unknown, ctx: string) {
  logger.error({ err, ctx }, "Business route error");
  res.status(500).json({ ok: false, error: "Unable to complete the business operation." });
}

const CLIENT_TYPES = new Set(["R", "S", "C"]);
const BUSINESS_TYPES = new Set(["N", "R", "A", "T", "RT", "CC", "PR", "NE", "FT", "SU", "LS"]);
const COVERAGE_TYPES = new Set(["M", "N"]);
const PAYMENT_MODES = new Set(["MPESA", "EFT", "CHEQ", "IPF"]);
const CARD_TYPES = new Set(["MTIBA", "SMART"]);
const GI_CATEGORIES = new Set(["Non_Motor", "Motor"]);
const CORPORATE_CATEGORIES = new Set(["Public", "Private"]);
const WALK_IN_DEPARTMENTS = ["MEMBERSHIP", "NONMEDICAL"];
const BPO_ADMIN_PROFILES = ["bpo", "bpo admin", "bpo review"];
const BPO_REVIEW_ACTIONS = new Set(["RI", "A", "MU", "HO", "CA"]);
const CORPORATE_SME_BPO_REVIEW_ACTIONS = new Set(["RI", "A", "MU", "CA"]);
const BPO_PRODUCTS = new Set(["T", "S", "AS"]);
const ALLOCATED_FILE_ACTIONS = new Set(["RI", "MU", "CA"]);
const PAYMENT_STATUSES = new Set(["FULL-PAID", "PART-PAID", "NOT-PAID"]);
const ALLOCATED_FILE_ACTION_OPTIONS = [
  {
    code: "CA",
    label: "Cashier",
    destination: "Cashier / Finance",
    requires_invoice: true,
    requires_payment_status: true,
  },
  {
    code: "MU",
    label: "Medical UW",
    destination: "Medical Underwriting",
    requires_invoice: false,
    requires_payment_status: false,
  },
  {
    code: "RI",
    label: "Return Incomplete",
    destination: "Originating registration team",
    requires_invoice: false,
    requires_payment_status: false,
  },
] as const;
const DOCUMENT_EXTENSIONS = new Set([".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".rar", ".zip"]);
const AML_RISK_RATES = new Set(["Low", "Medium", "High"]);

function bpoQueueName(clientType: string): "BPO_REVIEW_RETAIL" | "BPO_REVIEW_CORPORATE_SME" {
  return clientType === "R" ? "BPO_REVIEW_RETAIL" : "BPO_REVIEW_CORPORATE_SME";
}

interface BusinessInput {
  client_type?: unknown;
  client_sub_type?: unknown;
  business_type?: unknown;
  business?: unknown;
  proposer_name?: unknown;
  nid?: unknown;
  pin_no?: unknown;
  county_code?: unknown;
  gi_category?: unknown;
  agent_id?: unknown;
  walk_in_client?: unknown;
  walk_in_auth?: unknown;
  allocated_to?: unknown;
  cr12?: unknown;
  cr12_ref?: unknown;
  corp_category?: unknown;
  sector?: unknown;
  pay_ref_no?: unknown;
  paid_amt?: unknown;
  pay_mode?: unknown;
  card_type?: unknown;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeUploadFilename(filename: string): string {
  return filename
    .replace(/[/\\]/g, "_")
    .replace(/[^\w.\- ()]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 255);
}

function uploadDocumentValidation(input: {
  filename: string;
  filesize?: number;
  reqName: string;
  invoiceNo?: unknown;
  amount?: unknown;
  policyCode?: unknown;
  riskRate?: unknown;
  riskReason?: unknown;
}): string | null {
  const filename = safeUploadFilename(input.filename);
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (!filename || !DOCUMENT_EXTENSIONS.has(extension)) {
    return "Upload a supported Word, Excel, image, PDF, RAR, or ZIP document.";
  }
  if (input.filesize != null && (!Number.isFinite(input.filesize) || input.filesize <= 0 || input.filesize > 10 * 1024 * 1024)) {
    return "Documents must be between 1 byte and 10 MB.";
  }

  const requirementName = input.reqName.toLowerCase();
  const invoiceNo = text(input.invoiceNo);
  const amountText = text(input.amount);
  const riskRate = text(input.riskRate);
  const riskReason = text(input.riskReason);
  const isCreditNote = requirementName.includes("credit note");
  const isInvoice = requirementName.includes("invoice") && !isCreditNote;
  // The legacy special case is RET43 (AML risk details), not the AML Report
  // document required for a Cashier handoff.
  const isAmlRisk = /aml\s*risk|risk\s*rating/.test(requirementName);

  if ((isInvoice || isCreditNote) && (invoiceNo.length < 1 || invoiceNo.length > 25)) {
    return "Enter an invoice or credit-note number between 1 and 25 characters.";
  }
  if (isCreditNote) {
    const amount = Number(amountText);
    if (!amountText || !Number.isFinite(amount) || amount < 0) {
      return "Enter a valid non-negative amount for a credit note.";
    }
  }
  if (input.policyCode != null && text(input.policyCode).length > 100) {
    return "Policy code must be 100 characters or fewer.";
  }
  if (isAmlRisk && (!AML_RISK_RATES.has(riskRate) || !riskReason)) {
    return "AML risk documents require a risk rate and rating reason.";
  }
  return null;
}

async function walkInStaffValidationError(allocatedTo: unknown, authorisedBy: unknown): Promise<string | null> {
  const selectedUsers = [...new Set([text(allocatedTo), text(authorisedBy)].filter(Boolean))];
  if (selectedUsers.length === 0) return null;

  const rows = await query<{ username: string }>(
    `SELECT e.username
     FROM crm.employees e
     WHERE e.username = ANY($1::text[])
       AND e.department = ANY($2::text[])
       AND e.activated=TRUE
       AND e.approved=TRUE
       AND e.employee_locked=FALSE
       AND e.is_deleted=FALSE`,
    [selectedUsers, WALK_IN_DEPARTMENTS],
  );

  return rows.length === selectedUsers.length
    ? null
    : "Walk-in allocation and authorisation must use an active approved Membership or Nonmedical employee.";
}

async function bpoAdminValidationError(allocatedTo: unknown): Promise<string | null> {
  const username = text(allocatedTo);
  if (!username) return "Select an active approved BPO Admin for allocation.";
  const staff = await queryOne<{ username: string }>(
    `SELECT e.username
     FROM crm.employees e
     JOIN crm.profiles p ON p.profile_id=e.profile_id
     WHERE e.username=$1
        AND e.department='BPO'
        AND LOWER(p.profile_name) = ANY($2::text[])
        AND p.is_active=TRUE
       AND e.activated=TRUE
       AND e.approved=TRUE
       AND e.employee_locked=FALSE
       AND e.is_deleted=FALSE`,
    [username, BPO_ADMIN_PROFILES],
  );
  return staff ? null : "Allocation must use an active approved BPO Admin.";
}

function validateBusinessInput(input: BusinessInput): string[] {
  const errors: string[] = [];
  const clientType = text(input.client_type);
  const businessType = text(input.business_type);
  const coverageType = text(input.business);
  const paidAmountText = text(input.paid_amt);
  const paymentMode = text(input.pay_mode);
  const cardType = text(input.card_type);

  if (!CLIENT_TYPES.has(clientType)) errors.push("Select Retail or SME/Corporate.");
  if (!text(input.proposer_name)) errors.push("Proposer name is required.");
  if (!BUSINESS_TYPES.has(businessType)) errors.push("Select a valid business action.");
  if (!COVERAGE_TYPES.has(coverageType)) errors.push("Select Medical or Non Medical coverage.");
  if (!text(input.agent_id)) errors.push("Agent/Broker is required.");
  if (cardType && !CARD_TYPES.has(cardType)) errors.push("Select a valid card type.");

  if (paidAmountText || paymentMode) {
    const paidAmount = Number(paidAmountText);
    if (!paidAmountText || !Number.isFinite(paidAmount) || paidAmount < 0) {
      errors.push("Paid amount must be a valid non-negative number.");
    }
    if (!PAYMENT_MODES.has(paymentMode)) errors.push("Select a valid payment mode.");
  }

  if (clientType === "R") {
    if (coverageType === "N") {
      if (!text(input.nid)) errors.push("NID is required for Non-Medical Retail.");
      if (!text(input.pin_no)) errors.push("PIN No. is required for Non-Medical Retail.");
      if (!text(input.county_code)) errors.push("County is required for Non-Medical Retail.");
      if (!GI_CATEGORIES.has(text(input.gi_category))) errors.push("GI Category is required for Non-Medical Retail.");
    }
    if (text(input.walk_in_client) === "Y" && !text(input.allocated_to)) {
      errors.push("Allocate To is required for a walk-in Retail file.");
    }
    if (text(input.walk_in_client) === "Y" && !text(input.walk_in_auth)) {
      errors.push("Walk-in authoriser is required for a walk-in Retail file.");
    }
  }

  if (clientType !== "R") {
    if (businessType === "N") {
      if (!text(input.cr12_ref)) errors.push("CR12 reference number is required for new SME/Corporate business.");
      if (!text(input.county_code)) errors.push("County is required for new SME/Corporate business.");
      if (!CORPORATE_CATEGORIES.has(text(input.corp_category))) errors.push("Business Category is required for new SME/Corporate business.");
      if (!text(input.sector)) errors.push("Industry Sector is required for new SME/Corporate business.");
    } else if (text(input.corp_category) && !CORPORATE_CATEGORIES.has(text(input.corp_category))) {
      errors.push("Business Category is invalid.");
    }
    if (coverageType === "N" && !GI_CATEGORIES.has(text(input.gi_category))) {
      errors.push("GI Category is required for Non-Medical business.");
    }
  }

  return errors;
}

async function refreshSelectedDocumentCompletion(fileNo: string) {
  await query(
    `UPDATE crm.business_tracking bt
     SET is_complete = EXISTS (
           SELECT 1
           FROM crm.business_doc_checklist dc
           WHERE dc.file_no=bt.file_no
             AND dc.is_selected=TRUE
         )
         AND NOT EXISTS (
           SELECT 1
           FROM crm.business_doc_checklist dc
           WHERE dc.file_no=bt.file_no
             AND dc.is_selected=TRUE
             AND NOT EXISTS (
               SELECT 1
               FROM crm.business_uploads bu
               WHERE bu.file_no=bt.file_no
                 AND bu.req_id=dc.req_id
                 AND bu.is_active=TRUE
             )
         ),
         updated_at=NOW()
     WHERE bt.file_no=$1`,
    [fileNo],
  );
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

router.get("/business/sectors", async (_req: Request, res: Response) => {
  try {
    const rows = await query<{ sector_name: string }>(
      `SELECT sector_name
       FROM crm.business_sectors
       WHERE is_active=TRUE
       ORDER BY sector_name`
    );
    res.json({ ok: true, data: rows.map((row) => row.sector_name) });
  } catch (err) { handleError(res, err, "get sectors"); }
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

// ─── Business workflows require both authentication and a business profile ────
router.use(requireAuth, requireBusinessTrackingAccess);

// ─── GET /business/bpo-reviewers ─────────────────────────────────────────────
router.get("/business/bpo-reviewers", requireBpoForwardAccess, async (_req: Request, res: Response) => {
  try {
    const reviewers = await query(
      `SELECT e.username, e.employee_name, e.department
       FROM crm.employees e
       JOIN crm.profiles p ON p.profile_id=e.profile_id
       WHERE e.activated=TRUE
         AND e.approved=TRUE
         AND e.employee_locked=FALSE
         AND e.is_deleted=FALSE
         AND e.department='BPO'
         AND p.is_active=TRUE
         AND LOWER(p.profile_name) = ANY($1::text[])
       ORDER BY e.employee_name`,
       [BPO_ADMIN_PROFILES],
    );
    res.json({ ok: true, data: reviewers });
  } catch (err) { handleError(res, err, "get BPO reviewers"); }
});

// Allocation handoffs are intentionally server-defined so that the client does
// not become the source of truth for permitted workflow outcomes.
router.get("/business/allocated/action-options", requireBpoAllocatedAccess, (_req: Request, res: Response) => {
  res.json({ ok: true, data: ALLOCATED_FILE_ACTION_OPTIONS });
});

// The legacy rating-reason list belongs to the separate AAR Risk database.
// Keep this dependency explicit until it is connected to the approved platform.
router.get("/business/aml/risk-reasons", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    data: {
      available: false,
      reasons: [],
      message: "AML rating reasons are unavailable because the legacy AAR Risk reference source is not connected.",
    },
  });
});

router.get("/business/walk-in-staff", async (_req: Request, res: Response) => {
  try {
    const staff = await query(
      `SELECT e.username, e.employee_name, e.department
       FROM crm.employees e
       WHERE e.department = ANY($1::text[])
         AND e.activated=TRUE
         AND e.approved=TRUE
         AND e.employee_locked=FALSE
         AND e.is_deleted=FALSE
       ORDER BY e.employee_name`,
      [WALK_IN_DEPARTMENTS],
    );
    res.json({ ok: true, data: staff });
  } catch (err) { handleError(res, err, "get walk-in staff"); }
});

// ─── POST /business/register ──────────────────────────────────────────────────
router.post("/business/register", async (req: Request, res: Response) => {
  const {
    client_type, business_type, business, proposer_name, receive_dt,
    nid, pin_no, walk_in_client, walk_in_auth, card_type,
    cr12, cr12_ref, corp_category, sector, client_sub_type,
    agent_id, county_code, gi_category,
    pay_ref_no, paid_amt, pay_mode, rate_type, family_code,
    is_mtiba, is_ipf, allocated_to,
  } = req.body as Record<string, unknown>;

  if (!client_type || !business_type || !business || !proposer_name) {
    res.status(400).json({ ok: false, error: "client_type, business_type, business, proposer_name are required." });
    return;
  }
  const validationErrors = validateBusinessInput(req.body as BusinessInput);
  if (validationErrors.length > 0) {
    res.status(400).json({ ok: false, error: validationErrors.join(" ") });
    return;
  }
  if (client_type === "R" && walk_in_client === "Y") {
    const staffError = await walkInStaffValidationError(allocated_to, walk_in_auth);
    if (staffError) {
      res.status(400).json({ ok: false, error: staffError });
      return;
    }
  }

  try {
    // ── Transaction with advisory lock ─────────────────────────────────────
    // pg_advisory_xact_lock ensures only one registration per client type runs
    // at a time, preventing duplicate file numbers under concurrent load.
    // Keep independent sequences for the three legacy client codes.
    const file_no = await withTransaction(async (client) => {
      const lockId = String(client_type) === "R"
        ? 1001
        : String(client_type) === "S"
          ? 1002
          : 1003;
      await txQuery(client, "SELECT pg_advisory_xact_lock($1)", [lockId]);

      // Generate file_no while holding the lock
      const prefix = String(client_type);
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      const pattern = `${prefix}-${mm}/${yy}/-%`;

      const lastRows = await txQuery<{ file_no: string }>(
        client,
        `SELECT file_no FROM crm.business_tracking
         WHERE file_no LIKE $1 ORDER BY created_at DESC LIMIT 1`,
        [pattern]
      );
      let seq = 1;
      const lastRow = lastRows[0];
      if (lastRow?.file_no) {
        const parts = lastRow.file_no.split("-");
        const lastSeq = parseInt(parts[parts.length - 1] ?? "0", 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      const newFileNo = `${prefix}-${mm}/${yy}/-${String(seq).padStart(6, "0")}`;

      // INSERT inside the same transaction — advisory lock is still held
      await txQuery(
        client,
        `INSERT INTO crm.business_tracking (
           file_no, proposer_name, family_code, receive_dt,
           file_status, business_type, client_type, business,
           agent_id, is_mtiba, is_ipf, walk_in_client,
           rate_type, benefit_verified, medical_uw,
           allocated, invoiced, forwarded, is_complete, ready_for_update,
           is_active, is_declined,
           pay_ref_no, paid_amt, entered_by,
           nid, pin_no, county_code, card_type, gi_category,
           pay_mode, sector, cr12, cr12_ref, corp_category, walk_in_auth,
           client_sub_type
         ) VALUES (
           $1,$2,$3,CURRENT_DATE,
           'REGISTERED',$4,$5,$6,
           $7,$8,$9,$10,
           $11,'NO',FALSE,
           FALSE,FALSE,FALSE,FALSE,FALSE,
           TRUE,FALSE,
           $12,$13,$14,
           $15,$16,$17,$18,$19,
           $20,$21,$22,$23,$24,$25,
           $26
         )`,
        [
           newFileNo, String(proposer_name).trim(), family_code || null,
          String(business_type), String(client_type), String(business),
          agent_id || null, !!is_mtiba, !!is_ipf,
          client_type === "R" && walk_in_client === "Y" ? "Y" : "N",
          rate_type || "S",
          pay_ref_no || null, paid_amt ? Number(paid_amt) : null,
          req.user!.username,
           client_type === "R" ? nid || null : null,
           client_type === "R" ? pin_no || null : null,
           county_code || null,
          card_type || null, gi_category || null,
           pay_mode || null, client_type !== "R" ? sector || null : null,
           client_type !== "R" && (cr12 === true || cr12 === "true"),
           client_type !== "R" ? cr12_ref || null : null,
           client_type !== "R" ? corp_category || null : null,
           client_type === "R" ? walk_in_auth || null : null,
           client_type !== "R" ? client_type : null,
        ]
      );

      if (client_type === "R" && walk_in_client === "Y" && allocated_to) {
        await txQuery(
          client,
          `UPDATE crm.business_tracking
           SET allocated=TRUE, allocated_to=$2, allocate_dt=NOW()
           WHERE file_no=$1`,
          [newFileNo, allocated_to]
        );
      }

      return newFileNo;
    });

    await query(
      `INSERT INTO crm.admin_audit_trail (username, action_type, description) VALUES ($1, 'BT_REGISTER', $2)`,
      [req.user!.sub, `Registered ${file_no} — ${proposer_name}`]
    ).catch(() => {});

    res.status(201).json({ ok: true, data: { file_no } });
  } catch (err) { handleError(res, err, "register file"); }
});

// ─── PUT /business/:fileNo ────────────────────────────────────────────────────
router.put("/business/:fileNo", requireBusinessFileAccess, async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  const {
    proposer_name, family_code, receive_dt,
    business_type, business, agent_id,
    nid, pin_no, walk_in_client, walk_in_auth, card_type,
    cr12, cr12_ref, corp_category, sector, client_sub_type,
    county_code, gi_category,
    pay_ref_no, paid_amt, pay_mode, rate_type,
    is_mtiba, is_ipf,
    allocated_to, medical_uw, benefit_verified, invoiced,
  } = req.body as Record<string, unknown>;

  try {
    const exists = await queryOne<{ file_no: string; client_type: string; receive_dt: string }>(
      `SELECT file_no, client_type, receive_dt FROM crm.business_tracking WHERE file_no=$1`,
      [fileNo]
    );
    if (!exists) { res.status(404).json({ ok: false, error: "File not found." }); return; }
    const validationErrors = validateBusinessInput({ ...(req.body as BusinessInput), client_type: exists.client_type });
    if (validationErrors.length > 0) {
      res.status(400).json({ ok: false, error: validationErrors.join(" ") });
      return;
    }
    if (text(allocated_to) || (exists.client_type === "R" && walk_in_client === "Y")) {
      const staffError = await walkInStaffValidationError(
        allocated_to,
        exists.client_type === "R" && walk_in_client === "Y" ? walk_in_auth : "",
      );
      if (staffError) {
        res.status(400).json({ ok: false, error: staffError });
        return;
      }
    }

    await query(
      `UPDATE crm.business_tracking SET
         proposer_name=$1, family_code=$2, receive_dt=$3,
         business_type=$4, business=$5, agent_id=$6,
         nid=$7, pin_no=$8, walk_in_client=$9, walk_in_auth=$10, card_type=$11,
         cr12=$12, cr12_ref=$13, corp_category=$14, sector=$15,
         county_code=$16, gi_category=$17,
         pay_ref_no=$18, paid_amt=$19, pay_mode=$20, rate_type=$21,
         is_mtiba=$22, is_ipf=$23,
          allocated_to=CASE
            WHEN NULLIF($24::text, '') IS NULL THEN allocated_to
            ELSE $24::text
          END,
          allocated=CASE
            WHEN NULLIF($24::text, '') IS NULL THEN allocated
            ELSE TRUE
          END,
          allocate_dt=CASE
            WHEN NULLIF($24::text, '') IS NULL THEN allocate_dt
            WHEN $24::text IS DISTINCT FROM allocated_to THEN NOW()
            ELSE allocate_dt
          END,
          medical_uw=$25, benefit_verified=$26, invoiced=$27,
         client_sub_type=$28,
         updated_at=NOW()
       WHERE file_no=$29`,
      [
        String(proposer_name), family_code || null,
        exists.receive_dt,
        String(business_type), String(business), agent_id || null,
         exists.client_type === "R" ? nid || null : null,
         exists.client_type === "R" ? pin_no || null : null,
         exists.client_type === "R" && walk_in_client === "Y" ? "Y" : "N",
         exists.client_type === "R" ? walk_in_auth || null : null,
         card_type || null,
         exists.client_type !== "R" && (cr12 === true || cr12 === "true"),
         exists.client_type !== "R" ? cr12_ref || null : null,
         exists.client_type !== "R" ? corp_category || null : null,
         exists.client_type !== "R" ? sector || null : null,
        county_code || null, gi_category || null,
        pay_ref_no || null, paid_amt ? Number(paid_amt) : null, pay_mode || null,
        rate_type || "S",
        !!is_mtiba, !!is_ipf,
        allocated_to || null, !!medical_uw,
        benefit_verified || "NO", !!invoiced,
         exists.client_type !== "R" ? exists.client_type : null,
        fileNo,
      ]
    );

    await query(
      `INSERT INTO crm.admin_audit_trail (username, action_type, description) VALUES ($1,'BT_UPDATE',$2)`,
      [req.user!.sub, `Updated ${fileNo}`]
    ).catch(() => {});

    res.json({ ok: true });
  } catch (err) { handleError(res, err, "update file"); }
});

// ─── DELETE /business/:fileNo ─────────────────────────────────────────────────
// Tracking deletion remains a soft delete and is deliberately limited to
// unforwarded REGISTERED files so workflow history and related records survive.
router.delete(
  "/business/:fileNo",
  requireBusinessDeleteAccess,
  requireBusinessFileAccess,
  async (req: Request, res: Response) => {
    const { fileNo } = req.params;
    try {
      await withTransaction(async (client) => {
        await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [fileNo]);
        const [file] = await txQuery<{ file_status: string; forwarded: boolean; is_active: boolean }>(
          client,
          `SELECT file_status, forwarded, is_active
           FROM crm.business_tracking
           WHERE file_no=$1
           FOR UPDATE`,
          [fileNo],
        );
        if (!file?.is_active) throw new Error("FILE_NOT_FOUND");
        if (file.file_status !== "REGISTERED" || file.forwarded) throw new Error("DELETE_NOT_ALLOWED");

        const openItems = await txQuery(
          client,
          `SELECT work_item_id FROM crm.business_work_items
           WHERE file_no=$1 AND work_status='OPEN'
           FOR UPDATE`,
          [fileNo]
        );
        if (openItems.length > 0) throw new Error("OPEN_WORK_ITEM");

        const updated = await txQuery<{ file_no: string }>(
          client,
          `UPDATE crm.business_tracking
           SET is_active=FALSE, updated_at=NOW()
            WHERE file_no=$1
              AND is_active=TRUE
              AND file_status='REGISTERED'
              AND forwarded=FALSE
            RETURNING file_no`,
          [fileNo],
        );
        if (updated.length === 0) throw new Error("DELETE_NOT_ALLOWED");
        await txQuery(
          client,
          `INSERT INTO crm.admin_audit_trail (username, action_type, description)
           VALUES ($1, 'BT_DELETE', $2)`,
          [req.user!.username, `Soft-deleted ${fileNo}`]
        );
      });

      res.json({ ok: true });
    } catch (err) {
      if (err instanceof Error && err.message === "FILE_NOT_FOUND") {
        res.status(404).json({ ok: false, error: "File not found." });
        return;
      }
      if (err instanceof Error && err.message === "DELETE_NOT_ALLOWED") {
        res.status(409).json({ ok: false, error: "Only unforwarded REGISTERED files can be deleted." });
        return;
      }
      if (err instanceof Error && err.message === "OPEN_WORK_ITEM") {
        res.status(409).json({ ok: false, error: "This file has an open workflow item and cannot be deleted." });
        return;
      }
      handleError(res, err, "delete business file");
    }
  }
);

// ─── POST /business/:fileNo/forward ──────────────────────────────────────────
// Mirrors the legacy btnforward_Click state machine exactly.
router.post("/business/:fileNo/forward", requireBpoForwardAccess, async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  const { to_user, comments } = req.body as { to_user?: string; comments?: string };
  const assignedTo = to_user?.trim() || null;

  if (!comments?.trim()) {
    res.status(400).json({ ok: false, error: "Comments are required when forwarding." });
    return;
  }

  try {
    if (assignedTo) {
      const reviewer = await queryOne(
        `SELECT e.username
         FROM crm.employees e
         JOIN crm.profiles p ON p.profile_id=e.profile_id
         WHERE e.username=$1
           AND e.activated=TRUE
           AND e.approved=TRUE
           AND e.employee_locked=FALSE
           AND e.is_deleted=FALSE
           AND p.is_active=TRUE
           AND LOWER(p.profile_name) IN ('bpo', 'bpo review')`,
        [assignedTo],
      );
      if (!reviewer) {
        res.status(400).json({ ok: false, error: "Select an active BPO reviewer." });
        return;
      }
    }

    // Status transition, BPO work item, handover note, and audit entry are a
    // single unit of work so a file can never be forwarded without reaching BPO.
    const result = await withTransaction(async (client) => {
      // Serialize handoffs per file so a retry cannot add duplicate notes/audit
      // entries while another request is creating the BPO work item.
      await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [fileNo]);
      const [file] = await txQuery<{
        file_status: string; is_complete: boolean; allocated: boolean; forwarded: boolean;
        business: string; medical_uw: boolean; invoiced: boolean;
        benefit_verified: string; walk_in_client: string; client_type: string;
      }>(
        client,
        `SELECT file_status, is_complete, allocated, forwarded, business, medical_uw, invoiced,
                benefit_verified, walk_in_client, client_type
         FROM crm.business_tracking
         WHERE file_no=$1 AND is_active=TRUE
         FOR UPDATE`,
        [fileNo],
      );
      if (!file) throw new Error("FILE_NOT_FOUND");
      const queueName = bpoQueueName(file.client_type);

      const [existingWorkItem] = await txQuery<{ work_item_id: number; work_status: string }>(
        client,
        `SELECT work_item_id, work_status
         FROM crm.business_work_items
          WHERE file_no=$1 AND queue_name=$2
         FOR UPDATE`,
        [fileNo, queueName],
      );
      if (existingWorkItem?.work_status === "OPEN") {
        const [currentFile] = await txQuery<{ file_status: string }>(
          client,
          `SELECT file_status FROM crm.business_tracking WHERE file_no=$1`,
          [fileNo],
        );
        return {
          newStatus: currentFile?.file_status ?? file.file_status,
          workItemId: existingWorkItem.work_item_id,
          alreadyRouted: true,
          queueName,
        };
      }
      if (!["REGISTERED", "RETURNED-INCOMPLETE"].includes(file.file_status) || file.forwarded) throw new Error("FORWARD_NOT_ALLOWED");
      const [selectedDocuments] = await txQuery<{ selected_count: string; missing_upload_count: string }>(
        client,
        `SELECT
           COUNT(*)::text AS selected_count,
           COUNT(*) FILTER (
             WHERE NOT EXISTS (
               SELECT 1
               FROM crm.business_uploads bu
               WHERE bu.file_no=dc.file_no
                 AND bu.req_id=dc.req_id
                 AND bu.is_active=TRUE
             )
           )::text AS missing_upload_count
         FROM crm.business_doc_checklist dc
         WHERE dc.file_no=$1
           AND dc.is_selected=TRUE`,
        [fileNo],
      );
      if (Number(selectedDocuments?.selected_count ?? 0) === 0) throw new Error("NO_DOCUMENTS_SELECTED");
      if (Number(selectedDocuments?.missing_upload_count ?? 0) > 0) throw new Error("DOCS_PENDING");

      // An open BPO work item is always a forwarded file. Any subsequent BPO
      // decision sets its own final status only after completing that work item.
      const newStatus = "FORWARDED";
      let updateSql: string;
      let updateParams: unknown[];

      if (file.medical_uw && !file.allocated) {
        updateSql = `UPDATE crm.business_tracking SET
          forwarded=TRUE, is_complete=TRUE, ready_for_update=FALSE,
          file_status=$1, forward_date=NOW(), forwarded_by=$2, updated_at=NOW()
          WHERE file_no=$3 AND is_active=TRUE AND file_status IN ('REGISTERED', 'RETURNED-INCOMPLETE') AND forwarded=FALSE
          RETURNING file_no`;
        updateParams = [newStatus, req.user!.username, fileNo];
      } else if (file.allocated && file.benefit_verified === "NO") {
        updateSql = `UPDATE crm.business_tracking SET
          forwarded=TRUE, is_complete=TRUE, allocated=TRUE, ready_for_update=TRUE,
          file_status=$1, forward_date=NOW(), forwarded_by=$2, updated_at=NOW()
          WHERE file_no=$3 AND is_active=TRUE AND file_status IN ('REGISTERED', 'RETURNED-INCOMPLETE') AND forwarded=FALSE
          RETURNING file_no`;
        updateParams = [newStatus, req.user!.username, fileNo];
      } else if (file.allocated && file.benefit_verified !== "NO" && !file.invoiced) {
        updateSql = `UPDATE crm.business_tracking SET
          forwarded=TRUE, is_complete=TRUE, allocated=TRUE, ready_for_update=TRUE,
          file_status=$1, forward_date=NOW(), forwarded_by=$2, updated_at=NOW()
          WHERE file_no=$3 AND is_active=TRUE AND file_status IN ('REGISTERED', 'RETURNED-INCOMPLETE') AND forwarded=FALSE
          RETURNING file_no`;
        updateParams = [newStatus, req.user!.username, fileNo];
      } else if (file.invoiced) {
        updateSql = `UPDATE crm.business_tracking SET
          forwarded=TRUE, is_complete=TRUE, allocated=TRUE, ready_for_update=TRUE,
          file_status=$1, forward_date=NOW(), forwarded_by=$2, updated_at=NOW()
          WHERE file_no=$3 AND is_active=TRUE AND file_status IN ('REGISTERED', 'RETURNED-INCOMPLETE') AND forwarded=FALSE
          RETURNING file_no`;
        updateParams = [newStatus, req.user!.username, fileNo];
      } else if (file.walk_in_client === "Y" && assignedTo) {
        updateSql = `UPDATE crm.business_tracking SET
          forwarded=TRUE, is_complete=TRUE, allocated=TRUE, ready_for_update=TRUE,
          benefit_verified='YES', walk_in_client='Y',
          allocated_to=$1, allocate_dt=NOW(),
          file_status=$2, forward_date=NOW(), forwarded_by=$3, updated_at=NOW()
          WHERE file_no=$4 AND is_active=TRUE AND file_status IN ('REGISTERED', 'RETURNED-INCOMPLETE') AND forwarded=FALSE
          RETURNING file_no`;
        updateParams = [assignedTo, newStatus, req.user!.username, fileNo];
      } else {
        updateSql = `UPDATE crm.business_tracking SET
          forwarded=TRUE, is_complete=TRUE, allocated=FALSE, ready_for_update=TRUE,
          file_status=$1, forward_date=NOW(), forwarded_by=$2, updated_at=NOW()
          WHERE file_no=$3 AND is_active=TRUE AND file_status IN ('REGISTERED', 'RETURNED-INCOMPLETE') AND forwarded=FALSE
          RETURNING file_no`;
        updateParams = [newStatus, req.user!.username, fileNo];
      }

      const updated = await txQuery<{ file_no: string }>(client, updateSql, updateParams);
      if (updated.length === 0) throw new Error("FORWARD_NOT_ALLOWED");

      const [workItem] = await txQuery<{ work_item_id: number }>(
        client,
        `INSERT INTO crm.business_work_items
           (file_no, queue_name, work_status, assigned_to, assigned_by, forwarded_by, forwarded_at)
          VALUES ($1, $2, 'OPEN', $3, $4, $4, NOW())
         ON CONFLICT (file_no, queue_name) DO UPDATE SET
           work_status='OPEN',
           assigned_to=EXCLUDED.assigned_to,
           assigned_by=EXCLUDED.assigned_by,
           forwarded_by=EXCLUDED.forwarded_by,
           forwarded_at=EXCLUDED.forwarded_at,
           updated_at=NOW()
         RETURNING work_item_id`,
        [fileNo, queueName, assignedTo, req.user!.username]
      );

      await txQuery(
        client,
        `INSERT INTO crm.business_tracking_notes (file_no, note_from, notes, note_date, is_active)
         VALUES ($1, $2, $3, NOW(), TRUE)`,
        [fileNo, req.user!.username, `Register → ${queueName}: ${comments.trim()}`]
      );

      const detail = `Register → ${queueName}: ${fileNo}. Forwarded by ${req.user!.username}${assignedTo ? `; assigned to ${assignedTo}` : ""}. Note: ${comments.trim()}`;
      await txQuery(
        client,
        `INSERT INTO crm.admin_audit_trail (username, action_type, description)
         VALUES ($1, 'BT_ROUTE_BPO_REVIEW', $2)`,
        [req.user!.username, detail]
      );

      return { newStatus, workItemId: workItem?.work_item_id, alreadyRouted: false, queueName };
    });

    res.json({
      ok: true,
      data: {
        new_status: result.newStatus,
        queue_name: result.queueName,
        work_item_id: result.workItemId,
        already_routed: result.alreadyRouted,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "FILE_NOT_FOUND") {
      res.status(404).json({ ok: false, error: "File not found." });
      return;
    }
    if (err instanceof Error && err.message === "FORWARD_NOT_ALLOWED") {
        res.status(409).json({ ok: false, error: "Only an active unforwarded REGISTERED or RETURNED-INCOMPLETE file can be forwarded." });
      return;
    }
    if (err instanceof Error && err.message === "NO_DOCUMENTS_SELECTED") {
      res.status(400).json({ ok: false, error: "Select at least one document to upload before forwarding." });
      return;
    }
    if (err instanceof Error && err.message === "DOCS_PENDING") {
      res.status(400).json({ ok: false, error: "Upload every selected document before forwarding." });
      return;
    }
    handleError(res, err, "forward file");
  }
});

// The Allocation Files workspace has its own owner-or-SuperAdmin boundary.
// These routes must be registered before the broad file-scoped middleware below.
router.get("/business/allocated/:fileNo/aml-status", requireAllocatedFileReadAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const file = await queryOne<{ business_type: string; uploaded: boolean }>(
      `SELECT bt.business_type,
              EXISTS (
                SELECT 1
                FROM crm.business_uploads bu
                JOIN crm.business_req br ON br.req_id=bu.req_id
                WHERE bu.file_no=bt.file_no
                  AND bu.is_active=TRUE
                  AND LOWER(TRIM(br.req_name))='aml report'
              ) AS uploaded
       FROM crm.business_tracking bt
       WHERE bt.file_no=$1 AND bt.is_active=TRUE`,
      [req.params.fileNo],
    );
    if (!file) {
      res.status(404).json({ ok: false, error: "Allocated file not found." });
      return;
    }
    const required = ["N", "R"].includes(file.business_type);
    res.json({
      ok: true,
      data: {
        required,
        uploaded: file.uploaded,
        valid: !required || file.uploaded,
      },
    });
  } catch (err) {
    handleError(res, err, "get allocated AML status");
  }
});

router.get("/business/allocated/:fileNo/uploads", requireAllocatedFileReadAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query<{
      upload_id: number; req_id: number | null; filename: string;
      filesize: number | null; mime_type: string | null;
      storage_key: string; uploaded_by: string; uploaded_at: string;
      invoice_no: string | null; amount: number | null; policy_code: string | null;
      risk_rate: string | null; risk_reason: string | null;
    }>(
      `SELECT upload_id, req_id, filename, filesize, mime_type,
              storage_key, uploaded_by, uploaded_at, invoice_no, amount,
              policy_code, risk_rate, risk_reason
       FROM crm.business_uploads
       WHERE file_no=$1 AND is_active=TRUE
       ORDER BY uploaded_at DESC`,
      [req.params.fileNo],
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    handleError(res, err, "list allocated uploads");
  }
});

// Document bytes use the existing presigned object-storage flow. This route
// records the allocation-scoped transaction after that upload succeeds.
router.post("/business/allocated/:fileNo/uploads", requireAllocatedFileReadAccess, async (req: Request, res: Response): Promise<void> => {
  const fileNo = Array.isArray(req.params.fileNo) ? req.params.fileNo[0] : req.params.fileNo;
  if (!fileNo) {
    res.status(400).json({ ok: false, error: "A file number is required." });
    return;
  }
  const { req_id, filename, filesize, mime_type, storage_key, invoice_no, amount, policy_code, risk_rate, risk_reason } =
    req.body as {
      req_id?: number; filename?: string; filesize?: number; mime_type?: string; storage_key?: string;
      invoice_no?: unknown; amount?: unknown; policy_code?: unknown; risk_rate?: unknown; risk_reason?: unknown;
    };
  if (!filename || !storage_key || !req_id) {
    res.status(400).json({ ok: false, error: "Select a document and provide its filename and storage key." });
    return;
  }
  try {
    const [file, requirement] = await Promise.all([
      queryOne<{ client_type: string }>(
        `SELECT client_type FROM crm.business_tracking
         WHERE file_no=$1 AND is_active=TRUE AND allocated=TRUE AND file_status='ALLOCATED'`,
        [fileNo],
      ),
      queryOne<{ req_id: number; req_name: string }>(
        `SELECT req_id, req_name FROM crm.business_req
         WHERE req_id=$1 AND is_active=TRUE`,
        [Number(req_id)],
      ),
    ]);
    if (!file || !requirement) {
      res.status(404).json({ ok: false, error: "Allocated file or document requirement not found." });
      return;
    }
    const applies = await queryOne<{ req_id: number }>(
      `SELECT req_id FROM crm.business_req
       WHERE req_id=$1 AND is_active=TRUE AND (applies_to='ALL' OR applies_to=$2)`,
      [Number(req_id), file.client_type === "R" ? "R" : "C"],
    );
    if (!applies) {
      res.status(400).json({ ok: false, error: "This document is not available for the file type." });
      return;
    }
    const validationError = uploadDocumentValidation({
      filename, filesize, reqName: requirement.req_name, invoiceNo: invoice_no,
      amount, policyCode: policy_code, riskRate: risk_rate, riskReason: risk_reason,
    });
    if (validationError) {
      res.status(400).json({ ok: false, error: validationError });
      return;
    }

    const cleanFilename = safeUploadFilename(filename);
    const amountValue = text(amount) ? Number(text(amount)) : null;
    const result = await withTransaction(async (client) => {
      const selected = await txQuery(client,
        `SELECT 1 FROM crm.business_doc_checklist
         WHERE file_no=$1 AND req_id=$2 AND is_selected=TRUE`,
        [fileNo, Number(req_id)],
      );
      if (!selected.length) throw new Error("DOCUMENT_NOT_SELECTED");
      const [upload] = await txQuery<{ upload_id: number }>(client,
        `INSERT INTO crm.business_uploads
           (file_no, req_id, filename, filesize, mime_type, storage_key, uploaded_by,
            invoice_no, amount, policy_code, risk_rate, risk_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING upload_id`,
        [
          fileNo, Number(req_id), cleanFilename, filesize ?? null, mime_type ?? null, storage_key,
          req.user!.username, text(invoice_no) || null, amountValue, text(policy_code) || null,
          text(risk_rate) || null, text(risk_reason) || null,
        ],
      );
      if (!upload) throw new Error("UPLOAD_RECORD_FAILED");
      await txQuery(client,
        `UPDATE crm.business_doc_checklist
         SET acknowledged_by=$3, acknowledged_at=NOW(), upload_id=$4
         WHERE file_no=$1 AND req_id=$2 AND is_selected=TRUE`,
        [fileNo, Number(req_id), req.user!.username, upload.upload_id],
      );
      await txQuery(client,
        `INSERT INTO crm.admin_audit_trail (username, action_type, description)
         VALUES ($1,'BT_UPLOAD',$2)`,
        [req.user!.username, `Uploaded ${cleanFilename} for ${fileNo}`],
      );
      return upload;
    });
    await refreshSelectedDocumentCompletion(fileNo);
    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "DOCUMENT_NOT_SELECTED") {
      res.status(400).json({ ok: false, error: "Select this document from the list before uploading it." });
      return;
    }
    handleError(res, err, "record allocated document upload");
  }
});

router.get("/business/allocated/:fileNo/history", requireAllocatedFileReadAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query<{
      done_by: string; action: string; details: string; done_at: string;
    }>(
      `SELECT username AS done_by, action_type AS action, description AS details, created_at AS done_at
       FROM crm.admin_audit_trail
       WHERE description LIKE $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [`%${req.params.fileNo}%`],
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    handleError(res, err, "get allocated history");
  }
});

router.get("/business/allocated/:fileNo/uploads/:uploadId/download", requireAllocatedFileReadAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const upload = await queryOne<{
      filename: string;
      storage_key: string;
    }>(
      `SELECT filename, storage_key
       FROM crm.business_uploads
       WHERE file_no=$1 AND upload_id=$2 AND is_active=TRUE`,
      [req.params.fileNo, Number(req.params.uploadId)],
    );
    if (!upload) {
      res.status(404).json({ ok: false, error: "Document not found." });
      return;
    }

    const objectFile = await objectStorageService.getObjectEntityFile(upload.storage_key);
    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("Content-Disposition", `inline; filename="${upload.filename.replaceAll('"', "")}"`);

    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ ok: false, error: "Document not found." });
      return;
    }
    handleError(res, err, "download allocated document");
  }
});

// The remaining file-scoped endpoints must not expose a BPO-held record to
// Register, Finance, Dispatch, or other non-BPO operational profiles.
router.use("/business/:fileNo", requireBusinessFileAccess);

// ─── POST /business/:fileNo/review-action ────────────────────────────────────
// The BPO decision, its handover note, audit entry, file state, and work-item
// completion must succeed or fail together. This prevents a file from leaving
// BPO without an accountable decision trail.
router.post("/business/:fileNo/review-action", requireBpoReviewAccess, async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  const { action, allocated_to, product, comments, queue_name } = req.body as {
    action?: string;
    allocated_to?: string;
    product?: string;
    comments?: string;
    queue_name?: string;
  };
  const requestedAction = text(action);
  const allocatedTo = text(allocated_to);
  const selectedProduct = text(product);
  const note = text(comments);

  if (!BPO_REVIEW_ACTIONS.has(requestedAction)) {
    res.status(400).json({ ok: false, error: "Select a valid BPO action." });
    return;
  }
  if (!BPO_PRODUCTS.has(selectedProduct)) {
    res.status(400).json({ ok: false, error: "Select a valid product." });
    return;
  }
  if (!note) {
    res.status(400).json({ ok: false, error: "Short notes are required for a BPO decision." });
    return;
  }
  if (requestedAction === "A" && !allocatedTo) {
    res.status(400).json({ ok: false, error: "Select a Membership Admin for allocation." });
    return;
  }
  const statusByAction: Record<string, string> = {
    A: "ALLOCATED",
    RI: "RETURNED-INCOMPLETE",
    MU: "MEDICAL UW-REVIEW",
    HO: "ON HOLD",
    CA: "CASHIER",
  };
  const productLabel: Record<string, string> = {
    T: "Traditional",
    S: "Shwaari",
    AS: "Afya Shwaari",
  };

  try {
    const result = await withTransaction(async (client) => {
      await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [fileNo]);
       const [file] = await txQuery<{
         file_no: string;
         is_active: boolean;
         file_status: string;
         client_type: string;
         business_type: string;
         rate_type: string;
         invoiced: boolean;
       }>(
        client,
         `SELECT file_no, is_active, file_status, client_type, business_type, rate_type, invoiced
         FROM crm.business_tracking
         WHERE file_no=$1
         FOR UPDATE`,
        [fileNo],
      );
      if (!file?.is_active) throw new Error("FILE_NOT_FOUND");
      const queueName = bpoQueueName(file.client_type);
      if (queue_name && text(queue_name) !== queueName) throw new Error("BPO_QUEUE_MISMATCH");
      if (file.client_type !== "R" && !CORPORATE_SME_BPO_REVIEW_ACTIONS.has(requestedAction)) {
        throw new Error("BPO_ACTION_NOT_ALLOWED");
      }
      if (requestedAction === "A") {
        const staffError = await bpoAdminValidationError(allocatedTo);
        if (staffError) throw new Error(`STAFF_INVALID:${staffError}`);
      }

       const isRetailInvoicedAllocation =
         file.client_type === "R" && requestedAction === "A" && file.invoiced;
       const isCorporatePricingHandoff =
         file.client_type === "C"
         && requestedAction === "A"
         && file.rate_type === "C"
         && ["N", "R"].includes(file.business_type);
       const allocationRoute = isCorporatePricingHandoff ? "PRICING_HANDOFF" : "STANDARD_ALLOCATION";
      const [workItem] = await txQuery<{ work_item_id: number }>(
        client,
        `SELECT work_item_id
         FROM crm.business_work_items
         WHERE file_no=$1
           AND queue_name=$2
           AND work_status='OPEN'
         FOR UPDATE`,
        [fileNo, queueName],
      );
      if (!workItem) throw new Error("BPO_WORK_ITEM_NOT_OPEN");

       const newStatus = isRetailInvoicedAllocation
         ? file.file_status
         : isCorporatePricingHandoff
           ? "BENEFIT VERIFICATION"
           : statusByAction[requestedAction];
      const returnIncomplete = requestedAction === "RI";
      const allocated = requestedAction === "A";
       const [updatedFile] = await txQuery<{ to_pricing_dt: string | null }>(
        client,
        `UPDATE crm.business_tracking
          SET product=$1,
              file_status=$2,
              forwarded=CASE WHEN $3 THEN FALSE ELSE forwarded END,
              allocated=$4,
              allocated_to=CASE WHEN $4 THEN $5 ELSE NULL END,
              allocate_dt=CASE
                WHEN $7 THEN NULL
                WHEN $4 THEN NOW()
                ELSE allocate_dt
              END,
              benefit_verified=CASE
                WHEN $7 THEN 'NO'
                WHEN $6 THEN 'YES'
                ELSE benefit_verified
              END,
              to_pricing_dt=CASE WHEN $7 THEN NOW() ELSE to_pricing_dt END,
              is_complete=CASE WHEN $3 THEN FALSE ELSE is_complete END,
              ready_for_update=CASE WHEN $3 OR $8 THEN FALSE ELSE TRUE END,
             updated_at=NOW()
          WHERE file_no=$9
            AND is_active=TRUE
          RETURNING to_pricing_dt`,
         [
           selectedProduct,
           newStatus,
           returnIncomplete,
           allocated,
           allocatedTo || null,
           isRetailInvoicedAllocation,
           isCorporatePricingHandoff,
           requestedAction === "HO",
           fileNo,
         ],
      );

      await txQuery(
        client,
        `UPDATE crm.business_work_items
         SET work_status='COMPLETED', updated_at=NOW()
         WHERE work_item_id=$1`,
        [workItem.work_item_id],
      );

      const target = allocatedTo ? `; forwarded to ${allocatedTo}` : "";
      const noteText = `${queueName} ${requestedAction} · ${productLabel[selectedProduct]}${target}: ${note}`;
      await txQuery(
        client,
        `INSERT INTO crm.business_tracking_notes (file_no, note_from, notes, note_date, is_active)
         VALUES ($1,$2,$3,NOW(),TRUE)`,
        [fileNo, req.user!.username, noteText],
      );
      await txQuery(
        client,
        `INSERT INTO crm.admin_audit_trail (username, action_type, description)
         VALUES ($1,$2,$3)`,
        [
          req.user!.username,
          `BT_BPO_${requestedAction}`,
           `${queueName} review completed for ${fileNo}: ${productLabel[selectedProduct]}, ${newStatus}${target}.`
             + ` Route: ${allocationRoute}. Notes: ${note}`,
        ],
      );

       return {
         file_status: newStatus,
         work_item_id: workItem.work_item_id,
         queue_name: queueName,
         allocation_route: allocationRoute,
         pricing_handoff_at: updatedFile?.to_pricing_dt ?? null,
       };
    });

    res.json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "FILE_NOT_FOUND") {
      res.status(404).json({ ok: false, error: "File not found." });
      return;
    }
    if (err instanceof Error && err.message === "BPO_WORK_ITEM_NOT_OPEN") {
      res.status(409).json({ ok: false, error: "This BPO work item is no longer open." });
      return;
    }
    if (err instanceof Error && err.message === "BPO_QUEUE_MISMATCH") {
      res.status(409).json({ ok: false, error: "The supplied BPO queue does not match this file." });
      return;
    }
    if (err instanceof Error && err.message === "BPO_ACTION_NOT_ALLOWED") {
      res.status(400).json({ ok: false, error: "Hold is only available for Retail BPO review." });
      return;
    }
    if (err instanceof Error && err.message.startsWith("STAFF_INVALID:")) {
      res.status(400).json({ ok: false, error: err.message.slice("STAFF_INVALID:".length) });
      return;
    }
    handleError(res, err, "complete BPO review action");
  }
});

// ─── POST /business/:fileNo/allocation-action ─────────────────────────────────
// Membership administrators action only files that are currently assigned to
// them.  The status change, allocation release, handover note, and audit entry
// are kept in one transaction so a record never becomes unassigned without its
// operational trail.
router.post("/business/:fileNo/allocation-action", requireBpoAllocatedAccess, async (req: Request, res: Response): Promise<void> => {
  const { fileNo } = req.params;
  const { action, comments, invoice_no, paid_status } = req.body as {
    action?: string;
    comments?: string;
    invoice_no?: string;
    paid_status?: string;
  };
  const requestedAction = text(action);
  const note = text(comments);
  const invoiceNo = text(invoice_no);
  const paidStatus = text(paid_status);
  const isCashier = requestedAction === "CA";

  if (!ALLOCATED_FILE_ACTIONS.has(requestedAction)) {
    res.status(400).json({ ok: false, error: "Select a valid allocated-file action." });
    return;
  }
  if (!note) {
    res.status(400).json({ ok: false, error: "Short notes are required for an allocation action." });
    return;
  }
  if (isCashier && (invoiceNo.length < 20 || invoiceNo.length > 25)) {
    res.status(400).json({ ok: false, error: "Cashier handoff requires an invoice number between 20 and 25 characters." });
    return;
  }
  if (isCashier && !PAYMENT_STATUSES.has(paidStatus)) {
    res.status(400).json({ ok: false, error: "Select a valid payment status for the Cashier handoff." });
    return;
  }

  const statusByAction: Record<string, string> = {
    RI: "RETURNED-INCOMPLETE",
    MU: "MEDICAL UW-REVIEW",
    CA: "CASHIER",
  };
  const actionLabel: Record<string, string> = {
    RI: "Return Incomplete",
    MU: "Medical UW",
    CA: "Cashier",
  };

  try {
    const result = await withTransaction(async (client) => {
      await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [fileNo]);
      const [file] = await txQuery<{
        file_no: string;
        is_active: boolean;
        file_status: string;
        allocated: boolean;
        allocated_to: string | null;
        benefit_verified: string;
        business_type: string;
      }>(
        client,
        `SELECT file_no, is_active, file_status, allocated, allocated_to, benefit_verified, business_type
         FROM crm.business_tracking
         WHERE file_no=$1
         FOR UPDATE`,
        [fileNo],
      );
      if (!file?.is_active) throw new Error("FILE_NOT_FOUND");
      if (file.file_status !== "ALLOCATED" || !file.allocated) throw new Error("FILE_NOT_ALLOCATED");
      if (file.benefit_verified !== "YES") throw new Error("BENEFIT_NOT_VERIFIED");

      // SuperAdmin is allowed to resolve another administrator's file for
      // oversight. Every other permitted profile can action only its own queue.
      const isSuperAdmin = req.user?.profileId === 1;
      if (!isSuperAdmin && file.allocated_to !== req.user!.username) throw new Error("FILE_NOT_ASSIGNED");

      if (isCashier && ["N", "R"].includes(file.business_type)) {
        const [amlStatus] = await txQuery<{ uploaded: boolean }>(
          client,
          `SELECT EXISTS (
             SELECT 1
             FROM crm.business_uploads bu
             JOIN crm.business_req br ON br.req_id=bu.req_id
             WHERE bu.file_no=$1
               AND bu.is_active=TRUE
               AND LOWER(TRIM(br.req_name))='aml report'
           ) AS uploaded`,
          [fileNo],
        );
        if (!amlStatus?.uploaded) throw new Error("AML_REQUIRED");
      }

      const returnIncomplete = requestedAction === "RI";
      const paid = paidStatus !== "NOT-PAID";
      const [updatedFile] = await txQuery<{ file_status: string }>(
        client,
        `UPDATE crm.business_tracking
         SET file_status=$1,
             forwarded=CASE WHEN $2 THEN FALSE ELSE forwarded END,
             allocated=FALSE,
             allocated_to=NULL,
             allocate_dt=NULL,
             is_complete=CASE WHEN $2 THEN FALSE ELSE is_complete END,
             ready_for_update=CASE WHEN $2 THEN FALSE ELSE TRUE END,
             invoice_no=CASE WHEN $3 THEN $4 ELSE invoice_no END,
             paid_status=CASE WHEN $3 THEN $5 ELSE paid_status END,
             invoice_date=CASE WHEN $3 THEN NOW() ELSE invoice_date END,
              paid=CASE WHEN $3 THEN $6 ELSE paid END,
             updated_at=NOW()
          WHERE file_no=$7
           AND is_active=TRUE
         RETURNING file_status`,
        [
          statusByAction[requestedAction],
          returnIncomplete,
          isCashier,
          invoiceNo || null,
          paidStatus || null,
          paid,
          fileNo,
        ],
      );

      const paymentDetail = isCashier ? `; invoice ${invoiceNo}; payment ${paidStatus}` : "";
      const noteText = `Allocation ${actionLabel[requestedAction]} handoff${paymentDetail}: ${note}`;
      await txQuery(
        client,
        `INSERT INTO crm.business_tracking_notes (file_no, note_from, notes, note_date, is_active)
         VALUES ($1,$2,$3,NOW(),TRUE)`,
        [fileNo, req.user!.username, noteText],
      );
      await txQuery(
        client,
        `INSERT INTO crm.admin_audit_trail (username, action_type, description)
         VALUES ($1,$2,$3)`,
        [
          req.user!.username,
          `BT_ALLOCATED_${requestedAction}`,
          `${actionLabel[requestedAction]} handoff completed for ${fileNo}${paymentDetail}. Notes: ${note}`,
        ],
      );

      return { file_status: updatedFile?.file_status ?? statusByAction[requestedAction] };
    });

    res.json({ ok: true, data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "FILE_NOT_FOUND") {
      res.status(404).json({ ok: false, error: "File not found." });
      return;
    }
    if (err instanceof Error && err.message === "FILE_NOT_ALLOCATED") {
      res.status(409).json({ ok: false, error: "This file is no longer in Allocation Files." });
      return;
    }
    if (err instanceof Error && err.message === "BENEFIT_NOT_VERIFIED") {
      res.status(409).json({ ok: false, error: "Benefit verification must be complete before an allocated-file action." });
      return;
    }
    if (err instanceof Error && err.message === "AML_REQUIRED") {
      res.status(409).json({ ok: false, error: "You Must Upload AML Report before handing a new or renewal file to Cashier." });
      return;
    }
    if (err instanceof Error && err.message === "FILE_NOT_ASSIGNED") {
      res.status(403).json({ ok: false, error: "You can only action files allocated to your account." });
      return;
    }
    handleError(res, err, "complete allocated-file action");
  }
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
// Select a document requirement for this file. Only selected documents must be
// uploaded before forwarding.
router.post("/business/:fileNo/checklist/:reqId", async (req: Request, res: Response) => {
  const { fileNo, reqId } = req.params;
  try {
    const file = await queryOne<{ client_type: string }>(
      `SELECT client_type FROM crm.business_tracking WHERE file_no=$1 AND is_active=TRUE`,
      [fileNo],
    );
    if (!file) { res.status(404).json({ ok: false, error: "File not found." }); return; }
    const requirement = await queryOne(
      `SELECT req_id
       FROM crm.business_req
       WHERE req_id=$1
         AND is_active=TRUE
         AND (applies_to='ALL' OR applies_to=$2)`,
      [Number(reqId), file.client_type === "R" ? "R" : "C"],
    );
    if (!requirement) { res.status(400).json({ ok: false, error: "This document is not available for the file type." }); return; }
    await query(
      `INSERT INTO crm.business_doc_checklist (file_no, req_id, acknowledged_by, acknowledged_at, is_selected)
       VALUES ($1,$2,$3,NOW(),TRUE)
       ON CONFLICT (file_no, req_id) DO UPDATE
          SET is_selected=TRUE`,
      [fileNo, Number(reqId), req.user!.username]
    );
    await refreshSelectedDocumentCompletion(fileNo);
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "acknowledge doc"); }
});

// ─── DELETE /business/:fileNo/checklist/:reqId ───────────────────────────────
router.delete("/business/:fileNo/checklist/:reqId", async (req: Request, res: Response) => {
  try {
    const uploaded = await queryOne(
      `SELECT 1
       FROM crm.business_uploads
       WHERE file_no=$1 AND req_id=$2 AND is_active=TRUE`,
      [req.params.fileNo, Number(req.params.reqId)],
    );
    if (uploaded) {
      res.status(409).json({ ok: false, error: "Delete the uploaded file before removing this document from the selection." });
      return;
    }
    await query(
      `DELETE FROM crm.business_doc_checklist WHERE file_no=$1 AND req_id=$2`,
      [req.params.fileNo, Number(req.params.reqId)]
    );
    await refreshSelectedDocumentCompletion(req.params.fileNo);
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "remove doc ack"); }
});

// ─── POST /business/:fileNo/allocate ─────────────────────────────────────────
router.post("/business/:fileNo/allocate", async (req: Request, res: Response) => {
  const { allocated_to } = req.body as { allocated_to: string };
  if (!allocated_to) { res.status(400).json({ ok: false, error: "allocated_to is required." }); return; }
  try {
    const file = await queryOne<{ file_no: string; client_type: string; receive_dt: string }>(
      `SELECT file_no, client_type, receive_dt FROM crm.business_tracking WHERE file_no=$1`,
      [req.params.fileNo],
    );
    if (!file) { res.status(404).json({ ok: false, error: "File not found." }); return; }
    const staffError = await bpoAdminValidationError(allocated_to);
    if (staffError) { res.status(400).json({ ok: false, error: staffError }); return; }
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
  if (!filename || !storage_key || !req_id) {
    res.status(400).json({ ok: false, error: "Select a document and provide its filename and storage key." });
    return;
  }
  try {
    const selected = await queryOne(
      `SELECT 1
       FROM crm.business_doc_checklist
       WHERE file_no=$1 AND req_id=$2 AND is_selected=TRUE`,
      [fileNo, req_id],
    );
    if (!selected) {
      res.status(400).json({ ok: false, error: "Select this document from the list before uploading it." });
      return;
    }
    // Insert upload record
    const row = await queryOne<{ upload_id: number }>(
      `INSERT INTO crm.business_uploads
         (file_no, req_id, filename, filesize, mime_type, storage_key, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING upload_id`,
      [fileNo, req_id ?? null, filename, filesize ?? null, mime_type ?? null,
       storage_key, req.user!.username]
    );

    if (row?.upload_id) {
      await query(
        `UPDATE crm.business_doc_checklist
         SET acknowledged_by=$3, acknowledged_at=NOW(), upload_id=$4
         WHERE file_no=$1 AND req_id=$2 AND is_selected=TRUE`,
        [fileNo, req_id, req.user!.username, row.upload_id],
      );
      await refreshSelectedDocumentCompletion(fileNo);
    }

    await query(
      `INSERT INTO crm.admin_audit_trail (username, action_type, description) VALUES ($1,'BT_UPLOAD',$2)`,
      [req.user!.sub, `Uploaded ${filename} for ${fileNo}`]
    ).catch(() => {});

    res.status(201).json({ ok: true, data: { upload_id: row?.upload_id } });
  } catch (err) { handleError(res, err, "record upload"); }
});

// ─── DELETE /business/:fileNo/uploads/:uploadId ───────────────────────────────
router.delete("/business/:fileNo/uploads/:uploadId", async (req: Request, res: Response) => {
  const { fileNo, uploadId } = req.params;
  try {
    const upload = await queryOne<{ filename: string }>(
      `SELECT filename FROM crm.business_uploads WHERE upload_id=$1 AND file_no=$2`,
      [Number(uploadId), fileNo]
    );
    await query(
      `UPDATE crm.business_uploads SET is_active=FALSE WHERE upload_id=$1 AND file_no=$2`,
      [Number(uploadId), fileNo]
    );
    await query(
      `UPDATE crm.business_doc_checklist
       SET upload_id=NULL
       WHERE file_no=$1 AND upload_id=$2`,
      [fileNo, Number(uploadId)],
    );
    await refreshSelectedDocumentCompletion(fileNo);
    await query(
      `INSERT INTO crm.admin_audit_trail (username, action_type, description) VALUES ($1,'BT_DOC_DELETE',$2)`,
      [req.user!.sub, `Deleted ${upload?.filename ?? "file"} from ${fileNo}`]
    ).catch(() => {});
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "delete upload"); }
});

// ─── GET /business/:fileNo/history ───────────────────────────────────────────
router.get("/business/:fileNo/history", async (req: Request, res: Response) => {
  try {
    const { fileNo } = req.params;
    const rows = await query<{
      done_by: string; action: string; details: string; done_at: string;
    }>(
      `SELECT username AS done_by, action_type AS action, description AS details, created_at AS done_at
       FROM crm.admin_audit_trail
       WHERE description LIKE $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [`%${fileNo}%`]
    );
    res.json({ ok: true, data: rows });
  } catch (err) { handleError(res, err, "get history"); }
});

// ─── POST /business/:fileNo/mark-complete ─────────────────────────────────────
router.post("/business/:fileNo/mark-complete", async (req: Request, res: Response) => {
  const { fileNo } = req.params;
  const { complete } = req.body as { complete: boolean };
  try {
    const file = await queryOne<{ file_status: string; is_complete: boolean }>(
      `SELECT file_status, is_complete FROM crm.business_tracking WHERE file_no=$1 AND is_active=TRUE`,
      [fileNo]
    );
    if (!file) { res.status(404).json({ ok: false, error: "File not found." }); return; }

    if (complete) {
      await refreshSelectedDocumentCompletion(fileNo);
      const refreshed = await queryOne<{ is_complete: boolean }>(
        `SELECT is_complete FROM crm.business_tracking WHERE file_no=$1`,
        [fileNo],
      );
      if (!refreshed?.is_complete) {
        res.status(400).json({ ok: false, error: "Select at least one document and upload every selected document before completion." });
        return;
      }
    } else {
      await query(
        `UPDATE crm.business_tracking SET is_complete=FALSE, updated_at=NOW() WHERE file_no=$1`,
        [fileNo],
      );
    }
    const action = complete ? "BT_DOC_COMPLETE" : "BT_DOC_INCOMPLETE";
    const detail = `${complete ? "Marked complete" : "Marked incomplete"} ${fileNo} by ${req.user!.username}`;
    await query(
      `INSERT INTO crm.admin_audit_trail (username, action_type, description) VALUES ($1,$2,$3)`,
      [req.user!.username, action, detail]
    ).catch(() => {});

    res.json({ ok: true });
  } catch (err) { handleError(res, err, "mark complete"); }
});

export default router;
