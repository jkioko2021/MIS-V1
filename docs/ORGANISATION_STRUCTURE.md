# Organization structure-Medical and Agent Unit Mapping

National, Regions, Branches and Units are combined under **Hierachy Setup** in
Organization structure-Medical, in one list without level tabs. The entry form
retains Hierarchy level, while imported references remain accessible in the
expandable source-record section. Old level URLs prefill the entry category
without filtering the combined list. Other Medical and GI menu items remain
separate. This navigation change does not alter records or account permissions.

Hierarchy lookups use searchable, viewport-bounded popups with wrapping labels
and scrollable results. Assigned manager searches names and email addresses,
retaining the actual account/designation identifier when a result is selected.

## Implementation assessment

MIS V1 already uses a React/Vite frontend, Express API, PostgreSQL persistence and
the existing cookie/JWT session mechanism. No replacement framework, login flow
or user directory is introduced.

Reusable structures:

- `crm.sales_structure_nodes`: the operational National → Region → Branch → Unit hierarchy.
- `crm.sales_manager_enrollments`: category-specific designations linked to normal MIS users.
- `crm.sales_setup_events`: hierarchy and designation audit events.
- `crm.tbl_mis_sales_intermediary`: the existing core-imported agent master.
- Existing intermediary licences, documents, workflow events and registration gates.
- `crm.sales_catalog_source_records`: read-only imported Medical/GI reference data.
- Existing Medical/GI setup screens, shared controls and generated API client.

Before implementation, the development hierarchy and manager designation tables
were empty; there were 16 agents, 56 user accounts and 141 imported reference rows.
No original people or agent records were recreated or automatically activated.

### Conflicts and resolutions

1. Imported source data does not establish a complete National hierarchy.
   Administrators must choose real parents; missing Nationals are not fabricated.
2. Source references are not a second operational hierarchy. **Imported
   organisation match** adopts the existing code/name by reference. Ambiguous
   codes or inconsistent recorded parents are rejected. Original source values
   remain unchanged.
3. Existing catalog/manager mapping writes cannot override an organisation once
   adopted into Organisation Structure. They direct the user to its canonical
   editor. Prior mapping histories remain readable; an existing current mapping
   is synchronised, with an audit event, if the canonical manager changes.
4. Older agents retain their original source organisation codes. A nullable Unit
   foreign key supports controlled initial mapping without inventing historical
   assignments. Registration profile saves and completion now require a valid Unit.
5. No live sales, commission calculation or agent productivity reporting module
   was found. Shared reporting views and a scoped agent report are provided for
   these integrations; no sales figures or commission transactions are invented.

## Where to find it

Under **Organization structure-Medical**, in the Administration area:

| Screen | Route |
| --- | --- |
| Expandable hierarchy dashboard | `/admin/organisation/dashboard` |
| National Management | `/admin/organisation/national` |
| Region Management | `/admin/organisation/regions` |
| Branch Management | `/admin/organisation/branches` |
| Unit Management | `/admin/organisation/units` |
| Manager Assignment | `/admin/organisation/managers` |
| Agent Unit Mapping and reporting | `/admin/organisation/agents` |

The previous Medical Structure setup navigation has been removed. Its old
Units, Branches, Regions and Manager Mapping links redirect to the corresponding
Organization structure-Medical pages. GI Structure setup remains separate.
Manager Enrollment is available within Organization structure-Medical and creates
a designation, not a new person or
replacement login profile. A manager may own several organisations.

For saving Medical **Assigned manager** selections, National, Region, Branch and Unit
all require the existing **Sales Manager** account profile as well as the matching
eligible manager enrollment. This filter is enforced on the returned choices and
on create/update requests. It does not automatically change anyone's profile;
an empty list must be resolved through User Enrollment and Manager Enrollment.

The Assigned manager dropdown lists Sales Manager **accounts**, even before a
category enrollment exists. Selecting an unenrolled account exposes the existing
enrollment form inline, fixed to that person and level. Saving the designation
refreshes and selects its real ID; the hierarchy cannot save a pending account ID.
Inactive or expired designations can be reviewed through the same path. The staff
roster is returned only to administrators, never to scoped reporting users.

## Setup workflow

1. Use existing User Enrollment to prepare the intended manager accounts.
   Imported inactive/unapproved accounts remain inactive until explicitly
   approved, individually password-configured and activated.
2. Enrol eligible Sales users in the required National, Regional, Branch or Unit
   manager category. Their existing MIS code is reused.
3. Create the National and select an eligible National Sales Manager.
4. Create or adopt Regions under that National, then Branches under Regions,
   then Units under Branches. Each requires the corresponding enrolled manager.
5. At Agent Registration, choose an active, available Unit. Branch, Region and
   National are derived from its parent chain and displayed read-only.
6. Use Agent Unit Mapping to assign older unmapped agents. This records the
   original source codes and the newly approved hierarchy without rewriting the
   imported values.

