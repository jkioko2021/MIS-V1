---
name: Saved risk ranking stability
description: Historical matrix ranks must survive reference maintenance and ordinary assessment saves.
---
Saved matrix rankings belong to the assessment, not the live catalogue. Freeze confirmed reference identities, display labels and 1–5 ordinals; preserve them on ordinary saves. Refresh an axis only when a factor is explicitly selected or its numeric assessment changes, or refresh both on explicit reassessment. Unknown or ambiguous historical values stay unranked.

**Why:** Reference retirement, renaming and numeric reweighting previously changed or removed a saved ranking during summary reload. Raw historical numbers do not establish a calibrated identity.

**How to apply:** Any future configurable ranking weights must be read when capturing a new snapshot, never used to recompute an existing saved snapshot. Keep matrix ordinals separate from calibrated exposure arithmetic and preserve before/after evidence in assessment history.
