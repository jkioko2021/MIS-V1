import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useImportIntermediaries, useUpdateIntermediary, useActionIntermediary } from '@workspace/api-client-react';
import type { Intermediary, IntermediaryActionInput, IntermediaryDetail, IntermediaryInput, IntermediaryOptions } from '@workspace/api-client-react';
import { ArrowRight, ArrowLeft, Check, CloudDownload, FileCheck2, Search, ShieldCheck, UserRound, Users, LockKeyhole } from 'lucide-react';
import { Link } from 'wouter';
import { ApiMessage, Button, Field, NoteField, SelectField, SkeletonRows, StatusPill, SuccessMessage, intermediaryInputFrom } from './form-components';
import { EmptyRegistrationSupport, RegistrationSupport } from './registration-support';

const EMPTY_FORM: IntermediaryInput = {
  agent_code: '', agent_name: '', agent_type: '', notes: '', receive_date: null, contract_date: null,
  user_id: null, unit_code: null, branch_code: null, region_code: null, email: null, mobile_no: null,
  secondary_mobile: null, hrmis_code: null, pin_no: null, nid_no: null, rms_code_corp: null,
  rms_code_ret: null, gi_code: null, commission_rate: null, pay_mode: null, etims_verified: false,
};

type PendingList = {
  data?: { items: Intermediary[]; total: number; page: number; page_size: number };
  isLoading: boolean; isFetching: boolean; isError: boolean; error: unknown; refetch: () => Promise<unknown>;
};

