---
name: GI workflow rules
description: User-directed nonmedical routing, legacy NONMEDICAL team compatibility and assigned-user ownership.
---

Nonmedical registrations go to GI-Allocate after the standard registration
Forward/document-completion step, not to the medical BPO review queues.
GI-Allocate can assign to an active GI employee or return to the original
register user with a notification. GI-Allocated is the assigned user's queue;
the assigned user can return to Register or forward to Cashier for receipting.

**Why:** The user explicitly requested separate GI-Allocate/GI-Allocated pages
under Business Tracking, then clarified those two assigned-user outcomes.

**How to apply:** Preserve the original file, documents and notes through all
handoffs. GI allocation does not go through the medical/pricing benefit-review
path. Keep invoice/AML checks for Cashier, owner checks for assigned files and
atomic return notifications. Queued email is not confirmed delivery.

Legacy NONMEDICAL department employees are GI team members without requiring
wholesale profile reassignment. Existing membership roles and already assigned
historic files must not be stranded when adding the new GI lane.

**Why:** The legacy GI staff picker is department-based; the modern app already
has personal membership allocations. The user requested a new GI workflow, not
changes to every employee's existing permissions or historical allocations.

**How to apply:** Validate current active employee/profile membership, preserve
existing membership-role access separately, and do not give GI-only staff broad
Register/BPO permissions merely to reach the shared allocated-file APIs.

An invoiced GI allocation stays actionable until explicit Cashier handoff.

**Why:** Reusing the legacy uninvoiced-only list with separate modern invoice
uploads would remove the file before its assigned user could forward it.

**How to apply:** Invoice upload is not a queue completion event; the handoff
transaction is. Keep original notes and history on the original record.
