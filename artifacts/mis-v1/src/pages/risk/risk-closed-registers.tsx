import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, History, LockKeyhole, Search, X } from 'lucide-react';
import type { ClosedRiskRegister, RiskOptionsResponseData, RiskRecord } from '@workspace/api-client-react';
import { useClosedRiskRegisters, useHistoricalDepartmentRisks, useOpenDepartmentCycle } from './use-risk-register';
import { dateLabel, EmptyState, envelopeData, envelopeError, ErrorNotice, Field, fieldClass, queryError, RiskStatusPill, SkeletonRows, StatusPill } from './risk-ui';

type Props = {
  username: string;
  department: string;
  period: string;
  options: RiskOptionsResponseData;
  manage: boolean;
  onSelect: (riskCode: string) => void;
  mode: 'open' | 'history';
};

function useDialogLifecycle(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialogRef.current) {
        const nodes = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus();
    };
  }, [onClose]);
  return dialogRef;
}

function Modal({ title, subtitle, onClose, children, testId }: { title: string; subtitle: string; onClose: () => void; children: ReactNode; testId: string }) {
  const ref = useDialogLifecycle(onClose);
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`${testId}-title`} tabIndex={-1} data-testid={testId}
      className="max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl outline-none sm:rounded-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-border bg-muted/35 px-5 py-4 sm:px-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-primary">Department cycle archive</p><h2 id={`${testId}-title`} className="mt-1 font-[Manrope] text-xl font-bold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div>
        <button type="button" onClick={onClose} aria-label="Close dialog" data-testid={`button-close-${testId}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
      </header>
      <div className="max-h-[calc(92dvh-94px)] overflow-y-auto p-5 sm:p-6">{children}</div>
    </div>
  </div>;
}

export default function RiskClosedRegisters({ username, department, period, options, manage, onSelect, mode }: Props) {
  const params = useMemo(() => ({ ...(department ? { depart_code: department } : {}), ...(period ? { period_id: Number(period) } : {}) }), [department, period]);
  const query = useClosedRiskRegisters(username, params, Boolean(username));
  const rows = envelopeData<ClosedRiskRegister[]>(query.data) ?? [];
  const failure = envelopeError(query.data) || (query.isError ? queryError(query.error) : '');
  const [selected, setSelected] = useState<ClosedRiskRegister | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [comments, setComments] = useState('');
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState<{ carried: number; historical: number; period: number; email?: string } | null>(null);
  const opener = useOpenDepartmentCycle();
  useEffect(() => {
    setSelected(null); setSearch(''); setPage(1); setTarget(''); setFrom(''); setTo(''); setComments(''); setFormError(''); setResult(null);
  }, [username, department, period, mode]);
  const close = useCallback(() => { setSelected(null); setResult(null); setFormError(''); }, []);
  const historical = useHistoricalDepartmentRisks(username, {
    depart_code: selected?.depart_code ?? '',
    period_id: selected?.period_id ?? 0,
    page,
    page_size: 10,
    ...(search.trim() ? { search: search.trim() } : {}),
  }, Boolean(selected && (mode === 'history' || !result)));
  const historicalData = envelopeData<{ records: RiskRecord[]; total: number; page: number; page_size: number }>(historical.data);
  const historicalFailure = envelopeError(historical.data) || (historical.isError ? queryError(historical.error) : '');
  const laterPeriods = useMemo(() => options.periods.filter(item =>
    String(item.status ?? '').toLowerCase() === 'open'
    && Boolean(item.period_id)
    && Boolean(item.period_from)
    && String(item.period_from) > (selected?.period_to ?? '')
  ), [options.periods, selected]);
  const canCreate = Boolean(from && to && from <= to && from > (selected?.period_to ?? ''));
  const canSubmit = Boolean(manage && selected?.can_open && selected.historical === false && selected.workflow_status === 'CLOSED'
    && comments.trim() && !opener.isPending && ((target && laterPeriods.some(p => String(p.period_id) === target)) || (!target && canCreate)));
  const submit = () => {
    if (!selected || !canSubmit) return;
    setFormError('');
    const data = {
      source_period_id: selected.period_id,
      ...(target ? { target_period_id: Number(target) } : { period_from: from, period_to: to }),
      comments: comments.trim(),
    };
    opener.mutate({ departCode: selected.depart_code, data }, {
      onSuccess: response => {
        const error = envelopeError(response);
        if (error) { setFormError(error); return; }
        const payload = envelopeData<{ carried_risks: number; historical_risks: number; target_period_id: number; notification?: { email_status: string } }>(response);
        if (!payload) { setFormError('The cycle was not confirmed by the server. Refresh and check the register before trying again.'); return; }
        setResult({ carried: payload.carried_risks, historical: payload.historical_risks, period: payload.target_period_id, email: payload.notification?.email_status });
        setPage(1);
      },
      onError: error => setFormError(queryError(error)),
    });
  };
  const departmentRows = rows.filter(row => !department || row.depart_code === department);
  const openRows = departmentRows.filter(row => row.historical === false);
  const historyRows = departmentRows.filter(row => row.historical === true);
  const readyCount = openRows.filter(row => row.can_open && row.workflow_status === 'CLOSED').length;
  const displayed = mode === 'open' ? [...openRows, ...historyRows] : departmentRows;

  return <section className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="border-b border-border bg-gradient-to-r from-primary/[0.07] via-transparent to-transparent p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-2 text-primary"><History className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.17em]">{mode === 'open' ? 'New department cycle' : 'Append-only archive'}</span></div>
          <h3 className="mt-2 font-[Manrope] text-xl font-bold">{mode === 'open' ? 'Closed departmental registers' : 'Historical department registers'}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{mode === 'open'
            ? 'Start a fresh cycle from an eligible closed register. Earlier cycles remain closed, unchanged and available to view.'
            : 'Browse the risk records held by each closed department cycle. Historical decisions and event trails remain read-only.'}</p>
        </div>
        <div className="flex gap-2 text-[10px] font-semibold">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-900">{readyCount} ready to open</span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">{historyRows.length} historical</span>
        </div>
      </div>
    </div>
    {query.isLoading ? <div className="p-5"><SkeletonRows /></div> : failure ? <div className="p-5"><ErrorNotice message={failure} onRetry={() => query.refetch()} /></div> : displayed.length ? <div className="divide-y divide-border">
      {displayed.map(row => {
        const ready = row.historical === false && row.can_open && row.workflow_status === 'CLOSED';
        return <article key={`${row.depart_code}:${row.period_id}`} data-testid={`closed-register-${row.depart_code}-${row.period_id}`} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{row.depart_name}</strong><span className="font-[Space_Mono] text-[10px] text-muted-foreground">{row.depart_code}</span><StatusPill status={row.workflow_status} />{ready ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Ready for next cycle</span> : row.historical ? <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">Historical · read only</span> : <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">Closed · not eligible to open</span>}</div>
            <div className="mt-1.5 text-xs text-muted-foreground">Period {row.period_id} · {dateLabel(row.period_from)} – {dateLabel(row.period_to)}</div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px]"><span><b>{row.total_risks}</b> total risks</span><span className="text-emerald-800"><b>{row.open_risks}</b> ongoing</span><span className="text-muted-foreground"><b>{row.closed_risks}</b> closed</span></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {mode === 'open' && ready && manage && <button type="button" onClick={() => { setSelected(row); setSearch(''); setPage(1); setTarget(''); setFrom(''); setTo(''); setComments(''); setResult(null); }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-105" data-testid={`button-open-cycle-${row.depart_code}-${row.period_id}`}><CalendarDays className="h-3.5 w-3.5" />Open next cycle</button>}
            {mode === 'open' && ready && !manage && <span className="self-center text-[11px] text-muted-foreground">Management access required to open</span>}
            <button type="button" onClick={() => { setSelected(row); setSearch(''); setPage(1); setResult(null); }} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs font-semibold hover:bg-muted" data-testid={`button-view-risks-${row.depart_code}-${row.period_id}`}><History className="h-3.5 w-3.5" />View risks</button>
          </div>
        </article>;
      })}
    </div> : <div className="p-5"><EmptyState title={mode === 'open' ? 'No closed registers in this scope' : 'No historical registers found'} description={mode === 'open' ? 'Closed departmental cycles will appear here after register close. Select a department or period filter to narrow the list.' : 'The current department and period filters have no closed cycles to browse.'} /></div>}

    {selected && <Modal title={result ? 'Department cycle opened' : `Period ${selected.period_id} · ${selected.depart_name}`} subtitle={`${dateLabel(selected.period_from)} – ${dateLabel(selected.period_to)} · Previous cycle remains closed and read-only`} onClose={close} testId="dialog-department-cycle">
      {result ? <div className="space-y-4">
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><strong>New cycle created for period {result.period}.</strong><p className="mt-1">Ongoing risks and their action plans were carried forward for fresh assessment. Closed risks remain in this historical register.</p><p className="mt-2 text-xs">{result.carried} carried forward · {result.historical} retained as history</p></div>
        {result.email && <p role="status" className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          {result.email === 'PENDING'
            ? 'Email notification queued for the department’s Risk Champion, with the Risk Owner copied. Provider acceptance and inbox delivery are not yet confirmed.'
            : 'The register is open, but email notification needs attention. Check the assigned Champion and Risk Owner email details, verified sender, and published application URL.'}
        </p>}
        <div className="flex justify-end"><button type="button" onClick={close} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Done</button></div>
      </div> : <div className="space-y-6">
        {mode === 'open' && selected.can_open && !selected.historical && manage && <section className="rounded-xl border border-border bg-muted/25 p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary"><CalendarDays className="h-4 w-4" /></div><div><h3 className="font-[Manrope] text-base font-bold">Open a new department cycle</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">This creates a new register. It does not reopen or reset the selected closed register.</p></div></div>
          {laterPeriods.length ? <Field label="Later open reporting period"><select className={fieldClass} value={target} onChange={event => { setTarget(event.target.value); setFrom(''); setTo(''); }} data-testid="select-cycle-target-period"><option value="">Create a new reporting period instead</option>{laterPeriods.map(item => <option key={item.period_id} value={String(item.period_id)}>{dateLabel(item.period_from)} – {dateLabel(item.period_to)} · Period {item.period_id}</option>)}</select></Field> : <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">No available OPEN reporting period starts after this register ends. Create a later period below.</p>}
          {!target && <div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="New period starts"><input type="date" className={fieldClass} value={from} min={selected.period_to} onChange={event => setFrom(event.target.value)} data-testid="input-cycle-period-from" required /></Field><Field label="New period ends"><input type="date" className={fieldClass} value={to} min={from || selected.period_to} onChange={event => setTo(event.target.value)} data-testid="input-cycle-period-to" required /></Field></div>}
          {!target && from && from <= selected.period_to && <p className="mt-2 text-xs text-destructive">The new period must begin after the source register ends.</p>}
          {!target && from && to && from > to && <p className="mt-2 text-xs text-destructive">The end date must be on or after the start date.</p>}
          {!target && from && to && canCreate && <p className="mt-2 text-[11px] text-muted-foreground">The server checks that the new date range does not overlap another reporting period.</p>}
          <Field label="Decision comment (required)"><textarea className={`${fieldClass} min-h-20 resize-y`} value={comments} onChange={event => setComments(event.target.value)} placeholder="Explain why this department is starting its next cycle." data-testid="input-cycle-decision-comment" /></Field>
          {formError && <div className="mt-3"><ErrorNotice message={formError} /></div>}
          <div className="mt-4 flex justify-end"><button type="button" onClick={submit} disabled={!canSubmit} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-confirm-open-cycle">{opener.isPending ? <Clock3 className="h-4 w-4 animate-pulse" /> : <LockKeyhole className="h-4 w-4" />}{opener.isPending ? 'Opening cycle…' : 'Open department cycle'}</button></div>
        </section>}
        {mode === 'open' && (!selected.can_open || selected.historical || !manage) && <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{selected.historical ? 'This is a historical register and cannot be opened again.' : !selected.can_open ? 'This department is not eligible to open a new cycle from this register.' : 'Management access is required to start a new department cycle.'}</div>}
        <section>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h3 className="font-[Manrope] text-base font-bold">Risks in this closed register</h3><p className="mt-1 text-xs text-muted-foreground">Select a risk to inspect its saved ranking, root action plans and append-only event history.</p></div>
            <label className="relative block sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} aria-label="Search historical risks" placeholder="Search title or risk ID" className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-historical-risk-search" /></label>
          </div>
          {historical.isLoading ? <div className="mt-4"><SkeletonRows /></div> : historicalFailure ? <div className="mt-4"><ErrorNotice message={historicalFailure} onRetry={() => historical.refetch()} /></div> : historicalData?.records.length ? <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {historicalData.records.map(risk => <button type="button" key={risk.risk_code} onClick={() => { close(); onSelect(risk.risk_code); }} className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/45 sm:px-4" data-testid={`historical-risk-${risk.risk_code}`}>
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-[Space_Mono] text-[10px] text-muted-foreground">{risk.risk_code}</span><RiskStatusPill risk={risk} /></span><span className="mt-1 block truncate text-sm font-semibold">{risk.risk_title}</span><span className="mt-1 block text-[10px] text-muted-foreground">Inherent {risk.i_risk_exposure ?? '—'} · Residual {risk.r_risk_exposure ?? '—'} · {risk.root_cause_count ?? 0} root action plans</span></span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>)}
          </div> : <div className="mt-4"><EmptyState title={search ? 'No matching risks' : 'No risks in this register'} description={search ? 'Try a different risk title or code.' : 'This closed register contains no historical risk records.'} /></div>}
          {historicalData && historicalData.total > historicalData.page_size && <div className="mt-3 flex items-center justify-between text-xs"><span className="text-muted-foreground">Page {historicalData.page} of {Math.ceil(historicalData.total / historicalData.page_size)} · {historicalData.total} risks</span><div className="flex gap-2"><button type="button" aria-label="Previous page" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1 || historical.isFetching} className="rounded-md border border-border p-2 disabled:opacity-40" data-testid="button-history-page-prev"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Next page" onClick={() => setPage(value => value + 1)} disabled={page >= Math.ceil(historicalData.total / historicalData.page_size) || historical.isFetching} className="rounded-md border border-border p-2 disabled:opacity-40" data-testid="button-history-page-next"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </section>
      </div>}
    </Modal>}
  </section>;
}
