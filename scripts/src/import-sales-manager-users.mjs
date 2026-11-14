// Explicitly authorized, inactive-only development import. Never produces login passwords.
import { createRequire } from "node:module";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { MANAGER_CATALOGS, planManagerUsers } from "./sales-manager-user-plan.mjs";
const require = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
const { Client } = require("pg"); const bcrypt = require("bcrypt");
const apply = process.argv.includes("--apply");
if (process.env.NODE_ENV === "production") throw new Error("This import is development-only.");
const client = new Client({ connectionString: process.env.DATABASE_URL });
const actor = "system:sales-manager-user-import";
const fingerprint = rows => createHash("sha256").update(JSON.stringify(rows)).digest("hex");
const csvCell = value => {
  let text = String(value ?? "");
  if (/^[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
let inTransaction = false;
try {
  await client.connect();
  if (apply) {
    await client.query("BEGIN"); inTransaction = true;
    await client.query(await readFile(new URL("../../lib/db/migrations/0060_sales_manager_user_import.sql", import.meta.url), "utf8"));
    await client.query("COMMIT"); inTransaction = false;
  }
  const load = async () => {
    const sources = (await client.query(`SELECT * FROM crm.sales_catalog_source_records
      WHERE catalog=ANY($1::varchar[]) ORDER BY id`, [MANAGER_CATALOGS])).rows;
    const users = (await client.query(`SELECT employee_id,emp_code,username,employee_name,email,
      department,profile_id,is_deleted,activated,approved,employee_locked FROM crm.employees ORDER BY employee_id`)).rows;
    const installed = (await client.query("SELECT to_regclass('crm.sales_manager_user_identities') AS table_name")).rows[0].table_name;
    const identities = installed ? (await client.query("SELECT * FROM crm.sales_manager_user_identities")).rows : [];
    const links = installed ? (await client.query("SELECT * FROM crm.sales_manager_user_sources")).rows : [];
    return { sources, users, identities, links };
  };
  const before = await load();
  const plan = planManagerUsers(before.sources, before.users, before.identities, before.links);
  // Hash unique random, discarded values. No common/default/usable password is distributed.
  const hashes = new Map();
  if (apply) for (const group of plan.groups.filter(group => !group.account))
    hashes.set(group.identityKey, await bcrypt.hash(randomBytes(48).toString("base64url"), 12));
  if (apply) {
    await client.query("BEGIN"); inTransaction = true;
    await client.query("SELECT pg_advisory_xact_lock(82026,60)");
    await client.query("LOCK TABLE crm.employees IN SHARE ROW EXCLUSIVE MODE");
    await client.query(`SELECT id FROM crm.sales_catalog_source_records
      WHERE catalog=ANY($1::varchar[]) ORDER BY id FOR SHARE`, [MANAGER_CATALOGS]);
    const current = await load();
    if (fingerprint(current) !== fingerprint(before)) throw new Error("Source/accounts changed while preparing the import. Retry after review.");
    const profile = (await client.query("SELECT profile_name FROM crm.profiles WHERE profile_id=3 AND is_active")).rows[0];
    if (profile?.profile_name !== "Business Entry") throw new Error("Normal user profile changed; confirm the profile before importing.");
    let nextCode = BigInt((await client.query(`SELECT coalesce(max(
      (regexp_match(emp_code,'^EMP([0-9]+)$'))[1]::bigint),0)::text AS value FROM crm.employees`)).rows[0].value);
    for (const group of plan.groups) {
      if (!group.account) {
        nextCode += 1n;
        const empCode = `EMP${nextCode.toString().padStart(3, "0")}`;
        group.account = (await client.query(`INSERT INTO crm.employees
          (emp_code,username,employee_name,email,department,profile_id,password_hash,
           activated,approved,last_password_reset,added_by)
          VALUES($1,$2,$3,$4,'Sales',3,$5,false,false,NULL,$6)
          RETURNING employee_id,emp_code,username`, [
          empCode, group.username, group.name, group.email, hashes.get(group.identityKey), actor,
        ])).rows[0];
        await client.query(`INSERT INTO crm.sales_manager_user_identities(identity_key,employee_id,created_by)
          VALUES($1,$2,$3)`, [group.identityKey, group.account.employee_id, actor]);
        group.created = true;
      }
      for (const row of group.rows) await client.query(`INSERT INTO crm.sales_manager_user_sources
        (source_record_id,identity_key,source_row_sha256) VALUES($1,$2,$3)
        ON CONFLICT(source_record_id) DO NOTHING`, [row.id, group.identityKey, row.row_sha256]);
    }
    const afterSources = (await load()).sources;
    if (fingerprint(afterSources) !== fingerprint(before.sources)) throw new Error("Source preservation check failed.");
    const afterExisting = (await client.query(`SELECT employee_id,emp_code,username,employee_name,email,
      department,profile_id,is_deleted,activated,approved,employee_locked FROM crm.employees WHERE employee_id=ANY($1::int[]) ORDER BY employee_id`,
    [before.users.map(user => user.employee_id)])).rows;
    if (fingerprint(afterExisting) !== fingerprint(before.users)) throw new Error("Existing account preservation check failed.");
    await client.query("COMMIT"); inTransaction = false;
  }
  const report = [["Status", "Name", "Email", "MIS code", "Username", "Department", "Source records", "Notes"]];
  for (const group of plan.groups) report.push([
    apply ? group.created ? "Created inactive" : "Existing imported account" : group.account ? "Existing imported account" : "Proposed inactive",
    group.name, group.email, group.account?.emp_code, group.account?.username ?? group.username, "Sales",
    group.rows.map(row => `${row.catalog}:${row.code}:line ${row.source_line}`).join("; "),
    group.warnings || "Activation, approval and individual password setup required",
  ]);
  for (const held of plan.held) report.push(["Held for review", held.rows[0].name,
    held.rows[0].data.EMAIL, "", "", "", held.rows.map(row => `${row.catalog}:${row.code}:line ${row.source_line}`).join("; "), held.reason]);
  await mkdir(new URL("../../generated-artifacts/", import.meta.url), { recursive: true });
  const reportPath = `generated-artifacts/sales-manager-users-${randomUUID().slice(0, 8)}.csv`;
  await writeFile(new URL(`../../${reportPath}`, import.meta.url), report.map(row => row.map(csvCell).join(",")).join("\r\n"));
  console.log(JSON.stringify({ applied: apply, sourceRows: before.sources.length,
    uniqueAccounts: plan.groups.length, created: plan.groups.filter(group => group.created).length,
    reused: plan.groups.filter(group => group.account && !group.created).length,
    linkedSourceRows: plan.groups.reduce((count, group) => count + group.rows.length, 0),
    heldSourceRows: plan.held.reduce((count, group) => count + group.rows.length, 0), reportPath }));
} catch (error) {
  if (inTransaction) await client.query("ROLLBACK");
  throw error;
} finally { await client.end(); }
