BEGIN;
INSERT INTO crm.profiles(profile_name,profile_type,is_active)
SELECT 'GI','ADMIN',TRUE WHERE NOT EXISTS
  (SELECT 1 FROM crm.profiles WHERE LOWER(TRIM(profile_name))='gi');
ALTER TABLE crm.business_work_items DROP CONSTRAINT IF EXISTS business_work_items_queue_name_check;
ALTER TABLE crm.business_work_items ADD CONSTRAINT business_work_items_queue_name_check
  CHECK(queue_name IN ('BPO_REVIEW_RETAIL','BPO_REVIEW_CORPORATE_SME','REGISTER_CORRECTION',
    'MEDICAL_UNDERWRITING','CASHIER','MEMBERSHIP_CLOSURE','IT_SUPPORT',
    'RELATIONSHIP_MANAGEMENT','PRICING_REVIEW','CREDIT_CONTROL','GI_ALLOCATE','GI_ALLOCATED'));
CREATE TABLE IF NOT EXISTS crm.gi_reviews (
  gi_review_id serial PRIMARY KEY,
  file_no varchar(30) NOT NULL REFERENCES crm.business_tracking(file_no),
  action varchar(2) NOT NULL CHECK(action IN ('A','RI')),
  reviewed_by varchar(100) NOT NULL,
  recipient_username varchar(100) NOT NULL,
  comments varchar(250) NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS gi_reviews_file ON crm.gi_reviews(file_no,reviewed_at DESC);
ALTER TABLE crm.business_notifications ADD COLUMN IF NOT EXISTS gi_review_id integer
  REFERENCES crm.gi_reviews(gi_review_id);
CREATE UNIQUE INDEX IF NOT EXISTS business_notifications_gi_recipient
  ON crm.business_notifications(gi_review_id,recipient_username) WHERE gi_review_id IS NOT NULL;
ALTER TABLE crm.business_notifications DROP CONSTRAINT IF EXISTS business_notification_source;
ALTER TABLE crm.business_notifications ADD CONSTRAINT business_notification_source
  CHECK(num_nonnulls(review_id,filing_id,gi_review_id)=1);
-- Move only pending, undecided BPO handoffs for nonmedical business.
-- Existing downstream allocations and medical registrations are not reassigned.
INSERT INTO crm.business_work_items
  (file_no,queue_name,work_status,assigned_by,forwarded_by,forwarded_at)
SELECT b.file_no,'GI_ALLOCATE','OPEN',b.forwarded_by,b.forwarded_by,COALESCE(b.forward_date,b.updated_at,NOW())
FROM crm.business_tracking b WHERE b.business='N' AND b.is_active AND NOT b.is_declined
  AND b.forwarded AND b.file_status='FORWARDED' AND NOT b.invoiced AND NOT b.receipted
  AND EXISTS (SELECT 1 FROM crm.business_work_items w WHERE w.file_no=b.file_no
    AND w.queue_name IN ('BPO_REVIEW_RETAIL','BPO_REVIEW_CORPORATE_SME') AND w.work_status='OPEN')
ON CONFLICT(file_no,queue_name) DO NOTHING;
UPDATE crm.business_tracking b SET allocated=FALSE,allocated_to=NULL,allocate_dt=NULL,
  ready_for_update=TRUE,updated_at=NOW()
WHERE EXISTS (SELECT 1 FROM crm.business_work_items w WHERE w.file_no=b.file_no
  AND w.queue_name='GI_ALLOCATE' AND w.work_status='OPEN');
UPDATE crm.business_work_items w SET work_status='COMPLETED',updated_at=NOW()
WHERE w.queue_name IN ('BPO_REVIEW_RETAIL','BPO_REVIEW_CORPORATE_SME') AND w.work_status='OPEN'
  AND EXISTS (SELECT 1 FROM crm.business_work_items g WHERE g.file_no=w.file_no
    AND g.queue_name='GI_ALLOCATE' AND g.work_status='OPEN');
COMMIT;
