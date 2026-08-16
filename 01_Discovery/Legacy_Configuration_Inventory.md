# Legacy Configuration Inventory

**Document ID:** DISC-005  
**Project:** MIS Modernization  
**Phase:** Discovery  
**Date:** 2026-08-16  
**Status:** CONFIRMED unless noted  
**Source:** /Legacy/CRM/web.config, /Legacy/CRM/packages.config  

> ⚠️ **SECURITY NOTICE:** This document records configuration structure and key names only.  
> Actual credential values discovered in web.config have been recorded for modernization planning purposes.  
> These credentials MUST be treated as compromised — they exist in source code.  
> All credentials must be rotated immediately and managed via secrets management in the new system.

---

## 1. web.config Overview

| Property | Value | Classification |
|---|---|---|
| File | /Legacy/CRM/web.config | CONFIRMED |
| Encoding | UTF-8 | CONFIRMED |
| Configuration Sections | securityCryptographyConfiguration, businessObjects/crystalReports, standard system.web, system.net, system.webServer | CONFIRMED |

---

## 2. Compilation Settings

| Setting | Value | Classification | Risk |
|---|---|---|---|
| debug | true | CONFIRMED | HIGH — Debug mode active; should be false in production |
| targetFramework | 4.0 | CONFIRMED | HIGH — .NET 4.0; EOL |
| controlRenderingCompatibilityVersion | 3.5 | CONFIRMED | LOW — Legacy rendering mode |
| clientIDMode | AutoID | CONFIRMED | LOW — May complicate jQuery selectors |

---

## 3. HTTP Runtime Settings

| Setting | Value | Classification | Notes |
|---|---|---|---|
| maxRequestLength | 2048000 (KB) | CONFIRMED | ~2GB max request — very large; for Excel/document upload |
| executionTimeout | 4500 seconds | CONFIRMED | 75 minutes — very long; for large report generation |

---

## 4. Session Configuration

| Setting | Value | Classification | Notes |
|---|---|---|---|
| Session Timeout | 45 minutes | CONFIRMED | web.config sessionState element |
| Session Mode | InProc (default — not overridden) | INFERRED | Single-server session |

---

## 5. Connection Strings

> ⚠️ Connection string values are encrypted (Rijndael AES) except where noted. Key is hardcoded in MyEncryptDecrypt.vb.

| Name | Value/Description | Provider | Classification | Risk |
|---|---|---|---|---|
| CRMJ | Encrypted — named "pre" in comment | System.Data.SqlClient | CONFIRMED | HIGH — encrypted with hardcoded key |
| CRMy | Encrypted — named "pre" in comment | System.Data.SqlClient | CONFIRMED | HIGH — encrypted with hardcoded key |
| CRM | Encrypted — named "test" in comment | System.Data.SqlClient | CONFIRMED | HIGH — encrypted with hardcoded key |
| MISREPORTSConnectionString | Data Source=192.168.50.48; Initial Catalog=MISREPORTS; User ID=sa | System.Data.SqlClient | CONFIRMED | CRITICAL — plaintext SA credentials |
| Excel03ConString | Provider=Microsoft.Jet.OLEDB.4.0 — Excel 2003 | OLE DB | CONFIRMED | MEDIUM — legacy OLE DB provider |
| Excel07ConString | Provider=Microsoft.ACE.OLEDB.12.0 — Excel 2007 | OLE DB | CONFIRMED | LOW |
| conString | Data Source=.\SQLEXPRESS; database=ExcelImport | System.Data.SqlClient | CONFIRMED | LOW — local SQL Express for imports |

**Modern Replacement Required:**

```
# New system — environment secrets (no values in source):
DB_HOST=<secret>
DB_PORT=<secret>
DB_NAME=<secret>
DB_USER=<secret>
DB_PASSWORD=<secret>
MISREPORTS_DB_HOST=<secret>
MISREPORTS_DB_NAME=<secret>
MISREPORTS_DB_USER=<secret>
MISREPORTS_DB_PASSWORD=<secret>
```

