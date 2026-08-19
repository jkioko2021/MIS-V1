# Replit Agent Prompt — Retail and SME/Corporate Business Tracking

## PRIMARY OBJECTIVE

Modernize and build the two existing Business Tracking pages:

1. `Business_Tracking_Retail.aspx`
2. `Business_Tracking_SME_Corp.aspx`

The new implementation must provide a **modern, responsive and consistent user experience** while preserving the existing business rules, database relationships, workflows and functionality.

The Retail and SME/Corporate pages should use a **shared Business Tracking design and reusable components**, but must retain their different fields, data rules and business behavior.

---

# 1. CRITICAL OPERATING RULES

Before changing anything:

- Inspect the two existing ASPX pages.
- Inspect their VB.NET code-behind files.
- Identify all event handlers.
- Identify all DAL/BLL methods used.
- Identify all stored procedures and SQL queries.
- Identify all database tables involved.
- Identify document storage and retrieval logic.
- Identify workflow/Forward logic.
- Identify search, Save, Edit, New and Delete logic.
- Identify dynamically populated ComboBoxes.

## DO NOT

- Rewrite the entire repository.
- Modify unrelated modules.
- Change database schema unnecessarily.
- Delete existing business logic because it appears old.
- Create duplicate database tables.
- Create duplicate APIs.
- Guess database relationships.
- Replace working workflows without understanding them.
- Hard-code dynamically populated lists.
- Change existing database codes/values.
- Upgrade frameworks or libraries unless explicitly requested.

Work only on functionality required for these two pages and their direct dependencies.

---

# 2. EXISTING PAGES

## Retail

Existing page:

`Business_Tracking_Retail.aspx`

Code-behind:

`Business_Tracking_Retail.aspx.vb`

Page title:

**RETAIL BUSINESS TRACKING**

## SME/Corporate

Existing page:

`Business_Tracking_SME_Corp.aspx`

Code-behind:

`Business_Tracking_SME_Corp.aspx.vb`

Page title:

**CORPORATE/SME BUSINESS TRACKING**

---

# 3. SHARED DESIGN

Both pages must use the same modern UI design system.

Use:

- Responsive layout
- Clean cards/sections
- Consistent labels
- Consistent form controls
- Clear required-field indicators
- Modern buttons
- Responsive grids
- Search/filter controls
- Toast/inline success and error messages
- Consistent spacing
- Consistent typography
- Accessible controls
- Desktop/tablet/mobile layouts

Do not retain the old fixed-width layout such as:

- 1176px
- 1170px
- 1146px
- 1132px

Do not use deeply nested HTML tables for page layout.

Use responsive CSS/layout components.

---

# 4. COMMON PAGE STRUCTURE

Both pages should follow this structure:

```text
Business Tracking
│
├── Search
│
├── Details
│
├── Business / Payment Information
│
├── Tracking Records
│
├── Documents
│
└── Notes & Workflow
```

Recommended UI:

```text
┌──────────────────────────────────────────────────────────┐
│ BUSINESS TRACKING                                         │
│                                                          │
│ Search By [Proposer Name ▼] [Search...............]      │
│                                  [Search]                │
├──────────────────────────────────────────────────────────┤
│ DETAILS                                                   │
│                                                          │
│ [Page-specific fields]                                   │
│                                                          │
│                    [Save] [Edit] [New]                   │
├──────────────────────────────────────────────────────────┤
│ TRACKING RECORDS                                         │
│                                                          │
│ [Search/Filter]                                          │
│                                                          │
│ Tracking Grid                                             │
├──────────────────────────────────────────────────────────┤
│ DOCUMENTS                                                │
│                                                          │
│ Document Type [........▼] File [Choose File] [Upload]    │
│                                                          │
│ Document Grid                                             │
├──────────────────────────────────────────────────────────┤
│ NOTES & WORKFLOW                                         │
│                                                          │
│ Notes [..............................................]   │
│                                                          │
│ [Documentation Complete] [Forward]                       │
│                                                          │
│ Notes History                                             │
└──────────────────────────────────────────────────────────┘
```

---

# 5. SEARCH — BOTH PAGES

Existing control:

`cbosearch`

Values:

- Proposer Name → `P`
- File No. → `F`

Default:

- Proposer Name

Existing control:

`txtsearch`

Existing button:

`btnsearch`

Requirements:

- Search by Proposer Name.
- Search by File No.
- Allow Enter key to search.
- Allow clear/reset.
- Provide loading indication.
- Preserve existing search logic.
- Do not change search results/business rules.
- Avoid unnecessary database calls.

Where appropriate, use server-side filtering.

