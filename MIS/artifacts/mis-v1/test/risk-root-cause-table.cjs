const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-root-cause-table.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
  exports: exported,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name === './risk-ui') return { dateLabel: value => value, StatusPill: 'StatusPill' };
    throw new Error(`Unexpected import: ${name}`);
  },
});
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  return node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
}
const roots = [
  { root_id: 11, root_cause: 'Full first cause\nSecond line of cause', current_contr: 'Existing control\nAnother control', mitigations: 'First mitigation', due_date: '2026-12-01', action_owner: 'owner', action_status: 'Planned' },
  { root_id: 12, root_cause: 'Second full cause', current_contr: null, mitigations: 'Second mitigation', due_date: null, action_owner: 'legacy_owner', action_status: 'Closed' },
];
const before = JSON.stringify(roots);
let selected;
const props = { roots, riskCode: 'RISK-1', staff: [{ username: 'owner', employee_name: 'Test Owner' }], selectedRootId: '11', mutating: false, onSelect: root => { selected = root; } };
const tree = exported.default(props);
const rows = nodes(tree).filter(node => node.type === 'tr' && node.props['data-testid']);
assert.equal(rows.length, 2);
for (const value of ['Full first cause', 'Second line of cause', 'Existing control', 'Another control', 'First mitigation', '2026-12-01', 'Test Owner', 'legacy_owner', 'Planned', 'Closed']) assert(JSON.stringify(tree).includes(value), value);
const headers = nodes(tree).filter(node => node.type === 'th').map(node => node.props.children);
assert.equal(headers.length, 7);
assert(!headers.includes('Root ID'));
assert(!headers.includes('Risk code'));
assert(!JSON.stringify(tree).includes('RISK-1'));
assert(!nodes(tree).some(node => node.type === 'td' && [11, 12].includes(node.props.children)));
assert(rows[0].props.className.includes('bg-primary'));
const buttons = nodes(tree).filter(node => node.type === 'button');
assert.equal(buttons.length, 4, 'Both desktop rows and mobile cards support selection');
for (const button of buttons.filter(node => node.props['aria-label'] === 'Select root cause: Second full cause')) {
  button.props.onClick();
  assert.equal(selected, roots[1], 'Select loads exactly this saved root, never a different risk/cause');
}
assert(nodes(exported.default({ ...props, mutating: true })).filter(node => node.type === 'button').every(node => node.props.disabled));
assert(!nodes(tree).some(node => node.type === 'button' && /delete/i.test(JSON.stringify(node.props))), 'No destructive legacy Delete action');
assert.equal(JSON.stringify(roots), before, 'Rendering and selection preserve saved roots');
assert(JSON.stringify(exported.default({ ...props, roots: [] })).includes('No saved root causes'));
console.log('PASS: root IDs and risk codes hidden; full cause/action details and correct saved-cause selection retained on desktop/mobile.');
