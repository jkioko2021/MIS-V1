// Real development PostgreSQL; all synthetic rows are rolled back. No email or cloud calls.
import assert from "node:assert/strict";
import { build } from "esbuild";
import pg from "pg";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const dir = await mkdtemp(path.join(os.tmpdir(), "intermediary-test-"));
globalThis.__intermediaryDB = client;
try {
  await client.connect();
  await client.query("BEGIN");
  await build({
    stdin: { contents: `export * from './src/lib/intermediary.ts'; export * from './src/lib/intermediary-core-import.ts';`,
      resolveDir: process.cwd(), loader: "ts" }, outfile: path.join(dir, "test.mjs"),
    bundle: true, platform: "node", format: "esm", packages: "bundle",
    plugins: [{
      name: "transaction-fixture",
      setup(b) {
        b.onResolve({ filter: /^\.\/postgres$/ }, () => ({ path: "postgres", namespace: "fixture" }));
        b.onResolve({ filter: /^\.\/sqlserver$/ }, () => ({ path: "sqlserver", namespace: "fixture-sql" }));
        b.onLoad({ filter: /.*/, namespace: "fixture-sql" }, () => ({ contents:
          `export const sql={};export async function getPool(){throw new Error("No core calls allowed in rollback test");}` }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
          export async function query(sql,params){return (await globalThis.__intermediaryDB.query(sql,params)).rows;}
          export async function queryOne(sql,params){return (await query(sql,params))[0]??null;}
          export async function withTransaction(fn){
            const c=globalThis.__intermediaryDB;await c.query("SAVEPOINT intermediary_check");
            try{const r=await fn(c);await c.query("RELEASE SAVEPOINT intermediary_check");return r;}
            catch(e){await c.query("ROLLBACK TO SAVEPOINT intermediary_check");throw e;}
          }` }));
      },
    }],
  });
  const lib = await import(pathToFileURL(path.join(dir, "test.mjs")).href);
  const prefix = `QA_${randomUUID().slice(0, 8)}`, a = `${prefix}A`, b = `${prefix}B`, d = `${prefix}C`;
  assert.equal(await lib.canManageIntermediaries(1), true);
  assert.equal(await lib.canManageIntermediaries(3), false);
  assert.equal(await lib.canManageIntermediaries(10), false, "NSM is not National Sales Admin");
  const salesRole = (await client.query("SELECT profile_id FROM crm.profiles WHERE profile_name='National Sales Admin'")).rows[0].profile_id;
  assert.equal(await lib.canManageIntermediaries(salesRole), true);
  const source = code => ({ source_ref:code,agent_code:code,agent_name:code,agent_type:"INDEPENDENT",
    email:"first@example.test",mobile_no:"0700000000" });
  const create = async code => {
    assert.equal((await lib.importCoreRows([source(code)],"fixture_maker")).imported,1);
    return lib.detail(code);
  };
  let first = await create(a); await create(b); await create(d);
  await client.query("UPDATE crm.tbl_mis_sales_intermediary SET registration_status='COMPLETED' WHERE agent_code=ANY($1::text[])", [[b,d]]);
  assert.equal(first.agent.agent_status, "DRAFT");
  assert.equal(first.agent.registration_status,"PENDING");
  assert.equal(first.events[0].action,"CORE_IMPORTED");
  assert.equal((await lib.importCoreRows([{...source(a),agent_name:"Never overwrite MIS"}],"fixture_maker")).skipped,1);
  assert.equal((await lib.detail(a)).agent.agent_name,a);
  await assert.rejects(lib.saveMaster({...source(a),notes:"No manual creation"},"fixture_maker"),e=>e.status===405);
  await assert.rejects(lib.saveMaster({...source(a),agent_name:"Changed core name",notes:"Invalid",version:1},"fixture_maker",a),e=>e.status===400);
  first = await lib.saveMaster({agent_code:a,agent_name:a,agent_type:"INDEPENDENT",notes:"Retained note",
    version:first.agent.version,email:null}, "fixture_maker", a);
  assert.equal(first.agent.email, null, "Explicit clearing is saved");
  assert.equal(first.agent.mobile_no, "0700000000", "Omitted field is preserved");
  await assert.rejects(lib.saveMaster({agent_code:a,agent_name:a,agent_type:"INDEPENDENT",notes:"stale",version:1}, "fixture_maker", a), e=>e.status===409);
  await assert.rejects(lib.saveMaster({agent_code:a,agent_name:a,agent_type:"INDEPENDENT",notes:"date",receive_date:"2026-02-30",version:first.agent.version}, "fixture_maker",a), e=>e.status===400);
  const action = async (code, action, extra={}, actor="fixture_maker") => {
    const current = await lib.detail(code);
    return lib.performAction(code,{action,notes:"Synthetic action reason",version:current.agent.version,...extra},actor);
  };
  await assert.rejects(action(a,"REACTIVATE"),e=>e.status===400);
  for (const code of [b,d]) await action(code,"REACTIVATE");
  await assert.rejects(action(a,"COMPLETE_REGISTRATION"),e=>e.status===400);
  first = await action(a,"SAVE_DIRECTOR",{name:"Synthetic Director",email:"director@example.test"});
  const director=first.directors[0];
  first=await action(a,"SAVE_DIRECTOR",{director_id:director.director_id,director_version:director.version,name:"Changed Director"});
  assert.equal(first.directors[0].name,"Changed Director");
  await assert.rejects(action(a,"SAVE_DIRECTOR",{director_id:director.director_id,director_version:director.version,name:"Stale Director"}),e=>e.status===409);
  first=await action(a,"MAP",{to_code:b});
  assert.equal(first.mappings[0].to_code,b);
  await action(b,"MAP",{to_code:d});
  await assert.rejects(action(d,"MAP",{to_code:a}),e=>e.status===400);
  await assert.rejects(action(a,"MAP",{to_code:a}),e=>e.status===400);
  await action(a,"UNMAP");
  await action(b,"SUSPEND");
  await assert.rejects(action(a,"MAP",{to_code:b}),e=>e.status===400);
  await action(b,"TERMINATE");
  let second=await lib.detail(b);
  assert.equal(second.agent.terminated,1);
  second=await action(b,"REACTIVATE");
  assert.equal(second.agent.terminated,0);
  assert.equal(second.agent.terminate_date,null);
  const dates=(await client.query("SELECT (CURRENT_DATE-1)::text AS f,(CURRENT_DATE+365)::text AS t")).rows[0];
  first=await action(a,"SAVE_LICENCE",{licence_no:`IRA_${prefix}`,valid_from:dates.f,valid_to:dates.t,
    ira_compliant:true,kyc_compliant:true,contract_signed:true});
  const lid=first.licences[0].licence_id;
  await assert.rejects(action(a,"SUBMIT_LICENCE",{licence_id:lid}),e=>e.status===400);
  await client.query(`INSERT INTO crm.intermediary_documents(agent_code,title,file_name,content_type,file_size,object_path,uploaded_by,confirmed)
    VALUES($1,'Synthetic supporting record','fixture.pdf','application/pdf',5,$2,'fixture_maker',true)`,
    [a,`/objects/uploads/${randomUUID()}`]);
  first=await action(a,"SUBMIT_LICENCE",{licence_id:lid});
  assert.equal(first.licences[0].status,"SUBMITTED");
  await assert.rejects(action(a,"VERIFY_LICENCE",{licence_id:lid}),e=>e.status===403);
  first=await action(a,"DECLINE_LICENCE",{licence_id:lid},"fixture_checker");
  assert.equal(first.licences[0].status,"DECLINED");
  first=await action(a,"SAVE_LICENCE",{licence_id:lid,licence_no:`IRA_${prefix}`,valid_from:dates.f,valid_to:dates.t,
    ira_compliant:true,kyc_compliant:true,contract_signed:true});
  await action(a,"SUBMIT_LICENCE",{licence_id:lid});
  first=await action(a,"VERIFY_LICENCE",{licence_id:lid},"fixture_checker");
  assert.equal(first.licences[0].status,"VERIFIED");
  assert.equal(first.licences[0].reviewed_by,"fixture_checker");
  await assert.rejects(action(a,"SAVE_LICENCE",{licence_id:lid,licence_no:"bad",valid_from:dates.f,valid_to:dates.t}),e=>e.status===409);
  first=await lib.saveMaster({...first.agent,notes:"Complete complementary MIS details",unit_code:"UNIT-QA",region_code:"REG-QA",
    receive_date:dates.f,contract_date:dates.f},"fixture_maker",a);
  first=await action(a,"COMPLETE_REGISTRATION");
  assert.equal(first.agent.registration_status,"COMPLETED");
  assert.equal(first.agent.agent_status,"ACTIVE");
  assert(first.events.some(e=>e.action==="CORE_IMPORTED"),"Import provenance retained");
  assert(first.events.some(e=>e.notes==="Retained note"),"Changes retained");
  assert(first.events.some(e=>e.action.startsWith("VERIFY_LICENCE")),"Review audited");
  console.info("PASS: authorization, core-import deduplication, no manual creation, core identity locking, edit/clearing, concurrency, retained notes, directors, status, mapping/cycle, licence workflow and registration completion.");
} finally {
  await client.query("ROLLBACK").catch(()=>{});
  await client.end();
  await rm(dir,{recursive:true,force:true});
  delete globalThis.__intermediaryDB;
}
