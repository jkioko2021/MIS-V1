---
name: Preview port reconciliation
description: Managed workflow restarts can leave older frontend or API servers occupying service ports.
---

A failed managed preview or API workflow does not guarantee its previous server process stopped.

**Why:** Automatic merge reconciliation repeatedly left older MIS frontend and API listeners running while replacement workflows failed with “Port already in use” or EADDRINUSE.

**How to apply:** Check the listener and its process working directory before retrying. Stop only the confirmed orphan belonging to that artifact, then restart its existing managed workflow. Do not start a duplicate server, change its port or kill unrelated Node processes.
