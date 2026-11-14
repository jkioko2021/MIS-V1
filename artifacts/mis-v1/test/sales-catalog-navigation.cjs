const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '../../..');
const source = fs.readFileSync(path.join(root, 'artifacts/mis-v1/src/pages/admin/sales-structure/shared.tsx'), 'utf8');
const moduleExports = {};
const jsx = (type, props) => ({ type, props: props || {} });
const location = '/admin/sales-structure/catalogs/sales-units';
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
assert.equal(links.length, 9);
for (const catalog of moduleExports.SALES_CATALOGS) {
  assert(links.some(link => link.props.href === `/admin/sales-structure/catalogs/${catalog.key}`));
}
assert.equal(links.filter(link => link.props['aria-current'] === 'page').length, 1);
assert.equal(links.find(link => link.props['aria-current'] === 'page').props.href, location);
assert(!source.includes('link-manager-enrollment'));
assert(!source.includes('link-sales-structure"'));
const app = fs.readFileSync(path.join(root, 'artifacts/mis-v1/src/App.tsx'), 'utf8');
assert(!app.includes("label: 'Structure setup'"));
assert(!app.includes("label: 'Manager enrollment'"));
assert(app.includes("label: 'Sales Structure setup'"), 'Keep the parent menu');
const menu = fs.readFileSync(path.join(root, 'artifacts/api-server/src/routes/admin.ts'), 'utf8');
assert(!menu.includes('sub: "Sales Manager Enrollment"'));
assert(!menu.includes('url: "/admin/sales-structure",'));
for (const catalog of moduleExports.SALES_CATALOGS) assert(menu.includes(`/admin/sales-structure/catalogs/${catalog.key}`));
console.info('PASS: removed the two old sidebar/header/access-menu links; all nine catalog links and the parent menu remain.');
