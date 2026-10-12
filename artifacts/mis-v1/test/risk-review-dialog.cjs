const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-review-dialog.tsx'), 'utf8');
const exported = {};
const jsx = (type, props) => ({ type, props });
let focused;
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: exported,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === './risk-review-focus') return { restoreReviewFocus(trigger) { focused = trigger; } };
    if (name === '@/components/ui/dialog') return Object.fromEntries(
      ['Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle'].map(key => [key, key]));
    throw new Error(`Unexpected dependency ${name}`);
  },
});
function flatten(node) {
  if (Array.isArray(node)) return node.flatMap(flatten);
  return node && typeof node === 'object' ? [node, ...flatten(node.props?.children)] : [];
}
let closed = 0;
const props = { open: true, riskCode: 'SYNTHETIC', trigger: { id: 'summary-review' }, mutating: false, onClose: () => closed++, children: { type: 'Editor', props: {} } };
let tree = exported.default(props);
assert.equal(tree.props.open, true);
assert(flatten(tree).some(n => n.type === 'Editor'), 'Review popup hosts the real assessment editor');
const content = flatten(tree).find(n => n.type === 'DialogContent');
content.props.onCloseAutoFocus({ preventDefault() {} });
assert.equal(focused, props.trigger, 'Popup returns focus to the summary review control');
assert(content.props.className.includes('max-h-[85dvh]'), 'Popup height remains within the viewport');
assert(content.props.className.includes('w-[calc(100%-2rem)]'), 'Popup leaves visible side margins');
let prevented = false;
content.props.onInteractOutside({ preventDefault() { prevented = true; } });
assert(prevented, 'Clicking outside does not discard in-progress review');
tree.props.onOpenChange(false);
assert.equal(closed, 1);
tree = exported.default({ ...props, mutating: true });
tree.props.onOpenChange(false);
assert.equal(closed, 1, 'Do not close the editor during an assessment save');
prevented = false;
flatten(tree).find(n => n.type === 'DialogContent').props.onEscapeKeyDown({ preventDefault() { prevented = true; } });
assert(prevented);
tree = exported.default({ ...props, open: false });
assert(!flatten(tree).some(n => n.type === 'Editor'), 'Closed popup does not mount the assessment form');
const workspace = fs.readFileSync(path.join(__dirname, '../src/pages/risk/index.tsx'), 'utf8');
const reviewSection = workspace.split("{activePage === 'review' && <section")[1].split("{activePage === 'summary'")[0];
assert(!reviewSection.includes('RecordsTable'), 'Duplicate Submitted risks list is removed');
assert(!reviewSection.includes('assessmentEditor'), 'Assessment is not rendered inline');
assert(reviewSection.includes('onSelect={reviewAssessment}'), 'Summary Review opens the popup');
assert(workspace.includes('setReviewOpen(true)'));
assert(reviewSection.includes('WorkflowPanel'), 'Department review/return decisions remain available');
console.log('PASS: summary-only risk review, popup editor, close/save guards, responsive bounds and department decision controls retained.');
