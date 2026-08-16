# Build Environment Validation

**Document ID:** ENV-003  
**Project:** MIS Modernization  
**Phase:** Discovery — Environment Validation  
**Date:** 2026-08-16  
**Mode:** READ-ONLY assessment  
**Status:** COMPLETE — findings classified below  

---

## 1. Build Environment Summary

| Component | Status | Classification |
|---|---|---|
| Operating System | Ubuntu 24.04.4 LTS x86_64 | CONFIRMED |
| Kernel | Linux 6.18.44 (Replit custom) | CONFIRMED |
| Node.js (target runtime) | v24.13.0 ✅ | CONFIRMED |
| npm | 11.6.2 ✅ | CONFIRMED |
| pnpm (workspace manager) | 10.26.1 ✅ | CONFIRMED |
| Python 3 | 3.13.11 ✅ | CONFIRMED |
| .NET SDK | NOT INSTALLED | CONFIRMED |
| curl | 8.14.1 ✅ | CONFIRMED |
| git | 2.53.0 ✅ | CONFIRMED |
| jq | 1.7.1 ✅ | CONFIRMED |
| Available RAM | 12GB free / 15GB total ✅ | CONFIRMED |
| Available Disk | 254GB free / 256GB total ✅ | CONFIRMED |
| Swap | None | CONFIRMED |

---

## 2. Operating System

| Item | Value | Classification |
|---|---|---|
| Distribution | Ubuntu 24.04.4 LTS (Noble Numbat) | CONFIRMED |
| Kernel | Linux 6.18.44 #Replit-Linux SMP | CONFIRMED |
| Architecture | x86_64 (AMD64) | CONFIRMED |
| Shell environment | NixOS-managed Nix store overlay | CONFIRMED |
| Container type | Replit managed container | CONFIRMED |

> **NOTE:** Certain system tools (host, nslookup, dig, ping) are absent because the runtime shell is a NixOS overlay, not a standard Ubuntu install. Standard Ubuntu packages are available via apt but DNS utilities use the Nix store path.

---

## 3. JavaScript / TypeScript Runtime

### 3.1 Node.js

| Item | Value | Classification |
|---|---|---|
| Version | v24.13.0 | CONFIRMED |
| Release type | Current LTS-track | CONFIRMED |
| Location | Managed by Replit/Nix | CONFIRMED |
| Suitability for new application | ✅ SUITABLE | CONFIRMED |

### 3.2 Package Managers

| Tool | Version | Status | Classification |
|---|---|---|---|
| npm | 11.6.2 | ✅ PRESENT | CONFIRMED |
| pnpm | 10.26.1 | ✅ PRESENT — workspace manager | CONFIRMED |
| yarn | Not checked | — | UNKNOWN |

> **CONFIRMED:** pnpm is the active workspace package manager for this project. The monorepo is managed via pnpm workspaces (`pnpm-workspace.yaml`).

### 3.3 Existing Workspace Artifacts

The following artifacts are already configured in the Replit workspace:

| Artifact | Type | Workflow | Status |
|---|---|---|---|
| `artifacts/api-server` | API | API Server | Running |
| `artifacts/mis-v1` | Web | web | Running |
| `artifacts/mockup-sandbox` | Design/Canvas | Component Preview Server | Running |

> **NOTE:** These artifacts pre-exist in the workspace. The MIS modernization new application (`mis-v1`) is already scaffolded. No new artifact creation is needed to begin implementation once discovery is complete.

---

## 4. Python Runtime

| Item | Value | Classification |
|---|---|---|
| Python version | 3.13.11 | CONFIRMED |
| pip | Available | CONFIRMED |
| pymssql | NOT INSTALLED | BLOCKED (needed for DB discovery) |
| pyodbc | NOT INSTALLED | BLOCKED (needed for DB discovery) |

> **NOTE:** Python 3.13 is available and suitable for database discovery scripting once network connectivity is established. pymssql and pyodbc can be installed via pip when required.

---

## 5. .NET SDK Assessment

| Item | Status | Notes | Classification |
|---|---|---|---|
| `dotnet` CLI | NOT INSTALLED | Command not found | CONFIRMED |
| .NET Framework 4.0 | NOT AVAILABLE | Linux — .NET Framework is Windows-only | CONFIRMED |
| .NET 8 SDK | NOT INSTALLED | Could be installed if needed | CONFIRMED |
| Mono | NOT CHECKED | Not needed for new application | UNKNOWN |

### 5.1 Impact Assessment

| Scenario | Impact | Classification |
|---|---|---|
| Compiling legacy application | NOT POSSIBLE — .NET not present, Windows-only runtime | CONFIRMED |
| Running legacy application | NOT POSSIBLE — ASP.NET Web Forms requires Windows/IIS | CONFIRMED |
| Building new application | NOT AFFECTED — new application uses Node.js/TypeScript | CONFIRMED |
| Legacy source analysis | NOT AFFECTED — source files are text, fully readable | CONFIRMED |

> **CONCLUSION:** The absence of .NET SDK is **not a blocker** for the MIS modernization project. The legacy application is a read-only business specification, not a compilation target. The new application will use Node.js/TypeScript. .NET SDK installation is not required at this stage.

---

## 6. SQL Server Client Tools

