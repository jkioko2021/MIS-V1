const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const output = {};
const jsx = (type, props) => ({ type, props });
const file = name => fs.readFileSync(path.join(__dirname, '../src/pages/risk', name), 'utf8');
vm.runInNewContext(ts.transpileModule(file('risk-details.tsx'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: output,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (name === './risk-ui') return new Proxy({ dateLabel: value => value ?? '—', text: value => String(value ?? '—'), prettyKey: value => value }, { get: (target, key) => target[key] ?? key });
    return new Proxy({}, { get: (_, key) => key });
  },
});
const props = {
  riskCode: 'R1', risk: { risk_code: 'R1', risk_title: 'Saved risk', depart_code: 'A', workflow_status: 'CLOSED' },
  roots: [{ root_id: 1, root_cause: 'Saved root cause', mitigations: 'Saved action', action_status: 'Closed' }],
  events: [], loading: false, error: '', onClose() {},
};
const flatten = node => Array.isArray(node) ? node.flatMap(flatten)
  : node && typeof node === 'object' ? [node, ...flatten(node.props?.children)] : [];
const inline = output.RiskDrawer({ ...props, inline: true });
assert.equal(inline.type, 'section');
assert.equal(inline.props['data-testid'], 'inline-risk-record-details');
assert(!flatten(inline).some(node => ['Sheet', 'SheetContent'].includes(node.type) || node.props?.role === 'dialog'));
assert(!flatten(inline).some(node => ['input', 'textarea', 'select'].includes(node.type)));
assert(JSON.stringify(inline).includes('Saved root cause'));
assert(JSON.stringify(inline).includes('Saved action'));
assert(JSON.stringify(inline).includes('Assessment snapshot'));
assert.equal(output.RiskDrawer(props).type, 'Sheet', 'Other pages retain their existing detail drawer.');
assert(JSON.stringify(output.RiskDrawer({ ...props, inline: true, loading: true })).includes('SkeletonRows'));
assert(JSON.stringify(output.RiskDrawer({ ...props, inline: true, error: 'Not permitted' })).includes('Not permitted'));
const registers = file('risk-closed-registers.tsx');
assert.match(registers, /mode === 'history' \? InlineRegister : Modal/);
assert.match(registers, /if \(mode !== 'history'\) close\(\); onSelect/);
const workspace = file('index.tsx');
assert.match(workspace, /<RiskHistoryDetails key=\{selectedRiskCode\}/);
assert.match(workspace, /activePage !== 'history' && drawerOpen/);
assert.match(workspace, /data-testid="risk-register-split-view"/);
assert.match(workspace, /data-testid="risk-register-list-pane"/);
assert.match(workspace, /data-testid="risk-register-details-pane"/);
assert.match(workspace, /lg:grid-cols-\[minmax\(0,0.95fr\)_minmax\(0,1.05fr\)\]/);
assert.match(workspace, /lg:overflow-y-auto lg:overscroll-contain/);
assert.match(workspace, /window.matchMedia\('\(min-width: 1024px\)'\)/);
assert.match(workspace, /title="Select a risk"/);
console.log('PASS: two-pane read-only risk view, independent pane scrolling, selection placeholder, retained register list and unchanged drawers on other pages.');
