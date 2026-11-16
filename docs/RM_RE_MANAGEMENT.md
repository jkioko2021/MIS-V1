# RM_RE Management

Open **Intermediary Management → RM_RE Management**.
The page is available to the **Retention Admin** profile, SuperAdmin and System
Admin. Assign the Retention Admin profile to the intended existing MIS users
through User Enrollment. No existing staff receive that profile automatically.
This does not grant Retention Admin access to unrelated intermediary pages.

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

1. Choose **Corporate** or **Retail**.
2. Find agents by name/code. Narrow the source to unassigned agents, an existing
   manager, or an exact legacy code when necessary.
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

## Deactivation and audit

Transfer a current manager's agents before deactivation. MIS blocks deactivation
while that category still has assigned agents; it also blocks creating an
inactive replacement-year reference that would strand existing assignments.
Inactive or historical source codes can still be selected when moving agents.

Each catalog change and changed agent assignment records the operator, reason,
timestamp and before/after values. The page shows the latest 100 change entries.
Assignment events are also retained in the individual agent's event history.
Neither manager maintenance nor a transfer deletes original source records.
