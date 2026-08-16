# Discovery Gap Register

**Document ID:** VAL-002  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery Validation  
**Date:** 2026-08-17  
**Status:** OPEN — All gaps require resolution before specifications can be finalised  
**Purpose:** Register of all evidence gaps identified during discovery validation  

---

## Gap Classification

| Priority | Meaning |
|---|---|
| **P1 — CRITICAL** | Blocks wave implementation; cannot design or build without this information |
| **P2 — HIGH** | Required before specification is finalised; significant rework risk if skipped |
| **P3 — MEDIUM** | Required before implementation begins; discovery can proceed |
| **P4 — LOW** | Should be resolved; low rework risk if deferred |

---

## Category A — Database and Stored Procedures (Blocked: DB Connectivity Required)

| Gap ID | Description | Priority | Blocking What |
|---|---|---|---|
| GAP-DB-001 | **ALL 57+ stored procedure bodies unknown.** Only names confirmed. Business logic, validation rules, calculations, field mappings, and cross-DB joins inside SPs are entirely inaccessible. | P1 | Core module specifications cannot be completed |
| GAP-DB-002 | **Full schema for all 7 confirmed databases unknown.** Tables, columns, data types, constraints, nullability, indexes, foreign keys, triggers — all unknown. | P1 | Data model design for new system blocked |
| GAP-DB-003 | **Whether COMMISSION database is on the same SQL Server instance as CRM or a separate server** is unknown. The COMMISSION.dbo cross-DB syntax suggests same instance, but cannot confirm. | P2 | Database migration planning |
| GAP-DB-004 | **Whether MISREPORTS at 192.168.50.48 is available at the test RDS endpoint** or remains on a separate on-premises server is unknown. | P2 | Reporting database migration planning |
| GAP-DB-005 | **ExcelImport (.\SQLEXPRESS) production relevance.** Whether this local SQL Express database is used in the production application or only for local development/import staging is unknown. | P3 | May eliminate one database from migration scope |
| GAP-DB-006 | **6 databases listed in project notes have no source code evidence:** AIMSOFT_DATADUMP, AIMSOFT_DATADUMP2023, COM_ACTIVITIES_DB, DB_MASTER_AGENTS, DB_MASTER_RENEWAL, DB_ONLINE_PORTAL. Whether these are in scope for this application is unknown. | P2 | Migration scope definition |
| GAP-DB-007 | **All database views** — their definitions, joining logic, and whether they contain business calculations are unknown. AAR_RISK_DB has 3 confirmed views; view bodies are blocked. | P1 | Risk module specification |
| GAP-DB-008 | **SQL Agent jobs** — any batch/scheduled jobs on the database server are not visible from the application source. Exist-ence, schedules, and business rules inside jobs are unknown. | P1 | Batch processing requirements |
| GAP-DB-009 | **Compute_Risk_Values stored procedure** body is unknown. This SP calculates all risk scores (I_Risk_Exposure, I_Risk_Rate, R_Risk_Rate, R_Risk_Exposure). The scoring formula cannot be specified without it. | P1 | Risk Register scoring specification |
| GAP-DB-010 | **AdminLogin stored procedure** body is unknown. Whether additional business logic (beyond credential lookup) is inside this SP cannot be confirmed. | P2 | Authentication specification completeness |
| GAP-DB-011 | **Row counts for all tables** are unknown. Cannot assess data volume, performance requirements, or migration duration. | P3 | Migration planning |

---

## Category B — Crystal Reports (Blocked: Crystal Software Required)

