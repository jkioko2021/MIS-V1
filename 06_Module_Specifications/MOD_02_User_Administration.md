# Module Specification — User Administration

**Document ID:** MOD-02  
**Module:** User Administration  
**Wave:** 1 (First implementation wave)  
**Project:** MIS Modernization  
**Date:** 2026-08-16  
**Status:** DRAFT — pending business review  
**Sources:** BR-AUTHZ, UserDetails.aspx.vb, ApproveUserDetails.aspx.vb, ProfilesRoles.aspx.vb, AssignAdminAccessProfile.aspx.vb, AdminAudit.aspx.vb, AdminProfile.aspx.vb  

---

## 1. Business Objective

Provide administrators with the tools to manage MIS system users throughout their lifecycle: creation, approval, profile assignment, password management, locking/unlocking, and deactivation. Enforce the four-eyes maker-checker principle on all user record changes. Provide audit visibility into all user-related actions.

---

## 2. Actors

| Actor | Description |
|---|---|
| System Administrator | Creates and manages user accounts, assigns profiles |
| Super Administrator | May have elevated rights including superadmin profile assignment (INFERRED — to be confirmed) |
| Approver | A different administrator who approves user records created by others |
| Employee/User | Subject of the user administration actions |
| System | Email notifications on account events |

---

## 3. Legacy Mapping

| Legacy Page | New Component | Notes |
|---|---|---|
| UserDetails.aspx | UserManagementPage + UserEditForm | Combined view/create/edit |
| ApproveUserDetails.aspx | UserApprovalQueue + UserApprovalDetail | Approval workflow |
| ProfilesRoles.aspx | ProfilePermissionsAdmin | Profile ↔ page permission mapping |
| AssignAdminAccessProfile.aspx | ProfileAssignmentPage | Assign profile to user |
| AssignAdminAccessProfile_.aspx | ProfileAssignmentPage (variant) | Investigate purpose |
| AdminAudit.aspx | AuditTrailViewer | Audit log search and report |
| AdminProfile.aspx | AdminProfilePage | Profile management |
| Password_Config.aspx | PasswordPolicyAdmin | In MOD-01 |
| Add_Employee SP | UserService.CreateUser() | Domain service |
| UpDate_Employee SP | UserService.UpdateUser() | Domain service |
| Add_Profile SP | ProfileService.CreateProfile() | Domain service |
| UpDate_Profile SP | ProfileService.UpdateProfile() | Domain service |

---

## 4. Functional Requirements

### FR-UADM-001 — Create User Account

**Description:** A system administrator must be able to create a new employee user account.

**Business rules applied:** BR-AUTHZ-009, BR-AUTHZ-010, BR-AUTHZ-008

**Pre-conditions:**
- Creating user is logged in and has `CanAdd = True` permission for the User Administration page
- Target username must be unique in the system

**Required fields (confirmed from UserDetails.aspx.vb):**
| Field | Required | Notes |
|---|---|---|
| Employee Name | Yes | Full name |
| Title | No | Job title / honorific |
| Office Extension | No | Phone extension |
| Cell Phone | No | Mobile number |
| Email | Yes | For OTP and notifications |
| Other Email | No | Secondary email |
| Username | Yes | Unique login identifier |
| Profile | Yes | Selected from ADMIN profiles only |
| Department | No | Department assignment |
| Days to Lock User | No | Auto-lock after N days of inactivity (0 = disabled) |
| User Locked | No | Manual lock flag |

**Process:**
1. Validate username uniqueness
2. Assign default password (NEW: generate cryptographically random temporary password)
3. Set `Activated = 0` (must change password on first login)
4. Set `Approved = 0` (requires four-eyes approval)
5. Call `Add_Employee` SP (or equivalent) to persist record
6. Write audit trail: "Employee added successfully: {username}, Profile: {profile}"
7. Send welcome email with UserID, username, and temporary password
8. Display: "Record Saved Successfully. Approval Required."

**Email sent:** FinMailType.New_User equivalent — welcome email with credentials

**Modern implementation note:** Replace plaintext password in welcome email with a one-time activation link that expires in 24 hours.

### FR-UADM-002 — Update User Account

**Description:** An administrator must be able to update an existing user account's details.

