import { Router } from "express";
import { ALLOCATION_DOCUMENT_NAMES, EXCLUDED_ALLOCATION_DOCUMENT_NAMES } from "../lib/allocation-documents";
import { query, queryOne } from "../lib/postgres";
import { requireAuth } from "../lib/auth-middleware";
import { requireAllocatedFileReadAccess, requireBpoAllocatedAccess, requireBpoQueueAccess, requireBusinessFileAccess, requireBusinessTrackingAccess, setBpoReviewAccess } from "../lib/business-permissions";
import { logger } from "../lib/logger";
import { getAllocatedRefundLedger } from "../lib/refund-ledger";

const router = Router();

// ─── PRODUCTION MONTH ────────────────────────────────────────────────────────
router.get("/mis/production-month", async (_req, res) => {
  try {
    const row = await queryOne(`
      SELECT month_name, date_from, date_to, year
      FROM sales.prod_months
      WHERE month_closed = FALSE
      ORDER BY date_from ASC
      LIMIT 1
    `);
    res.json({ ok: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── STAFF ON CALL ───────────────────────────────────────────────────────────
router.get("/mis/staff-on-call", async (_req, res) => {
  try {
    const row = await queryOne(`
      SELECT staff_name, staff_mobile, on_call_date
      FROM crm.staff_on_call
      WHERE on_call_date = CURRENT_DATE
    `);
    res.json({ ok: true, data: row });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── BUSINESS TRACKING ───────────────────────────────────────────────────────
router.use("/mis/business", requireAuth, (req,res,next) => {
  if(req.path==="/allocated"||req.path.startsWith("/allocated/")) { next(); return; }
  requireBusinessTrackingAccess(req,res,next);
}, setBpoReviewAccess);

router.get("/mis/business", requireBpoQueueAccess, async (req, res) => {
  try {
    const queryValue = (name: string): string | undefined => {
      const value = req.query[name];
      return typeof value === "string" ? value : undefined;
    };
    const status = queryValue("status");
    const client_type = queryValue("client_type");
    const business = queryValue("business");
    const entered_by = queryValue("entered_by");
    const search = queryValue("search");
    const search_by = queryValue("search_by");
    const queue = queryValue("queue");
    const rawPage = queryValue("page");
    const rawPageSize = queryValue("page_size");
    const sort_by = queryValue("sort_by");
    const sort_dir = queryValue("sort_dir");
    const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(10, Number.parseInt(rawPageSize ?? "20", 10) || 20));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ["bt.is_active = TRUE"];
    const bpoQueueName = queue === "bpo-corporate-sme"
      ? "BPO_REVIEW_CORPORATE_SME"
      : "BPO_REVIEW_RETAIL"; // bpo-review remains the legacy Retail alias.
    const isBpoQueue = queue === "bpo-review" || queue === "bpo-retail" || queue === "bpo-corporate-sme";
    const params: unknown[] = isBpoQueue ? [bpoQueueName] : [];
    let p = isBpoQueue ? 2 : 1;

    if (status) { conditions.push(`bt.file_status = $${p++}`); params.push(status); }
    if (client_type) { conditions.push(`bt.client_type = $${p++}`); params.push(client_type); }
    if (business) { conditions.push(`bt.business = $${p++}`); params.push(business); }
    if (entered_by) { conditions.push(`bt.entered_by = $${p++}`); params.push(entered_by); }
    if (queue === "register") {
      conditions.push(`bt.file_status IN ('REGISTERED', 'RETURNED-INCOMPLETE')`);
      // Medical correction work belongs to the original tracker, with admin
      // oversight. Do not expose it in other trackers' register queues.
      conditions.push(`(bt.file_status<>'RETURNED-INCOMPLETE'
        OR bt.entered_by=$${p++} OR EXISTS (
          SELECT 1 FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
          WHERE e.employee_id=$${p++} AND p.is_active
          AND LOWER(TRIM(p.profile_name)) IN ('superadmin','system admin')
        ))`);
      params.push(req.user!.username, req.user!.sub);
    } else if (isBpoQueue) {
      conditions.push(`wi.work_status = 'OPEN'`);
      conditions.push(`bt.file_status = 'FORWARDED'`);
      conditions.push(queue === "bpo-corporate-sme" ? `bt.client_type IN ('S', 'C')` : `bt.client_type = 'R'`);
    } else if (!res.locals.canAccessBpoReview) {
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM crm.business_work_items bpo_filter
        WHERE bpo_filter.file_no=bt.file_no
          AND bpo_filter.queue_name IN ('BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME')
          AND bpo_filter.work_status='OPEN'
      )`);
    }
    if (search?.trim()) {
      conditions.push(search_by === "F" ? `bt.file_no ILIKE $${p}` : `bt.proposer_name ILIKE $${p}`);
      params.push(`%${search}%`);
      p++;
    }

    conditions.push(`NOT EXISTS (SELECT 1 FROM crm.business_work_items gi_filter
      WHERE gi_filter.file_no=bt.file_no AND gi_filter.queue_name IN ('GI_ALLOCATE','GI_ALLOCATED')
        AND gi_filter.work_status='OPEN')`);
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortableColumns: Record<string, string> = {
      file_no: "bt.file_no",
      proposer_name: "bt.proposer_name",
      client_type: "bt.client_type",
      business_type: "bt.business_type",
      file_status: "bt.file_status",
      agent_name: "COALESCE(si.agent_name, sa.agent_name)",
      paid_amt: "bt.paid_amt",
      receive_dt: "bt.receive_dt",
      bpo_forwarded_at: "wi.forwarded_at",
      note_count: "notes.note_count",
      bpo_assigned_to: "wi.assigned_to",
      created_at: "bt.created_at",
    };
    const sortColumn = sortableColumns[sort_by ?? ""] ?? "bt.created_at";
    const sortDirection = sort_dir === "asc" ? "ASC" : "DESC";

    const rows = await query(`
      SELECT
        bt.*,
        COALESCE(si.agent_name, sa.agent_name) AS agent_name,
        notes.note_count,
        wi.assigned_to AS bpo_assigned_to,
        wi.forwarded_at AS bpo_forwarded_at,
        wi.queue_name AS bpo_queue_name,
        (LOWER(COALESCE(bt.client_sub_type, '')) LIKE '%shwaari%') AS is_shwaari
      FROM crm.business_tracking bt
      LEFT JOIN commission.sales_agents sa ON sa.agent_id = bt.agent_id
      LEFT JOIN crm.tbl_mis_sales_intermediary si ON si.agent_code = bt.agent_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS note_count
        FROM crm.business_tracking_notes n
        WHERE n.file_no = bt.file_no AND n.is_active = TRUE
      ) notes ON TRUE
      LEFT JOIN crm.business_work_items wi
        ON wi.file_no = bt.file_no
        ${isBpoQueue ? "AND wi.queue_name = $1" : "AND wi.queue_name IN ('BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME')"}
      ${where}
      ORDER BY ${sortColumn} ${sortDirection} NULLS LAST, bt.file_no ASC
      LIMIT $${p++} OFFSET $${p++}
    `, [...params, pageSize, offset]);

    const totalRow = await queryOne<{ total: number }>(`
      SELECT COUNT(*)::int AS total
      FROM crm.business_tracking bt
      LEFT JOIN crm.business_work_items wi
        ON wi.file_no = bt.file_no
        ${isBpoQueue ? "AND wi.queue_name = $1" : "AND wi.queue_name IN ('BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME')"}
      ${where}
    `, params);

    res.json({
      ok: true,
      data: rows,
      total: totalRow?.total ?? 0,
      page,
      page_size: pageSize,
    });
  } catch (err: unknown) {
    logger.error({ err }, "Business tracking list failed");
    res.status(500).json({ ok: false, error: "Unable to load business tracking records." });
  }
});

// Allocated files are a personal work queue for operational users. SuperAdmin
// has an oversight view of all allocated files and their assigned owners.
router.get("/mis/business/allocated", requireBpoAllocatedAccess, async (req, res) => {
  try {
    const queryValue = (name: string): string | undefined => {
      const value = req.query[name];
      return typeof value === "string" ? value : undefined;
    };
    const search = queryValue("search");
    const searchBy = queryValue("search_by");
    const clientType = queryValue("client_type");
    const rawPage = queryValue("page");
    const rawPageSize = queryValue("page_size");
    const sortBy = queryValue("sort_by");
    const sortDir = queryValue("sort_dir");
    const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(10, Number.parseInt(rawPageSize ?? "20", 10) || 20));
    const offset = (page - 1) * pageSize;

    const giWorkspace=req.query.workspace==="gi";
    if(req.query.workspace && !giWorkspace) {
      res.status(400).json({ok:false,error:"Unknown allocated workspace."}); return;
    }
    if(giWorkspace && !(res.locals.isGiStaff||res.locals.isGiAdmin)
      || !giWorkspace && !res.locals.canAccessMembershipAllocated) {
      res.status(403).json({ok:false,error:"Use your authorized allocated workspace."}); return;
    }
    const isSuperAdmin = req.user?.profileId === 1 || giWorkspace && res.locals.isGiAdmin;
    const conditions: string[] = [
      "bt.is_active = TRUE",
      "bt.allocated = TRUE",
      "bt.file_status = 'ALLOCATED'",
      "(bt.client_type NOT IN ('C','S') OR bt.rate_type IS DISTINCT FROM 'C' OR bt.benefit_verified='YES')",
    ];
    const params: unknown[] = [];
    conditions.push(`${giWorkspace ? "" : "NOT "}EXISTS (SELECT 1 FROM crm.business_work_items g
      WHERE g.file_no=bt.file_no AND g.queue_name='GI_ALLOCATED' AND g.work_status='OPEN')`);
    let p = 1;
    if (!isSuperAdmin) {
      // Custom-rate Corporate/SME allocations require Pricing approval.
      // Retail keeps its existing allocation behavior and action gates.
      conditions.push(`bt.allocated_to = $${p++}`);
      params.push(req.user!.username);
    }

    if (clientType && ["R", "S", "C"].includes(clientType)) {
      conditions.push(`bt.client_type = $${p++}`);
      params.push(clientType);
    }
    if (search?.trim()) {
      if (searchBy === "F") {
        conditions.push(`bt.file_no ILIKE $${p++}`);
      } else {
        conditions.push(`bt.proposer_name ILIKE $${p++}`);
      }
      params.push(`%${search.trim()}%`);
    }

    const sortableColumns: Record<string, string> = {
      file_no: "bt.file_no",
      proposer_name: "bt.proposer_name",
      client_type: "bt.client_type",
      business_type: "bt.business_type",
      file_status: "bt.file_status",
      product: "bt.product",
      allocated_to: "bt.allocated_to",
      walk_in_client: "bt.walk_in_client",
      receive_dt: "bt.receive_dt",
      allocate_dt: "bt.allocate_dt",
      premium: "bt.premium",
    };
    const sortColumn = sortableColumns[sortBy ?? ""] ?? "bt.allocate_dt";
    const sortDirection = sortDir === "asc" ? "ASC" : "DESC";
    const where = `WHERE ${conditions.join(" AND ")}`;
    const orderBy = sortBy === "walk_in_client" && sortDir !== "asc"
      ? "bt.walk_in_client DESC, bt.allocate_dt ASC NULLS LAST, bt.file_no ASC"
      : `${sortColumn} ${sortDirection} NULLS LAST, bt.file_no ASC`;

    const [rows, totalRow] = await Promise.all([
      query(`
        SELECT
          bt.*,
          COALESCE(si.agent_name, sa.agent_name) AS agent_name,
          notes.note_count,
          (LOWER(COALESCE(bt.client_sub_type, '')) LIKE '%shwaari%') AS is_shwaari
        FROM crm.business_tracking bt
        LEFT JOIN commission.sales_agents sa ON sa.agent_id = bt.agent_id
        LEFT JOIN crm.tbl_mis_sales_intermediary si ON si.agent_code = bt.agent_id
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS note_count
          FROM crm.business_tracking_notes n
          WHERE n.file_no = bt.file_no AND n.is_active = TRUE
        ) notes ON TRUE
        ${where}
        ORDER BY ${orderBy}
        LIMIT $${p++} OFFSET $${p++}
      `, [...params, pageSize, offset]),
      queryOne<{ total: number }>(`
        SELECT COUNT(*)::int AS total
        FROM crm.business_tracking bt
        ${where}
      `, params),
    ]);

    res.json({
      ok: true,
      data: rows,
      total: totalRow?.total ?? 0,
      page,
      page_size: pageSize,
    });
  } catch (err: unknown) {
    logger.error({ err, employeeId: req.user?.sub }, "Allocated business list failed");
    res.status(500).json({ ok: false, error: "Unable to load your allocated business files." });
  }
});

// The refund ledger remains in the legacy CRM database. This route is read-only
// and applies the same ownership boundary as the modern allocation queue.
router.get("/mis/business/allocated/refunds-summary", requireBpoAllocatedAccess, async (req, res) => {
  if(!res.locals.canAccessMembershipAllocated) {
    res.status(403).json({ok:false,error:"This refund ledger is not available to the GI workspace."}); return;
  }
  const ledger = await getAllocatedRefundLedger(
    req.user!.username,
    req.user?.profileId === 1,
  );
  const sum = (field: "amount_paid" | "refund_amount") => {
    const values = ledger.records
      .map(record => record[field])
      .filter((value): value is number => value != null);
    return values.length ? values.reduce((total, value) => total + value, 0) : null;
  };

  res.json({
    ok: true,
    data: {
      available: ledger.available,
      message: ledger.message,
      allocated_count: ledger.records.length,
      allocated_admin_count: new Set(
        ledger.records.map(record => record.allocate_to).filter(Boolean),
      ).size,
      total_amount_paid: sum("amount_paid"),
      total_refund_amount: sum("refund_amount"),
      records: ledger.records,
    },
  });
});

// Allocation Files uses a dedicated read endpoint so the personal queue's
// ownership rules cannot be bypassed through the broader business-file route.
router.get("/mis/business/allocated/:fileNo", requireAllocatedFileReadAccess, async (req, res) => {
  try {
    const { fileNo } = req.params;
    const [file, notes, docs] = await Promise.all([
      queryOne(`
        SELECT bt.*, COALESCE(si.agent_name, sa.agent_name) AS agent_name
        FROM crm.business_tracking bt
        LEFT JOIN commission.sales_agents sa ON sa.agent_id = bt.agent_id
        LEFT JOIN crm.tbl_mis_sales_intermediary si ON si.agent_code = bt.agent_id
        WHERE bt.file_no = $1
      `, [fileNo]),
      query(`
        SELECT * FROM crm.business_tracking_notes
        WHERE file_no = $1 AND is_active = TRUE
        ORDER BY note_date DESC
      `, [fileNo]),
      query(`
        SELECT d.*, br.req_id AS req_id, br.req_name, $1::varchar AS file_no,
               (COALESCE(d.is_selected,FALSE)
                OR LOWER(TRIM(br.req_name))=ANY($2::text[])) AS is_selected
        FROM crm.business_req br
        LEFT JOIN crm.business_doc_checklist d ON d.req_id=br.req_id AND d.file_no=$1
        WHERE (d.file_no=$1 OR (br.is_active=TRUE AND LOWER(TRIM(br.req_name))=ANY($2::text[])))
          AND NOT (LOWER(TRIM(br.req_name))=ANY($3::text[]))
        ORDER BY br.req_name
      `, [fileNo, ALLOCATION_DOCUMENT_NAMES, EXCLUDED_ALLOCATION_DOCUMENT_NAMES]),
    ]);
    if (!file) {
      res.status(404).json({ ok: false, error: "Allocated file not found." });
      return;
    }
    res.json({ ok: true, data: { ...file, notes, docs } });
  } catch (err: unknown) {
    logger.error({ err, employeeId: req.user?.sub, fileNo: req.params.fileNo }, "Allocated business detail failed");
    res.status(500).json({ ok: false, error: "Unable to load allocated business file." });
  }
});

router.get("/mis/business/:fileNo", requireBusinessFileAccess, async (req, res) => {
  try {
    const { fileNo } = req.params;
    const [file, notes, docs] = await Promise.all([
      queryOne(`
        SELECT bt.*, COALESCE(si.agent_name, sa.agent_name) AS agent_name
        FROM crm.business_tracking bt
        LEFT JOIN commission.sales_agents sa ON sa.agent_id = bt.agent_id
        LEFT JOIN crm.tbl_mis_sales_intermediary si ON si.agent_code = bt.agent_id
        WHERE bt.file_no = $1
      `, [fileNo]),
      query(`
        SELECT * FROM crm.business_tracking_notes
        WHERE file_no = $1 AND is_active = TRUE
        ORDER BY note_date DESC
      `, [fileNo]),
      query(`
        SELECT d.*, br.req_name
        FROM crm.business_doc_checklist d
        JOIN crm.business_req br ON br.req_id = d.req_id
        WHERE d.file_no = $1
        ORDER BY br.req_name
      `, [fileNo]),
    ]);
    if (!file) {
      res.status(404).json({ ok: false, error: "File not found" });
      return;
    }
    res.json({ ok: true, data: { ...file, notes, docs } });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Dashboard summary counts
router.get("/mis/business/summary/counts", async (_req, res) => {
  try {
    const rows = await query(`
      SELECT
        file_status,
        business,
        client_type,
        COUNT(*) AS count,
        SUM(COALESCE(premium, 0)) AS total_premium
      FROM crm.business_tracking
      WHERE is_active = TRUE
      GROUP BY file_status, business, client_type
      ORDER BY file_status
    `);

    const byStatus = await query(`
      SELECT file_status, COUNT(*) AS count, SUM(COALESCE(premium,0)) AS premium
      FROM crm.business_tracking WHERE is_active = TRUE
      GROUP BY file_status ORDER BY count DESC
    `);

    res.json({ ok: true, data: { detail: rows, byStatus } });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── SALES AGENTS ─────────────────────────────────────────────────────────────
router.get("/mis/agents", requireAuth, requireBusinessTrackingAccess, async (_req, res) => {
  try {
    const rows = await query(`
      SELECT agent_code AS agent_id, agent_name,
             email AS agent_email, mobile_no AS agent_phone,
             unit_code AS agency_code,
             COALESCE(terminated=0 AND UPPER(TRIM(agent_status))='ACTIVE', FALSE) AS is_active
      FROM crm.tbl_mis_sales_intermediary ORDER BY agent_name, agent_code
    `);
    res.json({ ok: true, data: rows });
  } catch (err: unknown) {
    logger.error({ err }, "Sales intermediary lookup failed");
    res.status(500).json({ ok: false, error: "Unable to load agent names." });
  }
});

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
router.get("/mis/employees", async (req, res) => {
  try {
    const { department, activated, approved } = req.query as Record<string, string>;
    const conditions: string[] = ["e.is_deleted = FALSE"];
    const params: unknown[] = [];
    let p = 1;

    if (department) { conditions.push(`e.department = $${p++}`); params.push(department); }
    if (activated !== undefined) { conditions.push(`e.activated = $${p++}`); params.push(activated === "true"); }
    if (approved !== undefined) { conditions.push(`e.approved = $${p++}`); params.push(approved === "true"); }

    const rows = await query(`
      SELECT
        e.employee_id, e.emp_code, e.username, e.employee_name,
        e.email, e.department, e.activated, e.employee_locked,
        e.approved, e.approved_by, e.date_approved, e.active_session,
        e.last_login_date, e.last_password_reset, e.created_at,
        p.profile_name
      FROM crm.employees e
      LEFT JOIN crm.profiles p ON p.profile_id = e.profile_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY e.employee_name
    `, params);

    res.json({ ok: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── RISK REGISTER ────────────────────────────────────────────────────────────
router.get("/mis/risk/departments", async (_req, res) => {
  try {
    const rows = await query(`
      SELECT d.*,
        ds.submitted, ds.reviewed, ds.sign_off,
        rc.username AS champion_username
      FROM risk.departments d
      LEFT JOIN risk.department_summary ds ON ds.depart_code = d.depart_code
        AND ds.period_from = (SELECT MIN(period_from) FROM risk.periods WHERE status='OPEN')
      LEFT JOIN risk.champions rc ON rc.department = d.depart_code AND rc.is_active = TRUE
      WHERE d.is_active = TRUE
      ORDER BY d.depart_name
    `);
    res.json({ ok: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.get("/mis/risk/risks", async (req, res) => {
  try {
    const { depart_code, period_from, period_to, min_exposure, max_exposure } = req.query as Record<string, string>;
    const conditions: string[] = ["rm.is_active = TRUE"];
    const params: unknown[] = [];
    let p = 1;

    if (depart_code) { conditions.push(`rm.depart_code = $${p++}`); params.push(depart_code); }
    if (period_from) { conditions.push(`rm.period_from >= $${p++}`); params.push(period_from); }
    if (period_to) { conditions.push(`rm.period_to <= $${p++}`); params.push(period_to); }
    if (min_exposure) { conditions.push(`rm.r_risk_exposure >= $${p++}`); params.push(Number(min_exposure)); }
    if (max_exposure) { conditions.push(`rm.r_risk_exposure <= $${p++}`); params.push(Number(max_exposure)); }

    const rows = await query(`
      SELECT
        rm.*,
        d.depart_name,
        rc.category_name,
        CASE
          WHEN rm.r_risk_exposure > 40 THEN 'critical'
          WHEN rm.r_risk_exposure > 25 THEN 'high'
          WHEN rm.r_risk_exposure > 14 THEN 'medium'
          WHEN rm.r_risk_exposure > 6  THEN 'low-medium'
          ELSE 'low'
        END AS risk_level,
        COUNT(rca.root_id) AS root_cause_count
      FROM risk.risk_master rm
      LEFT JOIN risk.departments d ON d.depart_code = rm.depart_code
      LEFT JOIN risk.categories rc ON rc.category_code = rm.risk_category
      LEFT JOIN risk.root_causes rca ON rca.risk_code = rm.risk_code
      WHERE ${conditions.join(" AND ")}
      GROUP BY rm.risk_id, d.depart_name, rc.category_name
      ORDER BY rm.r_risk_exposure DESC NULLS LAST
    `, params);

    res.json({ ok: true, data: rows, total: rows.length });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.get("/mis/risk/risks/:riskCode", async (req, res) => {
  try {
    const { riskCode } = req.params;
    const [risk, rootCauses] = await Promise.all([
      queryOne(`
        SELECT rm.*, d.depart_name, rc.category_name
        FROM risk.risk_master rm
        LEFT JOIN risk.departments d ON d.depart_code = rm.depart_code
        LEFT JOIN risk.categories rc ON rc.category_code = rm.risk_category
        WHERE rm.risk_code = $1
      `, [riskCode]),
      query(`SELECT * FROM risk.root_causes WHERE risk_code = $1 ORDER BY root_id`, [riskCode]),
    ]);
    if (!risk) {
      res.status(404).json({ ok: false, error: "Risk not found" });
      return;
    }
    res.json({ ok: true, data: { ...risk, root_causes: rootCauses } });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

router.get("/mis/risk/dashboard", async (_req, res) => {
  try {
    const [byDept, top15, overdue, heatmap] = await Promise.all([
      query(`
        SELECT
          d.depart_code, d.depart_name,
          COUNT(rm.risk_id) AS total_risks,
          ROUND(AVG(rm.r_risk_exposure)::numeric, 1) AS avg_exposure,
          MAX(rm.r_risk_exposure) AS max_exposure,
          ds.submitted, ds.reviewed, ds.sign_off,
          SUM(CASE WHEN rm.r_risk_exposure > 25 THEN 1 ELSE 0 END) AS high_critical_count
        FROM risk.departments d
        LEFT JOIN risk.risk_master rm ON rm.depart_code = d.depart_code AND rm.is_active = TRUE
        LEFT JOIN risk.department_summary ds ON ds.depart_code = d.depart_code
        WHERE d.is_active = TRUE
        GROUP BY d.depart_code, d.depart_name, ds.submitted, ds.reviewed, ds.sign_off
        ORDER BY max_exposure DESC NULLS LAST
      `),
      query(`
        SELECT rm.risk_code, rm.risk_title, rm.r_risk_exposure, rm.depart_code,
          d.depart_name,
          CASE WHEN rm.r_risk_exposure > 40 THEN 'critical'
               WHEN rm.r_risk_exposure > 25 THEN 'high'
               WHEN rm.r_risk_exposure > 14 THEN 'medium'
               ELSE 'low' END AS risk_level
        FROM risk.risk_master rm
        JOIN risk.departments d ON d.depart_code = rm.depart_code
        WHERE rm.is_active = TRUE
        ORDER BY rm.r_risk_exposure DESC NULLS LAST LIMIT 15
      `),
      query(`
        SELECT rm.risk_code, rm.risk_title, rm.r_risk_exposure, rm.depart_code,
          rca.root_cause, rca.due_date, rca.action_owner, rca.action_status
        FROM risk.root_causes rca
        JOIN risk.risk_master rm ON rm.risk_code = rca.risk_code
        WHERE rca.action_status = 'Behind schedule'
        ORDER BY rm.r_risk_exposure DESC LIMIT 10
      `),
      query(`
        SELECT
          SUM(CASE WHEN r_risk_exposure > 40 THEN 1 ELSE 0 END) AS critical,
          SUM(CASE WHEN r_risk_exposure BETWEEN 26 AND 40 THEN 1 ELSE 0 END) AS high,
          SUM(CASE WHEN r_risk_exposure BETWEEN 15 AND 25 THEN 1 ELSE 0 END) AS medium,
          SUM(CASE WHEN r_risk_exposure BETWEEN 7 AND 14 THEN 1 ELSE 0 END) AS low_medium,
          SUM(CASE WHEN r_risk_exposure BETWEEN 1 AND 6 THEN 1 ELSE 0 END) AS low,
          COUNT(*) AS total
        FROM risk.risk_master WHERE is_active = TRUE
      `),
    ]);
    res.json({ ok: true, data: { byDept, top15, overdue, heatmap: heatmap[0] } });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────
router.get("/mis/audit", async (req, res) => {
  try {
    const { username, action_type, limit = "50" } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (username) { conditions.push(`username ILIKE $${p++}`); params.push(`%${username}%`); }
    if (action_type) { conditions.push(`action_type = $${p++}`); params.push(action_type); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(Math.min(Number(limit), 500));

    const rows = await query(`
      SELECT * FROM crm.admin_audit_trail
      ${where}
      ORDER BY created_at DESC
      LIMIT $${p}
    `, params);

    res.json({ ok: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── PROFILES / MENU ─────────────────────────────────────────────────────────
router.get("/mis/profiles", async (_req, res) => {
  try {
    const rows = await query(`
      SELECT p.*, COUNT(ma.menu_access_id) AS permission_count
      FROM crm.profiles p
      LEFT JOIN crm.menu_access ma ON ma.profile_id = p.profile_id AND ma.can_access = TRUE
      WHERE p.is_active = TRUE
      GROUP BY p.profile_id
      ORDER BY p.profile_name
    `);
    res.json({ ok: true, data: rows });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
