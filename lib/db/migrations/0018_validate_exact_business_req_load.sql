-- Validate the already-loaded exact RET01–RET45 bridge in environments that
-- applied the first extension before its scope guard was added.

BEGIN;

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM crm.business_req
    WHERE doc_id BETWEEN 90 AND 134
      AND doc_code ~ '^RET(0[1-9]|[1-3][0-9]|4[0-5])$'
  ) <> 45 THEN
    RAISE EXCEPTION 'Exact RET01–RET45 legacy load is incomplete.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM crm.tbl_mis_business_requirements master
    JOIN crm.business_req legacy ON legacy.req_id = master.doc_id
    WHERE master.doc_id BETWEEN 90 AND 134
      AND (
        legacy.req_code IS DISTINCT FROM master.doc_id
        OR legacy.req_name IS DISTINCT FROM master.doc_name
        OR legacy.applies_to IS DISTINCT FROM master.client
        OR legacy.is_active IS DISTINCT FROM (master.active = 1)
        OR legacy.doc_id IS DISTINCT FROM master.doc_id
        OR legacy.doc_code IS DISTINCT FROM master.doc_code
        OR legacy.doc_name IS DISTINCT FROM master.doc_name
        OR legacy.business_type IS DISTINCT FROM master.business_type
        OR legacy.client IS DISTINCT FROM master.client
        OR legacy.active IS DISTINCT FROM master.active
        OR legacy.code IS DISTINCT FROM master.code
      )
  ) THEN
    RAISE EXCEPTION 'Exact RET01–RET45 legacy rows do not match their master records.';
  END IF;
END $$;

COMMIT;