-- Imported draft details remain blank, never fabricated tax/contact values.
CREATE TABLE IF NOT EXISTS crm.sales_manager_enrollment_sources (
  source_reference_id integer PRIMARY KEY REFERENCES crm.sales_catalog_source_records(id),
  enrollment_id integer NOT NULL REFERENCES crm.sales_manager_enrollments(id),
  source_row_sha256 varchar(64) NOT NULL,
  source_domain varchar(10) NOT NULL CHECK (source_domain IN ('MEDICAL','GI')),
  review_notes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(review_notes)='array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by varchar(100) NOT NULL
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='crm.sales_manager_enrollments'::regclass AND conname='sales_manager_active_complete_details') THEN
    ALTER TABLE crm.sales_manager_enrollments ADD CONSTRAINT sales_manager_active_complete_details CHECK (
      NOT is_active OR manager_details IS NULL OR (
        nullif(btrim(manager_details->>'code'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'name'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'email'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'hrmis_code'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'mobile_no'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'h_tax'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'mis_emp_code'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'valid_from'),'') IS NOT NULL
        AND nullif(btrim(manager_details->>'valid_to'),'') IS NOT NULL
      )
    );
  END IF;
END $$;
