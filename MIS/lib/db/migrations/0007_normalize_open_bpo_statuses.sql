-- An open BPO work item is the authoritative indication that a file has been
-- forwarded and is awaiting review. Normalize historic rows created before
-- this invariant so the review queues never contain a later processing status.
UPDATE crm.business_tracking bt
SET file_status = 'FORWARDED',
    forwarded = TRUE,
    updated_at = NOW()
FROM crm.business_work_items wi
WHERE wi.file_no = bt.file_no
  AND wi.queue_name IN ('BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME')
  AND wi.work_status = 'OPEN'
  AND (
    bt.file_status <> 'FORWARDED'
    OR bt.forwarded IS DISTINCT FROM TRUE
  );