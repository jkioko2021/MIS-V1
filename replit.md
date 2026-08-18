# replit.md

# Enterprise Application Modernization --- Replit Master Instructions

**Version:** 3.2\
**Status:** Mandatory\
**Project Type:** Enterprise Application Reconstruction & Modernization\
**Primary Objective:** Build a completely new enterprise application
that preserves the business functionality, business rules, workflows,
data requirements, security requirements, reporting requirements and
operational capabilities of the existing application while replacing its
legacy implementation.

------------------------------------------------------------------------

# 1. SYSTEM ROLE

You are the primary AI engineering agent responsible for analyzing the
existing enterprise application and building a completely new modern
enterprise application.

You are **NOT performing a direct code migration**.

You are **NOT performing a page-by-page rewrite**.

You are **NOT converting ASP.NET Web Forms into another frontend
framework mechanically**.

You are reconstructing the enterprise system based on the business
knowledge contained within the existing application.

The existing application contains:

-   Business rules
-   Business workflows
-   User journeys
-   Validations
-   Calculations
-   Reports
-   Integrations
-   Security behavior
-   Database relationships
-   Operational processes
-   Historical business decisions

Your responsibility is:

> **Understand the existing business system first, document it, redesign
> it, and build a completely new enterprise application while preserving
> approved business functionality.**

The fundamental principle is:

``` text
UNDERSTAND
    ↓
EXTRACT
    ↓
DOCUMENT
    ↓
REDESIGN
    ↓
IMPLEMENT
    ↓
TEST
    ↓
COMPARE
    ↓
VALIDATE
    ↓
MIGRATE
    ↓
DEPLOY
```

Never:

``` text
COPY
   ↓
CONVERT
   ↓
DEPLOY
```

------------------------------------------------------------------------

# 2. PRIMARY MODERNIZATION OBJECTIVE

The uploaded application is developed using:

``` text
ASP.NET Web Forms
VB.NET
.NET Framework 4.8
SQL Server
Crystal Reports
```

However:

> **THE UPLOADED APPLICATION IS NOT THE SOLUTION TO BE MIGRATED.**

It is the:

> **BUSINESS SPECIFICATION AND BEHAVIORAL REFERENCE**

The objective is to build a:

> **COMPLETELY NEW ENTERPRISE APPLICATION**

while preserving every required business function.

The transformation is:

``` text
EXISTING APPLICATION
        ↓
BUSINESS DISCOVERY
        ↓
REVERSE ENGINEERING
        ↓
BUSINESS RULE EXTRACTION
        ↓
FUNCTIONAL SPECIFICATION
        ↓
TARGET ARCHITECTURE
        ↓
NEW APPLICATION
        ↓
TESTING
        ↓
DATA MIGRATION
        ↓
UAT
        ↓
PRODUCTION
```

------------------------------------------------------------------------

# 3. NON-NEGOTIABLE PRINCIPLE

## DO NOT START BY REWRITING THE APPLICATION

The first objective is to understand the existing system.

Before implementing the new application:

1.  Inspect the legacy source code.
2.  Inspect the application structure.
3.  Inspect all pages.
4.  Inspect code-behind.
5.  Inspect configuration.
6.  Inspect database structures.
7.  Inspect stored procedures.
8.  Inspect functions.
9.  Inspect views.
10. Inspect triggers.
11. Inspect jobs.
12. Inspect reports.
13. Inspect integrations.
14. Inspect authentication.
15. Inspect authorization.
16. Identify business rules.
17. Identify workflows.
18. Identify dependencies.
19. Identify data relationships.
20. Identify risks.
21. Identify technical limitations.
22. Produce a modernization/reconstruction plan.

Discovery comes before implementation.

------------------------------------------------------------------------

# 4. LEGACY APPLICATION --- BUSINESS SPECIFICATION PRINCIPLE

The existing application is a source of business knowledge.

It must be treated as:

``` text
BUSINESS SPECIFICATION
+
BEHAVIORAL REFERENCE
+
DATA REFERENCE
+
WORKFLOW REFERENCE
+
REPORTING REFERENCE
+
INTEGRATION REFERENCE
```

It must NOT automatically be treated as:

``` text
TARGET ARCHITECTURE
TARGET CODEBASE
TARGET UI
TARGET DATABASE DESIGN
TARGET API DESIGN
```

The implementation technology will change.

------------------------------------------------------------------------

# 5. WHAT MUST BE PRESERVED

Unless an approved business change explicitly states otherwise,
preserve:

``` text
Business Functions
Business Rules
Calculations
Validation Rules
Workflows
Approval Processes
User Roles
Permissions
Data Relationships
Financial Logic
Renewal Logic
Underwriting Logic
Commission Logic
Refund Logic
Debtor Logic
Case Management
Reporting Requirements
Integration Requirements
Audit Requirements
Security Requirements
Operational Processes
```

The objective is:

``` text
SAME BUSINESS CAPABILITY
+
MODERN TECHNOLOGY
+
MODERN ARCHITECTURE
+
IMPROVED SECURITY
+
IMPROVED USER EXPERIENCE
+
IMPROVED MAINTAINABILITY
+
IMPROVED PERFORMANCE
```

------------------------------------------------------------------------

# 6. WHAT MUST NOT BE PRESERVED AS IMPLEMENTATION

Do not automatically reproduce:

``` text
ASP.NET Web Forms
VB.NET Code-Behind
.NET Framework 4.8
Page Lifecycle
Legacy Session Patterns
Legacy UI Structure
Legacy CSS
Legacy JavaScript Architecture
Legacy Database Coupling
Legacy Stored Procedure Coupling
Crystal Reports Implementation
Technical Workarounds
Legacy Architectural Limitations
Legacy Coding Patterns
Legacy Security Weaknesses
Legacy Performance Problems
```

These are implementation characteristics, not business requirements.

------------------------------------------------------------------------

# 7. BUSINESS BEHAVIOR VS IMPLEMENTATION

The AI must always distinguish:

``` text
BUSINESS REQUIREMENT
```

from:

``` text
LEGACY IMPLEMENTATION
```

Example legacy implementation:

``` text
ASP.NET Web Form
        ↓
Button_Click
        ↓
VB.NET Code-Behind
        ↓
Stored Procedure
        ↓
SQL Server
```

This is NOT the required architecture for the new application.

The business behavior may instead be:

``` text
User submits transaction
        ↓
Validate transaction
        ↓
Apply business rules
        ↓
Determine approval requirements
        ↓
Persist transaction
        ↓
Create audit record
        ↓
Generate notification
        ↓
Return result
```

The business behavior must be preserved.

The implementation must be redesigned.

------------------------------------------------------------------------

# 8. NEW APPLICATION PRINCIPLE

The new application must be developed as a modern enterprise system.

It must NOT be a mechanical conversion of:

``` text
ASPX → React
VB.NET → C#
Web Forms → SPA
Stored Procedures → ORM Methods
Crystal Reports → New Reports
```

Mechanical conversion is prohibited unless specifically justified and
approved.

The new application must be designed around:

``` text
Business Domains
Business Capabilities
Use Cases
Workflows
APIs
Domain Models
Application Services
Data Models
Security
Audit
Observability
Testing
Deployment
```

------------------------------------------------------------------------

# 9. AUTHORITATIVE DOCUMENTATION

The Markdown documentation in this repository is the project's
engineering specification.

Before implementing functionality, read the relevant documentation.

Documentation takes precedence over assumptions.

When documentation conflicts with existing implementation:

``` text
Approved Business Requirement
        >
Approved Functional Specification
        >
Approved Business Rule
        >
Approved Architecture
        >
Verified Business Behavior
        >
Existing Implementation
        >
AI Assumption
```

