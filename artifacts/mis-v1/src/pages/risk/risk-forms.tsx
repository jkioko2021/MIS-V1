import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ClipboardCheck, ClipboardList, FilePlus2 } from 'lucide-react';
import type { RiskAssessmentInput, RiskCauseInput, RiskLookup, RiskRecord, RiskRootCause, RiskOptionsResponseData } from '@workspace/api-client-react';
import { useCreateRisk } from './use-risk-register';
import { buttonClass, dateLabel, EmptyState, Exposure, Field, fieldClass, secondaryButton, SkeletonRows, StatusPill, text } from './risk-ui';

export function NewRiskForm({ options, activeDepartment, period, mutation, mutating, onSubmit, onError }: {
  options: RiskOptionsResponseData; activeDepartment: string; period: string; mutation: ReturnType<typeof useCreateRisk>;
  mutating: boolean; onSubmit: (response: unknown) => void; onError: (error: unknown) => void;
}) {
  const [depart, setDepart] = useState(activeDepartment);
  const [periodId, setPeriodId] = useState(period);
  const [objective, setObjective] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [consequence, setConsequence] = useState('');
  const departments = options.actor.can_manage ? options.departments : options.departments.filter(item => options.actor.champion_departments.includes(item.depart_code ?? ''));
  const periods = options.periods ?? [];
  const objectives = (options.objectives ?? []).filter(item => !depart || item.depart_code === depart);
  useEffect(() => {
    if (activeDepartment && departments.some(item => item.depart_code === activeDepartment)) setDepart(activeDepartment);
    else if (!departments.some(item => item.depart_code === depart)) setDepart(departments[0]?.depart_code ?? '');
  }, [activeDepartment, depart, departments]);
  useEffect(() => { if (!periodId && period) setPeriodId(period); }, [period, periodId]);
  const canCreate = Boolean(depart && periodId && objective && category && title.trim() && description.trim() && consequence.trim());
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate || mutating) return;
    mutation.mutate({ data: { depart_code: depart, period_id: Number(periodId), objective_code: objective, risk_title: title.trim(), risk_description: description.trim(), risk_category: category, risk_consequence: consequence.trim() } }, {
      onSuccess: onSubmit, onError,
    });
  };
  return <section className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
    <div className="rounded-2xl bg-[#dfe9df] p-6 text-[#173d34]"><p className="text-[10px] font-bold uppercase tracking-[.17em]">A good register starts with context</p><h3 className="mt-3 font-[Manrope] text-2xl font-extrabold">Name the exposure. Make its impact legible.</h3><p className="mt-3 text-sm leading-6 text-[#3b5d54]">A new record captures what could happen and why it matters. Assessment factors and controls are added in the next step.</p>
      <div className="mt-6 border-t border-[#c1d4c5] pt-4 text-xs leading-5 text-[#3b5d54]"><strong>Required before submission</strong><br />Department · period · objective · category · title · description · consequence</div>
    </div>
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="mb-5"><h3 className="font-[Manrope] text-xl font-bold">Register a risk</h3><p className="mt-1 text-sm text-muted-foreground">The record is added to the selected department register.</p></div>
      {!options.actor.can_manage && departments.length === 0 && <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Risk registration is available to mapped champions. Contact your administrator if you need access.</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Department"><select className={fieldClass} value={depart} onChange={event => { setDepart(event.target.value); setObjective(''); }} required><option value="">Choose department</option>{departments.map((item, index) => <option key={item.depart_code ?? index} value={item.depart_code ?? ''}>{item.depart_name ?? item.depart_code}</option>)}</select></Field>
        <Field label="Reporting period"><select className={fieldClass} value={periodId} onChange={event => setPeriodId(event.target.value)} required><option value="">Choose open period</option>{periods.filter(item => String(item.status).toLowerCase() === 'open').map((item, index) => <option key={item.period_id ?? index} value={String(item.period_id ?? '')}>{dateLabel(item.period_from)} – {dateLabel(item.period_to)}</option>)}</select></Field>
        <Field label="Department objective"><select className={fieldClass} value={objective} onChange={event => setObjective(event.target.value)} required><option value="">Choose objective</option>{objectives.map((item, index) => <option key={item.obj_code ?? index} value={item.obj_code ?? ''}>{item.obj_name ?? item.obj_code}</option>)}</select></Field>
        <Field label="Risk category"><select className={fieldClass} value={category} onChange={event => setCategory(event.target.value)} required><option value="">Choose category</option>{options.categories.map((item, index) => <option key={item.category_code ?? index} value={item.category_code ?? ''}>{item.category_name ?? item.category_code}</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="Risk title"><input className={fieldClass} value={title} maxLength={150} onChange={event => setTitle(event.target.value)} required placeholder="A concise description of the exposure" /></Field></div>
        <div className="sm:col-span-2"><Field label="Description"><textarea className={`${fieldClass} min-h-24`} value={description} onChange={event => setDescription(event.target.value)} required placeholder="What may happen, and under what circumstances?" /></Field></div>
        <div className="sm:col-span-2"><Field label="Consequence"><textarea className={`${fieldClass} min-h-20`} value={consequence} onChange={event => setConsequence(event.target.value)} required placeholder="What would the impact be on the department or organisation?" /></Field></div>
      </div>
      <div className="mt-6 flex justify-end"><button className={buttonClass} disabled={!canCreate || mutating} type="submit"><FilePlus2 className="h-4 w-4" />Create risk record</button></div>
    </form>
  </section>;
}

export function AssessmentPanel({ risk, roots, staff, objectives, categories, loading, mutating, onSave, onCause }: {
  risk?: RiskRecord; roots: RiskRootCause[]; staff: RiskLookup[]; objectives: RiskLookup[]; categories: RiskLookup[];
  loading: boolean; mutating: boolean;
  onSave: (data: RiskAssessmentInput, code: string) => void;
  onCause: (data: RiskCauseInput, code: string) => void;
}) {
  const [riskTitle, setRiskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [consequence, setConsequence] = useState('');
  const [objective, setObjective] = useState('');
  const [category, setCategory] = useState('');
  const [impact, setImpact] = useState('');
  const [likelihood, setLikelihood] = useState('');
  const [effectiveness, setEffectiveness] = useState('');
  const [currentControls, setCurrentControls] = useState('');
  const [desiredControls, setDesiredControls] = useState('');
  const [comment, setComment] = useState('');
  const [cause, setCause] = useState('');
  const [mitigations, setMitigations] = useState('');
  const [rootControls, setRootControls] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<RiskCauseInput['action_status']>('Open');
  const [rootId, setRootId] = useState('');
  const [formError, setFormError] = useState('');
  const [rootDirty, setRootDirty] = useState(false);
  const lastAssessmentRisk = useRef('');
  useEffect(() => {
    if (!risk || (rootDirty && lastAssessmentRisk.current === risk.risk_code)) return;
    lastAssessmentRisk.current = risk.risk_code;
    setImpact(risk.i_rate ?? ''); setLikelihood(risk.l_rate ?? '');
    const historicalPercent = risk.perceived_contr_eff == null ? Number.NaN : Number.parseFloat(risk.perceived_contr_eff);
    // This column stores a percentage, including valid values below 1%.
    // Do not infer fractional units from its magnitude.
    setEffectiveness(Number.isFinite(historicalPercent) ? String(historicalPercent) : '');
    setCurrentControls(risk.current_contr ?? ''); setDesiredControls(risk.desired_contr_effe ?? '');
  }, [risk?.risk_code, risk?.updated_at]);
  useEffect(() => {
    setRiskTitle(risk?.risk_title ?? ''); setDescription(risk?.risk_description ?? '');
    setConsequence(risk?.risk_consequence ?? ''); setObjective(risk?.objective_code ?? '');
    setCategory(risk?.risk_category ?? '');
    setRootId(''); setCause(''); setRootControls(''); setMitigations(''); setDueDate(''); setOwner('');
    setStatus('Open'); setComment(''); setFormError(''); setRootDirty(false);
  }, [risk?.risk_code]);
  const inherent = Number(impact) * Number(likelihood);
  const residual = inherent * (1 - Number(effectiveness || 0) / 100);
  if (loading) return <section className="rounded-2xl border border-border bg-card p-5"><SkeletonRows /></section>;
  if (!risk) return <EmptyState title="Select a risk to continue" description="Choose a record from the list to complete its assessment, edit controls or add a root cause." />;
  const allowed = risk.can_edit === true;
  const saveAssessment = (event: FormEvent) => {
    event.preventDefault();
    const i = Number(impact); const l = Number(likelihood); const eff = Number(effectiveness);
    if (!(i > 0 && i <= 100 && l > 0 && l <= 100 && eff >= 0 && eff <= 100) || !comment.trim()) {
      setFormError('Enter impact and likelihood above 0 and no greater than 100, effectiveness from 0–100%, and a required comment.'); return;
    }
    if (!objective || !category || !riskTitle.trim() || !description.trim() || !consequence.trim()) {
      setFormError('Complete the risk title, objective, category, description and consequence before assessing.'); return;
    }
    setFormError('');
    onSave({ depart_code: risk.depart_code, period_id: risk.period_id, objective_code: objective, risk_title: riskTitle.trim(), risk_description: description.trim(), risk_category: category, risk_consequence: consequence.trim(), i_rate: i, l_rate: l, control_effectiveness: eff / 100, current_contr: currentControls, desired_contr_effe: desiredControls, expected_updated_at: risk.updated_at, comments: comment.trim() }, risk.risk_code);
  };
  const saveRoot = (event: FormEvent) => {
    event.preventDefault();
    if (!cause.trim() || !mitigations.trim() || !dueDate || !owner.trim()) {
      setFormError('Root cause, mitigations, due date and action owner must be provided.'); return;
    }
    setFormError('');
    onCause({ ...(rootId ? { root_id: Number(rootId) } : {}), root_cause: cause.trim(), current_contr: rootControls, mitigations: mitigations.trim(), due_date: dueDate, action_owner: owner.trim(), action_status: status, expected_updated_at: risk.updated_at }, risk.risk_code);
    setRootDirty(false);
  };
  return <section className="space-y-4">
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-[Space_Mono] text-[10px] text-muted-foreground">{risk.risk_code} · {risk.depart_name ?? risk.depart_code}</div><h3 className="mt-1 font-[Manrope] text-xl font-bold">{risk.risk_title}</h3></div><StatusPill status={risk.workflow_status} /></div>
      {risk.workflow_status.toLowerCase().includes('submit') && <p className="mt-4 rounded-lg bg-secondary/70 p-3 text-xs text-foreground">Mapped owners and management can correct assessments and mitigations while the register is submitted. Editability follows the server-provided can_edit permission.</p>}
      {risk.can_edit === false && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">This record is not editable in its current workflow state. Existing assessments and root causes remain visible.</p>}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Exposure label="Inherent exposure" value={Number.isFinite(inherent) && inherent > 0 ? inherent.toFixed(2) : text(risk.i_risk_exposure)} />
        <Exposure label="Control effectiveness" value={effectiveness ? `${effectiveness}%` : risk.perceived_contr_eff ? `${risk.perceived_contr_eff}%` : 'Enter value'} />
        <Exposure label="Residual exposure" value={Number.isFinite(residual) && inherent > 0 ? residual.toFixed(2) : text(risk.r_risk_exposure)} />
      </div>
    </div>
    <form onSubmit={saveAssessment} className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-[Manrope] text-lg font-bold">Assessment & controls</h3><p className="mb-4 mt-1 text-xs text-muted-foreground">Exposure is recalculated as impact × likelihood. Residual exposure applies the new control fraction to inherent exposure.</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Risk title"><input className={fieldClass} value={riskTitle} onChange={event => setRiskTitle(event.target.value)} maxLength={150} disabled={!allowed} required /></Field></div>
        <Field label="Department objective"><select className={fieldClass} value={objective} onChange={event => setObjective(event.target.value)} disabled={!allowed} required>
          <option value="">Choose objective</option>{objectives.filter(item => item.depart_code === risk.depart_code).map(item => <option key={item.obj_code} value={item.obj_code}>{item.obj_name}</option>)}
        </select></Field>
        <Field label="Risk category"><select className={fieldClass} value={category} onChange={event => setCategory(event.target.value)} disabled={!allowed} required>
          <option value="">Choose category</option>{categories.map(item => <option key={item.category_code} value={item.category_code}>{item.category_name}</option>)}
        </select></Field>
        <div className="sm:col-span-2"><Field label="Description"><textarea className={`${fieldClass} min-h-20`} value={description} onChange={event => setDescription(event.target.value)} disabled={!allowed} required /></Field></div>
        <div className="sm:col-span-2"><Field label="Consequence"><textarea className={`${fieldClass} min-h-20`} value={consequence} onChange={event => setConsequence(event.target.value)} disabled={!allowed} required /></Field></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Impact factor (0–100)"><input className={fieldClass} type="number" min="0.01" max="100" step="any" value={impact} onChange={event => setImpact(event.target.value)} disabled={!allowed} required /></Field>
        <Field label="Likelihood factor (0–100)"><input className={fieldClass} type="number" min="0.01" max="100" step="any" value={likelihood} onChange={event => setLikelihood(event.target.value)} disabled={!allowed} required /></Field>
        <Field label="Control effectiveness (%)" hint="Enter a percentage; it is converted to the stored 0–1 factor. Historical perceived rate is not used."><input className={fieldClass} type="number" min="0" max="100" step="any" value={effectiveness} onChange={event => setEffectiveness(event.target.value)} disabled={!allowed} required /></Field>
        <div className="sm:col-span-3"><Field label="Current controls"><textarea className={`${fieldClass} min-h-16`} value={currentControls} onChange={event => setCurrentControls(event.target.value)} disabled={!allowed} /></Field></div>
        <div className="sm:col-span-3"><Field label="Desired control effectiveness"><textarea className={`${fieldClass} min-h-16`} value={desiredControls} onChange={event => setDesiredControls(event.target.value)} disabled={!allowed} /></Field></div>
        <div className="sm:col-span-3"><Field label="Assessment comment (required)"><textarea className={`${fieldClass} min-h-16`} value={comment} onChange={event => setComment(event.target.value)} disabled={!allowed} required placeholder="Explain the basis for this assessment or what changed." /></Field></div>
      </div>
      {formError && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{formError}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Last updated {dateLabel(risk.updated_at)}</span><button className={buttonClass} disabled={!allowed || mutating} type="submit"><ClipboardCheck className="h-4 w-4" />Save assessment</button></div>
    </form>
    <form onSubmit={saveRoot} className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4"><h3 className="font-[Manrope] text-lg font-bold">Root cause & action plan</h3><p className="mt-1 text-xs text-muted-foreground">An assessed risk must have a recorded root cause before departmental submission.</p></div>
      {roots.length ? <div className="mb-4 space-y-2">{roots.map(root => <button key={root.root_id} type="button" onClick={() => { setRootId(String(root.root_id)); setCause(root.root_cause); setRootControls(root.current_contr ?? ''); setMitigations(root.mitigations ?? ''); setDueDate(root.due_date?.slice(0, 10) ?? ''); setOwner(root.action_owner ?? ''); setStatus(root.action_status as RiskCauseInput['action_status']); setRootDirty(true); }} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-xs hover:bg-muted"><span className="truncate pr-3">{root.root_cause}</span><StatusPill status={root.action_status} /></button>)}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Root cause"><textarea className={`${fieldClass} min-h-16`} value={cause} onChange={event => { setCause(event.target.value); setRootDirty(true); }} disabled={!allowed} required /></Field></div>
        <div className="sm:col-span-2"><Field label="Mitigations"><textarea className={`${fieldClass} min-h-16`} value={mitigations} onChange={event => { setMitigations(event.target.value); setRootDirty(true); }} disabled={!allowed} required /></Field></div>
        <Field label="Current controls"><input className={fieldClass} value={rootControls} onChange={event => { setRootControls(event.target.value); setRootDirty(true); }} disabled={!allowed} /></Field>
        <Field label="Due date"><input className={fieldClass} type="date" value={dueDate} onChange={event => { setDueDate(event.target.value); setRootDirty(true); }} disabled={!allowed} required /></Field>
        <Field label="Action owner (MIS username)"><select className={fieldClass} value={owner} onChange={event => { setOwner(event.target.value); setRootDirty(true); }} disabled={!allowed} required><option value="">Choose owner</option>{staff.map((person, index) => <option key={person.username ?? index} value={person.username ?? ''}>{person.employee_name ?? person.username} · {person.username}</option>)}</select></Field>
        <Field label="Action status"><select className={fieldClass} value={status} onChange={event => { setStatus(event.target.value as RiskCauseInput['action_status']); setRootDirty(true); }} disabled={!allowed}><option>Open</option><option>Behind schedule</option><option>Closed</option></select></Field>
      </div>
      {formError && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{formError}</p>}
      <div className="mt-4 flex justify-end"><button className={secondaryButton} disabled={!allowed || mutating} type="submit"><ClipboardList className="h-4 w-4" />Save root cause</button></div>
    </form>
  </section>;
}