export function AgentRegistration({
  code, username, options, detail, detailError, detailLoading, pendingList, pageNo, setPage, search, setSearch,
  searchBy, setSearchBy, onSelect, onInvalidate, onNavigate, onReload,
}: {
  code: string; username: string; options?: IntermediaryOptions; detail?: IntermediaryDetail; detailError: unknown; detailLoading: boolean;
  pendingList: PendingList; pageNo: number; setPage: (page: number | ((current: number) => number)) => void; search: string; setSearch: (value: string) => void;
  searchBy: 'all' | 'name' | 'agent_code' | 'payroll'; setSearchBy: (value: 'all' | 'name' | 'agent_code' | 'payroll') => void;
  onSelect: (code: string) => void; onInvalidate: (code?: string) => Promise<void>; onNavigate: (path: string) => void;
  onReload: () => Promise<IntermediaryDetail | undefined>;
}) {
  const [form, setForm] = useState<IntermediaryInput>(EMPTY_FORM);
  const [saveNote, setSaveNote] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const initializedKey = useRef('');
  const importMutation = useImportIntermediaries();
  const update = useUpdateIntermediary();
  const action = useActionIntermediary();
  const selectedAgent = detail?.agent;
  const baseline = useRef<IntermediaryInput | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const key = selectedAgent ? `${username}:${selectedAgent.agent_code}` : '';
    if (selectedAgent && key && key !== initializedKey.current) {
      initializedKey.current = key;
      setForm(intermediaryInputFrom(selectedAgent));
      baseline.current = intermediaryInputFrom(selectedAgent);
      setSaveNote(''); setCompletionNote(''); setError(null); setNotice(''); setIsComplete(false);
    }
  }, [selectedAgent?.agent_code, username]);
  useEffect(() => {
    if (!code) {
      initializedKey.current = '';
      setForm(EMPTY_FORM); setSaveNote(''); setCompletionNote(''); setIsComplete(false);
    }
  }, [code]);

  const profileComplete = Boolean(selectedAgent && selectedAgent.agent_type.trim() && selectedAgent.unit_code?.trim()
    && selectedAgent.region_code?.trim() && selectedAgent.receive_date && selectedAgent.contract_date
    && selectedAgent.mobile_no?.trim());
  const verifiedLicence = detail?.licences.some(licence => licence.status === 'VERIFIED' && licence.valid_from <= today && licence.valid_to >= today) ?? false;
  const hasDocument = (detail?.documents.length ?? 0) > 0;
  const readyToComplete = Boolean(selectedAgent && form.version && profileComplete && verifiedLicence && hasDocument
    && !isDirty(form, selectedAgent) && completionNote.trim());
  const isPending = importMutation.isPending || update.isPending || action.isPending;
  const importedCount = pendingList.data?.total ?? 0;

  const importAgents = () => {
    setError(null); setNotice(''); setImportNotice('');
    importMutation.mutate(undefined, {
      onSuccess: async result => { setImportNotice(`${result.message} Imported ${result.imported}; skipped ${result.skipped}.`); await onInvalidate(); },
      onError: err => setError(err),
    });
  };
  const saveDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAgent || !saveNote.trim() || !form.version) {
      setError(new Error(!form.version ? 'The initialized version is missing. Reload this record before saving.' : 'A change note is required to save MIS details.'));
      return;
    }
    setError(null);
    update.mutate({ code: selectedAgent.agent_code, data: {
      ...form, agent_code: selectedAgent.agent_code, agent_name: selectedAgent.agent_name,
      user_id: selectedAgent.user_id ?? null, version: form.version, notes: saveNote.trim(),
    } }, {
      onSuccess: async result => {
        baseline.current = intermediaryInputFrom(result.agent);
        setForm(current => ({ ...intermediaryInputFrom(result.agent), version: result.agent.version }));
        initializedKey.current = `${username}:${result.agent.agent_code}`;
        setSaveNote(''); setNotice('MIS details saved. Review the readiness checklist before completion.');
        await onInvalidate(selectedAgent.agent_code);
      },
      onError: err => setError(err),
    });
  };
  const completeRegistration = () => {
    if (!selectedAgent || !readyToComplete) return;
    if (!isComplete) { setError(new Error('Confirm the Is Complete checkbox after reviewing every completion gate.')); return; }
    if (!form.version) { setError(new Error('The initialized version is missing. Reload this record before completing registration.')); return; }
    setError(null);
    const data: IntermediaryActionInput = { action: 'COMPLETE_REGISTRATION', notes: completionNote.trim(), version: form.version };
    action.mutate({ code: selectedAgent.agent_code, data }, {
      onSuccess: async () => {
        const completedCode = selectedAgent.agent_code;
        setCompletionNote(''); setIsComplete(false);
        setNotice('Registration is complete. The agent has moved out of the pending queue.');
        await onInvalidate(completedCode);
        onNavigate(`/intermediary/details?code=${encodeURIComponent(completedCode)}`);
      },
      onError: err => setError(err),
    });
  };
  const reloadCurrent = async () => {
    const current = await onReload();
    if (!current) return;
    baseline.current = intermediaryInputFrom(current.agent);
    setForm(intermediaryInputFrom(current.agent)); initializedKey.current = `${username}:${current.agent.agent_code}`;
    setSaveNote(''); setCompletionNote(''); setIsComplete(false); setError(null);
    setNotice('Current server details reloaded. The previous unsaved draft was discarded.');
  };
  const supportActionSuccess = (result: IntermediaryDetail) => {
    // Upload confirmation does not lock the initialized profile version. Never
    // rebase a dirty form over another administrator's saved profile changes.
    const savedProfile = intermediaryInputFrom(result.agent);
    const changed = !baseline.current || Object.keys(savedProfile).some(key => {
      if (['version', 'notes'].includes(key)) return false;
      const field = key as keyof IntermediaryInput;
      return (savedProfile[field] ?? null) !== (baseline.current![field] ?? null);
    });
    if (changed) {
      setError({ status: 409, message: 'The supporting record was saved, but the MIS profile changed in another session. Your draft is retained. Reload before saving the profile.' });
    } else {
      baseline.current = savedProfile;
      setForm(current => ({ ...current, version: result.agent.version }));
    }
    void onInvalidate(result.agent.agent_code);
  };

  return <div className="im-registration">
    <section className="im-card im-import-card">
      <div className="im-card-head"><div><div className="im-section-index">01 / CORE SYSTEM INTAKE</div><h2>Import agents</h2><p>Pull source identities from the core system into the pending MIS queue. Identity creation remains in the core system.</p></div><span className="im-card-symbol"><CloudDownload size={20} /></span></div>
      <div className="im-import-body">
        <div className="im-import-source"><span className="im-import-source-icon"><Users size={18} /></span><div><b>Core agent extract</b><small>Imported identities retain their source reference, agent code and registered name.</small></div><span className={`im-import-state ${options?.import_available ? 'available' : 'unavailable'}`}><i />{options?.import_available ? 'SOURCE AVAILABLE' : options ? 'SOURCE UNAVAILABLE' : 'CHECKING SOURCE'}</span></div>
        {options && !options.import_available && <div className="im-alert im-alert-warn im-import-reason"><ShieldCheck size={16} /><span>{options.import_reason || 'Agent import is currently unavailable.'}</span></div>}
        {importNotice && <SuccessMessage>{importNotice}</SuccessMessage>}
        {!!error && <ApiMessage error={error} onRetry={() => { setError(null); void pendingList.refetch(); }} />}
        <div className="im-import-footer"><span>Import is repeatable. Existing completed and pending identities are not duplicated.</span><Button disabled={!options?.import_available || importMutation.isPending} onClick={importAgents} testId="button-import-agents">{importMutation.isPending ? 'Importing…' : <><CloudDownload size={15} /> Import agents</>}</Button></div>
      </div>
    </section>

    <section className="im-card im-pending-card">
      <div className="im-card-head im-list-head"><div><div className="im-section-index">02 / PENDING REGISTRATION</div><h2>Imported agents <span className="im-count">{pendingList.data?.total ?? '—'}</span></h2><p>Imported core identities awaiting accountable MIS records.</p></div><span className="im-pending-count"><UserRound size={15} /> {importedCount} pending</span></div>
      <div className="im-filters im-registration-filters">
        <label className="im-search"><Search size={16} /><input aria-label="Search imported pending agents" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search imported agents…" /></label>
        <select aria-label="Search by" value={searchBy} onChange={event => { setSearchBy(event.target.value as typeof searchBy); setPage(1); }}><option value="all">Search by: All</option><option value="name">Name</option><option value="agent_code">Agent Code</option><option value="payroll">Payroll No</option></select>
      </div>
      {pendingList.isLoading ? <SkeletonRows /> : pendingList.isError ? <ApiMessage error={pendingList.error} onRetry={() => { void pendingList.refetch(); }} /> : (pendingList.data?.items.length ?? 0) === 0 ?
        <div className="im-empty"><div><Users size={21} /></div><h3>No pending agents</h3><p>Import core-registered identities, then select one here to complete its MIS record. The full registration form remains below.</p></div> :
        <div className="im-pending-list">{pendingList.data?.items.map(item => <button key={item.agent_code} className={`im-pending-row ${item.agent_code === code ? 'selected' : ''}`} onClick={() => onSelect(item.agent_code)} data-testid={`button-pending-agent-${item.agent_code}`}>
          <span className="im-avatar">{item.agent_name.slice(0, 1).toUpperCase()}</span><span className="im-pending-identity"><b>{item.agent_name}</b><small>{item.agent_code} <i /> {item.user_id || 'No MIS user ID'}</small></span><StatusPill status={item.registration_status} /><ArrowRight size={16} />
        </button>)}</div>}
      <div className="im-pagination"><span>Showing <b>{pendingList.data?.items.length ? (pageNo - 1) * 25 + 1 : 0}–{Math.min(pageNo * 25, pendingList.data?.total ?? 0)}</b> of <b>{pendingList.data?.total ?? 0}</b></span><div><Button variant="quiet" disabled={pageNo <= 1 || pendingList.isFetching} onClick={() => setPage(page => Math.max(1, page - 1))}><ArrowLeft size={14} /> Previous</Button><span className="im-page-num">Page {pageNo}</span><Button variant="quiet" disabled={!pendingList.data || pageNo * 25 >= pendingList.data.total || pendingList.isFetching} onClick={() => setPage(page => page + 1)}>Next <ArrowRight size={14} /></Button></div></div>
    </section>

    <section className="im-card im-registration-form">
      {detailLoading && code ? <SkeletonRows /> : detailError && code ? <ApiMessage error={detailError} /> : selectedAgent?.registration_status === 'COMPLETED' ?
        <div className="im-registration-readonly">
          <div className="im-card-head"><div><div className="im-section-index">03 / REGISTERED RECORD</div><h2>Completed agent · read only</h2><p>Completed records are protected here. Use the authorized changes workflow for profile updates.</p></div><span className="im-card-symbol"><LockKeyhole size={20} /></span></div>
          <div className="im-registration-identity"><span className="im-avatar">{selectedAgent.agent_name.slice(0, 1).toUpperCase()}</span><div><small>APP NUMBER · {selectedAgent.source_ref || '—'}</small><b>{selectedAgent.agent_name}</b><span>{selectedAgent.agent_code} · User ID {selectedAgent.user_id || '—'}</span></div><StatusPill status={selectedAgent.registration_status} /></div>
          <RegistrationProfileFields value={intermediaryInputFrom(selectedAgent)} onChange={() => undefined} sourceRef={selectedAgent.source_ref || ''} disabled agentTypes={options?.agent_types} codeCatalog={options} />
          <RegistrationSupport key={selectedAgent.agent_code} code={selectedAgent.agent_code} detail={detail!} version={selectedAgent.version} readOnly onActionSuccess={supportActionSuccess} onInvalidate={onInvalidate} onReload={reloadCurrent} />
          <div className="im-registration-links"><Link href={`/intermediary/details?code=${encodeURIComponent(code)}`}>View agent record <ArrowRight size={14} /></Link><Link href={`/intermediary/changes?code=${encodeURIComponent(code)}`}>Authorized detail changes <ArrowRight size={14} /></Link></div>
        </div> :
      selectedAgent?.registration_status === 'PENDING' ? <>
        <div className="im-card-head"><div><div className="im-section-index">03 / ACCOUNTABLE MIS RECORD</div><h2>Complete registration record</h2><p>Every legacy registration section is available on this page. Core identity values cannot be edited.</p></div><span className="im-card-symbol"><FileCheck2 size={20} /></span></div>
        <div className="im-registration-identity"><span className="im-avatar">{selectedAgent.agent_name.slice(0, 1).toUpperCase()}</span><div><small>APP NUMBER · {selectedAgent.source_ref || 'SOURCE REF NOT PROVIDED'}</small><b>{selectedAgent.agent_name}</b><span>{selectedAgent.agent_code} · User ID {selectedAgent.user_id || '—'}</span></div><StatusPill status={selectedAgent.registration_status} /></div>
        {notice && <SuccessMessage>{notice}</SuccessMessage>}
        {isConflict(error) && <ConflictReload onReload={reloadCurrent} />}
        <form onSubmit={saveDetails}>
          <RegistrationProfileFields value={form} onChange={setForm} sourceRef={selectedAgent.source_ref || ''} agentTypes={options?.agent_types} codeCatalog={options} />
          <NoteField value={saveNote} onChange={setSaveNote} label="MIS profile change note" />
          <div className="im-form-footer"><span>Saving against initialized version {form.version ?? selectedAgent.version}</span><Button type="submit" disabled={isPending || !saveNote.trim()}>{update.isPending ? 'Saving…' : 'Save MIS profile'} <Check size={15} /></Button></div>
        </form>
        <RegistrationSupport key={selectedAgent.agent_code} code={selectedAgent.agent_code} detail={detail!} version={form.version ?? selectedAgent.version} onActionSuccess={supportActionSuccess} onInvalidate={onInvalidate} onReload={reloadCurrent} />
        <div className="im-registration-readiness">
          <div className="im-registration-readiness-head"><div><div className="im-section-index">REGISTRATION GATES</div><h3>Completion readiness</h3></div><span>{readyToComplete ? 'READY TO COMPLETE' : 'REQUIREMENTS REMAIN'}</span></div>
          <Requirement done={Boolean(form.version && !isDirty(form, selectedAgent))} label="MIS profile is saved at the current version" />
          <Requirement done={Boolean(selectedAgent.agent_type.trim())} label="Agent type recorded" />
          <Requirement done={Boolean(selectedAgent.unit_code?.trim())} label="Sales manager / unit code recorded" />
          <Requirement done={Boolean(selectedAgent.region_code?.trim())} label="Region code recorded" />
          <Requirement done={Boolean(selectedAgent.receive_date)} label="Receive date recorded" />
          <Requirement done={Boolean(selectedAgent.contract_date)} label="Contract date recorded" />
          <Requirement done={Boolean(selectedAgent.mobile_no?.trim())} label="Primary mobile recorded" />
          <Requirement done={verifiedLicence} label="Date-valid VERIFIED licence" />
          <Requirement done={hasDocument} label="At least one confirmed supporting document" />
          {isDirty(form, selectedAgent) && <div className="im-alert im-alert-warn im-unsaved-warning">Save the MIS profile before completing registration. Unsaved edits do not count toward readiness.</div>}
          <NoteField value={completionNote} onChange={value => { setCompletionNote(value); setIsComplete(false); }} label="Registration completion note" />
          <Requirement done={Boolean(completionNote.trim())} label="Completion note entered" />
          <label className="im-complete-check"><input type="checkbox" checked={isComplete} onChange={event => setIsComplete(event.target.checked)} /><span><b>Is Complete</b><small>Confirm the record has been reviewed and all completion gates are satisfied.</small></span></label>
          <div className="im-form-footer"><span>Completion is a separate, versioned action; waiver never marks compliance verified.</span><Button disabled={!readyToComplete || !isComplete || isPending} onClick={completeRegistration}>Complete registration <ArrowRight size={15} /></Button></div>
        </div>
      </> : <div className="im-empty"><div><Search size={21} /></div><h3>{code ? 'Pending identity not found' : 'Select an imported agent'}</h3><p>{code ? 'This record may have been completed or changed by another administrator. Refresh the pending queue.' : 'Import a core-registered agent, then select it from the pending queue. The full legacy registration form is available below but disabled until selection.'}</p>{code && <Button variant="quiet" onClick={() => { void pendingList.refetch(); }}>Refresh queue</Button>}</div>}
      {!selectedAgent && !detailLoading && <RegistrationProfileFields value={EMPTY_FORM} onChange={() => undefined} sourceRef="" disabled />}
      {!selectedAgent && !detailLoading && <EmptyRegistrationSupport />}
    </section>
  </div>;
}

