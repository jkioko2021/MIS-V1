---
name: Allocation record access
description: Read-side authorization rule for the allocated membership-file workspace and its documents.
---

# Allocation record access

The Allocation Files workspace must use allocation-specific detail, history, upload-list, and document-download endpoints. Regular users may access only active records assigned to their username; SuperAdmin has the oversight exception.

**Why:** Queue visibility alone does not protect file numbers, document paths, or direct API URLs. Registration identity and payment data require the same ownership boundary for reads as for allocation handoff actions.

**How to apply:** Do not point Allocation Files at broad business-file or generic private-object endpoints. Preserve record-scoped authorization whenever adding a detail tab, audit view, attachment, export, or document action to this workspace. Broader business workflows need their own queue-aware read checks rather than inheriting Allocation Files permissions.