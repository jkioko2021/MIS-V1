-- crm.business_req retains its legacy requirement contract plus CODE.
-- The removed exact-value columns have equivalent legacy representations
-- except BUSINESS_TYPE, which is no longer maintained as a stored field.

BEGIN;

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM crm.business_req
    WHERE req_id BETWEEN 90 AND 134
      AND req_name IS NOT NULL
      AND applies_to IN ('R', 'C')
      AND code IS NOT NULL
  ) <> 45 THEN
    RAISE EXCEPTION 'Cannot remove redundant business_req columns: CODE or legacy requirement data is incomplete.';
  END IF;
END $$;

ALTER TABLE crm.business_req
  DROP COLUMN IF EXISTS doc_id,
  DROP COLUMN IF EXISTS doc_code,
  DROP COLUMN IF EXISTS doc_name,
  DROP COLUMN IF EXISTS business_type,
  DROP COLUMN IF EXISTS client,
  DROP COLUMN IF EXISTS active;

COMMIT;