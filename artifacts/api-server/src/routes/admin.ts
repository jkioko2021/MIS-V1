import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { query, queryOne, txQuery, withTransaction } from "../lib/postgres";
import { requireAuth } from "../lib/auth-middleware";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

// ─── Master menu catalogue ────────────────────────────────────────────────────
// This is the authoritative list of all pages/items in the system.
// Access rights for every profile are derived from this list.
export const MENU_MASTER = [
  { main: "Dashboard", sub: "Overview", url: "/", order: 10 },
  { main: "Dashboard", sub: "Notifications", url: "/notifications", order: 20 },
  { main: "Business", sub: "Register Queue", url: "/business", order: 10 },
  { main: "Business", sub: "BPO Review Retail", url: "/business/bpo-retail", order: 20 },
  { main: "Business", sub: "BPO Review Corporates/SME", url: "/business/bpo-corporate-sme", order: 30 },
  { main: "Business", sub: "Medical Review", url: "/business/medical-review", order: 40 },
  { main: "Business", sub: "Pricing Review", url: "/business/pricing", order: 50 },
  { main: "Business", sub: "Allocated Files", url: "/business/allocated", order: 60 },
  { main: "Business", sub: "Cashier Review", url: "/business/cashier", order: 70 },
  { main: "Business", sub: "Record Filing", url: "/business/record-filing", order: 80 },
  { main: "Business", sub: "Register Business", url: "/business/new", order: 90 },
  { main: "Business", sub: "Finance Queue", url: "/business/finance", order: 100 },
  { main: "Business", sub: "Dispatch Queue", url: "/business/dispatch", order: 110 },
  { main: "Business", sub: "Declined Files", url: "/business/declined", order: 120 },
  { main: "Risk",       sub: "Risk Dashboard",          url: "/risk",                  order: 10 },
  { main: "Risk",       sub: "New Risk Entry",          url: "/risk/new",              order: 20 },
  { main: "Risk",       sub: "My Department Risks",     url: "/risk/open",             order: 30 },
  { main: "Reports",    sub: "Business Reports",        url: "/reports/business",      order: 10 },
  { main: "Reports",    sub: "Risk Reports",            url: "/reports/risk",          order: 20 },
  { main: "Admin",      sub: "User Management",         url: "/admin/users",           order: 10 },
  { main: "Admin",      sub: "Profile Management",      url: "/admin/profiles",        order: 20 },
  { main: "Admin",      sub: "Audit Trail",             url: "/admin/audit",           order: 30 },
  { main: "Admin",      sub: "Password Config",         url: "/admin/password-config", order: 40 },
  { main: "Parameter Settings", sub: "Configure Business Req", url: "/admin/business-requirements", order: 10 },
];

function handleError(res: Response, err: unknown, ctx: string) {
  logger.error({ err, ctx }, "Admin route error");
  res.status(500).json({ ok: false, error: String(err) });
}

function requireParameterAdmin(req: Request, res: Response, next: () => void) {
  if (req.user?.profileId !== 1 && req.user?.profileId !== 2) {
    res.status(403).json({ ok: false, error: "Parameter Settings requires SuperAdmin or System Admin access." });
    return;
  }
  next();
}

type BusinessRequirementInput = {
  req_name: string;
  applies_to: string;
  is_active: boolean;
  code: number;
};

type BusinessRequirementRow = BusinessRequirementInput & { req_id: number; req_code: number };

