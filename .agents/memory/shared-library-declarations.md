---
name: Shared library declarations after merges
description: Generated API source and compiled declaration output can become inconsistent after task merges.
---

When an artifact typecheck reports missing API exports that exist in the generated source, rebuild shared-library declarations before changing code or regenerating the API.

**Why:** Task merges have left compiled declarations older than the generated API source, producing false missing-export errors in otherwise valid frontend code.

**How to apply:** Verify the named export exists in the current source, run the workspace's shared-library typecheck/build, then check the affected artifact again. Do not change API contracts solely to resolve stale declaration errors.
