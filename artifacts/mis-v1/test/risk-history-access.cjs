const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-access.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exportsObject });
const { canAccessRiskPage, riskPageDepartments } = exportsObject;
const champion = { can_manage: false, champion_departments: ['A'], owner_departments: [] };
const owner = { can_manage: false, champion_departments: [], owner_departments: ['A', 'B'] };
assert.equal(canAccessRiskPage(champion, 'history'), true);
assert.deepEqual([...riskPageDepartments(champion, 'history')], ['A']);
assert.deepEqual([...riskPageDepartments(owner, 'history')], ['A', 'B']);
assert.deepEqual([...riskPageDepartments({ ...owner, champion_departments: ['A'] }, 'history')], ['A', 'B']);
assert.equal(canAccessRiskPage({ ...champion, champion_departments: [] }, 'history'), false);
assert.equal(canAccessRiskPage(undefined, 'history'), false);
assert.equal(riskPageDepartments({ ...owner, can_manage: true }, 'history'), null);
assert.deepEqual([...riskPageDepartments(champion, 'update')], ['A']);
assert.deepEqual([...riskPageDepartments(owner, 'review')], ['A', 'B']);
const workspace = fs.readFileSync(path.join(__dirname, '../src/pages/risk/index.tsx'), 'utf8');
assert.match(workspace, /\[historyPeriod, setHistoryPeriod\] = useState\(''\)/);
assert.match(workspace, /activePage === 'history' \? historyPeriod/);
assert.match(workspace, /All reporting periods/);
console.log('PASS: department-only register view, multi-department owners, management oversight and independent all-period history default.');
