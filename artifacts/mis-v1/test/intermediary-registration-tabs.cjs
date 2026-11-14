const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const jsx = (type, props, key) => ({ type, props: props || {}, key });
const walk = node => {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  return [node, ...walk(node.props?.children)];
};
const text = node => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  if (Array.isArray(node)) return node.map(text).join(' ');
  return text(node.props?.children);
};
let mutations = 0;
const mutation = { isPending: false, mutate() { mutations++; } };
const api = new Proxy({}, { get: () => () => mutation });
const components = new Proxy({
  intermediaryInputFrom: agent => ({ ...agent, notes: '' }),
}, { get: (target, key) => target[key] || String(key) });

const styles = fs.readFileSync(path.join(__dirname, '../src/pages/intermediary/intermediary.css'), 'utf8');
const workflowLayouts = [...styles.matchAll(/\.im-registration\s*\{([^}]+)\}/g)]
  .map(match => match[1].match(/grid-template-columns:\s*([^;]+)/)?.[1]?.trim())
  .filter(Boolean);
assert(workflowLayouts.length > 0, 'The registration workflow has an explicit full-width layout');
for (const columns of workflowLayouts) {
  assert.match(columns, /^minmax\(0,\s*1fr\)$/, 'Registration uses one full-width column at all breakpoints');
}

function mount(file, exportName, initialProps) {
  let cursor = 0;
  let pendingEffects = [];
  let props = initialProps;
  const hooks = [];
  const deps = [];
  const react = {
    useState(initial) {
      const slot = cursor++;
      if (!(slot in hooks)) hooks[slot] = typeof initial === 'function' ? initial() : initial;
      return [hooks[slot], next => { hooks[slot] = typeof next === 'function' ? next(hooks[slot]) : next; }];
    },
    useRef(initial) {
      const slot = cursor++;
      if (!(slot in hooks)) hooks[slot] = { current: initial };
      return hooks[slot];
    },
    useEffect(effect, values) {
      const slot = cursor++;
      if (!deps[slot] || values.some((value, i) => value !== deps[slot][i])) {
        deps[slot] = values;
        pendingEffects.push(effect);
      }
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/pages/intermediary', file), 'utf8')
    .replaceAll('import.meta.env.BASE_URL', '"/"');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, Date, console, requestAnimationFrame: fn => fn(),
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (name === '@workspace/api-client-react') return api;
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => `Icon:${String(key)}` });
      if (name === 'wouter') return { Link: 'Link' };
      if (name === './form-components') return components;
      if (name === './registration-support') return { RegistrationSupport: 'RegistrationSupport', EmptyRegistrationSupport: 'EmptyRegistrationSupport' };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    render(update = {}) {
      props = { ...props, ...update };
      let node;
      for (let pass = 0; pass < 5; pass++) {
        cursor = 0;
        node = exports[exportName](props);
        if (!pendingEffects.length) return node;
        const effects = pendingEffects;
        pendingEffects = [];
        effects.forEach(effect => effect());
      }
      throw new Error('Effects did not settle');
    },
  };
}

const agent = {
  agent_code: 'QA_TABS', agent_name: 'Synthetic Agent', agent_type: 'INDEPENDENT',
  source_ref: 'QA_APP', registration_status: 'PENDING', version: 2,
  agent_status: 'DRAFT', email: 'saved@example.test', unit_code: 'QA_UNIT',
  region_code: 'QA_REGION', receive_date: '2026-11-01', contract_date: '2026-11-01', mobile_no: '0700000000',
};
const detail = { agent, licences: [], directors: [], documents: [], events: [], mappings: [] };
const emptyPage = mount('agent-registration.tsx', 'AgentRegistration', {
  code: '', username: 'synthetic', detailLoading: false,
  options: { import_available: false, agent_types: ['INDEPENDENT'] },
  pendingList: { data: { items: [], total: 0 }, refetch: async () => {} },
  search: '', searchBy: 'all', pageNo: 1, setPage() {}, setSearch() {}, setSearchBy() {},
  onSelect() {}, onInvalidate: async () => {}, onReload: async () => undefined, onNavigate() {},
});
let emptyTree = emptyPage.render();
walk(emptyTree).filter(node => node.props.role === 'tab')[1].props.onClick();
emptyTree = emptyPage.render();
const emptyPanel = walk(emptyTree).find(node => node.props.id === 'registration-panel-2');
assert.equal(emptyPanel.props.hidden, false);
const emptyMessage = walk(emptyPanel).find(node => node.props.className === 'im-empty');
assert(!walk(emptyMessage).some(node => node.type?.name === 'RegistrationProfileFields'),
  'The no-selection form must not inherit the empty-state icon dimensions');
