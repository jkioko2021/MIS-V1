# Discovery Conflict Register

**Document ID:** VAL-003  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery Validation  
**Date:** 2026-08-17  
**Status:** OPEN — All conflicts require resolution before affected specifications are finalised  
**Purpose:** Register of all contradictions, inconsistencies, and conflicting evidence found across discovery documents  

---

## Conflict Severity Classification

| Severity | Meaning |
|---|---|
| **CRITICAL** | Directly affects a security or business rule that must be correct; wrong assumption causes significant rework or security incident |
| **HIGH** | Affects a functional specification; likely to cause rework if not resolved |
| **MEDIUM** | Affects documentation accuracy; lower rework risk |
| **LOW** | Minor inconsistency; cosmetic or editorial |

---

## CONFLICT-001 — User Administration Module Page Count

**Severity:** MEDIUM  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| DISC-001 §4 (Module Discovery table) | User Administration module has **6 pages** |
| DISC-002 §2.2 (ASPX page inventory) | User Administration module lists **9 pages**: UserDetails, ApproveUserDetails, AdminAudit, AdminProfile, ProfilesRoles, AssignAdminAccessProfile, AssignAdminAccessProfile_, Password_Config, AccessDenied |

**Analysis:** DISC-002 is the primary source-of-truth for page counts (direct filesystem inventory). DISC-001 predates the detailed inventory and used a different grouping or omitted some pages. DISC-002 count of 9 is more accurate; however some pages (AccessDenied, Password_Config, AssignAdminAccessProfile_) may have been grouped differently.

**Risk:** Minor documentation inconsistency. No business logic impact.

**Resolution Required:** Update DISC-001 module page count to 9. Confirm whether Password_Config and AccessDenied are correctly grouped under User Administration.

---

## CONFLICT-002 — Database Count (CRITICAL)

**Severity:** HIGH  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| DISC-003 §4 (Database Dependencies) | 4 databases: CRM, MISREPORTS, SALES, DATA_REPOSITORY_DB_CLAPI (+ ExcelImport local) |
| DISC-001 §6 (Data Access Layer) | "SQL queries crossing CRM, SALES, MISREPORTS, DATA_REPOSITORY_DB_CLAPI" — 4 listed |
| BR-BT (Business Tracking analysis) | 7 confirmed databases: adds COMMISSION, Doc_Arc_DB, AAR_RISK_DB from source code |
| ENV-002 / replit.md | 13 databases listed: adds AIMSOFT_DATADUMP, AIMSOFT_DATADUMP2023, COM_ACTIVITIES_DB, DB_MASTER_AGENTS, DB_MASTER_RENEWAL, DB_ONLINE_PORTAL |

**Analysis:** The 7-database count from source code analysis (BR-BT) is currently the most reliable — it is SOURCE-CONFIRMED. DISC-003 is outdated and must be superseded. The 13-database count from project notes includes 6 databases for which no source code evidence has been found; these may be valid production databases known to the business that are not accessed from the ASPX application code (e.g. accessed by MISREPORTS or other tools).

**Risk:** HIGH — if 6 additional databases are in scope, migration effort and data model design are significantly larger than current estimates.

**Resolution Required:**
1. DISC-003 must be updated to reflect the 7 source-confirmed databases.
2. Database access required to enumerate all databases on the test RDS instance.
3. Business stakeholder must confirm whether the 6 project-note databases are in scope for this application.

---

## CONFLICT-003 — jQuery Version Per-Page Ambiguity

**Severity:** MEDIUM  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| DISC-002 §7, DISC-003 §3.x | jQuery 1.4.1 (2010) is present in /scripts/ |
| DISC-002 §7 | jQuery 3.7.1 (2024) is also present in /scripts/ |
| DISC-001 §2 (tech stack) | References "dual jQuery" as a risk item |
| MasterPage.master source | Which version(s) are loaded is not confirmed |

