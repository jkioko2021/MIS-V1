import { z } from "zod";
import type { PoolClient } from "pg";
import type { SalesCatalogEntry, SalesCatalogInput, SalesCatalogUpdate } from "@workspace/api-zod";
import { withTransaction } from "./postgres";
import { SalesSetupError, salesSetupTransaction } from "./sales-structure";
import { salesCatalogDefinitions, type CatalogDefinition } from "./sales-catalog-definitions";
import { organizationLookups, organizationLookupKey } from "./sales-organization-lookups";

const projection = `id,catalog,code,name,employee_id,is_active,version,data AS "values"`;
const fail = (message: string): never => { throw new SalesSetupError(400, message); };
export function catalogDefinition(key: string) {
  const definition = salesCatalogDefinitions.find(d => d.key === key);
  if (!definition) throw new SalesSetupError(404, "Sales enrollment catalog not found.");
  return definition;
}
function expose(row: SalesCatalogEntry): SalesCatalogEntry {
  const def = catalogDefinition(row.catalog);
  return {
    ...row, values: {
      ...row.values,
      ...(def.fields.some(f => f.key === "ID") ? { ID: String(row.id) } : {}),
    },
  };
}
export async function salesCatalogSnapshot() {
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const entries = await client.query<SalesCatalogEntry>(`SELECT ${projection} FROM crm.sales_catalog_entries ORDER BY catalog,name,id`);
    const sources = await client.query<SalesCatalogEntry>(`SELECT -id AS id,catalog,code,name,
      NULL::integer AS employee_id,COALESCE(NULLIF(data->>'ACTIVE',''),'1')='1' AS is_active,
      1 AS version,data AS "values",true AS source_reference,source_file,issues AS source_issues
      FROM crm.sales_catalog_source_records ORDER BY catalog,name,id`);
    const users = await client.query(`SELECT employee_id,employee_name,username FROM crm.employees
      WHERE NOT is_deleted AND activated AND approved AND NOT employee_locked ORDER BY employee_name,employee_id`);
    const nationals = await client.query(`SELECT id,code,name,level,parent_id,manager_id,is_active,version
      FROM crm.sales_structure_nodes WHERE level='NATIONAL' ORDER BY name,id`);
    const managers = await client.query(`SELECT m.id,m.employee_id,m.level,m.is_active,m.version,e.employee_name,e.username,
      (NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked) AS user_eligible
      FROM crm.sales_manager_enrollments m JOIN crm.employees e ON e.employee_id=m.employee_id
      WHERE m.level='BRANCH' ORDER BY e.employee_name,m.id`);
    const lookups = organizationLookups(entries.rows, sources.rows);
    return { definitions: salesCatalogDefinitions, entries: [...entries.rows.map(expose), ...sources.rows.map(row => ({
      ...row, organization_choice: lookups.get(organizationLookupKey(row)) === row,
    }))],
      users: users.rows, nationals: nationals.rows, branch_managers: managers.rows };
  });
}