| Gap ID | Description | Priority | Blocking What |
|---|---|---|---|
| GAP-RPT-001 | **Internal SQL for all 184 Crystal Reports is unknown.** Binary .rpt files cannot be read. Business calculations, date filters, groupings, and joining logic are inaccessible. | P1 | All report specifications blocked |
| GAP-RPT-002 | **Report parameters for all 184 reports are unknown.** Cannot replicate filtering or parameter-passing behaviour. | P1 | Report specifications |
| GAP-RPT-003 | **Crystal formulas and calculated fields for all 184 reports are unknown.** Business rules implemented as Crystal formulas (subtotals, aging, averages, ratios) are inaccessible. | P1 | Financial and analytical report specifications |
| GAP-RPT-004 | **Report access control unknown.** Which profiles can access which reports is stored in the `menuaccess` DB table — not readable without DB access. | P2 | Security model for reporting |
| GAP-RPT-005 | **Report data source connections per report unknown.** Each .rpt file connects to a specific DB/table — cannot verify without Crystal software. | P2 | Database dependency mapping |
| GAP-RPT-006 | **Report variant differences unknown** (e.g. Customer_Statement_X vs Customer_Statement_W vs Customer_Statement_old). Whether these represent different client segments, product types, or superseded versions is unknown. | P2 | Report rationalisation and migration scope |
| GAP-RPT-007 | **Whether any reports are scheduled** (batch email delivery, nightly generation) is unknown. | P2 | Batch processing requirements |
| GAP-RPT-008 | **eoxegen hostname in AppSettings** — whether this references a separate Crystal Reports server or is an alias for MISREPORTS is unknown. | P3 | Reporting infrastructure design |

---

## Category C — Unread Source Pages (Unblocked — Can Proceed)

| Gap ID | Description | Priority | Blocking What |
|---|---|---|---|
| GAP-SRC-001 | **34 Business Tracking sub-pages not yet read.** All downstream workflow modules (allocation, medical UW, benefits verification, finance/cashier, dispatch, policy document, filing, reversal, decline, receipting, return, IT processing, TAT) have zero confirmed business rules. | P1 | Business Tracking module specification (MOD-03) |
| GAP-SRC-002 | **10 Risk Register pages not yet read** (Risk_Register_Open, Update, Review, Close, Closed, History, Summary, Risk_Status, Risk_Rating_Client, Risk_Map_Champions). Who reviews and signs off, the complete state machine, and the champion management workflow are unknown. | P1 | Risk Register module specification (MOD-04) |
| GAP-SRC-003 | **8 Business Allocation pages not yet read** (Retail, Corporate, CLAPI variants, Non-Medical). Allocation business rules and routing logic are unknown. | P1 | Allocation sub-module specification |
| GAP-SRC-004 | **Medical Underwriting pages not yet read** (Business_Medical_UW.aspx, Business_UW_TAT.aspx). UW review rules and TAT measurement are unknown. | P1 | UW sub-module specification |
| GAP-SRC-005 | **Activity_Tracking_Ret.aspx not yet read.** Retail activity tracking purpose and business rules unknown. | P3 | Retention module specification |
| GAP-SRC-006 | **Agent_info.aspx not yet read.** Agent information management rules unknown. | P2 | Agent management specification |
| GAP-SRC-007 | **Password_Config.aspx not yet read.** Whether the configurable password settings in TBL_MIS_CRM_PASSWORD_CONF are actually enforced anywhere is unknown. | P2 | Authentication specification completeness |
| GAP-SRC-008 | **All Renewal pages not yet read** (multi-page renewal workflow). Renewal business rules, SP calls, and state machine unknown. | P1 | Renewals module specification |
| GAP-SRC-009 | **Reports.aspx.vb partially read.** Full report-loading logic, session parameter passing, and report download/export flows not fully confirmed. | P3 | Reporting module specification |
| GAP-SRC-010 | **DataManagement.vb.exclude not compared to active DocManage.vb.** Whether excluded version contains different or additional business logic not in the active version is unknown. | P2 | DAL completeness |
| GAP-SRC-011 | **DocumentManagement.vb.exclude not compared to active code.** Same risk as above for document management logic. | P2 | Document management completeness |
| GAP-SRC-012 | **Accounts.ascx user control not analysed.** Business function of this control is unknown. | P3 | Unknown scope |
| GAP-SRC-013 | **Business_Status_CarePay.aspx not analysed.** CarePay integration scope and business rules unknown. | P2 | Payment integration scope |
| GAP-SRC-014 | **ErrorLogs/Error_Logs.txt (929KB) not analysed.** Active errors in production indicate in-flight data integrity issues. Content and patterns unknown. | P2 | Data quality / migration risk |

