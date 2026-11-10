-- Overall risk access is an explicit profile, never inferred from an employee's
-- department name or a Champion/Owner mapping. Do not reassign existing staff.
BEGIN;
LOCK TABLE crm.profiles IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO crm.profiles (profile_id, profile_name, profile_type, is_active)
SELECT COALESCE(MAX(profile_id), 0) + 1, 'Risk Management',
  COALESCE((SELECT profile_type FROM crm.profiles WHERE profile_id=9), 'RISK'), TRUE
FROM crm.profiles
HAVING NOT EXISTS (
  SELECT 1 FROM crm.profiles WHERE LOWER(TRIM(profile_name))='risk management'
);
SELECT setval(pg_get_serial_sequence('crm.profiles', 'profile_id'),
  GREATEST((SELECT MAX(profile_id) FROM crm.profiles),
    (SELECT last_value FROM crm.profiles_profile_id_seq)), TRUE);
COMMIT;
