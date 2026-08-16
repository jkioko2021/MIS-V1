# Module Specification — Authentication

**Document ID:** MOD-01  
**Module:** Authentication  
**Wave:** 1 (First implementation wave)  
**Project:** MIS Modernization  
**Date:** 2026-08-16  
**Status:** DRAFT — pending business review  
**Sources:** BR-AUTH, BR-AUTHZ, Login.aspx.vb, Verify_OTP.aspx.vb, ChangePass.aspx.vb, logout.aspx.vb, MasterPage.master.vb, CPasswordStrength.vb  

---

## 1. Business Objective

Provide secure, auditable user authentication for the MIS application. The authentication module controls access to all other modules and enforces the organization's identity and security policy.

All business rules from `BR_Authentication.md` must be implemented. All security weaknesses in the legacy implementation must be remediated in the new system.

---

## 2. Actors

| Actor | Description |
|---|---|
| Employee | Any MIS system user — logs in to access business modules |
| System Administrator | Admin user who manages accounts and unlocks locked users |
| System | Background process — session management, OTP generation |
| Email Server | smtp.office365.com — delivers OTP and credential emails |
| SMS API | (Future) Replaces serial port modem for OTP delivery |

---

## 3. Legacy Mapping

| Legacy Component | New Component | Notes |
|---|---|---|
| Login.aspx + Login.aspx.vb | POST /api/auth/login | API endpoint |
| Verify_OTP.aspx + .vb | POST /api/auth/verify-otp | API endpoint |
| ChangePass.aspx + .vb | POST /api/auth/change-password | API endpoint |
| logout.aspx + .vb | POST /api/auth/logout | API endpoint |
| AdminLogin stored procedure | AuthenticationService.ValidateCredentials() | Domain service |
| MasterPage auth guard | JWT middleware + route guards | Infrastructure |
| Session("FullNames") check | JWT token presence validation | Token claims |
| Session variables | JWT claims + server-side user context | Claims-based |
| CPasswordStrength.vb | PasswordPolicyService | Domain service |
| TwoFactorAuthentication.vb | OtpService | Domain service |
| MyEncryptDecrypt.vb | NOT reproduced — see migration notes | Replaced by bcrypt |

---

## 4. Functional Requirements

### FR-AUTH-001 — User Login

**Description:** An employee must be able to log in using their username and password.

**Pre-conditions:**
- License is valid (see FR-AUTH-012)
- Account exists and is active

**Post-conditions:**
- OTP sent to user's email
- Login event recorded in audit trail
- `LastLoginDate` updated in database

**Business rules applied:** BR-AUTH-001, BR-AUTH-003, BR-AUTH-004, BR-AUTH-005, BR-AUTH-016, BR-AUTH-021

**Flow:**
```
1. User submits username + password
2. Validate license (FR-AUTH-012)
3. Validate username format (no injection characters)
4. Look up user by username in database
5. Verify password against stored hash
6. Check account state flags (Activated, EmployeeLocked, Approved)
7. If locked → return ACCOUNT_LOCKED error
8. If not approved → return NEEDS_APPROVAL error
9. If not activated → force password change (FR-AUTH-004)
10. Check password age (FR-AUTH-005)
11. If password expired → force password change (FR-AUTH-004)
12. Generate OTP and send to registered email (FR-AUTH-002)
13. Return OTP challenge state to client
14. Write audit trail
15. Update LastLoginDate
```

**Error responses:**
| Condition | Response | User Message |
|---|---|---|
| License invalid | 401 | "System access is currently unavailable. Please contact IT." |
| Invalid credentials | 401 | "Invalid username or password." (generic — do not distinguish which) |
| Account locked | 403 | "Your account has been locked. Please contact the system administrator." |
| Needs approval | 403 | "Your account is pending approval. Please contact the system administrator." |
| DB unavailable | 503 | "Service temporarily unavailable. Please try again." |

### FR-AUTH-002 — OTP Generation and Delivery

**Description:** After successful password validation, a time-limited OTP must be generated and delivered to the user's registered email address.

**Business rules applied:** BR-AUTH-007, BR-AUTH-008

**Specifications:**
- OTP length: 6 digits (preserve legacy behavior)
- OTP character set: numeric only (preserve legacy behavior)
- OTP generation: cryptographically secure random number generator (UPGRADE from `System.Random`)
- OTP validity period: 5 minutes (preserve legacy behavior)
- OTP delivery: email (preserve) + optionally SMS API (upgrade from serial port)
- OTP storage: server-side only (Redis/session store) — never returned to client
- OTP attempt limit: maximum 5 incorrect attempts before requiring new OTP (NEW — not in legacy)
- OTP resend: allow resend after 60 seconds (NEW — not in legacy)

