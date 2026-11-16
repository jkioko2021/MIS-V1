// Explicit development maintenance: dry run by default, --apply commits.
// Reuses application validation, source provenance, version checks and audit writers.
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT)
  throw Error("Development-only Medical activation.");
const require = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
const { Client } = require("pg");
const { build } = require("esbuild");
const db = new Client({ connectionString: process.env.DATABASE_URL });
const dir = await mkdtemp(path.join(tmpdir(), "medical-activation-"));
const apply = process.argv.includes("--apply");
const actor = "system:user-request-medical-activation";
globalThis.__medicalActivationDb = db;
let connected = false;
try {
  await build({
    stdin: { contents: `export {createSalesNode,updateSalesNode,updateSalesManager} from './sales-structure.ts';
      export {pendingSourceSetups} from './organisation-source-setup.ts';`,
      resolveDir: fileURLToPath(new URL("../../artifacts/api-server/src/lib", import.meta.url)) },
    outfile: path.join(dir, "service.mjs"), bundle: true, platform: "node", format: "esm",
    plugins: [{ name: "shared-transaction", setup(b) {
      b.onResolve({ filter: /^\.\/postgres$/ }, () => ({ path: "postgres", namespace: "activation" }));
      b.onLoad({ filter: /.*/, namespace: "activation" }, () => ({ contents: `
        export async function withTransaction(fn) {
          const db=globalThis.__medicalActivationDb;
          await db.query('SAVEPOINT medical_service');
          try { const value=await fn(db); await db.query('RELEASE SAVEPOINT medical_service'); return value; }
          catch(error) { await db.query('ROLLBACK TO SAVEPOINT medical_service'); throw error; }
        }` }));
    } }],
  });
  const lib = await import(pathToFileURL(path.join(dir, "service.mjs")).href);
  await db.connect(); connected = true;
  await db.query("BEGIN");
  await db.query("SELECT pg_advisory_xact_lock(82026,55)");
  const sourceHash = async () => (await db.query(`SELECT md5(coalesce(string_agg(id::text||row_sha256||data::text,'' ORDER BY id),'')) digest
    FROM crm.sales_catalog_source_records`)).rows[0].digest;
  const originalSources = await sourceHash();
  const accountHash = async () => (await db.query(`SELECT md5(coalesce(string_agg(employee_id::text||to_jsonb(e)::text,'' ORDER BY employee_id),'')) digest
    FROM crm.employees e`)).rows[0].digest;
  const originalAccounts = await accountHash();
  const giHash = async () => (await db.query(`SELECT md5(coalesce(string_agg(id::text||to_jsonb(n)::text,'' ORDER BY id),'')) digest
    FROM crm.gi_structure_nodes n`)).rows[0].digest;
  const originalGi = await giHash();
  const sources = (await db.query(`SELECT * FROM crm.sales_catalog_source_records
    WHERE catalog IN('sales-regions','sales-branches','sales-units') ORDER BY id FOR SHARE`)).rows;
  const setup = await lib.pendingSourceSetups(db);
  const nodeByCode = async code => (await db.query(
    "SELECT * FROM crm.sales_structure_nodes WHERE upper(code)=upper(btrim($1)) FOR UPDATE", [code])).rows[0];
  const unitSources = sources.filter(s => s.catalog === "sales-units");
  const requiredBranchCodes = new Set(unitSources.map(s => s.data.BRANCH_CODE?.trim().toUpperCase()));
  const branchSources = sources.filter(s => s.catalog === "sales-branches" && requiredBranchCodes.has(s.code.trim().toUpperCase()));
  const requiredRegionCodes = new Set(branchSources.map(s => s.data.REGION_CODE?.trim().toUpperCase()));
  const regionSources = sources.filter(s => s.catalog === "sales-regions" && requiredRegionCodes.has(s.code.trim().toUpperCase()));
  const results = [];
  for (const source of [...regionSources, ...branchSources, ...unitSources]) {
    await db.query("SAVEPOINT medical_record");
    const level = { "sales-regions": "REGION", "sales-branches": "BRANCH", "sales-units": "UNIT" }[source.catalog];
    try {
      const existing = await nodeByCode(source.code);
      if (existing) {
        if (!existing.is_active) await lib.updateSalesNode(existing.id, { ...existing, is_active: true }, actor);
        const available = (await db.query("SELECT available FROM crm.organisation_paths WHERE id=$1", [existing.id])).rows[0]?.available;
        if (!available) throw Error("Existing hierarchy is not operational; review its manager or parent.");
        results.push({ code: source.code, name: source.name, level, outcome: "active" });
      } else {
        const link = setup.get(source.id);
        if (!link?.linked_national_node_id) throw Error("A current verified National mapping is required.");
        let managerId = null;
        if (level !== "BRANCH" || link.linked_manager_employee_id) {
          if (link.manager_link_status !== "MATCHED" || !link.linked_manager_employee_id)
            throw Error("No verified manager mapping.");
          const manager = (await db.query(`SELECT * FROM crm.sales_manager_enrollments
            WHERE employee_id=$1 AND level=$2 FOR UPDATE`, [link.linked_manager_employee_id, level])).rows[0];
          if (!manager) throw Error("Matching manager category enrollment is missing.");
          if (!manager.is_active) await lib.updateSalesManager(manager.id, { is_active: true, version: manager.version }, actor);
          managerId = manager.id;
        } else if (!link.branch_approved) throw Error("Managerless Branch setup is not approved.");
        const parent = level === "REGION"
          ? (await db.query("SELECT * FROM crm.sales_structure_nodes WHERE id=$1", [link.linked_national_node_id])).rows[0]
          : await nodeByCode(source.data[level === "BRANCH" ? "REGION_CODE" : "BRANCH_CODE"] || "");
        if (!parent) throw Error("The imported parent is not active; resolve its setup first.");
        const saved = await lib.createSalesNode({
          code: source.code, name: source.name, level, parent_id: parent.id,
          manager_id: managerId, is_active: true, source_reference_id: source.id,
        }, actor);
        const available = (await db.query("SELECT available FROM crm.organisation_paths WHERE id=$1", [saved.id])).rows[0]?.available;
        if (!available) throw Error("Activation did not produce an operational hierarchy.");
        results.push({ code: source.code, name: source.name, level, outcome: "activated" });
      }
      await db.query("RELEASE SAVEPOINT medical_record");
    } catch (error) {
      await db.query("ROLLBACK TO SAVEPOINT medical_record");
      await db.query("RELEASE SAVEPOINT medical_record");
      if (error.status && ![400, 409].includes(error.status)) throw error;
      if (error.code) throw error;
      results.push({ code: source.code, name: source.name, level, outcome: "blocked", reason: error.message });
    }
  }
  if (await sourceHash() !== originalSources || await accountHash() !== originalAccounts || await giHash() !== originalGi)
    throw Error("Unexpected source, login-account or GI hierarchy change; rolling back.");
  const counts = (await db.query(`SELECT n.level,count(*)::int total,count(*) FILTER(WHERE n.is_active)::int active,
    count(*) FILTER(WHERE p.available)::int available FROM crm.sales_structure_nodes n
    JOIN crm.organisation_paths p ON p.id=n.id GROUP BY n.level ORDER BY n.level`)).rows;
  await db.query(apply ? "COMMIT" : "ROLLBACK");
  console.log(JSON.stringify({ applied: apply, counts, results }, null, 2));
} catch (error) {
  if (connected) await db.query("ROLLBACK");
  throw error;
} finally {
  if (connected) await db.end();
  delete globalThis.__medicalActivationDb;
  await rm(dir, { recursive: true, force: true });
}
