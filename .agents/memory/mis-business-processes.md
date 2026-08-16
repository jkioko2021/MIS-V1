---
name: MIS Business Processes
description: Summary of business process reverse engineering output and key gaps blocking specification
---

## Processes Documented (BP-CAT-001, 2026-08-17)

16 processes across Authentication, User Admin, Business Tracking, Risk Register:
- BP-001: Login (license → credential → account state → OTP → session)
- BP-002: Password Change (forced or voluntary)
- BP-003: Self-Service Password Reset (generates plaintext email — security risk)
- BP-004: Account Unlock by Admin
- BP-005: Logout
- BP-006: New User Registration (default password = "password" — security risk)
- BP-007: User Approval / Maker-Checker (DEFECT: ApproveUserDetails always CanApprove=True)
- BP-008: Profile & Permission Management
- BP-009: New Business Registration (REGISTERED state, race condition on File_No)
- BP-010: Business File Forwarding (routing logic: med/benefit/allocated/invoiced/non-med)
- BP-011: Document Upload (binary in Doc_Arc_DB — must move to Object Storage)
- BP-012: Risk Registration (FIN-RNNN code, department-scoped, Compute_Risk_Values SP unknown)
- BP-013: Risk Review and Sign-Off (Submit→Review→Sign_off workflow, review pages unread)
- BP-014: Risk Dashboard (3 grids, heat map, 6 report types, Excel + Crystal Report export)
- BP-015: Commission Run (Settings trigger only, SP-driven — source in 2nd application)
- BP-016: Production Month Management (SALES.TBL_MIS_PROD_MONTHS, no admin screen found)

## Business Tracking State Machine (CONFIRMED states only)
REGISTERED → [Forward] → MEDICAL UW-REVIEW | BENEFIT VERIFICATION | ALLOCATED | INVOICED | FORWARDED
Further states after INVOICED: ❓ UNKNOWN (requires reading 34 BT sub-pages)

## Top Blocking Unknowns (BPU-UNK-001)
- 62 total unknowns; 14 P1
- BPU-BT-001: Complete File_Status state machine (post-INVOICED states unknown)
- BPU-INT-001: eOxegen integration method (direction confirmed; DB/API/ETL unknown)
- BPU-RISK-001: Risk scoring formula (Compute_Risk_Values SP body — DB access needed)
- BPU-INT-003: DATA_REPOSITORY_DB_CLAPI role in eOxegen data flow
- 16 modules with no source evidence (in 2nd application)

## Documents Produced
- 07_Business_Processes/Business_Process_Catalogue.md (BP-CAT-001) — 16 processes, full template
- 07_Business_Processes/Workflow_Catalogue.md (BP-WF-001) — condensed linear flows + state diagrams
- 07_Business_Processes/Business_Process_Unknowns.md (BP-UNK-001) — 62 unknowns by category

**Why:** Required for new system specification; all processes traceable to discovery evidence; no behaviour invented.
