---
name: MIS Validation Findings
description: Critical conflicts and gaps discovered during discovery validation; affects specifications and business interviews
---

## Critical Conflicts — RESOLVED (2026-08-17, business stakeholder)

**CONFLICT-005 — OTP mechanism: RESOLVED**
- OTP is delivered by EMAIL only (6-digit numeric via `SendOtpToEmail()`)
- SMSCOMMS.vb is legacy dead code — not used for OTP in production
- New system: email OTP with CSPRNG, 5-min expiry, retry limit

**CONFLICT-006 — Password minimum length: RESOLVED**
- Policy confirmed as 6 characters minimum
- Legacy code enforcing 4 chars in ChangePass.aspx is a DEFECT
- TBL_MIS_CRM_PASSWORD_CONF is dead configuration (no code reads it)
- Users may have 4-5 char passwords today → force change on first login to new system

**CONFLICT-008 — Four-eyes approval: RESOLVED**
- Defect confirmed; business was NOT aware
- ApproveUserDetails.aspx always grants approval = live compliance defect
- Business notified; retrospective audit of self-approvals recommended
- New system MUST enforce maker-checker correctly

**CONFLICT-009 — SMTP EnableSsl=False: RESOLVED**
- Emails ARE being received in production (confirmed by business)
- .NET SmtpClient on port 587 with EnableSsl=False works opportunistically
- New system must use MailKit with explicit STARTTLS enforcement

## Outdated Documents

**DISC-003 is outdated:** Lists 4 databases. Source code confirms 7:
CRM, MISREPORTS, SALES, DATA_REPOSITORY_DB_CLAPI, AAR_RISK_DB, COMMISSION, Doc_Arc_DB.
Must be updated. ExcelImport (.\SQLEXPRESS) is local staging, not a production DB.

## Gap Count Summary (VAL-002)

55 total gaps across discovery:
- P1 Critical: 22 (all 57+ SP bodies unknown, all 184 Crystal Report internals, 34 BT sub-pages, eOxegen/ACCPAC integration, Claims/Commissions/Debtors have no ASPX pages)
- P2 High: 22
- P3 Medium: 10
- P4 Low: 1

## Modules with No ASPX Pages Found

Claims, Commissions, Debtors, Complaints, Off-System Cases, Coverage Management — all have SP names and/or Crystal Reports but ZERO ASPX pages in /Legacy/CRM. These may be in the MISREPORTS application (192.168.50.48) which is not included in /Legacy.

## eOxegen (confirmed 2026-08-17)
- eOxegen is the core Policy Administration System (PAS)
- Data direction: eOxegen → MIS (MIS PULLS data from eOxegen; does not push back)
- Method, frequency, and data elements still unknown (GAP-INT-001 partially open)
- DATA_REPOSITORY_DB_CLAPI may be eOxegen's staging area — unconfirmed

## Navigation Map Finding (2026-08-17, DISC-008)

~76 navigation entries. Cross-ref against 76 /Legacy/CRM pages:
- ~29 navigation pages ARE in /Legacy/CRM
- ~47 navigation pages are NOT — they're in a second application (MISREPORTS or linked app)

This means there are TWO application tiers:
1. /Legacy/CRM (76 pages) — source accessible
2. Other application (~47 pages) — source NOT accessible, separate app

**Debtors RESOLVED:** = Committal Tracking (/Committal_Tracking.aspx), 1 page, in other app
**Commissions RESOLVED:** = /Commission_run.aspx (Settings), SP-driven batch trigger only
**Claims STILL UNKNOWN:** not in navigation map at all; likely processed in eOxegen

**NEW modules discovered (never in DISC-001):**
- Premium Refund (6 pages) — completely unknown, no SPs identified
- Retail Renewals (6 pages)
- Non-Medical Renewal (2 pages)
- Off System Cases (6 pages)
- Complaint Tracking (3 pages)
- Retail BenchMarks (3 pages)
- Portfolio Management (3 pages)
- Case Register (1 page)
- Log Activity / M-Tiba Push (1 page)

**Production_RE.aspx.vb orphan:** Likely maps to /Production_Ret.aspx in the other application

## Remaining P1 Business Questions
- Claims: are they processed in eOxegen? (not in MIS navigation at all)
- Source code for the other application (~47 pages) — needed to complete all module specs
- eOxegen integration method and data elements (direction confirmed, mechanism unknown)
- ACCPAC: active integration or historical?
- All Q-RR, Q-DB, Q-RPT, Q-TERM questions still open
