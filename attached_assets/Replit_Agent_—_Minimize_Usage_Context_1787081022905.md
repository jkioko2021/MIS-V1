# Replit Agent — Minimize Usage Context

## PRIMARY OBJECTIVE

Work efficiently and minimize Replit Agent usage, tokens, compute, file scanning, and unnecessary iterations.

Prioritize **small, targeted changes** over broad rewrites.

## OPERATING RULES

### 1. Inspect Before Changing

- Do NOT scan the entire repository unless absolutely necessary.
- First identify the specific files, modules, routes, components, APIs, and database objects relevant to the requested change.
- Reuse existing code and patterns whenever possible.
- Do not recreate functionality that already exists.

### 2. Minimize Context

- Read only the files required for the current task.
- Do not repeatedly reread unchanged files.
- Do not load large generated files, logs, build folders, dependencies, binaries, or unrelated documentation.
- Ignore:
  - `node_modules`
  - `.git`
  - build/output directories
  - cache directories
  - uploaded files
  - generated reports
  - temporary files
  - database dumps
  - large log files

### 3. Maintain a Small Working Set

During each task, maintain context only for:

- Relevant files
- Relevant functions/components
- Relevant routes
- Relevant APIs
- Relevant database objects
- Current errors/output
- Relevant configuration

Once a file has been inspected:

- Reuse the information already obtained.
- Do not reread it unless it has changed.
- Do not repeat searches that produced no new information.

### 4. Make Targeted Changes

Before editing, determine:

1. What is broken or required?
2. Which file(s) control it?
3. What is the smallest safe change?

Then modify only those files.

Do NOT:

- Rewrite entire files unnecessarily.
- Refactor unrelated code.
- Rename existing structures without a requirement.
- Change working functionality.
- Introduce new dependencies unless required.
- Change architecture unnecessarily.

### 5. Reuse Existing Architecture

Always prefer:

`Existing Component → Existing Service → Existing API → Existing Database`

over creating new equivalents.

Before creating a new:

- Component
- Service
- API
- Utility
- Database table
- Database query
- Configuration
- Dependency

search the relevant project area first to determine whether an existing implementation can be reused.

### 6. Database Efficiency

For database-related tasks:

- Inspect only the required schema/table/procedure.
- Do not script or scan the entire database unless explicitly requested.
- Prefer targeted queries.
- Never execute destructive SQL without explicit confirmation.
- Avoid `SELECT *` when specific columns are sufficient.
- Use appropriate filtering and indexes.
- Do not repeatedly query the same data during one task.
- Reuse the existing connection/configuration already present in the project.
- Do not modify production data unless explicitly authorized.

### 7. Testing

Use the smallest meaningful validation.

Preferred order:

1. Static inspection
2. Targeted test
3. Targeted build
4. Full test suite only when necessary

Do NOT repeatedly run expensive builds/tests after every minor change.

After making related changes, validate them together.

### 8. Error Handling

If an error occurs:

1. Read the actual error.
2. Identify the affected file/function.
3. Fix the root cause.
4. Re-run only the relevant validation.

Do not repeatedly retry the same command without changing anything.

### 9. Do Not Over-Engineer

Use the simplest solution that satisfies the requirement.

Do not introduce:

- New frameworks
- New libraries
- New services
- New abstractions
- Additional database layers
- Unnecessary design patterns

unless they provide a clear benefit required by the task.

### 10. Preserve Existing Functionality

Before changing existing functionality:

- Identify dependencies.
- Preserve existing APIs.
- Preserve database compatibility.
- Preserve authentication/authorization.
- Preserve existing UI behavior unless the request explicitly changes it.
- Avoid breaking existing modules while implementing a new requirement.

### 11. Scope Control

Treat isolated requests as isolated tasks.

If the requested change can be completed by changing 1–3 files:

- Do not inspect 10–20 files.
- Do not perform repository-wide analysis.
- Do not refactor surrounding modules.

Only expand the scope when evidence shows it is necessary.

### 12. Avoid Unnecessary Explanations

Keep Agent responses concise.

After completing a task, report only:

- What changed
- Files changed
- Validation performed
- Any remaining issue

Do not generate lengthy explanations unless requested.

## TASK EXECUTION MODE

For every request, follow this sequence:

### STEP 1 — TARGET

Identify the smallest relevant area of the application.

### STEP 2 — INSPECT

Inspect only the files required to understand that area.

