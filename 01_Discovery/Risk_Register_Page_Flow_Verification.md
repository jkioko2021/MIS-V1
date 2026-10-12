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
| Risk_Rating_Client.aspx | Client Rating | | Not implemented | Missing standalone client-rating search/report page. |
| Risk_Register_Dashboard.aspx | Risk Dashboard | | /risk | Developed: risk list, assessment totals, overdue actions and departmental review status. |
| Risk_Map_Champions.aspx | Map Risk Champions | | /risk/champions | Developed: map active champions and department owners; management-only changes. |

Ten of the eleven requested pages exist. The separate /risk/closed archive page is additional, not a substitute for Client Rating. Navigation and internal page labels now follow the requested order for implemented pages; Closed Archives remains last. No nonfunctional Client Rating menu item was added.

## Workflow gates

The department state cycle is OPEN → SUBMITTED → REVIEWED → SIGNED_OFF → CLOSED, followed by management reopening or opening the next period.

1. **Add New Risk:** requires a valid department, open period, department objective, category, title, description and consequence.
2. **Update Register:** mapped champions maintain open registers. Submission requires an active mapped owner, every active risk assessed and at least one root cause/mitigation per risk.
3. **Risk Register Review:** mapped owners can correct submitted risks, review them or return the register. Returned registers require reassessment.
4. **Risk Register Signoff:** management may sign off only after owner review.
5. **Risk Register Close:** management may close only after sign-off. Period closure checks every department with registered risks; closed records are read-only.
6. **Open Register:** reopening preserves scores, mitigation actions and saved notes/history, but resets assessment and approval completion. Opening a next period with carry-forward creates new risk identities and carries unfinished actions. These are distinct operations on the same page.

An initial open period and team mapping are setup prerequisites before step 1; Open Register appears sixth in the recurring business cycle, not as a prohibition on initial setup. Menu order alone does not authorize a transition: the API enforces state and role gates.

## Client Rating gap

The updated Risk_Rating_Client.aspx code-behind searches the legacy AAR_RISK_DB.dbo.TBL_MIS_CLIENT_RISK_RATING table joined to TBL_MIS_RISK_REASON. It supports policy/proposer searches and rating/reason reporting, including a legacy Crystal Reports output.

There is no corresponding standalone React page, client-rating API or confirmed modern authoritative client-rating dataset. AML upload rating/reason fields in Allocated Files are separate document metadata; they do not establish parity with this legacy client-rating master.

## Verification evidence and limits

The preceding authenticated browser check verified creation/persistence, assessment and mitigation edits, owner review, sign-off, confirmed period closure, read-only archives and reopening with history retained. This verification freshly passed frontend type checking, all eight scoring/permission/stale-edit unit checks, exact sidebar/internal navigation order assertions, and the live PostgreSQL/API integration check covering department isolation, unmapped options, review/sign-off, closure and reopening with retained notes. Synthetic verification records were cleaned up automatically. No production data or schema is changed.

This is functional page/workflow coverage, not full legacy parity: approved scoring catalogs are unavailable, legacy email escalation is not delivered, and Crystal Reports execution is not included.