function parseBusinessRequirementInput(body: unknown): { input?: BusinessRequirementInput; error?: string } {
  const record = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const reqName = typeof record.req_name === "string" ? record.req_name.trim() : "";
  const appliesTo = typeof record.applies_to === "string" ? record.applies_to.trim().toUpperCase() : "";
  const isActive = record.is_active !== false && record.is_active !== 0 && record.is_active !== "0";
  const code = Number(record.code);

  if (!reqName || reqName.length > 255) {
    return { error: "REQ_NAME is required and must be 255 characters or fewer." };
  }
  if (appliesTo !== "R" && appliesTo !== "C") {
    return { error: "APPLIES_TO must be R (Retail) or C (Corporate)." };
  }
  if (!Number.isInteger(code) || code < 1) {
    return { error: "CODE must be a positive whole number." };
  }

  return { input: { req_name: reqName, applies_to: appliesTo, is_active: isActive, code } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS REQUIREMENT PARAMETER SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/admin/business-requirements", requireParameterAdmin, async (req: Request, res: Response) => {
  try {
    const { search, client, active } = req.query as Record<string, string | undefined>;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search?.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(req_code::text ILIKE $${params.length} OR req_name ILIKE $${params.length})`);
    }
    if (client) {
      if (client !== "R" && client !== "C") {
        res.status(400).json({ ok: false, error: "CLIENT must be R or C." });
        return;
      }
      params.push(client);
      conditions.push(`applies_to = $${params.length}`);
    }
    if (active === "active" || active === "inactive") {
      params.push(active === "active");
      conditions.push(`is_active = $${params.length}`);
    }

    const rows = await query(
      `SELECT req_id, req_code, req_name, applies_to, is_active, code
       FROM crm.business_req
       ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY applies_to, code, req_id`,
      params,
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    handleError(res, err, "list business requirements");
  }
});

router.post("/admin/business-requirements", requireParameterAdmin, async (req: Request, res: Response) => {
  const parsed = parseBusinessRequirementInput(req.body);
  if (!parsed.input) {
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }
  const input = parsed.input;

  try {
    const row = await withTransaction(async (client) => {
      await txQuery(client, "LOCK TABLE crm.business_req IN SHARE ROW EXCLUSIVE MODE");
      const nextIdRows = await txQuery<{ next_id: number }>(
        client,
        `SELECT COALESCE(MAX(req_id), 0) + 1 AS next_id
         FROM crm.business_req`,
      );
      const nextId = Number(nextIdRows[0]?.next_id);
      if (!Number.isInteger(nextId) || nextId < 1) throw new Error("Could not allocate a safe requirement ID.");

      const created = await txQuery<BusinessRequirementRow>(
        client,
        `INSERT INTO crm.business_req
           (req_id, req_code, req_name, applies_to, is_active, code)
         VALUES ($1, $1, $2, $3, $4, $5)
         RETURNING req_id, req_code, req_name, applies_to, is_active, code`,
        [
          nextId,
          input.req_name,
          input.applies_to,
          input.is_active,
          input.code,
        ],
      );
      const requirement = created[0];
      if (!requirement) throw new Error("Requirement was not created.");

      await txQuery(
        client,
        `SELECT setval(pg_get_serial_sequence('crm.business_req', 'req_id'), $1, true)`,
        [requirement.req_id],
      );
      await txQuery(
        client,
        `INSERT INTO crm.admin_audit_trail (employee_id, action, details)
         VALUES ($1, 'BUSINESS_REQUIREMENT_CREATED', $2)`,
        [req.user!.sub, `Created requirement ${requirement.req_id}`],
      );
      return requirement;
    });
    res.status(201).json({ ok: true, data: row });
  } catch (err: unknown) {
    if (String(err).includes("unique")) {
      res.status(409).json({ ok: false, error: "Requirement ID or legacy code already exists." });
      return;
    }
    handleError(res, err, "create business requirement");
  }
});

router.put("/admin/business-requirements/:id", requireParameterAdmin, async (req: Request, res: Response) => {
  const parsed = parseBusinessRequirementInput(req.body);
  if (!parsed.input) {
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }
  const input = parsed.input;
  const docId = Number(req.params.id);
  if (!Number.isInteger(docId) || docId < 1) {
    res.status(400).json({ ok: false, error: "Requirement ID must be a positive whole number." });
    return;
  }

  try {
    const row = await withTransaction(async (client) => {
      const currentRows = await txQuery<BusinessRequirementRow>(
        client,
        `SELECT req_id, req_code, req_name, applies_to, is_active, code
         FROM crm.business_req
         WHERE req_id = $1
         FOR UPDATE`,
        [docId],
      );
      if (!currentRows[0]) return null;

      const updated = await txQuery<BusinessRequirementRow>(
        client,
        `UPDATE crm.business_req
         SET req_name = $2, applies_to = $3, is_active = $4, code = $5
         WHERE req_id = $1
         RETURNING req_id, req_code, req_name, applies_to, is_active, code`,
        [
          docId,
          input.req_name,
          input.applies_to,
          input.is_active,
          input.code,
        ],
      );
      const requirement = updated[0];
      if (!requirement) throw new Error("Requirement update was not returned.");

      await txQuery(
        client,
        `INSERT INTO crm.admin_audit_trail (employee_id, action, details)
         VALUES ($1, 'BUSINESS_REQUIREMENT_UPDATED', $2)`,
        [req.user!.sub, `Updated requirement ${requirement.req_id}`],
      );
      return requirement;
    });
    if (!row) {
      res.status(404).json({ ok: false, error: "Requirement not found." });
      return;
    }
    res.json({ ok: true, data: row });
  } catch (err: unknown) {
    if (String(err).includes("unique")) {
      res.status(409).json({ ok: false, error: "Requirement ID or legacy code already exists." });
      return;
    }
    handleError(res, err, "update business requirement");
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /admin/employees
router.get("/admin/employees", async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query as Record<string, string>;
    const conditions: string[] = ["e.is_deleted = FALSE"];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(e.employee_name ILIKE $${params.length} OR e.username ILIKE $${params.length} OR e.emp_code ILIKE $${params.length} OR e.email ILIKE $${params.length})`);
    }
    if (status === "active")   conditions.push("e.activated = TRUE AND e.approved = TRUE AND e.employee_locked = FALSE");
    if (status === "locked")   conditions.push("e.employee_locked = TRUE");
    if (status === "pending")  conditions.push("e.approved = FALSE OR e.activated = FALSE");
    if (status === "inactive") conditions.push("e.activated = FALSE");

    const rows = await query<{
      employee_id: number; emp_code: string; username: string;
      employee_name: string; email: string | null; department: string;
      profile_id: number; profile_name: string;
      activated: boolean; employee_locked: boolean; approved: boolean;
      failed_attempts: number; last_login_date: string | null;
      last_password_reset: string | null; created_at: string; added_by: string | null;
    }>(
      `SELECT e.employee_id, e.emp_code, e.username, e.employee_name, e.email,
              e.department, e.profile_id, p.profile_name,
              e.activated, e.employee_locked, e.approved,
              e.failed_attempts, e.last_login_date, e.last_password_reset,
              e.created_at, e.added_by
       FROM crm.employees e
       LEFT JOIN crm.profiles p ON p.profile_id = e.profile_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY e.employee_id`,
      params
    );
    res.json({ ok: true, data: rows });
  } catch (err) { handleError(res, err, "list employees"); }
});

