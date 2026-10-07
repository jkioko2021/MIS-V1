---
name: Workspace versus app preview diagnostics
description: Distinguish a black Replit Build view from missing MIS menus or an application rendering failure.
---

Do not claim that the Build view is restored merely because the MIS app serves
HTTP 200, renders in an app screenshot, or has been presented again.

**Why:** The user reported that clicking Build made the whole webpage black
even while independent MIS preview checks succeeded. App checks do not inspect
the containing Replit workspace interface.

**How to apply:** Distinguish the entire workspace, the app pane and role-filtered
menus before editing permissions or application code. Consult current Replit
troubleshooting documentation for workspace symptoms. If client screenshots or
errors are unavailable, state the diagnostic limitation instead of declaring
the workspace fixed or inventing an application-level cause.
