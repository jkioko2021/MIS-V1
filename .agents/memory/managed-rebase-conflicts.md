---
name: Managed rebase conflicts
description: Safely resolving structural conflicts created by the managed rebase flow.
---

# Managed rebase conflicts

When a managed rebase presents an interstitial or structural conflict, do not assume that removing visible conflict markers is enough. Compare the complete resolved file against both Git stages before continuing the rebase.

**Why:** Structural auto-merges can interleave unrelated route bodies around a small conflict region, leaving displaced code without additional conflict markers.

**How to apply:** Use `git show :2:<path>` and `git show :3:<path>` to identify the valid source versions, then compare the full resolved file with the chosen merge result. Restore every displaced section before `continueMergeResolution`. Also inspect changed files absent from the conflict list: an automatic structural merge can displace route bodies without marking that file conflicted. After continuing, type-check the merged state and compare affected routes with both main and the pre-rebase version.

Successful bundling is not evidence that merged Express routes still work. Verify route methods, paths, request schemas and response shapes against their contracts after structural merges.

**Why:** A merge can retain valid syntax while attaching unrelated bodies to routes, dropping registrations or referencing undeclared variables. A transpiling server build does not reject those mistakes.

**How to apply:** Run the API type check and focused endpoint checks for affected routes, including neighboring handlers, before completing a merge-dependent change.