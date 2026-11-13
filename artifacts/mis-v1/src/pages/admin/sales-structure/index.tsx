import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  AlertCircle, Check, ChevronRight, CircleHelp, GitBranch, Layers3, Pencil, Plus,
  RefreshCw, Search, ShieldCheck, UsersRound,
} from 'lucide-react';
import {
  getGetSalesStructureQueryKey,
  useCreateSalesStructureNode,
  useGetSalesStructure,
  useUpdateSalesStructureNode,
} from '@workspace/api-client-react';
import type { SalesLevel, SalesManager, SalesNode, SalesNodeInput, SalesNodeUpdate } from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { SalesStructureGuard, SalesStructureHeader } from './shared';

const LEVELS: SalesLevel[] = ['NATIONAL', 'REGION', 'BRANCH', 'UNIT'];
const LEVEL_LABEL: Record<SalesLevel, string> = {
  NATIONAL: 'National',
  REGION: 'Regional',
  BRANCH: 'Branch',
  UNIT: 'Unit',
};
const EMPTY_FORM = {
  code: '',
  name: '',
  level: 'NATIONAL' as SalesLevel,
  parent_id: '',
  manager_id: '',
  is_active: true,
};

function errorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'The change could not be saved. Your draft is still here; please try again.';
}

function managerName(manager: SalesManager | undefined) {
  if (!manager) return 'Unassigned';
  return `${manager.employee_name} · ${manager.username}`;
}

function ancestry(node: SalesNode, nodes: SalesNode[]) {
  const chain: SalesNode[] = [];
  let current: SalesNode | undefined = node;
  let guard = 0;
  while (current && guard < 5) {
    chain.unshift(current);
    current = current.parent_id == null ? undefined : nodes.find((item) => item.id === current?.parent_id);
    guard += 1;
  }
  return chain;
}

