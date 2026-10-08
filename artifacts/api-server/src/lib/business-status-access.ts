import type { NextFunction, Request, Response } from "express";
import { queryOne } from "./postgres";
import { logger } from "./logger";
import { ACTIVE_STAFF_SQL, GI_STAFF_SQL } from "./gi-workflow";

export interface StatusActor {
  username: string;
  profile_id: number;
  profile_name: string;
  is_gi: boolean;
  isAdmin: boolean;
  isDpu: boolean;
  isMembership: boolean;
  teamQueues: string[];
  scopeLabel: string;
}
export interface StatusOpenItem {
  queue_name: string;
  assigned_to: string | null;
}
export interface StatusRecord extends Record<string, unknown> {
  file_no: string;
  file_status: string;
  entered_by: string;
  allocated_to: string | null;
  allocated: boolean;
  receipted: boolean;
  filed: boolean;
  is_declined: boolean;
  business_type: string;
  open_items: StatusOpenItem[];
  responsible_name: string | null;
}

const bpo = new Set(["bpo", "bpo admin", "bpo review"]);
const membership = new Set([...bpo, "membership admin"]);

export async function requireStatusAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await queryOne<{
      username: string; profile_id: number; profile_name: string; is_gi: boolean;
    }>(`SELECT e.username,e.profile_id,p.profile_name,${GI_STAFF_SQL} AS is_gi
        FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
        WHERE e.employee_id=$1 AND ${ACTIVE_STAFF_SQL}`, [req.user!.sub]);
    if (!employee) {
      res.status(403).json({ ok: false, error: "An active staff account and profile are required." });
      return;
    }
    const name = employee.profile_name.trim().replace(/\s+/g, " ").toLowerCase();
    const teamQueues: string[] = [];
    if (bpo.has(name)) teamQueues.push("BPO_REVIEW_RETAIL", "BPO_REVIEW_CORPORATE_SME");
    if (employee.profile_id === 5 || ["medical uw", "medical underwriting"].includes(name))
      teamQueues.push("MEDICAL_UNDERWRITING");
    if (name === "pricing") teamQueues.push("PRICING_REVIEW");
    if (employee.profile_id === 6 || ["finance", "cashier"].includes(name))
      teamQueues.push("CASHIER", "CREDIT_CONTROL");
    if (employee.is_gi) teamQueues.push("GI_ALLOCATE");
    const isAdmin = [1, 2].includes(employee.profile_id);
    const isDpu = name === "dpu";
    const actor: StatusActor = {
      ...employee, isAdmin, isDpu, isMembership: membership.has(name), teamQueues,
      scopeLabel: isAdmin
        ? "All active business records, including completed records when selected."
        : "Your registrations and recorded participation/handoffs, plus your team's current inbox. Private details remain restricted.",
    };
    res.locals.statusActor = actor;
    next();
  } catch (err) {
    logger.error({ err }, "Business status access failed");
    res.status(500).json({ ok: false, error: "Unable to verify business status access." });
  }
}

// All four typed parameters are used even for administrators. Reuse identically
// for list, totals, options, detail and downloads; filters never broaden scope.
export const STATUS_SCOPE_SQL = `b.is_active AND (
  $3::boolean OR b.entered_by=$1::varchar OR b.allocated_to=$1::varchar
  OR b.forwarded_by=$1::varchar OR b.cashier_by=$1::varchar
  OR b.filed_by=$1::varchar OR b.benefit_ver_by=$1::varchar
  OR EXISTS (SELECT 1 FROM crm.business_tracking_notes sn
    WHERE sn.file_no=b.file_no AND sn.note_from=$1::varchar)
  OR EXISTS (SELECT 1 FROM crm.business_work_items sw WHERE sw.file_no=b.file_no
    AND (sw.assigned_to=$1::varchar OR sw.assigned_by=$1::varchar OR sw.forwarded_by=$1::varchar
      OR (sw.work_status='OPEN' AND sw.queue_name=ANY($2::varchar[]))))
  OR ($4::boolean AND NOT b.is_declined AND b.business_type IN ('N','R','A')
    AND (b.receipted OR b.filed OR b.file_status='CLOSED'))
)`;

