import { useEffect, useMemo, useRef, useState } from 'react';
import { Redirect, useLocation, useSearch } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import ClientRatingsPage from './client-ratings';
import { canAccessRiskPage, riskPageDepartments } from './risk-access';
import {
  AlertCircle, ArrowUpRight, BadgeCheck, CalendarDays, Check, ClipboardCheck,
  FilePlus2, FileUp, History, LockKeyhole, RefreshCw, Shield, UsersRound, Workflow, X,
} from 'lucide-react';
import type { RiskHistoryEvent, RiskOptionsResponseData, RiskRecord, RiskRootCause, RiskDepartmentSummary, RiskAnalyticsResponseData } from '@workspace/api-client-react';
import {
  useAssignRiskTeam, useCloseRiskPeriod, useCreateRisk, useOpenRiskPeriod, useRiskHistory,
  useRiskOptions, useRiskRecord, useRiskRecords, useRiskSummary, useRiskWorkflow,
  useSaveRiskCause, useUpdateRisk, useRiskAnalytics,
} from './use-risk-register';
import { AssessmentPanel, NewRiskForm } from './risk-forms';
import RiskDashboard from './risk-dashboard';
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
import { parseReviewLink, reviewScopeError, reviewAvailability } from './review-link';

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
  const searchString = useSearch();
  const reviewLink = activePage === 'review' ? parseReviewLink(searchString) : null;
  const linkedScope = reviewLink && reviewLink !== 'invalid' ? reviewLink : null;
  const optionsQuery = useRiskOptions(username, Boolean(reviewLink));
  const savedOptions = envelopeData<RiskOptionsResponseData>(optionsQuery.data);
  const options = !optionsQuery.isError && savedOptions?.actor?.username === username ? savedOptions : undefined;
  const actor = options?.actor;
  const [departmentChoices, setDepartmentChoices] = useState<Partial<Record<PageKey, string>>>({});
  const pageCodes = riskPageDepartments(actor, activePage);
  const departments = (options?.departments ?? []).filter(item => pageCodes === null || pageCodes.includes(item.depart_code ?? ''));
  const selectedDepartment = riskDepartmentSelection(activePage, departmentChoices[activePage], departments);
  const department = linkedScope?.department ?? selectedDepartment;
  const clearReviewLink = () => {
    if (reviewLink) setLocation('/risk/review');
  };
  const setDepartment = (value: string) => {
    if (linkedScope) setViewPeriod(linkedScope.period);
    setDepartmentChoices(choices => ({ ...choices, [activePage]: value }));
    clearReviewLink();
  };
  const pageAllowed = canAccessRiskPage(actor, activePage);
  const access = activePage === 'update' ? 'update' as const : activePage === 'review' ? 'review' as const : 'view' as const;
  const periods = options?.periods ?? [];
  const [viewPeriod, setViewPeriod] = useState('');
  const [updatePeriod, setUpdatePeriod] = useState('');
  const period = linkedScope?.period ?? (activePage === 'update' ? updatePeriod : viewPeriod);
  const setPeriod = (value: string) => {
    if (linkedScope) setDepartmentChoices(choices => ({ ...choices, review: linkedScope.department }));
    (activePage === 'update' ? setUpdatePeriod : setViewPeriod)(value);
    clearReviewLink();
  };
  const linkError = options ? reviewScopeError(reviewLink, departments, periods) : '';
  const dataEnabled = Boolean(options && pageAllowed && !linkError && (!department || departments.some(item => item.depart_code === department)));
  const [search, setSearch] = useState('');
  const [selectedRiskCode, setSelectedRiskCode] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const assessmentTrigger = useRef<HTMLButtonElement | null>(null);
  const [notice, setNotice] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [comments, setComments] = useState('');
  const [reopening, setReopening] = useState<RiskDepartmentSummary | null>(null);
  const [signoffSelection, setSignoffSelection] = useState<{ department: string; period: string } | null>(null);
  const [population, setPopulation] = useState<'open' | 'all'>('open');
  const analyticsQuery = useRiskAnalytics(username, {
    ...(department ? { depart_code: department } : {}),
    ...(period ? { period_id: Number(period) } : {}),
    population,
  }, dataEnabled && activePage === 'dashboard');
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
      if (!reviewLink) {
        if (choice && !departments.some(item => item.depart_code === choice)) setDepartment('');
        if (period && !periods.some(item => String(item.period_id) === period)) setPeriod('');
      }
    }
  }, [options, actor, departments, periods, username, activePage, departmentChoices, period, searchString]);

  const params = useMemo(() => ({
    access,
    ...(department ? { depart_code: department } : {}),
    ...(period ? { period_id: Number(period) } : {}),
    ...(search ? { search } : {}),
    ...(activePage === 'closed' ? { view: 'closed' as const } : activePage === 'review' ? { view: 'submitted' as const } : activePage === 'update' ? { view: 'pending_assessment' as const } : undefined),
  }), [access, department, period, search, activePage]);
  const recordsQuery = useRiskRecords(username, params, dataEnabled, Boolean(reviewLink));
  const records = (envelopeData<RiskRecord[]>(recordsQuery.data) ?? []).filter(item =>
    (pageCodes === null || pageCodes.includes(item.depart_code)));
  const summaryQuery = useRiskSummary(username, { access, ...(department ? { depart_code: department } : {}), ...(period ? { period_id: Number(period) } : {}) }, dataEnabled, Boolean(reviewLink));
  useEffect(() => {
    // The workspace stays mounted during in-app navigation. Recheck an incoming
    // scope even if its query keys already exist in this session.
    if (!reviewLink) return;
    void optionsQuery.refetch();
    if (dataEnabled) {
      void recordsQuery.refetch();
      void summaryQuery.refetch();
    }
  }, [username, activePage, searchString, dataEnabled]);
  const summaries = (envelopeData<RiskDepartmentSummary[]>(summaryQuery.data) ?? []).filter(item =>
    (pageCodes === null || pageCodes.includes(item.depart_code))
    && (activePage !== 'update' || item.workflow_status === 'OPEN')
    && (activePage !== 'review' || item.workflow_status === 'SUBMITTED')
    && (activePage !== 'summary' || item.workflow_status === 'REVIEWED')
    && (activePage !== 'close' || item.workflow_status === 'SIGNED_OFF')
    && (activePage !== 'open' || item.workflow_status === 'CLOSED'));
  const signoffSummary = summaries.find(item => item.depart_code === signoffSelection?.department
    && String(item.period_id) === signoffSelection?.period);
  const selectSignoffSummary = (row: RiskDepartmentSummary) => {
    setSignoffSelection({ department: row.depart_code, period: String(row.period_id) });
    setSelectedRiskCode('');
    setDrawerOpen(false);
    setComments('');
  };
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
  const linkedSummary = (envelopeData<RiskDepartmentSummary[]>(summaryQuery.data) ?? [])
    .find(item => item.depart_code === linkedScope?.department && String(item.period_id) === linkedScope?.period);
  const linkReadError = linkedScope && dataEnabled
    ? summaryFailure || recordsFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')
      || (recordsQuery.isError ? queryError(recordsQuery.error) : '') : '';
  const linkAvailability = linkedScope && dataEnabled && !summaryQuery.isFetching && !summaryQuery.isError && !summaryFailure
    ? reviewAvailability(linkedSummary?.workflow_status) : '';
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
  const chooseAction = (action: 'SUBMIT' | 'REVIEW' | 'RETURN' | 'SIGN_OFF' | 'CLOSE' | 'REOPEN' | 'REVERT_REVIEW', row?: RiskDepartmentSummary, confirm = false, token?: string) => {
    const depart_code = row?.depart_code ?? department;
    const period_id = row?.period_id ?? Number(period);
    if (action === 'REOPEN' && !token) {
      if (row) { setMutationError(''); setReopening(row); }
      return;
    }
    if (confirm && action === 'CLOSE' && !window.confirm('Close this register? The event will be retained in history.')) return;
    workflow.mutate({ data: { depart_code, period_id, action, comments: comments.trim(), ...(token ? { confirmation_token: token } : {}) } }, {
      onSuccess: response => {
        if (['SIGN_OFF', 'REVERT_REVIEW', 'CLOSE'].includes(action) && !envelopeError(response)) {
          setSignoffSelection(null);
          setSelectedRiskCode('');
          setDrawerOpen(false);
        }
        if (action === 'REOPEN' && !envelopeError(response)) setReopening(null);
        if (['REVIEW', 'RETURN'].includes(action) && !envelopeError(response)) {
          setReviewOpen(false);
          setSelectedRiskCode('');
        }
        if (action === 'SUBMIT' && !envelopeError(response)) {
          setSelectedRiskCode('');
          setDrawerOpen(false);
        }
        if (action === 'REVIEW' && !envelopeError(response)) {
          setSignoffSelection({ department: depart_code, period: String(period_id) });
          setDepartmentChoices(choices => ({ ...choices, summary: '' }));
          setViewPeriod(String(period_id));
          setDrawerOpen(false);
          setSearch('');
          setLocation('/risk/summary');
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
          : action === 'REVIEW' ? 'Register reviewed and forwarded to Risk Register Signoff.'
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
      {linkError && <div role="alert" className="mb-6 rounded-xl border border-border p-4 text-sm">{linkError}</div>}
      {linkReadError && <ErrorNotice message={linkReadError} onRetry={() => {
        void optionsQuery.refetch(); void recordsQuery.refetch(); void summaryQuery.refetch();
      }} />}
      {linkAvailability && <div role="status" className="mb-6 rounded-xl border border-border p-4 text-sm">{linkAvailability}</div>}
      {options && !pageAllowed && <div role="alert" className="mb-6 rounded-xl border border-border p-4 text-sm">
        <strong>Access denied.</strong> {activePage === 'import' ? 'Legacy import is available to risk management only.' : activePage === 'update' ? 'Update Register is available to mapped department champions.' : 'Risk Register Review is available to mapped department risk owners.'}
      </div>}
      {!optionsQuery.isLoading && !optionsQuery.isError && !optionsFailure && noScope && <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Department access is not mapped.</strong><p className="mt-1">Contact your MIS administrator to set up your champion or owner department mapping.</p></div>
      </div>}
      {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><Check className="h-4 w-4" />{notice}<button aria-label="Dismiss notice" className="ml-auto" onClick={() => setNotice('')}><X className="h-4 w-4" /></button></div>}
      {mutationError && <div className="mb-4"><ErrorNotice message={mutationError} /></div>}

      {reviewLink && (optionsQuery.isFetching || summaryQuery.isFetching || recordsQuery.isFetching) && <p role="status" className="mb-4 text-sm">Checking current register access and status…</p>}
      {!optionsQuery.isLoading && !optionsQuery.isError && options && pageAllowed && !linkError && !linkReadError
        && !(reviewLink && (optionsQuery.isFetching || summaryQuery.isFetching || recordsQuery.isFetching)) && <main className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Risk office / {PAGES.find(item => item.key === activePage)?.short}</div><h2 className="mt-1 font-[Manrope] text-2xl font-bold">{title}</h2></div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Field label="Department"><select aria-label="Filter by department" data-testid="select-risk-department" className={`${fieldClass} sm:min-w-44`} value={department} onChange={event => setDepartment(event.target.value)}>
              <option value="">{manage ? 'All departments' : 'My assigned departments'}</option>{departments.map((item, index) => <option key={item.depart_code ?? index} value={item.depart_code ?? ''}>{item.depart_name ?? item.depart_code}</option>)}
            </select></Field>
            <Field label="Reporting period"><select aria-label="Filter by period" data-testid="select-risk-period" className={`${fieldClass} sm:min-w-44`} value={period} onChange={event => setPeriod(event.target.value)}>
              <option value="">Latest / all periods</option>{periods.map((item, index) => <option key={item.period_id ?? index} value={String(item.period_id ?? '')}>{dateLabel(item.period_from)} – {dateLabel(item.period_to)} · {item.status ?? '—'}</option>)}
            </select></Field>
          </div>
        </div>

        {activePage === 'dashboard' && <section className="space-y-5">
          <Field label="Risk population"><select aria-label="Risk population" className={`${fieldClass} max-w-sm`} value={population} onChange={event => setPopulation(event.target.value as 'open' | 'all')}>
            <option value="open">Open risks</option><option value="all">All active risks, including closed actions</option>
          </select></Field>
          <RiskDashboard overallAccess={manage} data={!analyticsQuery.isError && !envelopeError(analyticsQuery.data) ? envelopeData<RiskAnalyticsResponseData>(analyticsQuery.data) : undefined}
            loading={analyticsQuery.isLoading} error={envelopeError(analyticsQuery.data) || (analyticsQuery.isError ? queryError(analyticsQuery.error) : '')}
            retry={() => { void analyticsQuery.refetch(); }} onSelect={viewDetails} />
          <p className="text-xs text-muted-foreground">Register search below includes all active records in the selected department and period, including closed actions. Analytics above follow the population selector and are not narrowed by this search.</p>
          <RecordsTable records={records} totalRecords={activeCount} loading={recordsQuery.isLoading}
            error={recordsFailure || (recordsQuery.isError ? queryError(recordsQuery.error) : '')}
            retry={() => recordsQuery.refetch()} onSelect={viewDetails} search={search} setSearch={setSearch}
            title="Search the authorized register" />
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

        {activePage === 'summary' && <section className="space-y-5">
          <SummaryTable rows={summaries} loading={summaryQuery.isLoading || summaryQuery.isFetching}
            error={summaryFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')}
            retry={() => summaryQuery.refetch()} onSelect={selectSignoffSummary}
            selectedDepartment={signoffSummary?.depart_code} selectedPeriod={signoffSummary?.period_id} />
          {signoffSummary ? <>
            <RiskAssessmentSummary key={`${signoffSummary.depart_code}:${signoffSummary.period_id}`} mode="signoff" summaries={[signoffSummary]} options={options}
              department={signoffSummary.depart_code} period={String(signoffSummary.period_id)}
              comments={comments} setComments={setComments} mutating={mutating}
              onSubmit={row => chooseAction('SIGN_OFF', row)} onSelect={viewDetails}
              loading={summaryQuery.isLoading || summaryQuery.isFetching}
              error={summaryFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')}
              retry={() => summaryQuery.refetch()} />
            <WorkflowPanel summaries={[signoffSummary]} departments={departments} assignments={options.assignments}
              period={String(signoffSummary.period_id)} actor={actor} manage={manage}
              comments={comments} setComments={setComments} mutating={workflow.isPending}
              onAction={(action, row) => chooseAction(action, row)} />
          </> : <EmptyState title="Select a department register"
            description="Select a department awaiting sign-off. Signed-off registers leave this queue and appear in Risk Register Close." />}
        </section>}

        {activePage === 'status' && <SummaryTable rows={summaries} loading={summaryQuery.isLoading} error={summaryFailure || (summaryQuery.isError ? queryError(summaryQuery.error) : '')} retry={() => summaryQuery.refetch()} title="Department workflow status" />}

        {activePage === 'open' && <section className="space-y-5"><OpenPeriods options={options} manage={manage} mutating={openPeriod.isPending} onOpen={data => openPeriod.mutate({ data }, { onSuccess: response => announce(response, 'Reporting period opened.'), onError: error => setMutationError(queryError(error)) })} />
          <WorkflowPanel summaries={summaries} departments={departments} assignments={options.assignments} period={period} actor={actor} manage={manage} comments={comments} setComments={setComments} mutating={workflow.isPending} openView onAction={(action, row) => chooseAction(action, row, action === 'REOPEN')} />
        </section>}

        {activePage === 'close' && <section className="space-y-5">
          <SummaryTable rows={allDepartmentPeriodSummaries.filter(row => row.workflow_status === 'SIGNED_OFF')}
            loading={allDepartmentPeriodSummaryQuery.isLoading || allDepartmentPeriodSummaryQuery.isFetching}
            error={allDepartmentPeriodSummaryFailure || (allDepartmentPeriodSummaryQuery.isError ? queryError(allDepartmentPeriodSummaryQuery.error) : '')}
            retry={() => allDepartmentPeriodSummaryQuery.refetch()} title="Signed-OFF departmental registers" />
          <ReportingPeriodClose periods={periods} summaries={allDepartmentPeriodSummaries} summaryLoading={allDepartmentPeriodSummaryQuery.isLoading || allDepartmentPeriodSummaryQuery.isFetching} summaryError={allDepartmentPeriodSummaryFailure || (allDepartmentPeriodSummaryQuery.isError ? queryError(allDepartmentPeriodSummaryQuery.error) : '')} selectedPeriod={period} setSelectedPeriod={setPeriod} comments={comments} setComments={setComments} manage={manage} mutating={closePeriod.isPending} onClose={(periodId, closeComment) => {
            if (!window.confirm('Close all Signed-OFF departmental registers in this reporting period? Unsigned registers will remain unchanged. Closed registers will appear on Open Register, and history will be retained.')) return;
            closePeriod.mutate({ periodId, data: { comments: closeComment } }, { onSuccess: response => announce(response,
              envelopeData<{status:string}>(response)?.status === 'OPEN'
                ? 'Signed-OFF registers closed and moved to Open Register. The reporting period remains open for unsigned registers.'
                : 'Signed-OFF registers closed and moved to Open Register. The reporting period is now closed.'),
              onError: error => setMutationError(queryError(error)) });
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
