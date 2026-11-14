const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '../../..');
const source = fs.readFileSync(path.join(root, 'artifacts/mis-v1/src/pages/admin/sales-structure/shared.tsx'), 'utf8');
const moduleExports = {};
const jsx = (type, props) => ({ type, props: props || {} });
let location = '/admin/sales-structure/catalogs/sales-units';
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: moduleExports,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name === 'wouter') return { Link: 'Link', useLocation: () => [location] };
    if (name === '@/lib/auth-context') return { useAuth: () => ({ user: { profileId: 1 } }) };
    if (name === '@/lib/utils') return { cn: (...args) => args.filter(Boolean).join(' ') };
    if (name.startsWith('@/components/ui/') || name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
    throw new Error(`Unexpected dependency ${name}`);
  },
});
const walk = node => !node || typeof node !== 'object' ? []
  : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const header = moduleExports.SalesStructureHeader({ eyebrow: 'Administration', title: 'Sales Units', description: 'Sales catalog' });
const links = walk(header).filter(node => node.type === 'Link');
assert.equal(links.length, 5);
assert(links.some(link => link.props.href === '/admin/sales-structure/manager-mapping'));
for (const item of moduleExports.MEDICAL_STRUCTURE_LINKS) {
  assert(links.some(link => link.props.href === (item.href ?? `/admin/sales-structure/catalogs/${item.key}`)));
}
assert.equal(links.filter(link => link.props['aria-current'] === 'page').length, 1);
assert.equal(links.find(link => link.props['aria-current'] === 'page').props.href, location);
assert(links.some(link => link.props.href === '/admin/sales-structure/managers'));
assert(!links.some(link => /catalogs\/(?:unit-managers|regional-managers)$/.test(link.props.href)));
assert(!source.includes('link-sales-structure"'));
location = '/admin/gi-structure/catalogs/gi-units';
const giLinks = walk(moduleExports.SalesStructureHeader({ eyebrow: 'Administration', title: 'GI Units', description: 'GI catalog' }))
  .filter(node => node.type === 'Link');
assert.equal(giLinks.length, 4);
for (const item of moduleExports.GI_STRUCTURE_LINKS)
  assert(giLinks.some(link => link.props.href === `/admin/gi-structure/catalogs/${item.key}`));
assert.equal(giLinks.find(link => link.props['aria-current'] === 'page').props.href, location);
assert(!giLinks.some(link => link.props.href.includes('/admin/sales-structure')));
const app = fs.readFileSync(path.join(root, 'artifacts/mis-v1/src/App.tsx'), 'utf8');
assert(!app.includes("label: 'Structure setup'"));
assert(!app.includes("label: 'Sales Structure setup'"));
assert(app.includes("label: 'Medical Structure setup'"));
assert(app.includes("label: 'GI Structure setup'"));
assert(app.includes("label: 'Manager Enrollment'"));
assert(!app.includes("label: 'Unit Managers'"));
assert(!app.includes("label: 'Regional Managers'"));
const menu = fs.readFileSync(path.join(root, 'artifacts/api-server/src/routes/admin.ts'), 'utf8');
assert(!menu.includes('sub: "Sales Manager Enrollment"'));
assert(!menu.includes('url: "/admin/sales-structure",'));
for (const item of moduleExports.MEDICAL_STRUCTURE_LINKS)
  assert(menu.includes(item.href ?? `/admin/sales-structure/catalogs/${item.key}`));
for (const item of moduleExports.GI_STRUCTURE_LINKS) assert(menu.includes(`/admin/gi-structure/catalogs/${item.key}`));
assert(menu.includes('url: "/admin/sales-structure/manager-mapping"'));
assert(!menu.includes('sub: "Unit Managers"'));
assert(!menu.includes('sub: "Regional Managers"'));
const managerSource = fs.readFileSync(path.join(root, 'artifacts/mis-v1/src/pages/admin/sales-structure/managers.tsx'), 'utf8');
const managerAst = ts.createSourceFile('managers.tsx', managerSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
let categories;
function findCategories(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(managerAst) === 'LEVELS')
    categories = node.initializer.elements.map(item => item.text);
  ts.forEachChild(node, findCategories);
}
findCategories(managerAst);
assert.deepEqual(categories, ['UNIT', 'REGION', 'BRANCH', 'NATIONAL']);
for (const name of ['Unit Manager', 'Regional Manager', 'Branch Manager', 'National Sales Manager'])
  assert(managerSource.includes(`'${name}'`));
assert(app.includes('/admin/sales-structure/managers?category=UNIT'));
assert(app.includes('/admin/sales-structure/managers?category=REGION'));
console.info('PASS: separate Medical/GI menus; one four-category Manager Enrollment; correct active links, retained Mapping, no duplicate manager submenu links and compatible bookmarks.');
