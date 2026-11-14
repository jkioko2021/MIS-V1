// Development-only, user-authorized source load. Defaults to a dry-run.
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { transform } from "esbuild";
import pg from "pg";
import { importSalesReferences, parseSalesReferenceTsv } from "./sales-reference-data.mjs";

if (process.env.NODE_ENV === "production") throw new Error("This loader is development-only.");
const filename = process.argv[2];
if (!filename || filename.startsWith("--")) throw new Error("Usage: node import-sales-references.mjs <file.tsv> [--apply]");
const text = await readFile(resolve(filename), "utf8");
const source = await readFile(new URL("../src/lib/sales-catalog-definitions.ts", import.meta.url), "utf8");
const { code } = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const { salesCatalogDefinitions } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const preview = parseSalesReferenceTsv(text, salesCatalogDefinitions);
if (!process.argv.includes("--apply")) {
  console.info(JSON.stringify({ dry_run: true, records: preview.rows.length, sections: [...new Set(preview.rows.map(r => r.catalog))] }));
} else {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect(); await client.query("BEGIN");
    const result = await importSalesReferences(client, text, basename(filename), "user-approved-reference-load", salesCatalogDefinitions);
    await client.query("COMMIT");
    console.info(JSON.stringify({ environment: "development", ...result }));
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally { await client.end(); }
}
