# Business Process Unknowns Register

**Document ID:** BP-UNK-001  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery — Business Process Reverse Engineering  
**Date:** 2026-08-17  
**Purpose:** Catalogue of all process gaps, unknown behaviours, and evidence conflicts that block complete process documentation.  
**Governance:** No business behaviour has been invented to fill these gaps. Each unknown is explicitly classified.  

---

## Classification

| Priority | Meaning |
|---|---|
| P1 — CRITICAL | Blocks module specification or architecture design |
| P2 — HIGH | Must be resolved before implementation begins |
| P3 — MEDIUM | Must be resolved before testing |
| P4 — LOW | Can be resolved during implementation |

---

## Category 1 — Authentication Process Unknowns

| ID | Unknown | Impact | Resolution Path | Priority |
|---|---|---|---|---|
| BPU-AUTH-001 | What is the software license model? Is the `License.fin` + `AIK-Linc` branding intentional for the new system, or does the license mechanism need to be replaced entirely? | Determines whether the new system requires a license check at all | Business decision | P1 |
| BPU-AUTH-002 | Is there a configurable lockout threshold, or is 3 attempts hardcoded as the permanent policy? `TBL_MIS_CRM_PASSWORD_CONF.Lock_cnt` exists but is not read by the login flow. | Lockout behaviour in new system | Read Password_Config.aspx.vb + business | P2 |
| BPU-AUTH-003 | Is the 30-day password expiry threshold configurable (`TBL_MIS_CRM_PASSWORD_CONF.Pass_Reset`) or hardcoded? The hardcoded value is 30 days. | Password expiry enforcement | Read Password_Config.aspx.vb | P2 |
| BPU-AUTH-004 | Is password history enforced? `TBL_MIS_CRM_PASSWORD_CONF.Hist` exists but no code reading this field has been found. | Password reuse policy | DB access (schema + SP body) | P3 |
| BPU-AUTH-005 | Are multiple concurrent sessions permitted or blocked? `ActiveSession` is tracked but enforcement appears to be commented out. Is single-session enforced in production? | Session security model | Business confirmation | P2 |
| BPU-AUTH-006 | Are OTP entry failures (wrong OTP, expired OTP) audited? The audit for successful login and credential failures is confirmed; OTP-step audit entries are not confirmed. | Audit completeness | Read Login.aspx.vb OTP section in detail | P3 |
| BPU-AUTH-007 | Does `Verify_OTP.aspx` exist as a separate page or is OTP entirely handled in `Login.aspx`? DISC-002 lists `Verify_OTP.aspx` in the file inventory. | Determines OTP flow architecture | Read Verify_OTP.aspx.vb | P2 |
| BPU-AUTH-008 | What happens if the SMTP server fails during OTP email delivery? Are there 478 silent catch blocks hiding this failure? If so, OTP delivery failure is invisible to the user. | OTP reliability | Read Mail.vb error handling | P2 |
| BPU-AUTH-009 | Is there a "Resend OTP" option? No such button was observed in Login.aspx, but the business may expect it. | UX completeness | Business confirmation | P3 |
| BPU-AUTH-010 | What does `AppSettings("LoginFromEmail1")` / `AppSettings("EmailUsername1")` contain? These are the OTP email sender credentials. Are they the same Office 365 account as regular system email? | Email infrastructure | Read web.config AppSettings (already in DISC-005) | P4 |

---

## Category 2 — User Administration Process Unknowns

