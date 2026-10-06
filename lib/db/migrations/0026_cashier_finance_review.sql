-- Cashier review records the legacy receipting outcomes on the original file.
ALTER TABLE crm.business_tracking
  ADD COLUMN IF NOT EXISTS receipted boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS receipt_no varchar(50),
  ADD COLUMN IF NOT EXISTS receipt_date timestamptz,
  ADD COLUMN IF NOT EXISTS cashier_by varchar(100),
  ADD COLUMN IF NOT EXISTS to_cashier_dt timestamptz;

ALTER TABLE crm.business_tracking DROP CONSTRAINT IF EXISTS chk_bt_status;
ALTER TABLE crm.business_tracking ADD CONSTRAINT chk_bt_status CHECK (file_status IN (
  'REGISTERED','FORWARDED','RETURNED-INCOMPLETE','MEDICAL UW-REVIEW',
  'BENEFIT VERIFICATION','ALLOCATED','ON HOLD','CASHIER','IT SUPPORT',
  'PENDING PAYMENT','CLOSED','INVOICED','DISPATCHED','DECLINED','POLICY ISSUED',
  'RECEIPTED','FILING'
));
ALTER TABLE crm.business_work_items DROP CONSTRAINT IF EXISTS business_work_items_queue_name_check;
ALTER TABLE crm.business_work_items ADD CONSTRAINT business_work_items_queue_name_check CHECK (queue_name IN (
  'BPO_REVIEW_RETAIL','BPO_REVIEW_CORPORATE_SME','REGISTER_CORRECTION',
  'MEDICAL_UNDERWRITING','CASHIER','MEMBERSHIP_CLOSURE','IT_SUPPORT',
  'RELATIONSHIP_MANAGEMENT','PRICING_REVIEW','CREDIT_CONTROL'
));
CREATE TABLE IF NOT EXISTS crm.cashier_reviews (
  review_id serial PRIMARY KEY,
  file_no varchar(30) NOT NULL REFERENCES crm.business_tracking(file_no),
  action varchar(2) NOT NULL CHECK (action IN ('M','RM','RI','CC')),
  paid_status varchar(20) NOT NULL CHECK (paid_status IN ('FULL-PAID','PART-PAID','NOT-PAID')),
  invoice_no varchar(50),
  receipt_no varchar(50),
  comments varchar(250) NOT NULL,
  reviewed_by varchar(100) NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cashier_reviews_file ON crm.cashier_reviews(file_no,reviewed_at DESC);
-- Existing invoice handoffs already carry an invoice number; make the flag agree.
UPDATE crm.business_tracking b SET invoiced=TRUE,
  to_cashier_dt=COALESCE(b.to_cashier_dt,cw.forwarded_at)
FROM crm.business_work_items cw WHERE cw.file_no=b.file_no AND cw.queue_name='CASHIER'
  AND cw.work_status='OPEN' AND b.file_status='CASHIER'
  AND NULLIF(TRIM(b.invoice_no),'') IS NOT NULL;
