---
name: Allocation handoff actions
description: Legacy action-code contract and validation rules for allocated membership files.
---

# Allocation handoff actions

Allocated membership files are visible to their assigned administrator whenever they are active and have `ALLOCATED` status. The Action selector uses the legacy values exactly: Cashier (`C`), Medical UW (`MU`), Closed (`CL`), IT Support (`IT`), Return-Incomplete (`RI`), and RM (`RM`). Each successful action releases the allocation and writes its status, note, and audit trail atomically.

**Why:** The legacy Allocation Files screen exposes this complete action set, and its validation is action-specific. Restoring it preserves operator-facing action codes while retaining the modern server-side authorization and atomic handoff rules.

**How to apply:** Keep assignment ownership, benefit verification, and required handover notes in the server-side transaction. Require invoice numbers for Cashier and RM; require payment status for Cashier, Closed, and RM; retain the AML gate only for Cashier New/Renewal handoffs. Use `C` as the public Cashier value while accepting the earlier `CA` input as a compatibility alias.