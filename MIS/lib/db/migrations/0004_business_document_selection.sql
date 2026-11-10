-- A document requirement becomes mandatory for a file only when the user
-- selects it for upload. Existing checklist rows represent prior choices.
ALTER TABLE crm.business_doc_checklist
  ADD COLUMN IF NOT EXISTS is_selected BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE crm.business_doc_checklist
SET is_selected = TRUE
WHERE is_selected = FALSE
  AND (upload_id IS NOT NULL OR acknowledged_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS business_doc_checklist_selected_idx
  ON crm.business_doc_checklist (file_no, req_id)
  WHERE is_selected = TRUE;