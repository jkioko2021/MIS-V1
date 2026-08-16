# Legacy Integration Inventory

**Document ID:** DISC-006  
**Project:** MIS Modernization  
**Phase:** Discovery  
**Date:** 2026-08-16  
**Status:** CONFIRMED unless noted  
**Source:** Direct inspection of /Legacy/CRM source, web.config, report file names  

---

## 1. Integration Overview

```
CRM Application
    │
    ├── EMAIL ──────────────► smtp.office365.com (Office 365)
    │                         aar-alerts@aar.co.ke
    │
    ├── SMS ────────────────► Serial Port COM Device (Hardware Modem)
    │                         AT Commands Protocol
    │
    ├── DATABASE (Primary) ─► CRM SQL Server
    │                         [Multiple encrypted connection strings]
    │
    ├── DATABASE (Reports) ─► MISREPORTS SQL Server (192.168.50.48)
    │                         [Plaintext SA connection]
    │
    ├── DATABASE (Cross-DB) ► [SALES].[dbo].*
    │                         [DATA_REPOSITORY_DB_CLAPI].[dbo].*
    │
    ├── EXCEL (COM) ────────► Microsoft Office (Server-installed)
    │                         Office 2007/2010 Interop
    │
    ├── EXCEL (Import) ─────► OLE DB — Jet 4.0 / ACE OLEDB 12.0
    │                         Local SQL Express (ExcelImport DB)
    │
    ├── eOxegen ────────────► Unknown integration (referenced in reports)
    │
    └── ACCPAC/Sage 300 ───► Unknown integration (referenced in reports)
```

---

## 2. Email Integration

| Property | Value | Classification |
|---|---|---|
| Purpose | User notifications, credential delivery, business alerts | CONFIRMED |
| Protocol | SMTP | CONFIRMED |
| Server | smtp.office365.com | CONFIRMED |
| Port | 587 | CONFIRMED |
| Authentication | Username/Password (NetworkCredential) | CONFIRMED |
| SSL/TLS | EnableSsl = False (potential security gap) | CONFIRMED |
| From Address | aar-alerts@aar.co.ke | CONFIRMED |
| Library 1 | System.Net.Mail.SmtpClient (.NET BCL) | CONFIRMED |
| Library 2 | QMailClient (MailClient.dll — third-party) | CONFIRMED |
| Template Storage | Notifications_SetUp database table | CONFIRMED |

### Email Trigger Types (SOURCE-CONFIRMED)

| MsgType | Purpose | Trigger |
|---|---|---|
| 001 | Approval notification | Business approval action |
| 002 | Exemption notification | Exemption action |
| 003 | Proposed notification | Business proposed |
| 004 | Finalized notification | Business finalized |
| 005 | New User | New user created |
| 006 | User Approval | User approved for system access |
| 007 | Password Change | User changes password |
| 008 | NPL Clients | Non-performing loan client alert |

### Risk Assessment — Email Integration

| Risk | Level |
|---|---|
| Email credentials exposed in web.config | CRITICAL |
| EnableSsl=False — email sent without TLS | HIGH |
| Dual email libraries — inconsistent behavior | MEDIUM |
| Password sent in plaintext in welcome email | HIGH |

### Modernization Approach

```
Legacy: System.Net.Mail → smtp.office365.com (plaintext credentials in web.config)
Modern: MailKit → SMTP via environment secret credentials + TLS enforced
Alternative: Email API (SendGrid / Resend) for reliability and deliverability
```

---

## 3. SMS Integration

| Property | Value | Classification |
|---|---|---|
| Purpose | Two-factor authentication OTP delivery | CONFIRMED |
| Mechanism | Serial port COM device (GSM modem) | CONFIRMED |
| Protocol | AT Commands over RS-232 serial port | CONFIRMED |
| Library | SMSCOMMS.vb — custom serial port class | CONFIRMED |
| Baud Rate | 9600 | CONFIRMED |
| Parity | None | CONFIRMED |
| Data Bits | 8 | CONFIRMED |
| Stop Bits | 1 | CONFIRMED |
| Handshake | RequestToSend (hardware flow control) | CONFIRMED |
| Max SMS Length | 160 characters | CONFIRMED |
| OTP Format | 4-character alphanumeric | CONFIRMED |