**Pre-conditions:**
- Editing user has `CanEdit = True` permission for User Administration
- Record must exist

**Updatable fields:** Employee Name, Title, Office Extension, Cell Phone, Email, Other Email, Profile, Department, DaysTolockUser, UserLocked flag

**Process:**
1. Load current record
2. Allow editing of fields (username NOT changeable after creation)
3. If account was locked (`AccountLocked = True` in legacy) and admin unchecks "User Locked":
   - Generate new temporary password
   - Set `Activated = 0` (force password change)
4. Save via `UpdateEmployees()` / `UpDate_Employee` SP
5. Mark record as `RecordStatus = "Update"` with `ModifiedBy = current user`
6. Write audit trail: "Updated Employee user: {username}, Profile: {profile}"
7. Display: "Record Updated Successfully. Approval Required."
8. Record queues for re-approval (since it was modified)

### FR-UADM-003 — Search / View Users

**Description:** An administrator must be able to search for and view user accounts.

**Search criteria (inferred from UserDetails.aspx MultiView structure):**
- By name
- By username
- By profile
- By status (active/locked/pending approval)

**Display fields:** Employee Name, Username, Profile, Email, Status, LastLoginDate, ApprovedBy, DateApproved

### FR-UADM-004 — User Approval Queue

**Description:** A designated approver must see all user records pending approval and be able to approve or reject them.

**Business rules applied:** BR-AUTHZ-007, BR-AUTHZ-008

**Queue filter:** `WHERE Approved = 0` (all users not yet approved)

**Display:** List of pending users with: Name, Username, Profile, AddedBy, DateAdded, RecordStatus

**Approval process:**
1. Approver selects a pending user record
2. System checks: `AuthorizedToApprove()` — approver must NOT be the same person who created/last modified the record (four-eyes principle — FIX legacy bug)
3. If same person: display "You are not authorized to approve this record because you created/updated this record." — block approval
4. Approver clicks Approve
5. System sets: `Approved = 1`, `APPROVEDBY = {approver name}`, `DateApproved = today`, `Activated = 0` (user must change password)
6. Write audit trail: "Successfully Approved Employee details: {username}"
7. Send approval notification email to the new user (includes credentials — modernized to activation link)
8. Remove from approval queue

**Note on legacy bug:** The current `ApproveUserDetails.aspx` returns `CanApprove = True` in all cases regardless of who created the record. The new system MUST implement the four-eyes rule correctly. This is a security control, not a convenience feature.

### FR-UADM-005 — Password Reset by Administrator

**Description:** An administrator must be able to reset a user's password and send it to the user.

**Business rules applied:** BR-AUTH-011, BR-AUTHZ-010

**Pre-conditions:** User must be `Approved = True`

**Process:**
1. Admin selects "Reset Password" for a user
2. System generates activation link (NEW) or temporary password (legacy)
3. System sends email to user's registered email address
4. System sets `Activated = 0` (user must change on first login)
5. System sets `EmployeeLocked = 0` (unlock if locked)
6. Write audit trail: "Password reset initiated for {username}"

**Legacy behavior:** Password was reset to a random 5-char lowercase alphanumeric and emailed in plaintext. New system must send an activation link instead.

### FR-UADM-006 — Lock / Unlock User

**Description:** An administrator must be able to manually lock or unlock a user account.

**Lock action:**
- Set `EmployeeLocked = 1` in Employees table
- Write audit trail
- User immediately unable to log in

**Unlock action:**
- Set `EmployeeLocked = 0` in Employees table
- Set `Activated = 0` (force password change)
- Generate new temporary password / activation link
- Write audit trail

### FR-UADM-007 — Automatic Account Lock (Inactivity)

**Description:** If a user has not logged in for a configured number of days (`DaysTolockUser`), the system should automatically lock their account.

**Source:** `DaysTolockUser` field in Employees table, `chkAutomaticLock` checkbox in UserDetails.aspx — CONFIRMED

**UNKNOWN:** The legacy application stores this value but the automatic lock mechanism (background job? SP?) is not visible from source code alone. Database access required to confirm whether an SQL Agent job implements this.

**Business rule:** If `DaysTolockUser > 0` and `LastLoginDate < (today - DaysTolockUser)`, then lock the account.

