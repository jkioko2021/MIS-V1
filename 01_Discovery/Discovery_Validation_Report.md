# Discovery Validation Report

**Document ID:** VAL-001  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery Validation  
**Date:** 2026-08-17  
**Mode:** DISCOVERY VALIDATION — No target system design  
**Scope:** Validates all discovery evidence produced against the 9 mandated validation areas  
**Status:** COMPLETE — findings classified per classification standard  

---

## Classification Standard

| Classification | Meaning |
|---|---|
| **SOURCE-CONFIRMED** | Directly observed in source code, configuration files, or file system — no interpretation required |
| **INFERRED** | Logically derived from evidence; not directly stated in source |
| **UNKNOWN** | Not determinable from available evidence — gap exists |
| **CONFLICTING** | Two or more evidence sources make contradictory claims about the same fact |

---

## 1. Application Inventory

### 1.1 Core Application Facts

| Finding | Classification | Evidence Source |
|---|---|---|
| Application name: eOxegen CRM (internal branding: MARVEL) | SOURCE-CONFIRMED | DISC-001, web.config AppURL |
| Internal vendor branding: "AIK-Linc" | SOURCE-CONFIRMED | BR-AUTH-001 (License.fin, LoadParamz SP) |
| Production URL: https://misreports.aar-insurance.com/marvel/ | SOURCE-CONFIRMED | web.config AppSettings |
| Framework: ASP.NET Web Forms, .NET 4.0, VB.NET | SOURCE-CONFIRMED | DISC-001, web.config |
| Total ASPX pages: 76 | SOURCE-CONFIRMED | DISC-002, ENV-001 file count |
| Total VB source files: 85 | SOURCE-CONFIRMED | ENV-001 file count |
| Total Bin files: 104 (51 DLLs + .refresh/.xml/.pdb) | SOURCE-CONFIRMED | ENV-001 §2.3 (clarification) |
| Crystal Reports: 184 .rpt files | SOURCE-CONFIRMED | DISC-007, ENV-001 |
| Single master page architecture | SOURCE-CONFIRMED | DISC-002 |
| Single user control (Accounts.ascx) | SOURCE-CONFIRMED | DISC-002 |
| IIS web server (integrated pipeline mode) | SOURCE-CONFIRMED | web.config system.webServer |
| Windows Server OS (inferred from file paths, COM dependencies) | INFERRED | web.config D:\, F:\ paths |

### 1.2 Module Inventory

| Module | Pages | Classification | Status |
|---|---|---|---|
| Authentication (Login, OTP, Password, Logout) | 5 | SOURCE-CONFIRMED | Fully analysed |
| User Administration | 9 (see CONFLICT-001) | CONFLICTING | Fully analysed |
| Agent Management | 1 | SOURCE-CONFIRMED | Not yet read |
| Business Tracking (all variants) | 35+ | SOURCE-CONFIRMED | Entry page only analysed |
| Business Allocation | 8 | SOURCE-CONFIRMED | Not yet read |
| Medical Underwriting | 2 | SOURCE-CONFIRMED | Not yet read |
| Risk Register | 11 | SOURCE-CONFIRMED | 2 of 11 pages analysed |
| Reports | 2 | SOURCE-CONFIRMED | Partially analysed |
| Renewals | Multiple (pages + SPs + reports) | SOURCE-CONFIRMED | Not yet read |
| Activity Tracking | 1 | SOURCE-CONFIRMED | Not yet read |
| Welcome / Dashboard | 1 | SOURCE-CONFIRMED | Analysed |
| Settings / Password Config | 1 | SOURCE-CONFIRMED | Not yet read |
| Claims | 0 ASPX pages found | UNKNOWN | No dedicated pages found |
| Commissions | 0 ASPX pages found | UNKNOWN | Reports only; no processing UI |
| Debtors / Collections | 0 ASPX pages found | UNKNOWN | Reports only; no processing UI |
| Complaints | 0 ASPX pages found | INFERRED | SP names only |
| Off-System Cases | 0 ASPX pages found | INFERRED | SP names only |
| Coverage Management | 0 ASPX pages found | INFERRED | SP names only |
| MISREPORTS (separate app) | Unknown | UNKNOWN | Not in /Legacy/CRM scope |

### 1.3 Application Inventory Gaps

