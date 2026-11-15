const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const output = {};
let state = [], cursor = 0;
const jsx = (type, props) => ({ type, props: props || {} });
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../src/components/ui/searchable-select.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: output, require(name) {
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
  if (name === 'react') return { useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], value => { state[index] = value; }];
  }};
  if (name === '@/lib/utils') return { cn: (...parts) => parts.filter(Boolean).join(' ') };
  if (name === 'lucide-react' || name.startsWith('./')) return new Proxy({}, { get: (_, key) => String(key) });
  throw Error(name);
}});
let chosen;
const props = { id: 'test-manager', value: 'user:101', placeholder: 'Choose manager',
  onValueChange: value => { chosen = value; },
  options: [
    { value: 'user:101', label: 'Alex  Example', description: 'alex@example.test' },
    { value: '23', label: 'Alex Example', description: 'second@example.test' },
    { value: '24', label: 'Locked person', description: 'locked@example.test · Locked', disabled: true },
  ] };
const walk = node => node == null || typeof node === 'boolean' ? [] : Array.isArray(node) ? node.flatMap(walk) :
  typeof node === 'object' ? [node, ...walk(node.props?.children)] : [];
const render = () => { cursor = 0; return output.SearchableSelect(props); };
const find = type => walk(render()).find(node => node.type === type);
const items = () => walk(render()).filter(node => node.type === 'CommandItem');
const search = text => find('CommandInput').props.onValueChange(text);
render().props.onOpenChange(true);
assert.equal(find('Button').props['aria-expanded'], true);
assert.equal(items().length, 3);
search(' ALEX   example ');
assert.equal(items().length, 2, 'Case and repeated whitespace do not hide matching names');
search('SECOND@EXAMPLE.TEST');
assert.equal(items().length, 1, 'Email search is case insensitive');
items()[0].props.onSelect();
assert.equal(chosen, '23', 'Actual record identifier is preserved, not the search text or row index');
assert.equal(find('Button').props['aria-expanded'], false);
assert.equal(find('CommandInput').props.value, '', 'Search resets on selection');
props.value = chosen;
assert(JSON.stringify(find('Button').props.children).includes('second@example.test'));
render().props.onOpenChange(true);
search('no such person');
assert.equal(items().length, 0);
assert.equal(find('CommandEmpty').props.children, 'No matching options.');
assert(JSON.stringify(find('Button').props.children).includes('second@example.test'), 'An empty result never clears the current assignment');
search('locked');
items()[0].props.onSelect();
assert.equal(chosen, '23', 'Disabled account cannot be selected');
assert.match(find('PopoverContent').props.className, /z-\[260\]/);
assert.match(find('PopoverContent').props.className, /--radix-popover-trigger-width/);
assert.match(find('PopoverContent').props.className, /max-w-/);
assert.match(find('CommandList').props.className, /available-height/);
assert.match(find('Button').props.className, /h-auto/);
search('');
assert.match(items()[0].props.children[0].props.children[0].props.className, /whitespace-normal/);
props.disabled = true;
assert.equal(find('Button').props.disabled, true);
console.log('PASS: searchable names/email, whitespace/case, exact IDs, retained selection, disabled choices, wrapped labels and bounded scrollable popup.');
