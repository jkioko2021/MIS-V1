# Legacy Dependency Inventory

**Document ID:** DISC-003  
**Project:** MIS Modernization  
**Phase:** Discovery  
**Date:** 2026-08-16  
**Status:** CONFIRMED unless noted  
**Source:** /Legacy/CRM/Bin, web.config, packages.config, source inspection  

---

## 1. Dependency Map Overview

```
CRM Application
    │
    ├── .NET Framework 4.0                   [RUNTIME]
    │
    ├── ASP.NET Web Forms                    [WEB FRAMEWORK]
    │
    ├── ADO.NET SqlClient                    [DATABASE]
    │   └── SQL Server (CRM, SALES, MISREPORTS, DATA_REPOSITORY_DB_CLAPI)
    │
    ├── Crystal Reports 13.0.2000.0          [REPORTING]
    │   └── 184 .rpt files
    │
    ├── Telerik RadControls 2011.1.413.40    [UI COMPONENTS]
    │   ├── RadMenu (navigation)
    │   ├── RadUpload (file upload)
    │   └── RadChart (charting)
    │
    ├── AjaxControlToolkit                   [AJAX]
    │
    ├── Microsoft Enterprise Library         [SECURITY/CACHING]
    │   ├── Security.Cryptography
    │   ├── Caching
    │   ├── Data
    │   ├── ExceptionHandling
    │   ├── Logging
    │   ├── Validation
    │   └── PolicyInjection
    │
    ├── Microsoft.Office.Interop.Excel 12.0  [EXCEL]
    │   └── Requires Microsoft Office on server
    │
    ├── NPOI                                 [EXCEL ALTERNATIVE]
    │
    ├── Ionic.Zip (DotNetZip)               [ZIP]
    │
    ├── MailClient.dll (QMailClient)         [EMAIL]
    │
    ├── Winthusiasm.HtmlEditor               [HTML EDITING]
    │
    ├── log4net 2.0.10                       [LOGGING]
    │
    ├── System.Net.Mail (BCL)                [EMAIL]
    │
    ├── System.Web.DataVisualization         [CHARTING]
    │
    └── SMS Modem (Hardware)                 [SMS]
        └── Serial port COM device
```

---

## 2. Framework and Runtime Dependencies

| Dependency | Version | Type | Source | Risk |
|---|---|---|---|---|
| .NET Framework | 4.0 | Runtime | Microsoft | HIGH — EOL; must be replaced |
| ASP.NET Web Forms | 4.0 | Web Framework | Microsoft | HIGH — EOL; must be replaced |
| VB.NET | 4.0 | Language | Microsoft | HIGH — Rewrite required |
| IIS | Unknown | Web Server | Microsoft | MEDIUM — Replaced by modern hosting |
| Windows Server | Unknown | OS | Microsoft | MEDIUM — Replaced by Linux/container |

---

## 3. Third-Party Library Dependencies (Bin/)

### 3.1 UI Components

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| Telerik.Web.UI.dll | 2011.1.413.40 | RadMenu, RadUpload, RadChart, RadEditor | CRITICAL | 15-year-old library — no modern equivalent path; must be replaced with modern components |
| AjaxControlToolkit.dll | Unknown | ASP.NET AJAX controls | HIGH | Must be replaced |

**Source:** → **Telerik.Web.UI.dll** → Navigation, uploads, charting  
**Risk:** Telerik v2011 is 15 years old. Licensed software. No upgrade path without repurchase and significant rewrite.

### 3.2 Reporting

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| CrystalDecisions.CrystalReports.Engine.dll | 13.0.2000.0 | Crystal Reports rendering engine | CRITICAL | 184 reports — requires full replacement |
| CrystalDecisions.Web.dll | 13.0.2000.0 | Crystal Reports web viewer | CRITICAL | CrystalImageHandler.aspx dependency |
| CrystalDecisions.Shared.dll | 13.0.2000.0 | Crystal Reports shared objects | CRITICAL | |
| CrystalDecisions.ReportSource.dll | 13.0.2000.0 | Report source handling | CRITICAL | |
| CrystalDecisions.ReportAppServer.Controllers.dll | 13.0.2000.0 | Report app server | CRITICAL | |
| CrystalDecisions.ReportAppServer.DataDefModel.dll | 13.0.2000.0 | Data definition model | CRITICAL | |
| CrystalDecisions.ReportAppServer.ClientDoc.dll | 13.0.2000.0 | Client document | CRITICAL | |

**Source:** → **CrystalDecisions.*** → Reports.aspx → 184 .rpt files  
**Risk:** SAP Crystal Reports 13 is not supported on modern .NET. All 184 reports must be re-specified and rebuilt.

