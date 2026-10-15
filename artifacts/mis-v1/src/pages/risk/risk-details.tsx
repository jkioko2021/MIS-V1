import { ArrowUpRight, Search, ShieldAlert, X } from 'lucide-react';
import type { RiskExposureBand, RiskHistoryEvent, RiskRecord, RiskRootCause } from '@workspace/api-client-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { dateLabel, EmptyState, ErrorNotice, Exposure, prettyKey, secondaryButton, SkeletonRows, Snapshot, StatusPill, RiskStatusPill, text } from './risk-ui';

type RiskRecordWithCompletedActions = RiskRecord & { completed_action_count?: number };

export function residualRiskSummary(value: string | null | undefined, bands: RiskExposureBand[]) {
  const score = value == null || !value.trim() ? Number.NaN : Number(value);
  const rounded = Math.round(score * 100) / 100;
  const band = Number.isFinite(score)
    ? bands.find(item => item.risk_type === 'R' && rounded >= item.minimum && rounded <= item.maximum)
    : undefined;
  return band
    ? { label: band.level, description: band.description }
    : { label: Number.isFinite(score) ? 'Unclassified' : 'Not assessed', description: Number.isFinite(score) ? 'No configured residual risk band matches the saved assessment.' : 'Complete the assessment to determine the residual risk level.' };
}

