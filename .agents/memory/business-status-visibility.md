---
name: Business status visibility
description: Monitoring scope must remain separate from private operational-file permissions.
---

Business Status is read-only monitoring, not another route to edit a file or
bypass an allocated-file owner check. Original trackers and recorded handoff
participants may monitor progress after forwarding, while private notes,
financial information and documents remain restricted in operational stages.

**Why:** The user requested status search for various profiles with restricted
views. A creator losing all status visibility at handoff defeats monitoring;
granting full detail/download rights merely to show status defeats ownership.

**How to apply:** Keep status/movement visibility separate from private-detail
authorization, explain restricted detail in the UI, and enforce the distinction
on download endpoints as well as lists. Use live employee/profile authority,
scope totals/options consistently and namespace client caches by identity.
Retain monitoring for recorded participants even in older workflows that save
an actor's note or processing identity without opening a new handoff work item.
Closing work items does not transfer private ownership back to the original
tracker. Saved assignments also do not preserve specialized private access
after the assignee changes profile; check current lane authority.
Other profiles do not automatically gain organization-wide reporting scope;
that needs an explicit business decision.

DPU monitoring should use the established Record Filing eligibility, including
receipted or allocation-closed work, rather than treating an old closure lane
as proof that DPU is not responsible.

**Why:** Closed files can retain closure work items while waiting for DPU.

**How to apply:** Preserve strict allocated ownership, then apply DPU's filing
eligibility before generic shared-queue checks. Retain all notes for authorized
readers; do not delete or deactivate historical notes to change visibility.