---

## Category D — Integration Gaps

| Gap ID | Description | Priority | Blocking What |
|---|---|---|---|
| GAP-INT-001 | **eOxegen integration completely unknown.** 7+ Crystal Reports imply active data exchange, but integration method, direction, frequency, data elements, and current production status are entirely unknown. | P1 | Integration design, data migration scope |
| GAP-INT-002 | **ACCPAC/Sage 300 integration completely unknown.** Audit/interface reports imply a financial reconciliation process, but integration method and data flows are unknown. | P1 | Financial integration design |
| GAP-INT-003 | **F:\mount_location mount point unknown.** Referenced in web.config as MountedCsvDirectory. What is mounted, by which server, and for what purpose is unknown. | P2 | Infrastructure and file storage design |
| GAP-INT-004 | **RENEWAL ADVICE document generation mechanism unknown.** No source code found that populates /RENEWAL ADVICE directory. May be a Crystal Report scheduled export, a separate application, or a batch job. | P2 | Renewal advice automation |
| GAP-INT-005 | **EXCEL UPLOADS business rules unknown.** What data format, column mapping, and validation rules apply to Excel uploads. What SP processes the imported data. | P2 | Data import specification |
| GAP-INT-006 | **Notifications_SetUp table — full message type list unknown.** Only 8 message types (001–008) confirmed from source. Additional message types may exist. | P3 | Notification system completeness |
| GAP-INT-007 | **CarePay integration scope unknown.** Business_Status_CarePay.aspx exists but has not been analysed. CarePay is a mobile health payment platform — the integration direction and data elements are unknown. | P2 | Payment integration specification |
| GAP-INT-008 | **COM port name for SMS modem not found in configuration.** The port (COM1, COM3, etc.) is expected to be in a config file or hardcoded — not yet found. | P3 | Infrastructure migration documentation |

---

## Category E — Business Rules — Modules with No ASPX Pages in /Legacy/CRM

> **Updated 2026-08-17:** Business stakeholder provided a navigation map (DISC-008). Cross-referencing reveals ~47 navigable pages outside /Legacy/CRM. Several gaps below are now partially or fully resolved.

