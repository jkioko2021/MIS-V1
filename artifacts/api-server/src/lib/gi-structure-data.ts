import type { PoolClient } from "pg";
import type { GiNode, GiManager, GiMedicalUnit, SalesStaff } from "@workspace/api-zod";
import { SalesSetupError } from "./sales-structure";

export type GiActor={sub:number;profileId:number;username:string};
export async function requireGiAdmin(client:PoolClient,actor:GiActor){
  const result=await client.query(`SELECT 1 FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE e.employee_id=$1 AND e.profile_id=$2 AND NOT e.is_deleted AND e.activated AND e.approved
    AND NOT e.employee_locked AND p.is_active
    AND (p.profile_id IN(1,2) OR lower(btrim(p.profile_name))='national sales admin')`,[actor.sub,actor.profileId]);
  if(!result.rowCount)throw new SalesSetupError(403,"Sales Administrator or System Administrator access is required.");
}
export const giManagersSql=`SELECT m.*,e.employee_name,e.emp_code,e.email,
  coalesce((SELECT jsonb_agg(DISTINCT s.data->>'GI_UNIT_CODE') FROM crm.gi_manager_source_links l
    JOIN crm.sales_catalog_source_records s ON s.id=l.source_record_id
    WHERE l.enrollment_id=m.id AND nullif(s.data->>'GI_UNIT_CODE','') IS NOT NULL),'[]'::jsonb) source_unit_codes,
  coalesce(m.is_active AND NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked
    AND p.is_active AND lower(btrim(p.profile_name))='sales manager' AND lower(btrim(e.department))='sales'
    AND coalesce(m.details->>'VALID_FROM','')<>'' AND m.details->>'VALID_FROM'<=CURRENT_DATE::text
    AND coalesce(m.details->>'VALID_TO','')>=CURRENT_DATE::text,false) AS user_eligible
  FROM crm.gi_manager_enrollments m JOIN crm.employees e ON e.employee_id=m.employee_id
  JOIN crm.profiles p ON p.profile_id=e.profile_id`;
export async function giNodes(client:PoolClient){
  return (await client.query<GiNode>(`WITH managers AS (${giManagersSql})
    SELECT n.*,p.name parent_name,m.employee_name manager_name,
    coalesce(n.status='ACTIVE' AND (n.manager_id IS NULL OR (m.user_eligible AND m.level=n.level))
      AND (n.level='BRANCH' OR (n.manager_id IS NOT NULL AND p.status='ACTIVE' AND p.level='BRANCH'
        AND (p.manager_id IS NULL OR (pm.user_eligible AND pm.level='BRANCH')))),false) available
    FROM crm.gi_structure_nodes n LEFT JOIN crm.gi_structure_nodes p ON p.id=n.parent_id
    LEFT JOIN managers m ON m.id=n.manager_id LEFT JOIN managers pm ON pm.id=p.manager_id
    ORDER BY n.level,n.name,n.id`)).rows;
}
export type MedicalChoice=GiMedicalUnit&{medical_node_id:number|null;medical_source_id:number|null};
export async function giMedicalUnits(client:PoolClient,nodes:GiNode[]){
  const rows=(await client.query<MedicalChoice>(`WITH medical AS (
    SELECT upper(n.code) code,n.name,p.name branch_name,coalesce(op.available,false) available,
      n.id medical_node_id,NULL::integer medical_source_id
    FROM crm.sales_structure_nodes n LEFT JOIN crm.sales_structure_nodes p ON p.id=n.parent_id
    LEFT JOIN crm.organisation_paths op ON op.id=n.id WHERE n.level='UNIT'
    UNION ALL
    SELECT upper(btrim(s.code)),s.name,
      coalesce((SELECT n.name FROM crm.sales_structure_nodes n WHERE n.level='BRANCH'
        AND upper(n.code)=upper(btrim(s.data->>'BRANCH_CODE'))),
        (SELECT min(b.name) FROM crm.sales_catalog_source_records b WHERE b.catalog='sales-branches'
          AND upper(btrim(b.code))=upper(btrim(s.data->>'BRANCH_CODE')))),
      false,NULL::integer,s.id
    FROM crm.sales_catalog_source_records s WHERE s.catalog='sales-units'
    AND NOT EXISTS(SELECT 1 FROM crm.sales_structure_nodes n WHERE upper(n.code)=upper(btrim(s.code)))
  )
  SELECT u.*,m.gi_unit_id,g.name gi_unit_name,coalesce(m.version,0) mapping_version
  FROM medical u LEFT JOIN crm.gi_medical_unit_mappings m ON m.medical_unit_code=u.code
  LEFT JOIN crm.gi_structure_nodes g ON g.id=m.gi_unit_id ORDER BY u.name,u.code`)).rows;
  return rows.map(row=>({...row,mapping_available:row.available&&!!nodes.find(n=>n.id===row.gi_unit_id)?.available}));
}
export async function giSnapshotData(client:PoolClient){
  const nodes=await giNodes(client);
  const managers=(await client.query<GiManager>(`${giManagersSql} ORDER BY e.employee_name,m.level,m.id`)).rows;
  const manager_users=(await client.query<SalesStaff>(`SELECT e.employee_id,e.employee_name,e.username,e.emp_code,e.email,
    (e.activated AND e.approved AND NOT e.employee_locked) user_eligible,
    nullif(concat_ws('; ',CASE WHEN NOT e.activated THEN 'Inactive' END,
      CASE WHEN NOT e.approved THEN 'Not approved' END,CASE WHEN e.employee_locked THEN 'Locked' END),'') eligibility_note
    FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id WHERE NOT e.is_deleted
    AND p.is_active AND lower(btrim(p.profile_name))='sales manager' AND lower(btrim(e.department))='sales'
    ORDER BY e.employee_name,e.employee_id`)).rows;
  const manager_references=(await client.query(`SELECT s.id,s.code,s.name,
    CASE s.catalog WHEN 'gi-unit-managers' THEN 'UNIT' ELSE 'BRANCH' END level,
    m.id enrollment_id,coalesce(s.data->>'ACTIVE','0')='1' source_active,
    CASE WHEN m.id IS NULL THEN 'No verified MIS account link; resolve account matching before enrollment.'
      ELSE 'Imported as an inactive draft; the original source Active flag is retained separately.' END review_note
    FROM crm.sales_catalog_source_records s LEFT JOIN crm.gi_manager_source_links l ON l.source_record_id=s.id
    LEFT JOIN crm.gi_manager_enrollments m ON m.id=l.enrollment_id
    WHERE s.catalog IN('gi-unit-managers','gi-coordinators') ORDER BY s.name,s.id`)).rows;
  const nationals=(await client.query("SELECT code,name FROM crm.sales_structure_nodes WHERE level='NATIONAL' ORDER BY name")).rows;
  return {nodes,managers,manager_users,medical_units:await giMedicalUnits(client,nodes),manager_references,nationals};
}
export async function giAudit(client:PoolClient,type:"NODE"|"MANAGER"|"MAPPING",key:string,
  before:unknown,after:unknown,actor:GiActor,reason:string){
  await client.query(`INSERT INTO crm.gi_structure_events(entity_type,entity_key,before_data,after_data,actor,reason)
    VALUES($1,$2,$3::jsonb,$4::jsonb,$5,$6)`,
  [type,key,before?JSON.stringify(before):null,JSON.stringify(after),actor.username,reason.trim()]);
}