- **GAP-APP-001:** Claims, Commissions, Debtors, Portfolio Management — no ASPX pages found. May reside in MISREPORTS application (separate server: 192.168.50.48) or may be entirely SP-driven without direct UI pages. Scope boundary is unknown.
- **GAP-APP-002:** `Production_RE.aspx.vb` exists as a code-behind without a matching .aspx page. Purpose and current status unknown.
- **GAP-APP-003:** `Approve_Renewal_List.aspx.exclude` and code-behind — disabled ASPX page. Reason for exclusion unknown. Business function may be deactivated.
- **GAP-APP-004:** `Registration.aspx` has no code-behind. Self-registration flow is unknown.
- **GAP-APP-005:** `AssignAdminAccessProfile_.aspx` (with trailing underscore) — purpose vs the main `AssignAdminAccessProfile.aspx` unknown.
- **GAP-APP-006:** `Accounts.ascx` user control — content and purpose not analysed.
- **GAP-APP-007:** `Business_Status_CarePay.aspx` — CarePay integration page present but not analysed. CarePay is an external system; integration scope unknown.
- **GAP-APP-008:** 34 Business Tracking sub-pages not yet read. Full state machine, all sub-workflows, and downstream modules (dispatch, policy issuance, reversal, decline, etc.) remain unconfirmed.
- **GAP-APP-009:** MISREPORTS is referenced as a separate application at 192.168.50.48. Its technology stack, page count, module scope, and relationship to CRM are entirely unknown.

---

## 2. Database Inventory

### 2.1 Database Count — CONFLICTING (see CONFLICT-002)

| Database | Evidence | Classification |
|---|---|---|
| CRM | Connection string in web.config; used throughout all source | SOURCE-CONFIRMED |
| MISREPORTS | Connection string (plaintext SA) in web.config; Crystal Reports config | SOURCE-CONFIRMED |
| SALES | Cross-DB SQL: `[SALES].[dbo].[TBL_MIS_PROD_MONTHS]` in MasterPage.master.vb | SOURCE-CONFIRMED |
| DATA_REPOSITORY_DB_CLAPI | Cross-DB SQL in code-behind files | SOURCE-CONFIRMED |
| AAR_RISK_DB | `Risk_Register_New.aspx.vb` line 28 | SOURCE-CONFIRMED |
| COMMISSION | `Business_Tracking.aspx.vb` line 50: `COMMISSION.dbo.TBL_MIS_SALES_AGENTS` | SOURCE-CONFIRMED |
| Doc_Arc_DB | `Business_Tracking.aspx.vb` line 306: `Doc_Arc_DB.dbo.TBL_MIS_CRM_DOCS` | SOURCE-CONFIRMED |
| ExcelImport | web.config `conString`: `.\SQLEXPRESS; database=ExcelImport` | SOURCE-CONFIRMED (local dev/import only) |
| AIMSOFT_DATADUMP | Listed in replit.md project notes only | UNKNOWN — no source evidence |
| AIMSOFT_DATADUMP2023 | Listed in replit.md project notes only | UNKNOWN — no source evidence |
| COM_ACTIVITIES_DB | Listed in replit.md project notes only | UNKNOWN — no source evidence |
| DB_MASTER_AGENTS | Listed in replit.md project notes only | UNKNOWN — no source evidence |
| DB_MASTER_RENEWAL | Listed in replit.md project notes only | UNKNOWN — no source evidence |
| DB_ONLINE_PORTAL | Listed in replit.md project notes only | UNKNOWN — no source evidence |

**Source-confirmed database count: 7** (CRM, MISREPORTS, SALES, DATA_REPOSITORY_DB_CLAPI, AAR_RISK_DB, COMMISSION, Doc_Arc_DB)  
**ExcelImport** is a local SQL Express staging DB — not a production dependency; separate classification recommended.  
**DISC-003 is outdated** — it lists only 4 databases. It must be superseded.

### 2.2 Stored Procedure Inventory

| Finding | Classification |
|---|---|
| 57 SPs identified by name from DocManage.vb and Login.aspx.vb | SOURCE-CONFIRMED |
| SP bodies (SQL, business logic, parameters) — ALL unknown | UNKNOWN |
| Additional SPs called from other pages (not DocManage/Login) — count unknown | UNKNOWN |
| SPs called from MISREPORTS or via inline SQL — not catalogued | UNKNOWN |

### 2.3 Database Inventory Gaps

- **GAP-DB-001:** All 57+ stored procedure bodies are blocked (DB connectivity required). Business logic, calculated fields, validation rules, and data transformations inside SPs are entirely unknown.
- **GAP-DB-002:** Whether COMMISSION database is on the same SQL Server instance as CRM or a different server is unknown.
- **GAP-DB-003:** Whether MISREPORTS at 192.168.50.48 is the same server as the test RDS endpoint or a separate on-premise server is unknown.
- **GAP-DB-004:** ExcelImport (.\SQLEXPRESS) — whether this is a real production dependency or a development/import staging database is unknown.
- **GAP-DB-005:** 6 databases listed in project notes (AIMSOFT_DATADUMP, AIMSOFT_DATADUMP2023, COM_ACTIVITIES_DB, DB_MASTER_AGENTS, DB_MASTER_RENEWAL, DB_ONLINE_PORTAL) have no supporting source code evidence. Their existence, purpose, and relationship to this application require database access to confirm.
- **GAP-DB-006:** Full schema (tables, columns, data types, constraints, indexes, foreign keys, triggers, views) for all 7 confirmed databases is unknown — blocked by connectivity.

