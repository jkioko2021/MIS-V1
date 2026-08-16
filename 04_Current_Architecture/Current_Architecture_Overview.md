# Current Architecture Overview

**Document ID:** ARCH-CURR-001  
**Project:** MIS Modernization  
**Phase:** Discovery — Architecture Analysis  
**Date:** 2026-08-16  
**Source:** Direct inspection of /Legacy/CRM source code  
**Status:** CONFIRMED unless noted  

---

## 1. Architecture Summary

The legacy MIS (MARVEL) is a **monolithic ASP.NET Web Forms application** with no separation of concerns. Business logic, data access, presentation, and infrastructure are tightly coupled throughout. The architecture can be characterized as:

```
Browser
   │ HTTP/HTTPS
   ▼
IIS (Windows Server)
   │
   ▼
ASP.NET Web Forms (.NET 4.0, VB.NET)
   │
   ├── MasterPage.master.vb    (auth guard, nav, session management)
   ├── [76 .aspx pages]        (presentation + business logic mixed)
   ├── App_Code/               (shared utilities — also mixed concerns)
   │   ├── DocManage.vb        (6,362 lines — DAL + business + email + docs)
   │   ├── Mail.vb             (email sending)
   │   ├── SMSCOMMS.vb         (serial port SMS)
   │   ├── MyEncryptDecrypt.vb (Rijndael AES)
   │   ├── TwoFactorAuthentication.vb
   │   ├── CPasswordStrength.vb
   │   └── RandomKeyGenerator.vb
   │
   ▼
SQL Server (CRM Database — primary)
   │
   ├── [57+ stored procedures]  (business logic + data)
   ├── Tables, Views, Functions  (schema unknown without DB access)
   │
   └── Cross-DB queries to:
       ├── SALES.[dbo].TBL_MIS_PROD_MONTHS
       ├── MISREPORTS (192.168.50.48)
       └── DATA_REPOSITORY_DB_CLAPI
```

---

## 2. Presentation Layer

### 2.1 Page Structure

| Component | Count | Technology | Notes |
|---|---|---|---|
| ASPX pages | 76 | ASP.NET Web Forms | Each page = one business function view |
| Master page | 1 | MasterPage.master | Auth guard, navigation, session |
| User controls | 1 | Accounts.ascx | Accounts display |
| Crystal Reports viewer | 2 pages | Reports.aspx, Reports_Page.aspx | 184 .rpt files |

### 2.2 UI Component Library

| Component | Library | Version | Usage |
|---|---|---|---|
| Navigation menu | Telerik RadMenu | 2011.1.413.40 | Profile-driven navigation |
| File upload | Telerik RadUpload | 2011.1.413.40 | Document management |
| Charts | Telerik RadChart | 2011.1.413.40 | Business dashboards |
| Combo boxes | Telerik RadComboBox | 2011.1.413.40 | Form inputs |
| Grids | Telerik RadGrid | 2011.1.413.40 | Data grids |
| Reports | Crystal Reports | 13.0.2000.0 | 184 business reports |
| HTML editor | Winthusiasm.HtmlEditor | Unknown | Text editing |
| AJAX | AjaxControlToolkit | Unknown | Async postbacks |
| Charts | System.Web.DataVisualization | 4.0 | Built-in .NET charts |
| Charts | Chart.js | Bundled | JavaScript charts |

### 2.3 Client-Side Technology

| Technology | File | Status |
|---|---|---|
| jQuery | jquery-1.4.1.js | LEGACY — 2010, security vulnerabilities |
| jQuery | jquery-3.7.1.js | CURRENT — dual-version conflict |
| Chart.js | Chart.bundle.js | Charting |
| Custom JS | CN.js, James_toolkit.js | Unknown purpose |
| CSS | GlobalStyles.css, Sales.css | Application styling |
| Tooltips | wz_tooltip.js | Legacy tooltip library |

---

## 3. Application Logic Layer

The legacy application has **no formal application/domain/service layer**. Business logic exists in four locations simultaneously:

### 3.1 Code-Behind Files (Primary Logic Location)

Each `.aspx.vb` file contains:
- Form event handlers (Button_Click, Page_Load, etc.)
- Inline business logic
- Inline SQL string construction
- Direct database calls
- Session management
- Email sending calls

