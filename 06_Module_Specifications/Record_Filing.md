# Record Filing

## Legacy source
Reviewed `Legacy/CRM/Business_Tracking_Filing.aspx` and its VB code-behind.

The page has three grids for New (`N`), Renewal (`R`) and Amendment (`A`).
Its pending query requires forwarded, ready-for-update, receipted, updated,
policy-generated, policy-signed and policy-dispatched flags, excludes declined
and already-filed records, and opens the original tracked file rather than
creating another business record.

The sole action is Filed (`F`). Selected active archive documents are marked
filed; the original file receives `FILED`, filing actor and filing date.
Selecting documents and supplying a comment are optional in the legacy handler.
Existing notes and document downloads are retained. Legacy email goes to the
allocated employee and copies the registering employee.

## Modern implementation
- Route: `/business/record-filing`, under Business Tracking.
- Active DPU profiles receive access; SuperAdmin and System Admin retain oversight.
  Queue, detail, download and mutation APIs enforce this independently of the menu.
- Pending and Filed history support N/R/A filters, search and pagination.
- Pending files enter Record Filing through either of two routes: `receipted=true`
  after receipting (including Cashier's fully paid `FILING` and `RECEIPTED`
  outcomes), **or** `file_status='CLOSED'` from Allocation Files' Closed action.
  The Closed handoff does not require a receipt.
- The legacy policy-stage flags remain stored as source context but are not
  prerequisites for these user-directed handoffs. They default false; no policy
  generation, signing or dispatch completion is invented. Partial payment stays
  out of the receipted route because Cashier does not mark it receipted.
- Filing uses an advisory lock, row lock and expected timestamp. Selected upload
  IDs must belong to the same file, be active and not already filed.
- Document flags, file status/actor/date, completed work items, review history,
  appended note, audit and notification outbox records commit together.
  Duplicate or stale submissions cannot file a record twice.
- Filing does not require every document to be selected. Only selected documents
  receive filing metadata; unselected documents and all stored bytes are retained.
- Filed records remain read-only within this page. There are no history or
  document deletion controls.
- In-app notifications are queued for the recorded allocated and registering
  employees, deduplicated when they are the same person. Email uses the existing
  outbox and explicitly remains waiting for configuration or without a recipient
  where applicable; saving a filing decision does not claim email was sent.

## Deployment and staff setup
Migration `0031_record_filing.sql` adds the DPU profile and filing/policy-stage
metadata. It has been applied to the development database. Authorized staff can
be assigned the DPU profile through existing User Enrollment; no existing staff
roles are reassigned automatically.