---

## 3. UI Inventory

### 3.1 UI Framework and Components

| Finding | Classification | Notes |
|---|---|---|
| Telerik RadControls 2011.1.413.40 — RadMenu, RadUpload, RadChart, RadEditor | SOURCE-CONFIRMED | 15-year-old library |
| AjaxControlToolkit — AJAX controls | SOURCE-CONFIRMED | |
| ASP.NET System.Web.DataVisualization — charting | SOURCE-CONFIRMED | |
| jQuery 1.4.1 (2010) — present | SOURCE-CONFIRMED | |
| jQuery 3.7.1 (2024) — also present | SOURCE-CONFIRMED | |
| Which jQuery version loads per-page | CONFLICTING | See CONFLICT-003 |
| Chart.js — JavaScript charting | SOURCE-CONFIRMED | |
| wz_tooltip.js — tooltips | SOURCE-CONFIRMED | |
| CN.js — purpose unknown | INFERRED | |
| James_toolkit.js — purpose unknown | INFERRED | |
| Winthusiasm.HtmlEditor — rich text editor | SOURCE-CONFIRMED | |
| Telerik RadMenu — profile-driven navigation | SOURCE-CONFIRMED | |
| Single global CSS: GlobalStyles.css | SOURCE-CONFIRMED | |
| Sales-specific CSS: Sales.css | SOURCE-CONFIRMED | |

### 3.2 UI Inventory Gaps

- **GAP-UI-001:** Which ASPX pages use jQuery 1.4.1 vs 3.7.1 is unknown. The two versions conflict; the actual loaded version per-page is not determinable from static analysis.
- **GAP-UI-002:** `CN.js` and `James_toolkit.js` — custom JavaScript files with unknown functionality. No documentation found.
- **GAP-UI-003:** `Accounts.ascx` user control — full UI and functionality unknown.
- **GAP-UI-004:** `MasterPage.master` content placeholder count — not confirmed. Master page .master file not fully read.
- **GAP-UI-005:** OTP entry is rendered inside `Panel1` within `Login.aspx` — but `Verify_OTP.aspx` also exists as a separate page. See CONFLICT-004.

---

## 4. Business Logic Inventory

### 4.1 Authentication Business Logic

| Rule | Classification | Source |
|---|---|---|
| License check on every login (BR-AUTH-001) | SOURCE-CONFIRMED | Login.aspx.vb |
| SQL injection pre-check on username (BR-AUTH-002) | SOURCE-CONFIRMED | Login.aspx.vb |
| AdminLogin SP credential lookup (BR-AUTH-003) | SOURCE-CONFIRMED | Login.aspx.vb |
| Session variables populated on auth (BR-AUTH-004) | SOURCE-CONFIRMED | Login.aspx.vb |
| Three-flag account state machine (BR-AUTH-005) | SOURCE-CONFIRMED | Login.aspx.vb |
| 30-day password expiry (BR-AUTH-006) | SOURCE-CONFIRMED | Login.aspx.vb |
| OTP generation and delivery — 6-digit email (BR-AUTH-007) | SOURCE-CONFIRMED | Login.aspx.vb |
| OTP delivery via SMS modem (DISC-006) | SOURCE-CONFIRMED | SMSCOMMS.vb, DISC-006 |
| OTP mechanism: SMS vs email | CONFLICTING | See CONFLICT-005 — CRITICAL |
| OTP validation with 5-minute expiry (BR-AUTH-008) | SOURCE-CONFIRMED | Login.aspx.vb |
| No OTP retry limit | SOURCE-CONFIRMED | Login.aspx.vb |
| Failed login counter in session (BR-AUTH-009) | SOURCE-CONFIRMED | Login.aspx.vb — security flaw |
| Lockout after 3 failures (BR-AUTH-010) | SOURCE-CONFIRMED | Login.aspx.vb |
| Manual unlock by admin (BR-AUTH-011) | SOURCE-CONFIRMED | UserDetails.aspx.vb |
| Full audit trail for all auth events (BR-AUTH-012) | SOURCE-CONFIRMED | Login.aspx.vb |
| Password change validation, minimum 4 chars (BR-AUTH-013) | SOURCE-CONFIRMED | ChangePass.aspx.vb |
| CPasswordStrength default minimum 6 chars | SOURCE-CONFIRMED | CPasswordStrength.vb |
| TBL_MIS_CRM_PASSWORD_CONF configurable length | SOURCE-CONFIRMED | Password_Config.aspx |
| Password minimum length rule | CONFLICTING | See CONFLICT-006 |
| Password change updates Activated flag and LASTPASSWORDRESET | SOURCE-CONFIRMED | ChangePass.aspx.vb |

