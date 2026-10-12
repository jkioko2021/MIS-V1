import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListRiskAdministrationDepartmentsQueryKey,
  getListRiskAdministrationReferencesQueryKey,
  useCreateRiskAdministrationReference,
  useListRiskAdministrationDepartments,
  useListRiskAdministrationReferences,
  useUpdateRiskAdministrationReference,
} from '@workspace/api-client-react';
import type { RiskReference, RiskReferenceCatalog } from '@workspace/api-client-react';
import { AlertCircle, Archive, Check, Edit3, ListChecks, Plus, RefreshCw, RotateCcw, Search, X } from 'lucide-react';

const inputClass = 'w-full rounded-xl border border-[#c8d5d3] bg-[#fffefa] px-3.5 py-3 text-sm text-[#183735] outline-none transition focus:border-[#14766f] focus:ring-4 focus:ring-[#14766f]/10 read-only:bg-[#f2f6f3] read-only:text-[#5d7671] disabled:cursor-not-allowed disabled:opacity-60';
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#155e59] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#104c48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155e59] disabled:pointer-events-none disabled:opacity-45';
const secondaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#cad8d5] bg-[#fffefa] px-3.5 py-2 text-sm font-semibold text-[#28514e] transition hover:bg-[#eef4f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155e59] disabled:pointer-events-none disabled:opacity-50';

