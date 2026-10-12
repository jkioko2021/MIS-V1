import { useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListRiskAdministrationDepartmentsQueryKey,
  useCreateRiskAdministrationDepartment,
  useListRiskAdministrationDepartments,
  useUpdateRiskAdministrationDepartment,
} from '@workspace/api-client-react';
import type { RiskLookup, RiskOptionsResponseData, RiskAdministrationDepartment } from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth-context';
import { useRiskOptions, useAssignRiskTeam } from '../risk/use-risk-register';
import {
  AlertCircle, ArrowRight, BadgeCheck, Building2, Check, CircleHelp, Edit3, Plus, RefreshCw,
  ShieldCheck, UsersRound,
} from 'lucide-react';

type TabKey = 'overview' | 'mappings' | 'departments';
const tabs: Array<{ key: TabKey; label: string; href: string }> = [
  { key: 'overview', label: 'Administration', href: '/risk-administration' },
  { key: 'mappings', label: 'Map Risk Officers & Owners', href: '/risk-administration/mappings' },
  { key: 'departments', label: 'Departments', href: '/risk-administration/departments' },
];
const inputClass = 'w-full rounded-xl border border-[#c8d5d3] bg-[#fffefa] px-3.5 py-3 text-sm text-[#183735] outline-none transition focus:border-[#14766f] focus:ring-4 focus:ring-[#14766f]/10 disabled:cursor-not-allowed disabled:opacity-60';
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#155e59] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#104c48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155e59] disabled:pointer-events-none disabled:opacity-45';
const secondaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#cad8d5] bg-[#fffefa] px-3.5 py-2 text-sm font-semibold text-[#28514e] transition hover:bg-[#eef4f1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155e59] disabled:pointer-events-none disabled:opacity-50';

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
}
function payloadError(response: unknown) {
  if (response === undefined || response === null) return '';
  if (!response || typeof response !== 'object') return 'The server returned an empty response.';
  const item = response as { ok?: boolean; error?: unknown };
  if (item.ok === false) return typeof item.error === 'string' ? item.error : 'The request was not accepted.';
  return '';
}
function optionsData(response: unknown): RiskOptionsResponseData | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const result = response as { ok?: boolean; data?: RiskOptionsResponseData };
  return result.ok === true ? result.data : undefined;
}

