// Development-only, explicitly requested data replacement. No startup/deploy hook.
// Dry run rolls back; --apply requires the exact inspected prior agent count.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { planAgentUpload } from "./agent-upload-plan.mjs";
const require = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
const { Client } = require("pg");
if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT)
  throw Error("Development-only agent replacement.");
const arg = name => {
  const at = process.argv.indexOf(name);
  return at < 0 ? undefined : process.argv[at + 1];
};
const file = arg("--file");
const removeBusiness = arg("--remove-business");
const expectedExisting = Number(arg("--expected-existing"));
const apply = process.argv.includes("--apply");
if (!file || !removeBusiness || !Number.isInteger(expectedExisting) || expectedExisting < 0)
  throw Error("Supply --file, --remove-business and --expected-existing from the inspected replacement plan.");
const plan = planAgentUpload(await readFile(file, "utf8"), file);
const db = new Client({ connectionString: process.env.DATABASE_URL });
const actor = "system:user-request-agent-replacement";
const businessChildren = [
  "business_notifications", "business_doc_checklist", "business_work_items",
  "cashier_reviews", "gi_reviews", "medical_hpc_registrations", "medical_underwriting_reviews",
  "pricing_reviews", "record_filing_reviews", "business_tracking_notes", "business_uploads",
];
// Deletion order follows foreign keys; no CASCADE, TRUNCATE or disabled guards.
const agentChildren = [
  "agent_unit_assignments", "intermediary_mappings", "intermediary_documents",
  "intermediary_directors", "intermediary_licences", "intermediary_events",
];
let connected = false;
try {
  await db.connect(); connected = true;
  await db.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  await db.query("SELECT pg_advisory_xact_lock(7345202)");
  await db.query("SELECT pg_advisory_xact_lock(82026,55)");
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [removeBusiness]);
  await db.query("LOCK TABLE crm.tbl_mis_sales_intermediary,crm.business_tracking IN SHARE ROW EXCLUSIVE MODE");
  const oldCodes = (await db.query("SELECT agent_code FROM crm.tbl_mis_sales_intermediary ORDER BY agent_code FOR UPDATE")).rows.map(row => row.agent_code);
  if (oldCodes.length !== expectedExisting) throw Error("The current agent count changed. Inspect again before replacing any data.");
  const affectedBusiness = (await db.query(
    "SELECT file_no FROM crm.business_tracking WHERE agent_id=ANY($1::text[]) ORDER BY file_no FOR UPDATE",
    [oldCodes])).rows;
  if (affectedBusiness.length !== 1 || affectedBusiness[0].file_no !== removeBusiness)
    throw Error("Linked business records changed; refusing to delete an unapproved file.");
  const unaffectedDigest = async () => {
    const result = {};
    for (const table of [...businessChildren, "business_tracking"]) {
      result[table] = (await db.query(`SELECT count(*)::int count,
        md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY to_jsonb(t)::text),'')) digest
        FROM crm.${table} t WHERE file_no IS DISTINCT FROM $1`, [removeBusiness])).rows[0];
    }
    return JSON.stringify(result);
  };
  const beforeUnrelated = await unaffectedDigest();
  // Source-preservation metadata is additive and participates in the same transaction.
  await db.query(await readFile(new URL("../../lib/db/migrations/0071_agent_upload_source_data.sql", import.meta.url), "utf8"));
  const removed = {};
  for (const table of businessChildren) {
    removed[table] = (await db.query(`DELETE FROM crm.${table} WHERE file_no=$1`, [removeBusiness])).rowCount;
  }
  removed.business_tracking = (await db.query("DELETE FROM crm.business_tracking WHERE file_no=$1", [removeBusiness])).rowCount;
  if (removed.business_tracking !== 1) throw Error("Expected exactly the approved linked business.");
  for (const table of agentChildren) {
    const predicate = table === "intermediary_mappings"
      ? "from_code=ANY($1::text[]) OR to_code=ANY($1::text[])" : "agent_code=ANY($1::text[])";
    removed[table] = (await db.query(`DELETE FROM crm.${table} WHERE ${predicate}`, [oldCodes])).rowCount;
  }
  removed.agents = (await db.query("DELETE FROM crm.tbl_mis_sales_intermediary WHERE agent_code=ANY($1::text[])", [oldCodes])).rowCount;
  if (removed.agents !== expectedExisting) throw Error("Agent cleanup count did not match the inspected scope.");
  const columns = [
    "agent_code", "agent_name", "agent_type", "receive_date", "contract_date", "user_id",
    "unit_code", "branch_code", "region_code", "email", "mobile_no", "hrmis_code",
    "pin_no", "rms_code_corp", "rms_code_ret", "gi_code", "agent_status",
    "registration_status", "source_ref", "source_data",
  ];
  const added = await db.query(`INSERT INTO crm.tbl_mis_sales_intermediary
    (${columns.join(",")},source_imported_at,imported_by,terminated,suspended,etims_verified,version)
    SELECT ${columns.map(column => `r.${column}`).join(",")},now(),$2,0,false,false,1
    FROM jsonb_populate_recordset(NULL::crm.tbl_mis_sales_intermediary,$1::jsonb) r
    RETURNING agent_code`, [JSON.stringify(plan.rows), actor]);
  if (added.rowCount !== plan.rows.length) throw Error("Not all uploaded agents were inserted.");
  await db.query(`INSERT INTO crm.intermediary_events(agent_code,action,notes,actor)
    SELECT agent_code,'FILE_IMPORTED',
      'Imported from the user-approved replacement list; complete MIS registration.' ||
      CASE WHEN jsonb_array_length(source_data->'issues')>0 THEN ' Source data needs review: ' ||
        (SELECT string_agg(value,' ') FROM jsonb_array_elements_text(source_data->'issues')) ELSE '' END,
      $1 FROM crm.tbl_mis_sales_intermediary`, [actor]);
  // Exact per-row verification: long IDs, leading zeros, dates and all 22 raw fields.
  const verify = (await db.query(`SELECT count(*)::int matched FROM crm.tbl_mis_sales_intermediary a
    JOIN jsonb_populate_recordset(NULL::crm.tbl_mis_sales_intermediary,$1::jsonb) r USING(agent_code)
    WHERE ${columns.filter(column => column !== "agent_code").map(column => `a.${column} IS NOT DISTINCT FROM r.${column}`).join(" AND ")}
      AND a.organisation_unit_id IS NULL AND a.version=1`, [JSON.stringify(plan.rows)])).rows[0].matched;
  const actual = (await db.query("SELECT count(*)::int total FROM crm.tbl_mis_sales_intermediary")).rows[0].total;
  if (verify !== plan.rows.length || actual !== plan.rows.length) throw Error("The saved agent list did not match the upload exactly.");
  if (await unaffectedDigest() !== beforeUnrelated) throw Error("Unrelated business data changed; rolling back.");
  await db.query(`INSERT INTO crm.admin_audit_trail(username,action_type,description) VALUES($1,'AGENT_LIST_REPLACED',$2)`,
    [actor, JSON.stringify({ source_sha256: plan.digest, removed, imported: added.rowCount,
      removed_business: removeBusiness, invalid_source_emails: plan.invalidEmails })]);
  await db.query(apply ? "COMMIT" : "ROLLBACK");
  console.log(JSON.stringify({
    applied: apply, imported: added.rowCount, matched: verify, removed,
    pending_registration: actual, invalid_source_emails: plan.invalidEmails,
    unrelated_business_data_unchanged: true, source_sha256: plan.digest,
  }, null, 2));
} catch (error) {
  if (connected) await db.query("ROLLBACK");
  throw error;
} finally {
  if (connected) await db.end();
}
