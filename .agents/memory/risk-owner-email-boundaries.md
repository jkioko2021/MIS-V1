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

Treat missing email setup as advisory before register submission, not as a
workflow prerequisite; retain the active mapped owner prerequisite.

**Why:** The requested guidance must warn champions without preventing them from
committing their register for review when mail setup is incomplete.

**How to apply:** Keep email warnings separate from assessment and owner eligibility
gates. Readiness only asserts local setup presence, not verified provider sendability.

Do not treat a rejected Resend domain-list request as proof that the email connection cannot send.

**Why:** A send-only Resend key can return HTTP 401 for domain reads while remaining authorized to submit email. Sender-domain verification is a separate prerequisite.

**How to apply:** Inspect the provider's error category before proposing reconnection or a key change. When authorized to test sending, distinguish a restricted domain-read permission from an unverified sender rejection; never claim delivery from configuration presence alone.

Notify the assigned Risk Owner automatically when the department register is
submitted for review, with a clear request to review it.

**Why:** The user explicitly chose notification on submission rather than an
immediate reminder while the register was still unsubmitted.

**How to apply:** Identify the department, reporting period and submitter, explain
where to review in MIS, and state how to record Review or Return with comments.
Do not send a premature message claiming an unsubmitted register is available.
