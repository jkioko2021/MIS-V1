---
name: Business requirement compatibility
description: Rules for maintaining the consolidated Business Tracking requirement master.
---

`crm.business_req` is the single source of truth for configurable Business Tracking requirements. It retains its established `req_*` fields for checklist and upload foreign keys and also stores the exact business requirement contract (`DOC_ID`, `DOC_CODE`, `DOC_NAME`, `BUSINESS_TYPE`, `CLIENT`, `ACTIVE`, and `CODE`).

**Why:** Keeping two mutable masters risks data drift and makes document configuration harder to reason about. The single table preserves existing foreign-key IDs while exposing the full requirement contract the settings page needs.

**How to apply:** Read and write the consolidated row atomically: keep its legacy `req_*` values aligned with the exact-value fields, allocate new IDs from the `business_req` sequence, and never repurpose existing requirement IDs that may be referenced by historical documents.