Never invent a business rule when evidence is available.

------------------------------------------------------------------------

# 10. DOCUMENTATION STRUCTURE

The repository is organized into:

``` text
00_Discovery/
01_Architecture/
02_Database/
03_Backend/
04_Frontend/
05_Modules/
06_Testing/
07_Deployment/
```

------------------------------------------------------------------------

# 11. DOCUMENT PRIORITY

Use:

``` text
1. Approved Business Requirement
2. Approved Functional Specification
3. Approved Business Rule
4. Security Requirements
5. Approved Architecture
6. Database Standards
7. Backend Standards
8. Frontend Standards
9. Testing Standards
10. Deployment Standards
11. Verified Legacy Business Behavior
12. Existing Legacy Implementation
13. AI Recommendation
```

If uncertainty exists:

``` text
STOP
DOCUMENT UNCERTAINTY
IDENTIFY EVIDENCE REQUIRED
DO NOT GUESS
```

------------------------------------------------------------------------

# 12. LEGACY TECHNOLOGY

The existing application uses:

``` text
ASP.NET Web Forms
VB.NET
.NET Framework 4.8
SQL Server
Crystal Reports
JavaScript
CSS
Configuration Files
```

These technologies are discovery targets.

They are NOT automatically target technologies.

------------------------------------------------------------------------

# 13. LEGACY APPLICATION DISCOVERY

Before building the new application, produce a complete inventory.

Minimum inventory:

``` text
Solution
Projects
Assemblies
Pages
Controls
Code-behind
Classes
Services
Configuration
Reports
JavaScript
CSS
Images
Database Connections
External Integrations
Scheduled Jobs
```

For every page identify:

``` text
Module
Page
Purpose
Users
Permissions
Inputs
Outputs
Business Rules
Database Objects
APIs/Services
Reports
Dependencies
Workflow
Validation
```

------------------------------------------------------------------------

# 14. CORE BUSINESS MODULES

The new application must preserve the functionality represented by:

``` text
01 Authentication
02 User Administration
03 Agent Management
04 A-Home
05 Business Tracking
06 Case Register
07 Commissions
08 Complaint Tracking
09 Debtors
10 Enquiry
11 Log Activity
12 Medical Underwriting
13 Non-Medical Renewal
14 OFF-System Cases
15 Portfolio Management
16 Premium Refund
17 Production
18 Reports
19 Retail BenchMarks
20 Retail Renewals
21 Risk Register
22 Settings
```

Do not remove, merge or rename business modules without explicit
approval.

------------------------------------------------------------------------

# 15. MODULE OWNERSHIP

Each module must have:

``` text
Business Objective
Business Requirements
Legacy Mapping
Domain Model
Business Rules
User Roles
Permissions
Workflow
UI
API
Database
Validation
Calculations
Approvals
Notifications
Reports
Integrations
Testing
Deployment
Traceability
```

------------------------------------------------------------------------

# 16. BUSINESS FUNCTION CLASSIFICATION

Every discovered legacy function must be classified as:

``` text
REQUIRED
OPTIONAL
DUPLICATE
OBSOLETE
LEGACY DEFECT
UNKNOWN
```

The AI must never remove functionality merely because it appears old or
technically obsolete.

Removal requires explicit approval.

------------------------------------------------------------------------

# 17. DATABASE ACCESS --- AUTHORITATIVE TEST ENVIRONMENT

The database discovery and analysis environment is the designated **TEST
SQL Server RDS environment**.

The database server hostname is:

``` text
internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com
```

The expected SQL Server port is:

``` text
1433
```

This environment must be treated as:

``` text
TEST / DISCOVERY DATABASE
```

It must NOT be assumed to be production.

------------------------------------------------------------------------

# 18. DATABASE CREDENTIAL SECURITY

Database credentials must NEVER be stored in:

``` text
replit.md
Source Code
Markdown Documentation
Git
Commit Messages
Logs
Screenshots
Generated Reports
```

Use Replit Secrets / environment variables.

Recommended configuration:

``` text
DB_HOST=internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com
DB_PORT=1433
DB_NAME=<database_name>
DB_USER=<database_user>
DB_PASSWORD=<database_password>
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

The AI must never print the values of:

``` text
DB_PASSWORD
DB_USER
Connection Strings
Tokens
API Keys
Secrets
Private Keys
```

when those values are supplied through secure configuration.

------------------------------------------------------------------------

# 19. DATABASE CONNECTION STRING

For SQL Server, the connection should conceptually follow:

``` text
Server=internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com,1433;
Database=<database_name>;
User Id=<database_user>;
Password=<database_password>;
Encrypt=True;
TrustServerCertificate=False;
```

Do not hard-code this connection string into application source code.

Build it from secure environment variables.

------------------------------------------------------------------------

# 20. DATABASE CONNECTIVITY VALIDATION

Before performing database discovery, validate connectivity.

The AI must verify:

``` text
DNS Resolution
Network Connectivity
TCP Port 1433
SQL Server Connectivity
Authentication
Database Visibility
Read Permissions
```

If connectivity fails, report:

``` text
DATABASE CONNECTIVITY FAILED

Host:
internal-apps-db-test.c7eznhldreld.eu-west-1.rds.amazonaws.com

Port:
1433

Failure Stage:
<DNS / Network / Port / Authentication / Database / Permission>

Required Action:
<action>
```

Do not assume that a hostname being valid means that the database is
reachable.

------------------------------------------------------------------------

# 21. DATABASE NETWORK REQUIREMENT

The database is hosted on AWS RDS.

The AI must recognize that database access may require:

``` text
AWS VPC Connectivity
Security Group Rules
Network Routing
Firewall Rules
DNS Resolution
Allowed Source IP
VPN / Private Network Access
```

If the Replit environment cannot reach the RDS endpoint, do not attempt
to bypass security controls.

Report the connectivity requirement.

Do NOT:

``` text
Disable Firewall
Open Database to 0.0.0.0/0
Expose Production Database
Bypass VPN
Disable Security Groups
Disable TLS
```

------------------------------------------------------------------------

# 22. DATABASE DISCOVERY ACCESS MODE

During discovery:

> **DATABASE ACCESS MUST BE READ-ONLY.**

The AI must not modify database data or schema during discovery.

Allowed operations include:

``` text
SELECT
Metadata Queries
Schema Inspection
System Catalog Inspection
Object Dependency Inspection
Read-Only Data Profiling
Read-Only Data Quality Analysis
```

Do not execute:

``` text
INSERT
UPDATE
DELETE
TRUNCATE
DROP
ALTER
CREATE
MERGE
```

against the existing discovery database unless explicitly authorized for
a specific controlled activity.

------------------------------------------------------------------------

# 23. DATABASE DISCOVERY

The database discovery process must identify:

``` text
Databases
Schemas
Tables
Columns
Primary Keys
Foreign Keys
Indexes
Constraints
Stored Procedures
Functions
Views
Triggers
Jobs
Sequences
Synonyms
Dependencies
Reference Data
Audit Data
Historical Data
```

Where applicable, inspect:

``` text
AAR_RISK_DB
AIMSOFT_DATADUMP
AIMSOFT_DATADUMP2023
COM_ACTIVITIES_DB
COMMISSION
CRM
DATA_REPOSITORY_DB
DB_MASTER_AGENTS
DB_MASTER_RENEWAL
DB_ONLINE_PORTAL
Doc_Arc_DB
SALES
```

If a listed database does not exist in the test environment, record:

``` text
DATABASE NOT FOUND

Database:
<database>

Environment:
TEST RDS

Status:
Not available

Impact:
<impact>

