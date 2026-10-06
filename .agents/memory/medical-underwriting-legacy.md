---
name: Medical underwriting legacy boundaries
description: Interpretation constraints when reproducing the legacy medical review workflow.
---

Do not claim exact legacy handoff parity without the SQL definition of `sp_Business_MEDUW_Action`. The imported WebForms source reveals action codes and procedure parameters, but not the procedure's routing internals.

**Why:** The user asked for a similar medical-underwriter review page, and the available source does not establish the Forward destination or contain the legacy HPC disease/source catalog data.

**How to apply:** Preserve observed fields/actions while explicitly identifying modern routing decisions. The current Forward mapping returns the file to an active Membership Admin through Allocation Files; verify against the real procedure before changing that mapping. Do not invent lookup values or claim email notifications are sent without a configured transport.

## Requested decision destinations

Medical Cashier decisions must forward the original business to the Cashier page. Return Incomplete must go to the Register Queue of the person who tracked it and notify them by email. Hold belongs in a separate bucket inside Medical Underwriting Review. Decline belongs in its Declined bucket and must notify the original tracker.

**Why:** The user explicitly specified these destinations and notifications; these rules take priority over guesses about the unavailable legacy stored procedure.

**How to apply:** Preserve the original file and transactionally record the decision and tracker notification. Keep pending, held, and declined files distinct; declined history remains readable but not reviewable. A sent-email claim requires confirmed delivery through a configured provider.
