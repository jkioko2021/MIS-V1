-- Legacy Allocation Files actions still route a record out of ALLOCATED.
-- Keep their outcomes explicit instead of collapsing IT, Closed, or RM into
-- an unrelated modern queue state.
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
    'POLICY ISSUED',
    'CLOSED',
    'IT SUPPORT',
    'PENDING PAYMENT'
  ));