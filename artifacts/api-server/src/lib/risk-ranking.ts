import type { PoolClient } from "pg";
import type { RiskRankingFactorSnapshot, RiskRankingSnapshot } from "@workspace/api-zod";
import { txQuery } from "./postgres";
import { RiskError } from "./risk-register";

export function factorSnapshot(_axis: "impact" | "likelihood", factor: { code: string; label: string; matrix_weight: number | null }): RiskRankingFactorSnapshot {
  return { code: factor.code, label: factor.label,
    ordinal: factor.matrix_weight != null && Number.isInteger(factor.matrix_weight) && factor.matrix_weight >= 1 && factor.matrix_weight <= 5
      ? factor.matrix_weight : null };
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
    const matches = await txQuery<{code: string; label: string; matrix_weight:number|null}>(client,
      `SELECT ${code} AS code,${label} AS label,matrix_weight FROM risk.${table}
       WHERE is_active AND ${rating}=$1 AND ($2::text IS NULL OR ${code}=$2) FOR SHARE`,
      [value, identity ?? null]);
    if (identity && matches.length !== 1)
      throw new RiskError(400, `Select an active ${kind} factor matching the assessment value.`);
    return matches.length === 1 ? factorSnapshot(kind, matches[0]) : null;
  }
  return { impact: await axis("impact"), likelihood: await axis("likelihood") };
}
