# Risk Owner submission notifications

Successful department-register SUBMIT saves one notification alongside its workflow
change. Rejected or repeated submissions do not enqueue mail. Returning/reopening
and submitting a new assessment creates a new notification.

The email contains only the submitted department, reporting dates, submitting MIS
username, and instructions for Risk Management → Risk Register Review
(`/risk/review`). It contains no import batches, risks, causes, or review comments.
Owners with multiple departments receive a separate notice for each submission.
Signing in and existing department access checks remain required.

The background worker rechecks the original recipient against the current active,
approved, unlocked, non-deleted owner and active profile/department before sending.
Remapping the owner or ending that review stage cancels stale mail rather than
sending it to someone who no longer has access. A cancelled notice is not redirected
to another owner; the register remains visible to its current authorized owner.

## Email configuration and delivery reporting

Use the existing Resend connector and set `MIS_EMAIL_FROM` to a sender from a
verified Resend domain. No second connector or application API key is required.
Without that setting, mail remains `WAITING_CONFIGURATION`, and the saved
submission is still successful. Missing or invalid owner addresses appear as
`NO_RECIPIENT`. Local mode uses the established private local mail capture, not
external delivery.

The worker polls once a minute, locks outbox rows to prevent concurrent sends, and
uses a stable Resend idempotency key for each notification. Provider errors retry
at five-minute intervals, at most five attempts, then become `FAILED`. `SENT`
means provider acceptance, not proof of inbox delivery. Errors are generic:
recipient addresses, message contents, and provider response bodies are not logged.

Department Summary shows delivery status and errors within its existing
department scope, separately from workflow status. Reload that page to see updated
delivery state. Correcting a missing sender/address resumes pending work
automatically; exhausted failures remain explicit for investigation.

Apply `lib/db/migrations/0046_risk_review_notifications.sql` when upgrading an
existing database before running the updated API. It creates only the outbox and
index; it neither sends mail nor changes any register or account.

## Verification

`pnpm --filter @workspace/api-server test:risk-notifications` requires the
development `DATABASE_URL`. It uses synthetic accounts/departments within a
rolled-back transaction and a captured sender (no external mail). It checks
actual submission and scoped summary routes, multi-department recipient
isolation, duplicate/rejected submissions, authorization changes, stale review
availability, missing configuration/addresses, retry exhaustion, and submission
durability after failed delivery.
