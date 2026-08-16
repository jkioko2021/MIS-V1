# Business Process Catalogue

**Document ID:** BP-CAT-001  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery — Business Process Reverse Engineering  
**Date:** 2026-08-17  
**Method:** Reconstructed exclusively from approved discovery evidence  
**Sources:** BR-AUTH, BR-AUTHZ, BR-BT, BR-RISK, DISC-001 through DISC-008, VAL-005  
**Governance:** /Legacy/CRM is READ-ONLY. No business behaviour has been invented.  

---

## Classification Key

| Symbol | Meaning |
|---|---|
| ✅ CONFIRMED | Directly evidenced in source code or business-confirmed |
| 🔵 INFERRED | Logically derived from confirmed evidence |
| ❓ UNKNOWN | Cannot be determined from available evidence |
| ⚠️ CONFLICTING | Evidence sources contradict each other |

---

## Process Index

| ID | Process Name | Module | Confidence |
|---|---|---|---|
| BP-001 | User Login with Two-Factor Authentication | Authentication | HIGH |
| BP-002 | Forced / Voluntary Password Change | Authentication | HIGH |
| BP-003 | Self-Service Password Reset | Authentication | HIGH |
| BP-004 | Account Unlock by Administrator | Authentication | HIGH |
| BP-005 | User Logout | Authentication | HIGH |
| BP-006 | New User Registration | User Administration | HIGH |
| BP-007 | User Account Approval (Maker-Checker) | User Administration | HIGH |
| BP-008 | Profile and Permission Management | User Administration | MEDIUM |
| BP-009 | New Business Registration | Business Tracking | HIGH |
| BP-010 | Business File Forwarding | Business Tracking | HIGH |
| BP-011 | Document Upload to Business File | Business Tracking | HIGH |
| BP-012 | Risk Registration | Risk Register | HIGH |
| BP-013 | Risk Review and Sign-Off | Risk Register | MEDIUM |
| BP-014 | Risk Dashboard and Reporting | Risk Register | HIGH |
| BP-015 | Commission Processing Run | Settings | LOW |
| BP-016 | Production Month Management | Cross-Module | MEDIUM |

---

---

# BP-001 — User Login with Two-Factor Authentication

**Process ID:** BP-001  
**Process Name:** User Login with Two-Factor Authentication  
**Module:** Authentication  
**Source:** BR-AUTH-001 through BR-AUTH-020  

---

### Trigger
✅ CONFIRMED — User navigates to `Login.aspx` and submits credentials (username + password).

### Actor
✅ CONFIRMED — Any registered system user. Unauthenticated state.

### Input

| Input | Type | Required | Source |
|---|---|---|---|
| Username | Text | Yes | User entry |
| Password | Text (plaintext) | Yes | User entry |
| OTP (step 2) | 6-digit numeric | Yes | Email delivery |

### Pre-Condition
✅ CONFIRMED — A valid `License.fin` file must exist in the application root. Software license must be active (current date within `[STARTDATE]` and `[ENDDATE]`) and parameters must match database values.

---

### Validation

| Step | Rule | Source | Classification |
|---|---|---|---|
| 1 | License file must exist and be valid | BR-AUTH-001 | ✅ CONFIRMED |
| 2 | Username must not contain `--` or `'` | BR-AUTH-002 | ✅ CONFIRMED |
| 3 | Username must exist in `employees` table | BR-AUTH-003 | ✅ CONFIRMED |
| 4 | Password must match stored (decrypt-and-compare) | BR-AUTH-003 | ✅ CONFIRMED |
| 5 | Account must not be `EmployeeLocked = 1` | BR-AUTH-005 | ✅ CONFIRMED |
| 6 | Account must be `Approved = 1` | BR-AUTH-005 | ✅ CONFIRMED |
| 7 | Password must not be more than 30 days old | BR-AUTH-006 | ✅ CONFIRMED |
| 8 | OTP must match `Session("OTP")` | BR-AUTH-008 | ✅ CONFIRMED |
| 9 | OTP must not be older than 5 minutes | BR-AUTH-008 | ✅ CONFIRMED |

---

### Business Rules Applied

| Rule | Description |
|---|---|
| BR-AUTH-001 | License check gates all login attempts |
| BR-AUTH-005 | Account state machine: Activated / EmployeeLocked / Approved flags |
| BR-AUTH-006 | 30-day password expiry → forced change |
| BR-AUTH-007 | OTP generated via `System.Random` (CSPRNG required in new system) |
| BR-AUTH-009 | Failed attempts tracked in `Session("Loginattempts")` (defect: resets on new session) |
| BR-AUTH-010 | 3 failed attempts → auto-lock (`Activated=0, EmployeeLocked=1`) |
| BR-AUTH-016 | Client IP and session ID captured for audit |
| BR-AUTH-019 | `ActiveSession=1` set in `employees` table on success |
| BR-AUTH-021 | Active production month loaded from `SALES.dbo.TBL_MIS_PROD_MONTHS` |
| BR-AUTHZ-013 | On-call staff name and mobile loaded from `TBL_MIS_CRM_STAFF_ON_CALL` |

---

### Processing Steps

