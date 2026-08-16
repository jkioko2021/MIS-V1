# Legacy Project Inventory

**Document ID:** DISC-002  
**Project:** MIS Modernization  
**Phase:** Discovery  
**Date:** 2026-08-16  
**Status:** CONFIRMED unless noted  
**Source:** Direct inspection of /Legacy/CRM  

---

## 1. Solution / Project Structure

| Item | Value | Classification |
|---|---|---|
| Solution Type | ASP.NET Web Application (Website project — no .sln or .csproj found) | CONFIRMED |
| Project Name | CRM | CONFIRMED |
| Project Type | ASP.NET Web Forms — Website (not Web Application project) | INFERRED |
| Root Namespace | Not explicit (page-level Partial Classes) | INFERRED |
| Target Framework | .NET 4.0 (web.config: targetFramework="4.0") | CONFIRMED |
| Language | VB.NET | CONFIRMED |
| Assembly References | Defined in web.config `<assemblies>` section | CONFIRMED |

---

## 2. Complete ASPX Page Inventory (76 pages)

### 2.1 Authentication Module (5 pages)

| Page | Code-Behind | Description | Classification |
|---|---|---|---|
| Login.aspx | Login.aspx.vb | Primary login page with OTP/2FA | CONFIRMED |
| logout.aspx | logout.aspx.vb | Session termination | CONFIRMED |
| ChangePass.aspx | ChangePass.aspx.vb | Password change | CONFIRMED |
| Registration.aspx | — | User self-registration | CONFIRMED |
| Verify_OTP.aspx | Verify_OTP.aspx.vb | OTP verification step | CONFIRMED |

### 2.2 User Administration Module (6 pages)

| Page | Code-Behind | Description | Classification |
|---|---|---|---|
| UserDetails.aspx | UserDetails.aspx.vb | View/manage user details | CONFIRMED |
| ApproveUserDetails.aspx | ApproveUserDetails.aspx.vb | User approval workflow | CONFIRMED |
| AdminAudit.aspx | AdminAudit.aspx.vb | Admin audit trail viewer | CONFIRMED |
| AdminProfile.aspx | AdminProfile.aspx.vb | Admin profile management | CONFIRMED |
| ProfilesRoles.aspx | ProfilesRoles.aspx.vb | Profile/role management | CONFIRMED |
| AssignAdminAccessProfile.aspx | AssignAdminAccessProfile.aspx.vb | Assign profiles to users | CONFIRMED |
| AssignAdminAccessProfile_.aspx | AssignAdminAccessProfile_.aspx.vb | Alternate profile assignment | CONFIRMED |
| Password_Config.aspx | Password_Config.aspx.vb | Password policy configuration | CONFIRMED |
| AccessDenied.aspx | — | Access denied message page | CONFIRMED |

### 2.3 Agent Management Module (1 page)

| Page | Code-Behind | Description | Classification |
|---|---|---|---|
| Agent_info.aspx | Agent_info.aspx.vb | Agent information management | CONFIRMED |

### 2.4 Business Tracking Module (35+ pages)

