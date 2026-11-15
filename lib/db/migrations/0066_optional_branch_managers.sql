ALTER TABLE crm.organisation_source_setup
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS manager_selection varchar(10) NOT NULL DEFAULT 'SOURCE'
    CHECK(manager_selection IN ('SOURCE','MANUAL'));
ALTER TABLE crm.organisation_source_setup DROP CONSTRAINT IF EXISTS organisation_source_setup_check;
ALTER TABLE crm.organisation_source_setup ADD CONSTRAINT organisation_source_setup_check CHECK (
  (manager_link_status='MATCHED' AND manager_employee_id IS NOT NULL
    AND (manager_selection='MANUAL' OR jsonb_array_length(manager_sources)>0))
  OR (manager_link_status='UNRESOLVED' AND manager_employee_id IS NULL AND NOT branch_approved)
  OR (manager_link_status='NOT_REQUIRED' AND manager_employee_id IS NULL AND branch_approved
    AND jsonb_array_length(manager_sources)=0)
);
CREATE OR REPLACE FUNCTION crm.guard_organisation_node() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE expected text; parent_level text; parent_active boolean; manager_level text;
BEGIN
  expected := CASE NEW.level WHEN 'REGION' THEN 'NATIONAL' WHEN 'BRANCH' THEN 'REGION'
    WHEN 'UNIT' THEN 'BRANCH' ELSE NULL END;
  IF TG_OP='UPDATE' AND (NEW.level<>OLD.level OR NEW.code<>OLD.code) THEN
    RAISE EXCEPTION 'Hierarchy codes and levels are immutable' USING ERRCODE='23514';
  END IF;
  IF expected IS NOT NULL THEN
    SELECT level,is_active INTO parent_level,parent_active FROM crm.sales_structure_nodes WHERE id=NEW.parent_id;
    IF parent_level IS DISTINCT FROM expected THEN
      RAISE EXCEPTION 'Invalid hierarchy parent' USING ERRCODE='23514';
    END IF;
    IF (TG_OP='INSERT' OR NEW.parent_id IS DISTINCT FROM OLD.parent_id OR NEW.is_active) AND NOT parent_active THEN
      RAISE EXCEPTION 'Select an active parent' USING ERRCODE='23514';
    END IF;
  END IF;
  IF NEW.manager_id IS NOT NULL OR NEW.level<>'BRANCH' THEN
    SELECT level INTO manager_level FROM crm.sales_manager_enrollments WHERE id=NEW.manager_id;
    IF manager_level IS DISTINCT FROM NEW.level THEN
      RAISE EXCEPTION 'An enrolled manager at the correct level is required' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE VIEW crm.organisation_paths AS
WITH RECURSIVE paths AS (
  SELECT n.id,n.level,n.parent_id,ARRAY[n.id] AS node_ids,
    jsonb_build_array(jsonb_build_object('id',n.id,'code',n.code,'name',n.name,'level',n.level)) AS path,
    n.is_active AS active_path FROM crm.sales_structure_nodes n WHERE n.level='NATIONAL'
  UNION ALL
  SELECT n.id,n.level,n.parent_id,p.node_ids||n.id,
    p.path||jsonb_build_array(jsonb_build_object('id',n.id,'code',n.code,'name',n.name,'level',n.level)),
    p.active_path AND n.is_active
  FROM crm.sales_structure_nodes n JOIN paths p ON n.parent_id=p.id
  WHERE cardinality(p.node_ids)<4 AND NOT n.id=ANY(p.node_ids)
)
SELECT p.*, NOT EXISTS (
  SELECT 1 FROM crm.sales_structure_nodes a
  LEFT JOIN crm.sales_manager_enrollments m ON m.id=a.manager_id
  LEFT JOIN crm.employees e ON e.employee_id=m.employee_id
  WHERE a.id=ANY(p.node_ids) AND (a.level<>'BRANCH' OR a.manager_id IS NOT NULL)
    AND (m.id IS NULL OR m.level<>a.level OR NOT m.is_active
      OR e.employee_id IS NULL OR e.is_deleted OR NOT e.activated OR NOT e.approved OR e.employee_locked
      OR (m.manager_details IS NOT NULL AND (m.manager_details->>'valid_from'>CURRENT_DATE::text
        OR m.manager_details->>'valid_to'<CURRENT_DATE::text)))
) AND p.active_path AS available FROM paths p;
