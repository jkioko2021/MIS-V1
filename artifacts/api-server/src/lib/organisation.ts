import type { PoolClient } from "pg";
import type { JwtPayload } from "./auth-middleware";
import type { OrganisationAssignmentInput, OrganisationPathItem, GetOrganisationAgentsParams } from "@workspace/api-zod";
import { withTransaction } from "./postgres";
import { salesSetupTransaction, SalesSetupError } from "./sales-structure";
import { sourceMedicalDetails } from "./medical-organisation-details";

export const organisationAdmin = (user: Pick<JwtPayload, "profileId">) => [1, 2].includes(user.profileId);
type PathRow = { id: number; level: string; node_ids: number[]; path: OrganisationPathItem[]; available: boolean };
export async function organisationScope(client: PoolClient, user: JwtPayload) {
  const paths = (await client.query<PathRow>("SELECT * FROM crm.organisation_paths")).rows;
  const profile = (await client.query(`SELECT profile_name FROM crm.profiles WHERE profile_id=$1 AND is_active`, [user.profileId])).rows[0];
  const global = organisationAdmin(user) || profile?.profile_name?.trim().toLowerCase() === "national sales admin";
  if (global) return { global, ids: paths.map(p => p.id), paths };
  const roots = (await client.query<{ id: number }>(`SELECT n.id FROM crm.sales_structure_nodes n
    JOIN crm.sales_manager_enrollments m ON m.id=n.manager_id
    JOIN crm.employees e ON e.employee_id=m.employee_id
    WHERE m.employee_id=$1 AND m.level=n.level AND m.is_active AND NOT e.is_deleted
      AND e.activated AND e.approved AND NOT e.employee_locked
      AND (m.manager_details IS NULL OR (m.manager_details->>'valid_from'<=CURRENT_DATE::text
        AND m.manager_details->>'valid_to'>=CURRENT_DATE::text))`, [user.sub])).rows.map(r => r.id);
  if (!roots.length) throw new SalesSetupError(403, "An assigned, eligible sales manager or administrator is required.");
  const visible = paths.filter(p => p.node_ids.some(id => roots.includes(id)));
  return { global, ids: visible.map(p => p.id), paths: visible };
}
export async function organisationSnapshot(user: JwtPayload) {
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const scope = await organisationScope(client, user);
    const nodes = (await client.query(`SELECT n.id,n.code,n.name,n.level,n.parent_id,n.manager_id,n.is_active,n.version,
      coalesce(s.data,'{}'::jsonb) AS source_details,n.medical_details,
      e.employee_name AS manager_name,p.path,p.available,
      (SELECT count(*)::int FROM crm.sales_structure_nodes c WHERE c.parent_id=n.id AND c.id=ANY($1::int[])) AS child_count,
      (SELECT count(*)::int FROM crm.tbl_mis_sales_intermediary a JOIN crm.organisation_paths u ON u.id=a.organisation_unit_id
        WHERE n.id=ANY(u.node_ids) AND u.id=ANY($1::int[])) AS agent_count
      FROM crm.sales_structure_nodes n JOIN crm.organisation_paths p ON p.id=n.id
      LEFT JOIN crm.sales_catalog_source_records s ON s.id=n.source_reference_id
      LEFT JOIN crm.sales_manager_enrollments m ON m.id=n.manager_id
      LEFT JOIN crm.employees e ON e.employee_id=m.employee_id
      WHERE n.id=ANY($1::int[]) ORDER BY cardinality(p.node_ids),n.name,n.id`, [scope.ids])).rows.map(({source_details,...node})=>({
        ...node,medical_details:{...sourceMedicalDetails(node.level,source_details),...node.medical_details},
      }));
    const managers = organisationAdmin(user) ? (await client.query(`SELECT m.id,m.employee_id,m.level,m.is_active,m.version,
      e.employee_name,e.username,e.emp_code,e.email AS account_email,m.manager_details AS details,
      (NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked
        AND (m.manager_details IS NULL OR (m.manager_details->>'valid_from'<=CURRENT_DATE::text
          AND m.manager_details->>'valid_to'>=CURRENT_DATE::text))) AS user_eligible
      FROM crm.sales_manager_enrollments m JOIN crm.employees e ON e.employee_id=m.employee_id
      JOIN crm.profiles p ON p.profile_id=e.profile_id
      WHERE p.is_active AND lower(btrim(p.profile_name))='sales manager' AND NOT e.is_deleted
      ORDER BY e.employee_name,m.level`)).rows : [];
    const managerUsers = organisationAdmin(user) ? (await client.query(`SELECT e.employee_id,e.employee_name,e.username,
      e.emp_code,e.email,(e.activated AND e.approved AND NOT e.employee_locked
        AND lower(btrim(coalesce(e.department,'')))='sales') AS user_eligible,
      nullif(concat_ws('; ',CASE WHEN NOT e.activated THEN 'Inactive' END,
        CASE WHEN NOT e.approved THEN 'Not approved' END,CASE WHEN e.employee_locked THEN 'Locked' END,
        CASE WHEN lower(btrim(coalesce(e.department,'')))<>'sales' THEN 'Sales department required' END),'') AS eligibility_note
      FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
      WHERE NOT e.is_deleted AND p.is_active AND lower(btrim(p.profile_name))='sales manager'
      ORDER BY e.employee_name,e.employee_id`)).rows : [];
    const candidates = organisationAdmin(user) ? (await client.query(`SELECT s.id AS source_reference_id,s.code,s.name,s.data,
      CASE s.catalog WHEN 'sales-regions' THEN 'REGION' WHEN 'sales-branches' THEN 'BRANCH' ELSE 'UNIT' END AS level,
      CASE s.catalog WHEN 'sales-branches' THEN s.data->>'REGION_CODE'
        WHEN 'sales-units' THEN s.data->>'BRANCH_CODE' ELSE NULL END AS parent_code
      FROM crm.sales_catalog_source_records s WHERE s.catalog IN('sales-regions','sales-branches','sales-units')
        AND NOT EXISTS(SELECT 1 FROM crm.sales_structure_nodes n WHERE upper(n.code)=upper(btrim(s.code)))
      ORDER BY s.name,s.id`)).rows.map(({data,...candidate})=>({
        ...candidate,medical_details:sourceMedicalDetails(candidate.level,data),
      })) : [];
    return { can_manage: organisationAdmin(user), nodes, managers, manager_users: managerUsers, candidates };
  });
}