### Risk Assessment — SMS Integration

| Risk | Level |
|---|---|
| Hardware dependency — cannot run in cloud/container | CRITICAL |
| No failover — if modem fails, OTP delivery breaks | CRITICAL |
| No delivery confirmation mechanism | HIGH |
| 160-character limit for OTP messages | LOW |
| COM port name must be configured but no config found | HIGH |

### Modernization Approach

```
Legacy: SMSCOMMS.vb → Serial Port → GSM Modem → SMS
Modern: SMS API → Africa's Talking / Twilio / Vonage → SMS
       (Credentials via environment secrets)
```

---

## 4. Primary Database Integration (CRM)

| Property | Value | Classification |
|---|---|---|
| Database Name | CRM | CONFIRMED |
| Server | Internal — connection string encrypted | CONFIRMED |
| Authentication | SQL Server auth (user/password encrypted) | CONFIRMED |
| Connection Names | CRM (test), CRMJ, CRMy (pre/prod variants) | CONFIRMED |
| Access Method | ADO.NET SqlClient via DataManagement class | CONFIRMED |
| Pattern | Stored Procedures + inline SQL | CONFIRMED |
| Stored Procedures | 57+ identified | CONFIRMED |
| Cross-DB Access | Queries reference [SALES].[dbo].* and [DATA_REPOSITORY_DB_CLAPI].[dbo].* | CONFIRMED |

---

## 5. MISREPORTS Database Integration

| Property | Value | Classification |
|---|---|---|
| Database Name | MISREPORTS | CONFIRMED |
| Server IP | 192.168.50.48 | CONFIRMED |
| Authentication | SA account — plaintext in web.config | CONFIRMED |
| Purpose | Report data source, Crystal Reports server | CONFIRMED |
| Connection Name | MISREPORTSConnectionString | CONFIRMED |
| Crystal Reports Config | ReportServerName=MISREPORTS, ReportdatbaseName=MISREPORTS | CONFIRMED |

### Risk Assessment — MISREPORTS

| Risk | Level |
|---|---|
| SA (sysadmin) account in use | CRITICAL |
| Plaintext credentials in web.config | CRITICAL |
| Hardcoded IP address | HIGH |

---

## 6. SALES Database Integration

| Property | Value | Classification |
|---|---|---|
| Database Name | SALES | CONFIRMED |
| Access Method | Cross-database SQL: [SALES].[dbo].TBL_MIS_PROD_MONTHS | CONFIRMED |
| Purpose | Production month dates (DTFROM, DTTO session variables) | CONFIRMED |
| Server | Same SQL Server instance as CRM (cross-DB query) | INFERRED |

**Evidence:**
```sql
SELECT MIN([DATE_FROM])DATE_FROM, MIN([DATE_TO])DATE_TO 
FROM SALES.[dbo].[TBL_MIS_PROD_MONTHS] 
WHERE [MONTH_CLOSED] = 0
```
*(MasterPage.master.vb, line 67)*

---

## 7. DATA_REPOSITORY_DB_CLAPI Integration

| Property | Value | Classification |
|---|---|---|
| Database Name | DATA_REPOSITORY_DB_CLAPI | CONFIRMED |
| Access Method | Cross-database SQL | CONFIRMED |
| Purpose | CLAPI product data repository | INFERRED |
| Server | Same SQL Server instance as CRM (cross-DB query) | INFERRED |

---

## 8. Excel / OLE DB Integration

| Property | Value | Classification |
|---|---|---|
| Excel 2003 import | Provider=Microsoft.Jet.OLEDB.4.0 | CONFIRMED |
| Excel 2007+ import | Provider=Microsoft.ACE.OLEDB.12.0 | CONFIRMED |
| Excel generation | Microsoft.Office.Interop.Excel v12 (COM) | CONFIRMED |
| Excel alternative | NPOI.dll (Apache POI for .NET) | CONFIRMED |
| Import staging DB | .\SQLEXPRESS / ExcelImport | CONFIRMED |
| Upload directory | /EXCEL UPLOADS | CONFIRMED |

