const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
const jsx = (type, props) => ({ type, props: props || {} });
const source = fs.readFileSync(path.join(__dirname, '../src/pages/admin/sales-structure/manager-mapping/assignment-history.tsx'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exportsObject,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name === 'lucide-react' || name.startsWith('@/components/ui/'))
      return new Proxy({}, { get: (_, key) => String(key) });
    throw new Error(`Unexpected dependency ${name}`);
  },
});
const text = node => node == null || typeof node === 'boolean' ? ''
  : typeof node !== 'object' ? String(node)
  : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
const event = {
  id: 1, action: 'REASSIGNED', before_manager_name: 'Previous branch manager', after_manager_name: 'Incoming branch manager',
  organization_name: 'Destination branch', transfer_from_name: 'Origin branch', transfer_to_name: 'Destination branch',
  note: 'Approved coverage change', actor: 'fixture-admin', created_at: '2026-11-14T08:00:00Z',
};
const rendered = text(exportsObject.AssignmentHistory({ events: [event], loading: false, error: false, onRefresh() {} }));
for (const expected of [event.before_manager_name, event.after_manager_name, event.transfer_from_name,
  event.transfer_to_name, event.note, event.actor]) assert(rendered.includes(expected), `History must show ${expected}`);
const removal = text(exportsObject.AssignmentHistory({ events: [{ ...event, action: 'UNASSIGNED',
  after_manager_name: null }], loading: false, error: false, onRefresh() {} }));
assert(removal.includes(event.before_manager_name));
assert(removal.includes('Not assigned'));
console.info('PASS: transfer history retains both manager identities, named origin/destination, reason and actor; removals remain explicit.');
