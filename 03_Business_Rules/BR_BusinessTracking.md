# Business Rules — Business Tracking

**Document ID:** BR-BT  
**Project:** MIS Modernization  
**Phase:** Discovery — Business Rule Extraction  
**Date:** 2026-08-16  
**Source:** Business_Tracking.aspx.vb, Business_Tracking_Allocated.aspx.vb (structure inferred), TBL_MIS_CRM_BUSINESS_TRACKING schema (derived from SQL)  
**Status:** CONFIRMED unless noted  

---

## 1. Overview

Business Tracking is the **core operational module** of the MIS system. It manages the intake, processing, and workflow of new insurance business proposals from initial registration through to allocation, medical underwriting review, benefit verification, invoicing, and dispatch. The module covers both Medical and Non-Medical business for Retail and Corporate clients.

The module spans approximately 35 pages and is the most complex in the system. Only the entry/registration page (`Business_Tracking.aspx`) has been fully analysed in this session. The full business rule set for sub-pages requires further analysis.

---

## 2. Primary Data Entity: TBL_MIS_CRM_BUSINESS_TRACKING

The primary table for all business tracking activity. The following fields are CONFIRMED from SQL queries in the source code:

| Field | Type | Confirmed Value(s) | Description |
|---|---|---|---|
| `File_No` | Varchar PK | Auto-generated | Unique file number |
| `Proposer_Name` | Varchar | Free text | Client / proposer name |
| `Family_code` | Varchar | — | Family code / group code |
| `Receive_dt` | DateTime | Date picker | Date proposal received |
| `Premium` | Decimal | — | Premium amount (KES assumed) |
| `File_Status` | Varchar | See §4 | Current workflow state |
| `Business_Type` | Varchar | N, R | New or Renewal |
| `Client_Type` | Varchar | R, C | Retail or Corporate |
| `Business` | Varchar | M, N | Medical or Non-Medical |
| `Agent_id` | Varchar | From COMMISSION DB | Introducing agent |
| `Is_Mtiba` | Boolean | 0/1 | M-Tiba mobile payment flag |
| `Is_IPF` | Boolean | 0/1 | Instalment Premium Financing |
| `Walk_In_Client` | Varchar | Y/N | Walk-in client flag |
| `Rate_Type` | Varchar | S, C | Standard or Corporate rates |
| `Benefit_Verified` | Varchar | YES/NO | Benefit verification status |
| `Medical_UW` | Boolean | — | Medical underwriting required flag |
| `Allocated` | Boolean | 0/1 | Allocation complete flag |
| `INVOICED` | Boolean | 0/1 | Invoiced flag |
| `Walk_In_Client` | Varchar | Y/N | Walk-in client flag |
| `Allocated_to` | Varchar | username | Allocated membership admin |
| `Forwarded` | Boolean | 0/1 | File forwarded flag |
| `Forwarded_By` | Varchar | username | Who forwarded |
| `Forward_Date` | DateTime | — | When forwarded |
| `Is_Complete` | Boolean | 0/1 | Business completeness flag |
| `Ready_For_update` | Boolean | 0/1 | Ready for next processing step |
| `Is_Active` | Boolean | 0/1 | Soft delete flag |
| `Is_Declined` | Boolean | 0/1 | Declined/rejected flag |
| `Pay_Ref_No` | Varchar | — | Payment reference number |
| `Paid_Amt` | Decimal | — | Amount paid |
| `entered_by` | Varchar | username | User who created the record |
| `Allocate_Dt` | DateTime | — | Date allocated |

---

## 3. Registration — Business Rule Set

### BR-BT-001 — File Number Generation

**Rule:** Every business tracking record has a unique file number, generated sequentially by the system.

**Source:** Business_Tracking.aspx.vb `Generate_Task()` — CONFIRMED

**Format:** `{prefix}-F{NNN}` or similar sequential numeric — exact format to be confirmed from SP `sp_Business_Tracking_Action` which is called by `Business_Tracking()` in DataManagement.

**Note:** The file number is generated client-side using `MAX(File_No)+1` from the table. This is a race condition risk — the new system must use a DB sequence or GUID.

### BR-BT-002 — Required Fields for Registration

**Rule:** The following fields are mandatory before a business tracking record can be saved:

| Field | Validation | Error Message |
|---|---|---|
| Business Type | Non-empty selection | "Select The Business Type" |
| Client Type | Non-empty selection | "Select The Client Type" |
| Agent | Non-empty selection | "Select The Agent" |
| Proposer Name | Non-empty text | "Enter the Proposer Name" |
| Rate Type | Non-empty selection | "Select The Rate Type. i.e Normal standard or negotiated rates!" |
| Membership Admin | If Walk-In = true | "Select the membership admin!" |

