BEGIN;
INSERT INTO crm.profiles(profile_name,profile_type,is_active)
SELECT 'Pricing','ADMIN',TRUE WHERE NOT EXISTS (
  SELECT 1 FROM crm.profiles WHERE LOWER(TRIM(profile_name))='pricing'
);
ALTER TABLE crm.business_tracking ADD COLUMN IF NOT EXISTS benefit_ver_by VARCHAR(100);
ALTER TABLE crm.business_tracking ADD COLUMN IF NOT EXISTS benefit_ver_date TIMESTAMPTZ;
ALTER TABLE crm.business_work_items DROP CONSTRAINT IF EXISTS business_work_items_queue_name_check;
ALTER TABLE crm.business_work_items ADD CONSTRAINT business_work_items_queue_name_check
  CHECK(queue_name IN ('BPO_REVIEW_RETAIL','BPO_REVIEW_CORPORATE_SME','REGISTER_CORRECTION',
    'MEDICAL_UNDERWRITING','CASHIER','MEMBERSHIP_CLOSURE','IT_SUPPORT','RELATIONSHIP_MANAGEMENT','PRICING_REVIEW'));
CREATE TABLE IF NOT EXISTS crm.pricing_reviews (
  review_id SERIAL PRIMARY KEY,
  file_no VARCHAR(100) NOT NULL REFERENCES crm.business_tracking(file_no),
  action VARCHAR(3) NOT NULL CHECK(action IN ('YES','NO')),
  comments VARCHAR(250) NOT NULL,
  reviewed_by VARCHAR(100) NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  allocated_to VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS pricing_reviews_file ON crm.pricing_reviews(file_no,reviewed_at DESC);
-- Recover pending legacy pricing handoffs, not already-approved allocations.
WITH pending AS (
  UPDATE crm.business_tracking SET file_status='BENEFIT VERIFICATION',benefit_verified='NO',
    allocate_dt=NULL,to_pricing_dt=COALESCE(to_pricing_dt,NOW()),forwarded=TRUE,ready_for_update=TRUE,updated_at=NOW()
  WHERE is_active AND NOT is_declined AND allocated AND client_type IN ('C','S')
    AND COALESCE(benefit_verified,'NO')<>'YES' AND file_status IN ('ALLOCATED','BENEFIT VERIFICATION')
  RETURNING file_no,entered_by
)
INSERT INTO crm.business_work_items(file_no,queue_name,work_status,forwarded_by)
SELECT file_no,'PRICING_REVIEW','OPEN',entered_by FROM pending
ON CONFLICT(file_no,queue_name) DO UPDATE SET work_status='OPEN',updated_at=NOW();
COMMIT;
