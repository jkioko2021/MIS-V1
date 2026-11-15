-- Retain imported source records; store only validated operational Medical fields.
ALTER TABLE crm.sales_structure_nodes
  ADD COLUMN IF NOT EXISTS medical_details jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(medical_details) = 'object');

-- Rename the displayed group without changing any permissions or page routes.
UPDATE crm.menu_access SET main_menu_name='Organization structure-Medical'
WHERE page_url LIKE '/admin/organisation/%'
  AND main_menu_name IN ('Organisation Structure','Organization Structure');
