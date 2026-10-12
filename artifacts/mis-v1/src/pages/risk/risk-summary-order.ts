import type { RiskRecord } from '@workspace/api-client-react';

function savedResidual(record: RiskRecord): number {
  const value = record.r_risk_exposure;
  const score = value == null || !value.trim() ? Number.NaN : Number(value);
  return Number.isFinite(score) ? score : Number.NEGATIVE_INFINITY;
}

export type RankedRiskRecord = RiskRecord & { risk_ranking: number | null };

export function orderRiskSummary(records: RiskRecord[]): RankedRiskRecord[] {
  const ordered = [...records].sort((left, right) => {
    const leftScore = savedResidual(left);
    const rightScore = savedResidual(right);
    if (leftScore !== rightScore) return leftScore > rightScore ? -1 : 1;
    return left.risk_code.localeCompare(right.risk_code, 'en', { numeric: true });
  });
  let previousScore = Number.NEGATIVE_INFINITY;
  let ranking = 0;
  return ordered.map((record, index) => {
    const score = savedResidual(record);
    if (!Number.isFinite(score)) return { ...record, risk_ranking: null };
    // Equal exposures share a rank (1, 1, 3); risk codes only break display ties.
    if (index === 0 || score !== previousScore) ranking = index + 1;
    previousScore = score;
    return { ...record, risk_ranking: ranking };
  });
}