function normalize(def: CatalogDefinition, input: SalesCatalogInput, actor: string, before?: SalesCatalogEntry) {
  const known = new Set(def.fields.map(f => f.key));
  for (const key of Object.keys(input.values)) {
    if (!known.has(key)) fail(`Unknown field ${key} for ${def.title}.`);
    if (def.fields.find(f => f.key === key)?.read_only) fail(`${key} is maintained by MIS and cannot be submitted.`);
  }
  const values: Record<string, string | null> = {};
  for (const field of def.fields) {
    if (field.read_only) continue;
    const value = input.values[field.key]?.trim() || null;
    if (field.required && !value) fail(`${field.label} is required.`);
    if (value) {
      if (value.length > field.max_length) fail(`${field.label} must not exceed ${field.max_length} characters.`);
      if (field.type === "flag" && !["0", "1"].includes(value)) fail(`${field.label} must be 0 or 1.`);
      if (field.type === "email" && !z.string().email().safeParse(value).success) fail("Enter a valid email address.");
      if (field.type === "date") {
        const date = new Date(`${value}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
          fail(`${field.label} must be a valid YYYY-MM-DD date.`);
      }
      if (field.type === "integer" && !/^\d{1,4}$/.test(value)) fail(`${field.label} must be a whole year.`);
      if (field.type === "decimal") {
        const valid = field.key === "RETAINER_AMT" ? /^\d{1,18}$/.test(value)
          : /^\d{1,15}(?:\.\d{1,3})?$/.test(value);
        if (!valid) fail(field.key === "RETAINER_AMT" ? "Retainer Amount must be a nonnegative whole amount (maximum 18 digits)."
          : `${field.label} must be nonnegative with at most 3 decimal places.`);
      }
    }
    values[field.key] = value;
  }
  if (def.fields.some(f => f.key === "ACTIVE")) values.ACTIVE = input.is_active ? "1" : "0";
  if (def.fields.some(f => f.key === "APPROVED_BY")) {
    values.APPROVED_BY = values.APPROVED === "1"
      ? before?.values.APPROVED === "1" ? before.values.APPROVED_BY : actor : null;
  }
  const code = values[def.code_field]!;
  if (!/^[A-Za-z0-9_-]+$/.test(code)) fail("Use letters, digits, underscores or hyphens in the enrollment code.");
  if (before && (code !== before.code || input.employee_id !== before.employee_id))
    fail("The enrollment code and MIS user cannot change. Edit the existing enrollment details instead.");
  if (values.VALID_FROM && values.VALID_TO && values.VALID_FROM > values.VALID_TO)
    fail("Valid To must be on or after Valid From.");
  if (values.JOIN_DATE && values.RET_EFF_UPTO && values.JOIN_DATE > values.RET_EFF_UPTO)
    fail("Retainer Effective Until must be on or after Join Date.");
  return { code, name: values[def.name_field]!, values };
}

async function validateLinks(client: PoolClient, entries: SalesCatalogEntry[]) {
  const sources = (await client.query<SalesCatalogEntry>(`SELECT -id AS id,catalog,code,name,
    NULL::integer AS employee_id,COALESCE(NULLIF(data->>'ACTIVE',''),'1')='1' AS is_active,
    1 AS version,data AS "values",true AS source_reference
    FROM crm.sales_catalog_source_records
    WHERE catalog IN ('sales-units','sales-branches','sales-regions','gi-units','gi-branches')`)).rows;
  const lookups = organizationLookups(entries, sources);
  const nationals = (await client.query("SELECT code,is_active FROM crm.sales_structure_nodes WHERE level='NATIONAL'")).rows;
  const branches = (await client.query(`SELECT m.id,m.is_active,
    (NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked) AS eligible
    FROM crm.sales_manager_enrollments m JOIN crm.employees e ON e.employee_id=m.employee_id WHERE m.level='BRANCH'`)).rows;
  const find = (catalog: string, code: string | null | undefined) =>
    code ? lookups.get(`${catalog}:${code}`) : undefined;
  for (const entry of entries) {
    const def = catalogDefinition(entry.catalog);
    for (const field of def.fields.filter(f => f.reference)) {
      const value = entry.values[field.key];
      if (!value) continue;
      const target = field.reference === "nationals" ? nationals.find(n => n.code === value)
        : field.reference === "branch-managers" ? branches.find(b => String(b.id) === value)
        : find(field.reference!, value);
      if (!target || (entry.is_active && (!target.is_active || ("eligible" in target && !target.eligible))))
        fail(`${entry.name}: select an existing${entry.is_active ? " active" : ""} ${field.label}. It may still be used by another active enrollment.`);
    }
    const v = entry.values;
    if (entry.catalog === "sales-units") {
      const branch = find("sales-branches", v.BRANCH_CODE);
      if (branch && branch.values.REGION_CODE !== v.REGION_CODE)
        fail(`${entry.name}: the selected branch does not belong to the selected region.`);
      if (v.NSM_CODE && branch?.values.NSM_CODE && v.NSM_CODE !== branch.values.NSM_CODE)
        fail(`${entry.name}: National Sales Code must match the branch.`);
    }
    if (entry.catalog === "gi-units") {
      const giBranch = find("gi-branches", v.REGION_CODE);
      if (giBranch && giBranch.values.BR_CODE !== v.BRANCH_CODE)
        fail(`${entry.name}: the selected GI branch does not map to the selected Sales Branch.`);
      const manager = find("gi-unit-managers", v.CORD_MGR_ID);
      if (manager?.values.GI_UNIT_CODE && manager.values.GI_UNIT_CODE !== entry.code)
        fail(`${entry.name}: the selected GI Unit Manager is enrolled for a different GI unit.`);
    }
    if (entry.catalog === "sales-branches") {
      const region = find("sales-regions", v.REGION_CODE);
      if (v.NSM_CODE && region?.values.NSM_CODE && v.NSM_CODE !== region.values.NSM_CODE)
        fail(`${entry.name}: National Sales Code must match the region.`);
    }
    if (entry.catalog === "sales-units" && v.UNIT_MGR_ID) {
      const manager = find("unit-managers", v.UNIT_MGR_ID);
      if (manager?.values.UNIT_CODE && manager.values.UNIT_CODE !== entry.code)
        fail(`${entry.name}: the selected Unit Manager is enrolled for a different unit.`);
    }
    if (entry.catalog === "sales-regions" && v.REGION_MGR_ID) {
      const manager = find("regional-managers", v.REGION_MGR_ID);
      if (manager?.values.R_CODE && manager.values.R_CODE !== entry.code)
        fail(`${entry.name}: the selected Regional Manager is enrolled for a different region.`);
    }
  }
}

export async function saveSalesCatalogEntry(key: string, input: SalesCatalogInput | SalesCatalogUpdate,
  actor: string, id?: number) {
  const def = catalogDefinition(key);
  return salesSetupTransaction(async client => {
    const entries = (await client.query<SalesCatalogEntry>(`SELECT ${projection} FROM crm.sales_catalog_entries ORDER BY id FOR UPDATE`)).rows;
    const before = id ? entries.find(e => e.id === id && e.catalog === key) : undefined;
    if (id && !before) throw new SalesSetupError(404, "Enrollment record not found.");
    if (before && before.version !== ("version" in input ? input.version : undefined))
      throw new SalesSetupError(409, "This enrollment changed. Refresh and reopen it before saving.");
    if (def.manager) {
      if (!input.employee_id) fail("Select an existing MIS user to enroll as this manager.");
      // Inactive history may retain an account that is no longer eligible.
      if (input.is_active || !before) {
        const eligible = await client.query(`SELECT employee_id FROM crm.employees WHERE employee_id=$1
          AND NOT is_deleted AND activated AND approved AND NOT employee_locked FOR SHARE`, [input.employee_id]);
        if (!eligible.rowCount) fail("Select an active, approved and unlocked MIS user.");
      }
    } else if (input.employee_id !== null) fail("Only manager enrollments can be linked to a MIS user.");
    const normalized = normalize(def, input, actor, before);
    const proposed: SalesCatalogEntry = {
      id: id ?? -1, catalog: key, ...normalized,
      employee_id: input.employee_id, is_active: input.is_active, version: (before?.version ?? 0) + 1,
    };
    await validateLinks(client, [...entries.filter(e => e.id !== id), proposed]);
    // Alternate legacy identifiers must also be unique within their catalog.
    for (const field of ["RM_CODE", "GI_UM_CODE", "GI_CORD_CODE"]) {
      const value = normalized.values[field];
      if (value && entries.some(e => e.id !== id && e.catalog === key && e.values[field] === value))
        throw new SalesSetupError(409, `${field} already belongs to another enrollment.`);
    }
    const saved = id
      ? await client.query<SalesCatalogEntry>(`UPDATE crm.sales_catalog_entries SET name=$2,data=$3::jsonb,
          is_active=$4,version=version+1,updated_at=now(),updated_by=$5 WHERE id=$1 RETURNING ${projection}`,
        [id, normalized.name, JSON.stringify(normalized.values), input.is_active, actor])
      : await client.query<SalesCatalogEntry>(`INSERT INTO crm.sales_catalog_entries
          (catalog,code,name,employee_id,is_active,data,created_by,updated_by)
          VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$7) RETURNING ${projection}`,
        [key, normalized.code, normalized.name, input.employee_id, input.is_active, JSON.stringify(normalized.values), actor]);
    const after = expose(saved.rows[0]);
    await client.query(`INSERT INTO crm.sales_catalog_events(entry_id,action,before_data,after_data,actor)
      VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,
    [after.id, before ? "UPDATED" : "CREATED", before ? JSON.stringify(expose(before)) : null, JSON.stringify(after), actor]);
    return { id: after.id, version: after.version };
  });
}
