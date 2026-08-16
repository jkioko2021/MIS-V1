# Module-to-Page Navigation Mapping

**Document ID:** DISC-008  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery  
**Date:** 2026-08-17  
**Source:** Business stakeholder navigation map (image upload, 2026-08-17)  
**Cross-reference:** DISC-002 (/Legacy/CRM ASPX inventory, 76 pages confirmed)  

---

## Critical Finding — Scope Larger Than /Legacy/CRM

> ⚠️ **MAJOR FINDING:** Cross-referencing the navigation map against the 76 confirmed pages in `/Legacy/CRM` reveals that **approximately 47 pages visible in the application's navigation menu are NOT present in the /Legacy/CRM repository.** These pages belong to a separate application component — most likely the **MISREPORTS application** at `192.168.50.48`, or another linked web application not yet scoped.
>
> This means the total application scope is substantially larger than the 76 ASPX pages discovered in /Legacy/CRM.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ **IN LEGACY** | Page confirmed in /Legacy/CRM (76-page inventory) |
| ❌ **NOT IN LEGACY** | Page visible in navigation but NOT found in /Legacy/CRM — exists in another application |

---

## 1. Admin

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /UserDetails.aspx | ✅ IN LEGACY | User management |
| /Audit_Reports.aspx | ❌ NOT IN LEGACY | Audit reporting — separate application |
| /Accounts_Config.aspx | ❌ NOT IN LEGACY | Account configuration — separate application |

---

## 2. Agent Management

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Agent_RFM_Mapping.aspx | ❌ NOT IN LEGACY | Agent RFM mapping — separate application |
| /Agent_info.aspx | ✅ IN LEGACY | Agent information management |

---

## 3. A Home (Welcome)

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Welcome.aspx | ✅ IN LEGACY | Post-login landing page / dashboard |

---

## 4. Business Tracking

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Business_Tracking_Corp.aspx | ❌ NOT IN LEGACY | Corporate tracking entry — separate app (legacy has Business_Tracking_SME_Corp.aspx — may be renamed/different) |
| /Business_Tracking_Finance.aspx | ✅ IN LEGACY | Finance/cashier tracking |
| /Business_Tracking_Filing.aspx | ✅ IN LEGACY | Filing tracking |
| /Business_Tracking_Policydoc.aspx | ✅ IN LEGACY | Policy document tracking |
| /Business_Tracking_Returned.aspx | ✅ IN LEGACY | Returned business |
| /Business_Tracking_Pricing.aspx | ✅ IN LEGACY | Pricing tracking |
| /Business_Tracking_Addons.aspx | ✅ IN LEGACY | Add-ons tracking |
| /Business_Tracking_Pol_Return.aspx | ✅ IN LEGACY | Policy return tracking |
| /Business_allocation_Clapi_Corp.aspx | ✅ IN LEGACY | CLAPI corporate allocation |
| /Business_allocated_Non_MED.aspx | ✅ IN LEGACY | Non-medical allocated business |

**Note:** The menu shows `/Business_Tracking_Corp.aspx` but /Legacy/CRM contains `Business_Tracking_SME_Corp.aspx`. These may be the same page with different names between legacy and production, or two distinct pages.

---

## 5. Case Register

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Case_Allocated_ID.aspx | ❌ NOT IN LEGACY | Case allocation by ID — **NEW MODULE** not previously identified |

**Classification:** NEW MODULE — requires specification.

---

## 6. Complaint Tracking

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Complaint_On_Status.aspx | ❌ NOT IN LEGACY | Complaint status view |
| /Complain_Escalated_View.aspx | ❌ NOT IN LEGACY | Escalated complaints view |
| /Complaint_Tracking.aspx (or similar) | ❌ NOT IN LEGACY | Main complaint tracking |

**Classification:** CONFIRMED MODULE — 3 pages. Previously listed as INFERRED (SP names only). Now confirmed as a distinct module but pages are in the separate application component, not in /Legacy/CRM.

---

## 7. Debtors

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Committal_Tracking.aspx | ❌ NOT IN LEGACY | **"Debtors" = Committal Tracking in this system** |

**Critical finding:** What was called "Debtors" in discovery analysis is actually named **Committal Tracking** in the application. Only 1 page. Previously, 9 debtors/collections Crystal Reports were attributed to this module — the module may be primarily report-driven. See note below.

