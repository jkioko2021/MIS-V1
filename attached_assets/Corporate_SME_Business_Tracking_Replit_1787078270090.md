# CORPORATE/SME BUSINESS TRACKING — REPLIT IMPLEMENTATION SPECIFICATION

## Purpose

Use the supplied legacy screenshot as the authoritative UI reference for the **CORPORATE/SME BUSINESS TRACKING** page.

The objective is to rebuild this page in the new application while ensuring that **every visible field, control, grid column, document function, note, workflow action and business value is captured and persisted**.

Do not simplify the page by removing fields. First identify and map every legacy field to the new application and database.

---

## 1. Page Title

Create the page:

**CORPORATE/SME BUSINESS TRACKING**

The page must support:

- New record
- Save record
- Edit record
- Search record
- View existing record
- Upload documents
- Add notes
- Mark documentation complete
- Allocate/forward workflow
- View history
- Audit changes

---

## 2. Search Section

At the top of the page reproduce the search functionality.

Fields:

- **Search By** dropdown
- **Search Value** textbox
- **Search** button

Search By should support relevant identifying fields, including:

- File No
- Proposer Name
- CR12
- Receive Date
- Client Type
- Agent/Broker
- Business
- Status

Search results must allow the user to select a record and load the **complete record**, including all proposer information, documents, notes and workflow information.

---

## 3. Proposer Details

Create the main section:

**Proposer Details**

The following fields are mandatory for the new implementation because they are visible on the legacy page.

### Left-hand fields

#### 1. Proposer Name

- Textbox
- Persist to database
- Editable

#### 2. Client Type

- Dropdown
- Values must come from master/reference data

#### 3. Business Category

- Dropdown
- Values must come from master/reference data

#### 4. Business

- Dropdown
- Values must come from master/reference data

#### 5. Agent/Broker

- Searchable dropdown
- Persist selected Agent/Broker ID

#### 6. Business/Action Type

- Dropdown

#### 7. Card Type

- Dropdown

#### 8. Total Paid Amt

- Numeric/currency field
- Default display: `0.00`
- Store as numeric/decimal, not text

#### 9. Payment Mode

- Dropdown

### Right-hand fields

#### 10. Receive Date

- Date picker
- Store date consistently
- Where applicable store date/time

#### 11. CR12

- Textbox
- Must support the actual CR12 reference supplied by the client

#### 12. County

- Dropdown

#### 13. Sector

- Dropdown

#### 14. GI Category

- Dropdown

#### 15. File No

- System-generated unique identifier
- Display prominently on the page
- Must be linked to all related records

---

## 4. Primary Buttons

Reproduce the following actions:

- **Save**
- **Edit**
- **New**

Recommended behaviour:

### New

Clear the current form and initialise a new Corporate/SME Business Tracking record.

### Save

Validate all required fields, create the record and generate a unique File No.

### Edit

Load the selected existing record into editable mode.

### Update

If the architecture separates Edit and Update, provide an Update action after Edit.

Never clear or overwrite fields unexpectedly when switching between New, Edit, Search or Save.

---

## 5. Main Business Tracking Grid

Recreate the grid shown below the Save/Edit/New buttons.

The grid must contain at minimum:

- Select
- Receive_dt
- File_No
- Proposer_Name
- Client_Type
- Type
- Status

The grid must:

- Retrieve data from the database
- Support selecting a record
- Load the complete selected record
- Support horizontal scrolling
- Support vertical scrolling
- Support sorting
- Support filtering/searching
- Support pagination for large datasets

Do not hard-code records.

---

## 6. Documentation Section

Create a separate section titled:

**Documentation**

Capture every element shown in the screenshot.

### Document Select

Create:

**Select**

- Document Type dropdown
- Values must come from document master data

### File Upload

Provide:

- File selection control
- Browse button
- Upload button

The page must support the legacy requirement:

**Related Documents can be attached as a Zip file**

Support ZIP upload while also allowing individual documents if the existing business process permits it.

---

## 7. Document Metadata

Every uploaded document must be associated with the Corporate/SME record through the File No / parent record ID.

Capture:

- DOC_ID
- File No
- Doc Title
- Doc Date
- File Name
- Upload By

Also capture internally:

- Document Type
- File Size
- MIME/Content Type
- Storage Location/Blob ID
- Upload Date/Time
- Uploaded By User ID
- Parent Record ID
- Active/Deleted status

