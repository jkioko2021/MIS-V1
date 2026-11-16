-- Contact details belong to the user account, not individual designations.
ALTER TABLE crm.employees ADD COLUMN IF NOT EXISTS mobile_no varchar(50);
