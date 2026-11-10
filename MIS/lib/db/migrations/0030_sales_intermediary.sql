-- PostgreSQL folds unquoted identifiers to lowercase, as with other crm tables.
-- Intermediary codes, user IDs and contact/identity numbers are text, not numbers.
-- Do not derive termination status from a supplied termination date: source
-- records can legitimately contain TERMINATED=0 with a historical date.
CREATE TABLE IF NOT EXISTS crm.TBL_MIS_SALES_INTERMEDIARY (
  receive_date date,
  agent_code varchar(30) PRIMARY KEY,
  user_id varchar(64),
  agent_name varchar(250) NOT NULL,
  agent_type varchar(50),
  unit_code varchar(30),
  branch_code varchar(30),
  region_code varchar(30),
  email varchar(254),
  mobile_no varchar(32),
  hrmis_code varchar(32),
  pin_no varchar(32),
  nid_no varchar(32),
  rms_code_corp varchar(32),
  rms_code_ret varchar(32),
  terminated smallint NOT NULL DEFAULT 0 CHECK (terminated IN (0, 1)),
  terminate_date date,
  agent_status varchar(50),
  gi_code varchar(30)
);