| ID | Unknown | Impact | Resolution Path | Priority |
|---|---|---|---|---|
| BPU-ADMI-001 | What are all the PROFILETYPE values? Only 'ADMIN' has been confirmed. Are there 'USER', 'EXTERNAL', 'READONLY', or other types? | Authorization model completeness | DB access (PROFILE table) | P1 |
| BPU-ADMI-002 | Can a given admin only assign profiles at or below their own level? There is commented-out code suggesting super-admin restrictions existed. Is this currently enforced or was it removed? | Privilege escalation risk | Business + DB access | P2 |
| BPU-ADMI-003 | Is there a notification to the newly created user when their account is approved (step 2 of onboarding)? Confirmed: email sent at creation with default password. Not confirmed: approval notification. | Onboarding UX | Read ApproveUserDetails.aspx.vb | P2 |
| BPU-ADMI-004 | What fields are on the employee record beyond the ones seen in Login.aspx? Full schema requires DB access. | Data migration completeness | DB access (employees table schema) | P1 |
| BPU-ADMI-005 | Is there a "deactivate user" (soft delete) function distinct from locking? `Deleted` flag exists on the employee record. What process sets it? | User lifecycle management | Read UserDetails.aspx.vb + Deactivate_Signatory SP | P2 |
| BPU-ADMI-006 | Who can create users? Is this restricted to a specific profile or any authenticated admin? | Authorization scope | Business + profile enumeration | P2 |
| BPU-ADMI-007 | Are profile changes (menuaccess updates) audited beyond the page-access audit? `UpDate_Profile` SP body unknown. | Audit completeness | DB access (SP body) | P3 |
| BPU-ADMI-008 | What is the `Accounts_Config.aspx` page (Admin module, not in /Legacy/CRM)? Is this system configuration or user configuration? | Scope | Source of second application | P2 |
| BPU-ADMI-009 | What is `AdminAudit.aspx` (in /Legacy/CRM but not in navigation map)? Is it an internal report or superseded? | Audit module scope | Read AdminAudit.aspx.vb | P3 |

---

## Category 3 — Business Tracking Process Unknowns

