import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { Intermediary, IntermediaryInput } from '@workspace/api-client-react';

export type IntermediaryCatalog = {
  agent_types: string[];
  units: string[];
  branches: string[];
  regions: string[];
  gi_codes: string[];
};

export function intermediaryInputFrom(agent: Intermediary): IntermediaryInput {
  return {
    agent_code: agent.agent_code,
    agent_name: agent.agent_name,
    agent_type: agent.agent_type,
    version: agent.version,
    notes: '',
    receive_date: agent.receive_date ?? null,
    contract_date: agent.contract_date ?? null,
    user_id: agent.user_id ?? null,
    unit_code: agent.unit_code ?? null,
    branch_code: agent.branch_code ?? null,
    region_code: agent.region_code ?? null,
    email: agent.email ?? null,
    mobile_no: agent.mobile_no ?? null,
    secondary_mobile: agent.secondary_mobile ?? null,
    hrmis_code: agent.hrmis_code ?? null,
    pin_no: agent.pin_no ?? null,
    nid_no: agent.nid_no ?? null,
    rms_code_corp: agent.rms_code_corp ?? null,
    rms_code_ret: agent.rms_code_ret ?? null,
    gi_code: agent.gi_code ?? null,
    commission_rate: agent.commission_rate ?? null,
    pay_mode: agent.pay_mode ?? null,
    etims_verified: agent.etims_verified ?? false,
  };
}

export type FieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  list?: string;
  disabled?: boolean;
  hint?: string;
  testId?: string;
};

export function Field({ label, value, onChange, type = 'text', required, placeholder, list, disabled, hint, testId }: FieldProps) {
  return <label className="im-field">
    <span>{label}{required && <b className="im-required"> *</b>}</span>
    <input data-testid={testId} type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} list={list} disabled={disabled} />
    {hint && <small>{hint}</small>}
  </label>;
}

export function SelectField({ label, value, onChange, options, required, emptyLabel = 'Select an option' }: {
  label: string; value: string; onChange: (value: string) => void; options: string[]; required?: boolean; emptyLabel?: string;
}) {
  return <label className="im-field">
    <span>{label}{required && <b className="im-required"> *</b>}</span>
    <select value={value} required={required} onChange={e => onChange(e.target.value)}>
      <option value="">{emptyLabel}</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>;
}

export function NoteField({ value, onChange, label = 'Change note' }: { value: string; onChange: (value: string) => void; label?: string }) {
  return <label className="im-field im-note-field">
    <span>{label}<b className="im-required"> *</b></span>
    <textarea value={value} required minLength={1} maxLength={4000} onChange={e => onChange(e.target.value)} placeholder="Record why this change is being made. Notes are retained in the audit history." />
    <small>Required for audit · retained permanently</small>
  </label>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="im-toggle">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span className="im-toggle-track"><i /></span><span>{label}</span>
  </label>;
}

export function Button({ children, onClick, type = 'button', disabled, variant = 'solid', testId }: {
  children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; variant?: 'solid' | 'quiet' | 'danger'; testId?: string;
}) {
  return <button data-testid={testId} type={type} onClick={onClick} disabled={disabled} className={`im-button im-button-${variant}`}>{children}</button>;
}

export function StatusPill({ status }: { status: string | null | undefined }) {
  const value = status || 'UNSPECIFIED';
  const cls = /ACTIVE|VERIFIED|APPROVED/i.test(value) ? 'good' : /SUSPEND|TERMIN|DECLIN|EXPIRED/i.test(value) ? 'bad' : /SUBMIT|PENDING/i.test(value) ? 'warm' : 'neutral';
  return <span className={`im-status im-status-${cls}`}><i />{value.replaceAll('_', ' ')}</span>;
}

export function SkeletonRows() {
  return <div className="im-skeletons" aria-label="Loading agent data">{[0, 1, 2, 3].map(n => <div key={n} className="im-skeleton-row"><i /><span /><span /><b /></div>)}</div>;
}

export function ApiMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null;
  const err = error as { data?: { error?: string }; message?: string; status?: number };
  const denied = err.status === 403;
  return <div className="im-alert im-alert-error" role="alert">
    <AlertCircle size={18} />
    <div><strong>{denied ? 'Access not permitted' : 'Unable to complete request'}</strong><p>{err.data?.error || err.message || 'Please try again.'}</p></div>
    {onRetry && <button type="button" onClick={onRetry} className="im-retry"><RefreshCw size={14} /> Retry</button>}
  </div>;
}

export function SuccessMessage({ children }: { children: ReactNode }) {
  return <div className="im-alert im-alert-success" role="status"><CheckCircle2 size={18} /><div><strong>Saved</strong><p>{children}</p></div></div>;
}

