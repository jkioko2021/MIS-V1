# Business Rules — Authorization

**Document ID:** BR-AUTHZ  
**Project:** MIS Modernization  
**Phase:** Discovery — Business Rule Extraction  
**Date:** 2026-08-16  
**Source:** MasterPage.master.vb, ProfilesRoles.aspx.vb, UserDetails.aspx.vb, ApproveUserDetails.aspx.vb  
**Status:** CONFIRMED unless noted  

---

## 1. Overview

The legacy MIS system uses a **profile-based authorization model**. Every user belongs to exactly one profile. Each profile has a set of page-level and action-level permissions stored in the `menuaccess` table. Authorization is enforced on every page load by the master page.

```
User
 └── ProfileID
      └── menuaccess (one row per page per profile)
           ├── CANACCESS   (can see the page)
           ├── CanAdd      (can create records)
           ├── CanEdit     (can modify records)
           ├── CanDelete   (can delete records)
           └── ReadOnly    (read-only access)
```

---

## 2. Profile Model

### BR-AUTHZ-001 — Profile-Based Authorization

**Rule:** Every user has exactly one `ProfileID` which determines their entire authorization scope.

**Source:** UserDetails.aspx.vb line 107, Login.aspx.vb line 103 — CONFIRMED

**Evidence:**
- `Session("MyProfileID")` is set from `Myreader("ProfileID")` on login
- All subsequent authorization checks use `Session("MyProfileID")`
- Profile is assigned by an admin at user creation time

### BR-AUTHZ-002 — Profile Type Classification

**Rule:** Profiles are typed. The system recognizes `PROFILETYPE = 'ADMIN'` as the profile class for system users.

**Source:** ProfilesRoles.aspx.vb line 37, UserDetails.aspx.vb line 370 — CONFIRMED

```sql
Select PROFILEID, PROFILENAME FROM PROFILE WHERE PROFILETYPE = 'ADMIN'
```

**UNKNOWN:** Whether other PROFILETYPE values exist (e.g., 'USER', 'EXTERNAL'). Database access required to enumerate the PROFILE table.

---

## 3. Page Access Control

### BR-AUTHZ-003 — Page Access Check on Every Request

**Rule:** Every page request is intercepted by the master page, which queries the `menuaccess` table to determine if the current user's profile is permitted to access the requested page.

**Source:** MasterPage.master.vb `CanAccessPage()`, lines 364-397 — CONFIRMED

**Query:**
```sql
SELECT CANACCESS FROM menuaccess 
WHERE PROFILEID = {Session("MyProfileID")} 
AND PAGEURL = '~/{page.aspx}'
```

**Returns:** Scalar integer (0 or 1) cast to Boolean

**Access decision:**
- `CANACCESS = 1`: proceed to render page
- `CANACCESS = 0` or not found: redirect (empty redirect — see bug below)

**Bug identified:** If access is denied, `Response.Redirect("")` is called (line 91). An empty redirect URL redirects to the current page, creating potential infinite loops in some environments. The new system must redirect to a proper `AccessDenied` page or return HTTP 403.

### BR-AUTHZ-004 — Exempt Pages (No Access Check Required)

**Rule:** Three pages bypass the profile access check and are always accessible to any authenticated user:

| Page | Reason |
|---|---|
| `welcome.aspx` | Post-login landing page — all users see it |
| `changepassword.aspx` | All users must be able to change their password |
| `changepwdsuccess.aspx` | Post-change success page |

**Source:** MasterPage.master.vb lines 369-379 — CONFIRMED

**Note:** `ChangePass.aspx` is the active page but the exempt check uses `changepassword.aspx`. These must be the same page — either a name difference or the check is for a legacy page. The new system should use the actual route name.

---

## 4. Navigation Control

### BR-AUTHZ-005 — Menu Built Dynamically from Profile Permissions

**Rule:** The navigation menu is built at login time from the `menuaccess` table filtered by the current user's profile. Only menu items where `CANACCESS = 1` are included.

**Source:** MasterPage.master.vb `DisplayMenuItems1()`, lines 258-308 — CONFIRMED

**Process:**
1. Query distinct `MainMenuName` values from `menuaccess` where `PROFILEID = {id} AND CANACCESS = 1`
2. For each main menu item, query sub-menu items ordered by `mainmenuname, menuorder`
3. Build Telerik `RadMenu` with `MainMenu → SubMenu → PageUrl` hierarchy
4. Always append "Change Password" (→ `~/ChangePass.aspx`) to end of menu
5. Always append "Log Out" (→ `~/logout.aspx`) to end of menu

