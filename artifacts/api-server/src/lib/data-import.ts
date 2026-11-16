import { randomBytes, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { PoolClient } from "pg";
import { withTransaction } from "./postgres";
import { assignAgentUnit } from "./organisation";
import { validateExtract } from "./data-import-validation";
import { DataImportError, extractDigest, parseExtract, type ExtractKind } from "./data-extract";

const table = "crm.data_import_batches";
const columns = "id,kind,filename,status,created_by,created_at::text,imported_at::text,summary";
export async function getImportBatch(client: PoolClient, id: string) {
  const batch = (await client.query(`SELECT ${columns},results AS rows FROM ${table} WHERE id=$1`, [id])).rows[0];
  if (!batch) throw new DataImportError(404, "Import batch not found.");
  return batch;
}
export const loadImportBatch = (id: string) => withTransaction(client => getImportBatch(client, id));
export const listImportBatches = (kind: ExtractKind) => withTransaction(async client =>
  (await client.query(`SELECT ${columns} FROM ${table} WHERE kind=$1 ORDER BY created_at DESC,id DESC LIMIT 25`, [kind])).rows);

export async function previewImport(kind: ExtractKind, filename: string, content: string, actor: string) {
  filename = filename.split(/[\\/]/).at(-1)!;
  if (!/\.(csv|tsv|txt)$/i.test(filename)) throw new DataImportError(400, "Use a CSV, TSV or TXT extract.");
  const records = parseExtract(kind, content);
  return withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const preview = await validateExtract(client, kind, records);
    const id = randomUUID();
    await client.query(`INSERT INTO ${table}(id,kind,filename,digest,status,created_by,records,results,summary)
      VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)`,
    [id, kind, filename, extractDigest(kind, records), preview.summary.errors ? "BLOCKED" : "VALIDATED", actor,
      JSON.stringify(records), JSON.stringify(preview.rows), JSON.stringify(preview.summary)]);
    return getImportBatch(client, id);
  });
}

export async function commitImport(id: string, actor: { username: string; sub: number }) {
  return withTransaction(async client => {
    // Match the shared agent/hierarchy lock order. Never replace or delete target records.
    await client.query("SELECT pg_advisory_xact_lock(7345202)");
    await client.query("SELECT pg_advisory_xact_lock(82026,55)");
    const batch = (await client.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`, [id])).rows[0];
    if (!batch) throw new DataImportError(404, "Import batch not found.");
    if (batch.status === "IMPORTED") return getImportBatch(client, id);
    // Protect case-insensitive identity checks against simultaneous enrollment or imports.
    await client.query("LOCK TABLE crm.tbl_mis_sales_intermediary,crm.employees,crm.profiles,crm.relationship_managers IN SHARE ROW EXCLUSIVE MODE");
    const allowed = (await client.query(`SELECT 1 FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
      WHERE e.employee_id=$1 AND e.profile_id IN(1,2) AND e.activated AND e.approved
      AND NOT e.is_deleted AND NOT e.employee_locked AND p.is_active`, [actor.sub])).rowCount;
    if (!allowed) throw new DataImportError(403, "An active system administrator must confirm this import.");
    const checked = await validateExtract(client, batch.kind, batch.records);
    const changed = !isDeepStrictEqual(checked.rows, batch.results);
    if (checked.summary.errors || changed) {
      await client.query(`UPDATE ${table} SET status=$2,results=$3::jsonb,summary=$4::jsonb WHERE id=$1`,
        [id, checked.summary.errors ? "BLOCKED" : "VALIDATED", JSON.stringify(checked.rows), JSON.stringify(checked.summary)]);
      return getImportBatch(client, id); // Operator must review changed results and confirm again.
    }
    if (!checked.summary.new) throw new DataImportError(400, "No new records to import. Existing records remain unchanged.");
    const today = (await client.query("SELECT CURRENT_DATE::text AS today")).rows[0].today;
    let imported = 0;
    for (const [index, item] of checked.prepared.entries()) {
      if (checked.rows[index].state !== "NEW") continue;
      const data = item.values;
      if (batch.kind === "relationship-managers") {
        await client.query(`INSERT INTO crm.relationship_managers(re_code,re_name,class_code,c_code,reporting_year,
          is_active,source_batch_id,source_data,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)`,
          [data.re_code,data.re_name,data.class_code,data.c_code,data.reporting_year,data.is_active,id,JSON.stringify(item.record.values),actor.username]);
      } else if (batch.kind === "users") {
        // Intentionally not a valid bcrypt hash: login is impossible until an administrator resets it.
        // No password from an extract, shared default credential, approval or activation is accepted.
        await client.query(`INSERT INTO crm.employees(emp_code,username,password_hash,employee_name,email,mobile_no,
          department,profile_id,activated,approved,last_password_reset,added_by)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,false,false,NULL,$9)`,
        [data.emp_code, data.username, `!IMPORT_DISABLED:${randomBytes(32).toString("hex")}`, data.employee_name,
          data.email, data.mobile_no, data.department, data.profile_id, actor.username]);
      } else {
        const fields = Object.keys(data); // Only fixed server-owned names returned by validateExtract.
        const placeholders = fields.map((_, i) => `$${i + 1}`);
        const source = { source_file: batch.filename, extract_digest: batch.digest, batch_id: id,
          source_line: item.record.line, data: item.record.values, issues: checked.rows[index].warnings };
        const inserted = (await client.query(`INSERT INTO crm.tbl_mis_sales_intermediary
          (${fields.join(",")},registration_status,source_ref,source_imported_at,imported_by,source_data,terminated,suspended)
          VALUES(${placeholders.join(",")},'PENDING',$${fields.length + 1},now(),$${fields.length + 2},
            $${fields.length + 3}::jsonb,$${fields.length + 4},$${fields.length + 5}) RETURNING *`,
        [...fields.map(k => data[k]), data.agent_code, actor.username, JSON.stringify(source),
          data.agent_status === "TERMINATED" ? 1 : 0, data.agent_status === "SUSPENDED"])).rows[0];
        if (item.unitId) await assignAgentUnit(client, inserted, item.unitId, today, `Go-live extract Unit mapping; batch ${id}.`, actor.username);
        if (item.giCode) await client.query("UPDATE crm.tbl_mis_sales_intermediary SET gi_code=$2 WHERE agent_code=$1", [data.agent_code, item.giCode]);
        await client.query(`INSERT INTO crm.intermediary_events(agent_code,action,actor,notes)
          VALUES($1,'FILE_IMPORTED',$2,$3)`, [data.agent_code, actor.username,
          `Data Management import ${id}. Pending MIS registration. ${checked.rows[index].warnings.join(" ")}`]);
      }
      imported++;
    }
    const summary = { ...checked.summary, imported };
    await client.query(`UPDATE ${table} SET status='IMPORTED',imported_by=$2,imported_at=now(),summary=$3::jsonb WHERE id=$1`,
      [id, actor.username, JSON.stringify(summary)]);
    await client.query("INSERT INTO crm.admin_audit_trail(username,action_type,description,page_url) VALUES($1,'DATA_IMPORTED',$2,$3)",
      [actor.username, `Batch ${id}; ${batch.kind}; added ${imported}; skipped ${summary.skipped}.`, `/data-management/${batch.kind}`]);
    return getImportBatch(client, id);
  });
}
