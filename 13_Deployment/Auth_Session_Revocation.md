# Persistent authentication sessions

## Explicit rollout

Apply both migrations below, **in this order**, to each environment's existing
PostgreSQL database **before** releasing the updated API. Migration 0033 creates
the persistent OTP challenge table required by admin sign-in; migration 0034
adds persistent sessions and security-version triggers:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f lib/db/migrations/0033_admin_login_otp.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f lib/db/migrations/0034_persistent_auth_sessions.sql
```

Use the target environment's secure database binding; do not copy credentials
into code or output. Both migrations are safe to reapply; 0034 is transactional.
Stop the rollout if either command fails. Verify that both
`crm.login_otp_challenges` and `crm.auth_sessions` exist before releasing the API.
The API does not migrate at startup. All pre-rollout cookies lack a persistent session
ID and require a fresh login. Admin still requires email OTP; other staff still
authenticate with passwords.

Employee security changes and profile/access changes increment persistent
versions atomically through database triggers. Authenticated endpoints check the
session row, expiry, account state and versions on every request, without a
revocation cache. Unavailable verification returns 503 and never grants access.
Logout revokes only the current session. A successful self-service password
change revokes all previous sessions and returns one replacement cookie.
Requests already authorized before a security change may finish; the next
authorization check rejects their stale cookies.

## Targeted development validation

After applying **0033 and then 0034** and restarting the managed API workflow:

```sh
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server exec node test/session-revocation.integration.mjs
pnpm --filter @workspace/api-server exec node test/password-login.integration.mjs
pnpm --filter @workspace/api-server exec node test/scoped-otp.integration.mjs
```

Tests use synthetic development employees only and remove their fixtures.
Do not execute fixture scripts against production.

## Rollback and retention

Leave the schema in place if rolling back code. Reverting to an API that accepts
signature-only JWTs restores the original security gap; prefer rolling forward.
Expired and revoked rows are retained until a separate retention job is adopted.
Deleting expired session rows cannot restore authorization; never delete live
rows unless intending to sign those users out.