**Source:** Business_Tracking.aspx.vb `btnsave_Click()`, lines 205-230 — CONFIRMED

### BR-BT-003 — Rate Type Auto-Selection Based on Client Type

**Rule:** Rate Type is automatically set based on Client Type. Users cannot override this.

| Client Type | Rate Type | Description |
|---|---|---|
| C (Corporate) | C | Corporate rates |
| R (Retail) | S | Standard rates |

**Source:** Business_Tracking.aspx.vb lines 236-241 — CONFIRMED

### BR-BT-004 — Document Checklist at Registration

**Rule:** At registration, the user selects which required documents have been received. This checklist comes from `TBL_MIS_CRM_BUSINESS_REQ` (Active=1, code not in 5,4,3).

**Source:** Business_Tracking.aspx.vb lines 40-48 — CONFIRMED

**On save:** For each checked document, a record is created in `TBL_MIS_CRM_DOCS` via `UPLOAD_ITEMS()` with `Upload_Done = 0` (document acknowledgement recorded but not yet uploaded).

**Forward blocker:** Files with `Upload_Done = 0` in `Doc_Arc_DB.dbo.TBL_MIS_CRM_DOCS` prevent forwarding. See BR-BT-009.

### BR-BT-005 — Walk-In Client Handling

**Rule:** Walk-in clients (who arrive in person without an agent) require a Membership Administrator to be assigned at registration time.

**Source:** Business_Tracking.aspx.vb lines 227-230, 393-394 — CONFIRMED

**Membership admin pool:** Employees where `Department IN ('MEMBERSHIP','NONMEDICAL')` and `Activated=1 AND Approved=1 AND Deleted=0`

**Effect on forward:** Walk-in clients are immediately allocated to the selected membership admin on forwarding — they skip the normal "FORWARDED" queue.

### BR-BT-006 — M-Tiba Payment Flag

**Rule:** A checkbox `Is_Mtiba` marks a business record as paid via M-Tiba (mobile health wallet). This flag affects downstream processing.

**Source:** Business_Tracking.aspx.vb lines 191-193 — CONFIRMED

### BR-BT-007 — IPF Flag

**Rule:** `Is_IPF` (Instalment Premium Financing) marks whether the premium will be paid in instalments rather than in full upfront.

**Source:** Business_Tracking.aspx.vb lines 194-196 — CONFIRMED

### BR-BT-008 — Payment Reference Tracking

**Rule:** Multiple business files can share a single payment reference (`Pay_Ref_No`). The system groups and sums paid amounts by payment reference.

**Source:** Business_Tracking.aspx.vb lines 340-350 — CONFIRMED

**Computed field:** `SUM(Paid_Amt)` displayed as total against a payment reference.

### BR-BT-009 — Agent Data Source

**Rule:** The agent selection comes from `COMMISSION.dbo.TBL_MIS_SALES_AGENTS` (cross-database), not from the CRM Employees table.

**Source:** Business_Tracking.aspx.vb line 50 — CONFIRMED

This confirms the SALES COMMISSION database as a fifth data source (previously categorised as SALES DB — this appears to be a separate COMMISSION database).

**IMPORTANT:** This is an additional database dependency not previously identified. Full database list now includes:
1. CRM (primary)
2. SALES
3. MISREPORTS
4. DATA_REPOSITORY_DB_CLAPI
5. AAR_RISK_DB (Risk Register — identified from Risk_Register_New.aspx.vb)
6. COMMISSION (agents — identified from Business_Tracking.aspx.vb)
7. Doc_Arc_DB (document archive — identified from Business_Tracking.aspx.vb line 306)

---

## 4. File Status Workflow

### BR-BT-010 — File Status State Machine

**Rule:** A business tracking file moves through defined statuses as it progresses. Status changes are recorded in `TBL_MIS_CRM_BUSINESS_TRACKING.File_Status`.

**Confirmed statuses:**

| Status | Meaning | Transition From |
|---|---|---|
| `REGISTERED` | Initial state — entered but not yet forwarded | New registration |
| `FORWARDED` | Forwarded to underwriting/processing team | Forward action on REGISTERED |
| `RETURNED-INCOMPLETE` | Returned to originator due to missing items | From underwriting team |
| `MEDICAL UW-REVIEW` | Requires medical underwriting review | Forward when med=1 |
| `BENEFIT VERIFICATION` | Benefit details need verification | Forward when Allocated=1 + not verified |
| `ALLOCATED` | Allocated to membership admin for processing | After verification or direct walk-in |
| `INVOICED` | Invoice raised | After allocation |
| `FORWARDED` (Non-Medical) | Sent to nonmedical@aar.co.ke | Forward when Business=N |

