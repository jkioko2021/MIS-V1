# Business Status

Private-detail safeguards:
- Completing work items does not transfer an allocated file's private ownership
  back to its original tracker.
- Old assignments do not bypass current specialized profile authority.
- Every overlapping open lane must be authorized; unknown destination lanes
  remain status-only until explicitly authorized.

Read-only page: `/business/status`, under Business Tracking after GI-Allocated.

## Legacy analysis

Reviewed `Legacy/CRM/Business_Tracking_Status.aspx` and its VB code-behind.
The page searches active business by File No. (`F`) or Proposer Name (`P`),
filters New, Renewal, Addon, Termination, Reinstatement, Category Change and
Premium Recon, and optionally includes historical records. Its pending searches
exclude FILED, FILING and UPDATED & DISPATCHED and apply an entry-year cutoff.

The grid shows receipt date, status, product/system, business/client type,
allocation and invoice information. Selecting a file loads document archive
entries, optional policy-only documents (`RET36`), AML rating/reason, notes and
payment references. These queries concatenate user input and do not implement
record-level profile scoping in the reviewed code-behind.

## Modern behavior

- File number/proposer search, business type, client type and status filters.
- Pending records by default; optional filed/completed history.
- Twenty-five records per page, ordered by most recent update then file number.
- Current file status, open queue, responsible user, original registration
  date, last update and Forwarded/Invoiced/Receipted/Filed milestones.
- Read-only handoff history showing queue, assignment, actor and timestamps.
- Authorized viewers see financial metadata, retained notes, documents and
  invoice/policy/AML metadata. Policy-only filtering uses Policy Schedule names
  or the legacy RET36 code.
- Private downloads recheck record scope and private-detail permission; they
  do not expose storage keys or use generic object URLs.
- List, options and open detail refresh every thirty seconds. Search/filter
  changes reset pagination. Queries are namespaced by the signed-in identity
  and profile so cached administrator data cannot be reused by another user.
- No registration edit, upload, note edit/delete, allocation or forwarding
  controls. Viewing status never changes a workflow.

FILING remains pending in the modern workflow because it can represent
receipted nonmedical work awaiting DPU filing. No fixed 2023 cutoff is applied.
Completed history excludes only actually filed/FILED/UPDATED & DISPATCHED work
from the default list. Inactive business remains excluded, as in the legacy page.

The modern schema has no legacy Syst column; it is not fabricated. AML data
comes from stored upload metadata, not an unverified external risk database.
Actual premium and paid amount are shown separately rather than copying the
legacy paid-amount-as-premium alias.

## Profile-scoped visibility

Every request validates the current approved, activated, unlocked staff record
and active profile. JWT role/name claims alone do not authorize status access.

Administrators (SuperAdmin/System Admin) can search all active business.
Other active users can search their registrations, recorded assignments,
allocation/handoff authorship, saved-note participation and recorded
verification/receipting/filing activity, plus authorized current team inboxes:

| Profile/team | Additional current scope |
| --- | --- |
| BPO/BPO Admin/BPO Review | Open Retail and Corporate/SME BPO review |
| Medical UW | Open Medical Underwriting |
| Pricing | Open Pricing Review |
| Finance/Cashier | Open Cashier/Credit Control |
| GI, including legacy NONMEDICAL department | Open GI-Allocate; GI-Allocated remains assigned-user scoped |
| DPU | Eligible nondeclined New/Renewal/Addon business receipted, closed or filed |
| Other profiles, including Reports Only | Related registrations/recorded participation only |

Counts and status options use the same scope as search, detail and downloads.
An inaccessible file number returns a scoped not-found response.

## Private-detail boundary

Monitoring progress is not permission to open another user's allocated file.
Creators and past participants can retain status/movement visibility after a
handoff without retaining notes, documents or financial access in a private
operational stage. The response explicitly explains this restriction.

Private Allocated/GI-Allocated details require the current assigned user with
the corresponding active role, or an administrator. Shared queues allow the
current responsible assignee/authorized team. DPU private-detail access
uses Record Filing's receipted/closed/filed eligibility, including an open
legacy closure work item. Outside an active restricted lane, the original
tracker retains their original file details.

Authorized note views retain all saved notes, including prior inactive entries.
Restriction of a viewer is not deletion of notes. Document lists never return
storage keys, and each download checks that its document belongs to that file.
