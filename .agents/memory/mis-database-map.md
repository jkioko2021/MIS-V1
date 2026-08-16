---
name: MIS Database Map
description: All confirmed databases for the legacy MIS system; DB connectivity is blocked; 7 databases total
---

## Confirmed Databases (7 total as of 2026-08-16)

| Database | Server | Notes |
|---|---|---|
| CRM | internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com:1433 | Primary — encrypted conn strings in web.config |
| SALES | 192.168.50.48 (SA account, plaintext) | Cross-DB SQL from CRM |
| MISREPORTS | 192.168.50.48 | Report support data |
| DATA_REPOSITORY_DB_CLAPI | Unknown | CLAPI integration |
| AAR_RISK_DB | Unknown | Risk Register — dedicated DB; found in Risk_Register_*.aspx.vb |
| COMMISSION | Unknown | Sales agents: COMMISSION.dbo.TBL_MIS_SALES_AGENTS; found in Business_Tracking.aspx.vb |
| Doc_Arc_DB | Unknown | Binary document storage: Doc_Arc_DB.dbo.TBL_MIS_CRM_DOCS; found in Business_Tracking.aspx.vb |

**Why:** Databases 5-7 were discovered mid-session reading source code. DISC-003 was written with only 4 databases and must be updated when DB access is restored.

**How to apply:** When writing architecture documents or migration plans, use 7 as the confirmed database count. Assume all 7 need migration to PostgreSQL schemas.

## Connectivity Status

- SQL Server (RDS endpoint) — **BLOCKED** port 1433 unreachable from Replit
- Replit Secrets (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) — **NOT SET**
- No pymssql, pyodbc, sqlcmd installed (deferred until connectivity confirmed)

## Key Cross-DB Queries (confirmed from source)

- `SALES.[dbo].[TBL_MIS_PROD_MONTHS]` — active production month (used in MasterPage + Welcome)
- `COMMISSION.dbo.TBL_MIS_SALES_AGENTS` — agent list (Business Tracking)
- `Doc_Arc_DB.dbo.TBL_MIS_CRM_DOCS` — document binary storage (Business Tracking upload)
- `AAR_RISK_DB.dbo.*` — all Risk Register tables
