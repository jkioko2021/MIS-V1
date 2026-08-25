---
name: Refund allocation summary
description: Source boundary for the read-only BPO summary of allocated premium-refund work.
---

# Refund allocation summary

The current PostgreSQL model has no migrated refund-ledger table or authoritative refund-amount field. The BPO allocation summary therefore identifies active allocated premium-refund work through the existing `PR` business classification and reports counts, allocated administrators, and the oldest allocation date only.

**Why:** The legacy refund ledger stored a dedicated refund amount, but that source has not been migrated or connected to the modern database. Presenting policy premium as a refund amount would be misleading.

**How to apply:** Keep the current summary read-only and ownership-scoped like the Allocation Files queue. Do not add refund values, payee data, or processing controls until the authoritative legacy refund ledger is available.