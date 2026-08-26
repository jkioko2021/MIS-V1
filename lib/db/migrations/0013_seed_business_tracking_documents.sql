-- Canonical business-tracking document master for the Replit PostgreSQL database.
-- The existing crm.business_req table remains the integer foreign-key registry for
-- checklist/upload records. This table is the source of truth for the supplied
-- legacy document codes and business configuration.

BEGIN;

CREATE TABLE IF NOT EXISTS crm.tbl_mis_crm_business_req (
  doc_id INTEGER PRIMARY KEY,
  doc_code VARCHAR(20) NOT NULL UNIQUE,
  doc_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(10) NOT NULL,
  client VARCHAR(10) NOT NULL,
  active INTEGER NOT NULL,
  code INTEGER NOT NULL
);

DO $$
DECLARE
  invalid_columns TEXT;
BEGIN
  SELECT string_agg(expected.column_name, ', ' ORDER BY expected.column_name)
    INTO invalid_columns
  FROM (
    VALUES
      ('doc_id', 'integer', 'NO'),
      ('doc_code', 'character varying', 'NO'),
      ('doc_name', 'character varying', 'NO'),
      ('business_type', 'character varying', 'NO'),
      ('client', 'character varying', 'NO'),
      ('active', 'integer', 'NO'),
      ('code', 'integer', 'NO')
  ) AS expected(column_name, data_type, is_nullable)
  LEFT JOIN information_schema.columns AS actual
    ON actual.table_schema = 'crm'
   AND actual.table_name = 'tbl_mis_crm_business_req'
   AND actual.column_name = expected.column_name
  WHERE actual.column_name IS NULL
     OR actual.data_type <> expected.data_type
     OR actual.is_nullable <> expected.is_nullable;

  IF invalid_columns IS NOT NULL THEN
    RAISE EXCEPTION
      'crm.tbl_mis_crm_business_req has incompatible required columns: %',
      invalid_columns;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS constraint_def
    WHERE constraint_def.conrelid = 'crm.tbl_mis_crm_business_req'::regclass
      AND constraint_def.contype = 'p'
      AND constraint_def.conkey = ARRAY[
        (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid = 'crm.tbl_mis_crm_business_req'::regclass
            AND attname = 'doc_id'
            AND NOT attisdropped
        )
      ]
  ) THEN
    RAISE EXCEPTION
      'crm.tbl_mis_crm_business_req requires DOC_ID as its single-column primary key';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_index AS index_def
    WHERE index_def.indrelid = 'crm.tbl_mis_crm_business_req'::regclass
      AND index_def.indisunique
      AND cardinality(index_def.indkey::smallint[]) = 1
      AND index_def.indkey::smallint[] @> ARRAY[
        (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid = 'crm.tbl_mis_crm_business_req'::regclass
            AND attname = 'doc_code'
            AND NOT attisdropped
        )
      ]::smallint[]
  ) THEN
    RAISE EXCEPTION
      'crm.tbl_mis_crm_business_req requires a unique DOC_CODE constraint or index';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'crm'
      AND table_name = 'tbl_mis_crm_business_req'
      AND column_name = 'doc_id'
      AND is_identity = 'YES'
      AND identity_generation = 'ALWAYS'
  ) THEN
    RAISE EXCEPTION
      'DOC_ID is GENERATED ALWAYS; supplied authoritative IDs 90–134 cannot be loaded safely';
  END IF;
END $$;