An available Unit has an active ancestor chain and eligible, active manager
designations at every level. Designation validity dates and account
activation/approval/lock state are respected.

## Validation and audit

- Organisation codes are globally unique, immutable and case-normalised, reusing
  the existing hierarchy constraint. Names may be edited; names within the same
  parent must remain unique.
- Parent level must be exact. No Region without National, Branch without Region
  or Unit without Branch. No cycles or inactive-parent creation.
- Manager category must match the organisation level. Selecting a manager never
  grants administration rights or changes the login account.
- New records require a manager even when initially inactive.
- Optimistic versions reject stale writes. Shared transaction/advisory locks
  serialise hierarchy, manager and agent-unit changes.
- Nodes with assigned agents cannot be moved or deactivated until those agents
  are explicitly transferred. Active children must be moved/deactivated before
  retiring their parent. No hard-delete API is exposed.
- Agent registration still requires its existing verified licence, supporting
  documents and other completion conditions; Unit selection does not bypass them.
- Unit transfers capture agent, origin, destination, effective date, reason,
  server-authenticated approver and approval timestamp, atomically with history.
- Future-dated transfers are deliberately rejected. Apply them on their effective
  date. A new effective date cannot precede the latest assignment. For several
  same-day transfers, the last approved assignment is the end-of-day position.
- Assignment history snapshots retain the hierarchy names/codes at assignment
  time, including after subsequent node renaming or manager reassignment.
- Assignment history rejects normal UPDATE/DELETE. The development-only test
  cleanup helper temporarily disables that trigger inside an exclusive,
  rollback-safe transaction for exact synthetic fixture IDs only.

## Access

- System Administrator/SuperAdmin: full hierarchy setup, manager assignment,
  agent initial mapping, transfers, all reporting and assignment history.
- Assigned National/Regional/Branch/Unit managers: read-only assigned subtree(s)
  and agents beneath them. Scope is evaluated from current database assignments,
  account eligibility and designation validity, not a client-provided manager ID.
- An arbitrary node ID outside the actor's scope is rejected by the API.
  Transfer/setup mutations remain administrator-only.
- National Sales Admin retains its existing global agent-enrolment authority and
  can read available hierarchy choices, without gaining hierarchy administration.
- Unassigned ordinary users and agents do not gain access to this module. Existing
  agent and other module permissions are unchanged.
- Scoped query keys include the signed-in account identity; an administrator's
  cached hierarchy is not reused for another account.

## Reporting and historical interpretation

`GET /api/organisation/agents` supports search, organisation drill-down at any
level, administrator-only unmapped filtering, historical `as_of` date and
50-row pagination. CSV export is explicitly **current page only**, reflects
the active filters and neutralises spreadsheet formula prefixes.

Historical reports use the most recent assignment effective on or before the
selected date. No inferred assignment is shown before an agent's first mapping.
The hierarchy is historical; **agent status remains its current master status**.
Manager access to history is limited to agents currently in their scope and
assignment rows within their permitted Units. Transferring an agent away removes
the previous manager's access. Administrators retain the full audit view.

Reusable SQL dimensions:

- `crm.organisation_paths`: ancestor IDs, ordered path and current availability.
- `crm.agent_organisation_current`: one row per existing agent, with derived
  National/Region/Branch/Unit IDs, codes and names.
- `crm.agent_organisation_history`: immutable assignment snapshots and the next
  effective date (`valid_until`, exclusive).

These views do not independently implement per-user SQL access. Any future sales,
commission or performance API must apply the same `organisationScope` restrictions
before querying or exporting them. Never expose raw view access to browsers.

## Existing Medical fields and records

The Regions, Branches and Units pages also display the previously loaded Medical
source records, using the existing catalog data and name-resolution helpers.
The imported collection currently includes 10 regions, 11 branches and 32 units.
These records are shown by default, including references still awaiting setup.
Dashboard import counts are separate from operational hierarchy counts; linking
a source row does not create another imported organisation or double-count it.

Each original record can be searched and opened with its existing Medical fields.
Source relationships are explicitly labelled original values. Where a source row
has been adopted, the current canonical hierarchy and manager are displayed
separately and remain authoritative.

**Configure** starts the existing hierarchy editor with the source identity and
Medical defaults, rather than recreating them by hand. Creation still requires
the recorded parent and an eligible manager. No National, manager designation,
account activation or agent assignment is generated automatically.

Operational Medical details include:

- Region: validity start and end.
- Branch: branch type, speciality and optional existing GI branch link.
- Unit: unit type, speciality, year, validity dates, MIS number and optional
  existing GI unit link.

The code, display name, parent, manager and active status remain dedicated
hierarchy fields, not competing copies in the Medical details object. Optional
operating dates are retained as catalog information; they do not bypass or replace
the hierarchy's active/eligible-manager checks.

Create inherits source defaults. Edits preserve omitted values and support explicit
clearing of optional fields. Calendar dates, date ordering, year, field limits,
allowed field names and GI references are validated. Changes use the same version
checks and before/after audit history as the existing hierarchy editor. Original
source rows stay read-only.

