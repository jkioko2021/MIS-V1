// Development-only isolated fixtures; no existing staff/files are changed.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { Storage } from '@google-cloud/storage';
if (process.env.NODE_ENV === 'production') throw new Error('Development database only.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const fixturePath = '/tmp/mis-pricing-review-fixtures.json';
const base = 'http://localhost:8080/api';
const fixture = { users: [], files: [], cookies: {} };
const prefix = `PT_${randomUUID().slice(0, 8)}`;
async function cleanup(data) {
  const objects = (await pool.query(`SELECT storage_key FROM crm.business_uploads WHERE
    file_no=ANY($1::varchar[]) AND uploaded_by=ANY($2::varchar[])`, [data.files, data.users])).rows;
  if (objects.length) {
    const storage = new Storage({ credentials: {
      audience: 'replit', subject_token_type: 'access_token', type: 'external_account',
      token_url: 'http://127.0.0.1:1106/token',
      credential_source: { url: 'http://127.0.0.1:1106/credential', format: { type: 'json', subject_token_field_name: 'access_token' } },
      universe_domain: 'googleapis.com',
    }, projectId: '' });
    for (const object of objects) {
      assert.match(object.storage_key, /^\/objects\/uploads\/[a-zA-Z0-9-]+$/);
      const fullPath = `${process.env.PRIVATE_OBJECT_DIR}/${object.storage_key.slice('/objects/'.length)}`;
      const [, bucket, ...segments] = fullPath.split('/');
      await storage.bucket(bucket).file(segments.join('/')).delete({ ignoreNotFound: true });
    }
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of ['business_notifications', 'business_doc_checklist', 'business_uploads', 'pricing_reviews',
      'medical_underwriting_reviews', 'medical_hpc_registrations', 'business_tracking_notes', 'business_work_items'])
      await client.query(`DELETE FROM crm.${table} WHERE file_no=ANY($1::varchar[])`, [data.files]);
    await client.query('DELETE FROM crm.business_tracking WHERE file_no=ANY($1::varchar[])', [data.files]);
    await client.query(`DELETE FROM crm.admin_audit_trail a WHERE username=ANY($1::varchar[])
      OR EXISTS(SELECT 1 FROM unnest($2::varchar[]) AS fixture(file_no) WHERE strpos(a.description,fixture.file_no)>0)`, [data.users, data.files]);
    await client.query('DELETE FROM crm.employees WHERE username=ANY($1::varchar[])', [data.users]);
    await client.query('COMMIT');
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
  await unlink(fixturePath).catch(() => {});
}
if (process.argv.includes('--cleanup')) {
  await cleanup(JSON.parse(await readFile(fixturePath, 'utf8')));
  await pool.end();
  console.log('Isolated pricing fixtures and document bytes removed.');
  process.exit(0);
}
async function employee(label, profileId) {
  const username = `${prefix}_${label}`;
  fixture.users.push(username);
  const { rows: [user] } = await pool.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset,department)
    VALUES($1,'TEST_SESSION_ONLY',$2,$3,TRUE,TRUE,CURRENT_DATE,'BPO') RETURNING employee_id`,
  [username, `Pricing test ${label}`, profileId]);
  fixture.cookies[label] = jwt.sign({ sub: user.employee_id, username, name: `Pricing test ${label}`, profileId },
    process.env.SESSION_SECRET ?? 'dev-secret-change-me', { expiresIn: '30m' });
  return username;
}
async function api(path, body, label = 'pricing', method) {
  const response = await fetch(`${base}${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', ...(label ? { Cookie: `mis_session=${fixture.cookies[label]}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
const filePath = fileNo => `/pricing-review/files/${encodeURIComponent(fileNo)}`;
async function file(label, clientType, tracker, rateType = 'S', benefit = 'NO') {
  const fileNo = `${prefix}_${label}`;
  fixture.files.push(fileNo);
  await pool.query(`INSERT INTO crm.business_tracking(file_no,proposer_name,business_type,client_type,
    business,rate_type,entered_by,file_status,forwarded,ready_for_update,premium,benefit_verified)
    VALUES($1,$2,'N',$3,'M',$4,$5,'FORWARDED',TRUE,TRUE,10000,$6)`,
  [fileNo, `Pricing Test ${label}`, clientType, rateType, tracker, benefit]);
  await pool.query(`INSERT INTO crm.business_work_items(file_no,queue_name,forwarded_by)
    VALUES($1,$2,$3)`, [fileNo, clientType === 'R' ? 'BPO_REVIEW_RETAIL' : 'BPO_REVIEW_CORPORATE_SME', tracker]);
  await pool.query(`INSERT INTO crm.business_tracking_notes(file_no,note_from,notes) VALUES($1,$2,'Original tracker note - retain')`, [fileNo, tracker]);
  return fileNo;
}
async function allocate(fileNo, clientType, recipient) {
  const result = await api(`/business/${encodeURIComponent(fileNo)}/review-action`, {
    action: 'A', product: 'T', comments: 'Route to pricing', allocated_to: recipient,
    queue_name: clientType === 'R' ? 'BPO_REVIEW_RETAIL' : 'BPO_REVIEW_CORPORATE_SME',
  }, 'bpo');
  assert.equal(result.status, 200);
  return result.body.data;
}
async function matrix(fileNo) {
  const detail = (await api(filePath(fileNo))).body.data;
  const requirement = detail.requirements[0];
  assert(requirement, 'Rates matrix requirement must exist.');
  const bytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
  const prepared = await api('/storage/uploads/request-url', { name: 'approved-rates.pdf', size: bytes.length, contentType: 'application/pdf' });
  assert.equal(prepared.status, 200);
  const uploaded = await fetch(prepared.body.uploadURL, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: bytes });
  assert(uploaded.ok);
  const result = await api(`${filePath(fileNo)}/uploads`, { req_id: requirement.req_id, filename: 'approved-rates.pdf',
    filesize: bytes.length, mime_type: 'application/pdf', storage_key: prepared.body.objectPath });
  assert.equal(result.status, 201);
  const download = await fetch(`${base}${filePath(fileNo)}/uploads/${result.body.data.upload_id}/download`,
    { headers: { Cookie: `mis_session=${fixture.cookies.pricing}` } });
  assert.equal(download.status, 200);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
}
async function manualAllocation(label, clientType, tracker, recipient, rate = 'C', benefit = 'NO') {
  const fileNo = await file(label, clientType, tracker, rate);
  await pool.query(`UPDATE crm.business_tracking SET allocated=TRUE,allocated_to=$2,
    file_status='ALLOCATED',benefit_verified=$3,allocate_dt=NOW(),updated_at=NOW() WHERE file_no=$1`,
    [fileNo,recipient,benefit]);
  return fileNo;
}
if (process.argv.includes('--edit-check')) {
  Object.assign(fixture, JSON.parse(await readFile(fixturePath, 'utf8')));
  try {
    const membership = fixture.users.find(user => user.endsWith('_membership'));
    const tracker = fixture.users.find(user => user.endsWith('_tracker'));
    await employee('admin', 1);
    await pool.query(`UPDATE crm.employees SET department='MEMBERSHIP' WHERE username=$1`, [membership]);
    const fileNo = await file('EDIT', 'C', tracker, 'C');
    const input = { proposer_name: 'Pricing Test EDIT', business_type: 'R', business: 'M', agent_id: 'PRICING_TEST',
      allocated_to: membership, rate_type: 'C', benefit_verified: 'NO' };
    const edit = await api(`/business/${encodeURIComponent(fileNo)}`, input, 'admin', 'PUT');
    assert.equal(edit.status, 200, edit.body.error);
    assert((await api('/pricing-review')).body.data.some(row => row.file_no === fileNo));
    assert.equal((await api(`/business/${encodeURIComponent(fileNo)}`, { ...input, benefit_verified: 'YES' }, 'admin', 'PUT')).status, 200);
    const detail = (await api(filePath(fileNo))).body.data;
    assert.equal(detail.file.file_status, 'BENEFIT VERIFICATION');
    assert.equal(detail.file.benefit_verified, 'NO');
    assert.equal(detail.file.allocated_to, membership);
    assert.equal((await api(`/business/${encodeURIComponent(fileNo)}`, { ...input, rate_type: 'S' }, 'admin', 'PUT')).status, 200);
    assert(!(await api('/pricing-review')).body.data.some(row => row.file_no === fileNo));
    assert((await api('/mis/business/allocated', undefined, 'membership')).body.data.some(row => row.file_no === fileNo));
    assert.equal((await api(`/business/${encodeURIComponent(fileNo)}`, input, 'admin', 'PUT')).status, 200);
    assert((await api('/pricing-review')).body.data.some(row => row.file_no === fileNo));
    console.log('General-edit Custom allocation enters Pricing; manual verification cannot bypass approval; C→S releases allocation and S→C requeues Pricing.');
  } finally {
    await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
    await pool.end();
  }
  process.exit(0);
}
try {
  const pricingProfile = (await pool.query(`SELECT profile_id FROM crm.profiles WHERE LOWER(TRIM(profile_name))='pricing'`)).rows[0];
  assert(pricingProfile);
  await employee('pricing', pricingProfile.profile_id);
  const tracker = await employee('tracker', 3);
  await employee('outsider', 3);
  await employee('bpo', 12);
  const recipient = await employee('recipient', 13);
  const otherRecipient = await employee('otherRecipient', 13);
  await employee('medical', 5);
  const membership = await employee('membership', 4);
  assert.equal((await api('/pricing-review', undefined, null)).status, 401);
  assert.equal((await api('/pricing-review', undefined, 'outsider')).status, 403);
  for (const clientType of ['R','C','S']) for (const rateType of ['S','C']) {
    const expected = clientType === 'R' || rateType === 'S' ? 'YES' : 'NO';
    const dbFile = await file(`DEF_${clientType}_${rateType}_RAW`,clientType,tracker,rateType,null);
    const row = (await pool.query('SELECT benefit_verified FROM crm.business_tracking WHERE file_no=$1',[dbFile])).rows[0];
    assert.equal(row.benefit_verified,expected);
    const created = await api('/business/register',{
      client_type:clientType,rate_type:rateType,proposer_name:`${prefix} Default ${clientType} ${rateType}`,
      business_type:'N',business:'M',agent_id:'PRICING_TEST',walk_in_client:'N',
      nid:'12345678',pin_no:'A123456789B',
      cr12_ref:prefix,county_code:'001',corp_category:'Private',sector:'FINANCE',
    },'tracker');
    assert.equal(created.status,201,JSON.stringify(created.body));
    const createdFile = created.body.data.file_no;
    fixture.files.push(createdFile);
    const registered = (await pool.query('SELECT benefit_verified,entered_by FROM crm.business_tracking WHERE file_no=$1',[createdFile])).rows[0];
    assert.equal(registered.entered_by,tracker);
    assert.equal(registered.benefit_verified,expected);
  }
  for (const clientType of ['C', 'S']) for (const rateType of ['S', 'C']) {
    const fileNo = await file(`${clientType}_${rateType}`, clientType, tracker, rateType);
    const result = await allocate(fileNo, clientType, recipient);
    if (rateType === 'S') {
      assert.equal(result.file_status, 'ALLOCATED');
      assert.equal(result.allocation_route, 'STANDARD_ALLOCATION');
      assert(!(await api('/pricing-review')).body.data.some(row => row.file_no === fileNo));
      assert((await api('/mis/business/allocated', undefined, 'recipient')).body.data.some(row => row.file_no === fileNo));
      continue;
    }
    assert.equal(result.file_status, 'BENEFIT VERIFICATION');
    assert.equal(result.allocation_route, 'PRICING_HANDOFF');
    assert((await api('/pricing-review')).body.data.some(row => row.file_no === fileNo));
    assert(!(await api('/mis/business/allocated', undefined, 'recipient')).body.data.some(row => row.file_no === fileNo));
    assert.equal((await api(`/mis/business/allocated/${encodeURIComponent(fileNo)}`, undefined, 'recipient')).status, 404);
    const detail = (await api(filePath(fileNo))).body.data;
    assert(detail.notes.some(note => note.notes === 'Original tracker note - retain'));
  }
  const retail = await file('RETAIL', 'R', tracker);
  assert.equal((await allocate(retail, 'R', recipient)).allocation_route, 'STANDARD_ALLOCATION');
  assert.equal((await api(`/mis/business/allocated/${encodeURIComponent(retail)}`,undefined,'recipient')).body.data.benefit_verified,'YES');
  assert(!(await api('/pricing-review')).body.data.some(row => row.file_no === retail));
  const approved = fixture.files.find(file => file.endsWith('_C_C'));
  let detail = (await api(filePath(approved))).body.data;
  assert.equal((await api(`${filePath(approved)}/review`, { action: 'YES', comments: 'Approve', expected_updated_at: detail.file.updated_at })).status, 400);
  await matrix(approved);
  detail = (await api(filePath(approved))).body.data;
  assert(detail.has_rates_matrix);
  const input = { action: 'YES', comments: 'Rates verified and approved', expected_updated_at: detail.file.updated_at };
  assert.equal((await api(`${filePath(approved)}/review`, { ...input, comments: '' })).status, 400);
  assert.equal((await api(`${filePath(approved)}/review`, { ...input, expected_updated_at: '2000-01-01T00:00:00Z' })).status, 409);
  const concurrent = await Promise.all([api(`${filePath(approved)}/review`, input), api(`${filePath(approved)}/review`, input)]);
  assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 409]);
  assert(!(await api('/pricing-review')).body.data.some(row => row.file_no === approved));
  assert((await api('/mis/business/allocated', undefined, 'recipient')).body.data.some(row => row.file_no === approved));
  assert.equal((await api(`/mis/business/allocated/${encodeURIComponent(approved)}`, undefined, 'otherRecipient')).status, 403);
  const approvedDetail = (await api(filePath(approved))).body.data;
  assert.equal(approvedDetail.file.benefit_verified, 'YES');
  assert(approvedDetail.file.benefit_ver_by.endsWith('_pricing'));
  assert.equal(approvedDetail.reviews.length, 1);
  assert(approvedDetail.notes.some(note => note.notes === 'Original tracker note - retain'));
  const missing = await file('MISSING_RECIPIENT', 'C', tracker, 'C');
  await allocate(missing, 'C', recipient);
  await pool.query('UPDATE crm.business_tracking SET allocated_to=NULL WHERE file_no=$1', [missing]);
  await matrix(missing);
  detail = (await api(filePath(missing))).body.data;
  assert.equal(detail.allocation_recipients.length, 0);
  const missingInput = { action: 'YES', comments: 'Assign approved file to eligible recipient', expected_updated_at: detail.file.updated_at };
  assert.equal((await api(`${filePath(missing)}/review`, missingInput)).status, 400);
  assert.equal((await api(`${filePath(missing)}/review`, { ...missingInput, allocated_to: fixture.users.find(user => user.endsWith('_outsider')) })).status, 400);
  assert.equal((await api(`${filePath(missing)}/review`, { ...missingInput, allocated_to: otherRecipient })).status, 400);
  assert.equal((await api(filePath(missing))).body.data.file.allocated_to, null);
  assert.equal((await api(`/business/${encodeURIComponent(missing)}/allocate`, { allocated_to: otherRecipient }, 'bpo')).status, 200);
  detail = (await api(filePath(missing))).body.data;
  assert.deepEqual(detail.allocation_recipients.map(row => row.username), [otherRecipient]);
  assert.equal((await api(`${filePath(missing)}/review`, { ...missingInput, expected_updated_at: detail.file.updated_at })).status, 200);
  assert((await api('/mis/business/allocated', undefined, 'otherRecipient')).body.data.some(row => row.file_no === missing));
  const repaired = (await api(filePath(missing))).body.data;
  assert.equal(repaired.file.allocated_to, otherRecipient);
  assert(repaired.notes.some(row => row.notes === 'Original tracker note - retain'));
  const inactive = await file('INACTIVE_RECIPIENT', 'C', tracker, 'C');
  await allocate(inactive, 'C', recipient);
  await matrix(inactive);
  for (const [column, value] of [['activated', false], ['approved', false], ['employee_locked', true], ['is_deleted', true]]) {
    await pool.query(`UPDATE crm.employees SET ${column}=$1 WHERE username=$2`, [value, recipient]);
    detail = (await api(filePath(inactive))).body.data;
    assert(!detail.allocation_recipients.some(row => row.username === recipient));
    assert.equal((await api(`${filePath(inactive)}/review`, { action: 'YES', comments: 'Eligibility test', expected_updated_at: detail.file.updated_at })).status, 400);
    await pool.query(`UPDATE crm.employees SET ${column}=$1 WHERE username=$2`, [!value, recipient]);
  }
  detail = (await api(filePath(inactive))).body.data;
  assert.deepEqual(detail.allocation_recipients.map(row => row.username), [recipient]);
  assert.equal((await api(`${filePath(inactive)}/review`, { action: 'YES', comments: 'Do not reassign during Pricing', expected_updated_at: detail.file.updated_at, allocated_to: otherRecipient })).status, 400);
  assert.equal((await api(`${filePath(inactive)}/review`, { action: 'YES', comments: 'Retain allocated BPO Admin', expected_updated_at: detail.file.updated_at })).status, 200);
  assert.equal((await api(filePath(inactive))).body.data.file.allocated_to, recipient);
  const rejected = fixture.files.find(file => file.endsWith('_S_C'));
  detail = (await api(filePath(rejected))).body.data;
  assert.equal((await api(`${filePath(rejected)}/review`, { action: 'NO', comments: 'Benefits need correction', expected_updated_at: detail.file.updated_at })).status, 200);
  assert((await api('/mis/business?queue=register', undefined, 'tracker')).body.data.some(row => row.file_no === rejected));
  assert(!(await api('/mis/business?queue=register', undefined, 'outsider')).body.data.some(row => row.file_no === rejected));
  assert(!(await api('/pricing-review')).body.data.some(row => row.file_no === rejected));
  const direct = await file('DIRECT', 'C', tracker, 'C');
  assert.equal((await api(`/business/${encodeURIComponent(direct)}/allocate`, { allocated_to: recipient }, 'bpo')).status, 200);
  assert((await api('/pricing-review')).body.data.some(row => row.file_no === direct));
  const med = await file('MEDICAL', 'S', tracker, 'C');
  await pool.query(`UPDATE crm.business_tracking SET file_status='MEDICAL UW-REVIEW',medical_uw=TRUE WHERE file_no=$1`, [med]);
  await pool.query(`UPDATE crm.business_work_items SET work_status='COMPLETED' WHERE file_no=$1`, [med]);
  await pool.query(`INSERT INTO crm.business_work_items(file_no,queue_name,forwarded_by) VALUES($1,'MEDICAL_UNDERWRITING',$2)`, [med, tracker]);
  detail = (await api(`/medical-underwriting/files/${encodeURIComponent(med)}`, undefined, 'medical')).body.data;
  assert.equal((await api(`/medical-underwriting/files/${encodeURIComponent(med)}/review`, { action: 'F', comments: 'Medical cleared; verify corporate pricing',
    hpc: false, lateral_movement: false, allocated_to: membership, expected_updated_at: detail.file.updated_at }, 'medical')).status, 200);
  assert((await api('/pricing-review')).body.data.some(row => row.file_no === med));
  const options = await api('/business/allocated/action-options',undefined,'recipient');
  assert(options.body.data.some(row => row.code === 'P' && row.label === 'Pricing Review'));
  const destination = await api('/business/allocation-destinations?action=P',undefined,'recipient');
  assert.equal(destination.body.data.queue_name,'PRICING_REVIEW');
  assert.equal(destination.body.data.needs_assignee,false);
  for (const clientType of ['R','C','S']) {
    const fileNo = await manualAllocation(`MANUAL_${clientType}`,clientType,tracker,recipient);
    const endpoint = `/business/${encodeURIComponent(fileNo)}/allocation-action`;
    const input = {action:'P',comments:'Custom-rate business needs Pricing and benefit verification'};
    assert.equal((await api(endpoint,input,'otherRecipient')).status,403);
    assert.equal((await api(endpoint,{action:'MU',comments:'Unverified benefits must not bypass Pricing'},'recipient')).status,409);
    assert.equal((await api(endpoint,{...input,comments:''},'recipient')).status,400);
    const moved = await api(endpoint,input,'recipient');
    assert.equal(moved.status,200,JSON.stringify(moved.body));
    assert.equal(moved.body.data.queue_name,'PRICING_REVIEW');
    assert.equal((await api(endpoint,input,'recipient')).status,409);
    assert(!(await api('/mis/business/allocated',undefined,'recipient')).body.data.some(row=>row.file_no===fileNo));
    assert((await api('/pricing-review')).body.data.some(row=>row.file_no===fileNo));
    let manualDetail = (await api(filePath(fileNo))).body.data;
    assert.equal(manualDetail.file.allocated_to,recipient);
    assert.equal(manualDetail.file.benefit_verified,'NO');
    assert(manualDetail.notes.some(row=>row.notes==='Original tracker note - retain'));
    assert(manualDetail.notes.some(row=>row.notes.includes(input.comments)));
    const approve = () => ({action:'YES',comments:'Pricing cleared; return to the original BPO Admin',expected_updated_at:manualDetail.file.updated_at});
    assert.equal((await api(`${filePath(fileNo)}/review`,approve())).status,400);
    await matrix(fileNo);
    manualDetail = (await api(filePath(fileNo))).body.data;
    assert.equal((await api(`${filePath(fileNo)}/review`,approve())).status,200);
    const returned = (await api(`/mis/business/allocated/${encodeURIComponent(fileNo)}`,undefined,'recipient')).body.data;
    assert.equal(returned.benefit_verified,'YES');
    assert.equal(returned.allocated_to,recipient);
    assert(returned.notes.some(row=>row.notes==='Original tracker note - retain'));
  }
  for (const [rate,benefit] of [['S','NO'],['C','YES']]) {
    const fileNo = await manualAllocation(`INELIGIBLE_${rate}_${benefit}`,'C',tracker,recipient,rate,benefit);
    assert.equal((await api(`/business/${encodeURIComponent(fileNo)}/allocation-action`,
      {action:'P',comments:'Reject an ineligible Pricing handoff'},'recipient')).status,409);
    assert(!(await api('/pricing-review')).body.data.some(row=>row.file_no===fileNo));
  }
  await manualAllocation('BROWSER_MANUAL','R',tracker,recipient);
  // Leave two fresh pending files for UI approval/return tests.
  for (const label of ['BROWSER_APPROVE', 'BROWSER_RETURN']) {
    const fileNo = await file(label, 'C', tracker, 'C');
    await allocate(fileNo, 'C', recipient);
  }
  console.log('Pricing checks passed: manual rate C/unverified handoff across client types, other actions blocked, ownership, duplicate rejection, matrix gate, approval to original allocation, Standard bypass, automatic Corporate/SME routing and retained notes.');
  if (process.argv.includes('--keep')) {
    await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
    console.log(`Isolated browser fixtures ready at ${fixturePath}; clean with --cleanup.`);
  } else await cleanup(fixture);
} catch (err) { await cleanup(fixture); throw err; }
finally { await pool.end(); }
