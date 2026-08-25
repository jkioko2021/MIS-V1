# Agent Memory Index

- [MIS Legacy Discovery](mis-legacy-discovery.md) — Legacy CRM is ASP.NET WebForms .NET 4.0 VB.NET; 76 pages, 184 Crystal Reports, 57+ SPs; critical credential exposure in web.config
- [MIS Database Map](mis-database-map.md) — 7 confirmed databases (CRM, SALES, MISREPORTS, DATA_REPOSITORY_DB_CLAPI, AAR_RISK_DB, COMMISSION, Doc_Arc_DB); DB connectivity blocked
- [MIS DB Discovery Tool](mis-db-discovery-tool.md) — Live SQL Server explorer built in mis-v1/api-server; blocked by VPN firewall (fix: add 34.63.120.253/32 to AWS SG port 1433)
- [MIS Business Rules Extraction](mis-bizrules-progress.md) — BR-AUTH/AUTHZ complete; BR-BT and BR-RISK partial; all docs in 03_Business_Rules/
- [MIS Architecture Decisions](mis-architecture-decisions.md) — Modular monolith, React SPA + Express API, PostgreSQL, Redis, JWT; target arch in 05_Target_Architecture/
- [MIS Validation Findings](mis-validation-findings.md) — 3 critical conflicts resolved; 12 DBs confirmed; navigation map reveals 2nd application tier with ~47 pages
- [MIS Business Processes](mis-business-processes.md) — 16 processes documented in BP-CAT-001; 62 unknowns in BP-UNK-001; BT state machine incomplete
- [Auth module](auth-module.md) — JWT+bcrypt+OTP; route prefix rule; Vite proxy; default seed password
- [Admin module](admin-module.md) — User enrollment, profiles/roles CRUD, access rights matrix; MENU_MASTER defines all pages
- [Business Tracking module](business-module.md) — BT pages, upload flow, Object Storage setup, security gap on downloads
- [BPO Review workflow](bpo-review-workflow.md) — Forwarded registrations use one authorized BPO work item linked to the original file, not a copied record
- [Managed rebase conflicts](managed-rebase-conflicts.md) — Structural auto-merges can displace code outside visible conflict markers; compare the whole resolved file with both stages
- [Post-login navigation claims](post-login-navigation-claims.md) — Role-based sidebar visibility needs profile claims in the OTP verification response, not only the session refresh endpoint
- [Sheet popover stacking](sheet-popover-stacking.md) — Portalled dropdowns inside sheets must layer above both the sheet and its overlay to remain visible
