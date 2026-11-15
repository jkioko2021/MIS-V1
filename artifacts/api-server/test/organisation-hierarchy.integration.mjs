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
  for(let i=0;i<10;i++)staff.push((await db.query(`INSERT INTO crm.employees
    (username,employee_name,emp_code,email,password_hash,profile_id,activated,approved,department)
    VALUES($1,$1,$1,$2,'not-a-login-hash',CASE WHEN $3 THEN
      (SELECT profile_id FROM crm.profiles WHERE lower(btrim(profile_name))='sales manager' AND is_active)
      ELSE 3 END,true,true,'Sales') RETURNING *`,
    [`${prefix}_${i}`,`${prefix}_${i}@example.test`,i!==8])).rows[0]);
  const identityBefore=JSON.stringify(staff);
  const admin={sub:staff[0].employee_id,profileId:1,username:prefix,sid:randomUUID(),name:prefix};
  const user=i=>({...admin,sub:staff[i].employee_id,profileId:staff[i].profile_id,username:staff[i].username});
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
    parent_id:parent,manager_id:levels[i%4]==="BRANCH"?null:managers[i].id,is_active:true});
  await assert.rejects(lib.createSalesNode({...input(0),manager_id:null},prefix),e=>e.status===400);
  await assert.rejects(lib.createSalesNode(input(1),prefix),e=>e.status===400);
  const nodes=[];
  for(let i=0;i<8;i++)nodes.push(await lib.createSalesNode(input(i,i%4?nodes[i-1].id:null),prefix));
  const hiddenManagers=[];
  for(let i=0;i<4;i++){
    const hidden=(await db.query(`INSERT INTO crm.sales_manager_enrollments
      (employee_id,level,is_active,created_by,updated_by) VALUES($1,$2,true,$3,$3) RETURNING id`,
      [staff[8].employee_id,levels[i],prefix])).rows[0].id;
    hiddenManagers.push(hidden);
    await assert.rejects(lib.createSalesNode({...input(i,i?nodes[i-1].id:null),
      code:`${prefix}_DENIED${i}`,name:`${prefix} denied ${i}`,manager_id:hidden},prefix),
      e=>e.status===400&&(i===2?/Branches have no/.test(e.message):/Sales Manager profile/.test(e.message)));
    await assert.rejects(lib.updateSalesNode(nodes[i].id,{...input(i,i?nodes[i-1].id:null),
      manager_id:hidden,version:1},prefix),e=>e.status===400&&(i===2?/Branches have no/.test(e.message):/Sales Manager profile/.test(e.message)));
  }
  const profileFiltered=await lib.organisationSnapshot(admin);
  assert(profileFiltered.managers.every(m=>!hiddenManagers.includes(m.id)));
  assert(managers.every(m=>profileFiltered.managers.some(choice=>choice.id===m.id)));
  assert(profileFiltered.manager_users.some(choice=>choice.employee_id===staff[9].employee_id),
    "Sales Manager accounts must be listed before any category enrollment exists");
  assert(!profileFiltered.managers.some(choice=>choice.employee_id===staff[9].employee_id));
  assert(!profileFiltered.manager_users.some(choice=>choice.employee_id===staff[8].employee_id),
    "Other profiles must not appear in the Sales Manager account list");
  // Pending-source account links do not create nodes, enrollments or reporting rights.
  await db.query("SAVEPOINT pending_source_fixture");
  const hash=value=>createHash("sha256").update(value).digest("hex");
  const insertSource=async(catalog,code,data)=>(await db.query(`INSERT INTO crm.sales_catalog_source_records
    (catalog,code,name,source_file,file_sha256,source_line,row_sha256,data,issues,imported_by)
    VALUES($1,$2::text,$2::text,$2::text,$3,1,$3,$4::jsonb,'[]'::jsonb,$5) RETURNING *`,
    [catalog,code,hash(code),JSON.stringify(data),prefix])).rows[0];
  const managerSource=await insertSource("regional-managers",`${prefix}_RM`,{RM_ID:`${prefix}_RM`});
  const sourceRegion=await insertSource("sales-regions",`${prefix}_SOURCE_REGION`,{REGION_MGR_ID:managerSource.code,NSM_CODE:"SOURCE_NATIONAL"});
  const sourceBranch=await insertSource("sales-branches",`${prefix}_SOURCE_BRANCH`,{REGION_CODE:sourceRegion.code,NSM_CODE:"SOURCE_NATIONAL"});
  const identityKey=hash(`${prefix}_identity`);
  await db.query(`INSERT INTO crm.sales_manager_user_identities(identity_key,employee_id,created_by) VALUES($1,$2,$3)`,
    [identityKey,staff[9].employee_id,prefix]);
  await db.query(`INSERT INTO crm.sales_manager_user_sources(source_record_id,identity_key,source_row_sha256) VALUES($1,$2,$3)`,
    [managerSource.id,identityKey,managerSource.row_sha256]);
  for(const source of [sourceRegion,sourceBranch]){
    const branch=source.id===sourceBranch.id;
    await db.query(`INSERT INTO crm.organisation_source_setup
      (source_reference_id,source_row_sha256,manager_employee_id,manager_sources,manager_link_status,branch_approved,resolution_note,updated_by)
      VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8)`,[source.id,source.row_sha256,branch?null:staff[9].employee_id,
      JSON.stringify(branch?[]:[{source_record_id:managerSource.id,row_sha256:managerSource.row_sha256}]),
      branch?"NOT_REQUIRED":"MATCHED",branch,branch?"Approved for setup; operational setup pending.":"Verified source manager link.",prefix]);
  }
  const sourceCandidate=async(id)=>(await lib.organisationSnapshot(admin)).candidates.find(candidate=>candidate.source_reference_id===id);
  assert.equal((await sourceCandidate(sourceRegion.id)).linked_manager_employee_id,staff[9].employee_id);
  assert.equal((await sourceCandidate(sourceRegion.id)).manager_link_status,"MATCHED");
  assert.equal((await sourceCandidate(sourceBranch.id)).branch_approved,true);
  assert.equal((await sourceCandidate(sourceBranch.id)).linked_manager_employee_id,null);
  await db.query(`UPDATE crm.organisation_source_setup SET national_node_id=$1,national_source_code='SOURCE_NATIONAL'
    WHERE source_reference_id=ANY($2::integer[])`,[nodes[0].id,[sourceRegion.id,sourceBranch.id]]);
  assert.equal((await sourceCandidate(sourceRegion.id)).linked_national_node_id,nodes[0].id);
  assert.equal((await sourceCandidate(sourceRegion.id)).parent_code,input(0).code,"Region setup must use the explicitly mapped canonical National");
  assert.equal((await sourceCandidate(sourceBranch.id)).linked_national_name,input(0).name);
  const adoptRegion=parent_id=>lib.createSalesNode({...input(1,parent_id),code:sourceRegion.code,
    name:sourceRegion.name,source_reference_id:sourceRegion.id},prefix);
  await assert.rejects(adoptRegion(nodes[4].id),e=>e.status===400&&/mapped National/.test(e.message),
    "A source mapping cannot be adopted under another National");
  await db.query(`UPDATE crm.organisation_source_setup SET national_source_code='STALE_MAPPING' WHERE source_reference_id=$1`,[sourceRegion.id]);
  assert.equal((await sourceCandidate(sourceRegion.id)).linked_national_node_id,null,"A stale National mapping must fail closed");
  await assert.rejects(adoptRegion(nodes[0].id),e=>e.status===400&&/mapped National/.test(e.message));
  await db.query(`UPDATE crm.organisation_source_setup SET national_source_code='SOURCE_NATIONAL' WHERE source_reference_id=$1`,[sourceRegion.id]);
  await db.query("SAVEPOINT mapped_national_adoption");
  const adoptedRegion=await adoptRegion(nodes[0].id);
  assert.equal((await db.query("SELECT parent_id FROM crm.sales_structure_nodes WHERE id=$1",[adoptedRegion.id])).rows[0].parent_id,
    nodes[0].id,"Validated adoption must retain the approved National");
  await db.query("ROLLBACK TO SAVEPOINT mapped_national_adoption");
  await db.query("RELEASE SAVEPOINT mapped_national_adoption");
  assert.equal((await db.query("SELECT count(*)::int count FROM crm.sales_structure_nodes WHERE code=ANY($1)",[[sourceRegion.code,sourceBranch.code]])).rows[0].count,0);
  await assert.rejects(lib.organisationSnapshot(user(9)),e=>e.status===403,"Pending links cannot grant reporting scope");
  await db.query("UPDATE crm.employees SET employee_locked=true WHERE employee_id=$1",[staff[9].employee_id]);
  assert.equal((await sourceCandidate(sourceRegion.id)).manager_link_status,"UNRESOLVED","Locked accounts fail closed");
  await db.query("UPDATE crm.employees SET employee_locked=false WHERE employee_id=$1",[staff[9].employee_id]);
  await db.query("UPDATE crm.sales_catalog_source_records SET row_sha256=$2 WHERE id=$1",[managerSource.id,hash("changed manager source")]);
  assert.equal((await sourceCandidate(sourceRegion.id)).linked_manager_employee_id,null,"Stale identity provenance must not be reused");
  await db.query("UPDATE crm.sales_catalog_source_records SET row_sha256=$2 WHERE id=$1",[sourceBranch.id,hash("changed Branch source")]);
  assert.equal((await sourceCandidate(sourceBranch.id)).branch_approved,false,"Changed source rows require renewed approval");
  assert.equal((await sourceCandidate(sourceBranch.id)).linked_national_node_id,null,"Changed source rows must invalidate their National mapping");
  await db.query("ROLLBACK TO SAVEPOINT pending_source_fixture");
  await db.query("RELEASE SAVEPOINT pending_source_fixture");
  // Medical operating details are separate from authoritative identity/ancestry.
  const medicalBase={...input(3,nodes[2].id),code:`${prefix}_MED_UNIT`,name:`${prefix} Medical Unit`};
  const medical=await lib.createSalesNode({...medicalBase,medical_details:{
    UNIT_TYPE:"RETAIL",SPECIALITY:"MED",YEAR:"2026",VALID_FROM:"2026-01-01",VALID_TO:"2026-12-31",
    MIS_NO:"MED001",GI_UNIT:null,
  }},prefix);
  let medicalRow=(await db.query("SELECT * FROM crm.sales_structure_nodes WHERE id=$1",[medical.id])).rows[0];
  assert.equal(medicalRow.medical_details.UNIT_TYPE,"RETAIL");
  const medicalUpdate={name:medicalBase.name,parent_id:nodes[2].id,manager_id:managers[3].id,is_active:true,version:1};
  for(const values of [{REGION_CODE:"SPOOF"},{VALID_FROM:"2026-02-30"},{VALID_FROM:"2027-01-01"},
    {YEAR:"year"},{GI_UNIT:"NOT_AN_EXISTING_GI_UNIT"},{SPECIALITY:"TOO_LONG"}]){
    await assert.rejects(lib.updateSalesNode(medical.id,{...medicalUpdate,medical_details:values},prefix),e=>e.status===400);
  }
  assert.equal((await db.query("SELECT version FROM crm.sales_structure_nodes WHERE id=$1",[medical.id])).rows[0].version,1);
  await lib.updateSalesNode(medical.id,{...medicalUpdate,medical_details:{MIS_NO:"MED002",VALID_TO:null}},prefix);
  medicalRow=(await db.query("SELECT * FROM crm.sales_structure_nodes WHERE id=$1",[medical.id])).rows[0];
  assert.equal(medicalRow.medical_details.MIS_NO,"MED002");
  assert.equal(medicalRow.medical_details.UNIT_TYPE,"RETAIL","Partial updates retain operating fields");
  assert.equal(medicalRow.medical_details.VALID_TO,null,"Optional fields can be cleared");
  await assert.rejects(lib.updateSalesNode(medical.id,medicalUpdate,prefix),e=>e.status===409);
  await lib.updateSalesNode(medical.id,{...medicalUpdate,version:2},prefix);
  const medicalSnapshot=lib.GetOrganisationResponse.parse(await lib.organisationSnapshot(admin));
  assert.equal(medicalSnapshot.nodes.find(n=>n.id===medical.id).medical_details.MIS_NO,"MED002");
  const medicalAudit=(await db.query("SELECT after_data FROM crm.sales_setup_events WHERE entity_id=$1 AND action='UPDATED' ORDER BY id DESC LIMIT 1",[medical.id])).rows[0];
  assert.equal(medicalAudit.after_data.medical_details.MIS_NO,"MED002");
  await db.query("DELETE FROM crm.sales_structure_nodes WHERE id=$1",[medical.id]);
  await assert.rejects(lib.createSalesNode(input(0),prefix),e=>e.code==="23505");
  await assert.rejects(lib.createSalesNode({...input(1,nodes[2].id),code:`${prefix}_BAD_PARENT`},prefix),e=>e.status===400);
  await assert.rejects(lib.createSalesNode({...input(1,nodes[0].id),code:`${prefix}_BAD_MANAGER`,manager_id:managers[3].id},prefix),e=>e.status===400);
  const inactive=await lib.createSalesNode({...input(0),code:`${prefix}_INACTIVE`,name:`${prefix} inactive`,is_active:false},prefix);
  await assert.rejects(lib.createSalesNode({...input(1,inactive.id),code:`${prefix}_INACTIVE_CHILD`,is_active:false},prefix),e=>e.status===400);
  for(let i=0;i<4;i++){
    if(i===2){
      await assert.rejects(lib.organisationSnapshot(user(i)),e=>e.status===403,
        "Branches have no manager and cannot grant a Branch enrollment reporting scope");
      continue;
    }
    const snapshot=lib.GetOrganisationResponse.parse(await lib.organisationSnapshot(user(i)));
    assert.equal(snapshot.can_manage,false);
    assert.equal(snapshot.nodes.filter(n=>nodes.slice(0,4).some(row=>row.id===n.id)).length,4-i);
    assert(snapshot.nodes.every(n=>n.path.some(p=>p.id===nodes[i].id) || (i===0&&n.id===inactive.id)));
    assert(!snapshot.nodes.some(n=>nodes.slice(4).some(row=>row.id===n.id)));
    assert.equal(snapshot.managers.length,0);assert.equal(snapshot.candidates.length,0);
    assert.equal(snapshot.manager_users.length,0,"Scoped managers must not receive the global staff roster");
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
    manager_id:null,is_active:true,version:1},prefix),e=>e.status===400&&/Transfer/.test(e.message));
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
    [`${prefix}_REF`,`${prefix} reference`,JSON.stringify({REGION_CODE:`${prefix}_REF`,REGION_NAME:`${prefix} reference`,VALID_FROM:"2026-01-01",VALID_TO:"2026-12-31"})])).rows[0];
  const adoption={...input(1,nodes[0].id),code:`${prefix}_REF`,name:`${prefix} reference`};
  await assert.rejects(lib.createSalesNode(adoption,prefix),e=>e.status===400&&/reference/.test(e.message));
  const refSnapshot=await lib.organisationSnapshot(admin);
  assert.equal(refSnapshot.candidates.find(c=>c.source_reference_id===ref.id).medical_details.VALID_FROM,"2026-01-01");
  const adopted=await lib.createSalesNode({...adoption,source_reference_id:ref.id,medical_details:{VALID_TO:null}},prefix);
  const adoptedRow=(await db.query("SELECT medical_details FROM crm.sales_structure_nodes WHERE id=$1",[adopted.id])).rows[0];
  assert.equal(adoptedRow.medical_details.VALID_FROM,"2026-01-01");
  assert.equal(adoptedRow.medical_details.VALID_TO,null);
  assert.equal((await db.query("SELECT data->>'VALID_TO' AS date FROM crm.sales_catalog_source_records WHERE id=$1",[ref.id])).rows[0].date,"2026-12-31","Adoption never changes original imported values");
  await db.query("DELETE FROM crm.sales_structure_nodes WHERE source_reference_id=$1",[ref.id]);
  await db.query("DELETE FROM crm.sales_catalog_source_records WHERE id=$1",[ref.id]);
  assert.equal(await sourceHash(),beforeSource);
  const identities=(await db.query("SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[]) ORDER BY employee_id",[staff.map(s=>s.employee_id)])).rows;
  assert.equal(JSON.stringify(identities),identityBefore,"Hierarchy work must not change user accounts");
  console.log("PASS: Medical fields, inherited source defaults, partial edits, clearing, invalid dates/fields/GI links, stale writes and audit; four-level validation, scoped agents, transfer/history, source preservation and unchanged accounts.");
} finally {
  if(connected){await db.query("ROLLBACK").catch(()=>{});await db.end();}
  delete globalThis.__organisationTestDb;
  delete globalThis.__rejectOrganisationAudit;
  await rm(directory,{recursive:true,force:true});
}