**Modern implementation:** Background service/scheduled job checks daily.

---

## 5. Profile Management

### FR-UADM-008 — View and Edit Profile Permissions

**Description:** An administrator must be able to view which pages and actions are permitted for each profile.

**Business rules applied:** BR-AUTHZ-001, BR-AUTHZ-003, BR-AUTHZ-006

**Source:** ProfilesRoles.aspx.vb — CONFIRMED

**Data displayed:** For each profile, a grid of all pages with columns: Add, Edit, Delete, ReadOnly permission checkboxes

**Save process:**
1. For each row in the permissions grid:
   - Update `menuaccess` table: `Set ReadOnly='{x}', CanDelete='{x}', CanEdit='{x}', CanAdd='{x}' WHERE PROFILEID='{id}' AND MENUACCESSID='{id}'`
2. Display: "Roles Saved Successfully."

**Access control on this page:** Only users with `CANADD` or `CANEDIT` can save. `CANREADONLY` users see the grid but Save is disabled.

### FR-UADM-009 — Profile Assignment to User

**Description:** An administrator must be able to assign a profile to a user.

**Source:** AssignAdminAccessProfile.aspx — CONFIRMED (code-behind not yet read)

**UNKNOWN:** Difference between `AssignAdminAccessProfile.aspx` and `AssignAdminAccessProfile_.aspx` — two pages with similar names. Requires further analysis.

### FR-UADM-010 — Create / Manage Profiles

**Description:** A super-administrator must be able to create new profiles and manage the list of pages associated with each profile.

**Source:** AdminProfile.aspx — CONFIRMED (code-behind not yet read)
**SPs involved:** `Add_Profile`, `UpDate_Profile`

---

## 6. Audit Trail Viewer

### FR-UADM-011 — Audit Trail Search and Report

**Description:** An administrator must be able to search the audit trail by action type, username, and date range.

**Source:** AdminAudit.aspx.vb — CONFIRMED (partial read)

**Search filters:**
- Action Type (Login, Actions, etc.) — `LstReports` dropdown
- Search mode: All users / Specific user by username (`rdosearch` radio)
- Date range filter: optional date from/to
- Username filter: text search on specific user

**Output:** Crystal Report (`AdminAudit.rpt`) rendered with selection formula

**Modern implementation:** Replace Crystal Report with a native data grid with export (CSV/Excel/PDF).

**Audit record fields displayed:**
- Username
- Action Type
- Action Date
- Description
- Page URL
- IP Address
- Session ID

---

## 7. Data Model

### 7.1 Employees Table (confirmed fields)

See MOD-01 §7.1 for full field list.

Additional fields relevant to User Administration:
| Field | Type | Description |
|---|---|---|
| DaysTolockUser | Integer | Auto-lock threshold (0 = disabled) |
| Department | Integer FK | Department reference |
| Title | Varchar | Job title |
| Cellphone | Varchar | Mobile number |
| OfficeExtension | Varchar | Phone extension |
| OtherEmail | Varchar | Secondary email |

### 7.2 Profile Table (partial — inferred)

| Field | Type | Description |
|---|---|---|
| PROFILEID | Integer PK | Profile identifier |
| PROFILENAME | Varchar | Profile display name |
| PROFILETYPE | Varchar | 'ADMIN' or other types |

### 7.3 MenuAccess Table (confirmed from source)

| Field | Type | Description |
|---|---|---|
| MENUACCESSID | Integer PK | Row identifier |
| PROFILEID | Integer FK | Profile this entry belongs to |
| MainMenuName | Varchar | Top-level menu group |
| SubMenuName | Varchar | Menu item label |
| PageUrl | Varchar | Target page (e.g., ~/Business_Tracking.aspx) |
| MENUORDER | Integer | Display order |
| CANACCESS | Boolean | Profile can access this page |
| CanAdd | Boolean | Profile can add records |
| CanEdit | Boolean | Profile can edit records |
| CanDelete | Boolean | Profile can delete records |
| ReadOnly | Boolean | Profile has read-only access |

### 7.4 Password Configuration Table