| ID | Unknown | Impact | Resolution Path | Priority |
|---|---|---|---|---|
| BPU-BT-001 | What is the complete `File_Status` state machine? Confirmed states: REGISTERED, FORWARDED, MEDICAL UW-REVIEW, BENEFIT VERIFICATION, ALLOCATED, INVOICED. Additional states likely: DISPATCHED, DECLINED, RETURNED, POLICY ISSUED, COMPLETE. | State machine for new system | DB access (DISTINCT File_Status from TBL_MIS_CRM_BUSINESS_TRACKING) + reading 34 sub-pages | P1 |
| BPU-BT-002 | What is the full business flow after INVOICED status? What are the downstream steps (dispatch, policy issuance, closure)? | End-to-end business process | Read remaining 34 BT sub-pages | P1 |
| BPU-BT-003 | What happens in the MEDICAL UW-REVIEW step? Who reviews? What are the outcomes? Which page handles this? | Medical underwriting sub-process | Read Business_Medical_UW.aspx.vb, Business_UW_TAT.aspx.vb | P1 |
| BPU-BT-004 | What happens in the BENEFIT VERIFICATION step? Which page? What data is verified? What are the outcomes? | Benefit verification sub-process | Read relevant BT sub-pages | P1 |
| BPU-BT-005 | What does `sp_Business_Tracking_Action` actually do? It is the primary save SP for business registration. Its body is unknown. | Registration business logic validation | DB access (SP body) | P1 |
| BPU-BT-006 | What is the exact file number format in production? Confirmed: generated by MAX+1 formula, prefix unknown. | Data migration + display | Business + DB access | P2 |
| BPU-BT-007 | What are all the Business_Type, Client_Type, Business combinations? Confirmed: B_Type=N/R, C_Type=R/C, Business=M/N. Do all 8 combinations exist? Are there restrictions? | Validation rules | DB access or reading sub-pages | P2 |
| BPU-BT-008 | Can a file be returned to a previous status (e.g., from ALLOCATED back to FORWARDED)? `Business_Tracking_Reverse.aspx` exists — this likely handles reversals. | State machine completeness | Read Business_Tracking_Reverse.aspx.vb | P2 |
| BPU-BT-009 | What is `Business_Tracking_Returned.aspx`? Handles RETURNED-INCOMPLETE status? What triggers a return and who can initiate it? | Return/rejection sub-process | Read Business_Tracking_Returned.aspx.vb | P2 |
| BPU-BT-010 | Who can see other users' business files (vs own files only)? Managers likely see all files. What is the scoping logic by role? | Authorization scope in BT | Read Business_Tracking_Allocated.aspx.vb or allocation views | P2 |
| BPU-BT-011 | What is the M-Tiba integration? `Is_Mtiba` flag confirmed. What happens when a file is M-Tiba flagged? Is there a payment confirmation step? | M-Tiba sub-process | Read Business_Status_CarePay.aspx.vb, Log Activity / Mtiba_Data_Push.aspx | P2 |
| BPU-BT-012 | What is IPF (Instalment Premium Financing)? `Is_IPF` flag confirmed. What downstream process does this trigger? | IPF sub-process | Business + reading BT sub-pages | P2 |
| BPU-BT-013 | What is the Corporate (CLAPI) business tracking flow? `Business_Tracking_Corp.aspx` is in the navigation but not in /Legacy/CRM. `Business_allocation_Clapi_Corp.aspx` IS in legacy. What is the difference? | Corporate flow scope | Source of second application | P2 |
| BPU-BT-014 | What is `Business_Tracking_Finance.aspx` / the cashier/finance step? Does receipting happen here? What data is entered and validated? | Finance sub-process | Read Business_Tracking_Finance.aspx.vb | P2 |
| BPU-BT-015 | What is the document checklist driven by (`TBL_MIS_CRM_BUSINESS_REQ`)? Are requirements different for Medical vs Non-Medical, Retail vs Corporate? | Document management rules | DB access (TBL_MIS_CRM_BUSINESS_REQ) or reading sub-pages | P2 |
| BPU-BT-016 | What is the maximum file size for document uploads? Binary storage in SQL Server has practical limits. | Architecture decision | DB access or business policy | P3 |
| BPU-BT-017 | What is the Business Tracking email flow beyond the two confirmed emails (Non-Med + Walk-In)? Are there other notification points? | Notification design | Reading all BT sub-pages | P3 |
| BPU-BT-018 | How is the sales hierarchy (`RE → CLASS → NSM → ADMIN → BPO`) maintained? What screens manage it? | Welcome dashboard data model | Read TBL_MIS_CRM_RMS etc. — requires DB access | P3 |
| BPU-BT-019 | What does `Business_Tracking_Pricing.aspx` do? Is this the rate/premium calculation step? | Pricing sub-process | Read Business_Tracking_Pricing.aspx.vb | P2 |
| BPU-BT-020 | What does `Business_Tracking_Policydoc.aspx` do? Is this where the actual policy document is generated/dispatched? | Policy document sub-process | Read Business_Tracking_Policydoc.aspx.vb | P2 |

---

## Category 4 — Risk Register Process Unknowns

| ID | Unknown | Impact | Resolution Path | Priority |
|---|---|---|---|---|
| BPU-RISK-001 | What is the risk scoring formula? How are Impact + Likelihood combined to produce `I_Risk_Exposure`? How are current controls applied to produce `R_Risk_Exposure`? | Core algorithm for new system | DB access (Compute_Risk_Values SP body) | P1 |
| BPU-RISK-002 | What are the Impact and Likelihood input values? Are they numeric scores, text ratings, or dropdown selections? The fields exist in the schema but input mechanism is not confirmed. | Risk data entry design | Read Risk_Register_New.aspx UI elements | P2 |
| BPU-RISK-003 | Who submits a department's risks? Which screen handles the Submit action (Submitted=1)? | Submit step in workflow | Read Risk_Register_Open.aspx.vb or Risk_Status.aspx.vb | P2 |
| BPU-RISK-004 | Who reviews (Reviewed=1) and who signs off (Sign_off=1)? Are these the same person or must they differ? Is this another maker-checker control? | Review/sign-off authorization | Read Risk_Register_Review.aspx.vb + business | P2 |
| BPU-RISK-005 | How are risk periods opened and closed? Is there an admin screen, or is it a DBA/SP operation? | Period management design | Read Risk_Register_*.aspx for period management, or business | P2 |
| BPU-RISK-006 | What does `Risk_Register_Close.aspx` do? Does it close individual risks or an entire period? | Risk closure sub-process | Read Risk_Register_Close.aspx.vb | P2 |
| BPU-RISK-007 | What is `Risk_Rating_Client.aspx`? Is it in the AAR_RISK_DB module or is it a separate client-level risk rating (different from the enterprise risk register)? | Module scope | Read Risk_Rating_Client.aspx.vb | P2 |
| BPU-RISK-008 | Is `TBL_MIS_RISK_MASTER_SUMMARY` pre-computed (batch) or live-calculated? This affects performance design for the dashboard. | Architecture decision | DB access (table schema + any trigger/SP) | P3 |
| BPU-RISK-009 | What is the `FIN-R` prefix in risk codes? Does this mean all risks are categorised as "Finance"? Or does the prefix vary by department? | Risk code format design | DB access (sample data from TBL_MIS_RISK_MASTER) | P3 |
| BPU-RISK-010 | What does `Risk_Map_Champions.aspx` show? Is it a visual org chart of Risk Champions by department? | Dashboard scope | Read Risk_Map_Champions.aspx.vb | P4 |

