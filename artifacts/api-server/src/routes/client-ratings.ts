import { Router } from "express";
import { z } from "zod";
import { query } from "../lib/postgres";
import { requireAuth } from "../lib/auth-middleware";
import { canManage, privateRiskResponses, riskFailure, RiskError, RISK_MANAGEMENT_SQL } from "../lib/risk-register";

const router = Router();
router.use("/client-ratings", privateRiskResponses, requireAuth, async (req, res, next) => {
  try {
    // Global client permissions must not depend on departmental risk mappings.
    const [actor] = await query<{ is_admin: boolean; is_manager: boolean }>(`SELECT
      e.profile_id IN (1,2) AS is_admin,${RISK_MANAGEMENT_SQL} AS is_manager
      FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
      WHERE e.employee_id=$1 AND e.activated AND e.approved AND NOT e.employee_locked
        AND NOT e.is_deleted AND p.is_active`, [req.user!.sub]);
    if (!actor || !canManage(actor)) {
      res.status(403).json({ ok: false, error: "Client ratings contain private customer information. An active administrator or Risk Management account is required." });
      return;
    }
    next();
  } catch (err) { riskFailure(req, res, err); }
});

const input = z.object({
  search_by: z.enum(["proposer", "policy"]).default("proposer"),
  search: z.string().trim().max(150).default(""),
  rating: z.enum(["", "Low", "Medium", "High"]).default(""),
  reason: z.string().trim().max(250).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
});

// The legacy SP_MIS_TRACKING_AML_RISKS records the explicitly entered AML
// classification. Modern uploads already persist the same classification.
// Do not derive a customer rating from enterprise risk assessment scores.
const records = `SELECT u.upload_id AS rating_id,u.file_no,
  NULLIF(TRIM(u.policy_code),'') AS policy_code,b.proposer_name AS proposer,
  b.client_type::text AS cover_type,NULLIF(TRIM(u.originating_system),'') AS system,
  TRIM(u.risk_rate) AS risk_rating,u.risk_reason AS reason,
  NULLIF(TRIM(u.invoice_no),'') AS invoice_number,u.uploaded_by AS entered_by,
  u.uploaded_at AS entry_date
  FROM crm.business_uploads u JOIN crm.business_tracking b ON b.file_no=u.file_no
  WHERE NULLIF(TRIM(u.risk_rate),'') IS NOT NULL
    AND NULLIF(TRIM(u.risk_reason),'') IS NOT NULL`;
const filter = `($1::text='' OR CASE WHEN $2::text='policy' THEN LOWER(policy_code)=LOWER($1::text)
  ELSE STRPOS(LOWER(proposer),LOWER($1::text))>0 END)
  AND ($3::text='' OR risk_rating=$3::text)
  AND ($4::text='' OR reason=$4::text)`;
const params = (f: z.infer<typeof input>) => [f.search, f.search_by, f.rating, f.reason];

router.get("/client-ratings/options", async (req, res) => {
  try {
    const [reasons, counts] = await Promise.all([
      query<{ reason: string }>(`WITH ratings AS (${records})
        SELECT reason FROM ratings UNION SELECT reason_name AS reason
        FROM crm.aml_risk_reasons WHERE is_active ORDER BY reason`),
      query<{ total: number }>(`WITH ratings AS (${records}) SELECT COUNT(*)::integer AS total FROM ratings`),
    ]);
    res.json({ ok: true, data: {
      ratings: ["Low", "Medium", "High"], reasons: reasons.map(r => r.reason),
      total: counts[0]?.total ?? 0,
      source: "Saved AML classifications on MIS business documents. Historical legacy client-rating records have not been imported.",
      scope: "Administrators and Risk Management only. Department champion or owner mapping does not grant access to global customer information.",
      system_captured: true,
    } });
  } catch (err) { riskFailure(req, res, err); }
});

router.get("/client-ratings", async (req, res) => {
  try {
    const f = input.parse(req.query), values = params(f);
    const rows = await query<Record<string, unknown>>(`WITH ratings AS (${records})
      SELECT * FROM ratings WHERE ${filter}
      ORDER BY entry_date DESC,rating_id DESC LIMIT $5::integer OFFSET $6::integer`,
    [...values, f.page_size, (f.page - 1) * f.page_size]);
    const counts = await query<{ total: number }>(`WITH ratings AS (${records})
      SELECT COUNT(*)::integer AS total FROM ratings WHERE ${filter}`, values);
    res.json({ ok: true, data: {
      records: rows, total: counts[0]?.total ?? 0, page: f.page, page_size: f.page_size,
    } });
  } catch (err) { riskFailure(req, res, err); }
});

export function safeCsvCell(value: unknown): string {
  const text = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  // Protect spreadsheets from formulas, including whitespace/control prefixes.
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
router.get("/client-ratings/report", async (req, res) => {
  try {
    const f = input.parse(req.query);
    const rows = await query<Record<string, unknown>>(`WITH ratings AS (${records})
      SELECT * FROM ratings WHERE ${filter} ORDER BY entry_date DESC,rating_id DESC LIMIT 10001`, params(f));
    if (rows.length > 10000) throw new RiskError(400, "This report exceeds 10,000 records. Narrow the search before exporting.");
    const fields = ["policy_code","proposer","cover_type","system","risk_rating","reason","invoice_number","file_no","entered_by","entry_date"];
    const headers = ["Policy Code","Proposer","Cover Type","System","Risk Rating","Reason","Invoice Number","File Number","Entered By","Entry Date"];
    const csv = [headers.map(safeCsvCell).join(","), ...rows.map(row => fields.map(k => safeCsvCell(row[k])).join(","))].join("\r\n");
    res.setHeader("Content-Disposition", 'attachment; filename="client-risk-ratings.csv"');
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.type("text/csv").send(`\uFEFF${csv}\r\n`);
  } catch (err) { riskFailure(req, res, err); }
});

export default router;
