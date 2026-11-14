import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { SalesCatalogEntry, SalesMappingCatalog, SalesMappingOrganization } from "@workspace/api-zod";
import { organizationLookups } from "./sales-organization-lookups";

export const mappingManagerFields: Record<string, string> = {
  "sales-regions": "REGION_MGR_ID", "sales-branches": "BRANCH_MGR_ID", "sales-units": "UNIT_MGR_ID",
};
const levels = { "sales-regions": "REGION", "sales-branches": "BRANCH", "sales-units": "UNIT" } as const;
const codeValue = (value: string | null | undefined) =>
  !value?.trim() || value.trim().toUpperCase() === "NULL" ? null : value.trim();
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export async function salesMappingOrganizations(client: PoolClient): Promise<SalesMappingOrganization[]> {
  const live = (await client.query<SalesCatalogEntry>(`SELECT id,catalog,code,name,employee_id,
    is_active,version,data AS "values" FROM crm.sales_catalog_entries`)).rows;
  const sources = (await client.query<SalesCatalogEntry>(`SELECT -id AS id,catalog,code,name,
    NULL::integer AS employee_id,COALESCE(NULLIF(data->>'ACTIVE',''),'1')='1' AS is_active,
    1 AS version,data AS "values",true AS source_reference
    FROM crm.sales_catalog_source_records WHERE catalog IN ('sales-regions','sales-branches','sales-units')`)).rows;
  const lookup = organizationLookups(live, sources);
  const find = (catalog: string, code: string | null) => code ? lookup.get(`${catalog}:${code}`) : undefined;
  const result: SalesMappingOrganization[] = [];
  for (const row of lookup.values()) {
    if (!(row.catalog in levels)) continue;
    const catalog = row.catalog as SalesMappingCatalog;
    const level = levels[catalog];
    const branchCode = level === "UNIT" ? codeValue(row.values.BRANCH_CODE) : level === "BRANCH" ? row.code : null;
    const regionCode = level === "REGION" ? row.code : codeValue(row.values.REGION_CODE);
    const branch = branchCode ? find("sales-branches", branchCode) : undefined;
    const region = find("sales-regions", regionCode);
    const issues: string[] = [];
    if (!row.is_active) issues.push("This organizational record is inactive.");
    if (!region) issues.push("The region is missing or ambiguous. Resolve its organizational reference before assigning a manager.");
    else if (!region.is_active) issues.push("The parent region is inactive.");
    if (level === "UNIT") {
      if (!branch) issues.push("The branch is missing or ambiguous. Resolve its organizational reference before assigning a manager.");
      else {
        if (!branch.is_active) issues.push("The parent branch is inactive.");
        if (codeValue(branch.values.REGION_CODE) !== regionCode)
          issues.push("The unit's recorded region differs from its branch's region. Resolve this hierarchy mismatch before assigning a manager.");
      }
    }
    result.push({
      catalog, code: row.code, name: row.name, level,
      region_code: regionCode, region_name: region?.name ?? null,
      branch_code: branchCode, branch_name: branch?.name ?? null,
      is_active: row.is_active, eligible: issues.length === 0, issues,
      hierarchy_version: hash([row, branch ?? null, region ?? null]),
      source_reference: !!row.source_reference,
    });
  }
  return result.sort((a, b) => a.level.localeCompare(b.level) || a.name.localeCompare(b.name) || a.code.localeCompare(b.code));
}

export function orphanedMappingOrganization(context: SalesMappingOrganization): SalesMappingOrganization {
  return { ...context, eligible: false, is_active: false,
    issues: ["This team's current organizational record is unavailable or ambiguous. You can still view history or remove its manager assignment."],
    hierarchy_version: hash(context) };
}
