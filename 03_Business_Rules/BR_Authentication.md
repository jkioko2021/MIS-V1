# Business Rules — Authentication

**Document ID:** BR-AUTH  
**Project:** MIS Modernization  
**Phase:** Discovery — Business Rule Extraction  
**Date:** 2026-08-16  
**Source:** Direct analysis of Login.aspx.vb, Verify_OTP.aspx.vb, ChangePass.aspx.vb, logout.aspx.vb, MasterPage.master.vb, App_Code/CPasswordStrength.vb  
**Status:** CONFIRMED unless noted  

---

## 1. Overview

Authentication in the legacy MIS system is a **custom, non-standard implementation** built entirely in VB.NET without ASP.NET Membership or any framework. It combines:

- Username/password login against a SQL Server stored procedure
- A **software license check** that must pass before login is permitted
- A **two-factor authentication (OTP)** step via email after password validation
- **Account state machine** (Activated, EmployeeLocked, Approved flags)
- **Password expiry enforcement** (30-day policy)
- **Account lockout** after 3 failed attempts
- **Full audit trail** of every authentication event

---

## 2. License Validation

### BR-AUTH-001 — License Check on Every Login Attempt

**Rule:** Before any login attempt is processed, the system must validate a software license.

**Source:** Login.aspx.vb `LoadLicence()` + `LoadSetup_Parameter()` — CONFIRMED

**Trigger:** Login page load and every login button click

**Process:**
1. Read parameters `FinLincClientName`, `FinLincAppName`, `FinLincVersion` from `dbo.LoadParamz` stored procedure in the CRM database
2. Read and decrypt `License.fin` file from the application root directory using Rijndael AES
3. Reverse the decrypted string
4. Parse license fields: `[STARTDATE]`, `[ENDDATE]`, `[AppName]`, `[Client]`, `[Version]`
5. Validate: Client must match DB parameter, Version must match DB parameter, AppName must match DB parameter
6. Validate: StartDate must be ≤ today ≤ EndDate
7. If any check fails: display error message and block login
8. If license expires within 30 days: display a warning (but do not block login)

**Failure messages:**
- "License file cannot be found, contact system administrator"
- "The software license applied is not valid for this Client"
- "The software version applied is not valid for this Client"
- "The software license applied is not valid for this application"
- "The software license applied is not valid" (date range invalid)
- "The system has detected that you have Changed the Machine date and will terminate"
- "Could not Resolve License Information. Please contact system Administrator"

**Modern implementation note:** The license mechanism is a vendor protection feature (the system is branded "AIK-Linc" internally). The new application must implement equivalent software licensing or replace with a modern entitlement model. The DB parameter keys (`FinLincClientName`, `FinLincAppName`, `FinLincVersion`) and the `License.fin` file format must be understood before migration.

---

## 3. Login Input Validation

### BR-AUTH-002 — SQL Injection Pre-Check on Username

**Rule:** The username field must be checked for `--` (double-dash) and `'` (single quote) characters before any database operation.

**Source:** Login.aspx.vb line 540-542 — CONFIRMED

**Action:** If either character is detected:
- Display "Invalid Login Details!"
- Write audit trail: "Unsuccessful Login. Invalid login details."
- Block further processing

**Classification:** LEGACY DEFECT — This is a rudimentary injection check, not parameterized queries. The AdminLogin stored procedure call IS parameterized (line 203), but inline SQL elsewhere is not. The new system must use parameterized queries exclusively — this pre-check is not required and should not be reproduced.

---

## 4. Credential Validation

### BR-AUTH-003 — Credential Lookup via AdminLogin Stored Procedure

**Rule:** User credentials are validated by calling the `AdminLogin` stored procedure with only the username as a parameter.

**Source:** Login.aspx.vb `UserDetails()` function, line 198-204 — CONFIRMED

