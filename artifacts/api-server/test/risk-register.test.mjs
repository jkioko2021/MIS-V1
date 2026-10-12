import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

let dir, risk;
before(async()=>{
  dir=await mkdtemp(path.join(tmpdir(),"mis-risk-tests-"));
  await build({
    entryPoints:[path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../src/lib/risk-register.ts")],
    outfile:path.join(dir,"risk.mjs"),bundle:true,platform:"node",format:"esm",logLevel:"silent",
    banner:{js:'import { createRequire } from "node:module"; const require=createRequire(import.meta.url);'},
    plugins:[{name:"risk-unit-db-double",setup(b){
      b.onResolve({filter:/^\.\/postgres$/},()=>({
        path:path.resolve(path.dirname(fileURLToPath(import.meta.url)),"doubles/risk-deps.mjs"),
      }));
    }}],
  });
  risk=await import(pathToFileURL(path.join(dir,"risk.mjs")).href);
});
after(async()=>{await rm(dir,{recursive:true,force:true});});
const champion={username:"test",is_admin:false,is_manager:false,champion_departments:["D-A"],owner_departments:[]};
const owner={...champion,champion_departments:[],owner_departments:["D-A"]};
const manager={...champion,is_manager:true};

test("legacy inherent and residual formula uses fractional control effectiveness",()=>{
  assert.deepEqual(risk.calculateRisk(4,5,.25),{inherent:20,residual:15});
  assert.deepEqual(risk.calculateRisk(4,5,1),{inherent:20,residual:0});
  assert.deepEqual(risk.calculateRisk(4,5,0),{inherent:20,residual:20});
  assert.deepEqual(risk.calculateRisk(4,5,.3333),{inherent:20,residual:13.33});
});
test("department scope is enforced separately for champion, owner, and management",()=>{
  assert.equal(risk.canViewDepartment(champion,"D-A"),true);
  assert.equal(risk.canViewDepartment(champion,"D-B"),false);
  assert.throws(()=>risk.assertDepartment(champion,"D-B"),/permission/);
  assert.throws(()=>risk.assertDepartment(owner,"D-A","edit"),/permission/);
  assert.throws(()=>risk.assertDepartment(champion,"D-A","review"),/permission/);
  assert.doesNotThrow(()=>risk.assertDepartment(owner,"D-A","review"));
  assert.doesNotThrow(()=>risk.assertDepartment(manager,"D-B","manage"));
});
test("reviewers can correct submitted assessments but not signed or closed records",()=>{
  assert.doesNotThrow(()=>risk.assertRecordEditable({},champion,"D-A"));
  assert.throws(()=>risk.assertRecordEditable({submitted:true},champion,"D-A"),/not editable/);
  assert.doesNotThrow(()=>risk.assertRecordEditable({submitted:true},owner,"D-A"));
  assert.throws(()=>risk.assertRecordEditable({submitted:true,reviewed:true},owner,"D-A"),/not editable/);
  assert.throws(()=>risk.assertRecordEditable({closed:true},manager,"D-A"),/not editable/);
});
test("state precedence never presents closed or signed assessments as editable",()=>{
  assert.equal(risk.workflowState({}),"OPEN");
  assert.equal(risk.workflowState({submitted:true}),"SUBMITTED");
  assert.equal(risk.workflowState({submitted:true,reviewed:true}),"REVIEWED");
  assert.equal(risk.workflowState({sign_off:true}),"SIGNED_OFF");
  assert.equal(risk.workflowState({closed:true,sign_off:true}),"CLOSED");
});
test("stale changes are rejected even if date representations differ",()=>{
  assert.doesNotThrow(()=>risk.assertFresh(new Date("2030-01-01T00:00:00Z"),"2030-01-01T03:00:00+03:00"));
  assert.throws(()=>risk.assertFresh(new Date("2030-01-01T00:00:00Z"),"2030-01-01T00:00:01Z"),/Refresh/);
  assert.throws(()=>risk.assertFresh("2030-01-01T00:00:00.123457Z","2030-01-01T00:00:00.123456Z"),/Refresh/);
});
test("calendar validation rejects rollover dates but supports leap years",()=>{
  assert.equal(risk.calendarDate.safeParse("2030-02-30").success,false);
  assert.equal(risk.calendarDate.safeParse("2032-02-29").success,true);
  assert.equal(risk.calendarDate.safeParse("2030-02-29").success,false);
});
test("assessment validation rejects uncalibrated control codes and excess precision",()=>{
  const valid={depart_code:"D-A",period_id:1,objective_code:"O-1",risk_title:"Test risk",
    risk_description:"Test",risk_category:"C-1",risk_consequence:"Test",
    i_rate:4,l_rate:5,control_effectiveness:.3333,comments:"Assessment updated",
    expected_updated_at:"2030-01-01T00:00:00Z"};
  assert.equal(risk.assessmentInput.safeParse(valid).success,true);
  assert.equal(risk.assessmentInput.safeParse({...valid,control_effectiveness:3}).success,false);
  assert.equal(risk.assessmentInput.safeParse({...valid,i_rate:1.001}).success,false);
  assert.equal(risk.assessmentInput.safeParse({...valid,i_rate:0}).success,false);
  assert.equal(risk.assessmentInput.safeParse({...valid,comments:" "}).success,false);
});
test("risk data responses cannot enter a shared or persistent browser cache",()=>{
  const headers={},res={setHeader:(key,value)=>{headers[key]=value;},vary:value=>{headers.Vary=value;}};
  let next=false;
  risk.privateRiskResponses({},res,()=>{next=true;});
  assert.equal(headers["Cache-Control"],"private, no-store");
  assert.equal(headers.Vary,"Cookie");
  assert.equal(next,true);
});