**Data structure in menuaccess:**
| Column | Purpose |
|---|---|
| `MenuAccessID` | Primary key |
| `PROFILEID` | FK to Profile |
| `MainMenuName` | Top-level menu group (e.g., "Business", "Reports") |
| `SubMenuName` | Menu item label |
| `PageUrl` | Target page URL (e.g., `~/Business_Tracking.aspx`) |
| `MENUORDER` | Ordering within a menu group |
| `CANACCESS` | Whether this profile can see this item |
| `CanAdd` | Add permission |
| `CanEdit` | Edit permission |
| `CanDelete` | Delete permission |
| `ReadOnly` | Read-only permission |

---

## 5. Action-Level Permissions

### BR-AUTHZ-006 — Per-Page CRUD Permissions

**Rule:** Each page entry in `menuaccess` carries four action-level permissions: Add, Edit, Delete, ReadOnly. Individual pages query these to enable/disable functionality.

**Source:** ProfilesRoles.aspx.vb lines 100-135, DataManagement class — CONFIRMED

**Permission methods (from DataManagement class):**
- `CANADD(profileID, pageName)` → Boolean
- `CANEDIT(profileID, pageName)` → Boolean
- `CANDELETE(profileID, pageName)` → Boolean
- `CANREADONLY(profileID, pageName)` → Boolean

**Example usage (ProfilesRoles.aspx.vb lines 15-23):**
```vb
If MyDbAction.CANADD(Session("MyProfileID"), MyPage) = True Then
    BtnSave.Enabled = True
ElseIf MyDbAction.CANEDIT(Session("MyProfileID"), MyPage) = True Then
    BtnSave.Enabled = True
ElseIf MyDbAction.CANREADONLY(Session("MyProfileID"), MyPage) = True Then
    BtnSave.Enabled = False
End If
```

**Business rule:** A user with `CANADD = True` OR `CANEDIT = True` can save. A user with only `ReadOnly = True` cannot save. These map to the Save button being enabled/disabled.

---

## 6. Four-Eyes Approval Principle

### BR-AUTHZ-007 — Maker-Checker: User Cannot Approve Their Own Records

**Rule:** A user who created or last modified a record cannot approve that same record.

**Source:** UserDetails.aspx.vb `AuthorizedToApprove()`, lines 473-499 — CONFIRMED (principle confirmed; see important note)

**Design intent:**
```
IF record was "New Record"
    THEN approver must NOT be the same as AddedBy
IF record was "Update"
    THEN approver must NOT be the same as ModifiedBy
```

**Implementation inconsistency found:** In `ApproveUserDetails.aspx.vb`, the `AuthorizedToApprove()` function (lines 153-181) returns `True` in ALL branches regardless of whether the same user created the record. Both the "same user" and "different user" branches set `CanApprove = True`. This means the four-eyes control is **not currently enforced** at the approval page despite the principle being coded in `UserDetails.aspx`.

**Classification:** LEGACY DEFECT — The business intent is clear (maker-checker). The implementation is broken. The new system must correctly enforce the four-eyes principle.

**Evidence of intent:** The correct logic IS present in `UserDetails.aspx.vb` and the UI shows "You are not authorized to approve this record because you created/updated this record."

### BR-AUTHZ-008 — Approval Required Before Account Activation

**Rule:** A newly created user account requires approval by a second user before it can be used.

**Source:** UserDetails.aspx.vb line 114, ApproveUserDetails.aspx.vb lines 102-146 — CONFIRMED

**Process:**
1. Admin creates user → `Approved = 0`, `Activated = 0`
2. Record appears in `ApproveUserDetails.aspx` queue (filter: `WHERE Approved = 0`)
3. Approving admin reviews and clicks Approve
4. System sets: `Approved = 1`, `APPROVEDBY = {approver name}`, `DateApproved = today`, `Activated = 0`
5. **Note:** Approval sets `Activated = 0` — the new user must still change their default password on first login before the account is fully active

---

## 7. User Administration Permissions

### BR-AUTHZ-009 — Profile Assignment at User Creation

**Rule:** When creating a new user, the administrator selects a profile from the list of ADMIN profiles. The user inherits all permissions of the selected profile.

**Source:** UserDetails.aspx.vb line 107 — CONFIRMED

**Constraint:** Only profiles where `PROFILETYPE = 'ADMIN'` can be assigned.

