# Standalone synthetic local baseline

This directory is **not** part of the historical upgrade migration chain and must
never be applied to a restored, cloud, or production database.

The local launcher explicitly applies:

1. `001_schema.sql`: empty CRM, commission, sales and risk schema.
2. `../0034_persistent_auth_sessions.sql`: canonical sessions/security triggers.
3. `002_reference_data.sql`: synthetic catalogs and permission matrix.

All three run in one guarded transaction. Admin provisioning is a separate,
interactive action, limited to the marked clean baseline with no existing
employees. See `docs/LOCAL_DEVELOPMENT.md` for commands and verification.

This is a consolidated application-compatible contract, not a schema dump or
production-data export. It supports both audit-write shapes used by current
routes and the 255-character requirement names accepted by the admin API.
Keep it aligned with API SQL and canonical security migrations when contracts
change; do not infer completeness from the partial Drizzle schema or regenerate
it by exporting employee/business/reference data.
