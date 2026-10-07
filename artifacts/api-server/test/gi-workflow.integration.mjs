import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import {Storage} from '@google-cloud/storage';
if(process.env.NODE_ENV==='production') throw new Error('Development database only.');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const base='http://localhost:80/api';
const fixturePath='/tmp/mis-gi-fixtures.json';
const prefix=`GI_TEST_${randomUUID().slice(0,8)}`;
const fixture={users:[],files:[],objects:[],cookies:{},prefix};
async function cleanup(f){
  if(f.objects.length){
    const storage=new Storage({credentials:{audience:'replit',subject_token_type:'access_token',
      type:'external_account',token_url:'http://127.0.0.1:1106/token',
      credential_source:{url:'http://127.0.0.1:1106/credential',format:{type:'json',subject_token_field_name:'access_token'}},
      universe_domain:'googleapis.com'},projectId:''});
    for(const key of f.objects){
      assert.match(key,/^\/objects\/uploads\/[a-zA-Z0-9-]+$/);
      const [,bucket,...segments]=`${process.env.PRIVATE_OBJECT_DIR}/${key.slice('/objects/'.length)}`.split('/');
      await storage.bucket(bucket).file(segments.join('/')).delete({ignoreNotFound:true});
    }
  }
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    for(const table of ['business_notifications','gi_reviews','business_uploads','business_doc_checklist',
      'business_tracking_notes','business_work_items','cashier_reviews'])
      await c.query(`DELETE FROM crm.${table} WHERE file_no=ANY($1::varchar[])`,[f.files]);
    await c.query('DELETE FROM crm.business_tracking WHERE file_no=ANY($1::varchar[])',[f.files]);
    await c.query('DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])',[f.users]);
    await c.query('DELETE FROM crm.employees WHERE username=ANY($1::varchar[])',[f.users]);
    await c.query('COMMIT');
  }catch(err){await c.query('ROLLBACK');throw err;}finally{c.release();}
}
if(process.argv.includes('--cleanup')){
  try{const f=JSON.parse(await readFile(fixturePath,'utf8'));await cleanup(f);await unlink(fixturePath);}
  finally{await pool.end();}
  console.log('GI test fixtures and document bytes removed.');process.exit(0);
}
async function employee(label,profileId,department,active=true){
  const username=`${prefix}_${label}`;fixture.users.push(username);
  const {rows:[e]}=await pool.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset,department,email)
    VALUES($1,'TEST_SESSION_ONLY',$2,$3,$4,TRUE,CURRENT_DATE,$5,$6) RETURNING employee_id`,
    [username,`GI test ${label}`,profileId,active,department,`${label}@example.test`]);
  const {rows:[p]}=await pool.query('SELECT profile_name FROM crm.profiles WHERE profile_id=$1',[profileId]);
  fixture.cookies[label]=jwt.sign({sub:e.employee_id,username,name:`GI test ${label}`,profileId,
    profileName:p.profile_name,department},process.env.SESSION_SECRET??'dev-secret-change-me',{expiresIn:'45m'});
  return username;
}
async function api(path,body,label='gi'){
  const r=await fetch(`${base}${path}`,{method:body===undefined?'GET':'POST',headers:{
    'Content-Type':'application/json',...(label?{Cookie:`mis_session=${fixture.cookies[label]}`}:{})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})});
  return{status:r.status,body:await r.json()};
}
const giPath=no=>`/gi/files/${no}`;
async function file(label,business='N',client='R'){
  const no=`${prefix}_${label}`;fixture.files.push(no);
  await pool.query(`INSERT INTO crm.business_tracking
    (file_no,proposer_name,receive_dt,business_type,client_type,business,product,rate_type,file_status,entered_by,gi_category)
    VALUES($1,$2,CURRENT_DATE,'N',$3,$4,'T','S','REGISTERED',$5,'Motor')`,
    [no,`Synthetic ${label}`,client,business,fixture.users[0]]);
  const {rows:[req]}=await pool.query('SELECT req_id FROM crm.business_req ORDER BY req_id LIMIT 1');
  await pool.query(`INSERT INTO crm.business_doc_checklist(file_no,req_id,is_selected,acknowledged_by)
    VALUES($1,$2,TRUE,$3)`,[no,req.req_id,fixture.users[0]]);
  const bytes=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
  const prepared=await api('/storage/uploads/request-url',{name:'gi-test.pdf',size:bytes.length,contentType:'application/pdf'},'tracker');
  assert.equal(prepared.status,200,JSON.stringify(prepared.body));
  fixture.objects.push(prepared.body.objectPath);
  const put=await fetch(prepared.body.uploadURL,{method:'PUT',headers:{'Content-Type':'application/pdf'},body:bytes});
  assert(put.ok);
  await pool.query(`INSERT INTO crm.business_uploads(file_no,req_id,filename,filesize,mime_type,storage_key,uploaded_by,is_active)
    VALUES($1,$2,'gi-test.pdf',$3,'application/pdf',$4,$5,TRUE)`,
    [no,req.req_id,bytes.length,prepared.body.objectPath,fixture.users[0]]);
  await pool.query(`INSERT INTO crm.business_tracking_notes(file_no,note_from,notes)
    VALUES($1,$2,'Original GI registration note - retain')`,[no,fixture.users[0]]);
  return no;
}
async function forward(no){
  const r=await api(`/business/${no}/forward`,{comments:'Registration documents complete'},'tracker');
  assert.equal(r.status,200,JSON.stringify(r.body));return r.body.data;
}
let passed=false;
try{
  const {rows:[giProfile]}=await pool.query("SELECT profile_id FROM crm.profiles WHERE LOWER(profile_name)='gi'");
  await employee('tracker',3,'SALES');await employee('gi',giProfile.profile_id,'GI');
  await employee('other',4,'NONMEDICAL');await employee('inactive',giProfile.profile_id,'GI',false);
  await employee('bpo',13,'BPO');await employee('finance',6,'FINANCE');await employee('admin',1,'ADMIN');
  assert.equal((await api('/gi/allocate',undefined,null)).status,401);
  assert.equal((await api('/gi/allocate',undefined,'tracker')).status,403);
  assert.equal((await api('/gi/allocate',undefined,'inactive')).status,403);
  const staff=(await api('/gi/staff')).body.data;
  assert(staff.some(s=>s.username===fixture.users[1]));
  assert(staff.some(s=>s.username===fixture.users[2]));
  assert(!staff.some(s=>s.username===fixture.users[3]||s.username===fixture.users[4]));
  const medical=await file('MED','M');assert.equal((await forward(medical)).queue_name,'BPO_REVIEW_RETAIL');
  const no=await file('ALLOC');assert.equal((await forward(no)).queue_name,'GI_ALLOCATE');
  assert.equal((await forward(no)).already_routed,true);
  assert((await api(`/gi/allocate?search=${prefix}`)).body.data.some(f=>f.file_no===no));
  const bpoList=(await api(`/mis/business?queue=bpo-retail&search_by=F&search=${prefix}`,undefined,'bpo')).body.data;
  assert(bpoList.some(f=>f.file_no===medical));
  assert(!bpoList.some(f=>f.file_no===no));
  assert.equal((await api(`/mis/business/${no}`,undefined,'tracker')).status,403);
  const detail=(await api(giPath(no))).body.data;
  const id=detail.uploads[0].upload_id;
  const download=await fetch(`${base}${giPath(no)}/uploads/${id}/download`,
    {headers:{Cookie:`mis_session=${fixture.cookies.gi}`}});
  assert.equal(download.status,200);assert.match(await download.text(),/^%PDF/);
  const decision={action:'A',assigned_to:fixture.users[1],comments:'Allocate to active GI owner',
    expected_updated_at:detail.file.updated_at};
  assert.equal((await api(`${giPath(no)}/decision`,{...decision,assigned_to:fixture.users[3]})).status,400);
  assert.equal((await api(`${giPath(no)}/decision`,{...decision,assigned_to:fixture.users[4]})).status,400);
  assert.equal((await api(`${giPath(no)}/decision`,{...decision,comments:''})).status,400);
  assert.equal((await api(`${giPath(no)}/decision`,{...decision,expected_updated_at:'2000-01-01T00:00:00Z'})).status,409);
  const parallel=await Promise.all([api(`${giPath(no)}/decision`,decision),api(`${giPath(no)}/decision`,decision)]);
  assert.deepEqual(parallel.map(r=>r.status).sort(),[200,409]);
  assert((await api(`/mis/business/allocated?workspace=gi&search_by=F&search=${prefix}`)).body.data.some(f=>f.file_no===no));
  assert.equal((await api(`/mis/business/allocated?workspace=gi&search_by=F&search=${no}`,undefined,'other')).body.total,0);
  assert.equal((await api(`/mis/business/allocated?workspace=gi`,undefined,'bpo')).status,403);
  assert.equal((await api(`/mis/business/allocated`)).status,403);
  assert.equal((await api(`/mis/business/allocated/${no}`,undefined,'other')).status,403);
  assert.equal((await api(`/mis/business/allocated/${no}`,undefined,'bpo')).status,403);
  assert.equal((await api(`${giPath(no)}/uploads/${id}/download`,undefined,'other')).status,404);
  assert.equal((await api(`/mis/business/allocated/${no}`)).status,200);
  const returned=await api(`/business/${no}/allocation-action`,{action:'RI',comments:'Correct missing details'});
  assert.equal(returned.status,200,JSON.stringify(returned.body));
  assert.equal(returned.body.data.file_status,'RETURNED-INCOMPLETE');
  assert.equal((await pool.query(`SELECT COUNT(*)::int AS n FROM crm.business_notifications
    WHERE file_no=$1 AND recipient_username=$2`,[no,fixture.users[0]])).rows[0].n,1);
  assert((await api('/notifications',undefined,'tracker')).body.data.some(n=>n.file_no===no));
  assert((await api(`/mis/business?queue=register&search_by=F&search=${no}`,undefined,'tracker')).body.data.some(f=>f.file_no===no));
  assert.equal((await forward(no)).queue_name,'GI_ALLOCATE');
  const current=(await api(giPath(no))).body.data;
  const ri=await api(`${giPath(no)}/decision`,{action:'RI',comments:'Return from GI allocation',
    expected_updated_at:current.file.updated_at});
  assert.equal(ri.status,200,JSON.stringify(ri.body));
  const cash=await file('CASH');await forward(cash);
  const cashFile=(await api(giPath(cash))).body.data.file;
  assert.equal((await api(`${giPath(cash)}/decision`,{...decision,expected_updated_at:cashFile.updated_at})).status,200);
  const inv='GI-INV-1234567890123456';
  await pool.query('UPDATE crm.business_tracking SET invoice_no=$2,invoiced=TRUE WHERE file_no=$1',[cash,inv]);
  await pool.query(`INSERT INTO crm.business_uploads(file_no,req_id,filename,filesize,mime_type,storage_key,uploaded_by)
    SELECT $1,req_id,'aml.pdf',20,'application/pdf',$2,$3 FROM crm.business_req
    WHERE LOWER(TRIM(req_name))='aml report' LIMIT 1`,[cash,fixture.objects[0],fixture.users[1]]);
  const cashier=await api(`/business/${cash}/allocation-action`,{action:'C',invoice_no:inv,
    paid_status:'FULL-PAID',assigned_to:fixture.users[5],comments:'Invoice ready for receipting'});
  assert.equal(cashier.status,200,JSON.stringify(cashier.body));
  assert.equal(cashier.body.data.queue_name,'CASHIER');
  assert.equal((await api(`/cashier/files/${cash}`,undefined,'finance')).status,200);
  assert([403,404].includes((await api(`/mis/business/allocated/${cash}`)).status));
  const notes=(await pool.query('SELECT notes FROM crm.business_tracking_notes WHERE file_no=$1',[cash])).rows;
  assert(notes.some(n=>n.notes==='Original GI registration note - retain'));
  // Keep one pending allocation and one assigned case for the signed-in UI pass.
  const uiAllocate=await file('UI_NEW');await forward(uiAllocate);
  const uiAllocated=await file('UI_OWN');await forward(uiAllocated);
  const uiCurrent=(await api(giPath(uiAllocated))).body.data.file;
  assert.equal((await api(`${giPath(uiAllocated)}/decision`,{...decision,expected_updated_at:uiCurrent.updated_at})).status,200);
  fixture.uiAllocate=uiAllocate;fixture.uiAllocated=uiAllocated;
  passed=true;console.log('GI workflow passed: medical routing retained; nonmedical forward, allocation, return/reforward, notification, owner security, private download and Cashier handoff.');
}finally{
  if(passed&&process.argv.includes('--keep')) await writeFile(fixturePath,JSON.stringify(fixture),{mode:0o600});
  else await cleanup(fixture);
  await pool.end();
}