```
1. PAGE LOAD
   └─ LoadLicence(): Read License.fin + decrypt (Rijndael) + validate fields/dates
   └─ LoadSetup_Parameter(): Read FinLincClientName, FinLincAppName, FinLincVersion from CRM.LoadParamz
   └─ Machine_IP_Session(): Capture client IP and session ID
   └─ If license invalid → display error, STOP

2. CREDENTIAL SUBMISSION (btnlogin_Click)
   └─ Check username for -- or ' → if found: audit "Invalid login details", STOP
   └─ Call AdminLogin SP (username only) → returns user record
   └─ Decrypt stored password (Rijndael AES) → compare to txtPassword.Text
   └─ If no match or user not found → increment Session("Loginattempts")
       └─ If Loginattempts ≥ 3 → lock account (Activated=0, EmployeeLocked=1), audit, STOP
       └─ Else → display "Invalid Login Details!", STOP

3. ACCOUNT STATE CHECK (on password match)
   └─ Read: Activated, EmployeeLocked, Approved from user record
   └─ If EmployeeLocked=1 → audit "User Locked", display locked message, STOP
   └─ If Approved=0 → audit "Needs Approval", display approval message, STOP
   └─ If Activated=0 AND Approved=1 → audit "Needs Activation", redirect ChangePass.aspx, STOP

4. PASSWORD EXPIRY CHECK
   └─ Read LASTPASSWORDRESET from user record
   └─ If null → treat as today (no forced expiry)
   └─ If DateDiff(today, LASTPASSWORDRESET) ≥ 30 → redirect ChangePass.aspx, STOP

5. OTP GENERATION (Session("CannAccess") established)
   └─ Set Session variables: UserName, MyEmployeeID, Email, FullNames, MyProfileID, emp_code, LastLoginDate
   └─ Generate 6-digit OTP (System.Random — DEFECT)
   └─ Store OTP in Session("OTP"), timestamp in Session("OtpGeneratedTime")
   └─ SendOtpToEmail(): Send HTML email to user's registered address
   └─ Display OTP entry panel (Panel1)

6. OTP VALIDATION (btnSubmitOtp_Click)
   └─ If Session("OTP") empty → "OTP not found. Please request a new one.", STOP
   └─ If time since OtpGeneratedTime > 5 minutes → "OTP expired", clear OTP, STOP
   └─ If entered OTP ≠ Session("OTP") → "Invalid OTP. Please try again.", STOP
   └─ If match → audit "Successful Login."

7. POST-LOGIN SETUP
   └─ SET Employees.ActiveSession = 1
   └─ Load production month: SELECT MIN(DATE_FROM), MIN(DATE_TO) FROM SALES.TBL_MIS_PROD_MONTHS WHERE MONTH_CLOSED=0
   └─ Load on-call staff: SELECT Staff_On_Call, Staff_Mobile FROM TBL_MIS_CRM_STAFF_ON_CALL WHERE Date = today
   └─ Build dynamic menu from menuaccess WHERE PROFILEID={id} AND CANACCESS=1
   └─ Redirect to Welcome.aspx
```

### Approval
✅ CONFIRMED — Not applicable. Login is self-service. The account must already be in `Approved=1` state (set previously by maker-checker process BP-007).

### Status Changes

| Table | Column | Change | Trigger |
|---|---|---|---|
| `employees` | `ActiveSession` | 0 → 1 | Successful login |
| `employees` | `Activated` | 1 → 0 | 3rd failed attempt (lockout) |
| `employees` | `EmployeeLocked` | 0 → 1 | 3rd failed attempt (lockout) |

### Database Changes

| Database | Table | Operation | Data |
|---|---|---|---|
| CRM | `AdminAuditTrail` | INSERT | Every authentication event |
| CRM | `employees` | UPDATE | ActiveSession on success; lock flags on 3rd failure |
| SALES | `TBL_MIS_PROD_MONTHS` | SELECT | Production month date range |
| CRM | `TBL_MIS_CRM_STAFF_ON_CALL` | SELECT | On-call staff for today |
| CRM | `menuaccess` | SELECT | Profile permissions for menu |

### Notifications

| Event | Method | Recipient | Content |
|---|---|---|---|
| OTP | Email (smtp.office365.com) | User's registered email | HTML email with 6-digit OTP — subject "MIS OTP TOKEN" |

### External Systems
✅ CONFIRMED — smtp.office365.com (port 587) for OTP delivery.

### Output
✅ CONFIRMED — Authenticated session. User redirected to `Welcome.aspx` with role-appropriate dashboard.

### Exceptions

| Condition | Outcome | Audit Written |
|---|---|---|
| License invalid/expired | Login blocked | ❓ UNKNOWN |
| Username contains SQL characters | Blocked, audit | ✅ Yes |
| Username not found | "Invalid Login Details!" | ✅ Yes |
| Password mismatch | "Invalid Login Details!" | ✅ Yes |
| 3rd failed attempt | Account locked | ✅ Yes |
| Account locked | "Account Locked. Contact admin." | ✅ Yes |
| Account not approved | "Approval required." | ✅ Yes |
| Needs activation | Redirect to ChangePass.aspx | ✅ Yes |
| Password expired (30 days) | Redirect to ChangePass.aspx | 🔵 INFERRED |
| OTP expired | "OTP expired. Please request new one." | ❓ UNKNOWN |
| OTP mismatch | "Invalid OTP. Please try again." | ❓ UNKNOWN |

### Known Defects (must fix in new system)

| Defect | Impact |
|---|---|
| `System.Random` for OTP generation | Not cryptographically secure |
| Failed attempt counter in session only | Bypassable by clearing session |
| OTP retry attempts unlimited | Brute-force possible |
| Multiple concurrent sessions not prevented | Single-sign-on not enforced |
| `EnableSsl=False` on SMTP (port 587) | TLS not guaranteed (business confirms email works) |

---

---

# BP-002 — Forced / Voluntary Password Change

**Process ID:** BP-002  
**Process Name:** Forced / Voluntary Password Change  
**Module:** Authentication  
**Source:** BR-AUTH-013, BR-AUTH-014, BR-AUTH-022  