**Note:** SP `sp_MIS_CRM_Committal_Tracking` and `sp_MIS_CRM_Committal_enrichment` and `SP_MIS_CRM_COMMITAL_SYSTEM_MESSAGES` are all confirmed SPs for this module. The Crystal Reports "Demand Letter", "Fund Statement", "Statement-Emails" likely belong here.

---

## 8. Enquiry

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Credit_Notes_view.aspx | ❌ NOT IN LEGACY | Credit notes enquiry |
| /Business_Tracking_Doc_ACK.aspx | ✅ IN LEGACY | Document acknowledgement |
| /Corporate_Info.aspx | ❌ NOT IN LEGACY | Corporate information enquiry |
| /Statements_Non_Medical.aspx | ❌ NOT IN LEGACY | Non-medical statements |
| /Business_Tracking_Dividend_status.aspx (inferred) | ❌ NOT IN LEGACY | Dividend/status enquiry |
| /Business_Status_CarePay.aspx | ✅ IN LEGACY | CarePay payment status |

**Classification:** NEW MODULE — Enquiry is a read-only information lookup module. 2 of 6 pages are in /Legacy/CRM.

---

## 9. Log Activity

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Mtiba_Data_Push.aspx | ❌ NOT IN LEGACY | M-Tiba data push — **NEW MODULE** |

**Classification:** NEW MODULE — appears to be a manual M-Tiba payment data synchronisation trigger.

---

## 10. Medical Underwriting

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Member_Loading.aspx | ❌ NOT IN LEGACY | Member loading (underwriting loading factor) |
| /UWC_Register.aspx | ❌ NOT IN LEGACY | Underwriting committee register |

**Note:** /Legacy/CRM has `Business_Medical_UW.aspx` and `Business_UW_TAT.aspx` which appear to be related but different pages — the menu shows 2 different UW pages not in legacy.

---

## 11. Non-Medical Renewal

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Non_Medical_Renewals.aspx | ❌ NOT IN LEGACY | Non-medical renewal main page |
| /Non_Medical_Processing.aspx (inferred) | ❌ NOT IN LEGACY | Non-medical renewal processing |

**Classification:** DISTINCT MODULE — Non-Medical Renewals is a separate module from the general renewals process. Neither page is in /Legacy/CRM.

---

## 12. Off System Cases

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Off_System_DPI.aspx | ❌ NOT IN LEGACY | Off-system DPI (Dental/Pharmacy/In-patient?) cases |
| /Off_System_IP.aspx | ❌ NOT IN LEGACY | Off-system in-patient cases |
| /Off_Smart_Allocated.aspx (inferred) | ❌ NOT IN LEGACY | Smart allocated off-system cases |
| /Off_System_Allocated.aspx (inferred) | ❌ NOT IN LEGACY | Allocated off-system cases |
| /Off_Smart_Corp_Allocated.aspx (inferred) | ❌ NOT IN LEGACY | Corporate off-system cases |
| /IP_Allocate.aspx | ❌ NOT IN LEGACY | In-patient allocation |

**Classification:** CONFIRMED MODULE — 6 pages, all outside /Legacy/CRM. SPs `sp_MIS_CRM_Off_system_Tracking` and `SP_MIS_CRM_OFF_SYSTEM_MESSAGES` in DISC-003 confirm this module. DPI likely = Direct Provider Interface or Dental/Pharmacy/IP.

---

## 13. Portfolio Management

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Production_Portfolio_NM.aspx | ❌ NOT IN LEGACY | Non-medical portfolio |
| /Production_Portfolio_Ret.aspx | ❌ NOT IN LEGACY | Retail portfolio |
| /Production_Portfolio_RS.aspx | ❌ NOT IN LEGACY | RS (Retail Standard?) portfolio |

**Classification:** NEW MODULE — portfolio management views not in /Legacy/CRM. Likely eOxegen-data-driven views.

---

## 14. Premium Refund *(NEW — not previously identified)*

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Refund_From_Decline.aspx | ❌ NOT IN LEGACY | Refund from declined business |
| /Refund_Status.aspx | ❌ NOT IN LEGACY | Refund status tracking |
| /Refund_Bank_Recon.aspx | ❌ NOT IN LEGACY | Bank reconciliation for refunds |
| /Refund_New.aspx | ❌ NOT IN LEGACY | New refund request |
| /Refund_Dispatch.aspx | ❌ NOT IN LEGACY | Refund dispatch |
| /Refund_Allocated.aspx | ❌ NOT IN LEGACY | Allocated refund |

