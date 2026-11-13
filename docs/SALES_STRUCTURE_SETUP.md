# Sales Structure setup

Administrators (SuperAdmin and System Admin) can maintain **Administration → Sales Structure setup**.
Manager Enrollment is a separate page within this setup.

## Normal users become managers by enrollment

1. Create the person's normal account in **User Enrollment**.
2. Activate and approve the account; unlock it if needed.
3. In **Sales Manager Enrollment**, select that existing user and their level:
   National Sales Manager, Regional Manager, Branch Manager or Unit Manager.
4. In Sales Structure setup, create or edit the matching sales category and select
   the enrolled manager. A category may also be explicitly unassigned.

Enrollment does not change passwords, profiles, menus or administration privileges.
A user can be enrolled at several levels, but only once at each level. One enrolled
manager can cover multiple categories at their enrolled level.

## Structure

**National → Region → Sales Branch → Sales Unit**

Every region requires a national parent, every branch a regional parent and every
unit a branch parent. National entries have no parent. Names are unique within
their parent and codes are unique across the structure, normalized to uppercase.
Codes and levels are immutable after creation; names, parent, manager and active
status can be edited.

There is no hard-delete action. Deactivate records to preserve mappings and audit
history. Active child categories must be moved or deactivated before their parent
can be deactivated. Managers must be unassigned/reassigned from active categories
before their enrollment can be deactivated. A locked, inactive, unapproved or
deleted account is ineligible for new/current active assignments and shown as
unavailable. Its historical enrollment remains visible.

Updates use optimistic versions and transactional validation. Conflicts require
refreshing and reopening the editor; unsaved form entries are not silently replaced.
Changes retain before/after snapshots and the acting administrator.

## Database/local development

Apply `lib/db/migrations/0055_sales_structure_setup.sql` to the existing PostgreSQL
database before using the API. New clean local bootstraps also apply this migration
through `scripts/src/sales-structure-metadata.mjs`.

No SQL Server import or automatic agent remapping is performed. Existing agent
codes and historical sales assignments are unchanged.

API: `/api/admin/sales-structure`, `/nodes`, `/nodes/:id`, `/managers`, `/managers/:id`.
Only administrators can read or write these endpoints; manager enrollment grants
no access to them.
