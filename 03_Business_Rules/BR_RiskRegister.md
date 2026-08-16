# Business Rules — Risk Register

**Document ID:** BR-RISK  
**Project:** MIS Modernization  
**Phase:** Discovery — Business Rule Extraction  
**Date:** 2026-08-16  
**Source:** Risk_Register_New.aspx.vb, Risk_Register_Dashboard.aspx.vb, Risk_Register_Open.aspx.vb (not yet read), additional Risk_Register_*.aspx.vb files (not yet read)  
**Status:** CONFIRMED unless noted  

---

## 1. Overview

The Risk Register module enables department-level risk management. Each department has designated **Risk Champions** who register, assess, and update risks within their department's risk portfolio. The module implements a structured review and sign-off workflow, culminating in a management dashboard showing enterprise-wide risk exposure.

The module uses a **dedicated database: `AAR_RISK_DB`** — separate from the main CRM database.

---

## 2. Database and Data Model

### BR-RISK-001 — Dedicated Risk Database

**Rule:** All risk register data is stored in the `AAR_RISK_DB` database, separate from the CRM database.

**Source:** Risk_Register_New.aspx.vb line 28 — CONFIRMED

**Tables confirmed:**

| Table | Purpose |
|---|---|
| `TBL_MIS_RISK_PERIOD` | Risk assessment periods (open/closed) |
| `TBL_MIS_RISK_CHAMPS` | Risk champions — maps employee to department |
| `TBL_MIS_RISK_CATEGORY` | Risk category lookup (code, Category_Name) |
| `TBL_MIS_RISK_OWNER` | Risk owners by department (Owner_Code, Owner_Name, Department, Email) |
| `TBL_MIS_RISK_OBJE` | Risk objectives by department (code, Obj_Name, Depart_code) |
| `TBL_MIS_RISK_MASTER` | Primary risk register — all risk records |
| `TBL_MIS_RISK_ROOT_CAUSE` | Root cause analysis per risk |
| `TBL_MIS_RISK_SUMMARY` | Department-level period summary (review/sign-off status) |
| `TBL_MIS_RISK_DEPART` | Department lookup |
| `TBL_MIS_RISK_MASTER_SUMMARY` | Aggregated risk summary for reporting |

**Views confirmed:**

| View | Purpose |
|---|---|
| `VW_MIS_CRM_RISK_SUMMARY` | Department summary with champion/owner/status |
| `VW_MIS_CRM_RISK_MASTER` | Full risk detail with computed fields |
| `VW_MIS_RISK_MASTER_DET` | Detailed risk master for reports |

---

## 3. Risk Period Management

### BR-RISK-002 — Open Risk Period Determines Active Assessment Window

**Rule:** The system always works within the currently open risk period. Page load automatically sets the date range from the minimum open period.

**Source:** Risk_Register_New.aspx.vb lines 28-33 — CONFIRMED

**Query:** `SELECT MIN(Period_From), MIN(Period_To) FROM TBL_MIS_RISK_PERIOD WHERE Status='OPEN'`

**Period fields:** `Period_From` (start date), `Period_To` (end date), `Status` ('OPEN' or other)

**UNKNOWN:** What other period statuses exist? How periods are opened/closed? Is there a period management screen?

---

## 4. Risk Champions (Department Representatives)

### BR-RISK-003 — Risk Champion Scoped to Department

**Rule:** Each MIS user who is a Risk Champion is associated with exactly one department. They can only register and update risks for their own department.

**Source:** Risk_Register_New.aspx.vb lines 35-46 — CONFIRMED

**Champion lookup:** From employee's `emp_code` → `TBL_MIS_RISK_CHAMPS.Department`

**Scoping:** All risk data queries are filtered by `Depart_Code = {user's department code}`.

### BR-RISK-004 — Department Determines Available Owners and Objectives

**Rule:** The list of risk owners and risk objectives available when registering a risk is filtered by the current user's department.

**Source:** Risk_Register_New.aspx.vb lines 60-79 — CONFIRMED

