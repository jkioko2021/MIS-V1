---
name: Allocation handoff footer
description: Visibility and gating rule for the allocation transaction controls.
---

The allocation footer must always show the document transaction and workflow controls in their final-page position. When benefit verification is incomplete, show the explanatory warning and disable the action-dependent controls and Forward button instead of hiding the handoff area; notes remain available.

**Why:** Operators need to see the required next-process controls and why they are blocked, rather than mistaking a gate for a missing workflow.

**How to apply:** Keep Action, server-derived Forward to, read-only Entered By, Notes, and Forward together after the detail tabs and Notes/History section. Preserve the server-side verification and AML gates; the visible disabled state is guidance, not enforcement.