**Analysis:** Both versions physically exist. It is unknown whether a single page load loads both (conflict), only one, or whether different pages load different versions. jQuery 1.4.1 has known security vulnerabilities. Loading both would cause $ namespace conflicts.

**Risk:** MEDIUM — the new system must load exactly one jQuery version. Without knowing which pages rely on 1.4.1-specific behaviour, a blanket upgrade to 3.x may break custom JavaScript.

**Resolution Required:** Read MasterPage.master to confirm which jQuery version(s) are referenced. Search page code-behind and inline scripts for version-specific API usage.

---

## CONFLICT-004 — OTP Entry Location: Login.aspx Panel1 vs Verify_OTP.aspx

**Severity:** MEDIUM  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| BR-AUTH-007 (Login.aspx.vb analysis) | OTP entry form is `Panel1` within `Login.aspx` — shown/hidden on the same page |
| DISC-002 §2.1, DISC-001 §4 | `Verify_OTP.aspx` is listed as a distinct authentication page |

**Analysis:** Two separate OTP entry mechanisms appear to exist: (1) an in-page panel in Login.aspx that shows the OTP entry form after password validation, and (2) a dedicated Verify_OTP.aspx page. These may represent: (a) an old implementation (Verify_OTP.aspx) replaced by in-page OTP but the old page was never removed, (b) two different OTP flows for different user scenarios, or (c) Verify_OTP.aspx is used when the session is lost mid-flow.

**Risk:** MEDIUM — if Verify_OTP.aspx implements different OTP logic, business rules may be missed.

**Resolution Required:** Read Verify_OTP.aspx.vb to determine whether it duplicates Login.aspx OTP logic, extends it, or serves a different scenario.

---

## CONFLICT-005 — OTP Delivery Mechanism: Email vs SMS (CRITICAL)

**Severity:** CRITICAL  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| BR-AUTH-007 (Login.aspx.vb, `OTP()` and `SendOtpToEmail()` functions) | OTP is **6-digit numeric**, delivered via **email** to user's registered address |
| DISC-006 §3 (SMS Integration) | OTP delivered via **serial SMS modem**, **4-character alphanumeric** format |
| DISC-001 §7 (Authentication Model) | "OTP Delivery: SMS via serial modem (SMSCOMMS.vb)" |
| DISC-003 §5 (Hardware Dependencies) | SMS modem listed as for "Two-factor authentication OTP delivery" |

**Analysis:** The Login.aspx.vb source code clearly implements email OTP delivery (BR-AUTH-007 is SOURCE-CONFIRMED from `SendOtpToEmail()` function). SMSCOMMS.vb exists and is an active file in App_Code — but its invocation for OTP has not been directly confirmed in Login.aspx.vb. Possible explanations:

1. Email OTP replaced SMS OTP at some point, but SMSCOMMS.vb was left in place (not removed).
2. Two 2FA paths exist — SMS for some profiles and email for others — and only the email path was observed.
3. SMSCOMMS.vb is used for other notifications (not OTP) and was incorrectly assumed to be OTP delivery.
4. The SMS path exists in an unread page or SP.

The 4-character alphanumeric vs 6-digit numeric difference strongly suggests these are two different generations of OTP implementation. SMSCOMMS.vb may have generated the 4-character code; the current email-based system generates 6-digit codes.

**Risk:** CRITICAL — this directly affects the new system's 2FA specification. If only email OTP is implemented but SMS was expected, the new system will be wrong for production users. If SMS is being replaced, the security properties are different (email OTP vs SMS OTP has different threat models).

**Resolution Required:**
1. Business must confirm: is OTP currently delivered via email, SMS, or both?
2. Read all Login.aspx.vb functions to confirm whether SMSCOMMS is called anywhere during the login flow.
3. Confirm with IT: is the SMS modem currently operational in production?

---

## CONFLICT-006 — Password Minimum Length: Three Different Values

