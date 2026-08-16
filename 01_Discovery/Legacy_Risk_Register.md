# Legacy Discovery Risk Register

**Document ID:** DISC-004  
**Project:** MIS Modernization  
**Phase:** Discovery  
**Date:** 2026-08-16  
**Status:** OPEN — All risks pending formal assessment  
**Source:** Direct inspection of /Legacy/CRM  

---

## 1. Risk Classification

| Probability | Scale |
|---|---|
| HIGH | Very likely to occur or already occurring |
| MEDIUM | Possible — needs monitoring |
| LOW | Unlikely but worth recording |

| Impact | Scale |
|---|---|
| CRITICAL | Could stop the modernization or cause major data/security incident |
| HIGH | Significant rework, delay, or system compromise |
| MEDIUM | Rework required, manageable |
| LOW | Minor inconvenience |

---

## 2. Security Risks

| Risk ID | Description | Probability | Impact | Evidence | Mitigation Required |
|---|---|---|---|---|---|
| RISK-SEC-001 | **Credentials in plaintext in web.config** — Report server SA password (13291329), email password (Kut7665050!), database host (192.168.50.48), report username (sa) are visible in source | HIGH | CRITICAL | web.config lines 95–128 | Immediate: Rotate all exposed credentials. Do not commit web.config to source control. Use secrets management in new system. |
| RISK-SEC-002 | **Hardcoded AES encryption key** — Rijndael key and IV are hardcoded byte arrays in MyEncryptDecrypt.vb. Anyone with source access can decrypt all passwords | HIGH | CRITICAL | MyEncryptDecrypt.vb lines 24–26 | New system must use proper key management (environment secrets, key vault). Legacy key compromise must be assessed. |
| RISK-SEC-003 | **SA (System Administrator) account used for DB access** — MISREPORTS connection string uses SQL Server SA account | HIGH | CRITICAL | web.config line 95: User ID=sa | Replace with least-privilege service accounts in new system |
| RISK-SEC-004 | **compilation debug="true" in web.config** — Debug mode active on what may be a production server. Exposes stack traces and internal paths | HIGH | HIGH | web.config line 27 | Should have been false in production. New system must enforce environment-specific build configs |
| RISK-SEC-005 | **Password sent in plaintext email** — Mail.vb decrypts stored password and includes it in welcome/credential emails sent to users | HIGH | HIGH | Mail.vb lines 50–81, GetBeneficiary method | New system must never email passwords. Send one-time activation links only |
| RISK-SEC-006 | **SQL Injection risk — inline SQL concatenation** — Code-behind files build SQL strings using string concatenation including user input and session values | HIGH | HIGH | MasterPage.master.vb and multiple code-behind files | New system must use parameterized queries/ORM exclusively |
| RISK-SEC-007 | **No CSRF protection evident** — ASP.NET Web Forms ViewState provides partial protection but no explicit anti-CSRF tokens identified | MEDIUM | HIGH | Source inspection | New system must implement CSRF protection on all state-changing operations |
| RISK-SEC-008 | **Session-based authentication without secure cookie flags** — No HttpOnly/Secure flags confirmed on session cookies | MEDIUM | HIGH | web.config — no explicit cookie config | New system must enforce Secure + HttpOnly + SameSite on auth cookies |
| RISK-SEC-009 | **Login attempt counter in session only** — Session("Loginattempts") can be bypassed by clearing the session (opening a new browser) | MEDIUM | HIGH | Login.aspx.vb lines 145–159 | New system must persist lockout state in database, not session |
| RISK-SEC-010 | **OTP delivered via SMS serial modem** — Security of OTP depends on physical hardware device. If modem fails, authentication breaks | MEDIUM | HIGH | SMSCOMMS.vb | Replace with SMS API service with failover capability |
| RISK-SEC-011 | **Email password in App_Settings replicated twice** — EmailPassword key appears in web.config twice (lines 115, 125) with identical values | LOW | MEDIUM | web.config lines 115, 125 | Cleanup and single secret management |

---

## 3. Infrastructure and Hardware Risks