**Email content:**
- Subject: "MIS One-Time Password"
- Body: OTP code displayed prominently
- Expiry time shown to user
- Sender: configurable (`LoginFromEmail1`, `LoginDisplayName1` settings)

### FR-AUTH-003 — OTP Verification

**Description:** The user must enter the OTP received by email to complete authentication.

**Business rules applied:** BR-AUTH-008

**Flow:**
```
1. User submits 6-digit OTP
2. Retrieve stored OTP and generation timestamp from server-side store
3. If OTP not found: return error "OTP not found. Request a new code."
4. If time since generation > 5 minutes: return error "OTP expired." + clear stored OTP
5. Increment attempt counter
6. If attempts > 5: return error "Too many attempts. Please request a new code." + clear OTP
7. If OTP matches: issue JWT access token + refresh token → redirect to application
8. If OTP does not match: return error "Invalid OTP. Please try again." (show remaining attempts)
```

**On success:**
- Issue JWT access token (15-minute expiry)
- Issue refresh token (8-hour expiry — matching business day)
- Clear OTP from server-side store
- Return user context (name, profile, permissions) in token claims
- Set active session flag

### FR-AUTH-004 — Forced Password Change

**Description:** The system must force a password change when: (a) account is newly created (Activated = 0), or (b) password has exceeded 30 days since last reset, or (c) account was locked and reset.

**Business rules applied:** BR-AUTH-006, BR-AUTH-013, BR-AUTH-014

**Flow:**
```
1. Present password change form
2. Validate old password (if changing — not applicable for forced activation)
3. Validate new password ≠ old password
4. Validate new password = confirm password
5. Validate new password meets policy (read from password configuration)
6. Hash new password (bcrypt/Argon2)
7. Update: password hash, Activated = 1, LASTPASSWORDRESET = today
8. Send notification email (FinMailType.ChangePassWord equivalent)
9. Clear forced-change flag
10. Proceed to OTP step
```

**Password policy (read from configuration — see FR-AUTH-010):**
- Minimum length (configurable, legacy default: 4 in ChangePass / 6 in class)
- Uppercase required (configurable)
- Lowercase required (configurable)
- Numeric required (configurable)
- Special character required (configurable)
- Cannot reuse previous passwords (configurable history count)

### FR-AUTH-005 — Failed Login and Account Lockout

**Description:** Consecutive failed login attempts must be tracked and the account locked after the configured threshold.

**Business rules applied:** BR-AUTH-009, BR-AUTH-010

**Specifications:**
- Attempt counter: stored in database (NOT session — this fixes legacy security flaw)
- Counter scoped to: username (regardless of session)
- Lockout threshold: configurable (legacy hardcoded to 3)
- Lockout action: set `EmployeeLocked = 1`, `Activated = 0` in Employees table
- Counter reset: on successful login
- Lockout message: "Your account has been locked after [N] failed attempts. Please contact the system administrator."

### FR-AUTH-006 — Logout

**Description:** Users must be able to log out, terminating their session completely.

**Business rules applied:** BR-AUTH-020

**Flow:**
```
1. Invalidate JWT refresh token (server-side token blacklist or rotation)
2. Set ActiveSession = 0 in Employees table
3. Clear server-side session/OTP store for this user
4. Return 200 OK
5. Client clears local token storage
6. Redirect to login page
```

### FR-AUTH-007 — Self-Service Password Reset

**Description:** A user who cannot log in must be able to request a password reset.

**Business rules applied:** BR-AUTH-015

**Legacy behavior (PRESERVED):** User enters username → system generates new password → sends email.

**New implementation (UPGRADED):** User enters username or email → system sends a time-limited password reset link → user clicks link → sets new password.

**Business constraints preserved:**
- User must be `Approved = True` to receive a reset link
- If not approved: return "Account not yet approved. Please contact your administrator."
- If no email address registered: return "No email address found. Please contact your administrator."

**Audit trail:** Write audit entry for every reset request (success and failure reasons).

### FR-AUTH-008 — Account Unlock by Administrator

**Description:** A system administrator must be able to unlock a locked account and reset the password.

**Business rules applied:** BR-AUTH-011

**Action:** Admin unlocks account → system sets EmployeeLocked = 0, Activated = 0 → generates temporary token → sends activation email to user

### FR-AUTH-009 — Production Month Context Loading

**Description:** On successful authentication, the system must determine and store the current active production month for use across all business modules.

**Business rules applied:** BR-AUTH-021

**Data source:** `SALES.dbo.TBL_MIS_PROD_MONTHS WHERE MONTH_CLOSED = 0`

**Query:** Retrieve MIN(DATE_FROM), MIN(DATE_TO) for the earliest open production month

**Storage:** Include in user context / session state as `productionDateFrom`, `productionDateTo`