**Process:**
1. Decrypt the CRM connection string (Rijndael AES encrypted in web.config)
2. Call `AdminLogin` SP with `@UserName` parameter
3. SP returns the user record including encrypted password, flags, and last password reset date
4. Client-side decryption of the stored password using Rijndael
5. Compare decrypted stored password against plaintext input `txtPassword.Text`

**Modern implementation note:** The new system must use proper password hashing (bcrypt/Argon2) — never decrypt-and-compare. Migration requires: (a) decrypt all legacy passwords at migration time using the known Rijndael key, (b) re-hash using bcrypt/Argon2, (c) store hashes only.

### BR-AUTH-004 — Session Variables Populated on Authentication

**Rule:** On successful password match, the following session variables are set from the user record:

| Session Variable | Source Column | Purpose |
|---|---|---|
| `Session("UserName")` | `UserName` | Username for audit and display |
| `Session("MyEmployeeID")` | `EmployeeID` | Primary key — used in all subsequent queries |
| `Session("Email")` | `Email` | User email |
| `Session("FullNames")` | `EmployeeName` | Display name + authentication guard |
| `Session("MyProfileID")` | `ProfileID` | Drives menu and page access control |
| `Session("emp_code")` | `emp_code` | Employee code |
| `Session("LastLoginDate")` | `LastLoginDate` | Previous login timestamp |

**Source:** Login.aspx.vb lines 98-106 — CONFIRMED

---

## 5. Account State Machine

### BR-AUTH-005 — Account State Determination

**Rule:** After password match, the system evaluates three independent boolean flags to determine the account state and the appropriate response.

**Source:** Login.aspx.vb lines 109-141 — CONFIRMED

**Flags:**
| Flag | DB Column | Meaning |
|---|---|---|
| `Activated` | `Activated` | Account has been activated (password set) |
| `EmployeeLocked` | `EmployeeLocked` | Account is locked (too many failures or admin action) |
| `APPROVED` | `APPROVED` | Account has been approved by a second user |

**State → Reply mapping:**

| Activated | EmployeeLocked | Approved | Reply Code | User Message |
|---|---|---|---|---|
| True | False | True | `CannAccess` | (proceed to OTP) |
| True or False | True | True | `ClientLocked` | "Account Locked. Kindly contact the system administrator." |
| True | False | False | `ClientNeedsApproval` | "Approval required. Kindly contact the system administrator." |
| False | False | True | `NeedActivation` | (redirect to ChangePass.aspx) |
| (any other) | — | — | `ClientNeedsApproval` | "Approval required. Kindly contact the system administrator." |

**Modern implementation note:** These three flags must be preserved in the new user model. The concepts are:
- `Activated` = user has completed first-login password setup
- `EmployeeLocked` = administratively or automatically locked
- `APPROVED` = four-eyes approval by a different user

---

## 6. Password Expiry

### BR-AUTH-006 — 30-Day Password Expiry Enforcement

**Rule:** After successful credential validation and account state check, the system enforces a 30-day password expiry policy.

**Source:** Login.aspx.vb lines 572-631 — CONFIRMED

**Process:**
1. Retrieve `LASTPASSWORDRESET` date from the user record
2. If `LASTPASSWORDRESET` is null/empty: treat as today (no forced expiry)
3. Calculate `DateDiff(Day, LASTPASSWORDRESET, today)`
4. If difference ≥ 30 days: redirect to `ChangePass.aspx` (forced password change)
5. If difference < 30 days: proceed to OTP step

**Modern implementation note:** The 30-day threshold must be confirmed with the business. Consider whether the `Password_Config.aspx` configurable settings (stored in `TBL_MIS_CRM_PASSWORD_CONF`) should drive this value instead of the hardcoded 30 days. **UNKNOWN:** Whether the configured `Pass_Reset` field in that table controls this value or is a separate setting.

---

## 7. Two-Factor Authentication (OTP)

### BR-AUTH-007 — OTP Generation and Delivery

**Rule:** After successful password validation and password age check, a 6-digit numeric OTP is generated and sent to the user's registered email address.

