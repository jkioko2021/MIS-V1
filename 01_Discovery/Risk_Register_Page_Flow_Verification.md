# Risk Register page and flow verification

Verification date: 2026-10-12. Source: the user-designated updated legacy ZIP and the current MIS application.

## Requested page coverage

| Legacy page | Requested submenu | Flow | Modern route | Coverage |
|---|---|---:|---|---|
| Risk_Register_New.aspx | Add New Risk | 1 | /risk/new | Developed: create a departmental risk in an open period. |
| Risk_Register_Update.aspx | Update Register | 2 | /risk/update | Developed: update details, factors, controls, root causes and mitigation actions; submit to review. |
| Risk_Register_Review.aspx | Risk Register Review | 3 | /risk/review | Developed: mapped owner corrects submitted assessments, reviews or returns the register. |
| Risk_Register_Summary.aspx | Risk Register Signoff | 4 | /risk/summary | Developed: summaries and management sign-off after owner review. |
| Risk_Register_Close.aspx | Risk Register Close | 5 | /risk/close | Developed: close a signed-off department or a reporting period after every department with registered risks signs off. |
| Risk_Register_Open.aspx | Open Register | 6 | /risk/open | Developed: open a reporting period, optionally carry forward risks and unfinished actions; reopen an existing register for reassessment. |
| Risk_Status.aspx | Risk Register Status | | /risk/status | Developed: read-only departmental workflow, exposure and completion status. |
| Risk_Register_History.aspx | Risk Register view | | /risk/history | Developed: append-only event history and snapshots scoped to authorized departments. |
| Risk_Rating_Client.aspx | Client Rating | | /risk/client-rating | Developed: read-only proposer/policy search, rating/reason filters, pagination and authorized CSV reports of saved AML classifications. |
| Risk_Register_Dashboard.aspx | Risk Dashboard | | /risk | Developed: risk list, assessment totals, overdue actions and departmental review status. |
| Risk_Map_Champions.aspx | Map Risk Champions | | /risk/champions | Developed: map active champions and department owners; management-only changes. |

All eleven requested pages now exist. The separate /risk/closed archive page remains additional, with Closed Archives last. Navigation and internal page labels follow the requested order, including Client Rating between Risk Register view and Risk Dashboard.

## Workflow gates

The department state cycle is OPEN → SUBMITTED → REVIEWED → SIGNED_OFF → CLOSED, followed by management reopening or opening the next period.

1. **Add New Risk:** requires a valid department, open period, department objective, category, title, description and consequence.
2. **Update Register:** mapped champions maintain open registers. Submission requires an active mapped owner, every active risk assessed and at least one root cause/mitigation per risk.
3. **Risk Register Review:** mapped owners can correct submitted risks, review them or return the register. Returned registers require reassessment.
4. **Risk Register Signoff:** management may sign off only after owner review.
5. **Risk Register Close:** management may close only after sign-off. Period closure checks every department with registered risks; closed records are read-only.
6. **Open Register:** reopening preserves scores, mitigation actions and saved notes/history, but resets assessment and approval completion. Opening a next period with carry-forward creates new risk identities and carries unfinished actions. These are distinct operations on the same page.

An initial open period and team mapping are setup prerequisites before step 1; Open Register appears sixth in the recurring business cycle, not as a prohibition on initial setup. Menu order alone does not authorize a transition: the API enforces state and role gates.

## Client Rating data and access

The updated Risk_Rating_Client.aspx code-behind searches the legacy AAR_RISK_DB.dbo.TBL_MIS_CLIENT_RISK_RATING table joined to TBL_MIS_RISK_REASON. It supports policy/proposer searches and rating/reason reporting, including a legacy Crystal Reports output.

The uploaded database procedure SP_MIS_TRACKING_AML_RISKS confirms that this legacy master was populated from explicitly entered AML risk classifications. The new read-only page uses those explicitly saved classifications in crm.business_uploads, joined to the originating business record for proposer and client-type context. It does not create ratings from enterprise risk assessment scores and does not invent rows from schema-only legacy uploads.

Endpoints are /api/client-ratings/options, /api/client-ratings and /api/client-ratings/report. Policy searches match the whole code case-insensitively; proposer searches match a literal case-insensitive substring. Report filters match list filters but export all matching pages, up to 10,000 records. Larger exports require narrower filters rather than silent truncation. CSV output quotes cells and neutralizes spreadsheet formula prefixes.

Client classifications are global customer information, not department risk records. Every endpoint requires a fresh active account/profile and active administrator or Risk Management authorization. Department champion/owner mapping alone does not grant this access. List, options and CSV responses are private/no-store; client query keys include the authenticated username. Exports are cancelled on unmount/auth identity changes.

Soft-inactive uploads remain in the classification history, preserving earlier entered ratings and reasons. Proposer/client-type context comes from the current business record, not a historical snapshot. Historical legacy master rows have not been imported. The current document metadata does not capture the legacy System field; it remains null and is clearly labelled not captured, rather than inferred.

## Verification evidence and limits

The preceding authenticated browser check verified creation/persistence, assessment and mitigation edits, owner review, sign-off, confirmed period closure, read-only archives and reopening with history retained. This verification freshly passed frontend type checking, all eight scoring/permission/stale-edit unit checks, exact sidebar/internal navigation order assertions, and the live PostgreSQL/API integration check covering department isolation, unmapped options, review/sign-off, closure and reopening with retained notes. Synthetic verification records were cleaned up automatically. No production data or schema is changed.

Client Rating additionally passed live API checks covering administrator and Risk Management access, ordinary staff/anonymous/inactive-account denial, filters, pagination, exact policy searches, retained inactive-upload history, CSV filter parity and formula protection. Temporary metadata/accounts are development-only.

The authenticated browser pass confirmed the exact navigation position, proposer search across two pages, rating/reason filters, exact policy search and an actual CSV download containing all matching pages. At 390×844, results use cards without outer horizontal overflow. Logging out of the synthetic administrator account and signing in as a champion showed the access-denied state with no administrator records/counts or export control. A narrow desktop filter-row clipping issue was corrected by using three columns below the wider desktop breakpoint. Frontend type checking passed after that correction; all synthetic classifications and accounts were removed.

This is functional page/workflow coverage, not full historical data parity: approved scoring catalogs are unavailable, legacy email escalation is not delivered, historical client-rating rows require an import, the System field needs source capture, and CSV replaces the legacy Crystal Reports/Excel report runtime.
