import type { NextFunction, Request, Response } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { query, txQuery } from "./postgres";

export class RiskError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type RiskActor = {
  username: string; is_admin: boolean; is_manager: boolean;
  champion_departments: string[]; owner_departments: string[];
};
export const RISK_MANAGEMENT_SQL = "LOWER(TRIM(p.profile_name)) IN ('risk manager','risk management','risk administrator')";
export async function riskActor(employeeId: string | number): Promise<RiskActor | null> {
  const [actor] = await query<RiskActor>(`SELECT e.username,
    e.profile_id IN (1,2) AS is_admin,
    ${RISK_MANAGEMENT_SQL} AS is_manager,
    ARRAY(SELECT DISTINCT depart_code FROM (
      SELECT department AS depart_code FROM risk.champions c WHERE username=e.username AND is_active
        AND NOT EXISTS (SELECT 1 FROM risk.department_assignments m WHERE m.depart_code=c.department)
      UNION SELECT depart_code FROM risk.department_assignments WHERE champion_username=e.username
    ) c) AS champion_departments,
    ARRAY(SELECT depart_code FROM risk.department_assignments WHERE owner_username=e.username) AS owner_departments
    FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE e.employee_id=$1 AND e.activated AND e.approved AND NOT e.employee_locked
      AND NOT e.is_deleted AND p.is_active`, [employeeId]);
  return actor ?? null;
}
export async function requireRiskActor(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = await riskActor(req.user!.sub);
    if (!actor) throw new RiskError(403, "An active MIS account is required.");
    res.locals.riskActor = actor;
    next();
  } catch (err) { riskFailure(req, res, err); }
}
export function privateRiskResponses(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control","private, no-store");
  res.vary("Cookie");
  next();
}
export function canManage(a: Pick<RiskActor, "is_admin" | "is_manager">) { return a.is_admin || a.is_manager; }
export function canViewDepartment(a: RiskActor, code: string) {
  return canManage(a) || a.champion_departments.includes(code) || a.owner_departments.includes(code);
}
export function workspaceScope(a: RiskActor, access: "view" | "update" | "review" = "view"): [boolean, string[]] {
  const codes = access === "update" ? a.champion_departments : access === "review" ? a.owner_departments
    : [...a.champion_departments, ...a.owner_departments];
  if (access !== "view" && !canManage(a) && !codes.length) {
    throw new RiskError(403, access === "update" ? "Update Register requires a department champion assignment."
      : "Risk Register Review requires a department owner assignment.");
  }
  return [canManage(a), [...new Set(codes)]];
}
export function assertDepartment(a: RiskActor, code: string, mode: "view" | "edit" | "review" | "manage" = "view") {
  const allowed = canManage(a) || mode === "edit" && a.champion_departments.includes(code)
    || mode === "review" && a.owner_departments.includes(code)
    || mode === "view" && canViewDepartment(a, code);
  if (!allowed) throw new RiskError(403, "You do not have permission for this department.");
}
export function riskFailure(req: Request, res: Response, err: unknown) {
  if (err instanceof RiskError) res.status(err.status).json({ ok: false, error: err.message });
  else if (err instanceof z.ZodError) res.status(400).json({ ok: false, error: err.issues[0]?.message ?? "Invalid risk input." });
  else {
    req.log.error({ err }, "Risk register request failed");
    res.status(500).json({ ok: false, error: "Unable to process the risk register request." });
  }
}
export const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const d = new Date(value + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}, "Enter a valid calendar date.");
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
export const recordInput = z.object({
  depart_code: z.string().trim().min(1).max(50), period_id: z.number().int().positive(),
  objective_code: z.string().trim().min(1).max(50),
  risk_title: z.string().trim().min(1).max(150),
  risk_description: z.string().trim().min(1).max(8000),
  risk_category: z.string().trim().min(1).max(50),
  risk_consequence: z.string().trim().min(1).max(8000),
});
export const assessmentInput = recordInput.extend({
  i_rate: z.number().positive().max(100).refine(v=>Math.abs(v*100-Math.round(v*100))<1e-7,"Impact factor accepts up to two decimal places."),
  l_rate: z.number().positive().max(100).refine(v=>Math.abs(v*100-Math.round(v*100))<1e-7,"Likelihood factor accepts up to two decimal places."),
  control_effectiveness: z.number().min(0).max(1).refine(v=>Math.abs(v*1e6-Math.round(v*1e6))<1e-7,
    "Control effectiveness accepts up to six fractional decimal places."),
  current_contr: optionalText(8000), desired_contr_effe: optionalText(8000),
  expected_updated_at: z.string().datetime({ offset: true }),
  comments: z.string().trim().min(1).max(4000),
});
export const causeInput = z.object({
  root_id: z.number().int().positive().optional(),
  root_cause: z.string().trim().min(1).max(8000),
  current_contr: optionalText(8000), mitigations: z.string().trim().min(1).max(8000),
  due_date: calendarDate, action_owner: z.string().trim().min(1).max(100),
  action_status: z.enum(["Open","Behind schedule","Closed"]),
  expected_updated_at: z.string().datetime({ offset: true }),
});
export const cycleInput = z.object({
  depart_code: z.string().trim().min(1).max(50), period_id: z.number().int().positive(),
  action: z.enum(["SUBMIT","REVIEW","RETURN","SIGN_OFF","CLOSE","REOPEN","PROCESS"]),
  comments: z.string().trim().min(1).max(4000),
});
export function calculateRisk(impact: number, likelihood: number, control: number) {
  return {
    inherent: Math.round(impact * likelihood * 100) / 100,
    residual: Math.round(impact * likelihood * (1 - control) * 100) / 100,
  };
}
export function workflowState(s: { closed?: boolean; sign_off?: boolean; reviewed?: boolean; submitted?: boolean }) {
  return s.closed ? "CLOSED" : s.sign_off ? "SIGNED_OFF" : s.reviewed ? "REVIEWED" : s.submitted ? "SUBMITTED" : "OPEN";
}
export async function period(client: PoolClient, id: number, allowClosed = false) {
  const [p] = await txQuery<{ period_id:number;period_from:string;period_to:string;status:string }>(client,
    "SELECT *,period_from::text,period_to::text FROM risk.periods WHERE period_id=$1 FOR UPDATE", [id]);
  if (!p) throw new RiskError(404, "Risk period was not found.");
  if (!allowClosed && p.status !== "OPEN") throw new RiskError(409, "This reporting period is closed.");
  return p;
}
export async function cycle(client: PoolClient, department: string, p: Awaited<ReturnType<typeof period>>) {
  await txQuery(client, `INSERT INTO risk.department_summary(depart_code,period_from,period_to)
    VALUES($1,$2,$3) ON CONFLICT(depart_code,period_from,period_to) DO NOTHING`,
  [department,p.period_from,p.period_to]);
  const [s] = await txQuery<Record<string,unknown>>(client, `SELECT * FROM risk.department_summary
    WHERE depart_code=$1 AND period_from=$2 AND period_to=$3 FOR UPDATE`, [department,p.period_from,p.period_to]);
  return s;
}
export function assertEditable(s: Record<string,unknown>) {
  if (s.submitted || s.reviewed || s.sign_off || s.closed)
    throw new RiskError(409, "Return or reopen the department register before editing.");
}
export function assertRecordEditable(s: Record<string,unknown>, a: RiskActor, department: string) {
  const state = workflowState(s);
  const allowed = state === "OPEN" && (canManage(a) || a.champion_departments.includes(department))
    || state === "SUBMITTED" && (canManage(a) || a.owner_departments.includes(department));
  if (!allowed) throw new RiskError(409,"This assessment is not editable in your current review stage.");
}
export async function history(client: PoolClient, code: string | null, department: string | null, periodId: number | null,
  action: string, actor: string, comments: string, snapshot: unknown) {
  await txQuery(client, `INSERT INTO risk.register_history
    (risk_code,depart_code,period_id,action,actor,comments,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)`,
  [code,department,periodId,action,actor,comments,JSON.stringify(snapshot)]);
}
export async function lockedRecord(client: PoolClient, code: string, actor: RiskActor, mode: "edit"|"review"|"view") {
  // Period -> cycle -> record is the shared lock order for decisions and edits.
  const [metadata] = await txQuery<{period_id:number;depart_code:string}>(client, `SELECT p.period_id,r.depart_code
    FROM risk.risk_master r JOIN risk.periods p ON p.period_from=r.period_from AND p.period_to=r.period_to
    WHERE r.risk_code=$1`,[code]);
  if (!metadata) throw new RiskError(404, "Risk was not found.");
  assertDepartment(actor,metadata.depart_code,mode === "edit" ? "view" : mode);
  const p = await period(client,metadata.period_id);
  const s = await cycle(client,metadata.depart_code,p);
  const [r] = await txQuery<Record<string,unknown>>(client,
    `SELECT *,to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at
     FROM risk.risk_master WHERE risk_code=$1 FOR UPDATE`,[code]);
  return {r,p,s};
}
export function assertFresh(actual: unknown, expected: string) {
  const micros = (value: unknown) => {
    const text = value instanceof Date ? value.toISOString() : String(value);
    const millis = new Date(text).getTime();
    if (!Number.isFinite(millis)) return null;
    const fraction = (text.match(/\.(\d+)/)?.[1] ?? "").padEnd(6,"0").slice(3,6);
    return BigInt(millis)*1000n + BigInt(fraction || "0");
  };
  if (micros(actual) === null || micros(actual) !== micros(expected))
    throw new RiskError(409, "The risk changed. Refresh before saving.");
}
