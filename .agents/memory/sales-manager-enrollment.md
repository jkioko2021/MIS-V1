---
name: Sales manager enrollment
description: User-defined boundary between ordinary MIS accounts and sales-manager designations.
---

Sales managers are created as normal users, then enrolled on a separate page as
Unit, Branch, Regional or National Sales Managers. Enrollment is not a separate
person record or replacement login profile.

**Why:** The user clarified: "These will be created as Normal users but will have
a page to enroll them as Unit manage,Branch,or regional Managers."

**How to apply:** Reuse the existing user identity for manager mappings. Keep
sales-manager designations separate from authentication and access rights; do not
grant Administration access or change a user's base profile merely because they
are enrolled as a manager.

Manager enrollment requires an existing MIS user with a code. Both **Code** and
**MIS_EMP_CODE** use that existing user's code; do not generate a separate manager
code or substitute an internal numeric record ID. Name comes from the same account.

**Why:** The user selected "Use existing MIS user code" and confirmed "use that
code" when requesting the manager enrollment details.

**How to apply:** Populate those identity fields from the selected user and
validate the link when saving. Missing codes must be corrected on the existing
account, not invented during manager enrollment. Manager contact, payroll, tax,
active status and validity dates belong to the designation, not the login profile.

Keep normal-user mapping compatible when no formal designation has yet been
captured, but honor an explicitly inactive designation for its manager category.

**Why:** Adding enrollment details must not retroactively invalidate established
normal-user assignment workflows; an explicit category deactivation still needs
to prevent new assignments at that level.

**How to apply:** Do not make the capture form a new login/profile prerequisite.
Block deactivation while that category has mapped teams, and retain the person's
other category designations and team assignments.

Uploaded sales catalog rows are **reference records**, separate from operational
enrollments. Retain repeated manager IDs across assignments and the original
source values. Source loading alone does not authorize account creation.

**Why:** When the supplied source data revealed repeated manager identifiers,
missing relationships and unlinked users, the user chose "Load as reference records."

**How to apply:** Show imported rows read-only with mapping warnings. Do not
offer imported managers as verified manager choices or use source approval flags
to grant access. Future manager reconciliation must deliberately verify each
assignment. Organizational lookup eligibility is a separate user-approved
exception, described in sales-catalog-presentation.md.

The user subsequently authorized enrolling the uploaded Unit, Regional and GI
managers as normal system users under **Sales**, chose **inactive accounts**
pending individual password setup, and requested a single user record rather
than duplicate users. Manager Enrollment's existing-user selector is Sales-only,
shows name and email only, and deduplicates names for display.

**Why:** The user explicitly requested Sales accounts and Sales-only choices,
then said "remove duplicate users.mantan single record."

**How to apply:** Maintain one account per confirmed person across Medical/GI
assignment rows, without deleting those assignments. Keep new accounts inactive
and unapproved, with no shared/default password or automatic emails. Pending Sales
accounts must still be selectable to capture **inactive** manager designations;
only an active, approved and unlocked account can have an active designation.
This resolves the user's follow-up that existing users could not be selected
without changing their prior decision to leave login accounts inactive.
Hold ambiguous names, shared emails or unverified existing-account matches for
review rather than merging or changing another person's account.

The user subsequently authorized the verified uploaded manager list to use the
**Sales** department and **Sales Manager** profile, with accounts approved and
activated. The earlier inactive-import choice is an initial-import safeguard,
not a requirement to keep these verified accounts disabled.

**Why:** The user explicitly requested: "Assign uploaded list to sales
department,and sales manager profile ,approve and activate".

**How to apply:** Do not reset approved existing accounts to inactive import
defaults when reprocessing references. Restrict this authorization to confirmed
source-to-account links; unresolved identities remain held. Do not change
passwords, create shared credentials or treat approval as category enrollment.

Keep Medical and GI structure setup separate. Medical uses one combined Manager
Enrollment with Unit Manager, Regional Manager, Branch Manager and National Sales
Manager categories, rather than separate Unit Managers and Regional Managers
submenu links. Do not restore the old generic Structure setup editor link.

**Why:** The user superseded the earlier removal of Manager enrollment by asking
to combine the two medical manager submenus into one four-category enrollment
page and separate GI Structure setup.

**How to apply:** Preserve existing imported references and operational
designations across the navigation change. Combining a page does not authorize
deleting history, merging different source identities or changing account access.

One manager may oversee multiple units, branches or regions, while each team has
one current manager. Explicit reassignment to a different team is a move, not an
implicit removal of all the person's other assignments.

**Why:** The user chose "Allow multiple teams per manager" and then requested the
ability to reassign unit, branch and region managers to different teams.

**How to apply:** Keep assignment and move distinct. A confirmed move removes
only the selected origin, assigns the destination at the same manager level,
and preserves both histories atomically. Require a reason and explicit review
of any destination manager being replaced. Never bulk-clear the manager's other
teams or rewrite their normal user account.

Missing uploaded manager enrollment fields must stay blank in inactive drafts.

**Why:** When told uploaded managers lacked required contact/tax information and
offered inactive drafts, the user replied “leave them blank.”

**How to apply:** Use verified existing MIS accounts and their canonical codes.
Do not invent contact data, tax rates or validity dates, and do not choose between
conflicting uploaded values. Preserve Medical/GI source provenance and one
enrollment per person/category. Missing details prevent activation; neither draft
capture nor later category edits activate or change the person's login account.
