---
name: Allocation handoff actions
description: Legacy action-code contract and validation rules for allocated membership files.
---

# Allocation handoff actions

Allocated membership files are visible to their assigned administrator whenever they are active and have `ALLOCATED` status. The Action selector uses legacy values: Cashier (`C`), Medical UW (`MU`), Closed (`CL`), IT Support (`IT`), Return-Incomplete (`RI`), and RM (`RM`); `CA` remains an input compatibility alias for Cashier. Cashier and RM require invoice and payment details, while team-owned destinations require an active recipient from the destination team. Each successful action creates or updates its accountable work item, releases the allocation, and writes its status, note, and audit trail atomically.

**Why:** The legacy Allocation Files screen exposes this complete action set, while the modern system needs explicit queues, owners, and final statuses to make every handoff traceable.

**How to apply:** Keep assignment ownership, benefit verification, required handover notes, recipient validation, and Cashier/RM invoice/payment validation in the server-side transaction. Retain the AML gate only for Cashier New/Renewal handoffs and resolve superseded open work items before establishing the new queue owner.