function RegistrationProfileFields({ value, onChange, sourceRef, disabled = false, agentTypes = [], codeCatalog }: {
  value: IntermediaryInput; onChange: (value: IntermediaryInput) => void; sourceRef: string; disabled?: boolean;
  agentTypes?: string[]; codeCatalog?: IntermediaryOptions;
}) {
  const set = (key: keyof IntermediaryInput, raw: string) => {
    const nullable: (keyof IntermediaryInput)[] = ['receive_date','contract_date','unit_code','region_code','gi_code','pin_no','nid_no','hrmis_code','mobile_no','secondary_mobile','email','pay_mode'];
    onChange({ ...value, [key]: nullable.includes(key) ? raw || null : raw } as IntermediaryInput);
  };
  const setNumber = (raw: string) => onChange({ ...value, commission_rate: raw === '' ? null : Number(raw) });
  return <div className={`im-registration-fields ${disabled ? 'disabled' : ''}`} aria-disabled={disabled}>
    {disabled && <div className="im-readonly-banner">Read-only record · core identity remains immutable</div>}
    <datalist id="registration-regions">{(codeCatalog?.regions ?? []).map(code => <option key={code} value={code} />)}</datalist>
    <datalist id="registration-units">{(codeCatalog?.units ?? []).map(code => <option key={code} value={code} />)}</datalist>
    <datalist id="registration-gi-codes">{(codeCatalog?.gi_codes ?? []).map(code => <option key={code} value={code} />)}</datalist>
    <div className="im-form-section"><div className="im-form-section-title"><span>01</span><div><b>Personal Details</b><small>Source registration and organization assignment</small></div></div>
      <div className="im-form-grid">
        <Field label="App Number" value={sourceRef} onChange={() => undefined} disabled hint="Source reference · read only" />
        <Field label="Receive Date" type="date" value={value.receive_date ?? ''} onChange={v => set('receive_date', v)} disabled={disabled} />
        <Field label="Agent No" value={value.agent_code} onChange={() => undefined} disabled hint="Core agent code · immutable" />
        <Field label="Intermediary Name" value={value.agent_name} onChange={() => undefined} disabled hint="Core registered name · immutable" />
        {agentTypes.length ? <SelectField label="Agent Type" value={value.agent_type} onChange={v => set('agent_type', v)} options={agentTypes} required disabled={disabled} /> : <Field label="Agent Type" value={value.agent_type} onChange={v => set('agent_type', v)} disabled={disabled} required hint="Approved agent-type catalog is not currently loaded" />}
        <Field label="Region Name" value={value.region_code ?? ''} onChange={v => set('region_code', v)} list="registration-regions" disabled={disabled} required hint="Region code (region_code); names are not loaded" placeholder="Enter region code" />
        <Field label="Sales Manager" value={value.unit_code ?? ''} onChange={v => set('unit_code', v)} list="registration-units" disabled={disabled} required hint="Sales manager / unit code (unit_code); names are not loaded" placeholder="Enter manager code" />
        <Field label="GI Manager" value={value.gi_code ?? ''} onChange={v => set('gi_code', v)} list="registration-gi-codes" disabled={disabled} hint="GI manager code (gi_code); names are not loaded" placeholder="Enter GI manager code" />
        <Field label="PIN" value={value.pin_no ?? ''} onChange={v => set('pin_no', v)} disabled={disabled} />
        <Field label="ID / Reg No" value={value.nid_no ?? ''} onChange={v => set('nid_no', v)} disabled={disabled} />
        <Field label="Contract Date" type="date" value={value.contract_date ?? ''} onChange={v => set('contract_date', v)} disabled={disabled} />
        <Field label="Payroll No" value={value.hrmis_code ?? ''} onChange={v => set('hrmis_code', v)} disabled={disabled} hint="HRMIS payroll code" />
      </div>
    </div>
    <div className="im-form-section"><div className="im-form-section-title"><span>02</span><div><b>Contact Details</b><small>Primary and secondary contact channels</small></div></div>
      <div className="im-form-grid">
        <Field label="Pri Mobile No" value={value.mobile_no ?? ''} onChange={v => set('mobile_no', v)} disabled={disabled} required />
        <Field label="Sec Mobile No" value={value.secondary_mobile ?? ''} onChange={v => set('secondary_mobile', v)} disabled={disabled} />
        <Field label="Email" type="email" value={value.email ?? ''} onChange={v => set('email', v)} disabled={disabled} />
      </div>
    </div>
    <div className="im-form-section"><div className="im-form-section-title"><span>03</span><div><b>Commission Details</b><small>Legacy stored pay-frequency codes are preserved</small></div></div>
      <div className="im-form-grid">
        <Field label="Commission Rate (%)" type="number" value={value.commission_rate ?? ''} onChange={setNumber} disabled={disabled} min="0" max="100" step="0.01" />
        <label className="im-field"><span>Pay Frequency</span><select disabled={disabled} value={value.pay_mode ?? ''} onChange={event => set('pay_mode', event.target.value)}><option value="">Select frequency</option><option value="1">Daily · 1</option><option value="7">Weekly · 7</option><option value="14">Bi-Weekly · 14</option><option value="30">Monthly · 30</option></select><small>Stored legacy codes: Daily=1, Weekly=7, Bi-Weekly=14, Monthly=30</small></label>
      </div>
      <div className="im-form-toggle"><label className="im-toggle"><input type="checkbox" checked={Boolean(value.etims_verified)} disabled={disabled} onChange={event => onChange({ ...value, etims_verified: event.target.checked })} /><span className="im-toggle-track"><i /></span><span>eTIMS Integrated</span></label></div>
    </div>
  </div>;
}

