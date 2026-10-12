const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
const compiled = ts.transpileModule(fs.readFileSync(`${__dirname}/../src/pages/risk/risk-workflow.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
vm.runInNewContext(compiled, {
  exports: exported,
  require(name) {
    if (name === 'react' || name === 'lucide-react' || name === './use-risk-register') return {};
    if (name === 'react/jsx-runtime') return {};
    if (name === './risk-ui') return {
      envelopeData: response => response?.data,
      envelopeError: response => response?.ok === false ? 'Denied' : undefined,
    };
    throw new Error(`Unexpected import: ${name}`);
  },
});
const scope = { username: 'champion', departCode: 'D', periodId: 1, ownerAssigned: true, enabled: true };
const data = { depart_code: 'D', period_id: 1, total_active_risks: 701, assessed_risks: 701, risks_missing_root_causes: 0 };
const query = { isSuccess: true, data: { ok: true, data } };
const ready = (q = {}, s = {}) => exported.submissionReadiness({ ...query, ...q }, { ...scope, ...s }).ready;
assert(ready(), 'Registers over 500 rows use complete counts, not list length');
for (const flag of ['isFetching', 'isLoading', 'isStale', 'isError', 'isPlaceholderData', 'mutating']) {
  assert(!ready({ [flag]: true }), `${flag} blocks previously successful readiness`);
}
for (const changed of [
  { assessed_risks: 700 }, { risks_missing_root_causes: 1 }, { depart_code: 'OTHER' }, { period_id: 2 },
  { assessed_risks: undefined }, { risks_missing_root_causes: undefined }, { assessed_risks: 702 },
  { total_active_risks: 0, assessed_risks: 0 }, { risks_missing_root_causes: -1 },
]) assert(!ready({ data: { ok: true, data: { ...data, ...changed } } }), JSON.stringify(changed));
assert(!ready({ data: undefined }));
assert(!ready({ data: { ok: false, data } }));
assert(!ready({}, { username: '' }));
assert(!ready({}, { ownerAssigned: false }));
assert(!ready({}, { enabled: false }));
assert(ready(), 'A fresh reassessment restores readiness');
const hooks = fs.readFileSync(`${__dirname}/../src/pages/risk/use-risk-register.ts`, 'utf8');
assert(hooks.includes('identityKey(username, getGetRiskRegisterReadinessQueryKey(departCode, periodId))'));
assert(hooks.includes("refetchOnMount: 'always'"));
assert(hooks.includes('onMutate:') && hooks.includes('onSettled:') && hooks.includes('cancelQueries'));
assert(!compiled.includes('RiskReadinessCheck'), 'Readiness must not fan out per-risk detail requests');
const hookExports = {};
const configurations = [];
const invalidations = [];
const cancellations = [];
let mutations = 0;
vm.runInNewContext(ts.transpileModule(hooks, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
  exports: hookExports,
  require(name) {
    if (name === '@tanstack/react-query') return {
      useIsMutating: () => mutations,
      useQueryClient: () => ({
        cancelQueries: async options => cancellations.push(options),
        invalidateQueries: async options => invalidations.push(options),
      }),
    };
    if (name === '@workspace/api-client-react') return {
      getGetRiskRegisterReadinessQueryKey: (d, p) => [`/api/risk-register/readiness/${d}/${p}`],
      useGetRiskRegisterReadiness: (d, p, options) => { configurations.push(options.query); return query; },
      useUpdateRiskRegisterRecord: options => options,
      useSaveRiskRegisterRootCause: options => options,
    };
    throw new Error(name);
  },
});
hookExports.useRiskReadiness('alice', 'D', 1);
hookExports.useRiskReadiness('bob', 'D', 1);
hookExports.useRiskReadiness('alice', 'OTHER', 2);
assert.notEqual(JSON.stringify(configurations[0].queryKey), JSON.stringify(configurations[1].queryKey), 'Users cannot share cached readiness');
assert.notEqual(JSON.stringify(configurations[0].queryKey), JSON.stringify(configurations[2].queryKey), 'Departments and periods have independent readiness');
mutations = 1;
hookExports.useRiskReadiness('alice', 'D', 1);
assert.equal(configurations.at(-1).enabled, false, 'Readiness queries pause during writes');
assert.equal(configurations[0].gcTime, 0);
assert.equal(configurations[0].refetchOnMount, 'always');
(async () => {
  for (const options of [hookExports.useUpdateRisk(), hookExports.useSaveRiskCause()]) {
    await options.mutation.onMutate();
    await options.mutation.onSuccess();
    await options.mutation.onSettled();
  }
  const readinessQuery = { queryKey: ['/api/risk-register/readiness/D/1', 'actor', 'alice'] };
  const otherQuery = { queryKey: ['/api/unrelated'] };
  assert(cancellations.every(options => options.predicate(readinessQuery) && !options.predicate(otherQuery)));
  assert(invalidations.every(options => options.predicate(readinessQuery) && !options.predicate(otherQuery)));
  assert.equal(invalidations.filter(options => options.refetchType === 'none').length, 2);
  console.log('PASS: complete scoped counts, refreshed assessments, fail-closed states, identity-isolated caches and assessment/root-cause invalidation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