| Page | Description | Classification |
|---|---|---|
| Business_Tracking.aspx | Main business tracking dashboard | CONFIRMED |
| Business_Tracking_Addons.aspx | Business add-ons tracking | CONFIRMED |
| Business_Tracking_Allocated.aspx | Allocated business view | CONFIRMED |
| Business_Tracking_Alloc_NonMed.aspx | Non-medical allocation tracking | CONFIRMED |
| Business_Tracking_Dash_Clapi.aspx | CLAPI dashboard | CONFIRMED |
| Business_Tracking_Dash_Mship.aspx | Membership dashboard | CONFIRMED |
| Business_Tracking_Declined.aspx | Declined business tracking | CONFIRMED |
| Business_Tracking_Decline_Pay.aspx | Declined payment tracking | CONFIRMED |
| Business_Tracking_Delete.aspx | Delete business records | CONFIRMED |
| Business_Tracking_Dispatch.aspx | Dispatch tracking | CONFIRMED |
| Business_Tracking_Doc_ACK.aspx | Document acknowledgement | CONFIRMED |
| Business_Tracking_Filing.aspx | Filing tracking | CONFIRMED |
| Business_Tracking_Finance.aspx | Finance tracking | CONFIRMED |
| Business_Tracking_Finance_Clapi.aspx | CLAPI finance tracking | CONFIRMED |
| Business_Tracking_Fin_Dash.aspx | Finance dashboard | CONFIRMED |
| Business_Tracking_GI_Dashboard.aspx | GI (General Insurance) dashboard | CONFIRMED |
| Business_Tracking_IT.aspx | IT tracking | CONFIRMED |
| Business_Tracking_Not_Paid.aspx | Not-paid business tracking | CONFIRMED |
| Business_Tracking_Policydoc.aspx | Policy document tracking | CONFIRMED |
| Business_Tracking_Policy_Non.aspx | Non-medical policy tracking | CONFIRMED |
| Business_Tracking_Pol_Return.aspx | Policy return tracking | CONFIRMED |
| Business_Tracking_Pricing.aspx | Pricing tracking | CONFIRMED |
| Business_tracking_Reall_mship.aspx | Membership reallocation tracking | CONFIRMED |
| Business_Tracking_Receipted.aspx | Receipted business tracking | CONFIRMED |
| Business_Tracking_Retail.aspx | Retail business tracking | CONFIRMED |
| Business_Tracking_Returned.aspx | Returned business tracking | CONFIRMED |
| Business_Tracking_Reverse.aspx | Business reversal tracking | CONFIRMED |
| Business_Tracking_RM_Report.aspx | Relationship Manager report | CONFIRMED |
| Business_Tracking_Shared.aspx | Shared business tracking | CONFIRMED |
| Business_Tracking_Shwaari_status.aspx | Shwaari product status | CONFIRMED |
| Business_Tracking_SME_Corp.aspx | SME/Corporate tracking | CONFIRMED |
| Business_Tracking_Status.aspx | Business status view | CONFIRMED |
| Business_Tracking_TAT.aspx | Turnaround time tracking | CONFIRMED |
| Business_Tracking_Verify.aspx | Business verification | CONFIRMED |
| Business_Update_Status_Count.aspx | Status count update | CONFIRMED |
| Business_UW_TAT.aspx | Underwriting TAT | CONFIRMED |
| Business_tracking_adddocs.aspx | Add documents to business | CONFIRMED |
| Business_Status_CarePay.aspx | CarePay business status | CONFIRMED |

### 2.5 Business Allocation Module (8 pages)

| Page | Description | Classification |
|---|---|---|
| Business_Allocation_Ret.aspx | Retail allocation | CONFIRMED |
| Business_Allocation_Corp.aspx | Corporate allocation | CONFIRMED |
| Business_allocation_Clapi_Corp.aspx | CLAPI corporate allocation | CONFIRMED |
| Business_Allocated_Clapi.aspx | CLAPI allocated business | CONFIRMED |
| Business_allocated_Non_MED.aspx | Non-medical allocated business | CONFIRMED |
| Business_Tracking_Alloc_NonMed.aspx | Non-medical allocation tracking | CONFIRMED |
| Business_Medical_UW.aspx | Medical underwriting allocation | CONFIRMED |
| Business_Tracking_Corporate_Docs.aspx | Corporate document tracking | CONFIRMED |

### 2.6 Risk Register Module (11 pages)

| Page | Description | Classification |
|---|---|---|
| Risk_Register_Dashboard.aspx | Risk register dashboard | CONFIRMED |
| Risk_Register_New.aspx | New risk entry | CONFIRMED |
| Risk_Register_Open.aspx | Open risks list | CONFIRMED |
| Risk_Register_Close.aspx | Close a risk | CONFIRMED |
| Risk_Register_Closed.aspx | Closed risks list | CONFIRMED |
| Risk_Register_Review.aspx | Risk review | CONFIRMED |
| Risk_Register_Update.aspx | Update risk | CONFIRMED |
| Risk_Register_History.aspx | Risk history | CONFIRMED |
| Risk_Register_Summary.aspx | Risk summary | CONFIRMED |
| Risk_Status.aspx | Risk status view | CONFIRMED |
| Risk_Rating_Client.aspx | Client risk rating | CONFIRMED |
| Risk_Map_Champions.aspx | Risk champions map | CONFIRMED |

