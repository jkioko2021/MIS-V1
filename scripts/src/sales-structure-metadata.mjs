import { readFile } from "node:fs/promises";

export async function applySalesStructureMetadata(client) {
  await client.query(await readFile(new URL("../../lib/db/migrations/0055_sales_structure_setup.sql", import.meta.url), "utf8"));
  await client.query(await readFile(new URL("../../lib/db/migrations/0056_sales_enrollment_catalogs.sql", import.meta.url), "utf8"));
  await client.query(await readFile(new URL("../../lib/db/migrations/0057_sales_source_references.sql", import.meta.url), "utf8"));
  await client.query(await readFile(new URL("../../lib/db/migrations/0058_sales_team_manager_mapping.sql", import.meta.url), "utf8"));
  await client.query(await readFile(new URL("../../lib/db/migrations/0059_sales_manager_details.sql", import.meta.url), "utf8"));
  await client.query(await readFile(new URL("../../lib/db/migrations/0060_sales_manager_user_import.sql", import.meta.url), "utf8"));
  await client.query(await readFile(new URL("../../lib/db/migrations/0061_organisation_agent_hierarchy.sql", import.meta.url), "utf8"));
}
