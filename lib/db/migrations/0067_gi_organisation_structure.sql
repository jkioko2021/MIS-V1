-- GI remains a separate Branch -> Unit hierarchy. Imported rows remain pending.
CREATE TABLE IF NOT EXISTS crm.gi_manager_enrollments (
  id serial PRIMARY KEY,
  employee_id integer NOT NULL REFERENCES crm.employees(employee_id),
  level varchar(10) NOT NULL CHECK(level IN('BRANCH','UNIT')),
  is_active boolean NOT NULL DEFAULT false,
  details jsonb NOT NULL CHECK(jsonb_typeof(details)='object'),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by varchar(100) NOT NULL,
  UNIQUE(employee_id,level)
);
CREATE TABLE IF NOT EXISTS crm.gi_structure_nodes (
  id serial PRIMARY KEY,
  code varchar(50) NOT NULL CHECK(code ~ '^[A-Za-z0-9_-]+$'),
  name varchar(150) NOT NULL CHECK(length(btrim(name))>0),
  level varchar(10) NOT NULL CHECK(level IN('BRANCH','UNIT')),
  status varchar(10) NOT NULL DEFAULT 'PENDING' CHECK(status IN('PENDING','ACTIVE','INACTIVE')),
  parent_id integer REFERENCES crm.gi_structure_nodes(id),
  manager_id integer REFERENCES crm.gi_manager_enrollments(id),
  source_reference_id integer UNIQUE REFERENCES crm.sales_catalog_source_records(id),
  source_parent_code varchar(50),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by varchar(100) NOT NULL,
  CHECK(parent_id IS NULL OR parent_id<>id),
  CHECK(level<>'BRANCH' OR parent_id IS NULL),
  CHECK(status<>'ACTIVE' OR level='BRANCH' OR (parent_id IS NOT NULL AND manager_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS gi_structure_code_unique ON crm.gi_structure_nodes(upper(code));
CREATE UNIQUE INDEX IF NOT EXISTS gi_structure_name_scope
  ON crm.gi_structure_nodes(level,coalesce(parent_id,0),lower(btrim(name)));
CREATE TABLE IF NOT EXISTS crm.gi_medical_unit_mappings (
  medical_unit_code varchar(50) PRIMARY KEY CHECK(medical_unit_code=upper(btrim(medical_unit_code))),
  medical_node_id integer REFERENCES crm.sales_structure_nodes(id),
  medical_source_id integer REFERENCES crm.sales_catalog_source_records(id),
  gi_unit_id integer REFERENCES crm.gi_structure_nodes(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by varchar(100) NOT NULL,
  CHECK(medical_node_id IS NOT NULL OR medical_source_id IS NOT NULL)
);
-- Unmapping retains a versioned tombstone, preventing delete/recreate ABA races.
CREATE TABLE IF NOT EXISTS crm.gi_structure_events (
  id bigserial PRIMARY KEY,
  entity_type varchar(10) NOT NULL CHECK(entity_type IN('NODE','MANAGER','MAPPING')),
  entity_key varchar(50) NOT NULL,
  before_data jsonb,
  after_data jsonb NOT NULL,
  actor varchar(100) NOT NULL,
  reason varchar(1000) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gi_structure_event_lookup ON crm.gi_structure_events(entity_type,entity_key,id DESC);
INSERT INTO crm.gi_structure_nodes(code,name,level,source_reference_id,source_parent_code,updated_by)
SELECT s.code,s.name,CASE s.catalog WHEN 'gi-branches' THEN 'BRANCH' ELSE 'UNIT' END,s.id,
  CASE WHEN s.catalog='gi-units' THEN nullif(btrim(s.data->>'REGION_CODE'),'') END,'source-import'
FROM crm.sales_catalog_source_records s
WHERE s.catalog IN('gi-branches','gi-units')
AND NOT EXISTS(SELECT 1 FROM crm.gi_structure_nodes n WHERE upper(n.code)=upper(s.code));
-- Retain only unambiguous source-declared GI parents, without activating either side.
UPDATE crm.gi_structure_nodes n SET parent_id=p.id
FROM crm.gi_structure_nodes p
WHERE n.level='UNIT' AND n.status='PENDING' AND n.version=1 AND n.parent_id IS NULL
AND p.level='BRANCH' AND upper(btrim(n.source_parent_code))=upper(p.code);
