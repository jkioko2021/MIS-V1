-- Legacy enrollments stay intact with uncaptured details; no fabricated account links.
ALTER TABLE crm.sales_manager_enrollments
  ADD COLUMN IF NOT EXISTS manager_details jsonb CHECK (
    manager_details IS NULL OR (
      jsonb_typeof(manager_details)='object' AND
      manager_details ?& ARRAY['code','name','email','hrmis_code','mobile_no','h_tax','mis_emp_code','valid_from','valid_to']
    )
  );
CREATE UNIQUE INDEX IF NOT EXISTS sales_manager_category_code_idx
  ON crm.sales_manager_enrollments(level,lower(manager_details->>'code'))
  WHERE manager_details IS NOT NULL;
