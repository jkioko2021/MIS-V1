const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '../src/pages/risk');
const output = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'current-open-period.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, output);
const { currentOpenPeriod, nextOpenPeriod } = output.exports;
const periods = [
  { period_id: 3, period_from: '2026-07-01', status: 'CLOSED' },
  { period_id: 1, period_from: '2026-01-01', status: 'OPEN' },
  { period_id: 2, period_from: '2026-04-01', status: 'OPEN' },
];
assert.equal(currentOpenPeriod(periods).period_id, 2, 'Use latest open, not newest closed or first returned.');
assert.equal(periods[0].period_id, 3, 'Do not reorder shared options.');
assert.equal(currentOpenPeriod([]), undefined);
assert.equal(currentOpenPeriod([periods[0]]), undefined, 'No all-period fallback.');
assert.equal(currentOpenPeriod([{ period_id: 4, status: 'open' }]).period_id, 4);
const source = fs.readFileSync(path.join(root, 'index.tsx'), 'utf8');
assert.match(source, /!currentPeriodOnly \|\| updatePeriod/, 'Disable unscoped requests without an open period.');
assert.match(source, /activePage === 'update' && updatePeriod && <section/);
assert.match(source, /disabled=\{currentPeriodOnly\}/);
assert.match(source, /\['update', 'review', 'summary', 'close'\]/);
assert.match(source, /activePage === 'open' \? ''/, 'Do not filter closed sources by the target period.');
assert.match(source, /linkedScope.period !== period/, 'Reject stale review links instead of reviewing the wrong period.');
assert.equal(nextOpenPeriod(periods, '2025-12-31').period_id, 1);
assert.equal(nextOpenPeriod(periods, '2026-03-31').period_id, 2);
assert.equal(nextOpenPeriod(periods, '2026-06-30'), undefined);
assert.match(source, /activePage === 'history' \? historyPeriod/);
console.log('Current open reporting period checks passed.');
