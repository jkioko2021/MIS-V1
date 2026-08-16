# Questions For Business

**Document ID:** VAL-004  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery Validation  
**Date:** 2026-08-17  
**Purpose:** Structured questions for business stakeholders, arising from discovery validation gaps and conflicts. These questions must be answered before specifications for the affected modules can be finalised.  
**Format:** Questions are grouped by business area. Each includes the reason the question is needed and the impact of not answering it.  

---

## Priority Classification

| Priority | Meaning |
|---|---|
| **P1** | Blocks module specification; answer needed immediately |
| **P2** | Required before implementation of the affected module begins |
| **P3** | Required before go-live; can be deferred during design |

---

## Section 1 — Authentication and Security (CRITICAL)

### Q-AUTH-001 — OTP Delivery Method *(CONFLICT-005, P1)*

**Question:** When a user logs in to the MIS system today, how do they receive their one-time password (OTP)?

**Options observed in source code:**
- Option A: Via **email** to their registered email address (6-digit number)
- Option B: Via **SMS** to their mobile phone (4-character code)
- Option C: Via **both** — different users receive it differently

**Why this matters:** Two different OTP mechanisms appear in the source code but contradict each other. We must implement the correct one(s) in the new system. Getting this wrong means users cannot log in.

**Follow-up (if SMS is or was used):** Is the SMS modem currently operational? When was it last used? Would the business prefer to move to a cloud SMS service (e.g. Africa's Talking)?

---

### Q-AUTH-002 — Are System Emails Currently Being Received? *(CONFLICT-009, P1)*

**Question:** Are system emails from the MIS application (such as new user notifications, OTP tokens, approval notifications) currently being received by users?

**Why this matters:** The email configuration in the source code has a potential technical error (SSL settings for smtp.office365.com) that could cause all emails to fail silently. Given that the application swallows errors, this failure would not be visible in the UI.

**Please test:** Send yourself a test notification or ask IT to confirm Office 365 SMTP delivery logs from aar-alerts@aar.co.ke.

---

### Q-AUTH-003 — Password Minimum Length Policy *(CONFLICT-006, P1)*

**Question:** What is the official password policy for MIS users? Specifically:

1. What is the minimum password length?
2. Is it 4 characters, 6 characters, or another number?
3. Is the policy configurable (different for different user groups)?

**Why this matters:** The source code enforces 4 characters in one place and shows 6 characters as a default in another. The `Password_Config` screen suggests it should be configurable, but the code does not read from that configuration. We need to implement the correct policy.

---

### Q-AUTH-004 — Four-Eyes Approval Defect — Business Awareness *(CONFLICT-008, P1)*

**Question (for management/compliance):** Are you aware that the four-eyes (maker-checker) approval control in the user approval screen is currently not enforced? In the legacy system, a user who creates a new account can also approve their own account creation, which defeats the control.

**Specific finding:** The `ApproveUserDetails.aspx` page always grants approval regardless of who created the record. The correct logic exists in the detail view but is not applied at the approval step.

**Actions needed:**
1. Confirm whether this was a known defect or discovered now.
2. Confirm whether the new system should enforce this strictly.
3. Consider whether a retrospective audit of user approvals is required for compliance purposes.

---

### Q-AUTH-005 — Concurrent Sessions *(GAP-SEC-002, P3)*

**Question:** Should users be allowed to log in to MIS from multiple devices/browsers simultaneously?

**Current situation:** The source code contains session tracking logic (`ActiveSession`) but it is unclear whether concurrent login blocking is enforced in production.

**Options for the new system:**
- Allow concurrent sessions (no restriction)
- Block new login when a session already exists (single session only)
- Allow concurrent sessions but show a warning
- Enforce single session with option to terminate other sessions

---

### Q-AUTH-006 — Account Auto-Lock for Inactive Users *(GAP-BL-008, P2)*

**Question:** Is there currently an automatic process that locks user accounts after a period of inactivity (e.g. 30 or 90 days of no login)?

**Evidence:** The database schema has a `DaysTolockUser` field, suggesting this was intended. However, no source code implementing this was found — it may be implemented as a scheduled database job.

**If yes:** What is the inactivity period? Who manages the job? Should this be preserved in the new system?

---

### Q-AUTH-007 — Software License Mechanism *(GAP-SEC-003, P2)*

**Question:** The MIS system validates a `License.fin` file on every login attempt. Who provides this license file, and what must happen at migration time to ensure the new system is also licensed?

**Details:** The license file encodes client name, application name, version, start date, and end date. The vendor appears to be the supplier of the "AIK-Linc" branded software.

**Specifically needed:**
1. Who is the license vendor?
2. Will a new license be needed for the modernized system?
3. Is the license mechanism being retained or replaced?

---

## Section 2 — Business Tracking

### Q-BT-001 — Complete List of File Statuses *(GAP-BL-005, P1)*

**Question:** Can you provide or confirm the complete list of statuses a business tracking file can have, from initial registration through to closure?

**Statuses confirmed from source code so far:**
- REGISTERED
- FORWARDED
- RETURNED-INCOMPLETE
- MEDICAL UW-REVIEW
- BENEFIT VERIFICATION
- ALLOCATED
- INVOICED

**Are there additional statuses such as:** DISPATCHED, POLICY ISSUED, DECLINED, CLOSED, CANCELLED, RECEIPTED, or others?

---

### Q-BT-002 — CarePay Integration *(GAP-INT-007, P2)*

**Question:** A page called `Business_Status_CarePay.aspx` exists in the system. What is CarePay and how does it integrate with the MIS application?

**Specifically needed:**
1. Is CarePay a current active integration?
2. What does the CarePay page do? (Payment confirmation? Status checking?)
3. Does the new system need to integrate with CarePay?

---

### Q-BT-003 — M-Tiba Integration *(P2)*

**Question:** Business tracking records have an `Is_Mtiba` flag. What is M-Tiba and how does it affect the business tracking workflow?

**Specifically needed:**
1. How does payment via M-Tiba differ from standard payment?
2. Are there downstream workflow differences for M-Tiba cases?
3. Is M-Tiba still actively used?

---

### Q-BT-004 — RENEWAL ADVICE Document Generation *(GAP-INT-004, P2)*

**Question:** The system has a `/RENEWAL ADVICE` directory that contains renewal advice letters. What process generates these documents?

**Options:**
- A scheduled Crystal Report export
- A manual action within MIS by a specific user
- A separate application or system
- An automated batch job outside MIS

**Why this matters:** This process must be replicated in the new system. If it is a batch job on the database server, it needs to be discovered separately.

---

### Q-BT-005 — CLAPI Product *(P2)*

**Question:** Multiple pages (Business_Tracking_Dash_Clapi.aspx, Business_Allocation_Clapi_Corp.aspx, Business_Tracking_Finance_Clapi.aspx, Business_Allocated_Clapi.aspx) and a database (DATA_REPOSITORY_DB_CLAPI) reference "CLAPI". What is CLAPI?

**Specifically needed:**
1. Is CLAPI a product, a client category, or an external system?
2. How does CLAPI business differ from standard business processing?
3. Is DATA_REPOSITORY_DB_CLAPI a database owned by an external partner?

---

### Q-BT-006 — Shwaari Product *(P3)*

**Question:** A page called `Business_Tracking_Shwaari_status.aspx` exists. What is the Shwaari product and does it have unique business tracking requirements?

---

## Section 3 — Claims, Commissions, and Debtors

### Q-MOD-001 — Claims Module Location *(GAP-MOD-001, P1)*

**Question:** Where are the claims processing screens in the MIS system?

**Situation:** The discovery found stored procedures for claims processing (`sp_Claims_Process_Action`, `sp_Claims_Approval_Action`, `sp_IP_Claim_Issues`, tracking SPs for in-patient and PNI claims) but **no ASPX pages for claims were found** in the main CRM application.

**Options:**
- Claims screens exist in the MISREPORTS application (separate server at 192.168.50.48)
- Claims is handled entirely by stored procedures triggered from another system
- Claims pages exist in a part of the system not included in the legacy repository
- Claims was decommissioned and is handled by a different system (eOxegen?)

---

### Q-MOD-002 — Commissions Module Location *(GAP-MOD-002, P1)*

**Question:** Where are the commission calculation and management screens?

**Situation:** 8 Crystal Reports on commissions exist, a COMMISSION database is confirmed, and multiple SPs reference commissions — but no commission management ASPX pages were found in the main CRM application.

**Specifically needed:**
1. Where do staff process commissions?
2. Is commission calculation done in the COMMISSION database by SPs and reported only?
3. Is there a commission upload process (Commission Upload reports exist)?

---

### Q-MOD-003 — Debtors Module Location *(GAP-MOD-003, P1)*

**Question:** Where are the debtors and collections management screens?

**Situation:** 9 debtors-related Crystal Reports exist (demand letters, reversed receipts, fund statements, email tracking) but no debtor management ASPX pages were found.

---

### Q-MOD-004 — MISREPORTS Application Scope *(GAP-MOD-007, P1)*

**Question:** What does the MISREPORTS application (at 192.168.50.48) contain? Is it part of the modernization scope?

**Why this matters:** If Claims, Commissions, Debtors, or other major modules live in MISREPORTS, the modernization scope may be significantly larger than the 76 pages in the current CRM application. This affects timeline, cost, and specification effort.

**Specifically needed:**
1. What modules or functions live in MISREPORTS?
2. What technology is MISREPORTS built on?
3. Is MISREPORTS in scope for this modernization project?

---

## Section 4 — Reports

### Q-RPT-001 — Active vs Archived Crystal Reports *(GAP-RPT-006, P2)*

**Question:** Of the 184 Crystal Reports in the system, which are actively used in day-to-day operations?

**Context:** Multiple report variants exist with similar names (e.g. Customer_Statement, Customer_Statement_X, Customer_Statement_W, Customer_Statement_old). This suggests some reports were superseded over time. Rebuilding all 184 reports is a significant effort.

**Requested action:** Please provide a list of reports that are:
- Used daily or weekly (high priority for modernization)
- Used monthly/quarterly (medium priority)
- Rarely or never used (candidates for retirement)
- Known to be superseded by a newer variant

---

### Q-RPT-002 — Report Access Control *(GAP-RPT-004, P2)*

**Question:** Which user profiles can access which reports?

**Current situation:** Report access is controlled by the `menuaccess` table in the database, which is not accessible without connectivity. Rather than waiting for DB access, can a business stakeholder provide a matrix of which roles/profiles should have access to which report categories?

---

### Q-RPT-003 — Scheduled Report Delivery *(GAP-RPT-007, P2)*

**Question:** Are any reports automatically generated and emailed on a schedule (daily, weekly, monthly)?

**Examples:**
- Daily: Commission summary emailed to agents?
- Weekly: TAT report to management?
- Monthly: Production reports to regional executives?

**If yes:** Who receives them, at what frequency, and which specific reports?

---

## Section 5 — Integrations

### Q-INT-001 — eOxegen System *(GAP-INT-001, P1)*

**Question:** What is eOxegen, and what is its relationship to the MIS/MARVEL application?

**Context:** The application is branded "eOxegen CRM" but the appSettings also references an "eoxegen" report server hostname separately. Multiple Crystal Reports show "eOxegen Integration" in their names, including reconciliation reports comparing eOxegen vs ACCPAC amounts.

**Specifically needed:**
1. Is eOxegen the core insurance policy administration system (PAS)?
2. Does MIS receive data from eOxegen, send data to eOxegen, or both?
3. What data flows between eOxegen and MIS? (Policy data? Premium data? Claims?)
4. How frequently does data sync occur?
5. Will the new MIS system need to integrate with eOxegen in the same way?

---

### Q-INT-002 — ACCPAC / Sage 300 Integration *(GAP-INT-002, P1)*

**Question:** Is there an active integration between MIS and ACCPAC (Sage 300 ERP)?

**Context:** Crystal Reports named "eOxegen vs Accpac Amounts.rpt", "Audited-Errors on Interface.rpt", "Audited-Missing On Interface.rpt" imply a financial reconciliation process between MIS data and ACCPAC.

**Specifically needed:**
1. Is this integration currently active?
2. What data is reconciled? (Premium payments? Commission payments?)
3. How does data flow — direct DB link, flat file, API?
4. How frequently does reconciliation run?
5. Will the new system need to maintain this integration?

---

### Q-INT-003 — Excel Upload Formats *(GAP-INT-005, P2)*

**Question:** What Excel files are imported into the system via the "EXCEL UPLOADS" process?

**Specifically needed:**
1. What types of data are uploaded? (Renewal lists? Member data? Commission data?)
2. What is the expected column format for each upload type?
3. Who performs these uploads and how frequently?
4. What validation does the system perform on uploaded data?

---

### Q-INT-006 — F:\mount_location Mount Point *(GAP-INT-003, P3)*

**Question:** The MIS server has a network mount at `F:\mount_location`. What is mounted here, and is it still in use?

**Specifically needed:**
1. What type of data lives on this mount? (Documents? Archives? Backups?)
2. Is it actively used by the MIS application?
3. Who owns and maintains this mount?

---

## Section 6 — Database and Infrastructure

### Q-DB-001 — Additional Databases in Scope *(CONFLICT-002, P2)*

**Question:** The following databases are listed in project notes but were not found in the application source code. Please confirm which are in scope for the modernization project:

| Database | Suspected Purpose |
|---|---|
| AIMSOFT_DATADUMP | Aimsoft integration |
| AIMSOFT_DATADUMP2023 | Aimsoft 2023 data |
| COM_ACTIVITIES_DB | Activity tracking |
| DB_MASTER_AGENTS | Agent master data |
| DB_MASTER_RENEWAL | Renewal master data |
| DB_ONLINE_PORTAL | Online portal data |

**For each: Is it actively used? By which application? Is it in scope?**

---

### Q-DB-002 — Online Portal *(P2)*

**Question:** The database `DB_ONLINE_PORTAL` is listed in scope. Is there a customer-facing online portal that connects to the MIS database?

**If yes:** Is the online portal also being modernized, or is it a separate project?

---

## Section 7 — User Administration

### Q-UA-001 — Self-Registration *(GAP-APP-004, P3)*

**Question:** Is `Registration.aspx` (self-registration page) currently in use?

**Situation:** The page exists but has no code-behind file, suggesting it may be incomplete or disabled. If users should be able to self-register, this is a module that needs to be fully specified.

---

### Q-UA-002 — Profile Types *(GAP-SEC-004, P2)*

**Question:** What profile types exist in the system besides 'ADMIN'?

**Context:** All profiles confirmed so far are of type `PROFILETYPE = 'ADMIN'`. Are there other profile types (e.g. 'USER', 'EXTERNAL', 'REPORTING') that represent different classes of users?

---

### Q-UA-003 — Profile Assignment Restrictions *(GAP-SEC-005, P3)*

**Question:** Can any administrator assign any profile to a new user, or are there restrictions? For example, is there a "SuperAdmin" profile that only certain administrators can assign?

**Evidence:** Commented-out code in the source suggests this restriction was considered but may have been disabled:
```vb
'If ProfileName <> "SuperAdmin" Then LblErr.Text = "You are not authorized..."
```

---

## Section 8 — Risk Register

### Q-RR-001 — Risk Period Management *(GAP-BL-002 area, P2)*

**Question:** How are risk assessment periods opened and closed?

**Specifically needed:**
1. Who opens a new risk period?
2. Is there a screen for this, or is it done directly in the database?
3. Can multiple periods be open simultaneously?
4. What happens to risks registered in a period that gets closed?

---

### Q-RR-002 — Risk Review and Sign-Off Roles *(BR-RISK-012, P2)*

**Question:** In the Risk Register module, who performs the "Review" and "Sign-Off" steps?

**Context:** The workflow is: Submit (by Risk Champion) → Review → Sign-Off. The discovery confirmed these steps exist but did not confirm which user roles perform them.

**Specifically needed:**
1. What profile/role performs the Review step?
2. What profile/role performs the Sign-Off step?
3. Can the same person Review and Sign-Off, or is it also maker-checker?

---

### Q-RR-003 — Risk Score Formula *(GAP-BL-002, P2)*

**Question:** How is the risk exposure score calculated?

**Known:** The system has fields for Impact, Likelihood, Inherent Exposure, Control Effectiveness, and Residual Exposure. A stored procedure called `Compute_Risk_Values` calculates these, but its code is not accessible without database connectivity.

**Can the risk team provide:**
- The formula for Inherent Risk Exposure (Impact × Likelihood or different)?
- The scale for Impact rating values
- The scale for Likelihood rating values
- The formula for Residual Risk Exposure (how control effectiveness reduces it)

---

## Section 9 — Product and Business Terminology

### Q-TERM-001 — Product Codes and Abbreviations *(P3)*

**Question:** The source code references the following product and business codes that are not explained in any documentation found. Please clarify each:

| Code / Term | Found In | Question |
|---|---|---|
| HPC | SP names: SP_MIS_CRM_HPC_* | What is HPC? (Health Policy Coordinator? High-Priority Cases?) |
| NCD | SP: SP_REN_CLAIMS_UPDATE_NCD | What is NCD? (No Claims Discount?) |
| Shwaari | Business_Tracking_Shwaari_status.aspx | What is Shwaari? (Insurance product name?) |
| PNI | SP_TRACKING_PNI_CLAIM_MESSAGES | What is PNI? (Personal Non-Indemnity? Product name?) |
| IPF | Is_IPF flag in business tracking | Is IPF Instalment Premium Financing? Are there special rules? |
| GI | Business_Tracking_GI_Dashboard.aspx | General Insurance? |
| BPO | Welcome dashboard hierarchy level | Is BPO a role code? What does it stand for here? |
| NPL | Email MsgType 008: "NPL Clients" | What is an NPL client? (Non-Performing Loan?) |
| RE / NSM / BDM / RM | Sales hierarchy, report names | Regional Executive / National Sales Manager / Business Development Manager / Relationship Manager? |

---

## Summary — Questions by Priority

| Priority | Count | Key Area |
|---|---|---|
| P1 — Answer Immediately | 10 | OTP delivery, emails working, password policy, four-eyes defect, claims/commissions/debtors location, MISREPORTS scope, eOxegen/ACCPAC integration, complete File_Status list |
| P2 — Before Module Spec | 18 | CarePay, M-Tiba, CLAPI, report access, Excel uploads, risk period management, additional databases, RENEWAL ADVICE, concurrent sessions, auto-lock, license |
| P3 — Before Go-Live | 7 | Self-registration, profile restrictions, Shwaari, F:\mount, scheduled reports, terminology |

---

*Document produced by: AI Engineering Agent — Discovery Validation Phase*  
*All questions derived from gaps and conflicts in the discovery evidence corpus*  
*Legacy source /Legacy/CRM: READ-ONLY — no modifications made*  
*Date: 2026-08-17*
