const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-status-workflow.tsx'), 'utf8');
let callbacks, sent, invalidated = false;
let hook = 0;
const notes = [];
const fake = {
  'react': { useState: initial => { const value = hook++ === 0 ? true : initial; return [value, () => {}]; } },
  'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
  '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: () => { invalidated = true; } }) },
  '@workspace/api-client-react': { useSendRiskWorkflowReminder: () => ({ isPending: false, mutate: (data, handlers) => { sent = data; callbacks = handlers; } }) },
  '@/components/ui/dialog': Object.fromEntries(['Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle'].map(name => [name, name])),
  './risk-ui': { buttonClass: '', secondaryButton: '', dateLabel: value => value, envelopeError: value => value.error,
    queryError: value => value.message, ErrorNotice: 'ErrorNotice', Field: 'Field', fieldClass: '', StatusPill: 'StatusPill' },
};
const output = { exports: {}, require: name => { assert(name in fake, name); return fake[name]; } };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
} }).outputText, output);
const tree = output.exports.default({ row: { depart_code: 'TEST', depart_name: 'Test', period_id: 2,
  workflow_status: 'OPEN', total_risks: 1, reminder_available: true, pending_users: [] },
  onFeedback: (...args) => notes.push(args) });
const nodes = [];
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(walk);
  nodes.push(node); walk(node.props?.children);
}
walk(tree);
nodes.find(node => node.type === 'button' && node.props.children === 'Send reminder').props.onClick();
assert.equal(sent.data.period_id, 2);
assert.equal(sent.data.expected_status, 'OPEN');
callbacks.onSuccess({ ok: true, data: { accepted: 1, failed: 0, message: 'Accepted, not confirmed delivered.' } });
callbacks.onSettled();
assert.equal(notes[0][0], 'Accepted, not confirmed delivered.', 'Feedback must reach the workspace, outside refreshed table rows.');
assert.equal(invalidated, true);
callbacks.onError(new Error('The workflow has changed.'));
assert.deepEqual(notes[1], ['The workflow has changed.', true]);
const workspace = fs.readFileSync(path.join(__dirname, '../src/pages/risk/index.tsx'), 'utf8');
const statusLine = workspace.split('\n').find(line => line.includes("activePage === 'status' && updatePeriod"));
assert(statusLine.includes('loading={summaryQuery.isLoading}'));
assert(!statusLine.includes('loading={summaryQuery.isLoading || summaryQuery.isFetching}'), 'Background refresh must not unmount dialog/feedback.');
console.log('PASS: reminder request, persistent workspace success/error feedback and background-refresh dialog stability.');