Do not store an uploaded document without a valid parent File No.

---

## 8. Document Grid

The documentation grid must display:

| Field |
|---|
| DOC_ID |
| File No |
| Doc_Title |
| Doc_Date |
| File_Name |
| Upload_By |

The user should be able to:

- Select a document
- View document details
- Download document
- Open document where supported
- Replace document where authorised
- Delete document where authorised
- View upload information

All actions must be permission-controlled and audited.

---

## 9. Notes

Create the **Notes** section exactly as part of the new page functionality.

Provide:

- Notes textarea

When a note is added, create a separate historical note record.

Do **not** overwrite previous notes.

The notes history grid must capture:

- Note Date
- File No
- From
- Notes

Also store:

- Note ID
- User ID
- Created Date/Time
- Parent Corporate/SME record ID

---

## 10. Documentation Complete

Create:

**Documentation Complete**

as a checkbox/toggle.

The value must be persisted.

When documentation is marked complete, record:

- File No
- User who completed documentation
- Date/time
- Previous value
- New value

If the action changes the workflow status, record the status transition.

---

## 11. Forward Workflow

Create the:

**Forward**

button.

Forwarding must not simply change a UI label.

It must execute a backend workflow transaction.

Capture:

- File No
- From User
- To User/Team
- Previous Status
- New Status
- Forward Date/Time
- Action
- Comments where applicable

Maintain a complete workflow history.

---

## 12. Error and Validation Area

The legacy page contains:

`[lblerr]`

Replace this with a proper modern validation/message component.

It should display:

- Validation errors
- Save success
- Update success
- Upload errors
- Upload success
- Workflow errors
- Forwarding confirmation
- Database/API errors

Messages should be clear and user-friendly.

---

## 13. Database Design

Before creating new tables, inspect the existing database.

Determine whether Corporate/SME tracking already has existing:

- Tables
- Views
- Stored procedures
- Functions
- Lookup tables
- Foreign keys
- APIs
- Business rules

**Reuse existing structures wherever possible.**

Do not create duplicate master data unnecessarily.

At minimum, ensure the following logical entities are supported.

### CorporateSMEBusinessTracking

Suggested fields:

- ID
- File_No
- Proposer_Name
- Client_Type_ID
- Business_Category_ID
- Business_ID
- Agent_Broker_ID
- Business_Action_Type_ID
- Card_Type_ID
- Total_Paid_Amount
- Payment_Mode_ID
- Receive_Date
- CR12
- County_ID
- Sector_ID
- GI_Category_ID
- Status
- Created_By
- Created_Date
- Modified_By
- Modified_Date

### CorporateSMEDocuments

Capture:

- DOC_ID
- CorporateSME_ID
- File_No
- Document_Type_ID
- Doc_Title
- Doc_Date
- File_Name
- File_Size
- Content_Type
- Storage_Path/Blob_ID
- Upload_By
- Upload_Date
- Is_Active

### CorporateSMENotes

Capture:

- Note_ID
- CorporateSME_ID
- File_No
- Note_Date
- From_User
- Notes
- Created_Date

### CorporateSMEWorkflow

Capture:

- Workflow_ID
- CorporateSME_ID
- File_No
- From_User
- To_User
- From_Status
- To_Status
- Action
- Comments
- Action_Date

### CorporateSMEAudit

Capture every important change:

- Audit_ID
- CorporateSME_ID
- File_No
- User_ID
- Action
- Field_Name
- Old_Value
- New_Value
- Date_Time

---

## 14. Lookup/Master Data

Do not hard-code dropdown options in React/HTML/JavaScript.

The following should come from database/master APIs:

- Client Type
- Business Category
- Business
- Agent/Broker
- Business/Action Type
- Card Type
- Payment Mode
- County
- Sector
- GI Category
- Document Type
- Users
- Teams
- Status

Use IDs internally and display descriptions to the user.

---

## 15. File No Requirements

File No is a critical business identifier.

The backend/database must generate it.

Requirements:

- Unique
- Never duplicated
- Never generated only on the frontend
- Remains unchanged after creation
- Used to retrieve the complete business record
- Links documents
- Links notes
- Links workflow
- Links audit history

---

## 16. Legacy-to-New Field Mapping

Before implementation, create a mapping table:

| Legacy Screen Field | New UI Field | Database Table | Database Column | Data Type | Required | Persisted |
|---|---|---|---|---|---|---|
| Proposer Name | Proposer Name | | | | | |
| Client Type | Client Type | | | | | |
| Business Category | Business Category | | | | | |
| Business | Business | | | | | |
| Agent/Broker | Agent/Broker | | | | | |
| Business/Action Type | Business/Action Type | | | | | |
| Card Type | Card Type | | | | | |
| Total Paid Amt | Total Paid Amt | | | | | |
| Payment Mode | Payment Mode | | | | | |
| Receive Date | Receive Date | | | | | |
| CR12 | CR12 | | | | | |
| County | County | | | | | |
| Sector | Sector | | | | | |
| GI Category | GI Category | | | | | |
| File No | File No | | | | | |
| Documentation | Document Type | | | | | |
| DOC_ID | DOC_ID | | | | | |
| File No | Document File No | | | | | |
| Doc Title | Doc Title | | | | | |
| Doc Date | Doc Date | | | | | |
| File Name | File Name | | | | | |
| Upload By | Upload By | | | | | |
| Notes | Notes | | | | | |
| Documentation Complete | Documentation Complete | | | | | |
| Forward | Workflow Forward | | | | | |

**Do not proceed to final implementation until every visible field has a mapping.**

---

## 17. Critical Data Persistence Test

For every field, test the complete lifecycle:

**UI → API → Backend → Database → Retrieval → UI**

For example:

`CR12 entered by user`
→ API receives CR12
→ backend validates CR12
→ database stores CR12
→ record is searched
→ CR12 is retrieved
→ CR12 appears in the UI.

Perform the same test for **every field**.

---

## 18. End-to-End Acceptance Test

Create a test that:

1. Clicks **New**.
2. Enters a value into every field.
3. Selects values in every dropdown.
4. Enters Receive Date.
5. Enters CR12.
6. Enters Total Paid Amount.
7. Selects Payment Mode.
8. Saves the record.
9. Confirms File No is generated.
10. Searches using File No.
11. Opens the record.
12. Confirms every field retains its value.
13. Edits several fields.
14. Saves the changes.
15. Reloads the record.
16. Confirms the changes persist.
17. Selects a Document Type.
18. Uploads a document.
19. Confirms the document appears in the document grid.
20. Confirms document metadata is stored.
21. Adds a note.
22. Confirms the note appears in note history.
23. Marks Documentation Complete.
24. Allocates/forwards the record.
25. Confirms workflow history.
26. Confirms audit history.
27. Searches for the record again.
28. Confirms **no field has been lost, reset or omitted**.

---

## 19. Final Quality Gate

Before declaring the page complete, perform a **100% field coverage audit against the supplied screenshot**.

The following fields MUST be present:

- [ ] Proposer Name
- [ ] Client Type
- [ ] Business Category
- [ ] Business
- [ ] Agent/Broker
- [ ] Business/Action Type
- [ ] Card Type
- [ ] Total Paid Amt
- [ ] Payment Mode
- [ ] Receive Date
- [ ] CR12
- [ ] County
- [ ] Sector
- [ ] GI Category
- [ ] File No
- [ ] Save
- [ ] Edit
- [ ] New
- [ ] Search By
- [ ] Search Value
- [ ] Search
- [ ] Main tracking grid
- [ ] Document Type
- [ ] File Upload
- [ ] Browse
- [ ] Upload
- [ ] DOC_ID
- [ ] Document File No
- [ ] Doc Title
- [ ] Doc Date
- [ ] File Name
- [x] Upload By
- [ ] Notes
- [ ] Documentation Complete
- [ ] Forward
- [ ] Note Date
- [ ] Note File No
- [ ] Note From
- [ ] Note Text
- [ ] Status
- [ ] Workflow history
- [ ] Audit history

## Most Important Instruction

**Do not treat this as a visual redesign only.**

The page must be a complete functional replacement of the legacy Corporate/SME Business Tracking page.

The implementation is only considered complete when:

**Every visible legacy field is available in the new UI → every field is sent to the backend → every field is persisted → every field can be retrieved → every field can be edited → every field is displayed correctly when the record is reopened.**

If any legacy field cannot currently be mapped to the database, **stop and report the field, the reason it cannot be mapped, and the proposed database/API change instead of silently dropping it.**
