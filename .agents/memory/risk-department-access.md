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
