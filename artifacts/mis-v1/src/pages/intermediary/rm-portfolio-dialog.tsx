import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRightLeft, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import {
  getGetRmAgentsQueryKey,
  useGetRmAgents,
  type RmManagerRecord,
} from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth-context';
import { identityQueryKey } from '@/pages/admin/organisation/shared';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const PAGE_SIZE = 25;

function categoryLabel(category: RmManagerRecord['category']) {
  return category === 'C' ? 'Corporate' : 'Retail';
}

function getErrorText(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'The current portfolio could not be loaded.';
}

export function RmPortfolioDialog({
  open,
  manager,
  snapshotYear,
  onClose,
  onAssign,
}: {
  open: boolean;
  manager: RmManagerRecord | null;
  snapshotYear: number;
  onClose: () => void;
  onAssign: (manager: RmManagerRecord) => void;
}) {
  const { user } = useAuth();
  const identity = user ? { id: user.id, profileId: user.profileId } : null;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch('');
    setPage(1);
  }, [manager?.code, manager?.category, manager?.year]);

  const params = useMemo(() => ({
    category: manager?.category ?? 'C',
    ...(manager ? { manager_code: manager.code } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    page,
  }), [manager?.category, manager?.code, page, search]);
  const portfolio = useGetRmAgents(params, {
    query: {
      queryKey: identityQueryKey(getGetRmAgentsQueryKey(params), identity),
      enabled: open && !!user && !!manager,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const pageCount = Math.max(1, Math.ceil((portfolio.data?.total ?? 0) / PAGE_SIZE));
  const isHistorical = !!manager && !manager.is_current && manager.year <= snapshotYear;
  const isFuture = !!manager && manager.year > snapshotYear;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-3xl" data-testid="dialog-rm-portfolio">
        {manager ? <>
          <DialogHeader>
            <p className="rm-eyebrow">Read-only manager record · {categoryLabel(manager.category)}</p>
            <DialogTitle>{manager.name}</DialogTitle>
            <DialogDescription>Review this year-specific reference and its live current portfolio. Agent ownership follows the current manager code and category.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-3"><small className="rm-eyebrow">Manager code</small><b className="mt-1 block font-mono text-sm">{manager.code}</b></div>
            <div className="rounded-lg bg-muted/50 p-3"><small className="rm-eyebrow">Class · year</small><b className="mt-1 block text-sm">{manager.class_code} · {manager.year}</b></div>
            <div className="rounded-lg bg-muted/50 p-3"><small className="rm-eyebrow">Reference status</small><b className="mt-1 block text-sm">{isFuture ? 'Future' : isHistorical ? 'Historical' : manager.active ? 'Active' : 'Inactive'}</b></div>
          </div>
          {(isHistorical || isFuture) && <p className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950" role="note">{isFuture ? `This reference is for ${manager.year}, later than the ${snapshotYear} database snapshot.` : `This is a ${manager.year} reference. The portfolio below lists agents currently assigned to this manager code and category; it is not a ${manager.year} historical ownership snapshot.`}</p>}

          <section aria-labelledby="rm-current-portfolio-title" className="min-w-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="rm-eyebrow">Live ownership · exact code/category</p>
                <h3 id="rm-current-portfolio-title" className="text-sm font-semibold">Current portfolio</h3>
              </div>
              <label className="relative block w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input className="rm-input w-full pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} maxLength={200} placeholder="Search current agents" aria-label="Search current portfolio agents" data-testid="input-search-rm-portfolio" />
              </label>
            </div>
            <p className="mb-2 text-[10px] text-muted-foreground" data-testid="text-rm-portfolio-count">{portfolio.data?.total.toLocaleString() ?? '—'} currently assigned {categoryLabel(manager.category)} agents</p>
            {portfolio.isLoading ? <div className="space-y-3 rounded-lg border border-border p-4" aria-label="Loading current manager portfolio">{[0, 1, 2].map((row) => <div key={row} className="h-4 animate-pulse rounded bg-muted" />)}</div>
              : portfolio.isError ? <div className="rm-alert rm-alert-error" role="alert"><AlertCircle className="h-4 w-4" /><span>{getErrorText(portfolio.error)}</span><button type="button" className="underline" onClick={() => void portfolio.refetch()} data-testid="button-retry-rm-portfolio">Retry</button></div>
                : !portfolio.data?.items.length ? <div className="rm-empty min-h-28 rounded-lg border border-dashed border-border"><Users className="h-5 w-5" /><b>No current agents found</b><span>Try another name or code search. This does not describe past-year ownership.</span></div>
                  : <>
                    <div className="rm-table-scroll max-h-[40vh] rounded-lg border border-border">
                      <table className="rm-table">
                        <thead><tr><th>Agent name</th><th>Agent code</th><th>Current relationship manager</th></tr></thead>
                        <tbody>{portfolio.data.items.map((agent) => <tr key={agent.code} data-testid={`row-rm-portfolio-agent-${agent.code}`}>
                          <td><b>{agent.name}</b></td>
                          <td className="font-mono">{agent.code}</td>
                          <td>{agent.current_name ?? agent.current_code ?? 'Unassigned'}</td>
                        </tr>)}</tbody>
                      </table>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Page {portfolio.data.page} of {pageCount} · {portfolio.data.page_size} per page</span>
                      <div className="flex gap-1">
                        <button type="button" className="rm-icon-button" aria-label="Previous portfolio page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} data-testid="button-prev-rm-portfolio"><ChevronLeft className="h-4 w-4" /></button>
                        <button type="button" className="rm-icon-button" aria-label="Next portfolio page" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount} data-testid="button-next-rm-portfolio"><ChevronRight className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </>}
          </section>

          <DialogFooter>
            <button type="button" className="rm-button rm-quiet" onClick={onClose} data-testid="button-close-rm-portfolio">Close</button>
            <button type="button" className="rm-button rm-primary" onClick={() => onAssign(manager)} data-testid="button-assign-from-rm-portfolio"><ArrowRightLeft className="h-4 w-4" />Assign or move agents</button>
          </DialogFooter>
        </> : <>
          <DialogHeader><DialogTitle>Manager record unavailable</DialogTitle><DialogDescription>The current relationship manager snapshot no longer contains this record. Refresh before continuing.</DialogDescription></DialogHeader>
          <DialogFooter><button type="button" className="rm-button rm-quiet" onClick={onClose}>Close</button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  );
}
