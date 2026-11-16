import { Router, type Request, type Response } from "express";
import {
  GetDataImportTemplateParams, GetDataImportTemplateResponse, PreviewDataImportParams,
  PreviewDataImportBody, PreviewDataImportResponse, ListDataImportBatchesQueryParams,
  ListDataImportBatchesResponse, GetDataImportBatchParams, GetDataImportBatchResponse,
  CommitDataImportParams, CommitDataImportResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth-middleware";
import { queryOne } from "../lib/postgres";
import { DataImportError, extractTemplates } from "../lib/data-extract";
import { commitImport, listImportBatches, loadImportBatch, previewImport } from "../lib/data-import";

const router = Router();
router.use("/data-management", requireAuth, async (req, res, next): Promise<void> => {
  const allowed = await queryOne(`SELECT 1 FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE e.employee_id=$1 AND e.profile_id IN(1,2) AND e.activated AND e.approved
      AND NOT e.is_deleted AND NOT e.employee_locked AND p.is_active`, [req.user!.sub]);
  if (!allowed) { res.status(403).json({ error: "Data Management requires SuperAdmin or System Admin access." }); return; }
  res.setHeader("Cache-Control", "private, no-store");
  next();
});
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response): Promise<void> => {
    try { await fn(req, res); }
    catch (error: any) {
      if (error instanceof DataImportError) res.status(error.status).json({ error: error.message });
      else if (error?.name === "ZodError") res.status(400).json({ error: "Invalid import request or parameters." });
      else {
        req.log.error({ code: error?.code }, "Data Management operation failed");
        res.status(500).json({ error: "The import could not be completed. No partial target import was saved." });
      }
    }
  };
router.get("/data-management/:kind/template", wrap(async (req, res) => {
  const { kind } = GetDataImportTemplateParams.parse(req.params);
  res.json(GetDataImportTemplateResponse.parse(extractTemplates[kind]));
}));
router.post("/data-management/:kind/preview", wrap(async (req, res) => {
  const { kind } = PreviewDataImportParams.parse(req.params);
  const input = PreviewDataImportBody.parse(req.body);
  res.json(PreviewDataImportResponse.parse(await previewImport(kind, input.filename, input.content, req.user!.username)));
}));
router.get("/data-management/batches", wrap(async (req, res) => {
  const { kind } = ListDataImportBatchesQueryParams.parse(req.query);
  res.json(ListDataImportBatchesResponse.parse(await listImportBatches(kind)));
}));
router.get("/data-management/batches/:id", wrap(async (req, res) => {
  const { id } = GetDataImportBatchParams.parse(req.params);
  res.json(GetDataImportBatchResponse.parse(await loadImportBatch(id)));
}));
router.post("/data-management/batches/:id/commit", wrap(async (req, res) => {
  const { id } = CommitDataImportParams.parse(req.params);
  res.json(CommitDataImportResponse.parse(await commitImport(id, req.user!)));
}));
export default router;
