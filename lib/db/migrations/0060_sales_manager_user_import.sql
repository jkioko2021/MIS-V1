-- Account import provenance is separate from the immutable uploaded assignments.
CREATE TABLE IF NOT EXISTS crm.sales_manager_user_identities (
  identity_key varchar(64) PRIMARY KEY,
  employee_id integer NOT NULL UNIQUE REFERENCES crm.employees(employee_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS crm.sales_manager_user_sources (
  source_record_id integer PRIMARY KEY REFERENCES crm.sales_catalog_source_records(id),
  identity_key varchar(64) NOT NULL REFERENCES crm.sales_manager_user_identities(identity_key),
  source_row_sha256 varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS employees_sales_email_unique
  ON crm.employees(lower(btrim(email)))
  WHERE NOT is_deleted AND lower(btrim(department))='sales' AND nullif(btrim(email),'') IS NOT NULL;
