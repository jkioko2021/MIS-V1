# RM_RE Management

Open **Intermediary Management → RM_RE Management**.
The page is available to the **Retention Admin** profile, SuperAdmin and System
Admin. Assign the Retention Admin profile to the intended existing MIS users
through User Enrollment. No existing staff receive that profile automatically.
This does not grant Retention Admin access to unrelated intermediary pages.

## Page navigation

- **Relationship managers** opens the searchable manager register. Use **View**
  to inspect a reference and its current assigned agents, or use the existing
  add, edit and deactivate actions.
- **Assign or move agents** contains the agent filters and reviewed transfer
  workflow.
- **History** shows the existing recent-change audit records.

The manager's View option supports agent search and pagination. Its agent list
is the **current portfolio for the manager code and category**, not a historical
snapshot of the selected reference year. Its assignment shortcut opens the
assignment tab with that manager as the source; it does not move agents.

## Reference managers

The catalog maintains the supplied manager code, name, class, Corporate/Retail
category, reporting year and active flag. These references are **not login
accounts**. Adding or deactivating one does not create or disable an MIS account.

Codes preserve leading zeros. Code, category and year identify a reference
record and cannot be changed while editing it; name, class and active status
can be maintained with a reason. Concurrent edits require a refresh rather than
silently overwriting another administrator's work.

The latest applicable year is the latest reference year not later than the
database's current year. Only active references in that applicable year can be
transfer targets. Corporate and Retail are independent classifications.

## Assigning and transferring agents

1. Open **Assign or move agents** and choose **Corporate** or **Retail**.
2. Find agents by name/code. Narrow the source to unassigned agents, an existing
   manager, or an exact legacy code when necessary.
   Optionally choose a **Region**, **Branch** or **Unit**. These cascading filters
   display names and restrict both the list and the transfer preview.
3. Select individual agents, or select the entire chosen source portfolio.
4. Choose an active target manager in the same category and enter a reason.
5. Preview the exact agents and old/new ownership, then confirm.

Only the Corporate field (`RMS_CODE_CORP`) or Retail field (`RMS_CODE_RET`) chosen
for that operation changes. The other category, agent identity, original
uploaded source data and organisation assignments remain intact.

Bulk transfers use a frozen preview, not a blanket update at confirmation time.
Agents arriving after a preview are not silently included. Previews expire after
15 minutes. Agent version changes, target-manager changes, removal or loss of
the operator's permissions block the transfer without partial updates.
Confirmation is safe to retry after a successful commit.

For an entire organisational group, choose **All agents**, select a Region,
Branch or Unit, and select **All agents in source scope**. Without an organisation
filter, whole-group assignment is blocked. Existing-manager and unassigned
source filters can also be combined with an organisation filter.

Organisation grouping follows the agent's current assigned Medical Unit and
its current parents. For agents without an operational Unit assignment, an exact,
recognized imported Unit reference can be used; it is marked as an imported
reference and is not activated. Unknown references remain available in the
unfiltered agent search, not guessed into a group. Reassigning a relationship
manager does not change the agent's Region, Branch or Unit. If an agent leaves
the selected group before confirmation, the complete transfer is blocked.

## Deactivation and audit

Transfer a current manager's agents before deactivation. MIS blocks deactivation
while that category still has assigned agents; it also blocks creating an
inactive replacement-year reference that would strand existing assignments.
Inactive or historical source codes can still be selected when moving agents.

Each catalog change and changed agent assignment records the operator, reason,
timestamp and before/after values. The page shows the latest 100 change entries.
Assignment events are also retained in the individual agent's event history.
Neither manager maintenance nor a transfer deletes original source records.
