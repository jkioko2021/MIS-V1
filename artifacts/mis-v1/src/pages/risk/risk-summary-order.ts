import type { RiskOptionsResponseData, RiskRecord } from '@workspace/api-client-react';

type MatrixFactors = Pick<RiskOptionsResponseData, 'impact_factors' | 'likelihood_factors'>;
export type RiskRanking = 'Critical' | 'High' | 'Medium' | 'Low';
export type RankedRiskRecord = RiskRecord & { risk_score: number | null; risk_ranking: RiskRanking | null };

function ordinal(value: number | null | undefined): number | null {
  return value != null && Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

export function rankingForScore(score: number): RiskRanking | null {
  if (!Number.isInteger(score) || score < 1 || score > 25) return null;
  return score >= 15 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';
}

export function orderRiskSummary(records: RiskRecord[], _factors?: MatrixFactors): RankedRiskRecord[] {
  return records.map(record => {
    const impact = ordinal(record.ranking_snapshot?.impact?.ordinal);
    const likelihood = ordinal(record.ranking_snapshot?.likelihood?.ordinal);
    const risk_score = impact != null && likelihood != null ? impact * likelihood : null;
    return { ...record, risk_score, risk_ranking: risk_score == null ? null : rankingForScore(risk_score) };
  }).sort((left, right) => {
    const leftScore = left.risk_score ?? Number.NEGATIVE_INFINITY;
    const rightScore = right.risk_score ?? Number.NEGATIVE_INFINITY;
    if (leftScore !== rightScore) return leftScore > rightScore ? -1 : 1;
    return left.risk_code.localeCompare(right.risk_code, 'en', { numeric: true });
  });
}