| Risk ID | Description | Probability | Impact | Evidence | Mitigation Required |
|---|---|---|---|---|---|
| RISK-INF-001 | **SMS via serial port modem cannot run in cloud/container** — SMSCOMMS.vb uses System.IO.Ports.SerialPort, which requires physical COM port hardware. This eliminates cloud/container deployment unless hardware is preserved | HIGH | CRITICAL | SMSCOMMS.vb lines 11–36 | Replace SMS modem with SMS API (Africa's Talking, Twilio, etc.) before cloud deployment |
| RISK-INF-002 | **Microsoft Office Interop requires Office installed on server** — Excel generation via COM automation cannot run without Microsoft Office physically installed on the application server | HIGH | CRITICAL | Bin/Microsoft.Office.Interop.Excel.dll v12 | Replace with NPOI (already in Bin) or EPPlus for server-side Excel generation |
| RISK-INF-003 | **Hardcoded server file paths** — D:\MANAGEMENT DOCS\..., F:\mount_location, C:\MAILDROP reference specific Windows drive letters/paths that do not exist in a modernized environment | HIGH | HIGH | web.config lines 132–133, 139 | All file paths must be externalized to configuration and use portable path conventions |
| RISK-INF-004 | **Database on known internal IP (192.168.50.48)** — MISREPORTS database connection uses hardcoded internal IP. Any network change breaks the application | HIGH | HIGH | web.config line 95 | Use DNS hostnames not IPs. Move to secrets-managed connection strings |
| RISK-INF-005 | **Cross-database SQL queries** — Queries span [CRM], [SALES], [MISREPORTS], [DATA_REPOSITORY_DB_CLAPI] in single SQL statements. These break if databases are on different servers | HIGH | HIGH | MasterPage.master.vb, multiple code files | Must be replaced with API calls or a data services layer in new architecture |
| RISK-INF-006 | **SMTP mail pickup directory** — C:\MAILDROP referenced (commented out) — suggests previous local SMTP relay | LOW | LOW | web.config line 83 | Not currently active but indicates infrastructure history |

---

## 4. Technical Debt Risks

| Risk ID | Description | Probability | Impact | Evidence | Mitigation Required |
|---|---|---|---|---|---|
| RISK-TECH-001 | **Telerik RadControls 2011 (15 years old)** — Version 2011.1.413.40 is completely unsupported. No security patches. Migration path is complex | HIGH | CRITICAL | Bin/Telerik.Web.UI.dll | All Telerik controls must be replaced with modern UI components (no upgrade path) |
| RISK-TECH-002 | **Crystal Reports 13 — 184 reports** — All 184 .rpt files are binary Crystal Reports format. Content (SQL, calculations, grouping) cannot be inspected without Crystal software | HIGH | CRITICAL | /Reports/*.rpt (184 files) | Every report must be opened, documented, and rebuilt. SQL in reports is invisible without Crystal runtime |
| RISK-TECH-003 | **jQuery 1.4.1 + 3.7.1 conflict** — Two significantly different jQuery versions are present. Unknown which version loads per-page. 1.4.1 is from 2010 and has known security vulnerabilities | HIGH | HIGH | scripts/jquery-1.4.1.js, scripts/jquery-3.7.1.js | Document which pages use which version. New system uses one current version |
| RISK-TECH-004 | **6,362-line DataManagement/DocManage class** — The primary DAL class (DocManage.vb) is 6,362 lines with 57+ distinct stored procedure call methods. This is a God class with no separation of concerns | HIGH | HIGH | DocManage.vb line count | Must be decomposed into domain-specific repositories in new system |
| RISK-TECH-005 | **Silent exception swallowing** — 478 Catch blocks found. Most catch `ex As Exception` without logging, resulting in silent failures. Error_Logs.txt is 929KB suggesting significant volume | HIGH | HIGH | 478 catch blocks, ErrorLogs/Error_Logs.txt | New system must use structured exception handling with correlation IDs |
| RISK-TECH-006 | **MsgBox() in server-side code** — Mail.vb line 230 calls MsgBox() — a Windows Forms UI function — from server-side code. This would block the server thread in any environment that shows a UI dialog | HIGH | HIGH | Mail.vb line 230: MsgBox(ex.ToString()) | Not valid in server context. Replace with proper exception handling |
| RISK-TECH-007 | **debug="true" in likely-production web.config** — Application may be running in debug mode in production, reducing performance and exposing internals | HIGH | MEDIUM | web.config line 27 | New system must have environment-specific configuration |
| RISK-TECH-008 | **Dual email sending libraries** — Both System.Net.Mail (SmtpClient) and QMailClient (MailClient.dll) are used. Inconsistent email behavior | MEDIUM | MEDIUM | Mail.vb, DocManage.vb | Standardize on one email library in new system |
| RISK-TECH-009 | **DataManagement.vb excluded** — Primary DAL file is excluded. The active code (DocManage.vb) contains both the DataManagement class and email/document classes. History of this split is unknown | MEDIUM | MEDIUM | App_Code/DataManagement.vb.exclude | Discovery must compare excluded vs active DataManagement implementation |
| RISK-TECH-010 | **No NuGet for most dependencies** — packages.config only references log4net. All other libraries are binary DLLs in /Bin with no version management | HIGH | MEDIUM | packages.config (1 package only) | Complicates version identification. Must catalogue all DLL versions before modernization |
| RISK-TECH-011 | **Production_RE.aspx.vb without matching .aspx** — Orphaned code-behind file | LOW | LOW | File listing | Investigate before modernization — may be disabled production page |

---

## 5. Business Continuity Risks

| Risk ID | Description | Probability | Impact | Evidence | Mitigation Required |
|---|---|---|---|---|---|
| RISK-BUS-001 | **Crystal Report SQL is invisible** — Business logic and calculations inside 184 .rpt files cannot be inspected without Crystal Reports software. Unknown business rules may exist in report formulas | HIGH | CRITICAL | 184 .rpt binary files | Must open each report in Crystal Reports to extract SQL, formulas, and parameters before modernization |
| RISK-BUS-002 | **Business logic spread across stored procedures** — 57+ SPs identified by name only. Their internal business rules, validations, and calculations are unknown | HIGH | CRITICAL | SP calls in DocManage.vb | Database discovery phase required — must connect to test DB and extract all SP definitions |
| RISK-BUS-003 | **MISREPORTS is a separate application** — The MISREPORTS server (192.168.50.48) appears to be a separate application or reporting system. Its scope, technology, and relationship to CRM are unknown | HIGH | HIGH | web.config line 95, report names referencing MISREPORTS | MISREPORTS must be separately inventoried |
| RISK-BUS-004 | **Excluded pages may represent deactivated business functions** — Approve_Renewal_List.aspx.exclude may be a business function that was turned off rather than properly decommissioned | MEDIUM | MEDIUM | .exclude files | Investigate reason for exclusion with business stakeholders |
| RISK-BUS-005 | **License mechanism** — LoadLicence() reads from DB parameter and may enforce application expiry. Unknown impact on migration timeline | MEDIUM | MEDIUM | Login.aspx.vb lines 311–340 | Confirm license status before modernization start |
| RISK-BUS-006 | **Unknown modules in MISREPORTS** — Commissions, Debtors, Premium Refund, Portfolio Management may be in a separate application not included in /Legacy/CRM | HIGH | HIGH | Module list vs page inventory | Scope clarification required with business stakeholders |
| RISK-BUS-007 | **eOxegen/ACCPAC integration** — Crystal Reports reference "eOxegen vs Accpac Amounts.rpt" and "eOxegen_Integration_summarized.rpt" — integration with an external system (ACCPAC = Sage 300?) | MEDIUM | HIGH | Report file names | Integration discovery required |

---

## 6. Data Risks

| Risk ID | Description | Probability | Impact | Evidence | Mitigation Required |
|---|---|---|---|---|---|
| RISK-DATA-001 | **Cross-database joins** — Business data is spread across CRM, SALES, MISREPORTS, DATA_REPOSITORY_DB_CLAPI with cross-DB SQL joins. Migration cannot be done database-by-database without breaking queries | HIGH | CRITICAL | SQL in MasterPage and code files | Must map all cross-DB dependencies before migration |
| RISK-DATA-002 | **Encrypted connection strings with hardcoded key** — If the encryption key changes, all connection strings in web.config become invalid | MEDIUM | HIGH | MyEncryptDecrypt.vb hardcoded key | Document and safely preserve decrypted connection info before modernization |
| RISK-DATA-003 | **Error log indicates active failures** — Error_Logs.txt is 929KB. Active errors in production represent unknown data integrity issues | HIGH | HIGH | ErrorLogs/Error_Logs.txt (929KB) | Read and analyse error log before migration to identify in-flight issues |
| RISK-DATA-004 | **RadUploadTemp directory** — Telerik upload temp files may contain user-uploaded documents in transit. Clearing this during migration could lose data | LOW | MEDIUM | App_Data/RadUploadTemp | Audit contents before migration |

---

## 7. Migration Risks

| Risk ID | Description | Probability | Impact | Evidence | Mitigation Required |
|---|---|---|---|---|---|
| RISK-MIG-001 | **Password encryption migration** — All user passwords are encrypted with a hardcoded Rijndael key. Migration requires either: (a) decrypting and re-hashing all passwords, or (b) a forced password reset | HIGH | HIGH | MyEncryptDecrypt.vb | Plan password migration strategy with business stakeholders |
| RISK-MIG-002 | **Session state not persisted** — Many business workflows use session variables (DAD_*, GD_*, Report_*) to pass state between pages. In-progress workflows will be lost on migration cutover | MEDIUM | MEDIUM | 130+ session variable names | Design cutover during low-usage window. Warn users before cutover |
| RISK-MIG-003 | **Excel upload data format** — EXCEL UPLOADS directory implies ongoing Excel-based data import. Format and business rules for these uploads are unknown | MEDIUM | HIGH | EXCEL UPLOADS directory, Excel connection strings | Document Excel upload formats before modernization |
| RISK-MIG-004 | **Generated report files** — GeneratedReports and RENEWAL ADVICE directories may contain current operational documents. These must not be deleted | LOW | MEDIUM | Directory listing | Archive before migration |

---

## 8. Risk Summary Matrix

| Severity | Count | Risk IDs |
|---|---|---|
| CRITICAL + HIGH probability | 8 | SEC-001, SEC-002, SEC-003, INF-001, INF-002, TECH-001, TECH-002, BUS-001 |
| CRITICAL + MEDIUM probability | 1 | BUS-002 |
| HIGH + HIGH probability | 12 | SEC-004 through SEC-009, INF-003, INF-004, INF-005, TECH-003 through TECH-006 |
| MEDIUM | 10 | Various |
| LOW | 5 | Various |

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*This is a discovery register — all risks are unmitigated and require business/technical review*  
*Modification of /Legacy is prohibited*
