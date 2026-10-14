import type { RiskAnalyticsResponseData } from "@workspace/api-zod";

type Row = Record<string, unknown>;
const integer = (value: unknown) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
};
const ordinal = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
const exposure = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};
export const matrixBand = (score: number) =>
  score >= 15 ? "Critical" : score >= 10 ? "High" : score >= 5 ? "Medium" : "Low";

type Priority = RiskAnalyticsResponseData["priorities"][number];
function priorityFor(row: Row): Priority {
  const snapshot = row.ranking_snapshot as { impact?: { ordinal?: unknown }; likelihood?: { ordinal?: unknown } } | null;
  const assessed = row.assessment_updated === true;
  const impact = assessed ? ordinal(snapshot?.impact?.ordinal) : null;
  const likelihood = assessed ? ordinal(snapshot?.likelihood?.ordinal) : null;
  const score = impact !== null && likelihood !== null ? impact * likelihood : null;
  return {
    risk_code: String(row.risk_code), risk_title: String(row.risk_title),
    department: String(row.depart_name), depart_code: String(row.depart_code),
    risk_score: score, risk_ranking: score === null ? null : matrixBand(score),
    residual_exposure: assessed ? exposure(row.r_risk_exposure) : null,
    open_actions: integer(row.open_actions), behind_schedule_actions: integer(row.behind_schedule_count),
    overdue_actions: integer(row.overdue_actions), impact_ordinal: impact, likelihood_ordinal: likelihood,
  };
}
const comparePriority = (a: Priority, b: Priority) =>
  (b.risk_score ?? -1) - (a.risk_score ?? -1)
  || b.behind_schedule_actions - a.behind_schedule_actions || b.overdue_actions - a.overdue_actions
  || a.risk_code.localeCompare(b.risk_code, "en", { numeric: true });

/** No row limit: aggregate the complete authorized scope, never a UI page. */
export function buildRiskAnalytics(rows: Row[], population: "open" | "all", now = new Date(), departmentFilter = ""): RiskAnalyticsResponseData {
  const populationRows = population === "open" ? rows.filter(row => row.risk_status !== "Closed") : rows;
  const overallPriorities = populationRows.map(priorityFor).sort(comparePriority);
  const overallRanked = overallPriorities.filter(risk => risk.risk_score !== null);
  const selected = departmentFilter ? populationRows.filter(row => row.depart_code === departmentFilter) : populationRows;
  const heatmap = Array.from({ length: 25 }, (_, i) => {
    const impact = i % 5 + 1, likelihood = Math.floor(i / 5) + 1, score = impact * likelihood;
    return { impact, likelihood, score, ranking: matrixBand(score), count: 0 };
  });
  const rankingCounts = new Map(["Critical", "High", "Medium", "Low", "Unranked"].map(name => [name, 0]));
  const categoryCounts = new Map<string, { code: string; name: string; count: number }>();
  const departmentCounts = new Map<string, {
    depart_code: string; name: string; total: number; critical: number; high: number; exposures: number[];
  }>();
  const registerStates = new Map<string, string>();
  const totals: RiskAnalyticsResponseData["totals"] = {
    total_risks: selected.length, assessed_risks: 0, open_risks: 0, closed_risks: 0,
    ranked_risks: 0, unranked_risks: 0, open_actions: 0, behind_schedule_actions: 0,
    overdue_actions: 0, critical_risks: 0, high_risks: 0, avg_residual_exposure: null,
  };
  const allExposures: number[] = [];
  const priorities = selected.map(row => {
    const assessed = row.assessment_updated === true;
    // Reference retirement/reweighting must never change a saved assessment's matrix position.
    const priority = priorityFor(row);
    const { impact_ordinal: impact, likelihood_ordinal: likelihood, risk_score: score,
      risk_ranking: band, residual_exposure: residual } = priority;
    const department = String(row.depart_code), category = String(row.risk_category ?? "");
    if (assessed) totals.assessed_risks++;
    if (row.risk_status === "Closed") totals.closed_risks++; else totals.open_risks++;
    if (score === null) totals.unranked_risks++;
    else {
      totals.ranked_risks++;
      heatmap[(likelihood! - 1) * 5 + impact! - 1].count++;
    }
    rankingCounts.set(band ?? "Unranked", (rankingCounts.get(band ?? "Unranked") ?? 0) + 1);
    if (band === "Critical") totals.critical_risks++;
    if (band === "High") totals.high_risks++;
    const openActions = integer(row.open_actions), behind = integer(row.behind_schedule_count), overdue = integer(row.overdue_actions);
    totals.open_actions += openActions;
    totals.behind_schedule_actions += behind;
    totals.overdue_actions += overdue;
    if (residual !== null) allExposures.push(residual);
    const d = departmentCounts.get(department) ?? {
      depart_code: department, name: String(row.depart_name), total: 0, critical: 0, high: 0, exposures: [],
    };
    d.total++;
    if (band === "Critical") d.critical++;
    if (band === "High") d.high++;
    if (residual !== null) d.exposures.push(residual);
    departmentCounts.set(department, d);
    const c = categoryCounts.get(category) ?? { code: category, name: String(row.category_name ?? "Uncategorised"), count: 0 };
    c.count++;
    categoryCounts.set(category, c);
    registerStates.set(`${department}:${row.period_id}`, String(row.workflow_status));
    return priority;
  });
  const sortedPriorities = priorities.sort(comparePriority);
  const departmentTop = new Map<string, RiskAnalyticsResponseData["top_ten_departments"][number]>(
    [...departmentCounts.values()].map(d => [d.depart_code, {
      depart_code: d.depart_code, department: d.name, total_ranked: 0, total_unranked: 0, risks: [],
    }]));
  for (const risk of sortedPriorities) {
    const group = departmentTop.get(risk.depart_code)!;
    if (risk.risk_score === null) group.total_unranked++;
    else {
      group.total_ranked++;
      if (group.risks.length < 10) group.risks.push(risk);
    }
  }
  const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length * 100) / 100 : null;
  totals.avg_residual_exposure = average(allExposures);
  const states = ["OPEN", "SUBMITTED", "REVIEWED", "SIGNED_OFF", "CLOSED"];
  return {
    generated_at: now, population, totals, heatmap,
    rankings: [...rankingCounts].map(([name, count]) => ({ name, count })),
    categories: [...categoryCounts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    departments: [...departmentCounts.values()].map(({ exposures, ...d }) => ({ ...d, avg_residual_exposure: average(exposures) }))
      .sort((a, b) => b.critical - a.critical || b.high - a.high || b.total - a.total || a.name.localeCompare(b.name)),
    workflows: states.map(name => ({ name, count: [...registerStates.values()].filter(state => state === name).length })),
    priorities: sortedPriorities.slice(0, 20),
    top_ten_overall: overallRanked.slice(0, 10),
    overall_ranked_count: overallRanked.length,
    overall_unranked_count: overallPriorities.length - overallRanked.length,
    top_ten_departments: [...departmentTop.values()].sort((a, b) => a.department.localeCompare(b.department)
      || a.depart_code.localeCompare(b.depart_code)),
  };
}
