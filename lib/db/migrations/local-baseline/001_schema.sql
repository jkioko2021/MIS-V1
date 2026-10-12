-- LOCAL ONLY: consolidated schema, not an upgrade migration.
-- Ordered by dependency. No employee, business, or production reference data.
CREATE SCHEMA crm;
CREATE SCHEMA commission;
CREATE SCHEMA sales;
CREATE SCHEMA risk;

CREATE TABLE crm.profiles (
  profile_id serial PRIMARY KEY, profile_name varchar(100) NOT NULL UNIQUE,
  profile_type varchar(50) NOT NULL DEFAULT 'ADMIN', is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE crm.employees (
  employee_id serial PRIMARY KEY, emp_code varchar(50) UNIQUE, username varchar(100) NOT NULL UNIQUE,
  password_hash text NOT NULL, employee_name varchar(200) NOT NULL, email varchar(200),
  department varchar(100), profile_id integer REFERENCES crm.profiles,
  activated boolean NOT NULL DEFAULT false, employee_locked boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false, approved_by varchar(100), date_approved date,
  active_session boolean NOT NULL DEFAULT false, last_login_date timestamptz, last_password_reset date,
  failed_attempts integer NOT NULL DEFAULT 0, added_by varchar(100), modified_by varchar(100),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);
CREATE TABLE crm.menu_access (
  menu_access_id serial PRIMARY KEY, profile_id integer NOT NULL REFERENCES crm.profiles,
  main_menu_name varchar(100) NOT NULL, sub_menu_name varchar(100) NOT NULL,
  page_url varchar(255) NOT NULL, menu_order integer NOT NULL DEFAULT 0,
  can_access boolean NOT NULL DEFAULT false, can_add boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false, can_delete boolean NOT NULL DEFAULT false,
  read_only boolean NOT NULL DEFAULT false, UNIQUE(profile_id, page_url)
);
-- Both audit contracts are currently used by API routes. Nullable legacy fields
-- allow structured (employee_id/action/details) and username-based audit writes.
CREATE TABLE crm.admin_audit_trail (
  audit_id serial PRIMARY KEY, username varchar(100), action_type varchar(100),
  description text, page_url text, ip_address varchar(50), session_id varchar(200),
  created_at timestamptz DEFAULT now(), employee_id integer REFERENCES crm.employees,
  action varchar(100), details text,
  CHECK (action_type IS NOT NULL OR action IS NOT NULL)
);
CREATE TABLE crm.password_config (
  id serial PRIMARY KEY, min_length integer NOT NULL DEFAULT 12,
  history_count integer NOT NULL DEFAULT 5, lockout_count integer NOT NULL DEFAULT 3,
  require_numeric boolean NOT NULL DEFAULT true, require_special boolean NOT NULL DEFAULT true,
  require_capital boolean NOT NULL DEFAULT true, pass_reset_days integer NOT NULL DEFAULT 30,
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE crm.password_history (
  id serial PRIMARY KEY, employee_id integer NOT NULL REFERENCES crm.employees,
  password_hash text NOT NULL, changed_at timestamptz DEFAULT now()
);
CREATE TABLE crm.otp_tokens (
  id serial PRIMARY KEY, employee_id integer NOT NULL REFERENCES crm.employees,
  token char(6) NOT NULL, generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes',
  used boolean NOT NULL DEFAULT false, attempts integer NOT NULL DEFAULT 0
);
CREATE TABLE crm.login_otp_challenges (
  challenge_id uuid PRIMARY KEY, employee_id integer NOT NULL REFERENCES crm.employees ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL, credential_stamp varchar(64) NOT NULL, recipient_stamp varchar(64) NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes',
  attempts integer NOT NULL DEFAULT 0, sent boolean NOT NULL DEFAULT false, used boolean NOT NULL DEFAULT false
);
CREATE INDEX login_otp_employee_date_idx ON crm.login_otp_challenges(employee_id, generated_at DESC);
CREATE TABLE crm.class_mgr (id serial PRIMARY KEY, mgr_code varchar(50) NOT NULL, username varchar(100) NOT NULL REFERENCES crm.employees(username));
CREATE TABLE crm.nsm (id serial PRIMARY KEY, nsm_code varchar(50) NOT NULL, username varchar(100) NOT NULL REFERENCES crm.employees(username));
CREATE TABLE crm.rms (id serial PRIMARY KEY, re_code varchar(50) NOT NULL, username varchar(100) NOT NULL REFERENCES crm.employees(username));
CREATE TABLE crm.retention_admin (id serial PRIMARY KEY, admin_code varchar(50) NOT NULL, username varchar(100) NOT NULL REFERENCES crm.employees(username));
CREATE TABLE crm.staff_on_call (
  id serial PRIMARY KEY, on_call_date date NOT NULL UNIQUE, staff_name varchar(200) NOT NULL, staff_mobile varchar(30)
);
CREATE TABLE crm.business_req (
  req_id serial PRIMARY KEY, req_code integer NOT NULL UNIQUE, req_name varchar(255) NOT NULL,
  is_active boolean NOT NULL DEFAULT true, applies_to varchar(10) DEFAULT 'ALL',
  code integer CHECK (code IS NULL OR code > 0)
);
CREATE TABLE crm.business_sectors (
  sector_name varchar(120) PRIMARY KEY, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE crm.aml_risk_reasons (
  reason_id serial PRIMARY KEY, reason_name varchar(200) NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE crm.tbl_mis_sales_intermediary (
  receive_date date, agent_code varchar(30) PRIMARY KEY, user_id varchar(64), agent_name varchar(250) NOT NULL,
  agent_type varchar(50), unit_code varchar(30), branch_code varchar(30), region_code varchar(30),
  email varchar(254), mobile_no varchar(32), hrmis_code varchar(32), pin_no varchar(32), nid_no varchar(32),
  rms_code_corp varchar(32), rms_code_ret varchar(32), terminated smallint NOT NULL DEFAULT 0 CHECK (terminated IN (0,1)),
  terminate_date date, agent_status varchar(50), gi_code varchar(30)
);
CREATE TABLE commission.sales_agents (
  agent_id varchar(50) PRIMARY KEY, agent_name varchar(200) NOT NULL, agent_email varchar(200),
  agent_phone varchar(30), agency_code varchar(50), is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE sales.prod_months (
  id serial PRIMARY KEY, month_name varchar(50) NOT NULL, date_from date NOT NULL, date_to date NOT NULL,
  month_closed boolean NOT NULL DEFAULT false, year integer NOT NULL, created_at timestamptz DEFAULT now()
);
CREATE TABLE crm.business_tracking (
  file_no varchar(30) PRIMARY KEY, proposer_name varchar(200) NOT NULL, family_code varchar(50),
  receive_dt date NOT NULL DEFAULT CURRENT_DATE, premium numeric(15,2),
  file_status varchar(50) NOT NULL DEFAULT 'REGISTERED',
  business_type varchar(5) NOT NULL CHECK (business_type IN ('N','R','A','T','RT','CC','PR','NE','FT','SU','LS')),
  client_type char(1) NOT NULL CHECK (client_type IN ('R','S','C')),
  business char(1) NOT NULL CHECK (business IN ('M','N')), agent_id varchar(50),
  is_mtiba boolean NOT NULL DEFAULT false, is_ipf boolean NOT NULL DEFAULT false,
  walk_in_client char(1) NOT NULL DEFAULT 'N' CHECK (walk_in_client IN ('Y','N')),
  rate_type char(1) NOT NULL CHECK (rate_type IN ('S','C')),
  benefit_verified varchar(5) NOT NULL CHECK (benefit_verified IN ('YES','NO')),
  medical_uw boolean NOT NULL DEFAULT false, allocated boolean NOT NULL DEFAULT false,
  invoiced boolean NOT NULL DEFAULT false, allocated_to varchar(100), allocate_dt timestamptz,
  forwarded boolean NOT NULL DEFAULT false, forwarded_by varchar(100), forward_date timestamptz,
  is_complete boolean NOT NULL DEFAULT false, ready_for_update boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true, is_declined boolean NOT NULL DEFAULT false,
  pay_ref_no varchar(100), paid_amt numeric(15,2), entered_by varchar(100) NOT NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  nid varchar(50), pin_no varchar(50), county_code varchar(60), card_type varchar(20),
  gi_category varchar(20), pay_mode varchar(20), sector varchar(100), cr12 boolean DEFAULT false,
  corp_category varchar(100), walk_in_auth varchar(100), cr12_ref varchar(200),
  client_sub_type varchar(1), to_pricing_dt timestamptz, product varchar(50),
  invoice_no varchar(25), paid_status varchar(20), invoice_date timestamptz,
  paid boolean NOT NULL DEFAULT false, mu_revert boolean NOT NULL DEFAULT false,
  lateral_movement boolean NOT NULL DEFAULT false, benefit_ver_by varchar(100), benefit_ver_date timestamptz,
  receipted boolean NOT NULL DEFAULT false, receipt_no varchar(50), receipt_date timestamptz,
  cashier_by varchar(100), to_cashier_dt timestamptz, cashier_document_from timestamptz,
  updated boolean NOT NULL DEFAULT false, policy_generated boolean NOT NULL DEFAULT false,
  policy_signed boolean NOT NULL DEFAULT false, policy_dispatched boolean NOT NULL DEFAULT false,
  filed boolean NOT NULL DEFAULT false, filed_by varchar(100), filed_date timestamptz,
  CONSTRAINT chk_bt_status CHECK (file_status IN (
    'REGISTERED','FORWARDED','RETURNED-INCOMPLETE','MEDICAL UW-REVIEW','BENEFIT VERIFICATION',
    'ALLOCATED','ON HOLD','CASHIER','IT SUPPORT','PENDING PAYMENT','CLOSED','INVOICED',
    'DISPATCHED','DECLINED','POLICY ISSUED','RECEIPTED','FILING','FILED'))
);
CREATE TABLE crm.business_tracking_notes (
  note_id serial PRIMARY KEY, file_no varchar(30) NOT NULL REFERENCES crm.business_tracking,
  note_from varchar(100) NOT NULL, note_date timestamptz NOT NULL DEFAULT now(),
  notes text NOT NULL, is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE crm.business_uploads (
  upload_id serial PRIMARY KEY, file_no varchar(30) NOT NULL REFERENCES crm.business_tracking,
  req_id integer REFERENCES crm.business_req, filename varchar(500) NOT NULL, filesize bigint,
  mime_type varchar(100), storage_key varchar(1000) NOT NULL, uploaded_by varchar(100) NOT NULL,
  uploaded_at timestamptz DEFAULT now(), is_active boolean NOT NULL DEFAULT true,
  invoice_no varchar(25), amount numeric(18,2), policy_code varchar(100), risk_rate varchar(20), risk_reason text,
  filed boolean NOT NULL DEFAULT false, filed_by varchar(100), filed_date timestamptz
);
CREATE TABLE crm.business_doc_checklist (
  id serial PRIMARY KEY, file_no varchar(30) NOT NULL REFERENCES crm.business_tracking,
  req_id integer NOT NULL REFERENCES crm.business_req, acknowledged_at timestamptz DEFAULT now(),
  acknowledged_by varchar(100) NOT NULL, doc_id integer, upload_id integer REFERENCES crm.business_uploads,
  is_selected boolean NOT NULL DEFAULT false, UNIQUE(file_no,req_id)
);
CREATE INDEX business_doc_checklist_selected_idx ON crm.business_doc_checklist(file_no,req_id) WHERE is_selected;
CREATE TABLE crm.business_work_items (
  work_item_id serial PRIMARY KEY, file_no varchar(200) NOT NULL REFERENCES crm.business_tracking,
  queue_name varchar(50) NOT NULL CHECK (queue_name IN (
    'BPO_REVIEW_RETAIL','BPO_REVIEW_CORPORATE_SME','REGISTER_CORRECTION','MEDICAL_UNDERWRITING',
    'CASHIER','MEMBERSHIP_CLOSURE','IT_SUPPORT','RELATIONSHIP_MANAGEMENT','PRICING_REVIEW',
    'CREDIT_CONTROL','GI_ALLOCATE','GI_ALLOCATED')),
  work_status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (work_status IN ('OPEN','COMPLETED','CANCELLED')),
  assigned_to varchar(200), assigned_by varchar(200), forwarded_by varchar(200) NOT NULL,
  forwarded_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(file_no,queue_name)
);
CREATE INDEX business_work_items_open_queue_idx ON crm.business_work_items(queue_name,work_status,forwarded_at DESC);
CREATE TABLE crm.medical_underwriting_reviews (
  review_id serial PRIMARY KEY, file_no varchar NOT NULL REFERENCES crm.business_tracking,
  action varchar(2) NOT NULL CHECK (action IN ('C','F','RI','H','D')),
  comments varchar(250) NOT NULL, hpc boolean NOT NULL DEFAULT false,
  lateral_movement boolean NOT NULL DEFAULT false, destination varchar, invoice_no varchar(25),
  paid_status varchar(20), reviewed_by varchar NOT NULL, reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE crm.medical_hpc_registrations (
  hpc_id serial PRIMARY KEY, file_no varchar NOT NULL REFERENCES crm.business_tracking,
  member_no varchar(100) NOT NULL, member_name varchar(200) NOT NULL, proposer_name varchar(200) NOT NULL,
  client_type char(1) NOT NULL CHECK (client_type IN ('R','C')), condition text NOT NULL,
  disease_code varchar(100), diagnosed_date date, mobile varchar(40), email varchar(254), source varchar(200),
  followup_date date, notes text, registered_by varchar NOT NULL, registered_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE crm.pricing_reviews (
  review_id serial PRIMARY KEY, file_no varchar(100) NOT NULL REFERENCES crm.business_tracking,
  action varchar(3) NOT NULL CHECK (action IN ('YES','NO')), comments varchar(250) NOT NULL,
  reviewed_by varchar(100) NOT NULL, reviewed_at timestamptz NOT NULL DEFAULT now(), allocated_to varchar(100)
);
CREATE TABLE crm.cashier_reviews (
  review_id serial PRIMARY KEY, file_no varchar(30) NOT NULL REFERENCES crm.business_tracking,
  action varchar(2) NOT NULL CHECK (action IN ('M','RM','RI','CC')),
  paid_status varchar(20) NOT NULL CHECK (paid_status IN ('FULL-PAID','PART-PAID','NOT-PAID')),
  invoice_no varchar(50), receipt_no varchar(50), comments varchar(250) NOT NULL,
  reviewed_by varchar(100) NOT NULL, reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE crm.record_filing_reviews (
  filing_id serial PRIMARY KEY, file_no varchar(30) NOT NULL REFERENCES crm.business_tracking,
  filed_by varchar(100) NOT NULL, filed_at timestamptz NOT NULL DEFAULT now(),
  comments varchar(250) NOT NULL DEFAULT '', upload_ids integer[] NOT NULL DEFAULT '{}'
);
CREATE TABLE crm.gi_reviews (
  gi_review_id serial PRIMARY KEY, file_no varchar(30) NOT NULL REFERENCES crm.business_tracking,
  action varchar(2) NOT NULL CHECK (action IN ('A','RI')), reviewed_by varchar(100) NOT NULL,
  recipient_username varchar(100) NOT NULL, comments varchar(250) NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX medical_reviews_file_idx ON crm.medical_underwriting_reviews(file_no,reviewed_at);
CREATE INDEX medical_hpc_file_idx ON crm.medical_hpc_registrations(file_no,registered_at);
CREATE INDEX pricing_reviews_file ON crm.pricing_reviews(file_no,reviewed_at DESC);
CREATE INDEX idx_cashier_reviews_file ON crm.cashier_reviews(file_no,reviewed_at DESC);
CREATE INDEX record_filing_reviews_file ON crm.record_filing_reviews(file_no,filed_at DESC);
CREATE INDEX gi_reviews_file ON crm.gi_reviews(file_no,reviewed_at DESC);
CREATE TABLE crm.business_notifications (
  notification_id serial PRIMARY KEY, file_no varchar(100) NOT NULL REFERENCES crm.business_tracking,
  review_id integer UNIQUE REFERENCES crm.medical_underwriting_reviews,
  recipient_username varchar(100) NOT NULL, title varchar(200) NOT NULL, message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz,
  email_status varchar(30) NOT NULL DEFAULT 'WAITING_CONFIGURATION'
    CHECK (email_status IN ('WAITING_CONFIGURATION','PENDING','SENT','RETRY','NO_RECIPIENT')),
  email_attempts integer NOT NULL DEFAULT 0, email_sent_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(), email_error varchar(250),
  filing_id integer REFERENCES crm.record_filing_reviews, gi_review_id integer REFERENCES crm.gi_reviews,
  CONSTRAINT business_notification_source CHECK (num_nonnulls(review_id,filing_id,gi_review_id)=1)
);
CREATE INDEX business_notifications_recipient ON crm.business_notifications(recipient_username,created_at DESC);
CREATE INDEX business_notifications_outbox ON crm.business_notifications(next_attempt_at) WHERE email_status <> 'SENT';
CREATE UNIQUE INDEX business_notifications_filing_recipient ON crm.business_notifications(filing_id,recipient_username) WHERE filing_id IS NOT NULL;
CREATE UNIQUE INDEX business_notifications_gi_recipient ON crm.business_notifications(gi_review_id,recipient_username) WHERE gi_review_id IS NOT NULL;

CREATE TABLE risk.departments (depart_code varchar(20) PRIMARY KEY, depart_name varchar(100) NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE risk.categories (category_id serial PRIMARY KEY, category_code varchar(20) NOT NULL UNIQUE, category_name varchar(100) NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE risk.periods (
  period_id serial PRIMARY KEY, period_from date NOT NULL, period_to date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'OPEN', created_at timestamptz DEFAULT now()
);
CREATE TABLE risk.champions (
  id serial PRIMARY KEY, emp_code varchar(50) NOT NULL, username varchar(100) NOT NULL REFERENCES crm.employees(username),
  department varchar(20) NOT NULL REFERENCES risk.departments, is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE risk.objectives (
  obj_id serial PRIMARY KEY, obj_code varchar(20) NOT NULL UNIQUE, obj_name varchar(300) NOT NULL,
  depart_code varchar(20) NOT NULL REFERENCES risk.departments, is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE risk.owners (
  owner_id serial PRIMARY KEY, owner_code varchar(20) NOT NULL UNIQUE, owner_name varchar(200) NOT NULL,
  department varchar(20) NOT NULL REFERENCES risk.departments, email varchar(200), is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE risk.risk_master (
  risk_id serial PRIMARY KEY, risk_code varchar(20) NOT NULL UNIQUE, depart_code varchar(20) NOT NULL REFERENCES risk.departments,
  period_from date NOT NULL, period_to date NOT NULL, objective_code varchar(20), risk_title varchar(300) NOT NULL,
  risk_description text, risk_category varchar(20), risk_consequence text, risk_impact varchar(50),
  ranking_snapshot jsonb,
  i_rate numeric, risk_likelihood varchar(50), l_rate numeric, i_risk_exposure numeric, i_risk_rate numeric,
  current_contr text, perceived_contr_eff numeric, perceived_rate numeric, desired_contr_effe text,
  r_risk_rate numeric, r_risk_exposure numeric, is_active boolean NOT NULL DEFAULT true,
  entered_by varchar(100) NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE risk.root_causes (
  root_id serial PRIMARY KEY, risk_code varchar(20) NOT NULL REFERENCES risk.risk_master(risk_code),
  root_cause text NOT NULL, current_contr text, mitigations text, due_date date, action_owner varchar(200),
  action_status varchar(50) NOT NULL DEFAULT 'Open'
);
CREATE TABLE risk.department_summary (
  summary_id serial PRIMARY KEY, depart_code varchar(20) NOT NULL REFERENCES risk.departments,
  period_from date NOT NULL, period_to date NOT NULL, submitted boolean NOT NULL DEFAULT false,
  submitted_by varchar(100), submitted_at timestamptz, reviewed boolean NOT NULL DEFAULT false,
  reviewed_by varchar(100), reviewed_at timestamptz, sign_off boolean NOT NULL DEFAULT false,
  signed_off_by varchar(100), signed_off_at timestamptz
);
CREATE TABLE risk.master_summary (
  summary_id serial PRIMARY KEY, depart_code varchar(20) NOT NULL REFERENCES risk.departments,
  period_from date NOT NULL, period_to date NOT NULL, risk_code varchar(20) NOT NULL REFERENCES risk.risk_master(risk_code),
  r_risk_exposure numeric, ranking integer, computed_at timestamptz DEFAULT now()
);
