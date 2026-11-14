-- Read-only source staging. No normal MIS users or operational enrollments are created.
CREATE TABLE IF NOT EXISTS crm.sales_catalog_source_records (
  id serial PRIMARY KEY,
  catalog varchar(40) NOT NULL CHECK (catalog IN
    ('sales-units','unit-managers','sales-branches','regional-managers','sales-regions',
     'gi-unit-managers','gi-units','gi-branches','gi-coordinators')),
  code varchar(50) NOT NULL,
  name varchar(150) NOT NULL,
  source_file text NOT NULL,
  file_sha256 varchar(64) NOT NULL,
  source_line integer NOT NULL,
  row_sha256 varchar(64) NOT NULL,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  issues jsonb NOT NULL CHECK (jsonb_typeof(issues) = 'array'),
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by varchar(100) NOT NULL,
  UNIQUE(catalog,row_sha256)
);
