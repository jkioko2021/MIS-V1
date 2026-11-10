-- Objective codes are reused across departments; the pair is the lookup identity.
CREATE UNIQUE INDEX IF NOT EXISTS risk_objective_department_code_unique
 ON risk.objectives(depart_code,obj_code);