type Config = { title: string; singular: string; eyebrow: string; intro: string; codeMax: number; codePattern: RegExp; codeHint: string; labelMax: number; labelName: string; description: 'none' | 'optional' | 'required'; descriptionName: string; rating: boolean; department: boolean; labelIsCode: boolean; labelLockedOnEdit: boolean; kind?: 'impact' | 'likelihood' | 'reason' | 'exposure' };
export const referenceConfigs: Record<RiskReferenceCatalog, Config> = {
  'action-statuses': { title: 'Action statuses', singular: 'action status', eyebrow: 'Mitigation workflow', intro: 'Statuses available to mitigation actions. Historical actions store status names, so labels are fixed once created.', codeMax: 20, codePattern: /^[A-Za-z0-9_-]+$/, codeHint: 'Up to 20 letters, numbers, hyphens or underscores.', labelMax: 50, labelName: 'Status name', description: 'optional', descriptionName: 'Description', rating: false, department: false, labelIsCode: false, labelLockedOnEdit: true },
  categories: { title: 'Risk categories', singular: 'category', eyebrow: 'Classification', intro: 'Categories used to classify each risk on the register.', codeMax: 20, codePattern: /^[A-Za-z0-9_-]+$/, codeHint: 'Up to 20 letters, numbers, hyphens or underscores.', labelMax: 100, labelName: 'Category name', description: 'none', descriptionName: '', rating: false, department: false, labelIsCode: false, labelLockedOnEdit: false },
  'control-effectiveness': { title: 'Control effectiveness', singular: 'effectiveness factor', eyebrow: 'Residual scoring', intro: 'Qualitative factors and the fractional rating applied to inherent exposure.', codeMax: 50, codePattern: /^[A-Za-z0-9 _-]+$/, codeHint: 'Up to 50 characters; spaces allowed, e.g. Very Good. The factor name is its identity.', labelMax: 50, labelName: 'Factor', description: 'required', descriptionName: 'Qualitative criteria', rating: true, department: false, labelIsCode: true, labelLockedOnEdit: true },
  objectives: { title: 'Objectives', singular: 'objective', eyebrow: 'Departmental objectives', intro: 'Objectives risks are linked to. Identity is department plus code; the same code can exist in several departments.', codeMax: 20, codePattern: /^[A-Za-z0-9_-]+$/, codeHint: 'Up to 20 letters, numbers, hyphens or underscores.', labelMax: 300, labelName: 'Objective', description: 'none', descriptionName: '', rating: false, department: true, labelIsCode: false, labelLockedOnEdit: false },
  impact: { title: 'Impact factors', singular: 'impact factor', eyebrow: 'Inherent scoring', intro: 'Maintain impact labels and factors used by risk assessments. Existing saved assessments are never recalculated.', codeMax: 20, codePattern: /^[A-Za-z0-9_-]+$/, codeHint: 'Up to 20 letters, numbers, hyphens or underscores.', labelMax: 50, labelName: 'Impact label', description: 'none', descriptionName: '', rating: true, department: false, labelIsCode: false, labelLockedOnEdit: false, kind: 'impact' },
  likelihood: { title: 'Likelihood factors', singular: 'likelihood factor', eyebrow: 'Inherent scoring', intro: 'Maintain likelihood labels, fractional ratings and qualitative criteria for future assessments.', codeMax: 20, codePattern: /^[A-Za-z0-9_-]+$/, codeHint: 'Up to 20 letters, numbers, hyphens or underscores.', labelMax: 50, labelName: 'Likelihood label', description: 'required', descriptionName: 'Qualitative criteria', rating: true, department: false, labelIsCode: false, labelLockedOnEdit: false, kind: 'likelihood' },
  reasons: { title: 'Risk reasons', singular: 'reason', eyebrow: 'Client rating options', intro: 'Stable reason codes with editable labels. Updates refresh related AML, client-rating and business option lists.', codeMax: 3, codePattern: /^[A-Za-z0-9_-]+$/, codeHint: 'Up to 3 letters, numbers, hyphens or underscores.', labelMax: 100, labelName: 'Reason label', description: 'none', descriptionName: '', rating: false, department: false, labelIsCode: false, labelLockedOnEdit: false, kind: 'reason' },
  exposure: { title: 'Exposure bands', singular: 'exposure band', eyebrow: 'Exposure thresholds', intro: 'Define risk-type ranges and treatment language used for future scoring. Bands of the same type cannot overlap.', codeMax: 30, codePattern: /^[IR]:\d{1,3}\.\d{2}$/, codeHint: 'Generated from risk type and minimum, for example I:41.00.', labelMax: 20, labelName: 'Level', description: 'required', descriptionName: 'Treatment', rating: false, department: false, labelIsCode: false, labelLockedOnEdit: false, kind: 'exposure' },
};

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
}
function payloadError(response: unknown) {
  if (response === undefined || response === null) return '';
  if (typeof response !== 'object') return 'The server returned an empty response.';
  const item = response as { ok?: boolean; error?: unknown };
  if (item.ok !== true) return typeof item.error === 'string' ? item.error : 'The request was not accepted.';
  return '';
}
const rowKey = (row: RiskReference) => `${row.depart_code ?? ''}::${row.code}`;
const freshness = { staleTime: 20_000, refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export default function RiskReferences({ catalog, username }: { catalog: RiskReferenceCatalog; username: string }) {
  const config = referenceConfigs[catalog];
  const queryClient = useQueryClient();
  const listQuery = useListRiskAdministrationReferences(catalog, { query: { ...freshness, enabled: Boolean(username), queryKey: [...getListRiskAdministrationReferencesQueryKey(catalog), 'actor', username] } });
  const departmentQuery = useListRiskAdministrationDepartments({ query: { ...freshness, enabled: Boolean(username && config.department), queryKey: [...getListRiskAdministrationDepartmentsQueryKey(), username] } });
  const createRef = useCreateRiskAdministrationReference();
  const updateRef = useUpdateRiskAdministrationReference();

  const listError = listQuery.isError ? messageOf(listQuery.error, `Could not load ${config.title.toLowerCase()}.`) : payloadError(listQuery.data);
  const rows = !listError && listQuery.data?.ok === true ? listQuery.data.data : undefined;
  const departments = departmentQuery.data?.ok === true ? departmentQuery.data.data : [];
  const deptError = config.department ? (departmentQuery.isError ? messageOf(departmentQuery.error, 'Could not load departments.') : payloadError(departmentQuery.data)) : '';
  const deptName = (code: string | null) => departments.find(d => d.depart_code === code)?.depart_name;

  const [editing, setEditing] = useState<RiskReference | null>(null);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('');
  const [dept, setDept] = useState('');
  const [riskType, setRiskType] = useState<'I' | 'R'>('I');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [rateLabel, setRateLabel] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirming, setConfirming] = useState<RiskReference | null>(null);
  const [statusError, setStatusError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'retired'>('all');
  const [search, setSearch] = useState('');
  const saving = createRef.isPending || (updateRef.isPending && !confirming);

  const visible = useMemo(() => (rows ?? []).filter(row => (filter === 'all' || (filter === 'active' ? row.is_active : !row.is_active))
    && (!search.trim() || `${row.code} ${row.label} ${row.description ?? ''} ${row.depart_code ?? ''} ${row.risk_type ?? ''} ${row.minimum ?? ''} ${row.maximum ?? ''} ${row.rate_label ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))), [rows, filter, search]);
  const activeCount = (rows ?? []).filter(r => r.is_active).length;

  async function invalidate() {
    await queryClient.invalidateQueries({ predicate: query => query.queryKey.some(part => typeof part === 'string' && (
      part.startsWith('/api/risk-administration') || part.startsWith('/api/risk-register') || part === 'risk-register'
      || (catalog === 'reasons' && (
        part.startsWith('/api/aml') || part.startsWith('/api/client-ratings') || part.startsWith('/api/business')
        || part === 'aml-risk-reason-source' || part === 'business-status-options'
      ))
    )) });
  }
  function reset() { setEditing(null); setCode(''); setLabel(''); setDescription(''); setRating(''); setDept(''); setRiskType('I'); setMinimum(''); setMaximum(''); setRateLabel(''); setFormError(''); }
  function startEdit(row: RiskReference) {
    setEditing(row); setCode(row.code); setLabel(row.label); setDescription(row.description ?? ''); setRating(row.rating === null ? '' : String(row.rating)); setDept(row.depart_code ?? '');
    setRiskType(row.risk_type === 'R' ? 'R' : 'I'); setMinimum(row.minimum == null ? '' : Number(row.minimum).toFixed(2)); setMaximum(row.maximum == null ? '' : Number(row.maximum).toFixed(2)); setRateLabel(row.rate_label ?? '');
    setFormError(''); setSuccess(''); setConfirming(null);
    document.getElementById('reference-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function validate(): string {
    const c = config.kind === 'exposure' && !editing && minimum.trim() ? `${riskType}:${Number(minimum).toFixed(2)}` : (editing ? editing.code : code.trim());
    if (!editing && (!c || c.length > config.codeMax || !config.codePattern.test(c))) return `Code: ${config.codeHint}`;
    const l = config.labelIsCode ? c : label.trim();
    if (!l || l.length > config.labelMax) return `${config.labelName} must be 1-${config.labelMax} characters.`;
    if (config.description === 'required' && !description.trim()) return `${config.descriptionName} is required.`;
    if (description.length > 5000) return `${config.descriptionName} must be 5000 characters or fewer.`;
    if (config.rating) {
      if (config.kind === 'likelihood' && Number(rating) <= 0) return 'Likelihood rating must be greater than zero.';
      const pattern = config.kind === 'impact' ? /^\d{1,3}(\.\d{1,2})?$/ : /^(0?(\.\d{1,6})?|1(\.0{1,6})?)$/;
      const value = Number(rating.trim());
      if (!pattern.test(rating.trim()) || value <= 0 || value > (config.kind === 'impact' ? 100 : 1)) return config.kind === 'impact' ? 'Rating must be greater than 0 and no more than 100, with up to 2 decimal places.' : 'Rating must be greater than 0 and no more than 1, with up to 6 decimal places.';
    }
    if (config.kind === 'impact' && (!rateLabel.trim() || rateLabel.trim().length > 50)) return 'Rate label must be 1–50 characters.';
    if (config.kind === 'exposure') {
      const decimal = /^\d{1,3}(\.\d{1,2})?$/;
      if (!decimal.test(minimum.trim()) || !decimal.test(maximum.trim())) return 'Minimum and maximum must be numbers from 0 to 100 with up to 2 decimal places.';
      const min = Number(minimum), max = Number(maximum);
      if (min < 0 || max > 100 || max < min) return 'Maximum must be greater than or equal to minimum, and both must be from 0 to 100.';
    }
    if (config.department && !editing && !dept) return 'Select an active department.';
    return '';
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(''); setSuccess('');
    const problem = validate();
    if (problem) { setFormError(problem); return; }
    const desc = config.description === 'none' ? undefined : description.trim();
    const rate = config.rating ? Number(rating.trim()) : undefined;
    try {
      if (editing) {
        const response = await updateRef.mutateAsync({ catalog, code: editing.code, data: {
          label: config.labelIsCode ? editing.code : config.labelLockedOnEdit ? editing.label : label.trim(),
          is_active: editing.is_active,
          expected: editing,
          ...(desc !== undefined ? { description: desc } : {}),
          ...(rate !== undefined ? { rating: rate } : {}),
          ...(config.kind === 'impact' ? { rate_label: rateLabel.trim() } : {}),
          ...(config.kind === 'exposure' ? { risk_type: editing.risk_type ?? riskType, minimum: editing.minimum ?? Number(minimum), maximum: Number(maximum) } : {}),
          ...(config.department ? { depart_code: editing.depart_code ?? '' } : {}),
        } });
        const failure = payloadError(response); if (failure) throw new Error(failure);
        setSuccess(`${editing.code} was updated. Its code and status are unchanged.`);
      } else {
        const c = config.kind === 'exposure' ? `${riskType}:${Number(minimum).toFixed(2)}` : code.trim();
        const response = await createRef.mutateAsync({ catalog, data: {
          code: c, label: config.labelIsCode ? c : label.trim(),
          ...(desc ? { description: desc } : {}),
          ...(rate !== undefined ? { rating: rate } : {}),
          ...(config.kind === 'impact' ? { rate_label: rateLabel.trim() } : {}),
          ...(config.kind === 'exposure' ? { risk_type: riskType, minimum: Number(minimum), maximum: Number(maximum) } : {}),
          ...(config.department ? { depart_code: dept } : {}),
        } });
        const failure = payloadError(response); if (failure) throw new Error(failure);
        setSuccess(`${c} was added as an active ${config.singular}.`);
      }
      reset();
      await invalidate();
    } catch (error) {
      setFormError(messageOf(error, `The ${config.singular} could not be saved. Your entries are still here.`));
    }
  }
  async function changeStatus(row: RiskReference) {
    setStatusError('');
    try {
      const response = await updateRef.mutateAsync({ catalog, code: row.code, data: {
        label: row.label, is_active: !row.is_active, expected: row,
        ...(config.description !== 'none' ? { description: row.description } : {}),
        ...(config.rating && row.rating !== null ? { rating: row.rating } : {}),
         ...(config.kind === 'impact' ? { rate_label: row.rate_label ?? '' } : {}),
         ...(config.kind === 'exposure' ? { risk_type: row.risk_type ?? 'I', minimum: row.minimum ?? 0, maximum: row.maximum ?? 0 } : {}),
        ...(config.department ? { depart_code: row.depart_code ?? '' } : {}),
      } });
      const failure = payloadError(response); if (failure) throw new Error(failure);
      setSuccess(row.is_active ? `${row.code} was retired. Historical records that use it are unchanged.` : `${row.code} is active again and available for new entries.`);
      setConfirming(null);
      if (editing && rowKey(editing) === rowKey(row)) reset();
      await invalidate();
    } catch (error) {
      setStatusError(messageOf(error, 'The status change was not saved.'));
    }
  }

  const editingDeptRetired = editing?.depart_code && !departments.find(d => d.depart_code === editing.depart_code && d.is_active);

  return <section className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
    <form id="reference-form" onSubmit={submit} className="h-fit rounded-3xl border border-[#d8e3df] bg-[#fffefa] p-5 shadow-[0_10px_36px_-30px_rgba(16,66,60,.5)] sm:p-7 xl:sticky xl:top-6">
      <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dcebe6] text-[#155e59]"><ListChecks className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708a83]">{config.eyebrow}</p><h2 className="mt-1 font-[Manrope] text-xl font-extrabold">{editing ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2><p className="mt-1 text-xs leading-5 text-[#718780]">{editing ? 'Codes are permanent. Status is changed only from the list with Retire or Reactivate.' : config.intro}</p></div></div>
      <div className="mt-6 space-y-4">
         {config.kind === 'exposure' && <>
           <Field label="Risk type" hint={editing ? 'Risk type and minimum cannot be changed after creation.' : 'Choose inherent or residual. The stable code is generated from this and the minimum.'}>
             <select className={inputClass} value={riskType} disabled={Boolean(editing)} onChange={e => { setRiskType(e.target.value as 'I' | 'R'); setSuccess(''); }}><option value="I">Inherent (I)</option><option value="R">Residual (R)</option></select>
           </Field>
           <Field label="Minimum" hint={editing ? 'Immutable after creation.' : '0–100, up to 2 decimal places.'}><input className={inputClass} inputMode="decimal" value={minimum} readOnly={Boolean(editing)} disabled={Boolean(editing)} onChange={e => { setMinimum(e.target.value); setSuccess(''); }} required /></Field>
           {!editing && <div className="rounded-lg bg-[#eef4f1] px-3 py-2 font-mono text-xs text-[#45645c]">Generated code · {minimum && /^\d{1,3}(\.\d{1,2})?$/.test(minimum) ? `${riskType}:${Number(minimum).toFixed(2)}` : 'enter a minimum'}</div>}
           {editing && <Field label="Stable code"><input className={`${inputClass} font-mono`} readOnly disabled value={code} /></Field>}
           <Field label="Maximum" hint="Must be at least the minimum; active ranges cannot overlap within the same risk type."><input className={inputClass} inputMode="decimal" value={maximum} onChange={e => { setMaximum(e.target.value); setSuccess(''); }} required /></Field>
         </>}
         {config.department && <Field label="Department" hint={editing ? 'Department and code together identify this objective and cannot change.' : 'Only active departments can receive new objectives.'}>
          {editing ? <input data-testid="input-reference-department" className={inputClass} readOnly value={`${deptName(editing.depart_code) ?? editing.depart_code ?? ''} · ${editing.depart_code ?? ''}${editingDeptRetired ? ' (inactive)' : ''}`} />
            : <select data-testid="input-reference-department" className={inputClass} value={dept} onChange={e => { setDept(e.target.value); setSuccess(''); }} disabled={departmentQuery.isLoading} required>
              <option value="">{departmentQuery.isLoading ? 'Loading departments…' : 'Select a department'}</option>
              {departments.filter(d => d.is_active).map(d => <option key={d.depart_code} value={d.depart_code}>{d.depart_name} · {d.depart_code}</option>)}
            </select>}
          {deptError && <span className="mt-1.5 block text-[11px] font-normal text-[#854638]">{deptError} <button type="button" className="underline" onClick={() => departmentQuery.refetch()}>Retry</button></span>}
        </Field>}
         {config.kind !== 'exposure' && <Field label={config.labelIsCode ? 'Factor name (code)' : 'Code'} hint={editing ? 'Codes remain stable after creation.' : config.codeHint}>
          <input data-testid="input-reference-code" className={inputClass} value={code} maxLength={config.codeMax} readOnly={Boolean(editing)} disabled={Boolean(editing)} onChange={e => { setCode(e.target.value); setSuccess(''); }} required />
         </Field>}
        {!config.labelIsCode && <Field label={config.labelName} hint={editing && config.labelLockedOnEdit ? 'Locked: historical actions store this name, and Closed drives workflow.' : `Up to ${config.labelMax} characters.`}>
          {config.labelMax > 100 ? <textarea data-testid="input-reference-label" rows={3} className={inputClass} value={label} maxLength={config.labelMax} onChange={e => { setLabel(e.target.value); setSuccess(''); }} required />
            : <input data-testid="input-reference-label" className={inputClass} value={label} maxLength={config.labelMax} readOnly={Boolean(editing && config.labelLockedOnEdit)} onChange={e => { setLabel(e.target.value); setSuccess(''); }} required />}
        </Field>}
        {config.description !== 'none' && <Field label={`${config.descriptionName}${config.description === 'optional' ? ' (optional)' : ''}`} hint={`${description.length}/5000`}>
          <textarea data-testid="input-reference-description" rows={4} className={inputClass} value={description} maxLength={5000} onChange={e => { setDescription(e.target.value); setSuccess(''); }} required={config.description === 'required'} />
        </Field>}
         {config.rating && <Field label={config.kind === 'impact' ? 'Rating factor' : 'Rating'} hint={config.kind === 'impact' ? 'Greater than 0, up to 100 with 2 decimal places.' : 'Greater than 0 and up to 1, with 6 decimal places.'}>
           <input data-testid="input-reference-rating" inputMode="decimal" className={`${inputClass} font-mono`} value={rating} onChange={e => { setRating(e.target.value); setSuccess(''); }} placeholder={config.kind === 'impact' ? '0.00' : '0.000000'} required />
        </Field>}
         {config.kind === 'impact' && <Field label="Rate label" hint="Required; up to 50 characters."><input className={inputClass} maxLength={50} value={rateLabel} onChange={e => { setRateLabel(e.target.value); setSuccess(''); }} required /></Field>}
        {editing && <div className="rounded-xl bg-[#f2f7f4] px-3.5 py-3 text-xs text-[#526f69]">Current status: <strong>{editing.is_active ? 'Active' : 'Retired'}</strong>. Saving these details does not change status.</div>}
      </div>
      {formError && <Notice tone="error" message={formError} />}
      {success && <Notice tone="success" message={success} />}
      <div className="mt-5 flex flex-wrap gap-2">
        <button data-testid="button-save-reference" className={`${primaryButton} flex-1`} disabled={saving}>{saving ? 'Saving…' : editing ? <><Check className="h-4 w-4" />Save changes</> : <><Plus className="h-4 w-4" />Add {config.singular}</>}</button>
        {editing && <button type="button" data-testid="button-cancel-reference-edit" className={secondaryButton} onClick={reset}>Cancel</button>}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#718780]">Records are never deleted. Retired entries stay on historical risks and stop appearing for new entries.</p>
    </form>

    <section className="overflow-hidden rounded-3xl border border-[#d8e3df] bg-[#fffefa]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e1e9e5] px-5 py-5 sm:px-7">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#708a83]">Reference list</p><h2 className="mt-1 font-[Manrope] text-xl font-extrabold">{config.title}</h2>
          <p className="mt-1 text-xs text-[#718780]" data-testid="text-reference-counts">{rows ? `${activeCount} active · ${rows.length - activeCount} retired` : 'Active and retired records'}</p></div>
        <button data-testid="button-refresh-references" className={secondaryButton} onClick={() => listQuery.refetch()} disabled={listQuery.isFetching}><RefreshCw className={`h-4 w-4 ${listQuery.isFetching ? 'animate-spin' : ''}`} />Refresh</button>
      </div>
      {rows && rows.length > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-[#e9efeb] px-5 py-3 sm:px-7">
        <div className="flex rounded-xl bg-[#eef4f1] p-1">{(['all', 'active', 'retired'] as const).map(f => <button key={f} data-testid={`filter-reference-${f}`} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? 'bg-[#fffefa] text-[#155e59] shadow-sm' : 'text-[#5e7772]'}`}>{f}</button>)}</div>
        <label className="relative min-w-[12rem] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#83988f]" /><input data-testid="input-reference-search" className={`${inputClass} py-2 pl-9`} placeholder="Search code or label" value={search} onChange={e => setSearch(e.target.value)} /></label>
      </div>}
      {statusError && <div className="px-5 sm:px-7"><Notice tone="error" message={statusError} /></div>}
      {listQuery.isLoading ? <div className="space-y-3 p-5">{[0, 1, 2, 3].map(r => <div key={r} className="h-[72px] animate-pulse rounded-xl bg-[#edf3ef]" />)}</div>
        : listError ? <div className="p-5"><div role="alert" className="flex items-start gap-3 rounded-2xl border border-[#e7c6bc] bg-[#fbefeb] p-5 text-sm text-[#854638]"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><strong className="block">Reference list unavailable</strong><p className="mt-1 leading-5">{listError}</p></div><button className={secondaryButton} onClick={() => listQuery.refetch()}><RefreshCw className="h-4 w-4" />Retry</button></div></div>
          : !rows?.length ? <div className="p-5"><div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#cddbd5] bg-[#f7faf7] p-6 text-center"><div><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#e4eee9] text-[#55766d]"><ListChecks className="h-5 w-5" /></div><h3 className="mt-3 font-bold">No {config.title.toLowerCase()} yet</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[#718780]">Add the first {config.singular} with the form to make it available on the risk register.</p></div></div></div>
            : !visible.length ? <p className="p-8 text-center text-sm text-[#718780]">No records match this filter.</p>
              : <div className="divide-y divide-[#e6ece8]">{visible.map(row => {
                const key = rowKey(row);
                const isConfirming = confirming && rowKey(confirming) === key;
                const isEditing = editing && rowKey(editing) === key;
                return <article key={key} data-testid={`reference-row-${key}`} className={`px-5 py-4 sm:px-7 ${isEditing ? 'bg-[#f2f8f5]' : ''} ${row.is_active ? '' : 'bg-[#faf9f5]'}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded-md bg-[#eff4f1] px-2 py-1 font-mono text-[10px] text-[#4f6f68]">{row.code}</code>
                        {config.department && <span className="rounded-md bg-[#eef0e6] px-2 py-1 text-[10px] font-semibold text-[#5f6a4c]">{deptName(row.depart_code) ? `${deptName(row.depart_code)} · ` : ''}{row.depart_code ?? 'No department'}</span>}
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.is_active ? 'bg-[#e2efe8] text-[#34745f]' : 'bg-[#f0eee8] text-[#746b56]'}`}>{row.is_active ? 'Active' : 'Retired'}</span>
                        {config.rating && row.rating !== null && <span className="rounded-full bg-[#fbf1df] px-2.5 py-1 font-mono text-[10px] font-bold text-[#7a5a24]">x {row.rating}</span>}
                         {config.kind === 'impact' && row.rate_label && <span className="rounded-full bg-[#fbf1df] px-2.5 py-1 text-[10px] font-bold text-[#7a5a24]">{row.rate_label}</span>}
                         {config.kind === 'exposure' && <span className="rounded-full bg-[#fbf1df] px-2.5 py-1 font-mono text-[10px] font-bold text-[#7a5a24]">{row.risk_type ?? '—'} · {row.minimum?.toFixed(2) ?? '—'}–{row.maximum?.toFixed(2) ?? '—'}</span>}
                      </div>
                      {!config.labelIsCode && <strong className={`mt-2 block break-words text-sm ${row.is_active ? '' : 'text-[#6f7d77]'}`}>{row.label}</strong>}
                      {row.description && <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-5 text-[#6a807a]">{row.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button data-testid={`button-edit-reference-${key}`} className={secondaryButton} onClick={() => startEdit(row)}><Edit3 className="h-3.5 w-3.5" />Edit</button>
                      <button data-testid={`button-status-reference-${key}`} className={secondaryButton} onClick={() => { setConfirming(row); setStatusError(''); setSuccess(''); }}>{row.is_active ? <><Archive className="h-3.5 w-3.5" />Retire</> : <><RotateCcw className="h-3.5 w-3.5" />Reactivate</>}</button>
                    </div>
                  </div>
                  {isConfirming && <div role="alertdialog" aria-label="Confirm status change" className={`mt-3 rounded-xl border p-3.5 text-xs leading-5 ${row.is_active ? 'border-[#ead9bd] bg-[#fdf6ea] text-[#6e5328]' : 'border-[#cfe2d8] bg-[#eef6f1] text-[#35614c]'}`}>
                    <p>{row.is_active ? <><strong>Retire {row.code}?</strong> It will no longer be offered for new entries. Historical risks and actions that already use it stay exactly as recorded.</> : <><strong>Reactivate {row.code}?</strong> It will be offered again for new entries.</>}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button data-testid={`button-confirm-status-${key}`} className={primaryButton} disabled={updateRef.isPending} onClick={() => changeStatus(row)}>{updateRef.isPending ? 'Saving…' : row.is_active ? 'Confirm retirement' : 'Confirm reactivation'}</button>
                      <button data-testid={`button-cancel-status-${key}`} className={secondaryButton} onClick={() => setConfirming(null)}><X className="h-3.5 w-3.5" />Keep as is</button>
                    </div>
                  </div>}
                </article>;
              })}</div>}
    </section>
  </section>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block space-y-1.5 text-xs font-bold text-[#365a54]"><span>{label}</span>{children}{hint && <span className="block text-[11px] font-normal leading-4 text-[#789088]">{hint}</span>}</label>;
}
function Notice({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs leading-5 ${tone === 'error' ? 'bg-[#fbefeb] text-[#854638]' : 'bg-[#e9f4ec] text-[#3b694e]'}`}>
    {tone === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{message}
  </div>;
}
