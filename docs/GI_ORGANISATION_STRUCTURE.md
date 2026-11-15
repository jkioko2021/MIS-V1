# GI organisation setup

GI is separate from Medical and retains **GI Branch → GI Unit**. Administrators
and active National Sales Admin users access `Organization structure-GI`.

## Pages

- `/admin/gi-structure/dashboard`: hierarchy overview.
- `/admin/gi-structure/hierarchy`: combined, searchable Branch/Unit setup with a
  level filter, versioned edits, optional Branch coordinators and Unit managers.
- `/admin/gi-structure/managers`: GI designation enrollment and import review.
- `/admin/gi-structure/medical-units`: multiple Medical Units to one GI Unit.

Original GI catalog URLs redirect to the new setup. Legacy catalog writes are
blocked to avoid creating a second organisation master; uploaded source rows
remain unchanged.

## Pending versus operational

Imported Branches and Units remain `PENDING`. Their source-declared Branch and
manager references are retained as setup links. Activating a Unit requires an
available active GI Branch and a valid active GI Unit Manager designation.
Branch coordinators are optional. A manager may manage more than one team.
Manager enrollment never activates, approves or changes a login account.

## GI manager fields

The designation captures `GI_UM_ID`, `GI_UM_NAME`, `GI_UNIT_CODE`, `EMAIL`,
`HRMIS_CODE`, `ACTIVE`, `MIS_EMP_CODE`, `EARN_RETAINER`, `NSM_CODE`, `VALID_FROM`,
`VALID_TO`, `JOIN_DATE`, `RET_EFF_UPTO`, and `RETAINER_AMT`. `ACTIVE` is stored as
`is_active`; the other fields are in the designation's `details`.

The verified MIS employee link is independent of legacy GI and MIS employee
identifiers. Imported records retain the original values, not substituted
usernames or current account codes. Missing fields stay blank. Amounts are
decimal strings, not JavaScript floating-point numbers. Retainer terms are
metadata only and do not initiate payments.

Import groups a repeated GI identifier only when account provenance agrees.
Every source row remains linked separately. Conflicting fields are left blank
with review notes, rather than choosing one Unit or retainer date arbitrarily.
Unverified identities remain in import review and are not enrolled by name.
Drafts remain inactive regardless of the source Active flag.

Medical hierarchy, enrollment and manager-mapping selectors exclude GI-only
designations/accounts using their source-domain provenance. A genuine Medical/GI
dual-role manager remains visible in both. This is a presentation boundary, not
deletion of legacy enrollments, source records, accounts or audit history.

## Medical Unit mappings

Each Medical Unit has at most one current GI Unit. Many Medical Units can share
the same target. Explicit links between pending references are allowed but are
marked setup-only; a mapping is operational only when both sides are available.
Mapping does not activate either hierarchy, transfer agents, or alter Medical
ancestry or original source values.

Bulk saves are atomic and version-checked. The interface asks for confirmation
before replacing existing targets. Unmapping retains a versioned tombstone and
before/after history, preventing stale delete/recreate requests from overwriting
newer choices. A mapped GI Unit cannot move Branch or become inactive until its
Medical links are explicitly removed.

All writes require reasons, use the shared hierarchy transaction lock and append
audit history. History access is administrator-scoped.

## Development verification

`pnpm --filter @workspace/api-server run test:gi-structure` runs rollback-only
PostgreSQL checks of permissions, metadata precision, manager validity, shared
manager assignments, mapping/reassignment, stale requests and audit failures.
Migrations `0067` and `0068` add the development GI model and import setup data
without modifying the original uploaded rows or existing MIS accounts.
