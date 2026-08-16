# Target Architecture Overview

**Document ID:** ARCH-TGT-001  
**Project:** MIS Modernization  
**Phase:** Architecture Design  
**Date:** 2026-08-16  
**Status:** DRAFT — pending technical review  
**Basis:** Legacy architecture analysis (ARCH-CURR-001), business rules (BR-AUTH, BR-AUTHZ), module specifications (MOD-01, MOD-02)  

---

## 1. Architecture Decision

The new MIS system will be built as a **modular monolith** with a **React Single-Page Application (SPA) frontend** consuming a **RESTful JSON API** backend. This approach:

- Preserves all business rules from the legacy application
- Eliminates the tight coupling and untestability of the Web Forms design
- Allows future decomposition into microservices if required
- Supports the existing Replit monorepo structure
- Is immediately deployable via the existing `artifacts/api-server` and `artifacts/mis-v1` artifacts

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                           │
│                                                                     │
│   React SPA (artifacts/mis-v1)                                      │
│   ├── TanStack Router — client-side routing                         │
│   ├── TanStack Query — server state management                      │
│   ├── Zustand — UI state                                            │
│   ├── shadcn/ui — component library                                 │
│   └── Recharts — data visualisation                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / REST JSON
                               │ JWT Bearer token (HTTP-only cookie)
