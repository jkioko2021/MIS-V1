# Medical and GI structure setup

The Administration menu separates the two structures:

- **Medical Structure setup:** Manager Enrollment, Manager Mapping, Sales Units,
  Sales Branches and Sales Regions.
- **GI Structure setup:** GI Unit Managers, GI Units, GI Branches and GI
  Coordinators.

**Manager Enrollment** combines the former medical Unit Managers and Regional
Managers pages. New designations use an existing MIS user and one of four
categories: Unit Manager, Regional Manager, Branch Manager or National Sales
Manager. The page retains the existing Unit/Regional catalog records and
read-only uploaded references, with their original details accessible. A source
person is not automatically linked to a MIS account. Existing verified catalog
records and category designations remain distinct records, rather than being
silently merged by name or email.

Enrollment captures **Code, Name, Email, HRMIS_CODE, MOBILE_NO, Active, H_TAX,
MIS_EMP_CODE, Valid From, Valid To and Category**. Code and MIS_EMP_CODE are the
selected existing user's MIS code; Name is populated from that account as well.
Those identity fields are read-only and checked again by the API. An account
without a MIS code cannot be enrolled until its user record is completed.
Email may be edited as the manager's contact address without changing the login
account. Payroll/mobile/tax values remain text so leading zeroes and values such
as `0.100` are retained. Both validity dates are required and the end cannot
precede the start. Active refers to the manager designation, not account access.
Existing incomplete designations remain visibly incomplete until explicitly
edited; status-only changes preserve their stored details.

Migration `0059_sales_manager_details.sql` adds the designation details without
backfilling guessed data. All edits retain version checks and before/after audit
snapshots; deactivation is blocked until existing team assignments are cleared.
An explicitly inactive designation is excluded from new assignments at that
category. Existing normal-user mapping remains supported where no designation
has yet been captured; this form does not retroactively create or replace user
permissions.

### Imported manager system users

Manager Enrollment's existing-user list contains **Sales** department users only.
The selector displays name and email only, with normalized duplicate names
collapsed for display, not merged or deleted in the database. Pending Sales users
can be selected to save an inactive manager designation without changing their
login account. Enabling a designation still requires an active, approved and
unlocked account. The API independently enforces these rules and rejects new
manager enrollments for non-Sales users. Older details/history remain intact.

The uploaded Medical Unit/Regional and GI manager assignments may be enrolled as
normal Sales system users through `node scripts/src/import-sales-manager-users.mjs`.
The default is a read-only plan/report; `--apply` is an explicit development-only
import. It creates inactive, unapproved **Business Entry** users, generates normal
MIS user codes, and never distributes a password or sends emails. Individual
password setup and account activation/approval are separate administrator actions.

Repeated assignments across Medical/GI use one confirmed user identity. Ambiguous
names/emails and uncertain existing-account matches are held for review, not
merged or deleted. Account/source provenance makes reruns idempotent; migration
`0060_sales_manager_user_import.sql` also enforces unique nonempty Sales emails.
Original source rows, other users' accounts and login profiles are preserved.
Reports are saved outside version control under `generated-artifacts/`.

Medical URLs and underlying API/catalog names remain compatible. GI pages use
`/admin/gi-structure/catalogs/…`; old GI catalog links continue to reach the same
records. This menu reorganization does not migrate data or change access rights.

## Manager Mapping and reassignment

Use **Administration → Medical Structure setup → Manager Mapping** to maintain
current ownership of Sales Regions, Sales Branches and Sales Units. This
workflow replaces the need to visit the old generic manager enrollment page.

1. Select the manager level and organization by name, following Region → Branch
   → Unit. Check the displayed hierarchy and resolve any missing, inactive or
   conflicting parent references before assigning.
2. Select an existing active, approved, unlocked MIS user. Review the team,
   previous manager and new manager, then confirm.
3. To replace or remove a current manager, provide a reason. Each team has one
   current manager; the same person can manage multiple teams at the same level.
4. To reassign a manager to a **different** team, select their current team and
   choose **Move manager**. Pick a different destination at the same level,
   enter a reason, review the source and destination and any manager being
   replaced, then confirm. Both changes commit together: the selected source
   becomes unassigned and the destination receives the manager. Their other
   team assignments are left unchanged. Assigning an additional team is not a
   move and does not clear existing assignments.
5. View assignment history on either team. Moves retain linked source and
   destination history, the administrator, reason and previous ownership.

