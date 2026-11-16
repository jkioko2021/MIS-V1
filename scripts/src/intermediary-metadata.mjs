import { readFile } from "node:fs/promises";

export async function applyIntermediaryMetadata(client) {
  for (const name of ["0052_intermediary_management.sql", "0053_intermediary_core_import.sql", "0054_intermediary_registration_fields.sql", "0071_agent_upload_source_data.sql"]) {
    await client.query(await readFile(new URL(`../../lib/db/migrations/${name}`, import.meta.url), "utf8"));
  }
}
