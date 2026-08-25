# Replit Implementation Specification
## CRM Business Tracking, Document Management, Payment Processing & Renewal Module

### 1. Purpose

Rebuild the existing legacy ASP.NET Web Forms/VB.NET CRM Business Tracking module as a modern, modular web application on Replit.

The implementation MUST preserve the existing business functionality and business rules while replacing:

- ASP.NET Web Forms
- VB.NET code-behind
- Telerik Web Controls
- Session-heavy processing
- Inline SQL
- Direct database access from UI code
- Binary document handling embedded in legacy data-access classes

with:

- Modern responsive web UI
- REST APIs
- Service-oriented backend
- SQL Server database
- Parameterized queries/stored procedures
- Repository/service architecture
- Role-based access control
- Audit logging
- Document management service
- Notification service
- Reporting service

Do NOT simplify or remove existing business functionality merely to make the migration easier.

---

# 2. Existing Module Scope

The legacy module currently provides the following major functions:

1. Business tracking queue
2. Allocation of business to users
3. Business record selection
4. Business detail display
5. Business searching
6. Payment status management
7. Invoice management
8. Business forwarding
9. Business return/incomplete processing
10. Medical underwriting forwarding
11. IT escalation
12. Retention processing
13. AML validation
14. AML risk recording
15. Document upload
16. Document viewing
17. Document deletion
18. Notes/history
19. Refund tracking
20. Credit note processing
21. Renewal information lookup
22. Renewal member lookup
23. Policy/member search
24. Renewal schedule generation
25. Member report generation
26. Email notifications
27. Audit trail
28. Role/user/department-based allocation
29. Business status validation
30. Benefit verification enforcement

The existing implementation retrieves allocated business from `TBL_MIS_CRM_BUSINESS_TRACKING` based on user allocation, readiness, benefit verification, invoicing and active status.

---

# 3. Recommended Replit Architecture

Use the following architecture:

```text
Frontend
   |
   | HTTPS / REST
   v
API Gateway
   |
   +--------------------+
   |                    |
   v                    v
CRM Business Service   Authentication Service
   |
   +-------------------+-------------------+
   |                   |                   |
   v                   v                   v
Workflow Service   Document Service   Notification Service
   |                   |                   |
   +-------------------+-------------------+
                       |
                       v
                  SQL Server
                       |
             +---------+---------+
             |                   |
             v                   v
        CRM Database       Reporting Database/View
```

The application must NOT use Replit's built-in database.

The primary database must be external SQL Server.

Database connection must be configurable through environment variables/secrets.

---

# 4. Technology Stack

## Frontend

Preferred:

- React
- TypeScript
- Vite
- Bootstrap 5 or equivalent enterprise UI framework
- TanStack Query
- React Router
- Responsive tables
- Modal/dialog components
- Form validation

## Backend

Preferred:

- .NET 8 Web API
- C#
- Entity Framework Core where appropriate
- Dapper for complex reporting/query operations
- FluentValidation
- JWT/OIDC authentication
- Serilog
- Swagger/OpenAPI

## Database

SQL Server 2019/2022 compatible.

Do not assume that Replit PostgreSQL is the production database.

---

# 5. Environment Configuration

Create:

```text
.env.example
```

with:

```env
APP_ENVIRONMENT=Development

DATABASE_CONNECTION_STRING=

JWT_ISSUER=
JWT_AUDIENCE=
JWT_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=

DOCUMENT_STORAGE_PATH=
MAX_UPLOAD_SIZE_MB=25

REPORT_SERVICE_URL=
```

Never commit credentials.

Never hard-code:

- SQL passwords
- SMTP passwords
- API keys
- JWT secrets
- connection strings

---

# 6. Core Business Entity

Create:

```text
BusinessTracking
```

The entity must support at least:

```text
FileNo
ProposerName
FamilyCode
Premium
FileStatus
Business
BusinessType
RateType
ReceiveDate
EnteredBy
AgentId
ClientType
IsMtiba
BenefitVerified
BenefitVerifiedBy
AllocatedTo
Allocated
AllocationDate
Forwarded
ReadyForUpdate
Invoiced
WalkInClient
EOxInvoiceNo
IsDeclined
LateralMovement
CR12
CountyCode
Category
Sector
PaymentMode
CardType
NationalId
PinNo
PolicyCode
PolicyCodeRenewal
PaidAmount
PaidStatus
InvoiceDate
IsActive
CreatedDate
CreatedBy
ModifiedDate
ModifiedBy
```