### 3.3 Excel Processing

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| Microsoft.Office.Interop.Excel.dll | 12.0.0.0 (Office 2007) | Excel generation via COM automation | CRITICAL | Requires Microsoft Office installed on server |
| Microsoft.Vbe.Interop.dll | 12.0.0.0 | VBA editor interop | HIGH | COM dependency |
| office.dll | 12.0.0.0 | Office interop base | HIGH | COM dependency |
| stdole.dll | 7.0.3300.0 | OLE standard | HIGH | COM dependency |
| App_Licenses.dll | Unknown | Office license assembly | HIGH | |
| NPOI.dll | Unknown | Apache POI for .NET — Excel without Office | LOW | Modern replacement candidate |
| Interop.Microsoft.Office.Core.dll | Unknown | Office Core interop | HIGH | COM dependency |

**Source:** → **Office Interop** → Excel upload/generation features  
**Risk:** Microsoft.Office.Interop requires Office installed on server — unsupported in cloud/container environments. NPOI is already present as an alternative.

### 3.4 Security and Enterprise Library

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| Microsoft.Practices.EnterpriseLibrary.Security.Cryptography.dll | Unknown | Cryptography provider | MEDIUM | Replace with .NET built-in |
| Microsoft.Practices.EnterpriseLibrary.Security.dll | Unknown | Security framework | MEDIUM | Replace with modern auth |
| Microsoft.Practices.EnterpriseLibrary.Data.dll | Unknown | Data access patterns | MEDIUM | Replace with EF/Dapper |
| Microsoft.Practices.EnterpriseLibrary.Caching.dll | Unknown | Application caching | MEDIUM | Replace with IMemoryCache |
| Microsoft.Practices.EnterpriseLibrary.Logging.dll | Unknown | Structured logging | MEDIUM | Replace with Serilog/NLog |
| Microsoft.Practices.EnterpriseLibrary.Validation.dll | Unknown | Validation framework | LOW | Replace with FluentValidation |
| Microsoft.Practices.EnterpriseLibrary.ExceptionHandling.dll | Unknown | Exception policies | LOW | Replace with middleware |
| Microsoft.Practices.EnterpriseLibrary.PolicyInjection.dll | Unknown | Policy injection / AOP | LOW | Not needed in modern arch |
| Microsoft.Practices.ObjectBuilder.dll | Unknown | Dependency injection | LOW | Replace with native DI |
| *(multiple .Configuration.Design.dll)* | Unknown | Design-time config | LOW | Not needed at runtime |

### 3.5 Email

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| MailClient.dll (QMailClient) | Unknown | Third-party SMTP client | MEDIUM | Replace with modern SMTP library |
| System.Net.Mail | .NET 4.0 BCL | SMTP email sending | LOW | Replace with MailKit |

**Source:** → **Mail.vb / DocManage.vb** → smtp.office365.com → aar-alerts@aar.co.ke

### 3.6 File and Zip Processing

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| Ionic.Zip.dll (DotNetZip) | Unknown | ZIP file creation/extraction | LOW | Replace with System.IO.Compression |

### 3.7 HTML Editing

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| Winthusiasm.HtmlEditor.dll | Unknown | Server-side HTML editor | MEDIUM | Replace with modern rich text editor |

### 3.8 Database Client

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| System.Data.SqlClient.dll | Custom/override | SQL Server client | LOW | Replace with Microsoft.Data.SqlClient or EF Core |

### 3.9 Logging

| Library | Version | Purpose | Risk Level | Modernization Notes |
|---|---|---|---|---|
| log4net | 2.0.10 | Application logging | LOW | Replace with Serilog/NLog |

---

## 4. Database Dependencies

| Database | Connection Name | Access Method | Classification |
|---|---|---|---|
| CRM | CRM (test), CRMJ, CRMy | Encrypted ADO.NET SqlClient | CONFIRMED |
| MISREPORTS | MISREPORTSConnectionString | Plaintext ADO.NET SqlClient (192.168.50.48) | CONFIRMED |
| SALES | Inline cross-DB SQL: [SALES].[dbo].* | Cross-database SQL queries | CONFIRMED |
| DATA_REPOSITORY_DB_CLAPI | Inline cross-DB SQL: [DATA_REPOSITORY_DB_CLAPI].[dbo].* | Cross-database SQL queries | CONFIRMED |
| ExcelImport | conString (.\SQLEXPRESS) | Local SQL Express — Excel import | CONFIRMED |

### 4.1 Stored Procedure Dependencies (Identified)

