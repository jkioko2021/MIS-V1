import { useState, type ReactNode } from 'react';
import { CalendarDays, ChevronDown, Clock3, History, LockKeyhole, UsersRound } from 'lucide-react';
import type { RiskHistoryEvent, RiskLookup, RiskOptionsResponseData, RiskReadinessResponse, RiskDepartmentSummary } from '@workspace/api-client-react';
import { useRiskReadiness } from './use-risk-register';
import {
  buttonClass, dateLabel, EmptyState, envelopeData, envelopeError, ErrorNotice, Field, fieldClass,
  prettyKey, secondaryButton, SkeletonRows, Snapshot, StatusPill,
} from './risk-ui';

type WorkflowAction = 'SUBMIT' | 'REVIEW' | 'RETURN' | 'SIGN_OFF' | 'CLOSE' | 'REOPEN' | 'PROCESS';

export function WorkflowPanel({ summaries, departments, assignments, period, actor, manage, comments, setComments, mutating, onAction, closeView = false, openView = false }: {
  summaries: RiskDepartmentSummary[]; departments: RiskLookup[]; assignments: RiskLookup[]; period: string; actor?: RiskOptionsResponseData['actor']; manage: boolean;
  comments: string; setComments: (value: string) => void; mutating: boolean; onAction: (action: WorkflowAction, row?: RiskDepartmentSummary) => void; closeView?: boolean; openView?: boolean;
}) {
  const canReview = (row: RiskDepartmentSummary) => manage || Boolean(actor?.owner_departments.includes(row.depart_code));
  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-[Manrope] text-lg font-bold">Department workflow</h3><p className="mt-1 text-xs text-muted-foreground">Actions are recorded with the signed-in MIS identity and retained in event history.</p></div><span className="rounded-md bg-secondary px-2 py-1 font-[Space_Mono] text-[10px] text-primary">PERIOD {period || 'NOT SELECTED'}</span></div>
    {!closeView && !openView && <p className="mb-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">Returning or reopening resets assessment completion for every active risk in that department, including risks with closed actions. Reassess each risk in Update Register before submitting again. Closed actions stay closed; existing scores and rankings remain until an explicit assessment save. History and prior notes are always retained.</p>}
    <Field label="Decision comment (required)"><textarea className={`${fieldClass} mt-2 min-h-16`} value={comments} onChange={event => setComments(event.target.value)} placeholder="Add a concise note that explains the decision." /></Field>
    {!period && <p className="mt-2 text-xs text-amber-800">Choose a reporting period above to enable workflow actions.</p>}
    {!summaries.length ? <div className="mt-4"><EmptyState title="No registers to process" description="Department actions appear once the selected period contains a register." /></div> : <div className="mt-4 divide-y divide-border">
      {summaries.map(row => {
        const submitted = /submit/i.test(row.workflow_status);
        const reviewed = /review/i.test(row.workflow_status);
        const signed = /sign/i.test(row.workflow_status);
        const closed = /closed/i.test(row.workflow_status);
        const readinessKey = `${actor?.username}:${row.depart_code}:${row.period_id ?? period}`;
        const ownerAssigned = assignments.some(item => item.depart_code === row.depart_code && Boolean(item.owner_username));
        return <RiskSubmissionGate key={readinessKey} username={actor?.username ?? ''} departCode={row.depart_code}
          periodId={row.period_id ?? Number(period)} ownerAssigned={ownerAssigned}
          enabled={!closeView && !openView && !submitted && !reviewed && !signed && !closed}>
          {read => {
        const canSubmit = (manage || Boolean(actor?.champion_departments.includes(row.depart_code))) && ownerAssigned && read.ready;
        const disableCommon = !period || !comments.trim() || mutating || !row.depart_code || !row.period_id;
        const actions: Array<{ id: WorkflowAction; label: string; show: boolean; allowed: boolean; reason: string }> = openView ? [
          { id: 'REOPEN', label: 'Reopen register', show: closed, allowed: manage, reason: 'Management only. Workflow flags reset and history remains immutable.' },
        ] : closeView ? [
          { id: 'CLOSE', label: 'Close register', show: signed && !closed && row.total_risks > 0, allowed: manage, reason: 'Management only; requires sign-off and at least one registered risk.' },
          { id: 'REOPEN', label: 'Reopen', show: closed, allowed: manage, reason: 'Management only. History is preserved.' },
        ] : [
          { id: 'SUBMIT', label: 'Submit', show: !submitted && !reviewed && !signed && !closed, allowed: canSubmit, reason: !ownerAssigned ? 'No active owner is mapped. Contact management to assign an owner before submission.' : canSubmit ? 'All active risks are assessed, have a root cause and have an active owner.' : read.label },
          { id: 'REVIEW', label: 'Review', show: submitted, allowed: canReview(row), reason: 'Owner department or management only.' },
          { id: 'RETURN', label: 'Return', show: submitted, allowed: canReview(row), reason: 'Owner department or management only.' },
          { id: 'SIGN_OFF', label: 'Sign off', show: reviewed, allowed: manage, reason: 'Management only; register must be reviewed.' },
          { id: 'PROCESS', label: 'Process rankings', show: reviewed || signed, allowed: manage && Number(row.assessed_risks ?? 0) > 0, reason: 'Management only; rankings can be recomputed after assessment.' },
          { id: 'REOPEN', label: 'Reopen', show: closed, allowed: manage, reason: 'Management only. History is preserved.' },
        ];
        return <div className="py-4">
          <div className="flex flex-col gap-3 pt-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{row.depart_name}</div><div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground"><span>{row.total_risks} risks</span><span>{row.assessed_risks ?? 0} assessed</span><span>{row.open_actions ?? 0} open actions</span><span>{row.overdue_actions ?? 0} overdue</span></div></div>
            <StatusPill status={row.workflow_status} />
            <div className="flex flex-wrap gap-1.5">{actions.filter(item => item.show).map(item => <button key={item.id} title={item.reason} disabled={!item.allowed || disableCommon || !row.period_id} className={item.id === 'RETURN' || item.id === 'REOPEN' ? secondaryButton : buttonClass} onClick={() => onAction(item.id, row)}>{item.label}</button>)}</div>
          </div>
        </div>;
          }}
        </RiskSubmissionGate>;
      })}
    </div>}
    <p className="mt-3 text-[11px] text-muted-foreground">{departments.length} mapped department{departments.length === 1 ? '' : 's'} · disabled actions require their role, register state, period and a comment.</p>
  </section>;
}