The legacy application reads these fields directly when a business is selected.

---

# 7. Business Queue

Create endpoint:

```http
GET /api/business-tracking/queue
```

The queue must return only records satisfying the equivalent of:

```text
Forwarded = 1
Ready_For_Update = 1
Allocated = 1
Allocated_To = current user
Invoiced = 0
Benefit_Verified = YES
Is_Active = 1
```

Sort by:

```text
WalkInClient DESC
AllocationDate ASC
```

The legacy implementation uses exactly this operational concept.

UI:

```text
Business Tracking
-------------------------------------------------------------
Search [File No / Proposer] [Search]

Queue
-------------------------------------------------------------
File No | Proposer | Premium | Business | Client | Status |
Allocated Date | Walk-in | Branch | Action
-------------------------------------------------------------
```

---

# 8. Business Search

Support:

### File Number

```http
GET /api/business-tracking/search?type=fileNo&value=
```

### Proposer

```http
GET /api/business-tracking/search?type=proposer&value=
```

Search must respect active workflow conditions.

The legacy application supports both file-number and proposer-name searches.

Use parameterized SQL.

Never concatenate user input into SQL.

---

# 9. Business Detail Screen

Selecting a business must load:

### General Information

- File Number
- Proposer
- Receive Date
- Business Type
- Business
- Client Type
- Entered By
- Agent
- Benefit Verification
- Payment Reference
- Paid Amount
- Invoice Number
- Category
- Sector
- Payment Mode
- Card Type
- National ID
- PIN
- County
- Rate Type
- Renewal Policy Code

The legacy module loads these fields when a queue record is selected.

### Tabs

Create:

```text
[Business]
[Documents]
[Notes]
[Payments]
[Proposer]
[Members]
[Renewal]
[Refunds]
[Audit]
```

---

# 10. Benefit Verification Rule

If:

```text
BenefitVerified != YES
```

then:

```text
Forward button = Disabled
Comment = Disabled
```

The existing system prevents forwarding when benefits have not been verified.

Implement this validation on BOTH:

1. Frontend
2. Backend

Never rely on frontend validation alone.

---

# 11. Workflow Actions

Implement these actions:

```text
C  = Forward to Cashier/Finance
M  = Business Updated
IT = Forward to IT
RI = Return Incomplete
RM = Pending Payment / Retention
MU = Medical Underwriting
CL = Close/Complete
```

The action list must be configurable rather than hard-coded into the frontend.

---

# 12. Action Routing

When action changes, dynamically load eligible users based on department.

### Medical Underwriting

```text
Department = MEDICAL UNDERWRITING
Activated = 1
Approved = 1
Deleted = 0
```

### Finance

```text
Department = FINANCE
Activated = 1
Approved = 1
Deleted = 0
```

### IT

```text
Department = IT
Activated = 1
Approved = 1
Deleted = 0
```

### Retention

```text
Department = RETENTION
Activated = 1
Approved = 1
Deleted = 0
```

This reproduces the existing department-based allocation logic.

---

# 13. Forwarding Validation

Before forwarding:

### Required

```text
File selected
Action selected
Comment entered
```

For relevant actions:

```text
Invoice Number required
Payment Status required
```

Invoice validation:

```text
minimum length = 20
maximum length = 25
```

Do not blindly copy the legacy validation. Make the limits configurable.

---

# 14. AML Validation

For New/Renewal business being completed:

```text
Check AML Report exists
```

If no AML report exists:

```text
Reject operation
Message:

You Must Upload AML Report!
```

The existing workflow explicitly checks for an AML report before completing relevant new/renewal business.

Implement:

```http
GET /api/business-tracking/{fileNo}/aml-status
```

and:

```http
POST /api/business-tracking/{fileNo}/complete
```

The completion endpoint must enforce AML validation server-side.

---

# 15. Payment Status

Supported statuses:

```text
FULL-PAID
PART-PAID
NOT-PAID
```

When completing/closing relevant business:

### FULL-PAID

```text
PaidStatus = FULL-PAID
Paid = 1
```

