// Explicit additive manifest, not a replay of historical data migrations.
import { readFile } from "node:fs/promises";

export async function applyDocumentMetadata(client) {
  for (const name of ["0011_add_allocation_document_transaction_metadata.sql", "0036_aml_originating_system.sql"]) {
    await client.query(await readFile(new URL(`../../lib/db/migrations/${name}`, import.meta.url), "utf8"));
  }
}

export async function checkDocumentMetadata(client) {
  const required = ["invoice_no", "amount", "policy_code", "risk_rate", "risk_reason", "originating_system"];
  const { rows } = await client.query(`SELECT column_name FROM information_schema.columns
    WHERE table_schema='crm' AND table_name='business_uploads' AND column_name=ANY($1::text[])`, [required]);
  const found = new Set(rows.map(row => row.column_name));
  const missing = required.filter(name => !found.has(name));
  if (missing.length) throw new Error(`Database setup incomplete. Missing document metadata: ${missing.join(", ")}. Run pnpm local:db:metadata on your local database; see docs/LOCAL_DEVELOPMENT.md.`);
}