### 4.2 Authorization Business Logic

| Rule | Classification | Source |
|---|---|---|
| Profile-based authorization (BR-AUTHZ-001) | SOURCE-CONFIRMED | MasterPage, Login |
| ADMIN profile type (BR-AUTHZ-002) | SOURCE-CONFIRMED | ProfilesRoles, UserDetails |
| Other PROFILETYPE values | UNKNOWN | DB access required |
| Page access check on every request (BR-AUTHZ-003) | SOURCE-CONFIRMED | MasterPage.master.vb |
| Bug: `Response.Redirect("")` on access denied (BR-AUTHZ-003 note) | SOURCE-CONFIRMED | MasterPage.master.vb line 91 |
| Exempt pages — welcome, changepassword (BR-AUTHZ-004) | SOURCE-CONFIRMED | MasterPage.master.vb |
| Page name mismatch: exempt checks `changepassword.aspx` but active page is `ChangePass.aspx` | CONFLICTING | See CONFLICT-007 |
| Dynamic menu from menuaccess table (BR-AUTHZ-005) | SOURCE-CONFIRMED | MasterPage.master.vb |
| Per-page CRUD permissions (BR-AUTHZ-006) | SOURCE-CONFIRMED | ProfilesRoles.aspx.vb |
| Four-eyes principle — business intent (BR-AUTHZ-007) | SOURCE-CONFIRMED | UserDetails.aspx.vb |
| Four-eyes principle — enforcement | CONFLICTING | See CONFLICT-008 — CRITICAL |
| Approval required before account active (BR-AUTHZ-008) | SOURCE-CONFIRMED | UserDetails, ApproveUserDetails |
| Profile assigned at user creation — ADMIN type only (BR-AUTHZ-009) | SOURCE-CONFIRMED | UserDetails.aspx.vb |
| SuperAdmin profile restriction (commented out) | INFERRED | UserDetails.aspx.vb comment |
| Default password literal "password" (BR-AUTHZ-010) | SOURCE-CONFIRMED | UserDetails.aspx.vb line 102 |
| On-call staff display from TBL_MIS_CRM_STAFF_ON_CALL (BR-AUTHZ-013) | SOURCE-CONFIRMED | MasterPage.master.vb |
| Audit on profile changes — via UpDate_Profile SP | UNKNOWN | SP body required |

### 4.3 Business Tracking Business Logic

| Rule | Classification | Source |
|---|---|---|
| File number generated from MAX(File_No)+1 | SOURCE-CONFIRMED | Business_Tracking.aspx.vb (race condition) |
| 6 mandatory registration fields (BR-BT-002) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Rate Type auto-set from Client Type (BR-BT-003) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Document checklist at registration (BR-BT-004) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Walk-in client mandatory membership admin (BR-BT-005) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| M-Tiba flag (BR-BT-006) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| IPF flag (BR-BT-007) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Payment reference grouping (BR-BT-008) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Agent from COMMISSION.dbo.TBL_MIS_SALES_AGENTS (BR-BT-009) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| File status state machine — 8 confirmed statuses (BR-BT-010) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Additional statuses beyond the 8 confirmed | UNKNOWN | Remaining pages unread |
| Forward prerequisites: docs uploaded + complete + comment (BR-BT-011) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Forward routing logic (BR-BT-012) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Comment mandatory at forward (BR-BT-013) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Non-medical forward triggers email to nonmedical@aar.co.ke (BR-BT-014) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Walk-in forward email to membership admin (BR-BT-015) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| Document storage as binary in Doc_Arc_DB (BR-BT-016) | SOURCE-CONFIRMED | Business_Tracking.aspx.vb |
| 5-level sales hierarchy on Welcome dashboard (BR-BT-018) | SOURCE-CONFIRMED | Welcome.aspx.vb |
| All downstream sub-module business rules (allocation, UW, finance, dispatch, etc.) | UNKNOWN | 34 pages unread |

### 4.4 Risk Register Business Logic

