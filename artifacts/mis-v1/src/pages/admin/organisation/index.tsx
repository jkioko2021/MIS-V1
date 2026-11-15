import { useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import {
  ArrowRight, Building2, ChevronRight, CircleHelp, GitBranch, Layers3, LockKeyhole, Network,
  Pencil, Plus, RefreshCw, Search, ShieldCheck, UsersRound,
} from 'lucide-react';
import {
  getGetOrganisationQueryKey, getGetSalesCatalogsQueryKey, useGetOrganisation, useGetSalesCatalogs,
} from '@workspace/api-client-react';
import type { OrganisationCandidate, OrganisationNode, SalesLevel } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { AgentMapping } from './agent-mapping';
import { SourceManagerDialog } from './source-manager-dialog';
import { OrganisationTree } from './hierarchy-tree';
import { PendingHierarchyRow } from './pending-hierarchy-row';
import { MedicalRecords } from './medical-records';
import { NodeEditor } from './node-editor';
import { ErrorNotice, identityQueryKey, LEVELS, LEVEL_LABEL, pathNames } from './shared';

const LEVEL_ROUTES: Record<string, SalesLevel | undefined> = {
  national: 'NATIONAL',
  regions: 'REGION',
  branches: 'BRANCH',
  units: 'UNIT',
};
function IconForLevel({ level }: { level: SalesLevel }) {
  const Icon = level === 'NATIONAL' ? ShieldCheck : level === 'REGION' ? GitBranch : level === 'BRANCH' ? Building2 : Layers3;
  return <Icon className="h-5 w-5" />;
}

export default function OrganisationPage() {
  const [location] = useLocation();
  const querySearch = useSearch();
  const { user } = useAuth();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetOrganisation({
    query: { queryKey: identityQueryKey(getGetOrganisationQueryKey(), user), enabled: !!user, staleTime: 15_000 },
  });
  const nodes = data?.nodes ?? [];
  const canManage = !!data?.can_manage;
  const {
    data: catalogs,
    isLoading: catalogsLoading,
    isError: catalogsError,
    error: catalogsLoadError,
    refetch: refetchCatalogs,
  } = useGetSalesCatalogs({
    query: {
      queryKey: [...identityQueryKey(getGetSalesCatalogsQueryKey(), user), user?.username ?? null],
      enabled: !!user && canManage,
      staleTime: 15_000,
    },
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editor, setEditor] = useState<OrganisationNode | 'new' | null>(null);
  const [initialCandidate, setInitialCandidate] = useState<OrganisationCandidate | undefined>(undefined);
  const [managerCandidate,setManagerCandidate]=useState<OrganisationCandidate|null>(null);
  const route = location.split('?')[0].replace(/\/+$/, '').split('/').at(-1) ?? 'dashboard';
  const isHierarchy = route === 'hierarchy';
  const requestedLevel = new URLSearchParams(querySearch).get('level') as SalesLevel | null;
  const level = LEVEL_ROUTES[route];
  const [selectedLevel, setSelectedLevel] = useState<SalesLevel | 'ALL'>('ALL');
  const displayLevel = isHierarchy ? selectedLevel === 'ALL' ? undefined : selectedLevel : level;
  const editorLevel = level ?? (selectedLevel !== 'ALL' ? selectedLevel : requestedLevel && LEVELS.includes(requestedLevel) ? requestedLevel : 'NATIONAL');
  const beginNew = () => {
    if (isHierarchy) setSelectedLevel(editorLevel);
    setInitialCandidate(undefined); setEditor('new');
  };
  const beginAdoption = (candidate: OrganisationCandidate) => {
    if (isHierarchy) setSelectedLevel(candidate.level);
    setInitialCandidate(candidate); setEditor('new');
  };
  const isAgents = route === 'agents';
  const isManagers = route === 'managers';
  const managerLink = '/admin/sales-structure/managers';
  const selectedNodeId = new URLSearchParams(querySearch).get('node_id');
  const counts = useMemo(() => LEVELS.map((item) => ({
    level: item,
    total: nodes.filter((node) => node.level === item).length,
    active: nodes.filter((node) => node.level === item && node.is_active).length,
  })), [nodes]);
  const rows = nodes.filter((node) => (!displayLevel || node.level === displayLevel)
    && (statusFilter === 'all' || (statusFilter === 'active' && node.is_active) || (statusFilter === 'inactive' && !node.is_active))
    && `${node.code} ${node.name} ${LEVEL_LABEL[node.level]} ${node.manager_name ?? ''} ${pathNames(node.path)}`.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.name.localeCompare(b.name));
  const pendingSources = isHierarchy && canManage
    ? (data?.candidates ?? []).filter(candidate => !nodes.some(node => node.code.trim().toUpperCase() === candidate.code.trim().toUpperCase()))
    : [];
  const levelPendingSources = pendingSources.filter(candidate => !displayLevel || candidate.level === displayLevel);
  const pendingRows = levelPendingSources.filter(candidate =>
    (statusFilter === 'all' || statusFilter === 'pending')
    && `${candidate.code} ${candidate.name} ${LEVEL_LABEL[candidate.level]} ${candidate.parent_code ?? ''} ${candidate.linked_national_name ?? ''} ${candidate.linked_manager_name ?? ''} ${candidate.branch_approved ? 'Approved for setup' : ''} Pending Setup`
      .toLowerCase().includes(search.toLowerCase().trim()));
  const tableRecords: Array<{ kind: 'node'; record: OrganisationNode } | { kind: 'pending'; record: OrganisationCandidate }> = [
    ...rows.map(record => ({ kind: 'node' as const, record })),
    ...pendingRows.map(record => ({ kind: 'pending' as const, record })),
  ].sort((a, b) => LEVELS.indexOf(a.record.level) - LEVELS.indexOf(b.record.level) || a.record.name.localeCompare(b.record.name));
  const pageTitle = isAgents ? 'Agent unit mapping'
    : isManagers ? 'Manager assignment'
      : isHierarchy ? 'Hierachy Setup'
        : level ? `${LEVEL_LABEL[level]} management`
        : 'Organisation hierarchy';
  const pageDescription = isAgents
    ? 'Initial mapping, controlled transfers and date-aware, server-scoped reporting for existing agent identities.'
    : isManagers
      ? 'Manager ownership follows reporting level. Account enrollment remains in the existing Manager Enrollment workflow.'
      : 'Maintain the live reporting line once. Imported organisations are matched in place; existing people and source identities are never duplicated.';

  return <div className="min-h-full bg-[#f2f6f3]">
    <header className="border-b border-[#d9e4dd] bg-card">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Administration</span><ChevronRight className="h-3 w-3" /><span>Organization structure-Medical</span></div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#19392e] sm:text-3xl">{pageTitle}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { void refetch(); }} disabled={isFetching} className="gap-2 bg-card"><RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />Refresh</Button>
          {canManage && !isAgents && !isManagers && <Button onClick={beginNew} className="gap-2 bg-[#1f5849] hover:bg-[#174536]"><Plus className="h-4 w-4" />Add entry</Button>}
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <nav aria-label="Organization structure pages" className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
        {[
          ['dashboard', 'Dashboard'], ['hierarchy', 'Hierachy Setup'],
          ['managers', 'Manager assignment'], ['agents', 'Agents'],
        ].map(([slug, label]) => <Link key={slug} href={`/admin/organisation/${slug}`} className={cn(
          'shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
          route === slug ? 'bg-[#e7f0e9] text-[#1f5849]' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}>{label}</Link>)}
      </nav>

      {!user && <div className="rounded-xl border bg-card p-5 text-sm">Sign in to view the organisation structure.</div>}
      {isError && <ErrorNotice error={error} retry={() => { void refetch(); }} />}
      {isLoading && <div className="space-y-4" aria-label="Loading organisation hierarchy">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-card" />)}</div>}
      {!isLoading && data && <>
        {!canManage && <div className="flex items-start gap-3 rounded-lg border border-[#d6e3da] bg-[#eaf2ec] px-4 py-3 text-sm text-[#385c4c]"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><p>Read-only reporting view. Structure setup, manager lists and mapping actions are available to administrators only.</p></div>}
        {editor && canManage && <NodeEditor
          key={editor === 'new' ? (initialCandidate ? `candidate-${initialCandidate.source_reference_id}` : 'new') : editor.id}
          node={editor === 'new' ? undefined : editor}
          nodes={nodes}
          candidates={data.candidates}
          managers={data.managers}
          managerUsers={data.manager_users}
          catalogSnapshot={catalogs}
          initialCandidate={initialCandidate}
          initialLevel={editorLevel}
          onLevelChange={isHierarchy ? setSelectedLevel : undefined}
          onCancel={() => { setEditor(null); setInitialCandidate(undefined); }}
          onRefresh={async () => {
            const refreshed = await refetch();
            if (editor !== 'new') {
              const current = refreshed.data?.nodes.find(entry => entry.id === editor.id);
              if (current) setEditor(current);
            }
            return refreshed;
          }}
          onSaved={async () => { setEditor(null); setInitialCandidate(undefined); await refetch(); }}
        />}

        {!isAgents && !isManagers && !isHierarchy && !level && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border bg-card p-4"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">Structure records</p><p className="mt-2 text-3xl font-semibold">{nodes.length}</p><p className="mt-1 text-xs text-muted-foreground">{nodes.filter((node) => node.is_active).length} active across all levels</p></div>
            {counts.map((item) => <Link key={item.level} href={`/admin/organisation/hierarchy?level=${item.level}`} className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-transform hover:-translate-y-0.5 hover:border-[#b8cec0]">
              <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{LEVEL_LABEL[item.level]} entries</p><p className="mt-2 text-3xl font-semibold">{item.active}</p><p className="mt-1 text-xs text-muted-foreground">{item.total - item.active} inactive</p></div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf2ec] text-[#28614f]"><IconForLevel level={item.level} /></span>
            </Link>)}
          </section>
          {canManage && <MedicalRecords
            snapshot={catalogs}
            isLoading={catalogsLoading}
            isError={catalogsError}
            error={catalogsLoadError}
            onRetry={() => { void refetchCatalogs(); }}
            nodes={nodes}
            candidates={data.candidates}
            onAdopt={(candidate) => { setInitialCandidate(candidate); setEditor('new'); }}
          />}
          <OrganisationTree nodes={nodes} canManage={canManage} userId={user?.id ?? 0} profileId={user?.profileId ?? 0} onEdit={setEditor} />
        </>}

        {isManagers && <section className="rounded-xl border bg-card p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-primary">Manager assignments</p><h2 className="mt-2 text-xl font-semibold">Keep enrollment separate from reporting ownership</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Node managers are assigned during structure creation or editing, and must match the node level. Manager accounts and eligibility are maintained in Manager Enrollment.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">{LEVELS.map((item) => <div key={item} className="rounded-lg border bg-muted/20 p-3"><span className="text-xs font-semibold">{LEVEL_LABEL[item]}</span><span className="float-right text-xs text-muted-foreground">{nodes.filter((node) => node.level === item && node.manager_id != null).length} assigned nodes</span></div>)}</div>
            </div>
            {canManage && <Button asChild className="gap-2 bg-[#1f5849] hover:bg-[#174536]"><Link href={managerLink}>Open Manager Enrollment<ArrowRight className="h-4 w-4" /></Link></Button>}
          </div>
          <div className="mt-5 overflow-x-auto rounded-lg border">
            {!nodes.length ? <div className="p-8 text-center text-sm text-muted-foreground">No organisation nodes are available in your reporting scope.</div> : <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Reporting node</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">Assigned manager</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
              <tbody>{nodes.slice().sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.name.localeCompare(b.name)).map((node) => <tr key={node.id} className="border-t">
                <td className="px-4 py-3"><b>{node.name}</b><div className="mt-1 text-[11px] text-muted-foreground">{pathNames(node.path)}</div></td><td className="px-4 py-3">{LEVEL_LABEL[node.level]}</td><td className="px-4 py-3">{node.manager_name || 'Not assigned'}</td><td className="px-4 py-3"><Badge variant="outline">{node.is_active ? 'Active' : 'Inactive'}</Badge></td><td className="px-4 py-3 text-right">{canManage && <Button size="sm" variant="outline" onClick={() => setEditor(node)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit node</Button>}</td>
              </tr>)}</tbody>
            </table>}
          </div>
          <div className="mt-4 rounded-lg border border-[#d6e3da] bg-[#f4f8f5] p-4 text-xs leading-5 text-[#4e685b]">Inactive organisations retain their manager assignment for reference; manager account activation and eligibility are separate controls.</div>
        </section>}

        {isAgents && <AgentMapping key={`${selectedNodeId ?? 'all'}:${user?.id ?? 'anonymous'}:${user?.profileId ?? 0}`} canManage={canManage} nodes={nodes} candidates={data.candidates} initialNodeId={selectedNodeId ? Number(selectedNodeId) : undefined} userId={user?.id ?? 0} profileId={user?.profileId ?? 0} />}

        {!isAgents && !isManagers && (isHierarchy || level) && <>
          {isHierarchy && <div className="max-w-sm space-y-1.5">
            <label htmlFor="hierarchy-level-filter" className="text-sm font-medium">Show hierarchy level</label>
            <SearchableSelect id="hierarchy-level-filter" value={selectedLevel} onValueChange={value => setSelectedLevel(value as SalesLevel | 'ALL')}
              disabled={!!editor} placeholder="All hierarchy levels"
              options={[{ value: 'ALL', label: 'All hierarchy levels' }, ...LEVELS.map(item => ({ value: item, label: LEVEL_LABEL[item] }))]} />
            {editor && <p className="text-xs text-muted-foreground">Change the level in the entry form, or close the form to use this filter.</p>}
          </div>}
          {levelPendingSources.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950" data-testid="pending-hierarchy-summary">
            <b>Uploaded records — Pending Setup</b>
            <p className="mt-1">{(['REGION', 'BRANCH', 'UNIT'] as const).filter(item => !displayLevel || item === displayLevel).map(item =>
              `${levelPendingSources.filter(candidate => candidate.level === item).length} ${item === 'REGION' ? 'Regions' : item === 'BRANCH' ? 'Branches' : 'Units'}`,
            ).join(' · ')}. Complete parent setup and required manager enrollments before using them for agent assignments.</p>
            <p className="mt-1 text-xs">Manager links and Branch setup approvals do not activate the hierarchy. Branch managers are optional; unresolved manager references remain pending.</p>
          </div>}
          {canManage && !isHierarchy && level !== 'NATIONAL' && <MedicalRecords
            snapshot={catalogs}
            isLoading={catalogsLoading}
            isError={catalogsError}
            error={catalogsLoadError}
            onRetry={() => { void refetchCatalogs(); }}
            nodes={nodes}
            candidates={data.candidates}
            level={level}
            onAdopt={beginAdoption}
          />}
          <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div><h2 className="font-semibold">{displayLevel ? `${LEVEL_LABEL[displayLevel]} records` : 'All hierarchy records'}</h2><p className="mt-1 text-xs text-muted-foreground">{tableRecords.length} displayed · {levelPendingSources.length} pending setup · {nodes.filter(node => node.is_active && (!displayLevel || node.level === displayLevel)).length} active entries</p></div>
            <div className="grid gap-2 sm:grid-cols-[minmax(200px,1fr)_155px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, level, code or manager" className="pl-9" /></div><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All statuses</option><option value="active">Active entries</option><option value="inactive">Inactive entries</option>{isHierarchy && canManage && <option value="pending">Pending Setup</option>}</select></div>
          </div>
          {!tableRecords.length ? <div className="px-5 py-14 text-center"><Network className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">{nodes.length || pendingSources.length ? 'No matching entries' : isHierarchy ? 'No hierarchy records yet' : 'No records at this level'}</h3><p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-muted-foreground">{nodes.length || pendingSources.length ? 'Adjust the level, search or status filter.' : 'Create a parent level before adding a new organisation record.'}</p>{canManage && <Button onClick={beginNew} className="mt-4 gap-2"><Plus className="h-4 w-4" />{isHierarchy ? 'Add entry' : `Add ${LEVEL_LABEL[level!]}`}</Button>}</div>
            : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-[#f6f8f6] text-left text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-5 py-3">Organisation</th><th className="px-5 py-3">Reports through</th><th className="px-5 py-3">Manager</th><th className="px-5 py-3">Coverage</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
              <tbody>{tableRecords.map((item) => {
                if (item.kind === 'pending') return <PendingHierarchyRow key={`source-${item.record.source_reference_id}`}
                  candidate={item.record} nodes={nodes} candidates={data.candidates}
                  onSetup={beginAdoption} onReassign={setManagerCandidate} />;
                const node = item.record;
                const parentInScope = node.parent_id == null ? undefined : nodes.find((item) => item.id === node.parent_id);
                const parentFromPath = node.path.length > 1 ? node.path[node.path.length - 2] : undefined;
                const parentName = parentInScope?.name ?? parentFromPath?.name ?? (node.level === 'NATIONAL' ? 'National root' : 'Parent outside reporting scope');
                return <tr key={node.id} className="border-t hover:bg-[#f7faf7]" data-testid={`row-organisation-node-${node.id}`}>
                  <td className="px-5 py-3.5"><b>{node.name}</b><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><span className="font-mono">{node.code}</span><span>·</span><span>{LEVEL_LABEL[node.level]}</span></div></td>
                  <td className="px-5 py-3.5">{parentName}{parentFromPath?.code && !parentInScope && <span className="ml-2 font-mono text-xs text-muted-foreground">{parentFromPath.code}</span>}</td>
                  <td className="px-5 py-3.5">{node.manager_name || <span className="text-amber-800">Manager not assigned</span>}</td>
                  <td className="px-5 py-3.5"><div className="flex flex-wrap gap-2 text-xs"><Badge variant="outline">{node.child_count} child{node.child_count === 1 ? '' : 'ren'}</Badge><Badge variant="outline">{node.agent_count} agents</Badge></div>{node.level === 'UNIT' && <Link href={`/admin/organisation/agents?node_id=${node.id}`} className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">View agents</Link>}</td>
                  <td className="px-5 py-3.5"><Badge variant="outline" className={node.is_active ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800' : 'text-muted-foreground'}>{node.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-5 py-3.5 text-right">{canManage && <div className="flex justify-end gap-2">
                    {node.level!=='NATIONAL'&&<Button size="sm" variant="outline" onClick={()=>{setInitialCandidate(undefined);if(isHierarchy)setSelectedLevel(node.level);setEditor(node);}}>Reassign manager</Button>}
                    <Button size="sm" variant="outline" onClick={() => { setInitialCandidate(undefined); if (isHierarchy) setSelectedLevel(node.level); setEditor(node); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                  </div>}</td>
                </tr>;
              })}</tbody></table></div>}
          <footer className="flex flex-col gap-2 border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Imported identities and organisations are reused, not copied.</span><Link href="/admin/organisation/agents" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Open agent mapping<ArrowRight className="h-3.5 w-3.5" /></Link></footer>
          </section>
          {canManage && isHierarchy && displayLevel !== 'NATIONAL' && <details className="rounded-xl border bg-card">
            <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">Imported organisational records</summary>
            <div className="max-h-[36rem] overflow-y-auto">
              <MedicalRecords snapshot={catalogs} isLoading={catalogsLoading} isError={catalogsError}
                error={catalogsLoadError} onRetry={() => { void refetchCatalogs(); }} nodes={nodes}
                candidates={data.candidates} showAllRecords level={displayLevel}
                onAdopt={beginAdoption} />
            </div>
          </details>}
        </>}
        {!canManage && <p className="text-center text-xs text-muted-foreground">Access follows your assigned reporting scope. This view contains no sales or commission metrics.</p>}
      </>}
      {data && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6e3da] bg-[#eaf2ec] px-4 py-3 text-xs text-[#456454]"><span className="flex items-center gap-2"><CircleHelp className="h-4 w-4" />Reporting hierarchy is maintained independently from manager account enrollment.</span>{canManage && <Link href={managerLink} className="font-semibold hover:underline">Manager Enrollment <ArrowRight className="inline h-3.5 w-3.5" /></Link>}</div>}
      {managerCandidate&&canManage&&<SourceManagerDialog candidate={managerCandidate} users={data?.manager_users??[]} onClose={()=>setManagerCandidate(null)}/>}
    </main>
  </div>;
}