**Source:** Login.aspx.vb `OTP()` and `SendOtpToEmail()` functions — CONFIRMED

**Process:**
1. Query the `employees` table for the user's email address using `Session("MyEmployeeID")`
2. Generate a 6-digit numeric OTP using `Random.Next(0, 10)` for each digit
3. Store OTP in `Session("OTP")` and generation time in `Session("OtpGeneratedTime")`
4. Send HTML email to user's registered email with OTP code
5. Display OTP entry form (Panel1)

**OTP email subject:** "MIS OTP TOKEN"
**OTP email sender:** Configured in `AppSettings("LoginFromEmail1")`, `AppSettings("LoginDisplayName1")`
**Email server:** `AppSettings("EmailServer")`, credentials from `AppSettings("EmailUsername1")`, `AppSettings("EmailPassword1")`

**Security risk identified:** `System.Random` is NOT cryptographically secure. OTPs should be generated using `System.Security.Cryptography.RandomNumberGenerator`. New system must use CSPRNG.

### BR-AUTH-008 — OTP Validation

**Rule:** The entered OTP must match the session-stored OTP and must not be expired.

**Source:** Login.aspx.vb `btnSubmitOtp_Click()`, lines 1032-1059 — CONFIRMED

**Validation steps:**
1. If `Session("OTP")` is null/empty: display "OTP not found. Please request a new one." — block
2. If time since `Session("OtpGeneratedTime")` > 5 minutes: display "OTP expired. Please request a new one." — remove OTP from session — block
3. If entered OTP matches `Session("OTP")`: display success → redirect to `Welcome.aspx`
4. If OTP does not match: display "Invalid OTP. Please try again." — clear text field — allow retry

**Note:** There is no limit on OTP retry attempts in the legacy implementation. The new system should implement OTP attempt limits (e.g., 5 attempts max before requiring new OTP generation).

**Note:** OTP is stored only in session — if session expires, OTP is lost and user must restart login.

---

## 8. Failed Login and Account Lockout

### BR-AUTH-009 — Failed Login Counter

**Rule:** Each failed credential validation increments `Session("Loginattempts")`.

**Source:** Login.aspx.vb lines 145, 151, 159 — CONFIRMED

**Trigger conditions:**
- Password does not match stored password ("InvalidDetails 1")
- Username not found in database ("InvalidDetails 2", "InvalidDetails 3")

### BR-AUTH-010 — Account Lockout After 3 Failed Attempts

**Rule:** After 3 consecutive failed login attempts, the account is automatically locked.

**Source:** Login.aspx.vb lines 658-675 — CONFIRMED

**Process on 3rd+ failure:**
1. Display: "3 wrong Login attempts! Account Has been Locked. Kindly contact the system admin"
2. Execute: `UPDATE employees SET Activated = 0 WHERE EmployeeID = {id}` — deactivates account
3. Execute: `UPDATE employees SET EmployeeLocked = 1 WHERE EmployeeID = {id}` — locks account
4. Write audit trail: "3 wrong login attempts. Account locked."

**Critical security flaw:** `Session("Loginattempts")` is stored in-memory session only. A new browser session or session expiry resets the counter. The new system must persist the failed attempt counter and lockout state in the database, not in session.

### BR-AUTH-011 — Manual Account Unlock by Administrator

**Rule:** A locked account can only be unlocked by a system administrator via the `UserDetails.aspx` page (unchecking `chkUserLocked`).

**Source:** UserDetails.aspx.vb + ApproveUserDetails.aspx — CONFIRMED

**Process:**
1. Admin unchecks "User Locked" checkbox
2. System generates a new random password (5-char alphanumeric, lowercase)
3. Updates DB: encrypted password, `Activated = 0` (forces password change on next login)
4. Password reset email is NOT automatically sent at unlock — sent separately via "Send Email" button

**Note from password reset (Forgot Password flow):** The `lnkpass_Click` function in Login.aspx also resets a locked account by setting `EMPLOYEELOCKED = 0` alongside the password reset.

