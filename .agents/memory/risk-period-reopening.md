---
name: Shared reporting-period reopening
description: User-approved scopes for shared-period reopening and Signed-OFF batch closure.
---
Reopening a department in a closed reporting period opens the shared period but resets only the selected department. Other departments retain workflow, assessments, closed actions and history.

**Why:** The user explicitly chose selected-department-only reopening rather than requiring reassessment of every department.

**How to apply:** Show the shared status change and unchanged departments before confirmation. Preserve prior closure attribution in departments that remained closed.

Close Period closes all Signed-OFF departmental registers in the selected period, not just a selected department. Unsigned registers stay unchanged. Closed registers are listed on Open Register without automatically reopening them. The Close page lists Signed-OFF departments only, without a risk-level summary, Revert Back or Department workflow.

**Why:** The user explicitly requested Signed-OFF-only batch closure and moving the resulting Closed registers to Open Register. Closing the shared period while unsigned registers remain would prevent those departments from completing their workflow.

**How to apply:** Allow eligible Signed-OFF registers to close without waiting for unsigned departments. Keep the shared period open while any registered active department remains unsigned; mark it Closed once all are closed. Preserve saved assessments, rankings, root causes, action statuses, notes and prior closure attribution. Period-level closure ignores the department filter, so show the complete period's eligible department list and make this scope clear before confirmation.
