import { useState } from 'react';
import { Link } from 'wouter';
import { useGetOrganisationAgents, getGetOrganisationAgentsQueryKey } from '@workspace/api-client-react';
import type { OrganisationNode } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ChevronRight, GitBranch, Layers3, Pencil, ShieldCheck, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorNotice, identityQueryKey, pathNames } from './shared';

function iconFor(node: OrganisationNode) {
  if (node.level === 'NATIONAL') return ShieldCheck;
  if (node.level === 'REGION') return GitBranch;
  if (node.level === 'BRANCH') return Building2;
  return Layers3;
}

function UnitAgentPreview({ node, userId, profileId }: { node: OrganisationNode; userId: number; profileId: number }) {
  const params = { node_id: node.id, page: 1 };
  const { data, isLoading, isError, error, refetch } = useGetOrganisationAgents(params, {
    query: { queryKey: identityQueryKey(getGetOrganisationAgentsQueryKey(params), { id: userId, profileId }), enabled: !!userId },
  });
  if (isLoading) return <div className="ml-5 mt-2 space-y-2 border-l-2 border-[#cbd9d1] pl-4"><div className="h-5 w-3/4 animate-pulse rounded bg-muted" /><div className="h-5 w-2/3 animate-pulse rounded bg-muted" /></div>;
  if (isError) return <div className="ml-5 mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"><ErrorNotice error={error} retry={() => { void refetch(); }} /></div>;
  if (!data?.items.length) return <p className="ml-5 mt-2 rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">No agents are currently assigned to this Unit.</p>;
  return <div className="ml-5 mt-2 border-l-2 border-[#cbd9d1] pl-4">
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{data.total} scoped agent{data.total === 1 ? '' : 's'}</p>
    <ul className="space-y-1">
      {data.items.map((agent) => <li key={agent.agent_code} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/20 px-3 py-2 text-xs">
        <span><b>{agent.agent_name}</b><span className="ml-2 font-mono text-muted-foreground">{agent.agent_code}</span></span>
        <span className="text-muted-foreground">{agent.agent_status || 'Status unavailable'}</span>
      </li>)}
    </ul>
    {data.total > data.items.length && <p className="mt-2 text-[11px] text-muted-foreground">Showing first {data.items.length} agents. Open the scoped list for pagination and filters.</p>}
  </div>;
}

function TreeNode({ node, nodes, canManage, userId, profileId, onEdit }: {
  node: OrganisationNode;
  nodes: OrganisationNode[];
  canManage: boolean;
  userId: number;
  profileId: number;
  onEdit: (node: OrganisationNode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconFor(node);
  const children = nodes.filter((child) => child.parent_id === node.id).sort((a, b) => a.name.localeCompare(b.name));
  const expandable = node.level === 'UNIT' || children.length > 0;
  return <li className="relative">
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        {expandable ? <button type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.name}`} onClick={() => setExpanded((value) => !value)} className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eaf2ec] text-[#28614f] hover:bg-[#dcebe0]">
          <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
        </button> : <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eaf2ec] text-[#28614f]"><Icon className="h-4 w-4" /></span>}
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b className="truncate text-sm">{node.name}</b><Badge variant="outline" className="font-mono text-[10px]">{node.code}</Badge><Badge variant="outline" className={node.is_active ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800' : 'text-muted-foreground'}>{node.is_active ? 'Active' : 'Inactive'}</Badge></div>
          <p className="mt-1 text-xs text-muted-foreground">{node.level[0] + node.level.slice(1).toLowerCase()} · {node.manager_name || 'Manager not assigned'}</p>
          {node.path.length > 1 && <p className="mt-1 truncate text-[11px] text-muted-foreground">{pathNames(node.path.slice(0, -1))}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
        {node.level !== 'UNIT' && <Badge variant="outline" className="text-xs">{node.child_count} child{node.child_count === 1 ? '' : 'ren'}</Badge>}
        {node.level === 'UNIT' && <Badge variant="outline" className="text-xs">{node.agent_count} agent{node.agent_count === 1 ? '' : 's'}</Badge>}
        {node.level === 'UNIT' && <Button asChild variant="outline" size="sm"><Link href={`/admin/organisation/agents?node_id=${node.id}`}>View agents</Link></Button>}
        {canManage && <Button variant="outline" size="sm" onClick={() => onEdit(node)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</Button>}
      </div>
    </div>
    {expanded && <div className="ml-4 mt-2 border-l-2 border-[#cbd9d1] pl-3 sm:ml-7 sm:pl-5">
      {children.length > 0 && <ul className="space-y-2">{children.map((child) => <TreeNode key={child.id} node={child} nodes={nodes} canManage={canManage} userId={userId} profileId={profileId} onEdit={onEdit} />)}</ul>}
      {node.level === 'UNIT' && <UnitAgentPreview node={node} userId={userId} profileId={profileId} />}
      {node.level !== 'UNIT' && children.length === 0 && <p className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">No child organisations in this reporting scope.</p>}
    </div>}
  </li>;
}

export function OrganisationTree({ nodes, canManage, userId, profileId, onEdit }: {
  nodes: OrganisationNode[];
  canManage: boolean;
  userId: number;
  profileId: number;
  onEdit: (node: OrganisationNode) => void;
}) {
  const roots = nodes.filter((node) => node.parent_id == null || !nodes.some((candidate) => candidate.id === node.parent_id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-primary">Live reporting line</p><h2 className="mt-1 text-lg font-semibold">National → Region → Branch → Unit → Agent</h2><p className="mt-1 text-xs text-muted-foreground">Expand a Unit to view scoped agent names; reporting paths come from the server snapshot.</p></div>
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><UsersRound className="h-4 w-4" />No sales or commission metrics</span></div>
    {!roots.length ? <div className="rounded-lg border border-dashed px-5 py-12 text-center"><GitBranch className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No hierarchy in this reporting scope</h3><p className="mt-1 text-sm text-muted-foreground">The API may return a manager’s subtree rather than the complete national structure.</p></div>
      : <ul className="space-y-3">{roots.map((node) => <TreeNode key={node.id} node={node} nodes={nodes} canManage={canManage} userId={userId} profileId={profileId} onEdit={onEdit} />)}</ul>}
  </section>;
}
