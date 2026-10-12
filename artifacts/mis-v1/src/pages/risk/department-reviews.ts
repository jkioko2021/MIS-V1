import type { RiskDepartmentSummary } from '@workspace/api-client-react';

/** A department review card represents one period, never a mixture of workflows. */
export function latestDepartmentReviews(rows: RiskDepartmentSummary[]): RiskDepartmentSummary[] {
  const latest = new Map<string, RiskDepartmentSummary>();
  for (const row of rows) {
    const previous = latest.get(row.depart_code);
    const date = String(row.period_from ?? '');
    const previousDate = String(previous?.period_from ?? '');
    if (!previous || date > previousDate ||
      (date === previousDate && Number(row.period_id) > Number(previous.period_id))) {
      latest.set(row.depart_code, row);
    }
  }
  return [...latest.values()].sort((a, b) => a.depart_code.localeCompare(b.depart_code));
}
