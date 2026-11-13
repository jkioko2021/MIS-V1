import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useImportIntermediaries, useUpdateIntermediary, useActionIntermediary } from '@workspace/api-client-react';
import type { Intermediary, IntermediaryActionInput, IntermediaryDetail, IntermediaryInput, IntermediaryOptions } from '@workspace/api-client-react';
import { ArrowRight, ArrowLeft, Check, CloudDownload, FileCheck2, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import { Link } from 'wouter';
import { ApiMessage, Button, Field, MasterFields, NoteField, SkeletonRows, StatusPill, SuccessMessage, intermediaryInputFrom } from './form-components';

const EMPTY_FORM: IntermediaryInput = {
  agent_code: '', agent_name: '', agent_type: '', notes: '', receive_date: null, contract_date: null,
  user_id: null, unit_code: null, branch_code: null, region_code: null, email: null, mobile_no: null,
  secondary_mobile: null, hrmis_code: null, pin_no: null, nid_no: null, rms_code_corp: null,
  rms_code_ret: null, gi_code: null, commission_rate: null, pay_mode: null, etims_verified: false,
};

type PendingList = {
  data?: { items: Intermediary[]; total: number; page: number; page_size: number };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

export function AgentRegistration({
  code, username, options, detail, detailError, detailLoading, pendingList, pageNo, setPage, search, setSearch, onSelect, onInvalidate, onNavigate,
  onReload,
}: {
  code: string; username: string; options?: IntermediaryOptions; detail?: IntermediaryDetail; detailError: unknown; detailLoading: boolean;
  pendingList: PendingList; pageNo: number; setPage: (page: number | ((current: number) => number)) => void; search: string; setSearch: (value: string) => void;
  onSelect: (code: string) => void; onInvalidate: (code?: string) => Promise<void>; onNavigate: (path: string) => void;
  onReload: () => Promise<IntermediaryDetail | undefined>;
}) {
  const [form, setForm] = useState<IntermediaryInput>(EMPTY_FORM);
  const [saveNote, setSaveNote] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(false);
  const initializedKey = useRef('');
  const importMutation = useImportIntermediaries();
  const update = useUpdateIntermediary();
  const action = useActionIntermediary();
  const selectedAgent = detail?.agent;
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const key = selectedAgent ? `${username}:${selectedAgent.agent_code}` : '';
    if (selectedAgent && key && key !== initializedKey.current) {
      initializedKey.current = key;
      setForm(intermediaryInputFrom(selectedAgent));
      setSaveNote('');
      setCompletionNote('');
      setError(null);
      setNotice('');
    }
  }, [selectedAgent?.agent_code, username]);

  const requiredCompleteFields = Boolean(
    selectedAgent?.unit_code?.trim() && selectedAgent.region_code?.trim()
    && selectedAgent.receive_date && selectedAgent.contract_date && selectedAgent.mobile_no?.trim(),
  );
  const verifiedLicence = detail?.licences.some(licence => licence.status === 'VERIFIED' && licence.valid_from <= today && licence.valid_to >= today) ?? false;
  const hasDocument = (detail?.documents.length ?? 0) > 0;
  const readyToComplete = Boolean(selectedAgent && form.version && requiredCompleteFields && verifiedLicence && hasDocument && !isDirty(form, selectedAgent) && completionNote.trim());
  const isPending = importMutation.isPending || update.isPending || action.isPending;
  const importedCount = pendingList.data?.total ?? 0;

  const importAgents = () => {
    setError(null);
    setNotice('');
    setImportNotice('');
    importMutation.mutate(undefined, {
      onSuccess: async result => {
        setImportNotice(`${result.message} Imported ${result.imported}; skipped ${result.skipped}.`);
        await onInvalidate();
      },
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
    update.mutate({
      code: selectedAgent.agent_code,
      data: {
        ...form,
        agent_code: selectedAgent.agent_code,
        agent_name: selectedAgent.agent_name,
        user_id: selectedAgent.user_id ?? null,
        version: form.version,
        notes: saveNote.trim(),
      },
    }, {
      onSuccess: async result => {
        setForm(intermediaryInputFrom(result.agent));
        initializedKey.current = `${username}:${result.agent.agent_code}`;
        setSaveNote('');
        setNotice('MIS details saved. Review the readiness checklist before completing registration.');
        await onInvalidate(selectedAgent.agent_code);
      },
      onError: err => setError(err),
    });
  };

  const completeRegistration = () => {
    if (!selectedAgent || !readyToComplete) return;
    if (!form.version) { setError(new Error('The initialized version is missing. Reload this record before completing registration.')); return; }
    if (!confirmComplete) { setConfirmComplete(true); return; }
    setError(null);
    const data: IntermediaryActionInput = {
      action: 'COMPLETE_REGISTRATION',
      notes: completionNote.trim(),
      version: form.version,
    };
    action.mutate({ code: selectedAgent.agent_code, data }, {
      onSuccess: async () => {
        const completedCode = selectedAgent.agent_code;
        setCompletionNote('');
        setConfirmComplete(false);
        setNotice('Registration is complete. The agent has moved out of the pending queue.');
        await onInvalidate(completedCode);
        onNavigate(`/intermediary/details?code=${encodeURIComponent(completedCode)}`);
      },
      onError: err => { setConfirmComplete(false); setError(err); },
    });
  };

  const reloadCurrent = async () => {
    const current = await onReload();
    if (!current) return;
    setForm(intermediaryInputFrom(current.agent));
    initializedKey.current = `${username}:${current.agent.agent_code}`;
    setSaveNote('');
    setCompletionNote('');
    setConfirmComplete(false);
    setError(null);
    setNotice('Current server details reloaded. The previous unsaved draft was discarded.');
  };

  return <div className="im-registration">
    <section className="im-card im-import-card">
      <div className="im-card-head"><div><div className="im-section-index">01 / CORE SYSTEM INTAKE</div><h2>Import agents</h2><p>Pull source identities from the core system into the pending MIS registration queue. This does not create agent identities manually.</p></div><span className="im-card-symbol"><CloudDownload size={20} /></span></div>
      <div className="im-import-body">
        <div className="im-import-source"><span className="im-import-source-icon"><Users size={18} /></span><div><b>Core agent extract</b><small>Imported identities retain their source code, registered name and user ID.</small></div><span className={`im-import-state ${options?.import_available ? 'available' : 'unavailable'}`}><i />{options?.import_available ? 'SOURCE AVAILABLE' : options ? 'SOURCE UNAVAILABLE' : 'CHECKING SOURCE'}</span></div>
        {options && !options.import_available && <div className="im-alert im-alert-warn im-import-reason"><ShieldCheck size={16} /><span>{options.import_reason || 'Agent import is currently unavailable.'}</span></div>}
        {importNotice && <SuccessMessage>{importNotice}</SuccessMessage>}
        {!!error && <ApiMessage error={error} onRetry={() => { setError(null); void pendingList.refetch(); }} />}
        <div className="im-import-footer"><span>Import is repeatable. Existing completed and already-pending identities are not duplicated.</span><Button disabled={!options?.import_available || importMutation.isPending} onClick={importAgents} testId="button-import-agents">{importMutation.isPending ? 'Importing…' : <><CloudDownload size={15} /> Import agents</>}</Button></div>
      </div>
    </section>

    <section className="im-card im-pending-card">
      <div className="im-card-head im-list-head"><div><div className="im-section-index">02 / PENDING REGISTRATION</div><h2>Imported agents <span className="im-count">{pendingList.data?.total ?? '—'}</span></h2><p>Source-provided identities waiting for MIS fields and completion.</p></div><span className="im-pending-count"><UserRound size={15} /> {importedCount} pending</span></div>
      <div className="im-filters"><label className="im-search"><Search size={16} /><input aria-label="Search imported pending agents" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, source code or user ID…" /></label></div>
      {pendingList.isLoading ? <SkeletonRows /> : pendingList.isError ? <ApiMessage error={pendingList.error} onRetry={() => { void pendingList.refetch(); }} /> : (pendingList.data?.items.length ?? 0) === 0 ?
        <div className="im-empty"><div><Users size={21} /></div><h3>No pending agents</h3><p>Use Import agents to bring eligible identities from the core system. Completed legacy agents stay in the main register.</p></div> :
        <div className="im-pending-list">{pendingList.data?.items.map(item => <button key={item.agent_code} className={`im-pending-row ${item.agent_code === code ? 'selected' : ''}`} onClick={() => onSelect(item.agent_code)} data-testid={`button-pending-agent-${item.agent_code}`}>
          <span className="im-avatar">{item.agent_name.slice(0, 1).toUpperCase()}</span><span className="im-pending-identity"><b>{item.agent_name}</b><small>{item.agent_code} <i /> {item.user_id || 'No MIS user ID'}</small></span><StatusPill status={item.registration_status} /><ArrowRight size={16} />
        </button>)}</div>}
      <div className="im-pagination"><span>Showing <b>{pendingList.data?.items.length ? (pageNo - 1) * 25 + 1 : 0}–{Math.min(pageNo * 25, pendingList.data?.total ?? 0)}</b> of <b>{pendingList.data?.total ?? 0}</b></span><div><Button variant="quiet" disabled={pageNo <= 1 || pendingList.isFetching} onClick={() => setPage(page => Math.max(1, page - 1))}><ArrowLeft size={14} /> Previous</Button><span className="im-page-num">Page {pageNo}</span><Button variant="quiet" disabled={!pendingList.data || pageNo * 25 >= pendingList.data.total || pendingList.isFetching} onClick={() => setPage(page => page + 1)}>Next <ArrowRight size={14} /></Button></div></div>
    </section>

    {code && <section className="im-card im-registration-form">
      {detailLoading ? <SkeletonRows /> : detailError ? <ApiMessage error={detailError} /> : selectedAgent?.registration_status === 'COMPLETED' ?
        <div className="im-empty"><div><ShieldCheck size={21} /></div><h3>This agent is already registered</h3><p>Completed agents, including imported legacy records, are not returned to the pending registration queue. Use the existing change, licence or detail screens for authorized follow-up.</p><div className="im-registration-links"><Link href={`/intermediary/details?code=${encodeURIComponent(code)}`}>View details <ArrowRight size={14} /></Link><Link href={`/intermediary/changes?code=${encodeURIComponent(code)}`}>Change details <ArrowRight size={14} /></Link></div></div> :
      selectedAgent?.registration_status === 'PENDING' ? <>
        <div className="im-card-head"><div><div className="im-section-index">03 / COMPLETE MIS PROFILE</div><h2>Finish registration</h2><p>Core identity fields are locked. Complete the MIS profile, attach evidence and submit a completion note.</p></div><span className="im-card-symbol"><FileCheck2 size={20} /></span></div>
        <div className="im-registration-identity"><span className="im-avatar">{selectedAgent.agent_name.slice(0, 1).toUpperCase()}</span><div><small>IMPORTED CORE IDENTITY · {selectedAgent.source_ref || 'SOURCE REF NOT PROVIDED'}</small><b>{selectedAgent.agent_name}</b><span>{selectedAgent.agent_code} · User ID {selectedAgent.user_id || '—'}</span></div><StatusPill status={selectedAgent.registration_status} /></div>
        {notice && <SuccessMessage>{notice}</SuccessMessage>}
        {isConflict(error) && <ConflictReload onReload={reloadCurrent} />}
        <form onSubmit={saveDetails}>
          <MasterFields value={form} onChange={setForm} catalog={options} lockedCore />
          <NoteField value={saveNote} onChange={setSaveNote} label="MIS details change note" />
          <div className="im-form-footer"><span>Saving against source identity version {selectedAgent.version}</span><Button type="submit" disabled={isPending || !saveNote.trim()}>{update.isPending ? 'Saving…' : 'Save MIS details'} <Check size={15} /></Button></div>
        </form>
        <div className="im-registration-readiness">
          <div className="im-registration-readiness-head"><div><div className="im-section-index">REGISTRATION GATES</div><h3>Completion readiness</h3></div><span>{readyToComplete ? 'READY TO COMPLETE' : 'REQUIREMENTS REMAIN'}</span></div>
          <Requirement done={Boolean(selectedAgent.unit_code?.trim())} label="Unit code recorded" />
          <Requirement done={Boolean(selectedAgent.region_code?.trim())} label="Region code recorded" />
          <Requirement done={Boolean(selectedAgent.receive_date)} label="Date received recorded" />
          <Requirement done={Boolean(selectedAgent.contract_date)} label="Contract date recorded" />
          <Requirement done={Boolean(selectedAgent.mobile_no?.trim())} label="Primary mobile recorded" />
          <Requirement done={verifiedLicence} label="At least one date-valid VERIFIED licence" link={`/intermediary/licences?code=${encodeURIComponent(code)}`} />
          <Requirement done={hasDocument} label="At least one confirmed supporting document" link={`/intermediary/licences?code=${encodeURIComponent(code)}`} />
          {isDirty(form, selectedAgent) && <div className="im-alert im-alert-warn im-unsaved-warning">Save MIS details before completing registration. Unsaved edits do not count toward readiness.</div>}
          <NoteField value={completionNote} onChange={value => { setCompletionNote(value); setConfirmComplete(false); }} label="Registration completion note" />
          {confirmComplete && <div className="im-confirm"><div><b>Complete this registration?</b><p>The record will move from Pending to Completed and leave this queue.</p></div><div><Button variant="quiet" onClick={() => setConfirmComplete(false)}>Cancel</Button><Button disabled={!readyToComplete || isPending} onClick={completeRegistration}>Confirm completion</Button></div></div>}
          <div className="im-form-footer"><span>Complete registration is a separate, versioned action.</span><Button disabled={!readyToComplete || isPending} onClick={completeRegistration}>Complete registration <ArrowRight size={15} /></Button></div>
        </div>
        <div className="im-registration-links"><span>Continue profile support</span><Link href={`/intermediary/licences?code=${encodeURIComponent(code)}`}>Licence & documents <ArrowRight size={14} /></Link><Link href={`/intermediary/changes?code=${encodeURIComponent(code)}`}>Directors <ArrowRight size={14} /></Link></div>
      </> : <div className="im-empty"><div><Search size={21} /></div><h3>Pending identity not found</h3><p>It may have been completed or removed by another administrator. Refresh the pending queue.</p><Button variant="quiet" onClick={() => { void pendingList.refetch(); }}>Refresh queue</Button></div>}
    </section>}
  </div>;
}

function Requirement({ done, label, link }: { done: boolean; label: string; link?: string }) {
  const content = <><i className={done ? 'done' : ''}>{done ? <Check size={11} /> : null}</i><span>{label}</span>{link && <ArrowRight size={13} />}</>;
  return link ? <Link className={`im-requirement ${done ? 'complete' : ''}`} href={link}>{content}</Link> : <div className={`im-requirement ${done ? 'complete' : ''}`}>{content}</div>;
}

function isConflict(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 409);
}

function ConflictReload({ onReload }: { onReload: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const reload = async () => {
    if (!window.confirm('Reload the latest server record? Unsaved changes will be discarded.')) return;
    setLoading(true);
    try { await onReload(); } finally { setLoading(false); }
  };
  return <div className="im-alert im-alert-warn im-conflict-reload"><div><strong>Another administrator changed this record.</strong><p>Reload the current details before trying again. Your unsaved edits will be discarded only after confirmation.</p></div><Button variant="quiet" disabled={loading} onClick={reload}>{loading ? 'Reloading…' : 'Reload current details'}</Button></div>;
}

function isDirty(form: IntermediaryInput, agent: Intermediary) {
  const fields: (keyof IntermediaryInput)[] = [
    'agent_code', 'agent_name', 'agent_type', 'user_id', 'receive_date', 'contract_date', 'unit_code',
    'branch_code', 'region_code', 'email', 'mobile_no', 'secondary_mobile', 'hrmis_code', 'pin_no',
    'nid_no', 'rms_code_corp', 'rms_code_ret', 'gi_code', 'commission_rate', 'pay_mode', 'etims_verified',
  ];
  return fields.some(key => (form[key] ?? null) !== (agent[key] ?? null));
}
