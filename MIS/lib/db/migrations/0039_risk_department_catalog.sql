-- User-supplied department codes. Preserve historical codes and assignments.
BEGIN;
INSERT INTO risk.departments(depart_code,depart_name,is_active) VALUES
 ('D-01-202101','Customer Service',true),
 ('D-01-202102','HR',true),
 ('D-01-202103','ICT',true),
 ('D-01-202104','Pricing',true),
 ('D-01-202105','Medical Underwriting',true),
 ('D-01-202106','Retention',true),
 ('D-01-202107','Non - Medical/ Reinsurance',true),
 ('D-01-202108','Document Management',false),
 ('D-01-202109','Provider Network Management (PNM)',true),
 ('D-01-202110','Claims & DMS',true),
 ('D-01-202111','Case Management',true),
 ('D-01-202112','Business Analysis & Quality Assurance',false),
 ('D-01-202113','Sales',true),
 ('D-01-202114','Product Development',true),
 ('D-01-202115','Membership',true),
 ('D-01-202116','Finance & Procurement',true),
 ('D-01-202117','Health Promotion',true),
 ('D-01-202118','Registry',true),
 ('D-01-202119','Retention - Retail',true),
 ('D-01-202120','Marketing',true),
 ('D-01-202121','Digital Transformation',true),
 ('D-01-202122','GI Claims',true),
 ('D-01-202123','Corporate Sales',true),
 ('D-01-202124','Actuarial',true),
 ('D-01-202125','Risk & Compliance',true),
 ('D-01-202126','ESG',true)
ON CONFLICT (depart_code) DO UPDATE SET depart_name=EXCLUDED.depart_name,is_active=EXCLUDED.is_active;
COMMIT;