### 2.7 Reports Module (2 pages)

| Page | Description | Classification |
|---|---|---|
| Reports.aspx | Crystal Reports viewer (main) | CONFIRMED |
| Reports_Page.aspx | Reports listing/selection page | CONFIRMED |

### 2.8 Miscellaneous Pages (6 pages)

| Page | Description | Classification |
|---|---|---|
| Welcome.aspx | Welcome/landing page post-login | CONFIRMED |
| Activity_Tracking_Ret.aspx | Retail activity tracking | CONFIRMED |
| Accounts.ascx | Accounts user control | CONFIRMED |

---

## 3. Master Page

| Item | Detail | Classification |
|---|---|---|
| File | MasterPage.master / MasterPage.master.vb | CONFIRMED |
| Content PlaceHolders | Unknown count — requires .master file read | UNKNOWN |
| Navigation | Telerik RadMenu1 — profile-driven menu | CONFIRMED |
| Auth Guard | Session("FullNames") null check → redirect to Login | CONFIRMED |
| User Display | Label1=FullName, Label2=Date, Label4=Time, Label6=Staff On Call | CONFIRMED |
| Session Reset | DTFROM/DTTO reset on every page load from TBL_MIS_PROD_MONTHS | CONFIRMED |
| Auto-Refresh | Response.AddHeader("Refresh") based on session timeout | CONFIRMED |

---

## 4. User Controls

| Control | Code-Behind | Purpose | Classification |
|---|---|---|---|
| Accounts.ascx | Accounts.ascx.vb | Accounts display/interaction | CONFIRMED |

---

## 5. App_Code Classes

| File | Status | Purpose | Lines (approx) | Classification |
|---|---|---|---|---|
| DocManage.vb | ACTIVE | Core DAL + Document/Email/Messaging (DataManagement, Emailing, DocManagementSecurity namespaces) | 6,362 | CONFIRMED |
| Mail.vb | ACTIVE | Email sending utility — FinMailType enum, SMTP | 442 | CONFIRMED |
| SMSCOMMS.vb | ACTIVE | SMS via serial port/modem (AT commands) | 113 | CONFIRMED |
| MyEncryptDecrypt.vb | ACTIVE | Rijndael AES encrypt/decrypt — ICrypto interface | 79 | CONFIRMED |
| TwoFactorAuthentication.vb | ACTIVE | OTP generation — GenRandomKeys, ResponseCode, GenSerialKey | 68 | CONFIRMED |
| RandomKeyGenerator.vb | ACTIVE | Random key/OTP generation utility | Unknown | CONFIRMED |
| CPasswordStrength.vb | ACTIVE | Password complexity validation | 100 | CONFIRMED |
| CExcelGenerator.vb | EXCLUDED (.exclude) | Excel report generation | Unknown | CONFIRMED |
| CExcel.vb | EXCLUDED (.exclude) | Excel processing | Unknown | CONFIRMED |
| DataManagement.vb | EXCLUDED (.exclude) | Data management — DUPLICATE or OLD version of DAL | Unknown | CONFIRMED |
| DocumentManagement.vb | EXCLUDED (.exclude) | Document management — OLD version | Unknown | CONFIRMED |

> **NOTE:** `.exclude` files are source files the ASP.NET compiler ignores at runtime. They may represent: (1) older versions of active classes, (2) disabled features, or (3) code that was split into DocManage.vb. Their business logic may still be relevant.

---

## 6. Excluded Files

