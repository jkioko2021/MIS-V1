import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import {
  GetOrganisationResponse, GetOrganisationAgentsQueryParams, GetOrganisationAgentsResponse,
  GetOrganisationAgentHistoryResponse, AssignOrganisationAgentBody, AssignOrganisationAgentResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth-middleware";
import { agentCode } from "../lib/intermediary";
import { SalesSetupError } from "../lib/sales-structure";
import { organisationSnapshot, organisationAgents, organisationAssignmentHistory, saveOrganisationAssignment } from "../lib/organisation";

const router = Router();
router.use("/organisation",requireAuth,(_req,res,next) => { res.setHeader("Cache-Control","private, no-store"); next(); });
const wrap = (fn: (req: Request,res: Response) => Promise<void>) => async (req: Request,res: Response): Promise<void> => {
  try { await fn(req,res); }
  catch (err) {
    if (err instanceof SalesSetupError) { res.status(err.status).json({error:err.message}); return; }
    if (err instanceof ZodError) { res.status(400).json({error:err.issues.map(i=>i.message).join("; ")}); return; }
    req.log.error({err},"Organisation hierarchy operation failed");
    res.status(500).json({error:"Unable to complete the organisation operation."});
  }
};
router.get("/organisation",wrap(async(req,res)=>{
  res.json(GetOrganisationResponse.parse(await organisationSnapshot(req.user!)));
}));
router.get("/organisation/agents",wrap(async(req,res)=>{
  const params=GetOrganisationAgentsQueryParams.parse(req.query);
  // z.coerce.boolean() treats the URL string 'false' as true; parse URL booleans explicitly.
  params.unmapped=req.query.unmapped === "true";
  res.json(GetOrganisationAgentsResponse.parse(await organisationAgents(req.user!,params)));
}));
router.post("/organisation/agents/:code/unit",wrap(async(req,res)=>{
  res.json(AssignOrganisationAgentResponse.parse(await saveOrganisationAssignment(agentCode.parse(req.params.code),
    AssignOrganisationAgentBody.parse(req.body),req.user!)));
}));
router.get("/organisation/agents/:code/history",wrap(async(req,res)=>{
  res.json(GetOrganisationAgentHistoryResponse.parse(await organisationAssignmentHistory(req.user!,agentCode.parse(req.params.code))));
}));
export default router;
