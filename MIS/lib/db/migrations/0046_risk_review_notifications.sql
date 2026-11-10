CREATE TABLE IF NOT EXISTS risk.review_notifications (
  notification_id SERIAL PRIMARY KEY,
  summary_id INTEGER NOT NULL REFERENCES risk.department_summary(summary_id),
  submitted_at TIMESTAMPTZ NOT NULL,
  depart_code VARCHAR(30) NOT NULL,
  period_id INTEGER NOT NULL REFERENCES risk.periods(period_id),
  recipient_username VARCHAR(100) NOT NULL,
  submitted_by VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  email_status VARCHAR(30) NOT NULL CHECK (email_status IN
    ('PENDING','WAITING_CONFIGURATION','NO_RECIPIENT','SENT','RETRY','FAILED','CANCELLED')),
  email_attempts INTEGER NOT NULL DEFAULT 0,
  email_error TEXT,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(summary_id, submitted_at)
);
CREATE INDEX IF NOT EXISTS risk_review_notifications_outbox
  ON risk.review_notifications(next_attempt_at)
  WHERE email_status IN ('PENDING','WAITING_CONFIGURATION','NO_RECIPIENT','RETRY');
