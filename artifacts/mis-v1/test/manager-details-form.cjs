const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
const writes = [];
let cursor = 0; let state = [];
const jsx = (type, props) => ({ type, props: props || {} });
const source = fs.readFileSync(path.join(__dirname, '../src/pages/admin/sales-structure/manager-details.tsx'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exportsObject,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name === 'react') return { useMemo: fn => fn(), useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    } };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async () => {} }) };
    if (name === '@workspace/api-client-react') return new Proxy({}, { get: (_, key) =>
      String(key).startsWith('get') ? () => [] : () => ({ isPending: false,
        mutate(data, options) { writes.push({ kind: key === 'useEnrollSalesManager' ? 'create' : 'edit', data, options }); },
      }) });
    if (name === 'lucide-react' || name.startsWith('@/components/ui/'))
      return new Proxy({}, { get: (_, key) => String(key) });
    throw new Error(`Unexpected dependency ${name}`);
  },
});
function walk(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  if (typeof node.type === 'function') return walk(node.type(node.props));
  return [node, ...walk(node.props?.children)];
}
const staff = [
  { employee_id: 1, employee_name: 'First normal user', username: 'first-user', emp_code: 'EMP_FIRST', email: 'first@example.test' },
  { employee_id: 2, employee_name: 'Second normal user', username: 'second-user', emp_code: 'EMP_SECOND', email: 'second@example.test' },
  { employee_id: 3, employee_name: 'No code user', username: 'no-code', emp_code: null, email: null },
  { employee_id: 4, employee_name: 'Pending Sales user', username: 'pending-sales', emp_code: 'EMP_PENDING',
    email: 'pending@example.test', user_eligible: false, eligibility_note: 'Inactive; Not approved' },
  { employee_id: 5, employee_name: ' FIRST   NORMAL user ', username: 'duplicate-login', emp_code: 'EMP_DUPLICATE',
    email: 'duplicate@example.test', user_eligible: false },
];
const original = JSON.stringify(staff);
let currentProps = { users: staff, managers: [], initialLevel: 'UNIT', onClose() {}, onSaved() {},
  refreshStructure: async () => {}, refreshManager: async () => undefined };
function render() { cursor = 0; return exportsObject.ManagerDetailsForm(currentProps); }
const node = testId => walk(render()).find(item => item.props['data-testid'] === testId);
const field = key => node(`input-manager-detail-${key}`);
const change = (key, value) => field(key).props.onChange({ target: { value } });
const account = id => node('select-manager-staff').props.onChange({ target: { value: String(id) } });
const optionText = value => typeof value === 'string' ? value
  : Array.isArray(value) ? value.map(optionText).join(' ') : value?.props ? optionText(value.props.children) : '';

