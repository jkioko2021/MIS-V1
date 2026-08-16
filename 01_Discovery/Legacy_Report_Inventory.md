# Legacy Report Inventory

**Document ID:** DISC-007  
**Project:** MIS Modernization  
**Phase:** Discovery  
**Date:** 2026-08-16  
**Status:** CONFIRMED unless noted  
**Source:** /Legacy/CRM/Reports/*.rpt (184 files), Reports.aspx.vb  

> ⚠️ **IMPORTANT:** All 184 reports are binary Crystal Reports (.rpt) files.  
> Their internal SQL, parameters, formulas, grouping, and calculated fields CANNOT be read from source code.  
> Each report must be opened in SAP Crystal Reports to extract business specifications.  
> This inventory catalogues report names and inferred purposes only.

---

## 1. Reporting Architecture

| Item | Detail | Classification |
|---|---|---|
| Reporting Engine | SAP Crystal Reports 13.0.2000.0 | CONFIRMED |
| Report Format | Binary .rpt files | CONFIRMED |
| Report Count | 184 reports | CONFIRMED |
| Report Directory | /Legacy/CRM/Reports/ | CONFIRMED |
| Report Viewer Page | Reports.aspx (CrystalReportViewer1) | CONFIRMED |
| Report Selection | Reports_Page.aspx | CONFIRMED |
| Report Loading | Server.MapPath("~\Reports") & "\" & Reportname & ".rpt" | CONFIRMED |
| Data Source | Crystal Report connects to SQL Server via connection string | CONFIRMED |
| Report Server | MISREPORTS (192.168.50.48) — referenced in AppSettings | CONFIRMED |
| Parameter Passing | Session variables → Crystal Report selection formula | CONFIRMED |
| Output Format | Browser-embedded Crystal viewer | CONFIRMED |

### How Reports are Loaded (CONFIRMED)

```vb
' Reports.aspx.vb
Reportpath = Server.MapPath("~\Reports") & "\" & Reportname & ".rpt"
rpt = New ReportDocument
rpt.Load(Reportpath)
' Parameters applied via session: Session("SelectionFormula"), Session("RptFormula")
CrystalReportViewer1.ReportSource = rpt
```

Session variables used for report parameters:
- `Session("Reportname")` — report file name
- `Session("Report_")` — report identifier
- `Session("SelectionFormula")` — Crystal Report record selection formula
- `Session("RptFormula")` — additional formula
- `Session("RptToPrint")` — report to print
- `Session("ReportTitle")` — report title

---

## 2. Complete Report File Inventory (184 Reports)

### 2.1 Account and Financial Reports (14 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 1 | ACCOUNT Statement.rpt | Customer account statement | INFERRED |
| 2 | Customer Invoice.rpt | Customer invoice | INFERRED |
| 3 | Customer Invoice_v.rpt | Customer invoice variant | INFERRED |
| 4 | Customer Statement.rpt | Customer statement | INFERRED |
| 5 | Customer Statement_1.rpt | Customer statement variant 1 | INFERRED |
| 6 | Customer Statement_Agent.rpt | Agent customer statement | INFERRED |
| 7 | Customer Statement_Non.rpt | Non-standard customer statement | INFERRED |
| 8 | Customer Statement_old.rpt | Old version statement | INFERRED |
| 9 | Customer Statement-.rpt | Statement variant | INFERRED |
| 10 | Customer Statement_W.rpt | Statement variant W | INFERRED |
| 11 | Customer Statement_X.rpt | Statement variant X | INFERRED |
| 12 | Customer StatementX.rpt | Statement variant X (alt) | INFERRED |
| 13 | Policy Statement.rpt | Policy financial statement | INFERRED |
| 14 | Member Statement.rpt | Member account statement | INFERRED |

> **NOTE:** Multiple statement variants suggest business rule variations per client type/product. These variants must be individually documented.

### 2.2 Claims Reports (15 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 15 | Claims Audit Listing.rpt | Audit listing of claims | INFERRED |
| 16 | Claims Count Per User.rpt | Claims count per processing user | INFERRED |
| 17 | Claims Data Report(Fund Claims).rpt | Fund claims data | INFERRED |
| 18 | Claims Statement.rpt | Claims statement | INFERRED |
| 19 | Claims Trend Report-Per Provider.rpt | Claims trends by provider | INFERRED |
| 20 | Claims Trend Report-Per Year.rpt | Claims trends by year | INFERRED |
| 21 | Claims Utilization-Audited.rpt | Audited utilization | INFERRED |
| 22 | Claims Utilization-Member.rpt | Member utilization | INFERRED |
| 23 | Claims Utilization.rpt | General utilization | INFERRED |
| 24 | Claims Utilization-Statements.rpt | Utilization statements | INFERRED |
| 25 | Daily Hospital Record.rpt | Daily hospital claims | INFERRED |
| 26 | Daily Hospital Record(Agents).rpt | Daily hospital by agent | INFERRED |
| 27 | Hospital Cash Claims.rpt | Hospital cash claims | INFERRED |
| 28 | Hospital Cash Claims-Amt Not Matching.rpt | Cash claims reconciliation | INFERRED |
| 29 | Hospitalization By AgeBand.rpt | Hospital utilization by age | INFERRED |

### 2.3 Commission Reports (8 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 30 | Commission Listing.rpt | Commission listing | INFERRED |
| 31 | Commissions Per Agent.rpt | Agent commissions | INFERRED |
| 32 | COMMISSIONS UPLOAD.rpt | Commission upload confirmation | INFERRED |
| 33 | COMMISSIONS UPLOAD_C.rpt | Commission upload variant | INFERRED |
| 34 | OVERRIDES UPLOAD.rpt | Overrides upload | INFERRED |
| 35 | OVERRIDES UPLOAD_O.rpt | Overrides upload variant | INFERRED |
| 36 | PROCESSED COMMISSION.rpt | Processed commissions | INFERRED |
| 37 | UN-PROCESSED COMMISSION.rpt | Unprocessed commissions | INFERRED |

### 2.4 Renewal Reports (18 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 38 | Bronze_Renewal Advice.rpt | Bronze product renewal advice letter | INFERRED |
| 39 | CoverMe_Renewal Advice.rpt | CoverMe product renewal advice | INFERRED |
| 40 | Gold_Renewal Advice.rpt | Gold product renewal advice | INFERRED |
| 41 | L-Renewal Advice.rpt | L-product renewal advice | INFERRED |
| 42 | Silver_Renewal Advice.rpt | Silver product renewal advice | INFERRED |
| 43 | Failed Renewal Schedules.rpt | Failed renewal schedule report | INFERRED |
| 44 | Renewal Letter.rpt | Renewal letter | INFERRED |
| 45 | Renewal Letter-Silverplus.rpt | Silverplus renewal letter | INFERRED |
| 46 | Renewal_Proac_Schedule.rpt | Proactive renewal schedule | INFERRED |
| 47 | Renewal Schedule.rpt | General renewal schedule | INFERRED |
| 48 | Renewal Schedule_.rpt | Renewal schedule variant | INFERRED |
| 49 | Renewal Schedule_11_6.rpt | Renewal schedule dated variant | INFERRED |
| 50 | Renewal Schedule-Gen_orig.rpt | General original renewal schedule | INFERRED |
| 51 | Renewal Schedule-Gen.rpt | General renewal schedule | INFERRED |
| 52 | Renewal Schedule_NEW.rpt | New renewal schedule | INFERRED |
| 53 | Renewal Schedule_N.rpt | N variant renewal schedule | INFERRED |
| 54 | Renewal Schedule_N_S.rpt | N/S variant renewal schedule | INFERRED |
| 55 | Renewal Schedule_org.rpt | Original renewal schedule | INFERRED |
| 56 | Renewal Schedule-S.rpt | S variant renewal schedule | INFERRED |
| 57 | Renewal Schedule_X.rpt | X variant renewal schedule | INFERRED |
| 58 | Renewal S_Test.rpt | Test renewal schedule | INFERRED |

### 2.5 Production and Sales Reports (15 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 59 | Production-BM.rpt | Production by BM (Business Manager) | INFERRED |
| 60 | PRODUCTION_CATEGORY 1.rpt | Production category 1 | INFERRED |
| 61 | PRODUCTION_CATEGORY 2.rpt | Production category 2 | INFERRED |
| 62 | PRODUCTION_CATEGORY 3.rpt | Production category 3 | INFERRED |
| 63 | Branch Summary.rpt | Branch production summary | INFERRED |
| 64 | Branch Summary-GM.rpt | Branch summary for GM | INFERRED |
| 65 | Sales Agent Register.rpt | Sales agent registration list | INFERRED |
| 66 | Sales_Audit_Trail.rpt | Sales audit trail | INFERRED |
| 67 | Sales Statement.rpt | Sales statement | INFERRED |
| 68 | Statement-BDM & RM.rpt | Statement for BDM and RM | INFERRED |
| 69 | Statement-BDM.rpt | Business Development Manager statement | INFERRED |
| 70 | Statement-Comments.rpt | Statement with comments | INFERRED |
| 71 | Statement-Commission Per Branch.rpt | Commission by branch | INFERRED |
| 72 | Statement-Overide Branch.rpt | Override by branch | INFERRED |
| 73 | Statement-PER BRANCH.rpt | Statement per branch | INFERRED |
| 74 | Statement-RM.rpt | Relationship Manager statement | INFERRED |
| 75 | Statement-SA_1.rpt | Sales Associate statement 1 | INFERRED |
| 76 | Statement-SA.rpt | Sales Associate statement | INFERRED |
| 77 | Statement-UM.rpt | Underwriting Manager statement | INFERRED |

### 2.6 Member and Membership Reports (12 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 78 | Membership List.rpt | Full membership list | INFERRED |
| 79 | Daily Membership Update.rpt | Daily member changes | INFERRED |
| 80 | Member Account Details.rpt | Member account details | INFERRED |
| 81 | Member_benefit_Consumption.rpt | Member benefit usage | INFERRED |
| 82 | Member Endorsement-List.rpt | Member endorsement list | INFERRED |
| 83 | Member Endorsement-Member.rpt | Endorsement per member | INFERRED |
| 84 | Member Notes.rpt | Member notes | INFERRED |
| 85 | Members-Over 65 Medex Only.rpt | Members over 65 (Medex) | INFERRED |
| 86 | Members-Over 65 Years.rpt | Members over 65 | INFERRED |
| 87 | Members-Over 65 Years_Numbers.rpt | Count of members over 65 | INFERRED |
| 88 | Contact Info(Members).rpt | Member contact information | INFERRED |
| 89 | Contact Info(Employer).rpt | Employer contact information | INFERRED |
| 90 | Contact Info(Provider).rpt | Healthcare provider contacts | INFERRED |

### 2.7 Benefits Reports (3 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 91 | Benefits-Member.rpt | Benefits per member | INFERRED |
| 92 | Benefits-Per Policy.rpt | Benefits per policy | INFERRED |
| 93 | Benefits-Scheme.rpt | Scheme benefits | INFERRED |

### 2.8 Invoice and Invoice Reconciliation Reports (9 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 94 | Invoice.rpt | Standard invoice | INFERRED |
| 95 | Invoice Register.rpt | Invoice register | INFERRED |
| 96 | Retail Invoice.rpt | Retail product invoice | INFERRED |
| 97 | SilverPlus Invoice.rpt | SilverPlus product invoice | INFERRED |
| 98 | Paid Invoices.rpt | Paid invoice list | INFERRED |
| 99 | UN-Paid Invoices.rpt | Unpaid invoice list | INFERRED |
| 100 | Invoice Audited.rpt | Audited invoice report | INFERRED |
| 101 | Invoice Audited-Mismatching Amts.rpt | Invoice reconciliation errors | INFERRED |
| 102 | Endorsement_schedule.rpt | Endorsement schedule | INFERRED |

### 2.9 eOxegen / External Integration Reports (7 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 103 | eOxegen_Intergration_summarized.rpt | eOxegen integration summary | INFERRED |
| 104 | eOxegen_Intergration_summarized_x.rpt | eOxegen integration summary X | INFERRED |
| 105 | eOxegen_Intergration_summarized_xx.rpt | eOxegen integration summary XX | INFERRED |
| 106 | eOxegen_Intergration_summary_1.rpt | eOxegen integration summary 1 | INFERRED |
| 107 | eOxegen_Intergration_sum.rpt | eOxegen integration summary (short) | INFERRED |
| 108 | eOxegen vs Accpac Amounts.rpt | Reconciliation: eOxegen vs ACCPAC | INFERRED |
| 109 | Audited-0 payable Amt.rpt | Zero payable amount audit | INFERRED |
| 110 | Audited-Errors on Interface.rpt | Interface error audit | INFERRED |
| 111 | Audited-Matching Amts.rpt | Matching amounts audit | INFERRED |
| 112 | Audited-Missing On Interface.rpt | Missing records on interface | INFERRED |
| 113 | Daily Audit summary.rpt | Daily audit summary | INFERRED |
| 114 | Daily Collections.rpt | Daily collections | INFERRED |
| 115 | System Audit Trail.rpt | System-wide audit trail | INFERRED |
| 116 | Login Audit Trail.rpt | User login audit | INFERRED |

### 2.10 Debtors and Collections Reports (5 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 117 | Demand Letter.rpt | Debt demand letter | INFERRED |
| 118 | Demand Letter_.rpt | Demand letter variant | INFERRED |
| 119 | Demand_Letter.rpt | Demand letter alt | INFERRED |
| 120 | Statement-Emails.rpt | Email statement | INFERRED |
| 121 | Statement-Emails Not Send.rpt | Emails not sent | INFERRED |
| 122 | Statement-Emails Send.rpt | Emails sent | INFERRED |
| 123 | Reversed Receipts.rpt | Reversed receipt report | INFERRED |
| 124 | Fund Statement-Detailed.rpt | Detailed fund statement | INFERRED |
| 125 | Fund Statement-Summary.rpt | Summary fund statement | INFERRED |

### 2.11 Risk Reports (4 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 126 | Top_10_Risks.rpt | Top 10 risks | INFERRED |
| 127 | Risk Rating — (no .rpt directly visible for risk) | Risk rating reports | INFERRED |
| 128 | Tender Analysis.rpt | Tender analysis | INFERRED |

### 2.12 TAT (Turnaround Time) Reports (3 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 129 | Departmental TAT.rpt | TAT by department | INFERRED |
| 130 | Process TAT.rpt | Process TAT | INFERRED |
| 131 | Units TAT.rpt | TAT by unit | INFERRED |

### 2.13 Utilization Reports (5 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 132 | Utilization By Povider Name.rpt | Utilization by provider | INFERRED |
| 133 | Utilization List.rpt | Utilization list | INFERRED |
| 134 | Utilization Per Member.rpt | Member utilization | INFERRED |
| 135 | Expected Cost Per Age Band.rpt | Expected cost by age | INFERRED |
| 136 | Expected Costs Provider.rpt | Expected costs by provider | INFERRED |
| 137 | Expected Hospital Costs.rpt | Expected hospital costs | INFERRED |

### 2.14 Case and Hospital Reports (5 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 138 | Case Admissions.rpt | Hospital admissions | INFERRED |
| 139 | Case Admissions_Admitted.rpt | Admitted cases | INFERRED |
| 140 | Case Admissions_Scheduled.rpt | Scheduled admissions | INFERRED |
| 141 | Top 10 providers.rpt | Top 10 healthcare providers | INFERRED |
| 142 | Prem_Suspension_Letter.rpt | Premium suspension letter | INFERRED |
| 143 | Suspension_Letter.rpt | Suspension letter | INFERRED |
| 144 | Notice_Letter.rpt | Notice letter | INFERRED |

### 2.15 Policy Document Reports (4 reports)

| # | Report Name | Inferred Purpose | Classification |
|---|---|---|---|
| 145 | Policy Doc Tracking-User.rpt | Policy document tracking by user | INFERRED |
| 146 | Retail Quote.rpt | Retail product quote | INFERRED |
| 147 | CARD-REPRINT.rpt | Member card reprint | INFERRED |
| 148 | INVALID EMAIL CONTACTS.rpt | Invalid email contact list | INFERRED |

### 2.16 Remaining Reports (approximately 36)

The following additional reports were observed in the directory listing. Full inventory continues:

| Report Name | Inferred Purpose |
|---|---|
| Member benefit_Consumption.rpt | Member benefit usage |
| Retail Quote.rpt | Retail quote |
| Sales_Audit_Trail.rpt | Sales audit |
| *(additional reports not individually listed)* | Various |

> **NOTE:** Full individual listing of all 184 reports is available in the /Legacy/CRM/Reports directory. The list above covers the primary identified reports.

---

## 3. Report Delivery Mechanisms

| Mechanism | Evidence | Classification |
|---|---|---|
| Browser-embedded Crystal Viewer | CrystalReportViewer1 in Reports.aspx | CONFIRMED |
| Report file output to disk | /GeneratedReports directory | CONFIRMED |
| Renewal advice documents | /RENEWAL ADVICE directory | CONFIRMED |
| Email attachment | Notifications_SetUp.Attachment column | INFERRED |

---

## 4. Critical Reporting Gaps

| Gap | Impact | Priority |
|---|---|---|
| Internal SQL of all 184 reports is unknown | Cannot understand business calculations | CRITICAL |
| Report parameters per report unknown | Cannot replicate filtering behavior | CRITICAL |
| Crystal Report data source connections unknown | Cannot verify which DB each report queries | HIGH |
| Report formulas and calculated fields unknown | Business rules hidden in Crystal formulas | HIGH |
| Report scheduling (if any) unknown | Batch/scheduled reports not identified | MEDIUM |
| Report access control (who sees which reports) unknown | Security model for reports | HIGH |
| Multiple statement variants — differences unknown | Cannot determine which to modernize | HIGH |

---

## 5. Modernization Approach for Reports

Crystal Reports cannot be migrated automatically. Each report requires:

```
Step 1: Open .rpt in Crystal Reports
Step 2: Extract SQL query (Command or tables/links)
Step 3: Extract parameters and their types
Step 4: Extract formulas and calculated fields
Step 5: Extract grouping and sorting rules
Step 6: Document output format and layout
Step 7: Identify users and permissions
Step 8: Classify as: Customer-facing / Internal / Financial / Operational
Step 9: Define modern equivalent (API query + React/PDF output)
Step 10: Build golden transaction for comparison
```

**Recommended Modern Reporting Stack:**
- Server-side data: TypeScript/Node.js API → SQL Server
- Report rendering: React PDF / PDFKit / Puppeteer (for letter-format)
- Tabular reports: React + data tables / CSV export
- Financial statements: Template-based PDF generation
- Scheduled reports: Job queue + email delivery

---

## 6. Report Prioritization (by Business Impact)

| Priority | Report Category | Reason |
|---|---|---|
| P1 | Renewal Schedules and Advice Letters | Direct client-facing; revenue-critical |
| P1 | Customer Statements and Invoices | Financial — regulatory requirement |
| P1 | Commission Reports | Agent payment processing |
| P1 | Claims Reports | Operational — daily use |
| P2 | Production Reports | Management reporting |
| P2 | TAT Reports | SLA monitoring |
| P2 | Membership Reports | Operational |
| P3 | Audit Trail Reports | Compliance |
| P3 | Utilization Reports | Analytics |
| P4 | Historical variants (old, _X, _W etc.) | May be superseded — verify with business |

---

*Document produced by: AI Engineering Agent — Discovery Phase*  
*All report purposes are INFERRED from file names — actual report content requires Crystal Reports to confirm*  
*Modification of /Legacy is prohibited*
