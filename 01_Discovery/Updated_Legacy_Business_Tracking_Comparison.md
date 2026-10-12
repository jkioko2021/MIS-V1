# Business Tracking: modern MIS versus updated legacy

**Date:** 2026-10-12  
**Method:** Static comparison of current React pages, Express routes and permission/routing helpers with the user-designated updated WebForms archive and eight uploaded SQL Server scripts.  
**Conclusion:** The main operational queues have been developed, but the modern app is not a complete legacy replacement. Two concrete gaps are Filing coverage outside New/Renewal/Addon and controlled Medical HPC lookups. Legacy payment/member-system integrations and downstream policy processing also remain distinct from the modern queue implementation.

## Scope and confidence

Reviewed eleven modern Business Tracking menu destinations against fourteen relevant legacy pages and their code-behind. Compared queue eligibility, actions, fields, document handling, notes, role restrictions, and SQL routing.

The authoritative application source is `attached_assets/0_CRM-Replit-Source_1791786043557.zip`; the removed older source was not used.

SQL references reviewed:

- Embedded in the updated archive: CRM, DATA_REPOSITORY_DB, DB_MASTER_AGENTS, DB_MASTER_RENEWAL, Doc_Arc_DB.
- Additional scripts in `databases/`: AAR_RISK_DB, DB_ONLINE_PORTAL, SALES.

No application behavior was changed, SQL executed, production data queried, or signed-in browser journey tested. “Implemented” below means supported by the inspected UI and server code, not confirmed production operation. Stored procedure definitions establish intended legacy logic, not what is deployed on a live SQL Server.

## Page-by-page comparison

| Modern page | Legacy counterpart(s) | What is present | Difference / assessment |
| --- | --- | --- | --- |
| Register Queue | Business_Tracking.aspx; Business_Tracking_Retail.aspx; Business_Tracking_SME_Corp.aspx | Business registration/editing, client and business types, rate selection, intermediary selection, documents, checklist, notes, forwarding | Legacy registration screens are consolidated. Modern intermediary selection uses the user-requested sales-intermediary master rather than copying every historical agent assignment. The complete legacy agent/master datasets have not been established as imported merely by uploading scripts. |
| BPO Review Retail | Business_Allocation_Ret.aspx | Return Incomplete, Allocate, Medical UW, Hold, Cashier; reviewer notes and recipient routing | Core legacy action coverage is present. Modern queue/work-item accounting replaces loosely coordinated legacy flags. Return routes preserve the original tracker. |
| BPO Review Corporates/SME | Business_Allocation_Corp.aspx | Return Incomplete, Allocate, Medical UW, Cashier; corporate review fields and assignment | Core actions match. Automatic custom-rate Pricing routing is a requested modern rule, not a direct reproduction of the old allocation procedure. |
| Medical Review | Business_Medical_UW.aspx | Cashier, Forward, Return Incomplete, Hold, Decline; separate review states, documents, HPC registration, review history | Decision actions are present. Forward uses the saved BPO allocation, or returns to BPO for allocation, as requested. Disease/source entry is free text instead of controlled legacy lookups. |
| Pricing Review | Business_Tracking_Pricing.aspx | Review of pending custom-rate files, approved rates-matrix upload, approval, return incomplete, preserved BPO recipient | Modern rate-C gating and rate-S bypass follow the user's final correction. Modern approval requires a rates-matrix document; legacy code only checks for any active document. |
| Allocated Files | Business_Tracking_Allocated.aspx; Business_Allocated_Clapi.aspx | Assigned-file queue, Cashier/Medical/Return/Closed/IT/RM actions, manual Pricing handoff, invoice and AML uploads, document-specific metadata, history | Core handoff actions exist. Policy Schedule and System Receipt removal here is intentional. Legacy member/proposal lookups and authoritative refund retrieval are not equivalent to the modern record summary. |
| Cashier Review | Business_Tracking_Finance.aspx | Receipted, return to allocation sender, return to tracker, Credit Control; receipt upload and number, payment status, payment-reference-related records | Core Finance decisions are present. Full payment marks receipted; partial payments remain outstanding. Related records are queried from modern business_tracking, not established as imported portal/finance transactions. |
| Record Filing | Business_Tracking_Filing.aspx | DPU access, document selection and filed flags, file-level filing, reviewer/date history; receipted or Closed admission | Old policy-generated/signed/dispatched prerequisites were intentionally removed. However, a New/Renewal/Addon-only filter still excludes Closed records of other supported business types. |
| GI-Allocate | Business_Tracking_Alloc_NonMed.aspx | Registered/forwarded nonmedical queue, active GI assignee selection, return to tracker, notification records | Modern initial GI actions are deliberately narrower. Legacy initial allocation also offers Cashier, IT, and Close; the user requested allocation or return at this stage. |
| GI-Allocated | Business_allocated_Non_MED.aspx | Assigned GI processing, return to registration, Cashier forwarding for receipting | Matches the explicitly requested modern actions. Legacy Closed, IT, and RM actions are not implemented as equivalent GI actions; these are additional legacy scope, not automatically defects. |
| Business Status | Business_Tracking_Status.aspx | File/proposer search, business/client/status/completion filters, current holder/queue, history and document access subject to profile/file scope | Modern scope is intentionally tighter than the legacy broad search. Legacy policy-only and risk/detail presentation are not fully reproduced; the modern page is primarily a scoped workflow-status monitor. |