| File | Classification | Risk |
|---|---|---|
| Approve_Renewal_List.aspx.exclude | Intentionally disabled ASPX page | MEDIUM — business function may be inactive |
| Approve_Renewal_List.aspx.vb.exclude | Code-behind for disabled page | MEDIUM |
| CExcelGenerator.vb.exclude | Excel generation class disabled | LOW |
| CExcel.vb.exclude | Excel class disabled | LOW |
| DataManagement.vb.exclude | Old DAL class disabled | LOW |
| DocumentManagement.vb.exclude | Old document management disabled | LOW |
| Production_RE.aspx.vb | Code-behind with no matching .aspx | HIGH — orphaned file |

---

## 7. Scripts and Stylesheets

| File | Type | Purpose | Classification |
|---|---|---|---|
| scripts/Chart.js | JavaScript | Chart.js charting library | CONFIRMED |
| scripts/Chart.bundle.js | JavaScript | Chart.js bundled | CONFIRMED |
| scripts/Chart.bundle.min.js | JavaScript | Chart.js bundled minified | CONFIRMED |
| scripts/Chart.min.js | JavaScript | Chart.js minified | CONFIRMED |
| scripts/CN.js | JavaScript | Custom — purpose unknown | INFERRED |
| scripts/James_toolkit.js | JavaScript | Custom toolkit — purpose unknown | INFERRED |
| scripts/jquery-1.4.1.js | JavaScript | jQuery 1.4.1 (2010 — very old) | CONFIRMED |
| scripts/jquery-1.4.1.min.js | JavaScript | jQuery 1.4.1 minified | CONFIRMED |
| scripts/jquery-1.4.1-vsdoc.js | JavaScript | jQuery VS documentation | CONFIRMED |
| scripts/jquery-3.7.1.js | JavaScript | jQuery 3.7.1 (current — dual version) | CONFIRMED |
| scripts/wz_tooltip.js | JavaScript | Tooltip library | CONFIRMED |
| scripts/GlobalStyles.css | CSS | Global application styles | CONFIRMED |
| scripts/Sales.css | CSS | Sales module styles | CONFIRMED |

> **RISK:** Two conflicting jQuery versions (1.4.1 and 3.7.1) coexist. Actual loaded version per-page is unknown.

---

## 8. Image Assets

| File | Classification |
|---|---|
| Images/AARLogo.gif | AAR Insurance logo | CONFIRMED |
| Images/crm.GIF | Application logo | CONFIRMED |
| Images/ajax-loader1.gif | AJAX loading indicator | CONFIRMED |
| Images/footer-bg.gif | Footer background | CONFIRMED |
| Images/top-strip.gif | Header strip | CONFIRMED |
| Images/M_1.GIF, M3.GIF, marv_1.GIF | Navigation/UI icons | CONFIRMED |
| Images/Marvel.jpeg | Application branding image | CONFIRMED |
| Images/CR_M.jpg | Image — purpose unknown | UNKNOWN |
| Thumbs.db | Windows thumbnail cache — not application | CONFIRMED |

---

## 9. Data Directories

| Directory | Purpose | Classification |
|---|---|---|
| App_Data/PublishProfiles | IIS publish profiles | CONFIRMED |
| App_Data/RadUploadTemp | Telerik RadUpload temporary files | CONFIRMED |
| ErrorLogs/ | Error_Logs.txt (929KB active log) | CONFIRMED |
| EXCEL UPLOADS/ | Excel file import staging area | CONFIRMED |
| GeneratedReports/ | Crystal Reports output files | CONFIRMED |
| RENEWAL ADVICE/ | Renewal advice document output | CONFIRMED |
| Office12/ | Office 2007 interop resources | CONFIRMED |
| Office14/ | Office 2010 interop resources | CONFIRMED |

---

## 10. Configuration Files

| File | Purpose | Classification |
|---|---|---|
| web.config | Primary application configuration | CONFIRMED |
| packages.config | NuGet package manifest (log4net 2.0.10) | CONFIRMED |

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*Classification: SOURCE-CONFIRMED unless noted*  
*Modification of /Legacy is prohibited*