Required Action:
<action>
```

Do not create a missing database merely because it appears in
documentation.

------------------------------------------------------------------------

# 24. DATABASE DISCOVERY OUTPUT

Create:

``` text
00_Discovery/Database_Catalogue.md
00_Discovery/Database_Object_Catalogue.md
00_Discovery/Database_Relationship_Map.md
00_Discovery/Database_Dependency_Map.md
00_Discovery/Data_Dictionary.md
00_Discovery/Data_Lineage.md
00_Discovery/Data_Quality_Assessment.md
```

Each object should contain:

``` text
Database
Schema
Object Name
Object Type
Purpose
Dependencies
Business Meaning
Source Evidence
Risk
Target Recommendation
```

------------------------------------------------------------------------

# 25. DATABASE --- BUSINESS SPECIFICATION PRINCIPLE

The existing database is not automatically the target database design.

For every discovered object determine whether it represents:

``` text
Business Data
Business Rule
Business Calculation
Workflow State
Reference Data
Integration Requirement
Reporting Requirement
Audit Requirement
Technical Implementation
Legacy Workaround
Obsolete Functionality
```

Do not blindly reproduce legacy database structures.

------------------------------------------------------------------------

# 26. DATABASE DOCUMENTATION

Maintain:

``` text
Database Catalogue
Data Dictionary
Table Catalogue
Stored Procedure Catalogue
Function Catalogue
View Catalogue
Trigger Catalogue
Relationship Matrix
Dependency Map
Data Lineage
Data Quality Assessment
Target Data Model
Legacy-to-Target Mapping
```

Every discovered database object must be traceable.

------------------------------------------------------------------------

# 27. DATABASE CHANGE RULE

Never directly modify an existing database structure during development
without documenting the change.

Every schema change requires:

``` text
Migration Script
Validation Script
Rollback/Recovery Strategy
Impact Assessment
Test
Documentation
```

Prefer:

``` text
EXPAND
   ↓
MIGRATE
   ↓
VALIDATE
   ↓
SWITCH
   ↓
CONTRACT
```

------------------------------------------------------------------------

# 28. DATA INTEGRITY

Data integrity is more important than implementation convenience.

Never:

``` text
Delete production data
Drop production tables
Truncate production tables
Overwrite historical records
Change primary keys
Modify financial records
Modify claims records
Modify policy records
```

without explicit authorization and documented recovery procedures.

------------------------------------------------------------------------

# 29. DATA MIGRATION PRINCIPLE

Use:

``` text
LEGACY DATA
     ↓
DISCOVER
     ↓
CLASSIFY
     ↓
MAP
     ↓
TRANSFORM
     ↓
LOAD
     ↓
VALIDATE
     ↓
RECONCILE
```

Every migrated data element must be traceable.

------------------------------------------------------------------------

# 30. TARGET ARCHITECTURE

The target architecture should generally follow:

``` text
                         USERS
                           │
             ┌─────────────┴─────────────┐
             │                           │
          WEB UI                     MOBILE/API
             │                           │
             └─────────────┬─────────────┘
                           │
                      API Gateway
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Backend APIs              Integration APIs
             │                           │
             └─────────────┬─────────────┘
                           │
                   Application Layer
                           │
                      Domain Layer
                           │
                 Infrastructure Layer
                           │
                     SQL Server
```

------------------------------------------------------------------------

# 31. MODULAR MONOLITH FIRST

Do not create microservices merely because microservices are
fashionable.

Prefer:

``` text
Modular Architecture
       ↓
Clear Domain Boundaries
       ↓
Independent APIs
       ↓
Independent Testing
       ↓
Independent Deployment Where Valuable
       ↓
Microservice Extraction Where Justified
```

------------------------------------------------------------------------

# 32. BACKEND ARCHITECTURE

Preferred conceptual structure:

``` text
API
Application
Domain
Infrastructure
Shared
```

------------------------------------------------------------------------

# 33. FRONTEND ARCHITECTURE

The modern frontend must use the approved frontend architecture and
design system.

It must provide:

``` text
Authentication
Authorization
Navigation
Routing
Forms
Tables
Validation
Notifications
Dialogs
Error Handling
Loading States
Responsive Design
Accessibility
```

------------------------------------------------------------------------

# 34. LEGACY PAGE RECONSTRUCTION

Every legacy page must be discovered.

However:

> **One legacy page does NOT equal one modern page.**

A legacy page may become:

``` text
One modern screen
Multiple modern screens
A workflow
A reusable component
An API operation
A background process
A report
A dashboard
A combination of the above
```

The new UI must be designed around the business process rather than the
legacy page structure.

------------------------------------------------------------------------

# 35. API-FIRST DEVELOPMENT

Business functionality should be exposed through well-defined APIs.

API requirements:

``` text
Authentication
Authorization
Validation
Versioning
Error Handling
Logging
Audit
Documentation
```

------------------------------------------------------------------------

# 36. SECURITY

Security is mandatory.

Apply:

``` text
Least Privilege
Secure Authentication
Authorization
Input Validation
Output Encoding
Encryption
Secret Management
Audit Logging
Session Security
API Security
Database Security
```

------------------------------------------------------------------------

# 37. AUTHENTICATION

Authentication must be centralized.

The architecture must support:

``` text
Login
Logout
Password Management
Session/Token Management
MFA Where Required
Account Lockout
Password Policies
Audit
```

------------------------------------------------------------------------

# 38. AUTHORIZATION

Authorization must be enforced server-side.

Use:

``` text
User
Role
Permission
Module
Action
Resource
```

------------------------------------------------------------------------

# 39. AUDIT

Critical activities must be auditable.

Audit information:

``` text
Who
What
When
Where
Before
After
Result
```

------------------------------------------------------------------------

# 40. ERROR HANDLING

Use:

``` text
Central Error Handling
Structured Logging
Correlation IDs
User-Friendly Messages
Technical Diagnostics
```

------------------------------------------------------------------------

# 41. LOGGING

Logging should support:

``` text
Application Logs
Security Logs
Audit Logs
Integration Logs
Database Errors
Performance Logs
Deployment Logs
```

Sensitive data must not be logged unnecessarily.

------------------------------------------------------------------------

# 42. BUSINESS RULE PRESERVATION

For every migrated capability:

``` text
Legacy Behavior
      ↓
Business Rule Extraction
      ↓
Document Rule
      ↓
Modern Implementation
      ↓
Automated Test
      ↓
Legacy vs Modern Comparison
      ↓
Approval
```

------------------------------------------------------------------------

# 43. UNKNOWN BUSINESS RULES

When business logic is unclear:

``` text
DO NOT GUESS
```

Record:

``` text
UNKNOWN-001
Description
Evidence Found
Possible Interpretations
Impact
Required Clarification
```

------------------------------------------------------------------------

# 44. EVIDENCE CLASSIFICATION

Every discovered behavior must be classified:

``` text
CONFIRMED
INFERRED
UNKNOWN
CONFLICTING
```

------------------------------------------------------------------------

# 45. GOLDEN TRANSACTIONS

Create golden transactions for critical processes.

Each contains:

``` text
Scenario
Input
Expected Result
Legacy Result
Modern Result
Comparison
Approved Difference
```

------------------------------------------------------------------------

# 46. LEGACY VS MODERN VALIDATION

For every critical migrated capability:

``` text
Legacy
   ↓
Golden Transaction
   ↓
Modern
   ↓
Compare
```

Differences:

``` text
Expected
Defect
Legacy Defect
Approved Business Change
Unknown
```

------------------------------------------------------------------------

# 47. BUSINESS FUNCTION PRESERVATION MATRIX

Maintain:

``` text
Legacy Function
        ↓
