/** Undefined means untouched; an empty string is a deliberate "All" choice. */
export function riskDepartmentSelection(
  page: string,
  choice: string | undefined,
  departments: readonly { depart_code?: string }[],
): string {
  // Imported assessments span departments and periods; retain the Update queue's all-scope default.
  if (choice === undefined) return page === 'dashboard' || page === 'update' || page === 'summary' ? '' : departments[0]?.depart_code ?? '';
  return choice && !departments.some(item => item.depart_code === choice) ? '' : choice;
}
