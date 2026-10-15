---
name: Export runtime clock
description: Timestamp handling when the durable execution runtime rejects its ambient clock.
---

Use the database's returned capture timestamp to name a production export and
describe its snapshot time, rather than the later packaging time.

**Why:** A durable execution session rejected no-argument `new Date()` despite
the general callback documentation describing it as supported. The database's
capture time also identifies the actual data snapshot more accurately.

**How to apply:** Keep the timestamp returned with the read-only export and use
it consistently in filenames and manifests. If runtime clock access is rejected,
do not repeatedly retry it or substitute an assumed current date.
