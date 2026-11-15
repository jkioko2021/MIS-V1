-- Setup decisions do not adopt/activate imported rows or grant reporting access.
CREATE TABLE IF NOT EXISTS crm.organisation_source_setup (
  source_reference_id integer PRIMARY KEY REFERENCES crm.sales_catalog_source_records(id),
  source_row_sha256 varchar(64) NOT NULL,
  manager_employee_id integer REFERENCES crm.employees(employee_id),
  manager_sources jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(manager_sources)='array'),
  manager_link_status varchar(20) NOT NULL CHECK (manager_link_status IN ('MATCHED','UNRESOLVED','NOT_REQUIRED')),
  branch_approved boolean NOT NULL DEFAULT false,
  resolution_note varchar(500) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by varchar(100) NOT NULL,
  CHECK (
    (manager_link_status='MATCHED' AND manager_employee_id IS NOT NULL AND NOT branch_approved
      AND jsonb_array_length(manager_sources)>0)
    OR (manager_link_status='UNRESOLVED' AND manager_employee_id IS NULL AND NOT branch_approved)
    OR (manager_link_status='NOT_REQUIRED' AND manager_employee_id IS NULL AND branch_approved
      AND jsonb_array_length(manager_sources)=0)
  )
);
CREATE TABLE IF NOT EXISTS crm.organisation_source_setup_events (
  id bigserial PRIMARY KEY,
  source_reference_id integer NOT NULL REFERENCES crm.sales_catalog_source_records(id),
  before_data jsonb,
  after_data jsonb NOT NULL,
  actor varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Branches are structural levels without managers. Other levels retain all guards.
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
  IF NEW.level='BRANCH' THEN
    IF NEW.manager_id IS NOT NULL THEN
      RAISE EXCEPTION 'Branches have no assigned manager' USING ERRCODE='23514';
    END IF;
  ELSE
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
  WHERE a.id=ANY(p.node_ids) AND (
    (a.level='BRANCH' AND a.manager_id IS NOT NULL)
    OR (a.level<>'BRANCH' AND (m.id IS NULL OR m.level<>a.level OR NOT m.is_active
      OR e.employee_id IS NULL OR e.is_deleted OR NOT e.activated OR NOT e.approved OR e.employee_locked
      OR (m.manager_details IS NOT NULL AND (m.manager_details->>'valid_from'>CURRENT_DATE::text
        OR m.manager_details->>'valid_to'<CURRENT_DATE::text))))
  )
) AND p.active_path AS available FROM paths p;