---

# 6. RETAIL PAGE

## Page

`Business_Tracking_Retail.aspx`

The Retail page must remain specifically designed for Retail business.

---

## RETAIL — PROPOSER DETAILS

### Walk-in Client

Existing:

`chkwalkin`

Label:

**Walk-in Client (Customer Service Only)**

Preserve the existing behavior and rules.

Do not automatically make this available to SME/Corporate unless the existing business logic confirms it is shared.

---

### Receive Date

Control:

`dtreceivedate`

Existing behavior:

- Disabled/read-only

Preserve existing date-generation logic.

---

### Proposer Name

Control:

`txtProposer`

Required where applicable.

---

### NID

Control:

`txtNID`

Label:

**NID**

Preserve existing data type and validation.

---

### Client Type

Control:

`cboclient`

Current value:

- Retail → `R`

Do not change the underlying value.

Display:

**Retail**

---

### PIN

Control:

`txt_PIN`

Label:

**PIN NO**

Preserve existing database mapping.

---

### Agent/Broker

Control:

`cboagent`

This is dynamically populated.

Do not hard-code values.

Inspect the existing data source and reuse it.

Because the list may be large, provide searchable/filterable selection.

---

### County

Control:

`cboCounty`

The current ASPX contains:

- Retail → `R`

IMPORTANT:

Do not assume that `Retail` is actually a County.

Inspect the VB.NET code-behind and database before changing this list.

If County is dynamically populated elsewhere, retain that implementation.

Do not alter existing data values without confirmation.

---

# 7. RETAIL — BUSINESS DETAILS

### Business

`cboBUS`

Values:

- Blank
- Medical → `M`
- Non Medical → `N`

---

### GI Category

`cboGI_Cat`

Values:

- Blank
- Non-Motor → `Non_Motor`
- Motor → `Motor`

---

### Business/Action Type

`cboBusiness`

Preserve:

- Blank
- New → `N`
- Renewal → `R`
- Addon → `A`
- Termination → `T`
- Reinstatement → `RT`
- Category Change → `CC`
- Premium Recon → `PR`
- Nill_Endr → `NE`
- Fund_Topup → `FT`
- Suspension → `SU`
- Lift Suspension → `LS`

Do not change underlying values.

---

### Card Type

`cboCard`

Values:

- Blank
- MTIBA → `MTIBA`
- SMART → `SMART`

---

# 8. RETAIL — PAYMENT

### Total Paid Amount

Control:

`txtpaid`

Requirements:

- Numeric only
- Proper currency/number formatting
- Prevent invalid negative values unless existing business rules allow them
- Preserve existing database precision

---

### Payment Mode

`cboPayment`

Values:

- MPESA → `MPESA`
- EFT → `EFT`
- CHEQ → `CHEQ`
- IPF → `IPF`

Preserve these values.

---

# 9. RETAIL — ALLOCATION

Control:

`cboAllocate`

Label:

**Allocate To**

This is Retail-specific unless inspection proves otherwise.

Requirements:

- Determine where the list is populated.
- Reuse existing source.
- Provide search/filter.
- Do not hard-code users.
- Respect existing allocation rules.
- Preserve existing database mapping.

---

# 10. SME/CORPORATE PAGE

## Page

`Business_Tracking_SME_Corp.aspx`

Page title:

**CORPORATE/SME BUSINESS TRACKING**

This page must remain separate from Retail logically even though the UI is shared.

---

# 11. SME/CORPORATE — PROPOSER DETAILS

### Receive Date

`dtreceivedate`

Preserve existing behavior.

---

### Proposer Name

`txtProposer`

---

### CR12

`txtCR12`

Label:

**CR12**

Preserve existing database mapping and validation.

---

### Client Type

`cboclient`

Values:

- Blank
- SME → `S`
- CORPORATE → `C`

Do not replace these with Retail.

---

### County

`cboCounty`

Inspect the existing population/data logic before modifying.

---

### Business Category

`cboCategory`

Values:

- Blank
- Public → `Public`
- Private → `Private`

---

### Sector

`cboSector`

Dynamically populated.

Do not hard-code.

Provide search/filter for large lists.

---

# 12. SME/CORPORATE — BUSINESS DETAILS

### Business

`cboBUS`

Values:

- Blank
- Medical → `M`
- Non Medical → `N`

---

### GI Category

`cboGI_Cat`

Values:

- Blank
- Non-Motor → `Non_Motor`
- Motor → `Motor`

---

### Agent/Broker

`cboagent`

Dynamically populated.

Retain existing lookup logic.

---

### Business/Action Type

