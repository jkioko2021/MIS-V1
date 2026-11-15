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
let state = [], cursor = 0, search = '';
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
    if (name === 'wouter') return { Link: 'Link', useLocation: () => ['/admin/organisation/hierarchy'], useSearch: () => search };
    if (name === '@/lib/auth-context') return { useAuth: () => ({ user: { id: 1, profileId: 1 } }) };
    if (name === '@/lib/utils') return { cn: (...values) => values.filter(Boolean).join(' ') };
    if (name === './shared') return {
      LEVELS: levels, LEVEL_LABEL: names, identityQueryKey: key => key, pathNames: () => '', ErrorNotice: 'ErrorNotice',
    };
    if (name === '@workspace/api-client-react') return {
      getGetOrganisationQueryKey: () => ['/api/organisation'], getGetSalesCatalogsQueryKey: () => ['/catalogs'],
      useGetOrganisation: () => ({ data: { can_manage: true, nodes, managers: [], manager_users: [], candidates: [] } }),
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
  const imports = tree.filter(node => node.type === 'MedicalRecords');
  assert.equal(imports.length, 1, 'Hierarchy view must not also render the dashboard');
  assert.equal(imports[0].props.showAllRecords, true, 'Imported records remain accessible together');
  tree.find(node => node.type === 'Button' && walk(node).some(child => child.props?.children === 'Add entry')
    || node.type === 'Button' && node.props.children?.includes('Add entry')).props.onClick();
  tree = render();
  assert.equal(tree.find(node => node.type === 'NodeEditor').props.initialLevel, expected);
}
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.equal((app.match(/label: 'Hierachy Setup'/g) || []).length, 1);
for (const [slug, level] of Object.entries({ national: 'NATIONAL', regions: 'REGION', branches: 'BRANCH', units: 'UNIT' })) {
  assert(!app.includes(`{ href: '/admin/organisation/${slug}', label:`), 'Old standalone sidebar items must be removed');
  assert(app.includes(`to="/admin/organisation/hierarchy?level=${level}"`), 'Old links must redirect to the matching level');
}
console.log('PASS: no level tabs, all four levels in one list, imported records retained, safe Add defaults and legacy redirects.');