export async function availableUnit(client: PoolClient, id: number) {
  const unit = (await client.query<PathRow>(
    "SELECT * FROM crm.organisation_paths WHERE id=$1 AND level='UNIT' AND available", [id])).rows[0];
  if (!unit) throw new SalesSetupError(400, "Select an active Unit with an active hierarchy and eligible managers.");
  return unit;
}

// Caller holds the shared hierarchy lock and the existing agent row lock.
// Does not bump version: callers include the assignment in their own atomic write.
export async function assignAgentUnit(client: PoolClient, row: Record<string, any>, unitId: number,
  effectiveDate: string, reason: string, actor: string) {
  const unit = await availableUnit(client, unitId);
  if (row.organisation_unit_id === unitId) return;
  if (!reason.trim() || reason.trim().length > 1000) throw new SalesSetupError(400, "A transfer or assignment reason is required (maximum 1000 characters).");
  const date = new Date(`${effectiveDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== effectiveDate)
    throw new SalesSetupError(400, "Select a real effective date.");
  const timing = (await client.query<{ today: string; latest: string | null }>(`SELECT CURRENT_DATE::text AS today,
    (SELECT max(effective_date)::text FROM crm.agent_unit_assignments WHERE agent_code=$1) AS latest`, [row.agent_code])).rows[0];
  if (effectiveDate > timing.today) throw new SalesSetupError(400, "Future-dated transfers are not supported. Apply the transfer on its effective date.");
  if (timing.latest && effectiveDate < timing.latest) throw new SalesSetupError(400, "The effective date cannot precede the latest assignment.");
  const previous = row.organisation_unit_id
    ? (await client.query<PathRow>("SELECT * FROM crm.organisation_paths WHERE id=$1", [row.organisation_unit_id])).rows[0] : undefined;
  await client.query(`INSERT INTO crm.agent_unit_assignments
    (agent_code,from_unit_id,to_unit_id,effective_date,reason,approved_by,from_hierarchy,hierarchy,legacy_context)
    VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)`,
  [row.agent_code,row.organisation_unit_id,unitId,effectiveDate,reason.trim(),actor,JSON.stringify(previous?.path ?? []),
    JSON.stringify(unit.path),JSON.stringify({unit_code:row.unit_code,branch_code:row.branch_code,region_code:row.region_code})]);
  await client.query("UPDATE crm.tbl_mis_sales_intermediary SET organisation_unit_id=$2 WHERE agent_code=$1", [row.agent_code,unitId]);
  await client.query(`INSERT INTO crm.intermediary_events(agent_code,action,actor,notes)
    VALUES($1,$2,$3,$4)`,[row.agent_code,row.organisation_unit_id ? "UNIT_TRANSFERRED" : "UNIT_ASSIGNED",actor,reason.trim()]);
}
export async function saveOrganisationAssignment(code: string, input: OrganisationAssignmentInput, user: JwtPayload) {
  if (!organisationAdmin(user)) throw new SalesSetupError(403, "Only System Administrators can approve Unit assignments and transfers.");
  return salesSetupTransaction(async client => {
    const row = (await client.query("SELECT * FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1 FOR UPDATE", [code])).rows[0];
    if (!row) throw new SalesSetupError(404, "Agent not found.");
    if (row.version !== input.version) throw new SalesSetupError(409, "The agent changed. Refresh before assigning.");
    if (row.organisation_unit_id === input.unit_id) throw new SalesSetupError(400, "Select a different Unit.");
    await assignAgentUnit(client,row,input.unit_id,input.effective_date,input.reason,user.username);
    const updated = await client.query("UPDATE crm.tbl_mis_sales_intermediary SET version=version+1 WHERE agent_code=$1 RETURNING version",[code]);
    return updated.rows[0];
  });
}

export async function organisationAgents(user: JwtPayload, params: GetOrganisationAgentsParams) {
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const scope = await organisationScope(client, user);
    if (params.node_id && !scope.ids.includes(params.node_id)) throw new SalesSetupError(403, "This organisation is outside your assigned scope.");
    if (params.unmapped && !organisationAdmin(user)) throw new SalesSetupError(403, "Only administrators can view unmapped agents.");
    if (params.as_of) {
      const date = new Date(`${params.as_of}T00:00:00Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== params.as_of)
        throw new SalesSetupError(400, "Select a real reporting date.");
      const today = (await client.query("SELECT CURRENT_DATE::text AS today")).rows[0].today;
      if (params.as_of > today) throw new SalesSetupError(400, "Historical reporting cannot use a future date.");
    }
    const page = params.page ?? 1;
    const result = await client.query(`WITH report AS (
      SELECT a.agent_code,a.agent_name,a.agent_status,a.version,a.unit_code AS legacy_unit_code,
        CASE WHEN $4::date IS NULL THEN a.organisation_unit_id ELSE h.to_unit_id END AS unit_id,
        CASE WHEN $4::date IS NULL THEN coalesce(p.path,'[]'::jsonb) ELSE coalesce(h.hierarchy,'[]'::jsonb) END AS hierarchy
      FROM crm.tbl_mis_sales_intermediary a
      LEFT JOIN crm.organisation_paths p ON p.id=a.organisation_unit_id
      LEFT JOIN LATERAL (SELECT * FROM crm.agent_unit_assignments h WHERE h.agent_code=a.agent_code
        AND h.effective_date<=$4::date ORDER BY effective_date DESC,id DESC LIMIT 1) h ON true
      WHERE ($1::boolean OR a.organisation_unit_id=ANY($2::int[]))
        AND (a.agent_name ILIKE $3 OR a.agent_code ILIKE $3)
    ), filtered AS (
      SELECT * FROM report r WHERE ($1::boolean OR r.unit_id=ANY($2::int[]))
        AND (NOT $5::boolean OR r.unit_id IS NULL)
        AND ($6::int IS NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(r.hierarchy) n WHERE (n->>'id')::int=$6))
    ) SELECT (SELECT count(*)::int FROM filtered) AS total,
      coalesce((SELECT jsonb_agg(page_row) FROM (SELECT * FROM filtered ORDER BY agent_name,agent_code LIMIT 50 OFFSET $7) page_row),'[]'::jsonb) AS items`,
    [scope.global,scope.ids,`%${params.search?.trim() ?? ""}%`,params.as_of ?? null,params.unmapped ?? false,params.node_id ?? null,(page-1)*50]);
    return { ...result.rows[0],page,page_size:50 };
  });
}
export async function organisationAssignmentHistory(user: JwtPayload, code: string) {
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const scope = await organisationScope(client,user);
    const agent = (await client.query("SELECT organisation_unit_id FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1",[code])).rows[0];
    if (!agent || (!scope.global && !scope.ids.includes(agent.organisation_unit_id)))
      throw new SalesSetupError(404,"Agent not found in your assigned scope.");
    return (await client.query(`SELECT h.id::text,h.agent_code,h.from_hierarchy->-1->>'name' AS from_unit,
      h.hierarchy->-1->>'name' AS to_unit,h.hierarchy,h.effective_date::text,h.reason,h.approved_by,h.approved_at::text
      FROM crm.agent_unit_assignments h WHERE h.agent_code=$1 AND ($2::boolean OR h.to_unit_id=ANY($3::int[]))
      ORDER BY h.effective_date DESC,h.id DESC`,[code,scope.global,scope.ids])).rows;
  });
}
