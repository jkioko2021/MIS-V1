import { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import ClientRatingsPage from './client-ratings';
import { canAccessRiskPage, riskPageDepartments } from './risk-access';
import {
  AlertCircle, ArrowUpRight, BadgeCheck, CalendarDays, Check, ClipboardCheck,
  FilePlus2, FileUp, History, LockKeyhole, RefreshCw, Shield, UsersRound, Workflow, X,
} from 'lucide-react';
import type { RiskHistoryEvent, RiskOptionsResponseData, RiskRecord, RiskRootCause, RiskDepartmentSummary } from '@workspace/api-client-react';
import {
  useAssignRiskTeam, useCloseRiskPeriod, useCreateRisk, useOpenRiskPeriod, useRiskHistory,
  useRiskOptions, useRiskRecord, useRiskRecords, useRiskSummary, useRiskWorkflow,
  useSaveRiskCause, useUpdateRisk,
} from './use-risk-register';
import { AssessmentPanel, NewRiskForm } from './risk-forms';
import { latestDepartmentReviews } from './department-reviews';
import { RecordsTable, RiskDrawer } from './risk-details';
import {
  HistoryTable, OpenPeriods, ReportingPeriodClose, SummaryTable, TeamMapping, WorkflowPanel,
} from './risk-workflow';
import {
  dateLabel, EmptyState, envelopeData, envelopeError, ErrorNotice, Field, fieldClass,
  queryError, SkeletonRows, StatusPill,
} from './risk-ui';
import RiskImportPanel from './risk-import';
import RiskAssessmentSummary from './risk-assessment-summary';
import RiskReviewDialog from './risk-review-dialog';
import RiskReopenDialog from './risk-reopen-dialog';
import { riskDepartmentSelection } from './department-filter';

type PageKey = 'dashboard' | 'new' | 'update' | 'review' | 'summary' | 'status' | 'open' | 'close' | 'closed' | 'history' | 'client-rating' | 'champions' | 'import';
const PAGES: Array<{ key: PageKey; title: string; short: string; icon: typeof Shield }> = [
  { key: 'new', title: 'Add New Risk', short: 'Add New Risk', icon: FilePlus2 },
  { key: 'update', title: 'Update Register', short: 'Update Register', icon: ClipboardCheck },
  { key: 'review', title: 'Risk Register Review', short: 'Risk Register Review', icon: Workflow },
  { key: 'summary', title: 'Risk Register Signoff', short: 'Risk Register Signoff', icon: BadgeCheck },
  { key: 'close', title: 'Risk Register Close', short: 'Risk Register Close', icon: LockKeyhole },
  { key: 'open', title: 'Open Register', short: 'Open Register', icon: CalendarDays },
  { key: 'status', title: 'Risk Register Status', short: 'Risk Register Status', icon: ClipboardCheck },
  { key: 'history', title: 'Risk Register view', short: 'Risk Register view', icon: History },
  { key: 'client-rating', title: 'Client Rating', short: 'Client Rating', icon: BadgeCheck },
  { key: 'dashboard', title: 'Risk Dashboard', short: 'Risk Dashboard', icon: Shield },
  { key: 'import', title: 'Legacy Risk Import', short: 'Legacy Import', icon: FileUp },
];
const navLabels: Record<string, PageKey> = Object.fromEntries(PAGES.map(item => [item.key, item.key]));

function RiskRegisterWorkspace() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const username = user?.username ?? '';
  const routeKey = location.split('/')[2] ?? 'dashboard';
  const activePage: PageKey = navLabels[routeKey] ?? 'dashboard';
  const optionsQuery = useRiskOptions(username);
  const savedOptions = envelopeData<RiskOptionsResponseData>(optionsQuery.data);
  const options = !optionsQuery.isError && savedOptions?.actor?.username === username ? savedOptions : undefined;
  const actor = options?.actor;
  const [departmentChoices, setDepartmentChoices] = useState<Partial<Record<PageKey, string>>>({});
  const pageCodes = riskPageDepartments(actor, activePage);
  const departments = (options?.departments ?? []).filter(item => pageCodes === null || pageCodes.includes(item.depart_code ?? ''));
  const department = riskDepartmentSelection(activePage, departmentChoices[activePage], departments);
  const setDepartment = (value: string) => setDepartmentChoices(choices => ({ ...choices, [activePage]: value }));
  const pageAllowed = canAccessRiskPage(actor, activePage);
  const dataEnabled = Boolean(options && pageAllowed && (!department || departments.some(item => item.depart_code === department)));
  const access = activePage === 'update' ? 'update' as const : activePage === 'review' ? 'review' as const : 'view' as const;
  const periods = options?.periods ?? [];
  const [viewPeriod, setViewPeriod] = useState('');
  const [updatePeriod, setUpdatePeriod] = useState('');
  const period = activePage === 'update' ? updatePeriod : viewPeriod;
  const setPeriod = activePage === 'update' ? setUpdatePeriod : setViewPeriod;
  const [search, setSearch] = useState('');
  const [selectedRiskCode, setSelectedRiskCode] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const assessmentTrigger = useRef<HTMLButtonElement | null>(null);
  const [notice, setNotice] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [comments, setComments] = useState('');
  const [reopening, setReopening] = useState<RiskDepartmentSummary | null>(null);
  useEffect(() => {
    setSelectedRiskCode('');
    setDrawerOpen(false);
    setReviewOpen(false);
    setComments('');
  }, [activePage, department, period, username]);

  const initializedFor = useRef('');
  useEffect(() => {
    if (!options || actor?.username !== username) return;
    if (initializedFor.current !== username) {
      initializedFor.current = username;
      const active = periods.find(item => String(item.status ?? '').toLowerCase() === 'open');
      setViewPeriod(active?.period_id ? String(active.period_id) : '');
      setSearch('');
    } else {
      // Empty values intentionally mean "All", not "pick a default again".
      const choice = departmentChoices[activePage];
      if (choice && !departments.some(item => item.depart_code === choice)) setDepartment('');
      if (period && !periods.some(item => String(item.period_id) === period)) setPeriod('');
    }
  }, [options, actor, departments, periods, username, activePage, departmentChoices, period]);

  const params = useMemo(() => ({
    access,
    ...(department ? { depart_code: department } : {}),
    ...(period ? { period_id: Number(period) } : {}),
    ...(search ? { search } : {}),
    ...(activePage === 'closed' ? { view: 'closed' as const } : activePage === 'review' ? { view: 'submitted' as const } : activePage === 'update' ? { view: 'pending_assessment' as const } : undefined),
  }), [access, department, period, search, activePage]);
  const recordsQuery = useRiskRecords(username, params, dataEnabled);
  const records = (envelopeData<RiskRecord[]>(recordsQuery.data) ?? []).filter(item =>
    (pageCodes === null || pageCodes.includes(item.depart_code)));
  const summaryQuery = useRiskSummary(username, { access, ...(department ? { depart_code: department } : {}), ...(period ? { period_id: Number(period) } : {}) }, dataEnabled);
  const summaries = (envelopeData<RiskDepartmentSummary[]>(summaryQuery.data) ?? []).filter(item =>
    (pageCodes === null || pageCodes.includes(item.depart_code))
    && (activePage !== 'update' || item.workflow_status === 'OPEN')
    && (activePage !== 'review' || item.workflow_status === 'SUBMITTED'));
  const allDepartmentPeriodSummaryQuery = useRiskSummary(username, period ? { period_id: Number(period) } : {}, dataEnabled && activePage === 'close');
  const allDepartmentPeriodSummaries = envelopeData<RiskDepartmentSummary[]>(allDepartmentPeriodSummaryQuery.data) ?? [];
  const allDepartmentPeriodSummaryFailure = allDepartmentPeriodSummaryQuery.data ? envelopeError(allDepartmentPeriodSummaryQuery.data) ?? '' : '';
  const historyQuery = useRiskHistory(username, { ...(department ? { depart_code: department } : {}), ...(period ? { period_id: Number(period) } : {}) }, dataEnabled && activePage === 'history');
  const history = envelopeData<RiskHistoryEvent[]>(historyQuery.data) ?? [];
  const detailQuery = useRiskRecord(username, selectedRiskCode);
  const savedDetail = envelopeData<{ risk: RiskRecord; root_causes: RiskRootCause[]; history: RiskHistoryEvent[] }>(detailQuery.data);
  const detail = pageAllowed && savedDetail && (pageCodes === null || pageCodes.includes(savedDetail.risk.depart_code)) ? savedDetail : undefined;
  const recordsFailure = recordsQuery.data ? envelopeError(recordsQuery.data) ?? '' : '';
  const summaryFailure = summaryQuery.data ? envelopeError(summaryQuery.data) ?? '' : '';
  const historyFailure = historyQuery.data ? envelopeError(historyQuery.data) ?? '' : '';
  const detailFailure = detailQuery.data ? envelopeError(detailQuery.data) ?? '' : '';
  const createRisk = useCreateRisk();
  const updateRisk = useUpdateRisk();
  const saveCause = useSaveRiskCause();
  const workflow = useRiskWorkflow();
  const openPeriod = useOpenRiskPeriod();
  const closePeriod = useCloseRiskPeriod();
  const assignTeam = useAssignRiskTeam();
  const mutating = createRisk.isPending || updateRisk.isPending || saveCause.isPending || workflow.isPending || openPeriod.isPending || closePeriod.isPending || assignTeam.isPending;
  const manage = Boolean(actor?.can_manage);
  const selectAssessment = (code: string) => {
    setSelectedRiskCode(code);
    setDrawerOpen(false);
    window.requestAnimationFrame(() => document.getElementById('risk-assessment-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const viewDetails = (code: string) => {
    setSelectedRiskCode(code);
    setDrawerOpen(true);
  };
  const reviewAssessment = (code: string, trigger?: HTMLButtonElement) => {
    assessmentTrigger.current = trigger ?? null;
    setSelectedRiskCode(code);
    setDrawerOpen(false);
    setReviewOpen(true);
  };
  const assessmentEditor = detailFailure || detailQuery.isError
    ? <ErrorNotice message={detailFailure || queryError(detailQuery.error)} onRetry={() => detailQuery.refetch()} />
    : <AssessmentPanel risk={detail?.risk} roots={detail?.root_causes ?? []} staff={options?.staff ?? []}
      objectives={options?.objectives ?? []} categories={options?.categories ?? []}
      actionStatuses={options?.action_statuses ?? []}
      controlRatings={options?.control_effectiveness ?? []}
      impactFactors={options?.impact_factors ?? []} likelihoodFactors={options?.likelihood_factors ?? []}
      exposureBands={options?.exposure_bands ?? []}
      loading={Boolean(selectedRiskCode) && detailQuery.isLoading} mutating={mutating}
      onSave={async (data, code) => {
        try {
          const response = await updateRisk.mutateAsync({ riskCode: code, data });
          const error = envelopeError(response);
          announce(response, activePage === 'update' ? 'Assessment saved and summary updated. Use Revise assessment in the Risk Summary to make further changes.' : 'Assessment saved.');
          if (!error && activePage === 'update') setSelectedRiskCode(current => current === code ? '' : current);
          return error || undefined;
        } catch (error) {
          const message = queryError(error);
          setMutationError(message);
          return message;
        }
      }}
      onCause={async (data, code) => {
        try {
          const response = await saveCause.mutateAsync({ riskCode: code, data });
          announce(response, 'Root cause and action saved.');
          return !envelopeError(response);
        } catch (error) {
          setMutationError(queryError(error));
          return false;
        }
      }} />;

  const setPage = (page: PageKey) => setLocation(page === 'dashboard' ? '/risk' : `/risk/${page}`);
  const announce = (response: unknown, success: string) => {
    const error = envelopeError(response);
    setMutationError(error ?? '');
    setNotice(error ? '' : success);
    if (!error) setComments('');
  };
  const chooseAction = (action: 'SUBMIT' | 'REVIEW' | 'RETURN' | 'SIGN_OFF' | 'CLOSE' | 'REOPEN' | 'PROCESS', row?: RiskDepartmentSummary, confirm = false, token?: string) => {
    const depart_code = row?.depart_code ?? department;
    const period_id = row?.period_id ?? Number(period);
    if (action === 'REOPEN' && !token) {
      if (row) { setMutationError(''); setReopening(row); }
      return;
    }
    if (confirm && action === 'CLOSE' && !window.confirm('Close this register? The event will be retained in history.')) return;
    workflow.mutate({ data: { depart_code, period_id, action, comments: comments.trim(), ...(token ? { confirmation_token: token } : {}) } }, {
      onSuccess: response => {
        if (action === 'REOPEN' && !envelopeError(response)) setReopening(null);
        if (['REVIEW', 'RETURN'].includes(action) && !envelopeError(response)) {
          setReviewOpen(false);
          setSelectedRiskCode('');
        }
        if (action === 'SUBMIT' && !envelopeError(response)) {
          setSelectedRiskCode('');
          setDrawerOpen(false);
        }
        announce(response, action === 'REOPEN'
        ? 'Selected department reopened and the shared reporting period is OPEN. Only this department requires reassessment; other departments remain unchanged. Saved scores, closed actions and history are retained.'
        : action === 'RETURN'
        ? `${action.replace('_', ' ')} recorded. All department risks require reassessment; saved scores, root causes and prior history remain.`
        : action === 'SUBMIT' ? `Department register forwarded for Risk Owner review. ${
          (envelopeData<{ notification?: { email_status?: string } }>(response)?.notification?.email_status === 'WAITING_CONFIGURATION')
            ? 'Owner email is not sent: configure a verified email sender.'
            : (envelopeData<{ notification?: { email_status?: string } }>(response)?.notification?.email_status === 'NO_RECIPIENT')
              ? 'Owner email is not sent: their email address is missing or invalid.'
              : 'Owner email is queued; delivery status is shown in Department Summary.'}`
          : `${action.replace('_', ' ')} recorded.`);
      },
      onError: error => setMutationError(queryError(error)),
    });
  };

  const title = PAGES.find(item => item.key === activePage)?.title ?? 'Risk dashboard';
  const recordTotals = !recordsQuery.isError && !recordsFailure ? recordsQuery.data?.totals : undefined;
  const activeCount = recordTotals?.active_risks;
  const assessedCount = recordTotals?.assessed_risks;
  const overdueCount = summaries.reduce((total, item) => total + (item.overdue_actions ?? 0), 0);
  const optionsFailure = optionsQuery.data && !envelopeData(optionsQuery.data) ? envelopeError(optionsQuery.data) : '';
  const activePeriod = periods.find(item => String(item.period_id) === period);
  const noScope = !optionsQuery.isLoading && !optionsQuery.isError && (!actor || (!manage && !(actor.champion_departments.length || actor.owner_departments.length)));

  return <div className="min-h-[100dvh] bg-background">
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-9">
      <div className="mb-7 flex flex-col justify-between gap-5 border-b border-border/80 pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.19em] text-primary"><Shield className="h-4 w-4" /> Enterprise risk · MIS</div>
          <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight sm:text-[2.55rem]">Risk register</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">One accountable record of exposure, action ownership and every decision made along the way.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs"><span className="text-muted-foreground">Signed in as </span><strong>{username || 'Staff'}</strong></div>
          {manage && <span className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">Management</span>}
          {activePeriod && <span className="rounded-lg border border-border bg-card px-3 py-2 text-xs"><span className="text-muted-foreground">Period </span>{dateLabel(activePeriod.period_from)} – {dateLabel(activePeriod.period_to)}</span>}
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-1">
        {PAGES.filter(item => canAccessRiskPage(actor, item.key)).map(({ key, short, icon: Icon }) => <button key={key} onClick={() => setPage(key)} data-testid={`tab-risk-${key}`}
          className={`inline-flex shrink-0 items-center gap-2 rounded-t-lg px-3 py-2.5 text-xs font-semibold transition ${activePage === key ? 'border-b-2 border-primary bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}>
          <Icon className="h-3.5 w-3.5" />{short}</button>)}
      </div>

      {optionsQuery.isLoading && <div className="space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-muted" /><SkeletonRows /></div>}
      {optionsQuery.isError && <ErrorNotice message={queryError(optionsQuery.error)} onRetry={() => optionsQuery.refetch()} />}
      {optionsFailure && <ErrorNotice message={optionsFailure} onRetry={() => optionsQuery.refetch()} />}
      {options && !pageAllowed && <div role="alert" className="mb-6 rounded-xl border border-border p-4 text-sm">
        <strong>Access denied.</strong> {activePage === 'import' ? 'Legacy import is available to risk management only.' : activePage === 'update' ? 'Update Register is available to mapped department champions.' : 'Risk Register Review is available to mapped department risk owners.'}
      </div>}
      {!optionsQuery.isLoading && !optionsQuery.isError && !optionsFailure && noScope && <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Department access is not mapped.</strong><p className="mt-1">Contact your MIS administrator to set up your champion or owner department mapping.</p></div>
      </div>}
      {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><Check className="h-4 w-4" />{notice}<button aria-label="Dismiss notice" className="ml-auto" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}
      {mutationError && <div className="mb-4"><ErrorNotice message={mutationError} /></div>}

      {!optionsQuery.isLoading && !optionsQuery.isError && options && pageAllowed && <main className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Risk office / {PAGES.find(item => item.key === activePage)?.short}</div><h2 className="mt-1 font-[Manrope] text-2xl font-bold">{title}</h2></div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Field label="Department"><select aria-label="Filter by department" data-testid="select-risk-department" className={`${fieldClass} sm:min-w-44`} value={department} onChange={event => setDepartment(event.target.value)}>
              <option value="">All mapped departments</option>{departments.map((item, index) => <option key={item.depart_code ?? index} value={item.depart_code ?? ''}>{item.depart_name ?? item.depart_code}</option>)}
            </select></Field>
            <Field label="Reporting period"><select aria-label="Filter by period" data-testid="select-risk-period" className={`${fieldClass} sm:min-w-44`} value={period} onChange={event => setPeriod(event.target.value)}>
              <option value="">Latest / all periods</option>{periods.map((item, index) => <option key={item.period_id ?? index} value={String(item.period_id ?? '')}>{dateLabel(item.period_from)} – {dateLabel(item.period_to)} · {item.status ?? '—'}</option>)}
            </select></Field>
          </div>
        </div>

        {activePage === 'dashboard' && <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
            <div className="relative overflow-hidden rounded-2xl bg-[#16483f] p-6 text-[#f5f0e5] sm:p-8">
              <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" /><div className="absolute -right-2 -top-7 h-44 w-44 rounded-full border border-white/10" />
              <div className="relative max-w-xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#c8b779]">Department accountability</p>
                <h3 className="mt-4 font-[Manrope] text-3xl font-bold leading-tight sm:text-4xl">See the risk.<br />See who owns the next move.</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">Assessment, review and sign-off stay connected to the record—not scattered across inboxes and spreadsheet copies.</p>
                <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#e8d6a2] px-4 py-2.5 text-sm font-bold text-[#193c35] hover:bg-[#f0e4c2]" onClick={() => setPage('new')}><FilePlus2 className="h-4 w-4" /> Register a risk <ArrowUpRight className="h-4 w-4" /></button>
              </div>
              <div className="relative mt-8 grid max-w-lg grid-cols-3 border-t border-white/15 pt-5">
                <div><strong className="block font-[Space_Mono] text-2xl">{activeCount ?? '—'}</strong><span className="text-xs text-white/65">Active risks</span></div>
                <div><strong className="block font-[Space_Mono] text-2xl">{assessedCount ?? '—'}</strong><span className="text-xs text-white/65">Assessed</span></div>
                <div><strong className="block font-[Space_Mono] text-2xl">{overdueCount}</strong><span className="text-xs text-white/65">Behind schedule</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Workflow pulse</div><h3 className="mt-1 font-[Manrope] text-lg font-bold">Department reviews</h3></div><Workflow className="h-5 w-5 text-primary" /></div>
              {summaryQuery.isLoading ? <SkeletonRows /> : summaryQuery.isError || summaryFailure ? <ErrorNotice message={summaryFailure || queryError(summaryQuery.error)} onRetry={() => summaryQuery.refetch()} /> : summaries.length ? <div className="space-y-1">
                  {latestDepartmentReviews(summaries).slice(0, 5).map(row => <div key={row.depart_code} className="flex items-center gap-3 border-t border-border/70 py-3 first:border-0">
                   <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{row.depart_name}</div><div className="text-xs text-muted-foreground">{row.total_risks} risks · {row.assessed_risks ?? 0} assessed</div>{!period && <div className="mt-1 text-[10px] text-muted-foreground">Latest period: {dateLabel(row.period_from)} – {dateLabel(row.period_to)}</div>}</div>
                  <StatusPill status={row.workflow_status} />
                </div>)}</div> : <EmptyState title="No department summaries yet" description="Summaries appear when risk data is available for this period." />}
            </div>
          </div>
           <p className="text-xs text-muted-foreground">Active risks and Assessed cover all matching risks in your authorized departments and selected reporting period.</p>
           <RecordsTable records={records} totalRecords={activeCount} loading={recordsQuery.isLoading} error={recordsFailure || (recordsQuery.isError ? queryError(recordsQuery.error) : '')} retry={() => recordsQuery.refetch()} onSelect={viewDetails} search={search} setSearch={setSearch} title="Risk register" />
        </section>}

        {activePage === 'new' && <NewRiskForm options={options} activeDepartment={department} period={period} mutation={createRisk} mutating={mutating} onSubmit={response => announce(response, 'Risk registered.')} onError={error => setMutationError(queryError(error))} />}

        {activePage === 'update' && <section className="space-y-6">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.45fr)]">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary font-[Space_Mono] text-xs font-bold text-primary">01</span><div><h3 className="font-[Manrope] text-base font-bold">Choose a risk</h3><p className="text-xs text-muted-foreground">Only risks awaiting assessment appear here. Revise saved assessments from the Risk Summary below.</p></div></div>
              <RecordsTable records={records} totalRecords={activeCount} loading={recordsQuery.isLoading} error={recordsFailure || (recordsQuery.isError ? queryError(recordsQuery.error) : '')} retry={() => recordsQuery.refetch()} onSelect={selectAssessment} search={search} setSearch={setSearch} title="Assessment queue" compact assessmentList exposureBands={options.exposure_bands ?? []} />
            </div>
            <div id="risk-assessment-editor" className="min-w-0 scroll-mt-5">
              <div className="mb-3 flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary font-[Space_Mono] text-xs font-bold text-primary">02</span><div><h3 className="font-[Manrope] text-base font-bold">Assess and mitigate</h3><p className="text-xs text-muted-foreground">Update factors, controls, actions and root causes.</p></div></div>
              {assessmentEditor}
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-border pt-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-[Space_Mono] text-xs font-bold text-primary-foreground">03</span><div><h3 className="font-[Manrope] text-base font-bold">Review the whole cycle</h3><p className="text-xs text-muted-foreground">Confirm every active risk before submitting this department register.</p></div></div>
          <RiskAssessmentSummary
            summaries={summaries}
            options={options}
            department={department}
            period={period}
            selectedRisk={detail?.risk}
            comments={comments}
            setComments={setComments}
            mutating={workflow.isPending}
            onSubmit={row => chooseAction('SUBMIT', row)}
            onSelect={selectAssessment}
            loading={summaryQuery.isLoading || summaryQuery.isFetching}
            error={summaryFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')}
            retry={() => summaryQuery.refetch()}
          />
        </section>}

        {activePage === 'review' && <section className="space-y-5">
           <RiskAssessmentSummary mode="review" summaries={summaries} options={options}
             department={department} period={period} selectedRisk={detail?.risk}
             comments={comments} setComments={setComments} mutating={mutating}
             onSubmit={row => chooseAction('SUBMIT', row)} onSelect={reviewAssessment}
             loading={summaryQuery.isLoading || summaryQuery.isFetching}
             error={summaryFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')}
             retry={() => summaryQuery.refetch()} />
          <WorkflowPanel summaries={summaries} departments={departments} assignments={options.assignments} period={period} actor={actor} manage={manage} comments={comments} setComments={setComments} mutating={workflow.isPending} onAction={(action, row) => chooseAction(action, row)} />
        </section>}

        {activePage === 'summary' && <section className="space-y-5"><SummaryTable rows={summaries} loading={summaryQuery.isLoading} error={summaryFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')} retry={() => summaryQuery.refetch()} /><WorkflowPanel summaries={summaries} departments={departments} assignments={options.assignments} period={period} actor={actor} manage={manage} comments={comments} setComments={setComments} mutating={workflow.isPending} onAction={(action, row) => chooseAction(action, row)} /></section>}

        {activePage === 'status' && <SummaryTable rows={summaries} loading={summaryQuery.isLoading} error={summaryFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')} retry={() => summaryQuery.refetch()} title="Department workflow status" />}

        {activePage === 'open' && <section className="space-y-5"><OpenPeriods options={options} manage={manage} mutating={openPeriod.isPending} onOpen={data => openPeriod.mutate({ data }, { onSuccess: response => announce(response, 'Reporting period opened.'), onError: error => setMutationError(queryError(error)) })} />
          <WorkflowPanel summaries={summaries} departments={departments} assignments={options.assignments} period={period} actor={actor} manage={manage} comments={comments} setComments={setComments} mutating={workflow.isPending} openView onAction={(action, row) => chooseAction(action, row, action === 'REOPEN')} />
        </section>}

        {activePage === 'close' && <section className="space-y-5">
          <WorkflowPanel summaries={summaries} departments={departments} assignments={options.assignments} period={period} actor={actor} manage={manage} comments={comments} setComments={setComments} mutating={workflow.isPending} closeView onAction={(action, row) => chooseAction(action, row, action === 'CLOSE')} />
          <ReportingPeriodClose periods={periods} summaries={allDepartmentPeriodSummaries} summaryLoading={allDepartmentPeriodSummaryQuery.isLoading} summaryError={allDepartmentPeriodSummaryFailure || (allDepartmentPeriodSummaryQuery.isError ? queryError(allDepartmentPeriodSummaryQuery.error) : '')} selectedPeriod={period} setSelectedPeriod={setPeriod} comments={comments} setComments={setComments} manage={manage} mutating={closePeriod.isPending} onClose={(periodId, closeComment) => {
            if (!window.confirm('Close this reporting period? It will be retained as an archive and cannot be edited as open.')) return;
            closePeriod.mutate({ periodId, data: { comments: closeComment } }, { onSuccess: response => announce(response, 'Reporting period closed.'), onError: error => setMutationError(queryError(error)) });
          }} />
        </section>}

         {activePage === 'closed' && <RecordsTable records={records} totalRecords={activeCount} closedView loading={recordsQuery.isLoading} error={recordsFailure || (recordsQuery.isError ? queryError(recordsQuery.error) : '')} retry={() => recordsQuery.refetch()} onSelect={viewDetails} search={search} setSearch={setSearch} title="Closed action & archive records" />}
        {activePage === 'history' && <HistoryTable events={history} loading={historyQuery.isLoading} error={historyFailure || (historyQuery.isError ? queryError(historyQuery.error) : '')} retry={() => historyQuery.refetch()} />}
        {activePage === 'import' && manage && <RiskImportPanel key={username} options={options} />}
        {activePage === 'champions' && <TeamMapping options={options} manage={manage} mutating={assignTeam.isPending} onAssign={data => assignTeam.mutate({ data }, { onSuccess: response => announce(response, 'Department team mapping saved.'), onError: error => setMutationError(queryError(error)) })} />}
      </main>}

       {drawerOpen && selectedRiskCode && <RiskDrawer riskCode={selectedRiskCode} risk={detail?.risk} roots={detail?.root_causes ?? []} events={detail?.history ?? []} loading={detailQuery.isLoading} error={detailFailure || (detailQuery.isError ? queryError(detailQuery.error) : '')} onClose={() => setDrawerOpen(false)} />}
       {activePage === 'review' && pageAllowed && <RiskReviewDialog open={reviewOpen && Boolean(selectedRiskCode)} riskCode={selectedRiskCode}
         trigger={assessmentTrigger.current} mutating={mutating} onClose={() => {
           setReviewOpen(false);
           setSelectedRiskCode('');
         }}>{assessmentEditor}</RiskReviewDialog>}
      {reopening && manage && <RiskReopenDialog key={`${username}:${reopening.depart_code}:${reopening.period_id}`} username={username}
        departCode={reopening.depart_code} periodId={reopening.period_id ?? Number(period)} comments={comments}
        mutating={workflow.isPending} error={mutationError} onClose={() => { setReopening(null); setMutationError(''); }}
        onConfirm={token => chooseAction('REOPEN', reopening, false, token)} />}
      {mutating && <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold shadow-lg"><RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />Saving risk register changes</div>}
    </div>
  </div>;
}

export default function RiskRegisterPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  if (location === '/risk/champions') return <Redirect to="/risk-administration/mappings" />;
  if (location === '/risk/client-rating') return <ClientRatingsPage />;
  // Never reuse another actor's filters, selected detail or notices, even with cached options.
  return <RiskRegisterWorkspace key={user?.username ?? ''} />;
}
