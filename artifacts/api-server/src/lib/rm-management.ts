import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { RmManagerInput, RmTransferInput, GetRmAgentsParams } from "@workspace/api-zod";
import { withTransaction } from "./postgres";
import { DataImportError } from "./data-extract";
import { rmOrganisationChoices, resolveRmOrgScope, rmEffectiveUnitCodeSql } from "./rm-organisation-scope";

type Actor = { sub: number };
const fail = (status: number, message: string): never => { throw new DataImportError(status, message); };
const column = (category: string) => category === "C" ? "rms_code_corp" : "rms_code_ret";
export async function requireRmAccess(client: PoolClient, actor: Actor) {
  const row = (await client.query(`SELECT e.username FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE e.employee_id=$1 AND e.activated AND e.approved AND NOT e.is_deleted AND NOT e.employee_locked
    AND p.is_active AND (e.profile_id IN(1,2) OR lower(btrim(p.profile_name))='retention admin')`, [actor.sub])).rows[0];
  if (!row) fail(403, "RM_RE Management requires Retention Admin or system administrator access.");
  return row.username as string;
}
const managersSql = `SELECT r.re_code AS code,r.re_name AS name,r.class_code,r.c_code AS category,
  r.reporting_year AS year,r.is_active AS active,r.version,
  coalesce(r.reporting_year=(SELECT max(x.reporting_year) FROM crm.relationship_managers x WHERE x.re_code=r.re_code
    AND x.c_code=r.c_code AND x.reporting_year<=extract(year FROM CURRENT_DATE)),false) AS is_current,
  CASE WHEN r.reporting_year=(SELECT max(x.reporting_year) FROM crm.relationship_managers x WHERE x.re_code=r.re_code
    AND x.c_code=r.c_code AND x.reporting_year<=extract(year FROM CURRENT_DATE))
    THEN (SELECT count(*)::int FROM crm.tbl_mis_sales_intermediary a
      WHERE btrim(CASE WHEN r.c_code='C' THEN a.rms_code_corp ELSE a.rms_code_ret END)=r.re_code) ELSE 0 END AS agent_count
  FROM crm.relationship_managers r`;
async function audit(client: PoolClient, action: string, actor: string, reason: string, description: string,
  before: unknown, after: unknown, agentCode: string | null = null, batchId: string | null = null) {
  await client.query(`INSERT INTO crm.rm_management_events(action,actor,reason,description,before_data,after_data,agent_code,batch_id)
    VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)`, [action,actor,reason,description,
      JSON.stringify(before),JSON.stringify(after),agentCode,batchId]);
}
const cleanCode = (raw: string) => {
  const code = raw.trim();
  if (!/^[a-zA-Z0-9_\/-]{1,32}$/.test(code)) fail(400, "Use a manager code of 1–32 letters, digits, slashes, hyphens or underscores.");
  return code;
};
const cleanReason = (raw: string) => {
  const reason = raw.trim();
  if (reason.length < 3 || reason.length > 1000) fail(400, "Enter a change reason of 3–1,000 characters.");
  return reason;
};
export async function rmSnapshot(actor: Actor) {
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireRmAccess(client, actor);
    const managers = (await client.query(`${managersSql} ORDER BY r.c_code,r.re_name,r.reporting_year DESC,r.re_code`)).rows;
    const history = (await client.query(`SELECT id::text,action,actor,reason,description,
      to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
      FROM crm.rm_management_events ORDER BY created_at DESC,id DESC LIMIT 100`)).rows;
    const year = (await client.query("SELECT extract(year FROM CURRENT_DATE)::int AS year")).rows[0].year;
    return { year, managers, history, organisation: await rmOrganisationChoices(client) };
  });
}
const agentSelect = (category: string) => `SELECT a.agent_code AS code,a.agent_name AS name,
  nullif(btrim(a.${column(category)}),'') AS current_code,a.version,
  (SELECT r.re_name FROM crm.relationship_managers r WHERE r.re_code=btrim(a.${column(category)})
    AND r.c_code=$1 AND r.reporting_year<=extract(year FROM CURRENT_DATE) ORDER BY r.reporting_year DESC LIMIT 1) AS current_name
  FROM crm.tbl_mis_sales_intermediary a`;
