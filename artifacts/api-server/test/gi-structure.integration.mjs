// Real PostgreSQL, isolated fixtures and audit writes; all data rolled back.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import pg from 'pg';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
if(process.env.NODE_ENV==='production'||process.env.REPLIT_DEPLOYMENT)throw Error('Development only');
const dir=await mkdtemp(path.join(tmpdir(),'gi-structure-'));
const apiDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
globalThis.__giTestDb=db;
let connected=false;
try{
  await build({stdin:{contents:`export * from './src/lib/gi-structure.ts';
    export {organisationSnapshot} from './src/lib/organisation.ts';
    export {GetGiStructureResponse} from '@workspace/api-zod';`,
    resolveDir:apiDir},
    outfile:path.join(dir,'service.mjs'),bundle:true,platform:'node',format:'esm',
    plugins:[{name:'rollback',setup(b){
      b.onResolve({filter:/^\.\/postgres$/},()=>({path:'postgres',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`
        export async function withTransaction(fn){
          const db=globalThis.__giTestDb;await db.query('SAVEPOINT gi_check');
          try{const out=await fn({query:(sql,params)=>{
            if(globalThis.__giFailAudit&&/INSERT INTO crm.gi_structure_events/.test(sql))throw Error('audit fixture unavailable');
            return /^SET TRANSACTION/.test(sql)?Promise.resolve({rows:[],rowCount:0}):db.query(sql,params);
          }});await db.query('RELEASE SAVEPOINT gi_check');return out;}
          catch(error){await db.query('ROLLBACK TO SAVEPOINT gi_check');throw error;}
        }
      `}));
    }}]});
  const lib=await import(pathToFileURL(path.join(dir,'service.mjs')).href);
  await db.connect();connected=true;await db.query('BEGIN');
  const prefix=`GI_${randomUUID().slice(0,8)}`.toUpperCase();
  const salesProfile=(await db.query("SELECT profile_id FROM crm.profiles WHERE lower(btrim(profile_name))='sales manager' AND is_active")).rows[0].profile_id;
  const staff=[];
  for(let i=0;i<3;i++)staff.push((await db.query(`INSERT INTO crm.employees
    (username,employee_name,emp_code,email,password_hash,profile_id,activated,approved,department)
    VALUES($1,$1,$1,$2,'not-a-login-hash',$3,true,true,'Sales') RETURNING *`,
  [`${prefix}_${i}`,`${prefix}_${i}@example.test`,i===0?1:salesProfile])).rows[0]);
  const actor={sub:staff[0].employee_id,username:staff[0].username,profileId:1};
  const normal={sub:staff[1].employee_id,username:staff[1].username,profileId:salesProfile};
  await assert.rejects(lib.giStructureSnapshot(normal),e=>e.status===403);
  await assert.rejects(lib.giStructureSnapshot({...normal,profileId:1}),e=>e.status===403);
  const reason='Isolated GI integration verification';
  const mobile='+254 0700-001-002';
  await db.query('UPDATE crm.employees SET mobile_no=$1 WHERE employee_id=$2',[mobile,staff[1].employee_id]);
  const node=async(code,level,parent=null,manager=null,status='PENDING')=>{
    await lib.saveGiNode({id:null,version:0,code,name:code,level,status,parent_id:parent,manager_id:manager,reason},actor);
    return (await lib.giStructureSnapshot(actor)).nodes.find(n=>n.code===code);
  };
  const b1=await node(`${prefix}_B1`,'BRANCH',null,null,'ACTIVE');
  const b2=await node(`${prefix}_B2`,'BRANCH',null,null,'ACTIVE');
  const u1=await node(`${prefix}_U1`,'UNIT',b1.id);
  const u2=await node(`${prefix}_U2`,'UNIT',b1.id);
  const details={GI_UM_ID:`${prefix}_M`,GI_UM_NAME:'Original GI designation',GI_UNIT_CODE:u1.code,
    EMAIL:staff[1].email,HRMIS_CODE:'',MIS_EMP_CODE:'LEGACY_EMPLOYEE_CODE',EARN_RETAINER:true,
    NSM_CODE:'',VALID_FROM:'2020-01-01',VALID_TO:'2099-12-31',JOIN_DATE:'2020-01-01',
    RET_EFF_UPTO:'2021-12-31',RETAINER_AMT:'123456789012345678.123456'};
  const managerInput={id:null,version:0,employee_id:staff[1].employee_id,level:'UNIT',is_active:true,details,reason};
  const draftDetails={...details,GI_UM_ID:`${prefix}_DRAFT`,GI_UNIT_CODE:'',
    VALID_FROM:'',VALID_TO:'',JOIN_DATE:'',RET_EFF_UPTO:'',RETAINER_AMT:''};
  await lib.saveGiManagerEnrollment({...managerInput,employee_id:staff[1].employee_id,
    is_active:false,details:draftDetails},actor);
  let draft=(await lib.giStructureSnapshot(actor)).managers.find(m=>m.details.GI_UM_ID===draftDetails.GI_UM_ID);
  assert(draft,'Enrollment without primary Unit or activation must persist');
  assert.equal(draft.is_active,false);
  assert.equal(draft.details.GI_UNIT_CODE,'');
  await lib.saveGiManagerEnrollment({...managerInput,id:draft.id,version:draft.version,
    employee_id:staff[1].employee_id,is_active:false,
    details:{...draftDetails,GI_UM_NAME:'Updated draft manager'}},actor);
  draft=(await lib.giStructureSnapshot(actor)).managers.find(m=>m.id===draft.id);
  assert.equal(draft.details.GI_UM_NAME,'Updated draft manager');
  await lib.saveGiManagerEnrollment(managerInput,actor);
  let snapshot=await lib.giStructureSnapshot(actor);
  lib.GetGiStructureResponse.parse(snapshot);
  let manager=snapshot.managers.find(m=>m.details.GI_UM_ID===details.GI_UM_ID);
  assert.equal(manager.details.RETAINER_AMT,details.RETAINER_AMT,'No floating-point rounding');
  assert.equal(manager.mobile_no,mobile,'Manager mobile is read from the linked user account');
  assert.equal(snapshot.manager_users.find(u=>u.employee_id===staff[1].employee_id).mobile_no,mobile);
  await db.query('UPDATE crm.employees SET mobile_no=$1 WHERE employee_id=$2',['0722 001 003',staff[1].employee_id]);
  assert.equal((await lib.giStructureSnapshot(actor)).managers.find(m=>m.id===manager.id).mobile_no,'0722 001 003',
    'Account mobile edits appear without re-saving the designation');
  assert.equal(manager.details.MIS_EMP_CODE,'LEGACY_EMPLOYEE_CODE','Preserve legacy identifier independently from the account');
  assert.equal(manager.user_eligible,true,'Expired retainer term does not expire manager validity');
  const legacyEnrollment=(await db.query(`INSERT INTO crm.sales_manager_enrollments
    (employee_id,level,is_active,created_by,updated_by)
    VALUES($1,'UNIT',false,$2,$2) RETURNING id`,[staff[1].employee_id,prefix])).rows[0].id;
  async function sourceRecord(catalog,code,data={}){
    const hash=createHash('sha256').update(code).digest('hex');
    return (await db.query(`INSERT INTO crm.sales_catalog_source_records
      (catalog,code,name,source_file,file_sha256,source_line,row_sha256,data,issues,imported_by)
      VALUES($1,$2,$2,'gi-integration-fixture',$3,1,$3,$4::jsonb,'[]'::jsonb,$5) RETURNING id`,
    [catalog,code,hash,JSON.stringify(data),prefix])).rows[0].id;
  }
  const giSource=await sourceRecord('gi-unit-managers',`${prefix}_GIM`);
  await db.query(`INSERT INTO crm.sales_manager_enrollment_sources
    (source_reference_id,enrollment_id,source_row_sha256,source_domain,created_by)
    SELECT id,$2,row_sha256,'GI',$3 FROM crm.sales_catalog_source_records WHERE id=$1`,[giSource,legacyEnrollment,prefix]);
  let medical=await lib.organisationSnapshot(actor);
  assert(!medical.managers.some(m=>m.id===legacyEnrollment),'Medical must exclude GI-only legacy designations');
  assert(!medical.manager_users.some(u=>u.employee_id===staff[1].employee_id),'Medical selectors must exclude GI-only accounts');
  assert(medical.manager_users.some(u=>u.employee_id===staff[2].employee_id),'Unclassified Sales users remain selectable');
  assert((await lib.giStructureSnapshot(actor)).managers.some(m=>m.id===manager.id),'GI designation remains visible in GI');
  assert.equal((await db.query('SELECT id FROM crm.sales_manager_enrollments WHERE id=$1',[legacyEnrollment])).rowCount,1,
    'Visibility filtering must never delete original enrollments');
  const medicalSource=await sourceRecord('unit-managers',`${prefix}_MM`);
  await db.query(`INSERT INTO crm.sales_manager_enrollment_sources
    (source_reference_id,enrollment_id,source_row_sha256,source_domain,created_by)
    SELECT id,$2,row_sha256,'MEDICAL',$3 FROM crm.sales_catalog_source_records WHERE id=$1`,[medicalSource,legacyEnrollment,prefix]);
  medical=await lib.organisationSnapshot(actor);
  assert(medical.managers.some(m=>m.id===legacyEnrollment),'Genuine shared Medical/GI designation must remain visible');
  assert(medical.manager_users.some(u=>u.employee_id===staff[1].employee_id),'Dual-role user remains available in Medical');
  const editing={...managerInput,id:manager.id,version:manager.version};
  await assert.rejects(lib.saveGiManagerEnrollment({...editing,details:{...details,JOIN_DATE:'2026-02-30'}},actor),e=>e.status===400);
  await assert.rejects(lib.saveGiManagerEnrollment({...editing,details:{...details,RETAINER_AMT:'-1'}},actor),e=>e.status===400);
  await assert.rejects(lib.saveGiManagerEnrollment({...editing,details:{...details,GI_UNIT_CODE:b1.code}},actor),e=>e.status===400);
  await assert.rejects(lib.saveGiManagerEnrollment({...editing,version:0},actor),e=>e.status===409);
  const editNode=(n,patch={})=>lib.saveGiNode({id:n.id,version:n.version,code:n.code,name:n.name,
    level:n.level,status:n.status,parent_id:n.parent_id,manager_id:n.manager_id,reason,...patch},actor);
  await editNode(u1,{status:'ACTIVE',manager_id:manager.id});
  await editNode(u2,{status:'ACTIVE',manager_id:manager.id});
  snapshot=await lib.giStructureSnapshot(actor);
  assert(snapshot.nodes.find(n=>n.id===u1.id).available);
  assert(snapshot.nodes.find(n=>n.id===u2.id).available,'One manager may manage multiple GI Units');
  await assert.rejects(lib.saveGiManagerEnrollment({...editing,is_active:false},actor),e=>e.status===400);
  await assert.rejects(editNode(b1,{status:'INACTIVE'}),e=>e.status===400);
  const units=[];
  for(let i=0;i<2;i++){
    const code=`${prefix}_MED${i}`;
    await db.query(`INSERT INTO crm.sales_catalog_source_records
      (catalog,code,name,source_file,file_sha256,source_line,row_sha256,data,issues,imported_by)
      VALUES('sales-units',$1,$1,'gi-integration-fixture',$2,$3,$2,$4::jsonb,'[]'::jsonb,$5)`,
    [code,createHash('sha256').update(code).digest('hex'),i+1,JSON.stringify({UNIT_CODE:code,UNIT_NAME:code}),prefix]);
    units.push(code);
  }
  const sourceHash=async()=>createHash('sha256').update(JSON.stringify((await db.query(
    'SELECT * FROM crm.sales_catalog_source_records ORDER BY id')).rows)).digest('hex');
  const originalSource=await sourceHash();
  const userIdentity=JSON.stringify((await db.query('SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[])',[staff.map(s=>s.employee_id)])).rows);
  await lib.saveGiMappings({gi_unit_id:u1.id,units:units.map(code=>({medical_unit_code:code,version:0})),reason},actor);
  snapshot=await lib.giStructureSnapshot(actor);
  for(const code of units){
    const mapped=snapshot.medical_units.find(u=>u.code===code);
    assert.equal(mapped.gi_unit_id,u1.id);assert.equal(mapped.mapping_version,1);
    assert.equal(mapped.mapping_available,false,'Pending Medical units must remain setup-only');
  }
  await assert.rejects(lib.saveGiMappings({gi_unit_id:u2.id,units:[
    {medical_unit_code:units[0],version:1},{medical_unit_code:units[1],version:0}],reason},actor),e=>e.status===409);
  assert.equal((await lib.giStructureSnapshot(actor)).medical_units.find(u=>u.code===units[0]).gi_unit_id,u1.id,
    'Stale bulk request must not partially move Medical Units');
  await lib.saveGiMappings({gi_unit_id:u2.id,units:[{medical_unit_code:units[0],version:1}],reason},actor);
  snapshot=await lib.giStructureSnapshot(actor);
  assert.equal(snapshot.medical_units.find(u=>u.code===units[1]).gi_unit_id,u1.id);
  const currentU2=snapshot.nodes.find(n=>n.id===u2.id);
  await assert.rejects(editNode(currentU2,{parent_id:b2.id}),e=>e.status===400);
  await assert.rejects(editNode(currentU2,{status:'INACTIVE'}),e=>e.status===400);
  globalThis.__giFailAudit=true;
  await assert.rejects(lib.removeGiMapping({medical_unit_code:units[0],version:2,reason},actor),/audit fixture/);
  globalThis.__giFailAudit=false;
  assert.equal((await lib.giStructureSnapshot(actor)).medical_units.find(u=>u.code===units[0]).mapping_version,2);
  await lib.removeGiMapping({medical_unit_code:units[0],version:2,reason},actor);
  const removed=(await lib.giStructureSnapshot(actor)).medical_units.find(u=>u.code===units[0]);
  assert.equal(removed.gi_unit_id,null);assert.equal(removed.mapping_version,3);
  await assert.rejects(lib.saveGiMappings({gi_unit_id:u1.id,units:[{medical_unit_code:units[0],version:0}],reason},actor),e=>e.status===409);
  const history=await lib.giStructureHistory(actor,'MAPPING',units[0]);
  assert.equal(history.length,3);assert(history.some(e=>e.before_details?.includes(u1.name)));
  assert.equal(await sourceHash(),originalSource,'Raw source rows must remain immutable');
  assert.equal(JSON.stringify((await db.query('SELECT * FROM crm.employees WHERE employee_id=ANY($1::int[])',[staff.map(s=>s.employee_id)])).rows),userIdentity,
    'Enrollment and mapping must never alter login accounts');
  console.log('PASS: Medical/GI segregation with dual-role preservation; GI scope, schema, exact metadata, eligibility, multiple teams, atomic reassignment/removal, stale versions, audit rollback, immutable sources/accounts.');
}finally{
  globalThis.__giFailAudit=false;
  if(connected){await db.query('ROLLBACK');await db.end();}
  delete globalThis.__giTestDb;
  await rm(dir,{recursive:true,force:true});
}