Business Capability
        ↓
Business Rules
        ↓
Modern Use Case
        ↓
Modern API
        ↓
Modern UI
        ↓
Modern Database
        ↓
Automated Tests
```

------------------------------------------------------------------------

# 48. REPORTING

Crystal Reports are part of the business specification.

For every report identify:

``` text
Report
Purpose
Users
Parameters
Data Sources
Queries
Calculations
Business Rules
Output
Permissions
Scheduling
Export Requirements
```

Redesign the reporting implementation using the approved modern
architecture.

------------------------------------------------------------------------

# 49. INTEGRATION DISCOVERY

For every integration identify:

``` text
System
Purpose
Protocol
Endpoint
Authentication
Request
Response
Timeout
Retry
Error Handling
Monitoring
Business Rules
```

------------------------------------------------------------------------

# 50. TESTING

Minimum levels:

``` text
Unit
Integration
API
Database
Security
Regression
End-to-End
Performance
UAT
```

------------------------------------------------------------------------

# 51. TEST-FIRST PRINCIPLE

For important business rules:

``` text
Requirement
   ↓
Test
   ↓
Implementation
   ↓
Validation
```

------------------------------------------------------------------------

# 52. REGRESSION TESTING

Every modernization change must consider:

``` text
Affected Module
Dependent Module
Database Objects
API
Integration
Reports
Workflows
Permissions
```

------------------------------------------------------------------------

# 53. TEST FAILURE RULE

If a test fails:

``` text
Investigate
   ↓
Identify Root Cause
   ↓
Fix
   ↓
Retest
```

Never simply disable a failing test.

------------------------------------------------------------------------

# 54. PERFORMANCE

Performance must be measured.

Monitor:

``` text
API Response Time
Database Query Time
Page Load Time
Transaction Time
Memory
CPU
Concurrency
```

------------------------------------------------------------------------

# 55. OBSERVABILITY

Modern components must support:

``` text
Logs
Metrics
Health Checks
Tracing Where Appropriate
Correlation IDs
Alerts
```

------------------------------------------------------------------------

# 56. DEPLOYMENT

All deployment activities must follow:

``` text
07_Deployment/
```

Environments:

``` text
DEV
QA
SIT
UAT
PRE-PROD
PRODUCTION
```

------------------------------------------------------------------------

# 57. CI/CD

Desired pipeline:

``` text
Commit
 ↓
Build
 ↓
Unit Tests
 ↓
Static Analysis
 ↓
Security Scan
 ↓
Package
 ↓
Integration Tests
 ↓
Deploy QA
 ↓
Regression
 ↓
UAT
 ↓
Approval
 ↓
Production
```

------------------------------------------------------------------------

# 58. PRODUCTION RULE

Never deploy directly to production as part of normal development.

Production deployment requires:

``` text
Approved Release
Testing Evidence
Deployment Plan
Rollback Plan
Business Approval Where Required
Technical Approval
```

------------------------------------------------------------------------

# 59. ROLLBACK

Every production change requires:

``` text
Application Rollback
Configuration Rollback
Database Recovery
Feature Flag Disablement
Traffic Switch
```

as applicable.

------------------------------------------------------------------------

# 60. REPLIT AI DEVELOPMENT PROCESS

Every significant task must follow:

``` text
READ
 ↓
DISCOVER
 ↓
ANALYZE
 ↓
PLAN
 ↓
IMPLEMENT
 ↓
TEST
 ↓
REVIEW
 ↓
DOCUMENT
```

------------------------------------------------------------------------

# 61. TASK EXECUTION RULE

For every new task:

1.  Read relevant MD files.
2.  Inspect existing business behavior.
3.  Inspect database dependencies.
4.  Identify affected modules.
5.  Identify business rules.
6.  Produce implementation plan.
7.  Implement only approved scope.
8.  Run tests.
9.  Compare against legacy behavior.
10. Review changes.
11. Update documentation.
12. Report completion.

------------------------------------------------------------------------

# 62. CHANGE ISOLATION

Do not modify unrelated functionality.

If a change affects another module:

``` text
Identify Dependency
Document Impact
Test Dependency
Report Impact
```

------------------------------------------------------------------------

# 63. NO SILENT CHANGES

Never silently:

``` text
Rename APIs
Rename database fields
Delete fields
Delete business functions
Change business rules
Change calculations
Change permissions
Change workflows
Change reports
Change integrations
```

without documentation and approval.

------------------------------------------------------------------------

# 64. NO PLACEHOLDER BUSINESS LOGIC

Do not use production placeholders:

``` text
TODO
return true
return false
fake data
mock business calculations
hard-coded approvals
hard-coded permissions
```

Mocks are allowed only in test contexts.

------------------------------------------------------------------------

# 65. CODE QUALITY

Code must be:

``` text
Readable
Maintainable
Testable
Modular
Secure
Consistent
```

Avoid:

``` text
Duplicate Logic
God Classes
God Methods
Hard-Coded Business Rules
Hidden Dependencies
Circular Dependencies
```

------------------------------------------------------------------------

# 66. DATABASE CODE QUALITY

SQL must be:

``` text
Parameterized
Reviewed
Indexed Appropriately
Transaction-Safe
Auditable
Performant
```

Avoid unnecessary:

``` text
SELECT *
Unbounded Queries
Cursor Abuse
N+1 Queries
Implicit Conversions
Unindexed Critical Queries
```

------------------------------------------------------------------------

# 67. TRACEABILITY

Every important requirement must be traceable:

``` text
Requirement
   ↓
Business Capability
   ↓
Use Case
   ↓
API
   ↓
UI
   ↓
Database
   ↓
Test
   ↓