export function RecordsTable({ records, totalRecords, loading, error, retry, onSelect, search, setSearch, title, compact = false, closedView = false, assessmentList = false, exposureBands = [] }: {
  records: RiskRecordWithCompletedActions[]; loading: boolean; error: string; retry: () => void; onSelect: (code: string) => void;
  search: string; setSearch: (value: string) => void; title: string; compact?: boolean; closedView?: boolean;
  assessmentList?: boolean; exposureBands?: RiskExposureBand[]; totalRecords?: number;
}) {
  return <section className="min-w-0 w-full max-w-full rounded-2xl border border-border bg-card">
    <div className="flex flex-col justify-between gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
      <div><h3 className="font-[Manrope] text-lg font-bold">{title}</h3><p className="text-xs text-muted-foreground">{loading || error ? '—' : totalRecords !== undefined && totalRecords > records.length
        ? `Showing ${records.length} of ${totalRecords} matching risks. Narrow the department, period or search to find other records.`
        : `${records.length} record${records.length === 1 ? '' : 's'} in selected scope`}</p></div>
      <label className="relative block sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search risk records" data-testid="input-risk-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title or risk ID" className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2.5 pl-9 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
    </div>
    {closedView && <div className="border-b border-border bg-muted/45 px-4 py-3 text-xs leading-5 text-muted-foreground">
      This view combines risks from archived reporting periods and risks with at least one completed mitigation action. A listed risk does not imply its whole department register is closed.
    </div>}
    <div className={compact ? 'min-w-0 max-w-full max-h-[700px] overflow-y-auto' : 'min-w-0 max-w-full'}>
      {loading ? <div className="p-4"><SkeletonRows /></div> : error ? <div className="p-4"><ErrorNotice message={error} onRetry={retry} /></div> : records.length ? <div className="divide-y divide-border/70">
        {records.map(record => {
          const residual = residualRiskSummary(record.r_risk_exposure, exposureBands);
          return <button key={record.risk_code} onClick={() => onSelect(record.risk_code)} data-testid={`risk-record-${record.risk_code}`} className="group flex min-w-0 w-full max-w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-muted/55">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><ShieldAlert className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-[Space_Mono] text-[10px] text-muted-foreground">{record.risk_code}</span><RiskStatusPill risk={record} /><span className="text-[10px] text-muted-foreground">Register: {record.workflow_status}</span>{!record.assessment_updated && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">Assessment needed</span>}
            {closedView && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${Number(record.completed_action_count ?? 0) > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-700'}`}>
              {Number(record.completed_action_count ?? 0)} completed action{Number(record.completed_action_count ?? 0) === 1 ? '' : 's'}
            </span>}
            {closedView && Number(record.completed_action_count ?? 0) === 0 && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">Archived reporting period</span>}</span>
            <span className="mt-1 block truncate text-sm font-semibold">{record.risk_title}</span>
            <span className="mt-0.5 block break-words text-xs text-muted-foreground">{record.depart_name ?? record.depart_code} · {record.category_name ?? record.risk_category ?? 'Category not set'}{!assessmentList && <> · {dateLabel(record.period_from)} – {dateLabel(record.period_to)}</>}</span>
            {assessmentList && <>
              <span className="mt-2 block line-clamp-2 text-xs leading-5 text-foreground/80">{record.risk_description || record.risk_consequence || 'No risk description recorded.'}</span>
              <span className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">{record.assessment_updated ? 'Residual risk' : 'Last saved residual risk'}</span><span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-primary">{residual.label}</span></span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{residual.description}</span>
            </>}
          </span>
          {!assessmentList && <span className="hidden min-w-20 text-right sm:block"><span className="block font-[Space_Mono] text-lg font-bold">{record.r_risk_exposure ?? '—'}</span><span className="text-[10px] text-muted-foreground">Residual</span></span>}
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>; })}</div> : <div className="p-4"><EmptyState title="No risks in this view" description="New entries will appear here as soon as they are registered for the selected department and period." /></div>}
    </div>
  </section>;
}

type HistoryDisplayEvent = Omit<RiskHistoryEvent, 'depart_code' | 'period_id'> & {
  depart_code: string | null;
  period_id?: number | null;
};

function historyDepartmentLabel(event: HistoryDisplayEvent) {
  if (event.depart_code) return event.depart_code;
  return event.action === 'TEAM_ASSIGNED' ? 'Department mapping' : 'Reporting period';
}
function historyScopeLabel(event: HistoryDisplayEvent) {
  if (event.risk_code) return event.risk_code;
  if (event.period_id != null) return `Period ${event.period_id}`;
  return event.action === 'TEAM_ASSIGNED' ? 'Department mapping' : 'Reporting period';
}

export function RiskDrawer({ riskCode, risk, roots, events, loading, error, onClose, inline = false }: {
  riskCode: string; risk?: RiskRecord; roots: RiskRootCause[]; events: RiskHistoryEvent[]; loading: boolean; error: string; onClose: () => void; inline?: boolean;
}) {
  const content = <>
      <div className="mb-6 flex items-start justify-between gap-4"><div><div className="font-[Space_Mono] text-[10px] text-muted-foreground">{riskCode}</div><h2 className="mt-1 font-[Manrope] text-2xl font-extrabold">{risk?.risk_title ?? 'Risk details'}</h2><p className="mt-1 text-xs text-muted-foreground">{risk?.depart_name ?? risk?.depart_code}</p></div><button className={secondaryButton} onClick={onClose} aria-label="Close risk details"><X className="h-4 w-4" /></button></div>
      {loading ? <SkeletonRows /> : error ? <ErrorNotice message={error} /> : risk ? <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="mb-1 text-xs text-muted-foreground">Risk status</p><RiskStatusPill risk={risk} /></div><div><p className="mb-1 text-xs text-muted-foreground">Register workflow</p><StatusPill status={risk.workflow_status} /></div><span className="font-[Space_Mono] text-xs">Updated {dateLabel(risk.updated_at)}</span></div>
        <section className="rounded-xl border border-border bg-card p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Register details</h3><dl className="grid gap-3 sm:grid-cols-2">{[['Objective', risk.objective_code], ['Category', risk.category_name ?? risk.risk_category], ['Period', `${dateLabel(risk.period_from)} – ${dateLabel(risk.period_to)}`], ['Description', risk.risk_description], ['Consequence', risk.risk_consequence], ['Current controls', risk.current_contr], ['Desired controls', risk.desired_contr_effe]].map(([label, value]) => <div key={String(label)}><dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{text(value)}</dd></div>)}</dl></section>
        <section className="rounded-xl border border-border bg-card p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Assessment snapshot</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[['Impact', risk.i_rate], ['Likelihood', risk.l_rate], ['Perceived historical rate', risk.perceived_rate], ['Control effectiveness', risk.perceived_contr_eff !== undefined ? `${risk.perceived_contr_eff}%` : undefined], ['Inherent exposure', risk.i_risk_exposure], ['Residual exposure', risk.r_risk_exposure]].map(([label, value]) => <Exposure key={String(label)} label={String(label)} value={text(value)} />)}</div><p className="mt-3 text-[10px] text-muted-foreground">Historical perceived rate is shown as stored; it is not interpreted as a current control fraction.</p></section>
        <section className="rounded-xl border border-border bg-card p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Root causes · {roots.length}</h3>{roots.length ? <div className="space-y-3">{roots.map(root => <div key={root.root_id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-3"><strong className="text-sm">{root.root_cause}</strong><StatusPill status={root.action_status} /></div><p className="mt-2 text-xs text-muted-foreground">{root.mitigations || 'No mitigation details recorded.'}</p><p className="mt-2 text-[10px] text-muted-foreground">Owner {root.action_owner ?? '—'} · due {dateLabel(root.due_date ?? undefined)} · controls {root.current_contr ?? '—'}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No root cause recorded.</p>}</section>
        <section className="rounded-xl border border-border bg-card p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">Recent event trail</h3>{events.length ? events.slice(0, 8).map(item => {
          const displayEvent = item as HistoryDisplayEvent;
          return <div key={item.history_id} className="border-t border-border py-3 first:border-0"><div className="flex justify-between gap-2"><strong className="text-xs">{prettyKey(item.action)}</strong><span className="text-[10px] text-muted-foreground">{dateLabel(item.created_at)}</span></div><p className="mt-1 text-xs">{item.comments || 'No comment recorded.'}</p><p className="mt-1 text-[10px] text-muted-foreground">By {item.actor} · {historyDepartmentLabel(displayEvent)} · {historyScopeLabel(displayEvent)}</p></div>;
        }) : <p className="text-sm text-muted-foreground">No risk-specific event history.</p>}</section>
      </div> : <EmptyState title="Record unavailable" description="The selected risk could not be loaded." />}
  </>;
  if (inline) return <section aria-label="Risk record details" data-testid="inline-risk-record-details" className="rounded-2xl border border-border bg-card p-5 sm:p-6">{content}</section>;
  return <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent className="overflow-y-auto bg-background p-5 sm:max-w-2xl sm:p-7" aria-label="Risk record details">
      <SheetHeader className="sr-only"><SheetTitle>Risk record details</SheetTitle><SheetDescription>Assessment, mitigation actions and retained history for {riskCode}.</SheetDescription></SheetHeader>
      {content}
    </SheetContent>
  </Sheet>;
}