---

## 9. Audit Trail

### BR-AUTH-012 — Mandatory Audit Trail for All Authentication Events

**Rule:** Every authentication event must be written to the `AdminAuditTrail` table via `AddAdminAuditTrail()`.

**Source:** Multiple locations in Login.aspx.vb — CONFIRMED

**Audited events:**

| Event | Action Type | Description |
|---|---|---|
| Successful login | "Login" | "Successful Login." |
| Failed login (bad credentials) | "Login" | "Unsuccessful Login to Management System. Invalid Login Details." |
| Account locked on 3rd attempt | "Login" | "3 wrong login attempts. Account locked." |
| User locked (existing lock) | "Login" | "Unsuccessful Login. User Locked" |
| Needs approval | "Login" | "Unsuccessful Login. Needs Approval" |
| SQL injection attempt | "Login" | "Unsuccessful Login. Invalid login details." |
| DB unavailable | "Login" | "Could not connect to database server." |
| Needs activation | "Login" | "Successful Login. Needs Activation" |
| Password resent | "ReSend Back Office User Password" | Password email result |

**Audit record fields:**
| Field | Source |
|---|---|
| UserName | `Session("UserName")` or attempted username |
| ActionType | Event type string |
| Description | Event description |
| PageURL | `Request.Url.ToString` |
| IPAddress | `Session("ip")` (HTTP_X_FORWARDED_FOR or REMOTE_ADDR) |
| SessionID | `Session("sessionid")` |

**Source table:** `AdminAuditTrail` (referenced in Crystal Report `AdminAudit.rpt`)

---

## 10. Password Change

### BR-AUTH-013 — Password Change Validation Rules

**Rule:** Password changes must satisfy all of the following:

**Source:** ChangePass.aspx.vb — CONFIRMED

| # | Rule | Implementation |
|---|---|---|
| 1 | Old password must be correct | Decrypt DB password, compare to input |
| 2 | New password must not equal old password | Direct comparison before encryption |
| 3 | New password must match confirmation | String equality check |
| 4 | Minimum length: 4 characters | `CPasswordStrength.MinimumPasswordLength = 4` (hardcoded in ChangePass) |
| 5 | Must pass ≥ 4 complexity checks | `NumberofChecktoSucceed = 4` (hardcoded) |
| 6 | Complexity checks: uppercase, lowercase, numeric, special character | `CPasswordStrength.isPasswordStrong()` |

**INCONSISTENCY FOUND:** `CPasswordStrength` class defaults to `MinimumPasswordLength = 6` and `NumberofChecktoSucceed = 2`, but `ChangePass.aspx.vb` overrides these to 4 and 4 respectively. The `Password_Config.aspx` stores configurable settings in `TBL_MIS_CRM_PASSWORD_CONF`, but `ChangePass.aspx.vb` does NOT read from that table — it uses hardcoded values. **UNKNOWN:** Is the DB table actually enforced anywhere, or is it UI only?

### BR-AUTH-014 — Password Change Updates Account State

**Rule:** On successful password change, the system:
1. Encrypts the new password with Rijndael AES
2. Executes: `UPDATE Employees SET Password = '{encrypted}', Activated = 1, LASTPASSWORDRESET = '{today:yyyy-MM-dd}' WHERE EmployeeID = {id}`
3. Sends a notification email to the user (FinMailType.ChangePassWord)
4. Sets `Activated = 1` — this is how a new user completes their first login

**Source:** ChangePass.aspx.vb lines 71-93 — CONFIRMED

---

## 11. Password Reset (Forgot Password)

### BR-AUTH-015 — Self-Service Password Reset

**Rule:** A user who cannot log in may request a password reset from the login page.

**Source:** Login.aspx.vb `lnkpass_Click()` — CONFIRMED

**Business constraints:**
- User must be `Approved = True` to receive a reset
- If user is not approved: display "User requires approval" — do not send password
- If user has no registered email: display "No email address found in the user's records."

