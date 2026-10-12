-- Archived historical aliases remain valid; current department names are unique.
CREATE UNIQUE INDEX IF NOT EXISTS risk_current_department_name_unique
 ON risk.departments(lower(btrim(depart_name))) WHERE NOT is_archived;
