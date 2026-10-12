const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-details.tsx'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const exportsObject = {};
const jsx = (type, props) => ({ type, props });
vm.runInNewContext(output, {
  exports: exportsObject,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === './risk-ui') return { dateLabel: value => value, text: value => value ?? '', StatusPill: 'StatusPill' };
    if (name === 'lucide-react' || name === '@/components/ui/sheet') return {};
    throw new Error(`Unexpected dependency: ${name}`);
  },
});
const bands = [
  { risk_type: 'I', level: 'Wrong inherent band', minimum: 0, maximum: 100, description: 'Not residual' },
  { risk_type: 'R', level: 'Low', minimum: 0, maximum: 5.49, description: 'Management to monitor exposure level.' },
  { risk_type: 'R', level: 'Moderate', minimum: 5.5, maximum: 12.49, description: 'Management must reduce exposure.' },
  { risk_type: 'R', level: 'High', minimum: 12.5, maximum: 32.49, description: 'Immediate escalation to Exco.' },
  { risk_type: 'R', level: 'Extreme', minimum: 32.5, maximum: 100, description: 'Escalate to Exco and Board.' },
];
const summary = exportsObject.residualRiskSummary;
for (const [score, level] of [[null, 'Not assessed'], ['', 'Not assessed'], ['bad', 'Not assessed'], ['0', 'Low'], ['5.49', 'Low'], ['5.50', 'Moderate'], ['12.49', 'Moderate'], ['12.50', 'High'], ['32.49', 'High'], ['32.50', 'Extreme'], ['100', 'Extreme'], ['101', 'Unclassified']]) {
  assert.equal(summary(score, bands).label, level);
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join(' ');
  if (node && typeof node === 'object') return text(node.props?.children);
  return node == null || typeof node === 'boolean' ? '' : String(node);
}
function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  return node && typeof node === 'object' ? [node, ...flatten(node.props?.children)] : [];
}
let selected;
const props = {
  records: [{ risk_code: 'TEST', risk_title: 'Test risk', risk_description: 'Description of what could go wrong', depart_name: 'Case Management', category_name: 'Operational', workflow_status: 'OPEN', assessment_updated: false, r_risk_exposure: '32.50', period_from: '2026-04-01', period_to: '2026-06-30' }],
  loading: false, error: '', retry() {}, search: '', setSearch() {},
  title: 'Choose a risk to assess', compact: true, assessmentList: true,
  exposureBands: bands, onSelect: code => { selected = code; },
};
let tree = exportsObject.RecordsTable(props);
const visible = text(tree);
assert(!visible.includes('2026-04-01'));
assert(!visible.includes('2026-06-30'));
assert(!visible.includes('32.50'));
for (const content of ['Description of what could go wrong', 'Extreme', 'Escalate to Exco and Board.', 'Last saved residual risk']) assert(visible.includes(content));
flatten(tree).find(node => node.type === 'button').props.onClick();
assert.equal(selected, 'TEST');
tree = exportsObject.RecordsTable({ ...props, assessmentList: false });
assert(text(tree).includes('2026-04-01'), 'Other risk lists retain dates');
assert(text(tree).includes('32.50'), 'Other risk lists retain numeric scores');
console.log('PASS: assessment list hides dates/scores, shows residual level/guidance and description, preserves selection and other lists; all residual band boundaries checked.');
