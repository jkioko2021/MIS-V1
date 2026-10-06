---
name: Business requirement compatibility
description: Rules for maintaining the consolidated Business Tracking requirement master.
---

The user wants `crm.business_req` to remain the sole requirement master, using the legacy requirement fields plus `code`, without duplicate document ID, document code, document name, business type, client, or active columns.

**Why:** The user explicitly requested removing those duplicate columns and refactoring the app to the retained legacy contract. Do not recreate them to restore an older data-loading design.

**How to apply:** Preserve legacy requirement IDs and existing document references. Keep `code` values unchanged unless explicitly requested, and use retained name, applicability, and active fields in settings and Business Tracking.