## Highest-priority findings

### 1. Record Filing can omit Closed endorsement and other non-N/R/A files

**Classification:** Confirmed source-level eligibility gap against the broad requested “receipted or Closed” admission rule.

The modern queue predicate combines `(receipted OR file_status='CLOSED')` with `business_type IN ('N','R','A')`. Consequently, a Closed Termination, Reinstatement, Category Change, Premium Recon, or other supported non-N/R/A file does not enter this filing queue.

The older filing page has New/Renewal/Addon grids, which explains the retained restriction, but the user subsequently requested records from receipting or Allocation Closed. The distinction must be resolved rather than assuming every Closed file currently arrives.

**Evidence:** `artifacts/api-server/src/lib/record-filing.ts:8-11`; updated archive `Business_Tracking_Filing.aspx.vb:42-66`.

**Recommended correction:** Apply the receipted/Closed rule across the supported business types and keep optional type filters for presentation. Preserve the existing active/not-declined/not-already-filed checks. Review the parallel DPU Business Status scope at the same time.

### 2. Medical HPC disease/source choices are not table-backed

**Classification:** Confirmed legacy feature gap; populated catalogs still require verified input.

Legacy Medical Review loads diseases from `TBL_MIS_CRM_HPC_DISEASES` and sources from `TBL_MIS_CRM_HPC_SOURCE`. The modern HPC form accepts typed condition, disease code, and source values. The uploaded CRM script contains both table definitions, but no INSERT statements populating those two tables were found.

This is more precise than the earlier assumption that the definitions themselves were unavailable. The schema is now available; authoritative catalog values are still missing.

**Evidence:** updated archive `Business_Medical_UW.aspx.vb:50-68`; embedded `Database/CRM.sql:1607` and `:1669`; modern `artifacts/api-server/src/routes/medical-underwriting.ts:30-37`; `artifacts/mis-v1/src/pages/medical-underwriting/file-detail.tsx:417-434`.

**Recommended correction:** Define modern lookup tables/endpoints from the supplied schema, populate only verified catalog values, and replace free-text code/source fields with selections. Do not invent clinical codes or silently remap historical values.

### 3. Cashier related records are not external payment reconciliation

**Classification:** Integration difference, not proof that receipts fail.

The legacy Finance code references online-portal document/payment/policy structures. The modern Cashier detail endpoint's `related_payments` response selects other modern business records sharing `pay_ref_no`. This is useful context, but it does not establish an authoritative payment-ledger lookup, portal synchronization, or automatic paid-amount reconciliation.

Manual receipting, receipt-document checks, payment-state decisions, and full/partial outcomes are implemented. Uploading the additional database scripts does not connect or import their data.

**Evidence:** updated archive `Business_Tracking_Finance.aspx.vb`; modern `artifacts/api-server/src/routes/cashier.ts:49-61` and `:100-140`; additional `databases/DB_ONLINE_PORTAL.sql` and `databases/SALES.sql`.

**Recommended next analysis:** Map authoritative invoice, payment-reference, receipt, and amount relationships before proposing any synchronization. Do not treat the current related-business list as a live accounting ledger.

### 4. Legacy member/proposal/refund and later policy stages remain broader

**Classification:** Partial legacy coverage / additional scope.

Legacy allocated pages include member/proposal queries and refund data structures. The modern operational pages focus on the original business record, its work items, uploads, and workflow history. Live CRM refund amounts already have a separate proposed project task; this review does not duplicate it.

The updated legacy archive also includes dedicated policy-document, policy-return, dispatch, IT, unpaid, declined/refund, branch, and dashboard pages outside the eleven modern destinations assessed here. Their existence must not be confused with full modern implementation.

