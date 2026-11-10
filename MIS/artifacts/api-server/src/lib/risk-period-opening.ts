import { z } from "zod";
import { query, txQuery, withTransaction } from "./postgres";
import { RiskError, type RiskActor, canManage, calendarDate, cycle, history } from "./risk-register";
import { queueRiskOpeningNotifications } from "./risk-opening-notifications";

export const openingInput=z.object({
  source_period_id:z.number().int().positive(),
  target_period_id:z.number().int().positive().optional(),
  period_from:calendarDate.optional(),period_to:calendarDate.optional(),
  comments:z.string().trim().min(1).max(4000),
}).superRefine((input,ctx)=>{
  if(input.target_period_id ? Boolean(input.period_from || input.period_to) : !input.period_from || !input.period_to)
    ctx.addIssue({code:"custom",message:"Choose an existing reporting period or provide both new reporting dates."});
  if(input.period_from && input.period_to && input.period_to<input.period_from)
    ctx.addIssue({code:"custom",message:"The reporting end date must not precede its start date."});
});

export const historicalMarker="REGISTER_ROLLED_FORWARD";
export const closedActionsSQL=`EXISTS(SELECT 1 FROM risk.root_causes c WHERE c.risk_code=r.risk_code)
  AND NOT EXISTS(SELECT 1 FROM risk.root_causes c WHERE c.risk_code=r.risk_code AND c.action_status IS DISTINCT FROM 'Closed')`;
export async function assertClosedRegister(department:string,periodId:number) {
  const [row]=await query<{closed:boolean}>(`SELECT (p.status='CLOSED' OR COALESCE(s.closed,FALSE)) AS closed
    FROM risk.periods p LEFT JOIN risk.department_summary s
      ON s.period_from=p.period_from AND s.period_to=p.period_to AND s.depart_code=$1 WHERE p.period_id=$2`,[department,periodId]);
  if(!row?.closed) throw new RiskError(409,"Only closed departmental registers can be viewed as previous-period records.");
}

