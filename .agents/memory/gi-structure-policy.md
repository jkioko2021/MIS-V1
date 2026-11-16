---
name: GI organisation policy
description: GI hierarchy boundaries, Medical cross-mappings and legacy manager import semantics.
---

GI keeps **Branch → Unit**, not Medical's four levels. Many Medical Units may
map to one GI Unit; each Medical Unit has at most one current GI target.

**Why:** The user explicitly chose “Keep GI Branch and Unit” and requested the
Medical-style setup workflow and many-to-one Medical Unit mapping.

**How to apply:** Keep the two hierarchies independent. A pending cross-link is
setup metadata, not activation, an agent transfer, or a Medical reparenting.

In the uploaded agent list, `GI_CODE` identifies a GI **Unit**, not the GI
manager's identifier. Link it through the Unit's current assigned eligible
manager; the registration GI Manager field uses that manager's original
`GI_UM_ID` (or existing account-code fallback).

**Why:** The user requested populating GI Manager from uploaded agent codes.
Treating GI Unit codes as manager identifiers left valid imported assignments
unavailable in the name dropdown.

**How to apply:** Preserve the exact uploaded GI code in source provenance.
Do not confuse it with a manager ID, infer a manager from the agent's Medical
Unit, or replace unrelated Medical-to-GI mappings. Missing, ambiguous or
ineligible matches remain unresolved.

GI-only imported manager designations and account choices must not appear in
Medical Structure. Genuine Medical/GI dual-role managers remain in both.

**Why:** The user explicitly requested restricting GI data from Medical Structure.

**How to apply:** Use enrollment/source-domain provenance and explicit Medical
team assignments, not names or identifier prefixes. Filter the Medical hierarchy,
enrollment and manager-mapping selectors without deleting accounts or history.

GI manager enrollment captures the supplied legacy GI, employment and retainer
fields. Original GI manager and MIS employee identifiers are independent of the
verified current MIS account link.

**Why:** The user requested the original GI enrollment fields and uploaded data.
Replacing these identifiers with the current account code would lose source
information. Repeated GI identifiers in the upload can represent the same
manager covering multiple GI Units, with differing retainer end dates.

**How to apply:** Group only compatible identifiers with verified account
provenance; preserve all source rows and Unit assignments. Leave conflicting
single-value fields blank with review notes rather than choosing a Unit/date.
Keep unverified identities for review and imported designations inactive until
explicit approval. Retainer fields are metadata, not payment instructions.

GI enrollment must not show a Primary GI Unit selector or Active checkbox.
New enrollments remain inactive drafts; edits preserve the existing status and
source Unit metadata. Team assignments belong in Hierarchy Setup.

**Why:** The user asked to remove both controls from GI manager enrollment.

**How to apply:** Do not infer activation from saving or erase historical Unit
values when a field is removed from the form.

Display a manager's mobile number from the linked user enrollment record in both
GI and Medical manager enrollment. Keep historical source contacts separate.

**Why:** The user requested mobile capture on user enrollment and display on both GI and Medical manager enrollment.

**How to apply:** Keep the manager mobile display read-only and let account contact
edits flow through to existing designations.

GI Branch and Unit editing preserves status. Activation/deactivation is a separate,
explicit action with a reason and existing availability/dependency checks.

**Why:** The user requested removing Status from editing and adding Activate/Deactivate options.

**How to apply:** Create new entries as Pending setup; do not activate as a side effect of editing.

GI setup must refresh periodically while open, as well as on mount and focus.

**Why:** User-requested bulk activation changed the database outside the page's
mutation cache; a finite stale time alone did not refresh the already-open list.

**How to apply:** Retain a freshness path for external updates, not just local
mutation invalidation. Do not overwrite open edit drafts when refreshing lists.
