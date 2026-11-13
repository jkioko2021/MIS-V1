# Intermediary Management — legacy comparison

The user requested the menu spelling **Intemediary Management**. Its eight pages
are restricted to the active **National Sales Admin** profile and existing
SuperAdmin/System Admin profiles. Existing NSM users are not silently promoted.
Assign the new profile through User Management.

| Uploaded sales page | Modern submenu | Behaviour |
|---|---|---|
| P_Agent_Registration.aspx | Agent Registration | Import core-registered agents, select a pending identity, capture complementary MIS/contract/licence details and complete registration |
| P_Agent_View.aspx | Agent Listing | Search by name, code, payroll, status/type; inspect master, licences, documents and notes |
| P_Agent_details_View.aspx | Agent Details | Read-only master details, directors, licence and event history |
| P_Agent_Details_Change.aspx | Agent Details Change | Edit master details and directors with optimistic concurrency; append change notes |
| P_Agent_Licence_Update.aspx | Licence Update | Save draft licence, compliance dates/flags, upload supporting documents, submit for verification |
| P_Agent_Licence_Verify.aspx | Licence Verification | Verify or decline submitted licences; prevent self-verification; retain reviewer/reason |
| P_Agent_Suspension.aspx | Agent Suspension | Suspend, terminate or reactivate with required reason and retained history |
| P_Agent_Mapping.aspx | Agent Mapping | Map one agent to another, reject self/circular mapping, retain audit |

## Deliberate boundaries

* Agents are registered in the **core system**, not created in MIS. The Import
  button pulls them into a pending setup queue. Repeated imports skip existing
  agent codes and never overwrite MIS details or historical agent assignments.
  Pending core identity fields cannot be changed during registration.
* The legacy button calls `DB_MASTER_AGENTS.dbo.MIS_SALES_AGEN_EXTRACT` with
  `ENTRY_BY`, then shows active uncoded master records. The uploaded master SQL
  contains the table schema but **not** that extraction procedure's definition.
  The ready SQL adapter uses that exact procedure and existing SQL Server
  connection only after explicitly selecting `MIS_AGENT_CORE_SOURCE=legacy-sqlserver`.
  Until the source is confirmed and connected, Import explains the configuration
  blocker and never claims success. No external procedure is executed during tests.
* Existing pre-module intermediary records are treated as completed legacy
  records, without assigning invented import provenance. New imports are DRAFT
  and PENDING until MIS organization/contact/contract details, supporting documents
  and a current verified licence are complete. The explicit completion action
  moves them to COMPLETED/ACTIVE; it does not write registration data back to core.

* P_Agent_Update.aspx is a **commission exception/receipt reassignment** screen.
  Its code checks COMMISSION.TBL_COMMISSION_CALC, changes
  TBL_MIS_SALES_COMMISSIONS and calls MIS_SALES_COMM_RUN. It is not an agent-master
  editor. No commission amounts, receipt assignments or external commission runs
  are changed by this module; integrating that database is separate work.
* The uploaded pages query DB_MASTER_AGENTS catalogs for organization/agent types,
  licensing documents, suspension reasons and managers. Those masters were not
  supplied as complete calibrated catalogs. Organization codes remain editable
  text, with existing master values available as suggestions, rather than
  fabricated managers/regions. Status/type choices retain existing values.
* No legacy encryption, direct SQL concatenation, document BLOB storage or
  unverified email-sending behaviour is copied. Files use existing private App
  Storage with agent-module authorization and upload ownership checks.
* Notes and events cannot be deleted. Mapping does not rewrite historical
  business agent codes or merge agent identities. Existing date/status mismatches
  are preserved unless a deliberate status action is taken.
* Licence verification is a separate action on submitted data, not automatic
  approval on upload. Verification requires compliant IRA/KYC and signed contract.
  A second authorized user must verify; no legacy waiver is inferred.

## Setup

Apply `lib/db/migrations/0052_intermediary_management.sql` and
`lib/db/migrations/0053_intermediary_core_import.sql` to a development/local PostgreSQL
database before using the module. It adds columns/tables and the National Sales
Admin profile/menu grants without deleting or recoding existing agents.
The local development initializer also applies this additive migration.
The root application is the active source; MIS/ remains the prior Git snapshot.
