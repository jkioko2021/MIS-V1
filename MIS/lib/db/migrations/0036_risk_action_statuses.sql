-- Approved action statuses; legacy Open remains readable but is not offered for new actions.
BEGIN;
CREATE TABLE IF NOT EXISTS risk.action_statuses (
  status_code varchar(20) PRIMARY KEY,
  status_name varchar(50) NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true
);
INSERT INTO risk.action_statuses(status_code,status_name,description,is_active) VALUES
 ('AC_01','Behind schedule','The project to implement the control improvement is behind schedule and requires management attention',true),
 ('AC_02','Planned','The project has been planned to implement the control improvement but the start date has not yet commenced',true),
 ('AC_03','In progress','The project to implement the control improvement is progressing as planned',true),
 ('AC_06','Closed',NULL,true),
 ('LEGACY_OPEN','Open','Historical status retained for existing actions only.',false)
ON CONFLICT (status_code) DO NOTHING;
ALTER TABLE risk.root_causes DROP CONSTRAINT IF EXISTS root_causes_action_status_check;
ALTER TABLE risk.root_causes ALTER COLUMN action_status SET DEFAULT 'Planned';
ALTER TABLE risk.root_causes DROP CONSTRAINT IF EXISTS risk_root_cause_status_fk;
ALTER TABLE risk.root_causes ADD CONSTRAINT risk_root_cause_status_fk
  FOREIGN KEY (action_status) REFERENCES risk.action_statuses(status_name);
COMMIT;
