const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
function compiled(name) {
  return ts.transpileModule(fs.readFileSync(path.join(__dirname, `../src/pages/risk/${name}.tsx`), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
}
function gate({ records, statuses, fetching = false, expected = records.length }) {
  const exported = {};
  let result;
  let resets = 0;
  vm.runInNewContext(compiled('risk-workflow'), {
    exports: exported,
    require(name) {
      if (name === 'react') return { useState: () => [statuses, () => { resets++; }], useMemo: fn => fn(), useEffect: fn => fn() };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === './use-risk-register') return { useRiskRecords: () => ({ data: { data: records }, isFetching: fetching }) };
      if (name === './risk-ui') return { envelopeData: response => response?.data, envelopeError: () => undefined };
      if (name === 'lucide-react' || name === 'recharts') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  exported.RiskSubmissionGate({ username: 'champion', departCode: 'D', periodId: 1, ownerAssigned: true, enabled: true, expectedRiskCount: expected, onReady: (ready, label) => { result = { ready, label }; } });
  return { ...result, resets };
}
const records = [{ risk_code: 'R1', assessment_updated: true }, { risk_code: 'R2', assessment_updated: true }];
const readyStatuses = { R1: 'ready', R2: 'ready' };
assert(gate({ records, statuses: readyStatuses }).ready);
assert(gate({ records: records.map(row => ({ ...row })), statuses: readyStatuses }).ready, 'A refreshed list must retain verified detail statuses');
assert.equal(gate({ records, statuses: readyStatuses }).resets, 0, 'Do not clear child statuses when their state has not changed');
assert(!gate({ records, statuses: readyStatuses, fetching: true }).ready);
assert(!gate({ records, statuses: { R1: 'ready', R2: 'missing' } }).ready, 'Missing root cause blocks submission');
assert(!gate({ records, statuses: { R1: 'ready', R2: 'error' } }).ready);
assert(!gate({ records, statuses: readyStatuses, expected: 3 }).ready, 'A partial list cannot submit');
assert(!gate({ records: [{ ...records[0], assessment_updated: false }, records[1]], statuses: readyStatuses }).ready, 'Fresh record flags override older detail readiness');
assert(!gate({ records: [], statuses: {} }).ready);
console.log('PASS: all-risk readiness survives list refresh, blocks incomplete/rootless/partial/error/empty registers and waits for fresh queries.');
