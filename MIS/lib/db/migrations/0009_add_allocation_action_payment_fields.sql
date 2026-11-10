-- Capture the invoice and payment decision supplied when an allocated business
-- file is handed to Cashier.  The cashier state itself remains separate from
-- the later invoiced state.
ALTER TABLE crm.business_tracking
  ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(25),
  ADD COLUMN IF NOT EXISTS paid_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMPTZ;