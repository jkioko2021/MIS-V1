-- Agents originate in the core system; MIS completes their local setup.
-- Existing catalog records remain usable, without pretending they were imported.
ALTER TABLE crm.tbl_mis_sales_intermediary
  ADD COLUMN IF NOT EXISTS source_ref varchar(64),
  ADD COLUMN IF NOT EXISTS source_imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS imported_by text,
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'COMPLETED'
    CHECK(registration_status IN ('PENDING','COMPLETED'));
CREATE UNIQUE INDEX IF NOT EXISTS intermediary_source_ref_unique
  ON crm.tbl_mis_sales_intermediary(source_ref) WHERE source_ref IS NOT NULL;
