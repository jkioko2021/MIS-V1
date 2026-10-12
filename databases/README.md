# Additional legacy database scripts

These user-supplied SQL Server scripts are reference inputs for MIS legacy
analysis. They are not PostgreSQL migrations and are not executed automatically.

| File | Target database | Original upload |
| --- | --- | --- |
| `AAR_RISK_DB.sql` | `AAR_RISK_DB` | `attached_assets/0_AAR_RISK_DB_1791786517778.sql` |
| `DB_ONLINE_PORTAL.sql` | `DB_ONLINE_PORTAL` | `attached_assets/1_DB_ONLINE_PORTAL_1791786517779.sql` |
| `SALES.sql` | `SALES` | `attached_assets/2_SALES_1791786517779.sql` |

The files retain their original UTF-16 little-endian encoding and Windows line
endings. Open them with an editor that supports UTF-16, or decode a temporary copy
for analysis; do not change the originals inadvertently.

Scripts may include database creation, data inserts, and environment-specific
settings. Review before sharing or executing. Importing, running, converting, or
applying them to an existing database requires a separate request.

The updated legacy application archive and its five embedded database scripts
are identified in `Legacy/README.md`. These three scripts supplement that reference.
