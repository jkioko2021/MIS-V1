---
name: Allocation AML gate
description: Legacy AML requirement for allocated Cashier handoffs.
---

New and renewal allocation files must have an active uploaded document whose requirement name is `AML Report` before they can be handed to Cashier. The rule is enforced in the same transaction as the handoff; it is not a queue-visibility condition.

**Why:** The legacy allocation workflow requires AML evidence before Cashier receives new or renewal business. Enforcing it only in the client or as a general document-completion flag would allow a concurrent or alternate client to bypass it.

**How to apply:** Keep the allowed allocation outcomes limited to Cashier, Medical UW, and Return Incomplete. Check the AML upload only for the Cashier outcome on New/Renewal files, and expose the result through the owner-scoped allocation detail experience so assignees know what to resolve.