| Rule | Classification | Source |
|---|---|---|
| Dedicated AAR_RISK_DB database (BR-RISK-001) | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| 10 tables, 3 views confirmed in AAR_RISK_DB | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| Open period determines active window (BR-RISK-002) | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| Period open/close management screen | UNKNOWN | Not yet read |
| Champion scoped to one department (BR-RISK-003) | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| Department scopes owners and objectives (BR-RISK-004) | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| Risk code format FIN-RNNN (BR-RISK-005) | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| Risk registration fields (BR-RISK-006) | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| Compute_Risk_Values SP called after save (BR-RISK-007) | SOURCE-CONFIRMED | Risk_Register_New.aspx.vb |
| Compute_Risk_Values SP logic | UNKNOWN | SP body blocked |
| Risk scoring fields confirmed (BR-RISK-009) | SOURCE-CONFIRMED | TBL_MIS_RISK_MASTER schema |
| Impact × Likelihood → Exposure formula | UNKNOWN | Inside Compute_Risk_Values SP |
| 5-band heat map thresholds (BR-RISK-010) | SOURCE-CONFIRMED | Risk_Register_Dashboard.aspx.vb |
| Root cause records (BR-RISK-011) | SOURCE-CONFIRMED | Risk_Register_Dashboard.aspx.vb |
| Submit → Review → Sign-Off workflow (BR-RISK-012) | SOURCE-CONFIRMED | Risk_Register_Dashboard.aspx.vb |
| Who performs Review and Sign-Off | UNKNOWN | Review/signoff pages not read |
| Dashboard report types: RR, RS, T10, OD, O10, CR (BR-RISK-014) | SOURCE-CONFIRMED | Risk_Register_Dashboard.aspx.vb |
| 10 remaining Risk Register pages' business rules | UNKNOWN | Not yet read |

### 4.5 Business Logic Gaps

- **GAP-BL-001:** All stored procedure business logic (57+ SPs) is completely unknown.
- **GAP-BL-002:** Claims processing workflow — no ASPX pages found, only SP names. Whether Claims is entirely SP-driven, or in MISREPORTS, is unknown.
- **GAP-BL-003:** Commission calculation workflow — 8 Crystal Reports exist but no processing UI found in source.
- **GAP-BL-004:** Debtors/collections workflow — 5 Crystal Reports exist but no ASPX pages found.
- **GAP-BL-005:** Full Business Tracking state machine — only 8 statuses confirmed out of an unknown total.
- **GAP-BL-006:** Whether `Password_Config.aspx` / `TBL_MIS_CRM_PASSWORD_CONF` settings are actually enforced anywhere, or are UI-only configuration that no code reads.
- **GAP-BL-007:** Whether concurrent session enforcement is active (ActiveSession flag exists in schema references but enforcement may be disabled).
- **GAP-BL-008:** `DaysTolockUser` field — whether automated account lock for inactive users is implemented (SQL Agent job? scheduled task?) is unknown.
- **GAP-BL-009:** Whether SuperAdmin profile assignment restrictions (commented-out code) are an active business rule or obsolete.

---

## 5. Reports

### 5.1 Report Inventory

| Finding | Classification | Source |
|---|---|---|
| 184 Crystal Reports (.rpt binary files) present | SOURCE-CONFIRMED | File system, DISC-007 |
| Reports loaded via session variables (Reportname, SelectionFormula) | SOURCE-CONFIRMED | Reports.aspx.vb |
| Crystal Report viewer renders in browser (CrystalReportViewer1) | SOURCE-CONFIRMED | Reports.aspx.vb |
| Report output to /GeneratedReports directory | SOURCE-CONFIRMED | DISC-002 |
| Renewal advice output to /RENEWAL ADVICE directory | SOURCE-CONFIRMED | DISC-002 |
| MISREPORTS server referenced for report data source | SOURCE-CONFIRMED | web.config |
| eOxegen server also referenced for reports (ReportServerName_=eoxegen) | SOURCE-CONFIRMED | web.config |
| Report categories: Financial, Claims, Commission, Renewal, Production, Members, Benefits, Invoices, eOxegen, Debtors, Risk, TAT, Utilization, Hospital, Policy | INFERRED | File names only |
| Internal SQL for all 184 reports | UNKNOWN | Binary .rpt files require Crystal software |
| Report parameters per report | UNKNOWN | Binary .rpt files |
| Report formulas and calculated fields | UNKNOWN | Binary .rpt files |
| Which profiles can access which reports | UNKNOWN | Requires DB access (menuaccess table) |
| Whether any reports are scheduled | UNKNOWN | No scheduler config found |
| Report variant differences (Statement_X, _W, _old, etc.) | UNKNOWN | Internal SQL required |

### 5.2 Report Gaps