**Usage:** These dates are used as default date filters across Business Tracking, Reports, and other modules.

### FR-AUTH-010 — Password Policy Configuration

**Description:** An administrator must be able to view and update the password policy settings.

**Business rules applied:** BR-AUTH-022

**Configurable settings (stored in `TBL_MIS_CRM_PASSWORD_CONF`):**

| Setting | Type | Default | Enforced |
|---|---|---|---|
| Minimum length | Integer | 8 (recommended — legacy used 4) | ALL password changes |
| Password history count | Integer | 5 | Password changes |
| Lockout threshold | Integer | 3 | Login failures |
| Require uppercase | Boolean | True | Password validation |
| Require lowercase | Boolean | True | Password validation |
| Require numeric | Boolean | True | Password validation |
| Require special character | Boolean | True | Password validation |
| Password reset days | Integer | 30 | Password expiry |

**Critical requirement:** The new system must read password policy from the database at validation time. The legacy hardcoded values in `ChangePass.aspx.vb` must NOT be reproduced.

### FR-AUTH-011 — Audit Trail

**Description:** All authentication events must be recorded in the audit trail.

**Business rules applied:** BR-AUTH-012

**Required audit events:**
- Successful login
- Failed login (reason: bad credentials / locked / not approved / not activated)
- OTP sent
- OTP verified
- OTP failed
- OTP expired
- Password changed
- Password reset requested
- Password reset completed
- Account locked
- Account unlocked
- Logout

**Required audit fields:** UserName, ActionType, Description, Timestamp, IPAddress, SessionID, UserAgent

### FR-AUTH-012 — Software License Validation

**Description:** The system must validate that a valid software license is active before permitting login.

**Business rules applied:** BR-AUTH-001

**IMPORTANT:** The exact license mechanism (License.fin file format, DB parameters, validation logic) must be preserved during the transition period. Changing the license model requires explicit business approval and coordination with the software vendor.

**New implementation approach:** The license validation logic should be extracted to a `LicenseService` that reads from the DB parameters and validates an encrypted license artifact. The artifact format and DB parameter keys must be preserved exactly.

---

## 5. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Response time — login | < 500ms (excluding email delivery) |
| Response time — OTP validation | < 200ms |
| OTP delivery — email | < 60 seconds |
| Password hashing | bcrypt (cost factor ≥ 12) or Argon2id |
| Token storage | HTTP-only, Secure, SameSite=Strict cookies |
| CSRF protection | Double-submit cookie or SameSite=Strict sufficient |
| Session expiry | Access token: 15 minutes; Refresh: 8 hours (business day) |
| Concurrent sessions | Configurable — legacy unclear, default: allow multi-session |
| Audit log retention | Minimum 2 years (regulatory requirement — CONFIRM) |

---

## 6. API Endpoints

