const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const jsx = (type, props) => ({ type, props });
const flatten = node => !node || typeof node !== 'object' ? [] :
  [node, ...[node.props?.children].flat(Infinity).flatMap(flatten)];
const load = file => {
  const exports = {};
  vm.runInNewContext(compile(fs.readFileSync(path.join(__dirname, '../src/pages/risk', file), 'utf8')), { exports });
  return exports;
};
const access = load('risk-access.ts');
const filters = load('department-filter.ts');
let location = '/risk/review', cursor = 0, states = [], failed = false, mutation;
const rows = [
  { depart_code: 'A', depart_name: 'Department A', period_id: 7, workflow_status: 'SUBMITTED', total_risks: 1 },
  { depart_code: 'B', depart_name: 'Department B', period_id: 7, workflow_status: 'REVIEWED', total_risks: 1 },
];
const options = { actor: { username: 'owner', can_manage: false, owner_departments: ['A', 'B'], champion_departments: [] },
  departments: rows, periods: [{ period_id: 7, status: 'OPEN' }], assignments: [], staff: [] };
const query = data => ({ data: { ok: true, data }, refetch() {}, isLoading: false, isError: false, isFetching: false });
const react = {
  useState(initial) {
    const slot = cursor++;
    if (!(slot in states)) states[slot] = initial;
    return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
  },
  useEffect() {},
  useMemo: fn => fn(),
  useRef: initial => ({ current: initial }),
};
const hooks = new Proxy({}, { get(_, name) {
  if (name === 'useRiskOptions') return () => query(options);
  if (name === 'useRiskRecord') return () => query(undefined);
  if (name === 'useRiskSummary') return (_, scope) => query(rows.filter(row =>
    (!scope.depart_code || scope.depart_code === row.depart_code) && (!scope.period_id || scope.period_id === row.period_id)));
  if (name === 'useRiskWorkflow') return () => ({ isPending: false, mutate(input, callbacks) {
    mutation = input.data;
    if (!failed) rows.find(row => row.depart_code === input.data.depart_code).workflow_status = 'REVIEWED';
    callbacks.onSuccess(failed ? { ok: false, message: 'Review rejected' } : { ok: true, data: {} });
  } });
  return () => query([]);
} });
const ui = new Proxy({
  envelopeData: response => response?.data,
  envelopeError: response => response?.ok === false ? response.message : undefined,
  queryError: () => 'Error', dateLabel: value => value,
}, { get: (target, name) => name in target ? target[name] : name });
const exportsForPage = {};
vm.runInNewContext(compile(fs.readFileSync(path.join(__dirname, '../src/pages/risk/index.tsx'), 'utf8')
  + '\nexport { RiskRegisterWorkspace };'), {
  exports: exportsForPage,
  require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'wouter') return { useLocation: () => [location, next => { location = next; }], useSearch: () => '' };
    if (name === '@/lib/auth-context') return { useAuth: () => ({ user: { username: 'owner' } }) };
    if (name === './use-risk-register') return hooks;
    if (name === './risk-access') return access;
    if (name === './department-filter') return filters;
    if (name === './risk-ui') return ui;
    if (name === './review-link') return { parseReviewLink: () => null, reviewScopeError: () => '', reviewAvailability: () => '' };
    if (name === './department-reviews') return { latestDepartmentReviews: () => [] };
    return new Proxy({ default: name }, { get: (target, key) => key in target ? target[key] : key });
  },
});
const render = () => { cursor = 0; return exportsForPage.RiskRegisterWorkspace(); };
const component = type => flatten(render()).find(node => node.type === type);
component('WorkflowPanel').props.onAction('REVIEW', rows[0]);
assert.equal(mutation.action, 'REVIEW');
assert.equal(mutation.depart_code, 'A');
assert.equal(mutation.period_id, 7);
assert.equal(rows[0].workflow_status, 'REVIEWED');
assert.equal(location, '/risk/summary', 'Only a successful Review forwards to Signoff');
let summary = component('./risk-assessment-summary');
assert.equal(summary.props.mode, 'signoff');
assert.equal(summary.props.department, 'A', 'The reviewed register is selected on arrival');
assert.equal(summary.props.period, '7');
component('SummaryTable').props.onSelect(rows[1]);
summary = component('./risk-assessment-summary');
assert.equal(summary.props.department, 'B', 'Selecting another accessible department changes the summary');
assert.equal(summary.props.period, '7');
assert.equal(component('WorkflowPanel').props.summaries.length, 1);
assert.equal(component('WorkflowPanel').props.summaries[0].depart_code, 'B');
rows[1].period_id = 8;
assert(!component('./risk-assessment-summary'), 'A removed or filtered cycle must not retain its old detailed summary');
location = '/risk/review'; states = []; failed = true;
rows[0].workflow_status = 'SUBMITTED';
component('WorkflowPanel').props.onAction('REVIEW', rows[0]);
assert.equal(location, '/risk/review', 'Rejected Review must not forward to Signoff');
assert.equal(rows[0].workflow_status, 'SUBMITTED');

const workflowExports = {};
vm.runInNewContext(compile(fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-workflow.tsx'), 'utf8')), {
  exports: workflowExports,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === './risk-ui') return ui;
    return {};
  },
});
let selectedRow;
const table = workflowExports.SummaryTable({ rows: [rows[0]], loading: false, error: '', retry() {},
  onSelect: row => { selectedRow = row; }, selectedDepartment: 'A', selectedPeriod: 7 });
const departmentButton = flatten(table).find(node => node.type === 'button' && node.props['aria-pressed'] === true);
assert(departmentButton, 'Department selection is an accessible button with a selected state');
departmentButton.props.onClick();
assert.equal(selectedRow, rows[0], 'The exact department-period row is selected');
console.log('PASS: Review success/error navigation, selected Signoff scope, department switching, stale-cycle suppression, and accessible table selection.');