| Gap ID | Description | Priority | Status |
|---|---|---|---|
| GAP-MOD-001 | **Claims module has no pages in navigation map or /Legacy/CRM.** sp_Claims_Process_Action, sp_Claims_Approval_Action confirmed; 15 Crystal Reports exist. No UI found. Claims likely processed in eOxegen (core PAS). | P1 | **OPEN — business must confirm if claims are in eOxegen** |
| GAP-MOD-002 | **Commissions — no full module UI.** RESOLVED: /Commission_run.aspx under Settings is a batch trigger only. Commission calculation is SP-driven. 8 Crystal Reports are the output. No CRUD module UI exists. | P2 | **RESOLVED — scope confirmed: SP-driven, Settings trigger** |
| GAP-MOD-003 | **Debtors = Committal Tracking.** RESOLVED: /Committal_Tracking.aspx is the single Debtors page. In the other application (not /Legacy/CRM). 9 Crystal Reports are the reporting face. | P2 | **RESOLVED — scope confirmed: 1 page in other app** |
| GAP-MOD-004 | **Complaint Tracking module pages confirmed** in navigation map: /Complaint_On_Status.aspx, /Complain_Escalated_View.aspx, /Complaint_Tracking.aspx. All in other application. Business rules still unknown. | P2 | **SCOPE CONFIRMED — source not accessible** |
| GAP-MOD-005 | **Off-System Cases confirmed** in navigation map: 6 pages (/Off_System_DPI.aspx, /Off_System_IP.aspx, and 4 others). All in other application. Business rules still unknown. | P2 | **SCOPE CONFIRMED — source not accessible** |
| GAP-MOD-006 | **Coverage Management module.** SP_MIS_CRM_COV_* and SP_MIS_CRM_HPC_* SPs confirmed. No navigation menu entry found — may be a sub-function of Off-System Cases or embedded in Claims (eOxegen). | P2 | **OPEN — location unclear** |
| GAP-MOD-007 | **Other application scope (~47 pages).** Navigation map confirms a second application tier with 47 pages not in /Legacy/CRM. Source code for this application is NOT in /Legacy and has not been provided. | P1 | **OPEN — source of second application required** |
| GAP-MOD-008 | **Premium Refund module (NEW).** 6 pages confirmed in navigation: /Refund_New.aspx, /Refund_Status.aspx, /Refund_Allocated.aspx, /Refund_Dispatch.aspx, /Refund_From_Decline.aspx, /Refund_Bank_Recon.aspx. All in other application. Previously completely unknown. | P1 | **NEW GAP — no source, no SPs identified, no specification** |
| GAP-MOD-009 | **Retail Renewals module (NEW).** 6 pages in navigation outside /Legacy/CRM. /NET_Pre_Renewal_list_MR.aspx, /Renewal_preparation.aspx, /Retail_Renewal_Loading.aspx, /Retail_Renewal_Data_Upload.aspx, and others. | P1 | **NEW GAP — source not accessible** |
| GAP-MOD-010 | **Retail BenchMarks module (NEW).** 3 pages: /New_RET_Followup.aspx, /Approver_Renewal.aspx, /Retail_Management.aspx. All in other application. | P2 | **NEW GAP — source not accessible** |
| GAP-MOD-011 | **Non-Medical Renewal module (NEW).** 2 pages: /Non_Medical_Renewals.aspx and one other. Distinct from general renewals. In other application. | P1 | **NEW GAP — source not accessible** |
| GAP-MOD-012 | **Portfolio Management module (NEW).** 3 pages: /Production_Portfolio_NM.aspx, /Production_Portfolio_Ret.aspx, /Production_Portfolio_RS.aspx. In other application. | P2 | **NEW GAP — source not accessible** |
| GAP-MOD-013 | **Case Register module (NEW).** 1 page: /Case_Allocated_ID.aspx. Purpose and business rules completely unknown. In other application. | P2 | **NEW GAP — source not accessible** |
| GAP-MOD-014 | **Medical Underwriting (extended).** Navigation shows 2 UW pages not in /Legacy/CRM: /Member_Loading.aspx and /UWC_Register.aspx. Legacy has Business_Medical_UW.aspx and Business_UW_TAT.aspx — these appear to be different pages. | P2 | **NEW GAP — source not accessible** |
| GAP-MOD-015 | **Business_Tracking_Corp.aspx in navigation vs Business_Tracking_SME_Corp.aspx in /Legacy/CRM.** Whether these are the same page renamed or two different pages is unknown. | P3 | **NEW GAP — naming discrepancy** |

---

## Category F — Authentication and Security Gaps

