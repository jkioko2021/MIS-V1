-- Preserve every uploaded field, including values not yet editable in MIS.
ALTER TABLE crm.tbl_mis_sales_intermediary
  ADD COLUMN IF NOT EXISTS source_data jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(source_data)='object');
