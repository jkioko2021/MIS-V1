const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const levels = ['NATIONAL', 'REGION', 'BRANCH', 'UNIT'];
const names = { NATIONAL: 'National', REGION: 'Region', BRANCH: 'Branch', UNIT: 'Unit' };
const nodes = levels.map((level, index) => ({
  id: index + 1, code: `TEST_${level}`, name: `${names[level]} record`, level,
  is_active: true, path: [], manager_name: 'Manager', child_count: 0, agent_count: 0,
}));
const candidates = [['REGION', 10], ['BRANCH', 11], ['UNIT', 32]].flatMap(([level, count], group) =>
  Array.from({ length: count }, (_, index) => ({
    source_reference_id: 100 + group * 100 + index, level,
    code: `UP-${level}-${String(index + 1).padStart(3, '0')}`,
    name: `Uploaded organisation ${group}-${index + 1}`, parent_code: null,
  })));
const adoptedCandidate = { source_reference_id: 999, level: 'REGION', code: ' test_region ', name: 'Already adopted reference' };
let canManage = true;
let state = [], cursor = 0, search = '', currentPath = '/admin/organisation/hierarchy';
const jsx = (type, props) => ({ type, props: props || {} });
const source = fs.readFileSync(path.join(root, 'src/pages/admin/organisation/index.tsx'), 'utf8');
const output = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: output,
  URLSearchParams,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name === 'react') return {
      useMemo: fn => fn(),
      useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = value; }]; },
    };
    if (name === 'wouter') return { Link: 'Link', useLocation: () => [currentPath], useSearch: () => search };
    if (name === '@/lib/auth-context') return { useAuth: () => ({ user: { id: 1, profileId: 1 } }) };
    if (name === '@/lib/utils') return { cn: (...values) => values.filter(Boolean).join(' ') };
    if (name === './shared') return {
      LEVELS: levels, LEVEL_LABEL: names, identityQueryKey: key => key, pathNames: () => '', ErrorNotice: 'ErrorNotice',
    };
    if (name === '@workspace/api-client-react') return {
      getGetOrganisationQueryKey: () => ['/api/organisation'], getGetSalesCatalogsQueryKey: () => ['/catalogs'],
      useGetOrganisation: () => ({ data: { can_manage: canManage, nodes, managers: [], manager_users: [], candidates: [...candidates, adoptedCandidate] } }),
      useGetSalesCatalogs: () => ({ data: {} }),
    };
    return new Proxy({}, { get: (_, key) => key });
  },
});
const walk = node => node == null || typeof node === 'boolean' ? [] : Array.isArray(node) ? node.flatMap(walk)
  : typeof node === 'object' ? [node, ...walk(node.props?.children)] : [];
