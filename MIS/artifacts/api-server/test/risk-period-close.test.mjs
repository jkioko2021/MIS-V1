import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { build } from "esbuild";

const requireWeb=createRequire(new URL("../../mis-v1/package.json",import.meta.url));
const {createElement}=requireWeb("react");
const {renderToStaticMarkup}=requireWeb("react-dom/server");
const compiled=await build({
  entryPoints:["../mis-v1/src/pages/risk/risk-workflow.tsx"],bundle:true,write:false,
  format:"cjs",platform:"node",target:"node22",jsx:"automatic",
  plugins:[{name:"test-dependencies",setup(builder){
    builder.onResolve({filter:/^react(?:\/.*)?$/},args=>({path:requireWeb.resolve(args.path),external:true}));
    builder.onResolve({filter:/^\.\/use-risk-register$/},()=>({path:"readiness",namespace:"test-stub"}));
    builder.onLoad({filter:/.*/,namespace:"test-stub"},()=>({contents:"export function useRiskReadiness(){throw new Error('Unexpected readiness call in period close test')}"}));
  }}],
});
const module={exports:{}};
Function("require","module","exports",compiled.outputFiles[0].text)(requireWeb,module,module.exports);
const row=status=>({depart_code:status,depart_name:status,workflow_status:status,total_risks:3,period_id:123});
const html=overrides=>renderToStaticMarkup(createElement(module.exports.ReportingPeriodClose,{
  periods:[{period_id:123,status:"OPEN",period_from:"2100-01-01",period_to:"2100-12-31"}],
  summaries:[row("SIGNED_OFF"),row("SUBMITTED"),row("CLOSED")],selectedPeriod:"123",
  comments:"Approved closure",manage:true,mutating:false,summaryLoading:false,summaryError:"",
  setSelectedPeriod:()=>{},setComments:()=>{},onClose:()=>{},...overrides,
}));
test("period closure is enabled for signed registers even when other departments are unsigned",()=>{
  const markup=html({});
  assert.doesNotMatch(markup,/<button[^>]*\sdisabled=""/);
  assert.match(markup,/1 Signed-OFF register will be closed/);
  assert.match(markup,/1 unsigned register will remain unchanged/);
  assert.match(markup,/period will remain open/);
  assert.match(markup,/regardless of the department filter/);
});
test("no signed registers, missing comments, loading, errors, closed period and unauthorized roles block closure",()=>{
  for(const props of [
    {summaries:[row("CLOSED"),row("OPEN")]},{comments:""},{summaryLoading:true},
    {summaryError:"Cannot verify registers"},{manage:false},{mutating:true},
    {periods:[{period_id:123,status:"CLOSED"}]},
  ]) assert.match(html(props),/<button[^>]*\sdisabled=""/);
});
test("Close page contains the full-period signed table and batch action, without risk details or workflow actions",async()=>{
  const source=await readFile(new URL("../../mis-v1/src/pages/risk/index.tsx",import.meta.url),"utf8");
  const start=source.indexOf("{activePage === 'close'");
  const section=source.slice(start,source.indexOf("{activePage === 'import'",start));
  assert.match(section,/allDepartmentPeriodSummaries\.filter\(row => row\.workflow_status === 'SIGNED_OFF'\)/);
  assert.match(section,/<ReportingPeriodClose/);
  assert.doesNotMatch(section,/RiskAssessmentSummary|WorkflowPanel|Revert Back|closeSelection/);
  assert.match(source,/activePage !== 'open' \|\| item\.workflow_status === 'CLOSED'/);
});
