-- Synthetic local catalogs only. Names required by authorization are intentional.
INSERT INTO crm.profiles(profile_id,profile_name,profile_type) VALUES
  (1,'SuperAdmin','ADMIN'),(2,'System Admin','ADMIN'),(3,'Business Entry','ADMIN'),
  (4,'BPO Review','ADMIN'),(5,'Medical UW','ADMIN'),(6,'Membership Admin','ADMIN'),
  (7,'Pricing','ADMIN'),(8,'Finance','ADMIN'),(9,'Dispatch','ADMIN'),(10,'GI','ADMIN'),
  (11,'Risk Champion','ADMIN'),(12,'DPU','ADMIN'),(13,'IT Support','ADMIN'),(14,'Retention','ADMIN');
SELECT setval(pg_get_serial_sequence('crm.profiles','profile_id'),14,true);
INSERT INTO crm.password_config(min_length) VALUES (12);

WITH menus(main,sub,url,sort) AS (VALUES
  ('Dashboard','Overview','/',10),('Dashboard','Notifications','/notifications',20),
  ('Business','Register Queue','/business',10),
  ('Business','BPO Review Retail','/business/bpo-retail',20),
  ('Business','BPO Review Corporates/SME','/business/bpo-corporate-sme',30),
  ('Business','Medical Review','/business/medical-review',40),
  ('Business','Pricing Review','/business/pricing',50),
  ('Business','Allocated Files','/business/allocated',60),
  ('Business','Cashier Review','/business/cashier',70),
  ('Business','Record Filing','/business/record-filing',80),
  ('Business','GI-Allocate','/business/gi-allocate',81),
  ('Business','GI-Allocated','/business/gi-allocated',82),
  ('Business','Business Status','/business/status',83),
  ('Business','Register Business','/business/new',90),
  ('Business','Finance Queue','/business/finance',100),
  ('Business','Dispatch Queue','/business/dispatch',110),
  ('Business','Declined Files','/business/declined',120),
  ('Risk','Risk Dashboard','/risk',10),('Risk','New Risk Entry','/risk/new',20),
  ('Risk','My Department Risks','/risk/open',30),
  ('Reports','Business Reports','/reports/business',10),
  ('Reports','Risk Reports','/reports/risk',20),
  ('Admin','User Management','/admin/users',10),
  ('Admin','Profile Management','/admin/profiles',20),
  ('Admin','Audit Trail','/admin/audit',30),
  ('Admin','Password Config','/admin/password-config',40),
  ('Parameter Settings','Configure Business Req','/admin/business-requirements',10)
), access AS (
  SELECT p.profile_id,m.*,
    p.profile_id IN (1,2) OR m.main='Dashboard'
    OR (p.profile_id=3 AND m.url IN ('/business','/business/new','/business/status'))
    OR (p.profile_id=4 AND m.url IN ('/business/bpo-retail','/business/bpo-corporate-sme','/business/allocated','/business/status'))
    OR (p.profile_id=5 AND m.url='/business/medical-review')
    OR (p.profile_id=6 AND m.url='/business/allocated')
    OR (p.profile_id=7 AND m.url='/business/pricing')
    OR (p.profile_id=8 AND m.url IN ('/business/cashier','/business/finance'))
    OR (p.profile_id=9 AND m.url='/business/dispatch')
    OR (p.profile_id=12 AND m.url='/business/record-filing')
    OR (p.profile_id=10 AND m.url IN ('/business/gi-allocate','/business/gi-allocated','/business/allocated'))
    OR (p.profile_id=11 AND m.main='Risk') AS allowed
  FROM crm.profiles p CROSS JOIN menus m
)
INSERT INTO crm.menu_access(profile_id,main_menu_name,sub_menu_name,page_url,menu_order,
  can_access,can_add,can_edit,can_delete,read_only)
SELECT profile_id,main,sub,url,sort,allowed,allowed,allowed,
  profile_id IN (1,2),url='/business/status' FROM access;

-- Document labels are API contracts (AML, invoice, receipt, filing and refunds),
-- not copied records. IDs are local and retain checklist/upload FK compatibility.
INSERT INTO crm.business_req(req_id,req_code,req_name,applies_to,code) VALUES
  (1,1,'Member Application Form(Full)','R',1),(2,2,'ID or Passport(Front&Back)','R',1),
  (3,3,'Pin Certificate','R',1),(4,4,'Payment Proof','R',1),
  (5,5,'Medical Report','R',1),(6,6,'Renewal Schedule','R',1),
  (7,7,'Corporate proposal form','C',1),(8,8,'Registration Certificate','C',1),
  (9,9,'CR12','C',1),(10,10,'Rates and benefit Matrix','C',1),
  (11,11,'Premium summary','C',1),(12,12,'Member List','C',1),
  (13,13,'Invoice','R',1),(14,14,'System Invoice','C',3),
  (15,15,'System Receipt','C',3),(16,16,'Allocation Form','C',1),
  (17,17,'Credit Note','C',1),(18,18,'Policy Schedule','C',4),
  (19,19,'AML Report','C',4),(20,20,'Refund Documents','C',5),
  (21,21,'Refund Advice','C',5),(22,22,'Refund Schedule','C',5),
  (23,23,'Finance Approval','C',5),(24,24,'Bank Confirmation','C',5),
  (25,25,'Remittance','C',5),(26,26,'Decline letter','C',5),
  (27,27,'Debit Note','C',5),(28,28,'Statement','C',5),
  (29,29,'Other Documents','R',1),(30,30,'Other Documents','C',1),
  (31,31,'Email Correspondence','R',1),(32,32,'Email Correspondence','C',1);
SELECT setval(pg_get_serial_sequence('crm.business_req','req_id'),32,true);
INSERT INTO crm.business_sectors(sector_name) VALUES ('LOCAL TEST SERVICES'),('LOCAL TEST MANUFACTURING');
INSERT INTO crm.aml_risk_reasons(reason_name,display_order) VALUES
  ('No alerts identified',1),('False positives alerts',2),
  ('Politically Exposed Person',3),('Alerts identified and approved',4);
INSERT INTO crm.tbl_mis_sales_intermediary(agent_code,agent_name,agent_type,agent_status)
VALUES ('LOCAL-TEST-AGENT','Synthetic Local Intermediary','AGENT','ACTIVE');
INSERT INTO commission.sales_agents(agent_id,agent_name) VALUES ('LOCAL-LEGACY-AGENT','Synthetic Legacy Agent');
INSERT INTO sales.prod_months(month_name,date_from,date_to,year)
SELECT 'Local test ' || to_char(CURRENT_DATE,'Mon YYYY'),date_trunc('month',CURRENT_DATE)::date,
  (date_trunc('month',CURRENT_DATE)+interval '1 month - 1 day')::date,extract(year FROM CURRENT_DATE)::integer;
INSERT INTO risk.departments(depart_code,depart_name) VALUES ('LOCAL','Synthetic Local Department');
INSERT INTO risk.categories(category_code,category_name) VALUES ('LOCAL-OPS','Synthetic Operational Risk');
INSERT INTO risk.objectives(obj_code,obj_name,depart_code) VALUES ('LOCAL-OBJ','Synthetic Local Objective','LOCAL');
INSERT INTO risk.periods(period_from,period_to)
SELECT date_trunc('year',CURRENT_DATE)::date,(date_trunc('year',CURRENT_DATE)+interval '1 year - 1 day')::date;

-- A marker is required for explicit admin provisioning; restored databases lack it.
CREATE TABLE crm.local_bootstrap (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  baseline_version integer NOT NULL, initialized_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO crm.local_bootstrap(baseline_version) VALUES (1);
