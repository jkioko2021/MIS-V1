# Legacy Application Inventory

**Document ID:** DISC-001  
**Project:** MIS Modernization  
**Phase:** Discovery  
**Date:** 2026-08-16  
**Status:** CONFIRMED unless noted  
**Source:** Direct structural inspection of /Legacy/CRM  

---

## 1. Application Summary

| Field | Value | Classification |
|---|---|---|
| Application Name | MIS / eOxegen CRM | CONFIRMED |
| Internal Reference | MARVEL (App URL path) | CONFIRMED |
| Organization | AAR Insurance Kenya | CONFIRMED |
| Production URL | https://misreports.aar-insurance.com/marvel/ | CONFIRMED |
| Application Type | ASP.NET Web Forms — Internal Business Application | CONFIRMED |
| Primary Purpose | Insurance MIS: Business Tracking, Agent Management, Claims, Renewals, Commissions, Risk Register, Reports | CONFIRMED |
| Legacy Root Directory | /Legacy/CRM | CONFIRMED |
| Default Entry Point | Login.aspx | CONFIRMED |

---

## 2. Technology Stack

| Component | Technology | Version | Classification |
|---|---|---|---|
| Web Framework | ASP.NET Web Forms | .NET 4.0 | CONFIRMED |
| Language | VB.NET | .NET 4.0 | CONFIRMED |
| Runtime | .NET Framework | 4.0 | CONFIRMED |
| UI Component Library | Telerik RadControls for ASP.NET | 2011.1.413.40 | CONFIRMED |
| AJAX Controls | AjaxControlToolkit | Unknown | CONFIRMED |
| Reporting Engine | SAP Crystal Reports | 13.0.2000.0 | CONFIRMED |
| Primary Database | Microsoft SQL Server | Unknown version | CONFIRMED |
| Secondary Database | MISREPORTS (SQL Server) | Unknown version | CONFIRMED |
| Data Access | ADO.NET (SqlClient) + DataManagement class | Custom DAL | CONFIRMED |
| Excel Generation | Microsoft.Office.Interop.Excel | 12.0.0.0 (Office 2007) | CONFIRMED |
| Excel Alternative | NPOI library | Unknown | CONFIRMED |
| Zip Processing | Ionic.Zip (DotNetZip) | Unknown | CONFIRMED |
| Email (primary) | System.Net.Mail.SmtpClient | .NET 4.0 | CONFIRMED |
| Email (secondary) | QMailClient (MailClient.dll) | Unknown | CONFIRMED |
| SMS | SMSCOMMS via serial port modem | Custom | CONFIRMED |
| Encryption | Rijndael AES (custom MyEncryptDecrypt.vb) | Custom | CONFIRMED |
| HTML Editor | Winthusiasm.HtmlEditor | Unknown | CONFIRMED |
| Logging | log4net | 2.0.10 | CONFIRMED |
| Security Framework | Microsoft Enterprise Library (Security, Cryptography) | Unknown | CONFIRMED |
| Caching | Microsoft Enterprise Library Caching | Unknown | CONFIRMED |
| Web Server | IIS | Unknown version | INFERRED |
| OS | Windows Server | Unknown version | INFERRED |
| Charting | System.Web.DataVisualization (ASP.NET Charts) | 4.0 | CONFIRMED |
| Charting (Alt) | Telerik Chart | 2011.1.413.40 | CONFIRMED |
| JavaScript Charting | Chart.js | Bundled | CONFIRMED |

---

## 3. Application Structure Overview

```
/Legacy/CRM/
├── Login.aspx / .vb              ← Entry point
├── MasterPage.master / .vb       ← Single master page (navigation, auth guard)
├── Accounts.ascx / .vb           ← Single user control
├── [76 .aspx pages]              ← All business modules
├── App_Code/                     ← Shared classes (11 files)
├── App_Data/                     ← Publish profiles, upload temp
├── Bin/                          ← 104 compiled DLLs
├── ErrorLogs/                    ← Error_Logs.txt (929KB)
├── EXCEL UPLOADS/                ← Excel import staging
├── GeneratedReports/             ← Report output directory
├── Images/                       ← UI images
├── Office12/ Office14/           ← Office interop resources
├── RENEWAL ADVICE/               ← Renewal document output
├── Reports/                      ← 184 Crystal Reports (.rpt)
├── scripts/                      ← JavaScript + CSS files
├── packages.config               ← NuGet: log4net 2.0.10
└── web.config                    ← Application configuration
```