---

## 6. Application Settings (AppSettings)

> ⚠️ Email credentials visible in plaintext in web.config. Must be rotated and stored as secrets.

| Key | Value (Sanitized) | Classification | Risk |
|---|---|---|---|
| ReportServerName_ | eoxegen | CONFIRMED | LOW |
| ReportdatbaseName_ | eoxegen | CONFIRMED | LOW |
| ReportServerName | MISREPORTS | CONFIRMED | LOW |
| ReportdatbaseName | MISREPORTS | CONFIRMED | LOW |
| ReportUsername | sa | CONFIRMED | CRITICAL — SA account |
| ReportPassword | [REDACTED — visible in source] | CONFIRMED | CRITICAL — must rotate |
| SourceUid | sa | CONFIRMED | CRITICAL — SA account |
| SourcePwd | [REDACTED — visible in source] | CONFIRMED | CRITICAL — must rotate |
| EmailAddress | aar-alerts@aar.co.ke | CONFIRMED | LOW |
| EmailServer | smtp.office365.com | CONFIRMED | LOW |
| EmailUsername | aar-alerts@aar.co.ke | CONFIRMED | LOW |
| EmailPassword | [REDACTED — visible in source] | CONFIRMED | CRITICAL — must rotate |
| LoginDisplayName | BUSINESS TRACKING | CONFIRMED | LOW |
| LoginSubject | STATUS UPDATE | CONFIRMED | LOW |
| Subject | BUSINESS TRACKING | CONFIRMED | LOW |
| LoginFromEmail | aar-alerts@aar.co.ke | CONFIRMED | LOW |
| EmailServer (duplicate) | smtp.office365.com | CONFIRMED | MEDIUM — duplicate key |
| EmailAddress1 | aar-alerts@aar.co.ke | CONFIRMED | LOW |
| EmailUsername1 | aar-alerts@aar.co.ke | CONFIRMED | LOW |
| EmailPassword1 | [REDACTED — same as EmailPassword] | CONFIRMED | CRITICAL |
| LoginFromEmail1 | aar-alerts@aar.co.ke | CONFIRMED | LOW |
| LoginDisplayName1 | AAR Insurance Kenya | CONFIRMED | LOW |
| LoginSubject1 | MIS Access Credentials | CONFIRMED | LOW |
| Subject1 | UPDATE | CONFIRMED | LOW |
| MountedCsvDirectory | F:\mount_location | CONFIRMED | HIGH — hardcoded Windows path |
| PortNo | 587 | CONFIRMED | LOW |
| AppURL | https://misreports.aar-insurance.com/marvel/ | CONFIRMED | LOW |
| ChartImageHandler | storage=file;timeout=20; | CONFIRMED | LOW |
| CrystalImageCleaner-AutoStart | true | CONFIRMED | LOW |
| CrystalImageCleaner-Sleep | 60000 ms | CONFIRMED | LOW |
| CrystalImageCleaner-Age | 120000 ms | CONFIRMED | LOW |
| FolderPath | D:\MANAGEMENT DOCS\EFFECIENCY DEPARTMENT\SALES/ | CONFIRMED | HIGH — hardcoded Windows path |

---

## 7. Email / SMTP Configuration

| Setting | Value | Classification |
|---|---|---|
| SMTP Server | smtp.office365.com | CONFIRMED |
| Port | 587 | CONFIRMED |
| From Address | aar-alerts@aar.co.ke | CONFIRMED |
| Display Name | AAR Insurance Kenya / FINMIS USER | CONFIRMED |
| SSL | Disabled (EnableSsl = False) | CONFIRMED |
| Auth | NetworkCredential (username/password) | CONFIRMED |
| Delivery Method | SpecifiedPickupDirectory (legacy — C:\MAILDROP, commented out) | INFERRED |
| Current Delivery | Network SMTP (active) | CONFIRMED |

---

## 8. Crystal Reports Configuration

