---
name: Risk analytics scope
description: Why overall and departmental dashboard rankings use different department-filter boundaries.
---

Overall Top 10 compares all departments the current user is authorized to view. The dashboard department selector narrows departmental metrics and the priority list, not the overall comparison. Reporting period and risk population apply to both.

**Why:** The user requested both overall and per-department rankings; an overall list limited to the currently selected department would duplicate the department list rather than provide the overall comparison.

**How to apply:** Enforce authorization before computing either ranking. Build departmental rankings from each department's complete matching dataset, not from the overall priority shortlist, which can contain no entries for lower-scoring departments. Keep historical/unscored risks disclosed separately rather than fabricating ranks or padding short lists.