export default function RiskAdministrationPage() {
  const { user } = useAuth();
  const username = user?.username ?? '';
  const [location, setLocation] = useLocation();
  const route: TabKey = location.replace(/\/+$/, '') === '/risk-administration/mappings' ? 'mappings'
    : location.replace(/\/+$/, '') === '/risk-administration/departments' ? 'departments' : 'overview';
  const optionsQuery = useRiskOptions(username);
  const optionsFailure = optionsQuery.isError ? messageOf(optionsQuery.error, 'Could not load risk administration access.') : payloadError(optionsQuery.data);
  const options = !optionsFailure ? optionsData(optionsQuery.data) : undefined;
  const authorized = Boolean(username && options && options.actor?.username === username && options.actor.can_manage);
  const queryClient = useQueryClient();

  const departmentQuery = useListRiskAdministrationDepartments({
    query: {
      enabled: Boolean(username && authorized && route === 'departments'),
      queryKey: [...getListRiskAdministrationDepartmentsQueryKey(), username],
      staleTime: 20_000,
      refetchOnWindowFocus: true,
      refetchInterval: 60_000,
    },
  });
  const adminError = departmentQuery.isError ? messageOf(departmentQuery.error, 'Could not load departments.') : payloadError(departmentQuery.data);
  const adminRows = !adminError && departmentQuery.data?.ok === true ? departmentQuery.data.data : undefined;
  const assignTeam = useAssignRiskTeam();
  const createDepartment = useCreateRiskAdministrationDepartment();
  const updateDepartment = useUpdateRiskAdministrationDepartment();
  const [mappingDepartment, setMappingDepartment] = useState('');
  const [champion, setChampion] = useState('');
  const [owner, setOwner] = useState('');
  const [mappingError, setMappingError] = useState('');
  const [mappingSuccess, setMappingSuccess] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [editingCode, setEditingCode] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [departmentSuccess, setDepartmentSuccess] = useState('');
  const mappingFormRef = useRef<HTMLFormElement>(null);
  const departmentFormRef = useRef<HTMLFormElement>(null);
  const savingDepartment = createDepartment.isPending || updateDepartment.isPending;

  const assignments = options?.assignments ?? [];
  const activeDepartments = (options?.departments ?? []).filter(item => item.depart_code && item.depart_name);
  const selectedMapping = assignments.find(item => item.depart_code === mappingDepartment);
  const currentName = activeDepartments.find(item => item.depart_code === mappingDepartment)?.depart_name ?? mappingDepartment;

  function selectDepartment(code: string) {
    setMappingDepartment(code);
    const existing = assignments.find(item => item.depart_code === code);
    setChampion(existing?.champion_username ?? '');
    setOwner(existing?.owner_username ?? '');
    setMappingError('');
    setMappingSuccess('');
  }
  async function saveMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!options || options.actor.username !== username || !options.actor.can_manage || !mappingDepartment || !champion || !owner) return;
    setMappingError('');
    setMappingSuccess('');
    try {
      const result = await assignTeam.mutateAsync({ data: { depart_code: mappingDepartment, champion_username: champion, owner_username: owner } });
      const failure = payloadError(result);
      if (failure) throw new Error(failure);
      setMappingSuccess(`Responsibility updated for ${currentName}. Risk history remains unchanged.`);
      await optionsQuery.refetch();
    } catch (error) {
      setMappingError(messageOf(error, 'The mapping could not be saved. Your selections are still here.'));
    }
  }
  function startEdit(row: RiskAdministrationDepartment) {
    setEditingCode(row.depart_code);
    setDepartmentCode(row.depart_code);
    setDepartmentName(row.depart_name);
    setDepartmentError('');
    setDepartmentSuccess('');
    departmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function resetDepartmentForm() {
    setEditingCode('');
    setDepartmentCode('');
    setDepartmentName('');
    setDepartmentError('');
  }
  async function saveDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDepartmentError('');
    setDepartmentSuccess('');
    const code = editingCode || departmentCode.trim();
    const name = departmentName.trim();
    if (!name || name.length > 100) {
      setDepartmentError('Enter a department name of 1–100 characters.');
      return;
    }
    if (!editingCode && !/^[A-Za-z0-9_-]{1,20}$/.test(departmentCode.trim())) {
      setDepartmentError('Code must be 1–20 letters, numbers, hyphens or underscores.');
      return;
    }
    try {
      const response = editingCode
        ? await updateDepartment.mutateAsync({ code: editingCode, data: { depart_name: name } })
        : await createDepartment.mutateAsync({ data: { depart_code: departmentCode.trim(), depart_name: name } });
      const failure = payloadError(response);
      if (failure) throw new Error(failure);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...getListRiskAdministrationDepartmentsQueryKey(), username] }),
        queryClient.invalidateQueries({ predicate: query => query.queryKey.some(part => typeof part === 'string' && (part.startsWith('/api/risk-register') || part === 'risk-register')) }),
      ]);
      setDepartmentSuccess(editingCode ? `${code} was renamed. Its code and status are unchanged.` : `${code.toUpperCase()} was added to the department register.`);
      resetDepartmentForm();
    } catch (error) {
      setDepartmentError(messageOf(error, 'The department could not be saved. Your entries are still here.'));
    }
  }

  return <main className="min-h-[100dvh] bg-[#f1f5f1] text-[#183735]">
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[#155e59]"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d9e9e4]"><ShieldCheck className="h-5 w-5" /></div><div><div className="text-[10px] font-bold uppercase tracking-[.18em]">AAR Insurance MIS</div><div className="text-xs text-[#62817c]">Risk office / administration</div></div></div>
        {username && <div className="rounded-full border border-[#d4dfdb] bg-[#fffefa] px-3 py-2 font-mono text-xs text-[#56716e]">SIGNED IN · {username}</div>}
      </div>
      <header className="relative overflow-hidden rounded-[1.75rem] bg-[#174c49] px-6 py-8 text-[#f7f7ee] sm:px-9 sm:py-10">
        <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border border-white/10" /><div className="absolute -right-2 -top-10 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative max-w-3xl"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#b9d4c9]">Risk administration · accountable by design</p>
          <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight sm:text-[2.6rem]">Responsibility, made explicit.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d3e3dc] sm:text-base">Assign departmental risk roles and maintain the department register without disturbing the history already on record.</p>
        </div>
      </header>

      <nav aria-label="Risk administration sections" className="my-6 flex gap-2 overflow-x-auto border-b border-[#d5e0dc] pb-3">
        {tabs.map(tab => <button key={tab.key} data-testid={`tab-risk-admin-${tab.key}`} aria-current={route === tab.key ? 'page' : undefined} onClick={() => setLocation(tab.href)}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#155e59] ${route === tab.key ? 'bg-[#dcebe6] text-[#155e59]' : 'text-[#5e7772] hover:bg-white/70 hover:text-[#174c49]'}`}>{tab.label}</button>)}
      </nav>

      {!username ? <AccessNotice title="Sign in required" description="Sign in to confirm your MIS identity before opening risk administration." />
        : optionsQuery.isLoading && !options ? <PageSkeleton />
          : optionsFailure ? <ErrorPanel message={optionsFailure} retry={() => optionsQuery.refetch()} />
            : !authorized ? <AccessNotice title="Access denied" description="Risk administration is available to MIS management only. No administration data or controls are shown for this account." />
              : <div key={username}>
                {route === 'overview' && <Overview options={options!} navigate={setLocation} />}
                {route === 'mappings' && <section className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
                  <form ref={mappingFormRef} onSubmit={saveMapping} className="rounded-3xl border border-[#d8e3df] bg-[#fffefa] p-5 shadow-[0_10px_36px_-30px_rgba(16,66,60,.5)] sm:p-7">
                    <SectionHeading icon={<UsersRound className="h-5 w-5" />} eyebrow="Department responsibility" title="Map Risk Officers & Owners" detail="Choose a department first. Existing assignments are loaded into the form so any replacement is deliberate." />
                    <div className="mt-6 space-y-4">
                      <Field label="Active department" hint="Inactive departments cannot receive a new or updated assignment.">
                        <select data-testid="input-mapping-department" className={inputClass} value={mappingDepartment} onChange={event => selectDepartment(event.target.value)} required>
                          <option value="">Select a department</option>{activeDepartments.map(item => <option key={item.depart_code} value={item.depart_code}>{item.depart_name} · {item.depart_code}</option>)}
                        </select>
                      </Field>
                      <Field label="Risk officer (champion)" hint="The champion mapping grants Update Register access for this department.">
                        <select data-testid="input-risk-officer" className={inputClass} value={champion} onChange={event => { setChampion(event.target.value); setMappingSuccess(''); }} required>
                          <option value="">Select an existing MIS staff member</option>{(options!.staff ?? []).filter(person => person.username && person.is_active !== false).map(person => <option key={person.username} value={person.username}>{person.employee_name || person.username} · {person.username}</option>)}
                        </select>
                      </Field>
                      <Field label="Risk owner" hint="Owner mapping grants Review access. An owner may cover more than one department.">
                        <select data-testid="input-risk-owner" className={inputClass} value={owner} onChange={event => { setOwner(event.target.value); setMappingSuccess(''); }} required>
                          <option value="">Select an existing MIS staff member</option>{(options!.staff ?? []).filter(person => person.username && person.is_active !== false).map(person => <option key={person.username} value={person.username}>{person.employee_name || person.username} · {person.username}</option>)}
                        </select>
                      </Field>
                    </div>
                    {selectedMapping && <div className="mt-4 rounded-xl border border-[#dce8e3] bg-[#f2f7f4] p-3 text-xs leading-5 text-[#45635e]"><strong className="text-[#244e49]">Current assignment prefilled</strong><br />Officer: {selectedMapping.champion_username || 'Not assigned'} · Owner: {selectedMapping.owner_username || 'Not assigned'}</div>}
                    {mappingError && <InlineNotice tone="error" message={mappingError} />}
                    {mappingSuccess && <InlineNotice tone="success" message={mappingSuccess} />}
                    <button data-testid="button-save-risk-mapping" className={`${primaryButton} mt-5 w-full`} disabled={!mappingDepartment || !champion || !owner || assignTeam.isPending}>
                      {assignTeam.isPending ? 'Saving mapping…' : <><Check className="h-4 w-4" />Save responsibility mapping</>}
                    </button>
                    <p className="mt-3 text-center text-[11px] leading-5 text-[#718780]">Assignments apply to existing MIS staff accounts only. This does not enroll accounts or change prior risk history.</p>
                  </form>
                  <MappingRoster options={options!} assignments={assignments} departments={activeDepartments} onEdit={code => { selectDepartment(code); mappingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />
                </section>}
                {route === 'departments' && <section className="grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
                  <form ref={departmentFormRef} onSubmit={saveDepartment} className="rounded-3xl border border-[#d8e3df] bg-[#fffefa] p-5 shadow-[0_10px_36px_-30px_rgba(16,66,60,.5)] sm:p-7">
                    <SectionHeading icon={<Building2 className="h-5 w-5" />} eyebrow="Department register" title={editingCode ? 'Rename department' : 'Add a department'} detail={editingCode ? 'The stable department code and existing status are read-only.' : 'Create a department identity for future risk ownership and mapping.'} />
                    <div className="mt-6 space-y-4">
                      <Field label="Department code" hint={editingCode ? 'Codes remain stable after creation.' : 'Up to 20 letters, numbers, hyphens or underscores. New codes are normalized to uppercase by MIS.'}>
                        <input data-testid="input-department-code" className={inputClass} value={departmentCode} onChange={event => { setDepartmentCode(event.target.value); setDepartmentSuccess(''); }} maxLength={20} readOnly={Boolean(editingCode)} required />
                      </Field>
                      <Field label="Department name"><input data-testid="input-department-name" className={inputClass} value={departmentName} onChange={event => { setDepartmentName(event.target.value); setDepartmentSuccess(''); }} maxLength={100} required /></Field>
                      {editingCode && <div className="rounded-xl bg-[#f2f7f4] px-3.5 py-3 text-xs text-[#526f69]">Current status: <strong>{adminRows?.find(row => row.depart_code === editingCode)?.is_active ? 'Active' : 'Inactive'}</strong>. Renaming does not activate or deactivate this department.</div>}
                    </div>
                    {departmentError && <InlineNotice tone="error" message={departmentError} />}
                    {departmentSuccess && <InlineNotice tone="success" message={departmentSuccess} />}
                    <div className="mt-5 flex flex-wrap gap-2"><button data-testid="button-save-department" className={`${primaryButton} flex-1`} disabled={savingDepartment || !departmentCode.trim() || !departmentName.trim()}>{savingDepartment ? 'Saving…' : editingCode ? 'Save department name' : <><Plus className="h-4 w-4" />Create department</>}</button>
                      {editingCode && <button type="button" data-testid="button-cancel-department-edit" className={secondaryButton} onClick={resetDepartmentForm}>Cancel</button>}</div>
                    <p className="mt-3 text-[11px] leading-5 text-[#718780]">Department history and risk registers are retained. Delete, deactivate and status-toggle actions are not available here.</p>
                  </form>
                  <section className="overflow-hidden rounded-3xl border border-[#d8e3df] bg-[#fffefa]">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e1e9e5] px-5 py-5 sm:px-7"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#708a83]">Reference list</p><h2 className="mt-1 font-[Manrope] text-xl font-extrabold">Departments</h2><p className="mt-1 text-xs text-[#718780]">Active and inactive records from administration.</p></div><button data-testid="button-refresh-departments" className={secondaryButton} onClick={() => departmentQuery.refetch()} disabled={departmentQuery.isFetching}><RefreshCw className={`h-4 w-4 ${departmentQuery.isFetching ? 'animate-spin' : ''}`} />Refresh</button></div>
                    {departmentQuery.isLoading ? <div className="space-y-3 p-5">{[0, 1, 2].map(row => <div key={row} className="h-[68px] animate-pulse rounded-xl bg-[#edf3ef]" />)}</div>
                      : adminError ? <div className="p-5"><ErrorPanel message={adminError} retry={() => departmentQuery.refetch()} /></div>
                        : adminRows?.length ? <div className="divide-y divide-[#e6ece8]">{adminRows.map(row => <DepartmentRow key={row.depart_code} row={row} onEdit={() => startEdit(row)} />)}</div>
                          : <div className="p-5"><EmptyPanel title="No departments yet" detail="Create the first department record to establish an assignable organizational unit." /></div>}
                  </section>
                </section>}
              </div>}
    </div>
  </main>;
}

function Overview({ options, navigate }: { options: RiskOptionsResponseData; navigate: (path: string) => void }) {
  const activeCount = options.departments.filter(item => item.depart_code).length;
  const assignedCount = options.assignments.filter(item => item.depart_code).length;
  return <div className="space-y-5">
    <section className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
      <Metric icon={<Building2 className="h-5 w-5" />} label="Active departments" value={activeCount} note="Available for risk mapping" />
      <Metric icon={<UsersRound className="h-5 w-5" />} label="Mapped teams" value={assignedCount} note="Current department assignments" />
      <Metric icon={<BadgeCheck className="h-5 w-5" />} label="Eligible staff" value={options.staff.filter(item => item.username && item.is_active !== false).length} note="Existing MIS accounts only" />
    </section>
    <section className="rounded-3xl border border-[#d8e3df] bg-[#fffefa] p-5 sm:p-7">
      <div className="grid gap-7 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#708a83]">Management workspace</p><h2 className="mt-2 font-[Manrope] text-2xl font-extrabold tracking-tight">Clear roles. Preserved record.</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#627a74]">Keep access intentional: a Risk officer (champion) updates the register; an owner reviews it. Department mapping changes responsibility, never the historical record.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => navigate('/risk-administration/mappings')} className="group rounded-2xl border border-[#d9e5e0] bg-[#f4f8f5] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#9ebdb3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#155e59]">
            <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-[#dcebe6] text-[#155e59]"><UsersRound className="h-5 w-5" /></div><div className="text-xs font-bold uppercase tracking-wider text-[#658079]">01 · Assign roles</div><h3 className="mt-2 text-lg font-bold">Map Risk Officers & Owners</h3><p className="mt-2 text-sm leading-5 text-[#69817b]">Review and update department responsibility with existing staff.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#155e59]">Open mappings <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </button>
          <button onClick={() => navigate('/risk-administration/departments')} className="group rounded-2xl border border-[#d9e5e0] bg-[#f4f8f5] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#9ebdb3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#155e59]">
            <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-[#e8ede2] text-[#546e57]"><Building2 className="h-5 w-5" /></div><div className="text-xs font-bold uppercase tracking-wider text-[#658079]">02 · Maintain list</div><h3 className="mt-2 text-lg font-bold">Departments</h3><p className="mt-2 text-sm leading-5 text-[#69817b]">Create departments or rename existing records while preserving status.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#155e59]">Open department list <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </button>
        </div>
      </div>
    </section>
    <div className="flex items-start gap-3 rounded-2xl border border-[#d8e3df] bg-[#eaf1ec] p-4 text-xs leading-5 text-[#506b64]"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#55766d]" /><p>Every change is scoped to your signed-in management identity. Existing risk records and event history are not rewritten when department responsibility changes.</p></div>
  </div>;
}

function MappingRoster({ options, assignments, departments, onEdit }: { options: RiskOptionsResponseData; assignments: RiskLookup[]; departments: RiskLookup[]; onEdit: (code: string) => void }) {
  const sorted = useMemo(() => [...departments].sort((a, b) => (a.depart_code ?? '').localeCompare(b.depart_code ?? '')), [departments]);
  return <section className="overflow-hidden rounded-3xl border border-[#d8e3df] bg-[#fffefa]">
    <div className="border-b border-[#e1e9e5] px-5 py-5 sm:px-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#708a83]">Current responsibility</p><h2 className="mt-1 font-[Manrope] text-xl font-extrabold">Department mapping</h2><p className="mt-1 text-xs leading-5 text-[#718780]">Use Edit on a department to load its current officer and owner into the form.</p></div>
    {sorted.length ? <div className="divide-y divide-[#e6ece8]">{sorted.map(department => {
      const assignment = assignments.find(item => item.depart_code === department.depart_code);
      const staffName = (id?: string | null) => {
        if (!id) return 'Not assigned';
        const staff = options.staff.find(person => person.username === id);
        return staff?.employee_name ? `${staff.employee_name} · ${id}` : id;
      };
      return <article key={department.depart_code} className="p-5 sm:px-7" data-testid={`mapping-row-${department.depart_code}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{department.depart_name}</h3><code className="rounded-md bg-[#eff4f1] px-2 py-1 font-mono text-[10px] text-[#648078]">{department.depart_code}</code></div>
          <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2"><PersonRole label="Risk officer (champion)" value={staffName(assignment?.champion_username)} /><PersonRole label="Risk owner" value={staffName(assignment?.owner_username)} /></div>
          {!assignment && <p className="mt-3 text-xs text-[#8a7353]">No mapping returned for this active department.</p>}
        </div><button data-testid={`button-edit-mapping-${department.depart_code}`} className={secondaryButton} onClick={() => onEdit(department.depart_code ?? '')}><Edit3 className="h-3.5 w-3.5" />Edit</button></div>
      </article>;
    })}</div> : <div className="p-5"><EmptyPanel title="No active departments available" detail="Active departments will appear here when provided by the risk options service." /></div>}
  </section>;
}

function PersonRole({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-wider text-[#7b918b]">{label}</div><div className="mt-1 break-words text-sm font-semibold text-[#345b55]">{value}</div></div>;
}
function DepartmentRow({ row, onEdit }: { row: RiskAdministrationDepartment; onEdit: () => void }) {
  return <article className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-7" data-testid={`department-row-${row.depart_code}`}>
    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${row.is_active ? 'bg-[#e1efe8] text-[#34745f]' : 'bg-[#f0eee8] text-[#847b65]'}`}><Building2 className="h-4 w-4" /></div>
    <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{row.depart_name}</strong><code className="mt-1 block font-mono text-[10px] text-[#789088]">{row.depart_code}</code></div>
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.is_active ? 'bg-[#e2efe8] text-[#34745f]' : 'bg-[#f0eee8] text-[#746b56]'}`}>{row.is_active ? 'Active' : 'Inactive'}</span>
    <button data-testid={`button-edit-department-${row.depart_code}`} className={secondaryButton} onClick={onEdit}><Edit3 className="h-3.5 w-3.5" />Rename</button>
  </article>;
}
function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: number; note: string }) {
  return <article className="rounded-2xl border border-[#d8e3df] bg-[#fffefa] p-5"><div className="flex items-center justify-between text-[#155e59]"><span className="text-xs font-bold uppercase tracking-wider text-[#6f8981]">{label}</span>{icon}</div><div className="mt-4 font-[Manrope] text-4xl font-extrabold tracking-tight">{value}</div><p className="mt-1 text-xs text-[#789088]">{note}</p></article>;
}
function SectionHeading({ icon, eyebrow, title, detail }: { icon: ReactNode; eyebrow: string; title: string; detail: string }) {
  return <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#dcebe6] text-[#155e59]">{icon}</div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708a83]">{eyebrow}</p><h2 className="mt-1 font-[Manrope] text-xl font-extrabold">{title}</h2><p className="mt-1 text-xs leading-5 text-[#718780]">{detail}</p></div></div>;
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-xs font-bold text-[#365a54]">{label}{children}{hint && <span className="mt-1.5 block text-[11px] font-normal leading-4 text-[#789088]">{hint}</span>}</label>;
}
function InlineNotice({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs leading-5 ${tone === 'error' ? 'bg-[#fbefeb] text-[#854638]' : 'bg-[#e9f4ec] text-[#3b694e]'}`}>
    {tone === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{message}
  </div>;
}
function ErrorPanel({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="rounded-2xl border border-[#e7c6bc] bg-[#fbefeb] p-5 text-sm text-[#854638]"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><strong className="block">Administration data unavailable</strong><p className="mt-1 leading-5">{message}</p></div><button className={secondaryButton} onClick={retry}><RefreshCw className="h-4 w-4" />Retry</button></div></div>;
}
function AccessNotice({ title, description }: { title: string; description: string }) {
  return <section className="mx-auto max-w-2xl rounded-3xl border border-[#d8e3df] bg-[#fffefa] px-6 py-12 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8eeea] text-[#55766d]"><ShieldCheck className="h-6 w-6" /></div><h2 className="mt-4 font-[Manrope] text-xl font-extrabold">{title}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#718780]">{description}</p></section>;
}
function EmptyPanel({ title, detail }: { title: string; detail: string }) {
  return <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#cddbd5] bg-[#f7faf7] p-6 text-center"><div><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#e4eee9] text-[#55766d]"><Building2 className="h-5 w-5" /></div><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[#718780]">{detail}</p></div></div>;
}
function PageSkeleton() {
  return <div aria-label="Loading risk administration access" className="space-y-4"><div className="h-32 animate-pulse rounded-3xl bg-[#dfe9e4]" /><div className="h-14 animate-pulse rounded-2xl bg-[#e5ede8]" /><div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map(item => <div key={item} className="h-32 animate-pulse rounded-2xl bg-[#e5ede8]" />)}</div></div>;
}
