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