export async function rmAgents(params: GetRmAgentsParams, actor: Actor) {
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireRmAccess(client, actor);
    if (params.unassigned && params.manager_code) fail(400, "Choose either a manager filter or unassigned agents.");
    const scope = await resolveRmOrgScope(client,params);
    const conditions = ` WHERE ($2::text IS NULL OR btrim(a.${column(params.category)})=$2)
      AND (NOT $3::boolean OR nullif(btrim(a.${column(params.category)}),'') IS NULL)
      AND ($4::text='' OR position(lower($4) IN lower(a.agent_code||' '||a.agent_name))>0)
      AND ($5::text[] IS NULL OR ${rmEffectiveUnitCodeSql}=ANY($5::text[]))`;
    const args = [params.category, params.manager_code?.trim() || null, params.unassigned === true, params.search?.trim() ?? "",scope.unitCodes];
    const page = params.page ?? 1;
    const items = (await client.query(`${agentSelect(params.category)}${conditions} ORDER BY a.agent_name,a.agent_code LIMIT 25 OFFSET $6`, [...args, (page-1)*25])).rows;
    // Include category in the count through a harmless typed condition so binding remains aligned.
    const total = (await client.query(`SELECT count(*)::int total FROM crm.tbl_mis_sales_intermediary a${conditions} AND $1::text IN('C','R')`, args)).rows[0].total;
    return { items, total, page, page_size: 25 };
  });
}
async function rmWrite<T>(actor: Actor, fn: (client: PoolClient, username: string) => Promise<T>) {
  return withTransaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(7345202)");
    await client.query("SELECT pg_advisory_xact_lock(82026,55)");
    return fn(client, await requireRmAccess(client, actor));
  });
}
export async function saveRm(input: RmManagerInput, actor: Actor) {
  return rmWrite(actor, async (client, username) => {
    const code = cleanCode(input.code), reason = cleanReason(input.reason);
    const name = input.name.trim(), classCode = input.class_code.trim();
    if (!name || !classCode) fail(400, "Manager name and class code are required.");
    const key = [code,input.category,input.year];
    const existing = (await client.query(`SELECT * FROM crm.relationship_managers
      WHERE re_code=$1 AND c_code=$2 AND reporting_year=$3 FOR UPDATE`, key)).rows[0];
    if (input.version === 0 && existing) fail(409, "This manager code/category/year already exists. Edit the existing record.");
    if (input.version > 0 && !existing) fail(404, "Manager reference not found.");
    if (existing && existing.version !== input.version) fail(409, "This manager changed. Refresh before editing.");
    const before = (await client.query(`${managersSql} WHERE r.re_code=$1 AND r.c_code=$2 AND r.reporting_year=$3`, key)).rows[0];
    if (!input.active && before?.is_current && before.agent_count > 0)
      fail(409, "Transfer the assigned agents to another active manager before deactivating this manager.");
    if (existing) await client.query(`UPDATE crm.relationship_managers SET re_name=$4,class_code=$5,is_active=$6,version=version+1
      WHERE re_code=$1 AND c_code=$2 AND reporting_year=$3`, [...key,name,classCode,input.active]);
    else await client.query(`INSERT INTO crm.relationship_managers(re_code,c_code,reporting_year,re_name,class_code,is_active,source_data,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`, [...key,name,classCode,input.active,JSON.stringify({ origin:"RM_RE Management" }),username]);
    const after = (await client.query(`${managersSql} WHERE r.re_code=$1 AND r.c_code=$2 AND r.reporting_year=$3`, key)).rows[0];
    if (!after.active && after.is_current && after.agent_count > 0)
      fail(409, "Transfer the assigned agents before creating an inactive replacement for this manager.");
    await audit(client, !existing ? "MANAGER_ADDED" : input.active !== existing.is_active
      ? input.active ? "MANAGER_ACTIVATED" : "MANAGER_DEACTIVATED" : "MANAGER_MODIFIED",
    username,reason,`${input.category==='C'?'Corporate':'Retail'} manager ${name} (${code}), ${input.year}.`,before ?? null,after);
    return after;
  });
}
async function targetManager(client: PoolClient, code: string, category: string) {
  const target = (await client.query(`${managersSql} WHERE r.re_code=$1 AND r.c_code=$2
    AND r.reporting_year<=extract(year FROM CURRENT_DATE) ORDER BY r.reporting_year DESC LIMIT 1`, [code,category])).rows[0];
  if (!target?.active || !target.is_current) fail(400, "Select an active manager in the chosen business category and current applicable year.");
  return target;
}
async function transferResult(client: PoolClient, id: string) {
  const row = (await client.query(`SELECT *,to_char(expires_at AT TIME ZONE 'UTC',
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS expires_text FROM crm.rm_transfer_previews WHERE id=$1`, [id])).rows[0];
  if (!row) fail(404, "Transfer preview not found.");
  return { id, category:row.input.category,target_name:row.target.name,total:row.results.length,
    changes:row.results.filter((r: any)=>r.will_change).length,expires_at:row.expires_text,status:row.status,items:row.results,
    scope_label:row.input.scope_label ?? null };
}
export async function previewTransfer(input: RmTransferInput, actor: Actor) {
  return rmWrite(actor, async (client) => {
    const targetCode = cleanCode(input.to_code), reason = cleanReason(input.reason);
    const target = await targetManager(client,targetCode,input.category);
    const scope = await resolveRmOrgScope(client,input);
    const fromCode = input.from_code?.trim() || null;
    if (input.mode === "ALL" && fromCode === targetCode) fail(400, "Choose a different target manager.");
    const codes = [...new Set(input.agent_codes)];
    if (input.mode === "SELECTED" && !codes.length) fail(400, "Select at least one agent.");
    if (input.mode !== "SELECTED" && codes.length) fail(400, "Bulk mode does not accept a separate agent selection.");
    if (input.mode === "GROUP" && (!scope.unitCodes || fromCode))
      fail(400,"Choose a Region, Branch or Unit for group assignment, without a source-manager restriction.");
    const selected = (await client.query(`${agentSelect(input.category)} WHERE ${
      input.mode === "SELECTED" ? "a.agent_code=ANY($2::text[])" :
        input.mode === "GROUP" ? "$2::text IS NULL"
          : `coalesce(nullif(btrim(a.${column(input.category)}),''),'')=coalesce($2::text,'')`
    } AND ($3::text[] IS NULL OR ${rmEffectiveUnitCodeSql}=ANY($3::text[]))
      ORDER BY a.agent_code LIMIT 5001`, [input.category,input.mode==="SELECTED" ? codes : input.mode==="GROUP" ? null : fromCode,scope.unitCodes])).rows;
    if (input.mode === "SELECTED" && selected.length !== codes.length) fail(409, "Some selected agents are missing or outside the selected organisational group. Refresh the list.");
    if (!selected.length || selected.length > 5000) fail(400, "Choose between 1 and 5,000 agents per transfer.");
    const rows = selected.map(a => ({...a,will_change:a.current_code!==targetCode}));
    if (!rows.some(a=>a.will_change)) fail(400, "All selected agents already have this manager.");
    const id = randomUUID();
    await client.query(`INSERT INTO crm.rm_transfer_previews(id,created_by,input,target,results)
      VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb)`, [id,actor.sub,JSON.stringify({...input,reason,to_code:targetCode,from_code:fromCode,
        scope_label:scope.label}),JSON.stringify(target),JSON.stringify(rows)]);
    return transferResult(client,id);
  });
}
export async function commitTransfer(id: string, actor: Actor) {
  return rmWrite(actor, async (client, username) => {
    const preview = (await client.query(`SELECT *,expires_at<=now() AS expired FROM crm.rm_transfer_previews WHERE id=$1 FOR UPDATE`, [id])).rows[0];
    if (!preview || preview.created_by !== actor.sub) fail(404, "Transfer preview not found for your account.");
    if (preview.status === "COMMITTED") return transferResult(client,id);
    if (preview.expired) fail(409, "This preview expired. Preview the transfer again.");
    const { category, to_code, reason } = preview.input;
    const target = await targetManager(client,to_code,category);
    if (target.version !== preview.target.version || target.year !== preview.target.year)
      fail(409, "The target manager changed. Preview again.");
    let scope;
    try { scope = await resolveRmOrgScope(client,preview.input); }
    catch(error) {
      if(error instanceof DataImportError && error.status===400) fail(409,"The selected hierarchy changed. Preview again.");
      throw error;
    }
    const codes = preview.results.map((r: any)=>r.code);
    const locked = (await client.query(`SELECT a.agent_code,a.version,a.${column(category)} AS current_code,
      ${rmEffectiveUnitCodeSql} AS org_unit_code
      FROM crm.tbl_mis_sales_intermediary a WHERE a.agent_code=ANY($1::text[]) ORDER BY a.agent_code FOR UPDATE OF a`, [codes])).rows;
    if (locked.length !== codes.length) fail(409, "An agent was removed. Preview again.");
    for (const row of preview.results) {
      const actual = locked.find(a=>a.agent_code===row.code);
      if (!actual || actual.version!==row.version || (actual.current_code?.trim() || null)!==row.current_code)
        fail(409, "An agent's details or assignment changed. No agents were moved; preview again.");
      if (scope.unitCodes && !scope.unitCodes.includes(actual.org_unit_code))
        fail(409,"An agent moved outside the selected organisational group. No agents were moved; preview again.");
    }
    for (const row of preview.results.filter((r: any)=>r.will_change)) {
      await client.query(`UPDATE crm.tbl_mis_sales_intermediary SET ${column(category)}=$2,version=version+1 WHERE agent_code=$1`, [row.code,to_code]);
      const description = `${category==='C'?'Corporate':'Retail'}: ${row.name} (${row.code}), ${row.current_name ?? row.current_code ?? 'Unassigned'} → ${target.name}.${preview.input.scope_label ? ` ${preview.input.scope_label}.` : ''}`;
      await audit(client,"AGENT_REASSIGNED",username,reason,description,row,{...row,current_code:to_code,current_name:target.name},row.code,id);
      await client.query(`INSERT INTO crm.intermediary_events(agent_code,action,actor,notes) VALUES($1,'RM_REASSIGNED',$2,$3)`,
        [row.code,username,`${description} ${reason}`]);
    }
    await client.query("UPDATE crm.rm_transfer_previews SET status='COMMITTED',committed_at=now() WHERE id=$1", [id]);
    return transferResult(client,id);
  });
}
