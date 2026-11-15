import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, Check, CircleHelp, Eye, PencilLine, Plus, RefreshCw, Search, ShieldCheck,
  UserRoundCheck, UsersRound,
} from 'lucide-react';
import {
  getGetOrganisationQueryKey,
  getGetSalesCatalogsQueryKey,
  getGetSalesManagerMappingsQueryKey,
  getGetSalesStructureQueryKey,
  useGetSalesCatalogs,
  useGetSalesStructure,
  useUpdateSalesManagerEnrollment,
} from '@workspace/api-client-react';
import type { SalesLevel, SalesManager } from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { SalesStructureGuard, SalesStructureHeader } from './shared';
import { ManagerCatalogRecords } from './manager-catalog-records';
import { ManagerDetailsForm, ManagerDetailsView } from './manager-details';

const LEVELS: SalesLevel[] = ['UNIT', 'REGION', 'BRANCH', 'NATIONAL'];
const LEVEL_LABEL: Record<SalesLevel, string> = {
  NATIONAL: 'National Sales Manager',
  REGION: 'Regional Manager',
  BRANCH: 'Branch Manager',
  UNIT: 'Unit Manager',
};

function errorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'The change could not be saved. Your draft is still here; please try again.';
}

function categoryPreset(): 'all' | SalesLevel {
  const value = new URLSearchParams(window.location.search).get('category');
  return LEVELS.includes(value as SalesLevel) ? value as SalesLevel : 'all';
}

