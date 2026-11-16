const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const output = {};
const jsx = (type, props) => ({ type, props: props || {} });
let open = false;
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/admin/gi-structure/node-view-action.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: output,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useState: () => [open, value => { open = value; }] };
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
function text(node) {
  if (node == null) return '';
  if (typeof node !== 'object') return String(node);
  if (Array.isArray(node)) return node.map(text).join(' ');
  if (typeof node.type === 'function') return text(node.type(node.props));
  return text(node.props?.children);
}
const branch = { id: 1, name: 'GI Branch', level: 'BRANCH', status: 'ACTIVE', available: true, manager_id: null };
const unit = { id: 2, name: 'GI Unit Alpha', level: 'UNIT', status: 'ACTIVE', available: true, parent_id: 1,
  parent_name: 'GI Branch', manager_id: 8, manager_name: 'Example Manager' };
const snapshot = {
  nodes: [branch, unit, { id: 3, name: 'Other GI Unit', level: 'UNIT', parent_id: 9 }],
  managers: [{ id: 8, employee_name: 'Example Manager', email: 'gi@example.test', mobile_no: '+254 0700 000001' }],
  medical_units: [
    { code: 'M1', name: 'Medical Alpha', branch_name: 'Medical Branch', gi_unit_id: 2, mapping_available: true },
    { code: 'M2', name: 'Medical Beta', branch_name: null, gi_unit_id: 2, mapping_available: false },
    { code: 'M3', name: 'Other Medical', gi_unit_id: 3 },
    { code: 'M4', name: 'Removed mapping', gi_unit_id: null },
  ],
};
function render(node = unit) { return output.NodeViewAction({ node, snapshot }); }
let tree = render();
assert(!walk(tree).some(n => n.type === 'Dialog'));
walk(tree).find(n => n.type === 'Button').props.onClick();
tree = render();
for (const value of ['GI Unit Alpha', 'GI Branch', 'Example Manager', '+254 0700 000001',
  'Medical Alpha', 'Medical Beta', 'Operational', 'Setup only']) assert(text(tree).includes(value), value);
assert(!text(tree).includes('Other Medical'));
assert(!text(tree).includes('Removed mapping'));
assert(!walk(tree).some(n => ['Input', 'input', 'select', 'Textarea'].includes(n.type)));
snapshot.medical_units[0].gi_unit_id = 3;
assert(!text(render()).includes('Medical Alpha'), 'Reassigned links must disappear on refreshed snapshot');
snapshot.medical_units[1].gi_unit_id = null;
assert(text(render()).includes('No Medical Units linked.'), 'Explicit empty state after removing all links');
assert(text(render(branch)).includes('GI Unit Alpha'));
assert(!text(render(branch)).includes('Other GI Unit'), 'Branch view must exclude unrelated Units');
walk(tree).filter(n => n.type === 'Button').at(-1).props.onClick();
assert.equal(open, false);
const page = fs.readFileSync(path.join(__dirname, '../src/pages/admin/gi-structure/index.tsx'), 'utf8');
assert(page.includes('<NodeViewAction node={node} snapshot={snapshot} />'));
assert(page.includes('unit.gi_unit_id === node.id'), 'List must use saved GI mapping identity');
console.log('PASS: GI View opens/closes read-only details, displays exact Medical links and reflects reassignment/removal.');
