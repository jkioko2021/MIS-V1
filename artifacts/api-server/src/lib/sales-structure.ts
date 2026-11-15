import type { PoolClient } from "pg";
import { withTransaction } from "./postgres";
import type { SalesManagerDetails, SalesManagerInput, SalesManagerUpdate } from "@workspace/api-zod";
import { sourceMedicalDetails, validateMedicalDetails } from "./medical-organisation-details";

export type SalesLevel = "NATIONAL" | "REGION" | "BRANCH" | "UNIT";
type NodeValues = {
  name: string; parent_id: number | null; manager_id: number | null; is_active: boolean;
  medical_details?: Record<string, string | null>;
};
type NodeRow = NodeValues & { id: number; code: string; level: SalesLevel; version: number };
type EnrollmentRow = { id: number; employee_id: number; level: SalesLevel; is_active: boolean; version: number;
  manager_details: SalesManagerDetails | null };
export class SalesSetupError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const parentLevel: Record<SalesLevel, SalesLevel | null> = {
  NATIONAL: null, REGION: "NATIONAL", BRANCH: "REGION", UNIT: "BRANCH",
};
const fail = (message: string): never => { throw new SalesSetupError(400, message); };

async function eligibleUser(client: PoolClient, employeeId: number) {
  const { rows } = await client.query(
    `SELECT employee_id FROM crm.employees WHERE employee_id=$1
       AND NOT is_deleted AND activated AND approved AND NOT employee_locked FOR SHARE`, [employeeId]);
  if (!rows.length) fail("Select an active, approved and unlocked MIS user.");
}
async function audit(client: PoolClient, type: "NODE" | "MANAGER", id: number,
  before: unknown, after: unknown, actor: string) {
  await client.query(`INSERT INTO crm.sales_setup_events(entity_type,entity_id,action,before_data,after_data,actor)
    VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
  [type, id, before ? "UPDATED" : "CREATED", before ? JSON.stringify(before) : null, JSON.stringify(after), actor]);
}
export async function salesSetupTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  return withTransaction(async client => {
    // Serialize hierarchy/enrollment changes so deactivate/reparent/assign checks stay atomic.
    await client.query("SELECT pg_advisory_xact_lock(82026,55)");
    return fn(client);
  });
}
async function syncAdoptedManager(client: PoolClient, node: NodeRow, actor: string) {
  const catalog = { UNIT: "sales-units", BRANCH: "sales-branches", REGION: "sales-regions", NATIONAL: "" }[node.level];
  const existing = (await client.query(`SELECT a.*,e.employee_name FROM crm.sales_team_manager_assignments a
    LEFT JOIN crm.employees e ON e.employee_id=a.employee_id
    WHERE a.catalog=$1 AND upper(a.organization_code)=upper($2) FOR UPDATE OF a`,[catalog,node.code])).rows[0];
  if (!existing) return;
  const manager = (await client.query(`SELECT m.employee_id,e.employee_name FROM crm.sales_manager_enrollments m
    JOIN crm.employees e ON e.employee_id=m.employee_id WHERE m.id=$1`,[node.manager_id])).rows[0];
  const employeeId = manager?.employee_id ?? null;
  if (existing.employee_id === employeeId) return;
  const updated = (await client.query(`UPDATE crm.sales_team_manager_assignments
    SET employee_id=$2,version=version+1,updated_at=now(),updated_by=$3 WHERE id=$1 RETURNING *`,
  [existing.id,employeeId,actor])).rows[0];
  await client.query(`INSERT INTO crm.sales_team_manager_events
    (assignment_id,action,before_data,after_data,note,actor) VALUES($1,$2,$3::jsonb,$4::jsonb,$5,$6)`,
  [existing.id,employeeId === null ? "UNASSIGNED" : "REASSIGNED",JSON.stringify(existing),JSON.stringify({...updated,employee_name:manager?.employee_name ?? null}),
    "Manager updated through Organisation Structure; imported source references retained.",actor]);
}
async function validateNode(client: PoolClient, input: NodeValues, level: SalesLevel, before?: NodeRow) {
  if (!input.name.trim()) fail("A name is required.");
  if (level !== "BRANCH" && input.manager_id === null) fail("National, Region and Unit levels require an enrolled manager.");
  const expected = parentLevel[level];
  if (expected === null) {
    if (input.parent_id !== null) fail("A national structure cannot have a parent.");
  } else {
    const { rows } = await client.query<NodeRow>("SELECT * FROM crm.sales_structure_nodes WHERE id=$1 FOR UPDATE", [input.parent_id]);
    const parent = rows[0];
    if (!parent || parent.level !== expected) fail(`Select a ${expected.toLowerCase()} parent for this category.`);
    if ((!before || input.parent_id !== before.parent_id || input.is_active) && !parent.is_active)
      fail("Select an active parent.");
    if (input.is_active || !before || input.parent_id !== before.parent_id) {
      const available = await client.query("SELECT 1 FROM crm.organisation_paths WHERE id=$1 AND available", [input.parent_id]);
      if (!available.rowCount) fail("The parent hierarchy must be active with eligible managers.");
    }
  }
  if (before && (!input.is_active || input.parent_id !== before.parent_id)) {
    const agents = await client.query(`SELECT 1 FROM crm.tbl_mis_sales_intermediary a
      JOIN crm.organisation_paths p ON p.id=a.organisation_unit_id WHERE $1=ANY(p.node_ids) LIMIT 1`, [before.id]);
    if (agents.rowCount) fail("Transfer the agents in this hierarchy before deactivating or moving it. Historical assignments will be preserved.");
  }
  if (before && !input.is_active) {
    const { rowCount } = await client.query("SELECT 1 FROM crm.sales_structure_nodes WHERE parent_id=$1 AND is_active LIMIT 1", [before.id]);
    if (rowCount) fail("Deactivate or move active child categories before deactivating this category.");
    if (level === "NATIONAL") {
      const used = await client.query(`SELECT 1 FROM crm.sales_catalog_entries
        WHERE is_active AND data->>'NSM_CODE'=$1 LIMIT 1`, [before.code]);
      if (used.rowCount) fail("Reassign active sales enrollments using this National Sales Code before deactivating it.");
    }
  }
  if (input.manager_id !== null) {
    const { rows } = await client.query<EnrollmentRow>(
      "SELECT * FROM crm.sales_manager_enrollments WHERE id=$1 FOR UPDATE", [input.manager_id]);
    const manager = rows[0];
    if (!manager || manager.level !== level) fail("The manager must be enrolled at the same level as this category.");
    // Preserve historical mappings on inactive records, but never introduce an ineligible manager.
    if (input.is_active || before?.manager_id !== input.manager_id) {
      if (!manager.is_active) fail("Select an active manager enrollment.");
      await eligibleUser(client, manager.employee_id);
      const salesProfile = await client.query(`SELECT 1 FROM crm.employees e
        JOIN crm.profiles p ON p.profile_id=e.profile_id
        WHERE e.employee_id=$1 AND p.is_active AND lower(btrim(p.profile_name))='sales manager'`, [manager.employee_id]);
      if (!salesProfile.rowCount) fail("Assigned managers must have the Sales Manager profile and be enrolled in the matching manager category.");
      const validity = manager.manager_details;
      const today = (await client.query<{ today: string }>("SELECT CURRENT_DATE::text AS today")).rows[0].today;
      if (validity && (validity.valid_from > today || validity.valid_to < today))
        fail("Select a manager whose designation is valid today.");
    }
  }
}
export async function createSalesNode(input: NodeValues & { code: string; level: SalesLevel; source_reference_id?: number }, actor: string) {
  return salesSetupTransaction(async client => {
    await validateNode(client, input, input.level);
    const catalog = { UNIT: "sales-units", BRANCH: "sales-branches", REGION: "sales-regions", NATIONAL: "" }[input.level];
    const refs = (await client.query(`SELECT id,code,name,data FROM crm.sales_catalog_source_records
      WHERE catalog=$1 AND upper(btrim(code))=upper($2) ORDER BY id`, [catalog, input.code])).rows;
    const operational = await client.query(`SELECT 1 FROM crm.sales_catalog_entries WHERE catalog=$1
      AND upper(btrim(code))=upper($2) LIMIT 1`, [catalog, input.code]);
    if (operational.rowCount) fail("This organisation already exists in the operational catalog. Reconcile its record before creating a hierarchy duplicate.");
    if (refs.length) {
      if (refs.length !== 1 || refs[0].id !== input.source_reference_id)
        fail("Select the existing imported reference for this code; ambiguous source records require reconciliation.");
      if (refs[0].name.trim() !== input.name.trim()) fail("Use the imported name when adopting this reference. You can edit the name after adoption.");
      const nationalMapping = (await client.query(`SELECT ss.national_node_id,
        ss.source_row_sha256=s.row_sha256 AND ss.national_source_code=upper(btrim(s.data->>'NSM_CODE'))
          AND n.level='NATIONAL' AND n.is_active AS current_mapping,
        (SELECT node_ids[1] FROM crm.organisation_paths WHERE id=$2) AS parent_national_id
        FROM crm.organisation_source_setup ss
        JOIN crm.sales_catalog_source_records s ON s.id=ss.source_reference_id
        JOIN crm.sales_structure_nodes n ON n.id=ss.national_node_id
        WHERE ss.source_reference_id=$1 AND ss.national_node_id IS NOT NULL`,
      [refs[0].id,input.parent_id])).rows[0];
      if (nationalMapping && (!nationalMapping.current_mapping
        || nationalMapping.parent_national_id !== nationalMapping.national_node_id))
        fail("Use the mapped National hierarchy. Review the National mapping if its source or National record changed.");
      const parentCode = input.level === "UNIT" ? refs[0].data.BRANCH_CODE : input.level === "BRANCH" ? refs[0].data.REGION_CODE : null;
      if (parentCode && String(parentCode).trim().toUpperCase() !== "NULL") {
        const parent = (await client.query("SELECT code FROM crm.sales_structure_nodes WHERE id=$1", [input.parent_id])).rows[0];
        if (parent?.code !== String(parentCode).trim().toUpperCase()) fail("Select the parent recorded in the imported reference. Resolve source conflicts before adoption.");
      }
    } else if (input.source_reference_id) fail("This imported reference no longer matches the selected code.");
    const oldAssignment = (await client.query(`SELECT employee_id FROM crm.sales_team_manager_assignments
      WHERE catalog=$1 AND upper(organization_code)=upper($2) AND employee_id IS NOT NULL`, [catalog, input.code])).rows[0];
    if (oldAssignment) {
      const chosen = (await client.query("SELECT employee_id FROM crm.sales_manager_enrollments WHERE id=$1", [input.manager_id])).rows[0];
      if (chosen?.employee_id !== oldAssignment.employee_id)
        fail("The imported organisation already has a different manager assignment. Select that manager or reconcile the existing mapping first.");
    }
    const medicalDetails = validateMedicalDetails(input.level, {
      ...sourceMedicalDetails(input.level, refs[0]?.data), ...input.medical_details,
    }, fail);
    await validateMedicalGiLink(client, medicalDetails);
    const { rows } = await client.query<NodeRow>(
      `INSERT INTO crm.sales_structure_nodes(code,name,level,parent_id,manager_id,is_active,created_by,updated_by,source_reference_id,medical_details)
       VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9::jsonb) RETURNING *`,
      [input.code.toUpperCase(), input.name.trim(), input.level, input.parent_id, input.manager_id, input.is_active, actor, input.source_reference_id ?? null,JSON.stringify(medicalDetails)]);
    await audit(client, "NODE", rows[0].id, null, rows[0], actor);
    await syncAdoptedManager(client, rows[0], actor);
    return { id: rows[0].id, version: rows[0].version };
  });
}
export async function updateSalesNode(id: number, input: NodeValues & { version: number }, actor: string) {
  return salesSetupTransaction(async client => {
    const { rows } = await client.query<NodeRow>("SELECT * FROM crm.sales_structure_nodes WHERE id=$1 FOR UPDATE", [id]);
    const before = rows[0];
    if (!before) throw new SalesSetupError(404, "Sales category not found.");
    if (before.version !== input.version) throw new SalesSetupError(409, "This category changed. Refresh the list and reopen it before saving.");
    await validateNode(client, input, before.level, before);
    const source = (await client.query(`SELECT s.data FROM crm.sales_structure_nodes n
      JOIN crm.sales_catalog_source_records s ON s.id=n.source_reference_id WHERE n.id=$1`, [id])).rows[0];
    const medicalDetails = validateMedicalDetails(before.level, {
      ...sourceMedicalDetails(before.level, source?.data), ...before.medical_details, ...input.medical_details,
    }, fail);
    await validateMedicalGiLink(client, medicalDetails);
    const result = await client.query<NodeRow>(`UPDATE crm.sales_structure_nodes SET
      name=$2,parent_id=$3,manager_id=$4,is_active=$5,version=version+1,updated_at=now(),updated_by=$6,medical_details=$7::jsonb
      WHERE id=$1 RETURNING *`, [id, input.name.trim(), input.parent_id, input.manager_id, input.is_active, actor,JSON.stringify(medicalDetails)]);
    await audit(client, "NODE", id, before, result.rows[0], actor);
    await syncAdoptedManager(client, result.rows[0], actor);
    return { id, version: result.rows[0].version };
  });
}
async function validateMedicalGiLink(client: PoolClient, values: Record<string, string | null>) {
  for (const [field, catalog] of [["GI_BRANCH", "gi-branches"], ["GI_UNIT", "gi-units"]]) {
    const code = values[field];
    if (!code) continue;
    const exists = await client.query(`SELECT 1 FROM crm.sales_catalog_source_records WHERE catalog=$1 AND upper(btrim(code))=upper($2)
      UNION ALL SELECT 1 FROM crm.sales_catalog_entries WHERE catalog=$1 AND upper(btrim(code))=upper($2) LIMIT 1`, [catalog, code]);
    if (!exists.rowCount) fail(`Select an existing ${field === "GI_UNIT" ? "GI Unit" : "GI Branch"}, or clear the optional link.`);
  }
}
async function checkedManagerDetails(client: PoolClient, employeeId: number, input: SalesManagerDetails, requireSales = false, requireComplete = true) {
  if (!input) fail("Complete the manager enrollment details.");
  const details = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.trim()])) as SalesManagerDetails;
  for (const [key, value] of Object.entries(details)) if (!value && (requireComplete || ["code","name","mis_emp_code"].includes(key)))
    fail(`${key} is required${requireComplete ? " before activating this enrollment. Edit the manager details first" : ""}.`);
  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) fail("Enter a valid manager email.");
  const { rows } = await client.query<{ employee_name: string; emp_code: string | null; department: string | null }>(
    `SELECT employee_name,emp_code,department FROM crm.employees WHERE employee_id=$1 AND NOT is_deleted FOR SHARE`, [employeeId]);
  const user = rows[0];
  const userCode = user?.emp_code?.trim();
  if (!userCode) return fail("Select an existing MIS user with a code. Complete the user's enrollment first if their code is missing.");
  if (requireSales && user.department?.trim().toLowerCase() !== "sales")
    fail("Select an existing user in the Sales department for manager enrollment.");
  if (details.code !== userCode || details.mis_emp_code !== userCode
      || details.name !== user.employee_name.trim())
    throw new SalesSetupError(409, "Code, MIS_EMP_CODE and Name must match the selected MIS account. Refresh and select the account again.");
  const duplicateCode = await client.query(`SELECT 1 FROM crm.employees
    WHERE NOT is_deleted AND lower(btrim(emp_code))=lower($1) AND employee_id<>$2 LIMIT 1`, [details.code, employeeId]);
  if (duplicateCode.rowCount) fail("This MIS user code is shared by another account. Correct the account codes before enrolling the manager.");
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if ((details.valid_from && !validDate(details.valid_from)) || (details.valid_to && !validDate(details.valid_to)))
    fail("Valid From and Valid To must be real calendar dates in YYYY-MM-DD format.");
  if (details.valid_from && details.valid_to && details.valid_to < details.valid_from) fail("Valid To cannot be before Valid From.");
  if (details.h_tax && !/^(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$/.test(details.h_tax))
    fail("H_TAX must be a nonnegative decimal with at most six decimal places.");
  return details;
}
export async function captureSalesManagerEnrollment(client: PoolClient, input: SalesManagerInput, actor: string) {
    // Capturing an inactive designation does not activate or approve a login.
    if (input.is_active) await eligibleUser(client, input.employee_id);
    const details = await checkedManagerDetails(client, input.employee_id, input.details, true, input.is_active);
    const { rows } = await client.query<EnrollmentRow>(`INSERT INTO crm.sales_manager_enrollments
      (employee_id,level,is_active,manager_details,created_by,updated_by) VALUES($1,$2,$3,$4::jsonb,$5,$5) RETURNING *`,
    [input.employee_id, input.level, input.is_active, JSON.stringify(details), actor]);
    await audit(client, "MANAGER", rows[0].id, null, rows[0], actor);
    return { id: rows[0].id, version: rows[0].version };
}
export async function enrollSalesManager(input: SalesManagerInput, actor: string) {
  return salesSetupTransaction(client => captureSalesManagerEnrollment(client, input, actor));
}
export async function updateSalesManager(id: number, input: SalesManagerUpdate, actor: string) {
  return salesSetupTransaction(async client => {
    const { rows } = await client.query<EnrollmentRow>("SELECT * FROM crm.sales_manager_enrollments WHERE id=$1 FOR UPDATE", [id]);
    const before = rows[0];
    if (!before) throw new SalesSetupError(404, "Manager enrollment not found.");
    if (before.version !== input.version) throw new SalesSetupError(409, "This enrollment changed. Refresh before trying again.");
    const effectiveDetails = input.details ?? before.manager_details;
    const details = input.is_active || input.details
      ? await checkedManagerDetails(client, before.employee_id, effectiveDetails!, false, input.is_active)
      : undefined;
    if (input.is_active) await eligibleUser(client, before.employee_id);
    else {
      const { rowCount } = await client.query(
        "SELECT 1 FROM crm.sales_structure_nodes WHERE manager_id=$1 AND is_active LIMIT 1", [id]);
      if (rowCount) fail("Reassign or unassign this manager from active sales categories before deactivating the enrollment.");
      const catalog = { UNIT: "sales-units", BRANCH: "sales-branches", REGION: "sales-regions", NATIONAL: null }[before.level];
      if (catalog) {
        const mapped = await client.query(`SELECT 1 FROM crm.sales_team_manager_assignments
          WHERE catalog=$1 AND employee_id=$2 LIMIT 1`, [catalog, before.employee_id]);
        if (mapped.rowCount) fail("Reassign or unassign this manager's teams in Manager Mapping before deactivating this category.");
      }
      if (before.level === "BRANCH") {
        const used = await client.query(`SELECT 1 FROM crm.sales_catalog_entries
          WHERE catalog='sales-branches' AND is_active AND data->>'BRANCH_MGR_ID'=$1 LIMIT 1`, [String(id)]);
        if (used.rowCount) fail("Unassign this manager from active Sales Branch enrollments before deactivating the enrollment.");
      }
    }
    const result = await client.query<EnrollmentRow>(`UPDATE crm.sales_manager_enrollments
      SET is_active=$2,version=version+1,updated_at=now(),updated_by=$3,
        manager_details=CASE WHEN $4::jsonb IS NULL THEN manager_details ELSE $4::jsonb END
      WHERE id=$1 RETURNING *`,
    [id, input.is_active, actor, details ? JSON.stringify(details) : null]);
    await audit(client, "MANAGER", id, before, result.rows[0], actor);
    return { id, version: result.rows[0].version };
  });
}