**Pattern (repeated ~76 times):**
```
Page_Load
   ├── Auth check → MasterPage handles
   ├── Load reference data (dropdowns, grids)
   └── Audit trail write

Button_Click
   ├── Validation (basic)
   ├── Build SQL string
   ├── Call DataManagement.DBAction()
   ├── Write audit trail
   └── Send email if needed
```

### 3.2 DocManage.vb — God Class

The `DocManage.vb` file (6,362 lines) contains three conceptually distinct namespaces compressed into one file:

| Namespace | Classes | Responsibility |
|---|---|---|
| `DocManage` | `DataManagement` | All data access (57+ SP calls, CRUD operations) |
| `DocManage` | `Emailing` | Email sending via SMTP |
| `DocManagementSecurity` | `CryptoFactory`, `ICrypto`, `SysSettsEncryption`, `DocManagementSecurity` | Cryptography, password management |

**DataManagement class key operations:**
- `DBAction(sql, type)` — universal DB operation dispatcher (DataTable, DataReader, Scalar, Insert, Update, Delete)
- `AddAdminAuditTrail(user, action, desc, url, ip, session)` — audit trail
- `AddEmployees(...)` — create user (calls `Add_Employee` SP)
- `UpdateEmployees(...)` — update user (calls `UpDate_Employee` SP)
- `CANADD(profileID, page)`, `CANEDIT(...)`, `CANDELETE(...)`, `CANREADONLY(...)` — authorization checks
- `DoLogs(message)` — write to `ErrorLogs/Error_Logs.txt`
- `GetSqlDate(date)` — date formatting helper
- 57+ stored procedure call wrappers

### 3.3 Stored Procedures (Business Logic in Database)

57+ stored procedures in the CRM database contain significant business logic. Their internal logic is unknown without database access. Key categories identified by name:

| Category | Procedures | Business Domain |
|---|---|---|
| Authentication | `AdminLogin` | User credential lookup |
| User management | `Add_Employee`, `UpDate_Employee`, `Add_Profile`, `UpDate_Profile`, `Deactivate_Signatory` | User lifecycle |
| Audit | `Add_AdminAuditTrail` | All system events |
| Business tracking | `sp_Business_Tracking_Action`, `sp_Business_MEDUW_Action`, `sp_Business_update_Action`, `sp_Business_Policy_Action`, `sp_Business_Cashier_Action`, `sp_Business_Mship_Action` | Core business operations |
| Claims | `sp_Claims_Process_Action`, `sp_Claims_Approval_Action` | Claims processing |
| Renewals | `SP_RENEWAL_TOTAL`, `SP_RENEWAL_TOTAL_REVISE`, `SP_UPATE_PROPOSER_RENEWAL_LIST`, `SP_REN_CLAIMS_UPDATE_C`, `SP_REN_CLAIMS_UPDATE_NCD` | Renewal processing |
| Messages/tracking | 10+ `SP_TRACKING_*`, `SP_MIS_CRM_*_MESSAGES` | Internal messaging |
| Coverage | `SP_MIS_CRM_COV_*`, `SP_MIS_CRM_HPC_*` | Coverage management |
| Registration | `SP_REGISTER_BUSINESS`, `SP_ENROLL_CORPORATE_BUSINESS` | Business registration |
| Off-system | `sp_MIS_CRM_Off_system_Tracking`, `SP_MIS_CRM_COMPLAINTS_REGISTER` | Off-system case tracking |
| System | `LoadParamz`, `ASP_ExecuteTable` | System parameters |

### 3.4 Crystal Reports (Business Logic in Reports)

184 Crystal Reports `.rpt` files contain:
- Report-specific SQL queries
- Calculated fields and formulas
- Business logic for data aggregation
- Cross-table joins and grouping rules
- Parameter filtering

**These are inaccessible without Crystal Reports software.**

---

## 4. Data Access Layer

### 4.1 Connection Strategy

| Database | Connection Method | Encryption | Issues |
|---|---|---|---|
| CRM (primary) | Encrypted connection string in web.config | Rijndael AES | Key hardcoded |
| MISREPORTS | Plaintext in web.config | None | SA account, IP-based |
| SALES | Cross-DB SQL: `SALES.[dbo].*` | None | No dedicated connection |
| DATA_REPOSITORY_DB_CLAPI | Cross-DB SQL | None | No dedicated connection |

### 4.2 Data Access Patterns

