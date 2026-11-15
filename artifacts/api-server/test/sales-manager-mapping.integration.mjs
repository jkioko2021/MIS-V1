// Real development DB, rolled back completely. Never connects to the core SQL Server.
import assert from "node:assert/strict";
import { build } from "esbuild";
import pg from "pg";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createHash, randomUUID } from "node:crypto";

const dir = await mkdtemp(path.join(tmpdir(), "sales-mapping-test-"));
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
globalThis.__mappingDb = db;
let connected = false;
try {
  await build({
    stdin: { contents: `export * from './artifacts/api-server/src/lib/sales-manager-mapping.ts';
      export * from './artifacts/api-server/src/lib/sales-mapping-organizations.ts';
      export * from './artifacts/api-server/src/lib/sales-catalogs.ts';
      export * from './artifacts/api-server/src/lib/sales-structure.ts';
      export {SaveSalesManagerMappingBody,CreateSalesCatalogEntryBody} from './lib/api-zod/src/index.ts';`,
      resolveDir: path.resolve(new URL("../../..", import.meta.url).pathname), loader: "ts" },
    outfile: path.join(dir, "lib.mjs"), bundle: true, platform: "node", format: "esm",
    plugins: [{ name: "rollback", setup(b) {
      b.onResolve({ filter: /^\.\/postgres$/ }, () => ({ path: "postgres", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
        export async function withTransaction(fn){
          const db=globalThis.__mappingDb;
          await db.query('SAVEPOINT mapping_check');
          const client={query:(sql,args)=>{
            if(globalThis.__rejectMappingAudit && /INSERT INTO crm\\.sales_team_manager_events/.test(sql)){
              globalThis.__mappingAuditCount=(globalThis.__mappingAuditCount||0)+1;
              if(globalThis.__rejectMappingAudit===true || globalThis.__mappingAuditCount===globalThis.__rejectMappingAudit)
                throw new Error('fixture audit unavailable');
            }
            return db.query(sql,args);
          }};
          try {const result=await fn(client);await db.query('RELEASE SAVEPOINT mapping_check');return result;}
          catch(err){await db.query('ROLLBACK TO SAVEPOINT mapping_check');throw err;}
        }` }));
    } }],
  });
  const lib = await import(pathToFileURL(path.join(dir, "lib.mjs")).href);
  await db.connect(); connected = true; await db.query("BEGIN");
  const prefix = `MAP_${randomUUID().slice(0, 8)}`.toUpperCase();
  const sourceDigest = async () => (await db.query(`SELECT md5(COALESCE(string_agg(
    id::text||data::text,'' ORDER BY id),'')) AS digest FROM crm.sales_catalog_source_records WHERE imported_by<>$1`, [prefix])).rows[0].digest;
  const originalSources = await sourceDigest();
  const staff = [];
  for (const name of ["First", "Second", "Unavailable"]) {
    staff.push((await db.query(`INSERT INTO crm.employees(username,employee_name,password_hash,profile_id,activated,approved)
      VALUES($1,$2,'not-a-login-hash',3,true,$3) RETURNING employee_id`,
    [`${prefix}_${name}`, `${prefix} ${name} manager`, name !== "Unavailable"])).rows[0].employee_id);
  }
  const employeeBefore = (await db.query("SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[]) ORDER BY employee_id", [staff])).rows;
  let line = 0;
  const source = async (catalog, suffix, values = {}) => {
    const code = `${prefix}_${suffix}`; const name = `${prefix} ${suffix} team`;
    const fields = catalog === "sales-regions" ? ["REGION_CODE", "REGION_NAME"]
      : catalog === "sales-branches" ? ["BRANCH_CODE", "BRANCH_NAME"] : ["UNIT_CODE", "UNIT_NAME"];
    const data = { [fields[0]]: code, [fields[1]]: name, ...values };
    const digest = createHash("sha256").update(code).digest("hex");
    await db.query(`INSERT INTO crm.sales_catalog_source_records
      (catalog,code,name,source_file,file_sha256,source_line,row_sha256,data,issues,imported_by)
      VALUES($1,$2,$3,$4,$5,$6,$5,$7::jsonb,'[]'::jsonb,$8)`,
    [catalog, code, name, `fixture-${prefix}.txt`, digest, ++line, JSON.stringify(data), prefix]);
    return { catalog, code, name, values: data };
  };
  const region = await source("sales-regions", "Region");
  const otherRegion = await source("sales-regions", "OtherRegion");
  const branch = await source("sales-branches", "Branch", { REGION_CODE: region.code });
  const unit = await source("sales-units", "Unit", { REGION_CODE: region.code, BRANCH_CODE: branch.code });
  const second = await source("sales-units", "SecondUnit", { REGION_CODE: region.code, BRANCH_CODE: branch.code });
  const broken = await source("sales-units", "Broken", { REGION_CODE: otherRegion.code, BRANCH_CODE: branch.code });
  const organization = async row => (await lib.salesMappingOrganizations(db)).find(o => o.catalog === row.catalog && o.code === row.code);
  assert((await organization(unit)).eligible);
  assert.match((await organization(broken)).issues.join(" "), /differs/);
  const input = async (row, employee, version, note) => ({
    catalog: row.catalog, organization_code: row.code, employee_id: employee,
    expected_version: version, hierarchy_version: (await organization(row)).hierarchy_version, ...(note ? { note } : {}),
  });
  const save = async (row, employee, version, note) =>
    lib.saveSalesManagerMapping(lib.SaveSalesManagerMappingBody.parse(await input(row, employee, version, note)), prefix);
  const rowState = async row => (await lib.salesTeamManagerAssignments(db)).find(a => a.catalog === row.catalog && a.organization_code === row.code);
  const history = row => lib.salesManagerMappingHistory(row.catalog, row.code);
  await save(unit, staff[0], 0);
  await save(second, staff[0], 0);
  await save(branch, staff[0], 0);
  await save(region, staff[0], 0);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM crm.sales_team_manager_assignments WHERE employee_id=$1", [staff[0]])).rows[0].n, 4);
  assert.equal((await history(unit)).length, 1);
  await assert.rejects(save(unit, staff[1], 0, "Replacement"), e => e.status === 409);
  await assert.rejects(save(unit, staff[1], 1), e => e.status === 400 && /reason/.test(e.message));
  await assert.rejects(save(broken, staff[1], 0), e => e.status === 400 && /differs/.test(e.message));
  await assert.rejects(save(second, staff[2], 1, "Replacement"), e => e.status === 400 && /active/.test(e.message));
  const replaced = await save(unit, staff[1], 1, "Confirmed replacement for this team");
  assert.equal(replaced.version, 2);
  const event = (await history(unit))[0];
  assert.equal(event.action, "REASSIGNED");
  assert.equal(event.before_manager_name, employeeBefore[0].employee_name);
  assert.equal(event.after_manager_name, employeeBefore[1].employee_name);
  await assert.rejects(save(unit, staff[0], 1, "Stale administrator"), e => e.status === 409);
  assert.equal((await save(unit, staff[1], 2)).version, 2);
  assert.equal((await history(unit)).length, 2, "A no-op must not append duplicate history");

  const staleHierarchy = await input(unit, staff[0], 2, "Hierarchy was reviewed");
  await db.query("UPDATE crm.sales_catalog_source_records SET name=name||' changed' WHERE catalog=$1 AND code=$2", [region.catalog, region.code]);
  await assert.rejects(lib.saveSalesManagerMapping(staleHierarchy, prefix), e => e.status === 409 && /hierarchy/.test(e.message));
  await db.query("UPDATE crm.sales_catalog_source_records SET name=$3 WHERE catalog=$1 AND code=$2", [region.catalog, region.code, region.name]);
  for (const flag of ["employee_locked", "is_deleted"]) {
    await db.query("SAVEPOINT eligibility_check");
    await db.query(`UPDATE crm.employees SET ${flag}=true WHERE employee_id=$1`, [staff[1]]);
    await assert.rejects(save(second, staff[1], 1, "Unavailable manager"), e => e.status === 400 && /active/.test(e.message));
    // Reversal also triggers scoped session revocation: roll back the fixture instead.
    await db.query("ROLLBACK TO SAVEPOINT eligibility_check");
    await db.query("RELEASE SAVEPOINT eligibility_check");
  }

  const nationalEmployee=(await db.query(`INSERT INTO crm.employees
    (username,employee_name,password_hash,profile_id,activated,approved,department)
    VALUES($1,$1,'not-a-login-hash',(SELECT profile_id FROM crm.profiles WHERE lower(btrim(profile_name))='sales manager' AND is_active),true,true,'Sales')
    RETURNING employee_id`,[`${prefix}_NATIONAL`])).rows[0].employee_id;
  const nationalManager = (await db.query(`INSERT INTO crm.sales_manager_enrollments
    (employee_id,level,is_active,created_by,updated_by) VALUES($1,'NATIONAL',true,$2,$2) RETURNING id`,[nationalEmployee,prefix])).rows[0];
  await lib.createSalesNode({
    code: `${prefix}_NATIONAL`, name: `${prefix} National`, level: "NATIONAL",
    parent_id: null, manager_id: nationalManager.id, is_active: true,
  }, prefix);
  await assert.rejects(lib.saveSalesCatalogEntry(unit.catalog, lib.CreateSalesCatalogEntryBody.parse({
    values: { ...unit.values, NSM_CODE: `${prefix}_NATIONAL`, UNIT_MGR_ID: "unverified-manager" }, employee_id: null, is_active: true,
  }), prefix), e => e.status === 400 && /Manager Mapping/.test(e.message));
  await assert.rejects(lib.saveSalesCatalogEntry(region.catalog, lib.CreateSalesCatalogEntryBody.parse({
    values: { ...region.values, NSM_CODE: `${prefix}_NATIONAL` }, employee_id: null, is_active: false,
  }), prefix), e => e.status === 400 && /assigned team hierarchy/.test(e.message));
  assert.equal((await db.query("SELECT count(*)::int AS n FROM crm.sales_catalog_entries WHERE code=$1", [region.code])).rows[0].n, 0);

  assert.equal((await save(unit, null, 2, "Remove this manager")).version, 3);
  assert.equal((await history(unit))[0].action, "UNASSIGNED");
  assert.equal((await history(unit))[0].after_manager_name, null);
  await assert.rejects(save(unit, null, 3, "Already removed"), e => e.status === 400);
  await assert.rejects(save(unit, staff[0], 0), e => e.status === 409);
  assert.equal((await save(unit, staff[0], 3)).version, 4);
  // Invalid hierarchy and missing source must not trap an existing manager assignment.
  await db.query(`UPDATE crm.sales_catalog_source_records SET data=data||'{"ACTIVE":"0"}'::jsonb WHERE catalog=$1 AND code=$2`, [region.catalog, region.code]);
  assert(!(await organization(unit)).eligible);
  assert.equal((await save(unit, null, 4, "Remove from inactive hierarchy")).version, 5);
  await db.query(`UPDATE crm.sales_catalog_source_records SET data=data-'ACTIVE' WHERE catalog=$1 AND code=$2`, [region.catalog, region.code]);
  const orphanInput = await input(second, null, 1, "Source no longer available");
  const orphanContext = await organization(second);
  await db.query("DELETE FROM crm.sales_catalog_source_records WHERE catalog=$1 AND code=$2", [second.catalog, second.code]);
  assert(!lib.orphanedMappingOrganization(orphanContext).eligible);
  const orphanRemoved = await lib.saveSalesManagerMapping(orphanInput, prefix);
  assert.equal(orphanRemoved.employee_id, null);
  assert.equal((await history(second))[0].organization_name, second.name);

  globalThis.__rejectMappingAudit = true;
  await assert.rejects(save(unit, staff[1], 5), /fixture audit unavailable/);
  globalThis.__rejectMappingAudit = false;
  assert.equal((await rowState(unit)).version, 5);
  assert.equal((await rowState(unit)).employee_id, null, "An audit failure must roll back the ownership update");
  assert.equal((await history(unit)).length, 5);
  const otherBranch = await source("sales-branches", "OtherBranch", { REGION_CODE: otherRegion.code });
  const otherUnit = await source("sales-units", "OtherUnit", { REGION_CODE: otherRegion.code, BRANCH_CODE: otherBranch.code });
  const retainedUnit = await source("sales-units", "RetainedUnit", { REGION_CODE: region.code, BRANCH_CODE: branch.code });
  await save(unit, staff[0], 5);
  await save(retainedUnit, staff[0], 0);
  await save(otherBranch, staff[1], 0);
  const moveInput = async (from, to, note = "Approved move between teams") => ({
    ...await input(to, staff[0], (await rowState(to))?.version ?? 0, note),
    move_from: { organization_code: from.code, expected_version: (await rowState(from)).version,
      hierarchy_version: (await organization(from)).hierarchy_version },
  });
  const missingReason = await moveInput(region, otherRegion);
  delete missingReason.note;
  await assert.rejects(lib.saveSalesManagerMapping(missingReason, prefix), e => e.status === 400 && /reason/.test(e.message));
  const sameTeam = await moveInput(region, region);
  await assert.rejects(lib.saveSalesManagerMapping(sameTeam, prefix), e => e.status === 400 && /different destination/.test(e.message));
  for (const [from, to] of [[region, otherRegion], [branch, otherBranch], [unit, otherUnit]]) {
    const frozen = await moveInput(from, to);
    const transferred = await lib.saveSalesManagerMapping(lib.SaveSalesManagerMappingBody.parse(frozen), prefix);
    assert.equal(transferred.employee_id, staff[0], `${from.catalog}: destination manager`);
    assert.equal((await rowState(from)).employee_id, null, `${from.catalog}: only selected source cleared`);
    const departed = (await history(from))[0]; const arrived = (await history(to))[0];
    assert.equal(departed.transfer_to_name, to.name);
    assert.equal(arrived.transfer_from_name, from.name);
    assert.equal(arrived.transfer_to_name, to.name);
    assert.equal((await rowState(retainedUnit)).employee_id, staff[0], "Other teams for the same manager remain assigned");
    await assert.rejects(lib.saveSalesManagerMapping(frozen, prefix), e => e.status === 409);
  }
  assert.equal((await history(otherBranch))[0].before_manager_name, employeeBefore[1].employee_name, "Destination replacement is retained");
  // A destination already owned by this manager is a valid move: remove just the chosen origin.
  await lib.saveSalesManagerMapping(await moveInput(otherUnit, retainedUnit), prefix);
  assert.equal((await rowState(otherUnit)).employee_id, null);
  assert.equal((await rowState(retainedUnit)).employee_id, staff[0]);
  assert.equal((await rowState(retainedUnit)).version, 2);
  const wrongManager = await moveInput(retainedUnit, unit);
  wrongManager.employee_id = staff[1];
  await assert.rejects(lib.saveSalesManagerMapping(wrongManager, prefix), e => e.status === 409);
  const wrongLevel = await moveInput(retainedUnit, otherRegion);
  await assert.rejects(lib.saveSalesManagerMapping(wrongLevel, prefix), e => e.status === 409);
  const invalidDestination = await moveInput(retainedUnit, broken);
  await assert.rejects(lib.saveSalesManagerMapping(invalidDestination, prefix), e => e.status === 400);
  const staleSource = await moveInput(retainedUnit, unit);
  await db.query("UPDATE crm.sales_catalog_source_records SET name=name||' changed' WHERE catalog=$1 AND code=$2", [retainedUnit.catalog, retainedUnit.code]);
  await assert.rejects(lib.saveSalesManagerMapping(staleSource, prefix), e => e.status === 409 && /source team's hierarchy/.test(e.message));
  await db.query("UPDATE crm.sales_catalog_source_records SET name=$3 WHERE catalog=$1 AND code=$2", [retainedUnit.catalog, retainedUnit.code, retainedUnit.name]);
  const staleDestination = await moveInput(retainedUnit, unit);
  const competing = await save(unit, staff[1], (await rowState(unit)).version);
  await assert.rejects(lib.saveSalesManagerMapping(staleDestination, prefix), e => e.status === 409);
  assert.equal((await rowState(retainedUnit)).employee_id, staff[0]);
  await save(unit, null, competing.version, "Clear competing test assignment");
  const sourceBefore = await rowState(retainedUnit); const destinationBefore = await rowState(unit);
  const sourceHistory = (await history(retainedUnit)).length; const destinationHistory = (await history(unit)).length;
  // Fail the SECOND event, after both ownership rows and the source event were written.
  globalThis.__rejectMappingAudit = 2; globalThis.__mappingAuditCount = 0;
  await assert.rejects(lib.saveSalesManagerMapping(await moveInput(retainedUnit, unit), prefix), /fixture audit unavailable/);
  globalThis.__rejectMappingAudit = false;
  assert.deepEqual(await rowState(retainedUnit), sourceBefore);
  assert.deepEqual(await rowState(unit), destinationBefore);
  assert.equal((await history(retainedUnit)).length, sourceHistory);
  assert.equal((await history(unit)).length, destinationHistory);
  assert.deepEqual((await db.query("SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[]) ORDER BY employee_id", [staff])).rows, employeeBefore);
  assert.equal(await sourceDigest(), originalSources, "Imported user records must remain byte-for-byte unchanged");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM crm.sales_manager_enrollments WHERE employee_id=ANY($1::int[])", [staff])).rows[0].n, 0,
    "Legacy team mapping must not create manager designations");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM crm.sales_manager_enrollments WHERE employee_id=$1", [nationalEmployee])).rows[0].n, 1);
  assert(!lib.SaveSalesManagerMappingBody.safeParse({ ...(await input(unit, staff[0], 5)), catalog: "gi-units" }).success);
  console.log("PASS: multi-team ownership; atomic Unit/Branch/Region moves and destination replacement; stale source/destination conflicts; one current manager; hierarchy and MIS eligibility; paired history and rollback after second audit failure; orphan removal; unchanged accounts/source; all fixtures rolled back.");
} finally {
  globalThis.__rejectMappingAudit = false;
  if (connected) { await db.query("ROLLBACK").catch(() => {}); await db.end(); }
  delete globalThis.__mappingDb; delete globalThis.__rejectMappingAudit;
  delete globalThis.__mappingAuditCount;
  await rm(dir, { recursive: true, force: true });
}