- Risk owners: `SELECT Owner_Code, Owner_Name FROM TBL_MIS_RISK_OWNER WHERE Department = '{department}'`
- Risk objectives: `SELECT code, Obj_Name FROM TBL_MIS_RISK_OBJE WHERE Depart_code = '{department}'`

---

## 5. Risk Registration

### BR-RISK-005 — Risk Code Generation

**Rule:** Each risk record is assigned a system-generated code in the format `FIN-RNNN` (e.g., FIN-R001, FIN-R025).

**Source:** Risk_Register_New.aspx.vb `Generate_Task()`, lines 200-209 — CONFIRMED

**Format:** `"FIN-R" + LPAD(MAX(Risk_Id)+1, 3, '0')`

**Note:** Same race condition risk as business file number. New system must use DB sequence.

### BR-RISK-006 — Risk Registration Fields

**Rule:** A new risk record requires the following data:

| Field | Source | Notes |
|---|---|---|
| Department Code | `FILE_NO.Text` = user's department | Auto-populated |
| Risk Code | `LBLRISK.Text` | Auto-generated |
| Period From | `dtfrom.DbSelectedDate` | From open period |
| Period To | `dtto.DbSelectedDate` | From open period |
| Department Objective | `cboobjective.SelectedValue` | From TBL_MIS_RISK_OBJE |
| Risk Title | `txttitle.Text` | Free text |
| Risk Description | `txtdescr.Text` | Free text |
| Risk Category | `cbocategory.SelectedValue` | From TBL_MIS_RISK_CATEGORY |
| Risk Consequence | `txtconseq.Text` | Free text |
| Active flag | `chkactive.Checked` | Is this risk active |

**Source:** Risk_Register_New.aspx.vb lines 227 — CONFIRMED

**Stored via:** `update_register()` DataManagement method with 30+ parameters (full parameter list visible in source).

### BR-RISK-007 — Risk Values Computed After Save

**Rule:** After saving a new risk, the system calls `Compute_Risk_Values(department, riskCode, periodFrom, periodTo)` to calculate derived risk scores.

**Source:** Risk_Register_New.aspx.vb line 231 — CONFIRMED

**UNKNOWN:** The SP body that implements `Compute_Risk_Values` is not visible without DB access. It calculates `I_Risk_Exposure`, `I_Risk_Rate`, `R_Risk_Rate`, `R_Risk_Exposure` and related fields.

### BR-RISK-008 — Read-Only View / Edit Workflow

**Rule:** Risk records open in read-only mode by default. The user must click "Edit" to enable modification.

**Source:** Risk_Register_New.aspx.vb lines 87-97 (initial load: all fields disabled) and lines 299-315 (btnedit_Click enables fields) — CONFIRMED

---

## 6. Risk Scoring and Classification

### BR-RISK-009 — Risk Scoring Model (Confirmed Fields)

**Rule:** Each risk is assessed along multiple dimensions that combine to produce exposure scores.

**Confirmed data fields from `TBL_MIS_RISK_MASTER`:**

| Field | Meaning |
|---|---|
| `Risk_Impact` | Impact level (text/rating) |
| `I_Rate` | Inherent impact rate (numeric) |
| `Risk_Likelihood` | Likelihood level (text/rating) |
| `L_Rate` | Likelihood rate (numeric) |
| `I_Risk_Exposure` | Inherent risk exposure score |
| `I_Risk_Rate` | Inherent risk rate (numeric) |
| `Current_Contr` | Current controls in place |
| `Perceived_Contr_Eff` | Perceived control effectiveness (%) |
| `Perceived_Rate` | Control effectiveness rating |
| `Desired_Contr_Effe` | Desired control effectiveness |
| `R_Risk_Rate` | Residual risk rate |
| `R_Risk_Exposure` | Residual risk exposure score |

**UNKNOWN:** The exact formula for combining Impact × Likelihood → Exposure, and how `Compute_Risk_Values` SP derives these. Database access required.

### BR-RISK-010 — Risk Exposure Heat Map (Color Coding)

**Rule:** Risk records are colour-coded by `R_Risk_Exposure` (residual risk exposure score) in all grid views:

