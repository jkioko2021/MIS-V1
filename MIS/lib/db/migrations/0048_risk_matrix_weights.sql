BEGIN;
-- Nullable only for pre-existing custom references with no approved matrix identity.
-- Exposure factors, reference status and saved ranking snapshots are untouched.
ALTER TABLE risk.impact_factors ADD COLUMN IF NOT EXISTS matrix_weight integer
  CHECK (matrix_weight BETWEEN 1 AND 5);
ALTER TABLE risk.likelihood_factors ADD COLUMN IF NOT EXISTS matrix_weight integer
  CHECK (matrix_weight BETWEEN 1 AND 5);
UPDATE risk.impact_factors SET matrix_weight=6-right(upper(impact_code),1)::integer
  WHERE upper(impact_code) IN ('IMP_01','IMP_02','IMP_03','IMP_04','IMP_05') AND matrix_weight IS NULL;
UPDATE risk.likelihood_factors SET matrix_weight=6-right(upper(likelihood_code),1)::integer
  WHERE upper(likelihood_code) IN ('LIK_01','LIK_02','LIK_03','LIK_04','LIK_05') AND matrix_weight IS NULL;
COMMIT;
