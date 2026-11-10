// Development/post-merge only. Never called by API startup or deployment build.
import { createRequire } from "node:module";
import { applyDocumentMetadata, checkDocumentMetadata } from "./document-metadata.mjs";

if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT) {
  throw new Error("Document metadata repair is for development only.");
}
if (!process.env.DATABASE_URL) throw new Error("Development DATABASE_URL is required.");
const require = createRequire(new URL("../../lib/db/package.json", import.meta.url));
const { Client } = require("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SET LOCAL lock_timeout='5s'");
  await applyDocumentMetadata(client);
  await checkDocumentMetadata(client);
  await client.query("COMMIT");
  console.info("Development document metadata ready; historical values unchanged.");
} catch {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Development document metadata repair failed; no changes committed. Check database availability and CRM baseline compatibility.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
