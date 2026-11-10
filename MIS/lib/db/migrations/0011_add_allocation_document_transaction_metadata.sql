-- Preserve document-specific transaction context from the legacy allocation
-- panel alongside the uploaded document rather than overloading file-level
-- workflow fields.
ALTER TABLE crm.business_uploads
  ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(25),
  ADD COLUMN IF NOT EXISTS amount NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS policy_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS risk_rate VARCHAR(20),
  ADD COLUMN IF NOT EXISTS risk_reason TEXT;