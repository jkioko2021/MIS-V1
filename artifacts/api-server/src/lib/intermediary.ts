import { z } from "zod";
import type { PoolClient } from "pg";
import { query, queryOne, withTransaction } from "./postgres";
import { UpdateIntermediaryBody, ActionIntermediaryBody, GetIntermediaryResponse } from "@workspace/api-zod";

export class IntermediaryError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const salesAdminName = (name: string) => name.trim().toLowerCase() === "national sales admin";
export async function canManageIntermediaries(profileId: number) {
  const p = await queryOne<{ profile_name: string; is_active: boolean }>(
    "SELECT profile_name,is_active FROM crm.profiles WHERE profile_id=$1", [profileId]);
  return !!p?.is_active && ([1, 2].includes(profileId) || salesAdminName(p.profile_name));
}
const master = "crm.tbl_mis_sales_intermediary";
export const masterColumns = ["agent_name", "agent_type", "receive_date", "contract_date", "user_id",
  "unit_code", "branch_code", "region_code", "email", "mobile_no", "secondary_mobile", "hrmis_code",
  "pin_no", "nid_no", "rms_code_corp", "rms_code_ret", "gi_code", "commission_rate", "pay_mode", "etims_verified"] as const;
export const agentSelect = `*, receive_date::text AS receive_date,contract_date::text AS contract_date,
  terminate_date::text AS terminate_date,commission_rate::float8 AS commission_rate,'Agent master record' AS notes`;
