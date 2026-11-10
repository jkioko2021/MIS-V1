-- Extend the legacy compatibility registry with the exact seven-field
-- business requirement contract. Existing req_* columns remain for older
-- checklist/upload consumers.

BEGIN;

ALTER TABLE crm.business_req
  ADD COLUMN IF NOT EXISTS doc_id INTEGER,
  ADD COLUMN IF NOT EXISTS doc_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS doc_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS business_type VARCHAR(10),
  ADD COLUMN IF NOT EXISTS client VARCHAR(10),
  ADD COLUMN IF NOT EXISTS active INTEGER,
  ADD COLUMN IF NOT EXISTS code INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_req_exact_active_chk'
      AND conrelid = 'crm.business_req'::regclass
  ) THEN
    ALTER TABLE crm.business_req
      ADD CONSTRAINT business_req_exact_active_chk CHECK (active IS NULL OR active IN (0, 1));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_req_exact_code_chk'
      AND conrelid = 'crm.business_req'::regclass
  ) THEN
    ALTER TABLE crm.business_req
      ADD CONSTRAINT business_req_exact_code_chk CHECK (code IS NULL OR code > 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_req_exact_client_chk'
      AND conrelid = 'crm.business_req'::regclass
  ) THEN
    ALTER TABLE crm.business_req
      ADD CONSTRAINT business_req_exact_client_chk CHECK (client IS NULL OR client IN ('R', 'C'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS business_req_doc_id_unique_idx
  ON crm.business_req (doc_id)
  WHERE doc_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS business_req_doc_code_unique_idx
  ON crm.business_req (doc_code)
  WHERE doc_code IS NOT NULL;

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM crm.tbl_mis_business_requirements
    WHERE doc_id BETWEEN 90 AND 134
      AND doc_code ~ '^RET(0[1-9]|[1-3][0-9]|4[0-5])$'
  ) <> 45 THEN
    RAISE EXCEPTION 'Cannot extend business_req: the exact RET01–RET45 source set is incomplete.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM crm.tbl_mis_business_requirements master
    JOIN crm.business_req legacy ON legacy.req_id = master.doc_id
    WHERE master.doc_id BETWEEN 90 AND 134
      AND master.doc_code ~ '^RET(0[1-9]|[1-3][0-9]|4[0-5])$'
      AND (
        legacy.req_code IS DISTINCT FROM master.doc_id
        OR legacy.req_name IS DISTINCT FROM master.doc_name
        OR legacy.applies_to IS DISTINCT FROM master.client
        OR legacy.is_active IS DISTINCT FROM (master.active = 1)
        OR (
          (legacy.doc_id IS NOT NULL OR legacy.doc_code IS NOT NULL OR legacy.doc_name IS NOT NULL
           OR legacy.business_type IS NOT NULL OR legacy.client IS NOT NULL
           OR legacy.active IS NOT NULL OR legacy.code IS NOT NULL)
          AND (
            legacy.doc_id IS DISTINCT FROM master.doc_id
            OR legacy.doc_code IS DISTINCT FROM master.doc_code
            OR legacy.doc_name IS DISTINCT FROM master.doc_name
            OR legacy.business_type IS DISTINCT FROM master.business_type
            OR legacy.client IS DISTINCT FROM master.client
            OR legacy.active IS DISTINCT FROM master.active
            OR legacy.code IS DISTINCT FROM master.code
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'Cannot extend business_req: a RET01–RET45 legacy row does not match its established bridge.';
  END IF;
END $$;

-- Only the supplied RET01–RET45 records are touched by this backfill.
INSERT INTO crm.business_req
  (req_id, req_code, req_name, applies_to, is_active,
   doc_id, doc_code, doc_name, business_type, client, active, code)
SELECT doc_id, doc_id, doc_name, client, active = 1,
       doc_id, doc_code, doc_name, business_type, client, active, code
FROM crm.tbl_mis_business_requirements
WHERE doc_id BETWEEN 90 AND 134
  AND doc_code ~ '^RET(0[1-9]|[1-3][0-9]|4[0-5])$'
ON CONFLICT (req_id) DO UPDATE
SET req_code = EXCLUDED.req_code,
    req_name = EXCLUDED.req_name,
    applies_to = EXCLUDED.applies_to,
    is_active = EXCLUDED.is_active,
    doc_id = EXCLUDED.doc_id,
    doc_code = EXCLUDED.doc_code,
    doc_name = EXCLUDED.doc_name,
    business_type = EXCLUDED.business_type,
    client = EXCLUDED.client,
    active = EXCLUDED.active,
    code = EXCLUDED.code;

SELECT setval(
  pg_get_serial_sequence('crm.business_req', 'req_id'),
  GREATEST(
    (SELECT COALESCE(MAX(doc_id), 1) FROM crm.tbl_mis_business_requirements),
    (SELECT COALESCE(MAX(req_id), 1) FROM crm.business_req),
    1
  ),
  true
);

COMMIT;