# Business Answers Register

**Document ID:** VAL-005  
**Project:** MIS Modernization — eOxegen CRM / MARVEL  
**Phase:** Discovery Validation  
**Date:** 2026-08-17  
**Purpose:** Formal record of answers received from business stakeholders to questions raised in VAL-004  
**Source:** Business stakeholder responses to Questions_For_Business.md  

---

## Answers Received — 2026-08-17

### Q-AUTH-001 — OTP Delivery Method

**Question:** How does a user receive their OTP when logging in?  
**Answer:** **Email**  
**Classification:** SOURCE-CONFIRMED (business)  

**Resolution:** CONFLICT-005 RESOLVED.  
- Current production delivery: email only  
- 6-digit numeric OTP (confirmed from Login.aspx.vb `SendOtpToEmail()`)  
- SMSCOMMS.vb is legacy code — **not currently used for OTP delivery**  
- The SMS hardware modem does not need to be replaced for OTP purposes; however, it must be confirmed whether SMSCOMMS.vb is used for any other notification type  

**New system requirement:** Implement OTP via email only. Use CSPRNG (`crypto.randomInt()`), not `System.Random`. Enforce 5-minute expiry and add OTP retry limit (max 5 attempts before requiring regeneration).

---

### Q-AUTH-002 — System Emails Being Received

**Question:** Are system emails from MIS currently being received by users?  
**Answer:** **Yes**  
**Classification:** SOURCE-CONFIRMED (business)  

**Resolution:** CONFLICT-009 RESOLVED for operational purposes.  
- Emails are being delivered despite `EnableSsl = False` on port 587  
- Technical explanation: Office 365 SMTP on port 587 with .NET SmtpClient may perform opportunistic STARTTLS even when `EnableSsl = False` depending on .NET runtime version  
- The current configuration works but is non-standard and may not enforce TLS  

**New system requirement:** Use STARTTLS explicitly enforced (`EnableSsl = True` equivalent in MailKit). Do not replicate the legacy `EnableSsl = False` setting. The fact that it works does not mean it is sending encrypted — the new system must enforce TLS.

---

### Q-AUTH-003 — Password Minimum Length Policy

**Question:** What is the official password minimum length?  
**Answer:** **6 characters**  
**Classification:** SOURCE-CONFIRMED (business)  

**Resolution:** CONFLICT-006 RESOLVED.  
- Official policy: minimum 6 characters  
- Legacy code defect: `ChangePass.aspx.vb` hardcodes minimum to **4 characters** — this is a bug  
- Current production passwords may be as short as 4 characters  
- `TBL_MIS_CRM_PASSWORD_CONF` configurable length field is not enforced by any code (dead configuration)  

**New system requirements:**
1. Enforce minimum 6 characters on all password change and creation flows  
2. Do not replicate the 4-character override  
3. Read password policy from a single configurable source (database or environment config) — not hardcoded  
4. Migration note: if users have 4-5 character passwords, they will be forced to change on first login to the new system

---

### Q-AUTH-004 — Four-Eyes (Maker-Checker) Approval Defect

**Question:** Is the business aware the four-eyes approval control is not enforced in the system?  
**Answer:** **No — the business was not aware**  
**Classification:** SOURCE-CONFIRMED (business) — defect confirmed as previously unknown  

**Resolution:** CONFLICT-008 RESOLVED — defect confirmed, business now informed.  
- The `ApproveUserDetails.aspx` page always grants approval regardless of who created the record  
- The business intent (maker-checker) is clear and confirmed  
- This defect has been present in production — past user account approvals may have been made by the same user who created the account  

**Immediate actions:**
1. **Business action:** Consider a retrospective audit of user account approvals — identify any accounts where `AddedBy = ApprovedBy`. These approvals were invalid under the intended control.
2. **New system requirement:** The four-eyes principle MUST be correctly enforced. A user who created a record must not be able to approve it. Both the creation user and approver must be different authenticated users.
3. **New system requirement:** The UI must show a clear error ("You cannot approve a record you created") rather than silently blocking — the error message exists in the legacy `UserDetails.aspx` but is unreachable on the actual approval screen.

---

### Q-MOD-001/002/003 — Claims, Commissions, Debtors Screen Locations

