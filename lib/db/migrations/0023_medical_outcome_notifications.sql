BEGIN;
CREATE TABLE IF NOT EXISTS crm.business_notifications (
  notification_id SERIAL PRIMARY KEY,
  file_no VARCHAR(100) NOT NULL REFERENCES crm.business_tracking(file_no),
  review_id INTEGER NOT NULL UNIQUE REFERENCES crm.medical_underwriting_reviews(review_id),
  recipient_username VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  email_status VARCHAR(30) NOT NULL DEFAULT 'WAITING_CONFIGURATION'
    CHECK (email_status IN ('WAITING_CONFIGURATION','PENDING','SENT','RETRY','NO_RECIPIENT')),
  email_attempts INTEGER NOT NULL DEFAULT 0,
  email_sent_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_error VARCHAR(250)
);
CREATE INDEX IF NOT EXISTS business_notifications_recipient
  ON crm.business_notifications(recipient_username,created_at DESC);
CREATE INDEX IF NOT EXISTS business_notifications_outbox
  ON crm.business_notifications(next_attempt_at) WHERE email_status <> 'SENT';
COMMIT;