---

## 4. Module Discovery

The following modules were identified from page names, session variables, and stored procedure names.

| # | Module | Evidence | Pages Identified | Classification |
|---|---|---|---|---|
| 01 | Authentication | Login.aspx, logout.aspx, Verify_OTP.aspx, ChangePass.aspx | 5 | CONFIRMED |
| 02 | User Administration | UserDetails.aspx, ApproveUserDetails.aspx, AdminAudit.aspx, AdminProfile.aspx, ProfilesRoles.aspx, AssignAdminAccessProfile.aspx | 6 | CONFIRMED |
| 03 | Agent Management | Agent_info.aspx | 1 | CONFIRMED |
| 04 | Business Tracking | Business_Tracking.aspx + 34 variants | 35+ | CONFIRMED |
| 05 | Business Allocation | Business_Allocation_*.aspx, Business_Allocated_*.aspx | 8 | CONFIRMED |
| 06 | Medical Underwriting | Business_Medical_UW.aspx, Business_UW_TAT.aspx | 2 | CONFIRMED |
| 07 | Claims | SP names: sp_Claims_Process_Action, sp_Claims_Approval_Action | 0 direct | INFERRED |
| 08 | Commissions | Reports: Commission Listing, Commissions Per Agent, COMMISSIONS UPLOAD | 0 direct | INFERRED |
| 09 | Risk Register | Risk_Register_*.aspx (8 pages), Risk_Status.aspx, Risk_Rating_Client.aspx, Risk_Map_Champions.aspx | 11 | CONFIRMED |
| 10 | Reports | Reports.aspx, Reports_Page.aspx | 2 | CONFIRMED |
| 11 | Renewals | Business_Tracking_*.aspx renewal pages, SP: SP_RENEWAL_*, Reports: Renewal * | Multiple | CONFIRMED |
| 12 | Activity Tracking | Activity_Tracking_Ret.aspx | 1 | CONFIRMED |
| 13 | Settings / Password Config | Password_Config.aspx | 1 | CONFIRMED |
| 14 | Access Control | AccessDenied.aspx, AssignAdminAccessProfile.aspx | 2 | CONFIRMED |
| 15 | Registration | Registration.aspx | 1 | CONFIRMED |
| 16 | Document Management | Business_tracking_adddocs.aspx, Business_Tracking_Corporate_Docs.aspx, DocManage.vb | Multiple | CONFIRMED |
| 17 | Finance / Cashier | Business_Tracking_Finance*.aspx, sp_Business_Cashier_Action | 3 | CONFIRMED |
| 18 | Complaints | SP_MIS_CRM_COMPLAINTS_REGISTER, SP_MIS_CRM_COMMITAL_SYSTEM_MESSAGES | 0 direct | INFERRED |
| 19 | Off-System Cases | sp_MIS_CRM_Off_system_Tracking, SP_MIS_CRM_OFF_SYSTEM_MESSAGES | 0 direct | INFERRED |
| 20 | Coverage Management | SP_MIS_CRM_COV_*, SP_MIS_CRM_HPC_* | 0 direct | INFERRED |
| 21 | Welcome / Dashboard | Welcome.aspx | 1 | CONFIRMED |

> **UNKNOWN:** Some modules (Claims, Commissions, Debtors, Premium Refund, Portfolio Management, Retail BenchMarks, Production) may be implemented in pages not present in /Legacy/CRM — they may reside in a connected application (MISREPORTS server) or have been excluded. Further discovery required.

---

## 5. Master Page and Navigation

