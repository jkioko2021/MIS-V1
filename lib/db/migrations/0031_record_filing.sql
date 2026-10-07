BEGIN;
INSERT INTO crm.profiles(profile_name,profile_type,is_active)
SELECT 'DPU','ADMIN',TRUE WHERE NOT EXISTS (
  SELECT 1 FROM crm.profiles WHERE LOWER(TRIM(profile_name))='dpu'
);
ALTER TABLE crm.business_tracking
  ADD COLUMN IF NOT EXISTS updated boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS policy_generated boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS policy_signed boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS policy_dispatched boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS filed boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS filed_by varchar(100),
  ADD COLUMN IF NOT EXISTS filed_date timestamptz;
ALTER TABLE crm.business_uploads
  ADD COLUMN IF NOT EXISTS filed boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS filed_by varchar(100),
  ADD COLUMN IF NOT EXISTS filed_date timestamptz;
ALTER TABLE crm.business_tracking DROP CONSTRAINT IF EXISTS chk_bt_status;
ALTER TABLE crm.business_tracking ADD CONSTRAINT chk_bt_status CHECK(file_status IN (
  'REGISTERED','FORWARDED','RETURNED-INCOMPLETE','MEDICAL UW-REVIEW',
  'BENEFIT VERIFICATION','ALLOCATED','ON HOLD','CASHIER','IT SUPPORT',
  'PENDING PAYMENT','CLOSED','INVOICED','DISPATCHED','DECLINED','POLICY ISSUED',
  'RECEIPTED','FILING','FILED'
));
CREATE TABLE IF NOT EXISTS crm.record_filing_reviews (
  filing_id serial PRIMARY KEY,
  file_no varchar(30) NOT NULL REFERENCES crm.business_tracking(file_no),
  filed_by varchar(100) NOT NULL,
  filed_at timestamptz NOT NULL DEFAULT NOW(),
  comments varchar(250) NOT NULL DEFAULT '',
  upload_ids integer[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS record_filing_reviews_file
  ON crm.record_filing_reviews(file_no,filed_at DESC);
ALTER TABLE crm.business_notifications ALTER COLUMN review_id DROP NOT NULL;
ALTER TABLE crm.business_notifications ADD COLUMN IF NOT EXISTS filing_id integer
  REFERENCES crm.record_filing_reviews(filing_id);
CREATE UNIQUE INDEX IF NOT EXISTS business_notifications_filing_recipient
  ON crm.business_notifications(filing_id,recipient_username) WHERE filing_id IS NOT NULL;
ALTER TABLE crm.business_notifications DROP CONSTRAINT IF EXISTS business_notification_source;
ALTER TABLE crm.business_notifications ADD CONSTRAINT business_notification_source
  CHECK (num_nonnulls(review_id,filing_id)=1);
COMMIT;
