# Workflow Catalogue

**Document ID:** BP-WF-001  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery — Business Process Reverse Engineering  
**Date:** 2026-08-17  
**Purpose:** Condensed linear flow representations of each business process for rapid reference and new-system design  
**Source:** Business_Process_Catalogue.md (BP-CAT-001), approved discovery evidence  

---

## Classification Key

| Symbol | Meaning |
|---|---|
| ✅ | Step confirmed from source code or business |
| 🔵 | Step inferred from confirmed evidence |
| ❓ | Step unknown — not evidenced |
| ⚠️ | Step has a known defect |
| [DB] | Database write operation |
| [EMAIL] | Email notification |
| [AUDIT] | Audit trail write |

---

---

## WF-001 — User Login

**Actors:** System User → System  
**Duration:** UNKNOWN (typically <2 min assuming email received promptly)  
**Failure rate in legacy:** UNKNOWN

```
USER                          SYSTEM                        EXTERNAL
────                          ──────                        ────────
Navigate to Login.aspx ──────►
                              ✅ Read License.fin
                              ✅ Validate license params vs DB
                              If invalid ───────────────────► STOP (error shown)
                              ✅ Capture client IP + session

Enter username/password ─────►
                              ✅ Check username for SQL chars
                              If bad chars ─────────────────► [AUDIT] STOP
                              ✅ Call AdminLogin SP (username)
                              ✅ Decrypt stored password (Rijndael)
                              ✅ Compare passwords

                              Password WRONG:
                              ⚠️ Increment Session("Loginattempts")
                              If attempts ≥ 3:
                                ✅ [DB] Activated=0, EmployeeLocked=1
                                ✅ [AUDIT] "Account locked"
                                ──────────────────────────► STOP

                              Account LOCKED:
                              ✅ [AUDIT] "User Locked" ──────► STOP

                              Not APPROVED:
                              ✅ [AUDIT] "Needs Approval" ───► STOP

                              Not ACTIVATED (Activated=0):
                              ✅ [AUDIT] "Needs Activation"
                              ──── Redirect to ChangePass.aspx ─► BP-002

                              Password OK, Account valid:
                              ✅ Set all Session() variables
                              ✅ Check password age (LASTPASSWORDRESET)
                              If age ≥ 30 days:
                              ──── Redirect to ChangePass.aspx ─► BP-002

                              ✅ Generate 6-digit OTP (⚠️ System.Random)
                              ✅ Store OTP + timestamp in Session
                              ✅ Display OTP entry panel

                                                            [EMAIL] OTP to user email
                                                            smtp.office365.com
                                                            Subject: "MIS OTP TOKEN"

Enter 6-digit OTP ───────────►
                              ✅ Check OTP not null
                              ✅ Check time < 5 minutes
                              If expired: "OTP expired" ────► STOP
                              ✅ Compare entered OTP vs Session("OTP")
                              If mismatch: "Invalid OTP" ──► STOP (unlimited retries ⚠️)

                              OTP valid:
                              ✅ [DB] employees.ActiveSession=1
                              ✅ [AUDIT] "Successful Login."
                              ✅ Load production month (SALES DB)
                              ✅ Load on-call staff (CRM DB)
                              ✅ Build menu from menuaccess
                              ──── Redirect to Welcome.aspx
```

---

## WF-002 — Password Change

**Actors:** Authenticated User → System  
**Trigger:** Voluntary (menu) or Forced (first login / 30-day expiry)

```
USER                          SYSTEM
────                          ──────
Open ChangePass.aspx ────────►
Enter old + new + confirm ───►
                              ✅ Decrypt stored password → compare with old
                              If mismatch: "Old password incorrect" ─► STOP
                              ✅ Check new ≠ old
                              If same: "Must differ from old" ────────► STOP
                              ✅ Check new = confirm
                              If mismatch: "Passwords do not match" ──► STOP
                              ✅ CPasswordStrength: check 4 complexity rules
                              ⚠️ Minimum length checked as 4 (policy=6, defect)
                              If strength fail: error ─────────────────► STOP
                              ✅ Encrypt new password (Rijndael)
                              ✅ [DB] UPDATE employees:
                                 Password={encrypted}
                                 Activated=1
                                 LASTPASSWORDRESET=today
                              [EMAIL] ChangePassword notification sent
                              ──── Redirect to login or welcome
```

---

## WF-003 — Self-Service Password Reset

