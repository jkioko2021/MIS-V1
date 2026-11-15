-- Explicit setup mapping only: original source rows and operational nodes stay unchanged.
ALTER TABLE crm.organisation_source_setup
  ADD COLUMN IF NOT EXISTS national_node_id integer REFERENCES crm.sales_structure_nodes(id),
  ADD COLUMN IF NOT EXISTS national_source_code varchar(40);
