const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
let cursor = 0;
const state = [];
const effectDeps = [];
let effects = [];
let selected;
let requestedScope;
const rows = [
  { risk_code: 'SAVED', risk_title: 'Saved risk', assessment_updated: true, can_edit: true, is_active: true, i_risk_exposure: '45', r_risk_exposure: '9' },
  { risk_code: 'PENDING', risk_title: 'Pending risk', assessment_updated: false, is_active: true, r_risk_exposure: '100' },
];
const react = {
  useState(initial) {
    const slot = cursor++;
    if (!(slot in state)) state[slot] = initial;
    return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
  },
  useMemo(fn) { return fn(); },
  useEffect(fn, deps) {
    const slot = cursor++;
    if (!effectDeps[slot] || deps.some((value, i) => value !== effectDeps[slot][i])) {
      effectDeps[slot] = deps;
      effects.push(fn);
    }
  },
};
const props = {
  summaries: [{ depart_code: 'D', depart_name: 'Department', period_id: 1, workflow_status: 'OPEN', total_risks: 2 }],
  options: { actor: { username: 'champion', champion_departments: ['D'] }, assignments: [{ depart_code: 'D', owner_username: 'owner' }], staff: [{ username: 'owner' }], impact_factors: [], likelihood_factors: [], control_effectiveness: [], exposure_bands: [] },
  department: '', period: '', selectedRisk: { depart_code: 'D', period_id: 1, risk_code: 'SAVED' },
  comments: '', setComments() {}, mutating: false, onSubmit() {}, onSelect(code) { selected = code; }, loading: false, error: '', retry() {},
};
const exported = {};
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-assessment-summary.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const ordering = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-summary-order.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: ordering });
vm.runInNewContext(compiled, {
  exports: exported,
  require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'lucide-react') return {};
    if (name === './risk-ui') return { Field: 'Field', EmptyState: 'EmptyState', SkeletonRows: 'SkeletonRows', envelopeData: response => response?.data, envelopeError: () => undefined, dateLabel: x => x, fieldClass: '' };
    if (name === './use-risk-register') return { useRiskRecords(username, params) { requestedScope = params; return { data: { data: rows } }; } };
    if (name === './risk-workflow') return { useSubmissionReadiness: () => ({ ready: false, complete: true, waiting: false, query: { refetch() {} } }) };
    if (name === './risk-summary-order') return ordering;
    if (name === './risk-exposure-colors') return { riskExposureColors: () => ({}) };
    if (name === './risk-summary-causes') return { default: 'RiskSummaryCauses' };
    throw new Error(`Unexpected dependency ${name}`);
  },
});
function render() {
  cursor = 0;
  let tree = exported.default(props);
  if (effects.length) {
    const queued = effects; effects = []; queued.forEach(fn => fn());
    cursor = 0; tree = exported.default(props);
  }
  return tree;
}
function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  return node && typeof node === 'object' ? [node, ...flatten(node.props?.children)] : [];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  return node && typeof node === 'object' ? text(node.props?.children) : String(node ?? '');
}
const revise = () => flatten(render()).find(node => node.props?.['data-testid'] === 'revise-summary-risk-SAVED');
assert.equal(text(revise()), 'Revise assessment');
revise().props.onClick();
assert.equal(selected, 'SAVED', 'Revision reopens the exact saved risk');
assert(!flatten(render()).some(node => node.props?.['data-testid'] === 'risk-summary-row-PENDING'), 'Only saved assessments appear in summary');
assert.equal(text(flatten(render()).find(node => node.props?.['data-testid'] === 'risk-summary-rank-SAVED')), '1', 'Unassessed higher exposures must not affect saved-summary ranks');
props.selectedRisk = undefined;
assert(revise(), 'Clearing the editor after save retains the summary');
assert.equal(requestedScope.depart_code, 'D');
assert.equal(requestedScope.period_id, 1);
props.mutating = true;
assert.equal(revise().props.disabled, true, 'Do not start revision during a save');
props.mutating = false;
rows[0].can_edit = false;
assert.equal(text(revise()), 'View assessment', 'Read-only users are not offered revision');
rows.push(
  { risk_code: 'HIGH', risk_title: 'Highest saved risk', assessment_updated: true, is_active: true, r_risk_exposure: '40' },
  { risk_code: 'TIE', risk_title: 'Equal exposure', assessment_updated: true, is_active: true, r_risk_exposure: '9.00' },
  { risk_code: 'INACTIVE', assessment_updated: true, is_active: false, r_risk_exposure: '99' },
);
props.summaries[0].total_risks = 4;
const rankedRows = flatten(render()).filter(node => node.props?.['data-testid']?.startsWith('risk-summary-row-'));
assert.equal(rankedRows.map(node => `${node.props['data-testid']}:${node.props['data-risk-ranking']}`).join(','), 'risk-summary-row-HIGH:1,risk-summary-row-SAVED:2,risk-summary-row-TIE:2');
assert.equal(text(flatten(render()).find(node => node.props?.['data-testid'] === 'risk-summary-rank-HIGH')), '1');
rows[0].r_risk_exposure = '50';
assert.equal(flatten(render()).filter(node => node.props?.['data-testid']?.startsWith('risk-summary-row-'))[0].props['data-testid'], 'risk-summary-row-SAVED', 'Revised saved exposures recompute order and rank');
console.log('PASS: displayed ranks and saved-only ordering recompute after revisions, pending/inactive risks excluded, revision and cycle/permission guards retained.');