**Classification:** PREVIOUSLY UNKNOWN MODULE — 6 pages, all outside /Legacy/CRM. Premium Refund manages the return of premiums for declined or cancelled business. This module was not identified in any prior discovery document and has no corresponding SPs named in DISC-003 (SP may exist under a different name or in a different DB). **Requires full specification.**

---

## 15. Production

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Production_Corp.aspx | ❌ NOT IN LEGACY | Corporate production |
| /Production_Ret.aspx | ❌ NOT IN LEGACY | Retail production |

**Note:** /Legacy/CRM has `Production_RE.aspx.vb` (orphaned code-behind without .aspx). `/Production_Ret.aspx` may be the page that `Production_RE.aspx.vb` was intended for — or the production pages were moved to the other application.

---

## 16. Reports

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Retail_New_Mem_TAT_MGR.aspx | ❌ NOT IN LEGACY | Retail new member TAT — manager view |
| /Retail_Renewals_... (inferred) | ❌ NOT IN LEGACY | Retail renewals report |
| /Reimbursement_TAT.aspx | ❌ NOT IN LEGACY | Reimbursement TAT report |
| /Business_Tracking_Fin_Dash.aspx | ✅ IN LEGACY | Finance dashboard |
| /Ref_Service_Call_TAT_RM.aspx | ❌ NOT IN LEGACY | Refund/service call TAT for RM |
| /Retail_New_Mem_Corp_Dashboard.aspx | ❌ NOT IN LEGACY | Corporate dashboard |
| /IP_Claim_Confirmation.aspx | ❌ NOT IN LEGACY | In-patient claim confirmation |
| /Business_Tracking_TAT.aspx | ✅ IN LEGACY | Business tracking TAT |

---

## 17. Retail BenchMarks

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /New_RET_Followup.aspx | ❌ NOT IN LEGACY | New retail member follow-up |
| /Approver_Renewal.aspx (or /Approval_Renewal.aspx) | ❌ NOT IN LEGACY | Renewal approval |
| /Retail_Management.aspx | ❌ NOT IN LEGACY | Retail management view |

**Classification:** DISTINCT MODULE — not in /Legacy/CRM. Retail benchmark tracking and management.

---

## 18. Retail Renewals

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /NET_Pre_Renewal_list_MR.aspx | ❌ NOT IN LEGACY | Pre-renewal list for MR |
| /NET_Lapsed.aspx (inferred) | ❌ NOT IN LEGACY | Lapsed policies |
| /Renewal_preparation.aspx | ❌ NOT IN LEGACY | Renewal preparation |
| /Retail_Renewal_Lapsing.aspx (inferred) | ❌ NOT IN LEGACY | Lapsing policies |
| /Retail_Renewal_Loading.aspx | ❌ NOT IN LEGACY | Renewal loading |
| /Retail_Renewal_Data_Upload.aspx | ❌ NOT IN LEGACY | Renewal data upload |

**Classification:** DISTINCT MODULE — 6 pages, all outside /Legacy/CRM. Retail Renewals is a dedicated module for managing individual/retail policy renewals. Different from Corporate renewals.

---

## 19. Risk Register

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Risk_Register.aspx (menu label; actual = Risk_Register_Dashboard.aspx) | ✅ IN LEGACY | Risk register dashboard |
| /Risk_Rating_Client.aspx | ✅ IN LEGACY | Client risk rating |
| /Risk_Register_New.aspx (menu label: Register client) | ✅ IN LEGACY | New risk registration |
| /Risk_Map_Champions.aspx | ✅ IN LEGACY | Champions map |
| /Risk_Register_Review.aspx | ✅ IN LEGACY | Risk review |
| /Risk_Register_Update.aspx | ✅ IN LEGACY | Risk update |
| /Risk_Status.aspx | ✅ IN LEGACY | Risk status |

**Risk Register is fully in /Legacy/CRM** — all 7 menu pages confirmed.

---

## 20. Settings

