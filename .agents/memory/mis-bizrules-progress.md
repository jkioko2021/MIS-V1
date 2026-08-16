---
name: MIS Business Rules Extraction Progress
description: Which source files have been read and what documents produced; tracks extraction progress
---

## Completed (documents written)

| Source Files Read | Document Produced | Rules Confirmed |
|---|---|---|
| Login.aspx.vb, Verify_OTP.aspx.vb, ChangePass.aspx.vb, logout.aspx.vb, MasterPage.master.vb, CPasswordStrength.vb, Password_Config.aspx.vb | 03_Business_Rules/BR_Authentication.md | 22 rules |
| MasterPage.master.vb, ProfilesRoles.aspx.vb, UserDetails.aspx.vb, ApproveUserDetails.aspx.vb, AssignAdminAccessProfile.aspx.vb | 03_Business_Rules/BR_Authorization.md | 13 rules |
| Business_Tracking.aspx.vb | 03_Business_Rules/BR_BusinessTracking.md | 18 rules (partial — entry page only) |
| Risk_Register_New.aspx.vb, Risk_Register_Dashboard.aspx.vb | 03_Business_Rules/BR_RiskRegister.md | 16 rules (partial — 2/12 pages) |

## Module Specifications Written

| Spec | Wave | FR Count |
|---|---|---|
| 06_Module_Specifications/MOD_01_Authentication.md | 1 | 12 FRs |
| 06_Module_Specifications/MOD_02_User_Administration.md | 1 | 11 FRs |

## Architecture Documents Written

- 04_Current_Architecture/Current_Architecture_Overview.md
- 05_Target_Architecture/Target_Architecture_Overview.md

## Pending — Source Files Not Yet Read

**High priority (business critical):**
- Risk_Register_Open.aspx.vb, Risk_Register_Review.aspx.vb, Risk_Register_Close.aspx.vb, Risk_Register_Summary.aspx.vb
- Business_Tracking_Allocated.aspx.vb, Business_Tracking_Finance.aspx.vb, Business_Tracking_Dispatch.aspx.vb, Business_Tracking_Status.aspx.vb, Business_Tracking_Verify.aspx.vb

**Medium priority:**
- Reports.aspx.vb, Reports_Page.aspx.vb
- Activity_Tracking_Ret.aspx.vb
- Production_RE.aspx.vb

**Not yet read (35+ Business Tracking sub-pages, ~10 remaining Risk pages)**

**Why:** Legacy source is READ-ONLY; reading is the only way to extract business rules without DB access.

**How to apply:** When resuming, read the HIGH PRIORITY files first. Each session pick 4-6 files and write/update the business rules document before the session ends.
