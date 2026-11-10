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
import { pendingResponsibility } from "../lib/risk-reminders";
import { riskImportRouter } from "./risk-import-routes";
import { assessmentRanking } from "../lib/risk-ranking";
import { activeDepartmentOwner, riskReviewEmailReadiness } from "../lib/risk-notifications";
import { buildRiskAnalytics } from "../lib/risk-analytics";
import { assertClosedRegister, closedActionsSQL, historicalMarker, openingInput, openDepartmentCycle } from "../lib/risk-period-opening";

const router = Router();
router.use("/risk-register", privateRiskResponses, requireAuth, requireRiskActor);
const actor = (res: Response) => res.locals.riskActor as RiskActor;
const scope = (a: RiskActor) => [canManage(a), [...new Set([...a.champion_departments,...a.owner_departments])]];
const filters = z.object({
  access: z.enum(["view","update","review"]).optional().default("view"),
  depart_code: z.string().max(50).optional().default(""),
  period_id: z.coerce.number().int().nonnegative().optional().default(0),
  view: z.enum(["all","open","pending_assessment","submitted","reviewed","signed","closed"]).optional().default("all"),
  search: z.string().max(150).optional().default(""),
  include_pending: z.enum(["true","false"]).optional(),
});
const selectRecords = (extraColumns = "") => `SELECT ${extraColumns} r.*,r.period_from::text,r.period_to::text,p.period_id,
  to_char(r.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at,
  actions.root_cause_count,actions.completed_action_count,actions.behind_schedule_count,
  CASE WHEN actions.root_cause_count>0 AND actions.completed_action_count=actions.root_cause_count
    THEN 'Closed' ELSE 'Open' END AS risk_status,
  (actions.behind_schedule_count>0) AS at_risk,
  d.depart_name,c.category_name,COALESCE(s.submitted,FALSE) AS submitted,
  COALESCE(s.reviewed,FALSE) AS reviewed,COALESCE(s.sign_off,FALSE) AS sign_off,
  (COALESCE(s.closed,FALSE) OR p.status='CLOSED') AS closed
  FROM risk.risk_master r JOIN risk.departments d ON d.depart_code=r.depart_code
  JOIN risk.periods p ON p.period_from=r.period_from AND p.period_to=r.period_to
  LEFT JOIN risk.categories c ON c.category_code=r.risk_category
  LEFT JOIN risk.department_summary s ON s.depart_code=r.depart_code
    AND s.period_from=r.period_from AND s.period_to=r.period_to
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS root_cause_count,
      count(*) FILTER (WHERE action_status='Closed')::integer AS completed_action_count,
      count(*) FILTER (WHERE action_status='Behind schedule')::integer AS behind_schedule_count
    FROM risk.root_causes WHERE risk_code=r.risk_code
  ) actions ON TRUE`;
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
    const a = actor(res), params = scope(a);
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
      query("SELECT impact_code AS code,impact_factor AS label,rate_factor::float8 AS factor,rate,matrix_weight FROM risk.impact_factors WHERE is_active ORDER BY impact_code"),
      query("SELECT likelihood_code AS code,likelihood_factor AS label,rating::float8 AS factor,qualification_criteria AS criteria,matrix_weight FROM risk.likelihood_factors WHERE is_active ORDER BY likelihood_code"),
      query("SELECT risk_type,level,minimum::float8,maximum::float8,description FROM risk.exposure_bands WHERE is_active ORDER BY risk_type,minimum"),
    ]);
    res.json({ok:true,data:{actor:{username:a.username,can_manage:canManage(a),
      champion_departments:a.champion_departments,owner_departments:a.owner_departments},
    departments,categories,objectives,periods,staff,assignments,action_statuses,control_effectiveness,impact_factors,likelihood_factors,exposure_bands}});
  } catch (err) { riskFailure(req,res,err); }
});
router.get("/risk-register/records", async (req,res) => {
  try {
    const f = filters.parse(req.query), a = actor(res);
    const pageScope = workspaceScope(a, f.access);
    if (f.depart_code) assertDepartment(a,f.depart_code, f.access === "update" ? "edit" : f.access === "review" ? "review" : "view");
    // Window counts run before LIMIT and share the exact authorization/filter
    // predicate and database snapshot with the displayed records.
    const rows = await query<Record<string,unknown>>(`${selectRecords(`
      count(*) OVER ()::integer AS scope_active_risks,
      (count(*) FILTER (WHERE r.assessment_updated) OVER ())::integer AS scope_assessed_risks,`)}
      WHERE r.is_active AND ($1::boolean OR r.depart_code=ANY($2::text[]))
      AND ($3::text='' OR r.depart_code=$3) AND ($4::integer=0 OR p.period_id=$4)
      AND (r.risk_title ILIKE $5 OR r.risk_code ILIKE $5)
      AND ($6::text='all'
        OR $6='closed' AND (COALESCE(s.closed,FALSE) OR p.status='CLOSED'
          OR actions.root_cause_count>0 AND actions.completed_action_count=actions.root_cause_count)
        OR p.status='OPEN' AND NOT COALESCE(s.closed,FALSE) AND (
          $6='open' AND NOT COALESCE(s.submitted,FALSE)
          OR $6='pending_assessment' AND NOT COALESCE(s.submitted,FALSE) AND NOT COALESCE(r.assessment_updated,FALSE)
          OR $6='submitted' AND COALESCE(s.submitted,FALSE) AND NOT COALESCE(s.reviewed,FALSE)
          OR $6='reviewed' AND COALESCE(s.reviewed,FALSE) AND NOT COALESCE(s.sign_off,FALSE)
          OR $6='signed' AND COALESCE(s.sign_off,FALSE)))
      ORDER BY r.period_from DESC,r.r_risk_exposure DESC NULLS LAST,r.risk_code LIMIT 500`,
    [...pageScope,f.depart_code,f.period_id,`%${f.search}%`,f.view]);
    const totals = {
      active_risks: Number(rows[0]?.scope_active_risks ?? 0),
      assessed_risks: Number(rows[0]?.scope_assessed_risks ?? 0),
    };
    res.json({ok:true,totals,data:rows.map(({scope_active_risks,scope_assessed_risks,...r})=>presentRecord(r,a))});
  } catch (err) { riskFailure(req,res,err); }
});
router.get("/risk-register/records/:riskCode", async (req,res) => {
  try {
    const a=actor(res), code=String(req.params.riskCode);
    const [risk]=await query<Record<string,unknown>>(`${selectRecords()} WHERE r.risk_code=$1`,[code]);
    if (!risk) throw new RiskError(404,"Risk was not found.");
    assertDepartment(a,String(risk.depart_code));
    const [root_causes,events]=await Promise.all([
      query("SELECT *,due_date::text FROM risk.root_causes WHERE risk_code=$1 ORDER BY root_id",[code]),
      query(`SELECT * FROM risk.register_history WHERE depart_code=$1 AND period_id=$2
        AND (risk_code=$3 OR risk_code IS NULL) AND ($4::boolean OR action<>'LEGACY_IMPORT_SOURCE') ORDER BY history_id DESC LIMIT 200`,
      [risk.depart_code,risk.period_id,code,canManage(a)]),
    ]);
    res.json({ok:true,data:{risk:presentRecord(risk,a),root_causes,history:events}});
  } catch(err) { riskFailure(req,res,err); }
});
router.post("/risk-register/records", async (req,res) => {
  try {
    const input=recordInput.parse(req.body), a=actor(res);
    assertDepartment(a,input.depart_code,"edit");
    const record=await withTransaction(async client=>{
      await validateCatalogs(client,input);
      const p=await period(client,input.period_id), s=await cycle(client,input.depart_code,p);
      assertEditable(s);
      const [r]=await txQuery<Record<string,unknown>>(client, `INSERT INTO risk.risk_master
        (risk_code,depart_code,period_from,period_to,objective_code,risk_title,risk_description,
          risk_category,risk_consequence,entered_by)
        VALUES('RK-'||to_char(NOW(),'YYYYMMDD')||'-'||nextval('risk.register_code_seq'),$1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *,to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`,
      [input.depart_code,p.period_from,p.period_to,input.objective_code,input.risk_title,
        input.risk_description,input.risk_category,input.risk_consequence,a.username]);
      await history(client,String(r.risk_code),input.depart_code,input.period_id,"CREATED",a.username,"Risk registered",r);
      return {...r,period_id:p.period_id,workflow_status:"OPEN",can_edit:true};
    });
    res.status(201).json({ok:true,data:record});
  } catch(err) { riskFailure(req,res,err); }
});
router.put("/risk-register/records/:riskCode",async(req,res)=>{
  try {
    const input=assessmentInput.parse(req.body),a=actor(res),code=String(req.params.riskCode);
    const record=await withTransaction(async client=>{
      const {r,p,s}=await lockedRecord(client,code,a,"edit");
      if (r.depart_code !== input.depart_code || p.period_id !== input.period_id)
        throw new RiskError(400,"A risk cannot be moved to a different department or reporting period.");
      assertRecordEditable(s,a,input.depart_code); assertFresh(r.updated_at,input.expected_updated_at);
      await validateCatalogs(client,input,r);
      const score=calculateRisk(input.i_rate,input.l_rate,input.control_effectiveness);
      const ranking=await assessmentRanking(client,r,input);
      const [updated]=await txQuery<Record<string,unknown>>(client,`UPDATE risk.risk_master SET
        objective_code=$2,risk_title=$3,risk_description=$4,risk_category=$5,risk_consequence=$6,
        i_rate=$7,l_rate=$8,i_risk_exposure=$9,i_risk_rate=$9,perceived_rate=$10,
        risk_impact=$15,risk_likelihood=$16,ranking_snapshot=$17::jsonb,
        perceived_contr_eff=$11,r_risk_exposure=$12,r_risk_rate=$12,current_contr=$13,
        desired_contr_effe=$14,assessment_updated=TRUE,updated_at=NOW() WHERE risk_code=$1
        RETURNING *,to_char(updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at`,
      [code,input.objective_code,input.risk_title,input.risk_description,input.risk_category,input.risk_consequence,
        input.i_rate,input.l_rate,score.inherent,input.control_effectiveness,input.control_effectiveness*100,
        score.residual,input.current_contr,input.desired_contr_effe,
        ranking.impact?.code ?? r.risk_impact,ranking.likelihood?.code ?? r.risk_likelihood,JSON.stringify(ranking)]);
      await history(client,code,input.depart_code,p.period_id,"ASSESSED",a.username,input.comments,{before:r,after:updated});
      return {...updated,period_id:p.period_id,workflow_status:workflowState(s),can_edit:true};
    });
    res.json({ok:true,data:record});
  } catch(err) { riskFailure(req,res,err); }
});
router.post("/risk-register/records/:riskCode/root-causes",async(req,res)=>{
  try {
    const input=causeInput.parse(req.body),a=actor(res),code=String(req.params.riskCode);
    const data=await withTransaction(async client=>{
      const {r,p,s}=await lockedRecord(client,code,a,"edit");
      assertRecordEditable(s,a,String(r.depart_code));assertFresh(r.updated_at,input.expected_updated_at);
      const [existing]=input.root_id
        ? await txQuery(client,"SELECT * FROM risk.root_causes WHERE root_id=$1 AND risk_code=$2 FOR UPDATE",[input.root_id,code])
        : [];
      if(input.root_id && !existing) throw new RiskError(404,"Root cause does not belong to this risk.");
      const approvedStatus = await txQuery(client,
        "SELECT status_code FROM risk.action_statuses WHERE status_name=$1 AND is_active FOR SHARE",
        [input.action_status]);
      if (!approvedStatus.length && existing?.action_status !== input.action_status)
        throw new RiskError(400,"Select an approved action status.");
      if (!existing || existing.action_owner !== input.action_owner) {
        const staff=await txQuery(client,`SELECT e.username FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
          WHERE e.username=$1 AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active`,
        [input.action_owner]);
        if(!staff.length) throw new RiskError(400,"Select an active action owner.");
      }
      const params=[code,input.root_cause,input.current_contr,input.mitigations,input.due_date,input.action_owner,input.action_status];
      const [root]=input.root_id
        ? await txQuery(client,`UPDATE risk.root_causes SET root_cause=$2,current_contr=$3,mitigations=$4,
          due_date=$5,action_owner=$6,action_status=$7 WHERE risk_code=$1 AND root_id=$8 RETURNING *`,[...params,input.root_id])
        : await txQuery(client,`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,due_date,action_owner,action_status)
          VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,params);
      await txQuery(client,"UPDATE risk.risk_master SET updated_at=NOW() WHERE risk_code=$1",[code]);
      await history(client,code,String(r.depart_code),p.period_id,"MITIGATION_SAVED",a.username,input.mitigations,{before:existing??null,after:root});
      return root;
    });
    res.json({ok:true,data});
  } catch(err) { riskFailure(req,res,err); }
});
router.get("/risk-register/readiness/:departCode/:periodId",async(req,res)=>{
  try {
    const input=z.object({
      departCode:z.string().trim().min(1).max(50),
      periodId:z.coerce.number().int().positive(),
    }).parse(req.params),a=actor(res);
    assertDepartment(a,input.departCode,"edit");
    const data=await withTransaction(async client => {
      const [counts]=await txQuery(client,`SELECT d.depart_code,p.period_id,
      count(r.risk_id)::integer AS total_active_risks,
      count(r.risk_id) FILTER(WHERE r.assessment_updated)::integer AS assessed_risks,
      count(r.risk_id) FILTER(WHERE causes.risk_code IS NULL)::integer AS risks_missing_root_causes
      FROM risk.departments d CROSS JOIN risk.periods p
      LEFT JOIN risk.risk_master r ON r.depart_code=d.depart_code
        AND r.period_from=p.period_from AND r.period_to=p.period_to AND r.is_active
      LEFT JOIN (SELECT DISTINCT risk_code FROM risk.root_causes) causes ON causes.risk_code=r.risk_code
      WHERE d.depart_code=$1 AND d.is_active AND p.period_id=$2
      GROUP BY d.depart_code,p.period_id`,[input.departCode,input.periodId]);
      if(!counts) throw new RiskError(404,"Active risk department or reporting period was not found.");
      const owner=await activeDepartmentOwner(client,input.departCode);
      return {...counts,...riskReviewEmailReadiness(owner)};
    });
    res.json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
router.get("/risk-register/analytics",async(req,res)=>{
  try {
    const f=filters.extend({population:z.enum(["open","all"]).default("open")}).parse(req.query),a=actor(res);
    if(f.depart_code) assertDepartment(a,f.depart_code,"view");
    const rows=await query<Record<string,unknown>>(`${selectRecords(`action_totals.open_actions,action_totals.overdue_actions,`)}
      LEFT JOIN LATERAL (
        SELECT count(*) FILTER(WHERE action_status IS DISTINCT FROM 'Closed')::integer AS open_actions,
          count(*) FILTER(WHERE action_status IS DISTINCT FROM 'Closed' AND due_date<CURRENT_DATE)::integer AS overdue_actions
        FROM risk.root_causes WHERE risk_code=r.risk_code
      ) action_totals ON TRUE
      WHERE r.is_active AND d.is_active AND ($1::boolean OR r.depart_code=ANY($2::text[]))
        AND ($3::integer=0 OR p.period_id=$3)`,
      [...workspaceScope(a,"view"),f.period_id]);
    res.json({ok:true,data:buildRiskAnalytics(rows.map(row=>({...row,workflow_status:workflowState(row)})),f.population,new Date(),f.depart_code)});
  }catch(err){riskFailure(req,res,err);}
});
router.get("/risk-register/summary",async(req,res)=>{
  try {
    const f=filters.parse(req.query),a=actor(res);
    const pageScope = workspaceScope(a, f.access);
    if(f.depart_code) assertDepartment(a,f.depart_code, f.access === "update" ? "edit" : f.access === "review" ? "review" : "view");
    const rows=await query<Record<string,unknown>>(`SELECT d.depart_code,d.depart_name,p.period_id,
      p.period_from::text,p.period_to::text,
      count(r.risk_id)::integer AS total_risks,count(r.risk_id) FILTER(WHERE r.assessment_updated)::integer AS assessed_risks,
      round(avg(r.r_risk_exposure),2) AS avg_exposure,max(r.r_risk_exposure) AS max_exposure,
      COALESCE(sum(actions.open_actions),0)::integer AS open_actions,
      COALESCE(sum(actions.overdue_actions),0)::integer AS overdue_actions,
      (SELECT n.email_status FROM risk.review_notifications n WHERE n.summary_id=s.summary_id
        AND n.submitted_at=s.submitted_at) AS review_email_status,
      (SELECT n.email_error FROM risk.review_notifications n WHERE n.summary_id=s.summary_id
        AND n.submitted_at=s.submitted_at) AS review_email_error,
      COALESCE(s.submitted,FALSE) AS submitted,COALESCE(s.reviewed,FALSE) AS reviewed,
      COALESCE(s.sign_off,FALSE) AS sign_off,(COALESCE(s.closed,FALSE) OR p.status='CLOSED') AS closed
      FROM risk.departments d CROSS JOIN risk.periods p
      LEFT JOIN risk.department_summary s ON s.depart_code=d.depart_code AND s.period_from=p.period_from AND s.period_to=p.period_to
      LEFT JOIN risk.risk_master r ON r.depart_code=d.depart_code AND r.period_from=p.period_from AND r.period_to=p.period_to AND r.is_active
      LEFT JOIN LATERAL(SELECT count(*) FILTER(WHERE action_status<>'Closed') AS open_actions,
        count(*) FILTER(WHERE action_status<>'Closed' AND due_date<CURRENT_DATE) AS overdue_actions
        FROM risk.root_causes WHERE risk_code=r.risk_code) actions ON TRUE
      WHERE d.is_active AND ($1::boolean OR d.depart_code=ANY($2::text[]))
      AND ($3::integer=0 OR p.period_id=$3) AND ($4::text='' OR d.depart_code=$4)
      GROUP BY d.depart_code,d.depart_name,p.period_id,p.period_from,p.period_to,p.status,s.summary_id
      ORDER BY p.period_from DESC,d.depart_name`,[...pageScope,f.period_id,f.depart_code]);
    res.json({ok:true,data:await Promise.all(rows.map(async r=>({...r,workflow_status:workflowState(r),
      ...(f.include_pending==="true" ? await pendingResponsibility(String(r.depart_code),workflowState(r),Number(r.total_risks)) : {})})))});
  }catch(err){riskFailure(req,res,err);}
});
router.get("/risk-register/history",async(req,res)=>{
  try {
    const f=filters.parse(req.query),a=actor(res);
    if(f.depart_code) assertDepartment(a,f.depart_code);
    const rows=await query(`SELECT * FROM risk.register_history
      WHERE ($1::boolean OR depart_code=ANY($2::text[])) AND ($3::integer=0 OR period_id=$3)
      AND ($4::text='' OR depart_code=$4) AND ($1::boolean OR action<>'LEGACY_IMPORT_SOURCE') ORDER BY history_id DESC LIMIT 500`,
    [...scope(a),f.period_id,f.depart_code]);
    res.json({ok:true,data:rows});
  }catch(err){riskFailure(req,res,err);}
});
router.post("/risk-register/assignments",async(req,res)=>{
  try {
    const a=actor(res);
    if(!canManage(a)) throw new RiskError(403,"Risk management access is required.");
    const input=z.object({depart_code:z.string().min(1).max(50),champion_username:z.string().min(1).max(100),
      owner_username:z.string().min(1).max(100)}).parse(req.body);
    const data=await withTransaction(async client=>{
      const [department]=await txQuery(client,"SELECT depart_code FROM risk.departments WHERE depart_code=$1 AND is_active FOR UPDATE",[input.depart_code]);
      if(!department) throw new RiskError(400,"Select an active department.");
      for(const name of [input.champion_username,input.owner_username]){
        const active=await txQuery(client,`SELECT e.username FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
          WHERE e.username=$1 AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active FOR SHARE OF e,p`,[name]);
        if(!active.length) throw new RiskError(400,"Both champion and owner must be active MIS accounts.");
      }
      const [mapping]=await txQuery(client,`INSERT INTO risk.department_assignments(depart_code,champion_username,owner_username,assigned_by)
        VALUES($1,$2,$3,$4) ON CONFLICT(depart_code) DO UPDATE SET champion_username=$2,owner_username=$3,assigned_by=$4,assigned_at=NOW() RETURNING *`,
      [input.depart_code,input.champion_username,input.owner_username,a.username]);
      await txQuery(client,"UPDATE risk.champions SET is_active=FALSE WHERE department=$1",[input.depart_code]);
      await txQuery(client,`INSERT INTO risk.champions(emp_code,username,department)
        SELECT COALESCE(NULLIF(emp_code,''),username),username,$2 FROM crm.employees WHERE username=$1`,
      [input.champion_username,input.depart_code]);
      await history(client,null,input.depart_code,null,"TEAM_ASSIGNED",a.username,
        "Department champion and owner assigned",mapping);
      return mapping;
    });
    res.json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
router.get("/risk-register/closed-registers",async(req,res)=>{
  try {
    const f=filters.parse(req.query),a=actor(res);
    if(f.depart_code) assertDepartment(a,f.depart_code,"view");
    const data=await query(`SELECT d.depart_code,d.depart_name,p.period_id,p.period_from::text,p.period_to::text,
      count(*)::integer AS total_risks,
      count(*) FILTER(WHERE r.is_active AND NOT (${closedActionsSQL}))::integer AS open_risks,
      count(*) FILTER(WHERE (${closedActionsSQL}))::integer AS closed_risks,
      (h.target_period_id IS NOT NULL) AS historical,h.target_period_id,
      (d.is_active AND h.target_period_id IS NULL AND $1::boolean) AS can_open,'CLOSED' AS workflow_status
      FROM risk.risk_master r JOIN risk.departments d ON d.depart_code=r.depart_code
      JOIN risk.periods p ON p.period_from=r.period_from AND p.period_to=r.period_to
      LEFT JOIN risk.department_summary s ON s.depart_code=r.depart_code AND s.period_from=r.period_from AND s.period_to=r.period_to
      LEFT JOIN LATERAL(SELECT (snapshot->>'target_period_id')::integer AS target_period_id FROM risk.register_history
        WHERE depart_code=d.depart_code AND period_id=p.period_id AND action=$5 LIMIT 1) h ON TRUE
      WHERE ($1::boolean OR d.depart_code=ANY($2::text[]))
        AND ($3::text='' OR d.depart_code=$3) AND ($4::integer=0 OR p.period_id=$4)
        AND (COALESCE(s.closed,FALSE) OR p.status='CLOSED')
      GROUP BY d.depart_code,d.depart_name,d.is_active,p.period_id,p.period_from,p.period_to,h.target_period_id
      ORDER BY d.depart_name,p.period_from DESC`,[...scope(a),f.depart_code,f.period_id,historicalMarker]);
    res.json({ok:true,data});
  }catch(err){riskFailure(req,res,err);}
});
router.get("/risk-register/historical-risks",async(req,res)=>{
  try {
    const f=z.object({depart_code:z.string().min(1).max(50),period_id:z.coerce.number().int().positive(),
      page:z.coerce.number().int().positive().max(1_000_000).default(1),
      page_size:z.coerce.number().int().min(1).max(100).default(20),search:z.string().trim().max(500).default("")}).parse(req.query);
    const a=actor(res);assertDepartment(a,f.depart_code,"view");
    await assertClosedRegister(f.depart_code,f.period_id);
    const params=[f.depart_code,f.period_id,f.search];
    const [count]=await query<{total:number}>(`SELECT count(*)::integer AS total FROM risk.risk_master r
      JOIN risk.periods p ON p.period_from=r.period_from AND p.period_to=r.period_to
      WHERE r.depart_code=$1 AND p.period_id=$2
      AND ($3::text='' OR r.risk_title ILIKE '%'||$3||'%' OR r.risk_code ILIKE '%'||$3||'%')`,params);
    const records=await query<Record<string,unknown>>(`${selectRecords()}
      WHERE r.depart_code=$1 AND p.period_id=$2
      AND ($3::text='' OR r.risk_title ILIKE '%'||$3||'%' OR r.risk_code ILIKE '%'||$3||'%')
      ORDER BY r.risk_title,r.risk_code LIMIT $4 OFFSET $5`,[...params,f.page_size,(f.page-1)*f.page_size]);
    res.json({ok:true,data:{records:records.map(r=>({...presentRecord(r,a),can_edit:false})),
      total:count.total,page:f.page,page_size:f.page_size}});
  }catch(err){riskFailure(req,res,err);}
});
router.post("/risk-register/closed-registers/:departCode/open",async(req,res)=>{
  try {
    const department=z.string().min(1).max(50).parse(req.params.departCode);
    const data=await openDepartmentCycle(department,openingInput.parse(req.body),actor(res));
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
router.use(riskImportRouter);
export default router;
