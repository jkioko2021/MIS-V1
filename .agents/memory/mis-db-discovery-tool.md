---
name: MIS DB Discovery Tool
description: Live SQL Server database explorer built into mis-v1 + api-server; network connectivity blocked by VPN firewall
---

# MIS DB Discovery Tool

## What was built
Full-stack SQL Server discovery module:
- **Backend**: `artifacts/api-server/src/lib/sqlserver.ts` (connection pool manager) + `artifacts/api-server/src/routes/discovery.ts` (REST routes)
- **Frontend**: `artifacts/mis-v1/src/pages/discovery/index.tsx` (split-panel explorer) + `artifacts/mis-v1/src/lib/discovery-api.ts` (typed API client)
- Routes: `/api/discovery/status`, `/databases`, `/:db/tables`, `/:db/views`, `/:db/procedures`, `/:db/tables/:schema/:table/columns|preview|rowcount|indexes`, `/:db/procedures/:schema/:proc/definition`, `/:db/views/:schema/:view/definition`, `/:db/search`

## Connection config (env vars)
- `MSSQL_HOST` = `internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com` (shared env)
- `MSSQL_PORT` = 1433, `MSSQL_ENCRYPT` = true, `MSSQL_TRUST_SERVER_CERT` = true (shared env)
- `MSSQL_USER`, `MSSQL_PASSWORD` = stored as Replit Secrets

## Build quirk
`mssql` and `tedious` must be in the `external` array of `artifacts/api-server/build.mjs` (they use dynamic CJS requires that break esbuild bundling). `@azure/identity` must be installed as a workspace dep (`pnpm add @azure/identity` from api-server).

**Why:** `tedious` (mssql's underlying driver) optionally requires `@azure/identity` at runtime; the `@azure/*` external pattern in build.mjs prevents bundling it, so it must be installed separately.

## Connectivity blocker
RDS is on private VPN — Replit outbound IP `34.63.120.253` is blocked at the AWS security group level on port 1433. Fix: add inbound rule `34.63.120.253/32 TCP 1433` to the RDS security group in `eu-west-1`. Once done, the tool works with no code changes.
