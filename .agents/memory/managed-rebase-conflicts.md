---
name: Managed rebase conflicts
description: Safely resolving structural conflicts created by the managed rebase flow.
---

# Managed rebase conflicts

When a managed rebase presents an interstitial or structural conflict, do not assume that removing visible conflict markers is enough. Compare the complete resolved file against both Git stages before continuing the rebase.

**Why:** Structural auto-merges can interleave unrelated route bodies around a small conflict region, leaving displaced code without additional conflict markers.

**How to apply:** Use `git show :2:<path>` and `git show :3:<path>` to identify the valid source versions, then compare the full resolved file with the chosen merge result. Restore every displaced section before `continueMergeResolution`.