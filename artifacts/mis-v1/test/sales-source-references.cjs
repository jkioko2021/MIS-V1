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
vm.runInNewContext(output, {
  exports: exportsObject,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name.startsWith('@/components/ui/') || name === 'lucide-react')
      return new Proxy({}, { get: (_, key) => String(key) });
    throw new Error(`Unexpected runtime dependency ${name}`);
  },
});
const values = { ID: '00042', UM_ID: '0001234567890123456789', UM_NAME: 'Example Manager',
  EMAIL: '0', HRMIS_CODE: '000042', APPROVED_BY: 'ORIGINAL', H_TAX: '0.300',
  MIS_EMP_CODE: '', VALID_TO: '2025-12-31', UNIT_CODE: 'NULL' };
let closed = false;
const tree = exportsObject.SourceReferenceDetails({
  entry: { id: -91, catalog: 'unit-managers', code: values.UM_ID, name: values.UM_NAME,
    employee_id: null, version: 1, is_active: true, source_reference: true,
    source_file: 'example.tsv', source_issues: ['Original mapping needs verification.'], values },
  definition: { key: 'unit-managers', title: 'Unit Managers', manager: true,
    fields: Object.keys(values).map(key => ({ key, label: key })) },
  onClose: () => { closed = true; },
});
assert.match(text(tree), /read-only reference/);
assert.match(text(tree), /Unlinked to an MIS user/);
assert.match(text(tree), /Original mapping needs verification/);
for (const [key, value] of Object.entries(values)) {
  const field = walk(tree).find(node => node.props['data-testid'] === `source-field-${key}`);
  assert(field, `Missing original field ${key}`);
  assert(text(field).includes(value === '' ? '(blank)' : value), `Source ${key} changed`);
}
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
console.info('PASS: every original source field is read-only and exact; reference rows cannot become operational assignment choices.');