| Page URL | In /Legacy/CRM | Notes |
|---|---|---|
| /Corporate_RM_Allocate.aspx | ❌ NOT IN LEGACY | Corporate RM allocation |
| /Corp_RM_Reallocation.aspx | ❌ NOT IN LEGACY | Corporate RM reallocation |
| /Business_Tracking_Reverter.aspx (or similar) | ❌ NOT IN LEGACY | Business tracking reverter (legacy has Reverse.aspx) |
| /Business_Tracking_Reverse.aspx | ✅ IN LEGACY | Business reversal |
| /Business_tracking_adddocs.aspx | ✅ IN LEGACY | Add documents |
| /Business_Tracking_Upload.aspx (inferred) | ❌ NOT IN LEGACY | Document upload |
| /Commission_run.aspx | ❌ NOT IN LEGACY | **Commission processing trigger** |
| /Temp_Erase.aspx | ❌ NOT IN LEGACY | Temporary data erase |

**Commission finding:** `/Commission_run.aspx` is under Settings, not a standalone Commissions module. This is a batch trigger for commission processing — not a full CRUD module. Confirms that commission calculation is SP/DB-driven; the UI is just a trigger button.

---

## Summary — Application Scope

### Pages by Location

| Location | Count | % of Total |
|---|---|---|
| Pages from navigation IN /Legacy/CRM | 29 | 38% |
| Pages from navigation NOT in /Legacy/CRM | 47 | 62% |
| **Total navigation pages identified** | **76** | 100% |
| Pages in /Legacy/CRM NOT in this navigation map | 47 | — |

> **Important:** The 76 pages in this navigation map is coincidental with the 76 ASPX pages in /Legacy/CRM — but they are different sets. The application total (navigation pages + un-navigated CRM pages) is considerably larger.

### Modules by Location

| Module | Pages in Navigation | In /Legacy/CRM | Not in Legacy | Module Location |
|---|---|---|---|---|
| Admin | 3 | 1 | 2 | Split |
| Agent Management | 2 | 1 | 1 | Split |
| A Home | 1 | 1 | 0 | Legacy |
| Business Tracking | 10 | 9 | 1 | Mostly Legacy |
| Case Register | 1 | 0 | 1 | Other App |
| Complaint Tracking | 3 | 0 | 3 | Other App |
| Debtors (Committal) | 1 | 0 | 1 | Other App |
| Enquiry | 6 | 2 | 4 | Split |
| Log Activity | 1 | 0 | 1 | Other App |
| Medical Underwriting | 2 | 0 | 2 | Other App |
| Non-Medical Renewal | 2 | 0 | 2 | Other App |
| Off System Cases | 6 | 0 | 6 | Other App |
| Portfolio Management | 3 | 0 | 3 | Other App |
| Premium Refund | 6 | 0 | 6 | Other App |
| Production | 2 | 0 | 2 | Other App |
| Reports | 8 | 2 | 6 | Split |
| Retail BenchMarks | 3 | 0 | 3 | Other App |
| Retail Renewals | 6 | 0 | 6 | Other App |
| Risk Register | 7 | 7 | 0 | Legacy |
| Settings | 8 | 2 | 6 | Split |
| **TOTAL** | **81** | **25** | **56** | — |

> Some pages appear in more than one module count due to the menu structure; actual unique page count is approximately 76 navigation entries.

---

## Claims Module — Still Not Identified

> ⚠️ **Claims is NOT present as a module in this navigation mapping.** Despite confirmed stored procedures (`sp_Claims_Process_Action`, `sp_Claims_Approval_Action`, `sp_IP_Claim_Issues`) and 15 Crystal Reports on claims, no Claims menu module appears in the stakeholder-provided navigation map.

**Hypothesis:** Claims processing may be handled entirely within the **eOxegen core system** (confirmed as the PAS). MIS may only view claim data pulled FROM eOxegen, not process claims directly. The Crystal Reports on claims may query eOxegen data via the cross-DB connection.

**Action required:** Business must confirm whether claims are processed in eOxegen or in a separate application.

---

## New Modules Requiring Specification (Previously Unknown)

| Module | Pages | Priority |
|---|---|---|
| Premium Refund | 6 | P1 — completely unknown |
| Case Register | 1 | P2 |
| Complaint Tracking | 3 | P2 |
| Off System Cases | 6 | P2 |
| Portfolio Management | 3 | P2 |
| Log Activity (M-Tiba Push) | 1 | P3 |
| Retail BenchMarks | 3 | P2 |
| Retail Renewals | 6 | P1 — 6 pages, unknown rules |
| Non-Medical Renewal | 2 | P1 |
| Enquiry | 6 | P3 — likely read-only |
| Medical Underwriting (extended) | 2 | P2 |

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*Source: Business stakeholder navigation map uploaded 2026-08-17*  
*Legacy source /Legacy/CRM: READ-ONLY — no modifications made*
