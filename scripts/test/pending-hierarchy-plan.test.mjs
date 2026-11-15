import assert from "node:assert/strict";
import { planPendingHierarchy } from "../src/pending-hierarchy-plan.mjs";
const manager={id:11,catalog:"regional-managers",code:" RM_01 ",row_sha256:"manager-hash",data:{}};
const region={id:1,catalog:"sales-regions",code:"REG_01",row_sha256:"region-hash",data:{REGION_MGR_ID:"rm_01"}};
const unitManager={...manager,id:12,catalog:"unit-managers",code:"UM_01"};
const unit={...region,id:2,catalog:"sales-units",data:{UNIT_MGR_ID:"um_01"}};
const branch={...region,id:3,catalog:"sales-branches",data:{BRANCH_MGR_ID:"must-not-be-assigned"}};
const sources=[region,unit,branch,manager,unitManager];
const links=[11,12].map(id=>({source_record_id:id,source_row_sha256:"manager-hash",identity_key:"verified"}));
const identities=[{identity_key:"verified",employee_id:101}];
const user={employee_id:101,activated:true,approved:true,employee_locked:false,is_deleted:false,
  department:"Sales",profile_name:"Sales Manager",profile_active:true};
const plan=(s=sources,l=links,i=identities,u=[user])=>planPendingHierarchy(s,l,i,u);
assert.deepEqual(plan().map(row=>row.manager_link_status),["MATCHED","MATCHED","NOT_REQUIRED"]);
assert.equal(plan()[0].manager_employee_id,101);
assert.equal(plan()[1].manager_employee_id,101,"A manager can be linked to multiple teams");
assert.equal(plan()[2].manager_employee_id,null);
assert.equal(plan()[2].branch_approved,true);
assert.deepEqual(plan()[2].manager_sources,[],"Branch approval never assigns a manager");
for(const changed of [
  {activated:false},{approved:false},{employee_locked:true},{is_deleted:true},
  {department:"Finance"},{profile_name:"Business Entry"},{profile_active:false},
])assert.equal(plan(sources,links,identities,[{...user,...changed}])[0].manager_link_status,"UNRESOLVED");
assert.equal(plan(sources,[])[0].manager_link_status,"UNRESOLVED");
assert.equal(plan(sources,links.map(link=>({...link,source_row_sha256:"changed"})))[0].manager_link_status,"UNRESOLVED");
assert.equal(plan([{...region,data:{REGION_MGR_ID:"NULL"}},manager])[0].manager_link_status,"UNRESOLVED");
assert.equal(plan([{...region,data:{REGION_MGR_ID:"missing"}},manager])[0].manager_link_status,"UNRESOLVED");
const duplicate={...manager,id:13};
assert.equal(plan([...sources,duplicate])[0].manager_link_status,"UNRESOLVED","Unverified duplicate references cannot be ignored");
const duplicateLinks=[...links,{...links[0],source_record_id:13}];
assert.equal(plan([...sources,duplicate],duplicateLinks)[0].manager_link_status,"MATCHED","Duplicate source rows are safe only when every row resolves to the same verified account");
assert.equal(plan([...sources,duplicate],duplicateLinks.map(link=>link.source_record_id===13?{...link,identity_key:"other"}:link),
  [...identities,{identity_key:"other",employee_id:102}],[user,{...user,employee_id:102}])[0].manager_link_status,"UNRESOLVED");
console.log("PASS: exact source references, provenance, eligibility, ambiguity, multiple teams and managerless Branch setup approval.");
