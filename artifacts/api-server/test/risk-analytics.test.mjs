import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
const bundled=await build({entryPoints:[new URL("../src/lib/risk-analytics.ts",import.meta.url).pathname],bundle:true,write:false,format:"esm",platform:"node",target:"node22"});
const {buildRiskAnalytics,matrixBand}=await import("data:text/javascript;base64,"+Buffer.from(bundled.outputFiles[0].text).toString("base64"));
const row=(overrides={})=>({
  risk_code:"R1",risk_title:"Assessment",depart_code:"D1",depart_name:"Finance",risk_category:"C1",category_name:"Operational",
  period_id:1,workflow_status:"REVIEWED",assessment_updated:true,risk_status:"Open",r_risk_exposure:"12.50",
  open_actions:2,overdue_actions:1,behind_schedule_count:1,
  ranking_snapshot:{impact:{code:"IMP_01",label:"Saved impact",ordinal:5},likelihood:{code:"LIK_02",label:"Saved likelihood",ordinal:3}},...overrides,
});
test("heatmap follows saved matrix ordinals, score thresholds and distinct exposure arithmetic",()=>{
  const data=buildRiskAnalytics([row()],"all");
  assert.equal(data.totals.critical_risks,1);
  assert.equal(data.totals.avg_residual_exposure,12.5);
  assert.equal(data.priorities[0].risk_score,15);
  assert.equal(data.heatmap.find(c=>c.impact===5&&c.likelihood===3).count,1);
  assert.equal(data.heatmap.length,25);
  assert.deepEqual([1,4,5,9,10,14,15,25].map(matrixBand),["Low","Low","Medium","Medium","High","High","Critical","Critical"]);
});
test("unassessed and ambiguous historical factors are disclosed, never fabricated or inferred from calibrated rates",()=>{
  const data=buildRiskAnalytics([row({assessment_updated:false}),row({risk_code:"R2",ranking_snapshot:null,i_rate:100,l_rate:0.9}),
    row({risk_code:"R3",ranking_snapshot:{impact:{ordinal:"5"},likelihood:{ordinal:3}}}),
    row({risk_code:"R4",ranking_snapshot:{impact:{ordinal:5.1},likelihood:{ordinal:3}}})],"all");
  assert.equal(data.totals.ranked_risks,0);
  assert.equal(data.totals.unranked_risks,4);
  assert.equal(data.totals.assessed_risks,3);
  assert.equal(data.heatmap.reduce((sum,c)=>sum+c.count,0),0);
});
test("all 25 cells have consistent axes and counts; totals exceed the register's 500-row display cap",()=>{
  const rows=Array.from({length:625},(_,i)=>row({risk_code:`R${i}`,ranking_snapshot:{impact:{ordinal:i%5+1},likelihood:{ordinal:Math.floor(i/5)%5+1}}}));
  const data=buildRiskAnalytics(rows,"all");
  assert.equal(data.totals.total_risks,625);
  assert.equal(data.totals.ranked_risks,625);
  assert(data.heatmap.every(c=>c.count===25&&c.score===c.impact*c.likelihood));
  assert.equal(data.priorities.length,20);
  assert.equal(data.priorities[0].risk_score,25);
  assert.equal(data.workflows.reduce((sum,w)=>sum+w.count,0),1);
});
test("population excludes closed actions without conflating action status and register status",()=>{
  const rows=[row({risk_status:"Closed",workflow_status:"SUBMITTED"}),row({risk_code:"R2",workflow_status:"SIGNED_OFF"})];
  assert.equal(buildRiskAnalytics(rows,"open").totals.total_risks,1);
  assert.equal(buildRiskAnalytics(rows,"all").totals.closed_risks,1);
  assert.equal(buildRiskAnalytics(rows,"open").workflows.find(w=>w.name==="SIGNED_OFF").count,1);
});
test("empty analytics and missing exposure values remain explicit",()=>{
  const empty=buildRiskAnalytics([],"open");
  assert.equal(empty.totals.total_risks,0);
  assert.equal(empty.totals.avg_residual_exposure,null);
  assert.equal(empty.heatmap.length,25);
  assert.equal(buildRiskAnalytics([row({r_risk_exposure:null})],"all").totals.avg_residual_exposure,null);
  assert.equal(buildRiskAnalytics([row({r_risk_exposure:0})],"all").totals.avg_residual_exposure,0);
});