const render = () => { cursor = 0; return walk(output.default()); };
for (const requested of [...levels, 'INVALID', '']) {
  state = []; search = requested ? `level=${requested}` : '';
  const expected = levels.includes(requested) ? requested : 'NATIONAL';
  let tree = render();
  assert(tree.some(node => node.type === 'h1' && node.props.children === 'Hierachy Setup'));
  assert(!tree.some(node => node.props['aria-label'] === 'Hierarchy setup levels'), 'The four level tabs must be removed');
  for (const node of nodes) {
    assert(tree.some(item => item.props['data-testid'] === `row-organisation-node-${node.id}`),
      'All four levels must appear together even when an old level query parameter is present');
  }
  const pending = tree.filter(node => node.type === 'PendingHierarchyRow');
  assert.equal(pending.length, 53, 'All uploaded regions, branches and units must be visible by default');
  for (const [level, count] of [['REGION', 10], ['BRANCH', 11], ['UNIT', 32]]) {
    assert.equal(pending.filter(node => node.props.candidate.level === level).length, count);
  }
  assert(!pending.some(node => node.props.candidate.source_reference_id === 999), 'Adopted references must not duplicate operational records');
  const imports = tree.filter(node => node.type === 'MedicalRecords');
  assert.equal(imports.length, 1, 'Hierarchy view must not also render the dashboard');
  assert.equal(imports[0].props.showAllRecords, true, 'Imported records remain accessible together');
  tree.find(node => node.type === 'Button' && walk(node).some(child => child.props?.children === 'Add entry')
    || node.type === 'Button' && node.props.children?.includes('Add entry')).props.onClick();
  tree = render();
  assert.equal(tree.find(node => node.type === 'NodeEditor').props.initialLevel, expected);
}
for (const [selected, count] of [['NATIONAL', 0], ['REGION', 10], ['BRANCH', 11], ['UNIT', 32]]) {
  state = []; search = '';
  let filteredTree = render();
  filteredTree.find(node => node.props.id === 'hierarchy-level-filter').props.onValueChange(selected);
  filteredTree = render();
  const pending = filteredTree.filter(node => node.type === 'PendingHierarchyRow');
  assert.equal(pending.length, count);
  assert(pending.every(node => node.props.candidate.level === selected), 'Imported rows must match the selected level only');
  const actual = filteredTree.filter(node => String(node.props['data-testid'] ?? '').startsWith('row-organisation-node-'));
  assert.equal(actual.length, 1);
  assert.equal(actual[0].props['data-testid'], `row-organisation-node-${levels.indexOf(selected) + 1}`,
    'Operational rows must use the same level filter');
  const details = filteredTree.find(node => node.type === 'MedicalRecords');
  if (selected === 'NATIONAL') assert(!details, 'No unrelated Region/Branch/Unit source panel under National');
  else assert.equal(details.props.level, selected, 'Expanded source details must follow the level filter');
}
state = []; search = '';
let filteredTree = render();
filteredTree.find(node => node.props.id === 'hierarchy-level-filter').props.onValueChange('BRANCH');
filteredTree = render();
filteredTree.find(node => node.type === 'Button' && node.props.children?.includes('Add entry')).props.onClick();
filteredTree = render();
assert.equal(filteredTree.find(node => node.type === 'NodeEditor').props.initialLevel, 'BRANCH');
assert.equal(filteredTree.find(node => node.props.id === 'hierarchy-level-filter').props.disabled, true);
filteredTree.find(node => node.type === 'NodeEditor').props.onLevelChange('UNIT');
filteredTree = render();
assert.equal(filteredTree.find(node => node.props.id === 'hierarchy-level-filter').props.value, 'UNIT');
assert.equal(filteredTree.filter(node => node.type === 'PendingHierarchyRow').length, 32, 'Changing entry level must update displayed records immediately');
filteredTree.find(node => node.type === 'NodeEditor').props.onCancel();
filteredTree = render();
assert.equal(filteredTree.find(node => node.props.id === 'hierarchy-level-filter').props.disabled, false);
filteredTree.find(node => node.props.id === 'hierarchy-level-filter').props.onValueChange('ALL');
assert.equal(render().filter(node => node.type === 'PendingHierarchyRow').length, 53);
state = []; search = '';
let tree = render();
tree.find(node => node.props['aria-label'] === 'Filter by status').props.onChange({ target: { value: 'pending' } });
tree = render();
assert.equal(tree.filter(node => node.type === 'PendingHierarchyRow').length, 53);
assert(!tree.some(node => String(node.props['data-testid'] ?? '').startsWith('row-organisation-node-')), 'Pending-only filter must hide operational nodes');
tree.find(node => node.type === 'Input' && node.props.placeholder === 'Search name, level, code or manager')
  .props.onChange({ target: { value: 'UP-BRANCH-001' } });
tree = render();
const match = tree.filter(node => node.type === 'PendingHierarchyRow');
assert.equal(match.length, 1);
assert.equal(match[0].props.candidate.level, 'BRANCH');
match[0].props.onSetup(match[0].props.candidate);
tree = render();
assert.equal(tree.find(node => node.type === 'NodeEditor').props.initialCandidate, match[0].props.candidate,
  'Complete setup must pass the original imported identity and level to the existing validated form');