**UNKNOWN:** Whether there is a constraint on which profiles a given admin can assign. For example, can a non-superadmin assign a superadmin profile? The commented code suggests this was being enforced at some point:
```vb
'If ProfileName <> "SuperAdmin" Then LblErr.Text = "You are not authorized to assign the selected profile to this user."
```
**Classification:** INFERRED — Super-admin profile assignment may be restricted. Business clarification required.

### BR-AUTHZ-010 — Default Password on User Creation

**Rule:** When a new user is created by an administrator, the system assigns the literal password `"password"` as the default, encrypted with Rijndael.

**Source:** UserDetails.aspx.vb line 102: `txtPassword.Text = "password"` — CONFIRMED

**Critical security finding:** The default password is the string literal `"password"`. The account is created with `Activated = 0`, forcing the user to change this on first login. However, if the approval step email is intercepted or the account is accessed before the user changes the password, the default is trivially guessable.

**Modern requirement:** New system must generate a cryptographically random initial password (or preferably send a one-time activation link rather than any password at all).

---

## 8. Audit Trail for Authorization Events

### BR-AUTHZ-011 — Audit Trail on Page Access

**Rule:** Accessing certain high-sensitivity pages triggers an audit trail entry.

**Source:** ProfilesRoles.aspx.vb lines 26-29, ApproveUserDetails.aspx.vb lines 18-22 — CONFIRMED

**Pages that write access audit entries:**
- `ProfilesRoles.aspx` → "Accessed Page for 'Profiles/User roles'"
- `ApproveUserDetails.aspx` → "Accessed Admin users details approval page"

**INFERRED:** Additional pages likely write access audit entries. Full enumeration requires reading all 76 page code-behind files. The pattern is consistent across sampled pages.

### BR-AUTHZ-012 — Audit Trail on Profile Changes

**Rule:** Saving profile permissions writes an audit record.

**Source:** Not explicitly confirmed in ProfilesRoles.aspx.vb — UNKNOWN

**Note:** The save function in ProfilesRoles.aspx.vb does not explicitly call `AddAdminAuditTrail()`. This may be an oversight in the legacy implementation or the audit may occur at the DataManagement level. **UNKNOWN** until stored procedure `UpDate_Profile` body is inspected.

---

## 9. Staff On-Call Display

### BR-AUTHZ-013 — On-Call Staff Information

**Rule:** The master page displays the current on-call staff member's name and mobile number on every page.

**Source:** MasterPage.master.vb lines 76-81 — CONFIRMED

**Query:**
```sql
SELECT [Staff_On_Call],[Staff_Mobile] FROM [CRM].[dbo].[TBL_MIS_CRM_STAFF_ON_CALL] 
WHERE [Date] = CONVERT(char(10), GetDate(), 126)
```

**Display:** Labels `Label6` (name) and `Label7` (mobile)

**Business significance:** This is a real-time operational feature — staff can see who is on call for the day without leaving the application.

---

## 10. Authorization Summary Table

| Rule ID | Rule | Classification | Modern Priority |
|---|---|---|---|
| BR-AUTHZ-001 | Profile-based authorization | CONFIRMED | MUST PRESERVE |
| BR-AUTHZ-002 | ADMIN profile type | CONFIRMED | MUST PRESERVE — confirm all types |
| BR-AUTHZ-003 | Page access check on every request | CONFIRMED | MUST PRESERVE — use middleware |
| BR-AUTHZ-004 | Exempt pages (welcome, change password) | CONFIRMED | MUST PRESERVE |
| BR-AUTHZ-005 | Dynamic menu from profile permissions | CONFIRMED | MUST PRESERVE |
| BR-AUTHZ-006 | Per-page CRUD permissions | CONFIRMED | MUST PRESERVE |
| BR-AUTHZ-007 | Four-eyes approval principle | CONFIRMED / LEGACY DEFECT | MUST PRESERVE + FIX |
| BR-AUTHZ-008 | Approval required before account active | CONFIRMED | MUST PRESERVE |
| BR-AUTHZ-009 | Profile assigned at user creation | CONFIRMED | MUST PRESERVE |
| BR-AUTHZ-010 | Default password "password" | CONFIRMED / SECURITY RISK | REPLACE with activation link |
| BR-AUTHZ-011 | Audit on page access | CONFIRMED | MUST PRESERVE |
| BR-AUTHZ-012 | Audit on profile changes | UNKNOWN | MUST PRESERVE — verify |
| BR-AUTHZ-013 | On-call staff display | CONFIRMED | MUST PRESERVE |

---

*Document produced by: AI Engineering Agent — Business Rule Extraction*  
*Source: /Legacy/CRM — READ-ONLY, no modifications made*
