import type { PoolClient } from "pg";
import { query, txQuery, withTransaction } from "./postgres";
import { RiskError, RISK_MANAGEMENT_SQL, assertDepartment, history, period, workflowState, type RiskActor } from "./risk-register";
import { configuredEmailSender, sendResendEmail, type EmailSender } from "./business-notifications";

export function pendingStage(state: string, total: number) {
  if (!total) return { role: "No register", action: "Register risks", path: "new" };
  return ({
    OPEN: { role: "Risk Champion", action: "Complete assessments and submit for review", path: "update" },
    SUBMITTED: { role: "Risk Owner", action: "Review the departmental register", path: "review" },
    REVIEWED: { role: "Risk Management / administrators", action: "Sign off the departmental register", path: "summary" },
    SIGNED_OFF: { role: "Risk Management / administrators", action: "Close the reporting period", path: "close" },
  } as Record<string, { role: string; action: string; path: string }>)[state]
    ?? { role: "None", action: "No action pending", path: "" };
}

type Recipient = { username: string; full_name: string; email: string | null };
export async function pendingRecipients(department: string, state: string, client?: PoolClient) {
  const sql = `SELECT e.username,e.employee_name AS full_name,e.email FROM crm.employees e
    JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active
    AND (
      $2='OPEN' AND (EXISTS(SELECT 1 FROM risk.department_assignments a WHERE a.depart_code=$1 AND a.champion_username=e.username)
        OR EXISTS(SELECT 1 FROM risk.champions c WHERE c.department=$1 AND c.username=e.username AND c.is_active
          AND NOT EXISTS(SELECT 1 FROM risk.department_assignments a WHERE a.depart_code=$1)))
      OR $2='SUBMITTED' AND EXISTS(SELECT 1 FROM risk.department_assignments a WHERE a.depart_code=$1 AND a.owner_username=e.username)
      OR $2 IN ('REVIEWED','SIGNED_OFF') AND (e.profile_id IN (1,2) OR ${RISK_MANAGEMENT_SQL})
    ) ORDER BY e.username${client ? " FOR SHARE OF e,p" : ""}`;
  return client ? txQuery<Recipient>(client, sql, [department, state]) : query<Recipient>(sql, [department, state]);
}
const usable = (email: string | null) => Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));

export async function pendingResponsibility(department: string, state: string, total: number) {
  const stage = pendingStage(state, total);
  const recipients = total && stage.path ? await pendingRecipients(department, state) : [];
  return {
    pending_role: stage.role, pending_action: stage.action,
    pending_users: recipients.map(person => ({ username: person.username, name: person.full_name || person.username })),
    reminder_available: Boolean(total && recipients.length && recipients.every(person => usable(person.email)) && configuredEmailSender()),
    reminder_unavailable_reason: !total || !stage.path ? "No workflow action is pending."
      : !recipients.length ? `No active ${stage.role} is assigned. Contact Risk Administration.`
      : !recipients.every(person => usable(person.email)) ? "A pending user's email address is missing or invalid."
      : !configuredEmailSender() ? "Email sender is not configured." : "",
  };
}

/** Explicit, audited reminders; no automatic retries to stale or reassigned recipients. */
export async function sendRiskReminder(actor: RiskActor, input: { depart_code: string; period_id: number; expected_status: string; comments: string },
  send: EmailSender = sendResendEmail) {
  assertDepartment(actor, input.depart_code);
  return withTransaction(async client => {
    const p = await period(client, input.period_id);
    const [current] = await txQuery<{ period_id: number }>(client,
      "SELECT period_id FROM risk.periods WHERE status='OPEN' ORDER BY period_from DESC,period_id DESC LIMIT 1");
    if (current?.period_id !== input.period_id) throw new RiskError(409, "Reminders are available only for the current open reporting period.");
    const [summary] = await txQuery<{ submitted: boolean; reviewed: boolean; sign_off: boolean; closed: boolean }>(client,
      `SELECT * FROM risk.department_summary WHERE depart_code=$1 AND period_from=$2 AND period_to=$3 FOR UPDATE`,
      [input.depart_code, p.period_from, p.period_to]);
    const state = workflowState(summary ?? {});
    if (state !== input.expected_status) throw new RiskError(409, "The workflow has changed. Refresh the status page before sending a reminder.");
    const [department] = await txQuery<{ depart_name: string; total: number }>(client,
      `SELECT d.depart_name,(SELECT count(*)::integer FROM risk.risk_master r WHERE r.depart_code=d.depart_code
        AND r.period_from=$2 AND r.period_to=$3 AND r.is_active) AS total
        FROM risk.departments d WHERE d.depart_code=$1 AND d.is_active`, [input.depart_code, p.period_from, p.period_to]);
    const stage = pendingStage(state, department?.total ?? 0);
    if (!department?.total || !stage.path) throw new RiskError(409, "No workflow action is pending for this register.");
    const recipients = await pendingRecipients(input.depart_code, state, client);
    if (!recipients.length || !recipients.every(person => usable(person.email)))
      throw new RiskError(409, "Map active responsible users with valid email addresses before sending a reminder.");
    const from = configuredEmailSender();
    if (!from) throw new RiskError(503, "Email sender is not configured.");
    const [clock] = await txQuery<{ bucket: string; recent: boolean }>(client, `SELECT
      floor(extract(epoch FROM NOW())/600)::text AS bucket,
      EXISTS(SELECT 1 FROM risk.register_history WHERE depart_code=$1 AND period_id=$2
        AND action='WORKFLOW_REMINDER' AND created_at>NOW()-INTERVAL '10 minutes') AS recent`,
    [input.depart_code, input.period_id]);
    if (clock.recent) throw new RiskError(429, "A reminder was attempted for this department in the last 10 minutes. Please wait before sending another.");
    const outcomes = await Promise.all(recipients.map(async person => {
      try {
        await send({ from, to: person.email!.trim(),
          subject: `Action required: ${department.depart_name} risk register reminder`,
          text: `Hello ${person.full_name || person.username},\n\nPlease action the ${department.depart_name} risk register.\nReporting period: ${p.period_from} to ${p.period_to}\nCurrent status: ${state.replaceAll("_", " ")}\nAction required: ${stage.action}.\n\nSign in to MIS and open Risk Register > ${stage.path === "summary" ? "Risk Register Signoff" : stage.path === "close" ? "Risk Register Close" : stage.path === "review" ? "Risk Register Review" : "Update Register"}.\n\nReminder from ${actor.username}:${input.comments ? `\n${input.comments}` : " Please complete the pending action."}`,
          idempotencyKey: `mis-risk-reminder-${input.depart_code}-${input.period_id}-${state}-${clock.bucket}-${person.username}`,
        });
        return { username: person.username, accepted: true };
      } catch {
        return { username: person.username, accepted: false };
      }
    }));
    const accepted = outcomes.filter(item => item.accepted).length;
    await history(client, null, input.depart_code, input.period_id, "WORKFLOW_REMINDER", actor.username, input.comments,
      { workflow_status: state, pending_action: stage.action, outcomes });
    return { accepted, failed: outcomes.length - accepted, message: accepted === outcomes.length
      ? `Reminder accepted by the email provider for ${accepted} recipient(s). Inbox delivery is not confirmed.`
      : `${accepted} reminder(s) accepted; ${outcomes.length - accepted} failed. Check email configuration before retrying after 10 minutes.` };
  });
}
