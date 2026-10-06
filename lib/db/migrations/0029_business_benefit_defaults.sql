BEGIN;

-- Defaults are automatic policy values, not fabricated Pricing approvals.
-- An explicitly supplied NO is retained for an intentional review.
ALTER TABLE crm.business_tracking ALTER COLUMN benefit_verified DROP DEFAULT;
CREATE OR REPLACE FUNCTION crm.apply_business_benefit_default()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.benefit_verified IS NULL THEN
    NEW.benefit_verified := CASE
      WHEN NEW.client_type='R' OR NEW.rate_type='S' THEN 'YES'
      ELSE 'NO'
    END;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS business_benefit_default ON crm.business_tracking;
CREATE TRIGGER business_benefit_default
  BEFORE INSERT ON crm.business_tracking
  FOR EACH ROW EXECUTE FUNCTION crm.apply_business_benefit_default();

-- Release existing default-verified files that would otherwise disappear
-- from Pricing while retaining their original assignment and all history.
UPDATE crm.business_tracking SET file_status='ALLOCATED',
  allocate_dt=COALESCE(allocate_dt,NOW()),ready_for_update=TRUE,forwarded=TRUE,updated_at=NOW()
WHERE is_active AND NOT is_declined AND allocated
  AND (client_type='R' OR rate_type='S')
  AND file_status='BENEFIT VERIFICATION';
UPDATE crm.business_work_items w SET work_status='CANCELLED',updated_at=NOW()
FROM crm.business_tracking b
WHERE b.file_no=w.file_no AND b.is_active
  AND (b.client_type='R' OR b.rate_type='S')
  AND w.queue_name='PRICING_REVIEW' AND w.work_status='OPEN';
UPDATE crm.business_tracking SET benefit_verified='YES',
  benefit_ver_by=NULL,benefit_ver_date=NULL,updated_at=NOW()
WHERE is_active AND (client_type='R' OR rate_type='S')
  AND benefit_verified IS DISTINCT FROM 'YES';

COMMIT;
