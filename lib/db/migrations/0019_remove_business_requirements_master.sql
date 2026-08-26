-- crm.business_req is the consolidated business requirement master.
-- The exact RET01–RET45 rows are verified in the extended table before the
-- redundant compatibility source is removed.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    WITH expected (doc_id, doc_code, doc_name, business_type, client, active, code) AS (
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
        (134, 'RET45', 'Other Documents',               'B', 'C', 1, 1)
    )
    SELECT 1
    FROM expected
    LEFT JOIN crm.business_req actual ON actual.doc_id = expected.doc_id
    WHERE actual.req_id IS DISTINCT FROM expected.doc_id
       OR actual.req_code IS DISTINCT FROM expected.doc_id
       OR actual.req_name IS DISTINCT FROM expected.doc_name
       OR actual.applies_to IS DISTINCT FROM expected.client
       OR actual.is_active IS DISTINCT FROM (expected.active = 1)
       OR actual.doc_code IS DISTINCT FROM expected.doc_code
       OR actual.doc_name IS DISTINCT FROM expected.doc_name
       OR actual.business_type IS DISTINCT FROM expected.business_type
       OR actual.client IS DISTINCT FROM expected.client
       OR actual.active IS DISTINCT FROM expected.active
       OR actual.code IS DISTINCT FROM expected.code
  ) OR (
    SELECT COUNT(*)
    FROM crm.business_req
    WHERE doc_id BETWEEN 90 AND 134
  ) <> 45 THEN
    RAISE EXCEPTION 'Cannot remove tbl_mis_business_requirements: crm.business_req does not exactly match the required RET01–RET45 load.';
  END IF;
END $$;

DROP TABLE IF EXISTS crm.tbl_mis_business_requirements;

COMMIT;