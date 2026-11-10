# MIS application and database scripts

This folder is a standalone source snapshot of the modern MIS application.
The original project remains at the repository root and is unchanged.

## Contents

| Location | Contents |
| --- | --- |
| `artifacts/mis-v1/` | MIS React frontend |
| `artifacts/api-server/` | Express API and server tests |
| `artifacts/mockup-sandbox/` | Existing component-preview source |
| `lib/` | Shared packages, API specification, generated clients and database tooling |
| `lib/db/migrations/` | Modern PostgreSQL migrations and local baseline |
| `databases/` | Uploaded legacy SQL Server scripts: AAR_RISK_DB, DB_ONLINE_PORTAL and SALES |
| `scripts/` | Local development and database setup helpers |
| `docs/` | Local development, Visual Studio 2022 and risk import instructions |
| `.vscode/` | Existing editor task and launch configuration |
| `.env.local.example` | Configuration placeholders, not runtime credentials |

Package manifests, the pnpm lockfile, workspace configuration and TypeScript
configuration are included so the relative package layout remains intact.
Open this `MIS` folder as the project directory when using this snapshot.
See `docs/VISUAL_STUDIO_2022.md` and `docs/LOCAL_DEVELOPMENT.md` for setup.

## Database safety

Only the existing database scripts and migrations are included. This is **not**
a development or production database backup.

The scripts in `databases/` target SQL Server; they must not be applied to the
modern PostgreSQL database. Their original encoding and contents are preserved.
They can include legacy seed data and environment-specific settings; review
them before executing or sharing.

Historical PostgreSQL migrations can depend on an existing CRM schema. Follow
the local setup documentation and the local-baseline README rather than running
every migration blindly against an empty database.

## Exclusions

No runtime secrets, real `.env` files, live database dumps, uploaded App Storage
documents, Git history, dependencies or compiled build outputs are included.
Replit artifact registration files are omitted so this copy does not register
duplicate running services.

## Snapshot maintenance

This is a copy, not a second active deployment or an automatic synchronization
target. Future edits to the original project will not automatically update it.
`SOURCE_MANIFEST.sha256` records the checksums of the copied source files.