---

### Trigger
✅ CONFIRMED — Two triggers:
1. **Forced:** System redirects to `ChangePass.aspx` when `Activated=0` (new user first login) or password is ≥30 days old
2. **Voluntary:** User selects "Change Password" from the navigation menu

### Actor
✅ CONFIRMED — Authenticated user changing their own password. Or newly created user on first login (unauthenticated at point of redirect but session partially set).

### Input

| Input | Required | Validation |
|---|---|---|
| Current (old) password | Yes | Must match stored password |
| New password | Yes | Must differ from old; ≥6 chars (policy); ≥4 complexity checks |
| Confirm new password | Yes | Must equal new password |

### Validation

| Rule | Implementation | Source | Classification |
|---|---|---|---|
| Old password correct | Decrypt stored, compare | BR-AUTH-013 | ✅ CONFIRMED |
| New ≠ Old | Direct comparison | BR-AUTH-013 | ✅ CONFIRMED |
| New = Confirm | String equality | BR-AUTH-013 | ✅ CONFIRMED |
| Minimum length 6 chars | Business confirmed (code enforces 4 — defect) | BR-AUTH-013 + VAL-005 | ⚠️ CONFLICTING (code=4, policy=6) |
| ≥4 complexity checks | Uppercase + lowercase + numeric + special | BR-AUTH-013 | ✅ CONFIRMED |
| Password not in history | ❓ | BR-AUTH-022 (TBL_MIS_CRM_PASSWORD_CONF.Hist) | ❓ UNKNOWN — DB access required |

### Processing Steps

```
1. User submits old + new + confirm passwords
2. Read current encrypted password from employees table
3. Decrypt stored password (Rijndael) → compare with old password input
4. If mismatch → "Old password is incorrect", STOP
5. If new = old → "New password must differ from old", STOP
6. If new ≠ confirm → "Passwords do not match", STOP
7. Run CPasswordStrength.isPasswordStrong(new):
   - Check uppercase letters (MinUpperCaseChars ≥ 1)
   - Check lowercase letters (MinLowerCaseChars ≥ 1)
   - Check numerics (MinNumericChars ≥ 1)
   - Check special characters (MinSpecialChars ≥ 1)
   - Must pass ≥ 4 checks (hardcoded in ChangePass.aspx)
8. Encrypt new password (Rijndael AES)
9. UPDATE employees SET Password={encrypted}, Activated=1, LASTPASSWORDRESET={today}
10. Send ChangePassword notification email (FinMailType.ChangePassWord)
11. Redirect to login or welcome
```

### Status Changes

| Table | Column | Before | After |
|---|---|---|---|
| `employees` | `Activated` | 0 | 1 |
| `employees` | `LASTPASSWORDRESET` | old date | today |
| `employees` | `Password` | old encrypted | new encrypted |

### Database Changes

| Database | Table | Operation |
|---|---|---|
| CRM | `employees` | UPDATE (password, Activated, LASTPASSWORDRESET) |

### Notifications
✅ CONFIRMED — Password change notification email sent via `FinMailType.ChangePassWord` email type.

### Exceptions

| Condition | Outcome |
|---|---|
| Old password incorrect | Error displayed, STOP |
| New = old | Error displayed, STOP |
| Complexity check fails | Error displayed, STOP |
| Email send fails | ❓ UNKNOWN — 478 silent catch blocks may swallow failure |

---

---

# BP-003 — Self-Service Password Reset (Forgot Password)

**Process ID:** BP-003  
**Process Name:** Self-Service Password Reset  
**Module:** Authentication  
**Source:** BR-AUTH-015  

---

### Trigger
✅ CONFIRMED — User clicks "Forgot Password" link on `Login.aspx`.

### Actor
✅ CONFIRMED — Unauthenticated user who cannot log in.

### Input

| Input | Required |
|---|---|
| Username | Yes (already entered in login field) |

### Validation

| Check | Outcome if failed | Classification |
|---|---|---|
| Username exists in `employees` | Silent failure or error | ✅ CONFIRMED |
| User must be `Approved = 1` | "User requires approval" — no email sent | ✅ CONFIRMED |
| User must have a registered email | "No email address found" | ✅ CONFIRMED |

### Processing Steps

```
1. User enters username → clicks "Forgot Password"
2. Lookup EmployeeId by username
3. Check Approved = 1; if not → "User requires approval", audit, STOP
4. Retrieve email, username, name from employees table
5. If no email → "No email address found in user's records", audit, STOP
6. Generate 5-character random lowercase alphanumeric password (System.Random — DEFECT)
7. Encrypt new password (Rijndael)
8. UPDATE employees SET password={encrypted}, Activated=0, EMPLOYEELOCKED=0
9. Send email: username in plaintext + new password in plaintext (SECURITY RISK)
10. Display "A Random Password has been generated and sent to the user's Email Address."
11. Audit trail: "ReSend Back Office User Password"
```

### Status Changes

| Column | Change | Notes |
|---|---|---|
| `Password` | New generated value | 5-char random |
| `Activated` | → 0 | Forces password change on next login |
| `EMPLOYEELOCKED` | → 0 | Unlocks if was locked |

### Notifications
✅ CONFIRMED — Email with plaintext username and plaintext new password sent to user.  
⚠️ SECURITY RISK — New system must use one-time activation link, not plaintext password in email.

### Known Defects

| Defect | Risk |
|---|---|
| New password sent in plaintext email | Account takeover if email intercepted |
| System.Random for password generation | Predictable |
| No token expiry on reset flow | Reset is immediate; no link expiry needed (password changed directly) |

---

