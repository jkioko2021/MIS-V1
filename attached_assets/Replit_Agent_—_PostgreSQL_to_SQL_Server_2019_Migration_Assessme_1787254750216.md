# POSTGRESQL TO SQL SERVER 2019 — MIGRATION ASSESSMENT ONLY

## Objective

The existing Replit application currently uses:

- PostgreSQL
- Replit-managed PostgreSQL
- Node.js
- `pg` / `node-postgres`
- Drizzle ORM
- Raw parameterized SQL
- Connection pools
- Database transactions

The target database platform is Microsoft SQL Server 2019.

The SQL Server database will be hosted outside Replit and accessed securely through Cloudflare Tunnel.

IMPORTANT:

This is an ASSESSMENT ONLY.

DO NOT:

- modify application code
- modify package.json
- change dependencies
- change database configuration
- change DATABASE_URL
- modify the PostgreSQL database
- create the SQL Server database
- migrate data
- delete PostgreSQL
- remove PostgreSQL dependencies
- modify existing SQL Server databases
- run destructive commands

## Objective of this phase

Perform a complete technical assessment of the existing application and produce a detailed PostgreSQL-to-SQL Server 2019 migration plan.

The application must continue working exactly as it does today after this assessment.

---

# 1. Identify Database Architecture

Determine:

- PostgreSQL version if detectable
- `pg` / node-postgres version
- Drizzle version
- Node.js version
- current database connection implementation
- connection pool implementation
- transaction implementation
- database initialization code
- migration tooling
- seed data tooling
- schema files
- database scripts
- test database configuration

Identify all files involved in database access.

---

# 2. Identify Drizzle Usage

Inspect all Drizzle configuration and schema files.

Determine:

- Drizzle dialect
- schema location
- migration configuration
- migration files
- table definitions
- relations
- indexes
- constraints
- generated columns
- default values
- enums
- custom SQL
- raw SQL integrations

Determine which Drizzle features are PostgreSQL-specific.

Do not change them.

---

# 3. Identify node-postgres Usage

Search the complete repository for:

- `pg`
- `Pool`
- `Client`
- `pool.query`
- `client.query`
- `pool.connect`
- `BEGIN`
- `COMMIT`
- `ROLLBACK`
- prepared statements
- parameterized queries
- connection strings
- PostgreSQL environment variables

Produce a list of all affected files.

---

# 4. Inventory All SQL

Search the entire repository for SQL statements.

Identify all PostgreSQL-specific syntax including, but not limited to:

- `$1`, `$2`, `$3` parameter syntax
- `RETURNING`
- `ILIKE`
- `ON CONFLICT`
- `DO UPDATE`
- `DO NOTHING`
- `::type` casts
- `jsonb`
- JSONB operators
- PostgreSQL array syntax
- `ARRAY_AGG`
- `STRING_AGG`
- `FILTER`
- `DISTINCT ON`
- `generate_series`
- `NOW()`
- `CURRENT_TIMESTAMP`
- `CURRENT_DATE`
- `INTERVAL`
- PostgreSQL date arithmetic
- PostgreSQL string functions
- PostgreSQL-specific regular expressions
- PostgreSQL-specific UUID functions
- PostgreSQL-specific JSON functions
- PostgreSQL-specific window functions
- PostgreSQL-specific pagination
- PostgreSQL-specific locking syntax

For every occurrence provide:

1. file
2. function/module
3. SQL statement
4. PostgreSQL-specific feature
5. proposed SQL Server equivalent
6. migration risk

---

# 5. Inventory Database Schema

Generate a complete database inventory.

For every table identify:

- table name
- column name
- PostgreSQL data type
- nullable
- default
- primary key
- foreign key
- unique constraint
- check constraint
- identity/sequence
- index
- estimated row count if available

Identify:

- tables
- views
- indexes
- sequences
- functions
- triggers
- enums
- constraints
- extensions

---

# 6. Create Type Mapping

Produce a PostgreSQL-to-SQL-Server-2019 mapping for every data type currently used.

Pay particular attention to:

- numeric
- decimal
- money
- timestamps
- timezone-aware timestamps
- UUID
- JSONB
- arrays
- enums
- serial
- bigserial
- text
- boolean

Do not assume FLOAT is suitable for financial values.

