import { Router, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import {
  GetSalesStructureResponse, CreateSalesStructureNodeBody, UpdateSalesStructureNodeBody,
  EnrollSalesManagerBody, UpdateSalesManagerEnrollmentBody,
  GetSalesCatalogsResponse, CreateSalesCatalogEntryBody, UpdateSalesCatalogEntryBody,
  GetSalesManagerMappingsResponse, SaveSalesManagerMappingBody, SaveSalesManagerMappingResponse,
  GetSalesManagerMappingHistoryResponse, GetSalesManagerMappingHistoryQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth-middleware";
import { withTransaction } from "../lib/postgres";
import { createSalesNode, enrollSalesManager, updateSalesManager, updateSalesNode, SalesSetupError } from "../lib/sales-structure";
import { salesCatalogSnapshot, saveSalesCatalogEntry } from "../lib/sales-catalogs";
import { salesManagerMappingSnapshot, saveSalesManagerMapping, salesManagerMappingHistory } from "../lib/sales-manager-mapping";

const router = Router();
router.use("/admin/sales-structure", requireAuth, (req, res, next) => {
  if (req.user?.profileId !== 1 && req.user?.profileId !== 2) {
    res.status(403).json({ error: "Medical and GI Structure setup require SuperAdmin or System Admin access." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  next();
});
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response): Promise<void> => {
    try { await fn(req, res); }
    catch (err) {
      if (err instanceof SalesSetupError) { res.status(err.status).json({ error: err.message }); return; }
      if (err instanceof ZodError) { res.status(400).json({ error: err.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") }); return; }
      if ((err as { code?: string }).code === "23505") {
        res.status(409).json({ error: "This code, name within the parent, or user enrollment already exists. Edit or reactivate the existing record." }); return;
      }
      if ((err as { code?: string }).code === "23503") {
        res.status(400).json({ error: "A selected user, parent or manager no longer exists. Refresh and select again." }); return;
      }
      req.log.error({ err }, "Medical/GI Structure setup failed");
      res.status(500).json({ error: "Unable to complete structure setup. Please try again." });
    }
  };
const idFrom = (req: Request) => z.coerce.number().int().positive().parse(req.params.id);
const catalogFrom = (req: Request) => z.string().max(40).parse(req.params.catalog);
router.get("/admin/sales-structure/manager-mappings", wrap(async (_req, res) => {
  res.json(GetSalesManagerMappingsResponse.parse(await salesManagerMappingSnapshot()));
}));
router.post("/admin/sales-structure/manager-mappings", wrap(async (req, res) => {
  res.json(SaveSalesManagerMappingResponse.parse(await saveSalesManagerMapping(
    SaveSalesManagerMappingBody.parse(req.body), req.user!.username)));
}));
router.get("/admin/sales-structure/manager-mappings/history", wrap(async (req, res) => {
  const params = GetSalesManagerMappingHistoryQueryParams.parse(req.query);
  res.json(GetSalesManagerMappingHistoryResponse.parse(await salesManagerMappingHistory(params.catalog, params.organization_code)));
}));
router.get("/admin/sales-structure/catalogs", wrap(async (_req, res) => {
  res.json(GetSalesCatalogsResponse.parse(await salesCatalogSnapshot()));
}));
router.post("/admin/sales-structure/catalogs/:catalog", wrap(async (req, res) => {
  res.status(201).json(await saveSalesCatalogEntry(catalogFrom(req), CreateSalesCatalogEntryBody.parse(req.body), req.user!.username));
}));
router.patch("/admin/sales-structure/catalogs/:catalog/:id", wrap(async (req, res) => {
  res.json(await saveSalesCatalogEntry(catalogFrom(req), UpdateSalesCatalogEntryBody.parse(req.body), req.user!.username, idFrom(req)));
}));
router.get("/admin/sales-structure", wrap(async (_req, res) => {
  const data = await withTransaction(async client => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const nodes = await client.query(`SELECT id,code,name,level,parent_id,manager_id,is_active,version
      FROM crm.sales_structure_nodes ORDER BY CASE level WHEN 'NATIONAL' THEN 1 WHEN 'REGION' THEN 2 WHEN 'BRANCH' THEN 3 ELSE 4 END,name,id`);
    const managers = await client.query(`SELECT m.id,m.employee_id,m.level,m.is_active,m.version,e.employee_name,e.username,
      e.emp_code,e.email AS account_email,m.manager_details AS details,
      (NOT e.is_deleted AND e.activated AND e.approved AND NOT e.employee_locked) AS user_eligible
      FROM crm.sales_manager_enrollments m JOIN crm.employees e ON e.employee_id=m.employee_id
      ORDER BY e.employee_name,m.level,m.id`);
    const users = await client.query(`SELECT employee_id,employee_name,username,emp_code,email,
      (activated AND approved AND NOT employee_locked) AS user_eligible,
      nullif(concat_ws('; ',CASE WHEN NOT activated THEN 'Inactive' END,
        CASE WHEN NOT approved THEN 'Not approved' END,CASE WHEN employee_locked THEN 'Locked' END),'') AS eligibility_note
      FROM crm.employees WHERE NOT is_deleted AND lower(btrim(department))='sales'
      ORDER BY employee_name,employee_id`);
    return { nodes: nodes.rows, managers: managers.rows, users: users.rows };
  });
  res.json(GetSalesStructureResponse.parse(data));
}));
router.post("/admin/sales-structure/nodes", wrap(async (req, res) => {
  const saved = await createSalesNode(CreateSalesStructureNodeBody.parse(req.body), req.user!.username);
  res.status(201).json(saved);
}));
router.patch("/admin/sales-structure/nodes/:id", wrap(async (req, res) => {
  res.json(await updateSalesNode(idFrom(req), UpdateSalesStructureNodeBody.parse(req.body), req.user!.username));
}));
router.post("/admin/sales-structure/managers", wrap(async (req, res) => {
  res.status(201).json(await enrollSalesManager(EnrollSalesManagerBody.parse(req.body), req.user!.username));
}));
router.patch("/admin/sales-structure/managers/:id", wrap(async (req, res) => {
  res.json(await updateSalesManager(idFrom(req), UpdateSalesManagerEnrollmentBody.parse(req.body), req.user!.username));
}));
export default router;
