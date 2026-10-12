const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-exposure-colors.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject });
for (const [level, color] of [['Extreme', 'rose'], ['Critical', 'rose'], ['High', 'orange'], ['Moderate', 'amber'], ['Medium', 'amber'], ['Low', 'emerald']]) {
  const palette = exportsObject.riskExposureColors(level);
  for (const style of ['row', 'badge', 'edge', 'outline']) assert(palette[style].includes(color), `${level} ${style}`);
}
assert.equal(exportsObject.riskExposureColors(' HIGH ').badge, exportsObject.riskExposureColors('High').badge);
assert(exportsObject.riskExposureColors('Not assessed').badge.includes('muted'));
assert(exportsObject.riskExposureColors('Unclassified').row.includes('muted'));
const orderExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-summary-order.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: orderExports });
const summaryExports = {};
const jsx = (type, props) => ({ type, props });
const records = [
  { risk_code: 'LOW', i_rate: 'Insignificant', l_rate: 'Rare', r_risk_exposure: '2.00', i_risk_exposure: '10.00', is_active: true, assessment_updated: true },
  { risk_code: 'TOP', r_risk_exposure: '40.00', i_risk_exposure: '70.00', i_rate: '100.000000', l_rate: '0.400000', is_active: true, assessment_updated: true },
  { risk_code: 'TIE', i_rate: 'Catastrophic', l_rate: 'Possible', r_risk_exposure: '40.00', i_risk_exposure: '70.00', is_active: true, assessment_updated: true },
  { risk_code: 'UNKNOWN', r_risk_exposure: null, is_active: true, assessment_updated: true },
  { risk_code: 'UNASSESSED', r_risk_exposure: '100', is_active: true, assessment_updated: false },
];
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-assessment-summary.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
  exports: summaryExports,
  require(name) {
    if (name === 'react') return { useState: value => [value, () => {}], useMemo: callback => callback(), useEffect() {} };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === './risk-exposure-colors') return exportsObject;
    if (name === './risk-summary-order') return orderExports;
    if (name === './risk-summary-causes') return { default: 'RiskSummaryCauses' };
    if (name === './use-risk-register') return { useRiskRecords: () => ({ data: { ok: true, data: records } }) };
    if (name === './risk-ui') return { dateLabel: value => value, envelopeData: value => value?.data, envelopeError: () => undefined, Field: 'Field' };
    if (name === './risk-workflow') return { useSubmissionReadiness: () => ({ ready: false, label: 'Checking readiness', query: {}, waiting: true }) };
    if (name === 'lucide-react') return {};
    throw new Error(`Unexpected import: ${name}`);
  },
});
const tree = summaryExports.default({
  summaries: [{ depart_code: 'D', depart_name: 'Department', period_id: 1, workflow_status: 'OPEN', total_risks: 5 }],
  options: { actor: { username: 'tester', can_manage: true, champion_departments: [] }, assignments: [], staff: [], impact_factors: [{ code: 'IMP_01', label: 'Catastrophic', factor: 100 }], likelihood_factors: [{ code: 'LIK_03', label: 'Possible', factor: 0.4 }], control_effectiveness: [], exposure_bands: [
    { risk_type: 'R', level: 'Extreme', minimum: 32.5, maximum: 100 },
    { risk_type: 'R', level: 'Low', minimum: 0, maximum: 5.49 },
  ] },
  department: 'D', period: '1', comments: '', setComments() {}, mutating: false, onSubmit() {}, onSelect() {}, loading: false, error: '', retry() {},
});
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  return node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
}
const rows = nodes(tree).filter(node => node.type === 'tr' && node.props['data-testid']);
assert.equal(rows.map(row => row.props['data-testid']).join(','), 'risk-summary-row-TIE,risk-summary-row-TOP,risk-summary-row-LOW,risk-summary-row-UNKNOWN');
for (const row of rows.slice(0, 2)) {
  assert(row.props.className.includes('outline-rose-400'));
  assert(nodes(row).some(node => node.props?.children === 'Highest risk score'));
}
assert(rows[2].props.className.includes('bg-emerald'));
assert(!rows[2].props.className.includes('outline'));
assert(rows[3].props.className.includes('bg-muted'));
assert(JSON.stringify(rows).includes('Catastrophic'));
assert(JSON.stringify(rows).includes('Possible'), 'Saved decimal formatting must still match approved factor labels');
assert(nodes(tree).some(node => node.props?.['data-testid'] === 'risk-summary-progress' && JSON.stringify(node.props.children).includes('5')));
assert.equal(nodes(tree).filter(node => node.type === 'RiskSummaryCauses').length, 4);
assert(nodes(tree).find(node => node.props?.['data-testid'] === 'button-submit-risk-summary').props.disabled);
console.log('PASS: matrix ranking and exposure palettes retained; highest matrix scores outlined, unsupported ratings neutral, scores sorted and saved summary/readiness intact.');
