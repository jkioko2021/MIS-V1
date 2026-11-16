---
name: Relationship manager portfolios
description: Independent Corporate/Retail ownership, reference identity, retention-admin access and safe deactivation.
---

Relationship-manager references are distinct from MIS login accounts. Corporate
and Retail classifications resolve independently; identical literal codes do
not imply permission to use a reference across both categories.

**Why:** The supplied roster specifies category and reporting year. Some agent
Retail fields contain codes supplied only as Corporate. Inferring a second
classification or creating login accounts would invent business information.

**How to apply:** Preserve leading zeros. Resolve the latest applicable
reporting-year entry without substituting future or inactive references. Leave
unmatched categories explicit until an authorized operator corrects them.

Retention Admin manages the portfolios, with system administrators retaining
access. Do not grant unrelated intermediary administration merely to make this
menu visible.

**Why:** The user specifically assigned this responsibility to Retention Admin.
It is not a request to broaden access to sales onboarding or user imports.

**How to apply:** Enforce the role on the server and navigation, and preserve the
existing permissions of other intermediary pages.

The default deactivation policy requires transferring a current manager's
assigned agents first. Corporate changes must not alter Retail ownership, or
vice versa; original extracts remain provenance, not mutable current ownership.

**Why:** A manager must not be deactivated in a way that leaves the portfolio
without a responsible active manager. Original extracts are needed to explain
how current assignments differ from the source.

**How to apply:** Preview the exact affected agents, confirm with a reason,
reject stale versions, and commit assignment changes and audit records
atomically. Keep source extracts unchanged and retain before/after ownership.