**Actors:** Unauthenticated User → System  
**Trigger:** User clicks "Forgot Password" on Login.aspx

```
USER                          SYSTEM                        EXTERNAL
────                          ──────                        ────────
Enter username ───────────────►
Click "Forgot Password" ─────►
                              ✅ Lookup user by username
                              If not found: error ──────────────────► STOP
                              ✅ Check Approved=1
                              If Approved=0: "User requires approval" ► STOP
                              ✅ Check email exists on record
                              If no email: "No email address found" ──► STOP
                              ✅ Generate 5-char random password (⚠️ System.Random)
                              ✅ Encrypt new password (Rijndael)
                              ✅ [DB] UPDATE employees:
                                 password={encrypted}
                                 Activated=0
                                 EMPLOYEELOCKED=0
                              ✅ [AUDIT] "ReSend Back Office User Password"
                                                            ⚠️ [EMAIL] Plaintext
                                                            username + password
                                                            sent to user email
                              Display "Password sent to your email."
```

---

## WF-004 — New User Registration

**Actors:** System Administrator → System → Second Administrator  
**End state:** New account approved and user notified

```
ADMIN (CREATOR)               SYSTEM                        2ND ADMIN (APPROVER)
───────────────               ──────                        ────────────────────
Open UserDetails.aspx ───────►
                              ✅ [AUDIT] "Accessed page"
Complete user details ───────►
Select ADMIN profile ────────►
Click Save ──────────────────►
                              ✅ Validate: profile is ADMIN type
                              ✅ Auto-set password = "password" (⚠️ SECURITY RISK)
                              ✅ Encrypt "password" (Rijndael)
                              ✅ [DB] INSERT employees:
                                 Approved=0, Activated=0
                                 EmployeeLocked=0, ActiveSession=0
                              ⚠️ [EMAIL] Plaintext default password sent to new user
                              Record queued for approval (Approved=0)

                              (Account cannot be used until BP-007 approval)

                                                            Open ApproveUserDetails.aspx
                                                            ✅ [AUDIT] "Accessed approval page"
                                                            Review user details
                                                            Click Approve

                              ⚠️ AuthorizedToApprove() called
                              ⚠️ DEFECT: Always returns True (both branches)
                              ✅ [DB] UPDATE employees:
                                 Approved=1
                                 APPROVEDBY={approver name}
                                 DateApproved=today
                                 Activated=0 (user still must set password)

New user receives email ◄─────────────────── (email sent at creation, not approval)
User logs in for first time → Activated=0 → forced to BP-002 (ChangePass)
After password change: Activated=1 → account fully active
```

---

## WF-005 — New Business Registration and Forwarding

**Actors:** Customer Service / RM → System → Processing Teams  
**This is the core operational workflow of the MIS system**

```
STAFF (CSD/RM)                SYSTEM                        EXTERNAL
──────────────                ──────                        ────────
Open Business_Tracking.aspx ►
                              ✅ Load pending files for this user:
                                 WHERE entered_by=user AND Forwarded=0 AND Is_Active=1

── REGISTRATION PHASE ─────────────────────────────────────────────────

Select Business Type ────────►
Select Client Type ──────────►
                              ✅ Auto-set Rate Type:
                                 Corporate→C, Retail→S (BR-BT-003)
Select Agent ────────────────► (from COMMISSION.TBL_MIS_SALES_AGENTS)
Enter Proposer Name ─────────►
If Walk-In: select Membership Admin ►
Tick document checklist ─────►
Tick M-Tiba / IPF (optional)►
Enter premium / payment ref ►
Click Save ──────────────────►
                              ✅ Generate File_No: {prefix}-F{MAX+1} (⚠️ race condition)
                              ✅ [DB] INSERT TBL_MIS_CRM_BUSINESS_TRACKING
                                 File_Status='REGISTERED'
                                 Forwarded=0, Is_Active=1
                              ✅ [DB] INSERT TBL_MIS_CRM_DOCS per checked document
                                 Upload_Done=0
                              Grid refresh: file in pending list

── DOCUMENT UPLOAD PHASE ──────────────────────────────────────────────

Select file + title ─────────►
Click Upload ────────────────►
                              ✅ Validate: extension in allowed list
                              ✅ [DB] INSERT Doc_Arc_DB.TBL_MIS_CRM_DOCS
                                 Binary content, Upload_Done=1
                              (Repeat for each required document)

── FORWARDING PHASE ───────────────────────────────────────────────────

Tick "Business Complete" ────►
Enter mandatory comment ─────►
Click Forward ───────────────►
                              ✅ Check chkassembly ticked
                              ✅ Check comment not empty
                              ✅ Check all TBL_MIS_CRM_DOCS.Upload_Done=1
                              If any Upload_Done=0: "Upload Missing Documents!" ► STOP

                              ✅ Evaluate routing logic (priority order):
                              ┌─ Medical_UW=1?          → 'MEDICAL UW-REVIEW'
                              ├─ Allocated + no benefit? → 'BENEFIT VERIFICATION'
                              ├─ Allocated + verified?   → 'ALLOCATED'
                              ├─ Invoiced?               → 'INVOICED'
                              ├─ Walk-in + Medical?      → 'ALLOCATED' (direct to admin)
                              ├─ Non-Medical?            → 'FORWARDED'
                              └─ Default                  → 'FORWARDED'

                              ✅ [DB] UPDATE TBL_MIS_CRM_BUSINESS_TRACKING:
                                 File_Status={target}, Forwarded=1
                              ✅ [DB] INSERT comment into TBL_MIS_CRM_BUS_TRACKING_NOTES

                              If Walk-In medical:         [EMAIL] Membership Admin
                                                          "You have been allocated..."
                              If Non-Medical:             [EMAIL] nonmedical@aar.co.ke
                                                          "Tracked and forwarded..."

                              ── File now in target team's queue
```

