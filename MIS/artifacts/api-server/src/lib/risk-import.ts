import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { txQuery } from "./postgres";
import { isLocalRuntime } from "./local-runtime";
import {
  assessmentInput, calendarDate, calculateRisk, RiskError, type RiskActor,
  period, cycle, assertEditable, history,
} from "./risk-register";

// Ephemeral signing key: a restart deliberately expires outstanding previews.
const signingKey = randomBytes(32);
const text = (required = false) => z.string().max(8000).refine(
  value => !required || value.trim().length > 0, "Text must not be blank.",
).refine(value => !value.includes("\0"), "Text cannot contain a null character.");
const code = z.string().trim().min(1).max(20);
const rootInput = z.object({
  root_cause: text(true), current_contr: text().optional().default(""),
  mitigations: text(true), due_date: calendarDate,
  action_status: z.string().trim().min(1).max(50),
});
const rowInput = z.object({
  legacy_risk_code: z.string().trim().min(1).max(100),
  depart_code: code, objective_code: code, risk_category: code,
  period_from: calendarDate, period_to: calendarDate,
  risk_title: z.string().max(300).refine(v => v.trim().length > 0 && !v.includes("\0"), "Enter a risk title."),
  risk_description: text(true), risk_consequence: text(true),
  i_rate: assessmentInput.shape.i_rate, l_rate: assessmentInput.shape.l_rate,
  control_effectiveness: assessmentInput.shape.control_effectiveness,
  current_contr: text().optional().default(""),
  desired_contr_effe: text().optional().default(""),
  root_causes: z.array(rootInput).max(50).optional().default([]),
  // Supplied scores are optional, but must agree with the declared factors.
  i_risk_exposure: z.number().nonnegative().max(99999.99).optional(),
  r_risk_exposure: z.number().nonnegative().max(99999.99).optional(),
  i_risk_rate: z.number().nonnegative().max(99999.99).optional(),
  r_risk_rate: z.number().nonnegative().max(99999.99).optional(),
}).superRefine((r, ctx) => {
  if (r.period_from.startsWith("0000") || r.period_to.startsWith("0000"))
    ctx.addIssue({code:"custom",path:["period_from"],message:"Reporting dates must use year 0001 or later."});
  r.root_causes.forEach((root,index) => {
    if (root.due_date.startsWith("0000"))
      ctx.addIssue({code:"custom",path:["root_causes",index,"due_date"],message:"Due dates must use year 0001 or later."});
  });
  if (r.period_from > r.period_to) ctx.addIssue({code:"custom",path:["period_to"],message:"Period end must not precede start."});
  const score = calculateRisk(r.i_rate, r.l_rate, r.control_effectiveness);
  for (const [field, expected] of [["i_risk_exposure", score.inherent], ["r_risk_exposure", score.residual],
    ["i_risk_rate", score.inherent], ["r_risk_rate", score.residual]] as const) {
    if (r[field] !== undefined && Math.abs(r[field]! - expected) > 1e-7)
      ctx.addIssue({code:"custom",path:[field],message:"Supplied score does not match the explicit factors."});
  }
});
type ImportRow = z.infer<typeof rowInput>;
type ValidRow = { input: ImportRow; raw: unknown; period_id: number };
export type PreviewRow = {
  row: number; legacy_risk_code: string; depart_code: string; risk_title: string;
  period_id?: number; inherent?: number; residual?: number; errors: string[]; warnings: string[];
};
export const importEnvironment = () => isLocalRuntime() ? "Local development"
  : process.env.NODE_ENV === "development" ? "Development" : "Production";
export function parseImportSource(source: string): { rawRows: unknown[]; errors: string[] } {
  if (Buffer.byteLength(source, "utf8") > 60 * 1024)
    return {rawRows:[],errors:["Source exceeds 60 KiB. Split the source into smaller batches."]};
  try {
    const doc = JSON.parse(source);
    if (JSON.stringify(doc).includes("\\u0000"))
      return {rawRows:[],errors:["Source cannot contain null characters, including in historical fields."]};
    if (!doc || typeof doc !== "object" || Array.isArray(doc) || !Array.isArray(doc.records))
      return {rawRows:[],errors:["Use a JSON object containing a records array. This importer does not accept client AML ratings."]};
    if (!doc.records.length || doc.records.length > 200)
      return {rawRows:[],errors:["Supply between 1 and 200 departmental risk records."]};
    return {rawRows:doc.records,errors:[]};
  } catch {
    return {rawRows:[],errors:["Invalid JSON. Use the template; encode line breaks inside strings as \\n."]};
  }
}