| Tool | Category | Status | Install Command | Classification |
|---|---|---|---|---|
| `sqlcmd` | Microsoft CLI | NOT INSTALLED | Requires ODBC driver setup | BLOCKED |
| `pymssql` | Python package | NOT INSTALLED | `pip install pymssql` | BLOCKED |
| `pyodbc` | Python package | NOT INSTALLED | `pip install pyodbc` | BLOCKED |
| `mssql` (Node) | npm package | NOT INSTALLED | `npm install mssql` | BLOCKED |
| `tedious` (Node) | npm package | NOT INSTALLED | `npm install tedious` | BLOCKED |
| FreeTDS | System library | NOT INSTALLED | System package | BLOCKED |
| unixODBC | System library | NOT INSTALLED | System package | BLOCKED |

> **STATUS:** All SQL Server client tools are absent. These can be installed once network connectivity to the test RDS is confirmed. Installing without connectivity serves no purpose and is deferred per governance rules.

> **RECOMMENDED PATH** (when connectivity is confirmed):
> ```
> pip install pymssql
> ```
> pymssql bundles its own TDS implementation and does not require FreeTDS system libraries separately.

---

## 7. Crystal Reports Access

| Item | Status | Classification |
|---|---|---|
| Crystal Reports runtime (.NET) | NOT AVAILABLE — requires Windows/.NET | BLOCKED |
| Crystal Reports Designer | NOT AVAILABLE — Windows GUI application | BLOCKED |
| .rpt file viewer (Linux) | No known open-source reader | BLOCKED |
| .rpt content accessible | NO — binary format, unreadable as text | CONFIRMED |
| Number of .rpt files | 184 | CONFIRMED |

> **STATUS:** Crystal Reports `.rpt` files are binary format. No Linux-compatible tool exists to extract their SQL queries, formulas, parameters, or grouping rules. A Windows workstation with Crystal Reports software is required.
>
> **This is a project-level blocker for report modernization.** Business rules embedded in 184 reports are invisible until Crystal Reports software is used to open each file.

---

## 8. Version Control

| Item | Value | Classification |
|---|---|---|
| git version | 2.53.0 | CONFIRMED |
| git location | /repl/ctls/bin/git | CONFIRMED |
| Repository | Managed by Replit | CONFIRMED |
| .gitignore | Present (Replit default) | CONFIRMED |

---

## 9. System Resources

### 9.1 Memory

| Item | Value | Classification |
|---|---|---|
| Total RAM | 15 GiB | CONFIRMED |
| Used RAM | 3.5 GiB | CONFIRMED |
| Free RAM | ~12 GiB | CONFIRMED |
| Swap | None configured | CONFIRMED |
| Suitability | ✅ ADEQUATE for development | CONFIRMED |

### 9.2 Disk

| Item | Value | Classification |
|---|---|---|
| Workspace volume | /dev/vdf | CONFIRMED |
| Total capacity | 256 GB | CONFIRMED |
| Used | 926 MB | CONFIRMED |
| Available | 254 GB | CONFIRMED |
| Suitability | ✅ ADEQUATE | CONFIRMED |

> **NOTE:** 926 MB already used includes the legacy /Legacy/CRM directory, existing workspace artifacts, and Replit system overhead. Ample space for new application development, database exports, and documentation.

---

## 10. Existing Project Structure

The workspace is a **pnpm monorepo** with the following relevant structure already in place:

```
/home/runner/workspace/
├── Legacy/CRM/                    ← READ-ONLY legacy application
├── 00_Project_Governance/         ← Governance documents
├── 01_Discovery/                  ← Discovery documents (this file)
├── 02_Requirements/ through 16_Change_Requests/
├── artifacts/
│   ├── api-server/                ← API Server artifact (running)
│   ├── mis-v1/                    ← New MIS web application (running)
│   └── mockup-sandbox/            ← UI component preview (running)
├── replit.md                      ← Replit master instructions v3.2
└── 00_Project_Governance/CLAUDE.md ← Claude master instructions v3.1
```

---

## 11. Build Readiness Assessment

| Activity | Readiness | Blocker |
|---|---|---|
| Legacy source analysis | ✅ READY | None |
| Business rule documentation | ✅ READY | None |
| New API server development | ✅ READY | artifacts/api-server scaffolded |
| New web application development | ✅ READY | artifacts/mis-v1 scaffolded |
| Database schema discovery | ❌ NOT READY | Network + credentials + SQL client |
| Stored procedure extraction | ❌ NOT READY | Database access |
| Crystal Reports extraction | ❌ NOT READY | Crystal Reports Windows software |
| Data migration scripting | ❌ NOT READY | Database access required first |

---

## 12. Required Actions

| # | Action | Priority | Responsible |
|---|---|---|---|
| 1 | Establish SQL Server connectivity (VPN/Security Group) | CRITICAL | Infrastructure/DBA |
| 2 | Configure DB_ secrets in Replit | CRITICAL | Project Admin + DBA |
| 3 | Obtain Crystal Reports software (Windows workstation) | HIGH | Project Manager |
| 4 | Open all 184 .rpt files and extract SQL/formulas/parameters | HIGH | Business Analyst |
| 5 | Install pymssql after connectivity confirmed | HIGH | Engineering Agent |
| 6 | Confirm Replit outbound IP for AWS Security Group rule | HIGH | Infrastructure |

---

*Document produced by: AI Engineering Agent — Environment Validation Phase*  
*No files were modified. No packages were installed. No database connections were made.*  
*Assessment is read-only and classification-based.*