**Downstream processing after FORWARDED:**  
❓ UNKNOWN — The subsequent steps (medical UW review, benefit verification, allocation, invoicing, dispatch, policy issue) require reading the 34 sub-pages of Business Tracking not yet analysed.

---

## WF-006 — Risk Registration and Management Cycle

**Actors:** Risk Champion → Risk Manager → Senior Management  
**Frequency:** Per risk period (UNKNOWN — typically quarterly? INFERRED)

```
RISK CHAMPION                 SYSTEM                        RISK MANAGER / MGMT
─────────────                 ──────                        ───────────────────

── REGISTRATION ────────────────────────────────────────────────────────

Open Risk_Register_New.aspx ►
                              ✅ Lookup emp_code → TBL_MIS_RISK_CHAMPS → department
                              ✅ Read open period: MIN(Period_From,Period_To) WHERE Status='OPEN'
                              ✅ Load owners, objectives filtered by department
                              ✅ Page opens READ-ONLY

Click Edit ──────────────────►
                              ✅ All fields enabled

Complete risk form ───────────►
  Title, Description, Category
  Objective (dept-filtered)
  Consequence
  Risk Owner (dept-filtered)
  Active flag

Click Save ──────────────────►
                              ✅ Generate Risk_Code: "FIN-R" + LPAD(MAX+1,3,'0') (⚠️ race)
                              ✅ [DB] INSERT AAR_RISK_DB.TBL_MIS_RISK_MASTER (30+ fields)
                              ✅ Compute_Risk_Values SP called:
                                 → Calculates I_Risk_Exposure, I_Risk_Rate,
                                   R_Risk_Rate, R_Risk_Exposure (❓ formula unknown)
                              Grid shows risk with heat-map colour:
                                 >40=Red, 26-40=Orange, 15-25=Yellow,
                                 7-14=Lt.Yellow, 1-6=Green

── SUBMIT → REVIEW → SIGN-OFF ──────────────────────────────────────────

[Submit step]                 ❓ UNKNOWN — page/screen not identified
                              ✅ [DB] TBL_MIS_RISK_SUMMARY.Submitted=1

                                                            [Review step]
                                                            ❓ UNKNOWN — Risk_Register_Review.aspx
                                                            ✅ [DB] Reviewed=1

                                                            [Sign-off step]
                                                            ❓ UNKNOWN — same or different actor?
                                                            ✅ [DB] Sign_off=1

                              Department now visible on management dashboard
                              (WHERE Reviewed=1 AND Sign_off=1)

── DASHBOARD VIEW ───────────────────────────────────────────────────────

                                                            Open Risk_Register_Dashboard.aspx
                              ✅ Display 3 grids:
                                 - Departments (reviewed+signed-off)
                                 - Top 15 risks by exposure
                                 - Top 10 overdue actions

                                                            Click department:
                              ✅ Load dept detail + top risks + summary

                                                            Select report type (RR/RS/T10/OD/O10/CR):
                              ✅ Export to Excel or Crystal Report
```

---

