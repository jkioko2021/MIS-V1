---
name: Risk Owner email boundaries
description: Safety decisions for department-register submission notifications
---

Cancel a queued submission notice when its original recipient is no longer the
authorized owner or its register is no longer awaiting review. Do not redirect
that same notice to a replacement owner.

**Why:** Retrying a different recipient/content under one provider idempotency
key is unsafe, and retaining old department access would disclose private data.
The replacement owner can access the register through their current assignment.

**How to apply:** Keep any future reassignment notice a separate event with a
new identity; never widen a submission notice to all departments an owner has.

Report provider acceptance separately from proven inbox delivery.

**Why:** A successful send request does not confirm inbox delivery; bounce
tracking requires a separate provider-event integration.

**How to apply:** Keep status language explicit and do not describe local mail
capture or unconfigured sending as external delivery.