function Requirement({ done, label }: { done: boolean; label: string }) {
  return <div className={`im-requirement ${done ? 'complete' : ''}`}><i className={done ? 'done' : ''}>{done ? <Check size={11} /> : null}</i><span>{label}</span></div>;
}
function isConflict(error: unknown) { return Boolean(error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 409); }
function ConflictReload({ onReload }: { onReload: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const reload = async () => {
    if (!window.confirm('Reload the latest server record? Unsaved changes will be discarded.')) return;
    setLoading(true); try { await onReload(); } finally { setLoading(false); }
  };
  return <div className="im-alert im-alert-warn im-conflict-reload"><div><strong>Another administrator changed this record.</strong><p>Your drafts are retained. Reload only when you are ready to discard them and start from the current server version.</p></div><Button variant="quiet" disabled={loading} onClick={reload}>{loading ? 'Reloading…' : 'Reload current details'}</Button></div>;
}
function isDirty(form: IntermediaryInput, agent: Intermediary) {
  const fields: (keyof IntermediaryInput)[] = ['agent_type','receive_date','contract_date','unit_code','region_code','gi_code','email','mobile_no','secondary_mobile','hrmis_code','pin_no','nid_no','commission_rate','pay_mode','etims_verified'];
  return fields.some(key => (form[key] ?? null) !== (agent[key] ?? null));
}
