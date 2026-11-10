-- Make the Parameter Settings master sequence safe when a legacy requirement
-- table already contains IDs beyond the seeded document set.

BEGIN;

LOCK TABLE crm.tbl_mis_business_requirements IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE crm.business_req IN SHARE ROW EXCLUSIVE MODE;

SELECT setval(
  pg_get_serial_sequence('crm.tbl_mis_business_requirements', 'doc_id'),
  GREATEST(
    (SELECT COALESCE(MAX(doc_id), 1) FROM crm.tbl_mis_business_requirements),
    (SELECT COALESCE(MAX(req_id), 1) FROM crm.business_req),
    1
  ),
  true
);

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