(async () => {
  const choices = walk(render()).filter(item => item.type === 'option');
  assert(choices.find(item => optionText(item).includes('No code user')).props.disabled);
  assert(!choices.find(item => optionText(item).includes('Pending Sales user')).props.disabled);
  const staffChoices = walk(node('select-manager-staff')).filter(item => item.type === 'option');
  assert.equal(staffChoices.filter(item => optionText(item).toLowerCase().replace(/\s+/g, ' ').includes('first normal user')).length, 1);
  assert(staffChoices.some(item => optionText(item) === 'First normal user · first@example.test'));
  assert(!staffChoices.some(item => /first-user|EMP_FIRST|Inactive|Not approved|duplicate-login/.test(optionText(item))));
  node('input-search-staff').props.onChange({ target: { value: 'first@example.test' } });
  assert(walk(node('select-manager-staff')).some(item => item.type === 'option' && optionText(item) === 'First normal user · first@example.test'));
  assert(!walk(node('select-manager-staff')).some(item => item.type === 'option' && optionText(item).includes('Second normal user')));
  node('input-search-staff').props.onChange({ target: { value: '' } });
  account(4);
  assert.equal(field('code').props.value, 'EMP_PENDING', 'Pending Sales users can prepare inactive designations');
  assert.equal(node('checkbox-manager-designation-active').props.checked, false);
  assert.equal(node('checkbox-manager-designation-active').props.disabled, true);
  for (const label of ['Unit Manager', 'Regional Manager', 'Branch Manager', 'National Sales Manager'])
    assert(choices.some(item => optionText(item) === label));
  account(1);
  staff[0].mobile_no = '+254 0711-002-003';
  account(1);
  assert.equal(node('input-manager-account-mobile').props.value, '+254 0711-002-003');
  assert.equal(node('input-manager-account-mobile').props.readOnly, true);
  delete staff[0].mobile_no;
  account(1);
  for (const [key, value] of [['code', 'EMP_FIRST'], ['mis-emp-code', 'EMP_FIRST'], ['name', 'First normal user']]) {
    assert.equal(field(key).props.value, value);
    assert.equal(field(key).props.readOnly, true);
  }
  node('button-save-manager-details').props.onClick();
  assert.equal(writes.length, 0, 'Incomplete required fields must not save');
  for (const [key, value] of Object.entries({
    email: 'manager@example.test', 'hrmis-code': '000123', 'mobile-no': '+254 0700-001-002',
    'h-tax': '0.100', 'valid-from': '2026-01-01', 'valid-to': '2026-12-31',
  })) change(key, value);
  node('checkbox-manager-designation-active').props.onChange({ target: { checked: false } });
  node('button-save-manager-details').props.onClick();
  assert.equal(writes.length, 1);
  const created = writes[0].data.data;
  assert.equal(created.employee_id, 1);
  assert.equal(created.level, 'UNIT');
  assert.equal(created.is_active, false);
  assert.equal(created.details.code, 'EMP_FIRST');
  assert.equal(created.details.mis_emp_code, 'EMP_FIRST');
  assert.equal(created.details.h_tax, '0.100');
  assert.equal(created.details.hrmis_code, '000123');
  assert.equal(created.details.mobile_no, '+254 0700-001-002');
  account(2);
  assert.equal(field('code').props.value, 'EMP_SECOND');
  assert.equal(field('name').props.value, 'Second normal user');
  assert.equal(field('email').props.value, 'second@example.test');
  for (const key of ['hrmis-code', 'mobile-no', 'h-tax', 'valid-from', 'valid-to'])
    assert.equal(field(key).props.value, '', 'Changing account must not carry another manager’s details');
  account(4);
  for (const [key, value] of Object.entries({
    email: 'pending-contact@example.test', 'hrmis-code': '000456', 'mobile-no': '0700000002',
    'h-tax': '0.100', 'valid-from': '2026-01-01', 'valid-to': '2026-12-31',
  })) change(key, value);
  node('button-save-manager-details').props.onClick();
  assert.equal(writes.at(-1).data.data.employee_id, 4);
  assert.equal(writes.at(-1).data.data.is_active, false);
  assert.equal(writes.at(-1).data.data.details.code, 'EMP_PENDING');

  const manager = { id: 8, employee_id: 1, employee_name: staff[0].employee_name,
    emp_code: staff[0].emp_code, account_email: staff[0].email, username: staff[0].username,
    level: 'UNIT', is_active: true, version: 3, user_eligible: true, details: created.details };
  state = []; currentProps = { ...currentProps, manager, managers: [manager],
    refreshManager: async () => ({ ...manager, version: 4 }) };
  assert(!node('select-manager-staff'), 'Existing manager identity is immutable');
  assert(!node('select-manager-level'), 'Changing category must not rewrite an existing designation');
  change('email', 'updated-manager@example.test');
  node('button-save-manager-details').props.onClick();
  const edit = writes.at(-1);
  assert.equal(edit.kind, 'edit');
  assert.equal(edit.data.id, 8);
  assert.equal(edit.data.data.version, 3);
  assert.equal(edit.data.data.details.email, 'updated-manager@example.test');
  assert.equal(edit.data.data.details.h_tax, '0.100');
  await edit.options.onError({ status: 409, message: 'This record changed' });
  assert.equal(field('email').props.value, 'updated-manager@example.test');
  assert.equal(node('button-save-manager-details').props.disabled, true);
  await node('button-refresh-manager-version').props.onClick();
  node('button-keep-manager-draft').props.onClick();
  node('button-save-manager-details').props.onClick();
  assert.equal(writes.at(-1).data.data.version, 4);
  assert.equal(writes.at(-1).data.data.details.email, 'updated-manager@example.test');
  state=[];
  currentProps={...currentProps,manager:undefined,initialLevel:'REGION',initialEmployeeId:2,lockSelection:false};
  const beforeDraft=writes.length;
  node('checkbox-manager-designation-active').props.onChange({target:{checked:false}});
  node('button-save-manager-details').props.onClick();
  assert.equal(writes.length,beforeDraft+1,'An inactive enrollment can retain missing fields');
  assert.equal(writes.at(-1).data.data.details.mobile_no,'');
  assert.equal(writes.at(-1).data.data.details.h_tax,'');
  assert.equal(writes.at(-1).data.data.is_active,false);
  node('checkbox-manager-designation-active').props.onChange({target:{checked:true}});
  node('button-save-manager-details').props.onClick();
  assert.equal(writes.length,beforeDraft+1,'Activating the same incomplete draft must be blocked');
  assert.equal(JSON.stringify(staff), original, 'Form interactions must not mutate account data');
  console.info('PASS: all manager fields, read-only existing account codes/name, four categories, missing-code exclusion, exact payroll/tax/phone values, account-change reset, immutable edit identity and explicit stale-draft rebase.');
})().catch(error => { console.error(error); process.exitCode = 1; });
