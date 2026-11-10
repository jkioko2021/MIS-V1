CREATE TABLE IF NOT EXISTS crm.business_sectors (
  sector_name VARCHAR(120) PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO crm.business_sectors (sector_name)
VALUES
  ('Agriculture'),
  ('Banking & Finance'),
  ('Construction'),
  ('Education'),
  ('Energy'),
  ('Government & Public Sector'),
  ('Healthcare'),
  ('Hospitality & Tourism'),
  ('IT & Technology'),
  ('Legal & Professional Services'),
  ('Manufacturing'),
  ('Media & Entertainment'),
  ('NGO & Non-Profit'),
  ('Real Estate'),
  ('Retail & Trade'),
  ('Telecommunications'),
  ('Transport & Logistics'),
  ('Other')
ON CONFLICT (sector_name) DO NOTHING;