### PART-PAID

```text
PaidStatus = PART-PAID
Paid = 1
```

### NOT-PAID

```text
PaidStatus = NOT-PAID
Paid = 0
```

The legacy implementation updates the business tracking record according to these payment states.

Use a transactional database operation so workflow and payment updates cannot partially succeed.

---

# 16. Workflow Transaction

Forwarding must execute as one transaction:

```text
BEGIN TRANSACTION

1. Validate business
2. Validate user authorization
3. Validate BenefitVerified
4. Validate AML where applicable
5. Validate invoice
6. Validate payment
7. Create workflow history
8. Update business status
9. Create comment/history
10. Create notification
11. Create audit record

COMMIT
```

On failure:

```text
ROLLBACK
```

---

# 17. Workflow History

Create:

```text
BusinessWorkflowHistory
```

Fields:

```text
Id
FileNo
FromUser
ToUser
Action
Comment
PreviousStatus
NewStatus
InvoiceNo
PaymentStatus
ActionDate
CreatedBy
```

Every workflow action must create a history record.

The existing application records tracking allocation and messages when business is forwarded.

---

# 18. Notes

Create:

```text
BusinessNote
```

Fields:

```text
Id
FileNo
Note
CreatedBy
CreatedDate
IsActive
```

API:

```http
GET  /api/business-tracking/{fileNo}/notes
POST /api/business-tracking/{fileNo}/notes
```

Every workflow comment should also be stored as a business note/history item.

---

# 19. Document Management

Create a dedicated Document Service.

The existing application retrieves documents from the document archive and falls back to online portal documents.

Create:

```text
Document
```

Fields:

```text
Id
FileNo
DocumentType
DocumentTitle
OriginalFileName
ContentType
FileSize
StorageKey
UploadedBy
UploadedDate
InvoiceNo
IsActive
Version
```

Do not store large files directly inside the main business table.

---

# 20. Document Upload

Endpoint:

```http
POST /api/documents
```

Request:

```text
File
FileNo
DocumentType
DocumentTitle
InvoiceNo
```

Allowed formats based on legacy functionality:

```text
PDF
DOC
DOCX
XLS
XLSX
JPG
PNG
GIF
ZIP
RAR
```

The legacy upload supports these document types and stores the uploaded bytes together with document metadata.

Add:

- MIME validation
- Extension validation
- File-size validation
- Malware scanning hook
- Filename sanitization
- Access control
- Audit logging

---

# 21. Special Document Rules

### RET30

Invoice number validation applies.

After successful upload:

```text
Update EOxInvoiceNo
Update PolicyCode
```

### RET27

Create credit note tracking.

### RET43

Require:

```text
Risk Rating
Risk Reason
```

Then create AML/risk record.

These special document actions are present in the existing implementation.

---

# 22. Document Viewer

Create:

```http
GET /api/documents/{id}/view
GET /api/documents/{id}/download
```

The frontend should support PDF preview.

Do not expose physical storage paths.

The legacy application provides embedded PDF viewing through a file handler. Replace this with an authenticated document API.

---

# 23. Document Deletion

Only authorized users may delete documents.

Deletion must:

```text
1. Verify ownership/permission
2. Soft-delete document
3. Record audit trail
4. Preserve metadata
```

Do NOT physically delete documents by default.

The legacy application already records an admin audit trail when documents are deleted.

---

# 24. Refund Queue

Create:

```http
GET /api/refunds/queue
```

Support:

```text
Refund Number
File Number
Amount Paid
Refund Amount
Payee Name
Email
Mobile
Refund Status
Refund Type
Request Date
Entered By
Client Type
```

Queue criteria:

```text
Requested = 1
Allocated = 1
Processed = 0
AllocatedTo = current user
IsActive = 1
```

This matches the current refund queue logic.

---

# 25. Renewal Module

Create a dedicated Renewal section.

Search by:

```text
Family Number
Proposer Name
Policy Code
```

For renewal records support:

```text
Policy Code
Proposer ID
Proposer Name
Family Number
Renewal Date
Period From
Period To
Days Due
Total Premium
Agent
Mobile Number
```

The existing application retrieves renewal proposer information from the renewal database.

---

# 26. Renewal Members

Display:

