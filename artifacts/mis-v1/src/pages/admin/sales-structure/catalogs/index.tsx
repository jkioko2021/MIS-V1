import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import {
  AlertCircle, ArrowUpRight, Check, CircleHelp, ClipboardList, Plus, RefreshCw, Search, ShieldCheck,
} from 'lucide-react';
import {
  getGetSalesCatalogsQueryKey,
  getGetSalesStructureQueryKey,
  useGetSalesCatalogs,
  useUpdateSalesCatalogEntry,
} from '@workspace/api-client-react';
import type { SalesCatalogDefinition, SalesCatalogEntry, SalesCatalogSnapshot, SalesCatalogValues } from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { SalesStructureGuard, SalesStructureHeader } from '../shared';
import { CatalogEditor } from './catalog-editor';
import { SourceReferenceDetails } from './source-reference-details';
import { displayFieldLabel, displayReference } from './catalog-display';

const DESCRIPTION: Record<string, string> = {
  'sales-units': 'Maintain sales-unit identity, branch and region placement, manager assignment and operating details.',
  'unit-managers': 'Maintain unit manager designations against existing MIS users, including approval and employment details.',
  'sales-branches': 'Maintain branch identity, regional placement, manager mapping and General Insurance branch linkage.',
  'regional-managers': 'Maintain regional manager records, region mapping, contact and employment details.',
  'sales-regions': 'Maintain sales regions and their national and regional manager relationships.',
  'gi-unit-managers': 'Maintain GI unit manager records, unit mapping, retainer details and employment dates.',
  'gi-units': 'Maintain GI units, sales territory mappings and coordinator assignment.',
  'gi-branches': 'Maintain GI branch identity, sales branch mapping, coordinator and validity dates.',
  'gi-coordinators': 'Maintain GI coordinator records, branch mapping, contact and employment details.',
};

function errorText(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'The catalog could not be loaded. Please try again.';
}

function entrySearchText(entry: SalesCatalogEntry, definition: SalesCatalogDefinition, snapshot: SalesCatalogSnapshot) {
  return [
    entry.id,
    entry.code,
    entry.name,
    entry.employee_id ?? '',
    entry.source_file ?? '',
    ...(entry.source_issues ?? []),
    ...definition.fields.map((field) => entry.values[field.key] ?? ''),
    ...definition.fields.filter(field => field.reference).map(field => displayReference(entry, field, snapshot)),
  ].join(' ').toLowerCase();
}

