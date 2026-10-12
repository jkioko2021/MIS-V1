---
name: OpenAPI generator compatibility
description: Explicitly match the generated Zod syntax to the target library's installed major version.
---

Configure the OpenAPI generator's Zod target version explicitly to match the schema library's installed major version rather than relying on auto-detection.

**Why:** Orval auto-detection emitted Zod 4 integer constructors into this workspace's Zod 3 schema package; generation succeeded but shared-library compilation failed. This is a generator-target mismatch, not a reason to upgrade the application's validation library.

**How to apply:** When changing the schema library or generator, check their versions together and compile the generated libraries. Do not manually patch generated code.