const emptyProfile = walk(emptyPanel).find(node => node.type?.name === 'RegistrationProfileFields');
assert(emptyProfile, 'All profile sections remain mounted without a selected agent');
assert.equal(emptyProfile.props.disabled, true);
const emptyFields = walk(emptyProfile.type(emptyProfile.props));
for (const label of ['App Number', 'Receive Date', 'Agent No', 'Intermediary Name', 'Agent Type',
  'Region Name', 'Sales Manager', 'GI Manager', 'PIN', 'ID / Reg No', 'Contract Date', 'Payroll No',
  'Pri Mobile No', 'Sec Mobile No', 'Email', 'Commission Rate (%)']) {
  assert(emptyFields.some(node => node.props.label === label), `Step 02 retains ${label}`);
}
assert.match(text(emptyProfile.type(emptyProfile.props)), /Pay Frequency/);
assert.match(text(emptyProfile.type(emptyProfile.props)), /eTIMS Integrated/);
let refreshes = 0;
let pickedCode = '';
const importedAgents = Array.from({ length: 8 }, (_, i) => ({
  ...agent, agent_code: `QA_IMPORTED_${i}`, agent_name: `Imported Agent ${i}`,
}));
const importedTree = emptyPage.render({
  pendingList: { data: { items: importedAgents, total: 8 }, isFetching: false,
    refetch: async () => { refreshes++; } },
  onSelect: code => { pickedCode = code; },
});
const importedRows = walk(importedTree).filter(node =>
  node.props['data-testid']?.startsWith('button-pending-agent-'));
assert.equal(importedRows.length, 8, 'All eight imported uncoded agents render in the panel');
assert.match(text(importedTree), /CODED 0/);
importedRows[0].props.onClick();
assert.equal(pickedCode, 'QA_IMPORTED_0', 'Selecting an imported agent opens its registration');
walk(importedTree).find(node => node.props.testId === 'button-refresh-imported-agents').props.onClick();
assert.equal(refreshes, 1, 'Refresh reloads the pending list without invoking the source import');
const refreshingTree = emptyPage.render({
  pendingList: { data: { items: importedAgents, total: 8 }, isFetching: true, refetch: async () => {} },
});
assert.equal(walk(refreshingTree).find(node =>
  node.props.testId === 'button-refresh-imported-agents').props.disabled, true);