export function statusScopeParams(actor: StatusActor): unknown[] {
  return [actor.username, actor.teamQueues, actor.isAdmin, actor.isDpu];
}

export const STATUS_RECORD_SQL = `SELECT b.*,
  COALESCE(ow.open_items,'[]'::jsonb) AS open_items, holder.employee_name AS responsible_name
  FROM crm.business_tracking b
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('queue_name',w.queue_name,'assigned_to',w.assigned_to)
      ORDER BY w.created_at DESC,w.work_item_id DESC) AS open_items
    FROM crm.business_work_items w WHERE w.file_no=b.file_no AND w.work_status='OPEN'
  ) ow ON TRUE
  LEFT JOIN crm.employees holder ON holder.username=COALESCE(
    ow.open_items->0->>'assigned_to',
    CASE WHEN b.allocated THEN b.allocated_to
      WHEN b.file_status IN ('REGISTERED','RETURNED-INCOMPLETE') THEN b.entered_by END
  )`;

export function canViewStatusDetails(actor: StatusActor, file: StatusRecord): boolean {
  if (actor.isAdmin) return true;
  const items = file.open_items;
  const giAllocated = items.some(w => w.queue_name === "GI_ALLOCATED");
  const pricing = items.some(w => w.queue_name === "PRICING_REVIEW");
  const authorizedLane = (w: StatusRecord["open_items"][number]) =>
    actor.teamQueues.includes(w.queue_name)
    || w.queue_name === "GI_ALLOCATED" && actor.is_gi && w.assigned_to === actor.username
    || w.queue_name === "MEMBERSHIP_CLOSURE" && actor.isMembership && w.assigned_to === actor.username
    || w.queue_name === "REGISTER_CORRECTION"
      && (w.assigned_to === actor.username || file.entered_by === actor.username);
  if (giAllocated || file.file_status === "ALLOCATED" && !pricing) {
    return file.allocated_to === actor.username
      && (giAllocated || file.business === "N" ? actor.is_gi : actor.isMembership)
      && items.every(authorizedLane);
  }
  // Record Filing intentionally accepts receipted/closed files even while a
  // legacy closure work item remains open. Use the same eligibility gate.
  if (actor.isDpu && !file.is_declined && ["N", "R", "A"].includes(file.business_type)
    && (file.receipted || file.filed || file.file_status === "CLOSED")) return true;
  if (items.length) {
    // A malformed file with overlapping open lanes must not grant access merely
    // because one of the lanes is visible. Every open lane must be authorized.
    return items.every(authorizedLane);
  }
  // Completing a handoff does not return an allocated file's private ownership
  // to its original tracker. The owner's current operational role still matters.
  if (file.allocated || file.allocated_to) return file.allocated_to === actor.username
    && (file.business === "N" ? actor.is_gi : actor.isMembership);
  return file.entered_by === actor.username;
}

export function publicStatusFile(file: StatusRecord, actor: StatusActor) {
  const queue = file.open_items[0];
  return {
    file_no: file.file_no, proposer_name: file.proposer_name, receive_dt: file.receive_dt,
    business_type: file.business_type, client_type: file.client_type, business: file.business,
    product: file.product, file_status: file.file_status, entered_by: file.entered_by,
    updated_at: file.updated_at, forwarded: file.forwarded, invoiced: file.invoiced,
    receipted: file.receipted, filed: file.filed,
    is_completed: file.filed || ["FILED", "UPDATED & DISPATCHED"].includes(file.file_status),
    current_queue: queue?.queue_name ?? null,
    responsible_username: queue?.assigned_to ?? (file.allocated ? file.allocated_to
      : ["REGISTERED", "RETURNED-INCOMPLETE"].includes(file.file_status) ? file.entered_by : null),
    responsible_name: file.responsible_name,
    can_view_details: canViewStatusDetails(actor, file),
  };
}
