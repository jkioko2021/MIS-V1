---
name: Sales intermediary compatibility
description: Why new agent selections must not bulk-remap historical business agent assignments.
---

Use the new intermediary master for registration selections, but keep historical
commission agent assignments readable without automatically changing their codes.

**Why:** Loading a new agent catalog does not establish that its agent codes match
historical commission identifiers. The user requested agent names on registration,
not reassignment of existing business or deletion of the former catalog.

**How to apply:** Prefer the new master when resolving saved agent names and keep
the former catalog as a historical display fallback. Preserve an existing selected
agent when editing a file, even when no longer selectable for new registrations.
Any future consolidation must use a verified mapping rather than name matching.

Agent registration happens in the core system. The Agent Registration page's
Import button pulls those agents into MIS, where relevant complementary details
are captured as on the legacy P_Agent_Registration page. Do not offer independent
manual creation of agent identities in MIS.

**Why:** The user explicitly clarified that core registration is the source of
agent identities; MIS is the subsequent import and details-capture workflow.

**How to apply:** Keep import and MIS details capture separate, preserve core
identity/provenance, make repeated imports safe, and report a disconnected or
unconfirmed core source explicitly instead of creating placeholder agents.
