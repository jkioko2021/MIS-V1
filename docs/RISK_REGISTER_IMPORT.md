# Legacy Enterprise Risk import

Risk Management and active administrators can open **Risk Register → Legacy
Import** (`/risk/import`). Department champions and owners cannot import.
This is for departmental Enterprise Risk assessments, not client AML ratings.

## Prepare the source

Upload a JSON file or paste JSON using the downloadable template on the page.
The browser reads the file as text; no original file is placed in file storage.
Give the source a descriptive label. Each batch is limited to 60 KiB (UTF-8)
and 200 records. Format: `{"records": [ ... ]}`.

Each record needs:

- `legacy_risk_code`: unique source identifier, never used as the generated MIS ID.
- `depart_code`, `objective_code`, `risk_category`: approved active codes.
  The objective must belong to the supplied department.
- `period_from`, `period_to`: calendar dates (`YYYY-MM-DD`) matching an
  existing open reporting period and an open department register.
- `risk_title`, `risk_description`, `risk_consequence`.
- `i_rate`, `l_rate`: explicit numbers greater than zero and no more than 100,
  with up to two decimal places.
- `control_effectiveness`: an explicit fraction between 0 and 1 with up to
  six decimal places. Use `0.375`, not `37.5` or a historical effectiveness code.
- Optional `current_contr`, `desired_contr_effe` and `root_causes`.

Each root cause needs `root_cause`, `mitigations`, `due_date` and an approved
active `action_status` name; `current_contr` is optional. Original `action_owner`
is kept as provenance only. Assign a current MIS action owner after import.
Multiple causes belong in the same record's `root_causes` array, not in
duplicate risk rows. Encode line breaks in JSON strings as `\n`; text is
stored without trimming its whitespace.

Optional `i_risk_exposure`, `i_risk_rate`, `r_risk_exposure`, `r_risk_rate`
must match the calculated two-decimal scores:
inherent = impact × likelihood; residual = impact × likelihood × (1 − control).
Extra source fields, such as original IDs, usernames and review flags, remain
in audit evidence rather than changing current permissions or workflow state.

## Preview and confirm

1. Choose the file or paste the source and enter its label.
2. Click **Validate & preview**. This writes nothing, including no department
   summary or audit events. Correct every validation error.
3. Review the environment, reporting period, scores and raw source.
4. Tick the environment-specific, insert-only confirmation and click **Import**.

Any source change clears confirmation. Previews expire after 15 minutes and
on server restart; changing account, source label or target database also
requires another preview. Confirmation revalidates reference approvals and
workflow state and inserts the entire batch with its audit history in one
database transaction. A failed insertion saves none of the batch.

Existing risk records are never updated. Duplicate source codes within a batch,
against live MIS codes or against previous import history are rejected.
Changing the source label does not allow reimporting the same codes.
There is no update mode: corrections to existing assessments use the normal
audited editing workflow, or need a separately designed update plan.

An imported action marked `Closed` does not sign off the department or close
the global reporting period. Historical usernames never create accounts,
department assignments or permissions.

Department-scoped `LEGACY_IMPORTED` events in `risk.register_history` retain
the source label, environment, batch identifier, source hash, that record's
complete raw row, legacy code and inserted record/root-cause snapshots.
The exact full batch source text is retained once in a separate
`LEGACY_IMPORT_SOURCE` event with no department or period scope. Only management
can retrieve that event through the unfiltered risk history. Department
champions and owners never receive another department's batch source.

## Verification

- `pnpm --filter @workspace/api-server exec node --test test/risk-import.test.mjs`
- Development database and running API:
  `pnpm --filter @workspace/api-server exec node test/risk-import.integration.mjs`

The integration test creates only synthetic records and cleans them up.
`--keep` retains a private temporary fixture for browser checks; `--cleanup`
removes that fixture. It verifies permissions, no-write preview, references,
dates, scores, provenance, changed-source rejection, forced database rollback,
concurrent confirmation, mixed-department history isolation and unchanged access/workflow.
