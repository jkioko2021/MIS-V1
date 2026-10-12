---
name: Development schema validation
description: Distinguish pending reference migrations from import or authorization failures.
---

Compilation and server health checks do not prove that the development database
contains the schema required by an authenticated workflow.

**Why:** An authenticated workflow can depend on approved reference tables that
are not exercised by compilation or server health checks.

**How to apply:** Treat schema readiness as a separate prerequisite for data
workflow verification. Never substitute fallback reference values for required
approved tables. Development schema readiness does not establish production
schema readiness.

A passing live integration check may exercise an older running API even when the
working tree already contains merged workflow changes. Confirm the running build
and development schema together before treating that check as evidence.

**Why:** Newly merged workflow side effects can introduce cleanup dependencies
that an older API never creates; tests against that process miss the dependency.
Standalone SQL migrations can also remain unapplied after the post-merge ORM
schema sync succeeds.

**How to apply:** After merged API changes, restart its managed workflow and apply
the existing development migrations before verifying fixture creation and cleanup.
Check included standalone SQL migrations explicitly rather than assuming the
post-merge schema sync executed them.
Do not change the production schema or skip missing-table failures to make the
development check pass.
