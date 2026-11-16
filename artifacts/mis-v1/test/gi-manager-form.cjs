const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const output = {};
let cursor = 0, state = [], saved = [], invalidations = [], done = 0;
const jsx = (type, props) => ({ type, props: props || {} });
const source = fs.readFileSync(path.join(__dirname, '../src/pages/admin/gi-structure/manager-form.tsx'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: output,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = initial;
      return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
    } };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async arg => invalidations.push(arg) }) };
    if (name === '@workspace/api-client-react') return {
      useSaveGiManager: () => ({ isPending: false, mutateAsync: async input => { saved.push(input.data); } }),
      getGetGiStructureQueryKey: () => ['/api/gi-structure'],
    };
    if (name === '@/hooks/use-toast') return { useToast: () => ({ toast() {} }) };
    if (name === '../organisation/shared') return { errorMessage: e => String(e) };
    if (name === '@/lib/utils') return { cn: (...parts) => parts.join(' ') };
    if (name.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, key) => String(key) });
    throw Error(name);
  },
});
function walk(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  if (typeof node.type === 'function') return walk(node.type(node.props));
  return [node, ...walk(node.props?.children)];
}
const user = { employee_id: 71, employee_name: 'GI Test Manager', emp_code: 'TEST71', email: 'gi@example.test', mobile_no: '+254 0700-001-002', user_eligible: true };
const snapshot = { manager_users: [user], nodes: [], nationals: [] };
let props = { snapshot, onDone() { done++; }, onCancel() {} };
function render() { cursor = 0; return walk(output.ManagerForm(props)); }
const find = predicate => render().find(predicate);
(async () => {
  assert(!render().some(n => ['gi-manager-primary-unit', 'gi-manager-active'].includes(n.props.id)));
  find(n => n.props.id === 'gi-enrollment-user').props.onValueChange('71');
  assert.equal(find(n => n.props.id === 'gi-manager-mobile').props.value, user.mobile_no);
  assert.equal(find(n => n.props.id === 'gi-manager-mobile').props.readOnly, true);
  find(n => n.props['data-testid'] === 'input-gi-manager-reason').props.onChange({ target: { value: 'Enroll manager for GI setup' } });
  assert.equal(find(n => n.type === 'Button' && n.props.type === 'submit').props.disabled, false);
  await find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].details.GI_UNIT_CODE, '');
  assert.equal(saved[0].is_active, false);
  assert.equal(saved[0].employee_id, 71);
  assert.equal(saved[0].details.MOBILE_NO, undefined, 'Contact stays on the user account, not copied into GI metadata');
  assert.equal(done, 1);
  assert.equal(invalidations.length, 2);
  const details = { ...saved[0].details, GI_UNIT_CODE: 'ORIGINAL_UNIT', VALID_FROM: '2026-01-01', VALID_TO: '2099-12-31' };
  state = [];
  props = { ...props, manager: { id: 15, version: 3, employee_id: 71, level: 'UNIT', is_active: true, details } };
  find(n => n.props['data-testid'] === 'input-gi-manager-reason').props.onChange({ target: { value: 'Update original manager details' } });
  await find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(saved.length, 2);
  assert.equal(saved[1].is_active, true, 'Removing checkbox must not deactivate existing managers');
  assert.equal(saved[1].details.GI_UNIT_CODE, 'ORIGINAL_UNIT', 'Removing selector must not erase source metadata');
  console.log('PASS: GI enrollment saves without Unit/Active controls, refreshes lists, and preserves existing metadata/status.');
})().catch(error => { console.error(error); process.exitCode = 1; });
