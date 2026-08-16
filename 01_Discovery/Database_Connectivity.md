# Database Connectivity Validation

**Document ID:** ENV-002  
**Project:** MIS Modernization  
**Phase:** Discovery — Environment Validation  
**Date:** 2026-08-16  
**Mode:** READ-ONLY  
**Status:** BLOCKED — connectivity not established  

---

## 1. Target Database Endpoint

| Item | Value | Source | Classification |
|---|---|---|---|
| Hostname | internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com | replit.md §17 | CONFIRMED |
| Port | 1433 (SQL Server standard) | replit.md §17 | CONFIRMED |
| Environment type | TEST / NON-PRODUCTION | replit.md §17 | CONFIRMED |
| Provider | AWS RDS (SQL Server) | Hostname pattern | INFERRED |
| Region | eu-west-1 (Ireland) | Hostname | CONFIRMED |

---

## 2. Connectivity Test Results

### 2.1 DNS Resolution

| Method | Command | Result | Classification |
|---|---|---|---|
| `host` | `host internal-apps-db-test...` | FAILED — `host` not installed | BLOCKED |
| `nslookup` | `nslookup internal-apps-db-test...` | FAILED — `nslookup` not installed | BLOCKED |
| `dig` | `dig internal-apps-db-test...` | FAILED — `dig` not installed | BLOCKED |
| `ping` | `ping -c 1 internal-apps-db-test...` | FAILED — socket: Address family not supported | BLOCKED |

> **Result:** DNS resolution could not be attempted from the Replit environment. DNS tools (`host`, `nslookup`, `dig`) are not installed in the NixOS shell. ICMP ping is also blocked by the container networking model.

> **Classification:** BLOCKED — DNS resolution status UNKNOWN. Cannot determine whether the hostname resolves to a valid IP.

### 2.2 TCP Port 1433 Connectivity

| Method | Command | Result | Classification |
|---|---|---|---|
| bash TCP test | `echo >/dev/tcp/hostname/1433` with 10s timeout | PORT_CLOSED_OR_TIMEOUT | BLOCKED |

> **Result:** TCP connection to port 1433 timed out or was refused within the 10-second window.

> **Possible causes (cannot distinguish without further access):**
> 1. The Replit container's outbound network cannot reach the AWS RDS endpoint
> 2. AWS Security Group for the RDS instance does not permit inbound connections from Replit IP ranges
> 3. AWS VPC routing does not allow access from outside the VPC
> 4. The hostname does not resolve (DNS failure precedes TCP failure)
> 5. The RDS instance is stopped or not running

---

## 3. SQL Client Tools Assessment

### 3.1 Installed SQL Server Clients

| Tool | Status | Notes |
|---|---|---|
| `sqlcmd` | NOT INSTALLED | Microsoft SQL Server command-line tool |
| `tsql` | NOT INSTALLED | FreeTDS client |
| `isql` | NOT INSTALLED | unixODBC client |
| `mssql-scripter` | NOT INSTALLED | Python-based SQL Server scripter |
| `freetds-bin` | NOT INSTALLED | FreeTDS library and tools |

### 3.2 Python SQL Packages

| Package | Status | Notes |
|---|---|---|
| `pymssql` | NOT INSTALLED | Pure Python SQL Server client |
| `pyodbc` | NOT INSTALLED | ODBC-based SQL client |

### 3.3 Node.js SQL Packages

| Package | Status | Notes |
|---|---|---|
| `mssql` | NOT INSTALLED | Node.js SQL Server package |
| `tedious` | NOT CHECKED | Underlying TDS protocol implementation |

### 3.4 System Libraries

| Library | Status | Notes |
|---|---|---|
| FreeTDS (`libtds`) | NOT INSTALLED | Required by many SQL Server clients |
| unixODBC | NOT INSTALLED | ODBC driver manager |
| SQL Server ODBC Driver | NOT INSTALLED | Microsoft ODBC driver for SQL Server |

---

## 4. Credentials Assessment

### 4.1 Replit Secrets (DB-related)

| Secret | Status | Required |
|---|---|---|
| `DB_HOST` | NOT SET | YES — target RDS hostname |
| `DB_PORT` | NOT SET | YES — 1433 |
| `DB_NAME` | NOT SET | YES — database name(s) |
| `DB_USER` | NOT SET | YES — discovery read-only user |
| `DB_PASSWORD` | NOT SET | YES — discovery read-only password |

> **CONFIRMED:** No SQL Server credentials have been configured in the Replit Secrets store.

### 4.2 Replit Environment Variables Present (unrelated)

The following database-related environment variables ARE set but relate to **Replit's built-in PostgreSQL**, not the legacy SQL Server:

| Variable | Relates To |
|---|---|
| `DATABASE_URL` | Replit PostgreSQL (not SQL Server) |
| `PGHOST` | Replit PostgreSQL |
| `PGPORT` | Replit PostgreSQL |
| `PGDATABASE` | Replit PostgreSQL |
| `PGPASSWORD` | Replit PostgreSQL |
| `REPLIT_DB_URL` | Replit key-value store |

> These are the Replit platform database — they are **not related** to the legacy SQL Server discovery target.

---

## 5. AWS RDS Access Requirements

Based on the endpoint pattern and AWS RDS architecture, access from Replit to the test RDS instance will require at minimum:

| Requirement | Description | Status |
|---|---|---|
| VPC / Network routing | The RDS instance is inside an AWS VPC. External access requires either a public subnet with public accessibility enabled, or a VPN/tunnel | UNKNOWN — not verified |
| AWS Security Group | Inbound rule on TCP/1433 must permit the Replit outbound IP range | UNKNOWN — not verified |
| RDS Public Accessibility | The instance must have Public Accessibility enabled if accessed directly | UNKNOWN — not verified |
| DNS resolution | The hostname must resolve publicly or via VPN | UNKNOWN — cannot test |
| SQL Server login | A read-only SQL Server login must be provisioned for discovery | NOT CONFIGURED |
| TLS/SSL | replit.md §19 requires `Encrypt=True; TrustServerCertificate=False` | CONFIRMED — will apply |

---

## 6. Known Legacy Databases to Discover

Once connectivity is established, the following databases must be inventoried (per replit.md §23):

| Database | Status | Priority | Notes |
|---|---|---|---|
| CRM | TARGET — primary application database | CRITICAL | Stores business data, users, audit trail |
| SALES | TARGET — cross-DB queries from CRM | HIGH | Cross-DB joins confirmed in source code |
| MISREPORTS | TARGET — separate reporting database | HIGH | Located at 192.168.50.48 in legacy config |
| DATA_REPOSITORY_DB_CLAPI | TARGET — CLAPI data | HIGH | Cross-DB joins confirmed |
| AAR_RISK_DB | TARGET — risk data | MEDIUM | Listed in replit.md |
| AIMSOFT_DATADUMP | TARGET — Aimsoft integration | MEDIUM | Listed in replit.md |
| AIMSOFT_DATADUMP2023 | TARGET — Aimsoft 2023 data | MEDIUM | Listed in replit.md |
| COM_ACTIVITIES_DB | TARGET | MEDIUM | Listed in replit.md |
| COMMISSION | TARGET — commission calculations | HIGH | Listed in replit.md |
| DB_MASTER_AGENTS | TARGET — agent master data | HIGH | Listed in replit.md |
| DB_MASTER_RENEWAL | TARGET — renewal master data | HIGH | Listed in replit.md |
| DB_ONLINE_PORTAL | TARGET — online portal data | MEDIUM | Listed in replit.md |
| Doc_Arc_DB | TARGET — document archive | MEDIUM | Listed in replit.md |

> **NOTE:** Legacy web.config references MISREPORTS at IP `192.168.50.48` — this is a different host from the test RDS endpoint. Confirm whether MISREPORTS is available at the test RDS or remains at the internal IP.

---

## 7. Discovery Queries Prepared (Ready for When Connected)

The following query types are prepared to execute once connectivity is confirmed. All are READ-ONLY:

```sql
-- 1. List all databases
SELECT name, database_id, create_date, state_desc
FROM sys.databases
ORDER BY name;

-- 2. List all tables in a database
SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_SCHEMA, TABLE_NAME;

-- 3. List all stored procedures
SELECT SCHEMA_NAME(schema_id) AS schema_name, name, create_date, modify_date
FROM sys.objects
WHERE type = 'P'
ORDER BY name;

-- 4. Extract stored procedure definition
SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.StoredProcedureName')) AS definition;

-- 5. List all columns for a table
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE,
       CHARACTER_MAXIMUM_LENGTH, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TableName'
ORDER BY ORDINAL_POSITION;

-- 6. List all views
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.VIEWS
ORDER BY TABLE_NAME;

-- 7. List all functions
SELECT SCHEMA_NAME(schema_id) AS schema_name, name, type_desc
FROM sys.objects
WHERE type IN ('FN','IF','TF')
ORDER BY name;

-- 8. List all foreign keys
SELECT
    fk.name AS fk_name,
    OBJECT_NAME(fk.parent_object_id) AS parent_table,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS parent_column,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referenced_column
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
ORDER BY parent_table;

-- 9. Row counts for all tables
SELECT
    t.name AS table_name,
    p.rows AS row_count
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0, 1)
ORDER BY p.rows DESC;
```

---

## 8. Required Actions to Unblock Database Discovery

| # | Action | Owner | Priority |
|---|---|---|---|
| 1 | Confirm whether the RDS instance has public accessibility enabled | Infrastructure/DBA | CRITICAL |
| 2 | If not public — establish VPN or bastion host tunnel accessible from Replit | Infrastructure/DBA | CRITICAL |
| 3 | Add Replit outbound IP to the RDS Security Group inbound rules (TCP/1433) | AWS Admin | CRITICAL |
| 4 | Create a read-only SQL Server login for discovery (least privilege) | DBA | CRITICAL |
| 5 | Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in Replit Secrets | Project Admin | CRITICAL |
| 6 | Confirm MISREPORTS database availability at test RDS (vs. internal IP 192.168.50.48) | DBA | HIGH |
| 7 | After connectivity established: install pymssql (`pip install pymssql`) | Engineering Agent | HIGH |

---

## 9. Connectivity Status Classification

```
DATABASE CONNECTIVITY FAILED

Host:  internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com
Port:  1433

Failure Stage:  DNS / Network / Port
Classification: BLOCKED

Possible Failure Points:
  1. DNS — hostname may not be publicly resolvable
  2. Network — Replit container may not route to AWS eu-west-1
  3. Security Group — port 1433 not open to Replit IP range
  4. VPC — instance may not have public accessibility enabled
  5. Credentials — not configured (would be next failure point)

Required Action:
  DBA / Infrastructure team to provision access from Replit
  to the test RDS endpoint before database discovery can proceed.
```

---

*Document produced by: AI Engineering Agent — Environment Validation Phase*  
*No database modifications were made. No credentials were accessed or stored.*  
*All tests were read-only network probes.*
