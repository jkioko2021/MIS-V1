---
name: Admin module
description: User enrollment, profiles/roles CRUD, and access rights matrix implementation
---

## What was built
Full administration module under `/admin/*` with two pages:
- `/admin/users` — enroll, edit, activate/approve/lock/unlock, reset password
- `/admin/profiles` — create/rename/delete profiles; per-profile access rights matrix

## Route layout
Backend routes in `artifacts/api-server/src/routes/admin.ts`, mounted via `router.use(adminRouter)` in routes/index.ts.
All routes are protected by `requireAuth` middleware at the router level.

Route paths (after app.use("/api") strips the prefix):
- `/admin/employees` — list (GET), enroll (POST)
- `/admin/employees/:id` — detail (GET), update (PUT)
- `/admin/employees/:id/activate|approve|lock|reset-password` — POST actions
- `/admin/profiles` — list (GET), create (POST)
- `/admin/profiles/:id` — update (PUT), delete (DELETE)
- `/admin/profiles/:id/access` — GET (merged master+DB), PUT (bulk replace)
- `/admin/menu-master` — GET full master list

## MENU_MASTER
Defined as a constant in `admin.ts`. This is the single source of truth for all possible pages/permissions.
When adding new app pages, add them here so they appear in the access matrix.
GET `/admin/profiles/:id/access` merges MENU_MASTER with DB rows — profiles with no DB rows get all-false defaults.

## Sidebar visibility
Admin section (`/admin/users`, `/admin/profiles`) only shown to profileId 1 (SuperAdmin) or 2 (System Admin) — see `App.tsx` `isAdmin` check. Change this if roles expand.

## Access rights columns
`can_access`, `can_add`, `can_edit`, `can_delete`, `read_only` — stored in `crm.menu_access`.
UI auto-enables `can_access` when any other permission is turned on; disabling access clears all others.

## Employee auto-numbering
emp_code generated as `EMP{NNN}` based on MAX(employee_id) at insert time. Not gap-safe but sufficient for the current scale.

**Why:** Legacy system used sequential emp codes; preserving the pattern ensures familiarity.
