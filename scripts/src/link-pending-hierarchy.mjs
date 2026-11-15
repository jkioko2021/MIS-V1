// Explicit development-only application of the user's approved pending-setup strategy.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { planPendingHierarchy } from "./pending-hierarchy-plan.mjs";
const require = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
const { Client } = require("pg");
if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT)
  throw Error("Pending hierarchy loading is development-only.");
const apply = process.argv.includes("--apply");
const client = new Client({ connectionString: process.env.DATABASE_URL });
const actor = "system:approved-pending-hierarchy";
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(82026,55)");
  if (apply) await client.query(await readFile(new URL("../../lib/db/migrations/0063_pending_hierarchy_setup.sql", import.meta.url), "utf8"));
  // Freeze source provenance and account eligibility for the coherent import.
  const sources = (await client.query("SELECT * FROM crm.sales_catalog_source_records ORDER BY id FOR SHARE")).rows;
  const links = (await client.query("SELECT * FROM crm.sales_manager_user_sources FOR SHARE")).rows;
  const identities = (await client.query("SELECT * FROM crm.sales_manager_user_identities FOR SHARE")).rows;
  const users = (await client.query(`SELECT e.*,p.profile_name,p.is_active AS profile_active
    FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id FOR SHARE OF e,p`)).rows;
  const adopted = new Set((await client.query("SELECT upper(btrim(code)) code FROM crm.sales_structure_nodes")).rows.map(row => row.code));
  const pending = sources.filter(row => !adopted.has(row.code.trim().toUpperCase()));
  const plan = planPendingHierarchy(pending.filter(row => ["sales-regions","sales-branches","sales-units"].includes(row.catalog))
    .concat(sources.filter(row => ["regional-managers","unit-managers"].includes(row.catalog))), links, identities, users);
  let created = 0, unchanged = 0;
  if (apply) for (const entry of plan) {
    const existing = (await client.query("SELECT * FROM crm.organisation_source_setup WHERE source_reference_id=$1 FOR UPDATE",
      [entry.source_reference_id])).rows[0];
    if (existing) {
      const same = Object.entries(entry).every(([key,value]) => isDeepStrictEqual(existing[key],value));
      if (!same) throw Error(`Source setup ${entry.source_reference_id} changed; review it instead of overwriting an earlier decision.`);
      unchanged++; continue;
    }
    const saved = (await client.query(`INSERT INTO crm.organisation_source_setup
      (source_reference_id,source_row_sha256,manager_employee_id,manager_sources,manager_link_status,
       branch_approved,resolution_note,updated_by) VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8) RETURNING *`,
    [entry.source_reference_id,entry.source_row_sha256,entry.manager_employee_id,JSON.stringify(entry.manager_sources),
      entry.manager_link_status,entry.branch_approved,entry.resolution_note,actor])).rows[0];
    await client.query(`INSERT INTO crm.organisation_source_setup_events(source_reference_id,after_data,actor)
      VALUES($1,$2::jsonb,$3)`,[entry.source_reference_id,JSON.stringify(saved),actor]);
    created++;
  }
  const summary = {};
  for (const entry of plan) {
    const catalog = sources.find(row => row.id === entry.source_reference_id).catalog;
    const key = `${catalog}:${entry.manager_link_status}`;
    summary[key] = (summary[key] ?? 0) + 1;
  }
  await client.query(apply ? "COMMIT" : "ROLLBACK");
  process.stdout.write(JSON.stringify({ applied: apply, created, unchanged, summary,
    operational_nodes_created: 0, users_changed: 0, agents_changed: 0 }) + "\n");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally { await client.end(); }
