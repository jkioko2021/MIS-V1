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
