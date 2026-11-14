// Real development database, one rolled-back transaction; never contacts SQL Server.
import assert from "node:assert/strict";
import { build } from "esbuild";
import pg from "pg";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { importSalesReferences, parseSalesReferenceTsv } from "../scripts/sales-reference-data.mjs";

const root = new URL("../../../", import.meta.url);
const dir = await mkdtemp(path.join(tmpdir(), "sales-catalog-test-"));
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
let connected = false;
globalThis.__salesCatalogTest = db;
try {
  await build({
    stdin: { contents: `export * from './artifacts/api-server/src/lib/sales-catalogs.ts';
      export * from './artifacts/api-server/src/lib/sales-catalog-definitions.ts';
      export * from './artifacts/api-server/src/lib/sales-structure.ts';
      export * from './artifacts/api-server/src/lib/sales-organization-lookups.ts';
      export {CreateSalesCatalogEntryBody,UpdateSalesCatalogEntryBody} from './lib/api-zod/src/index.ts';`,
      resolveDir: path.resolve(new URL("../../..", import.meta.url).pathname), loader: "ts" },
    outfile: path.join(dir, "lib.mjs"), bundle: true, platform: "node", format: "esm", packages: "bundle",
    plugins: [{ name: "rollback", setup(b) {
      b.onResolve({ filter: /^\.\/postgres$/ }, () => ({ path: "postgres", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
        export async function withTransaction(fn){
          const db=globalThis.__salesCatalogTest;
          await db.query('SAVEPOINT catalog_check');
          try {const result=await fn(db);await db.query('RELEASE SAVEPOINT catalog_check');return result;}
          catch(err){await db.query('ROLLBACK TO SAVEPOINT catalog_check');throw err;}
        }` }));
    } }],
  });
  const lib = await import(pathToFileURL(path.join(dir, "lib.mjs")).href);
  // Exact field parity with the supplied SELECTs, without executing those SELECTs.
  const supplied = await readFile(new URL("attached_assets/Pasted-SELECT-UNIT-CODE-UNIT-NAME-UNIT-TYPE-BRANCH-CODE-REGION_1794640577917.txt", root), "utf8");
  const selects = supplied.split(/SELECT/i).filter(s => s.includes("FROM"));
  assert.equal(selects.length, 9);
  for (const select of selects) {
    const [columns, from] = select.split(/\bFROM\b/i);
    const table = from.match(/\[dbo\]\.\[([^\]]+)\]/)[1];
    const def = lib.salesCatalogDefinitions.find(d => d.source_table.endsWith(`.${table}`));
    assert(def, `Missing submenu definition for ${table}`);
    assert.deepEqual(def.fields.map(f => f.key), [...columns.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]));
  }
  await db.connect(); connected = true; await db.query("BEGIN");
  const prefix = `CAT_${randomUUID().slice(0, 8)}`.toUpperCase();
  const employee = (await db.query(`INSERT INTO crm.employees(username,employee_name,password_hash,
    profile_id,activated,approved) VALUES($1,$1,'not-a-login-hash',3,true,true) RETURNING employee_id`,
  [prefix])).rows[0].employee_id;
  const national = await lib.createSalesNode({
    code: `${prefix}_N`, name: prefix, level: "NATIONAL", parent_id: null, manager_id: null, is_active: true,
  }, prefix);
  const bm = await lib.enrollSalesManager({ employee_id: employee, level: "BRANCH" }, prefix);
  const definitions = new Map(lib.salesCatalogDefinitions.map(d => [d.key, d]));
  const states = new Map();
  async function create(catalog, extra = {}) {
    const def = definitions.get(catalog);
    const values = { [def.code_field]: `${prefix}_${states.size}`, [def.name_field]: `${prefix} ${def.title}`, ...extra };
    const input = { values, employee_id: def.manager ? employee : null, is_active: true };
    const saved = await lib.saveSalesCatalogEntry(catalog, lib.CreateSalesCatalogEntryBody.parse(input), prefix);
    const item = { ...input, ...saved, code: values[def.code_field] };
    states.set(catalog, item); return item;
  }
  async function update(catalog, values = {}, options = {}) {
    const current = states.get(catalog);
    const input = { values: { ...current.values, ...values }, employee_id: current.employee_id,
      is_active: current.is_active, version: current.version, ...options };
    const result = await lib.saveSalesCatalogEntry(catalog, lib.UpdateSalesCatalogEntryBody.parse(input), prefix, current.id);
    const item = { ...current, ...input, ...result }; states.set(catalog, item); return item;
  }
  const region = await create("sales-regions", { NSM_CODE: `${prefix}_N`, VALID_FROM: "2026-01-01", VALID_TO: "2026-12-31" });
  const branch = await create("sales-branches", { REGION_CODE: region.code, NSM_CODE: `${prefix}_N`, BRANCH_MGR_ID: String(bm.id) });
  const unit = await create("sales-units", { BRANCH_CODE: branch.code, REGION_CODE: region.code, NSM_CODE: `${prefix}_N` });
  const um = await create("unit-managers", { UNIT_CODE: unit.code, EMAIL: "fixture@example.test",
    H_TAX: "0.100", HRMIS_CODE: "000123", APPROVED: "1", IS_BDM: "1" });
  const rm = await create("regional-managers", { R_CODE: region.code, RM_CODE: `${prefix}_RM` });
  const giCoordinator = await create("gi-coordinators", { BR_CODE: branch.code, GI_CORD_CODE: `${prefix}_GC` });
  const giBranch = await create("gi-branches", { BR_CODE: branch.code, CORD_MGR_ID: giCoordinator.code });
  const giUnit = await create("gi-units", { BRANCH_CODE: branch.code, REGION_CODE: giBranch.code });
  const giManager = await create("gi-unit-managers", { GI_UNIT_CODE: giUnit.code,
    EARN_RETAINER: "1", RETAINER_AMT: "25000", JOIN_DATE: "2026-01-01", RET_EFF_UPTO: "2026-12-31" });
  await update("sales-units", { UNIT_MGR_ID: um.code, GI_UNIT: giUnit.code });
  await update("sales-regions", { REGION_MGR_ID: rm.code });
  await update("sales-branches", { GI_BRANCH: states.get("gi-branches").code });
  await update("gi-units", { CORD_MGR_ID: giManager.code });
  assert.equal((await db.query("SELECT profile_id FROM crm.employees WHERE employee_id=$1", [employee])).rows[0].profile_id, 3);
  const savedUM = (await db.query("SELECT data FROM crm.sales_catalog_entries WHERE id=$1", [um.id])).rows[0].data;
  assert.equal(savedUM.H_TAX, "0.100");
  assert.equal(savedUM.HRMIS_CODE, "000123");
  assert.equal(savedUM.APPROVED_BY, prefix);
  assert.equal(savedUM.ACTIVE, "1");
  assert.equal((await db.query("SELECT count(*)::int AS count FROM crm.sales_catalog_entries WHERE code LIKE $1", [`${prefix}%`])).rows[0].count, 9);
  const bad = fn => assert.rejects(fn, err => err.status === 400);
  await bad(() => update("sales-units", {}, { is_active: false }));
  await bad(() => update("unit-managers", {}, { is_active: false }));
  await bad(() => update("sales-branches", {}, { is_active: false }));
  await bad(() => update("sales-regions", { VALID_TO: "2025-01-01" }));
  await bad(() => update("sales-regions", { VALID_FROM: "2026-02-30" }));
  await bad(() => update("unit-managers", { H_TAX: "1.0001" }));
  await bad(() => update("unit-managers", { APPROVED_BY: "spoofed" }));
  await bad(() => update("sales-units", { UNKNOWN: "value" }));
  await bad(() => update("gi-unit-managers", { RETAINER_AMT: "-1" }));
  await bad(() => update("gi-unit-managers", { RET_EFF_UPTO: "2025-12-31" }));
  await bad(() => update("unit-managers", { UM_ID: "REPLACED" }));
  await bad(() => update("unit-managers", {}, { employee_id: null }));
  await bad(() => update("unit-managers", { UNIT_CODE: "NO_SUCH_UNIT" }));
  await assert.rejects(() => update("unit-managers", {}, { version: 999 }), e => e.status === 409);
  await bad(() => lib.updateSalesNode(national.id, { name: prefix, parent_id: null,
    manager_id: null, is_active: false, version: national.version }, prefix));
  await bad(() => lib.updateSalesManager(bm.id, { is_active: false, version: bm.version }, prefix));
  const otherRegion = await lib.saveSalesCatalogEntry("sales-regions", {
    values: { REGION_CODE: `${prefix}_OTHER`, REGION_NAME: "Other region" }, employee_id: null, is_active: true,
  }, prefix);
  await bad(() => update("sales-units", { REGION_CODE: `${prefix}_OTHER` }));
  assert(otherRegion.id);
  const beforeVersion = states.get("unit-managers").version;
  await update("unit-managers", { H_TAX: "0.050", EMAIL: null });
  await bad(() => update("unit-managers", { EMAIL: "invalid" }));
  const events = await db.query("SELECT before_data,after_data FROM crm.sales_catalog_events WHERE entry_id=$1 AND action='UPDATED'", [um.id]);
  assert(events.rows.some(e => e.before_data.values.H_TAX === "0.100" && e.after_data.values.H_TAX === "0.050"));
  assert(states.get("unit-managers").version > beforeVersion);
  // Unassign first, then deactivate. Never hard-delete or change the MIS user's profile.
  await update("sales-units", { UNIT_MGR_ID: null });
  await update("unit-managers", {}, { is_active: false });
  assert.equal((await db.query("SELECT data->>'ACTIVE' AS active FROM crm.sales_catalog_entries WHERE id=$1", [um.id])).rows[0].active, "0");
  assert.equal((await db.query("SELECT employee_id FROM crm.sales_catalog_entries WHERE id=$1", [giManager.id])).rowCount, 1);
  const sourceDef = definitions.get("unit-managers");
  const sourceRows = ["SOURCE_UNIT_A", "SOURCE_UNIT_B"].map((unitCode, i) => ({
    ID: "42", UM_ID: `${prefix}_SHARED`, UM_NAME: "Source Manager", UNIT_CODE: unitCode,
    EMAIL: i ? "" : "0", HRMIS_CODE: "000042", ACTIVE: "1", APPROVED: "1",
    APPROVED_BY: "ORIGINAL_ACTOR", H_TAX: "0.300", MIS_EMP_CODE: "0042 ",
    IS_BDM: "1", VALID_FROM: "2024-01-01", VALID_TO: "2025-12-31",
  }));
  const sourceText = [
    sourceDef.fields.map(f => f.key).join("\t"),
    ...sourceRows.map(row => sourceDef.fields.map(f => row[f.key]).join("\t")),
  ].join("\r\n");
  const parsed = parseSalesReferenceTsv(sourceText, lib.salesCatalogDefinitions);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].values.MIS_EMP_CODE, "0042 ", "Preserve source whitespace and leading zeroes");
  const countBefore = (await db.query("SELECT count(*)::int AS n FROM crm.sales_catalog_entries")).rows[0].n;
  const loaded = await importSalesReferences(db, sourceText, "synthetic-reference.tsv", prefix, lib.salesCatalogDefinitions);
  assert.equal(loaded.inserted, 2);
  assert.equal(loaded.flagged, 2);
  const again = await importSalesReferences(db, sourceText, "synthetic-reference.tsv", prefix, lib.salesCatalogDefinitions);
  assert.equal(again.inserted, 0);
  assert.equal(again.skipped, 2);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM crm.sales_catalog_entries")).rows[0].n, countBefore);
  const references = (await db.query("SELECT data,issues FROM crm.sales_catalog_source_records WHERE imported_by=$1 ORDER BY source_line", [prefix])).rows;
  assert.deepEqual(references.map(r => r.data), sourceRows);
  assert(references.every(r => r.issues.some(issue => issue.includes("no MIS user account"))));
  assert(references[0].issues.some(issue => issue.includes("invalid address")));
  assert.equal((await db.query("SELECT profile_id FROM crm.employees WHERE employee_id=$1", [employee])).rows[0].profile_id, 3);
  const src = { region: `${prefix}_SR`, branch: `${prefix}_SB`, unit: `${prefix}_SU`,
    giBranch: `${prefix}_SGB`, giUnit: `${prefix}_SGU`, ambiguous: `${prefix}_DUP`, shadow: `${prefix}_SHADOW` };
  const orgSections = [
    ["sales-regions", [
      { REGION_CODE: src.region, REGION_NAME: "Imported Region", REGION_MGR_ID: `${prefix}_SHARED` },
      { REGION_CODE: src.ambiguous, REGION_NAME: "Conflicting Region A" },
      { REGION_CODE: src.ambiguous, REGION_NAME: "Conflicting Region B" },
      { REGION_CODE: src.shadow, REGION_NAME: "Imported Shadow Region" },
    ]],
    ["sales-branches", [{ BRANCH_CODE: src.branch, BRANCH_NAME: "Imported Branch", REGION_CODE: src.region }]],
    ["sales-units", [{ UNIT_CODE: src.unit, UNIT_NAME: "Imported Unit", BRANCH_CODE: src.branch, REGION_CODE: src.region, ACTIVE: "1", UNIT_MGR_ID: `${prefix}_SHARED` }]],
    ["gi-branches", [{ CORD_CODE: src.giBranch, CORD_NAME: "Imported GI Branch", BR_CODE: src.branch }]],
    ["gi-units", [{ GI_UNIT_CODE: src.giUnit, GI_UNIT_NAME: "Imported GI Unit", BRANCH_CODE: src.branch, REGION_CODE: src.giBranch, ACTIVE: "1" }]],
  ];
  const orgText = orgSections.map(([catalog, rows]) => {
    const fields = definitions.get(catalog).fields;
    return [fields.map(f => f.key).join("\t"), ...rows.map(row => fields.map(f => row[f.key] ?? "").join("\t"))].join("\n");
  }).join("\n\n");
  const orgLoad = await importSalesReferences(db, orgText, "synthetic-organizations.tsv", prefix, lib.salesCatalogDefinitions);
  assert.equal(orgLoad.inserted, 8);
  const sourceBefore = (await db.query("SELECT id,data FROM crm.sales_catalog_source_records WHERE imported_by=$1 ORDER BY id", [prefix])).rows;
  const fromSource = (catalog, values) => lib.saveSalesCatalogEntry(catalog, {
    values, employee_id: null, is_active: true,
  }, prefix);
  await fromSource("sales-branches", { BRANCH_CODE: `${prefix}_NEW_B`, BRANCH_NAME: "New Branch", REGION_CODE: src.region });
  await fromSource("sales-units", { UNIT_CODE: `${prefix}_NEW_U`, UNIT_NAME: "New Unit",
    BRANCH_CODE: src.branch, REGION_CODE: src.region, GI_UNIT: src.giUnit });
  await fromSource("gi-units", { GI_UNIT_CODE: `${prefix}_NEW_GU`, GI_UNIT_NAME: "New GI Unit",
    BRANCH_CODE: src.branch, REGION_CODE: src.giBranch });
  await update("unit-managers", { UNIT_CODE: src.unit }, { is_active: true });
  await bad(() => fromSource("sales-units", { UNIT_CODE: `${prefix}_BAD_U`, UNIT_NAME: "Wrong Region",
    BRANCH_CODE: src.branch, REGION_CODE: `${prefix}_OTHER` }));
  await bad(() => fromSource("sales-branches", { BRANCH_CODE: `${prefix}_BAD_B`, BRANCH_NAME: "Ambiguous",
    REGION_CODE: src.ambiguous }));
  await bad(() => fromSource("sales-units", { UNIT_CODE: `${prefix}_BAD_M`, UNIT_NAME: "Unlinked Manager",
    BRANCH_CODE: src.branch, REGION_CODE: src.region, UNIT_MGR_ID: `${prefix}_SHARED` }));
  await lib.saveSalesCatalogEntry("sales-regions", { values: { REGION_CODE: src.shadow, REGION_NAME: "Inactive Enrolled Region" },
    employee_id: null, is_active: false }, prefix);
  await bad(() => fromSource("sales-branches", { BRANCH_CODE: `${prefix}_BAD_S`, BRANCH_NAME: "Shadow",
    REGION_CODE: src.shadow }));
  await db.query("UPDATE crm.sales_catalog_source_records SET data=jsonb_set(data,'{ACTIVE}','\"0\"') WHERE catalog='sales-units' AND code=$1", [src.unit]);
  await bad(() => update("unit-managers", { UNIT_CODE: src.unit }));
  await db.query("UPDATE crm.sales_catalog_source_records SET data=jsonb_set(data,'{ACTIVE}','\"1\"') WHERE catalog='sales-units' AND code=$1", [src.unit]);
  const sourceAfter = (await db.query("SELECT id,data FROM crm.sales_catalog_source_records WHERE imported_by=$1 ORDER BY id", [prefix])).rows;
  assert.deepEqual(sourceAfter, sourceBefore, "Selecting organizations must not modify source rows");
  assert.equal((await db.query("SELECT profile_id FROM crm.employees WHERE employee_id=$1", [employee])).rows[0].profile_id, 3);
  console.info("PASS: all nine SELECT field sets, persistent enrollments, ordinary-user linkage, mappings, exact decimals/codes, date validation, stale writes, retained history and safe deactivation.");
  console.info("PASS: reference loads retain duplicate manager assignments and exact source values, flag missing mappings, remain idempotent and never create enrollments or grant access.");
  console.info("PASS: imported organizations are selectable and saved by code; invalid regions, ambiguous identities, inactive/shadowed records and unlinked managers remain blocked; source values and user profiles stay unchanged.");
} finally {
  if (connected) await db.query("ROLLBACK").catch(() => {});
  await db.end();
  delete globalThis.__salesCatalogTest;
  await rm(dir, { recursive: true, force: true });
}
