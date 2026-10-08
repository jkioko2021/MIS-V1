---
name: Auth module
description: Authentication implementation decisions for the MIS app (JWT, bcrypt, OTP flow)
---

## Auth Flow
Two-step: credentials → 6-digit OTP → JWT session cookie (`mis_session`, httpOnly, 8h expiry).
A short-lived **temp token** (5 min JWT, `{ temp: true }`) bridges the login and OTP steps so the employee ID is verified without issuing a full session.

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

## Dev OTP
`NODE_ENV !== production` → `devOtp` field returned in login response; shown in amber banner on OTP step.
