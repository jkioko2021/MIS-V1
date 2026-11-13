-- Administrator-maintained sales hierarchy; manager enrollment never changes login profiles.
CREATE TABLE IF NOT EXISTS crm.sales_manager_enrollments (
  id serial PRIMARY KEY,
  employee_id integer NOT NULL REFERENCES crm.employees(employee_id),
  level varchar(10) NOT NULL CHECK (level IN ('NATIONAL','REGION','BRANCH','UNIT')),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100) NOT NULL,
  updated_by varchar(100) NOT NULL,
  UNIQUE(employee_id,level)
);
CREATE TABLE IF NOT EXISTS crm.sales_structure_nodes (
  id serial PRIMARY KEY,
  code varchar(40) NOT NULL UNIQUE CHECK (code = upper(code) AND code ~ '^[A-Z0-9_-]+$'),
  name varchar(150) NOT NULL CHECK (length(btrim(name)) > 0),
  level varchar(10) NOT NULL CHECK (level IN ('NATIONAL','REGION','BRANCH','UNIT')),
  parent_id integer REFERENCES crm.sales_structure_nodes(id),
  manager_id integer REFERENCES crm.sales_manager_enrollments(id),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100) NOT NULL,
  updated_by varchar(100) NOT NULL,
  CHECK ((level = 'NATIONAL' AND parent_id IS NULL) OR (level <> 'NATIONAL' AND parent_id IS NOT NULL)),
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE UNIQUE INDEX IF NOT EXISTS sales_structure_name_scope
  ON crm.sales_structure_nodes(level,coalesce(parent_id,0),lower(btrim(name)));
CREATE INDEX IF NOT EXISTS sales_structure_parent_idx ON crm.sales_structure_nodes(parent_id);
CREATE INDEX IF NOT EXISTS sales_structure_manager_idx ON crm.sales_structure_nodes(manager_id);
CREATE TABLE IF NOT EXISTS crm.sales_setup_events (
  id bigserial PRIMARY KEY,
  entity_type varchar(10) NOT NULL CHECK (entity_type IN ('NODE','MANAGER')),
  entity_id integer NOT NULL,
  action varchar(30) NOT NULL,
  before_data jsonb,
  after_data jsonb NOT NULL,
  actor varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
