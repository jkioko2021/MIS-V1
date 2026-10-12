import type { PoolClient } from "pg";
import type { RiskRankingFactorSnapshot, RiskRankingSnapshot } from "@workspace/api-zod";
import { txQuery } from "./postgres";
import { RiskError } from "./risk-register";

const scales: Record<"impact" | "likelihood", Record<string, number>> = {
  impact: { imp_01: 5, catastrophic: 5, imp_02: 4, major: 4, imp_03: 3, moderate: 3, imp_04: 2, minor: 2, imp_05: 1, insignificant: 1 },
  likelihood: { lik_01: 5, certain: 5, lik_02: 4, likely: 4, lik_03: 3, possible: 3, lik_04: 2, unlikely: 2, lik_05: 1, rare: 1 },
};
export function factorSnapshot(axis: "impact" | "likelihood", factor: { code: string; label: string }): RiskRankingFactorSnapshot {
  const scale = scales[axis];
  return { code: factor.code, label: factor.label,
    ordinal: scale[factor.code.toLowerCase()] ?? scale[factor.label.trim().toLowerCase()] ?? null };
}

type RankingInput = {
  i_rate: number; l_rate: number; risk_impact?: string | null; risk_likelihood?: string | null; reassess_ranking?: boolean;
};
export async function assessmentRanking(client: PoolClient, existing: Record<string, unknown>, input: RankingInput): Promise<RiskRankingSnapshot> {
  const saved = existing.ranking_snapshot as RiskRankingSnapshot | null;
  async function axis(kind: "impact" | "likelihood"): Promise<RiskRankingFactorSnapshot | null> {
    const isImpact = kind === "impact";
    const value = isImpact ? input.i_rate : input.l_rate;
    const field = isImpact ? "i_rate" : "l_rate";
    const selected = isImpact ? input.risk_impact : input.risk_likelihood;
    const previous = saved?.[kind] ?? null;
    const unchanged = existing[field] != null && Number(existing[field]) === value;
    if (unchanged && !input.reassess_ranking && selected == null)
      return previous;
    const identity = selected ?? (unchanged && input.reassess_ranking ? previous?.code : null);
    const table = isImpact ? "impact_factors" : "likelihood_factors";
    const code = isImpact ? "impact_code" : "likelihood_code";
    const label = isImpact ? "impact_factor" : "likelihood_factor";
    const rating = isImpact ? "rate_factor" : "rating";
    // Lock reference rows until the assessment commits so concurrent reference
    // maintenance cannot change the identity/weight halfway through capture.
    const matches = await txQuery<{code: string; label: string}>(client,
      `SELECT ${code} AS code,${label} AS label FROM risk.${table}
       WHERE is_active AND ${rating}=$1 AND ($2::text IS NULL OR ${code}=$2) FOR SHARE`,
      [value, identity ?? null]);
    if (identity && matches.length !== 1)
      throw new RiskError(400, `Select an active ${kind} factor matching the assessment value.`);
    return matches.length === 1 ? factorSnapshot(kind, matches[0]) : null;
  }
  return { impact: await axis("impact"), likelihood: await axis("likelihood") };
}