**Question:** Where are the Claims, Commissions, and Debtors screens?  
**Answer:** Business stakeholder provided full navigation map (image upload, 2026-08-17). See DISC-008 (`Module_Page_Mapping.md`) for the complete cross-referenced inventory.  
**Classification:** SOURCE-CONFIRMED (business)

---

#### Debtors — RESOLVED

**Finding:** "Debtors" in the MIS system is named **Committal Tracking**. It is a single page: `/Committal_Tracking.aspx`. This page is **NOT in /Legacy/CRM** — it resides in the other application component (MISREPORTS or linked app).

The 9 debtors/collections Crystal Reports (Demand Letters, Fund Statements, Reversed Receipts, etc.) are the reporting face of this module. The committed-accounts tracking workflow is primarily report-driven with one management page.

**GAP-MOD-003:** Updated — Debtors = Committal Tracking, 1 page, in other application. Scope confirmed.

---

#### Commissions — RESOLVED

**Finding:** Commissions is not a standalone module. `/Commission_run.aspx` appears under the **Settings** module. This is a batch trigger page, not a full CRUD module. Commission calculation is performed by stored procedures (SP names confirmed in DISC-003). The 8 commission Crystal Reports are the output mechanism.

**There is no dedicated commissions management UI** — commission processing is SP/DB-driven, triggered from Settings.

**GAP-MOD-002:** Updated — Commissions = SP-driven batch process triggered from /Commission_run.aspx (Settings). No full module UI. Crystal Reports are the output.

---

#### Claims — STILL NOT IDENTIFIED

**Finding:** Claims does **not appear as a module** in the navigation map at all — no Claims menu item, no Claims ASPX pages in the navigation. Despite 2 confirmed SPs and 15 Crystal Reports on claims, there is no claims management UI in this application's navigation.

**Hypothesis confirmed by eOxegen answer:** Since eOxegen is the core Policy Administration System and MIS pulls data FROM eOxegen, claims processing may occur entirely within eOxegen. MIS may only VIEW claim data via Crystal Reports querying eOxegen-sourced data.

**GAP-MOD-001:** Remains open — claims UI not found. Business must confirm: are claims processed in eOxegen, not in MIS?

---

#### Additional Scope Discovery from Navigation Map

**CRITICAL:** The navigation map reveals that approximately **47 of the ~76 navigable pages are NOT in /Legacy/CRM**. The application has two distinct tiers:

| Tier | Pages | Location |
|---|---|---|
| CRM application (/Legacy/CRM) | 76 ASPX pages | Legacy repository — source accessible |
| Other application (MISREPORTS or linked) | ~47 pages | Source NOT accessible — separate application |

**NEW modules identified that were completely unknown before this mapping:**

| Module | Pages | Notes |
|---|---|---|
| Premium Refund | 6 | Refund workflow for declined/cancelled business — NEVER previously identified |
| Case Register | 1 | /Case_Allocated_ID.aspx |
| Complaint Tracking | 3 | Previously inferred from SPs only — now confirmed |
| Off System Cases | 6 | DPI, IP, Smart variants — confirmed |
| Portfolio Management | 3 | Production portfolio views |
| Retail BenchMarks | 3 | Retail management benchmarking |
| Retail Renewals | 6 | Distinct retail renewal workflow |
| Non-Medical Renewal | 2 | Separate from general renewal module |
| Enquiry | 6 | Read-only information lookup |
| Log Activity | 1 | M-Tiba data push trigger |

---

### Q-INT-001 — eOxegen Integration

**Question:** What is eOxegen and how does MIS interact with it?  
**Answer:** **"eOxegen is the core system, MIS pulls data from eOxegen"**  
**Classification:** SOURCE-CONFIRMED (business)  

**Resolution:** GAP-INT-001 partially resolved — direction and role confirmed.  

**Confirmed findings:**
| Finding | Classification |
|---|---|
| eOxegen is the core Policy Administration System (PAS) | SOURCE-CONFIRMED (business) |
| Data flows: eOxegen → MIS (MIS pulls/reads from eOxegen) | SOURCE-CONFIRMED (business) |
| MIS does not push data back to eOxegen | INFERRED — not contradicted |
| eOxegen is NOT the same application as MIS/MARVEL | SOURCE-CONFIRMED (business) |
| Crystal Reports named "eOxegen Integration" represent data pulled from eOxegen | SOURCE-CONFIRMED (business) |
| "eOxegen vs Accpac Amounts" report reconciles eOxegen data against ACCPAC | INFERRED |

