import type { RiskRecord } from '@workspace/api-client-react';

function savedResidual(record: RiskRecord): number {
  const value = record.r_risk_exposure;
  const score = value == null || !value.trim() ? Number.NaN : Number(value);
  return Number.isFinite(score) ? score : Number.NEGATIVE_INFINITY;
}

export function orderRiskSummary(records: RiskRecord[]): RiskRecord[] {
  return [...records].sort((left, right) => {
    const leftScore = savedResidual(left);
    const rightScore = savedResidual(right);
    if (leftScore !== rightScore) return leftScore > rightScore ? -1 : 1;
    return left.risk_code.localeCompare(right.risk_code, 'en', { numeric: true });
  });
}