---

## Category 5 — Cross-Module and Integration Unknowns

| ID | Unknown | Impact | Resolution Path | Priority |
|---|---|---|---|---|
| BPU-INT-001 | How does MIS pull data from eOxegen? Direction is confirmed (eOxegen→MIS). Method is unknown: direct DB connection, scheduled extract/ETL, API call, or flat file import? | Integration architecture | Business / DBA / eOxegen team | P1 |
| BPU-INT-002 | Which specific data is pulled from eOxegen? Policy data? Member data? Premium data? Claims data? | Data model and integration scope | Business / eOxegen team | P1 |
| BPU-INT-003 | Is `DATA_REPOSITORY_DB_CLAPI` an eOxegen staging database? Does eOxegen push data into it, or does MIS pull from eOxegen directly? | Integration data flow | DB access (DATA_REPOSITORY_DB schema) + DBA | P1 |
| BPU-INT-004 | What is the ACCPAC integration? "eOxegen vs Accpac Amounts.rpt" confirms a reconciliation report. Is ACCPAC still actively integrated or is it historical? | Financial reconciliation scope | Business | P2 |
| BPU-INT-005 | What is the AIMSOFT integration? Two databases (AIMSOFT_DATADUMP, AIMSOFT_DATADUMP2023) are confirmed. What is Aimsoft and what data flows between it and MIS? | Integration scope | Business | P2 |
| BPU-INT-006 | What is COM_ACTIVITIES_DB? No source code references found. What module uses it? | Database scope | DB access + business | P2 |
| BPU-INT-007 | What is DB_ONLINE_PORTAL? No source code references found. Does it relate to member self-service or agent portal? | Integration scope | DB access + business | P2 |
| BPU-INT-008 | What is M-Tiba and how does `/Mtiba_Data_Push.aspx` (Log Activity module) interact with it? Is this a manual trigger for an API push, or does it import M-Tiba payment data? | M-Tiba integration design | Source of second application + business | P2 |
| BPU-INT-009 | How is the production month (`TBL_MIS_PROD_MONTHS`) opened and closed? Is this a business action (admin screen), DBA action, or automated? | Production month management | Business + DB access | P2 |
| BPU-INT-010 | Does the MISREPORTS application (`192.168.50.48`) use a separate SQL Server database, or does it share one of the 12 confirmed databases? The business list does not include a "MISREPORTS" database. | Infrastructure and data model | DBA + business | P1 |

---

## Category 6 — Modules with No Source Evidence

The following modules were confirmed from the navigation map (DISC-008) but have no source code in /Legacy/CRM and no business rules have been extracted. All processes for these modules are UNKNOWN.

