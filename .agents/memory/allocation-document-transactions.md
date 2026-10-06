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

System Invoice and AML Report must be available
to the allocated user even when they were not selected during registration.
This applies across Retail, Corporate, and SME allocations.

**Why:** The user initially requested four uploads, then explicitly removed
Policy Schedule and System Receipt from Allocation Files. Preserve existing
uploaded documents and keep these changes limited to Allocation Files. Forwarding
remains available to the assigned user. The legacy master classifies operational documents
as Corporate, which must not silently hide them from Retail allocations.

**How to apply:** Reuse the sole requirement master without changing global
registration applicability. Preserve invoice/handoff context after document
uploads so uploading evidence does not prevent the next-recipient handoff.

The Upload button must surface document-specific requirements before an upload is attempted. AML-risk documents require both a risk rate and a rating reason sourced from the approved reference endpoint; keep the control disabled with an explicit unavailable message until that source is connected.

**Why:** The legacy handler rejects incomplete invoice, credit-note, and AML uploads before persisting them. A visible preflight explains what is missing while the API remains the enforcement boundary.

**How to apply:** Keep the client preflight aligned with the API’s extension, size, invoice/credit-note, and AML metadata validation. Do not hard-code AML rating reasons.

The user-supplied risk reasons are an approved local lookup source; do not keep
the dropdown blocked on the unavailable legacy AAR Risk database. Risk metadata
is available on AML Report uploads as well as AML-risk documents.

**Why:** The user supplied the reason list and requested table-backed reasons
and Low, High, Medium rates. They did not request making risk metadata mandatory
for every AML Report.

**How to apply:** Fetch active reasons from the lookup table, not a hard-coded
frontend list. AML Report risk metadata remains optional; when provided, require
a valid rate/reason pair. Dedicated AML-risk documents retain their mandatory
metadata validation.