`cboBusiness`

Values:

- Blank
- New → `N`
- Renewal → `R`
- Addon → `A`
- Termination → `T`
- Reinstatement → `RT`
- Category Change → `CC`
- Premium Recon → `PR`
- Nill_Endr → `NE`
- Fund_Topup → `FT`
- Suspension → `SU`
- Lift Suspension → `LS`

---

### Card Type

`cboCard`

Values:

- Blank
- MTIBA → `MTIBA`
- SMART → `SMART`

---

# 13. SME/CORPORATE — PAYMENT

### Total Paid Amount

`txtpaid`

Numeric.

Preserve existing database behavior.

---

### Payment Mode

`cboPayment`

Values:

- MPESA
- EFT
- CHEQ
- IPF

---

# 14. SHARED SAVE / EDIT / NEW

Existing controls:

- `btnsave`
- `btnedit`
- `btnnew`

## Save

Must:

1. Validate required fields.
2. Validate business rules.
3. Save using existing database/business logic.
4. Return success/failure.
5. Refresh tracking records.
6. Preserve File No.
7. Prevent duplicate submissions.

## Edit

Must:

1. Select existing record.
2. Load complete record.
3. Populate every applicable field.
4. Allow authorized editing.
5. Save changes using existing business logic.

## New

Must:

1. Clear current record.
2. Reset fields.
3. Reset validation.
4. Reset appropriate ComboBoxes.
5. Prepare for new record.

Do not accidentally clear configuration lists.

---

# 15. TRACKING GRID — BOTH PAGES

Existing:

`GDTracking`

Columns:

- Select
- Receive Date
- File No.
- Proposer Name
- Client Type
- Business Type
- Status
- Delete

Existing key:

`File_No`

Requirements:

- Responsive
- Sortable
- Pageable
- Searchable/filterable
- Clear status badges
- Select action
- Delete confirmation
- Appropriate authorization

Do not change the database key.

---

# 16. DOCUMENT MANAGEMENT — BOTH PAGES

Existing controls:

`cbodocs`

`FL1`

`btnupload`

`GD_DOCS`

The existing page allows related documents to be attached as a ZIP file.

Preserve this functionality.

---

## Document Selection

`cbodocs`

This is dynamically populated.

Do not hard-code document types.

---

## Upload

`FL1`

`btnupload`

Requirements:

- Validate selected document type.
- Validate file exists.
- Validate allowed extension.
- Validate size.
- Validate upload security.
- Associate document with current File No.
- Preserve existing storage implementation.
- Display upload status.
- Refresh document list after successful upload.

Do not expose physical storage paths.

---

# 17. DOCUMENT GRID

Existing:

`GD_DOCS`

Fields:

- DOC_ID
- File_No
- Doc_Title
- Doc_Date
- File_Name
- Upload_By
- Delete

Modernize the grid.

Where existing functionality supports it, provide:

- View
- Download
- Delete

Do not invent document retrieval logic.

Inspect and reuse existing implementation.

---

# 18. NOTES

Existing:

`txtcomment`

Modernize into a proper Notes section.

Requirements:

- Multiline input
- Clear label
- Character limit if existing database requires one
- Save according to existing workflow

---

# 19. DOCUMENTATION COMPLETE

Existing:

`chkassembly`

Label:

**Documentation Complete**

Preserve existing behavior.

The Forward operation must respect this status.

---

# 20. FORWARD WORKFLOW

Existing:

`btnforward`

Before forwarding:

- Validate File No.
- Validate required business data.
- Validate required documentation.
- Validate Documentation Complete where required.
- Preserve existing workflow transitions.
- Preserve existing status changes.
- Preserve existing notes behavior.
- Display meaningful errors.

Do not invent new workflow states.

---

# 21. NOTES HISTORY

Existing:

`GDNOTES`

Columns:

- Note Date
- File No.
- From
- Notes

Modernize the presentation but preserve the existing data source.

---

# 22. COMBOBOX FILTERING

All large/dynamic ComboBoxes should support filtering.

At minimum:

- Agent/Broker
- Sector
- Allocate To
- Documents

Use:

**Contains**

or equivalent search behavior.

Do not load unnecessary records.

If server-side filtering exists, retain it.

Do not retrieve the entire database table merely to populate a dropdown.

---

# 23. FIELD VALIDATION

Implement clear validation.

### Retail

Validate applicable:

- Proposer Name
- NID/PIN where required
- Client Type
- Agent/Broker where required
- Business
- GI Category where required
- Business/Action Type
- Payment Mode
- Total Paid Amount
- Allocate To where required

### SME/Corporate

