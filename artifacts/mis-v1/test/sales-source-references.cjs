const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const directory = path.join(__dirname, '../src/pages/admin/sales-structure/catalogs');
const jsx = (type, props, key) => ({ type, props: props || {}, key });
const walk = node => !node || typeof node !== 'object' ? []
  : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const text = node => node == null || typeof node === 'boolean' ? ''
  : typeof node !== 'object' ? String(node)
  : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
const output = ts.transpileModule(fs.readFileSync(path.join(directory, 'source-reference-details.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exportsObject = {};
const displayExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(directory, 'catalog-display.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: displayExports });
vm.runInNewContext(output, {
  exports: exportsObject,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name === './catalog-display') return displayExports;
    if (name.startsWith('@/components/ui/') || name === 'lucide-react')
      return new Proxy({}, { get: (_, key) => String(key) });
    throw new Error(`Unexpected runtime dependency ${name}`);
  },
});
const values = { ID: '00042', UM_ID: '0001234567890123456789', UM_NAME: 'Example Manager',
  EMAIL: '0', HRMIS_CODE: '000042', APPROVED_BY: 'ORIGINAL', H_TAX: '0.300',
  MIS_EMP_CODE: '', VALID_TO: '2025-12-31', UNIT_CODE: 'NULL' };
const snapshot = {
  definitions: [], users: [], nationals: [{ code: 'N001', name: 'National Office' }],
  branch_managers: [{ id: 12, employee_name: 'Branch Manager Name' }],
  entries: [
    { catalog: 'sales-units', code: 'UNIT-01', name: 'Central Unit', source_reference: true },
    { catalog: 'sales-branches', code: 'BR-01', name: 'Central Branch', source_reference: true },
    { catalog: 'sales-regions', code: 'REG-01', name: 'Central Region', source_reference: true },
    { catalog: 'gi-branches', code: 'CORD-01', name: 'GI Coordination Office', source_reference: true },
    { catalog: 'unit-managers', code: 'SHARED', name: 'Shared Manager', source_reference: true },
    { catalog: 'unit-managers', code: 'SHARED', name: 'Shared Manager', source_reference: true },
    { catalog: 'unit-managers', code: 'CONFLICT', name: 'Different Person A', source_reference: true },
    { catalog: 'unit-managers', code: 'CONFLICT', name: 'Different Person B', source_reference: true },
  ],
};
const sourceEntry = { source_reference: true, values: {
  UNIT_CODE: 'UNIT-01', BRANCH_CODE: 'BR-01', REGION_CODE: 'REG-01',
  CORD_MGR_ID: 'CORD-01', UNIT_MGR_ID: 'SHARED', NSM_CODE: 'N001', BRANCH_MGR_ID: '12',
} };
for (const [key, reference, expected] of [
  ['UNIT_CODE', 'sales-units', 'Central Unit'],
  ['BRANCH_CODE', 'sales-branches', 'Central Branch'],
  ['REGION_CODE', 'sales-regions', 'Central Region'],
  ['CORD_MGR_ID', 'gi-branches', 'GI Coordination Office'],
  ['UNIT_MGR_ID', 'unit-managers', 'Shared Manager'],
  ['NSM_CODE', 'nationals', 'National Office'],
  ['BRANCH_MGR_ID', 'branch-managers', 'Branch Manager Name'],
]) assert.equal(displayExports.displayReference(sourceEntry, { key, reference }, snapshot), expected);
for (const [value, expected] of [['MISSING', 'Not mapped'], ['NULL', 'Not assigned'], ['', 'Not assigned'], ['CONFLICT', 'Needs mapping']]) {
  assert.equal(displayExports.displayReference({ ...sourceEntry, values: { UNIT_MGR_ID: value } },
    { key: 'UNIT_MGR_ID', reference: 'unit-managers' }, snapshot), expected);
}
assert.equal(displayExports.displayFieldLabel({ key: 'REGION_CODE' }, 'gi-units'), 'GI Branch');
let closed = false;
const tree = exportsObject.SourceReferenceDetails({
  entry: { id: -91, catalog: 'unit-managers', code: values.UM_ID, name: values.UM_NAME,
    employee_id: null, version: 1, is_active: true, source_reference: true,
    source_file: 'example.tsv', source_issues: ['Original mapping needs verification.'], values },
  definition: { key: 'unit-managers', title: 'Unit Managers', manager: true,
    code_field: 'UM_ID',
    fields: Object.keys(values).map(key => ({ key, label: key, reference: key === 'UNIT_CODE' ? 'sales-units' : null })) },
  snapshot,
  onClose: () => { closed = true; },
});
assert.match(text(tree), /read-only reference/);
assert.match(text(tree), /Unlinked to an MIS user/);
assert.match(text(tree), /Original mapping needs verification/);
for (const [key, value] of Object.entries(values)) {
  const field = walk(tree).find(node => node.props['data-testid'] === `source-field-${key}`);
  if (['ID', 'UM_ID', 'HRMIS_CODE', 'MIS_EMP_CODE'].includes(key)) {
    assert.equal(field, undefined, `Identifier ${key} should be hidden`);
  } else {
    assert(field, `Missing visible field ${key}`);
    assert(text(field).includes(key === 'UNIT_CODE' ? 'Not assigned' : value === '' ? '(blank)' : value), `Display ${key} changed`);
  }
}
assert(!text(tree).includes('0001234567890123456789'));
assert(!text(tree).includes('00042'));
assert.equal(walk(tree).some(node => ['input', 'select', 'textarea'].includes(node.type)), false);
assert.equal(walk(tree).filter(node => node.type === 'Button').length, 1);
walk(tree).find(node => node.props['data-testid'] === 'button-close-source-reference').props.onClick();
assert.equal(closed, true);
const editor = fs.readFileSync(path.join(directory, 'catalog-editor.tsx'), 'utf8');
assert.match(editor, /item\.catalog === reference && !item\.source_reference/);
assert.match(editor, /if \(entry\?\.source_reference\) return null/);
const catalog = fs.readFileSync(path.join(directory, 'index.tsx'), 'utf8');
assert.match(catalog, /useState\('all'\)/);
assert.match(catalog, /if \(entry\.source_reference\) return/);
assert.match(catalog, /<SourceReferenceDetails/);
assert(!catalog.includes('>Record ID<'));
assert(!catalog.includes('>Catalog record<'));
assert(!catalog.includes('{entry.code}'));
assert.match(catalog, /displayReference\(entry, field, snapshot!\)/);
console.info('PASS: sales relationships show specific names, unknown/conflicting mappings are explicit, codes and record IDs are hidden, and reference data remains read-only.');