// POST /admin/employees  (enroll)
router.post("/admin/employees", async (req: Request, res: Response) => {
  const { username, employee_name, email, department, profile_id, activated, approved, password } =
    req.body as Record<string, string | boolean | number>;
  if (!username || !employee_name || !profile_id) {
    res.status(400).json({ ok: false, error: "username, employee_name, profile_id are required." });
    return;
  }
  try {
    // Email uniqueness check
    if (email) {
      const existing = await queryOne<{ c: number }>(
        `SELECT COUNT(*)::int AS c FROM crm.employees WHERE LOWER(email)=LOWER($1) AND is_deleted=FALSE`,
        [String(email)]
      );
      if ((existing?.c ?? 0) > 0) {
        res.status(409).json({ ok: false, error: "An account with this email address already exists." });
        return;
      }
    }

    // Next emp_code
    const last = await queryOne<{ emp_code: string }>(
      `SELECT emp_code FROM crm.employees WHERE emp_code LIKE 'EMP%' ORDER BY employee_id DESC LIMIT 1`
    );
    const nextNum = last ? parseInt(last.emp_code.replace("EMP", ""), 10) + 1 : 1;
    const emp_code = `EMP${String(nextNum).padStart(3, "0")}`;

    const pw = String(password || "AAR@2024!");
    const hash = await bcrypt.hash(pw, 10);

    const row = await queryOne<{ employee_id: number }>(
      `INSERT INTO crm.employees
         (emp_code, username, password_hash, employee_name, email, department,
          profile_id, activated, approved, last_password_reset, added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10)
       RETURNING employee_id`,
      [emp_code, String(username), hash, String(employee_name),
       email ? String(email) : null,
       department ? String(department) : null,
       Number(profile_id),
       activated === true || activated === "true",
       approved === true || approved === "true",
       req.user!.username]
    );

    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,'USER_ENROLLED',$2)`,
      [req.user!.sub, `Enrolled user: ${username} (${emp_code})`]
    ).catch(() => {});

    res.status(201).json({ ok: true, data: { employee_id: row?.employee_id, emp_code } });
  } catch (err: unknown) {
    if (String(err).includes("unique")) {
      res.status(409).json({ ok: false, error: "Username already exists." });
    } else { handleError(res, err, "enroll employee"); }
  }
});

// GET /admin/employees/:id
router.get("/admin/employees/:id", async (req: Request, res: Response) => {
  try {
    const row = await queryOne(
      `SELECT e.*, p.profile_name FROM crm.employees e
       LEFT JOIN crm.profiles p ON p.profile_id = e.profile_id
       WHERE e.employee_id = $1 AND e.is_deleted = FALSE`,
      [req.params.id]
    );
    if (!row) { res.status(404).json({ ok: false, error: "Employee not found." }); return; }
    res.json({ ok: true, data: row });
  } catch (err) { handleError(res, err, "get employee"); }
});

// PUT /admin/employees/:id
router.put("/admin/employees/:id", async (req: Request, res: Response) => {
  const { employee_name, email, department, profile_id } = req.body as Record<string, string | number>;
  try {
    await query(
      `UPDATE crm.employees SET employee_name=$1, email=$2, department=$3, profile_id=$4,
       modified_by=$5, updated_at=NOW() WHERE employee_id=$6`,
      [employee_name, email || null, department || null, Number(profile_id), req.user!.username, req.params.id]
    );
    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,'USER_UPDATED',$2)`,
      [req.user!.sub, `Updated employee ID ${req.params.id}`]
    ).catch(() => {});
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "update employee"); }
});

