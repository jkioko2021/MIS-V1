-- Additive agent-management extension. Never recode historical business assignments.
ALTER TABLE crm.tbl_mis_sales_intermediary
  ADD COLUMN IF NOT EXISTS contract_date date,
  ADD COLUMN IF NOT EXISTS secondary_mobile varchar(32),
  ADD COLUMN IF NOT EXISTS commission_rate numeric(6,3),
  ADD COLUMN IF NOT EXISTS pay_mode varchar(30),
  ADD COLUMN IF NOT EXISTS etims_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS crm.intermediary_events (
  event_id bigserial PRIMARY KEY,
  agent_code varchar(30) NOT NULL REFERENCES crm.tbl_mis_sales_intermediary(agent_code),
  action text NOT NULL,
  notes text NOT NULL,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS crm.intermediary_licences (
  licence_id serial PRIMARY KEY,
  agent_code varchar(30) NOT NULL REFERENCES crm.tbl_mis_sales_intermediary(agent_code),
  licence_no varchar(100) NOT NULL,
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  ira_compliant boolean NOT NULL DEFAULT false,
  kyc_compliant boolean NOT NULL DEFAULT false,
  contract_signed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED','VERIFIED','DECLINED')),
  entered_by text NOT NULL,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(valid_to >= valid_from),
  UNIQUE(agent_code,licence_no,valid_from)
);
CREATE TABLE IF NOT EXISTS crm.intermediary_directors (
  director_id serial PRIMARY KEY,
  agent_code varchar(30) NOT NULL REFERENCES crm.tbl_mis_sales_intermediary(agent_code),
  name varchar(250) NOT NULL,
  email varchar(254),
  mobile_no varchar(32),
  nid_no varchar(32),
  pin_no varchar(32),
  version integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS crm.intermediary_mappings (
  from_code varchar(30) PRIMARY KEY REFERENCES crm.tbl_mis_sales_intermediary(agent_code),
  to_code varchar(30) NOT NULL REFERENCES crm.tbl_mis_sales_intermediary(agent_code),
  mapped_by text NOT NULL,
  mapped_at timestamptz NOT NULL DEFAULT now(),
  CHECK(from_code <> to_code)
);
CREATE TABLE IF NOT EXISTS crm.intermediary_documents (
  document_id serial PRIMARY KEY,
  agent_code varchar(30) NOT NULL REFERENCES crm.tbl_mis_sales_intermediary(agent_code),
  title varchar(120) NOT NULL,
  file_name varchar(255) NOT NULL,
  content_type text NOT NULL,
  file_size integer NOT NULL CHECK(file_size > 0 AND file_size <= 26214400),
  object_path text NOT NULL UNIQUE,
  uploaded_by text NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS intermediary_events_agent ON crm.intermediary_events(agent_code,event_id DESC);
CREATE INDEX IF NOT EXISTS intermediary_licences_agent ON crm.intermediary_licences(agent_code,licence_id DESC);

INSERT INTO crm.profiles(profile_name,profile_type)
SELECT 'National Sales Admin','STAFF'
WHERE NOT EXISTS (SELECT 1 FROM crm.profiles WHERE lower(trim(profile_name))='national sales admin');

INSERT INTO crm.menu_access(profile_id,main_menu_name,sub_menu_name,page_url,menu_order,can_access,can_add,can_edit,can_delete)
SELECT p.profile_id,'Intemediary Management',m.label,m.url,m.ord,true,true,true,false
FROM crm.profiles p CROSS JOIN (VALUES
 ('Agent Registration','/intermediary/registration',10),
 ('Agent Listing','/intermediary/agents',20),
 ('Agent Details','/intermediary/details',30),
 ('Agent Details Change','/intermediary/changes',40),
 ('Licence Update','/intermediary/licences',50),
 ('Licence Verification','/intermediary/verification',60),
 ('Agent Suspension','/intermediary/suspension',70),
 ('Agent Mapping','/intermediary/mapping',80)
) AS m(label,url,ord)
WHERE (p.profile_id IN (1,2) OR lower(trim(p.profile_name))='national sales admin')
AND NOT EXISTS (SELECT 1 FROM crm.menu_access a WHERE a.profile_id=p.profile_id AND a.page_url=m.url);