function NodeEditor({
  node,
  nodes,
  managers,
  onClose,
  refresh,
}: {
  node?: SalesNode;
  nodes: SalesNode[];
  managers: SalesManager[];
  onClose: () => void;
  refresh: () => Promise<unknown>;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!node;
  const [form, setForm] = useState(() => node ? {
    code: node.code,
    name: node.name,
    level: node.level,
    parent_id: node.parent_id == null ? '' : String(node.parent_id),
    manager_id: node.manager_id == null ? '' : String(node.manager_id),
    is_active: node.is_active,
  } : EMPTY_FORM);
  const createNode = useCreateSalesStructureNode();
  const updateNode = useUpdateSalesStructureNode();
  const pending = createNode.isPending || updateNode.isPending;
  const mutationError = createNode.error || updateNode.error;
  const parentLevel = form.level === 'REGION' ? 'NATIONAL' : form.level === 'BRANCH' ? 'REGION' : form.level === 'UNIT' ? 'BRANCH' : null;
  const parentOptions = parentLevel
    ? nodes.filter((item) => item.level === parentLevel && item.id !== node?.id
      && (item.is_active || item.id === node?.parent_id))
    : [];
  const eligibleManagers = managers.filter((item) =>
    item.level === form.level && ((item.is_active && item.user_eligible) || item.id === node?.manager_id),
  );
  const activeChildren = node ? nodes.filter((item) => item.parent_id === node.id && item.is_active).length : 0;
  const canSave = form.name.trim().length > 0
    && form.name.trim().length <= 150
    && (isEdit || /^[A-Za-z0-9_-]{1,40}$/.test(form.code))
    && (form.level === 'NATIONAL' || Boolean(form.parent_id))
    && !(node && node.is_active && !form.is_active && activeChildren > 0);

  const save = () => {
    if (!canSave) return;
    const parentId = form.parent_id ? Number(form.parent_id) : null;
    const managerId = form.manager_id ? Number(form.manager_id) : null;
    if (node) {
      const data: SalesNodeUpdate = {
        name: form.name.trim(),
        parent_id: parentId,
        manager_id: managerId,
        is_active: form.is_active,
        version: node.version,
      };
      updateNode.mutate({ id: node.id, data }, {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() });
          await refresh();
          onClose();
        },
      });
    } else {
      const data: SalesNodeInput = {
        code: form.code.trim(),
        name: form.name.trim(),
        level: form.level,
        parent_id: parentId,
        manager_id: managerId,
        is_active: form.is_active,
      };
      createNode.mutate({ data }, {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() });
          await refresh();
          onClose();
        },
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-[#e8f1ec] text-[#28614f]">
            <GitBranch className="h-5 w-5" />
          </div>
          <DialogTitle>{isEdit ? `Edit ${LEVEL_LABEL[node.level].toLowerCase()}` : 'Add sales unit'}</DialogTitle>
          <p className="text-sm leading-5 text-muted-foreground">
            {isEdit ? 'Update the reporting relationship and current assignment.' : 'Add one level at a time, starting with national leadership.'}
          </p>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sales-node-level">Structure level</Label>
            <select
              id="sales-node-level"
              value={form.level}
              disabled={isEdit}
              onChange={(event) => setForm((current) => ({ ...current, level: event.target.value as SalesLevel, parent_id: '', manager_id: '' }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
              data-testid="select-node-level"
            >
              {LEVELS.map((level) => <option key={level} value={level}>{LEVEL_LABEL[level]}</option>)}
            </select>
            {isEdit && <p className="text-xs text-muted-foreground">Level is fixed after creation.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sales-node-code">Unit code</Label>
            <Input
              id="sales-node-code"
              value={form.code}
              disabled={isEdit}
              maxLength={40}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="e.g. NAIROBI-CENTRAL"
              data-testid="input-node-code"
            />
            {isEdit && <p className="text-xs text-muted-foreground">Code is fixed after creation.</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sales-node-name">Display name <span className="text-destructive">*</span></Label>
            <Input
              id="sales-node-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              maxLength={150}
              placeholder="Name used across the sales structure"
              data-testid="input-node-name"
            />
          </div>
          {form.level !== 'NATIONAL' && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sales-node-parent">{LEVEL_LABEL[parentLevel!]} parent <span className="text-destructive">*</span></Label>
              <select
                id="sales-node-parent"
                value={form.parent_id}
                onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                data-testid="select-node-parent"
              >
                <option value="">Choose an active {LEVEL_LABEL[parentLevel!].toLowerCase()}</option>
                {parentOptions.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.code} — {parent.name}{!parent.is_active ? ' (inactive current parent)' : ''}
                  </option>
                ))}
              </select>
              {parentOptions.length === 0 && (
                <p className="text-xs text-amber-700">Create an active {LEVEL_LABEL[parentLevel!].toLowerCase()} first.</p>
              )}
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sales-node-manager">Assigned manager</Label>
            <select
              id="sales-node-manager"
              value={form.manager_id}
              onChange={(event) => setForm((current) => ({ ...current, manager_id: event.target.value }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              data-testid="select-node-manager"
            >
              <option value="">No manager assigned</option>
              {eligibleManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {managerName(manager)}{!manager.is_active || !manager.user_eligible ? ' (unavailable current assignment)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-muted-foreground">Only enrolled managers at this level with eligible accounts can be assigned.</p>
          </div>
          <label className="flex items-start gap-3 rounded-lg border bg-muted/25 p-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[#28614f]"
              data-testid="checkbox-node-active"
            />
            <span>
              <span className="block text-sm font-medium">Active structure entry</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Inactive entries remain visible for reference and are not available as new parents.</span>
            </span>
          </label>
          {node && !node.is_active && form.manager_id && managers.find((manager) => String(manager.id) === form.manager_id && (!manager.is_active || !manager.user_eligible)) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 sm:col-span-2">
              This saved assignment is unavailable. Choose an active eligible manager or clear the field before reactivating this entry.
            </div>
          )}
          {node && node.is_active && !form.is_active && activeChildren > 0 && (
            <Alert className="sm:col-span-2">
              <CircleHelp className="h-4 w-4" />
              <AlertTitle>Active children must be moved first</AlertTitle>
              <AlertDescription>This entry has {activeChildren} active child{activeChildren === 1 ? '' : 'ren'}. Reassign or deactivate them before deactivating this entry.</AlertDescription>
            </Alert>
          )}
          {mutationError && (
            <Alert variant="destructive" className="sm:col-span-2" data-testid="alert-node-save-error">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not save this entry</AlertTitle>
              <AlertDescription>{errorText(mutationError)}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending} data-testid="button-cancel-node">Cancel</Button>
          <Button onClick={save} disabled={!canSave || pending} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-save-node">
            {pending ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />{isEdit ? 'Save changes' : 'Create entry'}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SalesStructureWorkspace({ username }: { username: string }) {
  const queryKey = [...getGetSalesStructureQueryKey(), username];
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSalesStructure({
    query: {
      queryKey,
      staleTime: 30_000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [editor, setEditor] = useState<SalesNode | null | undefined>(undefined);
  const nodes = data?.nodes ?? [];
  const managers = data?.managers ?? [];
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const managerById = useMemo(() => new Map(managers.map((manager) => [manager.id, manager])), [managers]);
  const filtered = useMemo(() => nodes
    .filter((node) => levelFilter === 'all' || node.level === levelFilter)
    .filter((node) => statusFilter === 'all' || (statusFilter === 'active' ? node.is_active : !node.is_active))
    .filter((node) => {
      const path = ancestry(node, nodes).map((item) => `${item.code} ${item.name}`).join(' ');
      const manager = node.manager_id == null ? '' : managerName(managerById.get(node.manager_id));
      return `${path} ${manager}`.toLowerCase().includes(search.trim().toLowerCase());
    })
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.name.localeCompare(b.name)), [nodes, levelFilter, statusFilter, search, managerById]);
  const activeCount = nodes.filter((node) => node.is_active).length;
  const assignedCount = nodes.filter((node) => node.is_active && node.manager_id != null).length;
  const counts = LEVELS.map((level) => ({ level, count: nodes.filter((node) => node.level === level && node.is_active).length }));

  return (
    <>
      <SalesStructureHeader
        eyebrow="Administration / Sales operations"
        title="Sales Structure setup"
        description="Define the leadership chain from national office to sales unit, then assign an enrolled manager at each level."
      >
        <Button variant="outline" onClick={() => refetch()} className="gap-2 bg-card" data-testid="button-refresh-structure">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />Refresh
        </Button>
        <Button onClick={() => setEditor(null)} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-add-sales-entry">
          <Plus className="h-4 w-4" />Add entry
        </Button>
      </SalesStructureHeader>

      <main className="mx-auto -mt-1 max-w-[1480px] space-y-5 px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active entries</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{isLoading ? '—' : activeCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across the reporting hierarchy</p>
          </div>
          {counts.map(({ level, count }) => (
            <div key={level} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{LEVEL_LABEL[level]} level</p>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf4ef] text-[#28614f]">
                  {level === 'UNIT' ? <Layers3 className="h-4 w-4" /> : level === 'NATIONAL' ? <ShieldCheck className="h-4 w-4" /> : <GitBranch className="h-4 w-4" />}
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{isLoading ? '—' : count}</p>
              <p className="mt-1 text-xs text-muted-foreground">{level === 'UNIT' ? 'Sales teams' : 'Leadership nodes'}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-semibold tracking-tight">Reporting hierarchy</h2>
              <p className="mt-1 text-xs text-muted-foreground">{activeCount} active entries · {assignedCount} with a current manager</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_140px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, name, manager…" className="pl-9" data-testid="input-search-sales-structure" />
              </div>
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} aria-label="Filter by level" className="h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-filter-level">
                <option value="all">All levels</option>
                {LEVELS.map((level) => <option key={level} value={level}>{LEVEL_LABEL[level]}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className="h-10 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-filter-status">
                <option value="active">Active entries</option>
                <option value="inactive">Inactive entries</option>
                <option value="all">All statuses</option>
              </select>
            </div>
          </div>

          {isError && (
            <Alert variant="destructive" className="m-4" data-testid="alert-structure-load-error">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not load sales structure</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{errorText(error)}</span>
                <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-retry-structure">Try again</Button>
              </AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="space-y-3 p-5" aria-label="Loading sales structure">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-lg bg-muted/60" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-14 text-center" data-testid="empty-sales-structure">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf4ef] text-[#28614f]">
                <GitBranch className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{nodes.length === 0 ? 'Start with national leadership' : 'No matching entries'}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {nodes.length === 0
                  ? 'Create the top of the hierarchy first. Regional, branch and unit entries can then be connected in order.'
                  : 'Try a different search or filter, or create a new sales structure entry.'}
              </p>
              {nodes.length === 0 && <Button onClick={() => setEditor(null)} className="mt-4 gap-2 bg-[#1f5849] hover:bg-[#174536]"><Plus className="h-4 w-4" />Create national entry</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-[#f6f8f6] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Entry</th>
                    <th className="px-5 py-3">Reports through</th>
                    <th className="px-5 py-3">Assigned manager</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((node, index) => {
                    const path = ancestry(node, nodes);
                    const parent = node.parent_id == null ? undefined : nodeById.get(node.parent_id);
                    const manager = node.manager_id == null ? undefined : managerById.get(node.manager_id);
                    const unavailableManager = manager && (!manager.is_active || !manager.user_eligible);
                    return (
                      <tr key={node.id} className={cn('border-t transition-colors hover:bg-[#f5f8f5]', index % 2 === 1 && 'bg-muted/[0.12]')} data-testid={`row-sales-node-${node.id}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-3">
                            <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', node.level === 'NATIONAL' ? 'bg-[#e7eee8] text-[#27604e]' : 'bg-muted text-muted-foreground')}>
                              {node.level === 'UNIT' ? <Layers3 className="h-4 w-4" /> : <GitBranch className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium">{node.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">{node.code}</span>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span>{LEVEL_LABEL[node.level]}</span>
                                {path.length > 1 && (
                                  <span className="flex items-center gap-1 text-muted-foreground/80">
                                    {path.slice(0, -1).map((item) => <span key={item.id} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" />{item.name}</span>)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {parent ? <span>{parent.name}<span className="ml-2 font-mono text-xs text-muted-foreground">{parent.code}</span></span> : <span className="text-xs text-muted-foreground">National root</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#edf4ef] text-[#28614f]"><UsersRound className="h-3.5 w-3.5" /></span>
                            <span className={cn('text-sm', !manager && 'text-muted-foreground')}>{managerName(manager)}</span>
                            {unavailableManager && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-800">Unavailable</Badge>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className={node.is_active ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-slate-200 text-slate-500'}>
                            <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', node.is_active ? 'bg-emerald-600' : 'bg-slate-400')} />
                            {node.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="outline" size="sm" onClick={() => setEditor(node)} className="gap-1.5 bg-card" data-testid={`button-edit-sales-node-${node.id}`}>
                            <Pencil className="h-3.5 w-3.5" />Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-col gap-2 border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{isLoading ? 'Loading entries…' : `${filtered.length} of ${nodes.length} structure entries`}</span>
            <span className="inline-flex items-center gap-1.5"><CircleHelp className="h-3.5 w-3.5" />Unit codes remain separate from existing historical agent records.</span>
          </div>
        </section>
        <div className="flex flex-col gap-3 rounded-xl border border-[#d2dfd9] bg-[#f1f6f2] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#244b3f]">Manager assignments are separate from account access</p>
            <p className="mt-1 text-xs leading-5 text-[#5b746a]">Enrolling a manager preserves their existing login, profile and permissions.</p>
          </div>
          <Button variant="outline" asChild className="gap-2 bg-card" data-testid="button-open-manager-enrollment">
            <Link href="/admin/sales-structure/managers">Manage manager eligibility<ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
      {editor !== undefined && (
        <NodeEditor key={editor?.id ?? 'new'} node={editor ?? undefined} nodes={nodes} managers={managers} refresh={refetch} onClose={() => setEditor(undefined)} />
      )}
    </>
  );
}

export default function SalesStructurePage() {
  const { user } = useAuth();
  return <SalesStructureGuard>{user && <SalesStructureWorkspace username={user.username} />}</SalesStructureGuard>;
}
