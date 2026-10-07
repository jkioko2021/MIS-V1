// Development-only checks; fixture records and bytes are isolated and removable.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile,writeFile,unlink } from 'node:fs/promises';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { Storage } from '@google-cloud/storage';
if(process.env.NODE_ENV==='production') throw new Error('Development database only.');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const fixturePath='/tmp/mis-record-filing-fixtures.json';
const base='http://localhost:8080/api';
const prefix=`RF_TEST_${randomUUID().slice(0,8)}`;
const fixture={users:[],files:[],objects:[],cookies:{}};
async function cleanup(f) {
  if(f.objects.length) {
    const storage=new Storage({credentials:{
      audience:'replit',subject_token_type:'access_token',type:'external_account',
      token_url:'http://127.0.0.1:1106/token',
      credential_source:{url:'http://127.0.0.1:1106/credential',format:{type:'json',subject_token_field_name:'access_token'}},
      universe_domain:'googleapis.com',
    },projectId:''});
    for(const key of f.objects) {
      assert.match(key,/^\/objects\/uploads\/[a-zA-Z0-9-]+$/);
      const [,bucket,...segments]=`${process.env.PRIVATE_OBJECT_DIR}/${key.slice('/objects/'.length)}`.split('/');
      await storage.bucket(bucket).file(segments.join('/')).delete({ignoreNotFound:true});
    }
  }
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    for(const table of ['business_notifications','record_filing_reviews','business_uploads',
      'business_doc_checklist','business_tracking_notes','business_work_items'])
      await c.query(`DELETE FROM crm.${table} WHERE file_no=ANY($1::varchar[])`,[f.files]);
    await c.query('DELETE FROM crm.business_tracking WHERE file_no=ANY($1::varchar[])',[f.files]);
    await c.query('DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])',[f.users]);
    await c.query('DELETE FROM crm.employees WHERE username=ANY($1::varchar[])',[f.users]);
    await c.query('COMMIT');
  }catch(err){await c.query('ROLLBACK');throw err;}finally{c.release();}
  await unlink(fixturePath).catch(()=>{});
}
if(process.argv.includes('--cleanup')){
  await cleanup(JSON.parse(await readFile(fixturePath,'utf8')));await pool.end();
  console.log('Isolated Record Filing fixtures and document bytes removed.');process.exit(0);
}
async function employee(label,profileId){
  const username=`${prefix}_${label}`;fixture.users.push(username);
  const {rows:[user]}=await pool.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset,department,email)
    VALUES($1,'TEST_SESSION_ONLY',$2,$3,TRUE,TRUE,CURRENT_DATE,$4,$5) RETURNING employee_id`,
    [username,`Filing test ${label}`,profileId,label==='bpo'?'BPO':'DPU',`${label}@example.test`]);
  const {rows:[profile]}=await pool.query('SELECT profile_name FROM crm.profiles WHERE profile_id=$1',[profileId]);
  fixture.cookies[label]=jwt.sign({sub:user.employee_id,username,name:`Filing test ${label}`,profileId,
    profileName:profile.profile_name,department:'DPU'},process.env.SESSION_SECRET??'dev-secret-change-me',{expiresIn:'30m'});
  return username;
}
async function api(path,body,label='dpu'){
  const r=await fetch(`${base}${path}`,{method:body===undefined?'GET':'POST',
    headers:{'Content-Type':'application/json',...(label?{Cookie:`mis_session=${fixture.cookies[label]}`}:{})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})});
  return{status:r.status,body:await r.json()};
}
const path=no=>`/record-filing/files/${encodeURIComponent(no)}`;
async function file(label,type='N',modern=false){
  const no=`${prefix}_${label}`;fixture.files.push(no);
  await pool.query(`INSERT INTO crm.business_tracking
    (file_no,proposer_name,business_type,client_type,business,rate_type,entered_by,allocated_to,
     file_status,forwarded,ready_for_update,receipted,updated,policy_generated,policy_signed,policy_dispatched)
    VALUES($1,$2,$3,'R',$4,'S',$5,$6,$7,TRUE,TRUE,TRUE,$8,$8,$8,$8)`,
    [no,`Filing Test ${label}`,type,modern?'N':'M',fixture.users[1],fixture.users[2],
      modern?'FILING':'RECEIPTED',!modern]);
  await pool.query(`INSERT INTO crm.business_tracking_notes(file_no,note_from,notes)
    VALUES($1,$2,'Original note - never delete')`,[no,fixture.users[1]]);
  return no;
}
async function upload(no,label,actual=false){
  const bytes=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
  let key=`/objects/uploads/${randomUUID()}`;
  if(actual){
    const prepared=await api('/storage/uploads/request-url',{name:'filing-test.pdf',size:bytes.length,contentType:'application/pdf'});
    assert.equal(prepared.status,200);key=prepared.body.objectPath;fixture.objects.push(key);
    const sent=await fetch(prepared.body.uploadURL,{method:'PUT',headers:{'Content-Type':'application/pdf'},body:bytes});
    assert(sent.ok);
  }
  const {rows:[r]}=await pool.query(`INSERT INTO crm.business_uploads
    (file_no,req_id,filename,filesize,mime_type,storage_key,uploaded_by,is_active)
    VALUES($1,(SELECT req_id FROM crm.business_req ORDER BY req_id LIMIT 1),
      $2,$3,'application/pdf',$4,$5,TRUE) RETURNING upload_id`,
    [no,`${label}.pdf`,bytes.length,key,fixture.users[0]]);
  return r.upload_id;
}
let passed=false;
try{
  const {rows:[profile]}=await pool.query("SELECT profile_id FROM crm.profiles WHERE LOWER(TRIM(profile_name))='dpu'");
  await employee('dpu',profile.profile_id);await employee('tracker',3);await employee('bpo',13);
  assert.equal((await api('/record-filing',undefined,null)).status,401);
  assert.equal((await api('/record-filing',undefined,'tracker')).status,403);
  assert.equal((await api('/record-filing?page=1.5')).status,400);
  const modern=await file('MODERN','N',true);
  const actualUpload=await upload(modern,'system-receipt',true);
  const omittedUpload=await upload(modern,'other-document');
  const legacyR=await file('LEGACY_R','R');const legacyA=await file('LEGACY_A','A');
  for(const [no,type]of[[modern,'N'],[legacyR,'R'],[legacyA,'A']]){
    const queue=await api(`/record-filing?business_type=${type}&search=${prefix}`);
    assert.equal(queue.status,200);assert(queue.body.data.some(f=>f.file_no===no));
  }
  // A fully receipted medical file must not be stranded waiting for unrelated policy flags.
  await pool.query(`UPDATE crm.business_tracking SET forwarded=FALSE,ready_for_update=FALSE,
    updated=FALSE,policy_generated=FALSE,policy_signed=FALSE,policy_dispatched=FALSE
    WHERE file_no=$1`,[legacyR]);
  assert.equal((await api(path(legacyR))).status,200);
  const partial=await file('PART_PAID','R',true);
  await pool.query(`UPDATE crm.business_tracking SET file_status='PENDING PAYMENT',
    paid_status='PART-PAID',receipted=FALSE WHERE file_no=$1`,[partial]);
  assert.equal((await api(path(partial))).status,404);
  // Allocation Files' Closed action is an alternative handoff even without a receipt.
  const closed=await file('CLOSED_ALLOC','N',true);
  await pool.query(`UPDATE crm.business_tracking SET file_status='ALLOCATED',allocated=TRUE,
    receipted=FALSE,benefit_verified='YES' WHERE file_no=$1`,[closed]);
  assert.equal((await api(path(closed))).status,404);
  const closeAction=await api(`/business/${closed}/allocation-action`,
    {action:'CL',comments:'Send a closed allocation to Record Filing'},'bpo');
  assert.equal(closeAction.status,200,JSON.stringify(closeAction.body));
  const {rows:[closedState]}=await pool.query(`SELECT file_status,receipted,policy_generated,
    policy_signed,policy_dispatched FROM crm.business_tracking WHERE file_no=$1`,[closed]);
  assert.equal(closedState.file_status,'CLOSED');
  assert.equal(closedState.receipted,false);
  assert.equal(closedState.policy_generated,false);
  assert.equal((await api(path(closed))).status,200);
  assert((await api(`/record-filing?business_type=N&search=${closed}`)).body.data.some(f=>f.file_no===closed));
  const closedTime=(await api(path(closed))).body.data.file.updated_at;
  const filedClosed=await api(`${path(closed)}/file`,
    {action:'F',expected_updated_at:closedTime,upload_ids:[],comments:'Closed allocation filed'});
  assert.equal(filedClosed.status,200,JSON.stringify(filedClosed.body));
  assert.equal((await api(path(closed))).body.data.file.file_status,'FILED');
  const otherDoc=await upload(legacyR,'other-record');
  const old=(await api(path(modern))).body.data.file.updated_at;
  assert.equal((await api(`${path(modern)}/file`,{action:'X',expected_updated_at:old})).status,400);
  assert.equal((await api(`${path(modern)}/file`,{action:'F',expected_updated_at:old,upload_ids:[otherDoc]})).status,400);
  assert.equal((await api(`${path(modern)}/file`,{action:'F',expected_updated_at:old,upload_ids:[actualUpload,actualUpload]})).status,400);
  assert.equal((await api(`${path(modern)}/file`,{action:'F',expected_updated_at:'2000-01-01T00:00:00Z'})).status,409);
  assert.equal((await api(`${path(modern)}/uploads/${otherDoc}/download`)).status,404);
  assert.equal((await api(`${path(modern)}/file`,{action:'F',expected_updated_at:old},'tracker')).status,403);
  const gate=await file('GATE','N');
  for(const field of ['forwarded','ready_for_update','updated','policy_generated','policy_signed','policy_dispatched']){
    await pool.query(`UPDATE crm.business_tracking SET ${field}=FALSE WHERE file_no=$1`,[gate]);
    assert.equal((await api(path(gate))).status,200,field);
    await pool.query(`UPDATE crm.business_tracking SET ${field}=TRUE WHERE file_no=$1`,[gate]);
  }
  for(const field of ['receipted','is_active']){
    await pool.query(`UPDATE crm.business_tracking SET ${field}=FALSE WHERE file_no=$1`,[gate]);
    assert.equal((await api(path(gate))).status,404,field);
    await pool.query(`UPDATE crm.business_tracking SET ${field}=TRUE WHERE file_no=$1`,[gate]);
  }
  await pool.query('UPDATE crm.business_tracking SET is_declined=TRUE WHERE file_no=$1',[gate]);
  assert.equal((await api(path(gate))).status,404);
  const response=await fetch(`${base}${path(modern)}/uploads/${actualUpload}/download`,
    {headers:{Cookie:`mis_session=${fixture.cookies.dpu}`}});
  assert.equal(response.status,200);assert.match(await response.text(),/^%PDF/);
  const concurrent=await Promise.all([1,2].map(()=>api(`${path(modern)}/file`,
    {action:'F',expected_updated_at:old,upload_ids:[actualUpload],comments:'Documents filed securely'})));
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  const detail=(await api(path(modern))).body.data;
  assert.equal(detail.file.file_status,'FILED');assert.equal(detail.file.filed,true);
  assert.equal(detail.reviewable,false);assert.equal(detail.reviews.length,1);
  assert(detail.notes.some(n=>n.notes==='Original note - never delete'));
  assert.equal(detail.uploads.find(u=>u.upload_id===actualUpload).filed,true);
  assert.equal(detail.uploads.find(u=>u.upload_id===omittedUpload).filed,false);
  assert.equal((await api(`/record-filing?search=${modern}`)).body.total,0);
  assert((await api(`/record-filing?bucket=filed&search=${modern}`)).body.data.some(f=>f.file_no===modern));
  const notifications=await api('/notifications',undefined,'tracker');
  assert(notifications.body.data.some(n=>n.file_no===modern&&n.title==='Record filing completed'));
  assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM crm.business_notifications WHERE file_no=$1',[modern])).rows[0].n,2);
  const renew=(await api(path(legacyR))).body.data.file;
  assert.equal((await api(`${path(legacyR)}/file`,{action:'F',expected_updated_at:renew.updated_at})).status,200);
  const ui=await file('UI_FILE','N',true);
  await upload(ui,'ui-filing-document',true);
  console.log('Record Filing checks passed: DPU access, full receipting, Allocation Files Closed handoff, partial-payment exclusion, N/R/A queues, documents/downloads, notes, notifications, history and concurrent filing.');
  passed=true;
}finally{
  if(process.argv.includes('--keep')&&passed) await writeFile(fixturePath,JSON.stringify(fixture),{mode:0o600});
  else await cleanup(fixture);
  await pool.end();
}
