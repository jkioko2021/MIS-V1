-- Preserve GI identifiers, original rows and the verified MIS account link.
-- Repeated GI_UM_ID rows may represent one manager covering several GI Units.
ALTER TABLE crm.gi_manager_enrollments
  DROP CONSTRAINT IF EXISTS gi_manager_enrollments_employee_id_level_key;
ALTER TABLE crm.gi_manager_enrollments
  ADD COLUMN IF NOT EXISTS source_reference_id integer UNIQUE REFERENCES crm.sales_catalog_source_records(id),
  ADD COLUMN IF NOT EXISTS source_notes jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS gi_manager_identifier_unique
  ON crm.gi_manager_enrollments(level,upper(details->>'GI_UM_ID'));
CREATE TABLE IF NOT EXISTS crm.gi_manager_source_links (
  source_record_id integer PRIMARY KEY REFERENCES crm.sales_catalog_source_records(id),
  enrollment_id integer NOT NULL REFERENCES crm.gi_manager_enrollments(id),
  source_row_sha256 varchar(64) NOT NULL
);
DO $$
DECLARE
  g record; field text; value text; distinct_values integer; payload jsonb;
  notes jsonb; enrollment integer; chosen_employee integer; earning boolean;
BEGIN
  FOR g IN
    SELECT upper(s.code) code,
      CASE s.catalog WHEN 'gi-unit-managers' THEN 'UNIT' ELSE 'BRANCH' END level,
      array_agg(s.id ORDER BY s.id) source_ids,array_agg(DISTINCT i.employee_id) employees
    FROM crm.sales_catalog_source_records s
    JOIN crm.sales_manager_user_sources us ON us.source_record_id=s.id AND us.source_row_sha256=s.row_sha256
    JOIN crm.sales_manager_user_identities i ON i.identity_key=us.identity_key
    JOIN crm.employees e ON e.employee_id=i.employee_id
    JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE s.catalog IN('gi-unit-managers','gi-coordinators') AND NOT e.is_deleted
      AND lower(btrim(e.department))='sales' AND lower(btrim(p.profile_name))='sales manager'
    GROUP BY upper(s.code),s.catalog
  LOOP
    IF cardinality(g.employees)<>1 THEN CONTINUE; END IF;
    chosen_employee:=g.employees[1];payload:='{}'::jsonb;notes:='[]'::jsonb;
    FOREACH field IN ARRAY ARRAY['GI_UM_ID','GI_UM_NAME','GI_UNIT_CODE','EMAIL','HRMIS_CODE','MIS_EMP_CODE',
      'NSM_CODE','VALID_FROM','VALID_TO','JOIN_DATE','RET_EFF_UPTO','RETAINER_AMT']
    LOOP
      SELECT count(DISTINCT v),min(v) INTO distinct_values,value FROM (
        SELECT CASE WHEN field='GI_UM_ID' THEN s.code WHEN field='GI_UM_NAME' THEN s.name
          WHEN upper(btrim(coalesce(s.data->>field,'NULL')))='NULL' THEN ''
          ELSE btrim(s.data->>field) END v
        FROM crm.sales_catalog_source_records s WHERE s.id=ANY(g.source_ids)
      ) values_for_field;
      IF distinct_values<>1 THEN
        value:='';notes:=notes||jsonb_build_array(field||': imported rows differ; left blank for review. All source rows are retained.');
      END IF;
      payload:=payload||jsonb_build_object(field,coalesce(value,''));
    END LOOP;
    SELECT count(DISTINCT coalesce(data->>'EARN_RETAINER','0')='1'),
      bool_and(coalesce(data->>'EARN_RETAINER','0')='1')
      INTO distinct_values,earning FROM crm.sales_catalog_source_records WHERE id=ANY(g.source_ids);
    IF distinct_values<>1 THEN
      earning:=false;notes:=notes||jsonb_build_array('EARN_RETAINER: conflicting source flags; inactive draft requires review.');
    END IF;
    payload:=payload||jsonb_build_object('EARN_RETAINER',earning);
    SELECT id INTO enrollment FROM crm.gi_manager_enrollments
      WHERE level=g.level AND upper(details->>'GI_UM_ID')=g.code AND employee_id=chosen_employee;
    IF enrollment IS NULL AND NOT EXISTS(SELECT 1 FROM crm.gi_manager_enrollments
      WHERE level=g.level AND upper(details->>'GI_UM_ID')=g.code) THEN
      INSERT INTO crm.gi_manager_enrollments(employee_id,level,is_active,details,source_reference_id,source_notes,updated_by)
      VALUES(chosen_employee,g.level,false,payload,CASE WHEN cardinality(g.source_ids)=1 THEN g.source_ids[1] END,
        notes,'verified-source-import') RETURNING id INTO enrollment;
    END IF;
    IF enrollment IS NOT NULL THEN
      INSERT INTO crm.gi_manager_source_links(source_record_id,enrollment_id,source_row_sha256)
      SELECT s.id,enrollment,s.row_sha256 FROM crm.sales_catalog_source_records s WHERE s.id=ANY(g.source_ids)
      ON CONFLICT(source_record_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
-- Source-declared assignments are setup links only. No category or account activation.
UPDATE crm.gi_structure_nodes n SET manager_id=m.id
FROM crm.gi_manager_enrollments m,crm.sales_catalog_source_records s
WHERE n.source_reference_id=s.id AND n.level=m.level AND n.status='PENDING' AND n.version=1 AND n.manager_id IS NULL
AND upper(btrim(s.data->>'CORD_MGR_ID'))=upper(m.details->>'GI_UM_ID');
INSERT INTO crm.gi_structure_events(entity_type,entity_key,after_data,actor,reason)
SELECT 'MANAGER',m.id::text,to_jsonb(m),'verified-source-import',
  'Imported GI fields as an inactive draft through verified MIS account provenance; repeated identifiers share one designation.'
FROM crm.gi_manager_enrollments m
WHERE EXISTS(SELECT 1 FROM crm.gi_manager_source_links l WHERE l.enrollment_id=m.id)
AND NOT EXISTS(SELECT 1 FROM crm.gi_structure_events e WHERE e.entity_type='MANAGER' AND e.entity_key=m.id::text);