**UNKNOWN:** Additional statuses may exist (DISPATCHED, RECEIVED, DECLINED, POLICY ISSUED) — requires reading remaining 35 sub-pages and/or DB access.

**Delete constraint:** Only files in `REGISTERED`, `FORWARDED`, or `RETURNED-INCOMPLETE` status can be deleted (soft-deleted via `Is_Active=0`).

### BR-BT-011 — Forward Action Prerequisites

**Rule:** A file cannot be forwarded unless ALL of the following conditions are met:

1. "Business is complete" checkbox (`chkassembly`) is ticked
2. A file is selected (FILE_NO.Text not empty)
3. A comment is entered (`txtcomment`)
4. All required documents have been uploaded (`Upload_Done = 1` for all docs in TBL_MIS_CRM_DOCS)

**Source:** Business_Tracking.aspx.vb lines 361-379 — CONFIRMED

**On fail (missing docs):** "You must upload the Missing Documents!" — list of missing documents shown.

### BR-BT-012 — Forward Routing Logic

**Rule:** When a file is forwarded, the destination status is determined by a priority-ordered set of session flags:

```
IF Session("med") = 1
   THEN status = 'MEDICAL UW-REVIEW'
ELSE IF Session("Allocate") = 1 AND Session("Benefit_Verified") = "NO"
   THEN status = 'BENEFIT VERIFICATION'
ELSE IF Session("Allocate") = 1 AND Session("Benefit_Verified") = "YES" AND Session("INVOICED") = 0
   THEN status = 'ALLOCATED'
ELSE IF Session("INVOICED") = 1
   THEN status = 'INVOICED'
ELSE IF Walk_In_Client = true AND Business = 'M'
   THEN status = 'ALLOCATED', Allocated_to = cbomship.SelectedValue (direct allocation)
ELSE IF Business = 'N' (Non-Medical)
   THEN status = 'FORWARDED', email sent to nonmedical@aar.co.ke
ELSE
   THEN status = 'FORWARDED'
```

**Source:** Business_Tracking.aspx.vb lines 383-428 — CONFIRMED

### BR-BT-013 — Comments Mandatory at Forward

**Rule:** The user must enter a comment before forwarding. Comments are stored in `TBL_MIS_CRM_BUS_TRACKING_NOTES`.

**Source:** Business_Tracking.aspx.vb lines 401-403 — CONFIRMED

**Comment fields stored:** File_No, Note_From (username), Note_date, Notes, ACTIVE

### BR-BT-014 — Non-Medical Business Email Notification

**Rule:** When non-medical business is forwarded, an email is automatically sent to `nonmedical@aar.co.ke`.

**Email content:**
- Subject: "Registered-{ProposerName}"
- Body: "Kindly note that the above client has been Tracked and forwarded to Non-Medical Team for update!"

**Source:** Business_Tracking.aspx.vb lines 422-427 — CONFIRMED

### BR-BT-015 — Walk-In Email Notification to Membership Admin

**Rule:** When a walk-in medical client is forwarded to a specific membership admin, that admin receives an email notification.

**Source:** Business_Tracking.aspx.vb lines 407-413 — CONFIRMED

**Email retrieves:** Admin email from `employees.EMAIL` where `username = cbomship.SelectedValue`

**Email body:** "Kindly note that you have been Allocated the below Business for a Walk-In Client by Customer Service Desk for update. TREAT THIS AS AGENT!"

---

## 5. Document Management

### BR-BT-016 — Document Upload Requirements

**Rule:** Documents attached to a business file must be uploaded before the file can be forwarded. Document acknowledgement and actual upload are tracked separately.

**Source:** Business_Tracking.aspx.vb `btnupload_Click()`, lines 459-550 — CONFIRMED

**Accepted file formats:** .doc, .docx, .xls, .xlsx, .jpg, .png, .gif, .jpeg, .pdf, .rar, .zip, .eml, .msg

**Storage:** Files stored as binary data in `Doc_Arc_DB.dbo.TBL_MIS_CRM_DOCS`
- Fields: DOC_ID, File_No, Doc_Title, Doc_Date, File_Name, Upload_By, Upload_Done

**Upload fields required:** File selection + document title (both mandatory)

**Modern implementation note:** Binary storage in SQL Server is a significant concern. Documents should be stored in Object Storage (Replit) with only metadata in PostgreSQL. Max file size not confirmed — unknown constraint.

