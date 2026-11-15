// User-approved development mapping. Never rewrites source codes or activates nodes.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require=createRequire(new URL("../../artifacts/api-server/package.json",import.meta.url));
const {Client}=require("pg");
if(process.env.NODE_ENV==="production"||process.env.REPLIT_DEPLOYMENT) throw Error("Development only");
const client=new Client({connectionString:process.env.DATABASE_URL});
const apply=process.argv.includes("--apply");
const actor="system:approved-source-national";
try{
  await client.connect();await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(82026,55)");
  if(apply)await client.query(await readFile(new URL("../../lib/db/migrations/0065_source_national_mapping.sql",import.meta.url),"utf8"));
  const national=(await client.query(`SELECT id FROM crm.sales_structure_nodes
    WHERE level='NATIONAL' AND code=$1 AND name=$2 AND is_active FOR SHARE`,["NSM-0001","NATIONAL"])).rows;
  if(national.length!==1)throw Error("The user-approved National is missing or inactive.");
  const sources=(await client.query(`SELECT s.id,s.catalog,s.row_sha256,s.data->>'NSM_CODE' AS source_code,ss.*
    FROM crm.sales_catalog_source_records s JOIN crm.organisation_source_setup ss ON ss.source_reference_id=s.id
    WHERE s.catalog IN('sales-regions','sales-branches','sales-units') ORDER BY s.id FOR UPDATE OF ss FOR SHARE OF s`)).rows;
  if(sources.length!==53)throw Error("Expected the 53 approved source records; review changed source scope.");
  let updated=0;
  for(const before of sources){
    if(before.source_code?.trim().toUpperCase()!=="N_0001"||before.row_sha256!==before.source_row_sha256)
      throw Error("Source data differs from the approved National mapping.");
    if(before.national_node_id && before.national_node_id!==national[0].id)
      throw Error("An existing National mapping conflicts with the approved target.");
    if(before.national_node_id===national[0].id && before.national_source_code==="N_0001")continue;
    if(apply){
      const after=(await client.query(`UPDATE crm.organisation_source_setup SET national_node_id=$2,
        national_source_code=$3,updated_at=now(),updated_by=$4 WHERE source_reference_id=$1 RETURNING *`,
      [before.source_reference_id,national[0].id,"N_0001",actor])).rows[0];
      await client.query(`INSERT INTO crm.organisation_source_setup_events(source_reference_id,before_data,after_data,actor)
        VALUES($1,$2::jsonb,$3::jsonb,$4)`,[before.source_reference_id,
        JSON.stringify(Object.fromEntries(Object.keys(after).map(key=>[key,before[key]??null]))),JSON.stringify(after),actor]);
    }updated++;
  }
  await client.query(apply?"COMMIT":"ROLLBACK");
  console.log(JSON.stringify({applied:apply,records:sources.length,updated,national:"NATIONAL",
    source_rows_changed:0,operational_nodes_created:0,accounts_changed:0}));
}catch(error){await client.query("ROLLBACK").catch(()=>{});throw error;}
finally{await client.end();}
