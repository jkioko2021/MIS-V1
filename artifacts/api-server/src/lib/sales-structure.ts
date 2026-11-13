import type { PoolClient } from "pg";
import { withTransaction } from "./postgres";

export type SalesLevel = "NATIONAL" | "REGION" | "BRANCH" | "UNIT";
type NodeValues = {
  name: string; parent_id: number | null; manager_id: number | null; is_active: boolean;
};
type NodeRow = NodeValues & { id: number; code: string; level: SalesLevel; version: number };
type EnrollmentRow = { id: number; employee_id: number; level: SalesLevel; is_active: boolean; version: number };
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
async function validateNode(client: PoolClient, input: NodeValues, level: SalesLevel, before?: NodeRow) {
  if (!input.name.trim()) fail("A name is required.");
  const expected = parentLevel[level];
  if (expected === null) {
    if (input.parent_id !== null) fail("A national structure cannot have a parent.");
  } else {
    const { rows } = await client.query<NodeRow>("SELECT * FROM crm.sales_structure_nodes WHERE id=$1 FOR UPDATE", [input.parent_id]);
    const parent = rows[0];
    if (!parent || parent.level !== expected) fail(`Select a ${expected.toLowerCase()} parent for this category.`);
    if (input.is_active && !parent.is_active) fail("An active category requires an active parent.");
  }
  if (before && !input.is_active) {
    const { rowCount } = await client.query("SELECT 1 FROM crm.sales_structure_nodes WHERE parent_id=$1 AND is_active LIMIT 1", [before.id]);
    if (rowCount) fail("Deactivate or move active child categories before deactivating this category.");
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
    }
  }
}
export async function createSalesNode(input: NodeValues & { code: string; level: SalesLevel }, actor: string) {
  return salesSetupTransaction(async client => {
    await validateNode(client, input, input.level);
    const { rows } = await client.query<NodeRow>(
      `INSERT INTO crm.sales_structure_nodes(code,name,level,parent_id,manager_id,is_active,created_by,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`,
      [input.code.toUpperCase(), input.name.trim(), input.level, input.parent_id, input.manager_id, input.is_active, actor]);
    await audit(client, "NODE", rows[0].id, null, rows[0], actor);
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
    const result = await client.query<NodeRow>(`UPDATE crm.sales_structure_nodes SET
      name=$2,parent_id=$3,manager_id=$4,is_active=$5,version=version+1,updated_at=now(),updated_by=$6
      WHERE id=$1 RETURNING *`, [id, input.name.trim(), input.parent_id, input.manager_id, input.is_active, actor]);
    await audit(client, "NODE", id, before, result.rows[0], actor);
    return { id, version: result.rows[0].version };
  });
}
export async function enrollSalesManager(input: { employee_id: number; level: SalesLevel }, actor: string) {
  return salesSetupTransaction(async client => {
    await eligibleUser(client, input.employee_id);
    const { rows } = await client.query<EnrollmentRow>(`INSERT INTO crm.sales_manager_enrollments
      (employee_id,level,created_by,updated_by) VALUES($1,$2,$3,$3) RETURNING *`,
    [input.employee_id, input.level, actor]);
    await audit(client, "MANAGER", rows[0].id, null, rows[0], actor);
    return { id: rows[0].id, version: rows[0].version };
  });
}
export async function updateSalesManager(id: number, input: { is_active: boolean; version: number }, actor: string) {
  return salesSetupTransaction(async client => {
    const { rows } = await client.query<EnrollmentRow>("SELECT * FROM crm.sales_manager_enrollments WHERE id=$1 FOR UPDATE", [id]);
    const before = rows[0];
    if (!before) throw new SalesSetupError(404, "Manager enrollment not found.");
    if (before.version !== input.version) throw new SalesSetupError(409, "This enrollment changed. Refresh before trying again.");
    if (input.is_active) await eligibleUser(client, before.employee_id);
    else {
      const { rowCount } = await client.query(
        "SELECT 1 FROM crm.sales_structure_nodes WHERE manager_id=$1 AND is_active LIMIT 1", [id]);
      if (rowCount) fail("Reassign or unassign this manager from active sales categories before deactivating the enrollment.");
    }
    const result = await client.query<EnrollmentRow>(`UPDATE crm.sales_manager_enrollments
      SET is_active=$2,version=version+1,updated_at=now(),updated_by=$3 WHERE id=$1 RETURNING *`,
    [id, input.is_active, actor]);
    await audit(client, "MANAGER", id, before, result.rows[0], actor);
    return { id, version: result.rows[0].version };
  });
}
