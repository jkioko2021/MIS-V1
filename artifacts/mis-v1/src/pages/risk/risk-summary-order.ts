import type { RiskOptionsResponseData, RiskRecord } from '@workspace/api-client-react';

const impactScale: Record<string, number> = {
  imp_01: 5, catastrophic: 5, imp_02: 4, major: 4, imp_03: 3, moderate: 3,
  imp_04: 2, minor: 2, imp_05: 1, insignificant: 1,
};
const likelihoodScale: Record<string, number> = {
  lik_01: 5, certain: 5, lik_02: 4, likely: 4, lik_03: 3, possible: 3,
  lik_04: 2, unlikely: 2, lik_05: 1, rare: 1,
};
type MatrixFactors = Pick<RiskOptionsResponseData, 'impact_factors' | 'likelihood_factors'>;
type Factor = { code: string; label: string; factor: number };
export type RiskRanking = 'Critical' | 'High' | 'Medium' | 'Low';
export type RankedRiskRecord = RiskRecord & { risk_score: number | null; risk_ranking: RiskRanking | null };

function ordinal(value: string | null | undefined, factors: Factor[], scale: Record<string, number>): number | null {
  if (value == null || !value.trim()) return null;
  const key = value.trim().toLowerCase();
  if (Object.hasOwn(scale, key)) return scale[key];
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  // Resolve saved calibrated values to approved identities; never treat raw
  // historical numbers as 1–5 positions or silently choose ambiguous factors.
  const matches = factors.filter(item => Number(item.factor) === numeric);
  const ratings = new Set(matches.map(item => {
    const code = item.code.trim().toLowerCase(), label = item.label.trim().toLowerCase();
    return Object.hasOwn(scale, code) ? scale[code] : Object.hasOwn(scale, label) ? scale[label] : undefined;
  }));
  return ratings.size === 1 && !ratings.has(undefined) ? ratings.values().next().value! : null;
}

export function rankingForScore(score: number): RiskRanking | null {
  if (!Number.isInteger(score) || score < 1 || score > 25) return null;
  return score >= 15 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';
}

export function orderRiskSummary(records: RiskRecord[], factors: MatrixFactors): RankedRiskRecord[] {
  return records.map(record => {
    const impact = ordinal(record.i_rate, factors.impact_factors, impactScale);
    const likelihood = ordinal(record.l_rate, factors.likelihood_factors, likelihoodScale);
    const risk_score = impact != null && likelihood != null ? impact * likelihood : null;
    return { ...record, risk_score, risk_ranking: risk_score == null ? null : rankingForScore(risk_score) };
  }).sort((left, right) => {
    const leftScore = left.risk_score ?? Number.NEGATIVE_INFINITY;
    const rightScore = right.risk_score ?? Number.NEGATIVE_INFINITY;
    if (leftScore !== rightScore) return leftScore > rightScore ? -1 : 1;
    return left.risk_code.localeCompare(right.risk_code, 'en', { numeric: true });
  });
}
