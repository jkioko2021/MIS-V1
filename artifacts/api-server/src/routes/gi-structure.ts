import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import {
  GetGiStructureResponse,SaveGiStructureNodeBody,SaveGiManagerBody,SaveGiMedicalMappingsBody,
  RemoveGiMedicalMappingBody,GetGiStructureHistoryQueryParams,GetGiStructureHistoryResponse,
  SaveGiStructureNodeResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth-middleware";
import { SalesSetupError } from "../lib/sales-structure";
import { giStructureSnapshot,saveGiNode,saveGiManagerEnrollment,saveGiMappings,removeGiMapping,giStructureHistory } from "../lib/gi-structure";

const router=Router();
router.use("/gi-structure",requireAuth,(_req,res,next)=>{res.setHeader("Cache-Control","private, no-store");next();});
const wrap=(fn:(req:Request,res:Response)=>Promise<void>)=>async(req:Request,res:Response):Promise<void>=>{
  try{await fn(req,res);}
  catch(err){
    if(err instanceof SalesSetupError){res.status(err.status).json({error:err.message});return;}
    if(err instanceof ZodError){res.status(400).json({error:err.issues.map(i=>i.message).join("; ")});return;}
    const code=(err as {code?:string}).code;
    if(code==="23505"){res.status(409).json({error:"This GI code or user/category enrollment already exists. Edit the existing record."});return;}
    if(code==="23503"||code==="23514"){res.status(400).json({error:"The selected GI parent, manager or Medical Unit is invalid. Refresh and select again."});return;}
    req.log.error({err},"GI structure operation failed");
    res.status(500).json({error:"Unable to complete GI structure setup."});
  }
};
router.get("/gi-structure",wrap(async(req,res)=>{res.json(GetGiStructureResponse.parse(await giStructureSnapshot(req.user!)));}));
router.post("/gi-structure/nodes",wrap(async(req,res)=>{
  res.json(SaveGiStructureNodeResponse.parse(await saveGiNode(SaveGiStructureNodeBody.parse(req.body),req.user!)));
}));
router.post("/gi-structure/managers",wrap(async(req,res)=>{
  res.json(SaveGiStructureNodeResponse.parse(await saveGiManagerEnrollment(SaveGiManagerBody.parse(req.body),req.user!)));
}));
router.post("/gi-structure/mappings",wrap(async(req,res)=>{
  res.json(SaveGiStructureNodeResponse.parse(await saveGiMappings(SaveGiMedicalMappingsBody.parse(req.body),req.user!)));
}));
router.post("/gi-structure/mappings/remove",wrap(async(req,res)=>{
  res.json(SaveGiStructureNodeResponse.parse(await removeGiMapping(RemoveGiMedicalMappingBody.parse(req.body),req.user!)));
}));
router.get("/gi-structure/history",wrap(async(req,res)=>{
  const q=GetGiStructureHistoryQueryParams.parse(req.query);
  res.json(GetGiStructureHistoryResponse.parse(await giStructureHistory(req.user!,q.entity_type,q.entity_key)));
}));
export default router;
