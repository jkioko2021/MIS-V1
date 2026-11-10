BEGIN;
ALTER TABLE crm.aml_risk_reasons ADD COLUMN IF NOT EXISTS reason_code varchar(3);
CREATE UNIQUE INDEX IF NOT EXISTS aml_risk_reasons_code_unique
 ON crm.aml_risk_reasons(reason_code) WHERE reason_code IS NOT NULL;
INSERT INTO crm.aml_risk_reasons(reason_code,reason_name,display_order,is_active) VALUES
 ('NAI','No alerts identified',1,true),
 ('FPA','False positives alerts',2,true),
 ('PEP','Politically Exposed Person',3,true),
 ('AIA','Alerts identified and approved',4,true)
ON CONFLICT(reason_name) DO UPDATE SET reason_code=EXCLUDED.reason_code,display_order=EXCLUDED.display_order,is_active=true;
COMMIT;
