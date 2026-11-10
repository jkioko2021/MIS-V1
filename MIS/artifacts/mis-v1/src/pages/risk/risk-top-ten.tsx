import type { RiskAnalyticsPriority } from '@workspace/api-client-react';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';

type Props = {
  overallAccess: boolean;
  overall: RiskAnalyticsPriority[];
  overallRankedCount: number;
  overallUnrankedCount: number;
  loading: boolean;
  onSelect: (riskCode: string) => void;
};

type RiskBand = 'Critical' | 'High' | 'Medium' | 'Low' | 'Other';

function countLabel(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? 'Not available' : value.toLocaleString();
}

function exposureLabel(value: number | null | undefined) {
  return value == null || !Number.isFinite(value)
    ? 'Not available'
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function rankingBand(value: string | null): RiskBand {
  const normalized = value?.toLowerCase();
  if (normalized === 'critical') return 'Critical';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'low') return 'Low';
  return 'Other';
}

const bandClass: Record<RiskBand, string> = {
  Critical: 'border-rose-200 bg-rose-100 text-rose-950',
  High: 'border-orange-200 bg-orange-100 text-orange-950',
  Medium: 'border-amber-200 bg-amber-100 text-amber-950',
  Low: 'border-teal-200 bg-teal-100 text-teal-950',
  Other: 'border-border bg-muted text-muted-foreground',
};

function orderRankedRisks(risks: RiskAnalyticsPriority[]) {
  return risks
    .filter(risk => risk.risk_score != null && risk.risk_ranking != null)
    .slice()
    .sort((a, b) =>
      (b.risk_score ?? Number.NEGATIVE_INFINITY) - (a.risk_score ?? Number.NEGATIVE_INFINITY)
      || b.behind_schedule_actions - a.behind_schedule_actions
      || b.overdue_actions - a.overdue_actions
      || a.risk_code.localeCompare(b.risk_code, 'en', { numeric: true }),
    )
    .slice(0, 10);
}

function RiskRow({ risk, position, onSelect }: {
  risk: RiskAnalyticsPriority;
  position: number;
  onSelect: (riskCode: string) => void;
}) {
  const band = rankingBand(risk.risk_ranking);
  const hasActionPressure = risk.behind_schedule_actions > 0 || risk.overdue_actions > 0;

  return <li className="relative min-w-0 border-b border-border/70 py-3.5 last:border-0">
    <div className="flex min-w-0 items-start gap-3">
      <span aria-label={`Rank ${position}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted font-[Space_Mono] text-xs font-bold text-muted-foreground">
        {String(position).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-[Space_Mono] text-[10px] font-semibold text-muted-foreground">{risk.risk_code}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${bandClass[band]}`}>{risk.risk_ranking}</span>
        </div>
        <h4 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-foreground">{risk.risk_title}</h4>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">{risk.department || risk.depart_code || 'Department not available'}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-4">
          <span className="text-muted-foreground">Score <strong className="font-[Space_Mono] text-foreground">{countLabel(risk.risk_score)}</strong></span>
          <span className="text-muted-foreground">Residual <strong className="font-[Space_Mono] text-foreground">{exposureLabel(risk.residual_exposure)}</strong></span>
          <span className={hasActionPressure ? 'font-semibold text-rose-800' : 'text-muted-foreground'}>
            Actions: {countLabel(risk.open_actions)} open · {countLabel(risk.behind_schedule_actions)} behind · {countLabel(risk.overdue_actions)} overdue
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(risk.risk_code)}
        aria-label={`View risk ${risk.risk_code}: ${risk.risk_title}`}
        className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-bold text-foreground hover:border-primary/40 hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="hidden sm:inline">View risk</span><ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
  </li>;
}

function RiskList({ title, description, risks, rankedCount, unrankedCount, onSelect }: {
  title: string;
  description: string;
  risks: RiskAnalyticsPriority[];
  rankedCount: number;
  unrankedCount: number;
  onSelect: (riskCode: string) => void;
}) {
  const ordered = useMemo(() => orderRankedRisks(risks), [risks]);
  const excludedCount = Math.max(0, risks.length - risks.filter(risk => risk.risk_score != null && risk.risk_ranking != null).length);

  return <section className="min-w-0 rounded-2xl border border-border bg-card">
    <div className="border-b border-border/80 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Highest saved matrix scores</p>
          <h3 className="mt-1 font-[Manrope] text-base font-extrabold tracking-tight sm:text-lg">{title}</h3>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><ShieldAlert className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{description}</p>
    </div>

    <div className="px-4 pb-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border/70 py-3 text-[10px] text-muted-foreground">
        <span>Showing {ordered.length} of {countLabel(rankedCount)} ranked risks</span>
        <span>{countLabel(unrankedCount)} unranked / unassessed excluded</span>
      </div>
      {excludedCount > 0 && <p className="border-b border-border/70 py-2 text-[10px] leading-4 text-muted-foreground">
        {excludedCount} record{excludedCount === 1 ? '' : 's'} returned without both a saved score and ranking were excluded from this ranked list.
      </p>}
      {ordered.length ? <ol aria-label={`${title}, ranked by saved matrix score`} className="divide-y-0">
        {ordered.map((risk, index) => <RiskRow key={risk.risk_code} risk={risk} position={index + 1} onSelect={onSelect} />)}
      </ol> : <div className="grid min-h-36 place-items-center py-6 text-center">
        <div>
          <div className="font-[Manrope] text-sm font-bold">No ranked risks to show</div>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            {rankedCount === 0
              ? 'There are no currently assessed risks with a saved matrix score in this scope.'
              : `The API reports ${countLabel(rankedCount)} ranked risks, but did not return ranked records for this top-ten list.`}
          </p>
        </div>
      </div>}
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
        Ordered by saved score, then behind-schedule actions, overdue actions and risk code. Residual exposure is shown separately and does not determine rank.
      </p>
    </div>
  </section>;
}

function SkeletonList() {
  return <div className="rounded-2xl border border-border bg-card p-4" aria-hidden="true">
    <div className="h-4 w-36 animate-pulse rounded bg-muted" />
    <div className="mt-4 space-y-3">{[0, 1, 2].map(index => <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
  </div>;
}

export default function RiskTopTen({ overall, overallRankedCount, overallUnrankedCount, loading, onSelect, overallAccess }: Props) {
  if (loading) {
    return <section aria-busy="true" aria-label="Loading top ten risks" className="min-w-0">
      <SkeletonList />
    </section>;
  }

  return <section aria-label="Top ten ranked risks" className="min-w-0">
    <RiskList
      title={overallAccess ? 'Top 10 overall' : 'Top 10 in my departments'}
      description={overallAccess ? 'Across all departments. The current reporting period and risk-population apply; the department selector narrows the other dashboard analytics only.' : 'Only departments assigned to you as Champion or Risk Owner. The current reporting period and risk-population apply. No other departments are included.'}
      risks={overall}
      rankedCount={overallRankedCount}
      unrankedCount={overallUnrankedCount}
      onSelect={onSelect}
    />
  </section>;
}