| R_Risk_Exposure | Colour | Classification |
|---|---|---|
| > 40 | Red | Critical |
| 26–40 | Orange | High |
| 15–25 | Yellow | Medium |
| 7–14 | Light Yellow | Low-Medium |
| 1–6 | Light Green | Low |

**Source:** Risk_Register_Dashboard.aspx.vb lines 293-313 — CONFIRMED

**Applied to:** Overall risk grid, department risk summary grid, risk master summary grid — all dashboards use this same scale.

---

## 7. Root Cause Analysis

### BR-RISK-011 — Root Cause Records per Risk

**Rule:** Each risk can have one or more root cause records capturing: cause, current controls, mitigation actions, due dates, and action owners.

**Source:** Risk_Register_Dashboard.aspx.vb lines 270-280 — CONFIRMED

**Table:** `TBL_MIS_RISK_ROOT_CAUSE` — fields: `Root_id`, `Risk_Code`, `Root_Cause`, `Current_Contr`, `Mitigations`, `Due_Date`, `Action_Owner`, `Action_Status`

**Action statuses confirmed:** "Behind schedule", "Closed" (additional values possible)

---

## 8. Review and Sign-Off Workflow

### BR-RISK-012 — Department Risk Summary Status Workflow

**Rule:** Each department's risk submission for a period goes through a workflow of: Submit → Review → Sign Off.

**Source:** Risk_Register_Dashboard.aspx.vb — CONFIRMED via query filters

**Workflow flags in `TBL_MIS_RISK_SUMMARY`:**

| Flag | Meaning |
|---|---|
| `Submitted` | Champion has submitted the department's risks for review |
| `Reviewed` | Risks have been reviewed by risk management |
| `Sign_off` | Risk management has signed off on the department's risks |

**Dashboard filter:** `WHERE Reviewed=1 AND Sign_off=1` — only shows departments that have completed the full review workflow.

**UNKNOWN:** Who reviews and signs off? Which screen(s) are used for review and sign-off? This requires reading `Risk_Register_Review.aspx.vb` and related pages.

### BR-RISK-013 — Dashboard Scope by Review Status

**Rule:** The risk register dashboard shows different data depending on filter mode:

**Mode 1 (default, `RadButton2_Click`):** Reviewed AND signed-off departments for the selected period (closed status)

**Mode 2:** All reviewed and signed-off departments for a selected period range

**UNKNOWN:** The dashboard has additional filter modes via `cborpt` (report type selector). Full enumeration requires reading the complete dashboard code.

---

## 9. Risk Dashboard

### BR-RISK-014 — Dashboard Report Types

**Rule:** The dashboard provides multiple report/export views selectable via `cborpt`:

| Code | Report | Description |
|---|---|---|
| `RR` | Risk Register | Full risk register for department and period |
| `RS` | Risk Summary | Top 10 ranked risks by department |
| `T10` | Top 15 Risks | Top 15 by residual risk exposure |
| `OD` | Overdue | Risks with `Action_Status = 'Behind schedule'` |
| `O10` | Top 10 Overdue | Top 15 overdue risks (Crystal Report output) |
| `CR` | Closed Risks | Risks with `Action_status = 'Closed'` within period range |

**Source:** Risk_Register_Dashboard.aspx.vb lines 226-250 — CONFIRMED

**Export:** Most reports export to Excel via `Session("Mytable") → Reports.aspx`. The `O10` type uses Crystal Report output instead.

### BR-RISK-015 — Dashboard Summary Grids

**Rule:** The dashboard displays three summary grids simultaneously:

1. **Department summary** (`GDDEPART`): All departments that have reviewed + signed off, showing status
2. **Top 15 risks overall** (`GDOVERAL`): Highest residual risk exposure across all signed-off departments
3. **Top 10 overdue actions** (`GDOVERDUE`): Highest-exposure risks with `Action_Status = 'Behind schedule'`

**Source:** Risk_Register_Dashboard.aspx.vb lines 51-87 — CONFIRMED

