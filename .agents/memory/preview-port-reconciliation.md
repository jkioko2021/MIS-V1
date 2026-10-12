---
name: Preview port reconciliation
description: Managed workflow restarts can leave an older Vite listener occupying the preview port.
---

A failed managed preview workflow does not guarantee its previous server process stopped.

**Why:** Automatic merge reconciliation repeatedly left an older MIS Vite listener running while the replacement workflow failed with “Port already in use”.

**How to apply:** Check the listener and its process working directory before retrying. Stop only the confirmed orphan belonging to that artifact, then restart its existing managed workflow. Do not start a duplicate server, change its port or kill unrelated Node processes.
