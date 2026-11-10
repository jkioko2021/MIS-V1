-- User-approved cleanup: keep the supplied 26-department catalog current,
-- retain older departments and all their foreign-key links for history.
BEGIN;
ALTER TABLE risk.departments ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
ALTER TABLE risk.departments DROP CONSTRAINT IF EXISTS risk_archived_department_inactive;
ALTER TABLE risk.departments ADD CONSTRAINT risk_archived_department_inactive
 CHECK(NOT is_archived OR NOT is_active);
WITH before_rows AS (
 SELECT d.depart_code,to_jsonb(d) AS before
 FROM risk.departments d
 WHERE d.depart_code IN ('COMP','CUST','FIN','HR','IT','MED','MSHIP','NMMED','OPS','UW')
 AND NOT d.is_archived
 FOR UPDATE
), archived AS (
 UPDATE risk.departments d SET is_active=false,is_archived=true
 FROM before_rows b WHERE d.depart_code=b.depart_code
 RETURNING d.depart_code,b.before,to_jsonb(d) AS after
)
INSERT INTO risk.register_history(risk_code,depart_code,period_id,action,actor,comments,snapshot)
SELECT NULL,depart_code,NULL,'DEPARTMENT_ARCHIVE','catalog-cleanup',
 'User approved archiving departments outside the supplied department list; linked records retained.',
 jsonb_build_object('before',before,'after',after)
FROM archived;
COMMIT;