### BR-RISK-016 — Department Drill-Down in Dashboard

**Rule:** Clicking a department in the summary grid loads that department's full risk register and summary in the detail grids.

**Source:** Risk_Register_Dashboard.aspx.vb `GDDEPART_SelectedIndexChanged()` — CONFIRMED

**Detail grids populated:**
- Full risk list for selected department and period
- Risk summary table (`TBL_MIS_RISK_MASTER_SUMMARY`) ranked by R_Risk_Exposure descending
- Top 10 highest-exposure risks for the department

---

## 10. Risk Register Pages Inventory

Based on file listing, the Risk Register module consists of 11 pages:

| Page | Status | Purpose |
|---|---|---|
| Risk_Register_New.aspx | READ | Enter new risks for department |
| Risk_Register_Dashboard.aspx | READ | Management dashboard |
| Risk_Register_Open.aspx | PENDING | Open risk list management |
| Risk_Register_Update.aspx | PENDING | Update existing risk |
| Risk_Register_Review.aspx | PENDING | Review step |
| Risk_Register_History.aspx | PENDING | Historical risk view |
| Risk_Register_Close.aspx | PENDING | Close/resolve a risk |
| Risk_Register_Closed.aspx | PENDING | View closed risks |
| Risk_Register_Summary.aspx | PENDING | Summary view |
| Risk_Status.aspx | PENDING | Risk status dashboard |
| Risk_Map_Champions.aspx | PENDING | Map of champions |
| Risk_Rating_Client.aspx | PENDING | Client risk rating |

---

## 11. Business Rules Summary

| Rule ID | Rule | Priority |
|---|---|---|
| BR-RISK-001 | Dedicated AAR_RISK_DB database | CRITICAL — architecture |
| BR-RISK-002 | Open period determines active assessment | MUST PRESERVE |
| BR-RISK-003 | Champion scoped to department | MUST PRESERVE |
| BR-RISK-004 | Owner/objective filtered by department | MUST PRESERVE |
| BR-RISK-005 | FIN-RNNN risk code generation | MUST PRESERVE — fix race condition |
| BR-RISK-006 | Risk registration fields | MUST PRESERVE |
| BR-RISK-007 | Risk values computed after save | MUST PRESERVE — SP to be reverse-engineered |
| BR-RISK-008 | Read-only view / edit workflow | MUST PRESERVE |
| BR-RISK-009 | Multi-dimensional risk scoring | MUST PRESERVE — formula unknown |
| BR-RISK-010 | Heat map colour thresholds (1-6/7-14/15-25/26-40/>40) | MUST PRESERVE — business standard |
| BR-RISK-011 | Root cause records per risk | MUST PRESERVE |
| BR-RISK-012 | Submit → Review → Sign-off workflow | MUST PRESERVE |
| BR-RISK-013 | Dashboard scope by review status | MUST PRESERVE |
| BR-RISK-014 | Multiple report types | MUST PRESERVE |
| BR-RISK-015 | Three dashboard summary grids | MUST PRESERVE |
| BR-RISK-016 | Department drill-down | MUST PRESERVE |

---

## 12. Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-RISK-001 | What is the risk scoring formula? (Impact × Likelihood → Exposure) | Core algorithm | DB access (Compute_Risk_Values SP) |
| OQ-RISK-002 | Who reviews and signs off — specific roles/profiles? | Workflow | Business |
| OQ-RISK-003 | How are risk periods opened and closed? Is there an admin screen? | Period management | Code analysis |
| OQ-RISK-004 | What is `Risk_Rating_Client.aspx`? Is it related to AAR_RISK_DB? | Scope | Code analysis |
| OQ-RISK-005 | How is AAR_RISK_DB connection managed? Same encrypted connection string as CRM? | Infrastructure | DBA |
| OQ-RISK-006 | What does `TBL_MIS_RISK_MASTER_SUMMARY` contain — is it pre-computed or live? | Performance | DB access |

---

*Document produced by: AI Engineering Agent — Business Rule Extraction*  
*Source: /Legacy/CRM — READ-ONLY, no modifications made*
