-- Apply explicitly before deploying session-aware API code. Existing JWTs have no
-- session ID and will require a fresh login. No schema work runs at API startup.
BEGIN;

ALTER TABLE crm.employees ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE crm.profiles ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS crm.auth_sessions (
  session_id UUID PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES crm.employees(employee_id) ON DELETE CASCADE,
  employee_version INTEGER NOT NULL,
  profile_id INTEGER NOT NULL REFERENCES crm.profiles(profile_id) ON DELETE CASCADE,
  profile_version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '8 hours',
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS auth_sessions_employee_idx ON crm.auth_sessions(employee_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON crm.auth_sessions(expires_at);

CREATE OR REPLACE FUNCTION crm.bump_employee_session_version() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.password_hash, NEW.last_password_reset, NEW.activated, NEW.approved,
         NEW.employee_locked, NEW.is_deleted, NEW.profile_id, NEW.username,
         NEW.employee_name, NEW.email, NEW.department)
     IS DISTINCT FROM
     ROW(OLD.password_hash, OLD.last_password_reset, OLD.activated, OLD.approved,
         OLD.employee_locked, OLD.is_deleted, OLD.profile_id, OLD.username,
         OLD.employee_name, OLD.email, OLD.department) THEN
    NEW.session_version := OLD.session_version + 1;
    NEW.active_session := FALSE;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS employee_session_security_change ON crm.employees;
CREATE TRIGGER employee_session_security_change BEFORE UPDATE ON crm.employees
FOR EACH ROW EXECUTE FUNCTION crm.bump_employee_session_version();

CREATE OR REPLACE FUNCTION crm.bump_profile_session_version() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.profile_name, NEW.profile_type, NEW.is_active)
     IS DISTINCT FROM ROW(OLD.profile_name, OLD.profile_type, OLD.is_active) THEN
    NEW.session_version := OLD.session_version + 1;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profile_session_security_change ON crm.profiles;
CREATE TRIGGER profile_session_security_change BEFORE UPDATE ON crm.profiles
FOR EACH ROW EXECUTE FUNCTION crm.bump_profile_session_version();

CREATE OR REPLACE FUNCTION crm.revoke_profile_access_sessions() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN RETURN NULL; END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE crm.profiles SET session_version = session_version + 1 WHERE profile_id = OLD.profile_id;
  END IF;
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.profile_id IS DISTINCT FROM OLD.profile_id) THEN
    UPDATE crm.profiles SET session_version = session_version + 1 WHERE profile_id = NEW.profile_id;
  END IF;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS menu_access_session_security_change ON crm.menu_access;
CREATE TRIGGER menu_access_session_security_change AFTER INSERT OR UPDATE OR DELETE ON crm.menu_access
FOR EACH ROW EXECUTE FUNCTION crm.revoke_profile_access_sessions();

COMMIT;
