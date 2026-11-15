-- Reuse the existing hierarchy and agent master. Imported source columns remain untouched.
ALTER TABLE crm.sales_structure_nodes
  ADD COLUMN IF NOT EXISTS source_reference_id integer UNIQUE
    REFERENCES crm.sales_catalog_source_records(id);
ALTER TABLE crm.tbl_mis_sales_intermediary
  ADD COLUMN IF NOT EXISTS organisation_unit_id integer REFERENCES crm.sales_structure_nodes(id);
CREATE INDEX IF NOT EXISTS intermediary_organisation_unit_idx
  ON crm.tbl_mis_sales_intermediary(organisation_unit_id);

CREATE OR REPLACE VIEW crm.organisation_paths AS
WITH RECURSIVE paths AS (
  SELECT n.id,n.level,n.parent_id,ARRAY[n.id] AS node_ids,
    jsonb_build_array(jsonb_build_object('id',n.id,'code',n.code,'name',n.name,'level',n.level)) AS path,
    n.is_active AS active_path
  FROM crm.sales_structure_nodes n WHERE n.level='NATIONAL'
  UNION ALL
  SELECT n.id,n.level,n.parent_id,p.node_ids||n.id,
    p.path||jsonb_build_array(jsonb_build_object('id',n.id,'code',n.code,'name',n.name,'level',n.level)),
    p.active_path AND n.is_active
  FROM crm.sales_structure_nodes n JOIN paths p ON n.parent_id=p.id
  WHERE cardinality(p.node_ids)<4 AND NOT n.id=ANY(p.node_ids)
)
SELECT p.*,
  NOT EXISTS (
    SELECT 1 FROM crm.sales_structure_nodes a
    LEFT JOIN crm.sales_manager_enrollments m ON m.id=a.manager_id
    LEFT JOIN crm.employees e ON e.employee_id=m.employee_id
    WHERE a.id=ANY(p.node_ids) AND (
      m.id IS NULL OR m.level<>a.level OR NOT m.is_active OR e.employee_id IS NULL
      OR e.is_deleted OR NOT e.activated OR NOT e.approved OR e.employee_locked
      OR (m.manager_details IS NOT NULL AND
        (m.manager_details->>'valid_from'>CURRENT_DATE::text OR m.manager_details->>'valid_to'<CURRENT_DATE::text))
    )
  ) AND p.active_path AS available
FROM paths p;

