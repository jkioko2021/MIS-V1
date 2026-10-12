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
const readiness = { ready: false, complete: true, waiting: false, query: { refetch() {} } };
const rows = [
  { risk_code: 'SAVED', risk_title: 'Saved risk', assessment_updated: true, can_edit: true, is_active: true, i_rate: 'Major', l_rate: 'Possible', i_risk_exposure: '45', r_risk_exposure: '9' },
  { risk_code: 'PENDING', risk_title: 'Pending risk', assessment_updated: false, is_active: true, r_risk_exposure: '100' },
];
rows[0].ranking_snapshot = {
  impact:{code:'IMP_02',label:'Major',ordinal:4},
  likelihood:{code:'LIK_03',label:'Possible',ordinal:3},
};
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
    if (name === './risk-workflow') return { useSubmissionReadiness: () => readiness };
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
revise().props.onClick({ currentTarget: {} });
assert.equal(selected, 'SAVED', 'Revision reopens the exact saved risk');
assert(!flatten(render()).some(node => node.props?.['data-testid'] === 'risk-summary-row-PENDING'), 'Only saved assessments appear in summary');
assert.equal(text(flatten(render()).find(node => node.props?.['data-testid'] === 'risk-summary-rank-SAVED')), 'High', 'Ranking labels replace position numbers');
assert.equal(text(flatten(render()).find(node => node.props?.['data-testid'] === 'risk-summary-score-SAVED')), '12/ 25');
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
  { risk_code: 'HIGH', risk_title: 'Highest saved risk', assessment_updated: true, is_active: true, i_rate: 'Major', l_rate: 'Certain', r_risk_exposure: '1' },
  { risk_code: 'TIE', risk_title: 'Equal exposure', assessment_updated: true, is_active: true, i_rate: 'Major', l_rate: 'Possible', r_risk_exposure: '99' },
  { risk_code: 'INACTIVE', assessment_updated: true, is_active: false, r_risk_exposure: '99' },
);
for (const [code,impact,likelihood] of [['SAVED',4,3],['HIGH',4,5],['TIE',4,3]]) {
  rows.find(row=>row.risk_code===code).ranking_snapshot = {
    impact:{code:'saved-impact',label:'Saved impact',ordinal:impact},
    likelihood:{code:'saved-likelihood',label:'Saved likelihood',ordinal:likelihood},
  };
}
props.summaries[0].total_risks = 4;
const rankedRows = flatten(render()).filter(node => node.props?.['data-testid']?.startsWith('risk-summary-row-'));
assert.equal(rankedRows.map(node => `${node.props['data-testid']}:${node.props['data-risk-ranking']}`).join(','), 'risk-summary-row-HIGH:Critical,risk-summary-row-SAVED:High,risk-summary-row-TIE:High');
assert.equal(text(flatten(render()).find(node => node.props?.['data-testid'] === 'risk-summary-rank-HIGH')), 'Critical');
rows[0].i_rate = 'Catastrophic';
rows[0].l_rate = 'Certain';
rows[0].ranking_snapshot = {
  impact:{code:'IMP_01',label:'Catastrophic',ordinal:5},
  likelihood:{code:'LIK_01',label:'Certain',ordinal:5},
};
assert.equal(flatten(render()).filter(node => node.props?.['data-testid']?.startsWith('risk-summary-row-'))[0].props['data-testid'], 'risk-summary-row-SAVED', 'Revised saved exposures recompute order and rank');
const ownerWarning = () => flatten(render()).find(node => node.props?.['data-testid'] === 'risk-summary-owner-warning');
const submitButton = () => flatten(render()).find(node => node.props?.['data-testid'] === 'button-submit-risk-summary');
props.comments = 'Ready for owner review';
readiness.ready = true;
assert(!ownerWarning(), 'An active mapped owner does not produce a warning');
assert.equal(submitButton().props.disabled, false, 'An otherwise ready register remains submittable');
props.options.assignments = [];
assert.equal(ownerWarning().props.role, 'alert', 'Missing owner warning is accessible');
assert(text(ownerWarning()).includes('Risk Owner missing'));
assert(text(ownerWarning()).includes('No Risk Owner is mapped to Department.'));
assert(text(ownerWarning()).includes('under Risk administration'));
assert.equal(submitButton().props.disabled, true, 'Missing owner still blocks submission');
readiness.ready = false;
assert(ownerWarning(), 'The owner warning remains visible even when other readiness conditions fail');
props.options.assignments = [{ depart_code: 'D', owner_username: 'owner' }];
props.options.staff = [];
assert(text(ownerWarning()).includes('Risk Owner unavailable'));
assert(text(ownerWarning()).includes('not an active eligible MIS user'));
assert.equal(submitButton().props.disabled, true, 'An inactive mapped owner cannot receive review');
props.options.staff = [{ username: 'owner' }];
readiness.ready = true;
assert(!ownerWarning(), 'Warning disappears when an active owner is provided');
assert.equal(submitButton().props.disabled, false);
props.summaries[0].workflow_status = 'SUBMITTED';
assert(!revise(), 'A submitted register disappears from the assessment summary');
assert(!submitButton(), 'Submitted registers cannot be submitted a second time from the summary');
assert(flatten(render()).some(node => node.props?.description?.includes('Submitted registers leave this summary')));
props.mode = 'review';
props.options.actor.champion_departments = [];
props.options.actor.owner_departments = ['D'];
let reviewTree = render();
assert.equal(requestedScope.access, 'review', 'Review summary uses owner-scoped access, not champion access');
assert.equal(requestedScope.view, 'submitted', 'Only registers awaiting owner review are requested');
assert(text(reviewTree).includes('Submitted risk summary'));
assert.equal(text(flatten(reviewTree).find(node => node.props?.['data-testid'] === 'risk-summary-score-SAVED')), '25/ 25');
assert.equal(text(revise()), 'Review assessment');
assert(!submitButton(), 'Owner review does not expose the champion submission button');
assert(!flatten(reviewTree).some(node => node.props?.['data-testid'] === 'input-risk-summary-comment'));
props.summaries[0].workflow_status = 'REVIEWED';
assert(!revise(), 'Reviewed registers leave the owner review summary');
props.mode = 'signoff';
let signoffTree = render();
assert(text(signoffTree).includes('Reviewed risk summary'), 'Sign-off displays the reviewed risk summary');
assert.equal(requestedScope.access, 'view', 'Sign-off uses existing authorized view access');
assert.equal(requestedScope.view, 'reviewed', 'Sign-off requests reviewed records');
assert.equal(text(revise()), 'View assessment', 'Sign-off does not offer champion revision');
assert(!submitButton(), 'Sign-off does not offer submit for owner review');
assert.equal(text(flatten(signoffTree).find(node => node.props?.['data-testid'] === 'risk-summary-score-SAVED')), '25/ 25', 'Reviewed scores are retained');
props.summaries[0].workflow_status = 'SIGNED_OFF';
assert(revise(), 'Signed-off summary remains available');
assert.equal(requestedScope.view, 'signed', 'Signed-off cycles use signed record scope');
props.summaries[0].workflow_status = 'SUBMITTED';
assert(!revise(), 'Unreviewed registers are excluded from sign-off');
props.summaries[0].workflow_status = 'OPEN';
rows.forEach(row => { row.assessment_updated = false; });
props.mode = 'assessment';
assert(!revise(), 'Returned risks require reassessment before reappearing in the saved summary');
rows[0].assessment_updated = true;
rows[0].risk_status = 'Closed';
assert(revise(), 'Reassessed returned risks reappear in the assessment summary');
assert.equal(requestedScope.view, 'open', 'Summary fetches the complete open workflow, not the pending queue');
assert(revise(), 'Closed-action reassessed risks appear in the saved summary and can be revised');
props.mode = 'signoff';
props.summaries[0].workflow_status = 'REVIEWED';
props.department = 'D';
props.period = '1';
props.selectedRisk = undefined;
assert(revise(), 'Reviewed registers retain their saved risk summary on Signoff');
assert.equal(requestedScope.access, 'view', 'Signoff reads the authorized saved register, not the champion queue');
assert.equal(requestedScope.view, 'reviewed');
assert.equal(requestedScope.depart_code, 'D');
assert.equal(requestedScope.period_id, 1);
assert(text(render()).includes('Status: REVIEWED'));
assert(text(render()).includes('Reviewed risk summary'));
assert.equal(text(revise()), 'View assessment', 'Signoff does not offer assessment edits');
assert(!submitButton(), 'Signoff never offers to submit an already reviewed register again');
props.summaries[0].workflow_status = 'SIGNED_OFF';
assert(revise(), 'Signed-off summaries remain visible without reopening the register');
assert.equal(requestedScope.view, 'signed');
props.summaries[0].workflow_status = 'SUBMITTED';
assert(!revise(), 'Unreviewed registers never enter the sign-off summary');
console.log('PASS: summary ranking/revision, submission and review guards, return/reassessment, and read-only reviewed/signed-off summaries.');
