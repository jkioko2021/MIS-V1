---
name: Local MIS development
description: Safety boundaries and supported scope for running MIS outside Replit
---

Local development targets Windows through Ubuntu WSL and Visual Studio Code, not
the legacy ASP.NET application. Keep local email capture and disk documents
explicitly opt-in, loopback-only, and prohibited on Replit or production. Never
disable OTP or business authorization for local convenience.

**Why:** The user requested a local setup without changing published behavior;
Replit email and storage sidecars are unavailable on a standalone machine.

**How to apply:** Any new local adapter must preserve the cloud default and keep
private messages/documents outside public paths and Git. Development email capture
is not external delivery. Database backups do not contain cloud document bytes.

Do not treat the historical migrations or partial Drizzle schema as a clean-database
bootstrap. Keep approved backup restoration and clean synthetic initialization as
separate workflows. Clean seeds must not contain real employees/business records,
production passwords or automatic account resets; initial test-admin creation
must be explicitly requested.

**Why:** Historical migrations assume an imported CRM schema. The user requested
a clean local alternative without real data, production passwords or automatic
password resets.

**How to apply:** Fail clearly when prerequisites are absent; never automatically
reset accounts or export business data to work around setup. Preserve required
role names and operational document labels in synthetic catalogs, since they
participate in authorization and validation, not just display.
