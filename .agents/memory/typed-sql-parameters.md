---
name: Repeated SQL parameter types
description: Explicit consistent parameter casts and real PostgreSQL checks for character assignments combined with CASE/comparison logic.
---

Give repeated SQL parameters a consistent explicit type when they appear in both character-column assignments and text comparisons or CASE expressions. Use that same cast at every occurrence rather than mixing inferred assignment types with text casts.

**Why:** Live PostgreSQL rejected review and business-edit statements with “inconsistent types deduced” (text versus character/character varying), even though TypeScript and mocked route tests passed. Those tests do not parse or bind SQL.

**How to apply:** For workflow-state updates, verify at least one valid request against development PostgreSQL after changing SQL parameter use. Passing validation-error paths or mocked transaction tests alone does not demonstrate that the actual update statement executes.
