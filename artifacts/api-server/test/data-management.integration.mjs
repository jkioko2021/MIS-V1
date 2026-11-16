// Uses real PostgreSQL and the real import services. Every fixture is rolled back.
import assert from "node:assert/strict";
import { build } from "esbuild";
import pg from "pg";
import bcrypt from "bcrypt";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT) throw Error("Development only.");
const dir = await mkdtemp(path.join(tmpdir(), "data-import-test-"));
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
globalThis.__dataImportTestDb = db;
let connected = false;
try {
  await build({
    stdin: { contents: `export * from './src/lib/data-import.ts'; export * from './src/lib/data-extract.ts';
      export {detail} from './src/lib/intermediary.ts';
      export * from './src/lib/rm-management.ts';
      export {GetDataImportBatchResponse,GetRmManagementResponse,GetRmAgentsResponse} from '@workspace/api-zod';`,
    resolveDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") },
    outfile: path.join(dir, "service.mjs"), bundle: true, platform: "node", format: "esm",
    plugins: [{ name: "isolated-transaction", setup(b) {
      b.onResolve({ filter: /^\.\/postgres$/ }, () => ({ path: "postgres", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
        export async function query(sql,params){return (await globalThis.__dataImportTestDb.query(sql,params)).rows;}
        export async function queryOne(sql,params){return (await query(sql,params))[0]??null;}
        export async function withTransaction(fn) {
          const db=globalThis.__dataImportTestDb;await db.query('SAVEPOINT data_import_test');
          try {const out=await fn({query:(sql,params)=>{
            if(globalThis.__dataImportFailAudit&&/INSERT INTO crm.(admin_audit_trail|rm_management_events)/.test(sql))throw Error('Fixture audit failure');
            return /^SET TRANSACTION/.test(sql)?Promise.resolve({rows:[],rowCount:0}):db.query(sql,params);
          }});await db.query('RELEASE SAVEPOINT data_import_test');return out;}
          catch(error){await db.query('ROLLBACK TO SAVEPOINT data_import_test');throw error;}
        }
      ` }));
    } }],
  });
  const lib = await import(pathToFileURL(path.join(dir, "service.mjs")).href);
  // Parser: quotes, UTF-8 BOM, literal text identifiers and multiline cells.
  const sample = '\uFEFFEMP_CODE,USERNAME,NAME,PROFILE_NAME\n0001,u,"A, B\nC",Sales Manager\n';
  assert.equal(lib.parseExtract("users", sample)[0].values.EMP_CODE, "0001");
  assert.equal(lib.parseExtract("users", sample)[0].values.NAME, "A, B\nC");
  for (const text of ["EMP_CODE,USERNAME,NAME,PROFILE_NAME,PASSWORD\n1,a,b,c,p",
    "AGENT_CODE,REF_NO,AGENT_NAME,AGENT_TYPE\nA,A,A,A",
    "AGENT_CODE,AGENT_NAME,AGENT_TYPE\nA,\"Unclosed,A",
    "AGENT_CODE,AGENT_NAME,AGENT_TYPE\nA,B"]) {
    assert.throws(() => lib.parseExtract(text.startsWith("EMP") ? "users" : "agents", text), e => e.status === 400);
  }
  await db.connect(); connected = true; await db.query("BEGIN");
  const prefix = `DMI_${randomUUID().slice(0, 8)}`;
  const admin = (await db.query(`INSERT INTO crm.employees(emp_code,username,employee_name,password_hash,profile_id,activated,approved)
    VALUES($1,$1,$1,'not-a-login-hash',1,true,true) RETURNING employee_id`, [prefix])).rows[0];
  const actor = { username: prefix, sub: admin.employee_id };
  const profile = (await db.query("SELECT profile_name FROM crm.profiles WHERE profile_id NOT IN(1,2) AND is_active ORDER BY profile_id LIMIT 1")).rows[0].profile_name;
  const usersHeader = "EMP_CODE,USERNAME,NAME,EMAIL,MOBILE_NO,DEPARTMENT,PROFILE_NAME\n";
  const usersText = usersHeader + `${prefix}_U,${prefix}_u,"Synthetic, User",${prefix}@example.test,0700000123,Sales,${profile}`;
  const preview = await lib.previewImport("users", "users.csv", usersText, prefix);
  lib.GetDataImportBatchResponse.parse(preview);
  assert.equal(preview.status, "VALIDATED");
  assert.equal((await db.query("SELECT 1 FROM crm.employees WHERE username=$1", [`${prefix}_u`])).rowCount, 0, "Preview never creates accounts");
  const imported = await lib.commitImport(preview.id, actor);
  assert.equal(imported.summary.imported, 1, "JSONB round trips do not create false changed-preview results");
  const user = (await db.query("SELECT * FROM crm.employees WHERE username=$1", [`${prefix}_u`])).rows[0];
  assert.equal(user.activated, false); assert.equal(user.approved, false);
  assert.equal(user.last_password_reset, null); assert.equal(user.mobile_no, "0700000123");
  assert.equal(await bcrypt.compare("AAR@2024!", user.password_hash), false, "No usable/default imported credential");
  assert.equal((await lib.commitImport(preview.id, actor)).summary.imported, 1, "Same batch replay is idempotent");
  const existingSnapshot = JSON.stringify(user);
  const duplicate = await lib.previewImport("users", "again.csv", usersText, prefix);
  assert.equal(duplicate.summary.skipped, 1);
  await assert.rejects(lib.commitImport(duplicate.id, actor), e => e.status === 400);
  assert.equal(JSON.stringify((await db.query("SELECT * FROM crm.employees WHERE employee_id=$1", [user.employee_id])).rows[0]), existingSnapshot);
  const invalid = await lib.previewImport("users", "bad.csv", usersHeader +
    `${prefix}_X,${prefix}_x,X,x@example.test,,Sales,Not a real profile`, prefix);
  assert.equal(invalid.status, "BLOCKED");
  assert.equal((await lib.commitImport(invalid.id, actor)).summary.imported, 0);
  const repeated = await lib.previewImport("users", "duplicates.csv", `${usersText}\n${usersText.split("\n")[1]}`, prefix);
  assert(repeated.summary.errors > 0, "File-level duplicate identities block the entire import");
  const restricted = await lib.previewImport("users", "restricted.csv", usersText.replaceAll(`${prefix}_u`, `${prefix}_v`).replaceAll(`${prefix}_U`, `${prefix}_V`).replaceAll(`${prefix}@`, `${prefix}_v@`), prefix);
  await assert.rejects(lib.commitImport(restricted.id, { username: "not-admin", sub: user.employee_id }), e => e.status === 403);
  const stale = await lib.previewImport("users", "stale.csv", usersHeader +
    `${prefix}_S,${prefix}_s,S,${prefix}_s@example.test,,Sales,${profile}`, prefix);
  await db.query(`INSERT INTO crm.employees(emp_code,username,employee_name,password_hash,profile_id)
    VALUES($1,$2,'Concurrent identity','not-a-login-hash',1)`, [`${prefix}_OTHER`, `${prefix}_s`]);
  assert.equal((await lib.commitImport(stale.id, actor)).status, "BLOCKED", "Commit revalidates newly conflicting identities");
  const medical = (await db.query(`SELECT n.code FROM crm.sales_structure_nodes n
    JOIN crm.organisation_paths p ON p.id=n.id WHERE n.level='UNIT' AND p.available ORDER BY n.id LIMIT 1`)).rows[0];
  const gi = (await db.query(`SELECT n.code,coalesce(nullif(btrim(m.details->>'GI_UM_ID'),''),e.emp_code) manager_code
    FROM crm.gi_structure_nodes n JOIN crm.gi_manager_enrollments m ON m.id=n.manager_id
    JOIN crm.employees e ON e.employee_id=m.employee_id WHERE n.level='UNIT' AND n.status='ACTIVE'
    AND m.is_active ORDER BY n.id LIMIT 1`)).rows[0];
  const agentCode = `${prefix}/A`;
  const agentText = `REF_NO,AGENT_NAME,AGENT_TYPE,UNIT_CODE,GI_CODE,USER_ID,HRMIS_CODE,H_TAX,EMAIL,CONTRACT_DATE\n${agentCode},"Synthetic, Agency",BROKER,${medical.code},${gi.code},2013031715171911335500911,000123,0.100,malformed email,2026-01-01`;
  const agentPreview = await lib.previewImport("agents", "agents.csv", agentText, prefix);
  assert.equal(agentPreview.summary.errors, 0);
  assert.equal(agentPreview.summary.warnings, 1);
  const agentImported = await lib.commitImport(agentPreview.id, actor);
  assert.equal(agentImported.summary.imported, 1);
  const agent = (await db.query("SELECT * FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1", [agentCode])).rows[0];
  assert.equal(agent.registration_status, "PENDING");
  assert(agent.organisation_unit_id); assert.equal(agent.gi_code, gi.manager_code);
  assert.equal(agent.user_id, "2013031715171911335500911"); assert.equal(agent.hrmis_code, "000123");
  assert.equal(agent.source_data.data.H_TAX, "0.100"); assert.equal(agent.source_data.data.GI_CODE, gi.code);
  assert.equal((await db.query("SELECT count(*)::int n FROM crm.agent_unit_assignments WHERE agent_code=$1", [agentCode])).rows[0].n, 1);
  assert.equal((await lib.previewImport("agents", "repeat.txt", agentText, prefix)).summary.skipped, 1);
  const coded = await lib.previewImport("agents", "coded.csv", `AGENT_CODE,AGENT_NAME,AGENT_TYPE,CODED\n${prefix}_CODED,Coded,BROKER,1`, prefix);
  assert.equal(coded.summary.skipped, 1);
  const badDate = await lib.previewImport("agents", "date.csv", `AGENT_CODE,AGENT_NAME,AGENT_TYPE,RECEIVE_DATE\n${prefix}_DATE,Date,BROKER,2026-02-30`, prefix);
  assert.equal(badDate.status, "BLOCKED");
  const year = Number((await db.query("SELECT extract(year FROM CURRENT_DATE)::int y")).rows[0].y);
  const rmCode = `00${randomUUID().slice(0, 6)}`;
  const rmText = `RE_CODE,RE_NAME,CLASS_CODE,C_CODE,YEAR,IS_ACTIVE\n${rmCode},Corporate Test,CORP_01,C,${year},1\n${rmCode},Retail Test,RET_01,R,${year},1`;
  const rmPreview = await lib.previewImport("relationship-managers", "rm.csv", rmText, prefix);
  assert.equal(rmPreview.summary.new, 2);
  assert.equal((await lib.commitImport(rmPreview.id, actor)).summary.imported, 2);
  await db.query("UPDATE crm.tbl_mis_sales_intermediary SET rms_code_corp=$2,rms_code_ret=$2 WHERE agent_code=$1", [agentCode, rmCode]);
  const resolved = (await lib.detail(agentCode)).agent;
  assert.equal(resolved.rms_code_corp, rmCode, "Leading zeros stay intact");
  assert.equal(resolved.rms_corp_name, "Corporate Test");
  assert.equal(resolved.rms_ret_name, "Retail Test", "Same code resolves independently by business category");
  await db.query(`INSERT INTO crm.relationship_managers(re_code,re_name,class_code,c_code,reporting_year,is_active,source_data,created_by)
    VALUES($1,'Future manager','CORP_01','C',$2,true,'{}'::jsonb,$3)`, [rmCode, year + 1, prefix]);
  assert.equal((await lib.detail(agentCode)).agent.rms_corp_name, "Corporate Test", "Future reporting-year rows do not replace the current manager");
  await db.query("UPDATE crm.relationship_managers SET is_active=false WHERE re_code=$1 AND c_code='C' AND reporting_year=$2", [rmCode, year]);
  assert.equal((await lib.detail(agentCode)).agent.rms_corp_name, null, "An inactive latest applicable reference cannot resolve a manager name");
  assert.equal((await lib.previewImport("relationship-managers", "same.csv", rmText, prefix)).summary.skipped, 2);
  // Retention-admin lifecycle, independent category assignments and frozen bulk transfers.
  const retention = (await db.query("SELECT profile_id FROM crm.profiles WHERE profile_name='Retention Admin'")).rows[0].profile_id;
  await db.query("UPDATE crm.employees SET profile_id=$2 WHERE employee_id=$1", [actor.sub, retention]);
  assert.equal((await lib.rmSnapshot(actor)).year, year, "Retention Admin can maintain references without broader import access");
  const sourceCode=`00${randomUUID().slice(0,6)}`, destinationCode=`00${randomUUID().slice(0,6)}`;
  const thirdCode=`00${randomUUID().slice(0,6)}`, secondAgent=`${prefix}_B`;
  const managerInput=(code,name,category="C")=>({code,name,category,class_code:category==="C"?"CORP_01":"RET_01",
    year,active:true,version:0,reason:"Fixture management test"});
  let source=await lib.saveRm(managerInput(sourceCode,"Source fixture"),actor);
  const destination=await lib.saveRm(managerInput(destinationCode,"Destination fixture"),actor);
  const third=await lib.saveRm(managerInput(thirdCode,"Third fixture"),actor);
  await lib.saveRm(managerInput(sourceCode,"Retail fixture","R"),actor);
  await assert.rejects(()=>lib.saveRm(managerInput(sourceCode,"Duplicate"),actor),e=>e.status===409);
  source=await lib.saveRm({...managerInput(sourceCode,"Updated fixture"),version:source.version},actor);
  await assert.rejects(()=>lib.saveRm({...managerInput(sourceCode,"Stale"),version:1},actor),e=>e.status===409);
  await db.query("UPDATE crm.tbl_mis_sales_intermediary SET rms_code_corp=$2,rms_code_ret=$2 WHERE agent_code=$1", [agentCode,sourceCode]);
  await db.query(`INSERT INTO crm.tbl_mis_sales_intermediary(agent_code,agent_name,agent_type,rms_code_ret)
    VALUES($1,$1,'INDEPENDENT',$2)`, [secondAgent,sourceCode]);
  const originalProvenance=(await db.query("SELECT source_data FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1",[agentCode])).rows[0].source_data;
  const transferInput={category:"C",mode:"SELECTED",from_code:null,to_code:sourceCode,
    agent_codes:[secondAgent],reason:"Assign unassigned fixture"};
  const assigned=await lib.previewTransfer(transferInput,actor);
  assert.equal(Number.isFinite(Date.parse(assigned.expires_at)),true);
  await lib.commitTransfer(assigned.id,actor);
  const byManager=await lib.rmAgents({category:"C",manager_code:sourceCode,search:prefix,page:1,unassigned:false},actor);
  lib.GetRmAgentsResponse.parse(byManager);
  assert.equal(byManager.total,2);
  assert.ok(byManager.items.every(row=>row.current_name==="Updated fixture"));
  const retailNames=await lib.rmAgents({category:"R",manager_code:sourceCode,search:prefix,page:1},actor);
  assert.ok(retailNames.items.every(row=>row.current_name==="Retail fixture"));
  lib.GetRmManagementResponse.parse(await lib.rmSnapshot(actor));
  await assert.rejects(()=>lib.saveRm({...managerInput(sourceCode,"Updated fixture"),version:source.version,active:false},actor),e=>e.status===409);
  const bulkInput={...transferInput,mode:"ALL",from_code:sourceCode,to_code:destinationCode,agent_codes:[]};
  const bulk=await lib.previewTransfer(bulkInput,actor);
  assert.equal(bulk.changes,2);
  assert.equal((await db.query("SELECT rms_code_corp FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1",[secondAgent])).rows[0].rms_code_corp,sourceCode,"Preview cannot move agents");
  await db.query("UPDATE crm.tbl_mis_sales_intermediary SET version=version+1 WHERE agent_code=$1",[secondAgent]);
  await assert.rejects(()=>lib.commitTransfer(bulk.id,actor),e=>e.status===409);
  const refreshed=await lib.previewTransfer(bulkInput,actor);
  globalThis.__dataImportFailAudit=true;
  await assert.rejects(()=>lib.commitTransfer(refreshed.id,actor),/Fixture audit failure/);
  globalThis.__dataImportFailAudit=false;
  assert.equal((await db.query("SELECT count(*)::int n FROM crm.tbl_mis_sales_intermediary WHERE rms_code_corp=$1",[sourceCode])).rows[0].n,2,"Audit failure rolls back the whole bulk transfer");
  assert.equal((await lib.commitTransfer(refreshed.id,actor)).status,"COMMITTED");
  const afterBulk=(await db.query("SELECT agent_code,rms_code_corp,rms_code_ret,version,source_data FROM crm.tbl_mis_sales_intermediary WHERE agent_code=ANY($1)",[[agentCode,secondAgent]])).rows;
  assert.ok(afterBulk.every(a=>a.rms_code_corp===destinationCode && a.rms_code_ret===sourceCode),"Corporate moves must not change Retail assignments");
  assert.deepEqual(afterBulk.find(a=>a.agent_code===agentCode).source_data,originalProvenance,"Original upload remains immutable");
  await lib.commitTransfer(refreshed.id,actor);
  const replayed=(await db.query("SELECT agent_code,version FROM crm.tbl_mis_sales_intermediary WHERE agent_code=ANY($1)",[[agentCode,secondAgent]])).rows;
  assert.deepEqual(Object.fromEntries(replayed.map(a=>[a.agent_code,a.version])),
    Object.fromEntries(afterBulk.map(a=>[a.agent_code,a.version])),"Replaying transfer does not repeat updates");
  assert.equal((await db.query("SELECT count(*)::int n FROM crm.rm_management_events WHERE batch_id=$1",[refreshed.id])).rows[0].n,2);
  await lib.saveRm({...managerInput(sourceCode,"Updated fixture"),version:source.version,active:false},actor);
  await assert.rejects(()=>lib.previewTransfer({...transferInput,agent_codes:[agentCode]},actor),e=>e.status===400);
  const targetChanged=await lib.previewTransfer({...transferInput,to_code:thirdCode,agent_codes:[agentCode]},actor);
  await lib.saveRm({...managerInput(thirdCode,"Renamed target fixture"),version:third.version},actor);
  await assert.rejects(()=>lib.commitTransfer(targetChanged.id,actor),e=>e.status===409);
  const expired=await lib.previewTransfer({...transferInput,to_code:thirdCode,agent_codes:[agentCode]},actor);
  await db.query("UPDATE crm.rm_transfer_previews SET expires_at=now()-interval '1 minute' WHERE id=$1",[expired.id]);
  await assert.rejects(()=>lib.commitTransfer(expired.id,actor),e=>e.status===409);
  await db.query("UPDATE crm.employees SET profile_id=(SELECT min(profile_id) FROM crm.profiles WHERE profile_id NOT IN(1,2,$2)) WHERE employee_id=$1",[actor.sub,retention]);
  await assert.rejects(()=>lib.rmSnapshot(actor),e=>e.status===403);
  await db.query("UPDATE crm.employees SET profile_id=1 WHERE employee_id=$1",[actor.sub]);
  const rollback = await lib.previewImport("agents", "rollback.csv", `AGENT_CODE,AGENT_NAME,AGENT_TYPE\n${prefix}_ROLLBACK,Rollback,BROKER`, prefix);
  globalThis.__dataImportFailAudit = true;
  await assert.rejects(lib.commitImport(rollback.id, actor), /Fixture audit failure/);
  globalThis.__dataImportFailAudit = false;
  assert.equal((await db.query("SELECT 1 FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1", [`${prefix}_ROLLBACK`])).rowCount, 0, "Audit failure rolls back all inserts");
  assert.equal((await lib.loadImportBatch(rollback.id)).status, "VALIDATED");
  console.log("PASS: CSV/TSV validation, JSONB preview, inactive users, no default password, identities unchanged, duplicate/replay safety, late conflict revalidation, raw source preservation, Medical/GI and category/year-specific RM mapping, source-coded skips and atomic audit rollback.");
} finally {
  if (connected) await db.query("ROLLBACK").catch(() => {});
  await db.end(); await rm(dir, { recursive: true, force: true });
  delete globalThis.__dataImportTestDb; delete globalThis.__dataImportFailAudit;
}
