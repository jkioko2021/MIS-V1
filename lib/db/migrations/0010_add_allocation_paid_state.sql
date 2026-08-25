-- Preserve the payment outcome chosen during a Cashier handoff. This mirrors
-- the legacy Paid flag while keeping the existing paid_status value for display
-- and audit context.
ALTER TABLE crm.business_tracking
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT FALSE;