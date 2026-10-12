const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-summary-order.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject });
const impacts = ['Catastrophic', 'Major', 'Moderate', 'Minor', 'Insignificant'];
const likelihoods = ['Certain', 'Likely', 'Possible', 'Unlikely', 'Rare'];
const factors = {
  impact_factors: impacts.map((label, index) => ({ code: `IMP_0${index + 1}`, label, factor: [100, 70, 50, 30, 10][index] })),
  likelihood_factors: likelihoods.map((label, index) => ({ code: `LIK_0${index + 1}`, label, factor: [.9, .65, .4, .2, .1][index] })),
};
const snapshot = (i, l) => ({ impact: {code: `IMP_0${6-i}`, label: impacts[5-i], ordinal: i}, likelihood: {code: `LIK_0${6-l}`, label: likelihoods[5-l], ordinal: l} });
const input = [
  { risk_code: 'R-10', i_rate: '70', l_rate: '.40', r_risk_exposure: '12.50' },
  { risk_code: 'R-null', i_rate: null, l_rate: null },
  { risk_code: 'R-high', i_rate: '100', l_rate: '.90', r_risk_exposure: '0.00' },
  { risk_code: 'R-low', i_rate: '10', l_rate: '.1', r_risk_exposure: '100.00' },
  { risk_code: 'R-2', i_rate: 'Major', l_rate: 'Possible', r_risk_exposure: '20.00' },
  { risk_code: 'R-blank', i_rate: ' ', l_rate: '.2' },
  { risk_code: 'R-invalid', i_rate: '4', l_rate: '5' },
  { risk_code: 'R-missing' },
  { risk_code: 'R-medium', i_rate: 'IMP_03', l_rate: 'LIK_03' },
];
for (const [code, i, l] of [['R-10',4,3],['R-high',5,5],['R-low',1,1],['R-2',4,3],['R-medium',3,3]]) {
  input.find(row => row.risk_code === code).ranking_snapshot = snapshot(i,l);
}
const before = JSON.stringify(input);
const ordered = exportsObject.orderRiskSummary(input, factors);
assert.equal(ordered.map(item => item.risk_code).join(','), 'R-high,R-2,R-10,R-medium,R-low,R-blank,R-invalid,R-missing,R-null');
assert.equal(JSON.stringify(input), before, 'Query cache order and saved values must not be mutated');
assert.equal(ordered.map(item => item.risk_ranking).join(','), 'Critical,High,High,Medium,Low,,,,');
assert.equal(ordered.map(item => item.risk_score).join(','), '25,12,12,9,1,,,,');
assert(ordered.every(record => record !== input.find(item => item.risk_code === record.risk_code)));
for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
  const row = exportsObject.orderRiskSummary([{ risk_code: 'matrix', ranking_snapshot: snapshot(5-i,5-j), i_rate: String(factors.impact_factors[i].factor), l_rate: String(factors.likelihood_factors[j].factor) }], factors)[0];
  assert.equal(row.risk_score, (5-i)*(5-j), `${impacts[i]} × ${likelihoods[j]}`);
}
for (let score = 1; score <= 25; score++) assert.equal(exportsObject.rankingForScore(score), score >= 15 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low');
for (const invalid of [0, 26, 1.5, Infinity, NaN]) assert.equal(exportsObject.rankingForScore(invalid), null);
const ambiguous = { ...factors, impact_factors: [...factors.impact_factors, { code: 'IMP_05', label: 'Insignificant', factor: 70 }] };
assert.equal(exportsObject.orderRiskSummary([{ risk_code: 'ambiguous', i_rate: '70', l_rate: '.9' }], ambiguous)[0].risk_score, null);
assert.equal(exportsObject.orderRiskSummary([], factors).length, 0);
const changed = { impact_factors: [{code:'IMP_01',label:'Renamed',factor:1}], likelihood_factors: [] };
assert.equal(JSON.stringify(exportsObject.orderRiskSummary(JSON.parse(before), changed)), JSON.stringify(ordered), 'Catalog renames, numeric changes and retirement cannot change saved order');
for (const legacy of [{i_rate:'100',l_rate:'.9'}, {i_rate:'IMP_01',l_rate:'Certain'}, {ranking_snapshot:{impact:null,likelihood:{ordinal:5}}}, {ranking_snapshot:snapshot(6,5)}]) {
  assert.equal(exportsObject.orderRiskSummary([{risk_code:'legacy',...legacy}],factors)[0].risk_score,null);
}
console.log('PASS: all 25 matrix combinations, exact ranking bands, score order/ties, historical/ambiguous ratings unranked, saved exposure data preserved.');