Imported records and their full source details are fetched and rendered for
administrators only. Normal assigned managers retain their scoped hierarchy view;
they do not receive the administrator-only source catalog.

The previous Medical Structure setup menu and its submenus have been retired;
the new Medical menu and GI Structure setup remain available. Manager Enrollment
is linked from the new Medical menu and continues to reuse existing users.

## Migration

`lib/db/migrations/0061_organisation_agent_hierarchy.sql`, applied to development:

- Adds an optional unique source reference to the existing hierarchy nodes.
- Adds `organisation_unit_id` and its index/FK to the existing agent master.
- Creates `agent_unit_assignments` and history/destination indexes.
- Creates the three reporting views described above.
- Adds node-parent/manager and agent-Unit validation triggers and immutable
  assignment-history protection.
- Registers the new administrator navigation entries.
- Included in the existing local database metadata upgrade sequence.

The migration is rerunnable. It does not drop existing tables, reset accounts,
auto-map agents, rewrite source data or alter production. Apply this migration to
the target database before running updated code there; production was not changed
or published as part of this implementation.

`lib/db/migrations/0062_medical_organisation_details.sql` adds the non-destructive
operational Medical details object and renames existing menu-rights rows without
changing their permissions or URLs. It is rerunnable and applied to development
only. The local metadata upgrade sequence includes both migrations.

Medical verification covers real PostgreSQL source-default inheritance, edits,
clearing, rejected invalid fields/dates/GI links, stale updates and audit data,
alongside the existing scoped hierarchy and transfer regression checks. The
component regression covers source defaults and sparse create/update payloads.
Browser verification also confirmed all three imported lists, search and source
details, prefilled configuration, retained drafts, create/reload/edit/clear
persistence and unchanged original values. It verified manager exclusion from
source records and protected writes, plus the Units page and editor at 390px.
All synthetic records were removed and original users, agents and source
fingerprints were unchanged. Mobile Region/Branch pages were not separately
exercised.

## Files

Main backend:

- `artifacts/api-server/src/lib/organisation.ts`
- `artifacts/api-server/src/routes/organisation.ts`
- Existing `sales-structure`, `sales-catalogs`, `sales-manager-mapping`,
  `sales-mapping-organizations` and `intermediary` modules.
- API router and administrator menu registry.

Main frontend:

- `artifacts/mis-v1/src/pages/admin/organisation/`
  (`index`, `node-editor`, `hierarchy-tree`, `agent-mapping`, `shared`)
- Application navigation/routes.
- Agent registration and shared intermediary profile fields.

Contract/tooling:

- `lib/api-spec/openapi.yaml` and generated client/Zod types.
- Migration above and `scripts/src/sales-structure-metadata.mjs`.
- `artifacts/api-server/test/organisation-hierarchy.integration.mjs`,
  shared organisation fixture, and updated catalog/mapping/intermediary regressions.

## Verification

Passed:

- Full workspace type check.
- Production frontend build and API workflow build/start.
- Real PostgreSQL rollback integration: four-level creation/validation,
  category-matched managers, registration Unit gate and derived ancestry,
  all four manager scopes, out-of-scope IDs, administrator-only mutations,
  atomic audit-failure rollback, controlled transfers, historical dates,
  immutable history, imported reference adoption and unchanged accounts/source.
- Existing manager details, catalog, manager transfer and intermediary
  registration/compliance rollback regressions.
- Real HTTP agent registration/authorisation and mandatory Unit validation.
- Browser journey: top-down creation and edit, duplicate rejection with retained
  draft, expandable tree, Unit drill-down, registration profile save and derived
  path, confirmed transfer, reload persistence, history and current-page CSV.
- Browser manager isolation after an administrator session: no cached
  administrator data, read-only assigned Unit only, foreign Unit/report/transfer
  and setup requests rejected.
- Browser layout checks at 390px for hierarchy, mapping and node editor.
- Targeted component regression for keeping code/name drafts when changing a
  parent, including compatible/incompatible imported source links.

The browser fixtures were fully removed, and original user, agent and imported
source digests were unchanged. Registration at 390px and the final
licence/document completion click were not exercised in the browser; completion
gates and successful completion were verified by the PostgreSQL integration test.

The broader API unit run passed 84 of 91 tests, with seven failures in unchanged
test areas:

- `local-adapters.test.mjs`: its isolated database mock is missing `query` and
  `queryOne` exports required by the existing storage/intermediary imports.
- Five `mis-refund-route.test.mjs` checks: the bundled development logger worker
  fails with `__dirname is not defined` in that test harness.
- `risk-department-filter.test.mjs`: expects six identity-keyed query hooks while
  the unchanged Risk module currently contains eight.

These failures were not hidden or worked around by changing unrelated runtime
behaviour. Browser verification results are recorded in the delivery chat.
