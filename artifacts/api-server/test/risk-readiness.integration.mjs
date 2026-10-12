// Development-only verification of the real route and SQL. All fixture writes
// share a transaction that is rolled back, including after a failed assertion.
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import pg from 'pg';
import express from 'express';
import bcrypt from 'bcrypt';

if (process.env.NODE_ENV === 'production') throw new Error('Development tests only.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
const dir = await mkdtemp(path.join(tmpdir(), 'risk-readiness-'));
const require = createRequire(import.meta.url);
const fixturePath = '/tmp/mis-risk-readiness-fixture.json';
const keep = process.argv.includes('--keep');
const scale = process.argv.includes('--scale');
const registerSize = scale ? 20_000 : 701;
let readinessPlan;
let committed = false;
let server;
try {
  await client.query('BEGIN');
  if (process.argv.includes('--cleanup')) {
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    assert.match(fixture.prefix, /^RD[a-f0-9]{8}$/);
    const codes = ['A', 'B', 'C'].map(s => fixture.prefix + s);
    await client.query('DELETE FROM risk.register_history WHERE depart_code=ANY($1::text[])', [codes]);
    await client.query('DELETE FROM risk.root_causes WHERE risk_code IN(SELECT risk_code FROM risk.risk_master WHERE depart_code=ANY($1::text[]))', [codes]);
    for (const table of ['master_summary', 'risk_master', 'department_summary', 'department_assignments']) {
      await client.query(`DELETE FROM risk.${table} WHERE depart_code=ANY($1::text[])`, [codes]);
    }
    await client.query('DELETE FROM risk.departments WHERE depart_code=ANY($1::text[])', [codes]);
    await client.query('DELETE FROM risk.periods WHERE period_id=$1', [fixture.period_id]);
    await client.query('DELETE FROM crm.admin_audit_trail WHERE username LIKE $1', [fixture.prefix + '%']);
    await client.query('DELETE FROM crm.employees WHERE username LIKE $1', [fixture.prefix + '%']);
    await client.query('COMMIT'); committed = true;
    await rm(fixturePath, { force: true });
    console.log('Readiness browser fixtures removed.');
  } else {
  globalThis.readinessTestQuery = async (sql, params) => {
    if (scale && !readinessPlan && sql.includes('AS risks_missing_root_causes')) {
      const explained = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, params);
      readinessPlan = explained.rows[0]['QUERY PLAN'][0];
    }
    return (await client.query(sql, params)).rows;
  };
  const prefix = `RD${randomBytes(4).toString('hex')}`;
  const deps = {
    db: `export const query=(s,p)=>globalThis.readinessTestQuery(s,p);
      export const txQuery=(c,s,p)=>query(s,p);
      export const withTransaction=()=>{throw new Error("Readiness must be read-only");};`,
    auth: `export function requireAuth(req,res,next){
      const id=Number(req.headers['x-test-employee']);
      if(!id){res.status(401).json({ok:false});return;}
      req.user={sub:id};next();
    }`,
  };
  await build({
    entryPoints: [path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/routes/risk-register.ts')],
    outfile: path.join(dir, 'route.mjs'), bundle: true, platform: 'node', format: 'esm',
    logLevel: 'silent',
    plugins: [{ name: 'isolated-test-db', setup(b) {
      b.onResolve({ filter: /\/(postgres|auth-middleware)$/ }, args => ({
        path: args.path.endsWith('postgres') ? 'db' : 'auth', namespace: 'fixture',
      }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: deps[args.path], loader: 'js' }));
      b.onResolve({ filter: /^[^./]/ }, args => args.path.startsWith('@workspace/') ? undefined : ({
        path: args.path.startsWith('node:') ? args.path : require.resolve(args.path), external: true,
      }));
    } }],
  });
  // External packages must resolve from the workspace, not a /tmp directory.
  const { default: router } = await import(pathToFileURL(path.join(dir, 'route.mjs')).href);
  const users = {};
  const password = `Readiness-${randomBytes(18).toString('hex')}`;
  const passwordHash = await bcrypt.hash(password, 10);
  for (const [label, profile] of [['champion', 9], ['owner', 9], ['admin', 1], ['unrelated', 8]]) {
    const { rows: [user] } = await client.query(`INSERT INTO crm.employees
      (emp_code,username,password_hash,employee_name,profile_id,department,activated,approved,last_password_reset)
      VALUES($1,$1,$3,$1,$2,'RISK',TRUE,TRUE,CURRENT_DATE) RETURNING employee_id`, [`${prefix}${label}`, profile, passwordHash]);
    users[label] = user.employee_id;
  }
  const departments = ['A', 'B', 'C'].map(s => `${prefix}${s}`);
  for (const d of departments) await client.query('INSERT INTO risk.departments(depart_code,depart_name) VALUES($1,$1)', [d]);
  for (const d of departments.slice(0, 2)) await client.query(`INSERT INTO risk.department_assignments
    (depart_code,champion_username,owner_username,assigned_by) VALUES($1,$2,$3,$2)`,
  [d, `${prefix}champion`, `${prefix}owner`]);
  const { rows: [period] } = await client.query(`INSERT INTO risk.periods(period_from,period_to,status)
    VALUES('2998-01-01','2998-03-31','OPEN') RETURNING period_id`);
  for (const [d, count] of [[departments[0], registerSize], [departments[1], 3], [departments[2], 2]]) {
    await client.query(`INSERT INTO risk.risk_master(risk_code,depart_code,period_from,period_to,risk_title,entered_by,assessment_updated,
      i_rate,l_rate,i_risk_exposure,i_risk_rate,perceived_rate,perceived_contr_eff,r_risk_exposure,r_risk_rate,current_contr)
      SELECT $1||n,$2,'2998-01-01','2998-03-31','Readiness test',$3,TRUE,
        4,5,20,20,0.25,25,15,15,'Saved control' FROM generate_series(1,$4::int) n`,
    [d, d, `${prefix}champion`, count]);
  }
  await client.query(`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,action_owner)
    SELECT risk_code,'Saved cause','Saved control','Saved mitigation',$2
    FROM risk.risk_master WHERE depart_code=ANY($1::text[])`, [departments, `${prefix}owner`]);
  // Multiple causes must not inflate totals.
  await client.query("INSERT INTO risk.root_causes(risk_code,root_cause) VALUES($1,'Second cause')", [`${departments[0]}1`]);
  await client.query(`INSERT INTO risk.risk_master(risk_code,depart_code,period_from,period_to,risk_title,entered_by,is_active)
    VALUES($1,$2,'2998-01-01','2998-03-31','Inactive',$3,FALSE),
    ($4,$2,'2998-04-01','2998-06-30','Other period',$3,TRUE)`,
  [`${prefix}inactive`, departments[0], `${prefix}champion`, `${prefix}other`]);
  const app = express();
  app.use((req, _res, next) => { req.log = { error: (...args) => console.error(...args) }; next(); });
  app.use(router);
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/risk-register/readiness`;
  async function request(d, label = 'champion', p = period.period_id) {
    const response = await fetch(`${base}/${d}/${p}`, { headers: label ? { 'x-test-employee': String(users[label]) } : {} });
    return { status: response.status, body: await response.json() };
  }
  let result = await request(departments[0]);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data, { depart_code: departments[0], period_id: period.period_id,
    total_active_risks: registerSize, assessed_risks: registerSize, risks_missing_root_causes: 0 });
  if (scale) {
    const nodes = [];
    const visit = node => { nodes.push(node); for (const child of node.Plans ?? []) visit(child); };
    visit(readinessPlan.Plan);
    assert(!nodes.some(node => node['Parent Relationship'] === 'SubPlan'), 'No correlated per-risk root-cause lookup');
    const rootScans = nodes.filter(node => node['Relation Name'] === 'root_causes');
    assert(rootScans.length > 0);
    assert(rootScans.every(node => node['Actual Loops'] === 1), 'Root-cause source scanned once, not once per risk');
    console.log(`Readiness EXPLAIN ANALYZE: ${registerSize} risks, ${readinessPlan['Execution Time']} ms, root-source loops ${rootScans.map(node => node['Actual Loops']).join(',')}, no correlated subplans.`);
  }
  assert.equal((await request(departments[1])).body.data.total_active_risks, 3);
  assert.equal((await request(departments[2])).status, 403);
  assert.equal((await request(departments[0], 'owner')).status, 403);
  assert.equal((await request(departments[0], 'unrelated')).status, 403);
  assert.equal((await request(departments[2], 'admin')).body.data.total_active_risks, 2);
  assert.equal((await request(departments[0], null)).status, 401);
  assert.equal((await request(departments[0], 'champion', 0)).status, 400);
  assert.equal((await request(departments[0], 'champion', 2147483647)).status, 404);
  await client.query('UPDATE risk.risk_master SET assessment_updated=FALSE WHERE risk_code=$1', [`${departments[0]}${registerSize}`]);
  await client.query('DELETE FROM risk.root_causes WHERE risk_code=$1', [`${departments[0]}${registerSize - 1}`]);
  result = await request(departments[0]);
  assert.equal(result.body.data.assessed_risks, registerSize - 1);
  assert.equal(result.body.data.risks_missing_root_causes, 1);
  assert.equal((await request(departments[1])).body.data.risks_missing_root_causes, 0);
  await client.query('UPDATE risk.risk_master SET assessment_updated=TRUE WHERE risk_code=$1', [`${departments[0]}${registerSize}`]);
  await client.query("INSERT INTO risk.root_causes(risk_code,root_cause) VALUES($1,'Restored')", [`${departments[0]}${registerSize - 1}`]);
  result = await request(departments[0]);
  assert.equal(result.body.data.assessed_risks, registerSize);
  assert.equal(result.body.data.risks_missing_root_causes, 0);
  console.log('PASS: real PostgreSQL readiness over 500 rows, multi-department/period isolation, access boundaries and refreshed readiness.');
  if (keep) {
    await writeFile(fixturePath, JSON.stringify({ prefix, username: `${prefix}champion`, password, departments, period_id: period.period_id }), { mode: 0o600 });
    await client.query('COMMIT'); committed = true;
    console.log(`Browser fixtures retained in ${fixturePath}; run --cleanup afterwards.`);
  }
  }
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (!committed) await client.query('ROLLBACK');
  client.release(); await pool.end();
  delete globalThis.readinessTestQuery;
  await rm(dir, { recursive: true, force: true });
}