CREATE TABLE IF NOT EXISTS crm.agent_unit_assignments (
  id bigserial PRIMARY KEY,
  agent_code varchar(30) NOT NULL REFERENCES crm.tbl_mis_sales_intermediary(agent_code),
  from_unit_id integer REFERENCES crm.sales_structure_nodes(id),
  to_unit_id integer NOT NULL REFERENCES crm.sales_structure_nodes(id),
  effective_date date NOT NULL,
  reason varchar(1000) NOT NULL CHECK (length(btrim(reason))>0),
  approved_by varchar(100) NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  from_hierarchy jsonb NOT NULL DEFAULT '[]'::jsonb,
  hierarchy jsonb NOT NULL CHECK (jsonb_typeof(hierarchy)='array'),
  legacy_context jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS agent_unit_assignment_history
  ON crm.agent_unit_assignments(agent_code,effective_date DESC,id DESC);
CREATE INDEX IF NOT EXISTS agent_unit_assignment_destination
  ON crm.agent_unit_assignments(to_unit_id);

-- Reporting grain: one row per assignment interval. Hierarchy is an immutable snapshot.
CREATE OR REPLACE VIEW crm.agent_organisation_history AS
SELECT a.*,
  lead(effective_date) OVER(PARTITION BY agent_code ORDER BY effective_date,id) AS valid_until
FROM crm.agent_unit_assignments a;

-- Shared current reporting dimensions: derive, never duplicate editable ancestry on the agent.
CREATE OR REPLACE VIEW crm.agent_organisation_current AS
SELECT a.agent_code,a.agent_name,a.agent_status,a.organisation_unit_id AS unit_id,
  coalesce(p.path,'[]'::jsonb) AS hierarchy,coalesce(p.available,false) AS available,
  (p.path->0->>'id')::integer AS national_id,p.path->0->>'code' AS national_code,p.path->0->>'name' AS national_name,
  (p.path->1->>'id')::integer AS region_id,p.path->1->>'code' AS region_code,p.path->1->>'name' AS region_name,
  (p.path->2->>'id')::integer AS branch_id,p.path->2->>'code' AS branch_code,p.path->2->>'name' AS branch_name,
  p.path->3->>'code' AS unit_code,p.path->3->>'name' AS unit_name
FROM crm.tbl_mis_sales_intermediary a LEFT JOIN crm.organisation_paths p ON p.id=a.organisation_unit_id;

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
    IF (TG_OP='INSERT' OR NEW.parent_id IS DISTINCT FROM OLD.parent_id OR NEW.is_active)
      AND NOT parent_active THEN
      RAISE EXCEPTION 'Select an active parent' USING ERRCODE='23514';
    END IF;
  END IF;
  SELECT level INTO manager_level FROM crm.sales_manager_enrollments WHERE id=NEW.manager_id;
  IF manager_level IS DISTINCT FROM NEW.level THEN
    RAISE EXCEPTION 'An enrolled manager at the correct level is required' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_organisation_node ON crm.sales_structure_nodes;
CREATE TRIGGER guard_organisation_node BEFORE INSERT OR UPDATE ON crm.sales_structure_nodes
  FOR EACH ROW EXECUTE FUNCTION crm.guard_organisation_node();

CREATE OR REPLACE FUNCTION crm.guard_agent_unit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.organisation_unit_id IS NOT NULL AND
    (TG_OP='INSERT' OR NEW.organisation_unit_id IS DISTINCT FROM OLD.organisation_unit_id) AND
    NOT EXISTS(SELECT 1 FROM crm.organisation_paths WHERE id=NEW.organisation_unit_id AND level='UNIT' AND available) THEN
    RAISE EXCEPTION 'Select an available Unit with an active hierarchy and eligible managers' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_agent_unit ON crm.tbl_mis_sales_intermediary;
CREATE TRIGGER guard_agent_unit BEFORE INSERT OR UPDATE ON crm.tbl_mis_sales_intermediary
  FOR EACH ROW EXECUTE FUNCTION crm.guard_agent_unit();

-- No hard-delete API is exposed. History cannot be edited or removed through normal DML.
CREATE OR REPLACE FUNCTION crm.immutable_agent_assignment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Agent assignment history is immutable' USING ERRCODE='23514';
END $$;
DROP TRIGGER IF EXISTS immutable_agent_assignment ON crm.agent_unit_assignments;
CREATE TRIGGER immutable_agent_assignment BEFORE UPDATE OR DELETE ON crm.agent_unit_assignments
  FOR EACH ROW EXECUTE FUNCTION crm.immutable_agent_assignment();

INSERT INTO crm.menu_access(profile_id,main_menu_name,sub_menu_name,page_url,menu_order,can_access,can_add,can_edit,can_delete)
SELECT p.profile_id,'Organisation Structure',m.label,m.url,m.ord,true,true,true,false
FROM crm.profiles p CROSS JOIN (VALUES
 ('Organisation Hierarchy','/admin/organisation/dashboard',10),
 ('National Management','/admin/organisation/national',20),
 ('Region Management','/admin/organisation/regions',30),
 ('Branch Management','/admin/organisation/branches',40),
 ('Unit Management','/admin/organisation/units',50),
 ('Manager Assignment','/admin/organisation/managers',60),
 ('Agent Unit Mapping','/admin/organisation/agents',70)
) AS m(label,url,ord)
WHERE p.profile_id IN(1,2)
AND NOT EXISTS(SELECT 1 FROM crm.menu_access a WHERE a.profile_id=p.profile_id AND a.page_url=m.url);
