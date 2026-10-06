BEGIN;
-- Routing correction, not a fabricated Pricing approval; preserve history and recipient.
UPDATE crm.business_tracking SET file_status='ALLOCATED',benefit_verified='YES',
  allocate_dt=COALESCE(allocate_dt,NOW()),ready_for_update=TRUE,forwarded=TRUE,updated_at=NOW()
WHERE is_active AND NOT is_declined AND allocated AND client_type IN ('C','S')
  AND rate_type IS DISTINCT FROM 'C' AND file_status='BENEFIT VERIFICATION';
UPDATE crm.business_work_items w SET work_status='CANCELLED',updated_at=NOW()
FROM crm.business_tracking b WHERE b.file_no=w.file_no AND b.client_type IN ('C','S')
  AND b.rate_type IS DISTINCT FROM 'C' AND w.queue_name='PRICING_REVIEW' AND w.work_status='OPEN';
COMMIT;
