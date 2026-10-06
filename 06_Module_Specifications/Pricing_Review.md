# Pricing Review

## Legacy analysis

Sources: `Legacy/CRM/Business_Tracking_Pricing.aspx` and its `.aspx.vb` code-behind.

The WebForms page is headed “Benefit Verification”. Its default queue contains active, forwarded, allocated Corporate/SME medical business with benefits not verified and no decline flag. The list shows file number, proposer, received date, premium, status, business/client type and allocated staff. Selecting a file loads archived documents and saved tracking notes, identifies the entrant and allocated recipient, and offers an approved-rates-matrix upload and review comments.

The decision handler requires a file, action, comments and an active upload. YES records benefit verification and changes the file to ALLOCATED; NO invokes the legacy membership-allocation procedure with RI. Both append a tracking note. Legacy email targets the allocated staff on approval and the entrant on rejection.

Observed defects and limits:
- The requirement-picker SQL has a malformed RET17/RET18 literal.
- Despite its rates-matrix warning, the decision handler accepts any active document.
- SQL is assembled by concatenation. The modern implementation uses parameters.
- The legacy RI stored-procedure body is unavailable; modern Return Incomplete uses the existing accountable Register Correction work item rather than claiming an exact procedure reproduction.

## Modern workflow

**User-directed scope:** rate type C (Custom) Corporate/SME allocations automatically undergo Pricing Review before reaching Allocation Files. Rate type S (Standard) bypasses Pricing. Additionally, Allocation Files offers a manual Pricing Review handoff for rate C business with Benefit Verified NO, including Retail. There is no New/Renewal or medical-business-only restriction.

Navigation: **Business Tracking → Pricing Review**, `/business/pricing`.

Benefit Verified defaults to YES for all Retail business regardless of rate type and all Standard rate S business. Corporate/SME custom-rate C business defaults to NO. Existing active Retail/Standard records receive this default without fabricating a Pricing approval or removing notes; existing pending Pricing files covered by the new default return to their saved allocation recipient. An explicitly entered NO remains available for an intentional review.

Access: active Pricing staff, SuperAdmin and System Admin. The Pricing profile is available for administrators to assign; no existing employee is automatically reassigned.

1. BPO allocation, direct allocation and Corporate/SME medical forwarding create or reopen a shared Pricing work item only for rate type C. Other rates proceed to Allocation Files without Pricing.
   In Allocation Files, Action selection is enabled before verification. An eligible rate C/unverified file can select Pricing Review and Forward without invoice/payment requirements. Other destinations remain blocked until verification. The manual handoff checks the assigned user, locks the file, retains its original allocation recipient, appends a note/audit entry, and opens the shared Pricing queue atomically.
2. The business remains allocated to its intended recipient but has status BENEFIT VERIFICATION, verification NO and a pricing handoff date. It is not visible or accessible through Allocation Files.
3. Pricing staff inspect business details, existing notes and documents and upload the rates matrix against the existing `crm.business_req` master.
4. **Approve benefits:** requires an active Rates and benefit Matrix/Approved rates matrix upload, comments and an active eligible allocation recipient. The Allocation Files recipient is automatically populated from the existing business assignment and cannot be changed in Pricing. Missing/ineligible assignments must be corrected through BPO allocation first. Approval saves the reviewer/time and comments atomically and releases ALLOCATED business to the existing assigned BPO Admin; no previous notes are removed.
5. **Return incomplete:** requires comments, clears allocation and opens REGISTER_CORRECTION assigned to the original tracker. The file returns to that tracker’s Register Queue.

Only active files awaiting an open Pricing work item can be mutated. Decisions lock the file/work item, compare the submitted update timestamp, and commit state, review history, notes, work-item changes and audit together. Repeated or stale approval returns a conflict without duplicate reviews.

Custom-rate corporate benefit verification cannot be set through the general business-edit API to bypass Pricing. A new recipient/allocation restarts Pricing; an unchanged recipient does not discard an existing approval merely because unrelated details are edited. Changing an allocated Corporate/SME file from S to C starts Pricing; changing from C to S releases allocation and cancels pending Pricing work. Retail retains its prior automatic allocation rules and can enter Pricing through the explicit rate C/unverified handoff.

The page supports queue search/pagination, periodic queue refresh, history and protected downloads. Uploads are limited to 10 MB and validated against both the active matrix requirement and stored object size. Saved notes have no delete operation; corrections append new notes.

Pending Custom Corporate/SME allocations are in Pricing. Non-C files incorrectly queued under the earlier all-rate instruction are released to their original allocation recipient without deleting notes or fabricating a Pricing decision. Previously approved legacy allocations are preserved. Production schema changes follow the normal Publish schema review.

No email transport was connected for this request. The page does not claim an email was sent.

## Verification

Development-only integration fixtures exercise Custom Corporate/SME routing, Standard bypass, Retail isolation, real object upload/download, matrix and notes gates, optimistic concurrency, recipient ownership, missing-recipient repair, rejection of inactive/unapproved/locked/deleted and unauthorized recipients, Return Incomplete visibility and medical/direct/general-edit allocation entry points. BPO route regressions cover both Corporate/SME rates and all tested business types.
