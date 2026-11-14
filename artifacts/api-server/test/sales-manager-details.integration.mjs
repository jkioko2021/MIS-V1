// Uses the real development database; all records and audit events are rolled back.
import assert from "node:assert/strict";
import { build } from "esbuild";
import pg from "pg";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID, createHash } from "node:crypto";

const directory = await mkdtemp(path.join(tmpdir(), "manager-details-test-"));
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
globalThis.__managerDetailDb = db;
let connected = false;
try {
  await build({
    stdin: { contents: `export * from './artifacts/api-server/src/lib/sales-structure.ts';
      export * from './artifacts/api-server/src/lib/sales-manager-mapping.ts';
      export * from './artifacts/api-server/src/lib/sales-mapping-organizations.ts';
      export {EnrollSalesManagerBody,UpdateSalesManagerEnrollmentBody} from './lib/api-zod/src/index.ts';`,
      resolveDir: path.resolve(new URL("../../..", import.meta.url).pathname), loader: "ts" },
    outfile: path.join(directory, "service.mjs"), bundle: true, platform: "node", format: "esm",
    plugins: [{ name: "rollback", setup(b) {
      b.onResolve({ filter: /^\.\/postgres$/ }, () => ({ path: "postgres", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
        export async function withTransaction(fn){
          const db=globalThis.__managerDetailDb;
          await db.query('SAVEPOINT manager_details_check');
          try {const result=await fn(db);await db.query('RELEASE SAVEPOINT manager_details_check');return result;}
          catch(err){await db.query('ROLLBACK TO SAVEPOINT manager_details_check');throw err;}
        }` }));
    } }],
  });
  const lib = await import(pathToFileURL(path.join(directory, "service.mjs")).href);
  await db.connect(); connected = true; await db.query("BEGIN");
  const prefix = `MDET_${randomUUID().slice(0, 8)}`.toUpperCase();
  const staff = [];
  for (const suffix of ["A", "B", "NO_CODE", "NOT_SALES", "PENDING"]) {
    const name = `${prefix} ${suffix}`;
    staff.push((await db.query(`INSERT INTO crm.employees
      (username,employee_name,emp_code,email,password_hash,profile_id,activated,approved,department)
      VALUES($1,$1,$2,$4,'not-a-login-hash',3,$5,$5,$3)
      RETURNING employee_id,employee_name,emp_code`,
    [name, suffix === "NO_CODE" ? null : `${prefix}_${suffix}`, suffix === "NOT_SALES" ? "Finance" : "Sales",
      `${prefix}_${suffix}@example.test`, suffix !== "PENDING"])).rows[0]);
  }
  const ids = staff.map(row => row.employee_id);
  const accountSnapshot = (await db.query("SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[]) ORDER BY employee_id", [ids])).rows;
  const details = user => ({
    code: user.emp_code, name: user.employee_name, email: "manager-contact@example.test",
    hrmis_code: "000123", mobile_no: "+254 0700-001-002", h_tax: "0.100",
    mis_emp_code: user.emp_code, valid_from: "2026-01-01", valid_to: "2026-12-31",
  });
  const base = { employee_id: staff[0].employee_id, level: "UNIT", is_active: true, details: details(staff[0]) };
  const enroll = data => lib.enrollSalesManager(lib.EnrollSalesManagerBody.parse(data), prefix);
  const stored = async id => (await db.query("SELECT * FROM crm.sales_manager_enrollments WHERE id=$1", [id])).rows[0];
  assert(!lib.EnrollSalesManagerBody.safeParse({ employee_id: staff[0].employee_id, level: "UNIT" }).success);
  for (const key of ["code", "mis_emp_code", "name"])
    await assert.rejects(enroll({ ...base, details: { ...base.details, [key]: "FORGED" } }), e => e.status === 409);
  await assert.rejects(enroll({ ...base, employee_id: staff[2].employee_id,
    details: { ...details(staff[2]), code: "invented", mis_emp_code: "invented" } }), e => e.status === 400 && /with a code/.test(e.message));
  await assert.rejects(enroll({ ...base, employee_id: 2147483647 }), e => e.status === 400);
  await assert.rejects(enroll({ ...base, employee_id: staff[3].employee_id, details: details(staff[3]) }),
    e => e.status === 400 && /Sales department/.test(e.message));
  const pendingInput = { ...base, employee_id: staff[4].employee_id, details: details(staff[4]) };
  await assert.rejects(enroll(pendingInput), e => e.status === 400);
  const pendingManager = await enroll({ ...pendingInput, is_active: false });
  assert.equal((await stored(pendingManager.id)).is_active, false);
  await assert.rejects(lib.updateSalesManager(pendingManager.id, { is_active: true, version: 1 }, prefix), e => e.status === 400);
  assert.equal((await stored(pendingManager.id)).version, 1, "Capturing a designation must not approve or activate its user");
  for (const value of ["-0.1", "1e-3", "0.1234567"])
    assert(!lib.EnrollSalesManagerBody.safeParse({ ...base, details: { ...base.details, h_tax: value } }).success);
  for (const dates of [
    { valid_from: "2026-02-30" }, { valid_to: "2026-13-01" }, { valid_from: "2027-01-01" },
  ]) await assert.rejects(enroll({ ...base, details: { ...base.details, ...dates } }), e => e.status === 400 && /Valid/.test(e.message));
  const rows = [];
  for (const level of ["UNIT", "REGION", "BRANCH", "NATIONAL"]) {
    const saved = await enroll({ ...base, level });
    const row = await stored(saved.id);
    assert.deepEqual(row.manager_details, base.details);
    assert.equal(row.level, level);
    assert.equal(row.is_active, true);
    assert.equal(row.manager_details.h_tax, "0.100");
    assert.equal(row.manager_details.hrmis_code, "000123");
    rows.push(saved);
  }
  await assert.rejects(enroll(base), e => e.code === "23505");
  const unit = rows[0];
  const editedDetails = { ...base.details, email: "updated-manager@example.test", mobile_no: "0700 000 999", h_tax: "0.050",
    valid_from: "2024-02-29", valid_to: "2028-02-29" };
  const updated = await lib.updateSalesManager(unit.id, lib.UpdateSalesManagerEnrollmentBody.parse({
    is_active: true, version: unit.version, details: editedDetails,
  }), prefix);
  assert.equal(updated.version, 2);
  assert.deepEqual((await stored(unit.id)).manager_details, editedDetails);
  await assert.rejects(lib.updateSalesManager(unit.id, { is_active: true, version: 1, details: base.details }, prefix), e => e.status === 409);
  await lib.updateSalesManager(unit.id, { is_active: false, version: 2 }, prefix);
  assert.deepEqual((await stored(unit.id)).manager_details, editedDetails, "Status-only updates must retain every detail");
  const audit = (await db.query(`SELECT before_data,after_data FROM crm.sales_setup_events
    WHERE entity_type='MANAGER' AND entity_id=$1 ORDER BY id`, [unit.id])).rows;
  assert.equal(audit.length, 3);
  assert.equal(audit[0].after_data.manager_details.h_tax, "0.100");
  assert.equal(audit[1].before_data.manager_details.email, base.details.email);
  assert.equal(audit[1].after_data.manager_details.email, editedDetails.email);

  // Existing incomplete designations remain incomplete until explicitly completed.
  const legacy = (await db.query(`INSERT INTO crm.sales_manager_enrollments(employee_id,level,created_by,updated_by)
    VALUES($1,'UNIT',$2,$2) RETURNING id`, [staff[1].employee_id, prefix])).rows[0];
  assert.equal((await stored(legacy.id)).manager_details, null);
  await lib.updateSalesManager(legacy.id, { is_active: false, version: 1 }, prefix);
  await lib.updateSalesManager(legacy.id, { is_active: true, version: 2, details: details(staff[1]) }, prefix);
  assert.deepEqual((await stored(legacy.id)).manager_details, details(staff[1]));

  const hash = createHash("sha256").update(prefix).digest("hex");
  await db.query(`INSERT INTO crm.sales_catalog_source_records
    (catalog,code,name,source_file,file_sha256,source_line,row_sha256,data,issues,imported_by)
    VALUES('sales-regions',$1,$1,$2,$3,1,$3,$4::jsonb,'[]'::jsonb,$1)`,
  [prefix, `fixture-${prefix}.txt`, hash, JSON.stringify({ REGION_CODE: prefix, REGION_NAME: prefix })]);
  const region = (await lib.salesMappingOrganizations(db)).find(o => o.catalog === "sales-regions" && o.code === prefix);
  const mapping = await lib.saveSalesManagerMapping({ catalog: "sales-regions", organization_code: prefix,
    employee_id: staff[0].employee_id, expected_version: 0, hierarchy_version: region.hierarchy_version }, prefix);
  await assert.rejects(lib.updateSalesManager(rows[1].id, { is_active: false, version: 1 }, prefix),
    e => e.status === 400 && /Manager Mapping/.test(e.message));
  await lib.saveSalesManagerMapping({ catalog: "sales-regions", organization_code: prefix,
    employee_id: null, expected_version: mapping.version, hierarchy_version: region.hierarchy_version, note: "Clear fixture ownership" }, prefix);
  await lib.updateSalesManager(rows[1].id, { is_active: false, version: 1 }, prefix);
  await assert.rejects(lib.saveSalesManagerMapping({ catalog: "sales-regions", organization_code: prefix,
    employee_id: staff[0].employee_id, expected_version: 2, hierarchy_version: region.hierarchy_version }, prefix),
  e => e.status === 400 && /category is inactive/.test(e.message));
  assert.deepEqual((await db.query("SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[]) ORDER BY employee_id", [ids])).rows, accountSnapshot);
  console.log("PASS: all manager fields and four categories persist; existing MIS code/name enforced; no missing-user/code enrollment; exact tax/payroll/phone values; valid dates; edits, stale protection and retained history; legacy completion; mapped-team deactivation protection; accounts unchanged; fixtures rolled back.");
} finally {
  if (connected) { await db.query("ROLLBACK").catch(() => {}); await db.end(); }
  delete globalThis.__managerDetailDb;
  await rm(directory, { recursive: true, force: true });
}