**Severity:** CRITICAL  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| CPasswordStrength.vb (class defaults) | `MinimumPasswordLength = 6` — six characters minimum |
| ChangePass.aspx.vb (explicit override) | `CPasswordStrength.MinimumPasswordLength = 4` — four characters minimum |
| TBL_MIS_CRM_PASSWORD_CONF (configurable via Password_Config.aspx) | Contains `Len` field — configurable minimum length; actual value unknown |
| ChangePass.aspx.vb (confirmed behaviour) | Does **NOT** read from TBL_MIS_CRM_PASSWORD_CONF — uses hardcoded values |

**Analysis:** Three different values are asserted by three different sources. The active code in ChangePass.aspx.vb hardcodes the minimum to 4 — this is the **current enforced behaviour**. CPasswordStrength's class default of 6 is overridden and never used for password change. The database-configurable setting in TBL_MIS_CRM_PASSWORD_CONF appears to be a "dead" configuration — the UI exists but no code reads it for enforcement.

**Risk:** CRITICAL — the new system must enforce the correct minimum. If the business believes the policy is 6 characters but the code enforces 4, users may have passwords as short as 4 characters in the database today.

**Resolution Required:**
1. Business must confirm: what is the intended password minimum length policy?
2. Confirm whether Password_Config.aspx was ever connected to enforcement code (read Password_Config.aspx.vb).
3. The new system should enforce the business-confirmed value, not propagate the legacy inconsistency.

---

## CONFLICT-007 — Exempt Page Name: `changepassword.aspx` vs `ChangePass.aspx`

**Severity:** MEDIUM  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| MasterPage.master.vb (auth exempt check) | Exempts page named `changepassword.aspx` from access control |
| DISC-002 §2.1 (ASPX inventory) | The active password change page is named `ChangePass.aspx` (not `changepassword.aspx`) |

**Analysis:** The master page exempts `changepassword.aspx` (which does not exist as a file) rather than the actual file `ChangePass.aspx`. This means the exemption check may never match — every authenticated user trying to access `ChangePass.aspx` would be subject to profile access control. If the user's profile does not have CanAccess for ChangePass.aspx in the menuaccess table, the user would be locked out of changing their password. However, since "Change Password" is always appended to the menu (BR-AUTHZ-005), the menuaccess entry likely exists for all profiles.

**Risk:** MEDIUM — if any profile does NOT have ChangePass.aspx in menuaccess, users in that profile cannot change their password despite the exempt intent. The new system must use the correct route name for exemptions.

**Resolution Required:** Confirm whether the menuaccess table has `~/ChangePass.aspx` for all profiles (DB access required). Confirm whether there is a `changepassword.aspx` redirect alias that was missed.

---

## CONFLICT-008 — Four-Eyes (Maker-Checker) Approval Enforcement (CRITICAL)

**Severity:** CRITICAL  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| UserDetails.aspx.vb `AuthorizedToApprove()` (lines 473-499) | Correctly implements maker-checker: returns `CanApprove = False` if current user == creator/modifier |
| ApproveUserDetails.aspx.vb `AuthorizedToApprove()` (lines 153-181) | **Always returns `CanApprove = True`** regardless of who created the record — both branches set True |
| BR-AUTHZ-007 | Documents business intent as clear maker-checker; notes the implementation as LEGACY DEFECT |

**Analysis:** The business rule exists and is clearly intended — a user cannot approve their own work. However, the `ApproveUserDetails.aspx` page (the actual approval page) does not enforce this. The enforcement exists in `UserDetails.aspx` but that page is the detail/edit view, not the approval page. The result is that in production, any approver can approve their own user creations.

**Risk:** CRITICAL — this is a live compliance/governance defect. The new system MUST fix this, but the business must be informed that the legacy system has this defect so they can review any approvals that should have been blocked.

**Resolution Required:**
1. Business must be informed of this defect in the legacy system.
2. The new system must correctly implement maker-checker.
3. An audit of past approvals by the same user who created the record may be required (compliance risk).

