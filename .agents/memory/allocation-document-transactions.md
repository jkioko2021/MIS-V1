---
name: Allocation document transactions
description: Boundary for preserving legacy allocation-document metadata in the modern workflow.
---

Document-specific transaction context belongs to the uploaded document record, while
the file-level invoice and payment state remains reserved for the Cashier handoff.

**Why:** The legacy allocation panel captured credit-note, invoice/policy, and AML
risk details as part of a document upload. Reusing the file-level handoff fields
would let an unrelated document overwrite the operational payment decision.

**How to apply:** When extending allocation uploads, add validated metadata to the
document transaction and preserve owner-scoped access. Do not add unsupported
workflow actions or invent values for unavailable external reference sources.

The Upload button must surface document-specific requirements before an upload is attempted. AML-risk documents require both a risk rate and a rating reason sourced from the approved reference endpoint; keep the control disabled with an explicit unavailable message until that source is connected.

**Why:** The legacy handler rejects incomplete invoice, credit-note, and AML uploads before persisting them. A visible preflight explains what is missing while the API remains the enforcement boundary.

**How to apply:** Keep the client preflight aligned with the API’s extension, size, invoice/credit-note, and AML metadata validation. Do not hard-code AML rating reasons.