---
name: Business requirement compatibility
description: Rules for maintaining configured Business Tracking requirements alongside the legacy document registry.
---

The configurable requirement master is the source for Business Tracking, but the legacy document registry remains necessary because existing checklist and upload records reference its requirement IDs.

**Why:** A matching-looking legacy row is not enough to prove ownership: document names can repeat. Treat the legacy row as the master’s bridge only when its stable ID and legacy code both map to the master ID. New IDs must be allocated above both registries and both sequences kept aligned, otherwise a newly configured requirement can overwrite or block an unrelated legacy document.

**How to apply:** Preserve the transactional bridge whenever requirement settings are changed. Before altering the bridge, verify the legacy mapping by ID and code, keep compatibility records synchronized, and avoid independent identifier allocation in either registry.