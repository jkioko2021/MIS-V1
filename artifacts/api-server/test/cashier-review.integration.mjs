// Isolated development fixtures only: no existing staff or business is edited.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { Storage } from '@google-cloud/storage';
if (process.env.NODE_ENV === 'production') throw new Error('Development database only.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const path = '/tmp/mis-cashier-fixtures.json';
const fixture = { users: [], files: [], cookies: {} };
const prefix = `CF_${randomUUID().slice(0, 8)}`;
const base = 'http://localhost:8080/api';
async function api(url, body, role = 'finance', method) {
  const response = await fetch(`${base}${url}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', ...(role ? { Cookie: `mis_session=${fixture.cookies[role]}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
async function employee(role, profileId, department) {
  const username = `${prefix}_${role}`;
  fixture.users.push(username);
  const { rows: [row] } = await pool.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset,department)
    VALUES($1,'TEST_SESSION_ONLY',$2,$3,TRUE,TRUE,CURRENT_DATE,$4) RETURNING employee_id`,
    [username, `Cashier test ${role}`, profileId, department]);
  fixture.cookies[role] = jwt.sign({ sub: row.employee_id, username, name: `Cashier test ${role}`, profileId },
    process.env.SESSION_SECRET ?? 'dev-secret-change-me', { expiresIn: '30m' });
  return username;
}
async function cleanup(data) {
  const objects = (await pool.query(`SELECT storage_key FROM crm.business_uploads
    WHERE file_no=ANY($1::varchar[]) AND uploaded_by=ANY($2::varchar[])`, [data.files, data.users])).rows;
  if (objects.length) {
    const storage = new Storage({ credentials: {
      audience: 'replit', subject_token_type: 'access_token', type: 'external_account',
      token_url: 'http://127.0.0.1:1106/token', credential_source: {
        url: 'http://127.0.0.1:1106/credential', format: { type: 'json', subject_token_field_name: 'access_token' },
      }, universe_domain: 'googleapis.com',
    }, projectId: '' });
    for (const object of objects) {
      assert.match(object.storage_key, /^\/objects\/uploads\/[a-zA-Z0-9-]+$/);
      const [, bucket, ...parts] = `${process.env.PRIVATE_OBJECT_DIR}/${object.storage_key.slice('/objects/'.length)}`.split('/');
      await storage.bucket(bucket).file(parts.join('/')).delete({ ignoreNotFound: true });
    }
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const table of ['cashier_reviews', 'business_doc_checklist', 'business_uploads', 'business_tracking_notes', 'business_work_items'])
      await client.query(`DELETE FROM crm.${table} WHERE file_no=ANY($1::varchar[])`, [data.files]);
    await client.query(`DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])`, [data.users]);
    await client.query(`DELETE FROM crm.business_tracking WHERE file_no=ANY($1::varchar[])`, [data.files]);
    await client.query(`DELETE FROM crm.employees WHERE username=ANY($1::varchar[])`, [data.users]);
    await client.query('COMMIT');
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
  await unlink(path).catch(() => {});
}
if (process.argv.includes('--cleanup')) {
  await cleanup(JSON.parse(await readFile(path, 'utf8'))); await pool.end();
  console.log('Cashier fixtures and uploaded bytes removed.'); process.exit(0);
}
const detailPath = file => `/cashier/files/${encodeURIComponent(file)}`;
let tracker, bpo, finance, otherFinance;
async function handoff(label, business = 'M', paidStatus = 'FULL-PAID') {
  const file = `${prefix}_${label}`; fixture.files.push(file);
  await pool.query(`INSERT INTO crm.business_tracking(file_no,proposer_name,business_type,client_type,business,rate_type,
    entered_by,allocated,allocated_to,file_status,benefit_verified,forwarded,ready_for_update,premium,paid_amt,pay_ref_no)
    VALUES($1,$2,'A','R',$3,'S',$4,TRUE,$5,'ALLOCATED','YES',TRUE,TRUE,10000,10000,$6)`,
    [file, `Cashier Test ${label}`, business, tracker, bpo, `${prefix}_REF`]);
  await pool.query(`INSERT INTO crm.business_tracking_notes(file_no,note_from,notes)
    VALUES($1,$2,'Original tracker note - retain')`, [file, tracker]);
  const result = await api(`/business/${file}/allocation-action`,
    { action: 'C', comments: 'Invoiced business handed to Cashier', invoice_no: 'INV-2026-123456789012', paid_status: paidStatus, assigned_to: finance }, 'bpo');
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.data.queue_name, 'CASHIER');
  assert((await api('/cashier')).body.data.some(row => row.file_no === file));
  assert(!(await api('/mis/business/allocated', undefined, 'bpo')).body.data.some(row => row.file_no === file));
  const data = (await api(detailPath(file))).body.data;
  assert.equal(data.file.invoiced, true); assert(data.file.to_cashier_dt);
  assert.equal(data.return_membership_to, bpo);
  return file;
}
async function receipt(file) {
  const data = (await api(detailPath(file))).body.data;
  const bytes = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
  const signed = await api('/storage/uploads/request-url', { name: 'cashier-test.pdf', size: bytes.length, contentType: 'application/pdf' });
  assert.equal(signed.status, 200);
  assert((await fetch(signed.body.uploadURL, { method: 'PUT', body: bytes, headers: { 'Content-Type': 'application/pdf' } })).ok);
  const input = { req_id: data.requirements[0].req_id, filename: 'cashier-test.pdf', filesize: bytes.length,
    mime_type: 'application/pdf', storage_key: signed.body.objectPath };
  assert.equal((await api(`${detailPath(file)}/uploads`, { ...input, filesize: bytes.length + 1 })).status, 400);
  const result = await api(`${detailPath(file)}/uploads`, input);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  const response = await fetch(`${base}${detailPath(file)}/uploads/${result.body.data.upload_id}/download`,
    { headers: { Cookie: `mis_session=${fixture.cookies.finance}` } });
  assert.equal(response.status, 200); assert(Buffer.from(await response.arrayBuffer()).equals(bytes));
}
async function decision(file, action, paidStatus = 'FULL-PAID', extra = {}) {
  const data = (await api(detailPath(file))).body.data;
  return api(`${detailPath(file)}/review`, { action, paid_status: paidStatus, receipt_no: `${prefix}_RCP`,
    comments: 'Cashier verified source documents', expected_updated_at: data.file.updated_at, ...extra });
}
try {
  tracker = await employee('tracker', 3, 'SALES');
  await employee('outsider', 3, 'SALES');
  bpo = await employee('bpo', 13, 'BPO');
  finance = await employee('finance', 6, 'FINANCE');
  otherFinance = await employee('otherFinance', 6, 'FINANCE');
  assert.equal((await api('/cashier', undefined, null)).status, 401);
  assert.equal((await api('/cashier', undefined, 'outsider')).status, 403);
  const full = await handoff('FULL');
  assert.equal((await api(detailPath(full), undefined, 'otherFinance')).status, 404);
  assert.equal((await decision(full, 'M')).status, 400);
  await receipt(full);
  assert.equal((await decision(full, 'M', 'FULL-PAID', { comments: '' })).status, 400);
  assert.equal((await decision(full, 'M', 'FULL-PAID', { receipt_no: '' })).status, 400);
  assert.equal((await decision(full, 'M', 'NOT-PAID')).status, 400);
  assert.equal((await decision(full, 'M', 'FULL-PAID', { expected_updated_at: '2000-01-01T00:00:00Z' })).status, 409);
  const data = (await api(detailPath(full))).body.data;
  const input = { action: 'M', paid_status: 'FULL-PAID', receipt_no: `${prefix}_FULL`, comments: 'Fully receipted', expected_updated_at: data.file.updated_at };
  const concurrent = await Promise.all([api(`${detailPath(full)}/review`, input), api(`${detailPath(full)}/review`, input)]);
  assert.deepEqual(concurrent.map(row => row.status).sort(), [200, 409]);
  const fullRow = (await pool.query('SELECT * FROM crm.business_tracking WHERE file_no=$1', [full])).rows[0];
  assert.equal(fullRow.file_status, 'RECEIPTED'); assert(fullRow.receipted); assert(fullRow.paid);
  assert.equal((await pool.query('SELECT * FROM crm.cashier_reviews WHERE file_no=$1', [full])).rowCount, 1);
  const part = await handoff('PART', 'M', 'PART-PAID'); await receipt(part);
  assert.equal((await decision(part, 'M', 'PART-PAID')).body.data.file_status, 'PENDING PAYMENT');
  assert((await api('/cashier?bucket=credit-control')).body.data.some(row => row.file_no === part));
  assert.equal((await decision(part, 'M')).body.data.file_status, 'RECEIPTED');
  const credit = await handoff('CREDIT', 'M', 'NOT-PAID');
  assert.equal((await decision(credit, 'CC')).status, 400);
  assert.equal((await decision(credit, 'CC', 'NOT-PAID')).status, 200);
  assert((await api('/cashier?bucket=credit-control', undefined, 'otherFinance')).body.data.some(row => row.file_no === credit));
  const membership = await handoff('MEMBERSHIP');
  assert.equal((await decision(membership, 'RM')).status, 200);
  assert((await api('/mis/business/allocated', undefined, 'bpo')).body.data.some(row => row.file_no === membership));
  const returned = await handoff('RETURN');
  assert.equal((await decision(returned, 'RI')).status, 200);
  assert((await api('/mis/business?queue=register', undefined, 'tracker')).body.data.some(row => row.file_no === returned));
  assert(!(await api('/mis/business?queue=register', undefined, 'outsider')).body.data.some(row => row.file_no === returned));
  const nonmedical = await handoff('NONMEDICAL', 'N'); await receipt(nonmedical);
  assert.equal((await decision(nonmedical, 'M')).body.data.file_status, 'FILING');
  for (const file of fixture.files) assert((await pool.query(`SELECT * FROM crm.business_tracking_notes WHERE file_no=$1 AND notes='Original tracker note - retain'`, [file])).rowCount === 1);
  await handoff('BROWSER_RECEIPT');
  await handoff('BROWSER_RETURN');
  console.log('Cashier checks passed: allocation handoff, invoice flag, assigned access, receipt upload/download, receipt gates, concurrent approval, full/partial receipt, Credit Control, membership/tracker returns, nonmedical Filing and retained notes.');
  if (process.argv.includes('--keep')) { await writeFile(path, JSON.stringify(fixture), { mode: 0o600 }); console.log(`Browser fixtures ready at ${path}.`); }
  else await cleanup(fixture);
} catch (err) { await cleanup(fixture); throw err; }
finally { await pool.end(); }
