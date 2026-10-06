---
name: Pricing Review business rules
description: Corporate allocation must pass Pricing before Allocation Files; preserves SME and original recipient accountability.
---

Only Corporate/SME business with rate type C (Custom) must be queued for Pricing Review once allocated. Pricing-team approval releases those files to Allocation Files. Rate type S (Standard) bypasses Pricing. Keep SME in the same flow, matching the legacy Corporate/SME queue. There is no New/Renewal-only restriction.

**Why:** After initially requesting all corporates, the user explicitly corrected the scope: “correction only rate type C to flow to pricing”. This is the final instruction, superseding both the all-rate scope and the immediately withdrawn rate-type-S instruction.

**How to apply:** Enforce the custom-rate gate for every allocation entry point, including BPO, direct assignments/general business edits and medical forwarding. Re-evaluate routing if an allocated file’s rate type changes. Preserve the intended recipient and saved notes when releasing Standard files incorrectly queued under the superseded rule. Pending custom-rate pricing is absent from Allocation Files; Retail retains its existing behavior.

Require an actual rates-matrix document for approval, not an unrelated upload. Keep the existing requirement master and append-only business-note history.

**Why:** The legacy page labels its upload as an approved rates matrix but mistakenly accepts any active document. Reproducing that defect would let a proposal or identification document authorize benefit approval.

**How to apply:** Use active matrix requirements already in the requirement master and preserve the original tracker and all saved notes when returning incomplete. Do not introduce a duplicate master or copy the business record into a new queue.

Preserve an eligible original recipient by default, but let Pricing explicitly select a replacement before approval when an assignment is missing or no longer eligible. Never silently assign such files to the reviewer or an arbitrary staff member.

**Why:** A real pending legacy file had no recipient despite being marked allocated. Blocking approval with an instruction to reallocate, without a repair control, left Pricing unable to complete the handoff.

**How to apply:** Keep recipient selection explicit and validate active approved accounts with Allocation Files access at approval time. Save reassignment together with the approval and append its history; leave Return Incomplete routed to the original tracker.