function CatalogContent({ catalog, username }: { catalog: string; username: string }) {
  const queryKey = [...getGetSalesCatalogsQueryKey(), username];
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSalesCatalogs({
    query: {
      queryKey,
      staleTime: 15_000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const queryClient = useQueryClient();
  const updateEntry = useUpdateSalesCatalogEntry();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editor, setEditor] = useState<SalesCatalogEntry | null | undefined>(undefined);
  const [sourceView, setSourceView] = useState<SalesCatalogEntry | null>(null);
  const [statusChange, setStatusChange] = useState<SalesCatalogEntry | null>(null);
  const [statusError, setStatusError] = useState('');
  useEffect(() => {
    setSearch('');
    setStatus('all');
    setEditor(undefined);
    setSourceView(null);
    setStatusChange(null);
  }, [catalog]);
  const snapshot = data;
  const definition = snapshot?.definitions.find((item) => item.key === catalog);
  const entries = useMemo(() => snapshot?.entries.filter((entry) => entry.catalog === catalog) ?? [], [snapshot, catalog]);
  const operationalEntries = useMemo(() => entries.filter((entry) => !entry.source_reference), [entries]);
  const referenceEntries = useMemo(() => entries.filter((entry) => entry.source_reference), [entries]);
  const filtered = useMemo(() => entries
    .filter((entry) => status === 'all' || (status === 'active' ? entry.is_active : !entry.is_active))
    .filter((entry) => !definition || !snapshot || entrySearchText(entry, definition, snapshot).includes(search.trim().toLowerCase()))
    .sort((a, b) => Number(!!b.source_reference) - Number(!!a.source_reference) || a.name.localeCompare(b.name) || a.code.localeCompare(b.code) || a.id - b.id), [entries, status, definition, search, snapshot]);
  const activeCount = operationalEntries.filter((entry) => entry.is_active).length;
  const mappingFields = definition?.fields.filter((field) => field.reference && field.key !== definition.code_field) ?? [];

  const toggleStatus = (entry: SalesCatalogEntry) => {
    if (entry.source_reference) return;
    setStatusError('');
    const values: SalesCatalogValues = {};
    for (const field of definition?.fields ?? []) {
      if (field.read_only || field.key === 'ACTIVE') continue;
      values[field.key] = entry.values[field.key] ?? null;
    }
    updateEntry.mutate({
      catalog,
      id: entry.id,
      data: { values, employee_id: entry.employee_id, is_active: !entry.is_active, version: entry.version },
    }, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetSalesCatalogsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
        ]);
        setStatusChange(null);
      },
      onError: (reason) => setStatusError(reason instanceof Error ? reason.message : 'The status could not be changed. Please retry.'),
    });
  };

  return (
    <>
      <SalesStructureHeader
        eyebrow="Administration / Sales Structure setup"
        title={definition?.title ?? 'Sales catalog'}
        description={DESCRIPTION[catalog] ?? 'Maintain accountable sales organization records and their relationships.'}
      >
        <Button variant="outline" onClick={() => refetch()} className="gap-2 bg-card" data-testid="button-refresh-catalog">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />Refresh
        </Button>
        <Button onClick={() => setEditor(null)} disabled={!definition || isLoading} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-add-catalog-entry">
          <Plus className="h-4 w-4" />Add record
        </Button>
      </SalesStructureHeader>

      <main className="mx-auto -mt-1 max-w-[1480px] space-y-5 px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total records</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{isLoading ? '—' : entries.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Operational rows and preserved source references</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active enrollments</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{isLoading ? '—' : activeCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Operational records only; source status is separate</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Reference rows</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-950">{isLoading ? '—' : referenceEntries.length}</p>
            <p className="mt-1 text-xs text-amber-900/75">Read-only imports; not eligible for mapping</p>
          </div>
        </div>

        {isError && (
          <Alert variant="destructive" data-testid="alert-catalog-load-error">
            <AlertCircle className="h-4 w-4" /><AlertTitle>Could not load {definition?.title ?? 'catalog data'}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{errorText(error)}</span><Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-catalog">Try again</Button>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && !definition && (
          <section className="rounded-xl border bg-card px-6 py-14 text-center" data-testid="catalog-not-found">
            <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">Catalog is not available</h2>
            <p className="mt-1 text-sm text-muted-foreground">The live MIS catalog metadata does not include “{catalog}”.</p>
          </section>
        )}

        {definition && (
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold tracking-tight">Records</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  View names, organizational assignments and status. Open a record for further details.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_155px] lg:w-[480px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names and assignments…" className="pl-9" data-testid="input-search-catalog" />
                </div>
                <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter catalog by status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-catalog-status">
                  <option value="all">All statuses</option><option value="active">Active status</option><option value="inactive">Inactive status</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5" aria-label="Loading catalog records">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-[72px] animate-pulse rounded-lg bg-muted/60" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-14 text-center" data-testid="empty-sales-catalog">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf4ef] text-[#28614f]"><ClipboardList className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{entries.length === 0 ? `No ${definition.title.toLowerCase()} yet` : 'No matching records'}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  {entries.length === 0 ? 'Create the first record from live MIS data. Reference mappings become available as related catalogs are maintained.' : 'Try another search or status filter.'}
                </p>
                {entries.length === 0 && <Button onClick={() => setEditor(null)} className="mt-4 gap-2 bg-[#1f5849] hover:bg-[#174536]"><Plus className="h-4 w-4" />Add first record</Button>}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[740px] text-sm">
                    <thead className="bg-[#f6f8f6] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3">Name</th>
                        {mappingFields.slice(0, 2).map((field) => <th key={field.key} className="px-5 py-3">{displayFieldLabel(field, catalog)}</th>)}
                        <th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((entry, index) => (
                        <tr key={entry.id} className={cn('border-t transition-colors hover:bg-[#f5f8f5]', entry.source_reference && 'bg-amber-50/35 hover:bg-amber-50/70', !entry.source_reference && index % 2 === 1 && 'bg-muted/[0.12]')} data-testid={`row-catalog-entry-${entry.id}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{entry.name}</p>
                              {entry.source_reference && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-900">Reference</Badge>}
                            </div>
                            {!!entry.source_issues?.length && <p className="mt-1 text-xs text-amber-800">{entry.source_issues.length} review note{entry.source_issues.length === 1 ? '' : 's'}</p>}
                          </td>
                          {mappingFields.slice(0, 2).map((field) => (
                            <td key={field.key} className="max-w-[240px] break-words px-5 py-3.5 text-xs text-muted-foreground">{displayReference(entry, field, snapshot!)}</td>
                          ))}
                          <td className="px-5 py-3.5">
                            <Badge variant="outline" className={entry.is_active ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-slate-200 text-slate-500'}>
                              <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', entry.is_active ? 'bg-emerald-600' : 'bg-slate-400')} />
                              {entry.source_reference ? (entry.is_active ? 'Active in source' : 'Inactive in source') : (entry.is_active ? 'Active enrollment' : 'Inactive enrollment')}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {entry.source_reference ? (
                              <Button variant="outline" size="sm" onClick={() => setSourceView(entry)} className="bg-card" data-testid={`button-view-source-${entry.id}`}>View reference</Button>
                            ) : (
                              <div className="inline-flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEditor(entry)} className="gap-1.5 bg-card" data-testid={`button-edit-catalog-${entry.id}`}>Edit <ArrowUpRight className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="sm" onClick={() => { setStatusError(''); setStatusChange(entry); }} disabled={updateEntry.isPending} data-testid={`button-toggle-catalog-${entry.id}`}>
                                  {entry.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y md:hidden">
                  {filtered.map((entry) => (
                    <article key={entry.id} className="space-y-3 p-4" data-testid={`card-catalog-entry-${entry.id}`}>
                        <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{entry.name}</p>
                          {entry.source_reference && <Badge variant="outline" className="mt-2 border-amber-300 bg-amber-50 text-[10px] text-amber-900">Reference</Badge>}
                        </div>
                        <Badge variant="outline" className={entry.is_active ? 'shrink-0 border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'shrink-0 border-slate-200 text-slate-500'}>{entry.source_reference ? (entry.is_active ? 'Active in source' : 'Inactive in source') : (entry.is_active ? 'Active enrollment' : 'Inactive enrollment')}</Badge>
                      </div>
                      {entry.source_reference && (
                        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-950">
                          {definition.manager && <p>Not linked to a verified MIS user.</p>}
                          {!!entry.source_issues?.length && <p>{entry.source_issues.length} review note{entry.source_issues.length === 1 ? '' : 's'} · Open details to review.</p>}
                        </div>
                      )}
                      {mappingFields.length > 0 && (
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-muted/25 p-3">
                          {mappingFields.map((field) => <div key={field.key} className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{displayFieldLabel(field, catalog)}</dt><dd className="mt-0.5 break-words text-xs">{displayReference(entry, field, snapshot!)}</dd></div>)}
                        </dl>
                      )}
                      {entry.source_reference ? (
                        <Button variant="outline" size="sm" onClick={() => setSourceView(entry)} className="w-full bg-card" data-testid={`button-view-source-mobile-${entry.id}`}>View reference</Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditor(entry)} className="flex-1 bg-card" data-testid={`button-edit-catalog-mobile-${entry.id}`}>Edit record</Button>
                          <Button variant="outline" size="sm" onClick={() => { setStatusError(''); setStatusChange(entry); }} disabled={updateEntry.isPending} data-testid={`button-toggle-catalog-mobile-${entry.id}`}>{entry.is_active ? 'Deactivate' : 'Activate'}</Button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
            <div className="flex flex-col gap-2 border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>{isLoading ? 'Loading records…' : `${filtered.length} of ${entries.length} rows · ${operationalEntries.length} operational · ${referenceEntries.length} source references`}</span>
              <span className="inline-flex items-center gap-1.5"><CircleHelp className="h-3.5 w-3.5" />Referenced records must remain consistent across the sales structure.</span>
            </div>
          </section>
        )}

        {definition?.manager && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#d2dfd9] bg-[#f1f6f2] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-medium text-[#244b3f]">Existing MIS users only</p><p className="mt-1 text-xs leading-5 text-[#5b746a]">Manager enrollment does not create accounts or change login, profile, permissions or account status.</p></div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-[#28614f]"><ShieldCheck className="h-4 w-4" />Account access remains unchanged</span>
          </div>
        )}
      </main>

      {definition && editor !== undefined && (
        <CatalogEditor key={editor?.id ?? 'new'} catalog={catalog} definition={definition} snapshot={snapshot!} entry={editor ?? undefined} onClose={() => setEditor(undefined)} />
      )}
      {definition && sourceView && <SourceReferenceDetails entry={sourceView} definition={definition} snapshot={snapshot!} onClose={() => setSourceView(null)} />}
      {statusChange && (
        <Dialog open onOpenChange={(open) => { if (!open && !updateEntry.isPending) setStatusChange(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><CircleHelp className="h-5 w-5" /></span>
              <DialogTitle>{statusChange.is_active ? 'Deactivate record?' : 'Activate record?'}</DialogTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {statusChange.is_active
                  ? `${statusChange.name} will remain in the catalog but will no longer be available for new mappings. The server will prevent deactivation if the record is still referenced.`
                  : `${statusChange.name} will become available for new mappings again.`}
              </p>
            </DialogHeader>
            {statusError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Could not update status</AlertTitle><AlertDescription>{statusError}</AlertDescription></Alert>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusChange(null)} disabled={updateEntry.isPending}>Cancel</Button>
              <Button onClick={() => toggleStatus(statusChange)} disabled={updateEntry.isPending} className={cn('gap-2', statusChange.is_active ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#1f5849] hover:bg-[#174536]')} data-testid="button-confirm-catalog-status">
                {updateEntry.isPending ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />Confirm</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function SalesCatalogPage() {
  const { catalog = '' } = useParams<{ catalog: string }>();
  const { user } = useAuth();
  return (
    <SalesStructureGuard>
      {user && <CatalogContent catalog={catalog} username={user.username} />}
    </SalesStructureGuard>
  );
}
