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
bootstrap. Use an approved complete backup or a separately designed sanitized
reference-data/account provisioning process.

**Why:** The migrations were built on an existing imported CRM schema, and local
setup must not claim an empty database will support the app.

**How to apply:** Fail clearly when prerequisite tables/reference data are absent;
never automatically reset accounts or export business data to work around setup.
