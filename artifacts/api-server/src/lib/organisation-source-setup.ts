import type { PoolClient } from "pg";

// Pending links are account references, never operational manager designations.
// Recheck provenance and current account eligibility on every admin snapshot.
export async function pendingSourceSetups(client: PoolClient) {
  const { rows } = await client.query(`SELECT ss.*,s.catalog,
    ss.source_row_sha256=s.row_sha256 AS source_current,e.employee_name,
    coalesce(NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked
      AND lower(btrim(e.department))='sales' AND p.is_active
      AND lower(btrim(p.profile_name))='sales manager',false)
    AND NOT EXISTS (
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
    ) AS manager_current
    FROM crm.organisation_source_setup ss
    JOIN crm.sales_catalog_source_records s ON s.id=ss.source_reference_id
    LEFT JOIN crm.employees e ON e.employee_id=ss.manager_employee_id
    LEFT JOIN crm.profiles p ON p.profile_id=e.profile_id`);
  return new Map(rows.map(row => {
    const branchApproved = row.source_current && row.catalog === "sales-branches" && row.branch_approved;
    const matched = row.source_current && row.manager_current && row.manager_link_status === "MATCHED"
      && row.catalog !== "sales-branches";
    return [row.source_reference_id, {
      linked_manager_employee_id: matched ? row.manager_employee_id : null,
      linked_manager_name: matched ? row.employee_name : null,
      manager_link_status: branchApproved ? "NOT_REQUIRED" : matched ? "MATCHED" : "UNRESOLVED",
      branch_approved: Boolean(branchApproved),
      setup_note: !row.source_current || (row.manager_link_status === "MATCHED" && !matched)
        ? "Source data or the linked manager account changed. Review this setup link again."
        : row.resolution_note,
    }];
  }));
}
