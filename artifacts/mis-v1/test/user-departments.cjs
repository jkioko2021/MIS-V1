const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const output = {};
const source = fs.readFileSync(path.join(__dirname, '../src/pages/admin/user-departments.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: output });
const choices = saved => Array.from(output.userDepartmentChoices(saved));
const baseline = choices();
assert(baseline.includes('Sales'));
assert.equal(new Set(baseline).size, baseline.length);
assert.deepEqual(choices('Sales'), baseline);
for (const saved of ['sales', 'Sales ', 'Legacy department', 'Risk & Compliance']) {
  const values = choices(saved);
  assert(values.includes(saved), 'An existing department must remain selectable');
  assert.equal(values.filter(value => value.trim().toLowerCase() === saved.trim().toLowerCase()).length, 1);
}
assert.deepEqual(choices(null), baseline);
assert.deepEqual(choices(''), baseline);
assert.deepEqual(choices(), baseline, 'Saved spelling must not mutate the standard department choices');
console.log('PASS: Sales is selectable; saved department names remain visible without duplicates or mutation.');
