---
name: Sales catalog presentation
description: User-requested name-based presentation for sales records and selections.
---

Sales catalog lists, record details and Add Record relationship dropdowns should
show specific unit, branch, region and manager names rather than internal codes.
Keep identifiers as the underlying values for saving and relationship matching.

**Why:** The user requested names instead of codes on the catalog dashboard,
then explicitly extended that request to Add Record dropdowns.

**How to apply:** Apply name-based labels consistently when adding catalog UI.
Do not rewrite stored identifiers as names or treat unlinked imported managers
as verified manager choices.

Imported organizational records may be selected by name while remaining
read-only references. This covers Sales Units, Sales Branches, Sales Regions,
GI Units and GI Branches, not imported manager identities or invented Nationals.

**Why:** After being told that the dropdowns excluded read-only imports, the
user explicitly chose "Allow imported organizational choices."

**How to apply:** Keep original codes in submitted selections and enforce
active status and consistent hierarchy relationships. Do not create accounts,
change profiles, auto-assign source managers or modify the original source rows.