export const agentCode = z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/);
const calendar = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}, "Use a valid calendar date (YYYY-MM-DD).");
const required = (value: unknown, label: string, max = 4000) => {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new IntermediaryError(400, `${label} is required (maximum ${max} characters).`);
  return value.trim();
};
function email(value: unknown) {
  if (value != null && value !== "" && !z.string().email().safeParse(value).success)
    throw new IntermediaryError(400, "Enter a valid email address.");
}
function dates(value: unknown) {
  if (value != null && value !== "" && !calendar.safeParse(value).success)
    throw new IntermediaryError(400, "Use valid dates in YYYY-MM-DD format.");
}
export function parseMaster(body: unknown) {
  const data = UpdateIntermediaryBody.parse(body);
  data.agent_code = agentCode.parse(data.agent_code);
  data.agent_name = required(data.agent_name, "Agent name", 250);
  data.agent_type = required(data.agent_type, "Agent type", 50);
  data.notes = required(data.notes, "Notes");
  email(data.email); dates(data.receive_date); dates(data.contract_date);
  for (const key of masterColumns) {
    if (typeof data[key] === "string") {
      (data as Record<string, unknown>)[key] = (data[key] as string).trim() || null;
    }
  }
  return data;
}
async function audit(client: PoolClient, code: string, action: string, actor: string, notes: string) {
  await client.query(`INSERT INTO crm.intermediary_events(agent_code,action,actor,notes) VALUES($1,$2,$3,$4)`,
    [code, action, actor, notes]);
}
export async function detail(code: string) {
  const agent = await queryOne(`SELECT ${agentSelect} FROM ${master} WHERE agent_code=$1`, [code]);
  if (!agent) throw new IntermediaryError(404, "Agent not found.");
  const [licences, directors, events, documents, mappings] = await Promise.all([
    query(`SELECT *,valid_from::text AS valid_from,valid_to::text AS valid_to FROM crm.intermediary_licences
      WHERE agent_code=$1 ORDER BY licence_id DESC`, [code]),
    query("SELECT * FROM crm.intermediary_directors WHERE agent_code=$1 ORDER BY director_id", [code]),
    query(`SELECT *,event_id::text AS event_id,created_at::text AS created_at FROM crm.intermediary_events
      WHERE agent_code=$1 ORDER BY crm.intermediary_events.event_id DESC`, [code]),
    query(`SELECT document_id,title,file_name,file_size,uploaded_by,created_at::text AS created_at
      FROM crm.intermediary_documents WHERE agent_code=$1 AND confirmed ORDER BY document_id DESC`, [code]),
    query(`SELECT m.*,a.agent_name AS to_name FROM crm.intermediary_mappings m
      JOIN ${master} a ON a.agent_code=m.to_code WHERE m.from_code=$1 OR m.to_code=$1`, [code]),
  ]);
  return GetIntermediaryResponse.parse({ agent, licences, directors, events, documents, mappings });
}
export async function saveMaster(body: unknown, actor: string, code?: string) {
  if (!code) throw new IntermediaryError(405, "Agents must be imported from the core system, not created in MIS.");
  const data = parseMaster(body);
  if (code && data.agent_code !== code) throw new IntermediaryError(400, "Agent codes cannot be changed.");
  await withTransaction(async client => {
    if (code) {
      const current = (await client.query(`SELECT agent_name,user_id,registration_status FROM ${master}
        WHERE agent_code=$1 FOR UPDATE`, [code])).rows[0];
      if (!current) throw new IntermediaryError(404, "Agent not found.");
      if (current.registration_status === "PENDING" && (data.agent_name !== current.agent_name
        || (Object.hasOwn(data, "user_id") && data.user_id !== current.user_id)))
        throw new IntermediaryError(400, "The imported agent name and core user ID cannot be changed during registration.");
      if (!Number.isInteger(data.version)) throw new IntermediaryError(400, "Reload the current agent before editing.");
      // Omitted optional fields do not silently erase an existing value.
      const fields = masterColumns.filter(k => Object.hasOwn(data, k));
      const result = await client.query(`UPDATE ${master}
        SET ${fields.map((k, i) => `${k}=$${i + 1}`).join(",")},version=version+1
        WHERE agent_code=$${fields.length + 1} AND version=$${fields.length + 2} RETURNING agent_code`,
      [...fields.map(k => data[k]), code, data.version]);
      if (!result.rowCount) throw new IntermediaryError(409, "Agent changed or was removed. Reload before saving.");
    }
    await audit(client, data.agent_code, code ? "DETAILS_UPDATED" : "REGISTERED", actor, data.notes);
  });
  return detail(data.agent_code);
}
export async function performAction(code: string, body: unknown, actor: string) {
  const data = ActionIntermediaryBody.parse(body);
  const notes = required(data.notes, "Reason / notes");
  await withTransaction(async client => {
    // Serializes mapping graph edits and prevents reciprocal mapping deadlocks.
    await client.query("SELECT pg_advisory_xact_lock(7345201)");
    const row = (await client.query(`SELECT * FROM ${master} WHERE agent_code=$1 FOR UPDATE`, [code])).rows[0];
    if (!row) throw new IntermediaryError(404, "Agent not found.");
    if (row.version !== data.version) throw new IntermediaryError(409, "Agent changed. Reload before taking action.");
    let auditAction: string = data.action;
    if (data.action === "COMPLETE_REGISTRATION") {
      if (row.registration_status !== "PENDING" || !row.source_ref)
        throw new IntermediaryError(409, "Only a pending core-imported agent can complete registration.");
      if (row.terminated || row.suspended)
        throw new IntermediaryError(400, "A suspended or terminated agent cannot complete registration.");
      const missing = ["unit_code", "region_code", "receive_date", "contract_date", "mobile_no"]
        .filter(k => !row[k]);
      if (missing.length) throw new IntermediaryError(400, `Complete the MIS details first: ${missing.join(", ")}.`);
      const verified = await client.query(`SELECT 1 FROM crm.intermediary_licences WHERE agent_code=$1
        AND status='VERIFIED' AND valid_from<=CURRENT_DATE AND valid_to>=CURRENT_DATE LIMIT 1`, [code]);
      if (!verified.rowCount) throw new IntermediaryError(400, "A currently valid verified licence is required to complete registration.");
      const docs = await client.query("SELECT 1 FROM crm.intermediary_documents WHERE agent_code=$1 AND confirmed LIMIT 1", [code]);
      if (!docs.rowCount) throw new IntermediaryError(400, "Upload supporting documents before completing registration.");
      await client.query(`UPDATE ${master} SET registration_status='COMPLETED',agent_status='ACTIVE'
        WHERE agent_code=$1`, [code]);
    } else if (["SUSPEND", "TERMINATE", "REACTIVATE"].includes(data.action)) {
      if (row.registration_status === "PENDING")
        throw new IntermediaryError(400, "Complete imported agent registration before changing its active status.");
      const status = data.action === "SUSPEND" ? "SUSPENDED" : data.action === "TERMINATE" ? "TERMINATED" : "ACTIVE";
      if (row.agent_status === status) throw new IntermediaryError(409, `Agent is already ${status.toLowerCase()}.`);
      await client.query(`UPDATE ${master} SET agent_status=$2::text,suspended=$3,terminated=$4::smallint,
        terminate_date=CASE WHEN $4::smallint=1 THEN CURRENT_DATE WHEN $2::text='ACTIVE' THEN NULL ELSE terminate_date END
        WHERE agent_code=$1`, [code, status, status === "SUSPENDED", status === "TERMINATED" ? 1 : 0]);
    } else if (data.action === "MAP") {
      const target = agentCode.parse(data.to_code);
      if (code === target) throw new IntermediaryError(400, "An agent cannot be mapped to itself.");
      const t = (await client.query(`SELECT * FROM ${master} WHERE agent_code=$1 FOR UPDATE`, [target])).rows[0];
      if (!t || t.terminated || t.suspended || t.agent_status !== "ACTIVE")
        throw new IntermediaryError(400, "Choose an active target agent.");
      const cycle = await client.query(`WITH RECURSIVE chain(code) AS (
        SELECT $1::varchar UNION SELECT m.to_code FROM crm.intermediary_mappings m JOIN chain c ON m.from_code=c.code)
        SELECT 1 FROM chain WHERE code=$2`, [target, code]);
      if (cycle.rowCount) throw new IntermediaryError(400, "This mapping would create a circular relationship.");
      await client.query(`INSERT INTO crm.intermediary_mappings(from_code,to_code,mapped_by)
        VALUES($1,$2,$3) ON CONFLICT(from_code) DO UPDATE SET to_code=$2,mapped_by=$3,mapped_at=now()`, [code, target, actor]);
      auditAction = `MAPPED_TO_${target}`;
    } else if (data.action === "UNMAP") {
      const result = await client.query("DELETE FROM crm.intermediary_mappings WHERE from_code=$1 RETURNING to_code", [code]);
      if (!result.rowCount) throw new IntermediaryError(409, "This agent has no outgoing mapping.");
      auditAction = `UNMAPPED_FROM_${result.rows[0].to_code}`;
    } else if (data.action === "SAVE_DIRECTOR") {
      const name = required(data.name, "Director name", 250); email(data.email);
      const values = [name, data.email || null, data.mobile_no || null, data.nid_no || null, data.pin_no || null];
      if (data.director_id) {
        const r = await client.query(`UPDATE crm.intermediary_directors
          SET name=$1,email=$2,mobile_no=$3,nid_no=$4,pin_no=$5,version=version+1
          WHERE agent_code=$6 AND director_id=$7 AND version=$8`,
          [...values, code, data.director_id, data.director_version]);
        if (!r.rowCount) throw new IntermediaryError(409, "Director changed or not found. Reload before saving.");
      } else {
        await client.query(`INSERT INTO crm.intermediary_directors(name,email,mobile_no,nid_no,pin_no,agent_code)
          VALUES($1,$2,$3,$4,$5,$6)`, [...values, code]);
      }
    } else if (data.action === "SAVE_LICENCE") {
      if (row.terminated || row.suspended) throw new IntermediaryError(400, "Reactivate this agent before updating licences.");
      const no = required(data.licence_no, "Licence number", 100);
      const from = calendar.parse(data.valid_from), to = calendar.parse(data.valid_to);
      if (to < from) throw new IntermediaryError(400, "Licence expiry must not precede its start date.");
      const v = [no, from, to, !!data.ira_compliant, !!data.kyc_compliant, !!data.contract_signed, actor, code];
      if (data.licence_id) {
        const r = await client.query(`UPDATE crm.intermediary_licences SET licence_no=$1,valid_from=$2,
          valid_to=$3,ira_compliant=$4,kyc_compliant=$5,contract_signed=$6,entered_by=$7,
          status='DRAFT',reviewed_by=NULL,reviewed_at=NULL WHERE agent_code=$8 AND licence_id=$9
          AND status IN ('DRAFT','DECLINED')`, [...v, data.licence_id]);
        if (!r.rowCount) throw new IntermediaryError(409, "Only draft or declined licences can be edited.");
      } else {
        await client.query(`INSERT INTO crm.intermediary_licences(licence_no,valid_from,valid_to,
          ira_compliant,kyc_compliant,contract_signed,entered_by,agent_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, v);
      }
    } else if (["SUBMIT_LICENCE", "VERIFY_LICENCE", "DECLINE_LICENCE"].includes(data.action)) {
      const l = (await client.query(`SELECT *,valid_to < CURRENT_DATE AS expired,valid_from > CURRENT_DATE AS future
        FROM crm.intermediary_licences WHERE agent_code=$1 AND licence_id=$2 FOR UPDATE`, [code, data.licence_id])).rows[0];
      if (!l) throw new IntermediaryError(404, "Licence not found for this agent.");
      if (row.terminated || row.suspended) throw new IntermediaryError(400, "Reactivate this agent before processing licences.");
      const submitting = data.action === "SUBMIT_LICENCE";
      if (submitting ? !["DRAFT", "DECLINED"].includes(l.status) : l.status !== "SUBMITTED")
        throw new IntermediaryError(409, "Licence is no longer at the required workflow stage.");
      if (submitting) {
        const docs = await client.query("SELECT 1 FROM crm.intermediary_documents WHERE agent_code=$1 AND confirmed LIMIT 1", [code]);
        if (!docs.rowCount) throw new IntermediaryError(400, "Upload a supporting document before submitting the licence.");
      }
      if (data.action === "VERIFY_LICENCE") {
        if (l.entered_by === actor) throw new IntermediaryError(403, "Another authorized user must verify this licence.");
        if (!l.ira_compliant || !l.kyc_compliant || !l.contract_signed || l.expired || l.future)
          throw new IntermediaryError(400, "Verification requires a currently valid licence, IRA/KYC compliance and signed contract.");
      }
      const status = submitting ? "SUBMITTED" : data.action === "VERIFY_LICENCE" ? "VERIFIED" : "DECLINED";
      await client.query(`UPDATE crm.intermediary_licences SET status=$2,
        entered_by=CASE WHEN $2='SUBMITTED' THEN $3 ELSE entered_by END,
        reviewed_by=CASE WHEN $2='SUBMITTED' THEN NULL ELSE $3 END,
        reviewed_at=CASE WHEN $2='SUBMITTED' THEN NULL ELSE now() END WHERE licence_id=$1`, [l.licence_id, status, actor]);
      auditAction = `${data.action}: ${l.licence_no}`;
    }
    await client.query(`UPDATE ${master} SET version=version+1 WHERE agent_code=$1`, [code]);
    await audit(client, code, auditAction, actor, notes);
  });
  return detail(code);
}
