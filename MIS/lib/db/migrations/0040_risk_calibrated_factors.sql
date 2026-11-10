BEGIN;
CREATE TABLE IF NOT EXISTS risk.impact_factors (
 impact_code varchar(20) PRIMARY KEY, impact_factor varchar(50) NOT NULL,
 rate_factor numeric(8,2) NOT NULL CHECK(rate_factor>0 AND rate_factor<=100),
 rate varchar(50) NOT NULL, is_active boolean NOT NULL DEFAULT true
);
INSERT INTO risk.impact_factors VALUES
 ('IMP_01','Catastrophic',100,'High',true),('IMP_02','Major',70,'Moderate',true),
 ('IMP_03','Moderate',50,'Low',true),('IMP_04','Minor',30,'Low',true),('IMP_05','Insignificant',10,'Low',true)
ON CONFLICT(impact_code) DO UPDATE SET impact_factor=EXCLUDED.impact_factor,rate_factor=EXCLUDED.rate_factor,rate=EXCLUDED.rate,is_active=EXCLUDED.is_active;
CREATE TABLE IF NOT EXISTS risk.likelihood_factors (
 likelihood_code varchar(20) PRIMARY KEY, likelihood_factor varchar(50) NOT NULL,
 qualification_criteria text NOT NULL, rating numeric(8,6) NOT NULL CHECK(rating>0 AND rating<=1),
 is_active boolean NOT NULL DEFAULT true
);
INSERT INTO risk.likelihood_factors VALUES
 ('LIK_01','Certain','The risk is almost certain to occur in the current circumstances',0.90,true),
 ('LIK_02','Likely','More than an even chance of occurring',0.65,true),
 ('LIK_03','Possible','Could occur',0.40,true),
 ('LIK_04','Unlikely','Small likelihood but could happen',0.20,true),
 ('LIK_05','Rare','Not expected to happen - Event would be a surprise',0.10,true)
ON CONFLICT(likelihood_code) DO UPDATE SET likelihood_factor=EXCLUDED.likelihood_factor,qualification_criteria=EXCLUDED.qualification_criteria,rating=EXCLUDED.rating,is_active=EXCLUDED.is_active;
CREATE TABLE IF NOT EXISTS risk.exposure_bands (
 risk_type varchar(1) NOT NULL CHECK(risk_type IN ('I','R')),
 level varchar(20) NOT NULL, minimum numeric(8,2) NOT NULL,
 maximum numeric(8,2) NOT NULL, description text NOT NULL,
 PRIMARY KEY(risk_type,minimum), CHECK(minimum>=0 AND maximum<=100 AND maximum>=minimum)
);
INSERT INTO risk.exposure_bands VALUES
 ('I','Extreme',41.00,100.00,'This risk must be shared, terminated or controlled'),
 ('I','High',26.00,40.99,'This risk should be shared or controlled'),
 ('I','Moderate',15.00,25.99,'This risk will typically be controlled (treated)'),
 ('I','Low',7.00,14.99,'Management will make an informed decision as to whether this risk must be controlled or absorbed by the business unit. The decision will be based on a “cost vs. benefit” approach'),
 ('I','Low',0.00,6.99,'Impact and probability is insignificant. This risk may be tolerated, and cost of losses will be absorbed by the operating unit'),
 ('R','Extreme',32.50,100.00,'Immediate action: Management must immediately escalate to Exco and Board. Immediate remediation plans must be instituted.'),
 ('R','High',12.50,32.49,'Action: Immediate escalation to Exco. Management must implement action to reduce the exposure further.'),
 ('R','Moderate',5.50,12.49,'Action: Management must implement action to reduce the exposure further.'),
 ('R','Low',0.00,5.49,'Tolerate - within acceptable limits. Management to monitor exposure level.')
ON CONFLICT(risk_type,minimum) DO UPDATE SET level=EXCLUDED.level,maximum=EXCLUDED.maximum,description=EXCLUDED.description;
COMMIT;