### STEP 3 — PLAN

Create a short internal plan with the minimum required changes.

Do not spend tokens producing a long plan.

### STEP 4 — IMPLEMENT

Make the smallest safe change.

Reuse existing code wherever possible.

### STEP 5 — VALIDATE

Run only targeted validation.

Do not run the full test suite unless required.

### STEP 6 — REPORT

Provide a concise summary:

```text
Changed:
- file/path

Validation:
- test/build/check performed

Remaining:
- none / specific issue
```

## STOP CONDITION

Stop working immediately when:

1. The requested functionality is implemented.
2. The affected code compiles or passes the relevant targeted validation.
3. No related regression is identified.
4. The requested scope is satisfied.

Do NOT continue with:

- Additional refactoring
- Code cleanup
- Architecture improvements
- Unrelated bug fixes
- Repository-wide optimization
- Documentation generation
- Dependency upgrades
- UI redesign
- Database optimization

unless explicitly requested.

If the task cannot be completed within the identified scope, STOP and report:

- What was discovered
- What is blocking completion
- Which additional files/components would be required
- The minimum next action needed

Do not expand scope automatically.

## CONTEXT REUSE

Once a file has been inspected during the current task:

- Reuse the information already obtained.
- Do not reread the file unless it has changed.
- Do not repeat searches that produced no new information.
- Do not rediscover existing components, APIs, services, or database objects already identified during the task.

Maintain a short working set containing only:

- Relevant files
- Relevant functions/components
- Relevant APIs
- Relevant database objects
- Current error/output

Discard unrelated repository context.

## COMMAND EFFICIENCY

Before running a command, determine whether it is necessary.

Prefer:

```text
Targeted search
    ↓
Read relevant file
    ↓
Make minimal change
    ↓
Targeted validation
    ↓
STOP
```

Avoid:

```text
Repository scan
    ↓
Read many files
    ↓
Run full build
    ↓
Run full tests
    ↓
Refactor
    ↓
Run full build again
```

Do not execute commands simply because they are available.

Every command should have a clear purpose.

## FILE ACCESS RULES

Prioritize:

- Source files directly related to the task
- Relevant configuration files
- Relevant API/service files
- Relevant database objects
- Relevant tests

Avoid unless specifically required:

- `node_modules/`
- `.git/`
- `dist/`
- `build/`
- `out/`
- `.next/`
- `.cache/`
- temporary directories
- uploaded documents
- generated reports
- database dumps
- large logs
- binaries
- generated source files

## DATABASE COMMAND SAFETY

Before executing SQL:

1. Confirm the target database.
2. Confirm the target object.
3. Use the smallest query necessary.
4. Prefer read-only inspection first.
5. Never execute `DELETE`, `DROP`, `TRUNCATE`, or destructive `UPDATE` without explicit authorization.
6. Never modify database structure unless the task requires it.
7. Never scan the entire database for an isolated task.

For data retrieval, prefer:

```sql
SELECT column1, column2
FROM TableName
WHERE relevant_column = @value;
```

over:

```sql
SELECT *
FROM TableName;
```

## CHANGE MANAGEMENT

For each requested change:

### Required

- Identify the relevant code.
- Identify dependencies only where necessary.
- Make the smallest change.
- Preserve existing behavior.
- Validate the change.

### Not Required Unless Requested

- Refactoring
- Code formatting across the project
- Renaming
- Dependency upgrades
- Architecture changes
- New frameworks
- New libraries
- New database layers
- Repository-wide cleanup

## PRIORITY

Always optimize for:

**Minimum Context → Minimum Changes → Minimum Tests → Maximum Reliability**

The best implementation is the **smallest safe implementation that fully satisfies the request**.

Do not confuse more investigation, more code, more tests, or more explanation with better engineering.

## FINAL AGENT RESPONSE

After completing the task, respond using this format:

```text
Implemented.

Changed:
- <file>
- <file>

Validation:
- <targeted validation>

Remaining:
- None
```

If there is an unresolved issue:

```text
Implemented partially.

Changed:
- <file>

Validation:
- <targeted validation>

Blocked by:
- <specific issue>

Next required action:
- <minimum required action>
```

Keep the final response concise.

## CORE PRINCIPLE

> **Do not use Agent context, tokens, compute, file scanning, commands, or iterations unless they materially contribute to completing the requested task.**

**Minimum Context → Minimum Changes → Minimum Tests → Maximum Reliability**