---

# BP-004 — Account Unlock by Administrator

**Process ID:** BP-004  
**Process Name:** Account Unlock by Administrator  
**Module:** Authentication / User Administration  
**Source:** BR-AUTH-011  

---

### Trigger
✅ CONFIRMED — Administrator unchecks "User Locked" checkbox on `UserDetails.aspx` for a locked account.

### Actor
✅ CONFIRMED — System Administrator with `CanEdit` permission on `UserDetails.aspx`.

### Processing Steps

```
1. Admin opens UserDetails.aspx for locked user
2. Admin unchecks chkUserLocked checkbox
3. System generates new 5-character random alphanumeric password (lowercase)
4. Encrypt new password (Rijndael)
5. UPDATE employees SET Password={encrypted}, Activated=0, EmployeeLocked=0
6. Admin separately clicks "Send Email" button to notify user of new password
```

### Status Changes

| Column | Before | After |
|---|---|---|
| `EmployeeLocked` | 1 | 0 |
| `Activated` | 0 | 0 (stays 0 — user must change password) |
| `Password` | locked-state password | new random password |

### Notifications
🔵 INFERRED — Admin must manually trigger the password email via a separate "Send Email" button. Email is NOT automatic on unlock.

---

---

# BP-005 — User Logout

**Process ID:** BP-005  
**Process Name:** User Logout  
**Module:** Authentication  
**Source:** BR-AUTH-020  

---

### Trigger
✅ CONFIRMED — User clicks "Log Out" in the navigation menu (rendered on every page).

### Actor
✅ CONFIRMED — Any authenticated user.

### Processing Steps

```
1. User clicks Log Out
2. KillActiveSession(): UPDATE employees SET ActiveSession=0 WHERE EmployeeID={id}
3. Session.Abandon() — clears all session variables
4. Redirect to Login.aspx
```

### Status Changes

| Table | Column | Change |
|---|---|---|
| `employees` | `ActiveSession` | 1 → 0 |

### Notes
✅ CONFIRMED — Session timeout (45 minutes) also effectively logs out the user by clearing session. However, `ActiveSession` in the DB is NOT reset on session timeout — only `Session.Abandon()` from the logout button resets it.  
❓ UNKNOWN — Whether stale `ActiveSession=1` records are cleaned up by any background job.

---

---

# BP-006 — New User Registration

**Process ID:** BP-006  
**Process Name:** New User Registration  
**Module:** User Administration  
**Source:** BR-AUTHZ-008, BR-AUTHZ-009, BR-AUTHZ-010  

---

### Trigger
✅ CONFIRMED — System Administrator opens `UserDetails.aspx` and creates a new employee record.

### Actor
✅ CONFIRMED — System Administrator with `CanAdd` permission on `UserDetails.aspx`.

### Input

| Field | Required | Source | Notes |
|---|---|---|---|
| Employee name | Yes | Admin entry | Display name |
| Username | Yes | Admin entry | Login identifier |
| Email address | Yes | Admin entry | OTP and notification delivery |
| Profile | Yes | Dropdown: ADMIN profiles only | Determines all permissions |
| Department | 🔵 INFERRED | Admin entry | Used in Risk Register scoping |
| Employee code | 🔵 INFERRED | Admin entry | Used in sales hierarchy |
| Additional fields | ❓ UNKNOWN | — | Full field list requires DB schema |

### Validation

| Check | Source | Classification |
|---|---|---|
| Profile must be ADMIN type (`PROFILETYPE='ADMIN'`) | BR-AUTHZ-002 | ✅ CONFIRMED |
| Username must be unique | 🔵 INFERRED | 🔵 INFERRED |
| SuperAdmin profile assignment restrictions | BR-AUTHZ-009 (commented code) | ❓ UNKNOWN |

### Processing Steps

```
1. Admin fills in user details form
2. System auto-populates txtPassword.Text = "password" (default — SECURITY RISK)
3. Admin selects profile from ADMIN profiles list
4. Admin saves record
5. System encrypts "password" using Rijndael AES
6. INSERT into employees: name, username, email, profile, dept, password(encrypted),
   Approved=0, Activated=0, Deleted=0, ActiveSession=0
7. System sends new user notification email (plaintext password in email — SECURITY RISK)
8. Record appears in approval queue (ApproveUserDetails.aspx)
```

### Status Changes (Initial State)

| Column | Value | Meaning |
|---|---|---|
| `Approved` | 0 | Awaiting second-user approval |
| `Activated` | 0 | User has not changed default password |
| `EmployeeLocked` | 0 | Account not locked |
| `ActiveSession` | 0 | Not logged in |
| `Password` | Encrypted "password" | Trivially guessable default |

### Notifications
✅ CONFIRMED — New user notification email sent with plaintext username and plaintext default password.  
⚠️ SECURITY RISK — New system must send one-time activation link, not credentials in email.

### Output
✅ CONFIRMED — Employee record created with `Approved=0`. Record queued for maker-checker approval (BP-007).

---

---

# BP-007 — User Account Approval (Maker-Checker)

**Process ID:** BP-007  
**Process Name:** User Account Approval (Maker-Checker)  
**Module:** User Administration  
**Source:** BR-AUTHZ-007, BR-AUTHZ-008  

---

### Trigger
✅ CONFIRMED — A user account exists with `Approved=0` (newly created or modified and awaiting approval). Approval queue visible on `ApproveUserDetails.aspx`.

### Actor
✅ CONFIRMED — System Administrator. Must be a **different user** from the one who created the account (four-eyes principle).  
⚠️ CONFLICTING — The intended four-eyes rule is coded and confirmed as business intent. However, the enforcement in `ApproveUserDetails.aspx.vb` is broken — both branches return `CanApprove=True`, meaning ANY administrator can currently approve ANY account including their own.

