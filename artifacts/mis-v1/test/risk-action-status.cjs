const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
const jsx = (type, props) => ({ type, props });
const source = fs.readFileSync(`${__dirname}/../src/pages/risk/risk-ui.tsx`, 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
  exports: exported,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'lucide-react') return {};
    throw new Error(`Unexpected dependency ${name}`);
  },
});
function render(node) {
  if (typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(render).join('');
  if (!node || typeof node !== 'object') return String(node ?? '');
  if (typeof node.type === 'function') return render(node.type(node.props));
  return render(node.props.children);
}
assert.equal(render(exported.StatusPill({ status: 'Behind schedule' })), 'Behind schedule · At risk');
assert.match(exported.StatusPill({ status: 'Behind schedule' }).props.className, /rose/);
assert.equal(render(exported.RiskStatusPill({ risk: { risk_status: 'Open', at_risk: true, behind_schedule_count: 2 } })), 'OpenAt risk');
assert.equal(render(exported.RiskStatusPill({ risk: { risk_status: 'Closed', at_risk: false } })), 'Closed');
assert.equal(render(exported.RiskStatusPill({ risk: { risk_status: 'Open', at_risk: false } })), 'Open');
assert.equal(render(exported.RiskStatusPill({ risk: {} })), 'Open', 'Unknown/no-root risks are never inferred closed');
console.log('PASS: root Behind schedule is flagged At risk; aggregate risk status and attention flag stay distinct.');