| Item | Detail | Classification |
|---|---|---|
| Master Page | MasterPage.master / MasterPage.master.vb | CONFIRMED |
| Navigation Control | Telerik RadMenu (RadMenu1) | CONFIRMED |
| Menu Source | `menuaccess` database table | CONFIRMED |
| Menu Filter | Profile-based: `PROFILEID = Session("MyProfileID")` | CONFIRMED |
| Session Guard | `CanAccessPage()` method on every page load | CONFIRMED |
| Session Timeout | 45 minutes (web.config) | CONFIRMED |
| Auto-Redirect | On session expiry → login.aspx | CONFIRMED |
| Staff-on-Call Display | Label showing on-call staff from `TBL_MIS_CRM_STAFF_ON_CALL` | CONFIRMED |

---

## 6. Data Access Layer

| Item | Detail | Classification |
|---|---|---|
| Primary DAL Class | `DataManagement` (DocManage.vb / DataManagement.vb.exclude) | CONFIRMED |
| DAL Pattern | Custom wrapper around ADO.NET SqlClient | CONFIRMED |
| DBAction Types | DataTable, DataReader, Insert, Update, Delete | CONFIRMED |
| Inline SQL | Present — string-concatenated SQL in code-behind files | CONFIRMED |
| Stored Procedures | 57+ identified stored procedures | CONFIRMED |
| Cross-DB Queries | SQL queries crossing CRM, SALES, MISREPORTS, DATA_REPOSITORY_DB_CLAPI | CONFIRMED |
| Oracle Reference | System.Data.OracleClient assembled but INFERRED unused | INFERRED |
| ODBC Reference | System.Data.Odbc imported in TwoFactorAuthentication.vb | CONFIRMED |

---

## 7. Authentication Model

| Item | Detail | Classification |
|---|---|---|
| Auth Type | Custom forms-based (NOT ASP.NET Membership) | CONFIRMED |
| Auth Guard | MasterPage.Page_Load checks Session("FullNames") | CONFIRMED |
| Login SP | AdminLogin (stored procedure) | CONFIRMED |
| Password Storage | Encrypted — Rijndael AES | CONFIRMED |
| Password Encryption Key | Hardcoded byte array in MyEncryptDecrypt.vb | CONFIRMED |
| Two-Factor Auth | OTP via SMS (TwoFactorAuthentication.vb) | CONFIRMED |
| OTP Delivery | SMS via serial modem (SMSCOMMS.vb) | CONFIRMED |
| Account Lockout | EmployeeLocked flag in Employees table | CONFIRMED |
| Account Activation | Activated flag in Employees table | CONFIRMED |
| Approval Workflow | APPROVED flag — user must be approved | CONFIRMED |
| Login Attempt Tracking | Session("Loginattempts") counter | CONFIRMED |
| Password Policy | CPasswordStrength.vb — min 6 chars, complexity rules | CONFIRMED |
| IP Capture | HTTP_X_FORWARDED_FOR / REMOTE_ADDR stored in session | CONFIRMED |
| License Check | LoadLicence() on login — reads DB parameter | CONFIRMED |

---

## 8. Authorization Model

| Item | Detail | Classification |
|---|---|---|
| Model | Profile-based role assignment | CONFIRMED |
| Profile Assignment | `AssignAdminAccessProfile.aspx` | CONFIRMED |
| Menu Access Table | `menuaccess` | CONFIRMED |
| Page Access | `CanAccessPage()` in MasterPage | CONFIRMED |
| Access Denied Page | AccessDenied.aspx | CONFIRMED |
| Profile Management | ProfilesRoles.aspx | CONFIRMED |
| Admin Profile | AdminProfile.aspx | CONFIRMED |
| Audit Trail | Add_AdminAuditTrail stored procedure | CONFIRMED |

---

## 9. Notification Services

| Service | Mechanism | Classification |
|---|---|---|
| Email | smtp.office365.com port 587, aar-alerts@aar.co.ke | CONFIRMED |
| Email Library 1 | System.Net.Mail.SmtpClient | CONFIRMED |
| Email Library 2 | QMailClient (MailClient.dll) — third party | CONFIRMED |
| Email Types | Approval, Exemption, Proposed, Finalized, New User, User Approval, Password Change, NPL Clients | CONFIRMED |
| Email Template Storage | Notifications_SetUp table in database | CONFIRMED |
| SMS | Serial port modem via AT commands (SMSCOMMS.vb) | CONFIRMED |
| SMS Limitation | 160 character max, COM port hardware dependency | CONFIRMED |
| SMTP Fallback | C:\MAILDROP pickup directory (commented out) | INFERRED |

