---
name: Refund allocation summary
description: Source boundary for the read-only BPO summary of allocated premium-refund work.
---

# Refund allocation summary

The Allocation Files summary uses the legacy CRM refund ledger as its authoritative read-only source. It applies the legacy work-state filters (requested, allocated, unprocessed, active), scopes regular BPO users by the ledger allocation owner, and gives SuperAdmin an all-owner oversight view. The source is currently unreachable from Replit because the CRM RDS security group blocks the required outbound address.

**Why:** Policy premium is not a refund amount. Direct ledger values preserve the financial meaning of the work, while committed reads avoid exposing an in-progress financial update. Returning an explicit unavailable state is safer than showing a stale or substituted amount.

**How to apply:** Keep the refund panel read-only and separate from refund-processing controls. Do not fall back to policy premium. When CRM connectivity is restored, retain owner scoping and the unavailable state for future source outages.