Recommend appropriate DECIMAL precision and scale for monetary fields.

---

# 7. Identify Data Migration Risks

Identify fields and tables requiring special migration handling.

Pay particular attention to:

- identity values
- UUIDs
- foreign keys
- timestamps
- timezone handling
- NULL values
- numeric precision
- JSON
- arrays
- enums
- default values
- generated values
- sequences
- audit data

---

# 8. Identify Application Changes

Determine every application component that will need modification when PostgreSQL is replaced by SQL Server.

Categorize the changes:

### A. Database driver

Current:

`pg / node-postgres`

Required:

SQL Server-compatible driver.

### B. Drizzle

Determine whether the currently installed Drizzle version supports the required SQL Server architecture.

Do not change the version.

Only report the required change.

### C. Raw SQL

Identify every PostgreSQL-specific query that must be rewritten.

### D. Transactions

Identify all transaction implementations requiring conversion.

### E. Parameter binding

Identify all `$1`, `$2`, etc. parameterized queries requiring conversion.

### F. Error handling

Identify PostgreSQL-specific error codes or error handling.

### G. Pagination

Identify PostgreSQL-specific pagination queries.

---

# 9. Identify Authentication and Authorization Dependencies

Determine whether application authentication, authorization, sessions, roles, or permissions depend on PostgreSQL-specific behaviour.

Identify:

- users
- roles
- permissions
- sessions
- refresh tokens
- password records
- audit records

Do not modify anything.

---

# 10. Identify Background Jobs

Search for scheduled jobs, queues, workers, cron jobs, or background services that access PostgreSQL.

For each identify:

- job name
- source file
- SQL operations
- transaction requirements
- migration impact

---

# 11. Identify Reporting

Identify all reports, dashboards, analytics queries, exports, and aggregation queries that access PostgreSQL.

Pay particular attention to:

- complex joins
- aggregation
- date functions
- window functions
- JSON queries
- pagination
- sorting
- filtering

---

# 12. Produce Target Architecture

Propose the target architecture:

Replit Application
→ SQL Server Data Access Layer
→ local TCP listener
→ Cloudflare Tunnel
→ SQL Server 2019
→ eOxegen_Modern database

The existing legacy SQL Server repository must remain separate and untouched.

---

# 13. Produce SQL Server Database Plan

Design the proposed SQL Server database:

`eOxegen_Modern`

Provide:

- table list
- column mapping
- primary keys
- foreign keys
- indexes
- constraints
- views
- stored procedures if required
- reference data
- audit structures

Do not create the database yet.

---

# 14. Migration Strategy

Provide a phased migration plan:

PHASE 1
Assessment

PHASE 2
SQL Server schema generation

PHASE 3
SQL Server database creation

PHASE 4
Data migration

PHASE 5
Data validation

PHASE 6
Application SQL conversion

PHASE 7
Application integration testing

PHASE 8
Performance testing

PHASE 9
Production cutover

PHASE 10
Post-cutover monitoring

---

# 15. Validation Strategy

Define tests for:

- row counts
- primary keys
- foreign keys
- indexes
- constraints
- reference data
- users
- policies
- claims
- transactions
- financial totals
- reports
- workflows
- APIs
- authentication
- authorization

Where appropriate, provide SQL queries that can compare PostgreSQL and SQL Server results.

---

# 16. Rollback Strategy

Define how the application can be returned to PostgreSQL if SQL Server migration fails.

PostgreSQL must remain available until the migration has been formally approved.

---

# 17. Final Deliverable

Create:

`POSTGRESQL_TO_SQLSERVER_MIGRATION_ASSESSMENT.md`

The document must contain:

1. Executive summary
2. Current architecture
3. Database inventory
4. Drizzle assessment
5. node-postgres assessment
6. Raw SQL inventory
7. PostgreSQL-specific SQL inventory
8. Data type mapping
9. Schema conversion plan
10. Application code impact
11. Data migration strategy
12. Validation strategy
13. Security considerations
14. Performance considerations
15. Cloudflare connectivity requirements
16. Risks
17. Rollback plan
18. Phased implementation plan
19. Files requiring changes
20. Recommended next steps

Do not implement the migration in this phase.

Do not modify the existing application.

Do not modify PostgreSQL.

Do not modify any existing SQL Server database.