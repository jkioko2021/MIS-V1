import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { query, txQuery, withTransaction } from "../lib/postgres";
import {
  RiskError, type RiskActor, requireRiskActor, privateRiskResponses, riskFailure, assertDepartment, canManage, workspaceScope,
  recordInput, assessmentInput, causeInput, calculateRisk, workflowState, period, cycle,
  assertEditable, assertRecordEditable, assertFresh, lockedRecord, history, calendarDate,
} from "../lib/risk-register";
import { riskWorkflowRouter } from "./risk-workflow";
import { PreviewRiskRegisterImportBody, ConfirmRiskRegisterImportBody,
  PreviewRiskRegisterImportResponse, ConfirmRiskRegisterImportResponse } from "@workspace/api-zod";
import { importEnvironment, validateImport, issuePreviewToken, verifyPreviewToken, insertImport } from "../lib/risk-import";

const router = Router();
router.use("/risk-register", privateRiskResponses, requireAuth, requireRiskActor);
const actor = (res: Response) => res.locals.riskActor as RiskActor;
const scope = (a: RiskActor) => [canManage(a), [...new Set([...a.champion_departments,...a.owner_departments])]];
const filters = z.object({
  access: z.enum(["view","update","review"]).optional().default("view"),
  depart_code: z.string().max(50).optional().default(""),
  period_id: z.coerce.number().int().nonnegative().optional().default(0),
  view: z.enum(["all","open","submitted","reviewed","signed","closed"]).optional().default("all"),
  search: z.string().max(150).optional().default(""),
});
const selectRecords = `SELECT r.*,r.period_from::text,r.period_to::text,p.period_id,
  to_char(r.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at,
  (SELECT count(*)::integer FROM risk.root_causes done WHERE done.risk_code=r.risk_code
    AND done.action_status='Closed') AS completed_action_count,
  d.depart_name,c.category_name,COALESCE(s.submitted,FALSE) AS submitted,
  COALESCE(s.reviewed,FALSE) AS reviewed,COALESCE(s.sign_off,FALSE) AS sign_off,
  (COALESCE(s.closed,FALSE) OR p.status='CLOSED') AS closed
  FROM risk.risk_master r JOIN risk.departments d ON d.depart_code=r.depart_code
  JOIN risk.periods p ON p.period_from=r.period_from AND p.period_to=r.period_to
  LEFT JOIN risk.categories c ON c.category_code=r.risk_category
  LEFT JOIN risk.department_summary s ON s.depart_code=r.depart_code
    AND s.period_from=r.period_from AND s.period_to=r.period_to`;
