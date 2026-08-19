---
name: Business Tracking module
description: Architecture and key decisions for the Business Tracking feature (BT)
---

# Business Tracking Module

## Key tables
- `crm.business_tracking` — main file record; `file_no` is PK (R-MM/YY/-XXXXXX or C-…)
  - Columns added: `cr12_ref VARCHAR(200)` (Corp CR12 reference text)
- `crm.business_tracking_notes` — notes per file
- `crm.business_doc_checklist` — acknowledged docs (unique per file+req); has `upload_id` FK
- `crm.business_req` — 9 requirement definitions; `applies_to`: ALL, R (Retail), C (Corporate)
- `crm.business_uploads` — uploaded file metadata; `storage_key` = GCS object path
- `crm.admin_audit_trail` — columns: `username`, `action_type`, `description`, `created_at` (NOT employee_id/action/details)

## Object Storage
- Provisioned via `setupObjectStorage()` in Aug 2026; bucket ID in `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- Server files: `artifacts/api-server/src/lib/objectStorage.ts`, `objectAcl.ts`, `routes/storage.ts`
- Upload flow: POST /api/storage/uploads/request-url → PUT presigned URL (GCS) → POST /api/business/:fileNo/uploads
- Download: GET /api/storage/objects/* — **requires auth** (requireAuth middleware added)

## Upload endpoints (business.ts)
- `GET /business/:fileNo/uploads` — list uploads
- `POST /business/:fileNo/uploads` — record upload + auto-acknowledge requirement
- `DELETE /business/:fileNo/uploads/:uploadId` — soft-delete + audit trail (BT_DOC_DELETE)
- `GET /business/:fileNo/history` — audit trail (uses columns: username, action_type, description)
- `POST /business/:fileNo/mark-complete` — manual doc-complete toggle; writes BT_DOC_COMPLETE audit entry
- `POST /business/:fileNo/forward` — status machine (see below); requires comments

## Race condition fix
- `generateFileNo` inlined inside `withTransaction` in the register route
- Uses `pg_advisory_xact_lock(1001)` for Retail, `pg_advisory_xact_lock(1002)` for Corp
- Lock held for duration of INSERT so concurrent registrations cannot collide
- `withTransaction` and `txQuery` helpers added to `artifacts/api-server/src/lib/postgres.ts`

## Forward status machine (mirrors legacy btnforward_Click)
Order of evaluation determines which status is set:
1. `medical_uw=TRUE AND allocated=FALSE` → "MEDICAL UW-REVIEW" (ready_for_update=FALSE)
2. `allocated=TRUE AND benefit_verified='NO'` → "BENEFIT VERIFICATION"
3. `allocated=TRUE AND benefit_verified≠'NO' AND invoiced=FALSE` → "ALLOCATED"
4. `invoiced=TRUE` → "INVOICED"
5. `walk_in_client='Y' AND to_user provided` → "ALLOCATED" (with allocated_to + benefit_verified='YES')
6. Default → "FORWARDED" (allocated=FALSE, ready_for_update=TRUE)

Forward gates: (1) is_complete must be TRUE, (2) no unacknowledged requirements, (3) comments required

## Legacy retail business rules applied
- Non-Medical Retail: NID + County + PIN + GI Category all required on save
- Walk-in: Membership Admin (allocated_to) required; allocated_to field shown in register mode when walk_in_client='Y'
- New Retail record defaults walk_in_client='Y' (matches legacy btnnew_Click behavior)
- Forward comments are mandatory (not optional)
- Forward dialog shows amber warning if Documentation Complete not ticked

## Registration UI workflow
- Retail and SME/Corp share a three-tab sheet: Details | Document Upload | Notes. History appears beneath Notes.
- A new record remains in the same sheet after its initial save; document uploads and notes become available once it has a file number.
- Documentation Complete and Forward stay fixed in the footer. Forward is unavailable until all document requirements are acknowledged and completion is confirmed.
- The registration footer must keep the save action visible. After a save, show the generated file number prominently in the open sheet header.

**Why:** The user selected a focused three-tab registration experience that preserves entered data while moving between stages, rather than a long continuous form.

**How to apply:** Keep the same tab order, retained in-sheet state, visible save footer, generated file-number badge, and fixed workflow controls for any future Retail or SME/Corp registration changes.

## Corp/SME field mapping
- "Business Category" → `corp_category` (SME/Medium/Large Corporate etc.)
- "Business (Coverage)" → `business` column (M=Medical, N=Non-Medical)
- "CR12 Reference No." → `cr12_ref` text (new column); "CR12 submitted" → `cr12` boolean
- GI Category: always visible (not Non-Medical-only gated)
- Sector: always visible for Corp

## Why: API server storage.ts uses requireAuth middleware (not passport/isAuthenticated)
The template used passport's isAuthenticated(); replaced with our JWT requireAuth. Always use requireAuth for new protected endpoints.
