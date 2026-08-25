---
name: Allocation handoff actions
description: Safe modernization boundary for actions taken from an allocated membership file.
---

# Allocation handoff actions

Allocated membership files can be handed to Cashier, Medical UW, or returned for correction only after benefit verification is complete. Cashier requires an invoice identifier and payment status. Each successful action releases the allocation and writes its status, note, and audit trail atomically.

**Why:** The legacy allocated-files screen mixed direct SQL, email dispatch, and destinations that have no accountable workflow in the modern system. Preserving only the destinations with current operational states avoids a file appearing handed off without a real destination.

**How to apply:** Keep benefit verification, assignment ownership, required handover notes, and Cashier invoice/payment validation in the transaction. Do not add Closed, IT Support, or RM actions until their queues, owners, and resolution states are defined.