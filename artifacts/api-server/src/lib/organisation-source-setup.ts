import type { PoolClient } from "pg";
import type { JwtPayload } from "./auth-middleware";
import type { OrganisationSourceManagerInput } from "@workspace/api-zod";
import { SalesSetupError, salesSetupTransaction } from "./sales-structure";

export async function reassignSourceManager(id: number, input: OrganisationSourceManagerInput, user: JwtPayload) {
  return salesSetupTransaction(async client => {
    const profile=(await client.query("SELECT profile_name FROM crm.profiles WHERE profile_id=$1 AND is_active",[user.profileId])).rows[0];
    if (!profile || (![1,2].includes(user.profileId) && profile.profile_name.trim().toLowerCase()!=="national sales admin"))
      throw new SalesSetupError(403,"Only Sales Administrators and System Administrators can reassign managers.");
    if (!input.reason.trim()) throw new SalesSetupError(400,"Enter a reason for the reassignment.");
    const before=(await client.query(`SELECT ss.*,s.catalog,s.code,s.row_sha256
      FROM crm.organisation_source_setup ss JOIN crm.sales_catalog_source_records s ON s.id=ss.source_reference_id
      WHERE ss.source_reference_id=$1 FOR UPDATE OF ss FOR SHARE OF s`,[id])).rows[0];
    if (!before || !["sales-regions","sales-branches","sales-units"].includes(before.catalog))
      throw new SalesSetupError(404,"Pending hierarchy record not found.");
    if (before.version!==input.version || before.source_row_sha256!==before.row_sha256)
      throw new SalesSetupError(409,"This setup record changed. Refresh before reassigning its manager.");
    const adopted=await client.query("SELECT 1 FROM crm.sales_structure_nodes WHERE upper(code)=upper(btrim($1))",[before.code]);
    if (adopted.rowCount) throw new SalesSetupError(409,"This record is operational. Use Edit on its hierarchy entry to reassign the manager.");
    const branch=before.catalog==="sales-branches";
    if (input.employee_id===null && !branch) throw new SalesSetupError(400,"Select a manager for this Region or Unit.");
    if (input.employee_id!==null) {
      const staff=await client.query(`SELECT e.employee_id FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
        WHERE e.employee_id=$1 AND NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked
          AND lower(btrim(e.department))='sales' AND p.is_active AND lower(btrim(p.profile_name))='sales manager'
        FOR SHARE OF e,p`,[input.employee_id]);
      if (!staff.rowCount) throw new SalesSetupError(400,"Select an active, approved Sales Manager in the Sales department.");
    }
    const after=(await client.query(`UPDATE crm.organisation_source_setup SET manager_employee_id=$2,
      manager_selection='MANUAL',manager_sources='[]'::jsonb,manager_link_status=$3,branch_approved=$4,
      resolution_note='Manager explicitly selected during hierarchy setup; original source records preserved.',
      version=version+1,updated_at=now(),updated_by=$5 WHERE source_reference_id=$1 RETURNING *`,
    [id,input.employee_id,input.employee_id===null?"NOT_REQUIRED":"MATCHED",branch,user.username])).rows[0];
    await client.query(`INSERT INTO crm.organisation_source_setup_events(source_reference_id,before_data,after_data,actor)
      VALUES($1,$2::jsonb,$3::jsonb,$4)`,[id,JSON.stringify(before),
      JSON.stringify({...after,change_reason:input.reason.trim()}),user.username]);
    return {version:after.version};
  });
}

// Pending links are account references, never operational manager designations.
// Recheck provenance and current account eligibility on every admin snapshot.
export async function pendingSourceSetups(client: PoolClient) {
  const { rows } = await client.query(`SELECT ss.*,s.catalog,n.name AS national_name,n.code AS national_code,
    coalesce(n.level='NATIONAL' AND n.is_active
      AND ss.national_source_code=upper(btrim(s.data->>'NSM_CODE')),false) AS national_current,
    ss.source_row_sha256=s.row_sha256 AS source_current,e.employee_name,
    coalesce(NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked
      AND lower(btrim(e.department))='sales' AND p.is_active
      AND lower(btrim(p.profile_name))='sales manager',false)
    AND (ss.manager_selection='MANUAL' OR (NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(ss.manager_sources) proof
      LEFT JOIN crm.sales_catalog_source_records ms ON ms.id::text=proof->>'source_record_id'
      LEFT JOIN crm.sales_manager_user_sources us ON us.source_record_id=ms.id
      LEFT JOIN crm.sales_manager_user_identities identity ON identity.identity_key=us.identity_key
      WHERE ms.id IS NULL OR ms.row_sha256 IS DISTINCT FROM proof->>'row_sha256'
        OR us.source_row_sha256 IS DISTINCT FROM ms.row_sha256
        OR identity.employee_id IS DISTINCT FROM ss.manager_employee_id
    ) AND NOT EXISTS (
      SELECT 1 FROM crm.sales_catalog_source_records ms
      WHERE ms.catalog=CASE s.catalog WHEN 'sales-regions' THEN 'regional-managers' ELSE 'unit-managers' END
        AND upper(btrim(ms.code))=upper(btrim(s.data->>CASE s.catalog WHEN 'sales-regions' THEN 'REGION_MGR_ID' ELSE 'UNIT_MGR_ID' END))
        AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(ss.manager_sources) proof
          WHERE proof->>'source_record_id'=ms.id::text)
    ))) AS manager_current
    FROM crm.organisation_source_setup ss
    JOIN crm.sales_catalog_source_records s ON s.id=ss.source_reference_id
    LEFT JOIN crm.employees e ON e.employee_id=ss.manager_employee_id
    LEFT JOIN crm.sales_structure_nodes n ON n.id=ss.national_node_id
    LEFT JOIN crm.profiles p ON p.profile_id=e.profile_id`);
  return new Map(rows.map(row => {
    const branchApproved = row.source_current && row.catalog === "sales-branches" && row.branch_approved;
    const matched = row.source_current && row.manager_current && row.manager_link_status === "MATCHED";
    return [row.source_reference_id, {
      linked_national_node_id: row.source_current && row.national_current ? row.national_node_id : null,
      linked_national_name: row.source_current && row.national_current ? row.national_name : null,
      ...(row.source_current && row.national_current && row.catalog === "sales-regions"
        ? { parent_code: row.national_code } : {}),
      linked_manager_employee_id: matched ? row.manager_employee_id : null,
      linked_manager_name: matched ? row.employee_name : null,
      setup_version: row.version,
      manager_link_status: matched ? "MATCHED" : branchApproved && row.manager_employee_id === null ? "NOT_REQUIRED" : "UNRESOLVED",
      branch_approved: Boolean(branchApproved),
      setup_note: !row.source_current || (row.manager_link_status === "MATCHED" && !matched)
        ? "Source data or the linked manager account changed. Review this setup link again."
        : row.resolution_note,
    }];
  }));
}
