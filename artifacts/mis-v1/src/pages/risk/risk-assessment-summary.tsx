import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Send, ShieldAlert } from 'lucide-react';
import type { RiskDepartmentSummary, RiskOptionsResponseData, RiskRecord } from '@workspace/api-client-react';
import { useRiskRecords } from './use-risk-register';
import { useSubmissionReadiness } from './risk-workflow';
import { orderRiskSummary } from './risk-summary-order';
import { riskExposureColors } from './risk-exposure-colors';
import RiskSummaryCauses from './risk-summary-causes';
import {
  dateLabel, EmptyState, envelopeData, envelopeError, ErrorNotice, Field, fieldClass, SkeletonRows,
} from './risk-ui';

type Props = {
  summaries: RiskDepartmentSummary[];
  options: RiskOptionsResponseData;
  department: string;
  period: string;
  selectedRisk?: RiskRecord;
  comments: string;
  setComments: (value: string) => void;
  mutating: boolean;
  onSubmit: (row: RiskDepartmentSummary) => void;
  onSelect: (riskCode: string) => void;
  loading: boolean;
  error: string;
  retry: () => void;
};

function factorName(value: string | null | undefined, factors: Array<{ code: string; label: string; factor: number; rate?: string; criteria?: string }>) {
  if (value == null || value === '') return 'Not assessed';
  const normalized = String(value).trim().toLowerCase();
  const found = factors.find(item =>
    [item.code, item.label, String(item.factor), item.rate, item.criteria]
      .some(candidate => candidate != null && String(candidate).trim().toLowerCase() === normalized)
      || (normalized !== '' && Number.isFinite(Number(value)) && Number(item.factor) === Number(value)),
  );
  return found?.label ?? 'Historical rating';
}

function exposureBand(value: string | null | undefined, type: 'I' | 'R', options: RiskOptionsResponseData) {
  if (value == null || value === '') return { score: '—', band: 'Not assessed' };
  const score = Math.round(Number(value) * 100) / 100;
  const band = Number.isFinite(score)
    ? options.exposure_bands.find(item => item.risk_type === type && score >= item.minimum && score <= item.maximum)
    : undefined;
  return { score: value, band: band?.level ?? 'Unclassified' };
}

