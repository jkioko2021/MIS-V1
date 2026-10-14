import type { RiskAnalyticsResponseData } from '@workspace/api-client-react';
import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardCheck,
  FileWarning,
  Layers3,
  ShieldAlert,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ErrorNotice, EmptyState } from './risk-ui';
import RiskTopTen from './risk-top-ten';

type Props = {
  overallAccess: boolean;
  data?: RiskAnalyticsResponseData;
  loading: boolean;
  error: string;
  retry: () => void;
  onSelect: (riskCode: string) => void;
};

type Band = 'Critical' | 'High' | 'Medium' | 'Low' | 'Unranked';

const bandPalette: Record<Band, { cell: string; label: string; dot: string }> = {
  Critical: { cell: 'border-rose-300 bg-rose-100 text-rose-950', label: 'bg-rose-100 text-rose-900', dot: 'bg-rose-600' },
  High: { cell: 'border-orange-300 bg-orange-100 text-orange-950', label: 'bg-orange-100 text-orange-900', dot: 'bg-orange-600' },
  Medium: { cell: 'border-amber-300 bg-amber-100 text-amber-950', label: 'bg-amber-100 text-amber-900', dot: 'bg-amber-600' },
  Low: { cell: 'border-teal-300 bg-teal-100 text-teal-950', label: 'bg-teal-100 text-teal-900', dot: 'bg-teal-700' },
  Unranked: { cell: 'border-slate-300 bg-slate-100 text-slate-700', label: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
};

function bandForCell(ranking: string): Band {
  const normalized = ranking.toLowerCase();
  if (normalized === 'critical') return 'Critical';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return 'Unranked';
}

function numberLabel(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? 'Not available' : value.toLocaleString();
}

function exposureLabel(value: number | null | undefined) {
  return value == null || !Number.isFinite(value)
    ? 'Not available'
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function dateTimeLabel(value?: string) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function bandText(value?: string | null): Band {
  const match = ['Critical', 'High', 'Medium', 'Low'].find(item => item.toLowerCase() === value?.toLowerCase());
  return (match as Band | undefined) ?? 'Unranked';
}

function Panel({ title, eyebrow, icon: Icon, children, className = '' }: {
  title: string;
  eyebrow?: string;
  icon: typeof Activity;
  children: ReactNode;
  className?: string;
}) {
  return <section className={`min-w-0 rounded-2xl border border-border bg-card shadow-[0_12px_40px_-32px_rgba(32,52,58,0.42)] ${className}`}>
    <div className="flex items-start gap-3 border-b border-border/80 px-4 py-4 sm:px-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
        <h2 className="font-[Manrope] text-base font-extrabold tracking-tight text-foreground sm:text-lg">{title}</h2>
      </div>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>;
}

function Metric({ label, value, detail, tone = 'neutral', icon: Icon }: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'rose' | 'amber' | 'teal';
  icon: typeof Activity;
}) {
  const tones = {
    neutral: 'border-border bg-card text-primary',
    rose: 'border-rose-200 bg-rose-50/80 text-rose-700',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-800',
    teal: 'border-teal-200 bg-teal-50/80 text-teal-800',
  };
  return <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_32px_-30px_rgba(25,51,59,0.65)] sm:p-5">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{label}</span>
      <span className={`grid h-8 w-8 place-items-center rounded-lg border ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
    </div>
    <div className="mt-3 font-[Space_Mono] text-2xl font-bold tracking-tight text-foreground sm:text-[1.8rem]">{value}</div>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
  </div>;
}

function MetricSkeleton() {
  return <div className="space-y-3" aria-label="Loading risk analytics">
    <div className="h-24 animate-pulse rounded-2xl bg-muted" />
    <div className="h-24 animate-pulse rounded-2xl bg-muted" />
    <div className="h-24 animate-pulse rounded-2xl bg-muted" />
  </div>;
}

function RiskAction({ code, onSelect }: { code: string; onSelect: (code: string) => void }) {
  return <button type="button" onClick={() => onSelect(code)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-primary/40 hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
    View risk <ArrowUpRight className="h-3.5 w-3.5" />
  </button>;
}

export default function RiskDashboard({ data, loading, error, retry, onSelect, overallAccess }: Props) {
  const [selectedCell, setSelectedCell] = useState<{ impact: number; likelihood: number } | null>(null);
  const cells = useMemo(() => data?.heatmap ?? [], [data?.heatmap]);
  const selectedCellData = selectedCell
    ? cells.find(cell => cell.impact === selectedCell.impact && cell.likelihood === selectedCell.likelihood)
    : undefined;
  const selectedCellRisks = selectedCell
    ? (data?.priorities ?? []).filter(risk =>
      risk.impact_ordinal === selectedCell.impact && risk.likelihood_ordinal === selectedCell.likelihood)
    : [];
  const rankedPriorities = useMemo(() => data?.priorities ?? [], [data?.priorities]);
  const totals = data?.totals;

  if (loading) {
    return <main className="min-h-[50vh] space-y-5" aria-busy="true" aria-label="Loading risk analytics">
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /></div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]"><div className="h-[430px] animate-pulse rounded-2xl bg-muted" /><div className="h-[430px] animate-pulse rounded-2xl bg-muted" /></div>
    </main>;
  }

  if (error) return <main className="min-h-[50vh] py-4"><ErrorNotice message={error} onRetry={retry} /></main>;
  if (!data) return <main className="min-h-[50vh] py-4"><EmptyState title="Risk analytics are unavailable" description="No analytics response was returned for the selected department and reporting period." /></main>;

  const total = totals?.total_risks;
  const assessed = totals?.assessed_risks;
  const openActions = totals?.open_actions;
  const exposure = totals?.avg_residual_exposure;
  const heatmapCount = cells.reduce((sum, cell) => sum + cell.count, 0);
  const priorityCountInCell = selectedCellRisks.length;
  const rankingRows = data.rankings ?? [];
  const maxRankingCount = Math.max(1, ...rankingRows.map(item => item.count));
  const maxDepartmentCount = Math.max(1, ...(data.departments ?? []).map(item => item.total));
  const maxCategoryCount = Math.max(1, ...(data.categories ?? []).map(item => item.count));
  const maxWorkflowCount = Math.max(1, ...(data.workflows ?? []).map(item => item.count));
  const hasAnyRisks = (total ?? 0) > 0;

  const topMetric = <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <Metric label="Registered risks" value={numberLabel(total)} detail={`${numberLabel(totals?.open_risks)} open · ${numberLabel(totals?.closed_risks)} closed`} icon={Layers3} />
    <Metric label="Assessed" value={numberLabel(assessed)} detail={`${numberLabel(totals?.ranked_risks)} ranked · ${numberLabel(totals?.unranked_risks)} unranked`} tone="teal" icon={ClipboardCheck} />
    <Metric label="Critical / high" value={`${numberLabel(totals?.critical_risks)} / ${numberLabel(totals?.high_risks)}`} detail="Risk bands from stored assessment ranking" tone="rose" icon={ShieldAlert} />
    <Metric label="Open mitigation actions" value={numberLabel(openActions)} detail={`${numberLabel(totals?.behind_schedule_actions)} behind schedule · ${numberLabel(totals?.overdue_actions)} overdue`} tone="amber" icon={CalendarClock} />
  </div>;

  const priorityPanel = <Panel title="Priority risks requiring attention" eyebrow="API-ranked subset" icon={AlertTriangle}>
    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">Highest-priority records returned for the selected register. This list is capped at 20 and is not a paginated representation of all risks.</p>
      <span className="shrink-0 rounded-full border border-border bg-muted/45 px-3 py-1 text-[10px] font-bold text-muted-foreground">{rankedPriorities.length} of up to 20 priority records</span>
    </div>
    {rankedPriorities.length ? <div className="grid gap-2 lg:grid-cols-2">
      {rankedPriorities.map(risk => {
        const band = bandText(risk.risk_ranking);
        const hasScheduleConcern = risk.behind_schedule_actions > 0 || risk.overdue_actions > 0;
        return <article key={risk.risk_code} className={`min-w-0 rounded-xl border border-border border-l-4 p-3.5 ${band === 'Unranked' ? 'border-l-slate-400 bg-muted/20' : band === 'Critical' ? 'border-l-rose-500 bg-rose-50/40' : band === 'High' ? 'border-l-orange-500 bg-orange-50/40' : band === 'Medium' ? 'border-l-amber-500 bg-amber-50/40' : 'border-l-teal-600 bg-teal-50/35'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[Space_Mono] text-[10px] text-muted-foreground">{risk.risk_code}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${bandPalette[band].label}`}>{risk.risk_ranking || 'Unranked'}</span>
                {risk.risk_score != null && <span className="font-[Space_Mono] text-[10px] font-bold text-foreground">Score {numberLabel(risk.risk_score)}</span>}
              </div>
              <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5">{risk.risk_title}</h3>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{risk.department || risk.depart_code || 'Department not available'}</p>
            </div>
            <RiskAction code={risk.risk_code} onSelect={onSelect} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/70 pt-2.5 text-[10px]">
            <span className="text-muted-foreground">Residual exposure <strong className="font-[Space_Mono] text-foreground">{exposureLabel(risk.residual_exposure)}</strong></span>
            <span className="text-muted-foreground">Open actions <strong className="font-[Space_Mono] text-foreground">{numberLabel(risk.open_actions)}</strong></span>
            <span className={`inline-flex items-center gap-1 font-semibold ${hasScheduleConcern ? 'text-rose-800' : 'text-muted-foreground'}`}>
              {hasScheduleConcern ? <ArrowDownRight className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
              Behind {numberLabel(risk.behind_schedule_actions)} · overdue {numberLabel(risk.overdue_actions)}
            </span>
          </div>
        </article>;
      })}
    </div> : <EmptyState title="No priority risks returned" description={hasAnyRisks ? 'The API returned no records in its priority subset for this scope.' : 'Risks will appear here when they are registered in the selected scope.'} />}
  </Panel>;

  return <main className="min-h-[50dvh] space-y-5 pb-8">
    <header className="relative isolate overflow-hidden rounded-[1.6rem] border border-border bg-[linear-gradient(112deg,hsl(var(--card))_0%,hsl(var(--secondary))_100%)] px-5 py-5 shadow-[0_18px_55px_-40px_rgba(30,53,59,0.7)] sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border-[38px] border-primary/5" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Risk intelligence
          </div>
          <h1 className="font-[Manrope] text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">Risk register analytics</h1>
          <p className="mt-2 text-xs font-semibold text-primary">{overallAccess ? 'Risk Management · Overall department access' : 'Champion / Risk Owner · Your assigned departments only'}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">A defensible view of recorded assessment, exposure and mitigation work across the selected register.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-2 text-foreground">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
            Population <strong>{data.population === 'open' ? 'Open risks' : data.population === 'all' ? 'All risks' : 'Not available'}</strong>
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-2 text-muted-foreground">
            <Timer className="h-3.5 w-3.5" /> Generated {dateTimeLabel(data.generated_at)}
          </span>
        </div>
      </div>
    </header>

    {topMetric}

    {priorityPanel}

    {!hasAnyRisks && <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      There are no risks in this selected scope. Summary values are shown as returned by the register; no metrics have been inferred.
    </div>}

    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(300px,0.78fr)]">
      <Panel title="Impact × likelihood assessment matrix" eyebrow="Stored assessment snapshot" icon={ChartNoAxesCombined}>
        <p className="mb-4 max-w-3xl text-xs leading-5 text-muted-foreground">
          Each cell shows the number of risks with the saved impact and likelihood ordinals. Cell color denotes the approved score band; the printed score and band remain authoritative.
        </p>
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[520px]">
            <div className="mb-2 grid grid-cols-[104px_repeat(5,minmax(54px,1fr))] gap-1.5">
              <div className="flex items-end pb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Likelihood ↓<br />Impact →</div>
              {[1, 2, 3, 4, 5].map(impact => <div key={impact} className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {impact}<span className="block normal-case tracking-normal">Impact</span>
              </div>)}
            </div>
            {[5, 4, 3, 2, 1].map(likelihood => <div key={likelihood} className="mb-1.5 grid grid-cols-[104px_repeat(5,minmax(54px,1fr))] items-stretch gap-1.5">
              <div className="flex min-h-[66px] flex-col justify-center rounded-lg bg-muted/55 px-2.5">
                <span className="font-[Space_Mono] text-xs font-bold text-foreground">{likelihood}</span>
                <span className="text-[10px] leading-4 text-muted-foreground">{likelihood === 5 ? 'Certain' : likelihood === 1 ? 'Rare' : `Likelihood ${likelihood}`}</span>
              </div>
              {[1, 2, 3, 4, 5].map(impact => {
                const cell = cells.find(item => item.impact === impact && item.likelihood === likelihood);
                const score = cell?.score;
                const band = bandForCell(cell?.ranking ?? '');
                const isSelected = selectedCell?.impact === impact && selectedCell?.likelihood === likelihood;
                const cellCount = cell?.count;
                const aria = `Impact ${impact}, likelihood ${likelihood}, score ${numberLabel(score)}, ${band} band, ${numberLabel(cellCount)} risks`;
                return <button
                  key={`${impact}-${likelihood}`}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${aria}. Select to inspect matching priority risks.`}
                  title={aria}
                  onClick={() => setSelectedCell(isSelected ? null : { impact, likelihood })}
                  className={`flex min-h-[66px] flex-col items-center justify-center rounded-lg border px-1.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${bandPalette[band].cell} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}
                >
                  <span className="font-[Space_Mono] text-base font-bold leading-none">{numberLabel(cellCount)}</span>
                  <span className="mt-1 text-[10px] font-extrabold">{numberLabel(score)} · {band}</span>
                </button>;
              })}
            </div>)}
            <div className="ml-[110px] mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Impact increases left to right</span><span>Cell counts total {numberLabel(heatmapCount)}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Risk band legend">
          {(['Critical', 'High', 'Medium', 'Low'] as Band[]).map(band => <span key={band} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${bandPalette[band].label}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${bandPalette[band].dot}`} />{band}: {band === 'Critical' ? '15–25' : band === 'High' ? '10–14' : band === 'Medium' ? '5–9' : '1–4'}
          </span>)}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/35 p-3 text-[11px] leading-5 text-muted-foreground">
          <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>Matrix values use saved assessment ordinals, not current factor masters. Only risks with both stored ordinals contribute to scored cells; unranked and unassessed risks are excluded from the matrix and reported separately above. Select a cell to inspect matching risks from the priority list; the list is limited to the API’s top 20 and is not a complete cell register.</p>
        </div>
        {selectedCell && <div className="mt-4 rounded-xl border border-primary/20 bg-secondary/45 p-3.5" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold">Cell overview · impact {selectedCell.impact} × likelihood {selectedCell.likelihood}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {numberLabel(selectedCellData?.count)} risk{selectedCellData?.count === 1 ? '' : 's'} in the full selected scope
                {selectedCellData ? ` · score ${numberLabel(selectedCellData.score)} · ${bandForCell(selectedCellData.ranking)}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedCell(null)} className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Clear</button>
          </div>
          {selectedCellRisks.length ? <div className="mt-3 divide-y divide-border/70 rounded-lg border border-border bg-card">
            {selectedCellRisks.map(risk => <div key={risk.risk_code} className="flex min-w-0 flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="font-[Space_Mono] text-[10px] text-muted-foreground">{risk.risk_code}</span>
                <p className="truncate text-xs font-bold">{risk.risk_title}</p>
                <p className="text-[10px] text-muted-foreground">{risk.department || risk.depart_code || 'Department not available'}</p>
              </div>
              <RiskAction code={risk.risk_code} onSelect={onSelect} />
            </div>)}
          </div> : <p className="mt-3 rounded-lg bg-card px-3 py-2.5 text-xs text-muted-foreground">
            No matching risks from the top-20 priority list are available for this cell. The full-scope count above remains the API’s cell count.
          </p>}
          {priorityCountInCell > 0 && <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Showing {priorityCountInCell} matching priority-list record{priorityCountInCell === 1 ? '' : 's'} only. This is not an exhaustive list of the {numberLabel(selectedCellData?.count)} risks in the cell.</p>}
        </div>}
      </Panel>

      <div className="space-y-5">
        <Panel title="Risk ranking distribution" eyebrow="Full selected population" icon={ShieldCheck}>
          <div className="space-y-4">
            {rankingRows.map(row => {
              const band = bandText(row.name);
              const width = row.count === 0 ? 0 : Math.max(2, (row.count / maxRankingCount) * 100);
              return <div key={row.name}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${bandPalette[band].label}`}>{row.name}</span>
                  <span className="font-[Space_Mono] text-xs font-bold">{numberLabel(row.count)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${row.name}: ${row.count} risks`}>
                  <div className={`h-full rounded-full ${bandPalette[band].dot}`} style={{ width: `${width}%` }} />
                </div>
              </div>;
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <div className="rounded-xl bg-muted/45 p-3"><div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Avg. residual exposure</div><div className="mt-1 font-[Space_Mono] text-lg font-bold">{exposureLabel(exposure)}</div></div>
            <div className="rounded-xl bg-muted/45 p-3"><div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Behind schedule</div><div className="mt-1 font-[Space_Mono] text-lg font-bold">{numberLabel(totals?.behind_schedule_actions)}</div><div className="text-[10px] text-muted-foreground">of open actions</div></div>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Band counts follow the API’s selected population. Unranked is presented separately; it is not assigned a score band.</p>
        </Panel>

        <Panel title="Mitigation action pressure" eyebrow="Open actions" icon={FileWarning}>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-amber-900">Behind schedule</div>
              <div className="mt-1 font-[Space_Mono] text-2xl font-bold text-amber-950">{numberLabel(totals?.behind_schedule_actions)}</div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-rose-900">Overdue</div>
              <div className="mt-1 font-[Space_Mono] text-2xl font-bold text-rose-950">{numberLabel(totals?.overdue_actions)}</div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Counts describe action status in the current filtered dataset. An overdue action may also be behind schedule; do not add these counts as separate work items.</p>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="text-muted-foreground">Mean residual exposure</span>
            <span className="font-[Space_Mono] font-bold">{exposureLabel(exposure)}</span>
          </div>
        </Panel>
      </div>
    </div>

    <div className="grid min-w-0 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel title="Department register profile" eyebrow="Department-level comparison" icon={BriefcaseBusiness}>
        {(data.departments ?? []).length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead><tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 pr-3 font-bold">Department</th><th className="pb-3 px-2 text-right font-bold">Risks</th><th className="pb-3 px-2 text-right font-bold">Critical</th><th className="pb-3 px-2 text-right font-bold">High</th><th className="pb-3 pl-2 text-right font-bold">Avg. residual</th>
            </tr></thead>
            <tbody>{data.departments.map(department => <tr key={department.depart_code} className="border-b border-border/70 last:border-0">
              <td className="py-3 pr-3">
                <div className="font-semibold text-sm">{department.name || department.depart_code}</div>
                <div className="font-[Space_Mono] text-[10px] text-muted-foreground">{department.depart_code}</div>
                <div className="mt-2 h-1.5 max-w-40 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${department.total} risks`}>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(department.total === 0 ? 0 : 2, (department.total / maxDepartmentCount) * 100)}%` }} />
                </div>
              </td>
              <td className="px-2 py-3 text-right font-[Space_Mono] text-xs font-bold">{numberLabel(department.total)}</td>
              <td className="px-2 py-3 text-right"><span className="inline-flex min-w-8 justify-center rounded-md bg-rose-100 px-2 py-1 font-[Space_Mono] text-xs font-bold text-rose-900">{numberLabel(department.critical)}</span></td>
              <td className="px-2 py-3 text-right"><span className="inline-flex min-w-8 justify-center rounded-md bg-orange-100 px-2 py-1 font-[Space_Mono] text-xs font-bold text-orange-900">{numberLabel(department.high)}</span></td>
              <td className="py-3 pl-2 text-right font-[Space_Mono] text-xs font-bold">{exposureLabel(department.avg_residual_exposure)}</td>
            </tr>)}</tbody>
          </table>
        </div> : <EmptyState title="No department breakdown" description="No department register summaries were returned for this scope." />}
        <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Department counts are scoped by the selected register filters; they are not derived from the priority list.</p>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
        <Panel title="Risk categories" eyebrow="Recorded classification" icon={Layers3}>
          {(data.categories ?? []).length ? <div className="space-y-3">
            {data.categories.map(item => <div key={item.code} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-xs font-semibold">{item.name || item.code}</span>
                  <span className="font-[Space_Mono] text-xs font-bold">{numberLabel(item.count)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/75" style={{ width: `${Math.max(item.count === 0 ? 0 : 2, item.count / maxCategoryCount * 100)}%` }} />
                </div>
              </div>
            </div>)}
          </div> : <p className="text-xs text-muted-foreground">No category counts were returned.</p>}
        </Panel>
        <Panel title="Register workflows" eyebrow="Department / period registers" icon={Activity}>
          {(data.workflows ?? []).length ? <div className="space-y-3">
            {data.workflows.map(item => <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-muted/35 px-3 py-2.5">
              <span className="min-w-0 truncate text-xs font-semibold">{item.name}</span>
              <span className="flex shrink-0 items-center gap-2 font-[Space_Mono] text-xs font-bold"><span className="h-1.5 w-12 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(item.count === 0 ? 0 : 2, item.count / maxWorkflowCount * 100)}%` }} /></span>{numberLabel(item.count)}</span>
            </div>)}
          </div> : <p className="text-xs text-muted-foreground">No workflow counts were returned.</p>}
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Workflow counts represent unique department/period registers, not individual risks.</p>
        </Panel>
      </div>
    </div>

    {Array.isArray(data.top_ten_overall)
      && typeof data.overall_ranked_count === 'number' && typeof data.overall_unranked_count === 'number' ? <RiskTopTen
      overallAccess={overallAccess}
      overall={data.top_ten_overall}
      overallRankedCount={data.overall_ranked_count}
      overallUnrankedCount={data.overall_unranked_count}
      loading={loading}
      onSelect={onSelect}
    /> : <ErrorNotice message="Top 10 analytics are not available in this response. Refresh to load the latest dashboard data." onRetry={retry} />}

    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-1 pt-3 text-[10px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><Activity className="h-3 w-3" /> Analytics reflect the current department, period and population filters.</span>
      <span>Source snapshot · {dateTimeLabel(data.generated_at)}</span>
      {totals?.ranked_risks != null && heatmapCount !== totals.ranked_risks && <span className="inline-flex items-center gap-1"><CircleHelp className="h-3 w-3" /> Matrix cell total {numberLabel(heatmapCount)} differs from ranked count {numberLabel(totals.ranked_risks)}; counts are displayed as supplied.</span>}
    </footer>
  </main>;
}
