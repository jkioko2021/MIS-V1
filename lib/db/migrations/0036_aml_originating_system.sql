-- Nullable for original saved classifications: no inferred values or backfill.
-- Verified legacy AML writers use eOx and AIMS; this is document metadata only.
ALTER TABLE crm.business_uploads
  ADD COLUMN IF NOT EXISTS originating_system VARCHAR(50);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'crm.business_uploads'::regclass
      AND conname = 'business_uploads_originating_system_check'
  ) THEN
    ALTER TABLE crm.business_uploads
      ADD CONSTRAINT business_uploads_originating_system_check
      CHECK (originating_system IS NULL OR originating_system IN ('eOx', 'AIMS'));
  END IF;
END $$;
