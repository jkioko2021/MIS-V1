ALTER TABLE crm.data_import_batches DROP CONSTRAINT IF EXISTS data_import_batches_kind_check;
ALTER TABLE crm.data_import_batches ADD CONSTRAINT data_import_batches_kind_check
  CHECK(kind IN ('users','agents','relationship-managers'));
CREATE TABLE IF NOT EXISTS crm.relationship_managers (
  re_code varchar(32) NOT NULL,
  re_name varchar(200) NOT NULL,
  class_code varchar(50) NOT NULL,
  c_code varchar(1) NOT NULL CHECK(c_code IN ('C','R')),
  reporting_year integer NOT NULL CHECK(reporting_year BETWEEN 1900 AND 2100),
  is_active boolean NOT NULL,
  source_batch_id uuid REFERENCES crm.data_import_batches(id),
  source_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  PRIMARY KEY(re_code,c_code,reporting_year)
);
