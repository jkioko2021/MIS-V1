---
name: Medical underwriting legacy boundaries
description: Interpretation constraints when reproducing the legacy medical review workflow.
---

Do not claim exact legacy handoff parity without the SQL definition of `sp_Business_MEDUW_Action`. The imported WebForms source reveals action codes and procedure parameters, but not the procedure's routing internals.

**Why:** The user asked for a similar medical-underwriter review page, and the available source does not establish the Forward destination or contain the legacy HPC disease/source catalog data.

**How to apply:** Preserve observed fields/actions while explicitly identifying modern routing decisions. The current Forward mapping returns the file to an active Membership Admin through Allocation Files; verify against the real procedure before changing that mapping. Do not invent lookup values or claim email notifications are sent without a configured transport.
