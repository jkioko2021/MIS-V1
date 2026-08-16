---
name: MIS Architecture Decisions
description: Approved architectural decisions for the new MIS system; consistency required across all implementation work
---

## Core Decisions (2026-08-16)

| Decision | Choice | Why |
|---|---|---|
| Architecture pattern | Modular monolith | Right-sized; prevents premature microservice decomposition |
| Frontend | React 18 + TypeScript (artifacts/mis-v1) | Existing scaffolded artifact |
| Backend | Express.js + TypeScript (artifacts/api-server) | Existing scaffolded artifact |
| Database | PostgreSQL (Replit managed) | Monorepo alignment; eliminates Windows SQL Server |
| DB multi-tenancy | Schema-per-source-database | Mirrors legacy separation; single PostgreSQL instance |
| Auth tokens | JWT in HTTP-only cookies | Secure; stateless |
| Password hashing | bcrypt (cost ≥ 12) | Industry standard; Argon2id also acceptable |
| OTP generation | crypto.randomInt() | CSPRNG — replaces legacy System.Random |
| Session/cache | Redis | Distributed; replaces ASP.NET in-process session |
| File storage | Replit Object Storage | Replaces D:\MANAGEMENT DOCS\ and Doc_Arc_DB BLOBs |
| Email | nodemailer → smtp.office365.com:587 | Same provider as legacy |
| SMS | Africa's Talking or Twilio API | Replaces serial port COM modem — cloud-compatible |
| Excel export | exceljs | Replaces Office Interop (requires Windows) |
| PDF/Reports | pdfkit or playwright (progressive) | Replaces Crystal Reports (requires Windows) |
| Reports (interim) | Crystal Reports on legacy IIS kept parallel | Cannot migrate without Crystal software |
| Logging | pino JSON | Structured; replaces Error_Logs.txt |
| Routing (frontend) | TanStack Router | Type-safe; SPA navigation |
| Server state | TanStack Query | Caching + mutations |

## Implementation Waves

- Wave 1: Auth + User Admin + System Config (Months 1-3)
- Wave 2: Business Tracking, Risk Register, Claims, Renewals, Coverage, Messaging (Months 4-6)
- Wave 3: Reports migration, External integrations (Months 7-9)
- Wave 4: Data migration, cutover (Months 10-12)

## Authorization Model (preserved from legacy)

Profile-based: user has one Profile → menuaccess table has page+action permissions per profile. Permissions checked server-side in middleware on every API request (NOT stored in JWT). This means permission changes take effect immediately without re-login.

## Password Migration Strategy

At migration: decrypt all legacy Rijndael-AES passwords → bcrypt hash → store in PostgreSQL. Legacy Rijndael key destroyed after verified migration. All migrated users keep existing passwords.

**How to apply:** Any implementation work must use these choices. Do not propose alternative libraries or patterns without noting the deviation from this document.
