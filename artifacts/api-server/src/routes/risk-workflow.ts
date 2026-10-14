import { Router } from "express";
import { z } from "zod";
import { txQuery, withTransaction } from "../lib/postgres";
import { activeDepartmentOwner, queueRiskReviewNotification } from "../lib/risk-notifications";
import { reopenScope } from "../lib/risk-reopen-scope";
import {
  RiskError, type RiskActor, riskFailure, assertDepartment, canManage, cycleInput,
  workflowState, period, cycle, history,
} from "../lib/risk-register";

export const riskWorkflowRouter=Router();
riskWorkflowRouter.get("/risk-register/workflow/reopen-scope",async(req,res)=>{
  try {
    const input=z.object({depart_code:z.string().trim().min(1).max(50),period_id:z.coerce.number().int().positive()}).parse(req.query);
    const a=res.locals.riskActor as RiskActor;
    assertDepartment(a,input.depart_code,"manage");
    const data=await withTransaction(async client=>reopenScope(client,await period(client,input.period_id,true),input.depart_code));
    res.json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
riskWorkflowRouter.post("/risk-register/workflow",async(req,res)=>{
  try {
    const input=cycleInput.parse(req.body),a=res.locals.riskActor as RiskActor;
    const mode=input.action==="SUBMIT" ? "edit" : ["REVIEW","RETURN"].includes(input.action) ? "review" : "manage";
    assertDepartment(a,input.depart_code,mode);
    const data=await withTransaction(async client=>{
      const [department]=await txQuery<{depart_code:string;depart_name:string}>(client,"SELECT depart_code,depart_name FROM risk.departments WHERE depart_code=$1 AND is_active",[input.depart_code]);
      if(!department) throw new RiskError(404,"Active risk department was not found.");
      const p=await period(client,input.period_id,input.action==="REOPEN");
      const scope=input.action==="REOPEN" ? await reopenScope(client,p,input.depart_code) : undefined;
      if(scope && input.confirmation_token!==scope.confirmation_token)
        throw new RiskError(409,"Review the current reopening scope and confirm again. The period or department registers may have changed.");
      const s=await cycle(client,input.depart_code,p),state=workflowState(s);
      const risks=await txQuery<Record<string,unknown>>(client,`SELECT r.*,
        EXISTS(SELECT 1 FROM risk.root_causes c WHERE c.risk_code=r.risk_code) AS has_cause
        FROM risk.risk_master r WHERE depart_code=$1 AND period_from=$2 AND period_to=$3 AND is_active
        ORDER BY risk_code FOR UPDATE OF r`,[input.depart_code,p.period_from,p.period_to]);
      if(!risks.length) throw new RiskError(409,"Register at least one active risk before processing the department.");
      if(input.action==="SUBMIT" && state!=="OPEN") throw new RiskError(409,"Only an open register can be submitted.");
      const owner=input.action==="SUBMIT" ? await activeDepartmentOwner(client,input.depart_code) : undefined;
      if(input.action==="SUBMIT" && !owner) throw new RiskError(409,"Map an active department owner before submitting for review.");
      if(input.action==="REVIEW" && state!=="SUBMITTED") throw new RiskError(409,"The register must be submitted before review.");
      if(input.action==="RETURN" && !["SUBMITTED","REVIEWED"].includes(state)) throw new RiskError(409,"Only submitted or reviewed registers can be returned.");
      if(input.action==="SIGN_OFF" && state!=="REVIEWED") throw new RiskError(409,"The department owner must review before sign-off.");
      if(input.action==="CLOSE" && state!=="SIGNED_OFF") throw new RiskError(409,"Sign off the register before closing it.");
      if(input.action==="REOPEN" && state==="OPEN" && p.status==="OPEN") throw new RiskError(409,"This register is already open.");
      if(input.action==="REVERT_REVIEW" && !["REVIEWED","SIGNED_OFF"].includes(state))
        throw new RiskError(409,"Only reviewed or signed-off registers can be reverted to review.");
      if(input.action==="SUBMIT" && risks.some(r=>!r.assessment_updated || !r.has_cause))
        throw new RiskError(409,"Assess every active risk and add at least one root cause and mitigation before submitting.");
      const reset=["RETURN","REOPEN"].includes(input.action);
      if(reset) {
        // Root-action closure never exempts an active risk from reassessment.
        // Reset completion only; retain root statuses, saved ratings and history.
        await txQuery(client,`UPDATE risk.department_summary SET submitted=FALSE,submitted_by=NULL,submitted_at=NULL,
          reviewed=FALSE,reviewed_by=NULL,reviewed_at=NULL,sign_off=FALSE,signed_off_by=NULL,signed_off_at=NULL,
          closed=FALSE,closed_by=NULL,closed_at=NULL,updated_at=NOW() WHERE summary_id=$1`,[s.summary_id]);
        await txQuery(client,`UPDATE risk.risk_master SET assessment_updated=FALSE,updated_at=NOW()
          WHERE depart_code=$1 AND period_from=$2 AND period_to=$3 AND is_active`,[input.depart_code,p.period_from,p.period_to]);
        if(input.action==="REOPEN") await txQuery(client,"UPDATE risk.periods SET status='OPEN' WHERE period_id=$1",[p.period_id]);
      } else if(input.action==="REVERT_REVIEW") {
        // Return to the owner's Review queue, not the champion's assessment queue.
        // Preserve every saved assessment, root action and prior audit event.
        await txQuery(client,`UPDATE risk.department_summary SET submitted=TRUE,
          reviewed=FALSE,reviewed_by=NULL,reviewed_at=NULL,
          sign_off=FALSE,signed_off_by=NULL,signed_off_at=NULL,
          closed=FALSE,closed_by=NULL,closed_at=NULL,updated_at=NOW() WHERE summary_id=$1`,[s.summary_id]);
      } else {
        const columns={
          SUBMIT:["submitted","submitted_by","submitted_at"],
          REVIEW:["reviewed","reviewed_by","reviewed_at"],
          SIGN_OFF:["sign_off","signed_off_by","signed_off_at"],
          CLOSE:["closed","closed_by","closed_at"],
        }[input.action as "SUBMIT"|"REVIEW"|"SIGN_OFF"|"CLOSE"];
        await txQuery(client,`UPDATE risk.department_summary SET ${columns[0]}=TRUE,
          ${columns[1]}=$2,${columns[2]}=NOW(),updated_at=NOW() WHERE summary_id=$1`,[s.summary_id,a.username]);
      }
      const after=await cycle(client,input.depart_code,p);
      await history(client,null,input.depart_code,p.period_id,input.action,a.username,input.comments,
        {before:s,after,risks,...(scope ? {reopening_scope:scope} : {}),root_causes:await txQuery(client,`SELECT c.* FROM risk.root_causes c JOIN risk.risk_master r
          ON r.risk_code=c.risk_code WHERE r.depart_code=$1 AND r.period_from=$2 AND r.period_to=$3`,
        [input.depart_code,p.period_from,p.period_to])});
      const notification=owner ? await queueRiskReviewNotification(client,{
        summaryId:after.summary_id,department:input.depart_code,
        departmentName:department.depart_name,periodId:p.period_id,periodFrom:p.period_from,periodTo:p.period_to,
        submittedBy:a.username,owner,
      }) : undefined;
      return {workflow_status:workflowState(after),...(notification ? {notification} : {})};
    });
    res.json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
riskWorkflowRouter.post("/risk-register/periods/:periodId/close",async(req,res)=>{
  try{
    const a=res.locals.riskActor as RiskActor;
    if(!canManage(a)) throw new RiskError(403,"Risk management access is required.");
    const id=z.coerce.number().int().positive().parse(req.params.periodId);
    const {comments}=z.object({comments:z.string().trim().min(1).max(4000)}).parse(req.body);
    const data=await withTransaction(async client=>{
      const p=await period(client,id);
      const departments=await txQuery<{depart_code:string}>(client,`SELECT DISTINCT r.depart_code FROM risk.risk_master r
        JOIN risk.departments d ON d.depart_code=r.depart_code AND d.is_active
        WHERE r.period_from=$1 AND r.period_to=$2 AND r.is_active ORDER BY r.depart_code`,[p.period_from,p.period_to]);
      if(!departments.length) throw new RiskError(409,"An empty reporting period cannot be closed.");
      for(const d of departments){
        const s=await cycle(client,d.depart_code,p);
        if(!s.sign_off) throw new RiskError(409,"Sign off every registered department before closing this reporting period.");
      }
      for(const d of departments){
        const s=await cycle(client,d.depart_code,p);
        // A previously closed department is untouched, including its closure attribution.
        if(s.closed) continue;
        const snapshot=await txQuery(client,`SELECT r.*,
          (SELECT jsonb_agg(c) FROM risk.root_causes c WHERE c.risk_code=r.risk_code) AS root_causes
          FROM risk.risk_master r WHERE depart_code=$1 AND period_from=$2 AND period_to=$3`,
        [d.depart_code,p.period_from,p.period_to]);
        await txQuery(client,`UPDATE risk.department_summary SET closed=TRUE,closed_by=$2,closed_at=NOW(),updated_at=NOW()
          WHERE summary_id=$1`,[s.summary_id,a.username]);
        await history(client,null,d.depart_code,id,"PERIOD_CLOSED",a.username,comments,{register:s,risks:snapshot});
      }
      await txQuery(client,"UPDATE risk.periods SET status='CLOSED' WHERE period_id=$1",[id]);
      return {period_id:id,status:"CLOSED"};
    });
    res.json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