---

## CONFLICT-009 — SMTP EnableSsl=False on smtp.office365.com Port 587

**Severity:** HIGH  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| web.config AppSettings | `PortNo = 587` for SMTP |
| Mail.vb / DocManage.vb (DISC-006 §2) | `EnableSsl = False` in SmtpClient configuration |
| SMTP Protocol Standard | smtp.office365.com on port 587 requires STARTTLS; email is rejected without TLS negotiation |

**Analysis:** Port 587 is the STARTTLS submission port. `EnableSsl = False` in `System.Net.Mail.SmtpClient` means the client will attempt an unencrypted connection on port 587. Office 365 SMTP requires STARTTLS on port 587. Two interpretations:

1. **Email is failing silently in production** — the 478 silent catch blocks in the codebase mean this failure would be swallowed.
2. **.NET's SmtpClient with EnableSsl=False on port 587** in some versions still performs opportunistic STARTTLS — behaviour varies by .NET version and SMTP server configuration.

Given the 929KB active error log and the prevalence of silent exception handling, it is possible that email is partially or fully broken in production.

**Risk:** HIGH — if email is currently broken, OTP delivery via email is also broken (see CONFLICT-005). The entire 2FA mechanism may be non-functional. This is operationally critical.

**Resolution Required:**
1. Business must confirm: are system emails (new user notifications, OTP, approvals) being received in production?
2. Read Error_Logs.txt to look for SMTP-related errors.
3. If email is broken, this is an urgent remediation item for the legacy system before migration.

---

## CONFLICT-010 — DLL Count: "104 compiled DLLs" vs 51 DLLs

**Severity:** LOW  
**Status:** RESOLVED (documentation error)  

**Conflict:**

| Source | Claim |
|---|---|
| DISC-001 §2 (Technology Stack) and DISC-003 introduction | "104 compiled DLLs" in Bin/ |
| ENV-001 §2.3 (Environment Validation) | Bin/ contains **104 total files**: 51 .dll + 53 .dll.refresh, .xml, .pdb files |

**Analysis:** ENV-001 explicitly resolves this. The original "104 DLLs" was a total file count, not a DLL-only count. The actual compiled library (DLL) count is 51. This was clarified during environment validation and documented in ENV-001 §2.3.

**Risk:** LOW — documentation inconsistency only. No business logic impact.

**Resolution Required:** Update DISC-001 and DISC-003 to say "51 compiled DLLs (plus 53 associated .dll.refresh, .xml, .pdb files = 104 total files in Bin/)". Already confirmed in ENV-001.

---

## CONFLICT-011 — DISC-003 Outdated: Lists 4 Databases When 7 Are Confirmed

**Severity:** HIGH  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| DISC-003 §4 heading and summary | Primary database dependencies: CRM, MISREPORTS, SALES, DATA_REPOSITORY_DB_CLAPI |
| DISC-001 §6 | Same 4 databases listed |
| BR-BT (Session 3 analysis) | 3 additional databases confirmed: COMMISSION, Doc_Arc_DB, AAR_RISK_DB |

**Analysis:** DISC-003 was produced before the deep source-code analysis that discovered COMMISSION, Doc_Arc_DB, and AAR_RISK_DB. The document is now factually wrong on database count.

**Risk:** HIGH — if engineers use DISC-003 for migration planning without this correction, they will plan for 4 databases and miss 3 critical ones. Doc_Arc_DB holds all binary document BLOBs. COMMISSION holds agent data essential to Business Tracking.

**Resolution Required:** DISC-003 must be updated as a priority. The database section must reflect 7 confirmed databases. The risk register in DISC-004 and current architecture overview should also be updated.

---

## CONFLICT-012 — `response.redirect("")` Redirect Destination

**Severity:** MEDIUM  
**Status:** OPEN  

**Conflict:**

