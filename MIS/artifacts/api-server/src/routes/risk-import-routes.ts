import { Router } from "express";
import {
  PreviewRiskRegisterImportBody, ConfirmRiskRegisterImportBody,
  PreviewRiskRegisterImportResponse, ConfirmRiskRegisterImportResponse,
} from "@workspace/api-zod";
import { txQuery, withTransaction } from "../lib/postgres";
import { canManage, RiskError, riskFailure, type RiskActor } from "../lib/risk-register";
import { importEnvironment, validateImport, issuePreviewToken, verifyPreviewToken, insertImport } from "../lib/risk-import";

// Mounted inside the risk-register router, after its authentication and actor middleware.
export const riskImportRouter = Router();
riskImportRouter.post("/risk-register/import/preview", async (req,res) => {
  try {
    const a=res.locals.riskActor as RiskActor;
    if (!canManage(a)) throw new RiskError(403,"Risk management access is required.");
    const input=PreviewRiskRegisterImportBody.parse(req.body);
    const data=await withTransaction(async client=>{
      const result=await validateImport(client,input.source_text);
      const token=result.valid
        ? await issuePreviewToken(client,a.username,input.source_name,input.source_text)
        : {};
      return {environment:importEnvironment(),valid:result.valid,rows:result.rows,errors:result.errors,...token};
    });
    res.json(PreviewRiskRegisterImportResponse.parse({ok:true,data}));
  } catch(err) { riskFailure(req,res,err); }
});
riskImportRouter.post("/risk-register/import/confirm", async (req,res) => {
  try {
    const a=res.locals.riskActor as RiskActor;
    if (!canManage(a)) throw new RiskError(403,"Risk management access is required.");
    const input=ConfirmRiskRegisterImportBody.parse(req.body);
    if (input.environment !== importEnvironment())
      throw new RiskError(409,"Environment changed. Preview this source again.");
    const data=await withTransaction(async client=>{
      await verifyPreviewToken(client,a.username,input.source_name,input.source_text,input.preview_token);
      // Serialize insert-only batches so concurrent confirmation cannot duplicate legacy codes.
      await txQuery(client,"SELECT pg_advisory_xact_lock(hashtext('risk-legacy-import'))");
      const result=await validateImport(client,input.source_text);
      if (!result.valid) throw new RiskError(409,"Source is no longer valid. Preview this source again.");
      return insertImport(client,result.validRows,a,input);
    });
    res.status(201).json(ConfirmRiskRegisterImportResponse.parse({ok:true,data}));
  } catch(err) { riskFailure(req,res,err); }
});