function presentRecord(r: Record<string,unknown>, a: RiskActor) {
  const status = workflowState(r);
  return {...r,workflow_status:status,can_edit: status === "OPEN"
    && (canManage(a) || a.champion_departments.includes(String(r.depart_code)))
    || status === "SUBMITTED" && (canManage(a) || a.owner_departments.includes(String(r.depart_code)))};
}
async function validateCatalogs(client: import("pg").PoolClient, input: z.infer<typeof recordInput>,
  existing?: Record<string, unknown>) {
  const [valid] = await txQuery<{valid:boolean}>(client, `SELECT
    EXISTS(SELECT 1 FROM risk.departments WHERE depart_code=$1 AND is_active)
    AND EXISTS(SELECT 1 FROM risk.categories WHERE category_code=$2 AND (is_active OR $4::boolean) FOR SHARE)
    AND EXISTS(SELECT 1 FROM risk.objectives WHERE obj_code=$3 AND depart_code=$1 AND (is_active OR $5::boolean) FOR SHARE) AS valid`,
  [input.depart_code,input.risk_category,input.objective_code,
    existing?.risk_category === input.risk_category,
    existing?.objective_code === input.objective_code && existing?.depart_code === input.depart_code]);
  if (!valid?.valid) throw new RiskError(400,"Select an active department, category, and an objective belonging to that department.");
}
router.get("/risk-register/options", async (req,res) => {
  try {
    const a=actor(res);
    if (!canManage(a) && !a.champion_departments.length && !a.owner_departments.length) {
      res.json({ok:true,data:{
        actor:{username:a.username,can_manage:false,champion_departments:[],owner_departments:[]},
        departments:[],categories:[],objectives:[],periods:[],staff:[],assignments:[],action_statuses:[],control_effectiveness:[],impact_factors:[],likelihood_factors:[],exposure_bands:[],
      }});
      return;
    }
    const [departments,categories,objectives,periods,staff,assignments,action_statuses,control_effectiveness,impact_factors,likelihood_factors,exposure_bands] = await Promise.all([
      query(`SELECT depart_code,depart_name FROM risk.departments
        WHERE is_active AND ($1::boolean OR depart_code=ANY($2::text[])) ORDER BY depart_code`,params),
      query("SELECT category_code,category_name FROM risk.categories WHERE is_active ORDER BY category_name"),
      query(`SELECT obj_code,obj_name,depart_code FROM risk.objectives WHERE is_active
        AND ($1::boolean OR depart_code=ANY($2::text[])) ORDER BY obj_name`,params),
      query("SELECT period_id,period_from::text,period_to::text,status FROM risk.periods ORDER BY period_from DESC"),
      (canManage(a) || params[1] instanceof Array && params[1].length > 0)
        ? query(`SELECT e.username,e.employee_name FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
          WHERE e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active ORDER BY e.employee_name`)
        : Promise.resolve([]),
      query(`SELECT depart_code,champion_username,owner_username FROM risk.department_assignments
        WHERE $1::boolean OR depart_code=ANY($2::text[])`,params),
      query(`SELECT status_code AS code,status_name AS status,description
        FROM risk.action_statuses WHERE is_active ORDER BY status_code`),
      query(`SELECT eff_factor,qual_criteria,rating::float8 AS rating
        FROM risk.control_effectiveness WHERE is_active ORDER BY rating DESC,eff_factor`),
      query("SELECT impact_code AS code,impact_factor AS label,rate_factor::float8 AS factor,rate FROM risk.impact_factors WHERE is_active ORDER BY impact_code"),
      query("SELECT likelihood_code AS code,likelihood_factor AS label,rating::float8 AS factor,qualification_criteria AS criteria FROM risk.likelihood_factors WHERE is_active ORDER BY likelihood_code"),
      query("SELECT risk_type,level,minimum::float8,maximum::float8,description FROM risk.exposure_bands ORDER BY risk_type,minimum"),
    ]);
    res.json({ok:true,data:{actor:{username:a.username,can_manage:canManage(a),
      champion_departments:a.champion_departments,owner_departments:a.owner_departments},
    departments,categories,objectives,periods,staff,assignments,action_statuses,control_effectiveness,impact_factors,likelihood_factors,exposure_bands}});
  } catch (err) { riskFailure(req,res,err); }
});
router.get("/risk-register/records", async (req,res) => {
  try {
    const f=filters.parse(req.query),a=actor(res);
    const pageScope = workspaceScope(a, f.access);
    if(f.depart_code) assertDepartment(a,f.depart_code, f.access === "update" ? "edit" : f.access === "review" ? "review" : "view");
    const rows=await query(`SELECT * FROM risk.register_history
      WHERE ($1::boolean OR depart_code=ANY($2::text[])) AND ($3::integer=0 OR period_id=$3)
      AND ($4::text='' OR depart_code=$4)
      AND ($1::boolean OR action<>'LEGACY_IMPORT_SOURCE') ORDER BY history_id DESC LIMIT 500`,
    [...scope(a),f.period_id,f.depart_code]);
    res.json({ok:true,data:rows});
  }catch(err){riskFailure(req,res,err);}
});
router.post("/risk-register/assignments",async(req,res)=>{
  try {
    const a=actor(res);
    const [risk]=await query<Record<string,unknown>>(`${selectRecords} WHERE r.risk_code=$1`,[code]);
    if (!risk) throw new RiskError(404,"Risk was not found.");
    assertDepartment(a,String(risk.depart_code));
    const [root_causes,events]=await Promise.all([
      query("SELECT *,due_date::text FROM risk.root_causes WHERE risk_code=$1 ORDER BY root_id",[code]),
      query(`SELECT * FROM risk.register_history WHERE depart_code=$1 AND period_id=$2
        AND (risk_code=$3 OR risk_code IS NULL)
        AND ($4::boolean OR action<>'LEGACY_IMPORT_SOURCE') ORDER BY history_id DESC LIMIT 200`,
      [risk.depart_code,risk.period_id,code,canManage(a)]),
    ]);
    res.json({ok:true,data:{risk:presentRecord(risk,a),root_causes,history:events}});
  } catch(err) { riskFailure(req,res,err); }
});
router.post("/risk-register/records", async (req,res) => {
  try {
    const input=z.object({period_from:calendarDate,period_to:calendarDate,source_period_id:z.number().int().positive().optional()}).parse(req.body);
    assertDepartment(a,input.depart_code,"edit");
    const record=await withTransaction(async client=>{
      const {r,p,s}=await lockedRecord(client,code,a,"edit");
      if (r.depart_code !== input.depart_code || p.period_id !== input.period_id)
        throw new RiskError(400,"A risk cannot be moved to a different department or reporting period.");
      assertRecordEditable(s,a,input.depart_code); assertFresh(r.updated_at,input.expected_updated_at);
      // Retirement removes new choices, not the ability to maintain a risk retaining its own historical choices.
      await validateCatalogs(client,input,r);
      const score=calculateRisk(input.i_rate,input.l_rate,input.control_effectiveness);
      const [updated]=await txQuery<Record<string,unknown>>(client,`UPDATE risk.risk_master SET
        objective_code=$2,risk_title=$3,risk_description=$4,risk_category=$5,risk_consequence=$6,
        i_rate=$7,l_rate=$8,i_risk_exposure=$9,i_risk_rate=$9,perceived_rate=$10,
        risk_impact=COALESCE((SELECT impact_code FROM risk.impact_factors WHERE is_active AND rate_factor=$7 ORDER BY impact_code LIMIT 1),risk_impact),
        risk_likelihood=COALESCE((SELECT likelihood_code FROM risk.likelihood_factors WHERE is_active AND rating=$8 ORDER BY likelihood_code LIMIT 1),risk_likelihood),
        perceived_contr_eff=$11,r_risk_exposure=$12,r_risk_rate=$12,current_contr=$13,
        desired_contr_effe=$14,assessment_updated=TRUE,updated_at=NOW() WHERE risk_code=$1
        RETURNING *,to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`,
      [code,input.objective_code,input.risk_title,input.risk_description,input.risk_category,input.risk_consequence,
        input.i_rate,input.l_rate,score.inherent,input.control_effectiveness,input.control_effectiveness*100,
        score.residual,input.current_contr,input.desired_contr_effe]);
      await history(client,code,input.depart_code,p.period_id,"ASSESSED",a.username,input.comments,{before:r,after:updated});
      return {...updated,period_id:p.period_id,workflow_status:workflowState(s),can_edit:true};
    });
    res.json({ok:true,data:record});
  } catch(err) { riskFailure(req,res,err); }
});
router.post("/risk-register/records/:riskCode/root-causes",async(req,res)=>{
  try {
    const input=z.object({period_from:calendarDate,period_to:calendarDate,source_period_id:z.number().int().positive().optional()}).parse(req.body);
    const record=await withTransaction(async client=>{
      const {r,p,s}=await lockedRecord(client,code,a,"edit");
      if (r.depart_code !== input.depart_code || p.period_id !== input.period_id)
        throw new RiskError(400,"A risk cannot be moved to a different department or reporting period.");
      assertRecordEditable(s,a,input.depart_code); assertFresh(r.updated_at,input.expected_updated_at);
      // Retirement removes new choices, not the ability to maintain a risk retaining its own historical choices.
      await validateCatalogs(client,input,r);
      const score=calculateRisk(input.i_rate,input.l_rate,input.control_effectiveness);
      const [updated]=await txQuery<Record<string,unknown>>(client,`UPDATE risk.risk_master SET
        objective_code=$2,risk_title=$3,risk_description=$4,risk_category=$5,risk_consequence=$6,
        i_rate=$7,l_rate=$8,i_risk_exposure=$9,i_risk_rate=$9,perceived_rate=$10,
        risk_impact=COALESCE((SELECT impact_code FROM risk.impact_factors WHERE is_active AND rate_factor=$7 ORDER BY impact_code LIMIT 1),risk_impact),
        risk_likelihood=COALESCE((SELECT likelihood_code FROM risk.likelihood_factors WHERE is_active AND rating=$8 ORDER BY likelihood_code LIMIT 1),risk_likelihood),
        perceived_contr_eff=$11,r_risk_exposure=$12,r_risk_rate=$12,current_contr=$13,
        desired_contr_effe=$14,assessment_updated=TRUE,updated_at=NOW() WHERE risk_code=$1
        RETURNING *,to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`,
      [code,input.objective_code,input.risk_title,input.risk_description,input.risk_category,input.risk_consequence,
        input.i_rate,input.l_rate,score.inherent,input.control_effectiveness,input.control_effectiveness*100,
        score.residual,input.current_contr,input.desired_contr_effe]);
      await history(client,code,input.depart_code,p.period_id,"ASSESSED",a.username,input.comments,{before:r,after:updated});
      return {...updated,period_id:p.period_id,workflow_status:workflowState(s),can_edit:true};
    });
    res.json({ok:true,data:record});
  } catch(err) { riskFailure(req,res,err); }
});
router.post("/risk-register/records/:riskCode/root-causes",async(req,res)=>{
  try {
    const input=z.object({period_from:calendarDate,period_to:calendarDate,source_period_id:z.number().int().positive().optional()}).parse(req.body);
    const data=await withTransaction(async client=>{
      await txQuery(client,"SELECT pg_advisory_xact_lock(hashtext('risk-period-create'))");
      const conflict=await txQuery(client,`SELECT period_id FROM risk.periods WHERE period_from<=$2::date AND period_to>=$1::date`,
      [input.period_from,input.period_to]);
      if(conflict.length) throw new RiskError(409,"The reporting dates overlap an existing period.");
      if(input.source_period_id) await period(client,input.source_period_id,true);
      const [p]=await txQuery<{period_id:number}>(client,`INSERT INTO risk.periods(period_from,period_to) VALUES($1,$2) RETURNING *`,
      [input.period_from,input.period_to]);
      if(input.source_period_id){
        const source=await txQuery<Record<string,unknown>>(client,`SELECT r.* FROM risk.risk_master r JOIN risk.periods p
          ON p.period_from=r.period_from AND p.period_to=r.period_to WHERE p.period_id=$1 AND r.is_active ORDER BY r.risk_code`,
        [input.source_period_id]);
        for(const r of source){
          const [copy]=await txQuery<Record<string,unknown>>(client,`INSERT INTO risk.risk_master
            (risk_code,depart_code,period_from,period_to,objective_code,risk_title,risk_description,risk_category,risk_consequence,
            current_contr,desired_contr_effe,entered_by)
            VALUES('RK-'||to_char(NOW(),'YYYYMMDD')||'-'||nextval('risk.register_code_seq'),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [r.depart_code,input.period_from,input.period_to,r.objective_code,r.risk_title,r.risk_description,r.risk_category,r.risk_consequence,
            r.current_contr,r.desired_contr_effe,a.username]);
          await txQuery(client,`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,due_date,action_owner,action_status)
            SELECT $2,root_cause,current_contr,mitigations,due_date,action_owner,action_status FROM risk.root_causes
            WHERE risk_code=$1 AND action_status<>'Closed'`,[r.risk_code,copy.risk_code]);
          await history(client,String(copy.risk_code),String(r.depart_code),p.period_id,"CARRIED_FORWARD",a.username,
            "Carried forward for reassessment",{source_risk_code:r.risk_code,after:copy});
        }
      }
      await history(client,null,null,p.period_id,"PERIOD_OPENED",a.username,"Reporting period opened",p);
      return p;
    });
    res.json({ok:true,data});
  } catch(err) { riskFailure(req,res,err); }
});
router.get("/risk-register/summary",async(req,res)=>{
  try {
    const f=filters.parse(req.query),a=actor(res);
    const pageScope = workspaceScope(a, f.access);
    if(f.depart_code) assertDepartment(a,f.depart_code, f.access === "update" ? "edit" : f.access === "review" ? "review" : "view");
    const rows=await query(`SELECT * FROM risk.register_history
      WHERE ($1::boolean OR depart_code=ANY($2::text[])) AND ($3::integer=0 OR period_id=$3)
      AND ($4::text='' OR depart_code=$4)
      AND ($1::boolean OR action<>'LEGACY_IMPORT_SOURCE') ORDER BY history_id DESC LIMIT 500`,
    [...scope(a),f.period_id,f.depart_code]);
    res.json({ok:true,data:rows.map(r=>({...r,workflow_status:workflowState(r)}))});
  }catch(err){riskFailure(req,res,err);}
});
router.get("/risk-register/history",async(req,res)=>{
  try {
    const f=filters.parse(req.query),a=actor(res);
    if(f.depart_code) assertDepartment(a,f.depart_code);
    const rows=await query(`SELECT * FROM risk.register_history
      WHERE ($1::boolean OR depart_code=ANY($2::text[])) AND ($3::integer=0 OR period_id=$3)
      AND ($4::text='' OR depart_code=$4)
      AND ($1::boolean OR action<>'LEGACY_IMPORT_SOURCE') ORDER BY history_id DESC LIMIT 500`,
    [...scope(a),f.period_id,f.depart_code]);
    res.json({ok:true,data:rows});
  }catch(err){riskFailure(req,res,err);}
});
router.post("/risk-register/assignments",async(req,res)=>{
  try {
    const a=actor(res);
    if(!canManage(a)) throw new RiskError(403,"Risk management access is required.");
    const input=z.object({period_from:calendarDate,period_to:calendarDate,source_period_id:z.number().int().positive().optional()}).parse(req.body);
    const data=await withTransaction(async client=>{
      await txQuery(client,"SELECT pg_advisory_xact_lock(hashtext('risk-period-create'))");
      const conflict=await txQuery(client,`SELECT period_id FROM risk.periods WHERE period_from<=$2::date AND period_to>=$1::date`,
      [input.period_from,input.period_to]);
      if(conflict.length) throw new RiskError(409,"The reporting dates overlap an existing period.");
      if(input.source_period_id) await period(client,input.source_period_id,true);
      const [p]=await txQuery<{period_id:number}>(client,`INSERT INTO risk.periods(period_from,period_to) VALUES($1,$2) RETURNING *`,
      [input.period_from,input.period_to]);
      if(input.source_period_id){
        const source=await txQuery<Record<string,unknown>>(client,`SELECT r.* FROM risk.risk_master r JOIN risk.periods p
          ON p.period_from=r.period_from AND p.period_to=r.period_to WHERE p.period_id=$1 AND r.is_active ORDER BY r.risk_code`,
        [input.source_period_id]);
        for(const r of source){
          const [copy]=await txQuery<Record<string,unknown>>(client,`INSERT INTO risk.risk_master
            (risk_code,depart_code,period_from,period_to,objective_code,risk_title,risk_description,risk_category,risk_consequence,
            current_contr,desired_contr_effe,entered_by)
            VALUES('RK-'||to_char(NOW(),'YYYYMMDD')||'-'||nextval('risk.register_code_seq'),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [r.depart_code,input.period_from,input.period_to,r.objective_code,r.risk_title,r.risk_description,r.risk_category,r.risk_consequence,
            r.current_contr,r.desired_contr_effe,a.username]);
          await txQuery(client,`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,due_date,action_owner,action_status)
            SELECT $2,root_cause,current_contr,mitigations,due_date,action_owner,action_status FROM risk.root_causes
            WHERE risk_code=$1 AND action_status<>'Closed'`,[r.risk_code,copy.risk_code]);
          await history(client,String(copy.risk_code),String(r.depart_code),p.period_id,"CARRIED_FORWARD",a.username,
            "Carried forward for reassessment",{source_risk_code:r.risk_code,after:copy});
        }
      }
      await history(client,null,null,p.period_id,"PERIOD_OPENED",a.username,"Reporting period opened",p);
      return p;
    });
    res.json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
router.post("/risk-register/periods",async(req,res)=>{
  try{
    const a=actor(res);
    if(!canManage(a)) throw new RiskError(403,"Risk management access is required.");
    const input=z.object({period_from:calendarDate,period_to:calendarDate,source_period_id:z.number().int().positive().optional()}).parse(req.body);
    if(input.period_to<input.period_from) throw new RiskError(400,"The reporting end date must not precede its start date.");
    const data=await withTransaction(async client=>{
      await txQuery(client,"SELECT pg_advisory_xact_lock(hashtext('risk-period-create'))");
      const conflict=await txQuery(client,`SELECT period_id FROM risk.periods WHERE period_from<=$2::date AND period_to>=$1::date`,
      [input.period_from,input.period_to]);
      if(conflict.length) throw new RiskError(409,"The reporting dates overlap an existing period.");
      if(input.source_period_id) await period(client,input.source_period_id,true);
      const [p]=await txQuery<{period_id:number}>(client,`INSERT INTO risk.periods(period_from,period_to) VALUES($1,$2) RETURNING *`,
      [input.period_from,input.period_to]);
      if(input.source_period_id){
        const source=await txQuery<Record<string,unknown>>(client,`SELECT r.* FROM risk.risk_master r JOIN risk.periods p
          ON p.period_from=r.period_from AND p.period_to=r.period_to WHERE p.period_id=$1 AND r.is_active ORDER BY r.risk_code`,
        [input.source_period_id]);
        for(const r of source){
          const [copy]=await txQuery<Record<string,unknown>>(client,`INSERT INTO risk.risk_master
            (risk_code,depart_code,period_from,period_to,objective_code,risk_title,risk_description,risk_category,risk_consequence,
            current_contr,desired_contr_effe,entered_by)
            VALUES('RK-'||to_char(NOW(),'YYYYMMDD')||'-'||nextval('risk.register_code_seq'),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [r.depart_code,input.period_from,input.period_to,r.objective_code,r.risk_title,r.risk_description,r.risk_category,r.risk_consequence,
            r.current_contr,r.desired_contr_effe,a.username]);
          await txQuery(client,`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,due_date,action_owner,action_status)
            SELECT $2,root_cause,current_contr,mitigations,due_date,action_owner,action_status FROM risk.root_causes
            WHERE risk_code=$1 AND action_status<>'Closed'`,[r.risk_code,copy.risk_code]);
          await history(client,String(copy.risk_code),String(r.depart_code),p.period_id,"CARRIED_FORWARD",a.username,
            "Carried forward for reassessment",{source_risk_code:r.risk_code,after:copy});
        }
      }
      await history(client,null,null,p.period_id,"PERIOD_OPENED",a.username,"Reporting period opened",p);
      return p;
    });
    res.status(201).json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
router.use(riskWorkflowRouter);
export default router;