export function MasterFields({ value, onChange, catalog, lockedCore = false }: {
  value: IntermediaryInput; onChange: (value: IntermediaryInput) => void; catalog?: IntermediaryCatalog; lockedCore?: boolean;
}) {
  const set = (key: keyof IntermediaryInput, raw: string) => {
    const nullable = ['receive_date', 'contract_date', 'user_id', 'unit_code', 'branch_code', 'region_code', 'email', 'mobile_no', 'secondary_mobile', 'hrmis_code', 'pin_no', 'nid_no', 'rms_code_corp', 'rms_code_ret', 'gi_code', 'pay_mode'];
    const next = nullable.includes(key) ? raw.trim() || null : raw;
    onChange({ ...value, [key]: next } as IntermediaryInput);
  };
  const optionsList = (id: string, entries?: string[]) => <datalist id={id}>{(entries ?? []).map(item => <option key={item} value={item} />)}</datalist>;
  return <>
    <div className="im-form-section"><div className="im-form-section-title"><span>01</span><div><b>Identity & classification</b><small>Core identity is imported; MIS classification remains editable</small></div></div>
      <div className="im-form-grid">
        <Field label="Agent code" value={value.agent_code} onChange={v => set('agent_code', v)} required disabled={lockedCore} placeholder="Immutable source code" />
        <Field label="Registered agent name" value={value.agent_name} onChange={v => set('agent_name', v)} required disabled={lockedCore} placeholder="Legal or trading name" />
        {catalog?.agent_types?.length ? <SelectField label="Agent type" value={value.agent_type} onChange={v => set('agent_type', v)} options={catalog.agent_types} required /> : <Field label="Agent type" value={value.agent_type} onChange={v => set('agent_type', v)} required placeholder="Enter agent type" />}
        <Field label="MIS / payroll user ID" value={value.user_id ?? ''} onChange={v => set('user_id', v)} disabled={lockedCore} placeholder="Imported from core system" />
        <Field label="Date received" type="date" value={value.receive_date ?? ''} onChange={v => set('receive_date', v)} required={lockedCore} />
        <Field label="Contract date" type="date" value={value.contract_date ?? ''} onChange={v => set('contract_date', v)} required={lockedCore} />
      </div>
    </div>
    <div className="im-form-section"><div className="im-form-section-title"><span>02</span><div><b>Contact & identifiers</b><small>Identity fields retained with the agent record</small></div></div>
      <div className="im-form-grid">
        <Field label="Email address" type="email" value={value.email ?? ''} onChange={v => set('email', v)} placeholder="name@company.co.ke" />
        <Field label="Primary mobile" value={value.mobile_no ?? ''} onChange={v => set('mobile_no', v)} placeholder="+254…" required={lockedCore} />
        <Field label="Secondary mobile" value={value.secondary_mobile ?? ''} onChange={v => set('secondary_mobile', v)} />
        <Field label="HRMIS code" value={value.hrmis_code ?? ''} onChange={v => set('hrmis_code', v)} />
        <Field label="KRA PIN" value={value.pin_no ?? ''} onChange={v => set('pin_no', v)} />
        <Field label="National ID" value={value.nid_no ?? ''} onChange={v => set('nid_no', v)} />
      </div>
    </div>
    <div className="im-form-section"><div className="im-form-section-title"><span>03</span><div><b>Organization & commission attributes</b><small>Codes remain editable; suggestions reflect supplied master values</small></div></div>
      <div className="im-form-grid">
        {optionsList('im-units', catalog?.units)}{optionsList('im-branches', catalog?.branches)}{optionsList('im-regions', catalog?.regions)}{optionsList('im-gi-codes', catalog?.gi_codes)}
        <Field label="Unit code" value={value.unit_code ?? ''} onChange={v => set('unit_code', v)} list="im-units" required={lockedCore} />
        <Field label="Branch code" value={value.branch_code ?? ''} onChange={v => set('branch_code', v)} list="im-branches" />
        <Field label="Region code" value={value.region_code ?? ''} onChange={v => set('region_code', v)} list="im-regions" required={lockedCore} />
        <Field label="GI code" value={value.gi_code ?? ''} onChange={v => set('gi_code', v)} list="im-gi-codes" />
        <Field label="RMS corporate code" value={value.rms_code_corp ?? ''} onChange={v => set('rms_code_corp', v)} />
        <Field label="RMS retail code" value={value.rms_code_ret ?? ''} onChange={v => set('rms_code_ret', v)} />
        <Field label="Commission rate (%)" type="number" value={value.commission_rate ?? ''} onChange={v => onChange({ ...value, commission_rate: v === '' ? null : Number(v) })} placeholder="Optional" />
        <Field label="Pay mode" value={value.pay_mode ?? ''} onChange={v => set('pay_mode', v)} placeholder="Enter pay mode" />
      </div>
      <div className="im-form-toggle"><Toggle label="eTIMS verified" checked={!!value.etims_verified} onChange={v => onChange({ ...value, etims_verified: v })} /></div>
    </div>
  </>;
}