function ScopeExposure({ score, band }: { score: string; band: string }) {
  return <span className="flex flex-col gap-1">
    <span className="font-[Space_Mono] text-sm font-bold">{score}</span>
    <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskExposureColors(band).badge}`}>{band}</span>
  </span>;
}

export default function RiskAssessmentSummary({
  summaries, options, department, period, selectedRisk, comments, setComments, mutating, onSubmit, onSelect, loading, error, retry,
}: Props) {
  const [chosenDepartment, setChosenDepartment] = useState('');
  const [chosenPeriod, setChosenPeriod] = useState('');

  const departments = useMemo(() => [...new Map(summaries.map(row => [row.depart_code, row])).values()], [summaries]);
  const compatibleRisk = selectedRisk
    && (!department || department === selectedRisk.depart_code)
    && (!period || String(selectedRisk.period_id) === period)
    ? selectedRisk
    : undefined;
  const selectedDepartment = department || compatibleRisk?.depart_code || chosenDepartment;
  const departmentRows = useMemo(
    () => summaries.filter(row => !selectedDepartment || row.depart_code === selectedDepartment),
    [summaries, selectedDepartment],
  );
  const periodRows = useMemo(() => [...new Map(departmentRows.map(row => [String(row.period_id ?? ''), row])).values()], [departmentRows]);
  const selectedPeriod = period || (compatibleRisk?.period_id != null ? String(compatibleRisk.period_id) : chosenPeriod);
  const row = summaries.find(item => item.depart_code === selectedDepartment && String(item.period_id ?? '') === selectedPeriod);
  const scopeKey = selectedDepartment && selectedPeriod ? `${selectedDepartment}:${selectedPeriod}` : '';
  const activeRecordsQuery = useRiskRecords(
    options.actor.username,
    { access: 'update', ...(selectedDepartment ? { depart_code: selectedDepartment } : {}), ...(selectedPeriod ? { period_id: Number(selectedPeriod) } : {}) },
    Boolean(scopeKey),
  );
  const returnedRecords = envelopeData<RiskRecord[]>(activeRecordsQuery.data);
  const activeRecords = useMemo(
    () => orderRiskSummary((returnedRecords ?? []).filter(item => item.is_active !== false)),
    [returnedRecords],
  );
  const assessedRecords = activeRecords.filter(record => record.assessment_updated === true);
  const recordsError = activeRecordsQuery.data ? envelopeError(activeRecordsQuery.data) ?? '' : '';
  const recordsFailed = activeRecordsQuery.isError || Boolean(recordsError);
  const listShort = Boolean(row && returnedRecords && !recordsFailed && activeRecords.length !== row.total_risks);
  const isOpen = row?.workflow_status?.toUpperCase() === 'OPEN';
  const isChampion = Boolean(row && (options.actor.can_manage || options.actor.champion_departments.includes(row.depart_code)));
  const assignment = row && options.assignments.find(item => item.depart_code === row.depart_code && Boolean(item.owner_username));
  const ownerUsername = assignment?.owner_username ?? '';
  const recipient = options.staff.find(person => person.username === ownerUsername);
  const recipientName = recipient?.employee_name || ownerUsername;
  const activeOwner = Boolean(ownerUsername && recipient);
  const readiness = useSubmissionReadiness({
    username: options.actor.username, departCode: row?.depart_code ?? '', periodId: Number(row?.period_id ?? 0),
    ownerAssigned: activeOwner, enabled: Boolean(isOpen && isChampion && !loading && !error),
  });
  const gateReady = readiness.ready;

  const blockedReason = loading ? 'Loading the department summary…'
    : error ? 'The department summary could not be verified. Retry before submitting.'
      : !scopeKey ? 'Select one department and one reporting period to prepare its summary.'
        : !row ? 'No department register exists for this department and reporting period.'
          : !isChampion ? 'Only management or a champion mapped to this department can submit its register.'
            : !isOpen ? `This register is ${row.workflow_status || 'not open'}; only an open register can be submitted.`
              : !activeOwner ? 'No active Risk Owner is mapped to this department. Contact management to assign one.'
                : !gateReady ? readiness.label || 'Checking assessment and root-cause readiness…'
                        : !comments.trim() ? 'Add a decision comment before sending this register for review.'
                            : mutating ? 'A risk register action is being saved. Wait for it to finish before submitting again.'
                              : '';

  const canSubmit = Boolean(row && !loading && !error && isChampion && isOpen && activeOwner
    && gateReady && comments.trim() && !mutating);

  return <section className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="risk-assessment-summary">
    <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-end sm:px-6">
      <div className="max-w-2xl">
        <div className="mb-2 flex items-center gap-2 text-primary"><ClipboardList className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.17em]">Department cycle closeout</span></div>
        <h3 className="font-[Manrope] text-xl font-extrabold sm:text-2xl">Risk summary</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Risks appear here after Save Assessment succeeds for this department and period, ordered by highest residual exposure first. Submit for review becomes available only when every active risk is assessed and has a saved root cause.</p>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Residual risk color key">{['Extreme', 'High', 'Moderate', 'Low'].map(level => <span key={level} className={`rounded-full px-2 py-1 text-[10px] font-semibold ${riskExposureColors(level).badge}`}>{level}</span>)}</div>
      </div>
      <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px] sm:grid-cols-2">
        <Field label="Department">
          <select aria-label="Summary department" data-testid="select-summary-department" className={fieldClass} value={selectedDepartment} disabled={Boolean(department || compatibleRisk?.depart_code)} onChange={event => { setChosenDepartment(event.target.value); setChosenPeriod(''); }}>
            <option value="">Select a department</option>
            {departments.map(item => <option key={item.depart_code} value={item.depart_code}>{item.depart_name} · {item.depart_code}</option>)}
          </select>
        </Field>
        <Field label="Reporting period">
          <select aria-label="Summary reporting period" data-testid="select-summary-period" className={fieldClass} value={selectedPeriod} disabled={Boolean(period || compatibleRisk?.period_id != null)} onChange={event => setChosenPeriod(event.target.value)}>
            <option value="">Select a period</option>
            {periodRows.filter(item => item.period_id != null).map(item => <option key={item.period_id} value={String(item.period_id)}>{dateLabel(item.period_from)} – {dateLabel(item.period_to)}</option>)}
          </select>
        </Field>
      </div>
    </div>

    {(loading || error) ? <div className="p-5">{loading ? <SkeletonRows /> : <ErrorNotice message={error} onRetry={retry} />}</div>
      : !scopeKey ? <div className="p-5"><EmptyState title="Choose a register cycle" description="Select a department and reporting period above, or select a risk to derive its department and period." /></div>
        : !row ? <div className="p-5"><EmptyState title="No summary for this cycle" description="This department and period do not have a risk register summary." /></div>
          : <div className="p-5 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 border-l-2 border-primary pl-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="text-sm font-bold">{row.depart_name}</div><div className="mt-1 font-[Space_Mono] text-[10px] text-muted-foreground">{row.depart_code} · Period {row.period_id} · {dateLabel(row.period_from)} – {dateLabel(row.period_to)}</div></div>
               <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-md bg-secondary px-2.5 py-1.5 font-semibold text-primary">{row.total_risks} active risks expected</span><span data-testid="risk-summary-progress" className="rounded-md border border-border px-2.5 py-1.5">{readiness.complete ? readiness.data?.assessed_risks : row.assessed_risks ?? 0} of {readiness.complete ? readiness.data?.total_active_risks : row.total_risks} assessed</span></div>
            </div>

            {activeRecordsQuery.isLoading ? <div className="py-4"><SkeletonRows /></div>
              : recordsFailed ? <ErrorNotice message={recordsError || 'Could not load the complete risk list.'} onRetry={() => activeRecordsQuery.refetch()} />
                 : listShort ? <div className="mb-4"><ErrorNotice message={`This preview returned ${activeRecords.length} of ${row.total_risks} active risks. Submission readiness is checked separately across the complete register.`} onRetry={() => activeRecordsQuery.refetch()} /></div>
                  : assessedRecords.length === 0 ? <div className="py-4"><EmptyState title="No current assessments saved" description="Choose a risk above and click Save Assessment. Successfully saved assessments will appear here; unfinished risks remain in the assessment list." /></div>
                    : <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-[1120px] text-left text-sm">
                        <thead className="bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <tr>{['Risk code / title', 'Impact', 'Likelihood', 'Inherent exposure', 'Perceived control', 'Residual exposure', 'Root causes'].map(label => <th key={label} className="px-4 py-3 font-bold">{label}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {assessedRecords.map(record => {
                            const inherent = exposureBand(record.i_risk_exposure, 'I', options);
                            const residual = exposureBand(record.r_risk_exposure, 'R', options);
                            const colors = riskExposureColors(residual.band);
                            const topExposure = assessedRecords[0]?.r_risk_exposure;
                            const highest = topExposure != null && topExposure.trim() !== '' && Number.isFinite(Number(topExposure))
                              && residual.score !== '—' && Number(residual.score) === Number(topExposure);
                            const controlPercent = record.perceived_contr_eff == null ? Number.NaN : Number(record.perceived_contr_eff);
                            const control = options.control_effectiveness.find(item =>
                              Number.isFinite(controlPercent) && Math.abs(item.rating * 100 - controlPercent) < 1e-7,
                            );
                            return <tr key={record.risk_code} data-testid={`risk-summary-row-${record.risk_code}`} aria-current={compatibleRisk?.risk_code === record.risk_code ? true : undefined} className={`${colors.row} ${highest ? `outline outline-2 -outline-offset-2 ${colors.outline}` : ''}`}>
                              <td className={`max-w-[260px] border-l-4 px-4 py-3 ${colors.edge}`}>
                                <button className="text-left" data-testid={`select-summary-risk-${record.risk_code}`} onClick={() => onSelect(record.risk_code)}>
                                  <span className="block font-[Space_Mono] text-[10px] text-primary">{record.risk_code}</span>
                                  <span className="mt-1 block font-semibold leading-5 hover:text-primary">{record.risk_title}</span>
                                  {highest && <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}>Highest exposure</span>}
                                </button>
                              </td>
                              <td className="px-4 py-3"><span className="font-semibold">{factorName(record.i_rate, options.impact_factors)}</span></td>
                              <td className="px-4 py-3"><span className="font-semibold">{factorName(record.l_rate, options.likelihood_factors)}</span></td>
                              <td className="px-4 py-3"><ScopeExposure score={inherent.score} band={inherent.band} /></td>
                              <td className="px-4 py-3"><span className="font-semibold">{control?.eff_factor ?? (record.perceived_contr_eff != null ? 'Historical rating' : 'Not assessed')}</span><span className="mt-1 block text-[10px] text-muted-foreground">{control?.qual_criteria ?? 'Retained as recorded'}</span></td>
                              <td className="px-4 py-3"><ScopeExposure score={residual.score} band={residual.band} /></td>
                              <td className="px-4 py-3"><RiskSummaryCauses username={options.actor.username} riskCode={record.risk_code} staff={options.staff} /></td>
                            </tr>;
                          })}
                        </tbody>
                      </table>
                    </div>}

            <div className="mt-6 grid gap-5 border-t border-border pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><ShieldAlert className="h-3.5 w-3.5" /> Submit for Risk Owner review</div>
                <Field label="Submission comment (required)">
                  <textarea data-testid="input-risk-summary-comment" className={`${fieldClass} mt-1 min-h-20 resize-y`} value={comments} onChange={event => setComments(event.target.value)} placeholder="Add a concise note for the Risk Owner." />
                </Field>
                {ownerUsername && <p className="mt-2 text-xs text-muted-foreground">Recipient: <strong className="text-foreground">{recipientName}</strong>{recipient?.employee_name ? <span> · {ownerUsername}</span> : null}</p>}
                <div role="status" data-testid="status-risk-summary-readiness" className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-5 ${canSubmit ? 'bg-emerald-50 text-emerald-900' : error || recordsFailed || listShort ? 'bg-rose-50 text-rose-900' : 'bg-amber-50 text-amber-950'}`}>
                  {canSubmit ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span>{canSubmit ? `Ready to forward this register to ${recipientName}.` : blockedReason}</span>
                </div>
                 {(readiness.failed || (!readiness.waiting && !readiness.complete)) && <button className="mt-2 text-xs font-bold underline" onClick={() => readiness.query.refetch()}>Retry readiness check</button>}
              </div>
              <button type="button" data-testid="button-submit-risk-summary" disabled={!canSubmit} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-45" onClick={() => row && canSubmit && onSubmit(row)}>
                <Send className="h-4 w-4" />Submit for review
              </button>
            </div>
          </div>}
  </section>;
}