### Processing Steps

```
1. Second admin opens ApproveUserDetails.aspx
2. Approval queue displayed: WHERE Approved=0 AND Deleted=0
3. Admin selects account to review
4. INTENT: System checks if approver is same user as creator/modifier (BR-AUTHZ-007)
   ACTUAL: System always sets CanApprove=True (DEFECT — BR-AUTHZ-007)
5. Admin clicks Approve
6. UPDATE employees SET Approved=1, APPROVEDBY={approver name}, DateApproved={today},
   Activated=0 (user still must change password on first login)
7. Audit trail: "Accessed Admin users details approval page"
```

### Business Rules Applied

| Rule | Status |
|---|---|
| Approver must differ from creator | ✅ CONFIRMED (intent) / ⚠️ BROKEN (implementation) |
| Approval sets Approved=1 | ✅ CONFIRMED |
| Post-approval Activated=0 (password change required) | ✅ CONFIRMED |
| Only ADMIN-profile users can approve | 🔵 INFERRED |

### Status Changes

| Column | Before | After |
|---|---|---|
| `Approved` | 0 | 1 |
| `APPROVEDBY` | null | Approver's name |
| `DateApproved` | null | Today |
| `Activated` | 0 | 0 (unchanged — user must still change password) |

### Compliance Note
⚠️ CRITICAL DEFECT — In production today, any administrator can approve their own user records. A retrospective audit of `employees` records where `AddedBy = APPROVEDBY` should be conducted. New system must correctly enforce the four-eyes control.

---

---

# BP-008 — Profile and Permission Management

**Process ID:** BP-008  
**Process Name:** Profile and Permission Management  
**Module:** User Administration  
**Source:** BR-AUTHZ-001 through BR-AUTHZ-006  

---

### Trigger
✅ CONFIRMED — System Administrator opens `ProfilesRoles.aspx` to manage a profile's permissions.

### Actor
✅ CONFIRMED — System Administrator with access to `ProfilesRoles.aspx`.

### Processing Steps

```
1. Admin opens ProfilesRoles.aspx
2. Audit trail written: "Accessed Page for 'Profiles/User roles'"
3. Admin selects a profile from the ADMIN profiles list
4. System loads current menuaccess permissions for the selected profile
5. Admin modifies CANACCESS, CanAdd, CanEdit, CanDelete, ReadOnly for each page
6. Admin saves
7. UPDATE menuaccess WHERE PROFILEID={id}
```

### Data Changed
✅ CONFIRMED — `menuaccess` table: CANACCESS, CanAdd, CanEdit, CanDelete, ReadOnly per profile-page combination.

### Effect
✅ CONFIRMED — All users with the modified profile see changes immediately on next page navigation (menu and access checks are real-time from `menuaccess`).

### Audit
❓ UNKNOWN — Whether `UpDate_Profile` SP writes an audit trail entry. The page-level audit (step 2) is confirmed. SP-level audit is unknown without DB access.

---

---

# BP-009 — New Business Registration

**Process ID:** BP-009  
**Process Name:** New Business Registration  
**Module:** Business Tracking  
**Source:** BR-BT-001 through BR-BT-009, BR-BT-016, BR-BT-017  

---

### Trigger
✅ CONFIRMED — A Customer Service Desk (CSD) officer or Relationship Manager (RM) opens `Business_Tracking.aspx` to register a new insurance proposal.

### Actor
✅ CONFIRMED — Staff member with access to `Business_Tracking.aspx`. Membership Admin handles walk-in clients.

### Input

| Field | Required | Validation | Source |
|---|---|---|---|
| Business Type | Yes | N (New) or R (Renewal) | BR-BT-002 |
| Client Type | Yes | R (Retail) or C (Corporate) | BR-BT-002 |
| Agent | Yes | From COMMISSION.TBL_MIS_SALES_AGENTS | BR-BT-009 |
| Proposer Name | Yes | Free text, non-empty | BR-BT-002 |
| Rate Type | Auto-set | Derived from Client Type (not user-selectable) | BR-BT-003 |
| Membership Admin | If Walk-In | From Employees (MEMBERSHIP/NONMEDICAL dept) | BR-BT-005 |
| M-Tiba flag | No | Checkbox | BR-BT-006 |
| IPF flag | No | Checkbox | BR-BT-007 |
| Payment Reference | No | Groups files under one payment | BR-BT-008 |
| Receive Date | Yes (assumed) | Date picker | ❓ INFERRED |
| Document checklist | Yes | Docs from TBL_MIS_CRM_BUSINESS_REQ | BR-BT-004 |

### Validation

| Check | Rule | Source |
|---|---|---|
| All required fields completed | BR-BT-002 | ✅ CONFIRMED |
| Rate Type forced by Client Type | BR-BT-003 | ✅ CONFIRMED |
| Walk-In requires Membership Admin | BR-BT-005 | ✅ CONFIRMED |

### Processing Steps

```
1. Staff opens Business_Tracking.aspx
2. Default view: staff's own pending files (entered_by = username, Forwarded=0, Is_Active=1)
3. Staff selects Business Type → Client Type → Agent → Proposer Name
4. System auto-sets Rate Type: Corporate→C, Retail→S (BR-BT-003)
5. Staff selects documents received (from TBL_MIS_CRM_BUSINESS_REQ checklist)
6. If Walk-In client: staff selects Membership Admin from active MEMBERSHIP/NONMEDICAL staff
7. Staff optionally ticks M-Tiba, IPF, enters payment reference, premium amount
8. Staff clicks Save
9. Generate_Task(): File_No = {prefix}-F{MAX+1} (RACE CONDITION — must use sequence)
10. INSERT into TBL_MIS_CRM_BUSINESS_TRACKING with File_Status = 'REGISTERED'
11. For each checked document: INSERT into TBL_MIS_CRM_DOCS (Upload_Done=0)
12. INSERT comment into TBL_MIS_CRM_BUS_TRACKING_NOTES (if comment entered)
13. Grid refreshes to show pending files
```

