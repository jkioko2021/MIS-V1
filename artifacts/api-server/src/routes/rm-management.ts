import { Router, type Request, type Response } from "express";
import { GetRmManagementResponse, GetRmAgentsQueryParams, GetRmAgentsResponse, SaveRmManagerBody,
  SaveRmManagerResponse, PreviewRmTransferBody, PreviewRmTransferResponse,
  CommitRmTransferParams, CommitRmTransferResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth-middleware";
import { withTransaction } from "../lib/postgres";
import { DataImportError } from "../lib/data-extract";
import { requireRmAccess, rmSnapshot, rmAgents, saveRm, previewTransfer, commitTransfer } from "../lib/rm-management";
const router = Router();
router.use("/rm-re", requireAuth);
const handle = (fn: (req: Request, res: Response) => Promise<void>) => async (req: Request, res: Response): Promise<void> => {
  try {
    await withTransaction(client => requireRmAccess(client,req.user!));
    res.setHeader("Cache-Control","private, no-store");
    await fn(req,res);
  } catch (error: any) {
    if (error instanceof DataImportError) res.status(error.status).json({error:error.message});
    else if (error?.name === "ZodError") res.status(400).json({error:"Check the supplied fields, category and identifiers."});
    else {
      req.log.error({code:error?.code},"RM_RE operation failed");
      res.status(500).json({error:"The operation failed. No partial assignment changes were saved."});
    }
  }
};
router.get("/rm-re",handle(async(req,res)=>{
  res.json(GetRmManagementResponse.parse(await rmSnapshot(req.user!)));
}));
router.get("/rm-re/agents",handle(async(req,res)=>{
  if (req.query.unassigned !== undefined && !["true","false"].includes(String(req.query.unassigned)))
    throw new DataImportError(400,"Unassigned must be true or false.");
  const params=GetRmAgentsQueryParams.parse({...req.query,
    unassigned:req.query.unassigned===undefined ? undefined : req.query.unassigned==="true"});
  res.json(GetRmAgentsResponse.parse(await rmAgents(params,req.user!)));
}));
router.post("/rm-re/managers",handle(async(req,res)=>{
  res.json(SaveRmManagerResponse.parse(await saveRm(SaveRmManagerBody.parse(req.body),req.user!)));
}));
router.post("/rm-re/transfers/preview",handle(async(req,res)=>{
  res.json(PreviewRmTransferResponse.parse(await previewTransfer(PreviewRmTransferBody.parse(req.body),req.user!)));
}));
router.post("/rm-re/transfers/:id/commit",handle(async(req,res)=>{
  const {id}=CommitRmTransferParams.parse(req.params);
  res.json(CommitRmTransferResponse.parse(await commitTransfer(id,req.user!)));
}));
export default router;
