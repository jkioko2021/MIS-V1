# Authoritative MIS legacy source

The user designated the following upload as the **updated legacy source** on
2026-10-12:

`attached_assets/0_CRM-Replit-Source_1791786043557.zip`

SHA-256:
`c313185d7ed53ef84bf9a10ea7e0354a03205aa69123249adf9a598d6f6cc8e0`

## How to use this reference

- Use this archive for all subsequent legacy-page, code-behind, report, and
  database-script analysis.
- The older extracted `Legacy/CRM/` snapshot was removed at the user's request.
  Use the updated archive; do not silently fall back to an older reference.
- Earlier discovery documents describe that older snapshot. Revalidate relevant
  findings against the updated archive before implementing changes.
- List archive entries first. Some entries use Windows backslashes; normalize
  paths safely when inspecting or extracting.
- Extract needed files into a separate temporary directory, not over the modern
  application's source or the workspace root.
- If the archive is unavailable in a clone or another workspace, obtain the
  designated upload before analyzing current legacy behavior.

## Included database scripts

- `Database/CRM.sql`
- `Database/DATA_REPOSITORY_DB.sql`
- `Database/DB_MASTER_AGENTS.sql`
- `Database/DB_MASTER_RENEWAL.sql`
- `Database/Doc_Arc_DB.sql`

These are SQL Server reference scripts, not migrations for the modern PostgreSQL
application. Some include data inserts. Inspect them without executing them;
running, importing, or converting database scripts requires a separate request.

The archive remains in the workspace and is excluded from new Git additions and
deployment packages because it is a large reference bundle and may contain
sensitive data. Existing Git/checkpoint history is not rewritten.
Removing the older extracted snapshot does not change modern application behavior
or database contents. The updated archive is preserved.