| Stored Procedure | Database | Purpose | Classification |
|---|---|---|---|
| AdminLogin | CRM | Authentication — validate credentials | CONFIRMED |
| Add_AdminAuditTrail | CRM | Audit trail insert | CONFIRMED |
| Add_Employee | CRM | Create new employee/user | CONFIRMED |
| UpDate_Employee | CRM | Update employee/user | CONFIRMED |
| Add_Profile | CRM | Create access profile | CONFIRMED |
| UpDate_Profile | CRM | Update access profile | CONFIRMED |
| Addapproval | CRM | Approval workflow | CONFIRMED |
| Deactivate_Signatory | CRM | Deactivate user | CONFIRMED |
| ASP_ExecuteTable | CRM | Generic table execution | CONFIRMED |
| SP_UPDATE_EMAIL | CRM | Update email address | CONFIRMED |
| sp_Business_MEDUW_Action | CRM | Medical underwriting business action | CONFIRMED |
| sp_Business_Policy_Action | CRM | Policy document action | CONFIRMED |
| sp_Business_update_Action | CRM | Business update action | CONFIRMED |
| sp_Business_Cashier_Action | CRM | Cashier/finance action | CONFIRMED |
| SP_MIS_CRM_CREDIT_NOTES | CRM | Credit notes management | CONFIRMED |
| sp_Claims_Process_Action | CRM | Claims processing | CONFIRMED |
| sp_Claims_Approval_Action | CRM | Claims approval | CONFIRMED |
| sp_Business_Mship_Action | CRM | Membership business action | CONFIRMED |
| sp_Business_Tracking_Action | CRM | Business tracking action | CONFIRMED |
| SP_MIS_CRM_MSHIP_REALLOCATE | CRM | Membership reallocation | CONFIRMED |
| sp_IP_Claim_Issues | CRM | In-patient claim issues | CONFIRMED |
| SP_TRACKING_IP_CLAIM_MESSAGES | CRM | In-patient claim tracking messages | CONFIRMED |
| SP_TRACKING_PNI_CLAIM_MESSAGES | CRM | PNI claim tracking messages | CONFIRMED |
| SP_TRACKING_CLAIM_MESSAGES | CRM | General claim messages | CONFIRMED |
| SP_MIS_CRM_COV_MEMBER_RESULTS | CRM | Coverage member results | CONFIRMED |
| SP_MIS_CRM_COV_MEMBER_PROV | CRM | Coverage member providers | CONFIRMED |
| SP_MIS_CRM_COV_MEMBER_COST | CRM | Coverage member costs | CONFIRMED |
| SP_MIS_CRM_HPC_MEMBER_FOLLOWUP | CRM | HPC member follow-up | CONFIRMED |
| SP_MIS_CRM_HPC_MEMBER_COMORB | CRM | HPC member comorbidities | CONFIRMED |
| SP_MIS_CRM_COV_MEMBER_COMORB | CRM | Coverage member comorbidities | CONFIRMED |
| SP_MIS_CRM_PREAUTH_MESSAGES | CRM | Pre-authorization messages | CONFIRMED |
| SP_MIS_CRM_OFF_SYSTEM_MESSAGES | CRM | Off-system case messages | CONFIRMED |
| SP_MIS_CRM_COMMITAL_SYSTEM_MESSAGES | CRM | Committal/system messages | CONFIRMED |
| SP_MIS_CRM_IP_SCHEDULE_MESSAGES | CRM | In-patient schedule messages | CONFIRMED |
| SP_MIS_CRM_IP_DOC_MESSAGES | CRM | In-patient document messages | CONFIRMED |
| SP_MIS_CRM_HPC_MESSAGES | CRM | HPC messages | CONFIRMED |
| SP_MIS_CRM_COV_MESSAGES | CRM | Coverage messages | CONFIRMED |
| SP_TRACKING_MESSAGES | CRM | Tracking messages | CONFIRMED |
| SP_UPDATE_RETENTION_DOC | CRM | Update retention document | CONFIRMED |
| sp_Retention_ACTIVITY_REV | CRM | Retention activity revision | CONFIRMED |
| sp_Retention_ACTIVITY | CRM | Retention activity | CONFIRMED |
| SP_CR_CREATION | CRM | Credit note creation | CONFIRMED |
| SP_REGISTER_BUSINESS | CRM | Register new business | CONFIRMED |
| SP_update_loading | CRM | Update loading | CONFIRMED |
| sp_MIS_CRM_Committal_enrichment | CRM | Committal enrichment | CONFIRMED |
| SP_MIS_CRM_COMPLAINTS_REGISTER | CRM | Complaints registration | CONFIRMED |
| sp_MIS_CRM_Off_system_Tracking | CRM | Off-system case tracking | CONFIRMED |
| sp_MIS_CRM_Committal_Tracking | CRM | Committal tracking | CONFIRMED |
| sp_MIS_CRM_HPC_Register | CRM | HPC registration | CONFIRMED |
| sp_MIS_CRM_Cov_Register | CRM | Coverage registration | CONFIRMED |
| sp_MIS_CRM_Business_Tracking | CRM | Business tracking | CONFIRMED |
| SP_UPATE_PROPOSER_RENEWAL_LIST | CRM | Update proposer renewal list | CONFIRMED |
| SP_RENEWAL_TOTAL_REVISE | CRM | Revise renewal totals | CONFIRMED |
| SP_REN_CLAIMS_UPDATE_C | CRM | Renewal claims update (C) | CONFIRMED |
| SP_REN_CLAIMS_UPDATE_NCD | CRM | Renewal NCD claims update | CONFIRMED |
| SP_RENEWAL_TOTAL | CRM | Renewal totals | CONFIRMED |
| SP_UPLOAD_RENEWAL_LIST_CRM | CRM | Upload renewal list | CONFIRMED |
| sp_MIS_CRM_Reallocate_Agent | CRM | Agent reallocation | CONFIRMED |
| SP_ENROLL_CORPORATE_BUSINESS | CRM | Corporate business enrolment | CONFIRMED |
| LoadParamz | CRM | Load system parameters | CONFIRMED |