test("department top ten uses its full dataset, never the overall top twenty",()=>{
  const rows=[
    ...Array.from({length:25},(_,i)=>row({risk_code:`A${i}`,ranking_snapshot:{impact:{ordinal:5},likelihood:{ordinal:5}}})),
    ...Array.from({length:13},(_,i)=>row({risk_code:`B${i}`,depart_code:"D2",depart_name:"Claims",
      ranking_snapshot:{impact:{ordinal:2},likelihood:{ordinal:2}}})),
    row({risk_code:"B-old",depart_code:"D2",depart_name:"Claims",ranking_snapshot:null}),
  ];
  const data=buildRiskAnalytics(rows,"all");
  assert.equal(data.top_ten_overall.length,10);
  assert(data.top_ten_overall.every(r=>r.depart_code==="D1"&&r.risk_score===25));
  assert(data.priorities.every(r=>r.depart_code==="D1"));
  const claims=data.top_ten_departments.find(d=>d.depart_code==="D2");
  assert.equal(claims.total_ranked,13);
  assert.equal(claims.total_unranked,1);
  assert.equal(claims.risks.length,10);
  assert.deepEqual(claims.risks.map(r=>r.risk_code),Array.from({length:10},(_,i)=>`B${i}`));
  const filtered=buildRiskAnalytics(rows,"all",new Date(),"D2");
  assert.equal(filtered.totals.total_risks,14);
  assert.equal(filtered.overall_ranked_count,38);
  assert.equal(filtered.overall_unranked_count,1);
  assert.deepEqual(filtered.top_ten_overall,data.top_ten_overall);
  assert.deepEqual(filtered.top_ten_departments,[claims]);
});

test("top ten excludes unknown scores, respects population, and never pads short lists",()=>{
  const rows=[row({risk_code:"Open"}),row({risk_code:"Closed",risk_status:"Closed"}),
    row({risk_code:"Historical",ranking_snapshot:null}),row({risk_code:"Unsaved",assessment_updated:false})];
  const data=buildRiskAnalytics(rows,"open");
  assert.deepEqual(data.top_ten_overall.map(r=>r.risk_code),["Open"]);
  assert.equal(data.overall_ranked_count,1);
  assert.equal(data.overall_unranked_count,2);
  assert.equal(data.top_ten_departments[0].risks.length,1);
  assert.equal(data.top_ten_departments[0].total_unranked,2);
  assert.equal(buildRiskAnalytics(rows,"all").top_ten_overall.length,2);
  const empty=buildRiskAnalytics([],"all");
  assert.deepEqual(empty.top_ten_overall,[]);
  assert.deepEqual(empty.top_ten_departments,[]);
});

test("equal-score ordering uses action attention followed by a deterministic natural risk-code order",()=>{
  const rows=[
    row({risk_code:"R10",behind_schedule_count:0,overdue_actions:0}),
    row({risk_code:"R2",behind_schedule_count:0,overdue_actions:0}),
    row({risk_code:"R3",behind_schedule_count:0,overdue_actions:2}),
    row({risk_code:"R4",behind_schedule_count:1,overdue_actions:0}),
  ];
  const data=buildRiskAnalytics(rows,"all");
  assert.deepEqual(data.top_ten_overall.map(r=>r.risk_code),["R4","R3","R2","R10"]);
  assert.deepEqual(data.top_ten_departments[0].risks,data.top_ten_overall);
});