export async function openDepartmentCycle(department:string,input:z.infer<typeof openingInput>,actor:RiskActor) {
  if(!canManage(actor)) throw new RiskError(403,"Risk management access is required.");
  return withTransaction(async client=>{
    await txQuery(client,"SELECT pg_advisory_xact_lock(hashtext('risk-period-create'))");
    const periods=await txQuery<{period_id:number;period_from:string;period_to:string;status:string}>(client,
      `SELECT *,period_from::text,period_to::text FROM risk.periods
        WHERE period_id=ANY($1::integer[]) ORDER BY period_id FOR UPDATE`,
      [[input.source_period_id,...(input.target_period_id ? [input.target_period_id] : [])]]);
    const source=periods.find(p=>p.period_id===input.source_period_id);
    if(!source) throw new RiskError(404,"The closed source reporting period was not found.");
    const [d]=await txQuery<{is_active:boolean}>(client,"SELECT is_active FROM risk.departments WHERE depart_code=$1 FOR SHARE",[department]);
    if(!d?.is_active) throw new RiskError(409,"An inactive department cannot start a new register.");
    const [summary]=await txQuery<Record<string,unknown>>(client,`SELECT * FROM risk.department_summary
      WHERE depart_code=$1 AND period_from=$2 AND period_to=$3 FOR UPDATE`,[department,source.period_from,source.period_to]);
    if(!summary?.closed && source.status!=="CLOSED") throw new RiskError(409,"Close this departmental register before opening its next reporting period.");
    const previous=await txQuery(client,`SELECT 1 FROM risk.register_history
      WHERE depart_code=$1 AND period_id=$2 AND action=$3 LIMIT 1`,[department,source.period_id,historicalMarker]);
    if(previous.length) throw new RiskError(409,"This previous-period register is already historical. Continue with its new register.");
    const risks=await txQuery<Record<string,unknown>>(client,`SELECT r.*,(${closedActionsSQL}) AS action_closed,
      (SELECT jsonb_agg(c ORDER BY c.root_id) FROM risk.root_causes c WHERE c.risk_code=r.risk_code) AS root_causes
      FROM risk.risk_master r WHERE r.depart_code=$1 AND r.period_from=$2 AND r.period_to=$3
      ORDER BY r.risk_code FOR UPDATE OF r`,[department,source.period_from,source.period_to]);
    if(!risks.length) throw new RiskError(409,"The selected department has no source register to open.");
    let target=periods.find(p=>p.period_id===input.target_period_id);
    if(input.target_period_id && !target) throw new RiskError(404,"The selected target reporting period was not found.");
    if(target && (target.period_id===source.period_id || target.period_from<=source.period_to || target.status!=="OPEN"))
      throw new RiskError(409,"Select an open reporting period beginning after the closed source period.");
    if(!target) {
      if(input.period_from!<=source.period_to) throw new RiskError(409,"The new reporting period must begin after the source period ends.");
      const overlaps=await txQuery(client,`SELECT period_id FROM risk.periods
        WHERE period_from<=$2::date AND period_to>=$1::date`,[input.period_from,input.period_to]);
      if(overlaps.length) throw new RiskError(409,"Those dates overlap an existing reporting period. Select that period instead.");
      [target]=await txQuery<typeof source>(client,`INSERT INTO risk.periods(period_from,period_to)
        VALUES($1,$2) RETURNING *,period_from::text,period_to::text`,[input.period_from,input.period_to]);
      await history(client,null,null,target.period_id,"PERIOD_OPENED",actor.username,input.comments,target);
    }
    const existing=await txQuery(client,`SELECT risk_code FROM risk.risk_master
      WHERE depart_code=$1 AND period_from=$2 AND period_to=$3 LIMIT 1`,[department,target.period_from,target.period_to]);
    if(existing.length) throw new RiskError(409,"This department already has a register in the target period. Nothing has been overwritten.");
    const next=await cycle(client,department,target);
    if(next.submitted || next.reviewed || next.sign_off || next.closed)
      throw new RiskError(409,"The target department register is not available for a new cycle.");
    let carried=0;
    for(const r of risks.filter(r=>r.is_active && !r.action_closed)) {
      const [copy]=await txQuery<{risk_code:string}>(client,`INSERT INTO risk.risk_master
        (risk_code,depart_code,period_from,period_to,objective_code,risk_title,risk_description,risk_category,
          risk_consequence,current_contr,desired_contr_effe,entered_by)
        VALUES('RK-'||to_char(NOW(),'YYYYMMDD')||'-'||nextval('risk.register_code_seq'),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING risk_code`,
        [department,target.period_from,target.period_to,r.objective_code,r.risk_title,r.risk_description,r.risk_category,
          r.risk_consequence,r.current_contr,r.desired_contr_effe,actor.username]);
      await txQuery(client,`INSERT INTO risk.root_causes(risk_code,root_cause,current_contr,mitigations,due_date,action_owner,action_status)
        SELECT $2,root_cause,current_contr,mitigations,due_date,action_owner,action_status
        FROM risk.root_causes WHERE risk_code=$1 ORDER BY root_id`,[r.risk_code,copy.risk_code]);
      await history(client,copy.risk_code,department,target.period_id,"CARRIED_FORWARD",actor.username,input.comments,
        {source_risk_code:r.risk_code,source_period_id:source.period_id});
      carried++;
    }
    await history(client,null,department,source.period_id,historicalMarker,actor.username,input.comments,
      {source_period_id:source.period_id,target_period_id:target.period_id,register:summary,risks});
    const notification=await queueRiskOpeningNotifications(client,{summaryId:next.summary_id,department,
      sourcePeriodId:source.period_id,periodId:target.period_id,periodFrom:target.period_from,periodTo:target.period_to,openedBy:actor.username});
    await history(client,null,department,target.period_id,"REGISTER_OPENED",actor.username,input.comments,
      {source_period_id:source.period_id,carried_risks:carried,notification});
    return {depart_code:department,source_period_id:source.period_id,target_period_id:target.period_id,
      carried_risks:carried,historical_risks:risks.length,status:"OPEN",notification};
  });
}