### Risk Assessment — Excel Integration

| Risk | Level |
|---|---|
| Office.Interop requires Microsoft Office on server | CRITICAL |
| Jet.OLEDB 4.0 — 32-bit only, not available in 64-bit environments | HIGH |
| ACE.OLEDB 12.0 — requires Access Database Engine installed | MEDIUM |
| Excel format constraints unknown — business import rules undocumented | HIGH |

---

## 9. eOxegen Integration (INFERRED)

| Property | Value | Classification |
|---|---|---|
| System Name | eOxegen | INFERRED |
| Evidence | Crystal Reports: eOxegen_Intergration_summarized.rpt (x3), eOxegen vs Accpac Amounts.rpt | INFERRED |
| Purpose | Data integration / reconciliation between eOxegen and external system | INFERRED |
| Protocol | UNKNOWN | UNKNOWN |
| Direction | UNKNOWN — import, export, or bi-directional | UNKNOWN |
| Current Status | UNKNOWN — may be active or historical | UNKNOWN |

> **UNKNOWN:** The eOxegen integration details are not visible from source code. The report names suggest data reconciliation between this CRM and an eOxegen system. Further investigation required — this may be the production core insurance system.

---

## 10. ACCPAC / Sage 300 Integration (INFERRED)

| Property | Value | Classification |
|---|---|---|
| System Name | ACCPAC (likely Sage 300 ERP) | INFERRED |
| Evidence | Crystal Report: "eOxegen vs Accpac Amounts.rpt", "Audited-Errors on Interface.rpt", "Audited-Missing On Interface.rpt" | INFERRED |
| Purpose | Financial reconciliation — amounts comparison between CRM and ACCPAC | INFERRED |
| Protocol | UNKNOWN | UNKNOWN |
| Direction | UNKNOWN | UNKNOWN |
| Current Status | UNKNOWN | UNKNOWN |

> **UNKNOWN:** ACCPAC appears to be a financial ERP (Sage 300). The audit/interface reports suggest this is a regular reconciliation process. Integration method (direct DB query, flat file, API) is unknown.

---

## 11. Legacy Integration Risk Summary

| Integration | Current State | Modernization Risk | Required Action |
|---|---|---|---|
| Email (SMTP) | Working but credentials exposed | MEDIUM | Migrate to secrets; enforce TLS |
| SMS (Modem) | Hardware-dependent | CRITICAL | Replace with SMS API before cloud migration |
| CRM Database | Working but hardcoded key | HIGH | Migrate to secrets management |
| MISREPORTS Database | SA account, IP-hardcoded | CRITICAL | Least-privilege account, DNS name, secrets |
| SALES Database | Cross-DB SQL | HIGH | Replace with API/service boundary |
| DATA_REPOSITORY_DB_CLAPI | Cross-DB SQL | HIGH | Map schema, replace with API |
| Excel Import | Jet/ACE OLE DB | HIGH | Replace with NPOI/EPPlus server-side |
| Excel Export | Office COM Interop | CRITICAL | Replace with NPOI/EPPlus |
| eOxegen | UNKNOWN | UNKNOWN | Discovery required |
| ACCPAC/Sage 300 | UNKNOWN | UNKNOWN | Discovery required |

---

## 12. Unknown Integrations Requiring Further Discovery

| Area | Gap | Priority |
|---|---|---|
| eOxegen core system | How does CRM interact with the core insurance system? | HIGH |
| ACCPAC/Sage 300 | Financial reconciliation — protocol and data format | HIGH |
| Scheduled jobs | Any SQL Agent jobs, Windows Task Scheduler jobs? | HIGH |
| File system mounts | F:\mount_location — what is mounted and by whom? | MEDIUM |
| Notification_SetUp table | Full list of message types and their triggers | MEDIUM |
| RENEWAL ADVICE directory | What process generates files in this directory? | MEDIUM |

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*Classification: SOURCE-CONFIRMED unless noted*  
*Modification of /Legacy is prohibited*
