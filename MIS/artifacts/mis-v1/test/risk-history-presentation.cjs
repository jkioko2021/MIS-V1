const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const root = path.join(__dirname, '../src/pages/risk');
const jsx = (type, props) => ({ type, props });
let selectedTab;
let focusedTab;
function load(file) {
  const output = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports: output,
    window: { requestAnimationFrame: callback => callback() },
    document: { getElementById: id => ({ focus() { focusedTab = id; } }) },
    require(name) {
      if (name === 'react') return { useState: value => [value, next => { selectedTab = next; }] };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (name === './risk-exposure-colors') return { riskExposureColors: () => ({ badge: 'badge', edge: 'edge' }) };
      if (name === './risk-summary-order') {
        const ranking = {};
        vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'risk-summary-order.ts'), 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText, { exports: ranking });
        return ranking;
      }
      if (name === './risk-ui') return new Proxy({
        dateLabel: value => value ?? '—', text: value => String(value ?? '—'),
      }, { get: (target, key) => target[key] ?? key });
      return new Proxy({}, { get: (_, key) => key });
    },
  });
  return output.default;
}
function expand(node) {
  if (Array.isArray(node)) return node.map(expand);
  if (!node || typeof node !== 'object') return node;
  if (typeof node.type === 'function') return expand(node.type(node.props));
  return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
}
function flatten(node) {
  return Array.isArray(node) ? node.flatMap(flatten)
    : node && typeof node === 'object' ? [node, ...flatten(node.props?.children)] : [];
}
const Details = load('risk-history-details.tsx');
const props = {
  riskCode: 'R1', loading: false, error: '', onClose() {},
  options: {
    objectives: [{ obj_code: 'O1', depart_code: 'A', obj_name: 'Saved departmental objective' }],
    categories: [], staff: [], control_effectiveness: [], exposure_bands: [],
  },
  risk: {
    risk_code: 'R1', depart_code: 'A', risk_title: 'Saved risk', objective_code: 'O1',
    workflow_status: 'CLOSED', assessment_updated: true,
    ranking_snapshot: { impact: { label: 'Saved impact', ordinal: 5 }, likelihood: { label: 'Saved likelihood', ordinal: 5 } },
    i_risk_exposure: '90', r_risk_exposure: '40', current_contr: 'Global control should not appear',
  },
  roots: [
    { root_id: 1, root_cause: 'Closed cause', mitigations: 'Retained action', action_status: 'Closed', due_date: '1990-01-01' },
    { root_id: 2, root_cause: 'Active cause', current_contr: 'Root-specific control', action_status: 'Planned', due_date: '1990-01-01' },
  ],
};
const details = expand(Details(props));
const nodes = flatten(details);
const serialized = JSON.stringify(details);
assert.equal(details.props['data-testid'], 'inline-risk-record-details');
assert.deepEqual(nodes.filter(node => node.props.role === 'tab').map(node => node.props.children),
  ['Risk Details', 'Root causes & action plans', 'Risk exposures']);
assert.equal(nodes.filter(node => node.props.role === 'tabpanel').length, 3);
assert(!nodes.some(node => ['input', 'textarea', 'select', 'form'].includes(node.type) || node.props.role === 'dialog'));
assert(serialized.includes('Saved departmental objective'));
assert(serialized.includes('Saved impact'));
assert(serialized.includes('Saved likelihood'));
assert(serialized.includes('25 / 25'));
assert(JSON.stringify(expand(Details({ ...props, risk: { ...props.risk, ranking_snapshot: null } }))).includes('Saved matrix factors unavailable'));
assert(serialized.includes('Retained action'));
assert(serialized.includes('Root-specific control'));
assert(!nodes.some(node => node.type === 'dd' && node.props.children === 'Global control should not appear'));
assert(!/event history|event trail/i.test(serialized));
const closedCause = nodes.find(node => node.props['data-testid'] === 'history-root-cause-1');
assert(!JSON.stringify(closedCause).includes('Due date has passed'));
assert(JSON.stringify(nodes.find(node => node.props['data-testid'] === 'history-root-cause-2')).includes('Due date has passed'));
nodes.find(node => node.props.role === 'tab').props.onKeyDown({ key: 'End', preventDefault() {} });
assert.equal(selectedTab, 'exposures');
assert.equal(focusedTab, 'risk-history-tab-exposures');
assert(JSON.stringify(expand(Details({ ...props, loading: true }))).includes('SkeletonRows'));
assert(JSON.stringify(expand(Details({ ...props, error: 'Not authorized' }))).includes('Not authorized'));
const Priorities = load('risk-history-priorities.tsx');
const risk = (code, score, ranking = 'Critical') => ({
  risk_code: code, risk_title: code, depart_code: 'A', risk_score: score, risk_ranking: ranking,
  open_actions: 2, behind_schedule_actions: 1, overdue_actions: 1,
});
let chosen;
const priorities = expand(Priorities({
  data: { population: 'open', top_ten_departments: [
    { depart_code: 'A', risks: [...Array.from({ length: 6 }, (_, i) => risk(`C${i}`, 15 + i)), risk('High', 14, 'High'), risk('Unranked', null, null)] },
    { depart_code: 'B', risks: [risk('Other department private risk', 25)] },
  ] },
  departments: [{ depart_code: 'A', depart_name: 'Dept A' }, { depart_code: 'C', depart_name: 'Dept C' }],
  loading: false, error: '', retry() {}, onSelect: code => { chosen = code; },
}));
const priorityButtons = flatten(priorities).filter(node => String(node.props['data-testid']).startsWith('select-history-priority-'));
assert.deepEqual(priorityButtons.map(node => node.props['data-testid']),
  ['C5', 'C4', 'C3', 'C2', 'C1'].map(code => `select-history-priority-${code}`));
priorityButtons[0].props.onClick();
assert.equal(chosen, 'C5');
assert(!JSON.stringify(priorities).includes('Other department private risk'));
assert(JSON.stringify(priorities).includes('No open Critical risks in this department'));
const workspace = fs.readFileSync(path.join(root, 'index.tsx'), 'utf8');
assert(!workspace.includes('HistoryTable'));
assert(!workspace.includes('useRiskHistory'));
assert.match(workspace, /historyPrioritiesQuery = useRiskAnalytics[\s\S]*?population: 'open'/);
assert.match(workspace, /departments=\{departments.filter\(item => !department \|\| item.depart_code === department\)\}/);
console.log('PASS: read-only Update-style tabs, saved assessment values, root actions, no event history, top-five Critical priorities, authorization scope and keyboard navigation.');