// POST /admin/employees/:id/activate
router.post("/admin/employees/:id/activate", async (req: Request, res: Response) => {
  const { activate } = req.body as { activate: boolean };
  try {
    await query(`UPDATE crm.employees SET activated=$1, updated_at=NOW() WHERE employee_id=$2`, [!!activate, req.params.id]);
    await query(`INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,$2,$3)`,
      [req.user!.sub, activate ? "USER_ACTIVATED" : "USER_DEACTIVATED", `Employee ID ${req.params.id}`]).catch(() => {});
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "activate employee"); }
});

// POST /admin/employees/:id/approve
router.post("/admin/employees/:id/approve", async (req: Request, res: Response) => {
  const { approve } = req.body as { approve: boolean };
  try {
    await query(
      `UPDATE crm.employees SET approved=$1, approved_by=$2, date_approved=CURRENT_DATE, updated_at=NOW() WHERE employee_id=$3`,
      [!!approve, req.user!.username, req.params.id]
    );
    await query(`INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,$2,$3)`,
      [req.user!.sub, approve ? "USER_APPROVED" : "USER_APPROVAL_REVOKED", `Employee ID ${req.params.id}`]).catch(() => {});
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "approve employee"); }
});

// POST /admin/employees/:id/lock
router.post("/admin/employees/:id/lock", async (req: Request, res: Response) => {
  const { lock } = req.body as { lock: boolean };
  try {
    await query(
      `UPDATE crm.employees SET employee_locked=$1, failed_attempts=0, updated_at=NOW() WHERE employee_id=$2`,
      [!!lock, req.params.id]
    );
    await query(`INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,$2,$3)`,
      [req.user!.sub, lock ? "USER_LOCKED" : "USER_UNLOCKED", `Employee ID ${req.params.id}`]).catch(() => {});
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "lock employee"); }
});

