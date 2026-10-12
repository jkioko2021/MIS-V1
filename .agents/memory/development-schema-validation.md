---
name: Development schema validation
description: Distinguish pending reference migrations from import or authorization failures.
---

Compilation and server health checks do not prove that the development database
contains the schema required by an authenticated workflow.

**Why:** Pending reference-list work once made the entire risk options endpoint
fail because its new reference table had not yet been created in development.
This prevented the import UI from loading before import validation even ran.

**How to apply:** Treat schema readiness as a separate prerequisite for data
workflow verification. Never substitute fallback reference values for required
approved tables. Development schema readiness does not establish production
schema readiness.
