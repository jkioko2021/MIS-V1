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

Notify the assigned Risk Owner automatically when the department register is
submitted for review, with a clear request to review it.

**Why:** The user explicitly chose notification on submission rather than an
immediate reminder while the register was still unsubmitted.

**How to apply:** Identify the department, reporting period and submitter, explain
where to review in MIS, and state how to record Review or Return with comments.
Do not send a premature message claiming an unsubmitted register is available.

Do not treat refusal to list Resend domains as proof that sending is unavailable.

**Why:** This project's connected Resend credential returned “restricted to only
send emails” on domain inspection. That is a permission boundary for the read
operation, not evidence that the configured sending connection is broken.

**How to apply:** Request a verified sender address through the environment
settings flow when needed; do not replace or reconnect the sending integration
merely to inspect domains. Confirm actual sends separately.
