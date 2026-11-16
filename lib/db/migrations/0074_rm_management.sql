ALTER TABLE crm.relationship_managers ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS crm.rm_management_events (
  id bigserial PRIMARY KEY,
  action text NOT NULL,
  actor text NOT NULL,
  reason text NOT NULL,
  description text NOT NULL,
  agent_code varchar(30),
  before_data jsonb,
  after_data jsonb,
  batch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rm_management_events_recent ON crm.rm_management_events(created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS crm.rm_transfer_previews (
  id uuid PRIMARY KEY,
  created_by integer NOT NULL,
  input jsonb NOT NULL,
  target jsonb NOT NULL,
  results jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PREVIEW' CHECK(status IN('PREVIEW','COMMITTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now()+interval '15 minutes'),
  committed_at timestamptz
);
SELECT setval(pg_get_serial_sequence('crm.profiles','profile_id'),
  greatest((SELECT coalesce(max(profile_id),1) FROM crm.profiles),(SELECT last_value FROM crm.profiles_profile_id_seq)));
INSERT INTO crm.profiles(profile_name,profile_type,is_active)
  SELECT 'Retention Admin','STAFF',true
  WHERE NOT EXISTS(SELECT 1 FROM crm.profiles WHERE lower(btrim(profile_name))='retention admin');
INSERT INTO crm.menu_access(profile_id,main_menu_name,sub_menu_name,page_url,menu_order,can_access,can_add,can_edit,can_delete,read_only)
  SELECT p.profile_id,'Intemediary Management','RM_RE Management','/intermediary/rm-re',90,true,true,true,false,false
  FROM crm.profiles p WHERE (p.profile_id IN(1,2) OR lower(btrim(p.profile_name))='retention admin')
  AND NOT EXISTS(SELECT 1 FROM crm.menu_access m WHERE m.profile_id=p.profile_id AND m.page_url='/intermediary/rm-re');
