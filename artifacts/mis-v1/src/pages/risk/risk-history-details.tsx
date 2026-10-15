import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { RiskLookup, RiskOptionsResponseData, RiskRecord, RiskRootCause } from '@workspace/api-client-react';
import { dateLabel, EmptyState, ErrorNotice, RiskStatusPill, SkeletonRows, StatusPill, text } from './risk-ui';
import { riskExposureColors } from './risk-exposure-colors';
import { orderRiskSummary } from './risk-summary-order';

type TabKey = 'details' | 'causes' | 'exposures';

const tabItems: Array<{ id: TabKey; label: string }> = [
  { id: 'details', label: 'Risk Details' },
  { id: 'causes', label: 'Root causes & action plans' },
  { id: 'exposures', label: 'Risk exposures' },
];

function DataField({ label, value }: { label: string; value: unknown }) {
  return <div className="min-w-0">
    <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{text(value)}</dd>
  </div>;
}

function ExposureSnapshot({ label, value, type, options }: {
  label: string; value: string | null | undefined; type: 'I' | 'R'; options: RiskOptionsResponseData;
}) {
  const score = value == null || value.trim() === '' ? Number.NaN : Number(value);
  const rounded = Math.round(score * 100) / 100;
  const band = Number.isFinite(score)
    ? options.exposure_bands.find(item => item.risk_type === type && rounded >= item.minimum && rounded <= item.maximum)
    : undefined;
  const classification = Number.isFinite(score) ? band?.level ?? 'Unclassified' : 'Not assessed';
  const colors = riskExposureColors(classification);
  return <div className="min-w-0 rounded-xl border border-border bg-card p-4">
    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 font-[Space_Mono] text-xl font-bold">{text(value)}</p>
    <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${colors.badge}`}>{classification}</p>
    {band?.description && <p className="mt-2 text-xs leading-5 text-muted-foreground">{band.description}</p>}
  </div>;
}

function ownerLabel(root: RiskRootCause, staff: RiskLookup[]) {
  const username = root.action_owner ?? '';
  const person = staff.find(item => item.username === username);
  if (!username) return 'Not assigned';
  return person?.employee_name ? `${person.employee_name} · ${username}` : username;
}

function isOverdue(dueDate?: string | null) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export default function RiskHistoryDetails({
  riskCode, risk, roots, options, loading, error, onClose,
}: {
  riskCode: string;
  risk?: RiskRecord;
  roots: RiskRootCause[];
  options: RiskOptionsResponseData;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const record = risk ? orderRiskSummary([risk])[0] : undefined;
  const missingMatrix = risk?.assessment_updated ? 'Saved matrix factors unavailable' : 'Not assessed';
  const objective = options.objectives.find(item => item.obj_code === risk?.objective_code
    && item.depart_code === risk?.depart_code);
  const category = options.categories.find(item => item.category_code === risk?.risk_category);
  const impactSnapshot = risk?.ranking_snapshot?.impact;
  const likelihoodSnapshot = risk?.ranking_snapshot?.likelihood;
  const historicalControl = risk?.perceived_contr_eff == null
    ? undefined
    : options.control_effectiveness.find(item => Math.abs(item.rating * 100 - Number(risk.perceived_contr_eff)) < 1e-7);
  const rankColors = riskExposureColors(record?.risk_ranking ?? '');

  const selectTab = (tab: TabKey) => setActiveTab(tab);
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = tabItems.findIndex(item => item.id === activeTab);
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % tabItems.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + tabItems.length) % tabItems.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabItems.length - 1;
    else return;
    event.preventDefault();
    const target = tabItems[next].id;
    setActiveTab(target);
    window.requestAnimationFrame(() => document.getElementById(`risk-history-tab-${target}`)?.focus());
  };

  return <section data-testid="inline-risk-record-details" aria-label="Risk record details" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-muted/30 p-5 sm:px-6">
      <div className="min-w-0">
        <p className="font-[Space_Mono] text-[10px] text-muted-foreground">{riskCode} · {risk?.depart_name ?? risk?.depart_code ?? 'Risk record'}</p>
        <h2 className="mt-1 break-words font-[Manrope] text-xl font-extrabold sm:text-2xl">{risk?.risk_title ?? 'Risk details'}</h2>
        {risk && <p className="mt-1 text-xs text-muted-foreground">Period {risk.period_id} · {dateLabel(risk.period_from)} – {dateLabel(risk.period_to)}</p>}
      </div>
      <button type="button" data-testid="button-close-risk-details" aria-label="Close risk details" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition hover:bg-muted" onClick={onClose}>
        <X aria-hidden="true" className="h-4 w-4" />Close risk details
      </button>
    </header>

    {loading ? <div className="p-5"><SkeletonRows /></div>
      : error ? <div className="p-5"><ErrorNotice message={error} /></div>
        : !risk ? <div className="p-5"><EmptyState title="Record unavailable" description="The selected risk record could not be loaded." /></div>
          : <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
              <span className="text-xs font-semibold text-muted-foreground">Risk status</span><RiskStatusPill risk={risk} />
              <span className="ml-0 text-xs font-semibold text-muted-foreground sm:ml-3">Register workflow</span><StatusPill status={risk.workflow_status} />
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rankColors.badge}`}>
                Matrix ranking: {record?.risk_ranking ?? 'Not ranked'}
              </span>
              <span className="font-[Space_Mono] text-xs text-muted-foreground">Score {record?.risk_score ?? missingMatrix}{record?.risk_score != null ? ' / 25' : ''}</span>
            </div>
            <div role="tablist" aria-label="Risk record sections" className="flex max-w-full overflow-x-auto border-b border-border px-3 pt-3 sm:px-5">
              {tabItems.map(item => <button key={item.id} id={`risk-history-tab-${item.id}`} type="button" role="tab"
                aria-controls={`risk-history-panel-${item.id}`} aria-selected={activeTab === item.id}
                tabIndex={activeTab === item.id ? 0 : -1} onClick={() => selectTab(item.id)} onKeyDown={handleTabKeyDown}
                className={`shrink-0 border-b-2 px-3 py-3 text-left text-sm font-semibold transition-colors ${activeTab === item.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                {item.label}
              </button>)}
            </div>

            <section id="risk-history-panel-details" role="tabpanel" aria-labelledby="risk-history-tab-details" hidden={activeTab !== 'details'} className="space-y-4 p-5 sm:p-6">
              <div>
                <h3 className="font-[Manrope] text-lg font-bold">Risk Details</h3>
                <p className="mt-1 text-xs text-muted-foreground">Read-only view of the saved register record.</p>
              </div>
              <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><DataField label="Risk title" value={risk.risk_title} /></div>
                <DataField label="Department" value={risk.depart_name ? `${risk.depart_name} · ${risk.depart_code}` : risk.depart_code} />
                <DataField label="Reporting period" value={`Period ${risk.period_id} · ${dateLabel(risk.period_from)} – ${dateLabel(risk.period_to)}`} />
                <DataField label="Department objective" value={objective?.obj_name ? `${objective.obj_name} · ${risk.objective_code}` : risk.objective_code} />
                <DataField label="Risk category" value={category?.category_name ?? risk.category_name ?? risk.risk_category} />
                <div className="sm:col-span-2"><DataField label="Description" value={risk.risk_description} /></div>
                <div className="sm:col-span-2"><DataField label="Consequences" value={risk.risk_consequence} /></div>
              </dl>
            </section>

            <section id="risk-history-panel-causes" role="tabpanel" aria-labelledby="risk-history-tab-causes" hidden={activeTab !== 'causes'} className="space-y-4 p-5 sm:p-6">
              <div><h3 className="font-[Manrope] text-lg font-bold">Root causes &amp; action plans</h3><p className="mt-1 text-xs text-muted-foreground">Saved causes, controls and mitigation actions for this record.</p></div>
              {roots.length ? <div className="min-w-0 space-y-3">
                {roots.map((root, index) => {
                  const behind = root.action_status?.toLowerCase() === 'behind schedule';
                  const overdue = root.action_status?.toLowerCase() !== 'closed' && isOverdue(root.due_date);
                  return <article key={`${riskCode}-${index}`} data-testid={`history-root-cause-${index + 1}`} className={`min-w-0 rounded-xl border p-4 ${behind || overdue ? 'border-rose-200 bg-rose-50/60' : 'border-border bg-card'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h4 className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm font-bold">{root.root_cause || 'Cause not recorded'}</h4>
                      <StatusPill status={root.action_status} />
                    </div>
                    {(behind || overdue) && <p className="mt-2 rounded-md bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-900">{behind ? 'Action is behind schedule.' : ''}{behind && overdue ? ' ' : ''}{overdue ? 'Due date has passed.' : ''}</p>}
                    <dl className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2"><DataField label="Current controls" value={root.current_contr} /></div>
                      <div className="sm:col-span-2"><DataField label="Mitigations" value={root.mitigations} /></div>
                      <DataField label="Action owner" value={ownerLabel(root, options.staff)} />
                      <DataField label="Due date" value={root.due_date ? dateLabel(root.due_date) : undefined} />
                    </dl>
                  </article>;
                })}
              </div> : <EmptyState title="No saved root causes" description="This record has no saved root cause or action plan." />}
            </section>

            <section id="risk-history-panel-exposures" role="tabpanel" aria-labelledby="risk-history-tab-exposures" hidden={activeTab !== 'exposures'} className="space-y-4 p-5 sm:p-6">
              <div><h3 className="font-[Manrope] text-lg font-bold">Risk exposures</h3><p className="mt-1 text-xs text-muted-foreground">Stored matrix rankings are shown as saved; historical scores are not recalculated from current factor weights.</p></div>
              <section className="rounded-xl border border-border bg-muted/20 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Saved matrix assessment</h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DataField label="Risk score" value={record?.risk_score != null ? `${record.risk_score} / 25` : missingMatrix} />
                  <DataField label="Risk ranking" value={record?.risk_ranking ?? 'Not ranked'} />
                  <DataField label="Impact factor" value={impactSnapshot?.label ?? (risk.i_rate ? 'Historical impact label unavailable' : 'Not assessed')} />
                  <DataField label="Likelihood factor" value={likelihoodSnapshot?.label ?? (risk.l_rate ? 'Historical likelihood label unavailable' : 'Not assessed')} />
                  <DataField label="Perceived control effectiveness" value={historicalControl?.eff_factor ?? (risk.perceived_contr_eff != null ? 'Historical control label unavailable' : 'Not assessed')} />
                  <DataField label="Control criteria" value={historicalControl?.qual_criteria ?? 'Historical criteria not available'} />
                  <DataField label="Saved impact / likelihood codes" value={[risk.risk_impact, risk.risk_likelihood].filter(Boolean).join(' · ') || undefined} />
                </div>
              </section>
              <section className="rounded-xl border border-border bg-muted/20 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Exposure values</h4>
                <p className="mt-1 text-xs text-muted-foreground">Exposure values are the saved assessment. Classification uses the configured exposure bands available for this view.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ExposureSnapshot label="Inherent exposure" value={risk.i_risk_exposure} type="I" options={options} />
                  <ExposureSnapshot label="Residual exposure" value={risk.r_risk_exposure} type="R" options={options} />
                </div>
              </section>
              <section className="rounded-xl border border-border bg-muted/20 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Saved assessment context</h4>
                <dl className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
                  <DataField label="Historical perceived rate" value={risk.perceived_rate} />
                  <div className="sm:col-span-2"><DataField label="Desired controls" value={risk.desired_contr_effe} /></div>
                  <DataField label="Assessment status" value={risk.assessment_updated ? 'Assessment saved' : 'Not assessed'} />
                </dl>
              </section>
            </section>
          </div>}
  </section>;
}
