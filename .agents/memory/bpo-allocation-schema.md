---
name: BPO allocation schema
description: Schema prerequisite for completing BPO allocation review actions.
---

# BPO allocation schema

Before testing a BPO review allocation, verify the business-tracking schema includes the BPO allocation outcome fields introduced by the allocation-outcomes migration.

**Why:** A development database that lagged the migration accepted queue reads but failed the decision transaction at submit time, leaving the BPO sheet open even though the client flow was correct.

**How to apply:** When review-action behavior fails with a missing-column database error, compare the development schema against the BPO allocation-outcomes migration before debugging the UI or transaction logic.