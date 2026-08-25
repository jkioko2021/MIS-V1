-- Split the former shared BPO queue by the file's client type.  This is
-- deliberately repeatable: deployments which have already applied the data
-- update can safely run it again.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'crm.business_work_items'::regclass
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%queue_name%'
  LOOP
    EXECUTE format('ALTER TABLE crm.business_work_items DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE crm.business_work_items
  ADD CONSTRAINT business_work_items_queue_name_check
  CHECK (queue_name IN ('BPO_REVIEW', 'BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME'));

-- The work item does not copy the client type, so derive its destination from
-- the authoritative original file. Including both canonical values makes a
-- rerun self-heal an environment where an earlier rollout mapped every item
-- to Retail.
UPDATE crm.business_work_items wi
SET queue_name = CASE
      WHEN bt.client_type = 'R' THEN 'BPO_REVIEW_RETAIL'
      ELSE 'BPO_REVIEW_CORPORATE_SME'
    END,
    updated_at = NOW()
FROM crm.business_tracking bt
WHERE bt.file_no = wi.file_no
  AND wi.queue_name IN (
    'BPO_REVIEW',
    'BPO_REVIEW_RETAIL',
    'BPO_REVIEW_CORPORATE_SME'
  );

ALTER TABLE crm.business_work_items
  DROP CONSTRAINT business_work_items_queue_name_check;

ALTER TABLE crm.business_work_items
  ADD CONSTRAINT business_work_items_queue_name_check
  CHECK (queue_name IN ('BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME'));

-- Retain the unique (file_no, queue_name) and queue/status/forwarded-at index
-- from 0001; both remain the lookup/index shapes used by the split queues.