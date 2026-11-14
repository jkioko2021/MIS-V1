---
name: Sales manager enrollment
description: User-defined boundary between ordinary MIS accounts and sales-manager designations.
---

Sales managers are created as normal users, then enrolled on a separate page as
Unit, Branch, Regional or National Sales Managers. Enrollment is not a separate
person record or replacement login profile.

**Why:** The user clarified: "These will be created as Normal users but will have
a page to enroll them as Unit manage,Branch,or regional Managers."

**How to apply:** Reuse the existing user identity for manager mappings. Keep
sales-manager designations separate from authentication and access rights; do not
grant Administration access or change a user's base profile merely because they
are enrolled as a manager.

Uploaded sales catalog rows without verified MIS account mappings are **reference
records**, separate from operational enrollments. Retain repeated manager IDs
across assignments and the original source values; do not guess account matches
or create accounts to satisfy an import.

**Why:** When the supplied source data revealed repeated manager identifiers,
missing relationships and unlinked users, the user chose "Load as reference records."

**How to apply:** Show imported rows read-only with mapping warnings. Do not
offer imported managers as verified manager choices or use source approval flags
to grant access. Future manager reconciliation must deliberately verify each
assignment. Organizational lookup eligibility is a separate user-approved
exception, described in sales-catalog-presentation.md.

Keep the Sales Structure setup parent menu, but do not expose the separate
generic Structure setup and Manager enrollment submenu links.

**Why:** The user explicitly requested their removal as not needed after the
nine specific sales catalog pages were added.

**How to apply:** Use the specific catalog pages in navigation. This does not
authorize deleting historical hierarchy data or changing manager identity rules.