### Approval
Not applicable at this step. Approval occurs downstream after forwarding.

### Status Changes

| Table | Column | Value | Meaning |
|---|---|---|---|
| `TBL_MIS_CRM_BUSINESS_TRACKING` | `File_Status` | `REGISTERED` | Initial state |
| `TBL_MIS_CRM_BUSINESS_TRACKING` | `Is_Active` | 1 | Active record |
| `TBL_MIS_CRM_BUSINESS_TRACKING` | `Forwarded` | 0 | Not yet forwarded |
| `TBL_MIS_CRM_DOCS` | `Upload_Done` | 0 | Acknowledged but not uploaded |

### Database Changes

| Database | Table | Operation |
|---|---|---|
| CRM | `TBL_MIS_CRM_BUSINESS_TRACKING` | INSERT |
| CRM | `TBL_MIS_CRM_BUS_TRACKING_NOTES` | INSERT (if comment) |
| Doc_Arc_DB | `TBL_MIS_CRM_DOCS` | INSERT per checked document |
| COMMISSION | `TBL_MIS_SALES_AGENTS` | SELECT (agent list) |
| SALES | `TBL_MIS_PROD_MONTHS` | SELECT (via session — production period) |

### Notifications
✅ CONFIRMED — None at registration stage. Notifications occur at forwarding (BP-010).

### Output
✅ CONFIRMED — Business file created in `REGISTERED` status. File appears in staff's pending files view.

---

---

# BP-010 — Business File Forwarding

**Process ID:** BP-010  
**Process Name:** Business File Forwarding  
**Module:** Business Tracking  
**Source:** BR-BT-010 through BR-BT-015  

---

### Trigger
✅ CONFIRMED — Staff member selects a `REGISTERED` file and clicks the Forward button.

### Actor
✅ CONFIRMED — Same staff member who registered the file (or their designate — INFERRED).

### Pre-Conditions

| Condition | Rule | Source |
|---|---|---|
| "Business is complete" checkbox ticked | BR-BT-011 | ✅ CONFIRMED |
| File number is selected | BR-BT-011 | ✅ CONFIRMED |
| Comment entered | BR-BT-011, BR-BT-013 | ✅ CONFIRMED |
| All documents uploaded (Upload_Done=1) | BR-BT-011, BR-BT-004 | ✅ CONFIRMED |

### Routing Logic (priority-ordered)

```
IF record has Medical_UW=1 (medical underwriting required)
   THEN → 'MEDICAL UW-REVIEW'

ELSE IF Allocated=1 AND Benefit_Verified='NO'
   THEN → 'BENEFIT VERIFICATION'

ELSE IF Allocated=1 AND Benefit_Verified='YES' AND INVOICED=0
   THEN → 'ALLOCATED'

ELSE IF INVOICED=1
   THEN → 'INVOICED'

ELSE IF Walk_In_Client=true AND Business='M' (medical walk-in)
   THEN → 'ALLOCATED', set Allocated_to = selected Membership Admin
        → Email notification to that admin

ELSE IF Business='N' (Non-Medical)
   THEN → 'FORWARDED'
        → Email to nonmedical@aar.co.ke

ELSE
   THEN → 'FORWARDED'
```

✅ CONFIRMED — BR-BT-012

### Processing Steps

```
1. Staff selects registered file
2. Ticks "Business is complete" checkbox
3. Enters mandatory comment
4. Clicks Forward
5. System checks all documents are Upload_Done=1
   └─ If any Upload_Done=0 → "You must upload the Missing Documents!", list shown, STOP
6. System evaluates routing logic (above) → determines target File_Status
7. UPDATE TBL_MIS_CRM_BUSINESS_TRACKING SET File_Status={target}, Forwarded=1
8. INSERT comment into TBL_MIS_CRM_BUS_TRACKING_NOTES
9. IF Walk-In medical → Email Membership Admin
10. IF Non-Medical → Email nonmedical@aar.co.ke
11. IF status = 'ALLOCATED' → set Allocated_to = admin username, Allocate_Dt = today
12. Grid refreshes
```

### Status Changes

| From Status | To Status | Condition |
|---|---|---|
| `REGISTERED` | `MEDICAL UW-REVIEW` | Medical UW required |
| `REGISTERED` | `BENEFIT VERIFICATION` | Allocated but benefit not verified |
| `REGISTERED` | `ALLOCATED` | Allocated + benefit verified, or walk-in medical |
| `REGISTERED` | `INVOICED` | Already invoiced (re-forward scenario?) |
| `REGISTERED` | `FORWARDED` | Non-medical or default |

### Notifications

| Condition | Recipient | Content |
|---|---|---|
| Non-Medical business forwarded | nonmedical@aar.co.ke | "Tracked and forwarded to Non-Medical Team for update!" |
| Walk-In medical forwarded | Selected Membership Admin's email | "You have been Allocated this business... TREAT AS AGENT!" |

### External Systems
✅ CONFIRMED — smtp.office365.com for email notifications.

---

---

# BP-011 — Document Upload to Business File