state = []; canManage = false;
tree = render();
assert(!tree.some(node => node.type === 'PendingHierarchyRow'), 'Scoped read-only users must never receive global pending imports in the table');
assert(!tree.some(node => node.props['data-testid'] === 'pending-hierarchy-summary'));
state = []; canManage = true; currentPath = '/admin/organisation/dashboard';
render();
currentPath = '/admin/organisation/hierarchy';
assert.equal(render().filter(node => node.type === 'PendingHierarchyRow').length, 53,
  'Navigating from the dashboard must also show pending imports without changing a filter');
const rowOutput = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,
  'src/pages/admin/organisation/pending-hierarchy-row.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: rowOutput, require(name) {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  if (name === './shared') return { LEVEL_LABEL: names };
  return new Proxy({}, { get: (_, key) => key });
}});
let chosen;
const pendingUnit = { ...candidates.find(item => item.level === 'UNIT'), parent_code: 'UP-BRANCH-001' };
const pendingTree = walk(rowOutput.PendingHierarchyRow({ candidate: pendingUnit, nodes, candidates,
  onSetup: candidate => { chosen = candidate; } }));
assert(pendingTree.some(node => node.type === 'Badge' && node.props.children === 'Pending Setup'));
assert(pendingTree.some(node => node.type === 'span' && node.props.children === 'Unit'));
assert(pendingTree.some(node => node.type === 'td' && node.props.children === 'Not available for agent assignment'));
assert(JSON.stringify(pendingTree).includes('Imported parent: Uploaded organisation 1-1'));
pendingTree.find(node => node.type === 'Button').props.onClick();
assert.equal(chosen, pendingUnit);
const matchedManagerTree=walk(rowOutput.PendingManagerDetails({candidate:{...pendingUnit,
  linked_manager_name:'Verified Unit Manager',manager_link_status:'MATCHED',
  setup_note:'Linked account; operational setup pending.'}}));
assert(JSON.stringify(matchedManagerTree).includes('Verified Unit Manager'));
assert(JSON.stringify(matchedManagerTree).includes('operational setup pending'));
const unresolvedTree=walk(rowOutput.PendingManagerDetails({candidate:{...pendingUnit,
  manager_link_status:'UNRESOLVED',setup_note:'The uploaded manager reference is missing.'}}));
assert(JSON.stringify(unresolvedTree).includes('Manager match needs attention'));
assert(JSON.stringify(unresolvedTree).includes('uploaded manager reference is missing'));
const approvedBranch={...candidates.find(item=>item.level==='BRANCH'),branch_approved:true,manager_link_status:'NOT_REQUIRED'};
const branchTree=walk(rowOutput.PendingHierarchyRow({candidate:approvedBranch,nodes,candidates,onSetup(){}}));
assert(branchTree.some(node=>node.type==='Badge'&&node.props.children==='Approved for setup'));
assert(branchTree.some(node=>node.type==='Badge'&&node.props.children==='Pending Setup'),'Branch approval must not activate the hierarchy');
assert(JSON.stringify(walk(rowOutput.PendingManagerDetails({candidate:approvedBranch}))).includes('No manager required'));
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.equal((app.match(/label: 'Hierachy Setup'/g) || []).length, 1);
for (const [slug, level] of Object.entries({ national: 'NATIONAL', regions: 'REGION', branches: 'BRANCH', units: 'UNIT' })) {
  assert(!app.includes(`{ href: '/admin/organisation/${slug}', label:`), 'Old standalone sidebar items must be removed');
  assert(app.includes(`to="/admin/organisation/hierarchy?level=${level}"`), 'Old links must redirect to the matching level');
}
console.log('PASS: 53 pending records, exact level filtering for operational/imported/source-detail rows, entry/list synchronization, all-level reset, status/search filters, deduplication, setup identity, scope and legacy links.');
