import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useSearch } from 'wouter';
import {
  getGetIntermediaryOptionsQueryKey,
  getGetIntermediaryQueryKey,
  getListIntermediariesQueryKey,
  useActionIntermediary,
  useConfirmIntermediaryUpload,
  useGetIntermediary,
  useGetIntermediaryOptions,
  useListIntermediaries,
  useRequestIntermediaryUpload,
  useUpdateIntermediary,
} from '@workspace/api-client-react';
import type {
  Intermediary,
  IntermediaryActionInput,
  IntermediaryDetail,
  IntermediaryInput,
} from '@workspace/api-client-react';
import {
  AlertCircle, ArrowDownToLine, ArrowLeft, ArrowRight, BadgeCheck, Building2,
  Check, ChevronDown, CircleDashed, Clock3, FileCheck2, FilePlus2,
  FileText, Fingerprint, Link2, LoaderCircle, LockKeyhole, Plus,
  RefreshCw, Search, ShieldAlert, ShieldCheck, UserRound, Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiMessage, Button, Field, MasterFields, NoteField, SkeletonRows, StatusPill, SuccessMessage, Toggle, intermediaryInputFrom } from './form-components';
import { AgentRegistration } from './agent-registration';
import './intermediary.css';

const PAGES = [
  { path: '/intermediary/registration', label: 'Agent Registration', index: '01' },
  { path: '/intermediary/agents', label: 'Agent Listing', index: '02' },
  { path: '/intermediary/details', label: 'Agent Details', index: '03' },
  { path: '/intermediary/changes', label: 'Agent Details Change', index: '04' },
  { path: '/intermediary/licences', label: 'Licence Update', index: '05' },
  { path: '/intermediary/verification', label: 'Licence Verification', index: '06' },
  { path: '/intermediary/suspension', label: 'Agent Suspension', index: '07' },
  { path: '/intermediary/mapping', label: 'Agent Mapping', index: '08' },
];

function useIntermediaryData(code: string, username: string) {
  const options = useGetIntermediaryOptions({
    query: { queryKey: [...getGetIntermediaryOptionsQueryKey(), username], staleTime: 45_000, refetchOnMount: true },
  });
  const detail = useGetIntermediary(code, {
    query: { enabled: !!code, queryKey: [...getGetIntermediaryQueryKey(code), username], staleTime: 15_000, refetchOnMount: true },
  });
  return { options, detail };
}

const emptyAgent = (): IntermediaryInput => ({
  agent_code: '', agent_name: '', agent_type: '', notes: '', receive_date: null, contract_date: null,
  user_id: null, unit_code: null, branch_code: null, region_code: null, email: null, mobile_no: null,
  secondary_mobile: null, hrmis_code: null, pin_no: null, nid_no: null, rms_code_corp: null,
  rms_code_ret: null, gi_code: null, commission_rate: null, pay_mode: null, etims_verified: false,
});

function toNull(value: string) { return value.trim() || null; }

