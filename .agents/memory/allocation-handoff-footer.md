---
name: Allocation handoff footer
description: Visibility and gating rule for the allocation transaction controls.
---

The allocation footer must always show the document transaction and workflow controls in their final-page position. The Invoice / Credit Note field set stays visible even when the selected checklist document does not use every field; non-applicable AML and payment controls explain their conditional state and remain disabled. Action selection remains available before benefit verification. Forward stays blocked for unverified benefits except the Pricing Review action for rate C business with Benefit Verified NO; notes remain available.

**Why:** Operators need to see required controls and why forwarding is blocked, rather than mistaking a gate for missing actions. The user explicitly allowed Action selection before verification and specified the rate C/unverified Pricing exception.

**How to apply:** Keep the full Invoice / Credit Note field set followed by Payment, Action, server-derived Forward to, read-only Entered By, Notes, and Forward together after the detail tabs and Notes/History section. Preserve the server-side verification, document-specific validation, and AML gates; the visible disabled state is guidance, not enforcement.