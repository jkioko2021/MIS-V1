// Run with tsx: uses the same validation and audit writer as Manager Enrollment.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { captureSalesManagerEnrollment } from "../../artifacts/api-server/src/lib/sales-structure.ts";
import { planManagerEnrollmentDrafts } from "./manager-enrollment-draft-plan.mjs";
const require = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
const { Client } = require("pg");
if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT) throw Error("Development-only import.");
const apply = process.argv.includes("--apply");
const client = new Client({connectionString:process.env.DATABASE_URL});
const actor="system:uploaded-manager-drafts";
try {
  await client.connect();await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(82026,55)");
  if (apply) await client.query(await readFile(new URL("../../lib/db/migrations/0064_manager_enrollment_drafts.sql",import.meta.url),"utf8"));
  const sources=(await client.query(`SELECT * FROM crm.sales_catalog_source_records
    WHERE catalog IN ('unit-managers','regional-managers','gi-unit-managers') ORDER BY id FOR SHARE`)).rows;
  const links=(await client.query("SELECT * FROM crm.sales_manager_user_sources FOR SHARE")).rows;
  const identities=(await client.query("SELECT * FROM crm.sales_manager_user_identities FOR SHARE")).rows;
  const users=(await client.query(`SELECT e.employee_id,e.emp_code,e.employee_name,e.email,e.department,e.is_deleted,
    p.profile_name,p.is_active AS profile_active FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
    FOR SHARE OF e,p`)).rows;
  const plan=planManagerEnrollmentDrafts(sources,links,identities,users);
  let created=0,existing=0,sourceLinks=0;
  for(const draft of plan.enrollments) {
    const before=(await client.query(`SELECT id FROM crm.sales_manager_enrollments
      WHERE employee_id=$1 AND level=$2 FOR UPDATE`,[draft.employee_id,draft.level])).rows[0];
    if(before)existing++;
    if(!apply)continue;
    const enrollment=before??await captureSalesManagerEnrollment(client,draft,actor);
    if(!before)created++;
    for(const source of draft.sources) {
      const previous=(await client.query(`SELECT * FROM crm.sales_manager_enrollment_sources WHERE source_reference_id=$1 FOR UPDATE`,
        [source.source_reference_id])).rows[0];
      if(previous){
        if(previous.enrollment_id!==enrollment.id || previous.source_row_sha256!==source.source_row_sha256)
          throw Error(`Source enrollment ${source.source_reference_id} changed; manual review is required.`);
        continue;
      }
      await client.query(`INSERT INTO crm.sales_manager_enrollment_sources
        (source_reference_id,enrollment_id,source_row_sha256,source_domain,review_notes,created_by) VALUES($1,$2,$3,$4,$5::jsonb,$6)`,
      [source.source_reference_id,enrollment.id,source.source_row_sha256,source.source_domain,JSON.stringify([
        ...draft.conflicts.map(field=>({field,reason:"Conflicting uploaded values were left blank."})),
        ...draft.invalid.map(field=>({field,reason:"An invalid uploaded value was left blank."})),
      ]),actor]);
      sourceLinks++;
    }
  }
  await client.query(apply?"COMMIT":"ROLLBACK");
  process.stdout.write(JSON.stringify({applied:apply,verified_people:new Set(plan.enrollments.map(row=>row.employee_id)).size,
    enrollments:plan.enrollments.length,unit:plan.enrollments.filter(row=>row.level==="UNIT").length,
    region:plan.enrollments.filter(row=>row.level==="REGION").length,created,existing,source_links_created:sourceLinks,
    held_source_records:plan.held.length,rows_with_conflicts:plan.enrollments.filter(row=>row.conflicts.length).length,
    rows_with_invalid_fields:plan.enrollments.filter(row=>row.invalid.length).length,
    accounts_changed:0,hierarchy_activated:false})+"\n");
} catch(error){await client.query("ROLLBACK").catch(()=>{});throw error;}
finally{await client.end();}
