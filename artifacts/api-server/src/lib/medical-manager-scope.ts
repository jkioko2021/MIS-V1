/**
 * Medical presentation scope, not account deletion or a person's login role.
 * An imported GI-only designation must not masquerade as a Medical designation.
 * Explicit Medical enrollment, source provenance or team use establishes dual roles.
 * Aliases below are internal SQL identifiers, never request values.
 */
export function medicalManagerSql(alias: string) {
  return `(NOT EXISTS (SELECT 1 FROM crm.sales_manager_enrollment_sources gi_source
      WHERE gi_source.enrollment_id=${alias}.id AND gi_source.source_domain='GI')
    OR EXISTS (SELECT 1 FROM crm.sales_manager_enrollment_sources medical_source
      WHERE medical_source.enrollment_id=${alias}.id AND medical_source.source_domain='MEDICAL')
    OR EXISTS (SELECT 1 FROM crm.sales_structure_nodes medical_node WHERE medical_node.manager_id=${alias}.id)
    OR EXISTS (SELECT 1 FROM crm.sales_team_manager_assignments medical_team
      WHERE medical_team.employee_id=${alias}.employee_id AND ${alias}.level=
        CASE medical_team.catalog WHEN 'sales-units' THEN 'UNIT'
          WHEN 'sales-branches' THEN 'BRANCH' WHEN 'sales-regions' THEN 'REGION' END))`;
}

export function medicalUserSql(alias: string) {
  return `((NOT EXISTS (SELECT 1 FROM crm.gi_manager_enrollments gi_manager
      WHERE gi_manager.employee_id=${alias}.employee_id)
    AND NOT EXISTS (SELECT 1 FROM crm.sales_manager_enrollments gi_legacy
      JOIN crm.sales_manager_enrollment_sources gi_origin ON gi_origin.enrollment_id=gi_legacy.id
      WHERE gi_legacy.employee_id=${alias}.employee_id AND gi_origin.source_domain='GI'))
    OR EXISTS (SELECT 1 FROM crm.sales_manager_enrollments medical_manager
      WHERE medical_manager.employee_id=${alias}.employee_id AND ${medicalManagerSql('medical_manager')})
    OR EXISTS (SELECT 1 FROM crm.sales_team_manager_assignments medical_assignment
      WHERE medical_assignment.employee_id=${alias}.employee_id
        AND medical_assignment.catalog IN ('sales-units','sales-branches','sales-regions')))`;
}
