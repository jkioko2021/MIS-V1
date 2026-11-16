-- Optional contact/employment data must not block an otherwise valid designation.
-- Identity and both validity dates remain mandatory for active detailed enrollments.
ALTER TABLE crm.sales_manager_enrollments
  DROP CONSTRAINT IF EXISTS sales_manager_active_complete_details;
ALTER TABLE crm.sales_manager_enrollments
  ADD CONSTRAINT sales_manager_active_complete_details CHECK (
    NOT is_active OR manager_details IS NULL OR (
      nullif(btrim(manager_details->>'code'),'') IS NOT NULL
      AND nullif(btrim(manager_details->>'name'),'') IS NOT NULL
      AND nullif(btrim(manager_details->>'mis_emp_code'),'') IS NOT NULL
      AND nullif(btrim(manager_details->>'valid_from'),'') IS NOT NULL
      AND nullif(btrim(manager_details->>'valid_to'),'') IS NOT NULL
    )
  );