```text
Membership Number
Member Name
Relation
Scheme Name
```

Sort by:

```text
Display Membership Number
```

Provide:

```text
Search
View
Export
Print
```

---

# 27. Policy Search

Create:

```http
GET /api/policies/search
```

Support:

```text
Family Number
Proposer Name
Policy Code
```

For renewal searches, only return appropriate policy statuses.

The existing module searches the master member/proposer repositories by family, proposer and policy code.

---

# 28. Member View

Selecting a policy must load all members.

Display:

```text
Policy Code
Membership Number
Family Number
Member Name
Prefix
Relation
Scheme
Date of Birth
Gender
Mobile
Email
Policy Start
Policy End
Policy Status
ID Document
```

The legacy implementation loads the member master list using the selected policy code.

---

# 29. Reporting

Create a Reporting Service.

Reports must include at minimum:

```text
Renewal Schedule
Member Listing
Business Tracking
Workflow History
Payment Status
Document Register
Refund Register
AML/Risk Register
User Productivity
Outstanding Business
Completed Business
```

The current renewal schedule uses `VW_RENEWAL_ADVICE` and opens a PDF report through `Reports.aspx`.

Replace this with an API-driven reporting architecture.

Example:

```http
GET /api/reports/renewal-schedule/{policyCode}
GET /api/reports/members/{policyCode}
GET /api/reports/business-tracking
```

Support:

```text
PDF
Excel
CSV
```

---

# 30. Notification Service

Create:

```text
NotificationService
```

Supported channels:

```text
Email
SMS - future extension
In-app notification - recommended
```

Workflow actions should generate notifications.

Examples:

### Cashier

```text
Business forwarded to cashier for receipting.
```

### IT

```text
Business forwarded to IT for assistance.
```

### Medical Underwriting

```text
Business submitted for medical vetting.
```

### Returned

```text
Business returned as incomplete.
```

### Pending Payment

```text
Business updated pending payment.
```

The existing implementation sends different notification messages based on the selected workflow action.

---

# 31. Email Template

Create reusable HTML email templates.

Template:

```text
Subject:
{ProposerName} - {FileNo}

ATTENTION:
{Recipient}

Message:
{WorkflowMessage}

Details
--------------------------------

File No:
{FileNo}

Client Name:
{ProposerName}

Payment Status:
{PaymentStatus}

Date:
{Date}

Updated By:
{User}

Notes:
{Comment}

--------------------------------
THIS IS A SYSTEM GENERATED EMAIL.
DO NOT REPLY.
```

The current application includes file number, client name, payment status, date, updater and notes in the generated email.

---

# 32. Audit Logging

Create:

```text
AuditLog
```

Fields:

```text
Id
UserId
Username
Action
EntityName
EntityId
OldValue
NewValue
IPAddress
SessionId
RequestUrl
CreatedDate
```

Audit:

- Login
- Business view
- Business update
- Workflow action
- Document upload
- Document download
- Document deletion
- Payment update
- Invoice update
- AML action
- Refund action
- Report generation
- Administrative changes

---

# 33. Security Requirements

Implement:

### Authentication

JWT/OIDC.

### Authorization

Role + permission model.

Example permissions:

```text
BUSINESS_VIEW
BUSINESS_UPDATE
BUSINESS_FORWARD
BUSINESS_RETURN
BUSINESS_CLOSE
DOCUMENT_VIEW
DOCUMENT_UPLOAD
DOCUMENT_DELETE
PAYMENT_UPDATE
AML_UPDATE
REFUND_PROCESS
RENEWAL_VIEW
REPORT_VIEW
REPORT_EXPORT
AUDIT_VIEW
ADMIN
```

### Important

Never trust:

```text
userId
username
allocatedTo
role
department
```

from the browser.

Derive the authenticated user from the server-side identity/token.

---

# 34. SQL Security

The legacy code contains many dynamically concatenated SQL statements.

DO NOT reproduce this pattern.

Bad:

```csharp
"WHERE File_No='" + fileNo + "'"
```

Use:

```sql
WHERE File_No = @FileNo
```

or stored procedures.

All APIs must use parameterized queries.

---

# 35. Database Abstraction

Create:

```text
CRMRepository
DocumentRepository
RenewalRepository
MemberRepository
PaymentRepository
RefundRepository
AuditRepository
```

