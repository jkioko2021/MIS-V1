export type RiskPageActor = {
  can_manage: boolean;
  champion_departments: string[];
  owner_departments: string[];
};

export function canAccessRiskPage(actor: RiskPageActor | undefined, page: string) {
  if (page === "import") return Boolean(actor?.can_manage);
  if (page === "history") return Boolean(actor && (actor.can_manage || actor.champion_departments.length || actor.owner_departments.length));
  if (page !== "update" && page !== "review") return true;
  if (!actor) return false;
  return actor.can_manage || (page === "update" ? actor.champion_departments : actor.owner_departments).length > 0;
}

export function riskPageDepartments(actor: RiskPageActor | undefined, page: string): string[] | null {
  if (!actor) return [];
  if (page === "history" && !actor.can_manage) return [...new Set([...actor.champion_departments, ...actor.owner_departments])];
  if (actor.can_manage || (page !== "update" && page !== "review")) return null;
  return page === "update" ? actor.champion_departments : actor.owner_departments;
}