| Method | Path | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/login` | Submit username + password | No |
| POST | `/api/auth/verify-otp` | Submit OTP code | Partial (login token) |
| POST | `/api/auth/resend-otp` | Request new OTP | Partial (login token) |
| POST | `/api/auth/change-password` | Change password | Partial or full |
| POST | `/api/auth/forgot-password` | Request reset link | No |
| POST | `/api/auth/reset-password` | Submit new password with reset token | Reset token |
| POST | `/api/auth/logout` | Terminate session | Full |
| POST | `/api/auth/refresh` | Refresh access token | Refresh token |
| GET  | `/api/auth/me` | Get current user context | Full |

---

## 7. Data Model

### 7.1 Employee / User Entity (derived from Employees table)

| Field | Type | Description | Classification |
|---|---|---|---|
| EmployeeID | Integer PK | Internal user identifier | CONFIRMED |
| UserName | Varchar | Login username (unique) | CONFIRMED |
| Password | Varchar | Encrypted (legacy) / Hash (new) | CONFIRMED |
| EmployeeName | Varchar | Display name | CONFIRMED |
| Email | Varchar | Primary email for OTP/notifications | CONFIRMED |
| ProfileID | Integer FK | Authorization profile | CONFIRMED |
| emp_code | Varchar | Employee code | CONFIRMED |
| Activated | Boolean | Account activation state | CONFIRMED |
| EmployeeLocked | Boolean | Account lock state | CONFIRMED |
| APPROVED | Boolean | Four-eyes approval state | CONFIRMED |
| APPROVEDBY | Varchar | Name of approver | CONFIRMED |
| DateApproved | DateTime | When approved | CONFIRMED |
| LASTPASSWORDRESET | DateTime | Last password change date | CONFIRMED |
| LastLoginDate | DateTime | Last successful login | CONFIRMED |
| ActiveSession | Boolean | Concurrent session flag | CONFIRMED |
| AddedBy | Varchar | User who created this record | CONFIRMED |
| ModifiedBy | Varchar | User who last modified this record | CONFIRMED |
| RecordStatus | Varchar | "New Record" / "Update" | CONFIRMED |
| EmailSent | Boolean | Welcome email sent flag | CONFIRMED |
| DaysTolockUser | Integer | Automatic lock after N days (inactive) | CONFIRMED |
| Title | Varchar | Job title / honorific | CONFIRMED |
| Cellphone | Varchar | Mobile phone | CONFIRMED |
| Department | Integer FK | Department | CONFIRMED |

### 7.2 AdminAuditTrail Table

| Field | Type | Notes |
|---|---|---|
| AuditID | Integer PK | Auto-generated |
| UserName | Varchar | Who performed the action |
| ActionType | Varchar | Action category (Login, Page Access, etc.) |
| ActionDate | DateTime | When |
| Description | Varchar | What happened |
| PageURL | Varchar | Which page |
| IPAddress | Varchar | Client IP |
| SessionID | Varchar | Session identifier |

---

## 8. Screens / UI Components Required

| Screen | Legacy Page | New Component | Notes |
|---|---|---|---|
| Login form | Login.aspx | LoginPage | Username + Password fields |
| OTP entry | Login.aspx (Panel1) + Verify_OTP.aspx | OtpVerificationPage | 6-digit entry, expiry timer, resend |
| Change password | ChangePass.aspx | ChangePasswordPage | Old + New + Confirm + policy indicator |
| Forgot password | Login.aspx (lnkpass link) | ForgotPasswordPage | Username or email entry |
| Reset password | (new) | ResetPasswordPage | Token-based, new + confirm |
| Password policy admin | Password_Config.aspx | PasswordPolicyAdmin | All policy settings |
| Session expired | (no dedicated page) | SessionExpiredModal | Non-intrusive notification |

---

## 9. Integration Points

| Integration | Direction | Purpose | Technology |
|---|---|---|---|
| Email server | Outbound | OTP, password reset, notifications | SMTP via Office365 |
| SMS API | Outbound | OTP (alternative channel) | Africa's Talking or Twilio (REPLACE serial port) |
| CRM Database | Read/Write | User data, audit trail, password policy | SQL Server |
| SALES Database | Read | Active production month | SQL Server (cross-DB — via API in new system) |
| License validation | Read | Software license check | License.fin + CRM DB parameters |

---

## 10. Testing Requirements

| Test | Description | Priority |
|---|---|---|
| GT-AUTH-001 | Successful login end-to-end (valid credentials → OTP → Welcome) | CRITICAL |
| GT-AUTH-002 | Invalid credentials — correct error, attempt counter incremented | CRITICAL |
| GT-AUTH-003 | Account lockout after 3 failures | CRITICAL |
| GT-AUTH-004 | OTP expiry after 5 minutes | CRITICAL |
| GT-AUTH-005 | Invalid OTP rejection | CRITICAL |
| GT-AUTH-006 | Forced password change on first login | CRITICAL |
| GT-AUTH-007 | Forced password change on expired password (30+ days) | CRITICAL |
| GT-AUTH-008 | Password complexity validation (each rule) | HIGH |
| GT-AUTH-009 | Logout terminates session completely | HIGH |
| GT-AUTH-010 | Direct URL access without login → redirect to login | HIGH |
| GT-AUTH-011 | Password reset flow end-to-end | HIGH |
| GT-AUTH-012 | Locked account message displayed | HIGH |
| GT-AUTH-013 | Audit trail written for every event | HIGH |
| GT-AUTH-014 | Production month loaded into context | MEDIUM |
| GT-AUTH-015 | License validation blocks login on expired license | MEDIUM |
| GT-AUTH-016 | Session timeout redirects to login | MEDIUM |

---

## 11. Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-AUTH-001 | What is the exact 30-day password expiry — is it read from TBL_MIS_CRM_PASSWORD_CONF `Pass_Reset` column or hardcoded? | Password expiry logic | Business/DBA |
| OQ-AUTH-002 | Should concurrent sessions be blocked? ActiveSession tracking exists but enforcement appears disabled | Security policy | Business |
| OQ-AUTH-003 | What is the exact license validation vendor and contract? What happens at migration time? | Go-live blocker | Business/Legal |
| OQ-AUTH-004 | Is OTP also sent via SMS (legacy modem) in production, or email-only? | OTP delivery | Business |
| OQ-AUTH-005 | What is the DaysTolockUser field — does the system auto-lock after N days of inactivity? | Account lifecycle | DBA access needed |
| OQ-AUTH-006 | Audit log retention policy — regulatory requirement? | Compliance | Legal/Compliance |

---

*Document produced by: AI Engineering Agent — Module Specification Phase*  
*Status: DRAFT — requires business review before implementation*
