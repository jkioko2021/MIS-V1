# MIS on Windows with Visual Studio Code and WSL

This runs the current React/TypeScript and Express application, not the legacy
ASP.NET/VB.NET application. Local mode uses your own PostgreSQL database, a private
disk document store, and a private email outbox. It does not disable authentication,
OTP, account approval, password expiry, or business authorization.

## 1. Tools

In Administrator PowerShell:

```powershell
wsl --install -d Ubuntu
```

Restart if requested and finish Ubuntu's user setup. Install Visual Studio Code
and Microsoft's WSL extension on Windows. Inside Ubuntu, install Node.js 22.12+
(Node.js 24 LTS is recommended), Git, and pnpm 10. Use a supported Node version
manager or the Node.js installation instructions rather than Ubuntu's potentially
older default Node package.

```bash
npm install -g pnpm@10
sudo apt update
sudo apt install git postgresql postgresql-contrib
sudo service postgresql start
```

Keep the project under `~/projects/MIS-V1`, not `/mnt/c/`, for filesystem
performance and Linux dependency compatibility. Open it from Ubuntu:

```bash
cd ~/projects/MIS-V1
code .
pnpm install --frozen-lockfile
pnpm local:init
```

Use the complete source ZIP provided with this guide, or clone GitHub only after
confirming the latest code was pushed. Never copy `node_modules` from Replit.
The workspace's dependency overrides are Linux-oriented; native Windows/macOS
installations are not supported by this guide.

## 2. Create an isolated local database

```bash
sudo -u postgres psql
```

In PostgreSQL's prompt:

```sql
CREATE ROLE mis_local LOGIN;
\password mis_local
CREATE DATABASE mis_local OWNER mis_local;
\q
```

Choose your own local password. Edit `.env.local` and replace the password
placeholder in `DATABASE_URL`. URL-encode special characters in that password.
Keep the generated `SESSION_SECRET` private; changing it invalidates local sessions.
Do not put your production or Replit database URL in this file. Local mode rejects
non-loopback databases and binds its services to loopback.

## 3. Choose one database setup

Use **either** the clean synthetic baseline below **or** an approved complete
backup. They are independent paths. Never run the clean bootstrap or replay the
historical migration directory over a restored or already-used database.

### Option A: Clean local database (no backup or real data)

After creating the empty database in section 2 and setting `.env.local`:

```bash
pnpm local:db:init
pnpm local:db:admin
pnpm local:check
```

`local:db:init` creates the complete schema used by the current application:
CRM/authentication, workflow queues/reviews/documents/notifications, legacy agent
joins, sales periods and risk tables. It seeds local role/menu permissions,
document catalogs, AML reasons, fictional sectors/intermediaries, and a current
test production/risk period. It creates **no employees, customers, files, risk
records, sessions or document bytes**. Role names and operational document labels
match the application's authorization/validation contracts; catalog IDs and test
business values are local, not a production configuration.

`local:db:admin` is a separate, explicit, interactive action. Choose and confirm
your own hidden password (12+ characters, uppercase, digit and special character,
maximum 72 UTF-8 bytes), then type `PROVISION`. It creates one approved, active
**Synthetic Local Administrator** with the configured `MIS_LOGIN_OTP_USERNAME`
(default `admin`), profile 1 (SuperAdmin), and the configured `@example.test`
email. No password is bundled, printed, accepted as a command-line argument, or
saved in `.env.local`. This is initial provisioning, not a reset: it refuses if
any employee already exists and does not update existing passwords or accounts.
Admin OTP, expiry, lockout, approval checks and session revocation remain enabled.

Both commands refuse Replit/production, remote database URLs and connection
override parameters. Bootstrap refuses a nonempty database, including an existing
CRM schema, and applies schema/security/reference data in one transaction. Failure
rolls everything back; retry on that same still-empty database after correcting
the cause. A successful second run is deliberately rejected, not silently
reseeded. To start over later, create a **new** local database and update the URL;
these commands do not delete or replace databases.

Create additional **fictional** staff through User Management with explicit,
unique test passwords and normal approval/activation. Useful profiles/departments:

| Work | Profile | Department |
| --- | --- | --- |
| Registration | Business Entry | LOCAL |
| BPO and allocation | BPO Review | BPO |
| Medical | Medical UW | MEDICAL UNDERWRITING |
| Pricing | Pricing | PRICING |
| Cashier | Finance | FINANCE |
| Record filing | DPU | DPU |
| General insurance | GI | NONMEDICAL |

The baseline intentionally contains no workflow staff. Empty reviewer/recipient
lists mean staff must be enrolled, not that authorization should be bypassed.
Newly enrolled accounts follow normal first-login password change requirements.
The synthetic administrator can use the existing administrative oversight paths.

### Option B: Restore an approved complete backup (existing workflow)

An empty database without Option A will not work. The numbered migrations extend an existing CRM
schema; they are not a complete initialization chain. Drizzle only describes part
of the database: do not use `drizzle-kit push` or `push-force` to initialize it.

Prefer an approved, sanitized development backup containing the complete schema,
reference catalogs, profiles, menus/access rights, and a usable approved account.
Do not export production data. A schema-only export avoids employee and business
records but requires a separate approved reference-data/account provisioning process.

If authorized to copy the DEVELOPMENT database, run this in Replit Shell:

```bash
mkdir -p generated-artifacts
pg_dump -Fc --no-owner --no-privileges --file=generated-artifacts/mis-development.dump "$DATABASE_URL"
```

This includes development records and password hashes. Review whether it contains
personal/business data before downloading or sharing it. Download the dump through
the workspace Files panel, keep it private, and never commit it. This command is
provided for you; no business data is exported automatically by the setup package.
The local document bytes are NOT included in a database dump.

On your computer, restore to the NEW local database:

```bash
pg_restore --host=127.0.0.1 --username=mis_local --dbname=mis_local \
  --no-owner --no-privileges --exit-on-error --single-transaction \
  /path/to/mis-development.dump
pnpm local:check
```

`pg_restore` asks for your local password. Do not add `--clean` to a database you
already use: that could destroy data. PostgreSQL client tools must be at least as
new as the source server for `pg_dump`; use a compatible server version locally.
Use a backup from the current application version. Do not replay every historical
migration over a current backup, since some contain data rewrites.

### Recent session-security migration

The latest source requires `crm.auth_sessions` and employee/profile session-version
columns. If your restored backup predates these changes and `local:check` reports
`auth_sessions` missing, apply this migration to YOUR LOCAL database only:

```bash
psql --host=127.0.0.1 --username=mis_local --dbname=mis_local \
  --set=ON_ERROR_STOP=1 --file=lib/db/migrations/0034_persistent_auth_sessions.sql
pnpm local:check
```

This adds session-revocation security and requires a fresh login for old sessions.
It does not reset account passwords or approvals. Other missing tables require
a complete baseline; do not guess by applying the whole migration directory.

`local:check` confirms connectivity, core tables, document metadata columns, and the configured OTP username.
It is not a full business-data or permission audit. Restored account passwords,
approval/lock status, profile permissions, and password expiry still apply. There
is no bundled default password or automatic administrator reset.

### Baseline verification and maintenance

The local bootstrap has an explicit ordered manifest in
`scripts/src/local-database.mjs`: `local-baseline/001_schema.sql`, the additive
document metadata migrations `0011_add_allocation_document_transaction_metadata.sql`
and `0036_aml_originating_system.sql`, the canonical
`0034_persistent_auth_sessions.sql` security migration, then
`local-baseline/002_reference_data.sql`. It never scans/replays the numbered
migration directory. The partial Drizzle models remain partial and are **not**
used to create this schema; do not run `push` or `push-force` on it.

With PostgreSQL 16+ tools (`initdb`, `pg_ctl`) on PATH, run:

```bash
pnpm --filter @workspace/api-server run build
node scripts/src/local-database.integration.mjs
node --test scripts/src/local-dev.test.mjs
```

Run these on your standalone development computer, not in a configured Replit
process. The integration check creates and removes its own temporary PostgreSQL
cluster on loopback and uses no existing database URL. It verifies clean start,
rollback/refusal safety, explicit admin provisioning without resets, menu parity,
password/OTP login, empty catalogs/queues, actual private document upload,
Retail BPO → allocation → AML gate → cashier → filing, Corporate custom-rate
Pricing, medical/HPC return, GI allocation and stale-session revocation. All test
staff, records, passwords, OTPs and documents are generated for that temporary run.
This is local PostgreSQL verification, not production SQL Server or a UI-browser
regression suite.