> **UNKNOWN:** Additional stored procedures likely exist. Only those called from DocManage.vb and Login.aspx.vb were identified. Stored procedures called via inline SQL or from MISREPORTS DB are not yet catalogued.

---

## 5. Hardware Dependencies

| Dependency | Type | Purpose | Risk Level | Classification |
|---|---|---|---|---|
| Serial Port COM Device | Hardware | SMS modem — OTP delivery and notifications | CRITICAL | CONFIRMED |
| Microsoft Office | Software (server-installed) | Excel generation via Interop | CRITICAL | CONFIRMED |
| Windows Server | OS | IIS hosting, COM, file system paths | HIGH | CONFIRMED |
| File System Paths | Infrastructure | D:\MANAGEMENT DOCS\..., F:\mount_location | HIGH | CONFIRMED |
| C:\MAILDROP | File system | SMTP mail pickup directory (commented out) | LOW | CONFIRMED |

---

## 6. External Service Dependencies

| Service | Purpose | Protocol | Endpoint | Classification |
|---|---|---|---|---|
| smtp.office365.com | Email sending | SMTP/TLS port 587 | smtp.office365.com | CONFIRMED |
| MISREPORTS SQL Server | Reporting database | SQL Server | 192.168.50.48 | CONFIRMED |
| eOxegen Integration | External data source — referenced in Crystal Reports | Unknown | Unknown | INFERRED |
| ACCPAC | Financial system — referenced in report name "eOxegen vs Accpac Amounts.rpt" | Unknown | Unknown | INFERRED |

---

## 7. Dependency Risk Summary

| # | Dependency | Risk | Modernization Impact |
|---|---|---|---|
| 1 | SMS via Serial Port Modem | CRITICAL | Hardware dependency — cannot run in cloud; must replace with SMS API (e.g. Africa's Talking, Twilio) |
| 2 | Microsoft Office Interop | CRITICAL | Cannot run in container/cloud without Office installed on server; replace with NPOI/EPPlus |
| 3 | Crystal Reports 13 | CRITICAL | 184 reports to re-specify and rebuild in modern framework |
| 4 | Telerik RadControls 2011 | CRITICAL | 15-year-old UI library — all controls must be replaced |
| 5 | .NET Framework 4.0 | CRITICAL | EOL — entire platform migration required |
| 6 | ASP.NET Web Forms | CRITICAL | Architecture pattern being retired |
| 7 | VB.NET | HIGH | Full language migration to C#/TypeScript |
| 8 | Hardcoded Rijndael Key | HIGH | Security risk — key in source code |
| 9 | Cross-database SQL | HIGH | Tight DB coupling — must be replaced with API boundaries |
| 10 | Enterprise Library | MEDIUM | Replace with modern .NET equivalents |
| 11 | Dual jQuery versions | MEDIUM | Consolidate — pick one version |
| 12 | QMailClient DLL | MEDIUM | Unknown provenance — replace with MailKit |
| 13 | Winthusiasm.HtmlEditor | MEDIUM | Obscure library — replace with Quill/TinyMCE |
| 14 | log4net | LOW | Replace with Serilog |
| 15 | Ionic.Zip | LOW | Replace with System.IO.Compression |

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*Classification: SOURCE-CONFIRMED unless noted*  
*Modification of /Legacy is prohibited*
