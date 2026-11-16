# Go-live Data Management

SuperAdmin and System Admin can open **Data Management** in the navigation.
The API checks the current account's profile, approval and activation as well.

## Loading an extract

1. Choose **Users Data**, **Agents Data** or **Relationship Managers Data**.
2. Download that page's template and complete it as UTF-8 CSV or tab-separated
   TSV/TXT. Format codes, identifiers and telephone numbers as **text** in Excel;
   digits already removed by Excel cannot be recovered by MIS.
3. Select the file and choose **Validate extract**. No target records are created
   during validation.
4. Review the counts, individual rows, errors and warnings. Download validation
   results if corrections are needed.
5. Confirm **Load** only after reviewing the selected batch.

Limits: 2,000,000 bytes per file, 500 Users or 5,000 Agents/Relationship Managers.
Split larger extracts into separate batches.

## Safety and existing records

- Imports add new records only. They do not delete or replace existing data,
  transfer already assigned agents or overwrite profiles and passwords.
- Duplicate identities within a file and conflicting user identities block the
  whole import. Existing matching identities are skipped.
- A batch with any error cannot be loaded. Warnings require review but do not
  block loading. Only rows marked NEW are added.
- Commit revalidates against the database under locks. If results changed after
  preview, MIS returns an updated preview and requires another confirmation.
- All target inserts and their audit entry commit together or roll back together.
  Retrying the same successfully committed batch does not add duplicates.
- Recent history and a saved batch URL retain row results after reload.
- The database retains structured extract records and validation results for
  authorized review, not original file bytes. Do not upload credentials.
  Treat downloaded validation reports as confidential personal data.

## Users

Required: `EMP_CODE`, `USERNAME`, `NAME`, `PROFILE_NAME`.
Optional: `EMAIL`, `MOBILE_NO`, `DEPARTMENT`.
`EMPLOYEE_NAME` is accepted as an alias for `NAME`.

The profile must already exist and be active. Imported accounts are inactive,
unapproved and have no usable password. An administrator must set/reset a password,
then approve and activate the account separately in User Enrollment.
There is no default imported password and no activation from extract flags.

## Agents

Required: `AGENT_CODE` (or `REF_NO`), `AGENT_NAME`, `AGENT_TYPE`.
Use the supplied template for supported source columns and `YYYY-MM-DD` dates.
All imported source fields are retained as structured provenance.

New agents remain **PENDING** MIS registration. If a `CODED` source column is
supplied, only `0` is eligible; `1` is skipped.
`UNIT_CODE` assigns only an exactly matching available Medical Unit, using the
actual import date for the assignment history. Pending/unmatched Units are not
activated. `GI_CODE` identifies a GI Unit; MIS resolves its eligible assigned
Unit manager and retains the original source GI code.

Invalid source email addresses and missing organisation mappings are flagged
for correction rather than invented or silently replaced. Normal registration,
licence and document completion gates remain in effect.

## Relationship Managers

Required: `RE_CODE`, `RE_NAME`, `CLASS_CODE`, `C_CODE`, `YEAR`, `IS_ACTIVE`.
`C_CODE` is `C` for Corporate or `R` for Retail. `IS_ACTIVE` is `1` or `0`.
`YEAR` must be a four-digit year between 1900 and 2100.

The unique identity is **code + category + reporting year**. These are reference
records, not MIS login accounts. Class codes are retained exactly as supplied.

Agent Corporate names resolve from `RMS_CODE_CORP` against Corporate records;
Retail names resolve from `RMS_CODE_RET` against Retail records. Lookup uses the
latest matching year not later than the current database year, and only resolves
a name when that entry is active. A code
classified only as Corporate does not automatically become a Retail manager.
Names appear on Agent Registration and agent details without changing the
agent's original relationship-manager codes.
