const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const levels = ['NATIONAL', 'REGION', 'BRANCH', 'UNIT'];
const names = { NATIONAL: 'National', REGION: 'Region', BRANCH: 'Branch', UNIT: 'Unit' };
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
      useGetOrganisation: () => ({ data: { can_manage: true, nodes: [], managers: [], candidates: [] } }),
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
  const nav = tree.find(node => node.props['aria-label'] === 'Hierarchy setup levels');
  const links = walk(nav).filter(node => node.type === 'Link');
  assert.equal(links.length, 4);
  assert.equal(links.find(node => node.props['aria-current'] === 'page').props.href,
    `/admin/organisation/hierarchy?level=${expected}`);
  tree.find(node => node.type === 'Button' && walk(node).some(child => child.props?.children === 'Add entry')
    || node.type === 'Button' && node.props.children?.includes('Add entry')).props.onClick();
  tree = render();
  assert.equal(tree.find(node => node.type === 'NodeEditor').props.initialLevel, expected);
  let prevented = false;
  tree.find(node => node.type === 'Link' && node.props['aria-disabled']).props.onClick({ preventDefault() { prevented = true; } });
  assert(prevented, 'Changing levels must not silently discard an open editor');
}
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.equal((app.match(/label: 'Hierachy Setup'/g) || []).length, 1);
for (const [slug, level] of Object.entries({ national: 'NATIONAL', regions: 'REGION', branches: 'BRANCH', units: 'UNIT' })) {
  assert(!app.includes(`{ href: '/admin/organisation/${slug}', label:`), 'Old standalone sidebar items must be removed');
  assert(app.includes(`to="/admin/organisation/hierarchy?level=${level}"`), 'Old links must redirect to the matching level');
}
console.log('PASS: one setup menu, four levels, safe defaults, matching Add entry category, draft protection and legacy redirects.');
