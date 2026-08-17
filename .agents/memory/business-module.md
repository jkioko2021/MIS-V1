---
name: Business Tracking module
description: Architecture and key decisions for the Business Tracking feature (BT)
---

# Business Tracking Module

## Key tables
- `crm.business_tracking` — main file record; `file_no` is PK (R-MM/YY/-XXXXXX or C-…)
- `crm.business_tracking_notes` — notes per file
- `crm.business_doc_checklist` — acknowledged docs (unique per file+req); has `upload_id` FK
- `crm.business_req` — 9 requirement definitions; `applies_to`: ALL, R (Retail), C (Corporate)
- `crm.business_uploads` — uploaded file metadata; `storage_key` = GCS object path

## Object Storage
- Provisioned via `setupObjectStorage()` in Aug 2026; bucket ID in `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- Server files: `artifacts/api-server/src/lib/objectStorage.ts`, `objectAcl.ts`, `routes/storage.ts`
- Zod schemas are INLINE in storage.ts (not from @workspace/api-zod — that package doesn't have them)
- Upload flow: POST /api/storage/uploads/request-url → PUT presigned URL (GCS) → POST /api/business/:fileNo/uploads
- Download: GET /api/storage/objects/<storage_key> — **currently NOT protected with requireAuth** (security gap)

## Upload endpoints (business.ts)
- `GET /business/:fileNo/uploads` — list uploads
- `POST /business/:fileNo/uploads` — record upload + auto-acknowledge requirement
- `DELETE /business/:fileNo/uploads/:uploadId` — soft-delete (no GCS deletion)

## Frontend pages
- `artifacts/mis-v1/src/pages/business/index.tsx` — unified list + BusinessSheet (680px side panel)
- Sheet tabs: Details | Documents (with Upload dialogs) | Notes
- `artifacts/mis-v1/src/lib/mis-api.ts` — all API methods incl. businessListUploads, businessRecordUpload

## Why: API server storage.ts uses requireAuth middleware (not passport/isAuthenticated)
The template used passport's isAuthenticated(); replaced with our JWT requireAuth. Always use requireAuth for new protected endpoints.