| Module | Pages | Known Evidence | What Is Completely Unknown |
|---|---|---|---|
| **Premium Refund** | 6 | Page URLs only | Trigger, actor, eligibility rules, approval, DB tables, notifications — everything |
| **Retail Renewals** | 6 | Page URLs + SP names (SP_UPATE_PROPOSER_RENEWAL_LIST etc.) | Full renewal process, criteria, calculations, notifications |
| **Non-Medical Renewal** | 2 | Page URLs only | Full renewal process for non-medical business |
| **Off System Cases** | 6 | Page URLs + SP names (sp_MIS_CRM_Off_system_Tracking) | What "off-system" means, case types, processing, outcomes |
| **Complaint Tracking** | 3 | Page URLs + SP name (SP_MIS_CRM_COMPLAINTS_REGISTER) | Complaint intake, categorisation, escalation, resolution |
| **Portfolio Management** | 3 | Page URLs only | Portfolio views, data source (eOxegen?), filters |
| **Retail BenchMarks** | 3 | Page URLs only | What is benchmarked, by whom, what triggers follow-up |
| **Case Register** | 1 | Page URL only | What a "case" is in this context |
| **Log Activity (M-Tiba)** | 1 | Page URL only | M-Tiba push mechanics, data format, frequency |
| **Committal Tracking (Debtors)** | 1 | Page URL + SP names + 9 Crystal Reports | Committal registration, demand letters, follow-up |
| **Commission Run** | 1 (Settings) | Page URL + SP names + 8 Crystal Reports + business: SP-driven | Exact trigger conditions, inputs, approval, frequency |
| **Medical Underwriting (extended)** | 2 (in second app) | SP names + 2 pages in /Legacy/CRM | Member loading factors, UWC committee process |
| **Production** | 2 | Page URLs only | What "Production" means here (vs production month?) |
| **Enquiry** | 6 | Page URLs (2 in legacy, 4 not) | Credit notes, corporate info, statements — all unknown |
| **Claims** | 0 pages found | SP names + 15 Crystal Reports | Whether claims are in eOxegen or MIS; all processes |
| **Agent RFM Mapping** | 1 | Page URL only | RFM (Recency-Frequency-Monetary) agent mapping |

---

## Summary — Unknown Resolution Priorities

| Priority | Count | Description |
|---|---|---|
| P1 — CRITICAL | 14 | Blocks specification or architecture design |
| P2 — HIGH | 35 | Must resolve before implementation |
| P3 — MEDIUM | 10 | Must resolve before testing |
| P4 — LOW | 3 | Can resolve during implementation |
| **TOTAL** | **62** | **Unknown process elements** |

### Top 5 Most Blocking Unknowns

1. **BPU-BT-001** — Complete Business Tracking state machine (REGISTERED → ? → complete)
2. **BPU-INT-001** — eOxegen integration method (direction confirmed; mechanism unknown)
3. **BPU-RISK-001** — Risk scoring formula (Compute_Risk_Values SP body)
4. **BPU-INT-003** — DATA_REPOSITORY_DB_CLAPI role in eOxegen data flow
5. **BPU-BT-002** — Full downstream flow after INVOICED status

### Primary Resolution Actions Required

| Action | Resolves | Prerequisite |
|---|---|---|
| Read remaining 34 Business Tracking sub-pages | BPU-BT-001, 002, 003, 004, 006-020 | Code analysis (can be done now) |
| Read all Risk Register sub-pages (7 unread) | BPU-RISK-002, 003, 004, 005, 006, 007 | Code analysis (can be done now) |
| Establish SQL Server DB access | BPU-BT-005, BPU-RISK-001, BPU-ADMI-001, many more | DBA provides credentials |
| Business workshop — integration | BPU-INT-001, 002, 003, 004, 005 | eOxegen/DBA/business team |
| Obtain source code for second application | All 16 modules with no source evidence | Business provides MISREPORTS/second app source |

---

*Document produced by: AI Engineering Agent — Business Process Reverse Engineering*  
*Source: Approved discovery evidence only. No behaviour invented.*  
*Legacy /Legacy/CRM: READ-ONLY — no modifications made.*  
*Date: 2026-08-17*
