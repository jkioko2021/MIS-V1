---
name: Organisation hierarchy boundaries
description: Canonical hierarchy, legacy-reference compatibility and historical agent assignment policy.
---

The full organisation workflow is National → Region → Branch → Unit → Agent.
Agent registration selects one Unit; its ancestors are derived, not independently
editable selections. Operational National, Region and Unit levels require an
eligible manager designation of the corresponding category. Branch managers are
optional: existing managerless Branches remain blank unless explicitly assigned.
New hierarchy setup does not activate,
approve or change the profile of an existing login account.

**Why:** The user supplied the Organisation Structure Hierarchy & Agent Mapping
implementation requirements, while previously authorising imported Sales accounts
to remain inactive pending individual account setup.

**How to apply:** Reuse the existing hierarchy and agent identities. A source
reference may be adopted into the canonical hierarchy only through an explicit,
validated mapping. Do not infer missing Nationals, overwrite imported values or
silently promote unverified manager identities. Older reference-only manager
mapping remains compatible until that organisation is adopted; thereafter the
canonical hierarchy controls its current manager.

Agent transfers preserve immutable hierarchy snapshots and original source
organisation codes. Current reporting derives ancestry from the assigned Unit;
historical reporting uses the effective assignment snapshot. A node containing
assigned agents cannot be reparented or deactivated until they are explicitly
transferred.

**Why:** Reparenting a live Unit would otherwise silently transfer its agents and
rewrite historical reporting without an approved agent-transfer decision.

**How to apply:** Keep initial mapping and transfers explicit and audited. Do not
backfill fictitious pre-mapping history. Historical hierarchy does not imply
historical agent status or commission amounts. Apply organisational scope on
every reporting endpoint; SQL reporting views alone do not enforce actor access.
Keep scoped frontend query keys tied to the signed-in account.

The organisation menu is named **Organization structure-Medical** and reuses the
previously loaded Medical regions, branches and units. GI setup remains separate.
The previous **Medical Structure setup** menu and its submenus are retired;
Manager Enrollment belongs to the new Medical menu.

National, Regions, Branches and Units belong to one **Hierachy Setup** menu item
within Organization structure-Medical, rather than four separate sidebar items.

**Why:** The user explicitly asked to combine those four items under that name.

**How to apply:** Retain all four setup categories within the combined page and
preserve old links and existing records. Keep Manager Enrollment, manager/agent
mapping and GI setup separate.

**Why:** The user asked to update the new organisation structure from the earlier
Medical Structure pages and rename it specifically for Medical.
The user subsequently asked to delete the previous Medical Structure setup menu,
including its submenus.

**How to apply:** Present existing imported Medical records even before they have
eligible hierarchy parents/managers, but distinguish pending references from
operational nodes. Do not interpret visibility in the Medical source list as
authorisation to activate accounts or make a Unit available to agents.

Medical **Assigned manager** must list **Sales Manager** profile accounts at
National, Region, Branch and Unit level, including people not yet enrolled in
that category. Saving an assignment still requires a matching eligible category
enrollment; provide an explicit inline enrollment route rather than hiding them.

**Why:** The user asked for Sales Manager users on the National Assigned manager
field and clarified that the same rule applies to regions, branches and units.
The user reiterated that Assigned manager should display Sales Managers after
the uploaded accounts had been activated; deriving the list only from category
enrollments incorrectly kept it empty.

**How to apply:** Filter choices and validate assignments on the server. Do not
silently change existing account profiles, activate accounts or create manager
designations to fill an empty list. Keep the selected account/category fixed
while completing the explicit enrollment form. Enrollment by itself does not
grant a profile, and global staff choices are admin-only.

Hierarchy Setup is one combined list, without National, Region, Branch or Unit
tabs. Keep level selection in the entry form and retain access to imported
source records without turning them into operational nodes automatically.
Show uploaded Regions, Branches and Units in that main list at their original
levels as **Pending Setup** until explicitly adopted.

**Why:** The user explicitly requested removing the four level tabs, then chose
"Show as Pending Setup" when asked how to load the uploaded organisational rows.

**How to apply:** Do not leave a hidden level filter behind when removing tabs.
Legacy level links may prefill a new entry but must not hide other levels.
The user subsequently requested explicit filtering by the selected hierarchy
level: Region shows only Regions, Branch only Branches and Unit only Units.
Keep this as a visible dropdown, not restored tabs, and synchronize it with
the entry form's selected level.

Hierarchy Setup forms omit Speciality, Unit type, Branch type, GI unit, Year
and GI branch.

**Why:** The user requested removing these fields from Hierarchy Setup.

**How to apply:** Keep them out of create/edit controls without deleting
historical or original imported values.

Imported hierarchy manager links and Branch approval are setup decisions only,
not activation of the operational hierarchy.

**Why:** The user chose “Approve Branches, keep hierarchy pending.”

**How to apply:** Link Region/Unit source references only through verified MIS
account provenance. Leave unmatched or conflicting identities unresolved.
Show managerless Branches as approved for setup while retaining Pending Setup.
Do not create operational nodes, manager enrollments or agent assignments as a
side effect of this import.

The uploaded National code `N_0001` is explicitly mapped to the existing
**NATIONAL** record, canonical code `NSM-0001`, for Medical Regions, Branches
and Units. This is a setup mapping, not activation or source-code replacement.
Manager cells show the manager's name only, or a dash when absent; omit remarks.

**Why:** The user confirmed “Map to existing NATIONAL” and requested removal of
remarks from the manager field.

**How to apply:** Preserve uploaded codes and Pending Setup status. Derive Region
setup's National parent from this explicit mapping and retain Branch/Unit source
parents. Do not silently route records into a different National, activate draft
manager enrollments, or alter agent assignments.

National Sales Admins may manage hierarchy assignments and reassign Region, Unit
and optional Branch managers. Pending setup links may be changed explicitly to
an eligible Sales Manager user without activating their category enrollment.
Operational assignments still require an active, matching category enrollment.

**Why:** The user requested Sales Admin manager reassignment for Regions, Branches
and Units, then confirmed “Allow optional Branch managers.”

**How to apply:** Preserve Branches without managers until explicitly assigned.
Keep changes audited and version-checked. Manual pending-manager selections are
distinct from imported identity matches; retain source records and prior links
in history. Display imported Unit names in Agent Unit Mapping without making
pending or unavailable Units selectable.

Medical manager activation allows blank optional email, HRMIS, mobile and tax
fields. Keep verified account identity and eligibility, both validity dates,
and verified manager/parent mappings mandatory. Never invent missing values.

**Why:** The user explicitly chose “Allow blank optional fields” when activating
Medical units and agreed that unresolved managers and missing validity dates
remain blocked.

**How to apply:** Activate only validated hierarchy entries and their required
parents using existing mappings. Leave unresolved units pending; do not activate
login accounts or change manager assignments as a side effect.
