import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle, ArrowDownToLine, ArrowLeft, ArrowRight, BadgeCheck, ClipboardList,
  Database, FileSearch, RefreshCw, RotateCcw, Search, ShieldCheck,
} from 'lucide-react';
import {
  getClientRatingsReport, getGetClientRatingOptionsQueryKey, getListClientRatingsQueryKey,
  useGetClientRatingOptions, useListClientRatings,
  type ListClientRatingsParams, type ListClientRatings200DataRecordsItem,
} from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth-context';
import { buttonClass, dateLabel, EmptyState, envelopeError, fieldClass, queryError, secondaryButton } from './risk-ui';

const PAGE_SIZE = 20;
const FRESH_FOR_MS = 30_000;

function isForbidden(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 403);
}

function getErrorMessage(error: unknown) {
  if (isForbidden(error)) return 'Access is limited to active administrators and Risk Management accounts. Contact your MIS administrator if you believe you should have access.';
  return queryError(error);
}

function RatingTag({ rating }: { rating: string }) {
  const style = rating.toLowerCase() === 'high' ? 'border-rose-200 bg-rose-50 text-rose-800'
    : rating.toLowerCase() === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-800'
      : rating.toLowerCase() === 'low' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-border bg-muted text-muted-foreground';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${style}`}>{rating || 'Unspecified'}</span>;
}

