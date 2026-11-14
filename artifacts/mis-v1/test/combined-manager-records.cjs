const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props: props || {} });
const walk = node => !node || typeof node !== 'object' ? []
  : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const text = node => node == null || typeof node === 'boolean' ? ''
  : typeof node !== 'object' ? String(node)
  : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
const exportsObject = {};
let cursor = 0; let state = [];
const source = fs.readFileSync(path.join(__dirname, '../src/pages/admin/sales-structure/manager-catalog-records.tsx'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exportsObject,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name === 'react') return { useMemo: fn => fn(), useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    } };
    if (name === './catalogs/catalog-editor') return { CatalogEditor: 'CatalogEditor' };
    if (name === './catalogs/source-reference-details') return { SourceReferenceDetails: 'SourceReferenceDetails' };
    if (name === 'lucide-react' || name.startsWith('@/components/ui/'))
      return new Proxy({}, { get: (_, key) => String(key) });
    throw new Error(`Unexpected dependency ${name}`);
  },
});
const snapshot = {
  definitions: [{ key: 'unit-managers', fields: [] }, { key: 'regional-managers', fields: [] }],
  users: [{ employee_id: 42, employee_name: 'Verified normal user', username: 'fixture-normal' }],
  entries: [
    { id: -1, catalog: 'unit-managers', name: 'Imported Unit Manager', code: 'SECRET_CODE', employee_id: null,
      source_reference: true, is_active: true, values: { UM_ID: '0000001', H_TAX: '0.100' } },
    { id: -2, catalog: 'unit-managers', name: 'Imported Unit Manager', code: 'SECRET_CODE', employee_id: null,
      source_reference: true, is_active: true, values: { UM_ID: '0000001', UNIT_CODE: 'OTHER_UNIT' } },
    { id: -3, catalog: 'regional-managers', name: 'Imported Regional Manager', code: 'SECRET_REGION_ID', employee_id: null,
      source_reference: true, is_active: false, values: { RM_ID: '0000002' } },
    { id: 8, catalog: 'unit-managers', name: 'Operational Unit Manager', code: 'SECRET_MIS_ID', employee_id: 42,
      source_reference: false, is_active: true, values: { UM_ID: '0000003' } },
  ],
};
const original = JSON.stringify(snapshot);
const props = { snapshot, loading: false, error: undefined, onRetry() {}, category: 'all', status: 'all', search: '' };
function render(extra = {}) {
  cursor = 0;
  return exportsObject.ManagerCatalogRecords({ ...props, ...extra });
}
let tree = render();
let rows = walk(tree).filter(node => String(node.props?.['data-testid'] ?? '').startsWith('row-manager-catalog-'));
assert.equal(rows.length, 4, 'Repeated imported manager assignments must remain separate');
assert(text(tree).includes('Imported Regional Manager'));
assert(text(tree).includes('Verified normal user'));
assert(!text(tree).includes('SECRET_'), 'Internal source codes should not become visible labels');
const sourceRow = rows.find(row => row.props['data-testid'].endsWith('--1'));
assert(sourceRow);
assert(!walk(sourceRow).some(node => node.props['data-testid']?.startsWith('button-edit-')));
walk(sourceRow).find(node => node.props['data-testid'] === 'button-view-manager-source--1').props.onClick();
tree = render();
assert.equal(walk(tree).find(node => node.type === 'SourceReferenceDetails').props.entry, snapshot.entries[0]);
state = []; tree = render({ category: 'UNIT' });
rows = walk(tree).filter(node => String(node.props?.['data-testid'] ?? '').startsWith('row-manager-catalog-'));
assert.equal(rows.length, 3);
walk(tree).find(node => node.props['data-testid'] === 'button-edit-manager-catalog-8').props.onClick();
tree = render({ category: 'UNIT' });
assert.equal(walk(tree).find(node => node.type === 'CatalogEditor').props.entry, snapshot.entries[3]);
state = [];
assert.equal(walk(render({ category: 'BRANCH' })).filter(node => String(node.props?.['data-testid'] ?? '').startsWith('row-manager-catalog-')).length, 0);
assert.equal(JSON.stringify(snapshot), original);
console.info('PASS: combined enrollment retains duplicate Unit/Regional references and original metadata; read-only source details, verified operational editing, category filters and hidden identifiers remain intact.');