CREATE TEMP TABLE business_tracking_document_seed (
  doc_id INTEGER PRIMARY KEY,
  doc_code VARCHAR(20) NOT NULL UNIQUE,
  doc_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(10) NOT NULL,
  client VARCHAR(10) NOT NULL,
  active INTEGER NOT NULL,
  code INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO business_tracking_document_seed
  (doc_id, doc_code, doc_name, business_type, client, active, code)
VALUES
  (90,  'RET01', 'Member Application Form(Full)', 'B', 'R', 1, 1),
  (91,  'RET02', 'ID or Passport(Front&Back)',    'B', 'R', 1, 1),
  (92,  'RET03', 'Pin Certificate',               'B', 'R', 1, 1),
  (93,  'RET04', 'Payment Proof',                 'B', 'R', 1, 1),
  (94,  'RET05', 'Passport Photo',                'B', 'R', 1, 1),
  (95,  'RET06', 'Medical Report',                'B', 'R', 1, 1),
  (96,  'RET07', 'Renewal Schedule',              'B', 'R', 1, 1),
  (97,  'RET08', 'Invoice',                       'B', 'R', 1, 1),
  (98,  'RET09', 'Contact Update Form',           'B', 'R', 1, 1),
  (99,  'RET10', 'Change Of Rep Letter',          'B', 'R', 1, 1),
  (100, 'RET11', 'Other Documents',               'B', 'R', 1, 1),
  (101, 'RET12', 'Email Correspondence',          'B', 'R', 1, 1),
  (102, 'RET13', 'Corporate proposal form',       'B', 'C', 1, 1),
  (103, 'RET14', 'Registration Certificate',      'B', 'C', 1, 1),
  (104, 'RET15', 'CR12',                          'B', 'C', 1, 1),
  (105, 'RET16', 'Fund contract',                 'B', 'C', 1, 1),
  (106, 'RET17', 'Rates and benefit Matrix',      'B', 'C', 1, 1),
  (107, 'RET18', 'Premium summary',               'B', 'C', 1, 1),
  (108, 'RET19', 'Payment Proof',                 'B', 'C', 1, 1),
  (109, 'RET20', 'Member List',                   'B', 'C', 1, 1),
  (110, 'RET21', 'Tender award letter',           'B', 'C', 1, 1),
  (111, 'RET22', 'Certificate of Practice',       'B', 'C', 1, 1),
  (112, 'RET23', 'Change Of Rep Letter',          'B', 'C', 1, 1),
  (113, 'RET24', 'System Receipt',                'B', 'C', 1, 3),
  (114, 'RET25', 'SODA',                          'B', 'C', 1, 1),
  (115, 'RET26', 'Allocation Form',               'B', 'C', 1, 1),
  (116, 'RET27', 'Credit Note',                   'B', 'C', 1, 1),
  (117, 'RET28', 'Policy Schedule',               'B', 'C', 1, 4),
  (118, 'RET29', 'Refund Documents',              'B', 'C', 1, 5),
  (119, 'RET30', 'System Invoice',                'B', 'C', 1, 3),
  (120, 'RET31', 'Refund Advice',                 'B', 'C', 1, 5),
  (121, 'RET32', 'Refund Schedule',               'B', 'C', 1, 5),
  (122, 'RET33', 'Finance Approval',              'B', 'C', 1, 5),
  (123, 'RET34', 'Bank Confirmation',             'B', 'C', 1, 5),
  (124, 'RET35', 'Remittance',                    'B', 'C', 1, 5),
  (125, 'RET36', 'Decline letter',                'B', 'C', 1, 5),
  (126, 'RET37', 'Debit Note',                    'B', 'C', 1, 5),
  (127, 'RET38', 'Statement',                     'B', 'C', 1, 5),
  (128, 'RET39', 'Credit Note',                   'B', 'C', 1, 5),
  (129, 'RET40', 'Other Documents',               'B', 'C', 1, 5),
  (130, 'RET41', 'Finance Approval',              'B', 'C', 1, 1),
  (131, 'RET42', 'Final Summary',                 'B', 'C', 1, 5),
  (132, 'RET43', 'AML Report',                    'B', 'C', 1, 4),
  (133, 'RET44', 'Email Correspondence',          'B', 'C', 1, 1),
  (134, 'RET45', 'Other Documents',               'B', 'C', 1, 1);

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM business_tracking_document_seed) <> 45
     OR (SELECT MIN(doc_id) FROM business_tracking_document_seed) <> 90
     OR (SELECT MAX(doc_id) FROM business_tracking_document_seed) <> 134
     OR EXISTS (
       SELECT 1
       FROM business_tracking_document_seed
       WHERE business_type <> 'B'
          OR active <> 1
          OR (doc_id BETWEEN 90 AND 101 AND client <> 'R')
          OR (doc_id BETWEEN 102 AND 134 AND client <> 'C')
     ) THEN
    RAISE EXCEPTION 'The supplied business tracking document seed failed validation';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM crm.tbl_mis_crm_business_req AS target
    JOIN business_tracking_document_seed AS source
      ON target.doc_code = source.doc_code
    WHERE target.doc_id <> source.doc_id
  ) OR EXISTS (
    SELECT 1
    FROM crm.tbl_mis_crm_business_req AS target
    JOIN business_tracking_document_seed AS source
      ON target.doc_id = source.doc_id
    WHERE target.doc_code <> source.doc_code
  ) THEN
    RAISE EXCEPTION
      'Existing target rows conflict with the authoritative DOC_ID/DOC_CODE pairing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM crm.business_req AS target
    JOIN business_tracking_document_seed AS source
      ON target.req_code = source.doc_id
    WHERE target.req_id <> source.doc_id
  ) THEN
    RAISE EXCEPTION
      'crm.business_req has a conflicting requirement code in the document ID range';
  END IF;
