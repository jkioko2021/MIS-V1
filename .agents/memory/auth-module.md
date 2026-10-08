---
name: Auth module
description: Account-scoped OTP policy and published-login diagnostics for the MIS app
---

## Authentication policy
Require email OTP only for the designated `admin` account. Other accounts use
username/password sign-in without OTP.

**Why:** After disabling project-wide OTP, the user explicitly chose to enable
it only for their admin account, not for all staff. This does not authorize
removing account locks, approval checks or required password changes.

**How to apply:** Apply OTP to the configured account only; do not send other
staff members' codes to its inbox. Configure the delivery address outside
memory, and never display development OTP codes in production as a workaround.


## Session revocation decisions

Scope account revocation to that employee and access-policy revocation to staff
using the affected profile, not to the whole organization. Logout affects only
the current session; self-service password change may return one replacement
session while invalidating all prior cookies.

**Why:** Staff security changes must take effect before JWT expiry without
interrupting unrelated staff. A global signing-key rotation is too broad, and
cookie clearing alone does not invalidate copied cookies.

**How to apply:** Keep server-side checks persistent and fail closed, including
when the database cannot verify a session. Do not introduce a revocation cache
that delays changes. Preserve the authorizing security snapshot across session
replacement so concurrent access changes cannot upgrade a stale cookie.

## Resend permission checks
A sending-only Resend key may reject domain-listing requests while still being
fully able to send login emails.

**Why:** Domain lookup returned a restricted-key authorization error, but a
delivery-check email was accepted using the same connection.

**How to apply:** Do not treat a failed domain lookup as proof that the email
connection needs reauthorization. Keep least-privilege sending access and
check the actual send operation and sender restrictions instead.

## Password Policy (from `crm.password_config`)
- min 8 chars, uppercase, numeric, special character required
- lockout after 3 failed attempts (`employee_locked = TRUE`)
- reset required after 30 days (`last_password_reset`)
- history tracked in `crm.password_history`

## Published login credentials
Do not store password values in memory or assume enrollment defaults match a
published account's current credentials.

**Why:** Live accounts can have changed passwords, and development account
records do not prove which accounts exist in the published database.

**How to apply:** Verify the deployment URL and available live account metadata.
Describe a source-defined enrollment default only as an unverified default,
never as a confirmed published password.

## Published login diagnostics
A successful publish and a guest `/auth/me` response do not verify database
connectivity. Diagnose login from deployment error logs before recommending
password resets.

**Why:** Guest session checks can return before touching the database; a
workspace-local database host can still fail DNS resolution in production.

**How to apply:** For published database connection failures, check production
database provisioning in Publishing. Let Publish manage runtime database
bindings; never fix this by hardcoding workspace connection details or adding
production schema creation to application startup.

## Route layout (Express)
`app.use("/api", router)` — so all router-level paths drop the `/api` prefix:
- Auth: `router.get("/auth/me")` → accessible at `/api/auth/me`
- MIS data: `router.get("/mis/business")` → accessible at `/api/mis/business`

**Why:** The platform proxy at port 80 forwards the full path to port 8080. Express strips `/api`. The Vite dev server proxies `/api/*` to `localhost:8080` (proxy added to vite.config.ts).

## Frontend API client (mis-api.ts)
`API_BASE = "/api"` and paths like `/mis/production-month` — Vite proxy takes `/api/mis/...` to port 8080.

## Key files
- `artifacts/api-server/src/routes/auth.ts` — auth routes
- `artifacts/api-server/src/lib/auth-middleware.ts` — JWT helpers + `requireAuth` middleware
- `artifacts/mis-v1/src/lib/auth-context.tsx` — `AuthProvider` + `useAuth` hook
- `artifacts/mis-v1/src/pages/login/index.tsx` — login/OTP/change-password (single page, step-driven)
- `artifacts/mis-v1/src/App.tsx` — `ProtectedRouter` guards all routes; shows login if no session
