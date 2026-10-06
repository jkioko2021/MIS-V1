// Development-only API regression and browser fixtures. Never touches existing records.
// Run with the local API serving: node test/medical-underwriting.integration.mjs
// Keep fixtures for the browser: ... --keep; clean later: ... --cleanup
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { Storage } from '@google-cloud/storage';

if (process.env.NODE_ENV === 'production') throw new Error('Development database only.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const fixturePath = '/tmp/mis-medical-review-fixtures.json';
const base = 'http://localhost:8080/api/medical-underwriting';
async function cleanup(fixture) {
  const { rows: objects } = await pool.query(`SELECT storage_key FROM crm.business_uploads
    WHERE file_no=ANY($1::varchar[]) AND uploaded_by=ANY($2::varchar[])`, [fixture.files, fixture.users]);
  if (objects.length) {
    const storage = new Storage({
      credentials: {
        audience: 'replit', subject_token_type: 'access_token', type: 'external_account',
        token_url: 'http://127.0.0.1:1106/token',
        credential_source: { url: 'http://127.0.0.1:1106/credential', format: { type: 'json', subject_token_field_name: 'access_token' } },
        universe_domain: 'googleapis.com',
      }, projectId: '',
    });
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
    for (const table of ['business_notifications', 'business_doc_checklist', 'business_uploads', 'business_tracking_notes',
      'medical_underwriting_reviews', 'medical_hpc_registrations', 'business_work_items']) {
      await client.query(`DELETE FROM crm.${table} WHERE file_no=ANY($1::varchar[])`, [fixture.files]);
    }
    await client.query('DELETE FROM crm.business_tracking WHERE file_no=ANY($1::varchar[])', [fixture.files]);
    await client.query('DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])', [fixture.users]);
    await client.query('DELETE FROM crm.employees WHERE username=ANY($1::varchar[])', [fixture.users]);
    await client.query('COMMIT');
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
  await unlink(fixturePath).catch(() => {});
}
if (process.argv.includes('--cleanup')) {
  await cleanup(JSON.parse(await readFile(fixturePath, 'utf8')));
  await pool.end();
  console.log('Isolated medical review fixtures removed.');
  process.exit(0);
}
const prefix = `MU_TEST_${randomUUID().slice(0, 8)}`;
const fixture = { users: [], files: [], cookies: {} };
async function employee(label, profileId) {
  const username = `${prefix}_${label}`;
  fixture.users.push(username);
  const { rows: [user] } = await pool.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset,department)
    VALUES($1,'TEST_SESSION_ONLY',$2,$3,TRUE,TRUE,CURRENT_DATE,$4) RETURNING employee_id`,
  [username, `Medical test ${label}`, profileId, profileId === 5 ? 'MEDICAL UNDERWRITING' : 'TEST']);
  // Session secret remains inside this process; never printed or written.
  fixture.cookies[label] = jwt.sign({ sub: user.employee_id, username, name: `Medical test ${label}`, profileId },
    process.env.SESSION_SECRET ?? 'dev-secret-change-me', { expiresIn: '30m' });
  return username;
}
async function file(label, assignedTo, legacy = false) {
  const fileNo = `${prefix}_${label}`;
  fixture.files.push(fileNo);
  await pool.query(`INSERT INTO crm.business_tracking
    (file_no,proposer_name,business_type,client_type,business,rate_type,entered_by,file_status,
     medical_uw,forwarded,ready_for_update,benefit_verified,premium)
    VALUES($1,$2,'N','R','M','S',$3,'MEDICAL UW-REVIEW',$4,TRUE,$5,'YES',10000)`,
  [fileNo, `Medical Test ${label}`, fixture.users[0], legacy, !legacy]);
  if (!legacy) await pool.query(`INSERT INTO crm.business_work_items
    (file_no,queue_name,assigned_to,forwarded_by) VALUES($1,'MEDICAL_UNDERWRITING',$2,$3)`,
  [fileNo, assignedTo, fixture.users[0]]);
  return fileNo;
}
async function api(path = '', body, label = 'reviewer') {
  const response = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(label ? { Cookie: `mis_session=${fixture.cookies[label]}` } : {}) },
    ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
try {
  const reviewer = await employee('reviewer', 5);
  const other = await employee('other', 5);
  await employee('outsider', 3);
  await employee('finance', 6);
  const membership = await employee('membership', 4);
  await employee('bpo', 12);
  for (const clientType of ['R', 'C', 'S']) {
    const fileNo = await file(`BPO_${clientType}`, other);
    const queue = clientType === 'R' ? 'BPO_REVIEW_RETAIL' : 'BPO_REVIEW_CORPORATE_SME';
    await pool.query(`UPDATE crm.business_tracking SET client_type=$2,file_status='FORWARDED',
      medical_uw=FALSE,ready_for_update=FALSE WHERE file_no=$1`, [fileNo, clientType]);
    await pool.query(`UPDATE crm.business_work_items SET work_status='COMPLETED' WHERE file_no=$1`, [fileNo]);
    await pool.query(`INSERT INTO crm.business_work_items(file_no,queue_name,work_status,forwarded_by)
      VALUES($1,$2,'OPEN',$3)`, [fileNo, queue, fixture.users[0]]);
    const response = await fetch(`http://localhost:8080/api/business/${encodeURIComponent(fileNo)}/review-action`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `mis_session=${fixture.cookies.bpo}` },
      body: JSON.stringify({ action: 'MU', product: 'T', comments: 'Medical review needed', queue_name: queue }),
    });
    assert.equal(response.status, 200, `BPO Medical UW ${clientType}`);
    const inbox = (await api(`?search=${fileNo}`)).body.data;
    assert(inbox.some(row => row.file_no === fileNo && row.reviewable));
    assert.equal((await api(`/files/${fileNo}`)).status, 200);
    const { rows: work } = await pool.query(`SELECT queue_name,work_status,assigned_to FROM crm.business_work_items WHERE file_no=$1`, [fileNo]);
    assert.equal(work.find(row => row.queue_name === queue).work_status, 'COMPLETED');
    assert.equal(work.find(row => row.queue_name === 'MEDICAL_UNDERWRITING').work_status, 'OPEN');
    assert.equal(work.find(row => row.queue_name === 'MEDICAL_UNDERWRITING').assigned_to, null);
  }
  console.log('BPO Medical UW handoffs confirmed in the medical inbox for Retail, Corporate and SME.');
  const held = await file('HOLD', reviewer);
  const hidden = await file('OTHER', other);
  const legacy = await file('LEGACY', null, true);
  const browser = await file('BROWSER', reviewer);
  fixture.browserFile = browser;
  assert.equal((await api('', undefined, null)).status, 401);
  assert.equal((await api('', undefined, 'outsider')).status, 403);
  const list = await api(`?search=${prefix}`);
  assert.equal(list.status, 200);
  assert(list.body.data.some(row => row.file_no === held));
  assert(list.body.data.some(row => row.file_no === legacy));
  assert(list.body.data.filter(row => row.file_no.startsWith(prefix)).every(row => row.reviewable === true));
  assert(!list.body.data.some(row => row.file_no === hidden));
  assert.equal((await api(`/files/${hidden}`)).status, 404);
  assert.equal((await api('/recipients')).status, 200);
  const detail = (await api(`/files/${held}`)).body.data;
  const input = { action: 'H', comments: 'Test hold', hpc: false, lateral_movement: true, expected_updated_at: detail.file.updated_at };
  assert.equal((await api(`/files/${held}/review`, { ...input, comments: ' ' })).status, 400);
  assert.equal((await api(`/files/${held}/review`, { ...input, expected_updated_at: '2000-01-01T00:00:00Z' })).status, 409);
  assert.equal((await api(`/files/${held}/review`, input)).status, 200);
  assert.equal((await api(`/files/${held}`)).body.data.file.file_status, 'ON HOLD');
  assert((await api('?queue=hold')).body.data.some(row => row.file_no === held));
  assert(!(await api('?queue=pending')).body.data.some(row => row.file_no === held));
  for (const [action, status] of [['C', 'CASHIER'], ['F', 'ALLOCATED'], ['RI', 'RETURNED-INCOMPLETE'], ['D', 'DECLINED']]) {
    const fileNo = await file(action, reviewer);
    const current = (await api(`/files/${fileNo}`)).body.data.file;
    const body = { action, comments: `Test ${action}`, hpc: action === 'D', lateral_movement: false,
      expected_updated_at: current.updated_at, invoice_no: 'MU-TEST-INVOICE', paid_status: 'PART', allocated_to: membership };
    if (action === 'C') assert.equal((await api(`/files/${fileNo}/review`, { ...body, invoice_no: '' })).status, 400);
    if (action === 'F') assert.equal((await api(`/files/${fileNo}/review`, { ...body, allocated_to: reviewer })).status, 400);
    assert.equal((await api(`/files/${fileNo}/review`, body)).status, 200, action);
    const { rows: [record] } = await pool.query('SELECT * FROM crm.business_tracking WHERE file_no=$1', [fileNo]);
    assert.equal(record.file_status, status);
    if (action === 'F') { assert.equal(record.allocated_to, membership); assert(record.allocated); }
    if (action === 'C') { assert(record.paid); assert.equal(record.paid_status, 'PART'); }
    const staffApi = async (path, label = 'reviewer', method = 'GET') => {
      const response = await fetch(`http://localhost:8080/api${path}`, {
        method, headers: { Cookie: `mis_session=${fixture.cookies[label]}` },
      });
      return { status: response.status, body: await response.json() };
    };
    if (action === 'C') {
      const cashiers = await staffApi('/cashier', 'finance');
      assert.equal(cashiers.status, 200);
      assert(cashiers.body.data.some(row => row.file_no === fileNo));
      assert.equal((await staffApi(`/cashier/files/${fileNo}`, 'finance')).status, 200);
      assert.equal((await staffApi('/cashier', 'outsider')).status, 403);
    }
    if (action === 'RI') {
      const work = (await pool.query(`SELECT assigned_to,work_status FROM crm.business_work_items
        WHERE file_no=$1 AND queue_name='REGISTER_CORRECTION'`, [fileNo])).rows[0];
      assert.equal(work.assigned_to, reviewer);
      assert.equal(work.work_status, 'OPEN');
      assert((await staffApi('/mis/business?queue=register')).body.data.some(row => row.file_no === fileNo));
      assert(!(await staffApi('/mis/business?queue=register', 'outsider')).body.data.some(row => row.file_no === fileNo));
    }
    if (action === 'D') {
      assert((await api('?queue=declined')).body.data.some(row => row.file_no === fileNo));
      assert(!(await api('?queue=pending')).body.data.some(row => row.file_no === fileNo));
    }
    if (action === 'RI' || action === 'D') {
      const notifications = await staffApi('/notifications');
      assert.equal(notifications.status, 200);
      const notification = notifications.body.data.find(row => row.file_no === fileNo);
      assert(notification);
      assert.equal(notification.email_status, 'NO_RECIPIENT');
      assert(!(await staffApi('/notifications', 'outsider')).body.data.some(row => row.file_no === fileNo));
      assert.equal((await staffApi(`/notifications/${notification.notification_id}/read`, 'outsider', 'POST')).status, 404);
      assert.equal((await staffApi(`/notifications/${notification.notification_id}/read`, 'reviewer', 'POST')).status, 200);
    }
    assert.equal((await api(`/files/${fileNo}/review`, body)).status, action === 'D' ? 409 : 404);
    const { rows: [counts] } = await pool.query(`SELECT
      (SELECT COUNT(*) FROM crm.medical_underwriting_reviews WHERE file_no=$1)::int AS reviews,
      (SELECT COUNT(*) FROM crm.business_tracking_notes WHERE file_no=$1)::int AS notes`, [fileNo]);
    assert.deepEqual(counts, { reviews: 1, notes: 1 });
    if (action === 'D') {
      assert.equal((await api(`/files/${fileNo}`)).body.data.file.reviewable, false);
      const hpc = { member_no: 'TEST-MEMBER', member_name: 'Test Member', proposer_name: 'Test Proposer',
        client_type: 'R', condition: 'Test condition', notes: 'Follow-up test' };
      assert.equal((await api(`/files/${fileNo}/hpc`, { ...hpc, diagnosed_date: 'bad-date' })).status, 400);
      assert.equal((await api(`/files/${fileNo}/hpc`, hpc)).status, 201);
      const declined = await api(`/files/${fileNo}`);
      assert.equal(declined.status, 200);
      assert.equal(declined.body.data.file.reviewable, false);
    }
  }
  // Two reviewers of the same snapshot cannot both commit a decision.
  const concurrent = await file('CONCURRENT', reviewer);
  const snapshot = (await api(`/files/${concurrent}`)).body.data.file;
  const payload = { ...input, expected_updated_at: snapshot.updated_at };
  const results = await Promise.all([api(`/files/${concurrent}/review`, payload), api(`/files/${concurrent}/review`, payload)]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  console.log('Medical review API checks passed: authorization, ownership, legacy queue, all five actions, validation, HPC, and concurrency.');
  if (process.argv.includes('--keep')) {
    await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
    console.log(`Temporary browser fixtures ready at ${fixturePath}; remove with --cleanup.`);
  } else await cleanup(fixture);
} catch (err) {
  await cleanup(fixture);
  throw err;
} finally { await pool.end(); }