---

## 10. File / Document Management

| Item | Detail | Classification |
|---|---|---|
| Document Class | DocManage.vb (6,362 lines) | CONFIRMED |
| Upload Control | Telerik RadUpload (RadUploadTemp directory) | CONFIRMED |
| Upload Staging | App_Data/RadUploadTemp | CONFIRMED |
| Excel Uploads | /EXCEL UPLOADS directory | CONFIRMED |
| Generated Reports | /GeneratedReports directory | CONFIRMED |
| Renewal Advice | /RENEWAL ADVICE directory | CONFIRMED |
| File Path Config | FolderPath = D:\MANAGEMENT DOCS\... (web.config) | CONFIRMED |
| Mounted CSV | MountedCsvDirectory = F:\mount_location (web.config) | CONFIRMED |

---

## 11. Error Handling and Logging

| Item | Detail | Classification |
|---|---|---|
| Error Log File | /ErrorLogs/Error_Logs.txt (929 KB, active) | CONFIRMED |
| Exception Handlers | 478 `Catch ex As Exception` blocks across .vb files | CONFIRMED |
| Error Handling Style | Mostly silent catch — exceptions swallowed without logging | CONFIRMED |
| log4net | Declared in packages.config but usage pattern not confirmed | INFERRED |
| Audit Table | Add_AdminAuditTrail stored procedure | CONFIRMED |
| Debug Mode | compilation debug="true" in web.config | CONFIRMED |

---

## 12. Key Session Variables

| Variable | Purpose | Classification |
|---|---|---|
| FullNames | Current user display name — auth guard | CONFIRMED |
| UserName | Current username | CONFIRMED |
| MyEmployeeID | Current employee ID | CONFIRMED |
| MyProfileID | Current profile/role ID — drives menu and access | CONFIRMED |
| Email | Current user email | CONFIRMED |
| emp_code | Employee code | CONFIRMED |
| ip | Client IP address | CONFIRMED |
| sessionid | Session identifier | CONFIRMED |
| DTFROM / DTTO | Active production month date range | CONFIRMED |
| INSTITUTION | Client/institution name from DB params | CONFIRMED |
| Loginattempts | Failed login counter | CONFIRMED |
| OTP / OtpGeneratedTime | Two-factor authentication OTP | CONFIRMED |
| Report_ / Reportname / SelectionFormula | Crystal Report parameters | CONFIRMED |
| DAD_* (many) | Document management state | CONFIRMED |

---

## 13. Unknown Areas Requiring Further Discovery

| Area | Gap | Priority |
|---|---|---|
| MISREPORTS Application | Separate app at 192.168.50.48 — scope unknown | HIGH |
| DATA_REPOSITORY_DB_CLAPI | Cross-DB queries reference this — schema unknown | HIGH |
| SALES database | Multiple cross-DB queries — table structure unknown | HIGH |
| Stored Procedure Bodies | 57+ SPs identified by name only — business logic inside unknown | HIGH |
| DataManagement.vb.exclude | Primary DAL is excluded — full method list unknown | HIGH |
| Production_RE.aspx.vb | Code-behind exists without matching .aspx | MEDIUM |
| Excluded Pages | Approve_Renewal_List.aspx.exclude — reason for exclusion unknown | MEDIUM |
| Scheduled Jobs | No SQL Agent jobs visible in this repository — may exist on DB server | MEDIUM |
| Debtors Module | Not visible in ASPX pages — may be in MISREPORTS | MEDIUM |
| Commission Processing | Reports exist but no dedicated ASPX pages found | MEDIUM |
| Crystal Report Data Sources | RPT file internals require Crystal to open — SQL queries inside unknown | HIGH |
| RENEWAL ADVICE directory | Populated by unknown process — batch job? | LOW |

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*Classification: SOURCE-CONFIRMED unless noted*  
*Modification of /Legacy is prohibited*
