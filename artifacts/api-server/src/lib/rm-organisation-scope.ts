import type { PoolClient } from "pg";
import type { RmOrganisationChoice, RmOrganisationChoices } from "@workspace/api-zod";
import { DataImportError } from "./data-extract";

export type RmOrgFilter = { region_code?: string; branch_code?: string; unit_code?: string };
/** Current canonical assignments win; an unassigned agent can use its exact imported Unit reference. */
export const rmAgentUnitCodeSql = `(SELECT n.code FROM crm.sales_structure_nodes n
  WHERE n.id=a.organisation_unit_id AND n.level='UNIT')`;
export const rmEffectiveUnitCodeSql = `coalesce(${rmAgentUnitCodeSql},
  CASE WHEN a.organisation_unit_id IS NULL THEN nullif(btrim(a.source_data->'data'->>'UNIT_CODE'),'') END)`;

export async function rmOrganisationChoices(client: PoolClient): Promise<RmOrganisationChoices> {
  const nodes = (await client.query(`SELECT id,code,name,level,parent_id FROM crm.sales_structure_nodes
    WHERE level IN('NATIONAL','REGION','BRANCH','UNIT')`)).rows;
  const byId = new Map(nodes.map(n => [n.id,n]));
  const maps = { REGION: new Map<string,RmOrganisationChoice>(), BRANCH: new Map<string,RmOrganisationChoice>(),
    UNIT: new Map<string,RmOrganisationChoice>() };
  for (const level of ["REGION","BRANCH","UNIT"] as const) {
    for (const n of nodes.filter(n=>n.level===level)) {
      const parent = byId.get(n.parent_id);
      maps[level].set(n.code,{code:n.code,name:n.name,
        parent_code:level==="REGION" ? null : parent?.code ?? null,
        region_code:level==="REGION" ? n.code : level==="BRANCH" ? parent?.code ?? null
          : maps.BRANCH.get(parent?.code)?.region_code ?? null,reference_only:false});
    }
  }
  const sources = (await client.query(`SELECT code,name,catalog,data FROM crm.sales_catalog_source_records
    WHERE catalog IN('sales-regions','sales-branches','sales-units') ORDER BY id`)).rows;
  for (const [catalog,level] of [["sales-regions","REGION"],["sales-branches","BRANCH"],["sales-units","UNIT"]] as const) {
    for (const s of sources.filter(s=>s.catalog===catalog)) {
      const code = s.code.trim();
      if (maps[level].has(code)) continue;
      const parent = level==="REGION" ? null : String(s.data?.[level==="BRANCH"?"REGION_CODE":"BRANCH_CODE"] ?? "").trim() || null;
      maps[level].set(code,{code,name:s.name,parent_code:parent,
        region_code:level==="REGION" ? code : level==="BRANCH" ? parent : maps.BRANCH.get(parent ?? "")?.region_code ?? null,
        reference_only:true});
    }
  }
  const sorted = (items: Map<string,RmOrganisationChoice>) => [...items.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.code.localeCompare(b.code));
  return {regions:sorted(maps.REGION),branches:sorted(maps.BRANCH),units:sorted(maps.UNIT)};
}
export async function resolveRmOrgScope(client: PoolClient, filter: RmOrgFilter) {
  const region = filter.region_code?.trim(), branch = filter.branch_code?.trim(), unit = filter.unit_code?.trim();
  if (!region && !branch && !unit) return {unitCodes:null as string[] | null,label:null as string | null};
  const options = await rmOrganisationChoices(client);
  const r = options.regions.find(x=>x.code===region), b = options.branches.find(x=>x.code===branch), u = options.units.find(x=>x.code===unit);
  if ((region && !r) || (branch && !b) || (unit && !u))
    throw new DataImportError(400,"Select a recognized Medical Region, Branch or Unit.");
  if ((r && b && b.region_code!==r.code) || (b && u && u.parent_code!==b.code) || (r && u && u.region_code!==r.code))
    throw new DataImportError(400,"The selected Region, Branch and Unit do not belong to the same hierarchy.");
  return {unitCodes:options.units.filter(x=>(!region || x.region_code===region) && (!branch || x.parent_code===branch)
    && (!unit || x.code===unit)).map(x=>x.code),
    label:[r && `Region: ${r.name}`,b && `Branch: ${b.name}`,u && `Unit: ${u.name}`].filter(Boolean).join(" / ")};
}
