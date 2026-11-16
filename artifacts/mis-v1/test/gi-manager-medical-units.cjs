const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const output = {};
const jsx = (type, props) => ({ type, props: props || {} });
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/admin/gi-structure/manager-medical-units.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports: output,
  require(name) {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    throw Error(name);
  },
});
const snapshot = {
  nodes: [
    { id: 1, level: 'BRANCH', manager_id: 11, name: 'Branch A' },
    { id: 2, level: 'BRANCH', manager_id: 12, name: 'Branch B' },
    { id: 3, level: 'UNIT', manager_id: 10, parent_id: 1, name: 'GI Alpha' },
    { id: 4, level: 'UNIT', manager_id: 10, parent_id: 2, name: 'GI Beta' },
    { id: 5, level: 'UNIT', manager_id: 13, parent_id: 1, name: 'GI Gamma' },
    { id: 6, level: 'UNIT', manager_id: 14, parent_id: 2, name: 'GI Delta' },
  ],
  medical_units: [
    { code: 'M1', name: 'Medical Alpha', gi_unit_id: 3, mapping_available: true },
    { code: 'M2', name: 'Medical Beta', gi_unit_id: 3, mapping_available: false },
    { code: 'M3', name: 'Medical Gamma', gi_unit_id: 4, mapping_available: true },
    { code: 'M4', name: 'Medical Delta', gi_unit_id: 5, mapping_available: false },
    { code: 'M5', name: 'Removed mapping', gi_unit_id: null },
    { code: 'M6', name: 'Unrelated mapping', gi_unit_id: 6 },
  ],
};
const manager = { id: 10, level: 'UNIT', details: { GI_UNIT_CODE: 'MUST_NOT_INFER', GI_UM_NAME: 'Manager' }, source_unit_codes: ['MUST_NOT_INFER'] };
const original = JSON.stringify(snapshot);
let groups = output.managerMedicalUnitGroups(manager, snapshot);
assert.equal(groups.length, 2, 'A manager may cover several GI Units across Branches');
assert.equal(groups.reduce((n, group) => n + group.medicalUnits.length, 0), 3);
assert.equal(JSON.stringify(snapshot), original, 'Viewing must not mutate setup or mappings');
groups = output.managerMedicalUnitGroups({ id: 11, level: 'BRANCH' }, snapshot);
assert.equal(groups.length, 2, 'Coordinator sees child Units in assigned Branches only');
assert(groups.some(group => group.giUnit.id === 5));
assert(!groups.some(group => group.giUnit.id === 4));
function text(node) {
  if (node == null) return '';
  if (typeof node !== 'object') return String(node);
  if (Array.isArray(node)) return node.map(text).join(' ');
  return text(node.props?.children);
}
let rendered = text(output.ManagerMedicalUnits({ manager, snapshot }));
for (const name of ['Medical Alpha', 'Medical Beta', 'Medical Gamma', 'Operational', 'Setup only']) assert(rendered.includes(name));
assert(!rendered.includes('Removed mapping') && !rendered.includes('Unrelated mapping'));
snapshot.medical_units[0].gi_unit_id = 6;
assert(!text(output.ManagerMedicalUnits({ manager, snapshot })).includes('Medical Alpha'), 'Refreshed reassignment must update manager display');
assert(text(output.ManagerMedicalUnits({ manager: { id: 14, level: 'UNIT' }, snapshot })).includes('Unrelated mapping'));
snapshot.medical_units[5].gi_unit_id = null;
snapshot.medical_units[0].gi_unit_id = null;
assert(text(output.ManagerMedicalUnits({ manager: { id: 14, level: 'UNIT' }, snapshot })).includes('No Medical Units linked'));
assert(text(output.ManagerMedicalUnits({ manager: { id: 99, level: 'UNIT' }, snapshot })).includes('No GI Units are currently assigned'));
assert(text(output.ManagerMedicalUnits({ snapshot })).includes('Save the enrollment'));
console.log('PASS: Manager Medical Units follow current assignments, multiple teams, coordinator Branch scope, reassignment and empty states.');
