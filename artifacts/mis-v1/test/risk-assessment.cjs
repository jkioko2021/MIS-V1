// Exercise the real component handlers without a browser or database writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const slots = [];
let cursor = 0;
let effects = [];
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], value => { slots[index] = value; }];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial };
    return slots[index];
  },
  useEffect(callback, deps) {
    const index = cursor++;
    if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) {
      slots[index] = deps;
      effects.push(callback);
    }
  },
};
const jsx = (type, props) => ({ type, props });
const ui = Object.fromEntries(['Exposure', 'Field', 'EmptyState', 'SkeletonRows', 'StatusPill'].map(name => [name, name]));
Object.assign(ui, { text: value => value ?? '', dateLabel: value => value, fieldClass: '', buttonClass: '', secondaryButton: '' });
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-forms.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, {
  exports: exportsObject,
  window: { requestAnimationFrame: callback => callback() },
  document: { getElementById: () => ({ focus() {} }) },
  require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === './risk-ui') return ui;
    if (name === './use-risk-register') return {};
    if (name === './risk-root-cause-table') return { default: 'RiskRootCauseTable' };
    if (name === 'lucide-react') return {};
    throw new Error(`Unexpected dependency: ${name}`);
  },
});
let payload;
let saveSucceeds = true;
const props = {
  risk: { risk_code: 'TEST', depart_code: 'D', period_id: 1, can_edit: true, workflow_status: 'OPEN', i_rate: '70', l_rate: '0.65', perceived_contr_eff: '80', current_contr: 'Legacy assessment controls retained', desired_contr_effe: 'Original desired-control notes', objective_code: 'OBJ', risk_category: 'CAT', risk_title: 'Risk', risk_description: 'Description', risk_consequence: 'Consequence', updated_at: 'initial' },
  roots: [{ root_id: 11, root_cause: 'Existing cause', mitigations: 'Existing mitigation', due_date: '2026-12-01', action_owner: 'owner', action_status: 'Planned' }],
  staff: [{ username: 'owner' }], objectives: [{ obj_code: 'OBJ', depart_code: 'D' }], categories: [{ category_code: 'CAT' }],
  actionStatuses: [{ code: 'AC_02', status: 'Planned' }],
  impactFactors: [{ code: 'IMP_02', label: 'Major', factor: 70 }],
  likelihoodFactors: [{ code: 'LIK_02', label: 'Likely', factor: 0.65, criteria: 'More than an even chance' }],
  controlRatings: [{ eff_factor: 'Good', rating: 0.8, qual_criteria: 'Controlled' }],
  exposureBands: [], loading: false, mutating: false,
  onSave: data => { payload = data; },
  onCause: async data => { payload = data; return saveSucceeds; },
};
function render() {
  cursor = 0;
  let tree = exportsObject.AssessmentPanel(props);
  if (effects.length) {
    const queued = effects; effects = []; queued.forEach(effect => effect());
    cursor = 0; tree = exportsObject.AssessmentPanel(props);
  }
  return tree;
}
function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (!node || typeof node !== 'object') return [];
  return [node, ...flatten(node.props?.children)];
}
function find(predicate) { return flatten(render()).find(predicate); }
function button(label) { return find(node => node.type === 'button' && flattenText(node.props.children).includes(label)); }
function flattenText(node) {
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (node && typeof node === 'object') return flattenText(node.props?.children);
  return node == null ? '' : String(node);
}
function field(label) { return flatten(find(node => node.type === 'Field' && node.props.label === label)).find(node => ['textarea', 'input', 'select'].includes(node.type)); }
function fillRoot() {
  for (const [label, value] of Object.entries({ 'Root cause': 'Second cause', Mitigations: 'Second mitigation', 'Due date': '2026-12-02', 'Action owner (MIS username)': 'owner', 'Action status': 'Planned' })) {
    field(label).props.onChange({ target: { value } });
  }
}
async function main() {
  const nodes = flatten(render());
  const tab = label => find(node => node.props?.role === 'tab' && flattenText(node) === label);
  assert.equal(tab('Risk Details').props['aria-selected'], true, 'Risk Details is the first/default tab');
  assert.equal(tab('Root causes & action plans').props['aria-selected'], false);
  assert.equal(tab('Risk exposures').props['aria-selected'], false);
  assert.deepEqual(nodes.filter(node => node.props?.role === 'tab').map(flattenText), ['Risk Details', 'Root causes & action plans', 'Risk exposures']);
  const detailsPanel = () => find(node => node.props?.id === 'risk-panel-details');
  const detailLabels = ['Risk title', 'Department objective', 'Risk category', 'Risk description', 'Consequences'];
  assert.deepEqual(flatten(detailsPanel()).filter(node => node.type === 'Field').map(node => node.props.label), detailLabels);
  assert.equal(detailsPanel().props.hidden, false);
  field('Risk title').props.onChange({ target: { value: 'Updated risk title' } });
  field('Risk description').props.onChange({ target: { value: 'Updated description' } });
  field('Consequences').props.onChange({ target: { value: 'Updated consequences' } });
  button('Continue to Root causes & action plans').props.onClick();
  assert.equal(tab('Root causes & action plans').props['aria-selected'], true);
  assert.equal(detailsPanel().props.hidden, true);
  field('Root cause').props.onChange({ target: { value: 'Draft kept across tabs' } });
  tab('Risk exposures').props.onClick();
  assert.equal(tab('Risk exposures').props['aria-selected'], true);
  assert.equal(find(node => node.props?.id === 'risk-panel-causes').props.hidden, true);
  tab('Root causes & action plans').props.onClick();
  assert.equal(field('Root cause').props.value, 'Draft kept across tabs', 'Switching tabs keeps an unsaved root draft');
  tab('Root causes & action plans').props.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(tab('Risk exposures').props['aria-selected'], true, 'Keyboard navigation changes tabs');
  const assessmentForm = () => find(node => node.type === 'form' && flattenText(node).includes('Assessment & controls'));
  assert(!flatten(assessmentForm()).some(node => node.type === 'Field' && detailLabels.includes(node.props.label)), 'Risk details appear only in the first tab');
  tab('Risk exposures').props.onKeyDown({ key: 'Home', preventDefault() {} });
  assert.equal(tab('Risk Details').props['aria-selected'], true, 'Home selects the first tab');
  assert.equal(field('Risk title').props.value, 'Updated risk title', 'Details retain drafts across tabs');
  tab('Risk Details').props.onKeyDown({ key: 'End', preventDefault() {} });
  assert.equal(tab('Risk exposures').props['aria-selected'], true, 'End selects the last tab');
  assert.equal(assessmentForm().props.noValidate, true, 'Required-field errors are handled visibly in the assessment form');
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload, undefined, 'Blank comments must not submit an assessment');
  assert(flattenText(assessmentForm()).includes('Enter an assessment comment before saving.'));
  assert.equal(nodes.filter(node => node.type === 'input' && node.props.type === 'number').length, 0);
  for (const label of ['Major', 'Likely', 'Good']) assert(nodes.some(node => node.type === 'option' && node.props.children === label));
  const sections = nodes.filter(node => node.type === 'fieldset');
  assert.equal(sections.length, 2);
  assert(flattenText(sections[0]).includes('Inherent Risk Exposures'));
  assert(flattenText(sections[1]).includes('Residual Risk Exposures'));
  assert(flatten(sections[0]).some(node => node.type === 'Field' && node.props.label === 'Impact factor'));
  assert(!flatten(sections[0]).some(node => node.type === 'Field' && node.props.label.includes('control')));
  assert.equal(flatten(sections[1]).filter(node => node.type === 'select').length, 2);
  assert.equal(field('Desired control effectiveness').type, 'select');
  field('Assessment comment (required)').props.onChange({ target: { value: 'Testing' } });
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload.i_rate, 70);
  assert.equal(payload.l_rate, 0.65);
  assert.equal(payload.control_effectiveness, 0.8);
  assert.equal(payload.risk_impact, undefined, 'Ordinary saves do not reselect factors');
  assert.equal(payload.risk_likelihood, undefined);
  assert.equal(payload.reassess_ranking, false);
  field('Impact factor').props.onChange({target:{value:'IMP_02'}});
  field('Likelihood factor').props.onChange({target:{value:'LIK_02'}});
  const refreshRanking = flatten(render()).find(node=>node.type==='input' && node.props.type==='checkbox');
  refreshRanking.props.onChange({target:{checked:true}});
  await assessmentForm().props.onSubmit({preventDefault(){}});
  assert.equal(payload.risk_impact,'IMP_02');
  assert.equal(payload.risk_likelihood,'LIK_02');
  assert.equal(payload.reassess_ranking,true,'Explicit refresh travels to the server');
  assert.equal(payload.risk_title, 'Updated risk title', 'Save Assessment includes Risk Details edits');
  assert.equal(payload.risk_description, 'Updated description');
  assert.equal(payload.risk_consequence, 'Updated consequences');
  field('Risk title').props.onChange({ target: { value: '' } });
  payload = undefined;
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload, undefined, 'Incomplete Risk Details must not save');
  assert.equal(tab('Risk Details').props['aria-selected'], true, 'Missing details bring the user to the field that needs fixing');
  assert(flattenText(detailsPanel()).includes('in Risk Details before saving'));
  field('Risk title').props.onChange({ target: { value: 'Updated risk title' } });
  tab('Risk exposures').props.onClick();
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload.current_contr, 'Legacy assessment controls retained', 'Removing the exposure control field must not erase historical data');
  assert.equal(flatten(render()).filter(node => node.type === 'Field' && node.props.label === 'Current controls').length, 1, 'Current controls is shown only on the root-cause form');
  assert.equal(payload.desired_contr_effe, 'Original desired-control notes');
  field('Desired control effectiveness').props.onChange({ target: { value: 'Good' } });
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload.desired_contr_effe, 'Good');
  assert.equal(payload.control_effectiveness, 0.8);
  find(node => node.type === 'RiskRootCauseTable').props.onSelect(props.roots[0]);
  assert.equal(field('Root cause').props.value, 'Existing cause');
  assert.equal(field('Current controls').type, 'textarea');
  let rootForm = () => find(node => node.type === 'form' && flattenText(node).includes('Root causes & action plans'));
  assert.deepEqual(flatten(rootForm()).filter(node => node.type === 'button' && ['Update root cause', 'Continue to Risk exposures'].includes(flattenText(node))).map(flattenText), ['Update root cause', 'Continue to Risk exposures'], 'Save/update appears before Continue');
  await rootForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload.root_id, 11);
  find(node => node.type === 'RiskRootCauseTable').props.onSelect(props.roots[0]);
  button('Add another root cause').props.onClick();
  assert.equal(field('Root cause').props.value, '');
  fillRoot();
  saveSucceeds = false;
  await rootForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload.root_id, undefined);
  assert.equal(field('Root cause').props.value, 'Second cause', 'Failed saves retain the draft');
  saveSucceeds = true;
  await rootForm().props.onSubmit({ preventDefault() {} });
  assert.equal(field('Root cause').props.value, '', 'Successful saves prepare another cause');
  assert.equal(props.roots[0].root_cause, 'Existing cause', 'Existing cause remains unchanged');
  props.risk = { ...props.risk, updated_at: 'new', i_rate: '42', l_rate: '0.3', perceived_contr_eff: '17' };
  render();
  assert.equal(field('Impact factor').props.value, 'historical');
  assert.equal(field('Likelihood factor').props.value, 'historical');
  assert.equal(field('Perceived control effectiveness').props.value, 'historical');
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload.i_rate, 42);
  assert.equal(payload.l_rate, 0.3);
  assert.equal(payload.control_effectiveness, 0.17);
  props.onSave = async () => 'This record has changed. Reload before saving.';
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert(flattenText(assessmentForm()).includes('This record has changed. Reload before saving.'));
  assert(!flattenText(assessmentForm()).includes('Assessment saved successfully.'));
  assert.equal(field('Assessment comment (required)').props.value, 'Testing', 'API failures preserve entered comments');
  props.onSave = async () => { throw new Error('Network failure'); };
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert(flattenText(assessmentForm()).includes('Your entries are retained'));
  props.onSave = async data => { payload = data; };
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert(flattenText(assessmentForm()).includes('Assessment saved successfully.'));
  assert(!flattenText(assessmentForm()).includes('Your entries are retained'));
  const savedRoots = props.roots;
  props.roots = [];
  tab('Root causes & action plans').props.onClick();
  assert.equal(tab('Risk exposures').props['aria-disabled'], 'true');
  tab('Risk exposures').props.onClick();
  assert.equal(tab('Root causes & action plans').props['aria-selected'], true, 'Rootless editable risk cannot enter assessment');
  payload = undefined;
  await assessmentForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payload, undefined, 'Handler also blocks assessment before a root cause is persisted');
  props.risk = { ...props.risk, can_edit: false };
  assert(detailLabels.every(label => field(label).props.disabled === true), 'Risk Details respects read-only permission');
  tab('Risk exposures').props.onClick();
  assert.equal(tab('Risk exposures').props['aria-selected'], true, 'Read-only users can view exposures without roots');
  props.roots = savedRoots;
  props.risk = { ...props.risk, risk_code: 'OTHER', can_edit: true };
  render();
  assert.equal(tab('Risk Details').props['aria-selected'], true, 'Changing risk restarts at Risk Details');
  assert.equal(field('Risk title').props.value, props.risk.risk_title, 'New risk loads its own details');
  console.log('PASS: separate inherent/residual sections and label-only dropdowns preserve calculations and historical desired-control notes; root causes support edit/add, failed-save retention and successful reset.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