export async function validateImport(client: PoolClient, source: string) {
  const {rawRows,errors} = parseImportSource(source);
  const rows: PreviewRow[] = [], validRows: ValidRow[] = [];
  if (errors.length) return {rows,errors,validRows,valid:false};
  // Share locks prevent reference retirement while a confirmed transaction inserts.
  const [departments,objectives,categories,statuses,periods,summaries,existing,imported] = await Promise.all([
    txQuery(client,"SELECT depart_code FROM risk.departments WHERE is_active FOR SHARE"),
    txQuery(client,"SELECT depart_code,obj_code FROM risk.objectives WHERE is_active FOR SHARE"),
    txQuery(client,"SELECT category_code FROM risk.categories WHERE is_active FOR SHARE"),
    txQuery(client,"SELECT status_name FROM risk.action_statuses WHERE is_active FOR SHARE"),
    txQuery(client,"SELECT period_id,period_from::text,period_to::text,status FROM risk.periods"),
    txQuery(client,"SELECT depart_code,period_from::text,period_to::text,submitted,reviewed,sign_off,closed FROM risk.department_summary"),
    txQuery(client,"SELECT risk_code FROM risk.risk_master"),
    txQuery(client,"SELECT snapshot->>'legacy_risk_code' AS code FROM risk.register_history WHERE action='LEGACY_IMPORTED'"),
  ]);
  const seen = new Map<string, PreviewRow>();
  for (const [index,raw] of rawRows.entries()) {
    const object = raw && typeof raw === "object" ? raw as Record<string,unknown> : {};
    const parsed = rowInput.safeParse(raw);
    const report: PreviewRow = {
      row:index+1,legacy_risk_code:typeof object.legacy_risk_code === "string" ? object.legacy_risk_code : "",
      depart_code:typeof object.depart_code === "string" ? object.depart_code : "",
      risk_title:typeof object.risk_title === "string" ? object.risk_title : "",
      errors:[],warnings:[],
    };
    rows.push(report);
    if (!parsed.success) {
      report.errors = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`);
      continue;
    }
    const r = parsed.data;
    const key = r.legacy_risk_code.toLowerCase();
    const previous = seen.get(key);
    if (previous) {
      report.errors.push("Duplicate legacy risk code in this batch.");
      previous.errors.push("Duplicate legacy risk code in this batch.");
    }
    seen.set(key,report);
    if (existing.some(e => String(e.risk_code).toLowerCase() === key)
      || imported.some(e => String(e.code).toLowerCase() === key))
      report.errors.push("Risk code already exists or was imported previously. Existing records will not be updated.");
    if (!departments.some(d => d.depart_code === r.depart_code)) report.errors.push("Select an approved active department code.");
    if (!objectives.some(o => o.obj_code === r.objective_code && o.depart_code === r.depart_code))
      report.errors.push("Select an approved objective belonging to this department.");
    if (!categories.some(c => c.category_code === r.risk_category)) report.errors.push("Select an approved active category code.");
    const p = periods.find(p => p.period_from === r.period_from && p.period_to === r.period_to);
    if (!p || p.status !== "OPEN") report.errors.push("Dates must match an existing open reporting period.");
    else {
      report.period_id = Number(p.period_id);
      if (summaries.some(s => s.depart_code === r.depart_code && s.period_from === r.period_from && s.period_to === r.period_to
        && (s.submitted || s.reviewed || s.sign_off || s.closed)))
        report.errors.push("Department register must be open, not submitted, reviewed, signed or closed.");
    }
    for (const [i,root] of r.root_causes.entries()) {
      if (!statuses.some(s => s.status_name === root.action_status))
        report.errors.push(`root_causes.${i}.action_status: Select an approved active status.`);
    }
    const score = calculateRisk(r.i_rate,r.l_rate,r.control_effectiveness);
    report.inherent = score.inherent; report.residual = score.residual;
    report.warnings.push("Insert only. Historical IDs, usernames and workflow flags are provenance only; no signoff or period closure is inferred.");
    if (r.root_causes.length) report.warnings.push("Historical action owners are retained in audit evidence only. Assign current MIS owners after import.");
    validRows.push({input:r,raw,period_id:report.period_id ?? 0});
  }
  return {rows,errors,validRows,valid:rows.every(r => !r.errors.length)};
}

async function sourceDigest(client: PoolClient, actor: string, name: string, source: string) {
  const [db] = await txQuery(client,"SELECT current_database() AS db,inet_server_addr()::text AS host,inet_server_port() AS port");
  return createHash("sha256").update(JSON.stringify([db,importEnvironment(),actor,name,source])).digest("hex");
}
export async function issuePreviewToken(client: PoolClient, actor: string, name: string, source: string) {
  const expires = Date.now() + 15 * 60 * 1000;
  const data = Buffer.from(JSON.stringify({digest:await sourceDigest(client,actor,name,source),expires})).toString("base64url");
  const signature = createHmac("sha256",signingKey).update(data).digest("base64url");
  return {preview_token:`${data}.${signature}`,expires_at:new Date(expires).toISOString()};
}
export async function verifyPreviewToken(client: PoolClient, actor: string, name: string, source: string, token: string) {
  const [data,signature,...extra] = token.split(".");
  const expected = createHmac("sha256",signingKey).update(data ?? "").digest();
  const supplied = Buffer.from(signature ?? "", "base64url");
  if (extra.length || supplied.length !== expected.length || !timingSafeEqual(supplied,expected))
    throw new RiskError(409,"Preview is invalid or expired. Preview this source again.");
  let payload;
  try { payload = JSON.parse(Buffer.from(data,"base64url").toString("utf8")); }
  catch { throw new RiskError(409,"Preview is invalid. Preview this source again."); }
  if (!Number.isFinite(payload.expires) || payload.expires < Date.now()
    || payload.digest !== await sourceDigest(client,actor,name,source))
    throw new RiskError(409,"Source, account or environment changed, or preview expired. Preview again before confirming.");
}

export async function insertImport(client: PoolClient, rows: ValidRow[], actor: RiskActor, source: {source_name:string;source_text:string}) {
  // Shared workflow lock order: all periods first, then their department cycles.
  const periods = new Map<number,Awaited<ReturnType<typeof period>>>();
  for (const id of [...new Set(rows.map(r => r.period_id))].sort((a,b)=>a-b))
    periods.set(id,await period(client,id));
  const scopes = [...new Set(rows.map(r => `${r.period_id}:${r.input.depart_code}`))].sort();
  for (const scope of scopes) {
    const split = scope.indexOf(":"), id = Number(scope.slice(0,split)), department = scope.slice(split+1);
    assertEditable(await cycle(client,department,periods.get(id)!));
  }
  const risk_codes: string[] = [];
  const batch_id = randomBytes(16).toString("hex");
  const source_sha256 = createHash("sha256").update(source.source_text).digest("hex");
  // A batch can span departments. Full source evidence has no department scope:
  // existing history authorization exposes null-department events only to management.
  await history(client,null,null,null,"LEGACY_IMPORT_SOURCE",actor.username,
    `Insert-only legacy source: ${source.source_name}`,{
      batch_id,environment:importEnvironment(),source_name:source.source_name,
      source_sha256,source_text:source.source_text,
    });
  for (const {input:r,raw,period_id} of rows) {
    const score = calculateRisk(r.i_rate,r.l_rate,r.control_effectiveness);
    const [record] = await txQuery(client,`INSERT INTO risk.risk_master
      (risk_code,depart_code,period_from,period_to,objective_code,risk_title,risk_description,
       risk_category,risk_consequence,i_rate,l_rate,i_risk_exposure,i_risk_rate,perceived_rate,
       perceived_contr_eff,r_risk_exposure,r_risk_rate,current_contr,desired_contr_effe,assessment_updated,entered_by)
      VALUES('RK-'||to_char(NOW(),'YYYYMMDD')||'-'||nextval('risk.register_code_seq'),
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,$13,$14,$14,$15,$16,TRUE,$17) RETURNING *`,
    [r.depart_code,r.period_from,r.period_to,r.objective_code,r.risk_title,r.risk_description,
      r.risk_category,r.risk_consequence,r.i_rate,r.l_rate,score.inherent,r.control_effectiveness,
      r.control_effectiveness*100,score.residual,r.current_contr,r.desired_contr_effe,actor.username]);
    const riskCode = String(record.risk_code);
    const roots = [];
    for (const root of r.root_causes) {
      const [saved] = await txQuery(client,`INSERT INTO risk.root_causes
        (risk_code,root_cause,current_contr,mitigations,due_date,action_owner,action_status)
        VALUES($1,$2,$3,$4,$5,NULL,$6) RETURNING *`,
      [riskCode,root.root_cause,root.current_contr,root.mitigations,root.due_date,root.action_status]);
      roots.push(saved);
    }
    await history(client,riskCode,r.depart_code,period_id,"LEGACY_IMPORTED",actor.username,
      `Insert-only legacy import: ${source.source_name}`,{
        batch_id,environment:importEnvironment(),source_name:source.source_name,
        source_sha256,
        // Department-scoped events contain only this row. Full batch text is
        // retained separately in management-only LEGACY_IMPORT_SOURCE history.
        legacy_risk_code:r.legacy_risk_code,raw_source:raw,
        after:record,root_causes:roots,
      });
    risk_codes.push(riskCode);
  }
  return {environment:importEnvironment(),imported:risk_codes.length,risk_codes};
}