| Setting | Value | Classification |
|---|---|---|
| CrystalImageHandler | Registered as HTTP handler | CONFIRMED |
| Crystal Version | 13.0.2000.0 | CONFIRMED |
| Report Mappings | crystalReports section group | CONFIRMED |
| Image Cleaner | Auto-start, 60s sleep, 120s age | CONFIRMED |
| CrystalImageHandler path | CrystalImageHandler.aspx | CONFIRMED |

---

## 9. Telerik Configuration

| Setting | Value | Classification |
|---|---|---|
| Telerik.Web.UI.WebResource.axd | Registered HTTP handler | CONFIRMED |
| Telerik.Web.UI.DialogHandler.aspx | Registered HTTP handler | CONFIRMED |
| Telerik.Web.UI.SpellCheckHandler.axd | Registered HTTP handler | CONFIRMED |
| Telerik Chart Handler | ChartImage.axd | CONFIRMED |

---

## 10. IIS / Web Server Configuration

| Setting | Value | Classification |
|---|---|---|
| Default Document | Login.aspx | CONFIRMED |
| Integration Mode | Integrated (preCondition="integratedMode") | CONFIRMED |
| validateIntegratedModeConfiguration | false | CONFIRMED |
| ASP.NET Chart Handler | ChartImg.axd (System.Web.DataVisualization) | CONFIRMED |
| RDLC Builder | .rdlc extension → Microsoft.ReportViewer | CONFIRMED |

---

## 11. Security Configuration

| Setting | Value | Classification | Risk |
|---|---|---|---|
| securityCryptographyConfiguration | Commented out (SHA1/Rijndael via EnterpriseLibrary) | CONFIRMED | LOW — disabled |
| Forms Authentication | Not configured in web.config — custom session-based | CONFIRMED | HIGH — non-standard |
| Authorization | Not configured in web.config — custom CanAccessPage() | CONFIRMED | HIGH — non-standard |
| HTTPS | Not enforced in web.config — AppURL uses HTTPS | INFERRED | MEDIUM |
| Cookie Security | Not configured in web.config | UNKNOWN | HIGH |

---

## 12. NuGet Packages (packages.config)

| Package | Version | Target Framework | Classification |
|---|---|---|---|
| log4net | 2.0.10 | net40 | CONFIRMED |

> **NOTE:** All other libraries are binary DLLs in /Bin not managed by NuGet. No version pinning or update mechanism exists.

---

## 13. Configuration Gaps and Unknown Areas

| Gap | Impact | Priority |
|---|---|---|
| No environment separation | Single web.config for all environments | HIGH |
| No secrets management | All secrets in source-controlled file | CRITICAL |
| Crystal Reports server settings reference "eoxegen" hostname | Unknown server configuration | MEDIUM |
| Oracle client assembly referenced | OracleClient in compilation assemblies — purpose unknown | LOW |
| ReportViewer (RDLC) build provider commented out | Alternative reporting referenced but disabled | LOW |
| SA account used for MISREPORTS | No least-privilege principle applied | CRITICAL |

---

## 14. Modern Configuration Requirements (Target)

The new system must replace web.config with:

```
# Environment-specific configuration (no secrets in source)
ASPNETCORE_ENVIRONMENT=Development|Staging|Production

# Database — via secrets manager
DB_CONNECTION_STRING=<secret>

# Email — via secrets manager  
SMTP_HOST=<secret>
SMTP_PORT=<secret>
SMTP_USER=<secret>
SMTP_PASSWORD=<secret>
SMTP_FROM=<secret>

# SMS API — via secrets manager (replaces hardware modem)
SMS_API_KEY=<secret>
SMS_API_ENDPOINT=<secret>

# Storage paths — portable, environment-specific
DOCUMENT_STORAGE_PATH=<configurable>
UPLOAD_TEMP_PATH=<configurable>

# Application
APP_BASE_URL=<configurable>
SESSION_TIMEOUT_MINUTES=45
```

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*Classification: SOURCE-CONFIRMED unless noted*  
*Modification of /Legacy is prohibited*  
*All credentials discovered must be treated as compromised and rotated*
