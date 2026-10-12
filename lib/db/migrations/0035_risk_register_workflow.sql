-- Additive development schema for the departmental risk-register workflow.
BEGIN;
ALTER TABLE risk.risk_master ADD COLUMN IF NOT EXISTS assessment_updated boolean NOT NULL DEFAULT false;
-- Preserve fractional effectiveness rather than rounding 33.33% to 0.33.
ALTER TABLE risk.risk_master ALTER COLUMN perceived_rate TYPE numeric(12,6);
ALTER TABLE risk.department_summary ADD COLUMN IF NOT EXISTS closed boolean NOT NULL DEFAULT false;
ALTER TABLE risk.department_summary ADD COLUMN IF NOT EXISTS closed_by varchar(100);
ALTER TABLE risk.department_summary ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE risk.department_summary ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS risk.department_assignments (
  depart_code varchar(50) PRIMARY KEY REFERENCES risk.departments(depart_code),
  champion_username varchar(100) NOT NULL,
  owner_username varchar(100) NOT NULL,
  assigned_by varchar(100) NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS risk.register_history (
  history_id bigserial PRIMARY KEY,
  risk_code varchar(100),
  depart_code varchar(50) REFERENCES risk.departments(depart_code),
  period_id integer REFERENCES risk.periods(period_id),
  action varchar(40) NOT NULL,
  actor varchar(100) NOT NULL,
  comments text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS risk_register_history_scope ON risk.register_history(depart_code,period_id,history_id);
CREATE SEQUENCE IF NOT EXISTS risk.register_code_seq;
CREATE UNIQUE INDEX IF NOT EXISTS risk_period_dates_unique ON risk.periods(period_from,period_to);
COMMIT;