type SubmissionScope = {
  username: string; departCode: string; periodId: number; ownerAssigned: boolean; enabled: boolean;
};

export function useSubmissionReadiness({ username, departCode, periodId, ownerAssigned, enabled }: SubmissionScope) {
  const query = useRiskReadiness(username, departCode, periodId, enabled && ownerAssigned);
  return submissionReadiness(query, { username, departCode, periodId, ownerAssigned, enabled });
}

export function submissionReadiness(query: ReturnType<typeof useRiskReadiness>, { username, departCode, periodId, ownerAssigned, enabled }: SubmissionScope) {
  const data = envelopeData<RiskReadinessResponse['data']>(query.data);
  const failed = query.isError || Boolean(query.data && envelopeError(query.data));
  const complete = data?.depart_code === departCode && data.period_id === periodId &&
    [data.active_owner_available, data.owner_email_usable, data.sender_configured].every(flag => typeof flag === 'boolean') &&
    [data.total_active_risks, data.assessed_risks, data.risks_missing_root_causes].every(n => Number.isSafeInteger(n) && n >= 0) &&
    data.assessed_risks <= data.total_active_risks && data.risks_missing_root_causes <= data.total_active_risks;
  const waiting = query.isLoading || query.isFetching || query.isStale || query.isPlaceholderData || query.mutating || !data;
  const ready = Boolean(username && enabled && ownerAssigned && query.isSuccess && query.data?.ok === true &&
    !waiting && !failed && complete && data && data.total_active_risks > 0 &&
    data.active_owner_available && data.assessed_risks === data.total_active_risks && data.risks_missing_root_causes === 0);
  const label = !ownerAssigned ? 'No active owner is mapped for this department. Contact management to assign an owner before submitting.'
    : failed ? 'Could not verify assessment and root-cause readiness. Retry the readiness query.'
      : waiting ? 'Checking active risks and root causes…'
        : !complete ? 'The complete register could not be verified. Retry before submitting.'
        : !data?.active_owner_available ? 'No active owner is mapped for this department. Contact management to assign an owner before submitting.'
        : data?.total_active_risks === 0 ? 'No active risks are available to submit.'
          : ready ? 'All active risks are assessed and have a root cause.'
            : 'Complete every active assessment and add at least one root cause before submitting.';
  return { ready, label, query, failed, waiting, complete, data };
}