| Gap ID | Description | Priority | Blocking What |
|---|---|---|---|
| GAP-SEC-001 | **Cookie security configuration unknown.** Whether HttpOnly, Secure, and SameSite flags are set on session cookies is not confirmed in web.config. | P2 | Security specification |
| GAP-SEC-002 | **Whether concurrent sessions are blocked in production.** ActiveSession tracking logic exists in source references but enforcement not confirmed. | P3 | Session management specification |
| GAP-SEC-003 | **License.fin file format and vendor details unknown.** Who issues the license, what the fields mean, and the migration path for the license mechanism are unknown. | P2 | Go-live prerequisite |
| GAP-SEC-004 | **PROFILETYPE values beyond 'ADMIN' unknown.** Whether values like 'USER', 'EXTERNAL', 'REPORTING' exist affects the authorization model design. | P2 | Authorization specification |
| GAP-SEC-005 | **SuperAdmin profile assignment restrictions.** Commented-out code suggests this was once enforced. Whether it's an active business rule is unknown. | P3 | Authorization specification |
| GAP-SEC-006 | **DaysTolockUser mechanism.** Whether automated account lock for inactive users runs and how (SQL Agent? scheduled task?) is unknown. | P2 | Authentication specification |
| GAP-SEC-007 | **TBL_MIS_CRM_PASSWORD_CONF enforcement.** Whether the configurable password settings in this table are actually read and enforced by any code, or are configuration UI only, is unknown. | P2 | Password policy specification |

---

## Category G — Orphaned and Ambiguous Files

| Gap ID | Description | Priority | Blocking What |
|---|---|---|---|
| GAP-ORF-001 | **Production_RE.aspx.vb** — code-behind without matching .aspx. Purpose, whether it was active, and whether business logic exists in it are unknown. | P3 | May affect scope |
| GAP-ORF-002 | **Approve_Renewal_List.aspx.exclude** — disabled page. Reason for exclusion unknown. May represent a deactivated business function or a work in progress. | P3 | Renewal module scope |
| GAP-ORF-003 | **AssignAdminAccessProfile_.aspx** (underscore variant) — purpose vs main AssignAdminAccessProfile.aspx is unknown. | P3 | User admin specification |
| GAP-ORF-004 | **Registration.aspx** has no code-behind file. Whether self-registration is active, what the flow is, and who can use it are unknown. | P2 | User onboarding specification |
| GAP-ORF-005 | **CN.js and James_toolkit.js** — custom JavaScript files with unknown purpose. | P4 | Frontend migration scope |

---

## Gap Summary by Priority

| Priority | Count | Category |
|---|---|---|
| P1 — CRITICAL | 22 | DB/SPs (9), Reports (2), Source pages (6), Integrations (2), Modules (3) |
| P2 — HIGH | 22 | DB (2), Reports (3), Source pages (5), Integrations (4), Security (5), Orphaned (3) |
| P3 — MEDIUM | 10 | DB (2), Reports (1), Source pages (3), Security (2), Orphaned (2) |
| P4 — LOW | 1 | Orphaned files |
| **TOTAL** | **55** | |

---

## Resolution Path

| Unblocking Action | Gaps Resolved |
|---|---|
| Establish DB connectivity (port 1433, credentials) | GAP-DB-001 through GAP-DB-011, GAP-SEC-004 |
| Obtain Crystal Reports software and open all .rpt files | GAP-RPT-001 through GAP-RPT-008 |
| Read remaining 34 Business Tracking sub-pages | GAP-SRC-001, GAP-SRC-003, GAP-SRC-004, GAP-SRC-013 |
| Read remaining 10 Risk Register pages | GAP-SRC-002 |
| Read remaining unread pages (Renewal, Agent, Activity, Password_Config, etc.) | GAP-SRC-005 through GAP-SRC-012 |
| Business interview / stakeholder workshop | GAP-INT-001, GAP-INT-002, GAP-MOD-001 through GAP-MOD-007, GAP-SEC-003, GAP-INT-007 |
| Infrastructure discovery from IT/DBA team | GAP-INT-003, GAP-INT-004, GAP-DB-008, GAP-INT-008 |
| Analyse Error_Logs.txt | GAP-SRC-014 |

---

*Document produced by: AI Engineering Agent — Discovery Validation Phase*  
*Legacy source /Legacy/CRM: READ-ONLY — no modifications made*  
*Date: 2026-08-17*
