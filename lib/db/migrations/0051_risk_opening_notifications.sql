CREATE TABLE IF NOT EXISTS risk.opening_notifications (
  notification_id SERIAL PRIMARY KEY,
  summary_id INTEGER NOT NULL REFERENCES risk.department_summary(summary_id) ON DELETE CASCADE,
  depart_code VARCHAR(30) NOT NULL,
  source_period_id INTEGER NOT NULL REFERENCES risk.periods(period_id),
  period_id INTEGER NOT NULL REFERENCES risk.periods(period_id),
  champion_username VARCHAR(100) NOT NULL,
  champion_email TEXT,
  owner_username VARCHAR(100),
  owner_email TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  email_status VARCHAR(30) NOT NULL CHECK(email_status IN
    ('PENDING','WAITING_CONFIGURATION','NO_RECIPIENT','SENT','RETRY','FAILED','CANCELLED')),
  email_attempts INTEGER NOT NULL DEFAULT 0,
  email_error TEXT,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(depart_code,source_period_id,period_id,champion_username)
);
CREATE INDEX IF NOT EXISTS risk_opening_notifications_outbox ON risk.opening_notifications(next_attempt_at)
  WHERE email_status IN ('PENDING','WAITING_CONFIGURATION','NO_RECIPIENT','RETRY');