END $$;

INSERT INTO crm.tbl_mis_crm_business_req
  (doc_id, doc_code, doc_name, business_type, client, active, code)
SELECT doc_id, doc_code, doc_name, business_type, client, active, code
FROM business_tracking_document_seed
ON CONFLICT (doc_code) DO UPDATE
SET doc_id = EXCLUDED.doc_id,
    doc_name = EXCLUDED.doc_name,
    business_type = EXCLUDED.business_type,
    client = EXCLUDED.client,
    active = EXCLUDED.active,
    code = EXCLUDED.code
WHERE (crm.tbl_mis_crm_business_req.doc_id,
       crm.tbl_mis_crm_business_req.doc_name,
       crm.tbl_mis_crm_business_req.business_type,
       crm.tbl_mis_crm_business_req.client,
       crm.tbl_mis_crm_business_req.active,
       crm.tbl_mis_crm_business_req.code)
      IS DISTINCT FROM
      (EXCLUDED.doc_id,
       EXCLUDED.doc_name,
       EXCLUDED.business_type,
       EXCLUDED.client,
       EXCLUDED.active,
       EXCLUDED.code);

-- Existing checklist and upload foreign keys reference crm.business_req.req_id.
-- Keep matching IDs there as a compatibility registry while the configuration
-- endpoint below reads the canonical tbl_mis_crm_business_req master.
INSERT INTO crm.business_req
  (req_id, req_code, req_name, applies_to, is_active)
SELECT doc_id, doc_id, doc_name, client, active = 1
FROM business_tracking_document_seed
ON CONFLICT (req_id) DO UPDATE
SET req_code = EXCLUDED.req_code,
    req_name = EXCLUDED.req_name,
    applies_to = EXCLUDED.applies_to,
    is_active = EXCLUDED.is_active;

DO $$
DECLARE
  requirement_sequence TEXT;
  maximum_requirement_id INTEGER;
BEGIN
  SELECT pg_get_serial_sequence('crm.business_req', 'req_id')
    INTO requirement_sequence;
  SELECT GREATEST(COALESCE(MAX(req_id), 1), 1)
    INTO maximum_requirement_id
  FROM crm.business_req;

  IF requirement_sequence IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L, %s, true)',
      requirement_sequence,
      maximum_requirement_id
    );
  END IF;

  IF (SELECT COUNT(*) FROM crm.tbl_mis_crm_business_req WHERE doc_id BETWEEN 90 AND 134) <> 45
     OR (SELECT COUNT(DISTINCT doc_code) FROM crm.tbl_mis_crm_business_req WHERE doc_id BETWEEN 90 AND 134) <> 45
     OR EXISTS (
       SELECT 1
       FROM crm.tbl_mis_crm_business_req
       WHERE doc_id BETWEEN 90 AND 134
         AND (business_type <> 'B' OR active <> 1)
     )
     OR EXISTS (
       SELECT 1
       FROM crm.tbl_mis_crm_business_req
       WHERE doc_id BETWEEN 90 AND 101 AND client <> 'R'
     )
     OR EXISTS (
       SELECT 1
       FROM crm.tbl_mis_crm_business_req
       WHERE doc_id BETWEEN 102 AND 134 AND client <> 'C'
     )
     OR (SELECT COUNT(*) FROM crm.business_req WHERE req_id BETWEEN 90 AND 134) <> 45 THEN
    RAISE EXCEPTION 'Business tracking document post-load verification failed';
  END IF;
END $$;

COMMIT;