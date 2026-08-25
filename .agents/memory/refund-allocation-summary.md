---
name: Refund allocation summary
description: Source boundary for the read-only BPO summary of allocated premium-refund work.
---

# Refund allocation summary

The current PostgreSQL model has no migrated refund-ledger table or authoritative refund-amount field. The BPO allocation view reads real refund values and payee details directly from the legacy CRM refund ledger when that source is reachable. If the source is unavailable, it must show an explicit unavailable state instead of substituting values from PostgreSQL.

**Why:** The legacy refund ledger holds the dedicated refund amount and payee data. Presenting policy premium as a refund amount would be misleading, and exposing stale or fabricated payee data would be unsafe.

**How to apply:** Keep the legacy-ledger view read-only and ownership-scoped like the Allocation Files queue. Do not derive a refund amount from membership data; when the source fails, preserve the unavailable state. Refund processing controls remain separate unless explicitly added.