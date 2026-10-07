# GI-Allocate and GI-Allocated

## Legacy analysis

Sources: `Legacy/CRM/Business_Tracking_Alloc_NonMed.aspx` and its VB code-behind,
and `Legacy/CRM/Business_allocated_Non_MED.aspx` and its VB code-behind.

- GI-Allocate lists active, forwarded, ready-for-update, nonmedical
  (`Business='N'`) files that are not allocated, invoiced, receipted or declined.
  Walk-in business has priority, followed by oldest receipt date.
- Its staff picker selects approved, undeleted NONMEDICAL employees.
  Actions are Allocate (`A`) and Return Incomplete (`RI`), with required notes.
  RI targets the original registration user. The page sends allocation/return
  notifications and displays the original documents and notes.
- GI-Allocated lists nonmedical business assigned to the signed-in user,
  forwarded, ready for update, allocated and uninvoiced. It displays documents,
  notes, GI category and payment information, with invoice/document processing.
  The page delegates processing to the legacy allocation procedures. Its
  Cashier path checks payment context and requires AML evidence for New/Renewal.

## Modern workflow

- Business Tracking contains `/business/gi-allocate` and
  `/business/gi-allocated`, after the existing Record Filing entry.
- Saving registration still leaves the file in Register Queue for document
  completion. The existing **Forward** step sends nonmedical business to
  `GI_ALLOCATE`; medical business retains its existing BPO routing.
- All stages use the original file number. No registration, document or note
  copies are created. Return/correction/forward cycles reuse that file.
- GI team membership is determined from the current active, approved, unlocked
  employee and active profile: GI/Nonmedical/General Insurance profile or
  GI/NONMEDICAL/General Insurance department. Administrators have oversight.
  Creating the GI profile does not silently change existing employee profiles.
- GI-Allocate is the shared triage inbox. Allocation requires an active GI
  recipient and comments. It opens an assigned `GI_ALLOCATED` work item and
  records the actor, allocation date, note, review, audit and notification.
- GI-Allocated is a personal queue. Only the assigned GI user or an explicit
  administrator can access the file, history and documents. Other GI staff and
  BPO users cannot access someone else's GI allocation.
- Per the user clarification, assigned GI staff have two outcomes:
  **Return to Register** (`RI`) or **Cashier** (`C`). Medical/Pricing and the
  other membership actions are not offered for GI files.
- Return closes GI work, clears current allocation/forwarding, marks
  `RETURNED-INCOMPLETE` and routes correction to the original tracker. Required
  return notes and a notification are persisted in the same transaction.
- Cashier retains existing invoice, payment, eligible Finance-recipient and
  New/Renewal AML validation. It closes GI work and opens the existing Cashier
  work item. Finance can then receipt through Cashier Review.
- Unlike the legacy uninvoiced-only list, the modern GI-Allocated queue keeps
  an invoiced allocation actionable until explicit Cashier handoff. Uploading
  an invoice must not strand a file before the user can forward it.
- Pending nonmedical BPO handoffs are migrated into the GI inbox. Already
  processed downstream allocations are not reassigned. Staff retaining an
  existing membership role can still work their historic assigned membership
  files; GI-only profiles do not gain general Business Tracking access.

## Notifications and safety

In-app notifications target the allocated GI user for assignment, and the
original tracker for returns. Email shares the existing durable outbox;
`WAITING_CONFIGURATION`, `PENDING` and `RETRY` are not proof of delivery.

Decisions use locks and transactional updates. GI-Allocate additionally checks
the expected file timestamp. Retry/concurrent submissions cannot create a
second valid allocation. Private downloads verify queue access and document
ownership before streaming bytes. Notes are append-only.