function ManagerWorkspace({ username }: { username: string }) {
  const queryKey = [...getGetSalesStructureQueryKey(), username];
  const catalogQueryKey = [...getGetSalesCatalogsQueryKey(), username];
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSalesStructure({
    query: { queryKey, staleTime: 30_000, refetchOnMount: 'always', refetchOnWindowFocus: true },
  });
  const { data: catalogSnapshot, isLoading: catalogsLoading, isError: catalogsError, error: catalogsLoadError, refetch: refetchCatalogs } = useGetSalesCatalogs({
    query: { queryKey: catalogQueryKey, staleTime: 15_000, refetchOnMount: 'always', refetchOnWindowFocus: true },
  });
  const queryClient = useQueryClient();
  const updateEnrollment = useUpdateSalesManagerEnrollment();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | SalesLevel>(categoryPreset);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsView, setDetailsView] = useState<SalesManager | null>(null);
  const [detailsEditor, setDetailsEditor] = useState<SalesManager | null>(null);
  const [pendingChange, setPendingChange] = useState<SalesManager | null>(null);
  const [saveError, setSaveError] = useState('');
  const managers = data?.managers ?? [];
  const users = data?.users ?? [];
  const nodes = data?.nodes ?? [];
  const usedManagerIds = useMemo(() => new Set(nodes.filter((node) => node.is_active && node.manager_id != null).map((node) => node.manager_id)), [nodes]);
  const filtered = useMemo(() => managers
    .filter((manager) => levelFilter === 'all' || manager.level === levelFilter)
    .filter((manager) => statusFilter === 'all' || (statusFilter === 'active' ? manager.is_active : !manager.is_active))
    .filter((manager) => `${manager.employee_name} ${manager.username}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.employee_name.localeCompare(b.employee_name)), [managers, levelFilter, statusFilter, search]);
  const activeManagers = managers.filter((manager) => manager.is_active).length;
  const toggleEnrollment = (manager: SalesManager) => {
    setSaveError('');
    updateEnrollment.mutate({ id: manager.id, data: { is_active: !manager.is_active, version: manager.version } }, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetOrganisationQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesManagerMappingsQueryKey() }),
        ]);
        await refetch();
        setPendingChange(null);
      },
      onError: (reason) => setSaveError(errorText(reason)),
    });
  };
  const refreshAll = async () => {
    await Promise.all([refetch(), refetchCatalogs()]);
  };
  const refreshManager = async (id: number) => {
    const result = await refetch();
    return result.data?.managers.find(manager => manager.id === id);
  };
  const showSavedManager = ({ level, is_active }: { level: SalesLevel; is_active: boolean }) => {
    setLevelFilter(level);
    setStatusFilter(is_active ? 'active' : 'inactive');
    setSearch('');
  };

  return (
    <>
      <SalesStructureHeader
        eyebrow="Administration / Organization structure-Medical"
        title="Manager Enrollment"
        description="Enroll existing MIS users as Unit, Regional, Branch or National Sales Managers. Imported enrollments with missing details remain inactive drafts; original source records are preserved."
      >
        <Button variant="outline" onClick={refreshAll} className="gap-2 bg-card" data-testid="button-refresh-managers">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />Refresh
        </Button>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-enroll-manager">
          <Plus className="h-4 w-4" />Enroll manager
        </Button>
      </SalesStructureHeader>
      <main className="mx-auto -mt-1 max-w-[1480px] space-y-5 px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active designations</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{isLoading ? '—' : activeManagers}</p>
            <p className="mt-1 text-xs text-muted-foreground">A person may hold more than one level</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eligible staff accounts</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{isLoading ? '—' : users.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Existing active and approved users</p>
          </div>
          <div className="rounded-xl border bg-[#edf4ef] p-4">
            <div className="flex items-center gap-2 text-[#28614f]"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-semibold uppercase tracking-wider">Account permissions</p></div>
            <p className="mt-2 text-sm font-semibold text-[#244b3f]">Unchanged by enrollment</p>
            <p className="mt-1 text-xs leading-5 text-[#5b746a]">Manager status does not grant administrator rights or alter a profile.</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-semibold tracking-tight">Manager designations</h2>
              <p className="mt-1 text-xs text-muted-foreground">Activate or pause eligibility for future assignments. A designation is separate from a catalog or source record.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(200px,1fr)_190px_145px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or username…" className="pl-9" data-testid="input-search-managers" />
              </div>
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as 'all' | SalesLevel)} aria-label="Filter managers by category" className="h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-manager-filter-level">
                <option value="all">All manager categories</option>
                {LEVELS.map((level) => <option key={level} value={level}>{LEVEL_LABEL[level]}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')} aria-label="Filter managers by status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-manager-filter-status">
                <option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All statuses</option>
              </select>
            </div>
          </div>
          {isError && (
            <Alert variant="destructive" className="m-4" data-testid="alert-manager-load-error">
              <AlertCircle className="h-4 w-4" /><AlertTitle>Could not load manager enrollments</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{errorText(error)}</span><Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-managers">Try again</Button>
              </AlertDescription>
            </Alert>
          )}
          {saveError && (
            <Alert variant="destructive" className="m-4" data-testid="alert-manager-update-error">
              <AlertCircle className="h-4 w-4" /><AlertTitle>Could not update enrollment</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{saveError}</span><Button size="sm" variant="outline" onClick={() => setSaveError('')}>Dismiss</Button>
              </AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="space-y-3 p-5" aria-label="Loading manager enrollments">{[0, 1, 2].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-lg bg-muted/60" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-14 text-center" data-testid="empty-manager-enrollments">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf4ef] text-[#28614f]"><UsersRound className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold">{managers.length === 0 ? 'No managers enrolled yet' : 'No matching enrollments'}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {managers.length === 0 ? 'Enroll an eligible existing account to make them available for a corresponding structure role.' : 'Try another search or filter.'}
              </p>
              {managers.length === 0 && <Button onClick={() => setDialogOpen(true)} className="mt-4 gap-2 bg-[#1f5849] hover:bg-[#174536]"><Plus className="h-4 w-4" />Enroll first manager</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-[#f6f8f6] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <tr><th className="px-5 py-3">Staff member</th><th className="px-5 py-3">Designation</th><th className="px-5 py-3">Account eligibility</th><th className="px-5 py-3">Details</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {filtered.map((manager, index) => {
                    const assigned = usedManagerIds.has(manager.id);
                    return (
                      <tr key={manager.id} className={cn('border-t transition-colors hover:bg-[#f5f8f5]', index % 2 === 1 && 'bg-muted/[0.12]')} data-testid={`row-sales-manager-${manager.id}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf1ec] text-xs font-semibold text-[#28614f]">{manager.employee_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                            <div><p className="font-medium">{manager.employee_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{manager.username}</p></div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><Badge variant="outline" className="border-[#cdded5] bg-[#f1f6f2] text-[#285b4b]">{LEVEL_LABEL[manager.level]}</Badge></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', manager.user_eligible ? 'bg-emerald-600' : 'bg-amber-500')} />
                            <span className={manager.user_eligible ? 'text-foreground' : 'text-amber-800'}>{manager.user_eligible ? 'Eligible account' : 'Account unavailable'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={manager.details ? 'border-[#cdded5] bg-[#f1f6f2] text-[#285b4b]' : 'border-amber-200 bg-amber-50 text-amber-900'}>
                            {manager.details ? 'Captured' : 'Details not captured'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={manager.is_active ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-slate-200 text-slate-500'}>
                            <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', manager.is_active ? 'bg-emerald-600' : 'bg-slate-400')} />{manager.is_active ? 'Active' : manager.details && Object.values(manager.details).some(value => !value.trim()) ? 'Inactive draft' : 'Inactive'}
                          </Badge>
                          {assigned && <p className="mt-1 text-[11px] text-muted-foreground">Assigned to active structure</p>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button variant="outline" size="sm" disabled={updateEnrollment.isPending} onClick={() => setDetailsView(manager)} className="gap-1.5" data-testid={`button-view-manager-details-${manager.id}`}><Eye className="h-3.5 w-3.5" />View</Button>
                            <Button variant="outline" size="sm" disabled={updateEnrollment.isPending} onClick={() => setDetailsEditor(manager)} className="gap-1.5" data-testid={`button-edit-manager-details-row-${manager.id}`}><PencilLine className="h-3.5 w-3.5" />Edit</Button>
                            <Button
                              variant={manager.is_active ? 'outline' : 'default'}
                              size="sm"
                              disabled={updateEnrollment.isPending || (!manager.is_active && !manager.user_eligible)}
                              onClick={() => { setSaveError(''); setPendingChange(manager); }}
                              className={cn('min-w-24 gap-1.5', !manager.is_active && 'bg-[#1f5849] hover:bg-[#174536]')}
                              data-testid={`button-toggle-manager-${manager.id}`}
                              title={!manager.is_active && !manager.user_eligible ? 'Account is not eligible for activation' : undefined}
                            >
                              {manager.is_active ? 'Deactivate' : 'Reactivate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
            <span>{isLoading ? 'Loading enrollments…' : `${filtered.length} of ${managers.length} manager enrollments`}</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex"><CircleHelp className="h-3.5 w-3.5" />One account may have separate designations at different levels.</span>
          </div>
        </section>
        <ManagerCatalogRecords
          snapshot={catalogSnapshot}
          loading={catalogsLoading}
          error={catalogsError ? errorText(catalogsLoadError) : undefined}
          onRetry={() => refetchCatalogs()}
          category={levelFilter}
          status={statusFilter}
          search={search}
        />
        <div className="rounded-xl border border-[#d2dfd9] bg-[#f1f6f2] p-4">
          <p className="text-sm font-medium text-[#244b3f]">Before deactivating a designation</p>
          <p className="mt-1 text-xs leading-5 text-[#5b746a]">Unassign or replace this manager on active structure entries first. Existing assignments are never silently remapped.</p>
        </div>
      </main>
      {dialogOpen && <ManagerDetailsForm
        key="new-manager"
        users={users}
        managers={managers}
        initialLevel={levelFilter === 'all' ? 'UNIT' : levelFilter}
        onClose={() => setDialogOpen(false)}
        onSaved={showSavedManager}
        refreshStructure={refetch}
        refreshManager={refreshManager}
      />}
      {detailsView && <ManagerDetailsView
        manager={detailsView}
        onClose={() => setDetailsView(null)}
        onEdit={() => { setDetailsEditor(detailsView); setDetailsView(null); }}
      />}
      {detailsEditor && <ManagerDetailsForm
        key={`edit-manager-${detailsEditor.id}`}
        users={users}
        managers={managers}
        manager={detailsEditor}
        initialLevel={detailsEditor.level}
        onClose={() => setDetailsEditor(null)}
        onSaved={showSavedManager}
        refreshStructure={refetch}
        refreshManager={refreshManager}
      />}
      {pendingChange && (
        <Dialog open onOpenChange={(open) => { if (!open && !updateEnrollment.isPending) setPendingChange(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className={cn('mb-2 grid h-10 w-10 place-items-center rounded-xl', pendingChange.is_active ? 'bg-amber-50 text-amber-700' : 'bg-[#e8f1ec] text-[#28614f]')}>
                {pendingChange.is_active ? <CircleHelp className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}
              </div>
              <DialogTitle>{pendingChange.is_active ? 'Deactivate manager designation?' : 'Reactivate manager designation?'}</DialogTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                {pendingChange.is_active
                  ? `${pendingChange.employee_name} will no longer be available for new assignments. Any active structure assignment must be cleared first.`
                  : `${pendingChange.employee_name} will become available for ${LEVEL_LABEL[pendingChange.level].toLowerCase()} assignments again.`}
              </p>
            </DialogHeader>
            {pendingChange.is_active && usedManagerIds.has(pendingChange.id) && (
              <Alert>
                <CircleHelp className="h-4 w-4" /><AlertTitle>Active assignments found</AlertTitle>
                <AlertDescription>Move this manager to another eligible account or clear their assignment on every active structure entry first.</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingChange(null)} disabled={updateEnrollment.isPending} data-testid="button-cancel-manager-toggle">Cancel</Button>
              <Button
                onClick={() => toggleEnrollment(pendingChange)}
                disabled={updateEnrollment.isPending || (pendingChange.is_active && usedManagerIds.has(pendingChange.id))}
                className={cn('gap-2', pendingChange.is_active ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#1f5849] hover:bg-[#174536]')}
                data-testid="button-confirm-manager-toggle"
              >
                {updateEnrollment.isPending ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />Confirm</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function SalesStructureManagersPage() {
  const { user } = useAuth();
  return <SalesStructureGuard>{user && <ManagerWorkspace username={user.username} />}</SalesStructureGuard>;
}