| Field | Type | Description |
|---|---|---|
| ID | Integer PK | Row identifier |
| Len | Integer | Minimum password length |
| Hist | Integer | Password history count |
| Lock_cnt | Integer | Lockout threshold |
| Is_Numeric | Boolean | Require numeric character |
| Is_special | Boolean | Require special character |
| Is_Capital | Boolean | Require uppercase character |
| Pass_Reset | Integer | Days before forced password reset |

---

## 8. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/users` | List users (with filters) | UserAdmin.Read |
| GET | `/api/users/{id}` | Get user detail | UserAdmin.Read |
| POST | `/api/users` | Create user | UserAdmin.Add |
| PUT | `/api/users/{id}` | Update user | UserAdmin.Edit |
| POST | `/api/users/{id}/lock` | Lock user | UserAdmin.Edit |
| POST | `/api/users/{id}/unlock` | Unlock user | UserAdmin.Edit |
| POST | `/api/users/{id}/reset-password` | Reset user password | UserAdmin.Edit |
| GET | `/api/users/pending-approval` | Approval queue | UserAdmin.Approve |
| POST | `/api/users/{id}/approve` | Approve user record | UserAdmin.Approve |
| GET | `/api/profiles` | List profiles | UserAdmin.Read |
| GET | `/api/profiles/{id}/permissions` | Get profile permissions | UserAdmin.Read |
| PUT | `/api/profiles/{id}/permissions` | Update profile permissions | UserAdmin.Edit |
| POST | `/api/profiles` | Create profile | UserAdmin.Add |
| GET | `/api/audit` | Search audit trail | UserAdmin.Read |

---

## 9. Screens Required

| Screen | Legacy Page | Notes |
|---|---|---|
| User List / Search | UserDetails.aspx (View2) | Searchable, filterable grid |
| User Create / Edit Form | UserDetails.aspx (View1) | Tab/panel for new vs edit |
| Approval Queue | ApproveUserDetails.aspx (View1) | List of pending approvals |
| User Approval Detail | ApproveUserDetails.aspx (View2) | Detail view for approval action |
| Profile List | AdminProfile.aspx | Manage profiles |
| Profile Permissions | ProfilesRoles.aspx | Page permission matrix |
| Profile Assignment | AssignAdminAccessProfile.aspx | Assign profile to user |
| Audit Trail Viewer | AdminAudit.aspx | Searchable audit log |
| Password Policy Admin | Password_Config.aspx | In MOD-01 |

---

## 10. Business Rules Summary

| Rule ID | Source | Priority |
|---|---|---|
| BR-AUTHZ-001 | Profile-based authorization | CRITICAL |
| BR-AUTHZ-002 | ADMIN profile type | HIGH |
| BR-AUTHZ-006 | Per-page CRUD permissions | CRITICAL |
| BR-AUTHZ-007 | Four-eyes approval — FIX LEGACY BUG | CRITICAL |
| BR-AUTHZ-008 | Approval required before account active | CRITICAL |
| BR-AUTHZ-009 | Profile assigned at creation | HIGH |
| BR-AUTHZ-010 | Default password → activation link (upgrade) | CRITICAL |
| BR-AUTHZ-011 | Audit on page access | HIGH |
| FR-UADM-007 | Automatic inactivity lock | MEDIUM — confirm mechanism |

---

## 11. Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-UADM-001 | What is the difference between AssignAdminAccessProfile.aspx and AssignAdminAccessProfile_.aspx? | Scope | Code analysis |
| OQ-UADM-002 | What profile types exist beyond 'ADMIN'? (DB access required) | Authorization model | DBA |
| OQ-UADM-003 | Is profile assignment to a user restricted by the assigning admin's own profile? (SuperAdmin rule) | Security | Business |
| OQ-UADM-004 | How does DaysTolockUser work — is there a SQL Agent job implementing this? | Account lifecycle | DBA |
| OQ-UADM-005 | What does AdminProfile.aspx do beyond profile creation — does it manage menu structure? | Scope | Code analysis |
| OQ-UADM-006 | Is there a deactivation (soft-delete) workflow distinct from locking? | Account lifecycle | Business |

---

*Document produced by: AI Engineering Agent — Module Specification Phase*  
*Status: DRAFT — requires business review before implementation*
