-- Keep the historical six-character OTP table intact; modern challenges use digests.
CREATE TABLE IF NOT EXISTS crm.login_otp_challenges (
  challenge_id UUID PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES crm.employees(employee_id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  credential_stamp VARCHAR(64) NOT NULL,
  recipient_stamp VARCHAR(64) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  attempts INTEGER NOT NULL DEFAULT 0,
  sent BOOLEAN NOT NULL DEFAULT FALSE,
  used BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS login_otp_employee_date_idx
  ON crm.login_otp_challenges(employee_id, generated_at DESC);