Validate applicable:

- Proposer Name
- CR12 where required
- Client Type
- Business Category
- Sector
- Agent/Broker
- Business
- GI Category
- Business/Action Type
- Payment Mode
- Total Paid Amount

Do not introduce validation that conflicts with existing business rules.

---

# 24. RETAIL VS SME/CORPORATE DIFFERENCES

The implementation must explicitly preserve these differences.

| Feature | Retail | SME/Corporate |
|---|---|---|
| Client Type | Retail `R` | SME `S`, Corporate `C` |
| Walk-in Client | Yes | No |
| NID | Yes | No |
| PIN NO | Yes | No |
| CR12 | No | Yes |
| Business Category | No | Yes |
| Sector | No | Yes |
| Allocate To | Yes | Verify existing logic |
| Agent/Broker | Yes | Yes |
| Business | Yes | Yes |
| GI Category | Yes | Yes |
| Business/Action Type | Yes | Yes |
| Card Type | Yes | Yes |
| Payment | Yes | Yes |
| Documents | Yes | Yes |
| Notes | Yes | Yes |
| Forward | Yes | Yes |

Do not force fields from one page into the other.

---

# 25. SHARED COMPONENT ARCHITECTURE

Where the Replit application architecture supports reusable components, create shared components for:

- Business Tracking Header
- Search
- Form field layout
- Business/Payment section
- Action buttons
- Tracking grid
- Document upload
- Document grid
- Notes
- Notes history
- Forward workflow
- Validation messages

Then provide page-specific configurations for:

### Retail

```text
RetailBusinessTrackingConfig
```

### SME/Corporate

```text
SMECorporateBusinessTrackingConfig
```

The shared components should not contain hard-coded Retail or Corporate assumptions.

---

# 26. DATA AND DATABASE

Before creating any new database object:

Determine:

- Existing tables
- Existing stored procedures
- Existing views
- Existing queries
- Existing relationships
- Existing document tables
- Existing notes tables
- Existing workflow tables

Prefer existing database objects.

Do not create duplicate tables.

Do not change existing database columns.

Do not change existing codes.

---

# 27. SECURITY

Preserve existing authentication and authorization.

Protect:

- Save
- Edit
- Delete
- Upload
- Forward
- Allocation

Use server-side authorization.

Use parameterized database operations.

Do not expose:

- Connection strings
- Passwords
- Database credentials
- Physical file paths

---

# 28. PERFORMANCE

Performance is important.

Avoid:

- Loading entire database tables
- Rebinding grids unnecessarily
- Repeated database calls
- Loading all documents into memory
- Loading huge ComboBox datasets
- Repository-wide changes

Use:

- Pagination
- Server-side filtering
- Parameterized queries
- Existing stored procedures
- Efficient queries
- Cached static configuration where appropriate

---

# 29. RESPONSIVE DESIGN

Desktop:

Two-column form layout.

Tablet:

Two-column layout where space allows.

Mobile:

Single-column layout.

Tracking grids should support:

- Horizontal scrolling where unavoidable
- Responsive column prioritization
- Search/filter controls
- Pagination

Do not allow the entire page to overflow horizontally because of fixed-width legacy controls.

---

# 30. UX REQUIREMENTS

Use clear states:

### Loading

Show:

**Loading...**

### Success

Example:

**Record saved successfully.**

### Error

Example:

**Unable to save the record. Please correct the highlighted fields.**

### Upload Success

Example:

**Document uploaded successfully.**

### Upload Error

Example:

**Document upload failed. Please check the file and try again.**

Avoid displaying raw database exceptions to users.

---

# 31. DELETE CONFIRMATION

For tracking and documents:

Show a confirmation before deletion.

Example:

**Are you sure you want to delete this record?**

Do not bypass existing authorization.

Do not automatically delete related records unless that is already the existing business rule.

---

# 32. MIGRATION / COMPATIBILITY

If the current Replit project is already a modern application:

Do not recreate the entire application.

Instead:

1. Identify existing architecture.
2. Identify routing.
3. Identify existing components.
4. Identify existing API/data layer.
5. Reuse existing services.
6. Add only the required pages/components.
7. Preserve existing conventions.

If the application is still directly using the legacy ASPX pages, first determine the appropriate migration approach before replacing the page.

---

# 33. IMPLEMENTATION PHASES

## Phase 1 — Discovery

Inspect only the relevant files.

Produce:

- File dependency map
- Database dependency map
- Event handler map
- Data source map
- Workflow map

Do not modify files during discovery.

---

## Phase 2 — Shared UI

Create the common Business Tracking layout and components.

