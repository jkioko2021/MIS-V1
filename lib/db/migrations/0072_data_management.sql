-- Structured validation proposals and results, never original file bytes or passwords.
CREATE TABLE IF NOT EXISTS crm.data_import_batches (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK(kind IN ('users','agents')),
  filename varchar(200) NOT NULL,
  digest text NOT NULL,
  status text NOT NULL CHECK(status IN ('VALIDATED','BLOCKED','IMPORTED')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  imported_by text,
  imported_at timestamptz,
  records jsonb NOT NULL,
  results jsonb NOT NULL,
  summary jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS data_import_batches_recent ON crm.data_import_batches(kind,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS data_import_batches_committed
  ON crm.data_import_batches(kind,digest) WHERE status='IMPORTED';