┌──────────────────────────────▼──────────────────────────────────────┐
│                     API Server (artifacts/api-server)               │
│                                                                     │
│   Express.js + TypeScript                                           │
│   ├── /api/auth/*          — Authentication module                  │
│   ├── /api/users/*         — User Administration module             │
│   ├── /api/profiles/*      — Profile & Permissions module           │
│   ├── /api/business/*      — Business Tracking module               │
│   ├── /api/renewals/*      — Renewals module                        │
│   ├── /api/claims/*        — Claims module                          │
│   ├── /api/reports/*       — Reports module                         │
│   ├── /api/messages/*      — Internal Messaging module              │
│   ├── /api/coverage/*      — Coverage Management module             │
│   ├── /api/audit/*         — Audit Trail module                     │
│   └── /api/system/*        — System Configuration module            │
│                                                                     │
│   Middleware (applied globally):                                    │
│   ├── JWT authentication verification                               │
│   ├── Profile-based authorization (menuaccess enforcement)          │
│   ├── Request logging                                               │
│   └── Error handling                                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
           ┌───────────────────┼──────────────────────┐
           │                   │                      │
┌──────────▼──────┐  ┌────────▼──────┐  ┌────────────▼───────┐
│  PostgreSQL      │  │  Redis        │  │  Object Storage     │
│  (Primary DB)    │  │  (Session /   │  │  (Documents /       │
│                  │  │   OTP / Cache)│  │   Uploads)          │
│  All business    │  │               │  │                     │
│  data migrated   │  │  OTP tokens   │  │  Replaces D:\       │
│  from SQL Server │  │  Rate limits  │  │  MANAGEMENT DOCS\   │
│  (CRM + SALES    │  │  Cache layer  │  │                     │
│   + MISREPORTS)  │  │               │  │                     │
└──────────────────┘  └───────────────┘  └────────────────────┘
                               │
           ┌───────────────────┴──────────────────────┐
           │                                          │
┌──────────▼──────┐                       ┌──────────▼──────┐
│  Email Service  │                       │  SMS API        │
│  (Office 365    │                       │  (Africa's      │
│   SMTP)         │                       │   Talking or    │
│                 │                       │   Twilio)       │
│  OTP delivery   │                       │                 │
│  Notifications  │                       │  Replaces       │
│  Credentials    │                       │  serial modem   │
└─────────────────┘                       └─────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend (artifacts/mis-v1)

| Layer | Technology | Replaces | Rationale |
|---|---|---|---|
| Framework | React 18 + TypeScript | ASP.NET Web Forms | Component model, type safety |
| Routing | TanStack Router | Server-side routing | SPA navigation, auth guards |
| Server state | TanStack Query | N/A | Caching, loading states, mutations |
| UI state | Zustand | Session variables | Lightweight, typed state |
| Components | shadcn/ui + Tailwind CSS | Telerik RadControls 2011 | Modern, accessible |
| Data grids | TanStack Table | Telerik RadGrid | Flexible, headless |
| Charts | Recharts | Telerik RadChart / Chart.js | React-native charts |
| Forms | React Hook Form + Zod | Web Forms postbacks | Validation + types |
| Date handling | date-fns | VB.NET date functions | Lightweight |
| Icons | Lucide React | N/A | Consistent iconography |
| HTTP client | axios | Web Forms postback | Interceptors, auth headers |

### 3.2 Backend (artifacts/api-server)

| Layer | Technology | Replaces | Rationale |
|---|---|---|---|
| Runtime | Node.js 20+ / TypeScript | IIS / .NET 4.0 | Monorepo alignment |
| Framework | Express.js | ASP.NET Web Forms | Existing artifact |
| ORM / Query | Drizzle ORM + node-postgres | ADO.NET + inline SQL | Type-safe queries |
| Auth tokens | JWT (jose library) | ASP.NET Session | Stateless, scalable |
| Password hashing | bcrypt | Rijndael decrypt-compare | Industry standard |
| OTP generation | crypto.randomInt() | System.Random | CSPRNG |
| Session/cache | ioredis | In-process ASP.NET session | Distributed, scalable |
| Email | nodemailer | VB.NET SMTP | Existing pattern |
| SMS | Africa's Talking SDK or twilio | Serial port COM modem | Cloud-compatible |
| File uploads | multer + Object Storage | RadUpload | Portable |
| Excel export | exceljs | Office Interop | No Windows dependency |
| PDF reports | pdfkit or playwright | Crystal Reports | No Windows dependency |
| Validation | Zod | VB.NET if/then | Shared with frontend |
| Logging | pino | log4net / txt logs | Structured JSON |

### 3.3 Infrastructure

| Component | Technology | Replaces |
|---|---|---|
| Primary database | PostgreSQL (Replit managed) | SQL Server CRM |
| Supporting database | PostgreSQL schemas | SQL Server SALES, MISREPORTS |
| Cache / session store | Redis | In-process session |
| Object storage | Replit Object Storage | D:\MANAGEMENT DOCS\ |
| Email | smtp.office365.com:587 | Same — no change |
| SMS | Africa's Talking or Twilio API | Serial port COM modem |
| Deployment | Replit Deployments | IIS Windows Server |
| Monitoring | pino JSON logs + Replit log viewer | Error_Logs.txt |

---

## 4. Module Decomposition

The new system is decomposed into modules matching the legacy page structure. All modules share the same API server process (modular monolith) but are organized into distinct service files.

| Module | Wave | Pages (Legacy) | Status |
|---|---|---|---|
| MOD-01 Authentication | 1 | Login, OTP, ChangePass, logout | Specified |
| MOD-02 User Administration | 1 | UserDetails, ApproveUser, Profiles, Audit | Specified |
| MOD-03 Business Tracking | 2 | Business_Tracking, Business_New, ~35 pages | PENDING |
| MOD-04 Risk Register | 2 | 11 related pages | PENDING |
| MOD-05 Claims Management | 2 | Claims-related pages | PENDING |
| MOD-06 Renewals | 2 | Renewal_Tracking + related | PENDING |
| MOD-07 Coverage Management | 2 | Coverage pages | PENDING |
| MOD-08 Reports | 3 | Reports.aspx + 184 Crystal Reports | BLOCKED (Crystal Reports) |
| MOD-09 Internal Messaging | 2 | Message-related pages | PENDING |
| MOD-10 Off-System Tracking | 2 | Off_system_Tracking pages | PENDING |
| MOD-11 Complaints Register | 2 | Complaints pages | PENDING |
| MOD-12 System Configuration | 1 | Password_Config, License (admin) | Specified (in MOD-01) |

---

## 5. Security Architecture (New System)

| Area | Legacy | New | Improvement |
|---|---|---|---|
| Authentication | Custom session | JWT Bearer + refresh tokens | Standards-based |
| Password storage | Rijndael AES (reversible) | bcrypt (cost 12) | Irreversible hash |
| OTP generation | System.Random (not CSPRNG) | crypto.randomInt() | Cryptographically secure |
| Session tokens | In-memory ASP.NET session | Redis + signed JWT | Distributed, revocable |
| Authorization | DB check per request | Middleware + claim verification | Enforced at transport |
| Input validation | Rudimentary string check | Zod schema validation | Comprehensive |
| Password in email | Plaintext password emailed | One-time activation link | No credential exposure |
| Default password | "password" literal | Cryptographically random link | No guessable default |
| CSRF | ViewState partial | SameSite=Strict cookies | Explicit protection |
| Error messages | Inline try/catch silent | Structured error responses | Observability |
| Audit trail | AdminAuditTrail table | Preserved + expanded | No regression |
| TLS | IIS-managed | Replit deployment (auto) | Same security level |
| Rate limiting | Session counter only | Redis-backed rate limiter | Per-IP + per-user |

---

## 6. Data Architecture

### 6.1 Database Strategy

The legacy application spans four SQL Server databases. The new system consolidates into **one PostgreSQL instance with multiple schemas**, mirroring the database separation logically:

```
PostgreSQL (mis_db)
├── schema: core          (Users, Profiles, MenuAccess, AuditTrail, Config)
├── schema: business      (Business Tracking, Claims, Renewals, Coverage)
├── schema: reports       (Report definitions, cached report data)
├── schema: sales         (Production months, sales data — migrated from SALES DB)
├── schema: messaging     (Internal messages, tracking, complaints)
└── schema: documents     (Document metadata — files in Object Storage)
```

### 6.2 Migration Strategy

| Legacy Database | Legacy Tables | Migration Target | Complexity |
|---|---|---|---|
| CRM (primary) | All user, business, config tables | PostgreSQL core + business schemas | HIGH — SP bodies needed |
| SALES | TBL_MIS_PROD_MONTHS + others | PostgreSQL sales schema | MEDIUM |
| MISREPORTS | Report support tables | PostgreSQL reports schema | MEDIUM |
| DATA_REPOSITORY_DB_CLAPI | CLAPI integration data | PostgreSQL or keep external | HIGH — requires business input |

**Prerequisite for migration:** Database access must be restored to enumerate all tables, views, foreign keys, and stored procedure bodies before any migration can be executed.

### 6.3 Password Migration

At migration execution:
1. Connect to legacy SQL Server CRM database
2. For each user in Employees table:
   - Decrypt stored password using Rijndael AES with the legacy key
   - Hash the plaintext password using bcrypt (cost 12)
   - Store in new PostgreSQL users table
3. All migrated users retain their existing passwords with no disruption
4. Legacy Rijndael key is destroyed after verified migration

---

## 7. Authorization Architecture

The new authorization system preserves the `menuaccess` model exactly, exposing it through API middleware:

```
Request
   │
   ▼
JWT Verification Middleware
   │ Extract: userId, profileId, email, permissions
   ▼
Route Handler
   │
   ▼
Permission Check Middleware (per route)
   │ Check: profile has CanAccess for this endpoint
   │ Check: profile has required action (CanAdd/CanEdit/CanDelete/ReadOnly)
   ▼
Business Logic
```

**Permissions in JWT claims:**
```json
{
  "sub": "42",
  "username": "jdoe",
  "profileId": 3,
  "profileName": "Operations Manager",
  "email": "jdoe@aar.co.ke",
  "productionDateFrom": "2026-08-01",
  "productionDateTo": "2026-08-31",
  "iat": ...,
  "exp": ...
}
```

**Permissions NOT stored in JWT** — they are checked server-side against the `menuaccess` table on each request. This allows real-time permission changes to take effect immediately without requiring re-login.

---

## 8. Reporting Architecture

The 184 Crystal Reports are the most complex migration challenge. Three options:

| Option | Description | Risk | Effort |
|---|---|---|---|
| A — Native React + API | Re-implement each report as a React page with API data | LOW | HIGH — all 184 reports |
| B — Server-side PDF | Playwright/puppeteer renders HTML reports to PDF | MEDIUM | MEDIUM |
| C — Parallel operation | Keep Crystal Reports on a legacy IIS instance during transition | HIGH | LOW (short-term) |

**Recommendation:** Option C for Wave 1 (legacy reports remain available), with Option A/B progressively replacing them in Waves 2-3. The 184 reports cannot be migrated without: (a) Crystal Reports software to read `.rpt` files, and (b) database access to understand all SQL in reports.

**BLOCKED:** Crystal Reports content extraction is not possible without Crystal Reports software installed on Windows.

---

## 9. External Integration Architecture

| Integration | Legacy | New | Action |
|---|---|---|---|
| Email | Office365 SMTP direct | nodemailer → Office365 SMTP | Preserve |
| SMS | RS-232 serial modem | Africa's Talking or Twilio API | REPLACE — cloud-compatible |
| ACCPAC/Sage 300 | Crystal Report reconciliation only | API integration (TBD) | INVESTIGATE |
| CarePay | Cross-DB SQL queries | API or dedicated service | INVESTIGATE |
| CLAPI | Cross-DB SQL queries | API or dedicated service | INVESTIGATE |
| eOxegen | Internal branding + Crystal Reports | N/A (internal product name) | CLARIFY |
| Excel files | Office Interop COM | exceljs library | REPLACE |

---

## 10. Non-Functional Architecture

### 10.1 Performance

| Target | Specification | Approach |
|---|---|---|
| Page load | < 3 seconds | React code splitting, lazy loading |
| API response | < 500ms (95th percentile) | Redis caching, indexed queries |
| Concurrent users | ≥ 100 (confirm peak with business) | Horizontal scaling if needed |
| Report generation | < 30 seconds | Background job + polling |

### 10.2 Availability

| Target | Specification | Approach |
|---|---|---|
| Uptime | ≥ 99.5% (business hours) | Replit deployment + health checks |
| Deployment downtime | < 5 minutes | Rolling deployment |
| Recovery time | < 30 minutes | Automated restart + alerts |

### 10.3 Observability

| Concern | Approach | Replaces |
|---|---|---|
| Application logs | pino JSON structured logging | Error_Logs.txt |
| Access logs | Express morgan middleware | IIS access logs |
| Error tracking | Structured error responses | Silent catch blocks |
| Performance | pino-http timing | None |
| Audit | AdminAuditTrail table (preserved) | Same |

---

## 11. Implementation Waves

### Wave 1 — Foundation (Months 1-3)
- MOD-01 Authentication (all business rules)
- MOD-02 User Administration (users, profiles, permissions, audit viewer)
- MOD-12 System Configuration (password policy, license management)
- Database: PostgreSQL setup, user/profile/audit schema
- Infrastructure: Redis, Object Storage baseline
- Frontend: SPA shell, login flow, navigation from profile permissions

### Wave 2 — Core Business (Months 4-6)
- MOD-03 Business Tracking (largest module — 35+ pages)
- MOD-04 Risk Register
- MOD-05 Claims Management
- MOD-06 Renewals
- MOD-07 Coverage Management
- MOD-09 Internal Messaging
- MOD-10 Off-System Tracking
- MOD-11 Complaints Register

### Wave 3 — Reports and Integrations (Months 7-9)
- MOD-08 Reports (replace Crystal Reports progressively)
- CarePay API integration
- CLAPI integration
- ACCPAC/Sage 300 integration assessment
- SMS API (Africa's Talking)
- Excel export (exceljs)

### Wave 4 — Migration and Cutover (Months 10-12)
- Data migration from SQL Server → PostgreSQL
- Password migration (decrypt → bcrypt)
- Document migration (file system → Object Storage)
- Parallel running period
- User acceptance testing
- Go-live and legacy decommission

---

## 12. Decision Log

| Decision | Chosen Approach | Rationale | Date |
|---|---|---|---|
| Architecture pattern | Modular monolith | Right-sized for team; prevents premature decomposition | 2026-08-16 |
| Database | PostgreSQL (Replit managed) | Monorepo alignment; eliminates Windows SQL Server | 2026-08-16 |
| Frontend | React SPA | Modern; existing mis-v1 artifact scaffolded | 2026-08-16 |
| Backend | Express.js + TypeScript | Existing api-server artifact; monorepo alignment | 2026-08-16 |
| Auth tokens | JWT in HTTP-only cookies | Secure; stateless; no session affinity required | 2026-08-16 |
| Password hashing | bcrypt (cost 12) | Industry standard; Argon2 also acceptable | 2026-08-16 |
| Reports (interim) | Crystal Reports on legacy IIS | Cannot extract without Crystal software | 2026-08-16 |
| SMS provider | TBD (Africa's Talking or Twilio) | Must replace serial port modem | 2026-08-16 |

---

*Document produced by: AI Engineering Agent — Architecture Design Phase*  
*Status: DRAFT — pending technical and business review*
