# Medical Underwriting Review

## Source analysis
Reviewed `Legacy/CRM/Business_Medical_UW.aspx`, its VB code-behind, and the action wrapper in `Legacy/CRM/App_Code/DocManage.vb`.

The legacy page offers:
- Pending medical files: active, forwarded, medical underwriting enabled, not ready for update, not declined.
- Reverted files: active files with `MU_Revert` enabled.
- Read-only registration details, document downloads/uploads, invoice/payment information and tracking notes.
- Decisions Cashier (`C`), Forward (`F`), Return-Incomplete (`RI`), Hold (`H`), Decline (`D`).
- Mandatory selected file, decision and review notes. The procedure wrapper limits the reason to 250 characters.
- HPC referral and New Waiver–Lateral Movement flags.
- HPC member registration, conditions, diagnosis/contact/source/follow-up information and notes; registration clears the reverted flag.

## Modern implementation
Menu **Medical Underwriting**, page **Medical Underwriting Review**, route `/medical-underwriting`.

Access requires a currently active, approved, unlocked Medical UW profile; SuperAdmin and System Admin retain oversight. Assigned medical work items are personal queues; legacy unassigned items are available to medical staff. All page APIs, including document downloads and mutations, enforce these rules.

Both legacy pending files and open `MEDICAL_UNDERWRITING` work items are included, because modern allocation handoffs can have `ready_for_update=true` and do not necessarily set the legacy medical flag.

Reviews lock the file, verify the current timestamp and assignment, and save status, work items, review history, notes and audit atomically. Hold retains the medical work item and saved BPO allocation. Cashier opens the Cashier queue with explicit invoice/payment status. Forward has no Membership recipient picker: it returns to the saved active BPO user in Allocation Files, or returns business without an active allocated BPO user to the appropriate Retail or Corporate/SME BPO Review queue for allocation. Return-Incomplete opens correction for the original registering staff member. Decline completes the medical work item and marks the file declined. Completed HPC-referral files allow registration but cannot be reviewed again.

Document requirements use only `crm.business_req`. Bytes remain in private App Storage; document-specific invoice/amount/policy/risk metadata remain on uploads.

HPC entries are append-only file-linked registrations/follow-up entries, with prior entries visible in the file history. No legacy disease/source catalog values are invented.

## Unverified legacy dependencies
The SQL definition of `sp_Business_MEDUW_Action` is not available in the imported source. The Forward destination above is an explicit modern mapping to the existing membership-allocation workflow, not a claim about undiscovered procedure internals.

Return-Incomplete and Decline create private notifications for the original tracker in the same transaction as the decision. Staff view and mark these read on `/notifications`; email delivery has a separate persisted state. The Resend connector and a verified `MIS_EMAIL_FROM` sender must be configured before delivery can occur. Missing tracker email addresses are explicitly identified, and provider failures are retried (five attempts, five-minute intervals). No unconfigured or failed email is reported as sent. Disease/source lookup data and historical HPC records have not been imported from the legacy database.

The medical inbox separates Pending Review, Hold, Declined, and Reverted/HPC. Hold stays actionable but is excluded from Pending. Declined files remain visible read-only; pending HPC registration is the only permitted write when flagged for referral. Cashier handoffs appear at `/cashier` for active Finance/Cashier profiles and administrators, with invoice/payment details, notes and authenticated document downloads. Returned medical correction files appear in the original tracker's Register Queue (with administrator oversight).