export function RiskEmailReadinessNotice({ data, refresh }: {
  data: RiskReadinessResponse['data']; refresh: () => void;
}) {
  if (!data.active_owner_available) return null;
  const warning = !data.owner_email_usable || !data.sender_configured;
  return <div role="status" data-testid="risk-email-readiness" className={`mt-3 rounded-lg px-3 py-2.5 text-xs leading-5 ${warning ? 'bg-amber-50 text-amber-950' : 'bg-muted text-muted-foreground'}`}>
    <strong>{warning ? 'Email setup needs attention — submission is still available.' : 'Email setup is ready for queuing.'}</strong>
    {!data.owner_email_usable && <p>The mapped active Risk Owner has no usable email address. Ask an administrator to correct the owner’s account email.</p>}
    {!data.sender_configured && <p>The global email sender (MIS_EMAIL_FROM) is missing. Ask an administrator to configure a verified sender.</p>}
    <p>Your register will remain saved when submitted, even if email cannot be sent. The notice is queued and waits for missing setup to be corrected while the submission remains available for review. Provider acceptance is not confirmation of inbox delivery.</p>
    <button type="button" className="mt-1 font-bold underline" onClick={refresh}>Refresh email setup check</button>
  </div>;
}

export function RiskSubmissionGate({ children, ...scope }: SubmissionScope & {
  children?: (readiness: { ready: boolean; label: string }) => ReactNode;
}) {
  const { ready, label, query, failed, waiting, complete, data } = useSubmissionReadiness(scope);
  const { enabled, departCode } = scope;
  return <>{enabled && <div className={`flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-[11px] ${ready ? 'bg-emerald-50 text-emerald-900' : failed ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-900'}`} data-testid={`submit-readiness-${departCode}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-emerald-600' : failed ? 'bg-rose-600' : 'bg-amber-600'}`} />{label}
    {(failed || (!waiting && !complete)) && <button className="font-bold underline" onClick={() => query.refetch()}>Retry</button>}
  </div>}{enabled && complete && !failed && !waiting && data && <RiskEmailReadinessNotice data={data} refresh={() => { void query.refetch(); }} />}{children?.({ ready, label })}</>;
}

export function SummaryTable({ rows, loading, error, retry, title = 'Department exposure & sign-off' }: { rows: RiskDepartmentSummary[]; loading: boolean; error: string; retry: () => void; title?: string }) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Read-only MIS status</p><h3 className="mt-1 font-[Manrope] text-xl font-bold">{title}</h3></div>
    {loading ? <div className="p-4"><SkeletonRows /></div> : error ? <div className="p-4"><ErrorNotice message={error} onRetry={retry} /></div> : rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground"><tr>{['Department', 'Period', 'Exposure · avg / max', 'Assessed', 'Open actions', 'Overdue', 'Workflow'].map(label => <th key={label} className="px-4 py-3 font-bold">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map(row => <tr key={`${row.depart_code}:${row.period_id}`} data-testid={`summary-department-${row.depart_code}-${row.period_id}`}><td className="px-4 py-4"><strong>{row.depart_name}</strong><div className="font-[Space_Mono] text-[10px] text-muted-foreground">{row.depart_code}</div></td><td className="px-4 py-4 text-xs">{dateLabel(row.period_from)} – {dateLabel(row.period_to)}</td><td className="px-4 py-4 font-[Space_Mono] text-xs">{row.avg_exposure ?? '—'} <span className="text-muted-foreground">/</span> {row.max_exposure ?? '—'}</td><td className="px-4 py-4">{row.assessed_risks ?? 0} <span className="text-muted-foreground">/ {row.total_risks}</span></td><td className="px-4 py-4">{row.open_actions ?? 0}</td><td className="px-4 py-4">{row.overdue_actions ?? 0}</td><td className="px-4 py-4"><StatusPill status={row.workflow_status} /></td></tr>)}</tbody></table></div> : <div className="p-4"><EmptyState title="No summaries available" description="The selected period has no department summary data." /></div>}
    {!loading && !error && rows.some(row => row.review_email_status) && <div className="border-t border-border p-4 text-xs" aria-label="Risk Owner email delivery">
      <h4 className="mb-2 font-semibold">Risk Owner email delivery</h4>
      {rows.filter(row => row.review_email_status).map(row => <div key={`${row.depart_code}:${row.period_id}`} className="mb-2">
        <strong>{row.depart_name}</strong> · {dateLabel(row.period_from)} – {dateLabel(row.period_to)}: {reviewEmailLabel(row.review_email_status)}
        {row.review_email_error && <p className="mt-1 text-muted-foreground">{row.review_email_error}</p>}
      </div>)}
      <p className="text-muted-foreground">Email delivery is separate from the saved register submission.</p>
    </div>}
  </section>;
}

