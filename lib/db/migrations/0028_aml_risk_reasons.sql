CREATE TABLE IF NOT EXISTS crm.aml_risk_reasons (
  reason_id serial PRIMARY KEY,
  reason_name varchar(200) NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT TRUE
);
INSERT INTO crm.aml_risk_reasons(reason_name,display_order) VALUES
  ('No alerts identified',1),
  ('False positives alerts',2),
  ('Politically Exposed Person',3),
  ('Alerts identified and approved',4)
ON CONFLICT(reason_name) DO UPDATE SET display_order=EXCLUDED.display_order,is_active=TRUE;
