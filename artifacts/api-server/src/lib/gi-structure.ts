import type { GiNodeInput, GiManagerInput, GiMappingInput, GiMappingRemoval } from "@workspace/api-zod";
import { withTransaction } from "./postgres";
import { salesSetupTransaction, SalesSetupError } from "./sales-structure";
import { checkGiManagerDetails } from "./gi-manager-details";
import { giAudit, giManagersSql, giMedicalUnits, giNodes, giSnapshotData, requireGiAdmin, type GiActor } from "./gi-structure-data";

const fail=(message:string):never=>{throw new SalesSetupError(400,message);};
const conflict=():never=>{throw new SalesSetupError(409,"This record changed. Refresh and review the latest details before saving.");};
const reasonRequired=(reason:string)=>{
  if(reason.trim().length<3||reason.length>1000)fail("Enter a change reason of 3 to 1000 characters.");
};
export async function giStructureSnapshot(actor:GiActor){
  return withTransaction(async client=>{
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireGiAdmin(client,actor);return giSnapshotData(client);
  });
}
export async function saveGiNode(input:GiNodeInput,actor:GiActor){
  return salesSetupTransaction(async client=>{
    await requireGiAdmin(client,actor);reasonRequired(input.reason);
    const before=input.id?(await giNodes(client)).find(n=>n.id===input.id):undefined;
    if(input.id&&!before)throw new SalesSetupError(404,"GI hierarchy entry not found.");
    if((before?.version??0)!==input.version)conflict();
    if(!input.name.trim())fail("A name is required.");
    if(before&&(before.code!==input.code||before.level!==input.level))fail("GI code and hierarchy level cannot change.");
    if(input.level==='BRANCH'&&input.parent_id!==null)fail("A GI Branch is a root and has no parent.");
    const nodes=await giNodes(client);
    const parent=nodes.find(n=>n.id===input.parent_id);
    if(input.parent_id!==null&&(!parent||parent.level!=='BRANCH'||input.level!=='UNIT'))
      fail("Select a GI Branch as the Unit parent.");
    if(parent?.status==='INACTIVE'&&before?.parent_id!==parent.id)fail("An inactive GI Branch cannot receive new Units.");
    const manager=input.manager_id?(await client.query(`${giManagersSql} WHERE m.id=$1`,[input.manager_id])).rows[0]:null;
    if(input.manager_id!==null&&(!manager||manager.level!==input.level))fail("Select an enrolled GI manager of the same category.");
    if(input.status==='ACTIVE'){
      if(input.level==='UNIT'&&(!parent?.available||!manager))fail("An active GI Unit needs an available GI Branch and Unit Manager.");
      if(manager&&!manager.user_eligible)fail("The assigned manager must be active, eligible and within their enrollment validity dates.");
    }
    if(before&&before.parent_id!==input.parent_id){
      const mapped=await client.query("SELECT 1 FROM crm.gi_medical_unit_mappings WHERE gi_unit_id=$1 LIMIT 1",[before.id]);
      if(mapped.rowCount)fail("Unmap the linked Medical Units before moving this GI Unit to a different Branch. Mapping history is retained.");
    }
    if(before&&input.status==='INACTIVE'&&before.status!=='INACTIVE'){
      const linked=await client.query(`SELECT 1 FROM crm.gi_medical_unit_mappings WHERE gi_unit_id=$1
        UNION ALL SELECT 1 FROM crm.gi_structure_nodes WHERE parent_id=$1 AND status='ACTIVE' LIMIT 1`,[before.id]);
      if(linked.rowCount)fail("Remove Medical mappings or deactivate active child Units before deactivating this GI entry.");
    }
    if(before&&before.level==='BRANCH'&&input.status!=='ACTIVE'){
      const children=await client.query("SELECT 1 FROM crm.gi_structure_nodes WHERE parent_id=$1 AND status='ACTIVE' LIMIT 1",[before.id]);
      if(children.rowCount)fail("An active GI Unit must retain an active Branch. Update its children first.");
    }
    const saved=input.id
      ?(await client.query(`UPDATE crm.gi_structure_nodes SET name=$2,status=$3,parent_id=$4,manager_id=$5,
        version=version+1,updated_at=now(),updated_by=$6 WHERE id=$1 RETURNING id,version`,
      [input.id,input.name.trim(),input.status,input.parent_id,input.manager_id,actor.username])).rows[0]
      :(await client.query(`INSERT INTO crm.gi_structure_nodes(code,name,level,status,parent_id,manager_id,updated_by)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,version`,
      [input.code,input.name.trim(),input.level,input.status,input.parent_id,input.manager_id,actor.username])).rows[0];
    // Recheck active descendants when a Branch manager changes.
    const afterNodes=await giNodes(client);
    if(afterNodes.some(n=>n.status==='ACTIVE'&&!n.available&&(n.id===saved.id||n.parent_id===saved.id)))
      fail("This change would make an active GI hierarchy unavailable. Resolve its parent or manager first.");
    await giAudit(client,"NODE",String(saved.id),before,afterNodes.find(n=>n.id===saved.id),actor,input.reason);
    return {version:saved.version};
  });
}
export async function saveGiManagerEnrollment(input:GiManagerInput,actor:GiActor){
  return salesSetupTransaction(async client=>{
    await requireGiAdmin(client,actor);reasonRequired(input.reason);
    const before=input.id?(await client.query("SELECT * FROM crm.gi_manager_enrollments WHERE id=$1 FOR UPDATE",[input.id])).rows[0]:null;
    if(input.id&&!before)throw new SalesSetupError(404,"GI manager enrollment not found.");
    if((before?.version??0)!==input.version)conflict();
    if(before&&(before.employee_id!==input.employee_id||before.level!==input.level))
      fail("The existing MIS user and manager category cannot change. Enroll a separate category instead.");
    const user=(await client.query(`SELECT e.employee_id,(e.activated AND e.approved AND NOT e.employee_locked) eligible
      FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id WHERE e.employee_id=$1 AND NOT e.is_deleted
      AND p.is_active AND lower(btrim(p.profile_name))='sales manager' AND lower(btrim(e.department))='sales' FOR SHARE OF e,p`,
    [input.employee_id])).rows[0];
    if(!user)fail("Select an existing Sales department user with the Sales Manager profile.");
    if(input.is_active&&!user.eligible)fail("Activate and approve the existing MIS user before activating the GI manager category.");
    const details=await checkGiManagerDetails(client,input.details,input.level,input.is_active,before?.details);
    const saved=input.id?(await client.query(`UPDATE crm.gi_manager_enrollments SET details=$2::jsonb,is_active=$3,
      version=version+1,updated_at=now(),updated_by=$4 WHERE id=$1 RETURNING *`,
    [input.id,JSON.stringify(details),input.is_active,actor.username])).rows[0]
      :(await client.query(`INSERT INTO crm.gi_manager_enrollments(employee_id,level,is_active,details,updated_by)
        VALUES($1,$2,$3,$4::jsonb,$5) RETURNING *`,
      [input.employee_id,input.level,input.is_active,JSON.stringify(details),actor.username])).rows[0];
    const eligible=(await client.query(`${giManagersSql} WHERE m.id=$1`,[saved.id])).rows[0];
    if(!eligible.user_eligible&&(await client.query(
      "SELECT 1 FROM crm.gi_structure_nodes WHERE manager_id=$1 AND status='ACTIVE' LIMIT 1",[saved.id])).rowCount)
      fail("Reassign the active GI teams before deactivating or expiring their manager enrollment.");
    await giAudit(client,"MANAGER",String(saved.id),before,{...saved,employee_name:eligible.employee_name},actor,input.reason);
    return {version:saved.version};
  });
}
export async function saveGiMappings(input:GiMappingInput,actor:GiActor){
  return salesSetupTransaction(async client=>{
    await requireGiAdmin(client,actor);reasonRequired(input.reason);
    const nodes=await giNodes(client),target=nodes.find(n=>n.id===input.gi_unit_id);
    if(!target||target.level!=='UNIT'||target.status==='INACTIVE')fail("Select an existing GI Unit that is not inactive.");
    const units=await giMedicalUnits(client,nodes);
    const seen=new Set<string>();
    for(const selection of input.units){
      const code=selection.medical_unit_code.trim().toUpperCase();
      if(seen.has(code))fail("Select each Medical Unit only once.");
      seen.add(code);
      const choices=units.filter(u=>u.code===code);
      if(choices.length!==1)fail("Select an existing, unambiguous Medical Unit.");
      if(choices[0].mapping_version!==selection.version)conflict();
    }
    for(const selection of input.units){
      const unit=units.find(u=>u.code===selection.medical_unit_code.trim().toUpperCase())!;
      if(unit.gi_unit_id===input.gi_unit_id)continue;
      const after=(await client.query(`INSERT INTO crm.gi_medical_unit_mappings
        (medical_unit_code,medical_node_id,medical_source_id,gi_unit_id,updated_by)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(medical_unit_code) DO UPDATE SET
        gi_unit_id=EXCLUDED.gi_unit_id,medical_node_id=EXCLUDED.medical_node_id,medical_source_id=EXCLUDED.medical_source_id,
        version=crm.gi_medical_unit_mappings.version+1,updated_at=now(),updated_by=EXCLUDED.updated_by RETURNING version`,
      [unit.code,unit.medical_node_id,unit.medical_source_id,input.gi_unit_id,actor.username])).rows[0];
      await giAudit(client,"MAPPING",unit.code,unit.mapping_version?unit:null,
        {...unit,gi_unit_id:target!.id,gi_unit_name:target!.name,gi_branch_name:target!.parent_name,
          mapping_version:after.version,mapping_available:unit.available&&target!.available},actor,input.reason);
    }
    return {version:1};
  });
}
export async function removeGiMapping(input:GiMappingRemoval,actor:GiActor){
  return salesSetupTransaction(async client=>{
    await requireGiAdmin(client,actor);reasonRequired(input.reason);
    const code=input.medical_unit_code.trim().toUpperCase();
    const before=(await giMedicalUnits(client,await giNodes(client))).find(u=>u.code===code);
    if(!before?.gi_unit_id)throw new SalesSetupError(404,"This Medical Unit has no current GI mapping.");
    if(before.mapping_version!==input.version)conflict();
    const after=(await client.query(`UPDATE crm.gi_medical_unit_mappings SET gi_unit_id=NULL,version=version+1,
      updated_at=now(),updated_by=$2 WHERE medical_unit_code=$1 RETURNING version`,[code,actor.username])).rows[0];
    await giAudit(client,"MAPPING",code,before,{...before,gi_unit_id:null,gi_unit_name:null,
      mapping_version:after.version,mapping_available:false},actor,input.reason);
    return {version:after.version};
  });
}
export async function giStructureHistory(actor:GiActor,type:string,key:string){
  return withTransaction(async client=>{
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireGiAdmin(client,actor);
    return (await client.query(`SELECT id::text,entity_type,entity_key,actor,reason,created_at::text,
      before_data::text before_details,after_data::text after_details FROM crm.gi_structure_events
      WHERE entity_type=$1 AND entity_key=$2 ORDER BY id DESC LIMIT 100`,[type,type==='MAPPING'?key.toUpperCase():key])).rows;
  });
}