function reviewEmailLabel(status: string | null | undefined) {
  return ({
    PENDING: 'Email queued.',
    WAITING_CONFIGURATION: 'Not sent: verified email sender is not configured.',
    NO_RECIPIENT: 'Not sent: owner email address is missing or invalid.',
    SENT: 'Email accepted by the provider.',
    RETRY: 'Email delivery failed; an automatic retry is scheduled.',
    FAILED: 'Email delivery failed after five attempts.',
    CANCELLED: 'Not sent: owner authorization or review availability changed.',
  } as Record<string, string>)[status ?? ''] ?? 'Delivery status unavailable.';
}

export function OpenPeriods({ options, manage, mutating, onOpen }: { options: RiskOptionsResponseData; manage: boolean; mutating: boolean; onOpen: (data: { period_from: string; period_to: string; source_period_id?: number }) => void }) {
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [source, setSource] = useState('');
  const valid = Boolean(from && to && from <= to && manage);
  return <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
    <form className="rounded-2xl border border-border bg-card p-5" onSubmit={event => { event.preventDefault(); if (valid) onOpen({ period_from: from, period_to: to, ...(source ? { source_period_id: Number(source) } : {}) }); }}>
      <div className="mb-5 flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><CalendarDays className="h-5 w-5" /></div><div><h3 className="font-[Manrope] text-lg font-bold">Open a reporting period</h3><p className="mt-1 text-xs text-muted-foreground">Management can open a period and optionally carry forward a source register.</p></div></div>
      <div className="space-y-4"><Field label="Period begins"><input className={fieldClass} type="date" value={from} onChange={event => setFrom(event.target.value)} required /></Field><Field label="Period ends"><input className={fieldClass} type="date" value={to} onChange={event => setTo(event.target.value)} required /></Field>
        <Field label="Carry forward from (optional)"><select className={fieldClass} value={source} onChange={event => setSource(event.target.value)}><option value="">Start without carry-forward</option>{options.periods.map((item, index) => <option key={item.period_id ?? index} value={String(item.period_id ?? '')}>{dateLabel(item.period_from)} – {dateLabel(item.period_to)} · {item.status}</option>)}</select></Field></div>
      {!manage && <p className="mt-3 text-xs text-amber-800">Management access is required to open periods.</p>}
      {from && to && from > to && <p className="mt-3 text-xs text-destructive">The end date must be on or after the start date.</p>}
      <button className={`${buttonClass} mt-5 w-full`} disabled={!valid || mutating}><CalendarDays className="h-4 w-4" />Open reporting period</button>
    </form>
    <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4"><h3 className="font-[Manrope] text-lg font-bold">Period register</h3><p className="mt-1 text-xs text-muted-foreground">Period status and range from the MIS register configuration.</p></div>
      {options.periods.length ? <div className="divide-y divide-border">{options.periods.map((item, index) => <div key={item.period_id ?? index} className="flex items-center gap-3 py-4"><div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-primary"><Clock3 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><strong className="block text-sm">{dateLabel(item.period_from)} – {dateLabel(item.period_to)}</strong><span className="text-xs text-muted-foreground">Period {item.period_id}</span></div><StatusPill status={item.status} /></div>)}</div> : <EmptyState title="No reporting periods" description="Periods will appear here after management opens one." />}
    </section>
  </section>;
}

export function ReportingPeriodClose({ periods, summaries, summaryLoading, summaryError, selectedPeriod, setSelectedPeriod, comments, setComments, manage, mutating, onClose }: {
  periods: RiskLookup[]; summaries: RiskDepartmentSummary[]; summaryLoading: boolean; summaryError: string; selectedPeriod: string; setSelectedPeriod: (value: string) => void; comments: string;
  setComments: (value: string) => void; manage: boolean; mutating: boolean; onClose: (periodId: number, comment: string) => void;
}) {
  const selected = periods.find(item => String(item.period_id) === selectedPeriod);
  const registered = summaries.filter(row => row.total_risks > 0);
  const allSigned = registered.length > 0 && registered.every(row => /sign|closed/i.test(row.workflow_status));
  const allowed = manage && !summaryLoading && !summaryError && Boolean(selected?.period_id) && String(selected?.status).toLowerCase() === 'open' && allSigned && Boolean(comments.trim()) && !mutating;
  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-800"><LockKeyhole className="h-5 w-5" /></div><div><h3 className="font-[Manrope] text-lg font-bold">Close reporting period</h3><p className="mt-1 text-xs text-muted-foreground">This is separate from closing an individual department register.</p></div></div>
    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
      <Field label="Reporting period"><select className={fieldClass} value={selectedPeriod} onChange={event => setSelectedPeriod(event.target.value)}><option value="">Select a period</option>{periods.map((item, index) => <option key={item.period_id ?? index} value={String(item.period_id ?? '')}>{dateLabel(item.period_from)} – {dateLabel(item.period_to)} · {item.status}</option>)}</select></Field>
      <Field label="Close note (required)"><input className={fieldClass} value={comments} onChange={event => setComments(event.target.value)} placeholder="Document the reporting close." /></Field>
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-800 px-4 text-sm font-semibold text-white hover:bg-rose-900 disabled:pointer-events-none disabled:opacity-45" disabled={!allowed} onClick={() => selected?.period_id && onClose(Number(selected.period_id), comments.trim())}><LockKeyhole className="h-4 w-4" />Close period</button>
    </div>
    {summaryError && <div className="mt-3"><ErrorNotice message={summaryError} /></div>}
    <div className={`mt-4 rounded-lg px-3 py-2 text-xs ${allSigned ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>{summaryLoading ? 'Checking departmental sign-off…' : !registered.length ? 'This period has no registered risks and cannot be closed.' : allSigned ? 'Every department with registered risks is signed off.' : 'Available after every department with registered risks has signed off.'} {!manage && ' Management access is required.'}</div>
  </section>;
}

type HistoryDisplayEvent = Omit<RiskHistoryEvent, 'depart_code' | 'period_id'> & {
  depart_code: string | null;
  period_id?: number | null;
};
function eventDepartmentLabel(event: HistoryDisplayEvent) {
  if (event.depart_code) return event.depart_code;
  return event.action === 'TEAM_ASSIGNED' ? 'Department mapping' : 'Reporting period';
}
function eventScopeLabel(event: HistoryDisplayEvent) {
  if (event.risk_code) return event.risk_code;
  if (event.period_id != null) return `Period ${event.period_id}`;
  return event.action === 'TEAM_ASSIGNED' ? 'Department mapping' : 'Reporting period';
}

export function HistoryTable({ events, loading, error, retry }: { events: RiskHistoryEvent[]; loading: boolean; error: string; retry: () => void }) {
  const [expanded, setExpanded] = useState('');
  return <section className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><div className="flex items-center gap-2 text-primary"><History className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Append-only record</span></div><h3 className="mt-1 font-[Manrope] text-xl font-bold">Risk event history</h3><p className="mt-1 text-xs text-muted-foreground">Decision actor, comments and point-in-time snapshots. Events are presented as received and cannot be edited here.</p></div>
    {loading ? <div className="p-4"><SkeletonRows /></div> : error ? <div className="p-4"><ErrorNotice message={error} onRetry={retry} /></div> : events.length ? <div className="divide-y divide-border">{events.map(event => {
      const displayEvent = event as HistoryDisplayEvent;
      return <article key={event.history_id} className="p-4 sm:px-5" data-testid={`history-event-${event.history_id}`}><div className="flex flex-wrap items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-primary"><History className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><strong className="text-sm">{prettyKey(event.action)}</strong><span className="font-[Space_Mono] text-[10px] text-muted-foreground">{event.history_id}</span></div><p className="mt-1 text-xs">{event.comments || 'No comment recorded.'}</p><p className="mt-1 text-[10px] text-muted-foreground">{event.actor} · {eventDepartmentLabel(displayEvent)} · {dateLabel(event.created_at)} · {eventScopeLabel(displayEvent)}</p></div><button className={secondaryButton} onClick={() => setExpanded(expanded === event.history_id ? '' : event.history_id)}>{expanded === event.history_id ? 'Hide snapshot' : 'View snapshot'}<ChevronDown className={`h-3.5 w-3.5 transition ${expanded === event.history_id ? 'rotate-180' : ''}`} /></button></div>
        {expanded === event.history_id && <div className="ml-11 mt-3"><Snapshot value={event.snapshot} /></div>}</article>;
    })}</div> : <div className="p-4"><EmptyState title="No history for this selection" description="Workflow and assessment decisions will appear as timestamped events." /></div>}
  </section>;
}

export function TeamMapping({ options, manage, mutating, onAssign }: { options: RiskOptionsResponseData; manage: boolean; mutating: boolean; onAssign: (data: { depart_code: string; champion_username: string; owner_username: string }) => void }) {
  const [department, setDepartment] = useState(''); const [champion, setChampion] = useState(''); const [owner, setOwner] = useState('');
  const mappings = options.assignments ?? [];
  return <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
    <form className="rounded-2xl border border-border bg-card p-5" onSubmit={event => { event.preventDefault(); if (manage && department && champion && owner) onAssign({ depart_code: department, champion_username: champion, owner_username: owner }); }}>
      <div className="mb-5"><div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><UsersRound className="h-5 w-5" /></div><h3 className="font-[Manrope] text-lg font-bold">Department responsibility</h3><p className="mt-1 text-xs text-muted-foreground">Assign active champion and owner MIS accounts for a department.</p></div>
      <div className="space-y-4"><Field label="Department"><select className={fieldClass} value={department} onChange={event => setDepartment(event.target.value)} required><option value="">Select department</option>{options.departments.map((item, index) => <option key={item.depart_code ?? index} value={item.depart_code ?? ''}>{item.depart_name ?? item.depart_code}</option>)}</select></Field>
        <Field label="Champion account"><select className={fieldClass} value={champion} onChange={event => setChampion(event.target.value)} required><option value="">Select champion</option>{options.staff.map((item, index) => <option key={item.username ?? index} value={item.username ?? ''}>{item.employee_name ?? item.username} · {item.username}</option>)}</select></Field>
        <Field label="Owner account"><select className={fieldClass} value={owner} onChange={event => setOwner(event.target.value)} required><option value="">Select owner</option>{options.staff.map((item, index) => <option key={item.username ?? index} value={item.username ?? ''}>{item.employee_name ?? item.username} · {item.username}</option>)}</select></Field></div>
      {!manage && <p className="mt-3 text-xs text-amber-800">Management access is required to change assignments.</p>}
      <button className={`${buttonClass} mt-5 w-full`} disabled={!manage || !department || !champion || !owner || mutating}><UsersRound className="h-4 w-4" />Save mapping</button>
    </form>
    <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4"><h3 className="font-[Manrope] text-lg font-bold">Current mapping</h3><p className="mt-1 text-xs text-muted-foreground">Scope provided by MIS risk register options.</p></div>
      {mappings.length ? <div className="divide-y divide-border">{mappings.map((item, index) => <div key={`${item.depart_code}-${index}`} className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr_1fr]"><div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department</div><strong className="text-sm">{options.departments.find(dept => dept.depart_code === item.depart_code)?.depart_name ?? item.depart_code}</strong></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Champion</div><strong className="text-sm">{item.champion_username ?? '—'}</strong></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Owner</div><strong className="text-sm">{item.owner_username ?? '—'}</strong></div></div>)}</div> : <EmptyState title="No assignments returned" description="Ask an administrator to configure department responsibility. Existing access remains unchanged." />}
    </section>
  </section>;
}
