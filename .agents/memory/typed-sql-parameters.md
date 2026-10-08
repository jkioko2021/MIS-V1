---
name: Repeated SQL parameter types
description: Explicit consistent parameter casts and real PostgreSQL checks for character assignments combined with CASE/comparison logic.
---

Give repeated SQL parameters a consistent explicit type when they appear in both character-column assignments and text comparisons or CASE expressions. Use that same cast at every occurrence rather than mixing inferred assignment types with text casts.

**Why:** Live PostgreSQL rejected review and business-edit statements with “inconsistent types deduced” (text versus character/character varying), even though TypeScript and mocked route tests passed. Those tests do not parse or bind SQL.

**How to apply:** For workflow-state updates, verify at least one valid request against development PostgreSQL after changing SQL parameter use. Passing validation-error paths or mocked transaction tests alone does not demonstrate that the actual update statement executes.

Build legacy-workflow smoke fixtures from the current PostgreSQL schema and
modern test helpers, not from WebForms column labels.

**Why:** Legacy names and required fields differ from the modern schema.
Fixture setup errors can prevent the real authorization and transaction paths
from being exercised, despite passing TypeScript checks.

**How to apply:** Inspect current required columns/defaults and constraints
before adapting fixtures. Exercise a valid role-specific request through its
audit and notification side writes, not only its validation-error paths.

Normalize SQL result scalars to the declared API contract; do not infer a
master identifier's type from a field label such as “code.”

**Why:** A numeric requirement identifier passed through a text-typed DTO and
crashed a document filter despite successful TypeScript and database checks.
Static query generics are assertions, not runtime response validation.

**How to apply:** Preserve the underlying master schema, normalize output at
the API boundary, assert scalar types with real database responses and make
display-only filters tolerant of previously cached legacy scalars.

For synthetic workflow fixtures, inspect current key lengths and status CHECK
constraints before choosing identifiers or stage labels.

**Why:** Menu captions and queue names are not necessarily valid persisted
business statuses, and legacy key lengths can be shorter than modern labels.

**How to apply:** Use real allowed stage values and bounded fixture identifiers;
do not weaken database constraints just to make a test fixture fit.
