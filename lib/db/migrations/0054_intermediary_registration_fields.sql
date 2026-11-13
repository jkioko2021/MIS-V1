-- Preserve legacy compliance waiver requests without bypassing independent review.
ALTER TABLE crm.intermediary_licences
  ADD COLUMN IF NOT EXISTS waiver boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS waiver_reason text;
ALTER TABLE crm.intermediary_documents
  ADD COLUMN IF NOT EXISTS document_type varchar(4) NOT NULL DEFAULT 'C002';
