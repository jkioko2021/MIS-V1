// Development-only lookup and saved-file display checks. Uses isolated fixtures.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production') throw new Error('Development database only.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prefix = `AG_TEST_${randomUUID().slice(0, 8)}`;
const username = `${prefix}_user`;
const legacyCode = `${prefix}_legacy`;
const files = [`${prefix}_NEW`, `${prefix}_OLD`];
let cookie;

async function api(path, authenticated = true) {
  const response = await fetch(`http://localhost:8080/api${path}`, {
    headers: authenticated ? { Cookie: `mis_session=${cookie}` } : {},
  });
  return { status: response.status, body: await response.json() };
}

try {
  const { rows: references } = await pool.query(
    'SELECT agent_code,agent_name,agent_status,terminated FROM crm.tbl_mis_sales_intermediary ORDER BY agent_code',
  );
  assert(references.length > 0, 'Load the intermediary master before running this check.');
  const active = references.find(row => row.terminated === 0 && row.agent_status?.trim().toUpperCase() === 'ACTIVE');
  assert(active, 'At least one active, nonterminated intermediary is required.');
  const { rows: [user] } = await pool.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset,department)
    VALUES($1,'TEST_SESSION_ONLY','Agent lookup test',1,TRUE,TRUE,CURRENT_DATE,'TEST')
    RETURNING employee_id`, [username]);
  cookie = jwt.sign({ sub: user.employee_id, username, name: 'Agent lookup test', profileId: 1 },
    process.env.SESSION_SECRET ?? 'dev-secret-change-me', { expiresIn: '10m' });

  assert.equal((await api('/mis/agents', false)).status, 401);
  const lookup = await api('/mis/agents');
  assert.equal(lookup.status, 200);
  assert.equal(lookup.body.data.length, references.length);
  for (const reference of references) {
    const option = lookup.body.data.find(row => row.agent_id === reference.agent_code);
    assert(option);
    assert.equal(option.agent_name, reference.agent_name);
    assert.equal(option.is_active,
      reference.terminated === 0 && reference.agent_status?.trim().toUpperCase() === 'ACTIVE');
    assert(!('pin_no' in option) && !('nid_no' in option) && !('user_id' in option));
  }
  await pool.query(`INSERT INTO commission.sales_agents(agent_id,agent_name,is_active)
    VALUES($1,'Synthetic legacy intermediary',TRUE)`, [legacyCode]);
  for (const [i, fileNo] of files.entries()) {
    await pool.query(`INSERT INTO crm.business_tracking
      (file_no,proposer_name,business_type,client_type,business,rate_type,agent_id,
       entered_by,file_status,allocated,allocated_to,allocate_dt,is_active)
      VALUES($1,'Synthetic agent display check','N','R','M','S',$2,$3,$4,$5,$6,NOW(),TRUE)`,
    [fileNo, i === 0 ? active.agent_code : legacyCode, username,
      i === 0 ? 'ALLOCATED' : 'REGISTERED', i === 0, i === 0 ? username : null]);
    const detail = await api(`/mis/business/${fileNo}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.agent_id, i === 0 ? active.agent_code : legacyCode);
    assert.equal(detail.body.data.agent_name, i === 0 ? active.agent_name : 'Synthetic legacy intermediary');
  }
  const allocatedDetail = await api(`/mis/business/allocated/${files[0]}`);
  assert.equal(allocatedDetail.status, 200);
  assert.equal(allocatedDetail.body.data.agent_name, active.agent_name);
  const list = await api('/mis/business?limit=200&sort_by=agent_name&sort_dir=asc');
  assert.equal(list.status, 200);
  const allocatedList = await api('/mis/business/allocated');
  assert.equal(allocatedList.status, 200);
  console.log('Agent lookup verified: master-backed names/codes, active eligibility, authenticated access, saved-file names and legacy fallback.');
} finally {
  for (const table of ['business_tracking_notes', 'business_work_items', 'business_doc_checklist']) {
    await pool.query(`DELETE FROM crm.${table} WHERE file_no=ANY($1::varchar[])`, [files]);
  }
  await pool.query('DELETE FROM crm.business_tracking WHERE file_no=ANY($1::varchar[])', [files]);
  await pool.query('DELETE FROM commission.sales_agents WHERE agent_id=$1', [legacyCode]);
  await pool.query('DELETE FROM crm.admin_audit_trail WHERE username=$1', [username]);
  await pool.query('DELETE FROM crm.employees WHERE username=$1', [username]);
  await pool.end();
}
