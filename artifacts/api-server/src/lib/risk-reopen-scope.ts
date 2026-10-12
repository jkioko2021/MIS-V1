import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { txQuery } from "./postgres";
import { RiskError, workflowState, type period } from "./risk-register";

export async function reopenScope(client: PoolClient, p: Awaited<ReturnType<typeof period>>, department: string) {
  // Include all registers, even inactive departments, so no retained register is hidden.
  const rows = await txQuery<{
    depart_code: string; depart_name: string; total_risks: number;
    submitted: boolean; reviewed: boolean; sign_off: boolean; closed: boolean;
    summary_revision: string | null; risk_revision: string | null;
  }>(client, `SELECT d.depart_code,d.depart_name,count(r.risk_code)::integer AS total_risks,
    COALESCE(s.submitted,FALSE) AS submitted,COALESCE(s.reviewed,FALSE) AS reviewed,
    COALESCE(s.sign_off,FALSE) AS sign_off,COALESCE(s.closed,FALSE) AS closed,
    s.updated_at::text AS summary_revision,max(r.updated_at)::text AS risk_revision
    FROM risk.departments d
    LEFT JOIN risk.department_summary s ON s.depart_code=d.depart_code AND s.period_from=$1 AND s.period_to=$2
    LEFT JOIN risk.risk_master r ON r.depart_code=d.depart_code AND r.period_from=$1 AND r.period_to=$2 AND r.is_active
    WHERE s.summary_id IS NOT NULL OR r.risk_code IS NOT NULL
    GROUP BY d.depart_code,d.depart_name,s.summary_id ORDER BY d.depart_code`,
  [p.period_from,p.period_to]);
  const selected = rows.find(row => row.depart_code === department);
  const [active] = await txQuery<{is_active: boolean}>(client,
    "SELECT is_active FROM risk.departments WHERE depart_code=$1", [department]);
  if (!active?.is_active || !selected) throw new RiskError(404, "Active department register was not found.");
  if (!selected.total_risks) throw new RiskError(409, "Register at least one active risk before reopening the department.");
  if (p.status === "OPEN" && workflowState(selected) === "OPEN") throw new RiskError(409, "This register is already open.");
  return {
    period_id: p.period_id, period_from: p.period_from, period_to: p.period_to,
    period_status: p.status, depart_code: department,
    confirmation_token: createHash("sha256").update(JSON.stringify([p.period_id,p.status,department,rows])).digest("hex"),
    departments: rows.map(row => ({
      depart_code: row.depart_code, depart_name: row.depart_name, total_risks: row.total_risks,
      workflow_status: workflowState(row),
      affected: row.depart_code === department,
    })),
  };
}