**Process ID:** BP-011  
**Process Name:** Document Upload to Business File  
**Module:** Business Tracking  
**Source:** BR-BT-016  

---

### Trigger
✅ CONFIRMED — Staff member uploads a document to an existing business file via `Business_Tracking.aspx` upload section.

### Actor
✅ CONFIRMED — Staff with access to Business_Tracking module.

### Input

| Field | Required | Validation |
|---|---|---|
| File | Yes | Extension must be in allowed list |
| Document title | Yes | Non-empty |
| File number | Yes (auto-selected from current file) | Active file |

### Allowed File Types
✅ CONFIRMED — `.doc, .docx, .xls, .xlsx, .jpg, .png, .gif, .jpeg, .pdf, .rar, .zip, .eml, .msg`

### Processing Steps

```
1. Staff selects file from disk + enters document title
2. System validates: file selected, title entered, file extension allowed
3. Store binary file content in Doc_Arc_DB.TBL_MIS_CRM_DOCS:
   - File_No = current file
   - Doc_Title = entered title
   - Doc_Date = today
   - File_Name = original filename
   - Upload_By = Session("UserName")
   - Upload_Done = 1 (document now uploaded)
4. UPDATE corresponding TBL_MIS_CRM_DOCS record: Upload_Done = 1
5. Grid refresh: document list updated
```

### Database Changes

| Database | Table | Operation | Data |
|---|---|---|---|
| Doc_Arc_DB | `TBL_MIS_CRM_DOCS` | INSERT/UPDATE | Binary file content + metadata |

### Architecture Note
⚠️ Documents stored as binary data in SQL Server. Max file size unknown. New system must use Object Storage (Replit) with metadata only in PostgreSQL.

---

---

# BP-012 — Risk Registration

**Process ID:** BP-012  
**Process Name:** Risk Registration  
**Module:** Risk Register  
**Source:** BR-RISK-001 through BR-RISK-008  

---

### Trigger
✅ CONFIRMED — A Risk Champion opens `Risk_Register_New.aspx` to register a new risk for their department.

### Actor
✅ CONFIRMED — Risk Champion: an MIS user whose `emp_code` appears in `TBL_MIS_RISK_CHAMPS` for a department.

### Pre-Conditions

| Condition | Source |
|---|---|
| User must be a registered Risk Champion | BR-RISK-003 |
| An open risk period must exist in TBL_MIS_RISK_PERIOD | BR-RISK-002 |
| User's department determines available owners and objectives | BR-RISK-004 |

### Input

| Field | Required | Source | Notes |
|---|---|---|---|
| Risk Title | Yes | Free text | — |
| Risk Description | Yes | Free text | — |
| Risk Category | Yes | TBL_MIS_RISK_CATEGORY | Department-filtered? |
| Department Objective | Yes | TBL_MIS_RISK_OBJE | Filtered by user's department |
| Risk Consequence | Yes | Free text | — |
| Risk Owner | Yes | TBL_MIS_RISK_OWNER | Filtered by user's department |
| Active flag | Yes | Checkbox | Is this risk currently active |
| Risk Impact | ❓ UNKNOWN | — | Input method not confirmed from available source |
| Risk Likelihood | ❓ UNKNOWN | — | Input method not confirmed |
| Current Controls | ❓ UNKNOWN | — | — |

### Processing Steps

```
1. Page load: system reads open period (MIN Period_From, Period_To WHERE Status='OPEN')
2. System identifies user's department from TBL_MIS_RISK_CHAMPS via emp_code
3. Load dropdowns filtered by department: owners (TBL_MIS_RISK_OWNER), objectives (TBL_MIS_RISK_OBJE)
4. Page opens in READ-ONLY mode (all fields disabled) — BR-RISK-008
5. User clicks EDIT to enable fields
6. Generate_Task(): Risk_Code = "FIN-R" + LPAD(MAX(Risk_Id)+1, 3, '0') (RACE CONDITION)
7. User completes all required fields
8. User clicks Save
9. DataManagement.update_register() → INSERT into TBL_MIS_RISK_MASTER with 30+ parameters
10. Compute_Risk_Values(department, riskCode, periodFrom, periodTo) → calculates:
    - I_Risk_Exposure, I_Risk_Rate, R_Risk_Rate, R_Risk_Exposure (formula UNKNOWN)
11. Grid refreshes: shows newly registered risk with heat-map colour coding
```

### Status Changes

| Table | Column | Value |
|---|---|---|
| `TBL_MIS_RISK_MASTER` | `Risk_Code` | New FIN-RNNN |
| `TBL_MIS_RISK_MASTER` | Various scoring fields | Computed by Compute_Risk_Values SP |

### Database Changes

| Database | Table | Operation |
|---|---|---|
| AAR_RISK_DB | `TBL_MIS_RISK_MASTER` | INSERT |
| AAR_RISK_DB | Computed via SP | UPDATE (risk scores) |
| CRM | `employees` | SELECT (emp_code → champion lookup) |

### Heat Map Colouring Applied
✅ CONFIRMED — After save, risk appears in grid with colour based on `R_Risk_Exposure`:
- >40: Red (Critical), 26-40: Orange (High), 15-25: Yellow (Medium), 7-14: Light Yellow, 1-6: Green (Low)

---

---

# BP-013 — Risk Review and Sign-Off

**Process ID:** BP-013  
**Process Name:** Risk Review and Sign-Off  
**Module:** Risk Register  
**Source:** BR-RISK-012  

---

### Trigger
🔵 INFERRED — A department's Risk Champion submits risks for review. A risk management reviewer then reviews and signs off.