export default function IntermediaryPage() {
  const { user } = useAuth();
  const username = user?.username ?? '';
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const page = PAGES.find(item => item.path === location.split('?')[0]) ?? PAGES[1];
  const params = new URLSearchParams(searchString);
  const routeCode = params.get('code') ?? '';
  const [search, setSearch] = useState('');
  const [registrationSearchBy, setRegistrationSearchBy] = useState<'all' | 'name' | 'agent_code' | 'payroll'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [agentCode, setAgentCode] = useState(routeCode);
  const [master, setMaster] = useState<IntermediaryInput>(emptyAgent());
  const [note, setNote] = useState('');
  const [auditNote, setAuditNote] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [licence, setLicence] = useState({ licence_id: '', licence_no: '', valid_from: '', valid_to: '', ira_compliant: false, kyc_compliant: false, contract_signed: false });
  const [director, setDirector] = useState({ director_id: '', director_version: '', name: '', email: '', mobile_no: '', pin_no: '', nid_no: '' });
  const [targetCode, setTargetCode] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busyUpload, setBusyUpload] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const currentIdentity = useRef(username);
  const activePage = useRef(page.path);
  const initializedAgent = useRef('');

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { setAgentCode(routeCode); setError(null); setNotice(''); }, [routeCode, username]);
  useEffect(() => {
    if (currentIdentity.current !== username) {
      currentIdentity.current = username;
      initializedAgent.current = '';
      setMaster(emptyAgent()); setNote(''); setLicence({ licence_id: '', licence_no: '', valid_from: '', valid_to: '', ira_compliant: false, kyc_compliant: false, contract_signed: false });
      setDirector({ director_id: '', director_version: '', name: '', email: '', mobile_no: '', pin_no: '', nid_no: '' });
      setTargetCode(''); setTargetSearch(''); setDocTitle(''); setFile(null); setError(null); setNotice('');
      setAuditNote('');
    }
  }, [username]);
  useEffect(() => {
    if (activePage.current !== page.path) {
      activePage.current = page.path;
      setNote(''); setError(null); setNotice(''); setConfirmAction('');
      setAuditNote('');
      setPageNo(1);
      setLicence({ licence_id: '', licence_no: '', valid_from: '', valid_to: '', ira_compliant: false, kyc_compliant: false, contract_signed: false });
      setDirector({ director_id: '', director_version: '', name: '', email: '', mobile_no: '', pin_no: '', nid_no: '' });
      setTargetCode(''); setTargetSearch(''); setDocTitle(''); setFile(null);
      if (page.path === '/intermediary/registration') setMaster(emptyAgent());
    }
  }, [page.path]);

  const listParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    search_by: page.path === '/intermediary/registration' ? registrationSearchBy : undefined,
    status: statusFilter || undefined,
    agent_type: typeFilter || undefined,
    registration_status: page.path === '/intermediary/registration' ? 'PENDING' as const : undefined,
    page: pageNo,
  }), [debouncedSearch, statusFilter, typeFilter, pageNo, page.path, registrationSearchBy]);
  const list = useListIntermediaries(listParams, {
    query: { queryKey: [...getListIntermediariesQueryKey(listParams), username], staleTime: 15_000, refetchOnMount: true, retry: false },
  });
  const { options, detail } = useIntermediaryData(agentCode, username);
  const update = useUpdateIntermediary();
  const action = useActionIntermediary();
  const requestUpload = useRequestIntermediaryUpload();
  const confirmUpload = useConfirmIntermediaryUpload();
  const agent = detail.data?.agent;
  const isPending = update.isPending || action.isPending || confirmUpload.isPending || busyUpload;
  const catalog = options.data;

  useEffect(() => {
    const formIdentity = agent && page.path === '/intermediary/changes' ? `${username}:${page.path}:${agent.agent_code}` : '';
    if (formIdentity && initializedAgent.current !== formIdentity) {
      initializedAgent.current = formIdentity;
      setMaster(intermediaryInputFrom(agent!));
      setNote('');
      setDirector({ director_id: '', director_version: '', name: '', email: '', mobile_no: '', pin_no: '', nid_no: '' });
    }
  }, [agent?.agent_code, page.path, username]);

  const invalidate = async (code?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListIntermediariesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetIntermediaryOptionsQueryKey() }),
      code ? queryClient.invalidateQueries({ queryKey: getGetIntermediaryQueryKey(code) }) : Promise.resolve(),
    ]);
  };
  const afterSuccess = async (message: string, code = agentCode) => {
    setNotice(message); setError(null); setNote(''); setAuditNote(''); setConfirmAction('');
    if (page.path === '/intermediary/licences') setLicence({ licence_id: '', licence_no: '', valid_from: '', valid_to: '', ira_compliant: false, kyc_compliant: false, contract_signed: false });
    if (page.path === '/intermediary/changes') setDirector({ director_id: '', director_version: '', name: '', email: '', mobile_no: '', pin_no: '', nid_no: '' });
    if (page.path === '/intermediary/mapping') setTargetCode('');
    await invalidate(code || undefined);
    if (code) setAgentCode(code);
    if (page.path === '/intermediary/registration') setMaster(emptyAgent());
  };
  const mutateAction = (payload: Omit<IntermediaryActionInput, 'version' | 'notes'> & { notes?: string }, success: string, overrideCode = agentCode, overrideAgent?: Intermediary) => {
    const actionAgent = overrideAgent ?? (agent?.agent_code === overrideCode ? agent : undefined);
    if (!actionAgent || !overrideCode) { setError(new Error('Load the agent record again before making a change.')); return; }
    const notes = (payload.notes ?? note).trim();
    if (!notes) { setError(new Error('A change note is required for every action.')); return; }
    const request = { ...payload, notes, version: actionAgent.version } as IntermediaryActionInput;
    action.mutate({ code: overrideCode, data: request }, {
      onSuccess: async () => { await afterSuccess(success, overrideCode); },
      onError: err => setError(err),
    });
  };
  const saveMaster = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(null); setNotice('');
    if (!master.notes.trim()) { setError(new Error('A change note is required.')); return; }
    if (agent) {
      if (!master.version) { setError(new Error('The initialized agent version is missing. Reload this record before saving.')); return; }
      const { notes: changeNotes, ...fields } = master;
      update.mutate({ code: agent.agent_code, data: { ...fields, agent_code: agent.agent_code, version: master.version, notes: changeNotes.trim() } }, {
        onSuccess: async result => { setMaster(intermediaryInputFrom(result.agent)); initializedAgent.current = `${username}:${page.path}:${result.agent.agent_code}`; await afterSuccess('Agent details and identity changes have been recorded.'); },
        onError: err => setError(err),
      });
    }
  };
  const reloadAllCurrent = async () => {
    if (!agentCode) return;
    const latest = await detail.refetch();
    if (latest.isError || !latest.data) return;
    setMaster(intermediaryInputFrom(latest.data.agent));
    initializedAgent.current = `${username}:${page.path}:${latest.data.agent.agent_code}`;
    setDirector({ director_id: '', director_version: '', name: '', email: '', mobile_no: '', pin_no: '', nid_no: '' });
    setLicence({ licence_id: '', licence_no: '', valid_from: '', valid_to: '', ira_compliant: false, kyc_compliant: false, contract_signed: false });
    setNote(''); setAuditNote(''); setTargetCode(''); setTargetSearch(''); setDocTitle(''); setFile(null);
    setError(null);
    setNotice('Current server details loaded. The previous unsaved draft was discarded.');
  };
  const chooseAgent = (code: string) => {
    setAgentCode(code.trim()); setError(null); setNotice('');
    if (code.trim()) setLocation(`${page.path}?code=${encodeURIComponent(code.trim())}`);
  };
  const agentTypeOptions = catalog?.agent_types ?? [];
  const listItems = list.data?.items ?? [];
  const eligibleTargets = useListIntermediaries({ search: targetSearch.trim() || undefined, page: 1 }, {
    query: { queryKey: [...getListIntermediariesQueryKey({ search: targetSearch.trim() || undefined, page: 1 }), username, 'mapping-targets'], staleTime: 15_000, enabled: page.path === '/intermediary/mapping' && targetSearch.trim().length > 0, retry: false },
  });

  const title = page.label;
  const subtitle: Record<string, string> = {
    '/intermediary/registration': 'Import core identities, complete required MIS fields and track registration readiness.',
    '/intermediary/agents': 'Search the agent register and inspect each retained record.',
    '/intermediary/details': 'Read-only identity, compliance and audit record.',
    '/intermediary/changes': 'Correct master details or maintain accountable directors.',
    '/intermediary/licences': 'Maintain licence evidence and route it for independent review.',
    '/intermediary/verification': 'Review submitted licences against current compliance evidence.',
    '/intermediary/suspension': 'Record deliberate status changes with reason and history.',
    '/intermediary/mapping': 'Maintain agent relationships without changing historical business.',
  };

  return <div className="im-shell">
    <header className="im-topline">
      <div className="im-breadcrumb"><span>SALES OPERATIONS</span><span className="im-slash">/</span><span>INTERMEDIARY CONTROL</span></div>
      <div className="im-staff"><span className="im-staff-mark">{user?.name?.slice(0, 1) || 'N'}</span><span><b>{user?.name}</b><small>National Sales Admin</small></span></div>
    </header>
    <div className="im-heading">
      <div>
        <div className="im-kicker"><span className="im-kicker-dot" /> INTERMEDIARY REGISTER <span className="im-kicker-rule" /></div>
        <h1>{title}</h1>
        <p>{subtitle[page.path]}</p>
      </div>
      <div className="im-heading-meta"><span className="im-meta-icon"><Fingerprint size={18} /></span><span><b>Identity control</b><small>Changes are versioned & audited</small></span></div>
    </div>

    <nav className="im-tabs" aria-label="Intermediary management pages">
      {PAGES.map(item => {
        const carryCode = agentCode && !['/intermediary/registration', '/intermediary/agents'].includes(item.path);
        return <Link key={item.path} href={`${item.path}${carryCode ? `?code=${encodeURIComponent(agentCode)}` : ''}`} className={`im-tab ${item.path === page.path ? 'active' : ''}`} data-testid={`link-intermediary-${item.index}`}>
        <span className="im-tab-number">{item.index}</span><span>{item.label}</span>{item.path === page.path && <i />}
      </Link>;
      })}
    </nav>

    <main className="im-content">
      {notice && <SuccessMessage>{notice}</SuccessMessage>}
      <ApiMessage error={error} onRetry={() => { setError(null); if (agentCode) detail.refetch(); else list.refetch(); }} />
      {isConflict(error) && agentCode && page.path !== '/intermediary/registration' && <ConflictReload onReload={reloadAllCurrent} />}
      {options.isError && <ApiMessage error={options.error} onRetry={() => options.refetch()} />}
      {detail.isError && agentCode && <ApiMessage error={detail.error} onRetry={() => detail.refetch()} />}

      {page.path === '/intermediary/registration' && <AgentRegistration
        code={agentCode} username={username} options={catalog} detail={detail.data} detailError={detail.error} detailLoading={detail.isLoading}
        pendingList={list} pageNo={pageNo} setPage={setPageNo} search={search} setSearch={setSearch}
        searchBy={registrationSearchBy} setSearchBy={setRegistrationSearchBy}
        onSelect={code => { setAgentCode(code); setLocation(`/intermediary/registration?code=${encodeURIComponent(code)}`); }}
        onInvalidate={invalidate} onNavigate={path => setLocation(path)}
        onReload={async () => { const latest = await detail.refetch(); return latest.isError ? undefined : latest.data; }}
      />}

      {page.path === '/intermediary/agents' && <section className="im-card">
        <div className="im-card-head im-list-head"><div><div className="im-section-index">02 / REGISTER</div><h2>Agent register <span className="im-count">{list.data?.total ?? '—'}</span></h2><p>25 records per page · search by identity, payroll, status or type</p></div>
          <Link href="/intermediary/registration" className="im-button im-button-solid"><Plus size={16} /> Import agents</Link>
        </div>
        <div className="im-filters">
          <label className="im-search"><Search size={16} /><input aria-label="Search agents" data-testid="input-agent-search" value={search} onChange={e => { setSearch(e.target.value); setPageNo(1); }} placeholder="Search name, code, payroll…" /><kbd>⌘ K</kbd></label>
          <select aria-label="Filter by status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPageNo(1); }}><option value="">All statuses</option>{(catalog?.statuses ?? []).map(s => <option key={s}>{s}</option>)}</select>
          <select aria-label="Filter by agent type" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPageNo(1); }}><option value="">All types</option>{agentTypeOptions.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        {list.isLoading ? <SkeletonRows /> : list.isError ? <ApiMessage error={list.error} onRetry={() => list.refetch()} /> : listItems.length === 0 ? <div className="im-empty"><div><Search size={21} /></div><h3>No agents match this view</h3><p>Clear a filter or import a core-system identity.</p><Button variant="quiet" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}>Clear filters</Button></div> :
          <div className="im-table-wrap"><table className="im-table"><thead><tr><th>AGENT</th><th>TYPE</th><th>ORGANIZATION</th><th>STATUS</th><th>COMMISSION</th><th>VERSION</th><th /></tr></thead>
            <tbody>{listItems.map(item => <tr key={item.agent_code} data-testid={`row-agent-${item.agent_code}`}>
              <td><button className="im-agent-name" onClick={() => setLocation(`/intermediary/details?code=${encodeURIComponent(item.agent_code)}`)}><span className="im-avatar">{item.agent_name.slice(0, 1).toUpperCase()}</span><span><b>{item.agent_name}</b><small>{item.agent_code}{item.user_id ? ` · ${item.user_id}` : ''}</small></span></button></td>
              <td>{item.agent_type}</td><td><span className="im-org-code">{item.branch_code || item.unit_code || item.region_code || '—'}</span></td>
              <td><StatusPill status={item.agent_status} /></td><td>{item.commission_rate == null ? '—' : `${item.commission_rate}%`}</td><td><span className="im-version">v{item.version}</span></td>
              <td><button className="im-row-open" title="Open agent details" onClick={() => setLocation(`/intermediary/details?code=${encodeURIComponent(item.agent_code)}`)}><ArrowRight size={16} /></button></td>
            </tr>)}</tbody></table></div>}
        <div className="im-pagination"><span>Showing <b>{listItems.length ? (pageNo - 1) * 25 + 1 : 0}–{Math.min(pageNo * 25, list.data?.total ?? 0)}</b> of <b>{list.data?.total ?? 0}</b></span>
          <div><Button variant="quiet" disabled={pageNo <= 1 || list.isFetching} onClick={() => setPageNo(p => Math.max(1, p - 1))}><ArrowLeft size={14} /> Previous</Button><span className="im-page-num">Page {pageNo}</span><Button variant="quiet" disabled={!list.data || pageNo * 25 >= list.data.total || list.isFetching} onClick={() => setPageNo(p => p + 1)}>Next <ArrowRight size={14} /></Button></div>
        </div>
      </section>}

      {page.path === '/intermediary/verification' && <VerificationPanel
        items={listItems} isLoading={list.isLoading} error={list.error} onRetry={() => list.refetch()}
        search={search} setSearch={value => { setSearch(value); setPageNo(1); }} pageNo={pageNo} total={list.data?.total ?? 0}
        canPrevious={pageNo > 1} canNext={!!list.data && pageNo * 25 < list.data.total} setPage={setPageNo}
        username={username} chooseAgent={code => chooseAgentOnPage(code, setLocation)} selected={agentCode}
        mutateAction={mutateAction} agent={agent} note={note} setNote={setNote} isPending={isPending}
      />}

      {['/intermediary/details', '/intermediary/changes', '/intermediary/licences', '/intermediary/suspension', '/intermediary/mapping'].includes(page.path) && <>
        <AgentPicker value={agentCode} setValue={setAgentCode} items={listItems} onLoad={chooseAgent} loading={list.isLoading} page={page.path} />
        {!agentCode ? <div className="im-empty im-empty-prompt"><div><Fingerprint size={24} /></div><h3>Select an agent record</h3><p>Enter an immutable agent code above, or choose one from the register.</p>{listItems.length > 0 && <button onClick={() => chooseAgent(listItems[0].agent_code)}>{listItems[0].agent_name} <span>{listItems[0].agent_code}</span><ArrowRight size={15} /></button>}</div> :
          detail.isLoading ? <section className="im-card"><SkeletonRows /></section> :
          agent && <AgentWorkspace page={page.path} agent={agent} detail={detail.data!} catalog={catalog} master={master} setMaster={setMaster} note={note} setNote={setNote} saveMaster={saveMaster}
             licence={licence} setLicence={setLicence} director={director} setDirector={setDirector} mutateAction={mutateAction} isPending={isPending} confirmAction={confirmAction} setConfirmAction={setConfirmAction} auditNote={auditNote} setAuditNote={setAuditNote}
            targetSearch={targetSearch} setTargetSearch={setTargetSearch} targetCode={targetCode} setTargetCode={setTargetCode} targets={eligibleTargets.data?.items ?? []} onUpload={async () => {
              if (!file || !docTitle.trim() || !agent) return;
              setError(null); setBusyUpload(true);
              try {
                if (file.size > 25 * 1024 * 1024) throw new Error('File exceeds the 25 MiB limit.');
                if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choose a PDF, JPEG or PNG file.');
                const response = await requestUpload.mutateAsync({ code: agent.agent_code, data: { title: docTitle.trim(), file_name: file.name, content_type: file.type as 'application/pdf' | 'image/jpeg' | 'image/png', file_size: file.size } });
                const uploadUrl = response.upload_url.startsWith('/') ? new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${response.upload_url}`, window.location.origin).toString() : response.upload_url;
                const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                if (!put.ok) throw new Error(`File transfer failed (${put.status}). Please retry; the selected file is retained.`);
                await confirmUpload.mutateAsync({ code: agent.agent_code, id: response.document_id });
                setFile(null); setDocTitle(''); setNotice('Document uploaded and confirmed.'); await invalidate(agent.agent_code);
              } catch (uploadError) { setError(uploadError); }
              finally { setBusyUpload(false); }
            }} file={file} setFile={setFile} docTitle={docTitle} setDocTitle={setDocTitle} />}
        </>}
    </main>
    <footer className="im-footer"><span><ShieldCheck size={14} /> Accountable intermediary records</span><span>National Sales Administration <i /> AAR MIS</span></footer>
  </div>;
}

function chooseAgentOnPage(code: string, setLocation: (url: string) => void) {
  setLocation(`/intermediary/verification?code=${encodeURIComponent(code)}`);
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

function AgentPicker({ value, setValue, items, onLoad, loading, page }: { value: string; setValue: (v: string) => void; items: Intermediary[]; onLoad: (v: string) => void; loading: boolean; page: string }) {
  return <div className="im-picker">
    <label><span>AGENT RECORD</span><div className="im-picker-control"><Fingerprint size={17} /><input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onLoad(value); } }} placeholder="Enter immutable agent code" aria-label="Agent code" /><button type="button" onClick={() => onLoad(value)} disabled={!value.trim() || loading}>Load record <ArrowRight size={14} /></button></div></label>
    <span className="im-picker-or">OR SELECT</span>
    <select aria-label="Choose an agent" value="" onChange={e => e.target.value && onLoad(e.target.value)}><option value="">{loading ? 'Loading register…' : 'Choose an agent from register'}</option>{items.map(item => <option key={item.agent_code} value={item.agent_code}>{item.agent_name} · {item.agent_code}</option>)}</select>
    {page === '/intermediary/details' && <span className="im-picker-readonly"><LockKeyhole size={13} /> Read-only view</span>}
  </div>;
}

function AgentWorkspace({ page, agent, detail, catalog, master, setMaster, note, setNote, saveMaster, licence, setLicence, director, setDirector, mutateAction, isPending, confirmAction, setConfirmAction, auditNote, setAuditNote, targetSearch, setTargetSearch, targetCode, setTargetCode, targets, onUpload, file, setFile, docTitle, setDocTitle }: {
  page: string; agent: Intermediary; detail: IntermediaryDetail; catalog?: { agent_types: string[]; units: string[]; branches: string[]; regions: string[]; gi_codes: string[] };
  master: IntermediaryInput; setMaster: (value: IntermediaryInput) => void; note: string; setNote: (value: string) => void; saveMaster: (event: FormEvent<HTMLFormElement>) => void;
  licence: { licence_id: string; licence_no: string; valid_from: string; valid_to: string; ira_compliant: boolean; kyc_compliant: boolean; contract_signed: boolean };
  setLicence: (value: typeof licence) => void;
  director: { director_id: string; director_version: string; name: string; email: string; mobile_no: string; pin_no: string; nid_no: string };
  setDirector: (value: typeof director) => void; mutateAction: (payload: Omit<IntermediaryActionInput, 'version' | 'notes'> & { notes?: string }, success: string, overrideCode?: string) => void;
  auditNote: string; setAuditNote: (value: string) => void;
  isPending: boolean; confirmAction: string; setConfirmAction: (value: string) => void; targetSearch: string; setTargetSearch: (v: string) => void; targetCode: string; setTargetCode: (v: string) => void; targets: Intermediary[];
  onUpload: () => void; file: File | null; setFile: (v: File | null) => void; docTitle: string; setDocTitle: (v: string) => void;
}) {
  const suspended = agent.suspended || Number(agent.terminated) > 0;
  const directorAction = () => {
    if (!note.trim() || !director.name.trim()) return;
    mutateAction({ action: 'SAVE_DIRECTOR', name: director.name.trim(), director_id: director.director_id ? Number(director.director_id) : undefined, director_version: director.director_version ? Number(director.director_version) : undefined, email: toNull(director.email), mobile_no: toNull(director.mobile_no), pin_no: toNull(director.pin_no), nid_no: toNull(director.nid_no) }, 'Director details saved.');
  };
  const saveLicence = () => {
    if (!licence.licence_no.trim() || !licence.valid_from || !licence.valid_to || licence.valid_to < licence.valid_from || !note.trim()) return;
    mutateAction({ action: 'SAVE_LICENCE', licence_id: licence.licence_id ? Number(licence.licence_id) : undefined, licence_no: licence.licence_no.trim(), valid_from: licence.valid_from, valid_to: licence.valid_to, ira_compliant: licence.ira_compliant, kyc_compliant: licence.kyc_compliant, contract_signed: licence.contract_signed }, 'Licence draft saved.');
  };
  const uploadDoc = () => onUpload();
  const downloadUrl = (id: number) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/intermediary/agents/${encodeURIComponent(agent.agent_code)}/documents/${id}/download`;
  const submit = (id: number) => mutateAction({ action: 'SUBMIT_LICENCE', licence_id: id }, 'Licence submitted for independent verification.');
  const confirmStatus = (status: string) => {
    if (!note.trim()) return;
    mutateAction({ action: status as 'SUSPEND' | 'TERMINATE' | 'REACTIVATE' }, `${agent.agent_name} status updated.`);
  };

  return <div className="im-workspace">
    <section className="im-profile">
      <div className="im-profile-main"><span className="im-profile-avatar">{agent.agent_name.slice(0, 1).toUpperCase()}</span><div><div className="im-profile-meta"><span>AGENT IDENTITY</span><span className="im-version">v{agent.version}</span></div><h2>{agent.agent_name}</h2><p>{agent.agent_code} <i /> {agent.agent_type} <i /> {agent.branch_code || agent.unit_code || agent.region_code || 'No organization code'}</p></div></div>
      <div className="im-profile-status"><StatusPill status={agent.agent_status} /><small>Updated version {agent.version}</small></div>
    </section>

    {page === '/intermediary/details' && <div className="im-details-layout">
      <section className="im-card im-detail-card"><div className="im-card-head compact"><div><div className="im-section-index">MASTER RECORD</div><h2>Identity & contact</h2><p>Read-only snapshot of current accountable identity.</p></div><Fingerprint size={20} /></div>
        <div className="im-detail-grid">{[
          ['Agent name', agent.agent_name], ['Agent code', agent.agent_code], ['Agent type', agent.agent_type], ['Status', agent.agent_status || 'Not set'],
          ['User / payroll ID', agent.user_id], ['Email', agent.email], ['Primary mobile', agent.mobile_no], ['Secondary mobile', agent.secondary_mobile],
          ['KRA PIN', agent.pin_no], ['National ID', agent.nid_no], ['HRMIS code', agent.hrmis_code], ['eTIMS verified', agent.etims_verified ? 'Yes' : 'No'],
          ['Received', agent.receive_date], ['Contract date', agent.contract_date], ['Unit', agent.unit_code], ['Branch', agent.branch_code],
          ['Region', agent.region_code], ['GI code', agent.gi_code], ['RMS corporate', agent.rms_code_corp], ['RMS retail', agent.rms_code_ret],
          ['Commission rate', agent.commission_rate == null ? null : `${agent.commission_rate}%`], ['Pay mode', agent.pay_mode],
        ].map(([label, value]) => <div key={label}><small>{label}</small><b>{value || '—'}</b></div>)}</div>
      </section>
      <RecordPanels agent={agent} detail={detail} downloadUrl={downloadUrl} />
    </div>}

    {page === '/intermediary/changes' && <div className="im-two-col">
      <section className="im-card"><div className="im-card-head compact"><div><div className="im-section-index">04 / EDITABLE MASTER</div><h2>Change agent details</h2><p>Code is immutable. Each successful save advances the version.</p></div><Building2 size={20} /></div>
        <form onSubmit={saveMaster}><MasterFields value={master} onChange={setMaster} catalog={catalog} /><NoteField value={master.notes} onChange={v => setMaster({ ...master, notes: v })} />
          <div className="im-form-footer"><span>Saving against initialized version {master.version ?? '—'}</span><Button type="submit" disabled={isPending}>Save changes <Check size={15} /></Button></div></form>
      </section>
      <section className="im-card"><div className="im-card-head compact"><div><div className="im-section-index">DIRECTOR REGISTER</div><h2>Accountable directors</h2><p>Add a director or select a retained director to edit.</p></div><Users size={20} /></div>
        {detail.directors.length > 0 && <div className="im-director-list">{detail.directors.map(d => <button key={d.director_id} onClick={() => setDirector({ director_id: String(d.director_id), director_version: String(d.version), name: d.name, email: d.email ?? '', mobile_no: d.mobile_no ?? '', pin_no: d.pin_no ?? '', nid_no: d.nid_no ?? '' })}><span className="im-avatar">{d.name.slice(0, 1)}</span><span><b>{d.name}</b><small>{d.email || d.mobile_no || 'Contact details not supplied'} · v{d.version}</small></span><ChevronDown size={15} /></button>)}</div>}
        <div className="im-form-grid im-director-form"><Field label="Director name" required value={director.name} onChange={v => setDirector({ ...director, name: v })} />
          <Field label="Email" type="email" value={director.email} onChange={v => setDirector({ ...director, email: v })} /><Field label="Mobile" value={director.mobile_no} onChange={v => setDirector({ ...director, mobile_no: v })} />
          <Field label="KRA PIN" value={director.pin_no} onChange={v => setDirector({ ...director, pin_no: v })} /><Field label="National ID" value={director.nid_no} onChange={v => setDirector({ ...director, nid_no: v })} /></div>
        <NoteField value={note} onChange={setNote} label="Director change note" /><div className="im-form-footer"><span>{director.director_id ? `Editing director v${director.director_version}` : 'New director entry'}</span><Button disabled={isPending || !director.name.trim() || !note.trim()} onClick={directorAction}>Save director <Check size={15} /></Button></div>
      </section>
      <section className="im-card im-audit-note-card"><div className="im-card-head compact"><div><div className="im-section-index">APPEND-ONLY</div><h2>Record an audit note</h2><p>Add context without changing master data.</p></div><Clock3 size={18} /></div>
        <NoteField value={auditNote} onChange={setAuditNote} label="Audit note" /><div className="im-form-footer"><span>Saved with current agent version {agent.version}</span><Button disabled={isPending || !auditNote.trim()} onClick={() => mutateAction({ action: 'NOTE', notes: auditNote.trim() }, 'Audit note appended.')}>Append note <ArrowRight size={15} /></Button></div>
      </section>
    </div>}

    {page === '/intermediary/licences' && <div className="im-two-col im-licence-layout">
      <section className="im-card"><div className="im-card-head compact"><div><div className="im-section-index">05 / LICENCE RECORD</div><h2>{licence.licence_id ? 'Edit licence draft' : 'Add licence draft'}</h2><p>Compliance must be complete and dates current before independent verification.</p></div><FileCheck2 size={20} /></div>
        {detail.licences.length > 0 && <div className="im-licence-list">{detail.licences.map(item => <div key={item.licence_id} className="im-licence-row"><span className="im-licence-icon"><FileText size={17} /></span><div><b>{item.licence_no}</b><small>{item.valid_from} — {item.valid_to}</small><small className="im-flags">{item.ira_compliant ? 'IRA compliant' : 'IRA exception'} · {item.kyc_compliant ? 'KYC compliant' : 'KYC exception'} · {item.contract_signed ? 'Contract signed' : 'Contract missing'}{item.waiver ? ` · WAIVER REQUESTED: ${item.waiver_reason || 'Reason not supplied'}` : ''}</small></div><StatusPill status={item.status} /><button title="Edit licence draft" disabled={!['DRAFT', 'DECLINED'].includes(item.status)} onClick={() => setLicence({ licence_id: String(item.licence_id), licence_no: item.licence_no, valid_from: item.valid_from, valid_to: item.valid_to, ira_compliant: item.ira_compliant, kyc_compliant: item.kyc_compliant, contract_signed: item.contract_signed })}><ChevronDown size={15} /></button>
          {['DRAFT', 'DECLINED'].includes(item.status) && <button className="im-text-button" onClick={() => submit(item.licence_id)} disabled={suspended || isPending || !note.trim() || detail.documents.length === 0}>Submit for verification</button>}</div>)}</div>}
        {detail.documents.length === 0 && <div className="im-alert im-alert-warn im-licence-required"><AlertCircle size={15} /><span>At least one supporting document must be uploaded and confirmed before a licence can be submitted.</span></div>}
        <div className="im-form-grid"><Field label="Licence number" required value={licence.licence_no} onChange={v => setLicence({ ...licence, licence_no: v })} />
          <Field label="Valid from" type="date" required value={licence.valid_from} onChange={v => setLicence({ ...licence, valid_from: v })} />
          <Field label="Valid to" type="date" required value={licence.valid_to} onChange={v => setLicence({ ...licence, valid_to: v })} /></div>
        {licence.valid_from && licence.valid_to && licence.valid_to < licence.valid_from && <div className="im-field-error">Valid to must be on or after the valid-from date.</div>}
        <div className="im-compliance-checks"><Toggle label="IRA compliant" checked={licence.ira_compliant} onChange={v => setLicence({ ...licence, ira_compliant: v })} /><Toggle label="KYC compliant" checked={licence.kyc_compliant} onChange={v => setLicence({ ...licence, kyc_compliant: v })} /><Toggle label="Contract signed" checked={licence.contract_signed} onChange={v => setLicence({ ...licence, contract_signed: v })} /></div>
        <NoteField value={note} onChange={setNote} label="Licence action note" />
        <div className="im-form-footer"><span>Current agent version {agent.version}</span><Button disabled={isPending || !licence.licence_no.trim() || !licence.valid_from || !licence.valid_to || licence.valid_to < licence.valid_from || !note.trim()} onClick={saveLicence}>Save licence <Check size={15} /></Button></div>
      </section>
      <section className="im-card im-upload-card"><div className="im-card-head compact"><div><div className="im-section-index">SUPPORTING EVIDENCE</div><h2>Documents</h2><p>PDF, JPEG or PNG · maximum 25 MiB</p></div><FilePlus2 size={20} /></div>
        <label className="im-field"><span>Document title<b className="im-required"> *</b></span><input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="e.g. Current IRA intermediary licence" /></label>
        <label className="im-dropzone"><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} /><span className="im-drop-icon"><FilePlus2 size={20} /></span><b>{file?.name || 'Choose supporting document'}</b><small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MiB selected` : 'Browse PDF, JPEG or PNG'}</small></label>
        <Button disabled={!file || !docTitle.trim() || isPending} onClick={uploadDoc}>{isPending ? <LoaderCircle className="im-spin" size={15} /> : <ArrowDownToLine size={15} />} Upload and confirm</Button>
        <div className="im-document-list">{detail.documents.map(doc => <a key={doc.document_id} href={downloadUrl(doc.document_id)} target="_blank" rel="noreferrer"><FileText size={16} /><span><b>{doc.title}</b><small>{doc.file_name} · {(doc.file_size / 1024 / 1024).toFixed(2)} MiB</small></span><ArrowDownToLine size={15} /></a>)}</div>
      </section>
    </div>}

    {page === '/intermediary/suspension' && <section className="im-card im-status-card"><div className="im-card-head compact"><div><div className="im-section-index">07 / STATUS CONTROL</div><h2>Agent status action</h2><p>Actions require an explicit reason and confirmation; no agent identity is deleted.</p></div><ShieldAlert size={21} /></div>
      <div className="im-status-current"><span className="im-status-symbol"><ShieldCheck size={20} /></span><div><small>CURRENT STATUS</small><b>{agent.agent_status || 'Unspecified'}</b><span>{agent.suspended ? 'Agent is currently suspended.' : Number(agent.terminated) ? 'Agent has been terminated.' : 'Agent is not suspended or terminated.'}</span></div><StatusPill status={agent.agent_status} /></div>
      <NoteField value={note} onChange={setNote} label="Status change reason" />
      <div className="im-status-actions">
        <button className="im-status-action suspend" onClick={() => setConfirmAction('SUSPEND')} disabled={isPending || !note.trim() || agent.suspended || Number(agent.terminated) > 0}><ShieldAlert size={19} /><span><b>Suspend agent</b><small>Temporarily stop new licence submissions and mapping.</small></span><ArrowRight size={16} /></button>
        <button className="im-status-action terminate" onClick={() => setConfirmAction('TERMINATE')} disabled={isPending || !note.trim() || Number(agent.terminated) > 0}><LockKeyhole size={19} /><span><b>Terminate agent</b><small>Record an end to this intermediary relationship.</small></span><ArrowRight size={16} /></button>
        {(agent.suspended || Number(agent.terminated) > 0 || (agent.agent_status || '').toUpperCase() !== 'ACTIVE') && <button className="im-status-action reactivate" onClick={() => setConfirmAction('REACTIVATE')} disabled={isPending || !note.trim()}><RefreshCw size={19} /><span><b>{(agent.agent_status || '').toUpperCase() === 'DRAFT' ? 'Activate agent' : 'Reactivate agent'}</b><small>Set this identity active through an audited action.</small></span><ArrowRight size={16} /></button>}
      </div>
      {confirmAction && <div className="im-confirm" role="alertdialog"><div><b>Confirm {confirmAction.toLowerCase()}?</b><p>This action will change status for {agent.agent_code} and write the required note to history.</p></div><div><Button variant="quiet" onClick={() => setConfirmAction('')}>Cancel</Button><Button variant="danger" disabled={isPending} onClick={() => confirmStatus(confirmAction)}>{isPending ? 'Saving…' : `Confirm ${confirmAction.toLowerCase()}`}</Button></div></div>}
      <div className="im-inline-history"><h3><Clock3 size={16} /> Recent status history</h3>{detail.events.filter(event => /SUSPEND|TERMIN|REACTIVATE/i.test(event.action)).slice(0, 5).map(event => <div key={event.event_id}><span><b>{event.action.replaceAll('_', ' ')}</b><small>{new Date(event.created_at).toLocaleString()} · {event.actor}</small></span><p>{event.notes}</p></div>)}</div>
    </section>}

    {page === '/intermediary/mapping' && <section className="im-card im-mapping-card"><div className="im-card-head compact"><div><div className="im-section-index">08 / AGENT RELATIONSHIPS</div><h2>Map agent to agent</h2><p>Mappings never reassign historical business records.</p></div><Link2 size={20} /></div>
      {detail.mappings.length > 0 ? <div className="im-mapping-list">{detail.mappings.map(mapping => <div key={`${mapping.from_code}-${mapping.to_code}`}><span className="im-map-from">{mapping.from_code}</span><ArrowRight size={16} /><span className="im-map-to"><b>{mapping.to_name}</b><small>{mapping.to_code}</small></span><span className="im-map-actor">Mapped by {mapping.mapped_by}</span><Button variant="quiet" disabled={isPending || !note.trim()} onClick={() => mutateAction({ action: 'UNMAP', to_code: mapping.to_code }, `Mapping to ${mapping.to_code} removed.`)}>Unmap</Button></div>)}</div> :
        <div className="im-empty im-empty-inline"><div><Link2 size={20} /></div><h3>No current mappings</h3><p>Choose a target agent to record the first relationship.</p></div>}
      <div className="im-map-form"><label className="im-field"><span>Search target agents</span><div className="im-input-icon"><Search size={16} /><input value={targetSearch} onChange={e => setTargetSearch(e.target.value)} placeholder="Search by agent name or code" /></div></label>
        <label className="im-field"><span>Mapping target<b className="im-required"> *</b></span><select value={targetCode} onChange={e => setTargetCode(e.target.value)}><option value="">Choose an eligible target</option>{targets.filter(target => target.agent_code !== agent.agent_code && !target.suspended && Number(target.terminated) === 0).map(target => <option value={target.agent_code} key={target.agent_code}>{target.agent_name} · {target.agent_code}</option>)}</select></label>
      </div>
      <NoteField value={note} onChange={setNote} label="Mapping note" />
      <div className="im-form-footer"><span>Agent version {agent.version} · no historical reassignment</span><Button disabled={isPending || !targetCode || !note.trim() || targetCode === agent.agent_code || suspended} onClick={() => mutateAction({ action: 'MAP', to_code: targetCode }, `Agent mapped to ${targetCode}.`)}>Create mapping <ArrowRight size={15} /></Button></div>
      <aside className="im-info-note"><AlertCircle size={15} /><span>Suspended or terminated agents cannot be selected as mapping targets. Self and circular mapping attempts are rejected by the service.</span></aside>
    </section>}
  </div>;
}

function RecordPanels({ agent, detail, downloadUrl }: { agent: Intermediary; detail: IntermediaryDetail; downloadUrl: (id: number) => string }) {
  return <div className="im-record-panels">
    <section className="im-card im-mini-card"><div className="im-card-head compact"><div><div className="im-section-index">COMPLIANCE</div><h2>Licences <span className="im-count">{detail.licences.length}</span></h2></div><FileCheck2 size={18} /></div>
      {detail.licences.length ? detail.licences.map(item => <div className="im-licence-row" key={item.licence_id}><span className="im-licence-icon"><FileCheck2 size={16} /></span><div><b>{item.licence_no}</b><small>{item.valid_from} — {item.valid_to}</small><small className="im-flags">{item.ira_compliant ? 'IRA' : 'IRA missing'} · {item.kyc_compliant ? 'KYC' : 'KYC missing'} · {item.contract_signed ? 'Contract signed' : 'Contract missing'}{item.waiver ? ` · WAIVER REQUESTED: ${item.waiver_reason || 'Reason not supplied'}` : ''}{item.reviewed_by ? ` · Reviewed by ${item.reviewed_by}` : ''}</small></div><StatusPill status={item.status} /></div>) : <div className="im-quiet-empty">No licence record retained.</div>}
    </section>
    <section className="im-card im-mini-card"><div className="im-card-head compact"><div><div className="im-section-index">OWNERSHIP</div><h2>Directors <span className="im-count">{detail.directors.length}</span></h2></div><Users size={18} /></div>
      {detail.directors.length ? detail.directors.map(d => <div key={d.director_id} className="im-director-view"><span className="im-avatar">{d.name.slice(0, 1)}</span><span><b>{d.name}</b><small>{d.email || d.mobile_no || d.pin_no || 'No contact supplied'}</small></span></div>) : <div className="im-quiet-empty">No directors listed.</div>}
    </section>
    <section className="im-card im-mini-card"><div className="im-card-head compact"><div><div className="im-section-index">PRIVATE EVIDENCE</div><h2>Documents <span className="im-count">{detail.documents.length}</span></h2></div><FileText size={18} /></div>
      {detail.documents.length ? detail.documents.map(doc => <a className="im-doc-link" href={downloadUrl(doc.document_id)} target="_blank" rel="noreferrer" key={doc.document_id}><FileText size={16} /><span><b>{doc.title}</b><small>{doc.file_name} · {new Date(doc.created_at).toLocaleDateString()}</small></span><ArrowDownToLine size={15} /></a>) : <div className="im-quiet-empty">No documents attached.</div>}
    </section>
    <section className="im-card im-mini-card im-history-card"><div className="im-card-head compact"><div><div className="im-section-index">APPEND-ONLY AUDIT</div><h2>Notes & events <span className="im-count">{detail.events.length}</span></h2></div><Clock3 size={18} /></div>
      {detail.events.length ? detail.events.map(event => <article className="im-event" key={event.event_id}><span className="im-event-mark"><CircleDashed size={14} /></span><div><header><b>{event.action.replaceAll('_', ' ')}</b><small>{new Date(event.created_at).toLocaleString()} · {event.actor}</small></header><p>{event.notes}</p></div></article>) : <div className="im-quiet-empty">No history events retained.</div>}
    </section>
  </div>;
}

function VerificationPanel({ items, isLoading, error, onRetry, search, setSearch, pageNo, total, canPrevious, canNext, setPage, username, chooseAgent, selected, mutateAction, agent, note, setNote, isPending }: {
  items: Intermediary[]; isLoading: boolean; error: unknown; onRetry: () => void; search: string; setSearch: (v: string) => void; pageNo: number; total: number; canPrevious: boolean; canNext: boolean; setPage: (fn: (current: number) => number) => void; username: string; chooseAgent: (code: string) => void; selected: string;
  mutateAction: (payload: Omit<IntermediaryActionInput, 'version' | 'notes'> & { notes?: string }, success: string, overrideCode?: string, overrideAgent?: Intermediary) => void;
  agent?: Intermediary; note: string; setNote: (v: string) => void; isPending: boolean;
}) {
  return <div className="im-card"><div className="im-card-head im-list-head"><div><div className="im-section-index">06 / INDEPENDENT REVIEW</div><h2>Licence verification</h2><p>Submitted licence records across the current searched agent register.</p></div><span className="im-review-badge"><BadgeCheck size={16} /> Two-person control</span></div>
    <div className="im-filters im-verification-filters"><label className="im-search"><Search size={16} /><input aria-label="Search agents for submitted licences" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents by name, code or payroll ID…" /></label></div>
    {isLoading ? <SkeletonRows /> : error ? <ApiMessage error={error} onRetry={onRetry} /> : items.length === 0 ? <div className="im-empty"><div><FileCheck2 size={20} /></div><h3>No submitted licences in this search</h3><p>Try another agent search or check back after a licence is submitted.</p></div> :
      <div className="im-verification-list">{items.map(item => <VerificationAgent key={item.agent_code} item={item} username={username} selected={selected} onSelect={chooseAgent} mutateAction={mutateAction} agent={agent} note={note} setNote={setNote} isPending={isPending} />)}</div>}
    <div className="im-pagination"><span>Showing <b>{items.length ? (pageNo - 1) * 25 + 1 : 0}–{Math.min(pageNo * 25, total)}</b> of <b>{total}</b> searched agents</span><div><Button variant="quiet" disabled={!canPrevious || isLoading} onClick={() => setPage(p => Math.max(1, p - 1))}><ArrowLeft size={14} /> Previous</Button><span className="im-page-num">Page {pageNo}</span><Button variant="quiet" disabled={!canNext || isLoading} onClick={() => setPage(p => p + 1)}>Next <ArrowRight size={14} /></Button></div></div>
  </div>;
}

function VerificationAgent({ item, username, selected, onSelect, mutateAction, agent, note, setNote, isPending }: {
  item: Intermediary; username: string; selected: string; onSelect: (code: string) => void;
  mutateAction: (payload: Omit<IntermediaryActionInput, 'version' | 'notes'> & { notes?: string }, success: string, overrideCode?: string, overrideAgent?: Intermediary) => void;
  agent?: Intermediary; note: string; setNote: (v: string) => void; isPending: boolean;
}) {
  const detail = useGetIntermediary(item.agent_code, {
    query: { queryKey: [...getGetIntermediaryQueryKey(item.agent_code), username], staleTime: 15_000, refetchOnMount: true },
  });
  const submitted = detail.data?.licences.filter(licence => licence.status === 'SUBMITTED') ?? [];
  return <article className={`im-review-agent ${selected === item.agent_code ? 'selected' : ''}`}>
    <button className="im-review-agent-head" onClick={() => onSelect(item.agent_code)}><span className="im-avatar">{item.agent_name.slice(0, 1)}</span><span><b>{item.agent_name}</b><small>{item.agent_code} · {item.agent_type}</small></span><StatusPill status={item.agent_status} /><span className="im-review-open">{detail.isLoading ? 'Checking…' : `${submitted.length} submitted`} <ArrowRight size={14} /></span></button>
    {detail.isError && <div className="im-review-error">{(detail.error as { data?: { error?: string }; message?: string }).data?.error || (detail.error as Error).message}</div>}
    {submitted.map(licence => {
      const ownSubmission = licence.entered_by.trim().toLowerCase() === username.trim().toLowerCase();
      const today = new Date().toISOString().slice(0, 10);
      const currentDates = licence.valid_from <= today && licence.valid_to >= today;
      const hasDocuments = (detail.data?.documents.length ?? 0) > 0;
      const waiverRequested = licence.waiver === true;
      const allComplianceFlags = licence.ira_compliant && licence.kyc_compliant && licence.contract_signed;
      const waiverDocumented = waiverRequested && Boolean(licence.waiver_reason?.trim());
      const canVerify = !ownSubmission && currentDates && hasDocuments && (allComplianceFlags || waiverDocumented) && !!note.trim() && !isPending;
      const verifyLicence = () => {
        if (waiverRequested) {
          const accepted = window.confirm(`Accept the documented compliance exceptions for licence ${licence.licence_no}?\n\nWaiver reason: ${licence.waiver_reason || 'No reason supplied'}\n\nThis explicitly accepts the exceptions for independent verification. Confirm current dates and supporting documents before proceeding.`);
          if (!accepted) return;
        }
        mutateAction({ action: 'VERIFY_LICENCE', licence_id: licence.licence_id }, 'Licence verified.', item.agent_code, detail.data?.agent);
      };
      return <div key={licence.licence_id} className="im-review-licence">
        <div className="im-review-licence-head"><span className="im-licence-icon"><FileCheck2 size={16} /></span><div><b>{licence.licence_no}</b><small>Valid {licence.valid_from} to {licence.valid_to} · Submitted by {licence.entered_by}</small></div><StatusPill status={licence.status} /></div>
        <div className="im-review-flags"><span className={licence.ira_compliant ? 'pass' : 'fail'}><i /> IRA {licence.ira_compliant ? 'compliant' : 'not compliant'}</span><span className={licence.kyc_compliant ? 'pass' : 'fail'}><i /> KYC {licence.kyc_compliant ? 'compliant' : 'not compliant'}</span><span className={licence.contract_signed ? 'pass' : 'fail'}><i /> Contract {licence.contract_signed ? 'signed' : 'missing'}</span><span className={currentDates ? 'pass' : 'fail'}><i /> {currentDates ? 'Current' : 'Not currently valid'}</span></div>
        {waiverRequested && <div className="im-alert im-alert-warn im-waiver-review"><ShieldAlert size={16} /><span><strong>WAIVER REQUESTED — independent acceptance required</strong><p>{licence.waiver_reason || 'No waiver reason was recorded.'}</p></span></div>}
        {ownSubmission && <div className="im-alert im-alert-warn"><AlertCircle size={16} /><span>You submitted this licence. A different authorized user must verify it.</span></div>}
        {!allComplianceFlags && !waiverDocumented && !ownSubmission && <div className="im-alert im-alert-warn"><AlertCircle size={16} /><span>All compliance flags are required unless a documented waiver request is present. A waiver is not acceptance.</span></div>}
        {!currentDates && !ownSubmission && <div className="im-alert im-alert-warn"><AlertCircle size={16} /><span>Valid From and Valid To must cover today. Waiver requests do not waive current-date requirements.</span></div>}
        {detail.data?.documents.length ? <div className="im-review-documents"><b>Supporting evidence</b>{detail.data.documents.map(document => <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/intermediary/agents/${encodeURIComponent(item.agent_code)}/documents/${document.document_id}/download`} target="_blank" rel="noreferrer" key={document.document_id}><FileText size={14} /><span>{document.title}<small>{document.document_type || 'Type not returned'} · {document.file_name}</small></span><ArrowDownToLine size={14} /></a>)}</div> : <div className="im-review-no-docs"><AlertCircle size={14} /> No confirmed supporting documents on this agent record.</div>}
        <NoteField value={note} onChange={setNote} label={licence.status === 'SUBMITTED' ? 'Review note / decline reason' : 'Review note'} />
        <div className="im-review-actions"><Button variant="quiet" disabled={!note.trim() || isPending} onClick={() => mutateAction({ action: 'DECLINE_LICENCE', licence_id: licence.licence_id }, 'Licence declined with reason.', item.agent_code, detail.data?.agent)}>Decline with reason</Button><Button disabled={!canVerify} onClick={verifyLicence}><BadgeCheck size={15} /> {waiverRequested ? 'Accept waiver & verify' : 'Verify licence'}</Button></div>
      </div>;
    })}
    {!detail.isLoading && !detail.isError && submitted.length === 0 && <p className="im-no-submissions">{detail.data?.licences.length ? 'No licences are awaiting review.' : 'No licence records.'}</p>}
  </article>;
}