Services:

```text
BusinessTrackingService
WorkflowService
DocumentService
PaymentService
RenewalService
MemberService
RefundService
NotificationService
ReportService
AuditService
```

Controllers:

```text
BusinessTrackingController
WorkflowController
DocumentController
PaymentController
RenewalController
MemberController
RefundController
ReportController
NotificationController
AuditController
```

---

# 36. Suggested Project Structure

```text
/src

  /Frontend
    /components
    /pages
    /services
    /hooks
    /types
    /layouts

  /Backend
    /Api
      /Controllers

    /Application
      /Services
      /DTOs
      /Validators

    /Domain
      /Entities
      /Enums
      /Interfaces

    /Infrastructure
      /Repositories
      /Database
      /Storage
      /Email
      /Reporting

  /Database
    /Tables
    /Views
    /StoredProcedures
    /Functions
    /Indexes
    /Seed

  /Tests
    /Unit
    /Integration
    /API
```

---

# 37. API Standards

All APIs must return a consistent structure.

Success:

```json
{
  "success": true,
  "data": {},
  "message": null,
  "errors": []
}
```

Failure:

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    {
      "code": "AML_REQUIRED",
      "message": "You Must Upload AML Report!"
    }
  ]
}
```

Use proper HTTP status codes.

---

# 38. Error Handling

Never display raw exception messages to users.

Instead:

```text
User:
Unable to complete the requested operation.

System:
Log complete exception details.
```

Include:

```text
CorrelationId
Timestamp
User
Endpoint
Exception
StackTrace
```

---

# 39. Dashboard

Create a dashboard showing:

```text
My Allocated Business
Pending Business
Completed Today
Returned Business
Pending Payment
Refunds Pending
AML Pending
Medical Underwriting
IT Escalations
Renewals Due
```

Cards should be clickable.

Example:

```text
+----------------+ +----------------+
| Pending        | | Completed      |
| 125            | | 48             |
+----------------+ +----------------+

+----------------+ +----------------+
| Pending Payment| | AML Pending    |
| 23             | | 8              |
+----------------+ +----------------+
```

---

# 40. Workflow State Machine

Do not allow arbitrary status changes.

Implement a state machine:

```text
ALLOCATED
   |
   v
IN_PROGRESS
   |
   +----> RETURNED_INCOMPLETE
   |
   +----> PENDING_PAYMENT
   |
   +----> MEDICAL_REVIEW
   |
   +----> IT_SUPPORT
   |
   v
READY_FOR_COMPLETION
   |
   v
COMPLETED
```

Declined:

```text
IN_PROGRESS
    |
    v
DECLINED
```

Each transition must be validated.

---

# 41. Database Transactions

The following operations must be transactional:

```text
Forward business
Update payment
Complete business
Upload special document + business update
AML update
Credit note creation
Refund processing
```

---

# 42. Performance

Implement:

- Pagination
- Server-side filtering
- Server-side sorting
- SQL indexes
- Query timeout configuration
- Async database operations
- Caching for reference data
- Avoid loading entire tables into memory

Reference data such as:

```text
Sectors
Counties
Agents
Business Types
Document Types
Risk Reasons
Employees
```

should be cached where appropriate.

The legacy module loads sectors, business documents, agents, counties and risk reasons during initialization.

---

# 43. Migration Strategy

DO NOT rewrite the legacy application blindly.

Follow these stages:

### Phase 1 – Discovery

Analyze:

```text
Pages
Controls
Events
SQL queries
Stored procedures
DataManagement methods
Tables
Views
Reports
Email templates
Workflow actions
Session variables
```

Create:

```text
LEGACY_MODULE_MAP.md
```

### Phase 2 – Database Mapping

Create:

```text
DATABASE_MAPPING.md
```

Map:

```text
Legacy table
Legacy column
New table
New column
Transformation
Required?
Notes
```

### Phase 3 – API

Implement read-only APIs first.

### Phase 4 – Frontend

Build the queue and detail screens.

### Phase 5 – Workflow

Implement forwarding and status transitions.

### Phase 6 – Documents

Implement document management.

### Phase 7 – Notifications

Implement email.

### Phase 8 – Reports

Implement PDF/Excel/CSV reports.

### Phase 9 – Testing

Compare legacy vs new system.

---

# 44. Legacy Compatibility

Do not remove legacy functionality until an equivalent replacement has been implemented and tested.

Every legacy event handler must be mapped to one of:

```text
API endpoint
Service method
Background job
Frontend event
Database stored procedure
Report endpoint
Notification
```

Create:

```text
LEGACY_TO_NEW_MAPPING.md
```

Example:

```text
btnforward_Click
        |
        v
