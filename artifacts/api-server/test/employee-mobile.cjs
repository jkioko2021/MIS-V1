const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const { employeeMobile } = load(path.join(__dirname, '../src/lib/employee-mobile.ts'), {});
for (const mobile of ['0700123456', '+254 700-123-456', '(020) 123 4567']) {
  assert.equal(employeeMobile(` ${mobile} `), mobile);
}
assert.equal(employeeMobile(undefined), undefined);
assert.equal(employeeMobile(null), null);
assert.equal(employeeMobile('  '), null);
for (const invalid of [700123456, 'test@example.test', '<script>', '+'.repeat(55), '---']) {
  assert.throws(() => employeeMobile(invalid));
}
const handlers = {}, calls = [];
const router = new Proxy({}, { get: (_, verb) => (route, ...callbacks) => { handlers[`${verb} ${route}`] = callbacks.at(-1); } });
load(path.join(__dirname, '../src/routes/admin.ts'), {
  express: { Router: () => router },
  bcrypt: { default: { hash: async () => 'fixture-only-not-login-hash' } },
  '../lib/postgres': {
    query: async (sql, params) => { calls.push({ sql, params }); return []; },
    queryOne: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('COUNT')) return { c: 0 };
      if (sql.includes('SELECT emp_code')) return { emp_code: 'EMP001' };
      return { employee_id: 10 };
    },
  },
  '../lib/auth-middleware': { requireAuth() {} },
  '../lib/logger': { logger: { error() {} } },
  '../lib/employee-mobile': { employeeMobile },
});
async function invoke(verb, body) {
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
  await handlers[`${verb} /admin/employees${verb === 'put' ? '/:id' : ''}`]({
    body, params: { id: '10' }, user: { sub: 1, username: 'fixture' },
  }, response);
  return response;
}
(async () => {
  const base = { username: 'fixture', employee_name: 'Fixture', email: 'fixture@example.test', profile_id: 1 };
  let response = await invoke('post', { ...base, mobile_no: '+254 0700-001-002' });
  assert.equal(response.statusCode, 201);
  let write = calls.find(c => c.sql.includes('INSERT INTO crm.employees'));
  assert.equal(write.params.at(-1), '+254 0700-001-002');
  calls.length = 0;
  response = await invoke('put', { ...base, mobile_no: '0722001003' });
  assert.equal(response.statusCode, 200);
  write = calls.find(c => c.sql.includes('UPDATE crm.employees'));
  assert.equal(write.params[6], true);
  assert.equal(write.params[7], '0722001003');
  calls.length = 0;
  await invoke('put', base);
  assert.equal(calls.find(c => c.sql.includes('UPDATE crm.employees')).params[6], false, 'Legacy edits must preserve omitted mobile');
  calls.length = 0;
  await invoke('put', { ...base, mobile_no: '' });
  assert.equal(calls.find(c => c.sql.includes('UPDATE crm.employees')).params[7], null, 'Explicit blank clears mobile');
  calls.length = 0;
  response = await invoke('post', { ...base, mobile_no: 700123456 });
  assert.equal(response.statusCode, 400);
  assert.equal(calls.length, 0, 'Reject invalid contacts before writing');
  console.log('PASS: User enrollment mobile create, edit, explicit clear, omitted-field preservation and validation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
