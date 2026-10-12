import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ClipboardCheck, ClipboardList, FilePlus2 } from 'lucide-react';
import type { RiskActionStatus, RiskControlEffectiveness, RiskImpactFactor, RiskLikelihoodFactor, RiskExposureBand, RiskAssessmentInput, RiskCauseInput, RiskLookup, RiskRecord, RiskRootCause, RiskOptionsResponseData } from '@workspace/api-client-react';
import { useCreateRisk } from './use-risk-register';
import RiskRootCauseTable from './risk-root-cause-table';
import { buttonClass, dateLabel, EmptyState, Exposure, Field, fieldClass, secondaryButton, SkeletonRows, StatusPill, text } from './risk-ui';

function CalibratedExposure({ label, value, riskType, bands }: { label: string; value: string; riskType: 'I' | 'R'; bands: RiskExposureBand[] }) {
  const score = Number.parseFloat(value);
  const rounded = Math.round(score * 100) / 100;
  const band = bands.find(item => item.risk_type === riskType && rounded >= item.minimum && rounded <= item.maximum);
  return <div className="min-w-0 rounded-lg bg-muted/30">
    <Exposure label={label} value={value} />
    {Number.isFinite(score) && <div className="break-words px-3 pb-3 text-xs">
      <p className="font-semibold">{band?.level ?? 'No configured band'}</p>
      {band && <p className="mt-1 text-[11px] text-muted-foreground">{band.description}</p>}
    </div>}
  </div>;
}

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
  const objectives = (options.objectives ?? []).filter(item => item.depart_code === depart);
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

