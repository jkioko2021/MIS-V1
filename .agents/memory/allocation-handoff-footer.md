---
name: Allocation handoff footer
description: Visibility and gating rule for the allocation transaction controls.
---

The allocation footer must always show the document transaction and workflow controls in their final-page position. The Invoice / Credit Note field set stays visible even when the selected checklist document does not use every field; non-applicable AML and payment controls explain their conditional state and remain disabled. When benefit verification is incomplete, show the explanatory warning and disable the action-dependent controls and Forward button instead of hiding the handoff area; notes remain available.

**Why:** Operators need to see the required next-process controls and why they are blocked, rather than mistaking a gate for a missing workflow. A document-specific gate should not make the financial workflow look incomplete.

**How to apply:** Keep the full Invoice / Credit Note field set followed by Payment, Action, server-derived Forward to, read-only Entered By, Notes, and Forward together after the detail tabs and Notes/History section. Preserve the server-side verification, document-specific validation, and AML gates; the visible disabled state is guidance, not enforcement.