**Process:**
1. User enters username in login form and clicks "Forgot Password" link
2. System looks up `EmployeeId` by username
3. System retrieves user email, username, name from `employees` table
4. System generates a new random 5-character lowercase alphanumeric password
5. System encrypts the new password and saves to DB: `password = encrypted, Activated = 0, EMPLOYEELOCKED = 0`
6. System sends email with: username in plaintext + new password in plaintext
7. Display: "A Random Password has been generated and sent to the user's Email Address."

**Security risk:** The new password is sent in plaintext in the email. The new system must send a one-time activation link instead. Audit trail is written for both success and failure.

---

## 12. Session Management

### BR-AUTH-016 — IP and Session Capture on Login

**Rule:** At the start of every login attempt, the client IP and session ID are captured.

**Source:** Login.aspx.vb `Machine_IP_Session()` — CONFIRMED

**IP resolution order:**
1. HTTP_X_FORWARDED_FOR header (proxy/load balancer forwarded IP)
2. REMOTE_ADDR (direct connection IP)

**Values stored:** `Session("ip")`, `Session("sessionid")`  
**Used in:** Audit trail, session-based authentication guard

### BR-AUTH-017 — Session Timeout and Auto-Redirect

**Rule:** Session timeout is 45 minutes (web.config: `timeout="45"`). After timeout, the master page redirects to Login.aspx. The Refresh header is set to `(timeout × 60) + 5` seconds.

**Source:** MasterPage.master.vb line 38, web.config — CONFIRMED

### BR-AUTH-018 — Authentication Guard on Every Protected Page

**Rule:** Every page that uses the master page is guarded: if `Session("FullNames")` is null, the user is redirected to `Login.aspx`.

**Source:** MasterPage.master.vb lines 44-51 — CONFIRMED

**Implementation:** `Server.Transfer("login.aspx")` followed by `Response.Redirect("login.aspx")` — both called (defensive redundancy).

### BR-AUTH-019 — Active Session Tracking

**Rule:** On successful login, `ActiveSession = 1` is set in the Employees table. On logout, `ActiveSession = 0` is set.

**Source:** Login.aspx.vb `DisallowMultipleLoginSessions()`, logout.aspx.vb `KillActiveSession()` — CONFIRMED

**Note:** The legacy implementation tracks active sessions but does NOT appear to enforce single-session-only login (the enforcement code is present but commented out in several places). **UNKNOWN:** Whether multiple concurrent sessions are currently permitted in production.

### BR-AUTH-020 — Logout

**Rule:** Logout executes: (1) set `ActiveSession = 0` in DB, (2) `Session.Abandon()`, (3) redirect to Login.aspx.

**Source:** logout.aspx.vb — CONFIRMED

---

## 13. Production Month Context

### BR-AUTH-021 — Active Production Month Set at Login

**Rule:** On each page load via the master page, the system reads the active production month from `SALES.dbo.TBL_MIS_PROD_MONTHS` and sets session variables for date-range filtering across business modules.

**Source:** MasterPage.master.vb lines 67-74 — CONFIRMED

**Query:** `SELECT MIN(DATE_FROM), MIN(DATE_TO) FROM SALES.[dbo].[TBL_MIS_PROD_MONTHS] WHERE [MONTH_CLOSED] = 0`

**Session variables set:**
- `Session("DTFROM")` = MIN open month start date (format: `yyyy-MM-dd`)
- `Session("DTTO")` = MIN open month end date (format: `yyyy-MM-dd`)

**Business significance:** This cross-database query to the SALES database determines the active reporting/production period. All business tracking, reports, and data entry are scoped to this period. The concept of "production month" is a core business concept that must be preserved in the new system.

---

## 14. Password Configuration Management

### BR-AUTH-022 — Configurable Password Policy via Admin Screen

**Rule:** The system provides an administrative screen (`Password_Config.aspx`) to manage password policy settings stored in `TBL_MIS_CRM_PASSWORD_CONF`.