- **GAP-RPT-001:** All 184 report internals (SQL queries, parameters, calculated fields, groupings) are inaccessible without SAP Crystal Reports software. This is the single largest discovery gap by scope.
- **GAP-RPT-002:** 14 report names reference "eOxegen Integration" — an external system whose integration method is unknown.
- **GAP-RPT-003:** Multiple statement variants (Statement_X, _W, _old, etc.) likely represent business rule variations by client type or product. The business differences are unknown.
- **GAP-RPT-004:** Whether any reports are generated on a schedule vs purely on-demand is unknown.
- **GAP-RPT-005:** `eoxegen` hostname referenced in AppSettings — whether this is a separate Crystal Reports server or an alias for MISREPORTS is unknown.
- **GAP-RPT-006:** RENEWAL ADVICE directory — what process populates this with renewal documents is not evident in source code. May be a batch/scheduled job.

---

## 6. Integrations

### 6.1 Email Integration

| Finding | Classification | Risk |
|---|---|---|
| SMTP server: smtp.office365.com port 587 | SOURCE-CONFIRMED | — |
| EnableSsl = False in System.Net.Mail config | SOURCE-CONFIRMED | CONFLICT — see CONFLICT-009 |
| From address: aar-alerts@aar.co.ke | SOURCE-CONFIRMED | — |
| Dual email libraries (System.Net.Mail + QMailClient) | SOURCE-CONFIRMED | Inconsistent behavior risk |
| 8 confirmed message types (MsgType 001–008) | SOURCE-CONFIRMED | — |
| Email credentials in plaintext in web.config | SOURCE-CONFIRMED | CRITICAL security risk |
| Password sent in plaintext in welcome email | SOURCE-CONFIRMED | HIGH security risk |
| Full list of email message types beyond the 8 confirmed | UNKNOWN | Notifications_SetUp table required |

### 6.2 SMS Integration

| Finding | Classification | Risk |
|---|---|---|
| SMS via serial COM port hardware modem | SOURCE-CONFIRMED | CRITICAL — cannot cloud-deploy |
| AT command protocol, 9600 baud, 8N1, RTS flow control | SOURCE-CONFIRMED | — |
| 160-character SMS limit | SOURCE-CONFIRMED | — |
| OTP format via SMS: 4-character alphanumeric | SOURCE-CONFIRMED | CONFLICT with email OTP — see CONFLICT-005 |
| No delivery confirmation mechanism | SOURCE-CONFIRMED | HIGH risk |
| COM port name configuration not found | SOURCE-CONFIRMED (absence) | HIGH risk |

### 6.3 eOxegen Integration

| Finding | Classification | Notes |
|---|---|---|
| System name: eOxegen | INFERRED | From Crystal Report file names |
| 7+ Crystal Reports reference eOxegen integration | SOURCE-CONFIRMED | File names |
| Integration method (API, DB, file, other) | UNKNOWN | No source code found |
| Integration direction (inbound, outbound, bidirectional) | UNKNOWN | No source code found |
| Whether eOxegen is the core insurance system | INFERRED | Report: "eOxegen vs Accpac Amounts" suggests CRM receives data from eOxegen |
| Current production status (active vs historical) | UNKNOWN | — |

### 6.4 ACCPAC / Sage 300 Integration

| Finding | Classification | Notes |
|---|---|---|
| System name: ACCPAC (likely Sage 300 ERP) | INFERRED | Crystal Report: "eOxegen vs Accpac Amounts.rpt" |
| Financial reconciliation purpose | INFERRED | "Audited-Errors on Interface", "Audited-Missing On Interface" |
| Integration method | UNKNOWN | No source code found |
| Current production status | UNKNOWN | — |

### 6.5 Excel Integration

| Finding | Classification | Notes |
|---|---|---|
| Excel 2003 import via Jet.OLEDB.4.0 | SOURCE-CONFIRMED | web.config |
| Excel 2007+ import via ACE.OLEDB.12.0 | SOURCE-CONFIRMED | web.config |
| Excel generation via Microsoft.Office.Interop.Excel v12 (COM) | SOURCE-CONFIRMED | Bin/ |
| NPOI library also present as alternative | SOURCE-CONFIRMED | Bin/ |
| CExcelGenerator.vb and CExcel.vb excluded | SOURCE-CONFIRMED | .exclude files |
| Whether NPOI is used in production or only Office Interop | UNKNOWN | Excluded files suggest NPOI attempted but disabled |
| Excel upload format and business rules | UNKNOWN | No documentation found |

### 6.6 Integration Gaps

- **GAP-INT-001:** eOxegen integration — no source code found. 7 Crystal Reports imply active data exchange. Method, frequency, and data elements completely unknown.
- **GAP-INT-002:** ACCPAC/Sage 300 — interface audit reports exist but no integration source code found. Whether this is a live active integration or historical is unknown.
- **GAP-INT-003:** F:\mount_location — a mounted file system directory referenced in web.config. What is mounted, by whom, and why is unknown.
- **GAP-INT-004:** RENEWAL ADVICE directory population — no source code found for whatever process generates renewal advice letters.
- **GAP-INT-005:** CarePay — `Business_Status_CarePay.aspx` exists, implying a CarePay mobile payment integration. Scope unknown.

