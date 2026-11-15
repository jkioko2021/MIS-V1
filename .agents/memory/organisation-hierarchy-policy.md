---
name: Organisation hierarchy boundaries
description: Canonical hierarchy, legacy-reference compatibility and historical agent assignment policy.
---

The full organisation workflow is National → Region → Branch → Unit → Agent.
Agent registration selects one Unit; its ancestors are derived, not independently
editable selections. Each operational level requires an eligible manager
designation of the corresponding category. New hierarchy setup does not activate,
approve or change the profile of an existing login account.

**Why:** The user supplied the Organisation Structure Hierarchy & Agent Mapping
implementation requirements, while previously authorising imported Sales accounts
to remain inactive pending individual account setup.

**How to apply:** Reuse the existing hierarchy and agent identities. A source
reference may be adopted into the canonical hierarchy only through an explicit,
validated mapping. Do not infer missing Nationals, overwrite imported values or
silently promote unverified manager identities. Older reference-only manager
mapping remains compatible until that organisation is adopted; thereafter the
canonical hierarchy controls its current manager.

Agent transfers preserve immutable hierarchy snapshots and original source
organisation codes. Current reporting derives ancestry from the assigned Unit;
historical reporting uses the effective assignment snapshot. A node containing
assigned agents cannot be reparented or deactivated until they are explicitly
transferred.

**Why:** Reparenting a live Unit would otherwise silently transfer its agents and
rewrite historical reporting without an approved agent-transfer decision.

**How to apply:** Keep initial mapping and transfers explicit and audited. Do not
backfill fictitious pre-mapping history. Historical hierarchy does not imply
historical agent status or commission amounts. Apply organisational scope on
every reporting endpoint; SQL reporting views alone do not enforce actor access.
Keep scoped frontend query keys tied to the signed-in account.

The organisation menu is named **Organization structure-Medical** and reuses the
previously loaded Medical regions, branches and units. GI setup remains separate.

**Why:** The user asked to update the new organisation structure from the earlier
Medical Structure pages and rename it specifically for Medical.

**How to apply:** Present existing imported Medical records even before they have
eligible hierarchy parents/managers, but distinguish pending references from
operational nodes. Do not interpret visibility in the Medical source list as
authorisation to activate accounts or make a Unit available to agents.
