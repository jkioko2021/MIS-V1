const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
let state = [], cursor = 0, writes = [], invalidations = [], failure = null;
const output = {};
const jsx = (type, props) => ({ type, props: props || {} });
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/admin/gi-structure/node-status-action.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: output,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useState(initial) {
      const i = cursor++; if (!(i in state)) state[i] = initial;
      return [state[i], value => { state[i] = value; }];
    } };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async arg => invalidations.push(arg) }) };
    if (name === '@workspace/api-client-react') return {
      getGetGiStructureQueryKey: () => ['/api/gi-structure'],
      useSaveGiStructureNode: () => ({
        isPending: false, error: failure, reset() { failure = null; },
        mutateAsync: async input => { if (failure) throw failure; writes.push(input.data); },
      }),
    };
    if (name === '@/hooks/use-toast') return { useToast: () => ({ toast() {} }) };
    if (name === '../organisation/shared') return { errorMessage: error => error.message };
    if (name.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, key) => String(key) });
    throw Error(name);
  },
});
function walk(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  return [node, ...walk(node.props?.children)];
}
let node = { id: 7, version: 4, name: 'Example Unit', code: 'U7', level: 'UNIT',
  status: 'PENDING', parent_id: 2, manager_id: 3 };
function render() { cursor = 0; return walk(output.NodeStatusAction({ node })); }
function find(type) { return render().find(item => item.type === type); }
function confirm() { return render().filter(item => item.type === 'Button').at(-1); }
(async () => {
  find('Button').props.onClick();
  assert.equal(writes.length, 0, 'Opening confirmation does not mutate anything');
  assert.equal(confirm().props.disabled, true);
  find('Textarea').props.onChange({ target: { value: 'Completed setup and verified manager' } });
  assert.equal(confirm().props.disabled, false);
  // Concurrent refresh must not replace the version captured at confirmation time.
  node = { ...node, version: 5 };
  await confirm().props.onClick();
  assert.equal(writes[0].status, 'ACTIVE');
  assert.equal(writes[0].version, 4);
  assert.equal(writes[0].manager_id, 3);
  assert.equal(writes[0].parent_id, 2);
  assert.equal(invalidations.length, 2);
  assert(!find('Dialog'), 'Success closes confirmation');
  state = [];
  node = { ...node, status: 'ACTIVE' };
  find('Button').props.onClick();
  find('Textarea').props.onChange({ target: { value: 'Suspend this Unit' } });
  failure = new Error('Remove Medical mappings first');
  await confirm().props.onClick();
  assert(find('Dialog'), 'Blocked deactivation remains open');
  assert(render().some(item => item.props.role === 'alert' && item.props.children === failure.message));
  assert.equal(writes.length, 1, 'Blocked operation did not save');
  failure = null;
  await confirm().props.onClick();
  assert.equal(writes[1].status, 'INACTIVE');
  const page = fs.readFileSync(path.join(__dirname, '../src/pages/admin/gi-structure/index.tsx'), 'utf8');
  assert(!page.includes('setStatus('));
  assert(page.includes('const status = node?.status ?? \'PENDING\''));
  assert(page.includes('<NodeStatusAction node={node} />'));
  console.log('PASS: Separate GI activation/deactivation, confirmation, reasons, blockers, version guards and list refresh.');
})().catch(error => { console.error(error); process.exitCode = 1; });