**Remaining unknowns (still open):**
- What data does MIS pull from eOxegen? (Policy data? Premium data? Member data?)
- How does MIS pull data — direct DB connection, scheduled extract, API, flat file?
- How frequently is data pulled from eOxegen?
- Which tables or views in which database contain eOxegen-sourced data?
- Whether `DATA_REPOSITORY_DB_CLAPI` is eOxegen's staging area or a separate system  
- Whether the new MIS system will need to maintain the same integration or use a new mechanism

**New system implication:** The new system must replicate or replace the eOxegen data pull mechanism. This is a critical integration dependency that must be fully specified before the data model and API design can be finalised.

---

### Database List — RESOLVED (2026-08-17)

**Question:** What are the confirmed production databases?  
**Answer (business stakeholder, 2026-08-17):**

```
AAR_RISK_DB
AIMSOFT_DATADUMP
AIMSOFT_DATADUMP2023
COM_ACTIVITIES_DB
COMMISSION
CRM
DATA_REPOSITORY_DB
DB_MASTER_AGENTS
DB_MASTER_RENEWAL
DB_ONLINE_PORTAL
Doc_Arc_DB
SALES
```

**Total: 12 production databases confirmed.**

**Resolution:** CONFLICT-011 RESOLVED.
- DISC-003 originally listed 4 databases (from source code cross-DB queries only)
- ENV-002 listed 13 databases from project notes (unconfirmed)
- Business now confirms 12 databases as production
- The 4 source-confirmed databases (CRM, SALES, AAR_RISK_DB, DATA_REPOSITORY_DB_CLAPI) are all present in this list
- The 6 previously "project notes only" databases (AIMSOFT_DATADUMP, AIMSOFT_DATADUMP2023, COM_ACTIVITIES_DB, DB_MASTER_AGENTS, DB_MASTER_RENEWAL, DB_ONLINE_PORTAL) are now business-confirmed

**Two items to note:**

1. **MISREPORTS not in list:** Source code has `MISREPORTSConnectionString` at `192.168.50.48`. Business did not include a database named "MISREPORTS". The second application may use a different database name, or MISREPORTS may be an application name not a database name.

2. **DATA_REPOSITORY_DB vs DATA_REPOSITORY_DB_CLAPI:** Source code uses `_CLAPI` suffix. Business lists without suffix. Treated as the same database — `_CLAPI` is likely a connection alias. Confirm at first DB access.

---

## Summary of Resolved Conflicts

| Conflict ID | Description | Resolution |
|---|---|---|
| CONFLICT-005 | OTP: email vs SMS | **RESOLVED** — Email confirmed. SMSCOMMS.vb is legacy/unused for OTP. |
| CONFLICT-006 | Password minimum: 4 vs 6 | **RESOLVED** — Policy is 6 characters. Legacy code enforces 4 = defect. |
| CONFLICT-008 | Four-eyes approval broken | **RESOLVED** — Defect confirmed. Business now informed. New system must fix. |
| CONFLICT-009 | SMTP EnableSsl=False | **RESOLVED (operational)** — Emails work. New system must enforce TLS explicitly. |

## Summary of Resolved Gaps

| Gap ID | Description | Resolution |
|---|---|---|
| GAP-INT-001 (partial) | eOxegen integration direction | Confirmed: eOxegen is PAS; MIS pulls from it. Method and data elements still unknown. |

## Outstanding Items

| Item | Status | Action Required |
|---|---|---|
| Page mappings for Claims/Commissions/Debtors | PENDING | Awaiting stakeholder upload |
| eOxegen integration method and data elements | OPEN | Follow-up questions needed |
| All other Q-AUTH, Q-RR, Q-DB, Q-RPT questions | OPEN | Schedule stakeholder workshop |

---

*Document produced by: AI Engineering Agent — Discovery Validation Phase*  
*Answers recorded as provided by business stakeholder on 2026-08-17*  
*Legacy source /Legacy/CRM: READ-ONLY — no modifications made*