### Actor
🔵 INFERRED:
- **Submit:** Risk Champion (department representative)
- **Review:** Risk Management team member
- **Sign-Off:** Senior Risk Management (or same reviewer — UNKNOWN)

### Workflow States (TBL_MIS_RISK_SUMMARY)

```
REGISTERED risks
      ↓
  [Champion submits]
      ↓ Submitted=1
  [Risk Manager reviews]
      ↓ Reviewed=1
  [Risk Manager signs off]
      ↓ Sign_off=1
  [Appears on management dashboard]
```

✅ CONFIRMED — BR-RISK-012 (state machine confirmed from dashboard filter `WHERE Reviewed=1 AND Sign_off=1`)

### Unknowns
❓ UNKNOWN — Which pages (`Risk_Register_Review.aspx`, `Risk_Status.aspx`) implement each step. These pages have not been read.  
❓ UNKNOWN — Whether a single person can both review and sign off, or if these must be different users.  
❓ UNKNOWN — Whether there is a time constraint between submit and review.

### Output
✅ CONFIRMED — Department's risks become visible in the management dashboard (`Risk_Register_Dashboard.aspx`) once `Reviewed=1 AND Sign_off=1`.

---

---

# BP-014 — Risk Dashboard and Reporting

**Process ID:** BP-014  
**Process Name:** Risk Dashboard and Reporting  
**Module:** Risk Register  
**Source:** BR-RISK-013, BR-RISK-014, BR-RISK-015, BR-RISK-016  

---

### Trigger
✅ CONFIRMED — Management user opens `Risk_Register_Dashboard.aspx`.

### Actor
🔵 INFERRED — Senior management or Risk Management team with dashboard access.

### Processing

```
On load:
1. Display 3 summary grids simultaneously:
   - GDDEPART: Departments with Reviewed=1 AND Sign_off=1 for open period
   - GDOVERAL: Top 15 risks by R_Risk_Exposure across all signed-off departments
   - GDOVERDUE: Top 10 risks with Action_Status='Behind schedule'

2. User selects department in GDDEPART
   → Load full risk list for that department + period
   → Load department's TBL_MIS_RISK_MASTER_SUMMARY (ranked by R_Risk_Exposure)
   → Load top 10 highest-exposure risks for that department

3. User selects report type from cborpt:
   - RR: Full risk register → export to Excel
   - RS: Risk summary (top 10) → export to Excel
   - T10: Top 15 by exposure → export to Excel
   - OD: Overdue risks → export to Excel
   - O10: Top 15 overdue → Crystal Report
   - CR: Closed risks → export to Excel

4. Export path: Session("Mytable") → Reports.aspx → Crystal Report or Excel
```

### External Output
✅ CONFIRMED — Excel export via `Session("Mytable")` and `Reports.aspx`. Crystal Report for overdue top 10.

---

---

# BP-015 — Commission Processing Run

**Process ID:** BP-015  
**Process Name:** Commission Processing Run  
**Module:** Settings  
**Source:** VAL-005 (business confirmed), DISC-008 (navigation map)  

---

### Trigger
❓ UNKNOWN — Administrator initiates commission run from `/Commission_run.aspx` (Settings module).

### Actor
🔵 INFERRED — System Administrator or Finance staff.

### Processing
❓ UNKNOWN — The page `/Commission_run.aspx` is confirmed in the navigation map under Settings. The page is NOT in /Legacy/CRM — it is in the second application. No source code available.

### Evidence Base

| Item | Classification |
|---|---|
| Page exists: /Commission_run.aspx | ✅ CONFIRMED (navigation map — DISC-008) |
| Commission data in COMMISSION database | ✅ CONFIRMED (BR-BT-009) |
| Commission SPs exist (names in DISC-003) | ✅ CONFIRMED |
| 8 Commission Crystal Reports exist | ✅ CONFIRMED (DISC-007) |
| Commission processing is SP-driven batch | ✅ CONFIRMED (VAL-005 business answer) |
| What the page does exactly | ❓ UNKNOWN |
| Trigger conditions, frequency, inputs | ❓ UNKNOWN |
| Approval required before run | ❓ UNKNOWN |

### Note
Commission processing is not a full CRUD module — it is a settings-level batch trigger. The commission calculation and data live in the COMMISSION database, accessed via SPs. Crystal Reports are the output mechanism.

---

---

# BP-016 — Production Month Management

**Process ID:** BP-016  
**Process Name:** Production Month Management (Active Period)  
**Module:** Cross-Module (affects all modules)  
**Source:** BR-AUTH-021  

---

### Trigger
🔵 INFERRED — An administrator opens or closes a production month in `SALES.dbo.TBL_MIS_PROD_MONTHS`.

### Business Significance
✅ CONFIRMED — The active production month is the date-range context for ALL business tracking, reporting, and dashboard data. It is loaded on every page via the master page.

### Query
✅ CONFIRMED:
```sql
SELECT MIN(DATE_FROM), MIN(DATE_TO) 
FROM SALES.[dbo].[TBL_MIS_PROD_MONTHS] 
WHERE [MONTH_CLOSED] = 0
```

### Unknowns
❓ UNKNOWN — What screen or process opens/closes production months. No ASPX page for period management has been identified in /Legacy/CRM or the navigation map (it may be a DBA/SP-level operation).  
❓ UNKNOWN — Whether a month can be re-opened after closing.  
❓ UNKNOWN — Whether month close triggers any batch processes.

---

*Document produced by: AI Engineering Agent — Business Process Reverse Engineering*  
*Source: Approved discovery evidence only. No business behaviour invented.*  
*Legacy /Legacy/CRM: READ-ONLY — no modifications made.*  
*Date: 2026-08-17*
