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
