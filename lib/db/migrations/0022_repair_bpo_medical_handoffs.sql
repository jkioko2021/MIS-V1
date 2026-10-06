-- Repair historical medical handoffs that changed status but never opened a
-- destination work item. Never reopen an existing/completed medical item.
BEGIN;
WITH routed AS (
  INSERT INTO crm.business_work_items
    (file_no,queue_name,work_status,assigned_to,assigned_by,forwarded_by,forwarded_at)
  SELECT b.file_no,'MEDICAL_UNDERWRITING','OPEN',NULL,
         COALESCE(b.forwarded_by,b.entered_by),COALESCE(b.forwarded_by,b.entered_by),
         COALESCE(b.forward_date,b.updated_at,NOW())
  FROM crm.business_tracking b
  WHERE b.is_active AND NOT b.is_declined AND b.file_status='MEDICAL UW-REVIEW'
    AND NOT EXISTS (
      SELECT 1 FROM crm.business_work_items w
      WHERE w.file_no=b.file_no AND w.queue_name='MEDICAL_UNDERWRITING'
    )
  ON CONFLICT(file_no,queue_name) DO NOTHING
  RETURNING file_no
)
UPDATE crm.business_tracking b
SET medical_uw=TRUE,ready_for_update=FALSE,updated_at=NOW()
FROM routed WHERE routed.file_no=b.file_no;
COMMIT;
