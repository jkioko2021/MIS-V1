-- The legacy Corporate/SME page persists SME as S and Corporate as C.
-- Preserve those existing codes without changing historical records.
ALTER TABLE crm.business_tracking
  DROP CONSTRAINT IF EXISTS business_tracking_client_type_check;

ALTER TABLE crm.business_tracking
  ADD CONSTRAINT business_tracking_client_type_check
  CHECK (client_type IN ('R', 'S', 'C'));