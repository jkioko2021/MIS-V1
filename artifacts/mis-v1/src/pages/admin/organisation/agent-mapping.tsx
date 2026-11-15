import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetIntermediaryQueryKey, getGetOrganisationAgentHistoryQueryKey, getGetOrganisationAgentsQueryKey,
  getGetOrganisationQueryKey, getGetSalesStructureQueryKey, getListIntermediariesQueryKey,
  useAssignOrganisationAgent, useGetOrganisationAgentHistory, useGetOrganisationAgents,
} from '@workspace/api-client-react';
import type {
  GetOrganisationAgentsParams, OrganisationAgent, OrganisationAssignment, OrganisationNode, OrganisationCandidate,
} from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine, ArrowLeft, ArrowRight, AlertCircle, Clock3, GitBranch, RefreshCw, Search, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { agentPath, ErrorNotice, errorMessage, identityQueryKey, INPUT_CLASS, pathNames, prettyDate } from './shared';
import { UnitOptions } from './unit-options';

function currentDay() {
  return new Date().toISOString().slice(0, 10);
}

function quoteCsvCell(value: string) {
  const safe = /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

function AssignmentHistory({ code, userId, profileId, close }: { code: string; userId: number; profileId: number; close: () => void }) {
  const { data, isLoading, isError, error, refetch } = useGetOrganisationAgentHistory(code, {
    query: { enabled: !!code && !!userId, queryKey: identityQueryKey(getGetOrganisationAgentHistoryQueryKey(code), { id: userId, profileId }) },
  });
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto p-5 sm:p-7">
      <DialogHeader className="border-b pb-4 text-left"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-primary">Audit trail</p><DialogTitle className="text-xl">Assignment history</DialogTitle><p className="font-mono text-xs text-muted-foreground">{code}</p></DialogHeader>
      {isLoading ? <div className="space-y-3 py-5">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-muted/60" />)}</div>
        : isError ? <ErrorNotice error={error} retry={() => { void refetch(); }} />
          : !data?.length ? <div className="py-14 text-center"><Clock3 className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No assignment events yet</h3><p className="mt-1 text-sm text-muted-foreground">Initial mapping and later transfers will appear here.</p></div>
            : <div className="relative space-y-0 py-5 before:absolute before:bottom-6 before:left-[15px] before:top-7 before:w-px before:bg-border">
              {data.map((event: OrganisationAssignment) => <article key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                <span className="z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-card text-primary"><GitBranch className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1 rounded-xl border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{event.from_unit ? 'Unit transfer' : 'Initial mapping'}</b><Badge variant="outline">{prettyDate(event.effective_date)}</Badge></div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">From {event.from_unit || 'Unmapped'} <ArrowRight className="inline h-3 w-3" /> {event.to_unit}</p><p className="mt-1 text-xs text-muted-foreground">{pathNames(event.hierarchy)}</p>
                  <p className="mt-3 text-sm leading-5">{event.reason}</p><div className="mt-3 border-t pt-2 text-[11px] text-muted-foreground">Approved by {event.approved_by} · {prettyDate(event.approved_at)}</div>
                </div>
              </article>)}
            </div>}
    </DialogContent>
  </Dialog>;
}

function TransferDialog({ agent, units, pendingUnits, onClose, onAssigned }: {
  agent: OrganisationAgent;
  units: OrganisationNode[];
  pendingUnits: OrganisationCandidate[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const client = useQueryClient();
  const assign = useAssignOrganisationAgent();
  const [unitId, setUnitId] = useState('');
  const [date, setDate] = useState(currentDay());
  const [reason, setReason] = useState('');
  const destination = units.find((unit) => unit.id === Number(unitId) && unit.available && unit.is_active && unit.id !== agent.unit_id);
  const save = () => {
    if (!destination || !agent.unit_id || !reason.trim() || !date || date > currentDay()) return;
    if (!window.confirm(`Confirm transfer for ${agent.agent_name} (${agent.agent_code})?\n\nFrom: ${agentPath(agent)}\nTo: ${pathNames(destination.path)}\nEffective: ${date}\nReason: ${reason.trim()}`)) return;
    assign.mutate({ code: agent.agent_code, data: { unit_id: destination.id, version: agent.version, effective_date: date, reason: reason.trim() } }, {
      onSuccess: async () => {
        await invalidateAssignment(client, agent.agent_code);
        onAssigned();
      },
    });
  };
  return <Modal title="Move agent to another Unit" eyebrow="Controlled transfer" onClose={onClose}>
    <div className="my-4 rounded-lg border bg-muted/30 p-3 text-sm"><b>{agent.agent_name}</b><span className="ml-2 font-mono text-xs text-muted-foreground">{agent.agent_code}</span><p className="mt-2 text-xs text-muted-foreground">Current: {agentPath(agent)}</p></div>
    <div className="space-y-4">
      <label className="block space-y-1.5"><span className="text-sm font-medium">Destination Unit <span className="text-destructive">*</span></span><select className={INPUT_CLASS} value={unitId} onChange={(event) => setUnitId(event.target.value)}><option value="">Select an available Unit</option><UnitOptions units={units.filter(unit=>unit.id!==agent.unit_id)} pending={pendingUnits}/></select></label>
      {destination && <div className="rounded-lg border border-[#cbd9d1] bg-[#f4f8f5] p-3 text-xs"><span className="font-semibold">New reporting path</span><p className="mt-1">{pathNames(destination.path)}</p></div>}
      <label className="block space-y-1.5"><span className="text-sm font-medium">Effective date <span className="text-destructive">*</span></span><Input type="date" value={date} max={currentDay()} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="block space-y-1.5"><span className="text-sm font-medium">Reason for transfer <span className="text-destructive">*</span></span><textarea className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm" value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} placeholder="Record the operational reason. This becomes part of assignment history." /></label>
    </div>
    {assign.error && <Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Transfer not saved</AlertTitle><AlertDescription>{errorMessage(assign.error)}</AlertDescription></Alert>}
    <div className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!destination || !agent.unit_id || !reason.trim() || date > currentDay() || assign.isPending} className="gap-2">{assign.isPending ? 'Saving transfer…' : 'Review & confirm transfer'}<ArrowRight className="h-4 w-4" /></Button></div>
    <p className="mt-3 text-[11px] text-muted-foreground">Approval identity and approval timestamp are recorded by the server.</p>
  </Modal>;
}

function InitialMappingDialog({ agent, units, pendingUnits, onClose, onAssigned }: {
  agent: OrganisationAgent;
  units: OrganisationNode[];
  pendingUnits: OrganisationCandidate[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const client = useQueryClient();
  const assign = useAssignOrganisationAgent();
  const [unitId, setUnitId] = useState('');
  const [date, setDate] = useState(currentDay());
  const [reason, setReason] = useState('');
  const destination = units.find((unit) => unit.id === Number(unitId) && unit.available && unit.is_active);
  const save = () => {
    if (!destination || !reason.trim() || !date || date > currentDay()) return;
    if (!window.confirm(`Assign ${agent.agent_name} (${agent.agent_code}) to ${pathNames(destination.path)} effective ${date}?\n\nReason: ${reason.trim()}`)) return;
    assign.mutate({ code: agent.agent_code, data: { unit_id: destination.id, version: agent.version, effective_date: date, reason: reason.trim() } }, {
      onSuccess: async () => {
        await invalidateAssignment(client, agent.agent_code);
        onAssigned();
      },
    });
  };
  return <Modal title={agent.agent_name} eyebrow="Initial mapping" onClose={onClose}>
    <p className="my-3 text-xs text-muted-foreground">Link this existing imported identity to an available Unit. No duplicate agent or organisation record is created.</p>
    <div className="space-y-3">
      <label className="block space-y-1.5"><span className="text-sm font-medium">Available Unit <span className="text-destructive">*</span></span><select className={INPUT_CLASS} value={unitId} onChange={(event) => setUnitId(event.target.value)}><option value="">Choose Unit</option><UnitOptions units={units} pending={pendingUnits}/></select></label>
      {!!pendingUnits.length&&<p className="text-xs text-muted-foreground">Pending Unit names are listed for reference. Complete and activate their hierarchy before assigning agents.</p>}
      {destination && <p className="rounded-lg border bg-[#f4f8f5] p-3 text-xs">{pathNames(destination.path)}</p>}
      <label className="block space-y-1.5"><span className="text-sm font-medium">Effective date <span className="text-destructive">*</span></span><Input type="date" value={date} max={currentDay()} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="block space-y-1.5"><span className="text-sm font-medium">Reason <span className="text-destructive">*</span></span><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} /></label>
    </div>
    {assign.error && <Alert variant="destructive" className="mt-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{errorMessage(assign.error)}</AlertDescription></Alert>}
    <div className="mt-4 flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!destination || !reason.trim() || date > currentDay() || assign.isPending}>{assign.isPending ? 'Saving…' : 'Confirm initial mapping'}</Button></div>
    <p className="mt-3 text-[11px] text-muted-foreground">The server records approver and timestamp.</p>
  </Modal>;
}

function Modal({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: ReactNode; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[94dvh] max-w-xl overflow-y-auto p-5 sm:p-6">
      <DialogHeader className="text-left"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-primary">{eyebrow}</p><DialogTitle className="text-xl">{title}</DialogTitle></DialogHeader>
      {children}
    </DialogContent>
  </Dialog>;
}

async function invalidateAssignment(client: ReturnType<typeof useQueryClient>, code: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: getGetOrganisationAgentsQueryKey() }),
    client.invalidateQueries({ queryKey: getGetOrganisationAgentHistoryQueryKey(code) }),
    client.invalidateQueries({ queryKey: getGetIntermediaryQueryKey(code) }),
    client.invalidateQueries({ queryKey: getListIntermediariesQueryKey() }),
    client.invalidateQueries({ queryKey: getGetOrganisationQueryKey() }),
    client.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
  ]);
}

export function AgentMapping({ canManage, nodes, candidates=[], initialNodeId, userId, profileId }: { canManage: boolean; nodes: OrganisationNode[]; candidates?:OrganisationCandidate[]; initialNodeId?: number; userId: number; profileId: number }) {
  const [search, setSearch] = useState('');
  const [nodeId, setNodeId] = useState(initialNodeId ? String(initialNodeId) : '');
  const [unmapped, setUnmapped] = useState(false);
  const [asOf, setAsOf] = useState('');
  const [page, setPage] = useState(1);
  const [historyCode, setHistoryCode] = useState('');
  const [transferAgent, setTransferAgent] = useState<OrganisationAgent | null>(null);
  const [initialAgent, setInitialAgent] = useState<OrganisationAgent | null>(null);
  const client = useQueryClient();
  const params = useMemo<GetOrganisationAgentsParams>(() => ({
    search: search.trim() || undefined,
    node_id: nodeId ? Number(nodeId) : undefined,
    unmapped: canManage && unmapped ? true : undefined,
    as_of: asOf || undefined,
    page,
  }), [search, nodeId, canManage, unmapped, asOf, page]);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetOrganisationAgents(params, {
    query: { queryKey: identityQueryKey(getGetOrganisationAgentsQueryKey(params), { id: userId, profileId }), enabled: !!userId },
  });
  const assign = useAssignOrganisationAgent();
  const unitChoices = nodes.filter((node) => node.level === 'UNIT');
  const pendingUnits = canManage ? candidates.filter(candidate=>candidate.level==='UNIT') : [];
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 50)));
  const downloadCsv = () => {
    if (!items.length) return;
    const rows: string[][] = [
      ['Agent code', 'Agent name', 'Current status', 'National', 'Region', 'Branch', 'Unit', 'Legacy unit code'],
      ...items.map((agent) => [
        agent.agent_code, agent.agent_name, agent.agent_status ?? '',
        ...(['NATIONAL', 'REGION', 'BRANCH', 'UNIT'] as const).map((level) => agent.hierarchy.find((part) => part.level === level)?.name ?? ''),
        agent.legacy_unit_code ?? '',
      ]),
    ];
    const csv = rows.map((row) => row.map(quoteCsvCell).join(',')).join('\r\n');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `organisation-agents-${asOf ? `as-of-${asOf}` : 'current'}-page-${data?.page ?? page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <section className="space-y-4">
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-primary">Scoped reporting</p><h2 className="mt-1 text-lg font-semibold">Agent unit mapping</h2><p className="mt-1 text-sm text-muted-foreground">Search and drill into an existing reporting line. Only the server-scoped agent list is shown.</p></div>
        <Button variant="outline" size="sm" onClick={downloadCsv} disabled={!items.length} className="gap-2"><ArrowDownToLine className="h-4 w-4" />Download current page CSV</Button>
      </div>
      <p className="mb-4 rounded-md bg-[#eef4f0] px-3 py-2 text-xs text-[#3d5b4f]">Export includes only the current page ({items.length} rows) with active filters. Assignment hierarchy follows {asOf ? `the ${asOf} as-of date` : 'current assignments'}; agent status is always current.</p>
      {!!pendingUnits.length&&<p className="mb-4 text-xs text-muted-foreground">{pendingUnits.length} imported Unit names are listed as Pending Setup. Complete their parent hierarchy and manager enrollment before assigning agents.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_160px_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search agent name or code" className="pl-9" data-testid="input-agent-search" /></div>
        <select aria-label="Filter by any hierarchy level" className={INPUT_CLASS} value={nodeId} onChange={(event) => { setNodeId(event.target.value); setPage(1); }}>
          <option value="">All accessible organisation levels</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.level[0] + node.level.slice(1).toLowerCase()} · {pathNames(node.path)}</option>)}
          <UnitOptions units={[]} pending={pendingUnits}/>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-xs"><span className="shrink-0">As of</span><input type="date" value={asOf} onChange={(event) => { setAsOf(event.target.value); setPage(1); }} className="min-w-0 bg-transparent text-xs" /></label>
        <Button variant="outline" onClick={() => { setSearch(''); setNodeId(''); setAsOf(''); setUnmapped(false); setPage(1); }} disabled={isFetching}>Reset filters</Button>
      </div>
      {canManage && <label className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={unmapped} onChange={(event) => { setUnmapped(event.target.checked); setPage(1); }} className="mt-0.5 accent-[#28614f]" />Show only unmapped agents (administrator access)</label>}
    </div>
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3"><div><h3 className="font-semibold">Mapped identities</h3><p className="text-xs text-muted-foreground">{data ? `${data.total.toLocaleString()} matching agents` : 'Loading scoped results'}</p></div><Button variant="ghost" size="sm" onClick={() => { void refetch(); }} disabled={isFetching} className="gap-2"><RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />Refresh</Button></div>
      {isError ? <ErrorNotice error={error} retry={() => { void refetch(); }} /> : isLoading ? <div className="space-y-3 p-4">{[1, 2, 3, 4].map((i) => <div className="h-16 animate-pulse rounded-md bg-muted/60" key={i} />)}</div>
        : !items.length ? <div className="px-5 py-14 text-center"><UsersRound className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">No agents in this view</h3><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{unmapped ? 'All visible agents are mapped, or no unmapped identities match these filters.' : 'Try a wider search or choose a different hierarchy scope. Unmapped identities are not silently assigned.'}</p></div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[#f6f8f6] text-left text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-4 py-3">Agent</th><th className="px-4 py-3">Reporting path {asOf && <span className="normal-case tracking-normal">(as of {asOf})</span>}</th><th className="px-4 py-3">Current status</th><th className="px-4 py-3">Unit mapping</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody>{items.map((agent) => <tr key={agent.agent_code} className="border-t hover:bg-[#f7faf7]" data-testid={`row-organisation-agent-${agent.agent_code}`}>
              <td className="px-4 py-3"><b>{agent.agent_name}</b><div className="mt-1 font-mono text-xs text-muted-foreground">{agent.agent_code}</div></td>
              <td className="max-w-[360px] px-4 py-3"><p className="leading-5">{agentPath(agent)}</p>{agent.legacy_unit_code && <p className="mt-1 text-[11px] text-muted-foreground">Imported legacy unit code: {agent.legacy_unit_code}</p>}</td>
              <td className="px-4 py-3"><Badge variant="outline" className="font-normal">{agent.agent_status || 'Status unavailable'}</Badge></td>
              <td className="px-4 py-3">{agent.unit_id ? <span className="text-xs">{agent.hierarchy.at(-1)?.name ?? 'Assigned'}</span> : <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">Unmapped</Badge>}</td>
              <td className="px-4 py-3"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setHistoryCode(agent.agent_code)} className="gap-1.5"><Clock3 className="h-3.5 w-3.5" />History</Button>{canManage && <Button size="sm" onClick={() => agent.unit_id ? setTransferAgent(agent) : setInitialAgent(agent)} className="gap-1.5">{agent.unit_id ? 'Transfer' : 'Assign Unit'}<ArrowRight className="h-3.5 w-3.5" /></Button>}</div></td>
            </tr>)}</tbody>
          </table></div>}
      <footer className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Page {data?.page ?? page} of {totalPages} · {data?.page_size ?? 50} records per page</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft className="mr-1 h-3.5 w-3.5" />Previous</Button><Button variant="outline" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
      </footer>
    </section>
    {initialAgent && canManage && <InitialMappingDialog agent={initialAgent} units={unitChoices} pendingUnits={pendingUnits} onClose={() => setInitialAgent(null)} onAssigned={() => setInitialAgent(null)} />}
    {transferAgent && canManage && <TransferDialog agent={transferAgent} units={unitChoices} pendingUnits={pendingUnits} onClose={() => setTransferAgent(null)} onAssigned={() => setTransferAgent(null)} />}
    {historyCode && <AssignmentHistory code={historyCode} userId={userId} profileId={profileId} close={() => setHistoryCode('')} />}
  </section>;
}
