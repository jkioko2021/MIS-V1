const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(
  path.resolve(__dirname, '../../../lib/api-client-react/src/generated/api.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: api, URLSearchParams,
  require(name) {
    if (name === '@tanstack/react-query') return {};
    if (name.endsWith('custom-fetch')) return { customFetch: async url => url };
    throw Error(name);
  },
});
for (const code of ['IN-8/24/-2466', 'IN-12/25/-2945', 'IN-4/26/-3069', 'INS02195']) {
  const prefix = `/api/intermediary/agents/${encodeURIComponent(code)}`;
  assert.equal(api.getGetIntermediaryUrl(code), prefix);
  assert.equal(api.getUpdateIntermediaryUrl(code), prefix);
  assert.equal(api.getActionIntermediaryUrl(code), `${prefix}/actions`);
  assert.equal(api.getRequestIntermediaryUploadUrl(code), `${prefix}/uploads`);
  assert.equal(api.getConfirmIntermediaryUploadUrl(code, 4), `${prefix}/documents/4/confirm`);
  assert.equal(api.getDownloadIntermediaryDocumentUrl(code, 4), `${prefix}/documents/4/download`);
  assert.equal(api.getAssignOrganisationAgentUrl(code), `/api/organisation/agents/${encodeURIComponent(code)}/unit`);
  assert.equal(api.getGetOrganisationAgentHistoryUrl(code), `/api/organisation/agents/${encodeURIComponent(code)}/history`);
  const requestPath = api.getGetIntermediaryUrl(code);
  assert.equal(decodeURIComponent(requestPath.split('/').at(-1)), code, 'Encoded route round-trips the exact identity');
}
assert.equal(api.getGetGiStructureUrl(), '/api/gi-structure');
assert.equal(api.getGetIntermediaryOptionsUrl(), '/api/intermediary/options');
assert.equal(api.getRecordAllocatedDocumentUploadUrl('R-10/26/-000003'),
  '/api/business/allocated/R-10%2F26%2F-000003/uploads');
console.log('PASS: agent details/edit/actions/documents/unit/history encode original slash identities once; static and business routes remain valid.');
