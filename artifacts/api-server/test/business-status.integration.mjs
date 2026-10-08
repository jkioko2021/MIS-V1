import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import pg from 'pg';
import jwt from 'jsonwebtoken';
if(process.env.NODE_ENV==='production') throw new Error('Development fixtures only.');
const path='/tmp/mis-gi-fixtures.json';
const f=JSON.parse(await readFile(path,'utf8'));
assert.match(f.prefix,/^GI_TEST_[a-f0-9]{8}$/);
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const base='http://localhost:80/api/business-status';
async function api(url='',label='tracker'){
  const r=await fetch(`${base}${url}`,{headers:label?{Cookie:`mis_session=${f.cookies[label]}`}:{}}); 
  return{status:r.status,body:await r.json(),cache:r.headers.get('cache-control')};
}
async function save(){await writeFile(path,JSON.stringify(f),{mode:0o600});}
try {
  for(const [label,profile,department] of [['unrelated',8,'REPORTS'],['dpu',15,'DPU']]){
    const username=`${f.prefix}_${label}`;
    f.users.push(username);await save();
    const {rows:[e]}=await pool.query(`INSERT INTO crm.employees
      (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset,department)
      VALUES($1,'TEST_SESSION_ONLY',$2,$3,TRUE,TRUE,CURRENT_DATE,$4) RETURNING employee_id`,
      [username,`Status test ${label}`,profile,department]);
    f.cookies[label]=jwt.sign({sub:e.employee_id,username,profileId:profile},
      process.env.SESSION_SECRET??'dev-secret-change-me',{expiresIn:'45m'});
  }
  f.statusOther=`${f.prefix}_OTHER_STATUS`;
  f.statusFiled=`${f.prefix}_FILED_STATUS`;
  f.statusClosed=`${f.prefix}_CLOSED_STATUS`;
  const records=[f.statusOther,f.statusFiled,f.statusClosed,...Array.from({length:27},(_,i)=>`${f.prefix}_STATUS_${String(i).padStart(2,'0')}`)];
  for(const no of records){
    f.files.push(no);await save();
    await pool.query(`INSERT INTO crm.business_tracking
      (file_no,proposer_name,business_type,client_type,business,rate_type,entered_by,file_status,filed,premium)
      VALUES($1,$2,'N','R','M','S',$3,$4,$5,1200)`,
      [no,`${f.prefix} Status example`,no===f.statusOther?f.users.at(-2):f.users[0],
        no===f.statusFiled?'FILED':no===f.statusClosed?'CLOSED':'REGISTERED',no===f.statusFiled]);
  }
  await pool.query(`INSERT INTO crm.business_work_items(file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by)
    VALUES($1,'MEMBERSHIP_CLOSURE','OPEN',$2,$3,$3)`,[f.statusClosed,f.users[1],f.users[0]]);
  const {rows:[doc]}=await pool.query('SELECT storage_key FROM crm.business_uploads WHERE file_no=$1 LIMIT 1',[f.uiAllocated]);
  for(const [name,filename] of [['Policy Schedule','status_policy.pdf'],['AML Report','status_aml.pdf']]){
    const {rows:[req]}=await pool.query('SELECT req_id FROM crm.business_req WHERE LOWER(TRIM(req_name))=LOWER($1) LIMIT 1',[name]);
    assert(req,`Requirement missing: ${name}`);
    await pool.query(`INSERT INTO crm.business_uploads
      (file_no,req_id,filename,storage_key,uploaded_by,mime_type,filesize,risk_rate,risk_reason)
      VALUES($1,$2,$3,$4,$5,'application/pdf',50,$6,$7)`,
      [f.uiAllocated,req.req_id,filename,doc.storage_key,f.users[1],
        name==='AML Report'?'Low':null,name==='AML Report'?'No alerts identified':null]);
  }
  await pool.query(`INSERT INTO crm.business_tracking_notes(file_no,note_from,notes,is_active)
    VALUES($1,$2,'Retained prior saved status note',FALSE)`,[f.uiAllocated,f.users[0]]);
  const {rows:[tracker]}=await pool.query('SELECT employee_id FROM crm.employees WHERE username=$1',[f.users[0]]);
  f.cookies.stale=jwt.sign({sub:tracker.employee_id,username:'admin',profileId:1,profileName:'SuperAdmin'},
    process.env.SESSION_SECRET??'dev-secret-change-me',{expiresIn:'45m'});
  await save();

  assert.equal((await api('',null)).status,401);
  assert.equal((await api('','inactive')).status,403);
  for(const q of ['?search_by=X','?page=0','?page=99999999','?include_completed=oops','?client_type=Z','?business_type=SQL%20INJECTION'])
    assert.equal((await api(q)).status,400);
  assert.equal((await api('','tracker')).cache,'private, no-store');
  assert.equal((await api(`/files/${f.statusOther}`,'tracker')).status,404);
  assert.equal((await api(`/files/${f.statusOther}`,'stale')).status,404);
  assert.equal((await api(`/files/${f.statusOther}`,'admin')).status,200);
  const unrelated=await api('?search=%25&include_completed=true','unrelated');
  assert.equal(unrelated.status,200);assert.equal(unrelated.body.total,1);
  assert.equal(unrelated.body.data[0].file_no,f.statusOther);
  const first=await api(`?search=${f.prefix}&include_completed=true&page=1`,'admin');
  const second=await api(`?search=${f.prefix}&include_completed=true&page=2`,'admin');
  assert.equal(first.status,200);assert.equal(first.body.data.length,25);
  assert(second.body.data.length>0);assert(!second.body.data.some(x=>first.body.data.some(y=>x.file_no===y.file_no)));
  assert.equal((await api(`?search=${f.statusFiled}`,'tracker')).body.total,0);
  assert.equal((await api(`?search=${f.statusFiled}&include_completed=true`,'tracker')).body.total,1);
  assert.equal((await api(`?search=${f.prefix}&business_type=R&client_type=C`,'tracker')).body.total,0);
  assert((await api(`?search_by=P&search=${f.prefix}%20Status&include_completed=true`,'tracker')).body.total>=28);
  assert.equal((await api(`/files/${f.statusFiled}`,'dpu')).body.data.file.can_view_details,true);
  assert.equal((await api(`/files/${f.statusClosed}`,'dpu')).body.data.file.can_view_details,true);
  const owner=(await api(`/files/${f.uiAllocated}`,'gi')).body.data;
  assert(owner.file.can_view_details);
  assert(owner.notes.some(n=>n.notes==='Retained prior saved status note'));
  assert(owner.documents.some(d=>d.req_name==='Policy Schedule'));
  assert(owner.documents.some(d=>d.risk_rate==='Low'&&d.risk_reason==='No alerts identified'));
  assert(owner.documents.every(d=>d.code===null||typeof d.code==='string'));
  assert(!('nid' in owner.file));assert(!owner.documents.some(d=>'storage_key' in d));
  const trackerView=(await api(`/files/${f.uiAllocated}`,'tracker')).body.data;
  assert(!trackerView.file.can_view_details);assert.equal(trackerView.financial,null);
  assert.deepEqual(trackerView.documents,[]);assert.deepEqual(trackerView.notes,[]);
  assert(trackerView.movements.length>0);assert(trackerView.restriction_reason);
  assert.equal((await api(`/files/${f.uiAllocated}`,'other')).status,404);
  const participation=`${f.prefix}_PARTICIPATION`;
  f.files.push(participation);await save();
  await pool.query(`INSERT INTO crm.business_tracking
    (file_no,proposer_name,business_type,client_type,business,rate_type,entered_by,file_status,allocated,allocated_to)
    VALUES($1,'Synthetic prior participation','N','R','M','S',$2,'ALLOCATED',TRUE,$3)`,
    [participation,f.users[0],f.users[4]]);
  await pool.query(`INSERT INTO crm.business_tracking_notes(file_no,note_from,notes)
    VALUES($1,$2,'Prior authorized reviewer involvement')`,[participation,f.users[2]]);
  const participant=await api(`/files/${participation}`,'other');
  assert.equal(participant.status,200);
  assert.equal(participant.body.data.file.can_view_details,false);
  assert.equal(participant.body.data.financial,null);
  const shared=await api(`/files/${f.uiAllocate}`,'other');
  assert.equal(shared.status,200);assert(shared.body.data.file.can_view_details);
  const medical=f.files.find(no=>no.endsWith('_MED'));
  assert.equal((await api(`/files/${medical}`,'bpo')).body.data.file.can_view_details,true);
  const cash=f.files.find(no=>no.endsWith('_CASH'));
  assert.equal((await api(`/files/${cash}`,'finance')).body.data.file.can_view_details,true);
  assert.equal((await api(`/files/${cash}`,'gi')).body.data.file.can_view_details,false);
  const uploadId=owner.documents[0].upload_id;
  assert.equal((await api(`/files/${f.uiAllocated}/documents/${uploadId}/download`,'tracker')).status,403);
  assert.equal((await api(`/files/${f.uiAllocated}/documents/${uploadId}/download`,'other')).status,404);
  const download=await fetch(`${base}/files/${f.uiAllocated}/documents/${uploadId}/download`,
    {headers:{Cookie:`mis_session=${f.cookies.gi}`}});
  assert.equal(download.status,200);assert((await download.arrayBuffer()).byteLength>0);
  assert.equal((await api(`/files/${f.uiAllocate}/documents/${uploadId}/download`,'gi')).status,404);
  assert.equal((await api(`/files/${f.uiAllocated}/documents/0/download`,'gi')).status,400);
  assert(!(await api('/options','unrelated')).body.data.statuses.includes('FILED'));
  f.statusLive=records.at(-1);
  const before=(await api(`/files/${f.statusLive}`)).body.data.file;
  await pool.query(`UPDATE crm.business_tracking SET file_status='FORWARDED',forwarded=TRUE,updated_at=NOW() WHERE file_no=$1`,[f.statusLive]);
  const after=(await api(`/files/${f.statusLive}`)).body.data.file;
  assert.equal(before.file_status,'REGISTERED');assert.equal(after.file_status,'FORWARDED');
  assert.notEqual(after.updated_at,before.updated_at);
  await pool.query(`UPDATE crm.business_tracking SET allocated=TRUE,allocated_to=$2 WHERE file_no=$1`,[f.statusFiled,f.users[4]]);
  assert.equal((await api(`/files/${f.statusFiled}`,'tracker')).body.data.file.can_view_details,false);
  assert.equal((await api(`/files/${f.statusFiled}`,'bpo')).body.data.file.can_view_details,true);
  assert.equal((await api(`/files/${f.statusFiled}`,'dpu')).body.data.file.can_view_details,true);
  assert.equal((await api(`/files/${f.statusFiled}/documents/${uploadId}/download`,'tracker')).status,403);
  await pool.query(`INSERT INTO crm.business_work_items(file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by)
    VALUES($1,'CASHIER','OPEN',$2,$3,$3)`,[f.uiAllocated,f.users[5],f.users[0]]);
  assert.equal((await api(`/files/${f.uiAllocated}`,'gi')).body.data.file.can_view_details,false);
  await pool.query(`UPDATE crm.employees SET profile_id=8 WHERE username=$1`,[f.users[5]]);
  assert.equal((await api(`/files/${cash}`,'finance')).body.data.file.can_view_details,false);
  assert.equal((await api(`/files/${cash}/documents/${uploadId}/download`,'finance')).status,403);
  await save();
  console.log('Business Status passed: profile scope, stale claims, list/detail/download isolation, retained notes, policy/AML metadata, pagination, filters, completed history and live status updates.');
} finally {await save();await pool.end();}
