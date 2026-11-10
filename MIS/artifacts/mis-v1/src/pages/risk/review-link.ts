export type ReviewLinkScope = { department: string; period: string };

export function parseReviewLink(search: string): ReviewLinkScope | 'invalid' | null {
  const params = new URLSearchParams(search);
  if (!params.has('depart_code') && !params.has('period_id')) return null;
  const department = params.get('depart_code') ?? '';
  const period = params.get('period_id') ?? '';
  if (params.getAll('depart_code').length !== 1 || params.getAll('period_id').length !== 1
    || !department.trim() || department.length > 50 || !/^[1-9]\d*$/.test(period)
    || !Number.isSafeInteger(Number(period)) || Number(period) > 2147483647) return 'invalid';
  return { department, period };
}

export function reviewScopeError(scope: ReviewLinkScope | 'invalid' | null,
  departments: Array<{ depart_code?: string }>, periods: Array<{ period_id?: number }>): string {
  if (scope === 'invalid') return 'This register link is invalid. Open Risk Register Review from the menu or contact the sender.';
  if (!scope) return '';
  if (!departments.some(item => item.depart_code === scope.department))
    return 'This department is no longer available to you for review. Contact your MIS administrator if you need access.';
  if (!periods.some(item => String(item.period_id) === scope.period))
    return 'The reporting period in this link is no longer available. Open Risk Register Review from the menu.';
  return '';
}

export function reviewAvailability(status?: string): string {
  if (!status || status === 'SUBMITTED') return '';
  return `This register is currently ${status.toLowerCase().replace(/_/g, ' ')} and is no longer awaiting review. This email does not change its current status.`;
}
