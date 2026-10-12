---
name: MIS Legacy Discovery
description: Historical discovery of the older legacy snapshot; revalidate against the updated source
---

# MIS Legacy Discovery — Key Facts

These are historical findings from the removed older snapshot, not a current inventory.
The user has designated a newer archive as the authoritative source; consult
`Legacy/README.md` and `legacy-source-policy.md` before relying on these findings.

**Why:** Durable reference so future sessions don't re-inspect /Legacy from scratch.

## Application
- Name: MIS / eOxegen CRM — AAR Insurance Kenya
- Production URL: https://misreports.aar-insurance.com/marvel/
- Historical root: /Legacy/CRM (removed; use the updated archive identified in Legacy/README.md)
- Framework: ASP.NET Web Forms, .NET 4.0, VB.NET
- Entry: Login.aspx → MasterPage.master → 76 ASPX pages

## Key Numbers
- 76 ASPX pages, 1 master page, 1 user control
- 184 Crystal Reports v13 (.rpt binary — cannot inspect without Crystal)
- 57+ stored procedures (names known, bodies unknown — need DB access)
- 7 App_Code files active (DocManage.vb is 6,362 lines — God class)
- 4 App_Code files excluded (.exclude)
- 104 DLLs in /Bin

## Databases
- CRM: primary (encrypted conn string, Rijndael key hardcoded in MyEncryptDecrypt.vb)
- MISREPORTS: 192.168.50.48, SA account, plaintext in web.config — CRITICAL
- SALES: cross-DB SQL [SALES].[dbo].TBL_MIS_PROD_MONTHS
- DATA_REPOSITORY_DB_CLAPI: cross-DB SQL

## Critical Risks (must act before modernization)
1. web.config has plaintext email password, SA DB password, report server SA — rotate immediately
2. SMS OTP via serial port COM modem (SMSCOMMS.vb) — cannot cloud-deploy; needs SMS API replacement
3. Microsoft Office Interop for Excel — server needs Office installed; needs NPOI/EPPlus replacement
4. Rijndael AES key hardcoded in source (MyEncryptDecrypt.vb lines 24–26)
5. MsgBox() called in server-side Mail.vb line 230 (Windows Forms call on server)
6. Telerik 2011.1.413.40 — 15 years old, no upgrade path

## Auth Model
- Custom session-based (NOT ASP.NET Membership)
- SP: AdminLogin → sets Session(FullNames, UserName, MyEmployeeID, MyProfileID, etc.)
- MasterPage guards every page: Session("FullNames") null → redirect Login
- Password: Rijndael AES encrypted in DB
- 2FA: OTP via SMS modem (TwoFactorAuthentication.vb + SMSCOMMS.vb)
- Account flags: Activated, APPROVED, EmployeeLocked
- Profile-based menu: menuaccess table, filtered by Session("MyProfileID")

## Integrations
- Email: smtp.office365.com:587, aar-alerts@aar.co.ke (credentials in web.config)
- SMS: Serial COM modem (AT commands, 160 char max)
- eOxegen: unknown integration (referenced in Crystal Reports)
- ACCPAC/Sage300: reconciliation reports — protocol unknown

## Blockers for Next Phase
- Crystal Reports: need Crystal software to inspect 184 .rpt files (SQL inside is invisible)
- DB access: need test DB connection to extract 57+ stored procedure definitions
- MISREPORTS scope: separate app — unknown what modules it covers
- eOxegen/ACCPAC: integration details unknown

## Document Locations
- DISC-001: 01_Discovery/Legacy_Application_Inventory.md
- DISC-002: 01_Discovery/Legacy_Project_Inventory.md
- DISC-003: 01_Discovery/Legacy_Dependency_Inventory.md
- DISC-004: 01_Discovery/Legacy_Risk_Register.md
- DISC-005: 01_Discovery/Legacy_Configuration_Inventory.md
- DISC-006: 01_Discovery/Legacy_Integration_Inventory.md
- DISC-007: 01_Discovery/Legacy_Report_Inventory.md

**How to apply:** Before any module specification or modernization planning, read DISC-001 through DISC-007 to avoid re-discovering what is already known.