Do not connect new functionality yet.

---

## Phase 3 — Retail

Implement:

- Retail fields
- Retail validation
- Retail business rules
- Retail search
- Retail Save/Edit/New
- Retail grid
- Retail documents
- Retail notes
- Retail Forward
- Retail allocation

---

## Phase 4 — SME/Corporate

Implement:

- SME/Corporate fields
- SME/Corporate validation
- SME/Corporate business rules
- SME/Corporate search
- SME/Corporate Save/Edit/New
- SME/Corporate grid
- Documents
- Notes
- Forward

---

## Phase 5 — Integration

Connect both pages to the existing:

- Database
- APIs
- Business logic
- Document storage
- Workflow

---

## Phase 6 — Testing

Test both pages independently.

Do not assume that because Retail works, SME/Corporate works.

---

# 34. TEST MATRIX

## Retail

- [ ] Open Retail page
- [ ] Search by proposer
- [ ] Search by File No.
- [ ] Create new Retail record
- [ ] Save
- [ ] Edit
- [ ] New/reset
- [ ] Walk-in Client
- [ ] NID
- [ ] PIN
- [ ] Agent/Broker
- [ ] County
- [ ] Business
- [ ] GI Category
- [ ] Business/Action Type
- [ ] Card Type
- [ ] Payment
- [ ] Allocate To
- [ ] Upload document
- [ ] View document
- [ ] Delete document
- [ ] Add note
- [ ] Documentation Complete
- [ ] Forward
- [ ] Delete tracking record

## SME/Corporate

- [ ] Open SME/Corporate page
- [ ] Search by proposer
- [ ] Search by File No.
- [ ] Create new record
- [ ] Save
- [ ] Edit
- [ ] New/reset
- [ ] CR12
- [ ] Client Type
- [ ] County
- [ ] Business Category
- [ ] Sector
- [ ] Agent/Broker
- [ ] Business
- [ ] GI Category
- [ ] Business/Action Type
- [ ] Card Type
- [ ] Payment
- [ ] Upload document
- [ ] View document
- [ ] Delete document
- [ ] Add note
- [ ] Documentation Complete
- [ ] Forward
- [ ] Delete tracking record

---

# 35. ACCEPTANCE CRITERIA

The implementation is complete only when:

- [ ] Retail page is modern and responsive.
- [ ] SME/Corporate page is modern and responsive.
- [ ] Both pages share a consistent UI.
- [ ] Shared components are reused where appropriate.
- [ ] Retail-specific fields remain Retail-specific.
- [ ] SME/Corporate-specific fields remain SME/Corporate-specific.
- [ ] Existing ComboBox values/codes are preserved.
- [ ] Dynamic ComboBoxes continue using their existing sources.
- [ ] Search works.
- [ ] Save works.
- [ ] Edit works.
- [ ] New works.
- [ ] Tracking grids work.
- [ ] Documents work.
- [ ] Notes work.
- [ ] Documentation Complete works.
- [ ] Forward workflow works.
- [ ] Delete works according to existing rules.
- [ ] Existing database relationships remain intact.
- [ ] Existing business rules remain intact.
- [ ] Existing authentication remains intact.
- [ ] No unnecessary database tables are created.
- [ ] No unrelated modules are modified.
- [ ] No unnecessary repository-wide refactoring is performed.
- [ ] Performance is acceptable.
- [ ] Validation is implemented.
- [ ] Errors are handled gracefully.

---

# 36. FINAL REPLIT AGENT REPORT

At completion, provide:

### Files Changed

List every modified file.

### Files Added

List every new file.

### Database Objects

List:

- Tables used
- Views used
- Stored procedures used
- APIs used

### Shared Components

List components shared between Retail and SME/Corporate.

### Retail-Specific Components

List Retail-specific implementation.

### SME/Corporate-Specific Components

List SME/Corporate-specific implementation.

### Functionality Preserved

List existing functionality verified.

### New Functionality

List improvements introduced.

### Testing

List tests completed and results.

### Issues

List unresolved issues.

### Recommendations

List only recommendations directly relevant to these pages.

---

# FINAL INSTRUCTION

The priority is:

**PRESERVE FUNCTIONALITY → UNDERSTAND EXISTING DATABASE/BUSINESS LOGIC → REUSE WHERE POSSIBLE → MODERNIZE UI → IMPLEMENT CAREFULLY → TEST BOTH PAGES**

Do not sacrifice existing business functionality for visual redesign.

Do not make assumptions about the database.

Do not modify unrelated parts of the application.

Do not perform broad repository scans or rewrites unless a direct dependency requires it.