**Recommended next analysis:** Agree which integrations and downstream policy stages remain required. The requested simplified Filing admission should not be undone simply to reproduce the legacy flags.

## Important matches and intentional differences

### Pricing and benefit defaults

- Only Corporate/SME custom-rate C allocations automatically queue for Pricing.
- Standard S bypasses Pricing.
- Retail, including Retail C, and Standard-rate business default Benefit Verified to YES.
- An allocated custom-rate file deliberately marked NO can be sent to Pricing.
- Approval preserves the already allocated BPO recipient, rather than allowing arbitrary reassignment from Pricing.
- A rates-matrix upload is required for modern approval. Legacy Pricing's active-document check is weaker and should not be copied.

**Evidence:** `artifacts/api-server/src/lib/pricing-review.ts`; `artifacts/api-server/src/routes/pricing-review.ts`; `artifacts/api-server/src/routes/business.ts`. Legacy Pricing code-behind has the generic active-document check at lines 119-124.

### Medical routing and notifications

The supplied CRM script now exposes `sp_Business_MEDUW_Action`: RI returns incomplete, H sets hold, D declines, F marks forwarded/medical done, and C assigns Cashier/invoiced status.

The modern Forward destination is intentionally more explicit than those legacy flags: saved eligible BPO recipient, otherwise BPO Review, with custom-rate Pricing gating where applicable. Hold and Decline are retained inside Medical Review. Return/Decline notification records and delivery-state handling are implemented; successful external email delivery was not tested during this analysis.

**Evidence:** embedded `Database/CRM.sql:9698-9760`; `artifacts/api-server/src/routes/medical-underwriting.ts:88-162`; `artifacts/api-server/src/lib/business-notifications.ts`.

### Cashier and Filing

Modern Cashier requires an invoice, a receipt number, and a current System Receipt for receipting. Full payment sets receipted; partial payment remains in an outstanding-payment work queue. Filing follows receipting or Allocation Closed without requiring the old policy-generation stages.

The legacy Cashier procedure marks Receipted for action M, while its code-behind adds separate full/partial updates. Modern transactional decisions avoid relying on those separate statements as the same atomic operation.

**Evidence:** embedded `Database/CRM.sql:9618-9691`; updated archive `Business_Tracking_Finance.aspx.vb:164-201`; modern `artifacts/api-server/src/routes/cashier.ts:100-143`.

### Documents, notes, and permissions

- Modern work-item handling preserves a single original business record rather than duplicating it into independent queues.
- Document-specific invoice/AML metadata is attached to uploads. Allocation's receipt/policy-schedule exclusions follow the user's instruction.
- Note deletion is explicitly rejected; saved notes are append-only.
- Page-specific Medical, Pricing, Cashier, GI, and DPU middleware exists.
- Business Status applies a common profile/participation scope to listing and associated detail/download paths.
- The generic file endpoints inherit `requireBusinessFileAccess` through the router mount. Their lack of an inline guard is not, by itself, evidence of an authorization bypass.
- Transaction boundaries and stale-record checks are present in the reviewed decision routes. This static inspection does not replace concurrency or authenticated regression testing.

**Evidence:** `artifacts/api-server/src/routes/business.ts:1284`, `:1791-1794`; `artifacts/api-server/src/lib/business-status-access.ts:76-91`; page-specific route and permission helpers.

## Database compatibility boundary

The uploaded scripts describe SQL Server databases, legacy tables, stored procedures, and cross-database relationships. The modern app uses PostgreSQL `crm` tables and application-managed work items. Uploading or organizing SQL files is not a migration or synchronization.

Explicit mappings are needed for legacy `TBL_MIS_CRM_BUSINESS_TRACKING`, requirement/document IDs, agent identifiers, payment/invoice fields, risk catalogs, and status flags. Availability of a table definition does not prove availability of populated lookup data or a connected database.

The newly available procedures reduce uncertainty about historical routing. They do not override the user's subsequent modern workflow instructions.

## Recommended order

1. Correct Filing admission for Closed non-N/R/A records and its matching DPU status scope.
2. Restore controlled HPC disease/source selections after obtaining verified catalog values.
3. Map payment/portal and member/refund integrations separately; retain the existing live-refund follow-up rather than creating a duplicate.
4. Agree remaining policy/dispatch/IT workflow scope.
5. Use the existing authenticated-regression-testing task to verify completed flows across representative profiles. No live or production journey was exercised for this comparison.
