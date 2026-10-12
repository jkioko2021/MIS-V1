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
