import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import type {
  SalesManagerMappingInput, SalesMappingCatalog, SalesMappingOrganization,
  SalesTeamManagerAssignment, SalesManagerMappingEvent,
} from "@workspace/api-zod";
import { withTransaction } from "./postgres";
import { SalesSetupError, salesSetupTransaction } from "./sales-structure";
import { orphanedMappingOrganization, salesMappingOrganizations } from "./sales-mapping-organizations";

type AssignmentRow = Omit<SalesTeamManagerAssignment, "updated_at"> & {
  updated_at: Date | string; organization_context: SalesMappingOrganization;
};
const assignmentSql = `SELECT a.id,a.catalog,a.organization_code,a.employee_id,e.employee_name,
  COALESCE(NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked,false) AS user_eligible,
  a.version,a.updated_at,a.updated_by,a.organization_context
  FROM crm.sales_team_manager_assignments a LEFT JOIN crm.employees e ON e.employee_id=a.employee_id`;
const timestamp = (value: Date | string) => value instanceof Date ? value : new Date(value);
function expose(row: AssignmentRow): SalesTeamManagerAssignment {
  const { organization_context: _context, ...assignment } = row;
  return { ...assignment, updated_at: timestamp(row.updated_at) };
}
async function assignmentRows(client: PoolClient) {
  return (await client.query<AssignmentRow>(`${assignmentSql} ORDER BY a.catalog,a.organization_code`)).rows;
}
export async function salesTeamManagerAssignments(client: PoolClient) {
  return (await assignmentRows(client)).map(expose);
}

export async function salesManagerMappingSnapshot() {
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY");
    const organizations = await salesMappingOrganizations(client);
    const assignments = await assignmentRows(client);
    for (const row of assignments) {
      if (!organizations.some(org => org.catalog === row.catalog && org.code === row.organization_code))
        organizations.push(orphanedMappingOrganization(row.organization_context));
    }
    const users = (await client.query(`SELECT e.employee_id,e.employee_name,e.username,
      ARRAY(SELECT m.level FROM crm.sales_manager_enrollments m
        WHERE m.employee_id=e.employee_id AND NOT m.is_active ORDER BY m.level) AS inactive_manager_categories
      FROM crm.employees e WHERE NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked
      ORDER BY e.employee_name,e.employee_id`)).rows;
    return { organizations, users, assignments: assignments.map(expose) };
  });
}

/** Prevent ordinary catalog retirement/override from silently invalidating assigned teams. */
export async function validateSalesManagerMappingHierarchy(client: PoolClient) {
  const assigned = (await client.query(`SELECT catalog,organization_code FROM crm.sales_team_manager_assignments
    WHERE employee_id IS NOT NULL`)).rows;
  if (!assigned.length) return;
  const organizations = await salesMappingOrganizations(client);
  for (const row of assigned) {
    if (!organizations.some(org => org.catalog === row.catalog && org.code === row.organization_code && org.eligible))
      throw new SalesSetupError(400, "This change would invalidate a manager's assigned team hierarchy. Reassign or unassign the affected manager in Manager Mapping first.");
  }
}

type Transfer = { id: string; from_code: string; to_code: string; from_name: string; to_name: string };
async function appendMappingEvent(client: PoolClient, before: AssignmentRow | undefined,
  after: AssignmentRow, note: string, actor: string, transfer?: Transfer) {
  await client.query(`INSERT INTO crm.sales_team_manager_events
    (assignment_id,action,before_data,after_data,note,actor) VALUES($1,$2,$3::jsonb,$4::jsonb,$5,$6)`,
  [after.id, after.employee_id === null ? "UNASSIGNED" : before?.employee_id != null ? "REASSIGNED" : "ASSIGNED",
    before ? JSON.stringify({ ...expose(before), organization_context: before.organization_context }) : null,
    JSON.stringify({ ...expose(after), organization_context: after.organization_context, ...(transfer ? { transfer } : {}) }), note, actor]);
}

