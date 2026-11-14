-- Local enrollment catalogs reproduce the fields supplied by the user.
-- They do not create, connect to or write into the upstream SQL Server repository.
CREATE TABLE IF NOT EXISTS crm.sales_catalog_entries (
  id serial PRIMARY KEY,
  catalog varchar(40) NOT NULL CHECK (catalog IN
    ('sales-units','unit-managers','sales-branches','regional-managers','sales-regions',
     'gi-unit-managers','gi-units','gi-branches','gi-coordinators')),
  code varchar(50) NOT NULL CHECK (code ~ '^[A-Za-z0-9_-]+$'),
  name varchar(150) NOT NULL CHECK (length(btrim(name)) > 0),
  employee_id integer REFERENCES crm.employees(employee_id),
  is_active boolean NOT NULL DEFAULT true,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100) NOT NULL,
  updated_by varchar(100) NOT NULL,
  UNIQUE(catalog,code)
);
CREATE UNIQUE INDEX IF NOT EXISTS sales_catalog_user_enrollment_unique
  ON crm.sales_catalog_entries(catalog,employee_id) WHERE employee_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS crm.sales_catalog_events (
  id bigserial PRIMARY KEY,
  entry_id integer NOT NULL REFERENCES crm.sales_catalog_entries(id),
  action varchar(20) NOT NULL CHECK (action IN ('CREATED','UPDATED')),
  before_data jsonb,
  after_data jsonb NOT NULL,
  actor varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
