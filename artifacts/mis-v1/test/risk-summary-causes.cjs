const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-summary-causes.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const jsx = (type, props) => ({ type, props });
function render(expanded, query) {
  const exported = {};
  let requestedCode;
  let toggled;
  vm.runInNewContext(output, {
    exports: exported,
    require(name) {
      if (name === 'react') return { useState: () => [expanded, value => { toggled = value; }] };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === './use-risk-register') return { useRiskRecord: (username, code) => { assert.equal(username, 'actor'); requestedCode = code; return query; } };
      if (name === './risk-ui') return { envelopeData: response => response?.data, envelopeError: response => response?.ok === false ? 'Access denied' : undefined, dateLabel: value => value, queryError: () => 'Request failed', ErrorNotice: 'ErrorNotice', SkeletonRows: 'SkeletonRows' };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const tree = exported.default({ username: 'actor', riskCode: 'R1', staff: [{ username: 'owner', employee_name: 'Test Owner' }] });
  tree.props.onToggle({ currentTarget: { open: true } });
  assert.equal(toggled, true);
  return { tree, requestedCode };
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  return node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
}
const roots = [
  { root_id: 1, root_cause: 'First saved cause', current_contr: 'First control', mitigations: 'First mitigation', due_date: '2026-12-01', action_owner: 'owner', action_status: 'Planned' },
  { root_id: 2, root_cause: 'Second saved cause', current_contr: null, mitigations: 'Second mitigation', action_status: 'In progress' },
];
const before = JSON.stringify(roots);
const query = { data: { ok: true, data: { root_causes: roots } } };
assert.equal(render(false, query).requestedCode, '', 'Collapsed viewers must not fetch risk details');
const result = render(true, query);
assert.equal(result.requestedCode, 'R1');
assert.equal(nodes(result.tree).filter(node => node.type === 'article').length, 2);
const text = JSON.stringify(result.tree);
for (const value of ['First saved cause', 'Second saved cause', 'First mitigation', 'Second mitigation', 'Test Owner', '2026-12-01', 'Planned', 'In progress']) assert(text.includes(value), value);
assert.equal(JSON.stringify(roots), before);
assert(JSON.stringify(render(true, { data: { ok: true, data: { root_causes: [] } } }).tree).includes('No root causes saved'));
assert(nodes(render(true, { data: { ok: false } }).tree).some(node => node.type === 'ErrorNotice'));
assert(nodes(render(true, { isLoading: true }).tree).some(node => node.type === 'SkeletonRows'));
console.log('PASS: root-cause viewer loads lazily, displays every saved cause/action, preserves data and handles loading, empty and denied states.');