export function AssessmentPanel({ risk, roots, staff, objectives, categories, actionStatuses, controlRatings, impactFactors, likelihoodFactors, exposureBands, loading, mutating, onSave, onCause }: {
  risk?: RiskRecord; roots: RiskRootCause[]; staff: RiskLookup[]; objectives: RiskLookup[]; categories: RiskLookup[];
  actionStatuses: RiskActionStatus[];
  controlRatings: RiskControlEffectiveness[];
  impactFactors: RiskImpactFactor[]; likelihoodFactors: RiskLikelihoodFactor[]; exposureBands: RiskExposureBand[];
  loading: boolean; mutating: boolean;
  onSave: (data: RiskAssessmentInput, code: string) => Promise<string | undefined> | void;
   onCause: (data: RiskCauseInput, code: string) => Promise<boolean>;
}) {
  const [riskTitle, setRiskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [consequence, setConsequence] = useState('');
  const [objective, setObjective] = useState('');
  const [category, setCategory] = useState('');
  const [impact, setImpact] = useState('');
  const [likelihood, setLikelihood] = useState('');
  const [effectiveness, setEffectiveness] = useState('');
  const [desiredControls, setDesiredControls] = useState('');
  const [comment, setComment] = useState('');
  const [cause, setCause] = useState('');
  const [mitigations, setMitigations] = useState('');
  const [rootControls, setRootControls] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<RiskCauseInput['action_status']>('');
  const [rootId, setRootId] = useState('');
  const [formError, setFormError] = useState('');
  const [assessmentError, setAssessmentError] = useState('');
  const [assessmentSaved, setAssessmentSaved] = useState(false);
  const [rootSaved, setRootSaved] = useState(false);
  const [rootDirty, setRootDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'causes' | 'exposures'>('details');
  const lastAssessmentRisk = useRef('');
  useEffect(() => {
    if (!risk || (rootDirty && lastAssessmentRisk.current === risk.risk_code)) return;
    lastAssessmentRisk.current = risk.risk_code;
    setImpact(risk.i_rate ?? ''); setLikelihood(risk.l_rate ?? '');
    const historicalPercent = risk.perceived_contr_eff == null ? Number.NaN : Number.parseFloat(risk.perceived_contr_eff);
    // This column stores a percentage, including valid values below 1%.
    // Do not infer fractional units from its magnitude.
    setEffectiveness(Number.isFinite(historicalPercent) ? String(historicalPercent) : '');
    setDesiredControls(risk.desired_contr_effe ?? '');
  }, [risk?.risk_code, risk?.updated_at]);
  useEffect(() => {
    setRiskTitle(risk?.risk_title ?? ''); setDescription(risk?.risk_description ?? '');
    setConsequence(risk?.risk_consequence ?? ''); setObjective(risk?.objective_code ?? '');
    setCategory(risk?.risk_category ?? '');
    setRootId(''); setCause(''); setRootControls(''); setMitigations(''); setDueDate(''); setOwner('');
    setStatus(''); setComment(''); setFormError(''); setAssessmentError(''); setAssessmentSaved(false); setRootSaved(false); setRootDirty(false); setActiveTab('details');
  }, [risk?.risk_code]);
  const inherent = Number(impact) * Number(likelihood);
  const residual = inherent * (1 - Number(effectiveness || 0) / 100);
  if (loading) return <section className="rounded-2xl border border-border bg-card p-5"><SkeletonRows /></section>;
  if (!risk) return <EmptyState title="Select a risk to continue" description="Choose a record from the list to complete its assessment, edit controls or add a root cause." />;
  const allowed = risk.can_edit === true;
  const selectedControl = effectiveness.trim() ? controlRatings.find(item => Math.abs(item.rating * 100 - Number(effectiveness)) < 1e-7) : undefined;
  const saveAssessment = async (event: FormEvent) => {
    event.preventDefault();
    if (!allowed || mutating) return;
    setAssessmentSaved(false);
    if (roots.length === 0) {
      setAssessmentError('');
      setFormError('Save at least one root cause and action plan before completing the risk exposure assessment.');
      setActiveTab('causes');
      return;
    }
    const i = Number(impact); const l = Number(likelihood); const eff = Number(effectiveness);
    if (!impact.trim() || !likelihood.trim() || !effectiveness.trim() || !(i > 0 && i <= 100 && l > 0 && l <= 100 && eff >= 0 && eff <= 100)) {
      setAssessmentError('Select valid impact, likelihood and perceived control effectiveness before saving.'); return;
    }
    if (!comment.trim()) {
      setAssessmentError('Enter an assessment comment before saving.'); return;
    }
    if (!objective || !category || !riskTitle.trim() || !description.trim() || !consequence.trim()) {
      setAssessmentError('Complete the risk title, objective, category, description and consequences in Risk Details before saving.');
      setActiveTab('details');
      return;
    }
    if (comment.trim().length > 4000) {
      setAssessmentError('Assessment comments must contain no more than 4,000 characters.'); return;
    }
    setAssessmentError('');
    const code = risk.risk_code;
    try {
      const error = await onSave({ depart_code: risk.depart_code, period_id: risk.period_id, objective_code: objective, risk_title: riskTitle.trim(), risk_description: description.trim(), risk_category: category, risk_consequence: consequence.trim(), i_rate: i, l_rate: l, control_effectiveness: eff / 100, current_contr: risk.current_contr ?? '', desired_contr_effe: desiredControls, expected_updated_at: risk.updated_at, comments: comment.trim() }, code);
      if (lastAssessmentRisk.current !== code) return;
      if (error) setAssessmentError(error);
      else setAssessmentSaved(true);
    } catch {
      if (lastAssessmentRisk.current === code) setAssessmentError('The assessment could not be saved. Your entries are retained; please try again.');
    }
  };
    const startNewRoot = () => {
     setRootId(''); setCause(''); setRootControls(''); setMitigations('');
      setDueDate(''); setOwner(''); setStatus(''); setFormError(''); setRootSaved(false); setRootDirty(false);
   };
   const saveRoot = async (event: FormEvent) => {
    event.preventDefault();
     if (!allowed || mutating) return;
    const retainedStatus = roots.find(root => String(root.root_id) === rootId)?.action_status;
    if (!actionStatuses.some(item => item.status === status) && (!rootId || retainedStatus !== status)) {
      setFormError('Select an approved action status.');
      return;
    }
    if (!cause.trim() || !mitigations.trim() || !dueDate || !owner.trim()) {
      setFormError('Root cause, mitigations, due date and action owner must be provided.'); return;
    }
      setFormError(''); setRootSaved(false);
     const code = risk.risk_code;
      try {
        const saved = await onCause({ ...(rootId ? { root_id: Number(rootId) } : {}), root_cause: cause.trim(), current_contr: rootControls, mitigations: mitigations.trim(), due_date: dueDate, action_owner: owner.trim(), action_status: status, expected_updated_at: risk.updated_at }, code);
        if (lastAssessmentRisk.current !== code) return;
        if (saved) {
          setRootSaved(true);
          startNewRoot();
          setRootSaved(true);
        } else setFormError('The root cause and action plan could not be saved. Your entries are retained; please try again.');
      } catch {
        if (lastAssessmentRisk.current === code) setFormError('The root cause and action plan could not be saved. Your entries are retained; please try again.');
      }
  };
  const selectTab = (tab: 'details' | 'causes' | 'exposures') => {
    if (tab === 'exposures' && allowed && roots.length === 0) return;
    setActiveTab(tab);
  };
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const tabs: Array<'details' | 'causes' | 'exposures'> = ['details', 'causes', 'exposures'];
    const current = tabs.indexOf(activeTab);
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    const target = tabs[next];
    if (target === 'exposures' && allowed && roots.length === 0) return;
    setActiveTab(target);
    window.requestAnimationFrame(() => document.getElementById(`risk-tab-${target}`)?.focus());
  };
  return <section className="min-w-0 space-y-4">
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-[Space_Mono] text-[10px] text-muted-foreground">{risk.risk_code} · {risk.depart_name ?? risk.depart_code}</div><h3 className="mt-1 font-[Manrope] text-xl font-bold">{risk.risk_title}</h3></div><StatusPill status={risk.workflow_status} /></div>
      {risk.workflow_status.toLowerCase().includes('submit') && <p className="mt-4 rounded-lg bg-secondary/70 p-3 text-xs text-foreground">Mapped owners and management can correct assessments and mitigations while the register is submitted. Editability follows the server-provided can_edit permission.</p>}
      {risk.can_edit === false && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">This record is not editable in its current workflow state. Existing assessments and root causes remain visible.</p>}
    </div>
     <div className="overflow-hidden rounded-2xl border border-border bg-card">
       <div role="tablist" aria-label="Risk assessment sections" className="flex flex-wrap border-b border-border px-3 pt-3 sm:px-5">
         <button id="risk-tab-details" type="button" role="tab" aria-controls="risk-panel-details" aria-selected={activeTab === 'details'} tabIndex={activeTab === 'details' ? 0 : -1} onClick={() => selectTab('details')} onKeyDown={handleTabKeyDown} className={`border-b-2 px-3 py-3 text-left text-sm font-semibold transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Risk Details</button>
         <button id="risk-tab-causes" type="button" role="tab" aria-controls="risk-panel-causes" aria-selected={activeTab === 'causes'} tabIndex={activeTab === 'causes' ? 0 : -1} onClick={() => selectTab('causes')} onKeyDown={handleTabKeyDown} className={`border-b-2 px-3 py-3 text-left text-sm font-semibold transition-colors ${activeTab === 'causes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Root causes &amp; action plans</button>
         <button id="risk-tab-exposures" type="button" role="tab" aria-controls="risk-panel-exposures" aria-selected={activeTab === 'exposures'} aria-disabled={allowed && roots.length === 0 ? 'true' : undefined} tabIndex={activeTab === 'exposures' ? 0 : -1} onClick={() => selectTab('exposures')} onKeyDown={handleTabKeyDown} className={`border-b-2 px-3 py-3 text-left text-sm font-semibold transition-colors ${activeTab === 'exposures' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'} ${allowed && roots.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}>Risk exposures</button>
       </div>
       <section id="risk-panel-details" role="tabpanel" aria-labelledby="risk-tab-details" hidden={activeTab !== 'details'} className="p-5" onChange={() => setAssessmentSaved(false)}>
         <h3 className="font-[Manrope] text-lg font-bold">Risk Details</h3>
         <p className="mb-4 mt-1 text-xs text-muted-foreground">Review the risk details, then complete root causes and the exposure assessment. Changes are saved together when you click Save Assessment.</p>
         <div className="grid gap-4 sm:grid-cols-2">
           <div className="sm:col-span-2"><Field label="Risk title"><input className={fieldClass} value={riskTitle} onChange={event => setRiskTitle(event.target.value)} maxLength={150} disabled={!allowed} required /></Field></div>
           <Field label="Department objective"><select className={fieldClass} value={objective} onChange={event => setObjective(event.target.value)} disabled={!allowed} required>
             <option value="">Choose objective</option>{objectives.filter(item => item.depart_code === risk.depart_code).map(item => <option key={item.obj_code} value={item.obj_code}>{item.obj_name}</option>)}
             {risk.objective_code && !objectives.some(item => item.depart_code === risk.depart_code && item.obj_code === risk.objective_code)
               && <option value={risk.objective_code}>{risk.objective_code} · historical choice (retained)</option>}
           </select></Field>
           <Field label="Risk category"><select className={fieldClass} value={category} onChange={event => setCategory(event.target.value)} disabled={!allowed} required>
             <option value="">Choose category</option>{categories.map(item => <option key={item.category_code} value={item.category_code}>{item.category_name}</option>)}
             {risk.risk_category && !categories.some(item => item.category_code === risk.risk_category)
               && <option value={risk.risk_category}>{risk.category_name ?? risk.risk_category} · historical choice (retained)</option>}
           </select></Field>
           <div className="sm:col-span-2"><Field label="Risk description"><textarea className={`${fieldClass} min-h-20`} value={description} onChange={event => setDescription(event.target.value)} disabled={!allowed} required /></Field></div>
           <div className="sm:col-span-2"><Field label="Consequences"><textarea className={`${fieldClass} min-h-20`} value={consequence} onChange={event => setConsequence(event.target.value)} disabled={!allowed} required /></Field></div>
         </div>
         {assessmentError && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{assessmentError}</p>}
         <div className="mt-4 flex justify-end"><button type="button" className={secondaryButton} onClick={() => selectTab('causes')}>Continue to Root causes &amp; action plans</button></div>
       </section>
       <section id="risk-panel-causes" role="tabpanel" aria-labelledby="risk-tab-causes" hidden={activeTab !== 'causes'} className="p-5">
        <form onSubmit={saveRoot} className="space-y-4">
         <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-[Manrope] text-lg font-bold">Root causes &amp; action plans</h3><p className="mt-1 text-xs text-muted-foreground">A risk can have multiple root causes, each with its own action plan. Select a saved cause to edit it, or add another.</p></div><button type="button" className={secondaryButton} onClick={startNewRoot} disabled={!allowed || mutating}>Add another root cause</button></div>
         <RiskRootCauseTable roots={roots} staff={staff} selectedRootId={rootId} mutating={mutating} onSelect={root => { setRootId(String(root.root_id)); setCause(root.root_cause); setRootControls(root.current_contr ?? ''); setMitigations(root.mitigations ?? ''); setDueDate(root.due_date?.slice(0, 10) ?? ''); setOwner(root.action_owner ?? ''); setStatus(root.action_status as RiskCauseInput['action_status']); setRootDirty(true); setFormError(''); setRootSaved(false); }} />
         <p className="mb-3 text-xs font-semibold">{rootId ? 'Editing selected root cause' : 'Adding a new root cause'}</p>
         <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Root cause"><textarea className={`${fieldClass} min-h-16`} value={cause} onChange={event => { setCause(event.target.value); setRootDirty(true); setRootSaved(false); }} disabled={!allowed} required /></Field></div>
          <div className="sm:col-span-2"><Field label="Mitigations"><textarea className={`${fieldClass} min-h-16`} value={mitigations} onChange={event => { setMitigations(event.target.value); setRootDirty(true); setRootSaved(false); }} disabled={!allowed} required /></Field></div>
          <div className="sm:col-span-2"><Field label="Current controls"><textarea className={`${fieldClass} min-h-16`} value={rootControls} onChange={event => { setRootControls(event.target.value); setRootDirty(true); setRootSaved(false); }} disabled={!allowed} /></Field></div>
          <Field label="Due date"><input className={fieldClass} type="date" value={dueDate} onChange={event => { setDueDate(event.target.value); setRootDirty(true); setRootSaved(false); }} disabled={!allowed} required /></Field>
          <Field label="Action owner (MIS username)"><select className={fieldClass} value={owner} onChange={event => { setOwner(event.target.value); setRootDirty(true); setRootSaved(false); }} disabled={!allowed} required><option value="">Choose owner</option>{owner && !staff.some(person => person.username === owner) && roots.some(root => String(root.root_id) === rootId && root.action_owner === owner) && <option value={owner}>{owner} (historical, retained)</option>}{staff.map((person, index) => <option key={person.username ?? index} value={person.username ?? ''}>{person.employee_name ?? person.username} · {person.username}</option>)}</select></Field>
          <Field label="Action status" hint={actionStatuses.find(item => item.status === status)?.description ?? (status && !actionStatuses.some(item => item.status === status) ? 'Historical status. Keep unchanged or choose an approved status.' : undefined)}>
            <select className={fieldClass} value={status} onChange={event => { setStatus(event.target.value); setRootDirty(true); setRootSaved(false); }} disabled={!allowed || actionStatuses.length === 0} required data-testid="select-risk-action-status">
              <option value="">Choose action status</option>
              {status && !actionStatuses.some(item => item.status === status) && roots.some(root => String(root.root_id) === rootId && root.action_status === status) && <option value={status}>{status} (legacy)</option>}
              {actionStatuses.map(item => <option key={item.code} value={item.status}>{item.code} · {item.status}</option>)}
            </select>
            {actionStatuses.length === 0 && <p role="alert" className="mt-1 text-xs text-destructive">Action statuses are unavailable. Refresh the page before saving.</p>}
          </Field>
         </div>
         {formError && <p role="alert" className="mt-3 text-xs font-medium text-destructive">{formError}</p>}
         {rootSaved && <p role="status" className="mt-3 rounded-lg bg-primary/10 p-3 text-xs text-primary">Root cause and action plan saved successfully. You can add another cause or continue to risk exposures.</p>}
         <div className="mt-4 flex flex-wrap justify-between gap-3">
           <button type="button" className={secondaryButton} disabled={roots.length === 0} onClick={() => selectTab('exposures')}>Continue to Risk exposures</button>
           <button className={secondaryButton} disabled={!allowed || mutating || actionStatuses.length === 0} type="submit"><ClipboardList className="h-4 w-4" />{rootId ? 'Update root cause' : 'Save new root cause'}</button>
         </div>
        </form>
       </section>
       <section id="risk-panel-exposures" role="tabpanel" aria-labelledby="risk-tab-exposures" hidden={activeTab !== 'exposures'} className="p-5">
        {allowed && roots.length === 0 && <p role="status" className="mb-4 rounded-lg bg-secondary/70 p-3 text-xs text-foreground">Save at least one root cause and action plan before completing the risk exposure assessment.</p>}
     <form onSubmit={saveAssessment} noValidate onChange={() => setAssessmentSaved(false)}>
      <h3 className="font-[Manrope] text-lg font-bold">Assessment & controls</h3><p className="mb-4 mt-1 text-xs text-muted-foreground">Exposure is recalculated as impact × likelihood. Residual exposure applies the new control fraction to inherent exposure.</p>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <fieldset className="min-w-0 space-y-4 rounded-xl border border-border p-4">
          <legend className="px-2 font-[Manrope] text-base font-bold">Inherent Risk Exposures</legend>
          <p className="text-xs text-muted-foreground">Risk exposure before controls. Choose the impact and likelihood.</p>
         <Field label="Impact factor">
           <select className={fieldClass} aria-label="Approved impact factor" value={impact.trim() ? impactFactors.find(item => item.factor === Number(impact))?.code ?? 'historical' : ''} onChange={event => { if (event.target.value !== 'historical') setImpact(String(impactFactors.find(item => item.code === event.target.value)?.factor ?? '')); }} disabled={!allowed} required>
             <option value="">Choose impact</option>{impactFactors.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
             {impact.trim() && !impactFactors.some(item => item.factor === Number(impact)) && <option value="historical">Historical impact (retained)</option>}
          </select>
        </Field>
         <Field label="Likelihood factor" hint={likelihoodFactors.find(item => item.factor === Number(likelihood))?.criteria ?? 'Choose an approved likelihood. Existing historical ratings are retained.'}>
           <select className={fieldClass} aria-label="Approved likelihood factor" value={likelihood.trim() ? likelihoodFactors.find(item => item.factor === Number(likelihood))?.code ?? 'historical' : ''} onChange={event => { if (event.target.value !== 'historical') setLikelihood(String(likelihoodFactors.find(item => item.code === event.target.value)?.factor ?? '')); }} disabled={!allowed} required>
             <option value="">Choose likelihood</option>{likelihoodFactors.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
             {likelihood.trim() && !likelihoodFactors.some(item => item.factor === Number(likelihood)) && <option value="historical">Historical likelihood (retained)</option>}
          </select>
        </Field>
          <CalibratedExposure label="Inherent exposure" value={impact && likelihood && Number.isFinite(inherent) && inherent > 0 ? inherent.toFixed(2) : text(risk.i_risk_exposure)} riskType="I" bands={exposureBands} />
        </fieldset>
        <fieldset className="min-w-0 space-y-4 rounded-xl border border-border p-4">
          <legend className="px-2 font-[Manrope] text-base font-bold">Residual Risk Exposures</legend>
          <p className="text-xs text-muted-foreground">Risk exposure after perceived controls. Desired control records the target rating.</p>
         <Field label="Perceived control effectiveness" hint={selectedControl?.qual_criteria ?? 'Choose an approved control rating. Existing historical ratings are retained.'}>
           <select className={fieldClass} value={selectedControl?.eff_factor ?? (effectiveness.trim() ? 'historical' : '')} onChange={event => {
             if (event.target.value === 'historical') return;
            const rating = controlRatings.find(item => item.eff_factor === event.target.value);
            if (rating) setEffectiveness(String(rating.rating * 100));
            else setEffectiveness('');
           }} disabled={!allowed} required aria-label="Approved control effectiveness rating" data-testid="select-control-effectiveness">
             <option value="">Choose rating</option>
             {controlRatings.map(item => <option key={item.eff_factor} value={item.eff_factor}>{item.eff_factor}</option>)}
             {effectiveness.trim() && !selectedControl && <option value="historical">Historical effectiveness (retained)</option>}
          </select>
        </Field>
          <Field label="Desired control effectiveness" hint={controlRatings.find(item => item.eff_factor === desiredControls)?.qual_criteria ?? 'Target control rating; this does not replace perceived control in the residual exposure calculation.'}>
            <select className={fieldClass} aria-label="Desired control effectiveness rating" value={desiredControls} onChange={event => setDesiredControls(event.target.value)} disabled={!allowed}>
              <option value="">Choose desired control</option>
              {controlRatings.map(item => <option key={item.eff_factor} value={item.eff_factor}>{item.eff_factor}</option>)}
              {desiredControls && !controlRatings.some(item => item.eff_factor === desiredControls) && <option value={desiredControls}>Historical desired control (retained)</option>}
            </select>
          </Field>
          <CalibratedExposure label="Residual exposure" value={impact && likelihood && effectiveness && Number.isFinite(residual) && inherent > 0 ? residual.toFixed(2) : text(risk.r_risk_exposure)} riskType="R" bands={exposureBands} />
        </fieldset>
      </div>
      <div className="mt-4 grid gap-4">
        <Field label="Assessment comment (required)"><textarea className={`${fieldClass} min-h-16`} value={comment} onChange={event => setComment(event.target.value)} maxLength={4000} disabled={!allowed} required placeholder="Explain the basis for this assessment or what changed." /></Field>
      </div>
      {assessmentError && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{assessmentError}</p>}
      {assessmentSaved && <p role="status" className="mt-4 rounded-lg bg-primary/10 p-3 text-xs text-primary">Assessment saved successfully.</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Last updated {dateLabel(risk.updated_at)}</span><button className={buttonClass} disabled={!allowed || mutating || roots.length === 0} type="submit"><ClipboardCheck className="h-4 w-4" />Save assessment</button></div>
    </form>
       </section>
     </div>
  </section>;
}
