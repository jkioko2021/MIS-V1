---
name: BPO review workflow
description: Rules for routing completed registrations into the BPO Review queue.
---

# BPO Review Workflow

Forwarding a completed registration creates or reopens one BPO Review work item for the original business file; it never copies the file, its documents, notes, or history. Open BPO work is visible and mutable only to BPO reviewers and explicit system administrators.

**Why:** The BPO queue must show the same authoritative record and must not diverge from the Register workflow. A unique file-and-queue work item plus one transaction prevents a forwarded file from being lost or duplicated.

**How to apply:** Keep the file number as the link between queue work and business data. Any future completion, return, or reassignment flow should update the work item state rather than duplicate business data. Enforce business profile authorization from the current employee record on each workflow request; non-BPO default lists must exclude open BPO files, and file-level reads/writes must make the same check. The seeded menu-access data is incomplete for operational profiles.

## Returned-incomplete loop

When a BPO reviewer returns a file as incomplete, close the BPO work item, clear its forwarding/allocation state, and return the original file to the Register workflow. The same file number must remain eligible for correction and a fresh BPO handoff; never create a replacement record for the return cycle.

**Why:** A return is a request to correct the existing registration, not a terminal BPO decision. Leaving the file outside Register or refusing a subsequent forward strands it without an actionable queue.

**How to apply:** Treat `RETURNED-INCOMPLETE` as a Register-queue state when it is unforwarded, and allow the standard forward operation to transition it back into an open BPO work item.