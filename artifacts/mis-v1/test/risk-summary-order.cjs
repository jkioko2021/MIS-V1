const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-summary-order.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject });
const input = [
  { risk_code: 'R-10', r_risk_exposure: '12.50' },
  { risk_code: 'R-null', r_risk_exposure: null },
  { risk_code: 'R-high', r_risk_exposure: '100.00', assessment_updated: false },
  { risk_code: 'R-zero', r_risk_exposure: '0.00' },
  { risk_code: 'R-2', r_risk_exposure: '12.50' },
  { risk_code: 'R-blank', r_risk_exposure: ' ' },
  { risk_code: 'R-invalid', r_risk_exposure: 'bad' },
  { risk_code: 'R-missing' },
  { risk_code: 'R-small', r_risk_exposure: '2.50' },
];
const before = JSON.stringify(input);
const ordered = exportsObject.orderRiskSummary(input);
assert.equal(ordered.map(item => item.risk_code).join(','), 'R-high,R-2,R-10,R-small,R-zero,R-blank,R-invalid,R-missing,R-null');
assert.equal(JSON.stringify(input), before, 'Query cache order and saved values must not be mutated');
assert.equal(exportsObject.orderRiskSummary([]).length, 0);
console.log('PASS: descending numeric residual order, deterministic risk-code ties, missing/invalid values last, saved values and input order preserved.');
