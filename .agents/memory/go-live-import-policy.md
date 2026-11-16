---
name: Go-live import policy
description: Safety boundaries for previewed, additive go-live data extracts.
---

Go-live Data Management defaults to previewed, additive imports: preserve
existing identities, assignments and history. Loading a staff extract does not
authorize approval, activation or a shared login password.

**Why:** The user requested a reusable go-live loading menu. The earlier request
to clear and replace a specific agent list was a one-off maintenance decision,
not permission for the new reusable importer to delete data or grant access.

**How to apply:** Revalidate before committing, require explicit confirmation,
keep imports and audit writes atomic, and leave new accounts inactive until the
normal account setup process is completed. A future correction/replace workflow
requires its own explicit scope and safeguards.