---

## 7. Authentication

### 7.1 Authentication Findings

| Finding | Classification | Notes |
|---|---|---|
| Custom forms-based authentication (not ASP.NET Membership) | SOURCE-CONFIRMED | Login.aspx.vb |
| Session-based auth guard: Session("FullNames") null check | SOURCE-CONFIRMED | MasterPage.master.vb |
| AdminLogin stored procedure validates credentials | SOURCE-CONFIRMED | Login.aspx.vb |
| Password stored as Rijndael AES encrypted in DB | SOURCE-CONFIRMED | Login.aspx.vb, MyEncryptDecrypt.vb |
| Rijndael key hardcoded in MyEncryptDecrypt.vb | SOURCE-CONFIRMED | MyEncryptDecrypt.vb |
| Password decrypted client-side then compared | SOURCE-CONFIRMED | Login.aspx.vb — critical security flaw |
| Software license required before authentication proceeds | SOURCE-CONFIRMED | Login.aspx.vb (LoadLicence) |
| License validates Client + Version + AppName + Date | SOURCE-CONFIRMED | BR-AUTH-001 |
| Three account state flags: Activated, EmployeeLocked, APPROVED | SOURCE-CONFIRMED | Login.aspx.vb |
| 30-day password expiry forced | SOURCE-CONFIRMED | Login.aspx.vb |
| OTP mechanism (SMS vs email) | CONFLICTING | See CONFLICT-005 — CRITICAL |
| Lockout counter in session only (bypassable) | SOURCE-CONFIRMED | Login.aspx.vb — security flaw |
| Manual unlock required (no auto-unlock) | SOURCE-CONFIRMED | UserDetails.aspx.vb |
| IP address captured and stored in session/audit | SOURCE-CONFIRMED | Login.aspx.vb |
| Full audit trail for all auth events | SOURCE-CONFIRMED | Login.aspx.vb |
| Four-eyes approval for user accounts — intent | SOURCE-CONFIRMED | UserDetails.aspx.vb |
| Four-eyes approval — actual enforcement | CONFLICTING | See CONFLICT-008 — CRITICAL |
| Cookie security flags (HttpOnly, Secure, SameSite) | UNKNOWN | Not configured in web.config |
| Whether concurrent logins are blocked | UNKNOWN | ActiveSession referenced but enforcement unconfirmed |

---

## 8. Batch Processing

### 8.1 Batch Processing Findings

| Finding | Classification | Notes |
|---|---|---|
| No SQL Agent job definitions found in /Legacy/CRM source | SOURCE-CONFIRMED (absence) | SQL Agent config lives on DB server |
| No Windows Task Scheduler config found | SOURCE-CONFIRMED (absence) | — |
| RENEWAL ADVICE directory populated by unknown process | UNKNOWN | May be batch/scheduled |
| EXCEL UPLOADS directory — batch import process unknown | UNKNOWN | Manual or scheduled? |
| DaysTolockUser field exists (auto-lock of inactive users) | INFERRED | Field name implies scheduled job |
| Whether any Crystal Reports are scheduled (batch email delivery) | UNKNOWN | No scheduler config found |
| Error log (929KB) suggests ongoing automated activity | INFERRED | Log size implies active system |

### 8.2 Batch Processing Gaps

- **GAP-BAT-001:** No SQL Agent job definitions visible from source. All batch processing discovery requires database server access.
- **GAP-BAT-002:** RENEWAL ADVICE generation mechanism completely unknown — may be a scheduled Crystal Report, a batch export, or a manual process triggered from an unread page.
- **GAP-BAT-003:** DaysTolockUser — whether an automated account lock job runs and on what schedule is unknown.
- **GAP-BAT-004:** Whether report generation is ever scheduled (nightly commission reports, monthly renewal schedules, etc.) is unknown.

---

## 9. Dependencies

### 9.1 Dependency Inventory