function DetailValue({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">{label}</div>
    <div className="mt-1 break-words text-sm font-medium text-foreground">{value || <span className="font-normal text-muted-foreground">—</span>}</div>
  </div>;
}

function ClientRatingCard({ record }: { record: ListClientRatings200DataRecordsItem }) {
  return <article data-testid={`card-client-rating-${record.rating_id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
      <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">File {record.file_no}</div>
        <h3 className="mt-1 truncate text-base font-bold">{record.proposer}</h3></div>
      <RatingTag rating={record.risk_rating} />
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-4">
      <DetailValue label="Policy" value={record.policy_code} />
      <DetailValue label="Cover type" value={record.cover_type} />
      <DetailValue label="System" value={record.system ?? 'Not captured in source record'} />
      <DetailValue label="Invoice" value={record.invoice_number} />
      <DetailValue label="Reason" value={record.reason} />
      <DetailValue label="Entered by" value={record.entered_by} />
      <DetailValue label="Entry date" value={dateLabel(record.entry_date ?? undefined)} />
      <DetailValue label="Record ID" value={String(record.rating_id)} />
    </div>
  </article>;
}

export default function ClientRatingsPage() {
  const { user } = useAuth();
  const username = user?.username ?? '';
  const [searchBy, setSearchBy] = useState<'proposer' | 'policy'>('proposer');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const reportRequest = useRef<AbortController | null>(null);
  useEffect(() => () => reportRequest.current?.abort(), [username]);

  const optionsQuery = useGetClientRatingOptions({
    query: {
      queryKey: ['client-rating-options', username, ...getGetClientRatingOptionsQueryKey()],
      enabled: Boolean(username),
      staleTime: FRESH_FOR_MS,
      refetchOnWindowFocus: true,
    },
  });
  const options = optionsQuery.data?.ok && !optionsQuery.isError ? optionsQuery.data.data : undefined;

  const params = useMemo<ListClientRatingsParams>(() => ({
    search_by: searchBy,
    search: search.trim() || undefined,
    rating: rating as ListClientRatingsParams['rating'],
    reason: reason || undefined,
    page,
    page_size: PAGE_SIZE,
  }), [searchBy, search, rating, reason, page]);
  const listQuery = useListClientRatings(params, {
    query: {
      queryKey: ['client-ratings', username, ...getListClientRatingsQueryKey(params)],
      enabled: Boolean(username) && Boolean(options),
      staleTime: FRESH_FOR_MS,
      refetchOnWindowFocus: true,
    },
  });
  const records = listQuery.data?.ok && !listQuery.isError && options ? listQuery.data.data.records : [];
  const result = listQuery.data?.ok && !listQuery.isError && options ? listQuery.data.data : undefined;
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));
  const optionFailure = optionsQuery.data && !optionsQuery.data.ok
    ? envelopeError(optionsQuery.data)
    : '';
  const listFailure = listQuery.data && !listQuery.data.ok
    ? envelopeError(listQuery.data)
    : '';
  const forbidden = isForbidden(optionsQuery.error) || isForbidden(listQuery.error);

  const refresh = () => {
    void optionsQuery.refetch();
    if (options) void listQuery.refetch();
  };

  const reset = () => {
    setSearchBy('proposer');
    setSearchInput('');
    setSearch('');
    setRating('');
    setReason('');
    setPage(1);
    setReportError('');
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const downloadReport = async () => {
    setReportBusy(true);
    setReportError('');
    const controller = new AbortController();
    reportRequest.current = controller;
    try {
      const csv = await getClientRatingsReport({
        search_by: searchBy,
        search: search.trim() || undefined,
        rating: rating as ListClientRatingsParams['rating'],
        reason: reason || undefined,
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (typeof csv !== 'string' || !csv.trim()) throw new Error('The report service returned an empty CSV file. Try again.');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `client-ratings-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (!controller.signal.aborted) setReportError(getErrorMessage(error));
    } finally {
      setReportBusy(false);
    }
  };

  return <div className="min-h-[100dvh] bg-background">
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-9">
      <header className="mb-6 flex flex-col justify-between gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.19em] text-primary">
            <ShieldCheck className="h-4 w-4" /> Risk office · MIS
          </div>
          <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight sm:text-[2.55rem]">Client Rating</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Search saved client classifications and follow the accountable handoff back to its source record.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-border bg-card px-3 py-2 text-xs"><span className="text-muted-foreground">Signed in as </span><strong>{username || 'Staff'}</strong></span>
          <button type="button" onClick={refresh} disabled={optionsQuery.isFetching || listQuery.isFetching} className={secondaryButton} data-testid="button-refresh-client-ratings">
            <RefreshCw className={`h-4 w-4 ${optionsQuery.isFetching || listQuery.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <section className="mb-6 overflow-hidden rounded-2xl bg-[#16483f] p-5 text-[#f5f0e5] sm:p-7">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d9c987]">Persisted AML classifications</p>
            <h2 className="mt-2 font-[Manrope] text-xl font-bold sm:text-2xl">A record of the classification already made.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">This view reports actual saved AML document classifications—not enterprise assessment scores. It is read-only; rating decisions and source records remain with their accountable teams.</p>
          </div>
          <div className="flex items-center gap-3 border-t border-white/15 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10"><Database className="h-5 w-5 text-[#e8d6a2]" /></div>
            <div><div className="font-[Space_Mono] text-sm font-bold">{result?.total ?? (options?.total ?? '—')}</div><div className="mt-1 text-xs text-white/65">matching saved records</div></div>
          </div>
        </div>
        {options && <div className="mt-5 flex flex-col gap-1.5 border-t border-white/15 pt-4 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>Source: {options.source} · Scope: {options.scope}</span>
          <span className="inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-[#e8d6a2]" /> System is not captured in modern records.</span>
        </div>}
      </section>

      {!username && <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Your staff identity is not available. Refresh the page or sign in again.</div>}
      {forbidden && <div role="alert" data-testid="status-client-rating-forbidden" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Client Rating access is restricted.</strong><p className="mt-1">{getErrorMessage(optionsQuery.error ?? listQuery.error)}</p></div>
      </div>}

      {optionsQuery.isLoading && <section aria-label="Loading client rating filters" className="mb-5 space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="h-4 w-44 animate-pulse rounded bg-muted" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map(item => <div key={item} className="h-11 animate-pulse rounded-lg bg-muted" />)}</div>
      </section>}
      {optionsQuery.isError && !forbidden && <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="flex-1">{getErrorMessage(optionsQuery.error)}</div><button type="button" className="font-semibold underline" onClick={() => optionsQuery.refetch()} data-testid="button-retry-client-rating-options">Retry</button>
      </div>}
      {optionFailure && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">{optionFailure}</div>}

      {options && !forbidden && <main className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary"><FileSearch className="h-4 w-4" /> Find a classification</div>
              <p className="mt-1 text-xs text-muted-foreground">Proposer matches part of a name; policy searches require an exact policy code.</p></div>
            <button type="button" onClick={downloadReport} disabled={reportBusy || optionsQuery.isLoading || forbidden} className={secondaryButton} data-testid="button-download-client-ratings">
              <ArrowDownToLine className={`h-4 w-4 ${reportBusy ? 'animate-bounce' : ''}`} />{reportBusy ? 'Preparing report…' : 'Download CSV'}
            </button>
          </div>
          <form onSubmit={submitSearch} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(10rem,.7fr)_minmax(15rem,1.5fr)_minmax(10rem,.8fr)_minmax(12rem,1fr)_auto_auto] lg:items-end">
            <label className="block text-xs font-semibold">Search field
              <select className={fieldClass} value={searchBy} onChange={event => { setSearchBy(event.target.value as 'proposer' | 'policy'); setPage(1); }} data-testid="select-client-rating-search-by">
                <option value="proposer">Proposer</option><option value="policy">Policy code</option>
              </select>
            </label>
            <label className="block text-xs font-semibold">Search
              <span className="relative mt-1 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className={`${fieldClass} pl-9`} value={searchInput} maxLength={150} placeholder={searchBy === 'proposer' ? 'Part of proposer name' : 'Exact policy code'} onChange={event => setSearchInput(event.target.value)} data-testid="input-client-rating-search" /></span>
            </label>
            <label className="block text-xs font-semibold">Rating
              <select className={fieldClass} value={rating} onChange={event => { setRating(event.target.value); setPage(1); }} data-testid="select-client-rating-rating">
                <option value="">All ratings</option>{options.ratings.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold">Reason
              <select className={fieldClass} value={reason} onChange={event => { setReason(event.target.value); setPage(1); }} data-testid="select-client-rating-reason">
                <option value="">All reasons</option>{options.reasons.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button type="submit" className={`${buttonClass} w-full`} data-testid="button-search-client-ratings"><Search className="h-4 w-4" />Search</button>
            <button type="button" onClick={reset} className={`${secondaryButton} w-full`} data-testid="button-reset-client-ratings"><RotateCcw className="h-4 w-4" />Reset</button>
          </form>
          {reportError && <div role="alert" data-testid="status-client-ratings-report-error" className="mt-4 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{reportError}</span><button type="button" className="font-semibold underline" onClick={() => setReportError('')} data-testid="button-dismiss-report-error">Dismiss</button>
          </div>}
        </section>

        {(listQuery.isError || listFailure) && <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="flex-1">{listFailure || getErrorMessage(listQuery.error)}</div><button type="button" className="font-semibold underline" onClick={() => listQuery.refetch()} data-testid="button-retry-client-ratings">Retry</button>
        </div>}

        {listQuery.isLoading && <div aria-label="Loading client rating records" className="space-y-3">{[0, 1, 2, 3].map(item => <div key={item} className="h-24 animate-pulse rounded-xl border border-border bg-card" />)}</div>}
        {!listQuery.isLoading && !listQuery.isError && !listFailure && records.length === 0 && <EmptyState
          title={search || rating || reason ? 'No classifications match these filters' : 'No saved client classifications yet'}
          description={search || rating || reason ? 'Try a broader proposer search or clear one of the classification filters.' : 'When AML document classifications have been saved, they will appear here with their source and handoff details.'}
        />}
        {!listQuery.isLoading && records.length > 0 && <>
          <section className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block" aria-label="Client rating results">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div><div className="text-sm font-bold">Saved classifications</div><div className="mt-0.5 text-xs text-muted-foreground">Read-only source records</div></div>
              <div className="text-xs text-muted-foreground">{result?.total ?? 0} results</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-xs">
                <thead className="bg-muted/55 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                  <tr>{['File / policy', 'Proposer', 'Cover type', 'Rating', 'Reason', 'System', 'Invoice', 'Entered by', 'Entry date'].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {records.map(record => <tr key={record.rating_id} data-testid={`row-client-rating-${record.rating_id}`} className="align-top transition-colors hover:bg-muted/25">
                    <td className="px-4 py-3"><div className="font-semibold">{record.file_no}</div><div className="mt-1 text-muted-foreground">{record.policy_code || 'No policy code'}</div></td>
                    <td className="max-w-52 px-4 py-3"><div className="font-semibold">{record.proposer}</div><div className="mt-1 text-[10px] text-muted-foreground">Record {record.rating_id}</div></td>
                    <td className="px-4 py-3">{record.cover_type || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3"><RatingTag rating={record.risk_rating} /></td>
                    <td className="max-w-64 whitespace-normal px-4 py-3 leading-5">{record.reason || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{record.system ?? 'Not captured'}</td>
                    <td className="px-4 py-3">{record.invoice_number || '—'}</td>
                    <td className="px-4 py-3">{record.entered_by || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3">{dateLabel(record.entry_date ?? undefined)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-3 md:hidden" aria-label="Client rating results">
            {records.map(record => <ClientRatingCard key={record.rating_id} record={record} />)}
          </section>
          <footer className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center">
            <div className="text-xs text-muted-foreground" data-testid="text-client-rating-pagination">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, result?.total ?? 0)} of {result?.total ?? 0} · Page {page} of {totalPages}
              {listQuery.isFetching && <span className="ml-2 text-primary">Refreshing…</span>}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1 || listQuery.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))} className={secondaryButton} data-testid="button-client-ratings-previous">
                <ArrowLeft className="h-4 w-4" />Previous
              </button>
              <button type="button" disabled={page >= totalPages || listQuery.isFetching} onClick={() => setPage(current => Math.min(totalPages, current + 1))} className={secondaryButton} data-testid="button-client-ratings-next">
                Next<ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </>}
        <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground"><BadgeCheck className="h-4 w-4 shrink-0 text-primary" />Originating system is saved on new AML classifications. Older records without a saved system remain “Not captured”; exports leave those values blank. No values are inferred.</p>
      </main>}

      {!options && !optionsQuery.isLoading && !optionsQuery.isError && !optionFailure && !forbidden && <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground"><ClipboardList className="h-4 w-4 text-primary" />Classification filters are unavailable.</div>
        <p className="mt-1">The options service did not provide a usable response.</p>
        <button type="button" className={`${secondaryButton} mt-4`} onClick={() => optionsQuery.refetch()} data-testid="button-retry-client-rating-setup">Retry</button>
      </div>}
    </div>
  </div>;
}