When database contracts change, update this local baseline and its integration
test separately from production/backup upgrades. Do not add employee/business
exports, credentials or automatic resets to the seed. The baseline is not a
sanitizer for backups and is never applied during server startup or deployment.

## 4. Build and run

When updating an existing local database for originating-system capture on AML
classifications, run `pnpm local:db:metadata`, then `pnpm local:check` before
running the updated API. The guarded repair applies only the two additive document
metadata migrations listed above, in one transaction. It adds nullable document metadata
and approved-value validation; it does not backfill or change original ratings,
proof-upload requirements, or handoff flags.

Replit development post-merge setup applies the same targeted manifest after
the partial ORM sync. It fails rather than hiding a missing CRM baseline.
This is not a general historical migration runner and is never run by API
startup or production deployment builds.

```bash
pnpm local:build
pnpm local:dev
```

Open **http://localhost:5173**. The API runs on **127.0.0.1:8080** and Vite proxies
`/api` to it. Use localhost consistently for cookies. Stop both services with Ctrl+C.
The API is built at launch; after backend changes, restart `local:dev`. Frontend
changes use Vite's normal hot reload.

The commands explicitly load `.env.local`; Replit workflows do not load it.
They refuse to run inside Replit or in production. Replit cloud email/storage
behavior remains the default when `MIS_LOCAL_DEV` is absent.

## 5. Local email and OTP

Only the configured OTP account (default `admin`) requires OTP, as in the existing
application. A successful password check captures its email privately on disk.
In a second WSL terminal:

```bash
pnpm local:mail
```

Read the code and enter it in the app. OTP expiry, attempts, replay protection,
and session revocation are unchanged. No development email is sent to real
recipients, even if your backup contains their email addresses. Medical notification
emails are also captured by the same outbox; an email marked sent locally means
captured, not delivered externally.

`.local-dev/mail/` may contain OTPs and personal information from workflow
notifications. It has restricted permissions and is excluded from Git/deployment.
Do not share outbox contents. Delete obsolete local messages when no longer needed.

## 6. Local documents

New documents are saved privately under `.local-dev/documents/`. Uploads retain the
existing two-step metadata + PUT flow, require a signed-in account, use signed
15-minute owner-bound upload tickets, cannot overwrite a used ticket, and are
limited to 25 MiB. Download through each business/review page so the existing
file/role checks apply. The generic object-download URL is disabled in local mode.

A database backup contains document metadata, not Replit cloud files. Old documents
therefore report unavailable locally until transferred through an approved process.
Do not claim all restored documents are present or point local mode at cloud storage.
Back up the local database and documents together if you need to preserve new work.

## 7. Visual Studio Code tasks and debugging

Use **Terminal → Run Task → MIS: run locally** or **MIS: compile**.
To debug the API, run `pnpm local:debug` and select
**Run and Debug → MIS: attach to local API**. Its inspector listens only on loopback
port 9229. For frontend breakpoints, use **MIS: debug frontend** (Edge).

## Troubleshooting

- **Missing tables:** use Option A on a new empty database or restore a complete
  current approved backup with Option B, not just the numbered migration directory.
- **Login fails:** verify the restored account is approved/active, unlocked, and
  has an active profile; use its existing password. Complete password expiry resets.
- **No OTP:** check the configured username, then `pnpm local:mail`. Never disable
  OTP or alter approval checks to work around an account configuration problem.
- **Ports busy:** stop the other application using 5173/8080, then restart.
- **PostgreSQL stopped after Windows reboot:** `sudo service postgresql start`.
- **Missing document:** restored metadata alone does not restore cloud bytes.
- **Native package failures:** open the folder using VS Code's WSL connection and
  reinstall dependencies in Ubuntu, not in Windows PowerShell.
- **Legacy SQL Server discovery:** requires separate network access and credentials;
  it is not required for normal PostgreSQL-backed local MIS operation.