| Dependency | Version | Risk | Classification |
|---|---|---|---|
| .NET Framework | 4.0 | CRITICAL — EOL | SOURCE-CONFIRMED |
| ASP.NET Web Forms | 4.0 | CRITICAL — EOL | SOURCE-CONFIRMED |
| VB.NET | 4.0 | HIGH — full rewrite | SOURCE-CONFIRMED |
| Telerik RadControls | 2011.1.413.40 | CRITICAL — 15 years old | SOURCE-CONFIRMED |
| SAP Crystal Reports | 13.0.2000.0 | CRITICAL — 184 reports | SOURCE-CONFIRMED |
| Microsoft.Office.Interop.Excel | 12.0 (Office 2007) | CRITICAL — COM/server install | SOURCE-CONFIRMED |
| NPOI | Unknown | LOW — modern alternative | SOURCE-CONFIRMED |
| SMS serial modem (hardware) | — | CRITICAL — cloud-incompatible | SOURCE-CONFIRMED |
| Windows Server (OS) | Unknown | HIGH — infrastructure | INFERRED |
| IIS | Unknown | MEDIUM — replaced by Node | INFERRED |
| AjaxControlToolkit | Unknown | HIGH | SOURCE-CONFIRMED |
| Microsoft Enterprise Library | Unknown | MEDIUM | SOURCE-CONFIRMED |
| MailClient.dll (QMailClient) | Unknown | MEDIUM — unknown provenance | SOURCE-CONFIRMED |
| Winthusiasm.HtmlEditor | Unknown | MEDIUM — obscure library | SOURCE-CONFIRMED |
| log4net | 2.0.10 | LOW | SOURCE-CONFIRMED |
| Ionic.Zip (DotNetZip) | Unknown | LOW | SOURCE-CONFIRMED |
| jQuery 1.4.1 | — | HIGH — security vulnerabilities | SOURCE-CONFIRMED |
| jQuery 3.7.1 | — | LOW | SOURCE-CONFIRMED |
| Oracle client (System.Data.OracleClient) | — | UNKNOWN | INFERRED — may be unused |
| ODBC (System.Data.Odbc) | — | LOW | SOURCE-CONFIRMED (TwoFactorAuthentication.vb) |
| Actual DLL count | 51 DLLs (not 104) | — | CONFLICTING — see CONFLICT-010 |
| D:\MANAGEMENT DOCS\ file path | — | HIGH — Windows-only | SOURCE-CONFIRMED |
| F:\mount_location | — | HIGH — Windows-only | SOURCE-CONFIRMED |
| Microsoft Office (server-installed) | 2007/2010 | CRITICAL | SOURCE-CONFIRMED |

### 9.2 Dependency Gaps

- **GAP-DEP-001:** Oracle client assembly referenced in web.config compilation assemblies — purpose unknown. May be unused dead reference.
- **GAP-DEP-002:** ODBC (System.Data.Odbc) in TwoFactorAuthentication.vb — what ODBC data source this connects to is unknown.
- **GAP-DEP-003:** `DataManagement.vb.exclude` vs active `DocManage.vb` — the differences between the excluded old version and the active version are unknown. The excluded file may contain business logic not in the active version.
- **GAP-DEP-004:** Versions of Enterprise Library, AjaxControlToolkit, QMailClient, Winthusiasm.HtmlEditor, Ionic.Zip, NPOI — not determinable without inspecting DLL metadata.

---

## 10. Overall Validation Summary

### 10.1 Evidence Quality by Area

| Area | Quality | Confidence |
|---|---|---|
| Application Inventory | HIGH — 76 pages counted, structure confirmed | 85% |
| Database Inventory | MEDIUM — 7 confirmed, schema unknown, count disputed | 60% |
| UI Inventory | HIGH — framework and components confirmed | 80% |
| Business Logic — Auth/Authz | HIGH — all pages read and analysed | 90% |
| Business Logic — Business Tracking | LOW — 1 of 35 pages analysed | 25% |
| Business Logic — Risk Register | MEDIUM — 2 of 11 pages analysed | 35% |
| Business Logic — Claims/Commissions/Debtors | NONE — no ASPX pages found | 5% |
| Reports | VERY LOW — names only, no internal SQL | 10% |
| Integrations — Email/SMS | HIGH — source code confirmed | 85% |
| Integrations — eOxegen/ACCPAC | NONE — report names only | 5% |
| Authentication | HIGH — all auth pages read | 90% |
| Batch Processing | NONE — no scheduler config found | 5% |
| Dependencies | HIGH — Bin/ and web.config confirmed | 80% |

### 10.2 Critical Blockers

| Blocker | Impact on Modernization |
|---|---|
| Database connectivity (port 1433 blocked) | Blocks SP extraction, schema mapping, full module discovery |
| Crystal Reports software required | Blocks all 184 report specifications |
| 34 Business Tracking sub-pages unread | Blocks core module specification |
| 10 Risk Register pages unread | Blocks Risk Register specification |
| eOxegen integration unknown | Blocks data migration and integration planning |
| ACCPAC integration unknown | Blocks financial reconciliation specification |

---

*Document produced by: AI Engineering Agent — Discovery Validation Phase*  
*Source: All discovery documents in 01_Discovery/, 03_Business_Rules/*  
*Legacy source /Legacy/CRM: READ-ONLY — no modifications made*  
*Date: 2026-08-17*