Changes require a fresh review if either assignment or hierarchy changed after
selection. Removing an assignment remains possible when its source organization
has become inactive or unavailable; a move still requires an eligible manager
and a valid destination hierarchy. Imported manager names are not verified MIS
accounts and are never matched automatically. Existing accounts, login profiles,
permissions, source rows and agent assignments are not rewritten.

Migration `0058_sales_team_manager_mapping.sql` adds current team ownership and
append-only assignment history, separately from source manager-reference
columns. The local metadata setup helper includes it. Manager Mapping takes
precedence for current-manager display in the three organizational catalogs;
their original manager-reference fields are retained and locked when a mapping
exists. The new API is `/api/admin/sales-structure/manager-mappings` (GET/POST)
and `/manager-mappings/history` (GET with `catalog` and `organization_code`).
Only SuperAdmin and System Admin can access these endpoints.

The nine user-supplied SQL SELECT definitions remain available through the
organizational pages and combined enrollment view:

| Original catalog | Source definition |
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
GI branch/coordinator BR_CODE and GI unit BRANCH_CODE select Sales Branches.
The supplied source rows confirm that GI unit REGION_CODE selects the GI Branch
(CORD_CODE), not a Sales Region, and CORD_MGR_ID selects a GI Unit Manager.
The selected GI Branch must map to the same Sales Branch. Codes and linked accounts
cannot be replaced on existing enrollments. Updates are version checked, active
references block deactivation, and before/after values are retained in history.

The enrollment catalogs are stored separately from the pre-existing general
hierarchy in `crm.sales_catalog_entries`; they do not automatically rewrite
existing agent assignments or create duplicate hierarchy nodes. The source
SELECT definitions do not fabricate data; approved uploaded extracts are loaded
separately as reference records, described below.
SQL Server extraction, connections and synchronization remain deferred.

Apply `0056_sales_enrollment_catalogs.sql` after the existing Sales Structure
migration in development/local setup. The local database helper includes both.
The old generic **Structure setup** editor is not exposed in navigation.
**Manager Enrollment** was subsequently requested again as a combined
four-category page; Unit Managers and Regional Managers are no longer separate
submenu links. The Medical/GI parent menus and current links are listed above.
Existing general hierarchy data, enrollments, audit history and compatibility
routes remain intact; no data was deleted. Catalog-specific snapshots are
retained in `crm.sales_catalog_events`.

## Uploaded source references

The user approved loading the supplied rows as **reference records**, not as
verified user enrollments. Migration `0057_sales_source_references.sql` keeps
them in `crm.sales_catalog_source_records`, separate from editable enrollments.
They appear on the corresponding nine pages with read-only details and
mapping/quality warnings. Lists and reference details display relationship names,
not internal codes or record IDs. Missing names are marked "Not mapped", blank
relationships "Not assigned", and ambiguous matches "Needs mapping"; no code
fallback or guessed manager is displayed. Search also matches related names.
Source provenance and exact identifiers remain stored unchanged.
Repeated manager identifiers and original source
IDs are preserved per row, along with blank values, NULL markers, leading zeroes,
historical approvals and dates. They are not silently corrected, deduplicated by
manager ID or matched to accounts by name/email. Imported managers remain
unavailable as manager assignment choices until deliberately linked to verified
MIS accounts. No normal users are created and no account access is granted.

The user subsequently approved **imported organizational choices**. Imported
Sales Units, Sales Branches, Sales Regions, GI Units and GI Branches can therefore
be selected by name in catalog relationship dropdowns while remaining read-only
source rows. The API marks eligible rows with `organization_choice`; saving uses
the original code and validates the target's active status and branch/region
relationships. It does not copy legacy manager assignments into the new record.
Operational entries take precedence over imported rows sharing a code (including
inactive operational entries). Ambiguous imported organization codes are withheld
instead of choosing one arbitrarily. Source manager catalogs and unknown National
codes do not become eligible through this organizational exception.

Load a user-approved tab-separated extract with the development-only script:

    node artifacts/api-server/scripts/import-sales-references.mjs <extract.txt>
    node artifacts/api-server/scripts/import-sales-references.mjs <extract.txt> --apply

The first command previews sections/counts only; `--apply` is atomic and skips
identical source rows by catalog and row fingerprint. It writes only reference
storage; it never writes the upstream database or editable enrollments. Source
validity and unresolved mappings are reported as captured at import time.

# Earlier general hierarchy (compatibility only)

The following documents the earlier general hierarchy implementation. Its two
submenu links are no longer exposed; new navigation uses the nine sales catalogs
described above. Existing records and compatibility routes were not removed.

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
