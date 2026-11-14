-- Current ownership is separate from immutable imported source records and login profiles.
CREATE TABLE IF NOT EXISTS crm.sales_team_manager_assignments (
  id serial PRIMARY KEY,
  catalog varchar(40) NOT NULL CHECK (catalog IN ('sales-regions','sales-branches','sales-units')),
  organization_code varchar(50) NOT NULL,
  employee_id integer REFERENCES crm.employees(employee_id),
  organization_context jsonb NOT NULL CHECK (jsonb_typeof(organization_context)='object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by varchar(100) NOT NULL,
  UNIQUE(catalog,organization_code)
);
-- Deliberately not unique: a manager can oversee several teams, including at the same level.
CREATE INDEX IF NOT EXISTS sales_team_manager_employee_idx
  ON crm.sales_team_manager_assignments(employee_id,catalog) WHERE employee_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS crm.sales_team_manager_events (
  id serial PRIMARY KEY,
  assignment_id integer NOT NULL REFERENCES crm.sales_team_manager_assignments(id),
  action varchar(20) NOT NULL CHECK (action IN ('ASSIGNED','REASSIGNED','UNASSIGNED')),
  before_data jsonb,
  after_data jsonb NOT NULL,
  note varchar(1000) NOT NULL DEFAULT '',
  actor varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_team_manager_event_history_idx
  ON crm.sales_team_manager_events(assignment_id,id DESC);