| Source | Claim |
|---|---|
| MasterPage.master.vb line 91 | Access-denied response calls `Response.Redirect("")` — empty string |
| AccessDenied.aspx (confirmed existence in DISC-002) | A dedicated access denied page exists |
| BR-AUTHZ-003 | Documents this as a legacy bug — empty redirect may cause infinite loop |

**Analysis:** `Response.Redirect("")` with an empty string in ASP.NET causes a redirect to the current page URL (effectively a self-redirect). This means unauthorized access doesn't redirect to AccessDenied.aspx — it re-requests the same page, which re-checks access, which redirects again. In some web server configurations, this becomes an infinite redirect loop (HTTP 302 storm). AccessDenied.aspx exists but is not used by the access control guard.

**Risk:** MEDIUM — in production, users who hit an access-denied page may get a browser "Too many redirects" error rather than a graceful access denied message. This is both a UX and operational support issue.

**Resolution Required:** Confirm current production behaviour with the business ("do users ever see redirect errors?"). The new system must redirect to AccessDenied route or return HTTP 403.

---

## Conflict Summary

| ID | Description | Severity | Status |
|---|---|---|---|
| CONFLICT-001 | User Admin page count: 6 vs 9 | MEDIUM | OPEN |
| CONFLICT-002 | Database count: 4 vs 7 vs 13 | HIGH | OPEN |
| CONFLICT-003 | jQuery version per-page: unknown | MEDIUM | OPEN |
| CONFLICT-004 | OTP entry: Login.aspx Panel1 vs Verify_OTP.aspx | MEDIUM | OPEN |
| CONFLICT-005 | OTP mechanism: email 6-digit vs SMS 4-char | **CRITICAL** | OPEN |
| CONFLICT-006 | Password minimum: 6 chars vs 4 chars vs DB-configured | **CRITICAL** | OPEN |
| CONFLICT-007 | Exempt page name: changepassword.aspx vs ChangePass.aspx | MEDIUM | OPEN |
| CONFLICT-008 | Four-eyes approval: intent confirmed, enforcement broken | **CRITICAL** | OPEN |
| CONFLICT-009 | SMTP EnableSsl=False on Office365 port 587 | HIGH | OPEN |
| CONFLICT-010 | DLL count: 104 total files vs 51 DLLs | LOW | RESOLVED |
| CONFLICT-011 | DISC-003 database count outdated: 4 listed vs 7 confirmed | HIGH | OPEN |
| CONFLICT-012 | Access denied: Response.Redirect("") vs AccessDenied.aspx | MEDIUM | OPEN |

**Critical unresolved:** 3  
**High unresolved:** 3  
**Medium unresolved:** 5  
**Low unresolved:** 0  
**Resolved:** 1  

---

## Resolution Owners

| Resolution Method | Conflicts Resolved |
|---|---|
| Read Verify_OTP.aspx.vb | CONFLICT-004 |
| Business interview: confirm OTP delivery method in production | CONFLICT-005 |
| Business interview: confirm password policy | CONFLICT-006 |
| Read Password_Config.aspx.vb | CONFLICT-006, CONFLICT-007 |
| Read MasterPage.master for jQuery reference | CONFLICT-003 |
| Database access: count databases and enumerate PROFILE table | CONFLICT-002 |
| Update DISC-003 to reflect 7 confirmed databases | CONFLICT-011 |
| Business notification: inform of four-eyes defect | CONFLICT-008 |
| Analyse Error_Logs.txt for SMTP errors | CONFLICT-009 |
| Business: confirm whether emails are received in production | CONFLICT-009 |
| Update DISC-001, DISC-003 with corrected DLL count | CONFLICT-010 (documentation) |
| Engineering: fix access denied redirect in new system | CONFLICT-012 |

---

*Document produced by: AI Engineering Agent — Discovery Validation Phase*  
*Legacy source /Legacy/CRM: READ-ONLY — no modifications made*  
*Date: 2026-08-17*
