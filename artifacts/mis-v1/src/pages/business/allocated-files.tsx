import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowUpDown, CheckCircle2, Clock3, FileText, RefreshCw, Search, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { misApi, type AuditEntry, type BusinessDoc, type BusinessFile, type BusinessNote, type BusinessUpload } from '@/lib/mis-api';
import { cn } from '@/lib/utils';

const PRODUCT_LABELS: Record<string, string> = {
  T: 'Traditional',
  S: 'Shwaari',
  AS: 'Afya Shwaari',
};

const ACTION_LABELS: Record<string, string> = {
  N: 'New',
  R: 'Renewal',
  A: 'Addon',
  T: 'Termination',
  RT: 'Reinstatement',
  CC: 'Category Change',
  PR: 'Premium Recon',
  NE: 'Nill Endorsement',
  FT: 'Fund Topup',
  SU: 'Suspension',
  LS: 'Lift Suspension',
};

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtMoney(value: number | null | undefined) {
  if (value == null) return '—';
  return `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

function clientTypeLabel(value: string) {
  return value === 'R' ? 'Retail' : value === 'S' ? 'SME' : 'Corporate';
}

function statusClass(status: string) {
  if (status === 'BENEFIT VERIFICATION') return 'bg-orange-100 text-orange-800 border-orange-200';
  if (status === 'ALLOCATED') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="rounded-md border border-transparent bg-muted/40 px-3 py-2 text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

type DetailedFile = BusinessFile & {
  notes: BusinessNote[];
  docs: BusinessDoc[];
};

function AllocatedFileSheet({ fileNo, onClose }: { fileNo: string; onClose: () => void }) {
  const [tab, setTab] = useState('summary');
  const { data: fileRes, isLoading, isError } = useQuery({
    queryKey: ['allocated-business-file', fileNo],
    queryFn: () => misApi.businessFile(fileNo),
    enabled: !!fileNo,
  });
  const { data: uploadsRes } = useQuery({
    queryKey: ['allocated-business-uploads', fileNo],
    queryFn: () => misApi.businessListUploads(fileNo),
    enabled: !!fileNo,
  });
  const { data: historyRes } = useQuery({
    queryKey: ['allocated-business-history', fileNo],
    queryFn: () => misApi.businessGetHistory(fileNo),
    enabled: !!fileNo,
  });

  const file = fileRes?.data as DetailedFile | undefined;
  const uploads = (uploadsRes?.data ?? []) as BusinessUpload[];
  const history = (historyRes?.data ?? []) as AuditEntry[];
  const notes = file?.notes ?? [];
  const docs = file?.docs ?? [];

  return (
    <Sheet open={!!fileNo} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-3xl">
        <SheetHeader className="border-b bg-card px-6 py-5 pr-12 text-left">
          {file ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold text-primary">{file.file_no}</span>
                <Badge variant="outline" className={statusClass(file.file_status)}>{file.file_status}</Badge>
              </div>
              <SheetTitle className="text-xl">{file.proposer_name}</SheetTitle>
              <SheetDescription>
                Allocated to {file.allocated_to || 'you'} on {fmtDate(file.allocate_dt)}
              </SheetDescription>
            </>
          ) : (
            <>
              <SheetTitle>Allocated business file</SheetTitle>
              <SheetDescription>Loading the original registration record…</SheetDescription>
            </>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : isError || !file ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 p-6 text-center">
              <AlertCircle className="h-8 w-8 text-destructive/70" />
              <p className="font-medium">Unable to load this allocated file.</p>
              <p className="text-sm text-muted-foreground">The file may have moved to another operational queue.</p>
            </div>
          ) : (
            <div className="p-6">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <ReadOnlyField label="Receive Date" value={fmtDate(file.receive_dt)} />
                    <ReadOnlyField label="Client Type" value={clientTypeLabel(file.client_type)} />
                    <ReadOnlyField label="Action" value={ACTION_LABELS[file.business_type] ?? file.business_type} />
                    <ReadOnlyField label="Product" value={PRODUCT_LABELS[file.product ?? ''] ?? file.product} />
                    <ReadOnlyField label="Coverage" value={file.business === 'M' ? 'Medical' : 'Non-Medical'} />
                    <ReadOnlyField label="Agent" value={file.agent_name} />
                    <ReadOnlyField label="Allocated To" value={file.allocated_to} />
                    <ReadOnlyField label="Allocated Date" value={fmtDate(file.allocate_dt)} />
                    <ReadOnlyField label="Premium" value={fmtMoney(file.premium)} />
                    <ReadOnlyField label="Paid Amount" value={fmtMoney(file.paid_amt)} />
                    <ReadOnlyField label="Payment Mode" value={file.pay_mode} />
                    <ReadOnlyField label="Payment Reference" value={file.pay_ref_no} />
                  </div>
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Membership update queue
                    </div>
                    <p className="mt-1 text-xs text-cyan-900/80">
                      This is the original registration record allocated to your account. Updates should be tracked through the authorized operational workflow.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                  <div className="overflow-hidden rounded-lg border bg-card">
                    {docs.length === 0 ? (
                      <div className="p-10 text-center text-sm text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        No document requirements selected.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {docs.map(doc => {
                          const upload = uploads.find(item => item.req_id === doc.req_id);
                          return (
                            <div key={doc.req_id} className="flex items-start gap-3 p-4">
                              <CheckCircle2 className={cn('mt-0.5 h-4 w-4', upload ? 'text-emerald-600' : 'text-muted-foreground/40')} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{doc.req_name}</p>
                                {upload ? (
                                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <span>{upload.filename} · uploaded {fmtDate(upload.uploaded_at)}</span>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/api/storage/objects${upload.storage_key}`, '_blank')}>
                                      View document
                                    </Button>
                                  </div>
                                ) : doc.is_selected ? (
                                  <p className="mt-1 text-xs font-medium text-amber-600">Pending upload</p>
                                ) : (
                                  <p className="mt-1 text-xs text-muted-foreground">Not selected</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-6 space-y-3">
                  {notes.length === 0 ? (
                    <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">No notes recorded for this file.</div>
                  ) : notes.map(note => (
                    <div key={note.note_id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5" />
                        <span className="font-semibold text-foreground">{note.note_from}</span>
                        <span>·</span>
                        <span>{fmtDate(note.note_date)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{note.notes}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  {history.length === 0 ? (
                    <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">No audit history recorded.</div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((entry, index) => (
                        <div key={`${entry.done_at}-${index}`} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/60" />
                            {index < history.length - 1 && <div className="mt-1 h-full w-px bg-border" />}
                          </div>
                          <div className="pb-3">
                            <p className="text-sm font-semibold">{entry.action}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{entry.details}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                              <Clock3 className="h-3 w-3" /> {fmtDate(entry.done_at)} by {entry.done_by}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SortButton({ label, column, sortBy, onSort }: { label: string; column: string; sortBy: string; onSort: (column: string) => void }) {
  return (
    <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1 font-semibold hover:text-foreground">
      {label}
      <ArrowUpDown className={cn('h-3 w-3', sortBy === column ? 'text-primary' : 'opacity-30')} />
    </button>
  );
}

export default function AllocatedFilesPage() {
  const { user } = useAuth();
  const [searchBy, setSearchBy] = useState<'P' | 'F'>('P');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [clientType, setClientType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('allocate_dt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
    sort_by: sortBy,
    sort_dir: sortDir,
  };
  if (search) {
    params.search = search;
    params.search_by = searchBy;
  }
  if (clientType) params.client_type = clientType;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['business-allocated', search, searchBy, clientType, page, pageSize, sortBy, sortDir],
    queryFn: () => misApi.businessAllocated(params),
    staleTime: 30_000,
  });

  const files = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isSuperAdmin = user?.profileName?.trim().toLowerCase() === 'superadmin';
  const profileName = user?.profileName ?? 'BPO administrator';

  function applySearch() {
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function clearSearch() {
    setPage(1);
    setSearchDraft('');
    setSearch('');
  }

  function sort(column: string) {
    setPage(1);
    if (sortBy === column) {
      setSortDir(value => value === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Allocated Files</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">{total}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSuperAdmin
              ? 'All allocated membership files and their assigned administrators'
              : 'Membership updates assigned to your account'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex min-w-[230px] flex-1 items-center gap-2">
          <Label htmlFor="allocated-search" className="sr-only">Search allocated files</Label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="allocated-search"
              value={searchDraft}
              onChange={event => setSearchDraft(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') applySearch(); }}
              placeholder={searchBy === 'F' ? 'Search by file number…' : 'Search by proposer name…'}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Search field"
            value={searchBy}
            onChange={event => { setSearchBy(event.target.value as 'P' | 'F'); setPage(1); }}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="P">Proposer</option>
            <option value="F">File No.</option>
          </select>
          <Button size="sm" onClick={applySearch}>Search</Button>
          {search && <Button size="sm" variant="ghost" onClick={clearSearch}>Clear</Button>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</span>
          {[
            { value: '', label: 'All' },
            { value: 'R', label: 'Retail' },
            { value: 'S', label: 'SME' },
            { value: 'C', label: 'Corporate' },
          ].map(option => (
            <Button
              key={option.value || 'all'}
              size="sm"
              variant={clientType === option.value ? 'default' : 'outline'}
              onClick={() => { setClientType(option.value); setPage(1); }}
              className="h-8"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isSuperAdmin ? 'All allocated files' : 'Assigned to you'}
            </p>
            <UserRound className="h-4 w-4 text-primary" />
          </div>
            <p className="mt-2 text-2xl font-bold">{total}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {isSuperAdmin ? 'All administrators' : user?.username}
            </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medical on page</p>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-bold">{files.filter(file => file.business === 'M').length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Benefit verification complete</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current profile</p>
            <Clock3 className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 truncate text-lg font-bold">{profileName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isSuperAdmin ? 'Oversight view' : 'Personal allocation queue'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3"><SortButton label="Receive Date" column="receive_dt" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3"><SortButton label="Allocate Date" column="allocate_dt" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3"><SortButton label="File No." column="file_no" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3"><SortButton label="Proposer" column="proposer_name" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3"><SortButton label="Client" column="client_type" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3"><SortButton label="Action" column="business_type" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3"><SortButton label="Allocated To" column="allocated_to" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3"><SortButton label="Status" column="file_status" sortBy={sortBy} onSort={sort} /></th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    {Array.from({ length: 10 }).map((__, cell) => <td key={cell} className="px-4 py-4"><Skeleton className="h-4" /></td>)}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                    <td colSpan={10} className="py-14 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive/70" />
                    <p className="font-medium">Unable to load your allocated files.</p>
                    <p className="mt-1 text-xs text-muted-foreground">{String(error)}</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                    <td colSpan={10} className="py-16 text-center">
                    <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground/30" />
                    <p className="font-medium">No allocated files found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {search || clientType
                        ? 'Try clearing your filters.'
                        : isSuperAdmin
                          ? 'Allocated files will appear here.'
                          : 'Files allocated to your account will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : files.map(file => (
                <tr
                  key={file.file_no}
                  className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/30"
                  onClick={() => setSelectedFile(file.file_no)}
                >
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{fmtDate(file.receive_dt)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{fmtDate(file.allocate_dt)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded bg-primary/5 px-2 py-1 font-mono text-xs font-semibold text-primary">{file.file_no}</span>
                  </td>
                  <td className="max-w-[210px] truncate px-4 py-4 font-medium">{file.proposer_name}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-blue-600">{clientTypeLabel(file.client_type)}</td>
                  <td className="px-4 py-4 text-xs">{ACTION_LABELS[file.business_type] ?? file.business_type}</td>
                  <td className="px-4 py-4 text-xs">{PRODUCT_LABELS[file.product ?? ''] ?? file.product ?? '—'}</td>
                  <td className="px-4 py-4 text-xs font-medium">{file.allocated_to || '—'}</td>
                  <td className="px-4 py-4"><span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(file.file_status)}`}>{file.file_status}</span></td>
                  <td className="px-4 py-4 text-right text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm">
          <p className="text-xs text-muted-foreground">
            {total === 0 ? '0 files' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} files`}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</Button>
            <span className="min-w-[90px] text-center text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages || isFetching} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>Next</Button>
          </div>
        </div>
      </div>

      {selectedFile && <AllocatedFileSheet fileNo={selectedFile} onClose={() => setSelectedFile(null)} />}
    </div>
  );
}