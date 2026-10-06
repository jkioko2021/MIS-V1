BEGIN;
ALTER TABLE crm.business_tracking ADD COLUMN IF NOT EXISTS mu_revert boolean NOT NULL DEFAULT false;
ALTER TABLE crm.business_tracking ADD COLUMN IF NOT EXISTS lateral_movement boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS crm.medical_underwriting_reviews (
  review_id serial PRIMARY KEY,
  file_no varchar NOT NULL REFERENCES crm.business_tracking(file_no),
  action varchar(2) NOT NULL CHECK (action IN ('C','F','RI','H','D')),
  comments varchar(250) NOT NULL,
  hpc boolean NOT NULL DEFAULT false,
  lateral_movement boolean NOT NULL DEFAULT false,
  destination varchar,
  invoice_no varchar(25),
  paid_status varchar(20),
  reviewed_by varchar NOT NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medical_reviews_file_idx ON crm.medical_underwriting_reviews(file_no,reviewed_at);
CREATE TABLE IF NOT EXISTS crm.medical_hpc_registrations (
  hpc_id serial PRIMARY KEY,
  file_no varchar NOT NULL REFERENCES crm.business_tracking(file_no),
  member_no varchar(100) NOT NULL,
  member_name varchar(200) NOT NULL,
  proposer_name varchar(200) NOT NULL,
  client_type char(1) NOT NULL CHECK (client_type IN ('R','C')),
  condition text NOT NULL,
  disease_code varchar(100),
  diagnosed_date date,
  mobile varchar(40),
  email varchar(254),
  source varchar(200),
  followup_date date,
  notes text,
  registered_by varchar NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medical_hpc_file_idx ON crm.medical_hpc_registrations(file_no,registered_at);
COMMIT;
