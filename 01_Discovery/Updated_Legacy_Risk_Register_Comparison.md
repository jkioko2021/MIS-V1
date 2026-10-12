# Updated legacy Enterprise Risk Register comparison

## Sources and scope

The authoritative application source is the user-designated updated ZIP identified in `Legacy/README.md`. The database reference is `databases/AAR_RISK_DB.sql`. Selected pages and their VB code-behind were inspected without executing SQL Server scripts or importing their data.

This is the departmental **Enterprise Risk Register**. `Risk_Rating_Client` and AML client-risk assessment are separate workflows and are unchanged.

## Page correspondence

| Updated legacy page | Modern page | Purpose |
|---|---|---|
| `Risk_Register_Dashboard.aspx` | Risk Register / Dashboard | Department exposures, review progress and overdue actions |
| `Risk_Register_New.aspx` | New Risk | Register a departmental objective, category, title, description and consequence for a reporting period |
| `Risk_Register_Update.aspx` | Update & Assessment | Assess risks; maintain root causes, controls, mitigation actions, owners and due dates; submit a departmental register |
| `Risk_Register_Review.aspx` | Owner Review | Review submitted registers, correct assessments/mitigations, or return them for reassessment |
| `Risk_Register_Summary.aspx` | Summary & Sign-off | Process departmental rankings and obtain management sign-off |
| `Risk_Register_Open.aspx` | Open & Reopen | Open reporting periods; optionally carry forward prior risks; reopen closed registers |
| `Risk_Register_Close.aspx` | Close Registers | Close signed-off departments or an entire signed-off reporting period |
| `Risk_Register_Closed.aspx` | Closed Records | Show completed mitigation actions alongside archived-period records |
| `Risk_Register_History.aspx` | History | Read retained assessment notes, decisions and snapshots |
| `Risk_Map_Champions.aspx` | Team Mapping | Map active MIS accounts as department champion and owner |
| `Risk_Status.aspx` | Status | Read-only departmental submission, review, sign-off and closure status |

## Confirmed legacy behavior

- New risks are associated with departmental objectives and reporting periods.
- Update records hold impact, likelihood, current/desired controls and root-cause mitigation plans.
- The update page rejects submission when risks remain unassessed (`"You Must update all Risks!"`).
- Owner review can update risk details or return a submitted register for further work.
- `Risk_Register_Close.aspx.vb` checks departmental sign-off before closing a reporting period.
- `Risk_Register_Closed.aspx.vb` filters mitigation `ACTION_STATUS='Closed'`: a completed mitigation is not necessarily a closed departmental register.
- `SP_COMPUTE_RATES` and `SP_COMPUTE_RATES_Depart` calculate:
  - **Inherent exposure = impact factor × likelihood factor**
  - **Residual exposure = inherent exposure × (1 − control-effectiveness fraction)**

## Modern implementation decisions

### Access and accountability

Champions can maintain their mapped departments while registers are open. Mapped owners can correct submitted assessments and review or return their departments. Risk managers and active SuperAdmin/System Admin accounts can manage mappings, periods, processing, sign-off, closure and reopening. Unmapped staff do not receive departmental risk data.

Department filtering is enforced by the API for lists, details, summaries and history, not just by menu visibility. Older unscoped risk endpoints are restricted to management.

### State changes

`OPEN → SUBMITTED → REVIEWED → SIGNED_OFF → CLOSED`

Submission requires an active mapped owner, an updated assessment for every active risk, and a root-cause/mitigation record for each risk. Returning or reopening preserves data and history but resets approval and assessment-completion flags, requiring reassessment.

Closing an entire period verifies every **department with registered risks** is signed off. Empty departments do not force staff to create artificial risks merely to close the period.

Assessment edits and register decisions use a consistent transaction/lock order. Saves check a microsecond-preserving timestamp so stale edits are rejected.

### Scoring and reference data

The uploaded SQL script defines impact, likelihood and effectiveness catalog tables but does not supply their populated values. Existing PostgreSQL sample effectiveness codes must not be assumed to be fractional effectiveness.

Consequently, the new assessment form uses explicit numeric impact/likelihood factors and a control-effectiveness percentage, converted to a fraction for the confirmed legacy formula. It does not invent authoritative rating labels or bands. A calibrated rating catalog can be introduced when approved reference values are supplied.

Fractional effectiveness storage was widened to preserve percentages such as 33.33% through subsequent processing.

### History and carry-forward

Notes and snapshots are append-only through the application. Revisions retain before/after values. Period carry-forward creates new risk identities, carries forward unfinished mitigation actions, and requires fresh assessments; it does not overwrite the preceding period.

### Deliberate boundaries

The SQL Server archive remains a reference rather than an executable PostgreSQL migration. Existing records are preserved. Legacy Crystal Reports execution is not introduced; dashboard, summary, status and history pages provide the modern review surfaces. Risk email escalation is not represented as delivered email by these pages.

## Verification

Development verification includes unit coverage for scoring, department permissions, review-stage editing, calendar validation, state precedence and stale saves. A live PostgreSQL/API check covers isolated synthetic departments, owner corrections, reassessment, processing, sign-off, closure guards and retained notes. Authenticated browser verification covers the visible lifecycle and role-specific controls.
