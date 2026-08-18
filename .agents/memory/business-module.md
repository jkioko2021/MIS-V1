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
- `crm.admin_audit_trail` — all BT actions written here (BT_REGISTER, BT_UPDATE, BT_FORWARD, BT_UPLOAD, BT_DOC_COMPLETE, BT_DOC_INCOMPLETE)

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
- `GET /business/:fileNo/history` — audit trail entries (filters admin_audit_trail WHERE details LIKE '%fileNo%')
- `POST /business/:fileNo/mark-complete` — manual doc-complete toggle; writes BT_DOC_COMPLETE audit entry
- `POST /business/:fileNo/forward` — accepts `{ to_user?, comments? }`; records destination in audit detail

## Frontend pages
- `artifacts/mis-v1/src/pages/business/index.tsx` — unified list + BusinessSheet (680px side panel)
- Sheet tabs: Details | Documents (with Upload dialogs + Documentation Complete checkbox) | Notes | History
- History tab: reads audit trail via `GET /business/:fileNo/history`; empty for legacy-imported files (no API history)
- Forward button: opens Forward dialog (employee dropdown + comments), not a direct mutation
- `artifacts/mis-v1/src/lib/mis-api.ts` — all API methods incl. businessListUploads, businessRecordUpload, businessGetHistory, businessMarkComplete

## Corp/SME field mapping (spec vs implementation)
- "Business Category" → `corp_category` (SME/Medium/Large Corporate etc.)
- "Business (Coverage)" → `business` column (M=Medical, N=Non-Medical)
- "CR12 Reference No." → `cr12_ref` text (new column); "CR12 submitted" → `cr12` boolean
- GI Category: always visible (removed Non-Medical-only condition)
- Sector: always visible for Corp (inside isCorp block)
- Search: matches proposer_name, file_no, pay_ref_no, nid, pin_no

## Why: API server storage.ts uses requireAuth middleware (not passport/isAuthenticated)
The template used passport's isAuthenticated(); replaced with our JWT requireAuth. Always use requireAuth for new protected endpoints.