| Pattern | Usage | Risk |
|---|---|---|
| Stored procedure calls | ~57+ core operations | Business logic in DB |
| Inline SQL — parameterized | Some locations | Acceptable |
| Inline SQL — string concatenation | Multiple locations | SQL injection risk |
| Cross-database SQL | MasterPage + Business Tracking | Cannot split DBs without refactor |
| ADO.NET DataReader | Single-record operations | Manual close required |
| ADO.NET DataTable | Grid/list operations | Full result set in memory |
| ADO.NET Scalar | Single value lookups | Authorization checks |

---

## 5. Infrastructure Dependencies

### 5.1 Internal Services

| Service | Technology | Purpose | Risk |
|---|---|---|---|
| Email | smtp.office365.com:587 | Notifications, OTP, credentials | API dependency |
| SMS | Serial port COM modem | OTP (legacy path) | Hardware — cannot cloud-host |
| File system | D:\MANAGEMENT DOCS\ | Document storage | Windows path — not portable |
| File system | F:\mount_location | CSV mount | Windows path — not portable |
| Excel | Microsoft.Office.Interop | Excel generation | Office must be installed |
| License file | License.fin in app root | Software license | Encrypted file |

### 5.2 External System References

| System | Reference | Protocol | Status |
|---|---|---|---|
| eOxegen | Crystal Report names, connection string comments | Unknown | INFERRED — integration scope unknown |
| ACCPAC/Sage 300 | Crystal Report name: "eOxegen vs Accpac Amounts.rpt" | Unknown | INFERRED — financial reconciliation |
| CarePay | Business_Status_CarePay.aspx, cross-DB queries | SQL | CONFIRMED — health payments |
| CLAPI | Multiple pages and SQL queries | SQL | CONFIRMED — insurance system |

---

## 6. Security Architecture (Current State)

| Area | Current Implementation | Weakness |
|---|---|---|
| Authentication | Custom forms — session-based | No standards compliance |
| Password storage | Rijndael AES decrypt-and-compare | Not hashed — reversible |
| Encryption key | Hardcoded in MyEncryptDecrypt.vb | Any developer can decrypt all passwords |
| Session management | ASP.NET session (in-memory) | No token rotation |
| Authorization | DB-driven profile check | No middleware enforcement |
| Input validation | Rudimentary (`--` and `'` check) | Insufficient for injection prevention |
| Error handling | Silent catch blocks (478) | Failures hidden |
| Audit trail | AdminAuditTrail table | Good — comprehensive |
| TLS | Not confirmed from source | INFERRED required by Office365 SMTP |
| CSRF | ViewState partial protection | No explicit tokens |

---

## 7. Operational Architecture

| Area | Current State | Classification |
|---|---|---|
| Deployment | IIS on Windows Server | CONFIRMED |
| Application scaling | Single server instance | INFERRED |
| Load balancing | Unknown | UNKNOWN |
| Monitoring | Error_Logs.txt (929KB active) | CONFIRMED |
| Structured logging | log4net declared, usage unconfirmed | INFERRED |
| Backups | Unknown | UNKNOWN |
| Disaster recovery | Unknown | UNKNOWN |
| Session state | In-process (ASP.NET default) | INFERRED |

---

## 8. Architecture Weaknesses Summary

| # | Weakness | Impact | Priority |
|---|---|---|---|
| 1 | No separation of concerns — business logic in UI + DB | Unmaintainable, untestable | CRITICAL |
| 2 | God class (DocManage.vb, 6,362 lines) | Single point of failure | CRITICAL |
| 3 | Passwords reversibly encrypted (not hashed) | All passwords compromisable | CRITICAL |
| 4 | Business logic in stored procedures (bodies unknown) | Logic invisible without DB | CRITICAL |
| 5 | Cross-database SQL joins | Cannot scale independently | HIGH |
| 6 | Hardware SMS modem dependency | Cannot cloud-deploy | HIGH |
| 7 | Windows file system paths | Cannot containerize | HIGH |
| 8 | Office Interop for Excel | Cannot containerize | HIGH |
| 9 | Session-based state management | No horizontal scaling | HIGH |
| 10 | 184 binary Crystal Reports | Business logic invisible | HIGH |
| 11 | No formal API layer | Cannot support mobile/API clients | HIGH |
| 12 | Silent exception handling (478 catch blocks) | Failures hidden | MEDIUM |
| 13 | Dual jQuery versions | Unpredictable behavior | MEDIUM |
| 14 | No structured logging | Poor observability | MEDIUM |

---

*Document produced by: AI Engineering Agent — Architecture Analysis Phase*  
*Source: /Legacy/CRM — READ-ONLY*