### BR-BT-017 — My Pending Files View (Default Grid)

**Rule:** On page load, a user sees only their own pending files: records where `entered_by = Session("username") AND Forwarded=0 AND Is_Active=1`

**After forwarding:** Grid reloads showing: `entered_by = current user AND Forwarded=0 AND Ready_For_update=0 AND Is_Declined=0 AND Is_Active=1`

**Source:** Business_Tracking.aspx.vb lines 70-80, 287-298 — CONFIRMED

---

## 6. Welcome Dashboard — Sales Hierarchy

### BR-BT-018 — Role-Based Welcome Dashboard

**Rule:** The Welcome.aspx dashboard shows a sales performance view personalised to the logged-in user's position in the sales hierarchy.

**Source:** Welcome.aspx.vb lines 87-181 — CONFIRMED

**Hierarchy identification (priority order — first match wins):**

| Level | Table | Code Field | Description |
|---|---|---|---|
| RE (Regional Executive) | `TBL_MIS_CRM_RMS` | `RE_CODE` | Regional executives see regional data |
| CLASS (Classification Manager) | `TBL_MIS_CRM_CLASS_MGR` | `MGR_CODE` | Classification managers see class data |
| NSM (National Sales Manager) | `TBL_MIS_CRM_NSM` | `NSM_CODE` | NSMs see national data |
| ADMIN (Retention Admin) | `TBL_MIS_CRM_RETENTION_ADMIN` | `ADMIN_CODE` | Retention admins see admin data |
| BPO | `employees` | `username` | Individual level dashboard |
| (none matched) | — | — | Limited view shown (`P0.Visible = True`) |

**Year context:** Year derived from the active production month (SALES DB) — `Session("YEAR")`.

**Purpose:** Each user sees their own portfolio performance at the appropriate level of aggregation in the sales hierarchy.

---

## 7. Cross-Database Dependencies (Business Tracking)

| Database | Table/View | Purpose |
|---|---|---|
| COMMISSION.dbo | TBL_MIS_SALES_AGENTS | Agent lookup list |
| CRM.dbo | TBL_MIS_CRM_BUSINESS_TRACKING | Primary business tracking table |
| CRM.dbo | TBL_MIS_CRM_BUSINESS_REQ | Required document checklist |
| CRM.dbo | TBL_MIS_CRM_BUS_TRACKING_NOTES | File comments/notes |
| CRM.dbo | Employees | Membership admin lookup |
| Doc_Arc_DB.dbo | TBL_MIS_CRM_DOCS | Document storage (binary) |
| SALES.dbo | TBL_MIS_PROD_MONTHS | Production month / date range |

---

## 8. Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-BT-001 | What are all File_Status values (full list)? | State machine completeness | DB access |
| OQ-BT-002 | What does `sp_Business_Tracking_Action` SP do? | Registration business logic | DB access |
| OQ-BT-003 | Are files stored as BLOB in SQL or as file paths? (Doc_Arc_DB) | Architecture — Object Storage decision | DB access |
| OQ-BT-004 | What is the COMMISSION database? Is it a separate SQL Server instance? | Infrastructure | DBA |
| OQ-BT-005 | What happens after INVOICED status? (dispatch, policy issue) | Requires reading sub-pages | Code analysis |
| OQ-BT-006 | What is the file number format in production? | Data migration | Business |
| OQ-BT-007 | Are Business_Type N/R and Business M/N two separate dimensions? | Data model | Code analysis |
| OQ-BT-008 | What are the 35 sub-pages of Business Tracking? | Full module scope | Code analysis |

---

## 9. Additional Database Discovery

> **CRITICAL UPDATE:** Source code analysis of Business_Tracking.aspx.vb has revealed **three additional databases** not previously catalogued in DISC-003 (Legacy_Dependency_Inventory.md):
>
> | Database | Connection Reference | Purpose |
> |---|---|---|
> | `COMMISSION` | `COMMISSION.dbo.TBL_MIS_SALES_AGENTS` | Sales agents master data |
> | `Doc_Arc_DB` | `Doc_Arc_DB.dbo.TBL_MIS_CRM_DOCS` | Document binary storage |
> | `AAR_RISK_DB` | Multiple tables in Risk Register | Risk register data |
>
> **DISC-003 must be updated** to include these. Total confirmed database count is now **7** (CRM, SALES, MISREPORTS, DATA_REPOSITORY_DB_CLAPI, AAR_RISK_DB, COMMISSION, Doc_Arc_DB).

---

*Document produced by: AI Engineering Agent — Business Rule Extraction*  
*Source: /Legacy/CRM — READ-ONLY, no modifications made*
