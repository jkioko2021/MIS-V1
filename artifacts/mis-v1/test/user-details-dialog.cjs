const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const output = {};
const jsx = (type, props) => ({ type, props: props || {} });
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/admin/user-details-dialog.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: output,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, key) => String(key) });
    throw Error(name);
  },
});
function walk(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  return [node, ...walk(node.props?.children)];
}
function text(node) {
  if (node == null) return '';
  if (typeof node !== 'object') return String(node);
  if (Array.isArray(node)) return node.map(text).join(' ');
  return text(node.props?.children);
}
let closed = 0;
const employee = { employee_id: 12, emp_code: 'EMP012', username: 'sample', employee_name: 'Sample User',
  email: 'sample@example.test', mobile_no: '+254 0700-001-002', department: 'Sales', profile_name: 'Sales Manager',
  activated: true, approved: true, employee_locked: false, failed_attempts: 0,
  last_login_date: null, last_password_reset: null, created_at: '2026-01-01', added_by: 'administrator',
  password_hash: 'MUST_NOT_RENDER', token: 'MUST_NOT_RENDER' };
let tree = output.UserDetailsDialog({ employee, onClose() { closed++; } });
for (const value of ['Sample User', 'EMP012', 'sample@example.test', '+254 0700-001-002', 'Sales Manager', 'Approved', 'Unlocked']) {
  assert(text(tree).includes(value), value);
}
assert(!text(tree).includes('MUST_NOT_RENDER'), 'Never render arbitrary account fields or credentials');
assert(!walk(tree).some(node => ['input', 'Input', 'Textarea', 'Select'].includes(node.type)), 'Details must be read-only');
walk(tree).find(node => node.type === 'Button').props.onClick();
assert.equal(closed, 1);
tree = output.UserDetailsDialog({ employee: { ...employee, mobile_no: null, email: null, activated: false, approved: false,
  employee_locked: true }, onClose() {} });
for (const value of ['Not captured', 'Inactive', 'Pending approval', 'Locked']) assert(text(tree).includes(value), value);
const page = fs.readFileSync(path.join(__dirname, '../src/pages/admin/users.tsx'), 'utf8');
assert(page.includes('setViewEmployee(emp)') && page.includes('<UserDetailsDialog'), 'Menu action must open details');
console.log('PASS: User details display contacts/statuses, handle missing values, close correctly and exclude secrets.');