export async function saveSalesManagerMapping(input: SalesManagerMappingInput, actor: string) {
  return salesSetupTransaction(async client => {
    const before = (await client.query<AssignmentRow>(`${assignmentSql}
      WHERE a.catalog=$1 AND a.organization_code=$2 FOR UPDATE OF a`,
    [input.catalog, input.organization_code])).rows[0];
    if ((before?.version ?? 0) !== input.expected_version)
      throw new SalesSetupError(409, "The manager assignment changed. Refresh and review the latest assignment before confirming.");
    const organizations = await salesMappingOrganizations(client);
    const organization = organizations.find(org => org.catalog === input.catalog && org.code === input.organization_code);
    const note = input.note?.trim() ?? "";
    let source: AssignmentRow | undefined;
    let sourceContext: SalesMappingOrganization | undefined;
    if (input.move_from) {
      if (input.employee_id === null)
        throw new SalesSetupError(400, "Select the existing manager to move; a move cannot unassign both teams.");
      if (input.move_from.organization_code === input.organization_code)
        throw new SalesSetupError(400, "Choose a different destination team at the same manager level.");
      if (note.length < 3) throw new SalesSetupError(400, "Enter a reason of at least 3 characters for moving a manager.");
      source = (await client.query<AssignmentRow>(`${assignmentSql}
        WHERE a.catalog=$1 AND a.organization_code=$2 FOR UPDATE OF a`,
      [input.catalog, input.move_from.organization_code])).rows[0];
      if (!source || source.version !== input.move_from.expected_version || source.employee_id !== input.employee_id)
        throw new SalesSetupError(409, "The source team's manager assignment changed. Choose the source assignment again before moving its manager.");
      sourceContext = organizations.find(org => org.catalog === input.catalog && org.code === input.move_from!.organization_code)
        ?? orphanedMappingOrganization(source.organization_context);
      if (sourceContext.hierarchy_version !== input.move_from.hierarchy_version)
        throw new SalesSetupError(409, "The source team's hierarchy changed. Choose its assignment again before confirming the move.");
    }
    if (input.employee_id !== null) {
      if (!organization) throw new SalesSetupError(404, "This organization is unavailable or ambiguous. Refresh the organizational list.");
      if (!organization.eligible) throw new SalesSetupError(400, organization.issues.join(" "));
      if (organization.hierarchy_version !== input.hierarchy_version)
        throw new SalesSetupError(409, "The team's hierarchy changed. Refresh and review the region, branch and unit before confirming.");
      const manager = await client.query(`SELECT employee_id FROM crm.employees WHERE employee_id=$1
        AND NOT is_deleted AND activated AND approved AND NOT employee_locked FOR SHARE`, [input.employee_id]);
      if (!manager.rowCount) throw new SalesSetupError(400, "Select an active, approved and unlocked MIS user as manager.");
      const inactiveCategory = await client.query(`SELECT 1 FROM crm.sales_manager_enrollments
        WHERE employee_id=$1 AND level=$2 AND NOT is_active LIMIT 1`, [input.employee_id, organization.level]);
      if (inactiveCategory.rowCount)
        throw new SalesSetupError(400, "This manager category is inactive. Reactivate the designation in Manager Enrollment before assigning a team.");
    } else if (!before?.employee_id) {
      throw new SalesSetupError(400, "This team has no current manager to unassign.");
    }
    if (before?.employee_id === input.employee_id && !source) return expose(before);
    if (before?.employee_id != null && note.length < 3)
      throw new SalesSetupError(400, "Enter a reason of at least 3 characters when replacing or unassigning a manager.");
    const context = organization ?? before!.organization_context;
    const transfer = source ? {
      id: randomUUID(), from_code: source.organization_code, to_code: input.organization_code,
      from_name: sourceContext!.name, to_name: context.name,
    } : undefined;
    if (source) {
      const removed = await client.query(`UPDATE crm.sales_team_manager_assignments SET employee_id=NULL,
        organization_context=$2::jsonb,version=version+1,updated_at=now(),updated_by=$3
        WHERE id=$1 AND version=$4 AND employee_id=$5 RETURNING id`,
      [source.id, JSON.stringify(sourceContext), actor, input.move_from!.expected_version, input.employee_id]);
      if (!removed.rowCount) throw new SalesSetupError(409, "The source assignment changed. Choose it again before moving the manager.");
      const afterSource = (await client.query<AssignmentRow>(`${assignmentSql} WHERE a.id=$1`, [source.id])).rows[0];
      await appendMappingEvent(client, source, afterSource, note, actor, transfer);
    }
    const saved = before
      ? await client.query(`UPDATE crm.sales_team_manager_assignments SET employee_id=$2,
          organization_context=$3::jsonb,version=version+1,updated_at=now(),updated_by=$4
          WHERE id=$1 AND version=$5 RETURNING id`,
        [before.id, input.employee_id, JSON.stringify(context), actor, input.expected_version])
      : await client.query(`INSERT INTO crm.sales_team_manager_assignments
          (catalog,organization_code,employee_id,organization_context,updated_by)
          VALUES($1,$2,$3,$4::jsonb,$5) RETURNING id`,
        [input.catalog, input.organization_code, input.employee_id, JSON.stringify(context), actor]);
    if (!saved.rowCount) throw new SalesSetupError(409, "This assignment changed. Refresh and review it before saving.");
    const after = (await client.query<AssignmentRow>(`${assignmentSql} WHERE a.id=$1`, [saved.rows[0].id])).rows[0];
    await appendMappingEvent(client, before, after, note, actor, transfer);
    return expose(after);
  });
}

export async function salesManagerMappingHistory(catalog: SalesMappingCatalog, code: string): Promise<SalesManagerMappingEvent[]> {
  return withTransaction(async client => {
    const { rows } = await client.query(`SELECT ev.id,ev.action,
      ev.before_data->>'employee_name' AS before_manager_name,ev.after_data->>'employee_name' AS after_manager_name,
      ev.after_data->'organization_context'->>'name' AS organization_name,
      ev.after_data->'organization_context'->>'region_name' AS region_name,
      ev.after_data->'organization_context'->>'branch_name' AS branch_name,ev.note,ev.actor,ev.created_at
      ,ev.after_data->'transfer'->>'from_name' AS transfer_from_name,
      ev.after_data->'transfer'->>'to_name' AS transfer_to_name
      FROM crm.sales_team_manager_events ev JOIN crm.sales_team_manager_assignments a ON a.id=ev.assignment_id
      WHERE a.catalog=$1 AND a.organization_code=$2 ORDER BY ev.id DESC`, [catalog, code]);
    return rows.map(row => ({ ...row, created_at: timestamp(row.created_at) })) as SalesManagerMappingEvent[];
  });
}