// POST /admin/employees/:id/reset-password
router.post("/admin/employees/:id/reset-password", async (req: Request, res: Response) => {
  try {
    const rand = Math.random().toString(36).slice(-6).toUpperCase();
    const tempPw = `AAR@${rand}!`;
    const hash = await bcrypt.hash(tempPw, 10);
    await query(
      `UPDATE crm.employees SET password_hash=$1, last_password_reset=NULL, failed_attempts=0,
       employee_locked=FALSE, modified_by=$2, updated_at=NOW() WHERE employee_id=$3`,
      [hash, req.user!.username, req.params.id]
    );
    await query(`INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,'PASSWORD_RESET',$2)`,
      [req.user!.sub, `Reset password for employee ID ${req.params.id}`]).catch(() => {});
    res.json({ ok: true, tempPassword: tempPw });
  } catch (err) { handleError(res, err, "reset password"); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILES / ROLES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /admin/profiles
router.get("/admin/profiles", async (_req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT p.*, COUNT(e.employee_id)::int AS employee_count
       FROM crm.profiles p
       LEFT JOIN crm.employees e ON e.profile_id = p.profile_id AND e.is_deleted = FALSE
       GROUP BY p.profile_id ORDER BY p.profile_id`
    );
    res.json({ ok: true, data: rows });
  } catch (err) { handleError(res, err, "list profiles"); }
});

// POST /admin/profiles
router.post("/admin/profiles", async (req: Request, res: Response) => {
  const { profile_name, profile_type } = req.body as { profile_name: string; profile_type?: string };
  if (!profile_name) { res.status(400).json({ ok: false, error: "profile_name is required." }); return; }
  try {
    const row = await queryOne<{ profile_id: number }>(
      `INSERT INTO crm.profiles (profile_name, profile_type) VALUES ($1, $2) RETURNING profile_id`,
      [profile_name, profile_type || "ADMIN"]
    );
    res.status(201).json({ ok: true, data: { profile_id: row?.profile_id } });
  } catch (err: unknown) {
    if (String(err).includes("unique")) res.status(409).json({ ok: false, error: "Profile name already exists." });
    else handleError(res, err, "create profile");
  }
});

// PUT /admin/profiles/:id
router.put("/admin/profiles/:id", async (req: Request, res: Response) => {
  const { profile_name, profile_type, is_active } = req.body as Record<string, string | boolean>;
  try {
    await query(
      `UPDATE crm.profiles SET profile_name=$1, profile_type=$2, is_active=$3 WHERE profile_id=$4`,
      [profile_name, profile_type || "ADMIN", is_active !== false, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "update profile"); }
});

// DELETE /admin/profiles/:id
router.delete("/admin/profiles/:id", async (req: Request, res: Response) => {
  try {
    const count = await queryOne<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM crm.employees WHERE profile_id=$1 AND is_deleted=FALSE`, [req.params.id]
    );
    if ((count?.c ?? 0) > 0) {
      res.status(409).json({ ok: false, error: "Cannot delete profile with active employees. Reassign them first." });
      return;
    }
    await query(`DELETE FROM crm.menu_access WHERE profile_id=$1`, [req.params.id]);
    await query(`DELETE FROM crm.profiles WHERE profile_id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "delete profile"); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESS RIGHTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /admin/profiles/:id/access  — merged master + DB
router.get("/admin/profiles/:id/access", async (req: Request, res: Response) => {
  try {
    const profileId = Number(req.params.id);
    const profile = await queryOne(
      `SELECT profile_id, profile_name, profile_type, is_active FROM crm.profiles WHERE profile_id=$1`, [profileId]
    );
    if (!profile) { res.status(404).json({ ok: false, error: "Profile not found." }); return; }

    // Existing DB rows for this profile
    const existing = await query<{
      main_menu_name: string; sub_menu_name: string; page_url: string;
      menu_order: number; can_access: boolean; can_add: boolean;
      can_edit: boolean; can_delete: boolean; read_only: boolean;
    }>(
      `SELECT main_menu_name, sub_menu_name, page_url, menu_order,
              can_access, can_add, can_edit, can_delete, read_only
       FROM crm.menu_access WHERE profile_id=$1`, [profileId]
    );

    const dbMap = new Map(existing.map(r => [r.page_url, r]));

    // Merge master list with DB values
    const items = MENU_MASTER.map(m => {
      // Existing medical-review grants were saved under the previous page URL.
      // Preserve them in the access editor until an admin saves the renamed menu.
      const db = dbMap.get(m.url) ?? (m.url === "/business/medical-review"
        ? dbMap.get("/medical-underwriting")
        : undefined);
      return {
        main_menu_name: m.main,
        sub_menu_name: m.sub,
        page_url: m.url,
        menu_order: m.order,
        can_access:  db?.can_access  ?? false,
        can_add:     db?.can_add     ?? false,
        can_edit:    db?.can_edit    ?? false,
        can_delete:  db?.can_delete  ?? false,
        read_only:   db?.read_only   ?? false,
      };
    });

    res.json({ ok: true, profile, items });
  } catch (err) { handleError(res, err, "get access"); }
});

// PUT /admin/profiles/:id/access  — bulk replace
router.put("/admin/profiles/:id/access", async (req: Request, res: Response) => {
  const profileId = Number(req.params.id);
  const { items } = req.body as {
    items: Array<{
      main_menu_name: string; sub_menu_name: string; page_url: string;
      menu_order: number; can_access: boolean; can_add: boolean;
      can_edit: boolean; can_delete: boolean; read_only: boolean;
    }>;
  };
  if (!Array.isArray(items)) { res.status(400).json({ ok: false, error: "items array required." }); return; }
  try {
    await query(`DELETE FROM crm.menu_access WHERE profile_id=$1`, [profileId]);
    for (const it of items) {
      await query(
        `INSERT INTO crm.menu_access
           (profile_id, main_menu_name, sub_menu_name, page_url, menu_order,
            can_access, can_add, can_edit, can_delete, read_only)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [profileId, it.main_menu_name, it.sub_menu_name, it.page_url, it.menu_order,
         !!it.can_access, !!it.can_add, !!it.can_edit, !!it.can_delete, !!it.read_only]
      );
    }
    await query(`INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1,'ACCESS_UPDATED',$2)`,
      [req.user!.sub, `Updated access rights for profile ID ${profileId}`]).catch(() => {});
    res.json({ ok: true });
  } catch (err) { handleError(res, err, "save access"); }
});

// GET /admin/menu-master  — full master list (for frontend reference)
router.get("/admin/menu-master", (_req: Request, res: Response) => {
  res.json({ ok: true, data: MENU_MASTER });
});

export default router;
