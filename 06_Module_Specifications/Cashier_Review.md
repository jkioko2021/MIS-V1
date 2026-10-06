# Cashier Review — legacy analysis and modern implementation

## Legacy evidence

Reviewed `Legacy/CRM/Business_Tracking_Finance.aspx`, its VB code-behind, and
`App_Code/DocManage.vb`'s `TRACKING_ALLOCATION_CASHIER` wrapper.

The page is titled RECEIPTING. Its queue selects active, forwarded, ready,
allocated, invoiced, paid, non-declined, non-receipted non-CLAPI business.
Selection loads the invoice, payment reference and amount, archived documents,
all active saved notes, related files sharing the payment reference, and portal
policy/payment records. It uses ROP/ROP_BY to claim a file when opened.

Visible action codes are M (Receipted), RM (Incomplete Return to Membership),
RI (Incomplete Return to RM/original entrant), and CC (Credit Control). An IT
branch exists in code but is not a visible action in this page's markup.
The handler requires a file, action, notes, and payment status. M requires an
active System Receipt upload. It calls `sp_Business_Cashier_Action`, appends
notes, records full/partial payment outcomes, and attempts email notifications.
Nonmedical business is set to FILING by a separate update.

The stored procedure body is unavailable. Its unseen routing is not claimed
as reproduced. The legacy blanket nonmedical FILING update must not override
return or outstanding-payment actions.

## Modern workflow

Cashier Review is under Business Tracking at `/business/cashier`.
`/cashier` redirects to that route. Access remains restricted to active,
approved Finance/Cashier accounts and SuperAdmin/System Admin. Finance staff
see their assigned handoffs; unassigned Credit Control work is Finance-shared.

Allocation Files action C (with CA retained as an input alias) validates the
invoice/payment details and selected Finance recipient, creates an open
CASHIER work item on the original file, sets the invoice flag and handoff
date, releases the allocation, and appends its note/audit atomically. Existing
New/Renewal AML and benefit-verification gates remain enforced.

The review page includes invoice/payment references, related local-reference
records, documents/downloads, System Receipt upload, all saved notes, and
review history. Local reference records are context, not external payment
reconciliation. It does not charge funds or claim emails were sent.

* **M / Receipted:** mandatory receipt number, actual System Receipt uploaded
  for the current allocation/handoff cycle, comments, and explicit FULL-PAID/PART-PAID selection.
  FULL-PAID completes Cashier work and records RECEIPTED (medical) or FILING
  (nonmedical). PART-PAID stays non-receipted and enters Credit Control.
* **CC / Credit Control:** outstanding PART-PAID/NOT-PAID business enters the
  Credit Control bucket with PENDING PAYMENT status. This bucket remains
  actionable by Finance, including subsequent full receipting.
* **RM / Return to Membership:** returns to the eligible original Allocation
  Files sender's personal allocation queue; no arbitrary reassignment.
* **RI / Return to original tracker:** clears allocation and opens the original
  entrant's REGISTER_CORRECTION work item.

Every decision validates current queue ownership and timestamp, locks the file
and work item, and commits state, history, notes, and audit together. Duplicate
or concurrent completion is rejected. Notes are append-only, not deleted.
Uploads retain actual bytes in App Storage, are limited to 10 MB, and use the
existing `crm.business_req` System Receipt (code 3) requirement.

## Differences and verification

Unlike the legacy paid-only filter, the modern inbox also retains valid
NOT-PAID/credit handoffs so they can be sent to Credit Control. Unlike legacy
allocation flags, the original allocation is released at Cashier handoff.
Read-only selection does not mutate ROP claims; optimistic transactional
decision checks prevent stale/double processing instead.

No external portal/accounting reconciliation or email transport is connected.
Allocation owners may upload System Invoice and AML Report independently
of the registration checklist, for Retail,
Corporate, and SME business. Policy Schedule and System Receipt are excluded from
Allocation Files upload choices even when selected at registration; existing
uploads remain accessible and Cashier can still upload System Receipt.
Uploads use real private bytes, retain document
metadata and notes, and recheck allocation ownership under the handoff lock.
Invoice input is retained after uploading so the operator can forward using it.
Cashier accepts receipts uploaded during that allocation before the transfer;
receipts predating the current allocation remain ineligible for new receipting.
Development-only integration tests cover real allocation handoff, invoice
flag/date persistence, assigned-user restrictions, upload/download and receipt
gates, concurrent decisions, full/partial outcomes, Credit Control, both return
paths, nonmedical Filing, and retention of all original notes.
Signed-in browser verification also passed for Business Tracking navigation,
the old-route redirect, actual receipt upload/full receipting, tracker return
and retained notes, outsider access denial, and 390px Credit Control layouts.
