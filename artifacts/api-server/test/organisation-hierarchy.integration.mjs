// Real PostgreSQL workflow and scope checks. Every fixture and audit event is rolled back.
import assert from "node:assert/strict";
import { build } from "esbuild";
import pg from "pg";
import { mkdtemp,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID,createHash } from "node:crypto";

if(process.env.NODE_ENV==="production"||process.env.REPLIT_DEPLOYMENT)throw Error("Development only");
const directory=await mkdtemp(path.join(tmpdir(),"organisation-test-"));
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
globalThis.__organisationTestDb=db;
let connected=false;
try {
  await build({stdin:{contents:`export * from './artifacts/api-server/src/lib/sales-structure.ts';
    export * from './artifacts/api-server/src/lib/organisation.ts';
    export * from './artifacts/api-server/src/lib/intermediary.ts';
    export {GetOrganisationResponse,GetOrganisationAgentsResponse,GetOrganisationAgentHistoryResponse}
      from './lib/api-zod/src/index.ts';`,
    resolveDir:path.resolve(new URL("../../..",import.meta.url).pathname),loader:"ts"},
    outfile:path.join(directory,"service.mjs"),bundle:true,platform:"node",format:"esm",
    plugins:[{name:"rollback",setup(b){
      b.onResolve({filter:/^\.\/postgres$/},()=>({path:"postgres",namespace:"fixture"}));
      b.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:`
        export async function query(sql,params){return (await globalThis.__organisationTestDb.query(sql,params)).rows}
        export async function queryOne(sql,params){return (await query(sql,params))[0]??null}
        export async function withTransaction(fn){const db=globalThis.__organisationTestDb;
          await db.query('SAVEPOINT org_check');
          try{const result=await fn({query:(sql,params)=>{
            if(globalThis.__rejectOrganisationAudit&&/INSERT INTO crm.agent_unit_assignments/.test(sql))
              throw Error('fixture audit unavailable');
            return /^SET TRANSACTION/.test(sql)?Promise.resolve({rows:[],rowCount:0}):db.query(sql,params)}});
            await db.query('RELEASE SAVEPOINT org_check');return result}
          catch(err){await db.query('ROLLBACK TO SAVEPOINT org_check');throw err}}
      `}));
    }}]});
  const lib=await import(pathToFileURL(path.join(directory,"service.mjs")).href);
  await db.connect();connected=true;await db.query("BEGIN");
  const prefix=`ORG_${randomUUID().slice(0,8)}`.toUpperCase();
  const sourceHash=async()=>createHash("sha256").update(JSON.stringify((await db.query(
    "SELECT * FROM crm.sales_catalog_source_records ORDER BY id")).rows)).digest("hex");
  const beforeSource=await sourceHash();
  const staff=[];
  for(let i=0;i<8;i++)staff.push((await db.query(`INSERT INTO crm.employees
    (username,employee_name,emp_code,email,password_hash,profile_id,activated,approved,department)
    VALUES($1,$1,$1,$2,'not-a-login-hash',3,true,true,'Sales') RETURNING *`,
    [`${prefix}_${i}`,`${prefix}_${i}@example.test`])).rows[0]);
  const identityBefore=JSON.stringify(staff);
  const admin={sub:staff[0].employee_id,profileId:1,username:prefix,sid:randomUUID(),name:prefix};
  const user=i=>({...admin,sub:staff[i].employee_id,profileId:3,username:staff[i].username});
  const levels=["NATIONAL","REGION","BRANCH","UNIT"];
  const managers=[];
  for(let i=0;i<8;i++)managers.push(await lib.enrollSalesManager({
    employee_id:staff[i].employee_id,level:levels[i%4],is_active:true,details:{
      code:staff[i].emp_code,mis_emp_code:staff[i].emp_code,name:staff[i].employee_name,
      email:staff[i].email,hrmis_code:`000${i}`,mobile_no:"0700000000",h_tax:"0.100",
      valid_from:"2020-01-01",valid_to:"2099-12-31",
    }},prefix));
  const input=(i,parent=null)=>({code:`${prefix}_${levels[i%4]}${Math.floor(i/4)}`,
    name:`${prefix} ${levels[i%4]} ${Math.floor(i/4)}`,level:levels[i%4],
    parent_id:parent,manager_id:managers[i].id,is_active:true});
  await assert.rejects(lib.createSalesNode({...input(0),manager_id:null},prefix),e=>e.status===400);
  await assert.rejects(lib.createSalesNode(input(1),prefix),e=>e.status===400);
  const nodes=[];
  for(let i=0;i<8;i++)nodes.push(await lib.createSalesNode(input(i,i%4?nodes[i-1].id:null),prefix));
  await assert.rejects(lib.createSalesNode(input(0),prefix),e=>e.code==="23505");
  await assert.rejects(lib.createSalesNode({...input(1,nodes[2].id),code:`${prefix}_BAD_PARENT`},prefix),e=>e.status===400);
  await assert.rejects(lib.createSalesNode({...input(1,nodes[0].id),code:`${prefix}_BAD_MANAGER`,manager_id:managers[3].id},prefix),e=>e.status===400);
  const inactive=await lib.createSalesNode({...input(0),code:`${prefix}_INACTIVE`,name:`${prefix} inactive`,is_active:false},prefix);
  await assert.rejects(lib.createSalesNode({...input(1,inactive.id),code:`${prefix}_INACTIVE_CHILD`,is_active:false},prefix),e=>e.status===400);
  for(let i=0;i<4;i++){
    const snapshot=lib.GetOrganisationResponse.parse(await lib.organisationSnapshot(user(i)));
    assert.equal(snapshot.can_manage,false);
    assert.equal(snapshot.nodes.filter(n=>nodes.slice(0,4).some(row=>row.id===n.id)).length,4-i);
    assert(snapshot.nodes.every(n=>n.path.some(p=>p.id===nodes[i].id) || (i===0&&n.id===inactive.id)));
    assert(!snapshot.nodes.some(n=>nodes.slice(4).some(row=>row.id===n.id)));
    assert.equal(snapshot.managers.length,0);assert.equal(snapshot.candidates.length,0);
  }
  await assert.rejects(lib.organisationSnapshot({...user(0),sub:2147483647}),e=>e.status===403);
  const code=`${prefix}_AGENT`;
  await db.query(`INSERT INTO crm.tbl_mis_sales_intermediary
    (agent_code,agent_name,agent_type,user_id,registration_status,source_ref,unit_code,branch_code,region_code)
    VALUES($1,$1,'INDEPENDENT','core-id','PENDING',$1,'LEGACY_UNIT','LEGACY_BRANCH','LEGACY_REGION')`,[code]);
  const save={agent_code:code,agent_name:code,agent_type:"INDEPENDENT",user_id:"core-id",
    notes:"Capture agent Unit through the enrollment workflow",version:1,
    receive_date:"2020-01-01",contract_date:"2020-01-01",mobile_no:"0700000000"};
  await assert.rejects(lib.saveMaster(save,prefix,code),e=>e.status===400&&/Unit/.test(e.message));
  await assert.rejects(lib.performAction(code,{action:"COMPLETE_REGISTRATION",notes:"Missing Unit test",version:1},prefix),
    e=>e.status===400&&/organisation_unit_id/.test(e.message));
  await assert.rejects(lib.saveMaster({...save,organisation_unit_id:nodes[2].id},prefix,code),e=>e.status===400);
  const saved=await lib.saveMaster({...save,organisation_unit_id:nodes[3].id,
    unit_code:"SPOOF",branch_code:"SPOOF",region_code:"SPOOF"},prefix,code);
  assert.equal(saved.agent.organisation_unit_id,nodes[3].id);
  assert.equal(saved.agent.unit_code,input(3).code);
  assert.equal(saved.agent.branch_code,input(2).code);
  assert.equal(saved.agent.region_code,input(1).code);
  const source=(await db.query("SELECT unit_code,branch_code,region_code FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1",[code])).rows[0];
  assert.deepEqual(source,{unit_code:"LEGACY_UNIT",branch_code:"LEGACY_BRANCH",region_code:"LEGACY_REGION"});
  const report=lib.GetOrganisationAgentsResponse.parse(await lib.organisationAgents(user(3),{search:prefix}));
  assert.equal(report.items.length,1);assert.equal(report.items[0].hierarchy.length,4);
  assert.equal((await lib.organisationAgents(user(7),{search:prefix})).items.length,0);
  await assert.rejects(lib.organisationAgents(user(3),{node_id:nodes[7].id}),e=>e.status===403);
  await assert.rejects(lib.organisationAgents(user(3),{unmapped:true}),e=>e.status===403);
  await assert.rejects(lib.organisationAssignmentHistory(user(7),code),e=>e.status===404);
  const current=(await db.query("SELECT * FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1",[code])).rows[0];
  const today=(await db.query("SELECT CURRENT_DATE::text AS today")).rows[0].today;
  const transfer={unit_id:nodes[7].id,version:current.version,effective_date:today,reason:"Approved reassignment to the other National"};
  await assert.rejects(lib.saveOrganisationAssignment(code,transfer,user(3)),e=>e.status===403);
  await assert.rejects(lib.saveOrganisationAssignment(code,{...transfer,version:1},admin),e=>e.status===409);
  await assert.rejects(lib.saveOrganisationAssignment(code,{...transfer,effective_date:"2099-01-01"},admin),e=>e.status===400);
  await assert.rejects(lib.saveOrganisationAssignment(code,{...transfer,effective_date:"2026-02-30"},admin),e=>e.status===400);
  globalThis.__rejectOrganisationAudit=true;
  await assert.rejects(lib.saveOrganisationAssignment(code,transfer,admin),/fixture audit unavailable/);
  delete globalThis.__rejectOrganisationAudit;
  assert.equal((await db.query("SELECT organisation_unit_id FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1",[code])).rows[0].organisation_unit_id,nodes[3].id);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM crm.agent_unit_assignments WHERE agent_code=$1",[code])).rows[0].n,1);
  await assert.rejects(lib.updateSalesNode(nodes[3].id,{name:input(3).name,parent_id:nodes[2].id,
    manager_id:managers[3].id,is_active:false,version:1},prefix),e=>e.status===400&&/Transfer/.test(e.message));
  await assert.rejects(lib.updateSalesNode(nodes[2].id,{name:input(2).name,parent_id:nodes[5].id,
    manager_id:managers[2].id,is_active:true,version:1},prefix),e=>e.status===400&&/Transfer/.test(e.message));
  const yesterday=(await db.query("SELECT (CURRENT_DATE-1)::text AS date")).rows[0].date;
  await lib.saveOrganisationAssignment(code,transfer,admin);
  assert.equal((await lib.organisationAgents(user(3),{search:prefix})).items.length,0);
  assert.equal((await lib.organisationAgents(user(7),{search:prefix})).items.length,1);
  const historicalCode=`${prefix}_HIST`;
  await db.query("INSERT INTO crm.tbl_mis_sales_intermediary(agent_code,agent_name) VALUES($1,$1)",[historicalCode]);
  await lib.saveOrganisationAssignment(historicalCode,{...transfer,unit_id:nodes[3].id,version:1,effective_date:yesterday},admin);
  await lib.saveOrganisationAssignment(historicalCode,{...transfer,version:2},admin);
  const historical=await lib.organisationAgents(admin,{search:historicalCode,as_of:yesterday,node_id:nodes[0].id});
  assert.equal(historical.items[0].unit_id,nodes[3].id);
  const currentReport=await lib.organisationAgents(admin,{search:historicalCode});
  assert.equal(currentReport.items[0].unit_id,nodes[7].id);
  const history=lib.GetOrganisationAgentHistoryResponse.parse(await lib.organisationAssignmentHistory(admin,code));
  assert.equal(history.length,2);assert.equal(history[0].approved_by,prefix);assert.equal(history[0].from_unit,input(3).name);
  assert.equal(history[0].hierarchy[0].id,nodes[4].id);
  assert.equal((await lib.organisationAssignmentHistory(user(7),code)).length,1,"No other team's assignment history leaks");
  await assert.rejects(lib.salesSetupTransaction(async c=>{
    await c.query("UPDATE crm.agent_unit_assignments SET reason='tamper' WHERE agent_code=$1",[code]);
  }),e=>e.code==="23514");
  await assert.rejects(lib.performAction(code,{action:"COMPLETE_REGISTRATION",notes:"Review readiness",version:current.version+1},prefix),
    e=>e.status===400&&/licence/.test(e.message),"Unit assignment must not bypass licence or document gates");
  await db.query(`INSERT INTO crm.intermediary_licences
    (agent_code,licence_no,valid_from,valid_to,ira_compliant,kyc_compliant,contract_signed,status,entered_by)
    VALUES($1,$1,CURRENT_DATE-1,CURRENT_DATE+365,true,true,true,'VERIFIED',$2)`,[code,prefix]);
  await assert.rejects(lib.performAction(code,{action:"COMPLETE_REGISTRATION",notes:"Document gate test",version:current.version+1},prefix),
    e=>e.status===400&&/documents/.test(e.message));
  await db.query(`INSERT INTO crm.intermediary_documents
    (agent_code,title,file_name,content_type,file_size,object_path,uploaded_by,confirmed)
    VALUES($1,'Trusted test fixture','fixture.pdf','application/pdf',1,$2,$3,true)`,[code,`/test/${prefix}`,prefix]);
  const completed=await lib.performAction(code,{action:"COMPLETE_REGISTRATION",notes:"All registration gates satisfied",version:current.version+1},prefix);
  assert.equal(completed.agent.registration_status,"COMPLETED");
  assert.equal(completed.agent.organisation_unit_id,nodes[7].id);
  // Imported reference adoption uses its exact identity and recorded parent.
  const ref=(await db.query(`INSERT INTO crm.sales_catalog_source_records
    (catalog,code,name,data,source_file,file_sha256,source_line,row_sha256,issues,imported_by)
    SELECT 'sales-regions',$1,$2,$3::jsonb,'test','test',1,$1,'[]'::jsonb,'test' RETURNING id`,
    [`${prefix}_REF`,`${prefix} reference`,JSON.stringify({REGION_CODE:`${prefix}_REF`,REGION_NAME:`${prefix} reference`})])).rows[0];
  const adoption={...input(1,nodes[0].id),code:`${prefix}_REF`,name:`${prefix} reference`};
  await assert.rejects(lib.createSalesNode(adoption,prefix),e=>e.status===400&&/reference/.test(e.message));
  await lib.createSalesNode({...adoption,source_reference_id:ref.id},prefix);
  await db.query("DELETE FROM crm.sales_structure_nodes WHERE source_reference_id=$1",[ref.id]);
  await db.query("DELETE FROM crm.sales_catalog_source_records WHERE id=$1",[ref.id]);
  assert.equal(await sourceHash(),beforeSource);
  const identities=(await db.query("SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[]) ORDER BY employee_id",[staff.map(s=>s.employee_id)])).rows;
  assert.equal(JSON.stringify(identities),identityBefore,"Hierarchy work must not change user accounts");
  console.log("PASS: four-level CRUD/validation, enrollment Unit gate and derived codes, four manager scopes, ID tampering, atomic transfer, historical reporting, source adoption, immutable audit and unchanged accounts.");
} finally {
  if(connected){await db.query("ROLLBACK").catch(()=>{});await db.end();}
  delete globalThis.__organisationTestDb;
  delete globalThis.__rejectOrganisationAudit;
  await rm(directory,{recursive:true,force:true});
}
