-- Cashier is a valid legacy BPO destination. The review API has always
-- supported the CA decision, so retain the explicit operational state rather
-- than collapsing it into the later Invoiced state.
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
    'INVOICED',
    'DISPATCHED',
    'DECLINED',
    'POLICY ISSUED'
  ));