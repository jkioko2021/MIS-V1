import assert from "node:assert/strict";
import { planManagerEnrollmentDrafts } from "../src/manager-enrollment-draft-plan.mjs";
const sources=[
  {id:1,catalog:"unit-managers",row_sha256:"um-hash",data:{HRMIS_CODE:"000123",H_TAX:"0.100",VALID_FROM:"2026-01-01",VALID_TO:"2027-12-31"}},
  {id:2,catalog:"gi-unit-managers",row_sha256:"gi-hash",data:{HRMIS_CODE:"000123",VALID_FROM:"2026-01-01",VALID_TO:"2027-12-31"}},
  {id:3,catalog:"regional-managers",row_sha256:"rm-hash",data:{HRMIS_CODE:"NULL",VALID_FROM:"2026-01-01",VALID_TO:"2027-12-31"}},
];
const users=[{employee_id:101,emp_code:"EMP_101",employee_name:"Verified manager",email:"verified@example.test",
  department:"Sales",profile_name:"Sales Manager",profile_active:true,is_deleted:false}];
const identities=[{identity_key:"verified",employee_id:101}];
const links=sources.map(source=>({source_record_id:source.id,source_row_sha256:source.row_sha256,identity_key:"verified"}));
const snapshot=JSON.stringify({sources,users,identities,links});
const plan=planManagerEnrollmentDrafts(sources,links,identities,users);
assert.equal(plan.enrollments.length,2,"One person has one enrollment per category, not per source row or domain");
assert.equal(plan.held.length,0);
const unit=plan.enrollments.find(row=>row.level==="UNIT"),region=plan.enrollments.find(row=>row.level==="REGION");
assert.equal(unit.is_active,false);
assert.equal(unit.details.code,"EMP_101");assert.equal(unit.details.mis_emp_code,"EMP_101");
assert.equal(unit.details.hrmis_code,"000123");assert.equal(unit.details.h_tax,"0.100");
assert.equal(unit.details.mobile_no,"");assert.equal(region.details.h_tax,"");assert.equal(region.details.hrmis_code,"");
assert.deepEqual(unit.sources.map(row=>row.source_domain),["MEDICAL","GI"]);
const conflict=planManagerEnrollmentDrafts([...sources,{...sources[0],id:4,data:{...sources[0].data,H_TAX:"0.200"}}],
  [...links,{...links[0],source_record_id:4}],identities,users);
assert.equal(conflict.enrollments[0].details.h_tax,"");
assert(conflict.enrollments[0].conflicts.includes("H_TAX"),"Conflicting values stay blank rather than choosing one");
assert.equal(planManagerEnrollmentDrafts(sources,[],identities,users).held.length,3);
assert.equal(planManagerEnrollmentDrafts(sources,links.map(row=>({...row,source_row_sha256:"stale"})),identities,users).held.length,3);
assert.equal(JSON.stringify({sources,users,identities,links}),snapshot,"Planning cannot change source rows or user identities");
console.log("PASS: inactive drafts, canonical MIS codes, exact provided values, blank missing/conflicting fields, separate source provenance and no duplicate categories.");