const indexSource = fs.readFileSync(path.join(__dirname, '../src/pages/intermediary/index.tsx'), 'utf8');
assert.match(indexSource, /refetchInterval:\s*page\.path === '\/intermediary\/registration' \? 15_000 : false/);
assert.match(indexSource, /status:\s*page\.path === '\/intermediary\/registration' \? undefined : statusFilter/);
assert.match(indexSource, /agent_type:\s*page\.path === '\/intermediary\/registration' \? undefined : typeFilter/);
const page = mount('agent-registration.tsx', 'AgentRegistration', {
  code: agent.agent_code, username: 'synthetic', detail, detailLoading: false,
  options: { import_available: false, import_reason: 'SQL deferred', agent_types: ['INDEPENDENT'] },
  pendingList: { data: { items: [agent], total: 1 }, refetch: async () => {} },
  search: '', searchBy: 'all', pageNo: 1, setPage() {}, setSearch() {}, setSearchBy() {},
  onSelect() {}, onInvalidate: async () => {}, onReload: async () => detail, onNavigate() {},
});
let tree = page.render();
const tabs = () => walk(tree).filter(node => node.props.role === 'tab');
const go = index => { tabs()[index].props.onClick(); tree = page.render(); };
const profile = () => walk(tree).find(node => typeof node.type === 'function' && node.type.name === 'RegistrationProfileFields');
assert.equal(tabs().length, 5);
assert.equal(tabs()[1].props['aria-selected'], true, 'A selected pending identity opens Agent Details');
profile().props.onChange({ ...profile().props.value, email: 'draft@example.test' });
tree = page.render();
for (const step of [2, 3, 4, 0, 1]) {
  go(step);
  assert.equal(profile().props.value.email, 'draft@example.test', 'Navigation retains the profile draft');
  const support = walk(tree).filter(node => node.type === 'RegistrationSupport');
  assert.equal(support.length, 1, 'Only one support workspace is mounted');
  assert.equal(support[0].key, agent.agent_code, 'Support identity does not change with the active tab');
  const ids = walk(tree).map(node => node.props.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, 'Panel/tab IDs remain unique on every step');
  for (const tab of tabs()) assert(ids.includes(tab.props['aria-controls']), 'Every tab controls an existing panel');
}
go(4);
assert.match(text(tree), /saved@example.test/, 'Review shows saved values');
assert.match(text(tree), /unsaved edits/, 'Review warns about unsaved profile fields');
assert(walk(tree).some(node => node.type === 'Button' && /Complete registration/.test(text(node)) && node.props.disabled));
assert.equal(mutations, 0, 'Moving between stages never saves or submits');
const tablist = walk(tree).find(node => node.props.role === 'tablist');
tablist.props.onKeyDown({ key: 'Home', preventDefault() {} });
tree = page.render();
assert.equal(tabs()[0].props['aria-selected'], true);
walk(tree).find(node => node.props.role === 'tablist').props.onKeyDown({ key: 'End', preventDefault() {} });
tree = page.render();
assert.equal(tabs()[4].props['aria-selected'], true);

const support = mount('registration-support.tsx', 'RegistrationSupport', {
  code: agent.agent_code, detail, version: 2, activeSection: 'licence-documents',
  onActionSuccess() {}, onInvalidate: async () => {}, onReload: async () => {},
});
let supportTree = support.render();
const field = label => walk(supportTree).find(node => node.type === 'Field' && node.props.label === label);
field('Licence No').props.onChange('QA_LICENCE');
supportTree = support.render();
const comment = walk(supportTree).find(node => node.type === 'NoteField' && /Comments/.test(node.props.label));
comment.props.onChange('Unsubmitted licence comment');
supportTree = support.render();
const file = { name: 'synthetic.pdf', size: 12, type: 'application/pdf' };
walk(supportTree).find(node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [file] } });
supportTree = support.render({ activeSection: 'directors' });
field('Full Name').props.onChange('Unsaved Director');
supportTree = support.render({ activeSection: 'review' });
supportTree = support.render({ activeSection: 'licence-documents' });
assert.equal(field('Licence No').props.value, 'QA_LICENCE');
assert.equal(walk(supportTree).find(node => node.type === 'NoteField' && /Comments/.test(node.props.label)).props.value, 'Unsubmitted licence comment');
assert.match(text(supportTree), /synthetic.pdf/, 'Upload selection survives navigation');
supportTree = support.render({ activeSection: 'directors' });
assert.equal(field('Full Name').props.value, 'Unsaved Director');
assert.equal(mutations, 0);
console.log('PASS: five accessible workflow tabs, keyboard navigation, stable support mount, saved-only review, completion gates, retained profile/licence/director/comment/file drafts and navigation without mutations.');
