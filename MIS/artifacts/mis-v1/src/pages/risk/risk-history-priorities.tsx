import type { RiskAnalyticsResponseData, RiskLookup } from '@workspace/api-client-react';
import { AlertCircle, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { EmptyState, SkeletonRows } from './risk-ui';
import { riskExposureColors } from './risk-exposure-colors';

type Props = {
  data?: RiskAnalyticsResponseData;
  loading: boolean;
  error: string;
  retry: () => void;
  departments: RiskLookup[];
  onSelect: (code: string) => void;
};

export default function RiskHistoryPriorities({ data, loading, error, retry, departments, onSelect }: Props) {
  if (loading) return <section aria-label="Top open critical risks by department" className="rounded-2xl border border-border bg-card p-5"><SkeletonRows /></section>;
  if (error) return <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950" role="alert">
    <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0 flex-1"><h3 className="font-[Manrope] font-bold">Critical risk priorities unavailable</h3><p className="mt-1 text-sm">{error}</p>
      <button type="button" data-testid="button-retry-risk-history-priorities" onClick={retry} className="mt-3 rounded-md border border-rose-300 bg-card px-3 py-2 text-xs font-bold text-rose-900 hover:bg-rose-100">Retry</button>
    </div></div>
  </section>;

  const groups = data?.top_ten_departments ?? [];
  const groupByDepartment = new Map(groups.map(group => [group.depart_code, group]));
  const visibleDepartments = departments.length
    ? departments
    : groups.map(group => ({ depart_code: group.depart_code, depart_name: group.department }));

  return <section data-testid="risk-history-priorities" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
    <header className="border-b border-border bg-muted/30 p-5 sm:px-6">
      <div className="flex items-center gap-2 text-primary"><ShieldAlert aria-hidden="true" className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.17em]">Saved register priorities</span></div>
      <h2 className="mt-2 font-[Manrope] text-xl font-extrabold sm:text-2xl">Top open critical risks by department</h2>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
        Up to five open risks ranked Critical per department, ordered by their saved matrix risk score. This is the open-risk population for the selected reporting-period scope; High, Medium, Low and unranked risks are not included.
      </p>
      <p className="mt-2 text-[11px] font-semibold text-muted-foreground">Top 5 Critical only · scores and rankings are shown as stored</p>
    </header>

    {!data ? <div className="p-5"><EmptyState title="No priority data available" description="Critical risk priorities will appear when analytics data is available for the selected reporting-period scope." /></div>
      : visibleDepartments.length === 0 ? <div className="p-5"><EmptyState title="No departments in scope" description="There are no authorized departments in the selected reporting-period scope." /></div>
        : <div className="divide-y divide-border">
          {visibleDepartments.map((department, departmentIndex) => {
            const code = department.depart_code ?? '';
            const group = groupByDepartment.get(code);
            const criticalRisks = (group?.risks ?? [])
              .filter(risk => risk.risk_ranking?.toLowerCase() === 'critical' && risk.risk_score != null)
              .sort((left, right) => (right.risk_score ?? -Infinity) - (left.risk_score ?? -Infinity))
              .slice(0, 5);
            const name = department.depart_name ?? group?.department ?? (code || 'Department');
            return <section key={code || `department-${departmentIndex}`} data-testid={`priority-department-${code || departmentIndex}`} className="min-w-0 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-[Manrope] text-base font-bold">{name}</h3>
                <span className="font-[Space_Mono] text-[10px] text-muted-foreground">{code} · {criticalRisks.length} of up to 5 Critical risks</span>
              </div>
              {criticalRisks.length ? <div className="min-w-0 space-y-2">
                {criticalRisks.map((risk, index) => {
                  const colors = riskExposureColors(risk.risk_ranking ?? '');
                  return <button key={risk.risk_code} type="button" onClick={() => onSelect(risk.risk_code)}
                    data-testid={`select-history-priority-${risk.risk_code}`}
                    aria-label={`View critical risk ${risk.risk_code}: ${risk.risk_title}`}
                    className={`group flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border border-l-4 ${colors.edge} px-4 py-3 text-left transition hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
                    <span className="min-w-0 flex-1">
                      <span className="block font-[Space_Mono] text-[10px] text-primary">{risk.risk_code}</span>
                      <span className="mt-1 block break-words text-sm font-semibold group-hover:text-primary">{risk.risk_title}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-[Space_Mono] text-sm font-bold" aria-label={`Risk score ${risk.risk_score} out of 25`}>{risk.risk_score}<span className="ml-1 text-[10px] font-normal text-muted-foreground">/25</span></span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors.badge}`}>{risk.risk_ranking}</span>
                    </span>
                    <span className="flex w-full flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground sm:w-auto sm:justify-end">
                      <span><strong className="text-foreground">{risk.open_actions}</strong> open actions</span>
                      <span><strong className="text-foreground">{risk.behind_schedule_actions}</strong> behind schedule</span>
                      <span><strong className="text-foreground">{risk.overdue_actions}</strong> overdue</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>;
                })}
              </div> : <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5">
                <p className="text-sm font-semibold">No open Critical risks in this department</p>
                <p className="mt-1 text-xs text-muted-foreground">No Critical-ranked open risks were supplied for this department in the selected reporting-period scope.</p>
              </div>}
            </section>;
          })}
        </div>}
  </section>;
}
