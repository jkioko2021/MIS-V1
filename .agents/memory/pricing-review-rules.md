---
name: Pricing Review business rules
description: Corporate allocation must pass Pricing before Allocation Files; preserves SME and original recipient accountability.
---

Only Corporate/SME business with rate type C (Custom) must be queued for Pricing Review once allocated. Pricing-team approval releases those files to Allocation Files. Rate type S (Standard) bypasses Pricing. Keep SME in the same flow, matching the legacy Corporate/SME queue. There is no New/Renewal-only restriction.

**Why:** After initially requesting all corporates, the user explicitly corrected the scope: “correction only rate type C to flow to pricing”. This is the final instruction, superseding both the all-rate scope and the immediately withdrawn rate-type-S instruction.

**How to apply:** Enforce the automatic Corporate/SME custom-rate gate for BPO, direct assignments/general business edits and medical forwarding. Re-evaluate routing if an allocated file’s rate type changes. Preserve the intended recipient and saved notes when releasing Standard files incorrectly queued under the superseded rule. Pending custom-rate pricing is absent from Allocation Files. Retail is not automatically queued, but supports the explicit manual handoff below.

Benefit Verified defaults to YES for all Retail business (including custom rates) and all Standard rate S business. Corporate/SME custom-rate business defaults to NO pending Pricing.

**Why:** The user requested all Retail defaults YES, then Standard rates YES, and explicitly confirmed Retail custom-rate C should also default YES.

**How to apply:** Keep the same default in registration, forms, allocation and database inserts. Do not fabricate a staff approval or remove saved notes. Explicitly marked NO remains a deliberate review state, not the default.

An allocated user may send rate C business explicitly marked Benefit Verified NO to Pricing Review from Allocation Files, including Retail. Other unverified handoffs remain blocked.

**Why:** The user specified: “if rate Type is C and benefit verified is No,then the user should be able to forward the business to Pricing for review”.

**How to apply:** Preserve the original allocation recipient while Pricing is pending, remove the file from the actionable Allocation Files queue, and return it to that recipient only after normal Pricing approval. Keep notes, matrix validation, ownership checks and transactional handoff safeguards.

Require an actual rates-matrix document for approval, not an unrelated upload. Keep the existing requirement master and append-only business-note history.

**Why:** The legacy page labels its upload as an approved rates matrix but mistakenly accepts any active document. Reproducing that defect would let a proposal or identification document authorize benefit approval.

**How to apply:** Use active matrix requirements already in the requirement master and preserve the original tracker and all saved notes when returning incomplete. Do not introduce a duplicate master or copy the business record into a new queue.

Pricing must automatically populate the Allocation Files recipient with the BPO Admin already allocated to the business. Do not offer a general staff picker or reassign the business during Pricing approval.

**Why:** The user specified: “allocation files recipient on pricing should populate the Bpo admin who has been allocated the business”. This replaces the earlier recipient-repair picker.

**How to apply:** Display the saved assignment automatically and preserve it at approval. Missing or ineligible recipients require correction through BPO allocation, not arbitrary replacement in Pricing. Validate eligibility when approving and keep Return Incomplete routed to the original tracker.