## WF-007 — Profile and Access Management

**Actors:** System Administrator → System  
**Frequency:** As needed (user onboarding, role changes)

```
ADMIN                         SYSTEM
─────                         ──────
Open ProfilesRoles.aspx ─────►
                              ✅ [AUDIT] "Accessed Profiles/User roles page"
                              ✅ Load ADMIN profiles list
Select profile ──────────────►
                              ✅ Load menuaccess permissions for this profile
                                 (CANACCESS, CanAdd, CanEdit, CanDelete, ReadOnly per page)
Modify permissions ───────────►
Click Save ──────────────────►
                              ✅ [DB] UPDATE menuaccess for all modified rows
                              Changes take effect immediately for all users with this profile
```

---

## WF-008 — Account Unlock

**Actors:** System Administrator → System → Locked User  
**Trigger:** User reports being locked out; admin opens UserDetails.aspx

```
ADMIN                         SYSTEM                        LOCKED USER
─────                         ──────                        ───────────
Open UserDetails.aspx ───────►
Find locked user account ────►
Uncheck "User Locked" ───────►
Click Save ──────────────────►
                              ✅ Generate 5-char random password (⚠️ System.Random)
                              ✅ Encrypt password (Rijndael)
                              ✅ [DB] UPDATE employees:
                                 EmployeeLocked=0
                                 Activated=0
                                 Password={new encrypted}
Click "Send Email" ──────────►
                              [EMAIL] New password sent to user   ──► User receives email
                                                                       with new credentials
                                                                       User logs in → BP-002
                                                                       (forced password change)
```

---

## Workflow State Summary — Business Tracking File

```
                    NEW REGISTRATION
                           │
                           ▼
                      [REGISTERED]
                           │
              ┌────────────┴──────────────┐
              │ Forward action            │ Cannot forward:
              │ (docs complete)           │ missing docs
              ▼                           │ no comment
     ┌────────────────┐                   │ not marked complete
     │ Routing Logic  │◄──────────────────┘
     └───────┬────────┘
             │
    ┌─────────────────────────────────┐
    │                                 │
    ▼                                 │
[MEDICAL UW-REVIEW]          [FORWARDED]──────[FORWARDED (Non-Med)]
    │                                 │
    ▼                                 ▼
[BENEFIT VERIFICATION]       [ALLOCATED]
    │                                 │
    └──────────────┬──────────────────┘
                   │
                   ▼
              [INVOICED]
                   │
                   ▼
           ❓ [FURTHER STATES UNKNOWN]
           (DISPATCHED? POLICY ISSUED? COMPLETE?)
```

---

## Workflow State Summary — Risk Register

```
Risk Champion registers risk:

[NOT REGISTERED]
       │
       ▼
   [REGISTERED] ──── Compute_Risk_Values SP
       │              assigns exposure score + heat-map colour
       ▼
  [SUBMITTED] (Submitted=1)
       │
       ▼
  [REVIEWED] (Reviewed=1)     ← Risk Manager action
       │
       ▼
  [SIGNED OFF] (Sign_off=1)   ← Senior management action
       │
       ▼
  [ON DASHBOARD]              ← Visible to management
       │
       ▼
 [CLOSED] (Action_status='Closed')
```

---

## Workflow State Summary — User Account Lifecycle

```
[CREATED]
   Approved=0, Activated=0
       │
       ▼
 [AWAITING APPROVAL]
   (in ApproveUserDetails queue)
       │
       ▼ (Second admin approves — ⚠️ defect: same admin can approve own records)
[APPROVED, NOT ACTIVATED]
   Approved=1, Activated=0
       │
       ▼ (User logs in with "password", forced to ChangePass.aspx)
[ACTIVE]
   Approved=1, Activated=1
       │
   ┌───┴────────────────────────────┐
   ▼                                ▼
[LOCKED]                     [PASSWORD EXPIRED]
EmployeeLocked=1             LASTPASSWORDRESET ≥ 30 days
   │                                │
   ▼ (Admin unlocks)                ▼ (Forced to ChangePass)
[UNLOCKED, NOT ACTIVATED]    [ACTIVE] (after change)
Activated=0 → user must
change password again
```

---

*Document produced by: AI Engineering Agent — Business Process Reverse Engineering*  
*Source: Approved discovery evidence only. No behaviour invented.*  
*Legacy /Legacy/CRM: READ-ONLY — no modifications made.*  
*Date: 2026-08-17*