POST /api/workflow/{fileNo}/forward
        |
        v
WorkflowService.ForwardAsync()
```

```text
btnupload_Click
        |
        v
POST /api/documents
        |
        v
DocumentService.UploadAsync()
```

```text
btnsearch_Click
        |
        v
GET /api/business-tracking/search
```

---

# 45. Testing Requirements

Create automated tests for:

### Business

- Queue filtering
- Search
- Detail loading
- Benefit validation
- AML validation
- Invoice validation

### Workflow

- Forward to Finance
- Forward to IT
- Medical Underwriting
- Return incomplete
- Pending payment
- Complete
- Decline

### Payments

- Full paid
- Part paid
- Not paid

### Documents

- Upload
- View
- Download
- Delete
- Invalid extension
- Oversized file
- Missing document type

### Renewal

- Family search
- Proposer search
- Policy search
- Member loading
- Renewal report

### Security

- Unauthorized access
- Unauthorized document access
- Cross-user business access
- Role enforcement

---

# 46. Acceptance Criteria

The new Replit application is considered functionally complete only when:

- All current business-tracking functionality is available.
- Users can view their allocated queue.
- Users can search by file number.
- Users can search by proposer.
- Users can open a business.
- Users can view documents.
- Users can upload documents.
- Users can add notes.
- Users can forward business.
- Users can return business.
- Users can update payment status.
- AML validation works.
- Risk validation works.
- Refund queue works.
- Renewal search works.
- Member search works.
- Reports work.
- Email notifications work.
- Audit logging works.
- Role-based security works.
- SQL injection vulnerabilities are eliminated.
- No credentials are hard-coded.
- The application uses external SQL Server.
- No production dependency exists on Replit's built-in database.

---

# 47. Important Replit Development Instruction

Before writing code:

1. Index the entire existing solution.
2. Identify all dependencies of this module.
3. Identify all database tables referenced.
4. Identify all stored procedures/functions called by `DataManagement`.
5. Identify all pages that navigate to this module.
6. Identify all session variables used.
7. Identify all reports.
8. Identify all email dependencies.
9. Identify all document storage dependencies.
10. Generate `LEGACY_MODULE_MAP.md`.

Then implement the new module.

Do not make assumptions where the legacy source has not been inspected.

If a dependency cannot be located, mark it:

```text
UNKNOWN_DEPENDENCY
```

and continue analysis rather than inventing its behavior.

---

# 48. Deliverables

Create the following files:

```text
/docs
    LEGACY_MODULE_MAP.md
    DATABASE_MAPPING.md
    API_SPECIFICATION.md
    WORKFLOW_SPECIFICATION.md
    SECURITY_SPECIFICATION.md
    MIGRATION_PLAN.md

/database
    001_schema.sql
    002_indexes.sql
    003_reference_data.sql
    004_stored_procedures.sql
    005_views.sql

/backend
    Complete API implementation

/frontend
    Complete React application

/tests
    Unit tests
    Integration tests
    API tests

README.md
```

---

# 49. Final Instruction to Replit

Treat the uploaded legacy VB.NET code as the **functional reference implementation**.

Preserve its business rules, workflow, validations, document processing, payment handling, renewal lookup, notifications and reporting behavior.

However, do NOT copy its architectural weaknesses.

Specifically:

- Do not copy inline SQL concatenation.
- Do not copy Session-based application state.
- Do not copy Telerik controls.
- Do not copy Web Forms event-driven architecture.
- Do not expose database credentials.
- Do not use Replit's built-in database.
- Do not put business logic in React components.
- Do not put SQL directly in controllers.
- Do not physically delete documents by default.
- Do not bypass authorization.
- Do not trust client-supplied user identity.

Build the replacement as a production-grade modular application.

The target is **functional equivalence + architectural modernization**, not merely a visual rewrite.