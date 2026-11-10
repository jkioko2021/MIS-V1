-- Every legacy Allocation Files action must leave the file in a named,
-- accountable operational queue. Keep BPO queues intact while admitting the
-- destination teams used by Cashier, Medical UW, Return Incomplete, Closed,
-- IT Support, and RM/pending-payment handoffs.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'crm.business_work_items'::regclass
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%queue_name%'
  LOOP
    EXECUTE format('ALTER TABLE crm.business_work_items DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE crm.business_work_items
  ADD CONSTRAINT business_work_items_queue_name_check
  CHECK (queue_name IN (
    'BPO_REVIEW_RETAIL',
    'BPO_REVIEW_CORPORATE_SME',
    'REGISTER_CORRECTION',
    'MEDICAL_UNDERWRITING',
    'CASHIER',
    'MEMBERSHIP_CLOSURE',
    'IT_SUPPORT',
    'RELATIONSHIP_MANAGEMENT'
  ));

ALTER TABLE crm.business_tracking
  DROP CONSTRAINT IF EXISTS chk_bt_status;

ALTER TABLE crm.business_tracking
  ADD CONSTRAINT chk_bt_status
  CHECK (file_status IN (
    'REGISTERED',
    'FORWARDED',
    'RETURNED-INCOMPLETE',
    'MEDICAL UW-REVIEW',
    'BENEFIT VERIFICATION',
    'ALLOCATED',
    'ON HOLD',
    'CASHIER',
    'IT SUPPORT',
    'PENDING PAYMENT',
    'CLOSED',
    'INVOICED',
    'DISPATCHED',
    'DECLINED',
    'POLICY ISSUED'
  ));