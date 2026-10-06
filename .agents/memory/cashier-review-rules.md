---
name: Cashier Review routing decisions
description: Allocation invoice handoffs, receipting outcomes, and boundaries of legacy Finance parity.
---

Cashier Review belongs under Business Tracking and receives invoiced Allocation
Files Cashier handoffs on the original business record. Keep the selected Finance
recipient accountable and retain all saved notes.

**Why:** The user requested a similar Business_Tracking_Finance.aspx page with
invoiced Allocation Files Cashier business pushed to Cashier Review, under
Business Tracking rather than a standalone Cashier menu.

**How to apply:** Keep existing AML/benefit gates and assigned-recipient access.
Do not duplicate business records or weaken the original allocation owner checks.

Partial receipting and unpaid Credit Control outcomes must remain actionable
within Finance. Full nonmedical receipting enters Filing; incomplete returns
must never be overwritten with Filing.

**Why:** The legacy paid-only queue hides outstanding business, and its blanket
nonmedical Filing update can conflict with the selected return/payment outcome.
The stored procedure body is unavailable, so unseen legacy routing cannot be
assumed authoritative.

**How to apply:** Distinguish observed legacy handlers from modern queue
decisions. Require an actual System Receipt for the current handoff and an
explicit payment status. Related local-reference records are context, not proof
of reconciliation against the external accounting/portal source.

A System Receipt uploaded during the current allocation cycle counts when the
file subsequently reaches Cashier; it must not require duplicate uploading.
Receipts from earlier allocation cycles must not authorize new receipting.

**Why:** The user explicitly enabled System Receipt uploading in Allocation
Files before forwarding to the next recipient.

**How to apply:** Preserve the allocation-cycle document cutoff when transferring
to Cashier, rather than treating the later Cashier handoff timestamp as the
earliest eligible receipt time.
