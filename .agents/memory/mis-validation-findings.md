---
name: MIS Validation Findings
description: Critical conflicts and gaps discovered during discovery validation; affects specifications and business interviews
---

## Critical Conflicts (must resolve before spec finalisation)

**CONFLICT-005 — OTP mechanism:**
- BR-AUTH-007 (Login.aspx.vb `SendOtpToEmail()`) = 6-digit numeric via EMAIL
- DISC-006/SMSCOMMS.vb = 4-character alphanumeric via SMS modem
- These are contradictory. Business must confirm current production behaviour.
- **Why:** SMS and email OTP have different threat models and implementation paths.

**CONFLICT-006 — Password minimum length:**
- CPasswordStrength.vb class default = 6 chars
- ChangePass.aspx.vb hardcodes = 4 chars (overrides class)
- TBL_MIS_CRM_PASSWORD_CONF has configurable `Len` — but ChangePass DOES NOT read it
- Current enforced value in production = 4 chars
- **Why:** New system must enforce correct value; users may have 4-char passwords today.

**CONFLICT-008 — Four-eyes approval broken:**
- UserDetails.aspx has correct maker-checker logic (blocks self-approval)
- ApproveUserDetails.aspx ALWAYS sets CanApprove=True (both branches return True)
- Business intent confirmed; enforcement is a legacy defect
- **Why:** Compliance risk; business must be told; must fix in new system.

**CONFLICT-009 — SMTP EnableSsl=False on Office365 port 587:**
- Port 587 requires STARTTLS; EnableSsl=False may break email silently
- 478 silent catch blocks mean failures are swallowed
- Must confirm with business whether emails are actually being received
- **Why:** If broken, OTP email delivery is also broken → 2FA non-functional.

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

## Key Business Questions (VAL-004)

10 P1 questions that block specifications:
1. OTP: email or SMS?
2. Are emails received in production?
3. Password minimum length policy
4. Four-eyes defect — business awareness
5-7. Where are Claims / Commissions / Debtors screens?
8. MISREPORTS scope
9. eOxegen: what is it and how does CRM interact?
10. ACCPAC: active integration or historical?
