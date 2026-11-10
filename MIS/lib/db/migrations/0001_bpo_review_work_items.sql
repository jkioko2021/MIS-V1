CREATE TABLE IF NOT EXISTS crm.business_work_items (
  work_item_id SERIAL PRIMARY KEY,
  file_no VARCHAR(200) NOT NULL REFERENCES crm.business_tracking(file_no),
  queue_name VARCHAR(50) NOT NULL CHECK (queue_name IN ('BPO_REVIEW')),
  work_status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (work_status IN ('OPEN', 'COMPLETED', 'CANCELLED')),
  assigned_to VARCHAR(200),
  assigned_by VARCHAR(200),
  forwarded_by VARCHAR(200) NOT NULL,
  forwarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_work_items_file_queue_unique UNIQUE (file_no, queue_name)
);

CREATE INDEX IF NOT EXISTS business_work_items_open_queue_idx
  ON crm.business_work_items (queue_name, work_status, forwarded_at DESC);

INSERT INTO crm.profiles (profile_name, profile_type, is_active)
VALUES ('BPO Review', 'ADMIN', TRUE)
ON CONFLICT (profile_name) DO UPDATE
  SET is_active = TRUE;