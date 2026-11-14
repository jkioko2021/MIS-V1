# Script-based enrollment submenus

The nine user-supplied SQL SELECT definitions are available under Administration
→ Sales Structure setup:

| Submenu | Source definition |
|---|---|
| Sales Units | TBL_MIS_SALES_UNITS |
| Unit Managers | TBL_MIS_SALES_UM |
| Sales Branches | TBL_MIS_SALES_BRANCH |
| Regional Managers | TBL_MIS_SALES_RM |
| Sales Regions | TBL_MIS_SALES_REGION |
| GI Unit Managers | TBL_MIS_SALES_GI_UM |
| GI Units | TBL_MIS_SALES_GI_UNITS |
| GI Branches | TBL_MIS_SALES_GI_BRANCH |
| GI Coordinators | TBL_MIS_SALES_GI_CORDINATOR |

Every selected source column is exposed. ID is generated locally, ACTIVE mirrors
the enrollment's active flag, and APPROVED_BY is recorded from the signed-in
administrator when APPROVED is set to 1. Decimal values and identifiers retain
their text representation; dates use YYYY-MM-DD. This is local enrollment, not a
commission calculation or an automated approval workflow.

Manager catalogs require an active, approved, unlocked MIS account. They retain
that account's identity and do not change its login profile. A user can have one
enrollment per manager catalog. Branch Manager choices use existing Branch-level
Manager enrollment. NSM_CODE choices use existing National structures.

Create Sales Regions, then Sales Branches, then Sales Units. Create units/regions
initially without a manager, enroll the manager, then return to assign them.
Optional manager mappings allow this order without fabricated placeholder users.
GI branch/coordinator BR_CODE and GI unit BRANCH_CODE select Sales Branches;
GI unit REGION_CODE must match the selected branch. Codes and linked accounts
cannot be replaced on existing enrollments. Updates are version checked, active
references block deactivation, and before/after values are retained in history.

The enrollment catalogs are stored separately from the pre-existing general
hierarchy in `crm.sales_catalog_entries`; they do not automatically rewrite
existing agent assignments or create duplicate hierarchy nodes. Source SELECTs
identify field names but contain no records, so no sales catalog data is seeded.
SQL Server extraction, connections and synchronization remain deferred.

Apply `0056_sales_enrollment_catalogs.sql` after the existing Sales Structure
migration in development/local setup. The local database helper includes both.
The existing `crm.sales_setup_events` and original structure/manager pages are
unchanged; catalog-specific snapshots are retained in `crm.sales_catalog_events`.

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
