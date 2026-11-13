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

When reproducing the legacy registration form, retain the modern independent
licence review boundary. A waiver is a documented request for compliance
exceptions, not automatic verification or permission to skip evidence.

**Why:** The legacy upload/completion handlers combine compliance capture with
approval. Replicating their fields should not silently remove the existing
separation between the person entering a licence and the person approving it.

**How to apply:** Show waiver reasons explicitly to reviewers, require their
acceptance, and retain current licence dates and confirmed supporting documents
as completion requirements.

Agent Registration's Agent Details stage must show all fields in a single,
full-width pane, including before an imported identity is selected.

**Why:** The user repeatedly reported incomplete fields after the workflow was
converted to tabs. Checks using only a selected synthetic identity missed the
initial state the user was actually viewing.

**How to apply:** Keep the unselected form inspectable but disabled. Include that
state when checking field visibility, rather than validating only populated
records or relying on the outer page width.