**Source:** Password_Config.aspx.vb — CONFIRMED

**Configurable settings:**

| Setting | DB Column | Type | Meaning |
|---|---|---|---|
| Minimum length | `Len` | Integer | Minimum password character count |
| History count | `Hist` | Integer | Number of previous passwords that cannot be reused |
| Lockout count | `Lock_cnt` | Integer | Number of failed attempts before lockout |
| Require numeric | `Is_Numeric` | Boolean | Password must contain digits |
| Require special character | `Is_special` | Boolean | Password must contain special characters |
| Require capital letter | `Is_Capital` | Boolean | Password must contain uppercase |
| Password reset days | `Pass_Reset` | Integer | Days before forced password reset |

**INCONSISTENCY:** The `ChangePass.aspx` page hardcodes `MinimumPasswordLength = 4` and `NumberofChecktoSucceed = 4` rather than reading from `TBL_MIS_CRM_PASSWORD_CONF`. The configuration screen exists but its values may not be enforced consistently.

**Modern implementation requirement:** The new system must enforce password policy from a single configurable source. All password validation must read from the policy configuration.

---

## 15. Business Rules Summary Table

| Rule ID | Rule | Classification | Modern Priority |
|---|---|---|---|
| BR-AUTH-001 | License validation before login | CONFIRMED | Must redesign — license mechanism |
| BR-AUTH-002 | Username injection pre-check | CONFIRMED / LEGACY DEFECT | Replace with parameterized queries |
| BR-AUTH-003 | AdminLogin SP credential lookup | CONFIRMED | Redesign — use password hash |
| BR-AUTH-004 | Session variables on login | CONFIRMED | Preserve business meaning — use JWT/session claims |
| BR-AUTH-005 | Account state machine (3 flags) | CONFIRMED | MUST PRESERVE — business logic |
| BR-AUTH-006 | 30-day password expiry | CONFIRMED | MUST PRESERVE — confirm threshold |
| BR-AUTH-007 | OTP generation and email delivery | CONFIRMED | MUST PRESERVE — use CSPRNG |
| BR-AUTH-008 | OTP validation with 5-minute expiry | CONFIRMED | MUST PRESERVE — add attempt limit |
| BR-AUTH-009 | Failed login counter | CONFIRMED | MUST PRESERVE — move to DB |
| BR-AUTH-010 | Lockout after 3 attempts | CONFIRMED | MUST PRESERVE — confirm threshold |
| BR-AUTH-011 | Admin unlock resets password | CONFIRMED | MUST PRESERVE |
| BR-AUTH-012 | Audit trail for all auth events | CONFIRMED | MUST PRESERVE |
| BR-AUTH-013 | Password complexity validation | CONFIRMED | MUST PRESERVE — unify config |
| BR-AUTH-014 | Password change activates account | CONFIRMED | MUST PRESERVE |
| BR-AUTH-015 | Self-service password reset | CONFIRMED | MUST PRESERVE — replace email link |
| BR-AUTH-016 | IP and session capture | CONFIRMED | MUST PRESERVE — for audit |
| BR-AUTH-017 | 45-minute session timeout | CONFIRMED | MUST PRESERVE — confirm duration |
| BR-AUTH-018 | Authentication guard on all pages | CONFIRMED | MUST PRESERVE — use middleware |
| BR-AUTH-019 | Active session tracking | CONFIRMED | MUST PRESERVE |
| BR-AUTH-020 | Logout clears DB session flag | CONFIRMED | MUST PRESERVE |
| BR-AUTH-021 | Production month loaded at login | CONFIRMED | MUST PRESERVE — cross-module dependency |
| BR-AUTH-022 | Configurable password policy | CONFIRMED | MUST PRESERVE — unify enforcement |

---

*Document produced by: AI Engineering Agent — Business Rule Extraction*  
*Source: /Legacy/CRM — READ-ONLY, no modifications made*  
*Classification: CONFIRMED unless marked otherwise*
