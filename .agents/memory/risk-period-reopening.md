---
name: Department reporting cycles
description: Immutable previous-period registers, department-specific new cycles, and Signed-OFF batch closure.
---
Opening a department through Open Register starts a new reporting-period cycle; it must not reset its closed source register in place. The user chooses a later reporting period in a popup. Preserve previous-period risks, statuses, assessments, root causes, action plans and closure attribution as read-only history.

**Why:** The user explicitly requested historical previous-period records and department-specific opening into the next reporting period. This supersedes the earlier in-place reopening UI policy.

**How to apply:** Carry ongoing active risks into the selected later period for fresh assessment, retaining every action plan on those risks, including completed actions. Closed risks remain in history. Other departments stay unchanged. Never permit a rolled-forward historical source to be reopened in place or copied twice.

Close Period closes all Signed-OFF departmental registers in the selected period, not just a selected department. Unsigned registers stay unchanged. Closed registers are listed on Open Register without automatically reopening them. The Close page lists Signed-OFF departments only, without a risk-level summary, Revert Back or Department workflow.

**Why:** The user explicitly requested Signed-OFF-only batch closure and moving the resulting Closed registers to Open Register. Closing the shared period while unsigned registers remain would prevent those departments from completing their workflow.

**How to apply:** Allow eligible Signed-OFF registers to close without waiting for unsigned departments. Keep the shared period open while any registered active department remains unsigned; mark it Closed once all are closed. Preserve saved assessments, rankings, root causes, action statuses, notes and prior closure attribution. Period-level closure ignores the department filter, so show the complete period's eligible department list and make this scope clear before confirmation.

Update Register, Review, Signoff, Close and Risk Register Status display only the current open reporting period. Open Register displays the next target reporting period while retaining closed source registers for department selection.

**Why:** The user explicitly requested current-open-period display across these workflow pages, including Status, and next-period display on Open Register.

**How to apply:** Do not offer historical/all-period choices on these workflow pages or silently fall back to all records when no period is open. Previous periods remain accessible through Register View. Keep source-period filtering separate from destination-period display when opening a department.