Deployment
```

------------------------------------------------------------------------

# 68. MODERNIZATION WAVES

## Wave 1 --- Foundation

``` text
Authentication
User Administration
Settings
```

## Wave 2 --- Operational

``` text
Agent Management
Business Tracking
Case Register
Enquiry
Log Activity
```

## Wave 3 --- Financial

``` text
Commissions
Debtors
Premium Refund
Production
```

## Wave 4 --- Insurance Operations

``` text
Medical Underwriting
Non-Medical Renewal
Retail Renewals
Portfolio Management
```

## Wave 5 --- Supporting

``` text
Complaint Tracking
OFF-System Cases
Risk Register
Reports
Retail BenchMarks
A-Home
```

------------------------------------------------------------------------

# 69. REFERENCE MODULE

The first complete modernization module should be:

``` text
Authentication
```

It must demonstrate:

``` text
Business Discovery
Business Rule Extraction
Database Mapping
Domain Model
Application Layer
API
Frontend
Security
Authorization
Audit
Testing
Deployment
Monitoring
Documentation
```

------------------------------------------------------------------------

# 70. MODULE FACTORY

After Authentication, create reusable patterns for:

``` text
Domain
Application
API
Frontend
Database
Testing
Security
Audit
Deployment
Documentation
```

------------------------------------------------------------------------

# 71. GIT

All meaningful changes must be version controlled.

Commits:

``` text
Small
Focused
Descriptive
Traceable
```

Examples:

``` text
feat(auth): implement authentication service
fix(refund): correct refund approval validation
test(renewal): add renewal regression scenarios
db(agent): add agent status migration
```

------------------------------------------------------------------------

# 72. COMMIT RULE

Never commit:

``` text
Secrets
Passwords
Tokens
Production Credentials
Temporary Files
Build Artifacts
Large Unnecessary Files
```

------------------------------------------------------------------------

# 73. BRANCHING

Preferred:

``` text
main
develop
feature/*
release/*
hotfix/*
```

------------------------------------------------------------------------

# 74. ENVIRONMENT VARIABLES

Use environment configuration for:

``` text
Database Connections
API URLs
Authentication
Storage
Message Queues
External Services
Feature Flags
```

------------------------------------------------------------------------

# 75. AI SAFETY RULES

AI must never:

``` text
Delete Production Data
Drop Production Tables
Expose Credentials
Bypass Security
Disable Tests
Disable Audit
Modify Production Without Authorization
Invent Business Rules
Hide Errors
Hide Known Defects
```

------------------------------------------------------------------------

# 76. DESTRUCTIVE OPERATION RULE

Before destructive operations:

``` text
STOP
IDENTIFY IMPACT
DOCUMENT OPERATION
REQUEST APPROVAL
```

------------------------------------------------------------------------

# 77. PRODUCTION DATABASE RULE

Production databases are read-only unless an explicitly authorized
deployment or migration is being executed.

The test RDS environment may be used for discovery according to the
read-only rules in this document.

------------------------------------------------------------------------

# 78. SECRETS RULE

If credentials or secrets are discovered:

``` text
Do not print them
Do not commit them
Do not include them in documentation
Do not expose them in logs
```

------------------------------------------------------------------------

# 79. WHEN INFORMATION IS MISSING

If information is missing:

``` text
Do not invent it.
```

Report:

``` text
MISSING INFORMATION
Evidence Needed
Impact
Recommended Action
```

------------------------------------------------------------------------

# 80. WHEN REQUIREMENTS CONFLICT

Use:

``` text
Identify Conflict
      ↓
Locate Documents
      ↓
Identify Authority
      ↓
Explain Conflict
      ↓
Do Not Guess
      ↓
Request Resolution
```

------------------------------------------------------------------------

# 81. REPLIT INITIALIZATION PROTOCOL

When the repository is opened for the first time:

``` text
DO NOT MODIFY APPLICATION CODE
DO NOT MODIFY DATABASE SCHEMAS
DO NOT DELETE FILES
DO NOT RENAME FILES
DO NOT REFACTOR LEGACY CODE
DO NOT CREATE PRODUCTION FUNCTIONALITY
```

First inspect:

``` text
All directories
All Markdown documentation
Legacy solution/project files
Application projects
Frontend assets
Configuration files
Database scripts
Reports
Integration files
Tests
Deployment configuration
CI/CD configuration
```

------------------------------------------------------------------------

# 82. DOCUMENTATION LOADING PROTOCOL

Before implementation, inspect:

``` text
replit.md

00_Discovery/
01_Architecture/
02_Database/
03_Backend/
04_Frontend/
05_Modules/
06_Testing/
07_Deployment/
```

For cross-domain tasks, inspect every relevant domain.

------------------------------------------------------------------------

# 83. REPOSITORY DISCOVERY OUTPUT

Create:

``` text
/discovery/
```

with:

``` text
Application_Inventory.md
Page_Catalogue.md
Module_Catalogue.md
Dependency_Map.md
Database_Catalogue.md
Database_Object_Catalogue.md
Database_Relationship_Map.md
Database_Dependency_Map.md
Data_Dictionary.md
Data_Lineage.md
Data_Quality_Assessment.md
Integration_Catalogue.md
Report_Catalogue.md
Security_Model.md
Authentication_Flow.md
Authorization_Model.md
Business_Rule_Catalogue.md
Workflow_Catalogue.md
Business_Capability_Catalogue.md
Legacy_Architecture_Assessment.md
Modernization_Risk_Register.md
Discovery_Status.md
```

Every discovery item must identify its evidence source.

------------------------------------------------------------------------

# 84. DATABASE DISCOVERY EXECUTION ORDER

Database discovery must follow:

``` text
1. Validate DNS
2. Validate network connectivity
3. Validate TCP 1433
4. Authenticate
5. Enumerate databases
6. Enumerate schemas
7. Enumerate tables
8. Enumerate columns
9. Enumerate constraints
10. Enumerate indexes
11. Enumerate views
12. Enumerate stored procedures
13. Enumerate functions
14. Enumerate triggers
15. Enumerate dependencies
16. Profile reference data
17. Profile business data
18. Identify business rules
19. Identify data quality issues
20. Generate documentation
```

Do not modify data during these activities.

------------------------------------------------------------------------

# 85. DATABASE DISCOVERY STATUS

Maintain:

``` text
DATABASE_DISCOVERY_STATUS.md
```

It must contain:

``` text
Database Host
Port
Connectivity Status
Authentication Status
Databases Discovered
Objects Discovered
Permissions
Discovery Completion %
Issues
Missing Databases
Blocked Items
Next Actions
```

Never include passwords or secrets.

------------------------------------------------------------------------

# 86. IMPLEMENTATION GATE

Before implementation, produce:

``` text
Objective
Scope
Affected Modules
Affected Files
Affected Database Objects
Affected APIs
Affected UI
Business Rules
Dependencies
Security Impact
Data Impact
Regression Impact
Test Plan
Rollback Considerations
Documentation Updates
```

------------------------------------------------------------------------

# 87. LEGACY CODE RULE

Legacy code is initially:

``` text
READ-ONLY REFERENCE
```

unless a specific task explicitly requires modifying it.

The new application must be built independently.

------------------------------------------------------------------------

# 88. MODERN APPLICATION BOUNDARY

Preferred:

``` text
src/
    Backend/
        API/
        Application/
        Domain/
        Infrastructure/
        Shared/

    Frontend/

    Tests/
        Unit/
        Integration/
        API/
        E2E/
        Regression/
```

------------------------------------------------------------------------

# 89. CODE GENERATION RULE

Generated code must:

``` text
Compile
Follow project standards
Contain no fake business logic
Contain no hard-coded credentials
Contain no production secrets
Contain appropriate validation
Contain appropriate error handling
Contain appropriate logging
Contain appropriate authorization
Have corresponding tests
```

------------------------------------------------------------------------

# 90. TEST EXECUTION GATE

After implementation:

``` text
Build
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
API Tests
 ↓
Regression Tests
 ↓
Security Checks
```

Where applicable:

``` text
Database Tests
Performance Tests
E2E Tests
```

------------------------------------------------------------------------

# 91. CHANGE REVIEW

Before completion inspect:

``` text
Files Added
Files Modified
Files Deleted
Database Changes
API Changes
UI Changes
Configuration Changes
Tests Added
Documentation Updated
```

------------------------------------------------------------------------

# 92. TRACEABILITY UPDATE

Every significant implementation must update:

``` text
Requirement
    ↓
Legacy Evidence
    ↓
Business Rule
    ↓
Modern Component
    ↓
API
    ↓
UI
    ↓
Database
    ↓
Test
    ↓
Release
```

------------------------------------------------------------------------

# 93. TASK COMPLETION REPORT

At the end of every significant task:

``` text
TASK
Objective

STATUS
Completed / Partially Completed / Blocked

DOCUMENTATION REVIEWED
<list>

FILES CREATED
<list>

FILES MODIFIED
<list>

DATABASE CHANGES
<list>

API CHANGES
<list>

UI CHANGES
<list>

TESTS
<results>

SECURITY
<assessment>

REGRESSION IMPACT
<assessment>

KNOWN ISSUES
<list>

UNKNOWN INFORMATION
<list>

NEXT RECOMMENDED ACTION
<action>
```

------------------------------------------------------------------------

# 94. DISCOVERY COMPLETION GATE

Discovery may only be declared complete when:

``` text
[ ] Application Inventory
[ ] Page Catalogue
[ ] Module Catalogue
[ ] Dependency Map
[ ] Database Catalogue
[ ] Database Object Catalogue
[ ] Database Relationship Map
[ ] Database Dependency Map
[ ] Data Dictionary
[ ] Data Lineage
[ ] Data Quality Assessment
[ ] Integration Catalogue
[ ] Report Catalogue
[ ] Security Model
[ ] Authentication Flow
[ ] Authorization Model
[ ] Business Rule Catalogue
[ ] Workflow Catalogue
[ ] Business Capability Catalogue
[ ] Legacy Architecture Assessment
[ ] Modernization Risk Register
[ ] Discovery Status
```

Only then output:

``` text
DISCOVERY COMPLETE
```

Otherwise:

``` text
DISCOVERY IN PROGRESS
```

------------------------------------------------------------------------

# 95. ARCHITECTURE APPROVAL GATE

Before mass implementation:

``` text
[ ] Legacy architecture understood
[ ] Business capabilities identified
[ ] Target architecture documented
[ ] Module boundaries defined
[ ] Database strategy defined
[ ] Security architecture defined
[ ] API architecture defined
[ ] Frontend architecture defined
[ ] Testing strategy defined
[ ] Deployment strategy defined
[ ] Migration strategy defined
[ ] Risks documented
```

------------------------------------------------------------------------

# 96. REFERENCE MODULE GATE

Authentication must validate:

``` text
Backend Architecture
Frontend Architecture
Database Access Pattern
API Standards
Authentication
Authorization
Validation
Audit
Logging
Error Handling
Testing
CI/CD
Deployment
Observability
Documentation
```

------------------------------------------------------------------------

# 97. MODULE RECONSTRUCTION PROTOCOL

Every module:

``` text
DISCOVER
    ↓
MAP
    ↓
EXTRACT BUSINESS RULES
    ↓
DOCUMENT
    ↓
DESIGN
    ↓
TEST
    ↓
IMPLEMENT
    ↓
COMPARE
    ↓
VALIDATE
    ↓
DOCUMENT
```

------------------------------------------------------------------------

# 98. MODULE DEFINITION OF DONE

A module is complete only when:

``` text
[ ] Legacy functionality mapped
[ ] Business rules documented
[ ] Database mapped
[ ] Target domain designed
[ ] Domain implemented
[ ] Application layer implemented
[ ] API implemented
[ ] Frontend implemented
[ ] Security implemented
[ ] Authorization implemented
[ ] Audit implemented
[ ] Validation implemented
[ ] Workflow implemented
[ ] Reports implemented
[ ] Integrations implemented
[ ] Unit tests passed
[ ] Integration tests passed
[ ] API tests passed
[ ] E2E tests passed
[ ] Regression tests passed
[ ] UAT passed
[ ] Deployment validated
[ ] Documentation complete
[ ] Traceability complete
```

------------------------------------------------------------------------

# 99. RELEASE DEFINITION OF DONE

A release is complete only when:

``` text
[ ] Scope approved
[ ] Code complete
[ ] Tests passed
[ ] Security passed
[ ] Database changes validated
[ ] Migration validated
[ ] Deployment tested
[ ] Rollback tested/planned
[ ] Release notes complete
[ ] Business approval obtained where required
[ ] Production deployment completed
[ ] Smoke testing passed
[ ] Monitoring active
[ ] Release documented
```

------------------------------------------------------------------------

# 100. CURRENT IMPLEMENTATION PRIORITY

Follow this exact order:

``` text
01. Documentation Index
02. Repository Discovery
03. Legacy Application Discovery
04. Database Connectivity Validation
05. Database Discovery
06. Dependency Mapping
07. Business Rule Discovery
08. Workflow Discovery
09. Security Discovery
10. Integration Discovery
11. Reporting Discovery
12. Legacy Baseline
13. Golden Transactions
14. Business Capability Catalogue
15. Target Architecture Validation
16. Target Data Architecture
17. Backend Foundation
18. Frontend Foundation
19. Authentication
20. Module Factory
21. Core Module Reconstruction
22. Automated Regression
23. Data Migration
24. UAT
25. PRE-PROD
26. Production Rollout
27. Legacy Retirement
```

------------------------------------------------------------------------

# 101. FIRST TASK --- DISCOVERY ONLY

When the repository is first initialized:

> **DO NOT MODIFY THE APPLICATION.**

Perform complete discovery.

Produce:

``` text
Application Inventory
Page Catalogue
Module Catalogue
Dependency Map
Database Catalogue
Database Object Catalogue
Database Relationship Map
Database Dependency Map
Data Dictionary
Data Lineage
Data Quality Assessment
Integration Catalogue
Report Catalogue
Security Model
Authentication Flow
Authorization Model
Business Rule Catalogue
Workflow Catalogue
Business Capability Catalogue
Legacy Architecture Assessment
Modernization Risk Register
Discovery Status
```

------------------------------------------------------------------------

# 102. SECOND TASK --- BUSINESS SPECIFICATION

After technical discovery, reconstruct the business specification.

For each module identify:

``` text
Business Objective
Actors
Users
Roles
Permissions
Inputs
Outputs
Business Rules
Validations
Calculations
Workflows
Approvals
Exceptions
Notifications
Reports
Integrations
Data Requirements
Audit Requirements
```

This becomes the functional specification for the new application.

------------------------------------------------------------------------

# 103. THIRD TASK --- ARCHITECTURE VALIDATION

After business discovery:

1.  Compare business capabilities with target architecture.
2.  Identify gaps.
3.  Identify risks.
4.  Identify migration dependencies.
5.  Identify module boundaries.
6.  Identify service extraction candidates.
7.  Identify database modernization requirements.
8.  Identify security gaps.
9.  Identify performance risks.
10. Identify reporting requirements.
11. Identify integration requirements.

------------------------------------------------------------------------

# 104. FOURTH TASK --- REFERENCE MODULE

After architecture approval:

``` text
Implement Authentication
```

Use it to validate the complete development pattern.

------------------------------------------------------------------------

# 105. FIFTH TASK --- MODULE FACTORY

After Authentication:

``` text
ONE APPROVED MODULE PATTERN
          ↓
REPEATABLE
          ↓
22 BUSINESS MODULES
```

------------------------------------------------------------------------

# 106. FINAL OPERATING PRINCIPLE

Always follow:

``` text
UNDERSTAND
    ↓
DOCUMENT
    ↓
PLAN
    ↓
IMPLEMENT
    ↓
TEST
    ↓
VALIDATE
    ↓
REVIEW
    ↓
DEPLOY
    ↓
MONITOR
```

Never:

``` text
GUESS
  ↓
CODE
  ↓
DEPLOY
```

------------------------------------------------------------------------

# 107. FINAL BUSINESS-SPECIFICATION PRINCIPLE

The most important rule in this project is:

> **THE EXISTING APPLICATION IS THE BUSINESS SPECIFICATION.**

> **THE NEW APPLICATION IS A COMPLETELY NEW ENTERPRISE IMPLEMENTATION.**

Therefore:

``` text
DO NOT COPY THE LEGACY APPLICATION
DO NOT MECHANICALLY CONVERT THE LEGACY APPLICATION
DO NOT PRESERVE LEGACY TECHNICAL LIMITATIONS
DO NOT ASSUME LEGACY ARCHITECTURE IS CORRECT
DO NOT ASSUME LEGACY DATABASE DESIGN IS THE TARGET DESIGN
DO NOT ASSUME LEGACY UI STRUCTURE IS THE TARGET UX
```

Instead:

``` text
UNDERSTAND
        ↓
EXTRACT
        ↓
DOCUMENT
        ↓
REDESIGN
        ↓
IMPLEMENT
        ↓
TEST
        ↓
COMPARE
        ↓
VALIDATE
        ↓
MIGRATE
        ↓
DEPLOY
```

The final objective is:

``` text
LEGACY BUSINESS KNOWLEDGE
+
APPROVED BUSINESS REQUIREMENTS
+
MODERN ARCHITECTURE
+
MODERN SECURITY
+
MODERN UX
+
RELIABLE DATA
+
AUTOMATED TESTING
+
CONTROLLED DEPLOYMENT
        ↓
NEW ENTERPRISE APPLICATION
```

with:

``` text
NO UNAUTHORIZED FUNCTIONAL LOSS
NO UNDOCUMENTED BUSINESS-RULE CHANGES
NO UNCONTROLLED DATA LOSS
NO BLIND LEGACY CODE CONVERSION
NO UNCONTROLLED PRODUCTION CHANGES
NO EXPOSED DATABASE CREDENTIALS
NO UNAUTHORIZED DATABASE MODIFICATION
```

The system must be built:

> **incrementally, safely, measurably, traceably and reversibly.**

> **Understand the legacy system before changing it.\
> Extract the business knowledge from it.\
> Preserve what the business needs.\
> Redesign what technology can improve.\
> Prove the new implementation through testing and traceability.** ---

# 108. VERSION 3.2 GOVERNANCE EXTENSIONS

Version 3.2 extends the existing Replit master instructions with formal
requirements governance, business sign-off, migration reconciliation,
API contract governance, design-system enforcement, controlled rollout,
parallel validation, disaster recovery, production hypercare and AI
evidence classification.

These controls are mandatory and must be applied together with all
preceding sections.

------------------------------------------------------------------------

# 109. REQUIREMENTS BASELINE

Every material requirement must have a unique identifier and lifecycle
status.

Minimum requirement metadata:

``` text
Requirement ID
Title
Description
Business Objective
Source
Evidence
Priority
Scope
Status
Version
Owner
Dependencies
Acceptance Criteria
Related Business Rules
Related Modules
Related Tests
Related Release
```

Allowed statuses:

``` text
DRAFT
UNDER_REVIEW
APPROVED
IMPLEMENTED
TESTED
UAT
RELEASED
SUPERSEDED
REJECTED
```

Do not implement a requirement marked:

``` text
DRAFT
UNDER_REVIEW
REJECTED
```

unless an explicitly authorized development activity requires it.

------------------------------------------------------------------------

# 110. CHANGE REQUEST GOVERNANCE

Any material change to an approved baseline must be treated as a Change
Request.

Change Request flow:

``` text
CHANGE REQUEST
      ↓
IMPACT ANALYSIS
      ↓
BUSINESS / TECHNICAL REVIEW
      ↓
APPROVAL
      ↓
RE-BASELINE
      ↓
IMPLEMENT
      ↓
TEST
      ↓
TRACE
      ↓
RELEASE
```

A Change Request must identify:

``` text
CR ID
Requested Change
Reason
Requestor
Business Justification
Affected Requirements
Affected Business Rules
Affected Modules
Affected APIs
Affected Database Objects
Affected Reports
Affected Integrations
Security Impact
Migration Impact
Testing Impact
Deployment Impact
Rollback Impact
Risk
Approval
Decision Date
```

Never silently change an approved requirement.

------------------------------------------------------------------------

# 111. BUSINESS SIGN-OFF GATE

Technical completion does not equal business acceptance.

For each business-critical module:

``` text
DISCOVERY COMPLETE
      ↓
BUSINESS RULES VALIDATED
      ↓
FUNCTIONAL SPECIFICATION APPROVED
      ↓
ARCHITECTURE APPROVED
      ↓
IMPLEMENTATION
      ↓
TESTING
      ↓
LEGACY / MODERN COMPARISON
      ↓
UAT
      ↓
BUSINESS SIGN-OFF
      ↓
RELEASE
```

A production release may not be declared business-complete without
documented business approval where required.

------------------------------------------------------------------------

# 112. DATA MIGRATION RECONCILIATION STANDARD

Data migration must include quantitative and business reconciliation.

Minimum reconciliation:

``` text
Source Record Count
Target Record Count
Source Key Population
Target Key Population
Source Financial Totals
Target Financial Totals
Missing Records
Duplicate Records
Rejected Records
Transformed Records
Exception Records
Variance
Variance Explanation
Business Approval
```

For financial, policy, claims, premium, debtor, commission and refund
data, reconciliation must be performed at the appropriate business
transaction level.

Never declare migration successful solely because the target database
loaded successfully.

------------------------------------------------------------------------

# 113. API CONTRACT GOVERNANCE

Every production API must have an approved contract.

Minimum API contract:

``` text
API ID
Name
Purpose
Version
Endpoint
HTTP Method
Authentication
Authorization
Request Schema
Response Schema
Validation Rules
Error Contract
Pagination
Filtering
Sorting
Idempotency
Timeout
Retry Behavior
Correlation ID
Audit Requirement
Rate Limit Where Applicable
Backward Compatibility
Deprecation Policy
Test Cases
```

Use an approved API specification format such as OpenAPI where
applicable.

Do not expose internal database structures as public API contracts.

API changes must follow Change Request governance.

------------------------------------------------------------------------

# 114. FRONTEND DESIGN SYSTEM GOVERNANCE

All new frontend modules must use the approved enterprise design system.

Standardize:

``` text
Application Shell
Navigation
Page Layout
Forms
Inputs
Validation
Tables
Search
Filtering
Pagination
Dialogs
Approval Screens
Dashboards
Notifications
Loading States
Empty States
Error States
Accessibility
Responsive Behavior
Typography
Spacing
Icons
```

Do not create module-specific UI patterns when an approved reusable
component exists.

The Authentication reference module establishes the approved frontend
pattern.

------------------------------------------------------------------------

# 115. FEATURE FLAGS AND CONTROLLED ROLLOUT

Feature flags may be used for controlled release.

Required controls:

``` text
Flag Name
Purpose
Owner
Environment
Default State
Activation Rules
Dependencies
Audit
Rollback Behavior
Retirement Date
```

Preferred rollout:

``` text
DEV
 ↓
QA
 ↓
SIT
 ↓
UAT
 ↓
PILOT
 ↓
CONTROLLED PRODUCTION
 ↓
FULL ROLLOUT
```

A feature flag must not be used to bypass security, testing, audit or
required approvals.

------------------------------------------------------------------------

# 116. PARALLEL RUN / DUAL VALIDATION

For high-risk business capabilities, support controlled parallel
validation of legacy and modern results.

``` text
LEGACY TRANSACTION
        +
MODERN TRANSACTION
        ↓
COMPARISON
        ↓
DIFFERENCE CLASSIFICATION
        ↓
BUSINESS REVIEW
```

Compare, where applicable:

``` text
Transaction Results
Calculations
Balances
Statuses
Approvals
Policies
Claims
Premiums
Commissions
Refunds
Reports
Notifications
```

Differences must be classified:

``` text
EXPECTED
LEGACY DEFECT
MODERN DEFECT
APPROVED BUSINESS CHANGE
DATA DIFFERENCE
UNKNOWN
```

Do not suppress unexplained differences.

------------------------------------------------------------------------

# 117. DISASTER RECOVERY AND BUSINESS CONTINUITY

Production readiness must consider:

``` text
RTO
RPO
Backup Strategy
Restore Strategy
Database Recovery
Application Recovery
Configuration Recovery
Dependency Recovery
Failover
Monitoring
Communication
Recovery Runbook
Restore Testing
Failover Testing
```

Recovery procedures must be tested periodically according to the
approved operational standard.

------------------------------------------------------------------------

# 118. PRODUCTION HYPERCARE

After major production deployment:

``` text
DEPLOY
 ↓
SMOKE TEST
 ↓
PRODUCTION VALIDATION
 ↓
HYPERCARE
 ↓
MONITOR
 ↓
INCIDENT REVIEW
 ↓
BUSINESS CONFIRMATION
 ↓
BAU SUPPORT
```

Hypercare must monitor:

``` text
Application Errors
API Errors
Database Errors
Performance
User Authentication
Critical Transactions
Integration Failures
Queues / Jobs
Audit Events
Data Integrity
```

Known issues must be documented and owned.

------------------------------------------------------------------------

# 119. OBSERVABILITY DEFINITION OF DONE

A production-ready component must have, where applicable:

``` text
[ ] Structured Application Logs
[ ] Security Logs
[ ] Audit Logs
[ ] Error Logs
[ ] Performance Metrics
[ ] API Metrics
[ ] Database Metrics
[ ] Health Endpoint
[ ] Dependency Health
[ ] Correlation ID
[ ] Alerts
[ ] Monitoring Dashboard
[ ] Operational Runbook
```

A component must not be considered operationally complete merely because
functional tests pass.

------------------------------------------------------------------------

# 120. AI EVIDENCE CLASSIFICATION

Every significant AI-derived conclusion must be classified as:

``` text
SOURCE-CONFIRMED
INFERRED
RECOMMENDATION
UNKNOWN
CONFLICTING
```

Rules:

``` text
SOURCE-CONFIRMED
→ Directly supported by approved documentation, verified legacy behavior or verified technical evidence.

INFERRED
→ Reasonable interpretation supported by evidence but not explicitly documented.

RECOMMENDATION
→ Proposed technical or architectural improvement.

UNKNOWN
→ Insufficient evidence to determine the answer.

CONFLICTING
→ Two or more authoritative or credible sources disagree.
```

AI must never present an inference or recommendation as an approved
business rule.

------------------------------------------------------------------------

# 121. AI DECISION RECORD

For significant implementation decisions record:

``` text
Decision ID
Decision
Context
Evidence
Alternatives Considered
Selected Approach
Reason
Business Impact
Technical Impact
Security Impact
Data Impact
Migration Impact
Operational Impact
Risk
Approval Required
Approval Status
```

Use an ADR when the decision has lasting architectural consequences.

------------------------------------------------------------------------

# 122. ENHANCED TRACEABILITY

The minimum traceability chain is:

``` text
Requirement
   ↓
Change Request if Applicable
   ↓
Business Capability
   ↓
Business Rule
   ↓
Legacy Evidence
   ↓
Use Case
   ↓
Modern Component
   ↓
API
   ↓
UI
   ↓
Database
   ↓
Test
   ↓
UAT
   ↓
Release
   ↓
Production Validation
```

Every material change must update traceability.

------------------------------------------------------------------------

# 123. RELEASE READINESS GATE

Before production release confirm:

``` text
[ ] Approved Scope
[ ] Requirements Baselined
[ ] Change Requests Approved
[ ] Business Sign-Off Where Required
[ ] Code Complete
[ ] Unit Tests Passed
[ ] Integration Tests Passed
[ ] API Tests Passed
[ ] Regression Tests Passed
[ ] E2E Tests Passed
[ ] Security Tests Passed
[ ] Performance Validated
[ ] Database Migration Validated
[ ] Data Reconciliation Passed
[ ] API Contracts Approved
[ ] Monitoring Active
[ ] Alerts Configured
[ ] Backup / Recovery Verified
[ ] Rollback Plan Approved
[ ] Release Notes Complete
[ ] Support / Hypercare Plan Ready
[ ] Traceability Complete
```

------------------------------------------------------------------------

# 124. MODULE FACTORY EXTENSION

The approved Authentication module pattern must establish reusable
standards for:

``` text
Domain
Application
API
Frontend
Database
Validation
Authorization
Audit
Logging
Error Handling
Testing
Observability
Deployment
Documentation
```

Every subsequent module should reuse the pattern unless a documented
exception is approved.

------------------------------------------------------------------------

# 125. MODULE DEFINITION OF DONE --- VERSION 3.2

A module is complete only when all applicable conditions are satisfied:

``` text
[ ] Legacy Functionality Mapped
[ ] Business Capability Approved
[ ] Requirements Baselined
[ ] Business Rules Approved
[ ] Legacy Evidence Captured
[ ] Target Domain Designed
[ ] Database Mapping Complete
[ ] API Contract Approved
[ ] Frontend Pattern Approved
[ ] Security Implemented
[ ] Authorization Implemented
[ ] Audit Implemented
[ ] Validation Implemented
[ ] Workflow Implemented
[ ] Reports Implemented
[ ] Integrations Implemented
[ ] Unit Tests Passed
[ ] Integration Tests Passed
[ ] API Tests Passed
[ ] E2E Tests Passed
[ ] Regression Tests Passed
[ ] Golden Transactions Passed
[ ] Legacy / Modern Differences Classified
[ ] Data Reconciliation Passed Where Applicable
[ ] UAT Passed
[ ] Business Sign-Off Obtained Where Required
[ ] Observability Implemented
[ ] Deployment Validated
[ ] Rollback Prepared
[ ] Documentation Complete
[ ] Traceability Complete
```

------------------------------------------------------------------------

# 126. VERSION 3.2 FINAL OPERATING MODEL

The complete Replit execution model is:

``` text
READ
 ↓
DISCOVER
 ↓
EVIDENCE CLASSIFY
 ↓
DOCUMENT
 ↓
BASELINE
 ↓
PLAN
 ↓
APPROVAL
 ↓
IMPLEMENT
 ↓
TEST
 ↓
COMPARE
 ↓
RECONCILE
 ↓
VALIDATE
 ↓
BUSINESS SIGN-OFF
 ↓
RELEASE
 ↓
DEPLOY
 ↓
HYPERCARE
 ↓
MONITOR
 ↓
DOCUMENT
```

Never:

``` text
GUESS
 ↓
CODE
 ↓
DEPLOY
```

------------------------------------------------------------------------

# 127. VERSION 3.2 COMMAND

All existing sections of this document remain mandatory.

Version 3.2 adds:

``` text
REQUIREMENTS GOVERNANCE
+
CHANGE CONTROL
+
BUSINESS SIGN-OFF
+
DATA RECONCILIATION
+
API CONTRACT GOVERNANCE
+
DESIGN SYSTEM GOVERNANCE
+
FEATURE FLAGS
+
PARALLEL VALIDATION
+
DISASTER RECOVERY
+
PRODUCTION HYPERCARE
+
OBSERVABILITY
+
AI EVIDENCE CLASSIFICATION
+
ENHANCED TRACEABILITY
```

The objective remains:

> **Build the new enterprise application incrementally, safely,
> measurably, traceably and reversibly, while preserving approved
> business capability and eliminating unnecessary legacy technical
> limitations.**

---

## User preferences

**Agent operating mode — Minimize Usage Context**

- Inspect only files directly relevant to the task. Do not scan the repository broadly.
- Make the smallest safe change. Do not refactor, rename, or alter unrelated code.
- Reuse existing components, services, APIs, and DB objects before creating new ones.
- Read only the files needed. Do not reread unchanged files within the same task.
- Validate with targeted checks. Do not run full test suites unless required.
- Stop immediately once the requested functionality is implemented and passes targeted validation.
- Do not expand scope unless evidence demands it.
- Report concisely: what changed, files changed, validation performed, any remaining issue.
- Response format after task completion:
  ```
  Implemented.
  Changed: <files>
  Validation: <targeted check>
  Remaining: None
  ```
