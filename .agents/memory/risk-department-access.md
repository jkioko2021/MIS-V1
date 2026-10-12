---
name: Department risk access
description: User-defined champion update and multi-department owner review permissions.
---

Update Register is accessible to the specific champions assigned to each department. Risk Register Review is accessible to the risk owners assigned to the department. A risk owner can have more than one department.

**Why:** The user explicitly defined these access rules.

**How to apply:** Keep champion and owner scopes separate in links, department filters and server authorization. Do not infer responsibility from a staff member's home department or restrict an owner to one department. Explicit department assignments supersede conflicting old champion mappings. Preserve existing administrator/Risk Management oversight unless the user changes it.

Risk administration is restricted to Risk Management and administrators, not automatically to department champions or owners. It covers officer/owner mapping and adding/modifying departments.

**Why:** The user explicitly chose this access scope.

**How to apply:** Use management authorization for both the administration menu and its API operations. Mapping staff means choosing active MIS accounts; it does not itself grant those staff global administration rights.

Older departments outside the supplied department list are archived, not deleted or remapped. The two supplied inactive departments remain part of the current administration list.

**Why:** The user explicitly chose archiving when informed that older departments had linked risks and objectives.

**How to apply:** Exclude archives from current department administration and active selection lists, while retaining historical joins, staff mappings and linked records. Keep inactive and archived distinct. Do not move or delete linked data as an implied part of catalogue cleanup.

Current department lists must show each supplied department once, in department-code order, with its supplied status.

**Why:** The user repeated that duplicate departments should be removed and the list maintained as supplied.

**How to apply:** Keep current names unique irrespective of case or outer whitespace; historical archived aliases are exempt. A dashboard department card must not treat different reporting periods as different departments. Show its latest period explicitly when all periods are selected, while leaving period-specific status and history rows intact.

Risk administration must provide add/modify pages for RISK_CATEGORY, RISK_CONTROL_EFFICIENCY, RISK_EXPOSURE, RISK_IMPACT, RISK_LIKELYHOOD, RISK_OBJECTIVES, RISK_REASON and ACTION_STATUS.

**Why:** The user explicitly requested all eight lists under Risk administration.

**How to apply:** Check coverage of each named list rather than treating a generic reference-list page as complete. Retain the existing Risk Management/administrator access boundary and historical reference compatibility.

Do not show a Closed Archives navigation list; keep closed-register records accessible through their existing history.

**Why:** The user asked to remove the archived list, not to delete closed risks or their notes.

**How to apply:** Remove the archive menu and tab without deleting records or removing the register-close workflow.

Submission-readiness performance and risk-list pagination are separate scopes.

**Why:** The user explicitly requested readiness across the whole database result without including the separately proposed pagination work.

**How to apply:** Do not expand a readiness-performance request into risk-list pagination unless the user explicitly includes it.
