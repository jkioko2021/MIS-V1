import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, AlertTriangle, ArrowDownToLine, Check, ChevronLeft, ChevronRight,
  Clock3, FileCheck2, FileSpreadsheet, History, LoaderCircle, Search, ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  getGetDataImportBatchQueryKey,
  getGetDataImportTemplateQueryKey,
  getGetIntermediaryOptionsQueryKey,
  getGetOrganisationAgentsQueryKey,
  getGetOrganisationQueryKey,
  getGetGiStructureQueryKey,
  getGetSalesStructureQueryKey,
  getListIntermediariesQueryKey,
  getListDataImportBatchesQueryKey,
  useCommitDataImport,
  useGetDataImportBatch,
  useGetDataImportTemplate,
  useListDataImportBatches,
  usePreviewDataImport,
  type DataImportBatch,
  type DataImportRow,
} from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth-context';
import { identityQueryKey } from '@/pages/admin/organisation/shared';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import './data-management.css';

type Kind = 'users' | 'agents' | 'relationship-managers';
type Filter = 'ALL' | 'NEW' | 'SKIP' | 'ERROR' | 'WARNINGS';
const MAX_BYTES = 2_000_000;
const PAGE_SIZE = 25;

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') return data.error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return fallback;
}

function parseDelimited(content: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (quoted) {
      if (char === '"' && content[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === delimiter) { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

function csvCell(value: string) {
  const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(batch: DataImportBatch) {
  const valueKeys = [...new Set(batch.rows.flatMap((row) => Object.keys(row.values)))];
  const headers = ['line', 'state', ...valueKeys, 'errors', 'warnings'];
  const content = [headers, ...batch.rows.map((row) => [
    String(row.line), row.state, ...valueKeys.map((key) => row.values[key] ?? ''),
    row.errors.join(' | '), row.warnings.join(' | '),
  ])].map((line) => line.map(csvCell).join(',')).join('\r\n');
  const href = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = href; anchor.download = `${batch.filename.replace(/\.[^.]+$/, '')}-validation.csv`;
  anchor.click(); URL.revokeObjectURL(href);
}

function StatusPill({ state }: { state: string }) {
  const styles: Record<string, string> = {
    NEW: 'bg-emerald-100 text-emerald-800', SKIP: 'bg-slate-100 text-slate-700',
    ERROR: 'bg-rose-100 text-rose-800', VALIDATED: 'bg-emerald-100 text-emerald-800',
    BLOCKED: 'bg-rose-100 text-rose-800', IMPORTED: 'bg-teal-100 text-teal-800',
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold tracking-wide ${styles[state] ?? 'bg-muted text-muted-foreground'}`}>{state}</span>;
}

function LoadingRows() {
  return <div aria-label="Loading import history" className="space-y-3 p-4">{[1, 2, 3].map((n) => <div key={n} className="dm-skeleton" />)}</div>;
}

export default function DataManagementPage({ kind }: { kind: Kind }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const preview = usePreviewDataImport();
  const commit = useCommitDataImport();
  const identity = user ? { id: user.id, profileId: user.profileId } : null;
  const listKey = identityQueryKey(getListDataImportBatchesQueryKey({ kind }), identity);
  const template = useGetDataImportTemplate(kind, {
    query: { queryKey: identityQueryKey(getGetDataImportTemplateQueryKey(kind), identity), enabled: !!user },
  });
  const history = useListDataImportBatches({ kind }, {
    query: { queryKey: listKey, enabled: !!user },
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileReadPending, setFileReadPending] = useState(false);
  const [batch, setBatch] = useState<DataImportBatch | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [actionError, setActionError] = useState('');
  const [restoredId, setRestoredId] = useState(() => new URLSearchParams(window.location.search).get('batch') ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const operationRef = useRef(0);
  const previewLock = useRef(false);
  const commitLock = useRef(false);
  const fileReadCountRef = useRef(0);
  const currentId = batch?.id ?? restoredId;
  const restored = useGetDataImportBatch(currentId, {
    query: { enabled: !!restoredId && !batch, queryKey: identityQueryKey(getGetDataImportBatchQueryKey(currentId), identity) },
  });
  const restoredBatch = !batch && restoredId ? restored.data ?? null : null;
  const restoredMismatch = !!restoredBatch && restoredBatch.kind !== kind;
  const activeBatch = batch?.kind === kind
    ? batch
    : !restoredMismatch ? restoredBatch : null;
  const title = kind === 'users' ? 'Staff records' : kind === 'agents' ? 'Intermediary records' : 'Relationship manager records';
  const recordNoun = kind === 'users' ? 'staff records' : kind === 'agents' ? 'intermediary records' : 'relationship manager records';
  const maxRows = kind === 'users' ? 500 : 5000;
  const canUseWorkspace = !!user;

  useEffect(() => {
    setBatch(null); setFile(null); setConfirm(false); setActionError('');
    operationRef.current += 1;
    const id = new URLSearchParams(window.location.search).get('batch') ?? '';
    setRestoredId(id); setSearch(''); setFilter('ALL'); setPage(0);
  }, [kind, user?.id, user?.profileId]);

  useEffect(() => {
    if (!activeBatch) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('batch') !== activeBatch.id) {
      params.set('batch', activeBatch.id);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [activeBatch]);

  const filteredRows = useMemo(() => {
    const rows = activeBatch?.rows ?? [];
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesFilter = filter === 'ALL' || (filter === 'WARNINGS' ? row.warnings.length > 0 : row.state === filter);
      const text = [row.line, ...Object.values(row.values), ...row.errors, ...row.warnings].join(' ').toLowerCase();
      return matchesFilter && (!needle || text.includes(needle));
    });
  }, [activeBatch, filter, search]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasCodedNewRows = kind === 'agents' && !!activeBatch?.rows.some((row) =>
    row.state === 'NEW' && row.values.CODED?.trim() === '1',
  );
  const canCommit = !!activeBatch && activeBatch.kind === kind && !hasCodedNewRows && activeBatch.status === 'VALIDATED'
    && activeBatch.summary.errors === 0 && activeBatch.summary.new > 0 && activeBatch.summary.imported === 0;
  const requestPending = preview.isPending || commit.isPending || previewLock.current || commitLock.current;
  const operationPending = requestPending || fileReadPending;

  async function chooseFile(next: File | undefined) {
    if (commitLock.current || previewLock.current || commit.isPending || preview.isPending) return;
    operationRef.current += 1;
    const operation = operationRef.current;
    setFile(null); setBatch(null); setRestoredId(''); setConfirm(false); setActionError('');
    preview.reset(); commit.reset();
    const params = new URLSearchParams(window.location.search); params.delete('batch');
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
    if (!next) return;
    if (next.size > MAX_BYTES) { setActionError('This file exceeds the 2 MB limit. Choose a smaller extract.'); return; }
    if (!/\.(csv|tsv|txt)$/i.test(next.name)) { setActionError('Choose a UTF-8 CSV, TSV or TXT file.'); return; }
    fileReadCountRef.current += 1;
    setFileReadPending(true);
    try {
      const content = await next.text();
      if (operation !== operationRef.current) return;
      if (content.includes('\uFFFD')) { setActionError('The file could not be read as UTF-8. Save it as UTF-8 and try again.'); return; }
      const firstHeader = content.split(/\r?\n/, 1)[0] ?? '';
      const delimiter = next.name.toLowerCase().endsWith('.tsv') || firstHeader.includes('\t') ? '\t' : ',';
      const parsed = parseDelimited(content, delimiter);
      if (operation !== operationRef.current) return;
      if (parsed.length < 2) { setActionError('The extract needs a header row and at least one data row.'); return; }
      if (parsed.length - 1 > maxRows) { setActionError(`This extract has ${parsed.length - 1} rows. The ${kind} limit is ${maxRows.toLocaleString()}.`); return; }
      setFile(next);
    } catch {
      if (operation === operationRef.current) setActionError('Unable to read this file. Choose a plain UTF-8 extract and try again.');
    } finally {
      fileReadCountRef.current = Math.max(0, fileReadCountRef.current - 1);
      setFileReadPending(fileReadCountRef.current > 0);
    }
  }

  async function validateFile() {
    if (!file || preview.isPending || commit.isPending || previewLock.current || commitLock.current) return;
    previewLock.current = true;
    const operation = operationRef.current;
    setActionError(''); setBatch(null); setRestoredId('');
    try {
      const content = await file.text();
      if (operation !== operationRef.current) return;
      const result = await preview.mutateAsync({ kind, data: { filename: file.name, content } });
      if (operation !== operationRef.current) return;
      if (result.kind !== kind) {
        setActionError(`The server returned a ${result.kind} batch for this ${kind} workspace. No records were loaded. Choose the correct workspace and validate again.`);
        return;
      }
      setBatch(result); setPage(0);
      await queryClient.invalidateQueries({ queryKey: listKey });
    } catch (error) {
      if (operation === operationRef.current) setActionError(errorMessage(error, 'Validation could not be completed. Check the file and try again.'));
    } finally { previewLock.current = false; }
  }

  async function commitBatch() {
    if (!activeBatch || activeBatch.kind !== kind || !canCommit || commit.isPending || previewLock.current || commitLock.current || fileReadCountRef.current > 0) return;
    commitLock.current = true;
    setActionError('');
    const operation = operationRef.current;
    try {
      const result = await commit.mutateAsync({ id: activeBatch.id });
      if (operation !== operationRef.current) return;
      if (result.kind !== kind) {
        setConfirm(false);
        setActionError(`The server returned a ${result.kind} batch for this ${kind} workspace. The result was not treated as a successful import.`);
        return;
      }
      setConfirm(false);
      if (result.status === 'IMPORTED') {
        setBatch(result);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: listKey }),
          queryClient.invalidateQueries({ queryKey: ['admin-employees'] }),
          queryClient.invalidateQueries({ queryKey: getListIntermediariesQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetIntermediaryOptionsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetOrganisationQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetOrganisationAgentsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetGiStructureQueryKey() }),
        ]);
      } else {
        setBatch(result);
        await queryClient.invalidateQueries({ queryKey: listKey });
        setActionError(result.status === 'BLOCKED'
          ? 'The server blocked this import during its final check. Review the updated validation below; no records were loaded.'
          : 'The source changed during the final check. Review this refreshed validation before confirming again; no records were loaded.');
      }
    } catch (error) {
      if (operation === operationRef.current) setActionError(errorMessage(error, 'The import was not completed. Review the batch and try again.'));
    } finally { commitLock.current = false; }
  }

  async function openHistory(id: string) {
    if (commitLock.current || previewLock.current || commit.isPending || preview.isPending || fileReadCountRef.current > 0) return;
    operationRef.current += 1;
    setBatch(null); setFile(null); setActionError(''); setConfirm(false); setRestoredId(id); setPage(0);
    preview.reset(); commit.reset();
    const params = new URLSearchParams(window.location.search); params.set('batch', id);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  function clearRestoredBatch() {
    if (commitLock.current || previewLock.current || commit.isPending || preview.isPending || fileReadCountRef.current > 0) return;
    operationRef.current += 1;
    setBatch(null); setRestoredId(''); setConfirm(false); setActionError('');
    const params = new URLSearchParams(window.location.search); params.delete('batch');
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
  }

  function downloadTemplate() {
    if (!template.data) return;
    const content = [template.data.headers, template.data.headers.map(() => '')].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const href = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = href; anchor.download = `${kind}-import-template.csv`; anchor.click(); URL.revokeObjectURL(href);
  }

  return (
    <div className="dm-shell min-h-[100dvh] bg-background px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><span>Administration</span><ChevronRight className="h-3 w-3" /><span>Data management</span></div>
            <p className="dm-eyebrow">MIS V1 · controlled go-live workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title} <span className="font-medium text-muted-foreground">import</span></h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{kind === 'relationship-managers'
            ? 'Validate year-specific corporate and retail manager references before adding records. Existing code, category and year combinations are never overwritten.'
            : 'Validate the source extract before real records are added. Existing identities are never replaced or removed.'}</p>
          </div>
          <button type="button" className="dm-button dm-button-quiet self-start sm:self-auto" onClick={downloadTemplate} disabled={!template.data || !canUseWorkspace} data-testid="button-download-template">
            <ArrowDownToLine className="h-4 w-4" /> Download CSV template
          </button>
        </header>

        {!canUseWorkspace && <div role="alert" className="dm-state dm-state-error">Your session is not authorized for this workspace. Sign in with an administrator account to continue.</div>}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="dm-panel p-4 sm:p-5" aria-labelledby="source-title">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Upload className="h-4 w-4" /></span>
              <div><p className="dm-eyebrow">01 / Source extract</p><h2 id="source-title" className="mt-1 text-base font-semibold">Choose a file to validate</h2></div>
            </div>
            <input ref={inputRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" disabled={requestPending} className="sr-only" onChange={(event) => void chooseFile(event.target.files?.[0])} data-testid="input-import-file" aria-label="Choose CSV, TSV or TXT file" />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={!canUseWorkspace || requestPending} className="flex min-h-[108px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/35 px-4 text-center hover:bg-muted/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-choose-file">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">{file ? file.name : 'Select a CSV, TSV or TXT extract'}</span>
              <span className="text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(1)} KB · UTF-8` : `Maximum 2 MB · up to ${maxRows.toLocaleString()} data rows`}</span>
            </button>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">File contents are sent only for validation. They are not retained in this browser.</p>
              <button type="button" onClick={() => void validateFile()} className="dm-button dm-button-primary shrink-0" disabled={!canUseWorkspace || !file || operationPending} data-testid="button-validate-extract">
                {preview.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {preview.isPending ? 'Validating…' : 'Validate extract'}
              </button>
            </div>
            {actionError && <div role="alert" className="dm-state dm-state-error mt-4">{actionError}</div>}
            {preview.isError && !actionError && <div role="alert" className="dm-state dm-state-error mt-4">{errorMessage(preview.error, 'Validation failed. Retry with a corrected file.')}</div>}
            {template.isError && <div role="alert" className="dm-state dm-state-error mt-4">Template unavailable: {errorMessage(template.error, 'Please refresh and try again.')}</div>}
          </section>

          <aside className="dm-panel bg-[hsl(var(--accent)/.42)] p-4 sm:p-5">
            <p className="dm-eyebrow">Import safeguards</p>
            <ul className="mt-3 space-y-3 text-xs leading-5">
              {kind === 'relationship-managers' ? (
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><b>New code/category/year combinations only.</b> Existing combinations are skipped, never overwritten. These are reference records, not MIS login accounts.</span></li>
              ) : (
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><b>New identities only.</b> Existing identities are skipped, never replaced or deleted.</span></li>
              )}
              {kind === 'users' ? (
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Imported staff are inactive and unapproved. Passwords are never imported; activate accounts later in User Enrollment.</span></li>
              ) : kind === 'agents' ? (
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Agents remain PENDING with source values preserved. CODED=1 rows are skipped under the only-uncoded rule. Active Medical Units and eligible GI managers link only when their codes resolve.</span></li>
              ) : (
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Six source columns: RE_CODE, RE_NAME, CLASS_CODE, C_CODE, YEAR and IS_ACTIVE. C is Corporate; R is Retail. Codes remain exact strings, including leading zeroes.</span></li>
              )}
              {kind === 'relationship-managers' ? (
                <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><span>Names resolve against agent RMS_CODE_CORP and RMS_CODE_RET references. Reporting-year versions are retained as distinct records.</span></li>
              ) : <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><span>Unresolved references are flagged. Relationships are not guessed.</span></li>}
            </ul>
            {template.isLoading ? <div className="dm-skeleton mt-4" /> : template.data && <div className="mt-4 border-t border-border/70 pt-3"><p className="dm-eyebrow">Template fields</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{template.data.headers.join(' · ')}</p><p className="mt-2 text-[10px] text-muted-foreground">Maximum {template.data.max_rows.toLocaleString()} rows</p>{template.data.notes.length > 0 && <ul className="mt-2 space-y-1 text-[10px] leading-4 text-muted-foreground">{template.data.notes.map((note) => <li key={note}>• {note}</li>)}</ul>}</div>}
          </aside>
        </div>

        {restoredId && !activeBatch && (
          <section className="dm-panel p-4 sm:p-5" aria-live="polite">
            {restored.isLoading ? <><p className="dm-eyebrow">Reopening saved validation</p><LoadingRows /></> : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div role={restoredMismatch || restored.isError ? 'alert' : 'status'}>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {restoredMismatch ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : <AlertCircle className="h-4 w-4 text-rose-700" />}
                    {restoredMismatch
                      ? `This saved batch is for ${restoredBatch?.kind === 'users' ? 'staff records' : restoredBatch?.kind === 'agents' ? 'intermediary records' : 'relationship manager records'}, not ${kind}.`
                      : restored.isError ? 'Unable to reopen this saved batch.' : 'Saved batch is unavailable.'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {restoredMismatch
                      ? `Open the ${restoredBatch?.kind === 'users' ? 'staff records' : restoredBatch?.kind === 'agents' ? 'intermediary records' : 'relationship manager records'} workspace, or clear this batch to continue here. No commit is available for a different record type.`
                      : errorMessage(restored.error, 'The batch may have been removed or you may not have access. Clear it to continue with a new extract.')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {restoredMismatch && <a className="dm-button dm-button-quiet" href={`/data-management/${restoredBatch?.kind}`}>Open matching workspace</a>}
                  <button type="button" className="dm-button dm-button-quiet" disabled={operationPending} onClick={clearRestoredBatch} data-testid="button-clear-saved-batch">Clear saved batch</button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeBatch && (
          <section className="dm-panel overflow-hidden" aria-labelledby="review-title">
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0"><p className="dm-eyebrow">02 / Validation review</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 id="review-title" className="max-w-[min(70vw,720px)] truncate text-base font-semibold">{activeBatch.filename}</h2><StatusPill state={activeBatch.status} /></div><p className="mt-1 text-xs text-muted-foreground">Batch {activeBatch.id} · {new Date(activeBatch.created_at).toLocaleString()}</p></div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="dm-button dm-button-quiet" onClick={() => downloadCsv(activeBatch)} data-testid="button-download-validation"><ArrowDownToLine className="h-4 w-4" /> Results CSV</button>
                  {activeBatch.status === 'IMPORTED' ? <span className="dm-button bg-teal-50 text-teal-800"><Check className="h-4 w-4" /> Imported</span> : <button type="button" className="dm-button dm-button-primary" disabled={!canCommit || operationPending} onClick={() => { if (!operationPending && activeBatch.kind === kind) { setActionError(''); setConfirm(true); } }} data-testid="button-confirm-import">{commit.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />} Load {activeBatch.summary.new.toLocaleString()} new rows</button>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
                {[
                  ['Rows', activeBatch.summary.total, 'text-foreground'],
                  ['New', activeBatch.summary.new, 'text-emerald-700'],
                  ['Skipped', activeBatch.summary.skipped, 'text-muted-foreground'],
                  ['Errors', activeBatch.summary.errors, 'text-rose-700'],
                  ['Warnings', activeBatch.summary.warnings, 'text-amber-700'],
                  ['Imported', activeBatch.summary.imported, 'text-primary'],
                ].map(([label, value, color]) => <div key={label} className="rounded-lg bg-muted/55 px-3 py-2"><p className="dm-eyebrow">{label}</p><p className={`dm-mono mt-1 text-lg font-bold ${color}`}>{Number(value).toLocaleString()}</p></div>)}
              </div>
              {!canCommit && activeBatch.status !== 'IMPORTED' && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><AlertCircle className="h-4 w-4 shrink-0" />{activeBatch.kind !== kind ? 'This batch belongs to another data workspace and cannot be loaded here.' : activeBatch.status === 'BLOCKED' ? 'This batch is blocked. Correct the source and validate a new extract.' : hasCodedNewRows ? 'A row marked CODED=1 was returned as NEW. The only-uncoded rule requires coded source rows to be skipped; loading is blocked for safety.' : activeBatch.summary.errors ? 'Resolve validation errors before loading records.' : activeBatch.summary.new === 0 ? 'There are no new rows to load.' : 'This batch cannot be committed in its current state.'}</p>}
            </div>
            {restored.isLoading && !batch ? <LoadingRows /> : restored.isError && !batch ? <div role="alert" className="dm-state dm-state-error m-4">Unable to reopen this batch. It may have been removed or you may not have access. {errorMessage(restored.error, '')}</div> : (
              <div className="p-4 sm:p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className="dm-control w-full pl-9 sm:w-64" placeholder="Search values or messages" aria-label="Search validation rows" data-testid="input-search-rows" /></div>
                  <div className="flex flex-wrap gap-1" role="group" aria-label="Filter validation rows">
                    {(['ALL', 'NEW', 'SKIP', 'ERROR', 'WARNINGS'] as Filter[]).map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => { setFilter(item); setPage(0); }} className={`rounded-md px-2.5 py-2 text-[10px] font-bold ${filter === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`filter-${item.toLowerCase()}`}>{item}</button>)}
                  </div>
                </div>
                {filteredRows.length === 0 ? <div className="rounded-lg border border-dashed border-border py-10 text-center"><Search className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">No matching rows</p><p className="mt-1 text-xs text-muted-foreground">Adjust the search or filter to see validation results.</p></div> : (
                  <div className="dm-table-wrap">
                    <table className="dm-table"><thead><tr><th>Line</th><th>Result</th><th>Source values</th><th>Validation notes</th></tr></thead><tbody>
                      {pageRows.map((row) => <tr key={row.line} data-testid={`row-validation-${row.line}`}><td className="dm-mono text-muted-foreground">{row.line}</td><td><StatusPill state={row.state} /></td><td><div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">{Object.entries(row.values).filter(([, value]) => value !== null && value !== '').map(([key, value]) => <div key={key} className="min-w-0"><span className="text-[10px] text-muted-foreground">{key}: </span><span className="break-words">{value}</span></div>)}</div></td><td><RowNotes row={row} /></td></tr>)}
                    </tbody></table>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{filteredRows.length ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filteredRows.length)} of ${filteredRows.length} rows` : '0 rows'}</span><div className="flex gap-1"><button type="button" className="dm-button dm-button-quiet !min-h-8 !px-2" aria-label="Previous rows" disabled={page === 0} onClick={() => setPage((n) => Math.max(0, n - 1))} data-testid="button-previous-page"><ChevronLeft className="h-4 w-4" /></button><button type="button" className="dm-button dm-button-quiet !min-h-8 !px-2" aria-label="Next rows" disabled={page + 1 >= pageCount} onClick={() => setPage((n) => Math.min(pageCount - 1, n + 1))} data-testid="button-next-page"><ChevronRight className="h-4 w-4" /></button></div></div>
              </div>
            )}
          </section>
        )}

        <section className="dm-panel overflow-hidden" aria-labelledby="history-title">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><History className="h-4 w-4 text-muted-foreground" /></span><div><p className="dm-eyebrow">Audit trail</p><h2 id="history-title" className="text-sm font-semibold">Recent import history</h2></div></div><span className="text-[10px] text-muted-foreground">{history.data?.length ?? 0} batches</span></div>
          {history.isLoading ? <LoadingRows /> : history.isError ? <div role="alert" className="dm-state dm-state-error m-4">Could not load import history. {errorMessage(history.error, '')}</div> : !history.data?.length ? <div className="px-5 py-8 text-center"><Clock3 className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">{canUseWorkspace ? 'No imports yet' : 'Import history unavailable'}</p><p className="mt-1 text-xs text-muted-foreground">{canUseWorkspace ? 'Validated batches will appear here for later review.' : 'Sign in with an authorized administrator account to view batches.'}</p></div> : (
            <div className="divide-y divide-border">
              {history.data.map((run) => <div key={run.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[minmax(0,1fr)_110px_180px_190px] sm:items-center sm:px-5" data-testid={`history-batch-${run.id}`}>
                <button type="button" className="min-w-0 text-left hover:text-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={operationPending} onClick={() => void openHistory(run.id)} data-testid={`button-open-batch-${run.id}`}><span className="block truncate font-semibold">{run.filename}</span><span className="mt-1 block text-[10px] text-muted-foreground">Batch {run.id} · by {run.created_by}</span></button>
                <StatusPill state={run.status} />
                <span className="text-muted-foreground">{run.summary.new.toLocaleString()} new · {run.summary.skipped.toLocaleString()} skipped · {run.summary.errors.toLocaleString()} errors · {run.summary.imported.toLocaleString()} imported</span>
                <span className="text-muted-foreground sm:text-right">{new Date(run.created_at).toLocaleString()}</span>
              </div>)}
            </div>
          )}
        </section>
      </div>

      <Dialog open={confirm && !!activeBatch && activeBatch.kind === kind} onOpenChange={(open) => {
        if (open || (!commit.isPending && !commitLock.current)) setConfirm(open);
      }}>
        {activeBatch && <DialogContent
          className="dm-panel w-[calc(100%-2rem)] max-w-lg border p-5 shadow-2xl sm:p-6"
          onEscapeKeyDown={(event) => { if (commit.isPending || commitLock.current) event.preventDefault(); }}
          onInteractOutside={(event) => { if (commit.isPending || commitLock.current) event.preventDefault(); }}
        >
          <DialogHeader>
            <p className="dm-eyebrow">Final confirmation</p>
            <DialogTitle>Load {activeBatch.summary.new.toLocaleString()} new {recordNoun}?</DialogTitle>
            <DialogDescription>Only rows marked NEW will be added. {activeBatch.summary.skipped.toLocaleString()} existing identities will remain unchanged. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/60 p-3 text-xs"><p className="font-semibold">{activeBatch.filename}</p><p className="mt-1 text-muted-foreground">Batch {activeBatch.id} · validation reviewed {new Date(activeBatch.created_at).toLocaleString()}</p></div>
          <DialogFooter>
            <button type="button" className="dm-button dm-button-quiet" onClick={() => setConfirm(false)} disabled={operationPending} data-testid="button-cancel-import">Cancel</button>
            <button type="button" className="dm-button dm-button-primary" onClick={() => void commitBatch()} disabled={operationPending || !canCommit || activeBatch.kind !== kind} data-testid="button-final-import">{commit.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}{commit.isPending ? 'Loading records…' : `Confirm and load ${activeBatch.summary.new.toLocaleString()}`}</button>
          </DialogFooter>
          {commit.isError && <p role="alert" className="dm-state dm-state-error">{errorMessage(commit.error, 'The server could not complete this import.')}</p>}
        </DialogContent>}
      </Dialog>
    </div>
  );
}

function RowNotes({ row }: { row: DataImportRow }) {
  if (!row.errors.length && !row.warnings.length) return <span className="text-muted-foreground">—</span>;
  return <div className="space-y-1">{row.errors.map((message, index) => <p key={`e${index}`} className="flex gap-1.5 text-rose-700"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />{message}</p>)}{row.warnings.map((message, index) => <p key={`w${index}`} className="flex gap-1.5 text-amber-800"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{message}</p>)}</div>;
}
