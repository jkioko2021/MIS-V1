-- Receipts uploaded by the allocation owner before the Cashier handoff are
-- valid for that allocation cycle; older receipts must not authorize a new one.
ALTER TABLE crm.business_tracking ADD COLUMN IF NOT EXISTS cashier_document_from timestamptz;
