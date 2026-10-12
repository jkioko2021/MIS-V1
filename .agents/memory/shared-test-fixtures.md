---
name: Shared test fixtures
description: Browser verification and rollback-only integration tests share the development database.
---

Synthetic fixtures must isolate unique constrained business values as well as
usernames and department codes. In particular, do not reuse fixed reporting
period dates across concurrent browser and rollback-only integration checks.

**Why:** Rollback isolation does not hide committed browser fixtures. Unique
business constraints can collide even when accounts and departments are unique.

**How to apply:** Give browser fixtures their own unused dates and clean them up.
When an existing integration test uses fixed dates, avoid overlapping its run
with browser fixtures that could claim those dates.
