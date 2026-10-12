// Development-only real PostgreSQL regression, isolated in a rolled-back schema.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { applyDocumentMetadata, checkDocumentMetadata } from "./document-metadata.mjs";

if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT) throw new Error("Development only.");
const require = createRequire(new URL("../../lib/db/package.json", import.meta.url));
const { Client } = require("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL });
const schema = `metadata_test_${randomBytes(6).toString("hex")}`;
// All canonical SQL and readiness queries use this isolated schema, not CRM.
const isolated = { query: (sql, params) => client.query(sql.replace(/\bcrm\b/g, schema), params) };
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`CREATE TABLE ${schema}.business_uploads(upload_id serial PRIMARY KEY, notes text)`);
  await client.query(`INSERT INTO ${schema}.business_uploads(notes) VALUES ('Original document note')`);
  await assert.rejects(checkDocumentMetadata(isolated), /Missing document metadata/);
  await applyDocumentMetadata(isolated);
  await checkDocumentMetadata(isolated);
  const original = await client.query(`SELECT * FROM ${schema}.business_uploads`);
  assert.equal(original.rows[0].originating_system, null);
  assert.equal(original.rows[0].notes, "Original document note");
  await applyDocumentMetadata(isolated);
  assert.deepEqual((await client.query(`SELECT * FROM ${schema}.business_uploads`)).rows, original.rows);
  for (const system of ["eOx", "AIMS", null]) {
    await client.query(`INSERT INTO ${schema}.business_uploads(originating_system) VALUES ($1)`, [system]);
  }
  await client.query("SAVEPOINT invalid_system");
  await assert.rejects(client.query(`INSERT INTO ${schema}.business_uploads(originating_system) VALUES ($1)`, ["guessed"]), { code: "23514" });
  await client.query("ROLLBACK TO SAVEPOINT invalid_system");
  console.info("PASS: missing-column detection, additive repair, null history, unchanged notes, idempotency and approved-system constraint.");
} finally {
  await client.query("ROLLBACK").catch(() => {});
  await client.end();
}
