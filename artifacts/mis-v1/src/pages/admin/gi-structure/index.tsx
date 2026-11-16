import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownRight, ArrowRight, Building2, Check, ChevronRight, CircleHelp, Clock3,
  GitBranch, History, Network, Pencil, Plus, RefreshCw, Search,
  ShieldCheck, Unlink, UsersRound, Workflow,
} from 'lucide-react';
import {
  getGetGiStructureHistoryQueryKey, getGetGiStructureQueryKey, useGetGiStructure,
  useGetGiStructureHistory, useRemoveGiMedicalMapping,
  useSaveGiMedicalMappings, useSaveGiStructureNode,
} from '@workspace/api-client-react';
import type {
  GiLevel, GiManager, GiMedicalUnit, GiNode, GiNodeInput, GiStructureSnapshot,
} from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { identityQueryKey, errorMessage } from '../organisation/shared';
import { ManagerForm } from './manager-form';
import { NodeStatusAction } from './node-status-action';
import { LinkedMedicalUnits, NodeViewAction } from './node-view-action';

type View = 'dashboard' | 'hierarchy' | 'managers' | 'medical-units';
const views: Array<{ id: View; label: string; icon: typeof Network }> = [
  { id: 'dashboard', label: 'Overview', icon: Network },
  { id: 'hierarchy', label: 'Branch & Unit setup', icon: GitBranch },
  { id: 'managers', label: 'GI Manager Enrollment', icon: UsersRound },
  { id: 'medical-units', label: 'Medical Unit mapping', icon: Workflow },
];
const levelLabel = (level: GiLevel) => level === 'BRANCH' ? 'Branch' : 'Unit';
const statusLabel = (status: GiNode['status']) => status === 'PENDING' ? 'Pending setup' : status === 'ACTIVE' ? 'Active' : 'Inactive';
const dateLabel = (value?: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
  : '—';
function StatusPill({ status, available }: { status: GiNode['status']; available?: boolean }) {
  const classes = status === 'ACTIVE'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : status === 'PENDING'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-slate-100 text-slate-600';
  return <Badge variant="outline" className={cn('font-medium', classes)}>{available === false ? 'Setup only' : statusLabel(status)}</Badge>;
}

function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' | 'success' }) {
  const color = tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-[#d6e3da] bg-[#eaf2ec] text-[#385c4c]';
  return <div className={cn('rounded-lg border px-4 py-3 text-sm leading-6', color)}>{children}</div>;
}

function HistoryList({ entityType, entityKey, identity }: { entityType: 'NODE' | 'MANAGER' | 'MAPPING'; entityKey: string; identity: readonly unknown[] }) {
  const [open, setOpen] = useState(false);
  const params = { entity_type: entityType, entity_key: entityKey };
  const queryKey = [...getGetGiStructureHistoryQueryKey(params), ...identity] as const;
  const { data, isLoading, isError, error, refetch } = useGetGiStructureHistory(params, {
    query: { queryKey, enabled: !!entityKey && open },
  });
  return <details className="group rounded-lg border bg-card" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium">
      <History className="h-4 w-4 text-primary" />Change history <span className="text-xs font-normal text-muted-foreground">Latest 100</span>
      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-open:rotate-90" />
    </summary>
    <div className="border-t p-4">
      {isLoading ? <div className="space-y-2">{[0, 1].map(i => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>
        : isError ? <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-destructive"><span>{errorMessage(error)}</span><Button size="sm" variant="outline" onClick={() => { void refetch(); }}>Retry</Button></div>
          : !data?.length ? <p className="text-sm text-muted-foreground">No recorded changes yet.</p>
            : <ol className="space-y-4">{data.map(event => <li key={event.id} className="border-l-2 border-[#b9d0c1] pl-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{event.actor}</b><time className="text-xs text-muted-foreground">{dateLabel(event.created_at)}</time></div>
              <p className="mt-1 text-sm text-foreground">{event.reason}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {event.before_details && <DetailPreview title="Before" value={event.before_details} />}
                <DetailPreview title="After" value={event.after_details} />
              </div>
            </li>)}</ol>}
    </div>
  </details>;
}

function DetailPreview({ title, value }: { title: string; value: string }) {
  let text = value;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    text = Object.entries(parsed)
      .filter(([key]) => !['id', 'version', 'employee_id', 'manager_id', 'parent_id', 'gi_unit_id'].includes(key))
      .map(([key, item]) => `${key.replaceAll('_', ' ')}: ${typeof item === 'object' ? JSON.stringify(item) : String(item ?? '—')}`)
      .join(' · ') || value;
  } catch { /* Historical text can be shown as supplied. */ }
  return <div className="rounded-md bg-muted/50 p-2.5"><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span><p className="mt-1 break-words text-xs leading-5">{text}</p></div>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block min-w-0 space-y-1.5"><span className="text-sm font-medium text-foreground">{label}</span>{children}{hint && <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>}</label>;
}

function Overlay({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-[#142b25]/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="gi-dialog-title" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#d9e4dd] bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
      <header className="sticky top-0 z-10 border-b bg-card/95 px-5 py-4 backdrop-blur sm:px-7"><div className="flex items-start justify-between gap-4"><div><h2 id="gi-dialog-title" className="text-xl font-semibold text-[#19392e]">{title}</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></div><Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">Close</Button></div></header>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  </div>;
}

function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Field label="Reason for change" hint="Required for the audit trail (at least 3 characters).">
    <Textarea value={value} onChange={event => onChange(event.target.value)} maxLength={1000} rows={3} placeholder="Explain why this setup is being changed" data-testid="input-gi-change-reason" />
  </Field>;
}

function NodeForm({ node, snapshot, onDone, onCancel }: { node?: GiNode; snapshot: GiStructureSnapshot; onDone: () => void; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const saveNode = useSaveGiStructureNode();
  const [level, setLevel] = useState<GiLevel>(node?.level ?? 'BRANCH');
  const [name, setName] = useState(node?.name ?? '');
  const [code, setCode] = useState(node?.code ?? '');
  const status = node?.status ?? 'PENDING';
  const [parent, setParent] = useState(node?.parent_id == null ? '' : String(node.parent_id));
  const [manager, setManager] = useState(node?.manager_id == null ? '' : String(node.manager_id));
  const [reason, setReason] = useState('');
  const branches = snapshot.nodes.filter(item => item.level === 'BRANCH' && item.id !== node?.id);
  const managerOptions = [{value:'',label:'No manager assigned',description:'Optional for a Branch; required for an active Unit',disabled:status==='ACTIVE'&&level==='UNIT'}, ...snapshot.managers.filter(item => item.level === level || !item.is_active)
    .map(item => ({
      value: String(item.id),
      label: `${item.employee_name}${item.email ? ` · ${item.email}` : ''}`,
      description: `${item.level === 'BRANCH' ? 'Branch Coordinator' : 'Unit Manager'} · ${snapshot.nodes.filter(unit=>unit.level==='UNIT'&&(unit.code===item.details.GI_UNIT_CODE||item.source_unit_codes?.includes(unit.code))).map(unit=>unit.name).join(', ')} · ${item.is_active ? 'Enrolled' : 'Inactive enrollment'}${item.user_eligible ? '' : ' · designation not currently eligible'}`,
      disabled: item.level !== level || (status === 'ACTIVE' && (!item.is_active || !item.user_eligible)),
    }))];
  const parentOptions = [{value:'',label:'No parent assigned',description:'Pending setup only',disabled:status==='ACTIVE'},...branches.map(item => ({ value: String(item.id), label: item.name, description: `${item.status === 'PENDING' ? 'Pending setup' : item.status.toLowerCase()} branch`, disabled: item.status === 'INACTIVE'&&item.id!==node?.parent_id }))];
  const parentMissing = status === 'ACTIVE' && level === 'UNIT' && !parent;
  const selectedParent = branches.find(item => String(item.id) === parent);
  const selectedManager = snapshot.managers.find(item => String(item.id) === manager);
  const operationalIssue = status === 'ACTIVE' && level === 'UNIT'
    && (!selectedParent?.available || !selectedManager?.is_active || !selectedManager?.user_eligible || selectedManager.level !== 'UNIT');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 3 || name.trim().length === 0 || code.trim().length === 0) return;
    if (status === 'ACTIVE' && level === 'UNIT' && !parent) return;
    try {
      await saveNode.mutateAsync({ data: {
        id: node?.id ?? null, version: node?.version ?? 0, code: node?.code ?? code.trim(),
        name: name.trim(), level: node?.level ?? level, status,
        parent_id: level === 'UNIT' && parent ? Number(parent) : null,
        manager_id: manager ? Number(manager) : null, reason: reason.trim(),
      } satisfies GiNodeInput });
      await queryClient.invalidateQueries({ queryKey: getGetGiStructureQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ['/api/gi-structure/history'] });
      toast({ title: 'GI structure saved', description: `${levelLabel(level)} changes were recorded.` });
      onDone();
    } catch (error) { toast({ title: 'Could not save structure', description: errorMessage(error), variant: 'destructive' }); }
  };
  return <Overlay title={node ? `Edit ${levelLabel(node.level)}` : 'Add a GI structure entry'} description="Keep one accountable Branch → Unit reporting line. Existing source identities remain in place." onClose={onCancel}>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Level"><select disabled={!!node} value={level} onChange={event => { setLevel(event.target.value as GiLevel); setParent(''); setManager(''); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="BRANCH">Branch</option><option value="UNIT">Unit</option></select></Field>
        <Field label="Code" hint={node ? 'Imported codes are fixed.' : 'Use the assigned organisational code.'}><Input value={code} disabled={!!node} onChange={event => setCode(event.target.value)} maxLength={50} required /></Field>
        <Field label="Name"><Input value={name} onChange={event => setName(event.target.value)} maxLength={150} required /></Field>
        {level === 'UNIT' && <Field label="Parent Branch" hint="Pending Branches may be linked for setup, but cannot support operational activation.">
          <SearchableSelect id="gi-parent-branch" value={parent} options={parentOptions} onValueChange={setParent} placeholder="Choose a Branch" searchPlaceholder="Find a Branch…" emptyMessage="No Branches found." />
        </Field>}
        <Field label={level === 'BRANCH' ? 'Branch Coordinator' : 'Unit Manager'} hint="Enrollment is a separate record; this link does not change a login account.">
          <SearchableSelect id="gi-node-manager" value={manager} options={managerOptions} onValueChange={setManager} placeholder="No manager assigned" searchPlaceholder="Search enrolled managers…" emptyMessage="No eligible manager enrollment." />
        </Field>
      </div>
      <Notice>{node ? 'Editing preserves the current status. Use Activate or Deactivate in Branch & Unit setup to change availability.' : 'New entries are saved as Pending setup. Activate them separately after completing setup.'}</Notice>
      {status === 'ACTIVE' && level === 'UNIT' && <Notice tone={operationalIssue ? 'warning' : 'success'}>{operationalIssue ? 'This Unit cannot operate yet. Choose an available active Branch and an active Unit Manager.' : 'An active Unit must have an active Branch and an active Unit Manager.'}</Notice>}
      {node?.source_reference_id != null && <Notice>Imported from the existing source register. Source matching and original parent references are preserved.</Notice>}
      {node?.manager_id == null && node?.manager_name && <Notice tone="warning">Imported manager reference: {node.manager_name}. This reference is read-only and will not be auto-enrolled or matched to an account.</Notice>}
      <ReasonField value={reason} onChange={setReason} />
      {saveNode.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(saveNode.error)}</p>}
      <div className="flex flex-col-reverse justify-end gap-2 border-t pt-4 sm:flex-row"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saveNode.isPending || reason.trim().length < 3 || !name.trim() || !code.trim() || parentMissing || operationalIssue} className="gap-2"><Check className="h-4 w-4" />{saveNode.isPending ? 'Saving…' : 'Save changes'}</Button></div>
    </form>
  </Overlay>;
}

function MappingWorkspace({ snapshot, identity }: { snapshot: GiStructureSnapshot; identity: readonly unknown[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const saveMappings = useSaveGiMedicalMappings();
  const removeMapping = useRemoveGiMedicalMapping();
  const [selectedGi, setSelectedGi] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState<GiMedicalUnit[] | null>(null);
  const [removeTarget, setRemoveTarget] = useState<GiMedicalUnit | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const giUnits = snapshot.nodes.filter(node => node.level === 'UNIT' && node.status !== 'INACTIVE');
  const target = giUnits.find(item => String(item.id) === selectedGi);
  const filteredUnits = snapshot.medical_units.filter(item => `${item.name} ${item.branch_name ?? ''} ${item.code}`.toLowerCase().includes(search.trim().toLowerCase()));
  const mappings = snapshot.medical_units.filter(unit => unit.gi_unit_id != null);
  const toggle = (code: string) => setSelectedUnits(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);
  const requestSave = () => {
    const records = snapshot.medical_units.filter(unit => selectedUnits.includes(unit.code));
    const changed = records.filter(unit => unit.gi_unit_id != null && unit.gi_unit_id !== Number(selectedGi));
    if (changed.length) setConfirmation(records);
    else void persistMappings(records);
  };
  const persistMappings = async (records: GiMedicalUnit[]) => {
    if (!target || !reason.trim() || !records.length) return;
    try {
      await saveMappings.mutateAsync({ data: { gi_unit_id: target.id, units: records.map(unit => ({ medical_unit_code: unit.code, version: unit.mapping_version })), reason: reason.trim() } });
      await queryClient.invalidateQueries({ queryKey: getGetGiStructureQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ['/api/gi-structure/history'] });
      toast({ title: 'Medical Unit mappings saved', description: `${records.length} Medical Unit${records.length === 1 ? '' : 's'} linked to ${target.name}.` });
      setSelectedUnits([]); setReason(''); setConfirmation(null);
    } catch (error) { toast({ title: 'Could not save mappings', description: errorMessage(error), variant: 'destructive' }); }
  };
  const submitRemove = async () => {
    if (!removeTarget || removeReason.trim().length < 3) return;
    try {
      await removeMapping.mutateAsync({ data: { medical_unit_code: removeTarget.code, version: removeTarget.mapping_version, reason: removeReason.trim() } });
      await queryClient.invalidateQueries({ queryKey: getGetGiStructureQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ['/api/gi-structure/history'] });
      toast({ title: 'Mapping removed', description: `${removeTarget.name} is now unmapped.` });
      setRemoveTarget(null); setRemoveReason('');
    } catch (error) { toast({ title: 'Could not remove mapping', description: errorMessage(error), variant: 'destructive' }); }
  };
  const historyIdentity = identity;
  return <div className="space-y-5">
    <Notice><b>Many-to-one mapping.</b> Select several Medical Units and assign them to one GI Unit. A Medical Unit can have only one current GI target; a reassignment always requires confirmation.</Notice>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
      <div className="rounded-xl border bg-card">
        <div className="border-b p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Build a mapping set</p><h2 className="mt-1 text-lg font-semibold">Choose Medical Units</h2></div><span className="text-xs text-muted-foreground">{selectedUnits.length} selected</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.8fr)]">
            <Field label="Target GI Unit"><SearchableSelect id="gi-mapping-target" value={selectedGi} options={giUnits.map(unit => ({ value: String(unit.id), label: unit.name, description: `${unit.parent_name || 'Branch not assigned'} · ${unit.available ? 'Operational' : 'Setup only'}`, disabled: unit.status === 'INACTIVE' }))} onValueChange={setSelectedGi} placeholder="Choose one GI Unit" searchPlaceholder="Find GI Unit…" emptyMessage="No available GI Units." /></Field>
            <Field label="Search Medical Units"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Name, branch or code" /></div></Field>
          </div>
        </div>
        <div className="max-h-[28rem] overflow-y-auto p-2">
          {!filteredUnits.length ? <div className="px-4 py-10 text-center text-sm text-muted-foreground">No Medical Units match this search.</div>
            : filteredUnits.map(unit => {
              const selected = selectedUnits.includes(unit.code);
              const changedTarget = unit.gi_unit_id != null && Number(selectedGi) !== unit.gi_unit_id;
              return <label key={unit.code} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:bg-muted/40', selected && 'border-[#bdd1c2] bg-[#f0f6f1]')}>
                <Checkbox checked={selected} onCheckedChange={() => toggle(unit.code)} className="mt-0.5" />
                <span className="min-w-0 flex-1"><span className="block font-medium">{unit.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{unit.branch_name || 'Branch not recorded'}</span></span>
                <span className="shrink-0 text-right"><span className="block text-xs font-medium">{unit.gi_unit_name || 'Unmapped'}</span><span className="mt-1 block"><StatusPill status={unit.available ? 'ACTIVE' : 'PENDING'} available={unit.mapping_available} /></span>{changedTarget && selected && <span className="mt-1 block text-[10px] text-amber-800">Target changes</span>}</span>
              </label>;
            })}
        </div>
        <div className="space-y-3 border-t p-4 sm:p-5"><ReasonField value={reason} onChange={setReason} /><div className="flex justify-end"><Button onClick={requestSave} disabled={!selectedGi || !selectedUnits.length || reason.trim().length < 3 || saveMappings.isPending} className="gap-2">{saveMappings.isPending ? 'Saving…' : 'Save selected mappings'}<ArrowRight className="h-4 w-4" /></Button></div></div>
      </div>
      <div className="space-y-5">
        <section className="rounded-xl border bg-card">
          <div className="border-b p-4"><h2 className="font-semibold">Current mapping register</h2><p className="mt-1 text-xs text-muted-foreground">{mappings.length} Medical Units have a GI target</p></div>
          {!mappings.length ? <div className="p-8 text-center"><Workflow className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No mappings yet</p><p className="mt-1 text-xs text-muted-foreground">Mapped Medical Units appear here with setup and operational links distinguished.</p></div>
            : <div className="max-h-[30rem] divide-y overflow-y-auto">{mappings.map(unit => <div key={unit.code} className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{unit.name}</p><p className="mt-1 text-xs text-muted-foreground">{unit.branch_name || 'Branch not recorded'}</p></div><Button size="sm" variant="outline" onClick={() => { setRemoveTarget(unit); setRemoveReason(''); }} className="shrink-0 gap-1.5"><Unlink className="h-3.5 w-3.5" />Remove</Button></div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><ArrowDownRight className="h-3.5 w-3.5 text-primary" /><span className="font-medium">{unit.gi_unit_name}</span><StatusPill status={unit.available ? 'ACTIVE' : 'PENDING'} available={unit.mapping_available} /></div>
              <div className="mt-3"><HistoryList entityType="MAPPING" entityKey={unit.code} identity={historyIdentity} /></div>
            </div>)}</div>}
        </section>
        <Notice tone="warning">Setup links are not operational assignments. Pending Medical Units or GI Units may be mapped explicitly, but neither side is activated by mapping.</Notice>
      </div>
    </section>
    {confirmation && <Overlay title="Confirm existing target changes" description="These Medical Units already point to another GI Unit. Confirm to replace those links; no mapping is silently overwritten." onClose={() => setConfirmation(null)}>
      <div className="space-y-4"><div className="divide-y rounded-lg border">{confirmation.filter(unit => unit.gi_unit_id != null && unit.gi_unit_id !== Number(selectedGi)).map(unit => <div key={unit.code} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><span className="font-medium">{unit.name}</span><span className="text-xs text-muted-foreground">{unit.gi_unit_name || 'Current target'} <ArrowRight className="inline h-3 w-3" /></span><span className="text-sm font-medium">{target?.name}</span></div>)}</div><ReasonField value={reason} onChange={setReason} /><div className="flex flex-col-reverse justify-end gap-2 sm:flex-row"><Button variant="outline" onClick={() => setConfirmation(null)}>Go back</Button><Button onClick={() => { void persistMappings(confirmation); }} disabled={saveMappings.isPending || reason.trim().length < 3}>{saveMappings.isPending ? 'Saving…' : 'Confirm reassignment'}</Button></div></div>
    </Overlay>}
    {removeTarget && <Overlay title="Remove Medical Unit mapping" description={`${removeTarget.name} will no longer have a current GI Unit target. The mapping history is retained.`} onClose={() => setRemoveTarget(null)}>
      <div className="space-y-4"><Notice>Current target: <b>{removeTarget.gi_unit_name || 'Not available'}</b></Notice><ReasonField value={removeReason} onChange={setRemoveReason} /><div className="flex flex-col-reverse justify-end gap-2 sm:flex-row"><Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button><Button variant="destructive" onClick={() => { void submitRemove(); }} disabled={removeMapping.isPending || removeReason.trim().length < 3}>{removeMapping.isPending ? 'Removing…' : 'Remove mapping'}</Button></div></div>
    </Overlay>}
  </div>;
}

function Dashboard({ snapshot }: { snapshot: GiStructureSnapshot }) {
  const branches = snapshot.nodes.filter(node => node.level === 'BRANCH');
  const units = snapshot.nodes.filter(node => node.level === 'UNIT');
  const activeBranches = branches.filter(node => node.status === 'ACTIVE').length;
  const activeUnits = units.filter(node => node.status === 'ACTIVE').length;
  const pending = snapshot.nodes.filter(node => node.status === 'PENDING').length;
  const linked = snapshot.medical_units.filter(unit => unit.gi_unit_id != null).length;
  const branchRows = branches.slice().sort((a, b) => a.name.localeCompare(b.name));
  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-xl border border-[#cddbd1] bg-[#eaf2ec] p-5 sm:p-7">
      <div className="absolute -right-8 -top-14 h-48 w-48 rounded-full border-[22px] border-[#d4e3d7]/70" />
      <div className="absolute right-16 top-20 h-24 w-24 rounded-full border border-[#bfd3c4]" />
      <div className="relative max-w-3xl"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#28614f]"><ShieldCheck className="h-4 w-4" />General Insurance · accountable structure</div><h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-[#19392e] sm:text-3xl">One clear line of responsibility.<br className="hidden sm:block" />No duplicate identities.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#4e685b]">GI setup has two levels only: Branch → Unit. Existing Sales Manager accounts can be enrolled for GI roles without creating a second person or login.</p></div>
      <div className="relative mt-6 flex flex-wrap gap-2"><Link href="/admin/gi-structure/hierarchy" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1f5849] px-4 text-sm font-medium text-white hover:bg-[#174536]">Review hierarchy<ArrowRight className="h-4 w-4" /></Link><Link href="/admin/gi-structure/medical-units" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#b7cbbd] bg-card px-4 text-sm font-medium text-[#285b4a] hover:bg-white">Map Medical Units<Workflow className="h-4 w-4" /></Link></div>
    </section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'GI Branches', value: branches.length, detail: `${activeBranches} active`, icon: Building2 },
        { label: 'GI Units', value: units.length, detail: `${activeUnits} active`, icon: GitBranch },
        { label: 'Pending setup', value: pending, detail: 'Branch and Unit records', icon: Clock3 },
        { label: 'Medical Units mapped', value: linked, detail: `of ${snapshot.medical_units.length} available records`, icon: Workflow },
      ].map(item => <div key={item.label} className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">{item.label}</p><item.icon className="h-4 w-4 text-primary" /></div><p className="mt-3 text-3xl font-semibold tabular-nums text-[#19392e]">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div>)}
    </section>
    <section className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b p-4 sm:p-5"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Branch reporting</p><h2 className="mt-1 text-lg font-semibold">Where accountability starts</h2></div><Link href="/admin/gi-structure/hierarchy" className="text-sm font-medium text-primary hover:underline">Open all structure<ArrowRight className="ml-1 inline h-4 w-4" /></Link></div>
      {!branchRows.length ? <div className="px-5 py-12 text-center"><Network className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">No Branches in the snapshot</p><p className="mt-1 text-sm text-muted-foreground">Once imported or created, Branch reporting will appear here.</p></div>
        : <div className="divide-y">{branchRows.map(branch => {
          const children = units.filter(unit => unit.parent_id === branch.id);
          return <div key={branch.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf2ec] text-[#28614f]"><Building2 className="h-4 w-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b>{branch.name}</b><StatusPill status={branch.status} available={branch.available} /></div><p className="mt-1 text-xs text-muted-foreground">{branch.manager_name ? `Coordinator · ${branch.manager_name}` : 'No Branch Coordinator assigned'}</p></div></div>
            <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0"><Badge variant="outline">{children.length} Unit{children.length === 1 ? '' : 's'}</Badge><span className="text-xs text-muted-foreground">{children.filter(child => child.status === 'ACTIVE').length} operational</span></div>
          </div>;
        })}</div>}
    </section>
    <Notice><b>Operating rule:</b> a GI Unit becomes operational only when its Branch is active and an eligible active Unit Manager is assigned. Branch Coordinator assignment is optional.</Notice>
  </div>;
}

export default function GiStructurePage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetGiStructure({
    query: {
      queryKey: identityQueryKey(getGetGiStructureQueryKey(), user), enabled: !!user,
      staleTime: 15_000, refetchInterval: 15_000,
      refetchOnMount: 'always', refetchOnWindowFocus: 'always',
    },
  });
  const snapshot = data;
  const route = location.split('?')[0].replace(/\/+$/, '').split('/').at(-1) ?? 'dashboard';
  const view: View = ['hierarchy', 'managers', 'medical-units'].includes(route) ? route as View : 'dashboard';
  const [nodeEditor, setNodeEditor] = useState<GiNode | 'new' | null>(null);
  const [managerEditor, setManagerEditor] = useState<GiManager | 'new' | null>(null);
  const [levelFilter, setLevelFilter] = useState<'ALL' | GiLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const identity = [user?.id ?? null, user?.profileId ?? null] as const;
  const canManage = !!user && (user.profileId === 1 || user.profileId === 2 || user.profileName?.trim().toLowerCase() === 'national sales admin');
  const nodes = snapshot?.nodes ?? [];
  const managers = snapshot?.managers ?? [];
  const filteredNodes = useMemo(() => nodes.filter(node =>
    (levelFilter === 'ALL' || node.level === levelFilter)
    && (statusFilter === 'ALL' || node.status === statusFilter)
    && `${node.name} ${node.code} ${node.parent_name ?? ''} ${node.manager_name ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  ).sort((a, b) => a.level.localeCompare(b.level) || a.name.localeCompare(b.name)), [nodes, levelFilter, statusFilter, search]);
  const filteredManagers = managers.filter(manager => {
    const unitName = nodes.filter(node => node.level === 'UNIT' && (node.code === manager.details.GI_UNIT_CODE||manager.source_unit_codes?.includes(node.code))).map(node=>node.name).join(' ');
    const sourceName = snapshot?.manager_references.find(reference => reference.enrollment_id === manager.id)?.name ?? '';
    return `${manager.employee_name} ${manager.details.GI_UM_NAME} ${manager.details.EMAIL} ${manager.mobile_no ?? ''} ${manager.level} ${unitName} ${sourceName} ${manager.details.GI_UM_ID}`.toLowerCase().includes(managerSearch.trim().toLowerCase());
  });
  const unresolvedReferences = (snapshot?.manager_references ?? []).filter(reference => reference.enrollment_id == null);
  const activeCount = nodes.filter(node => node.status === 'ACTIVE').length;
  const title = views.find(item => item.id === view)?.label ?? 'Overview';
  const refresh = async () => { await refetch(); };
  const closeEditors = () => { setNodeEditor(null); setManagerEditor(null); };
  return <div className="min-h-full bg-[#f2f6f3]">
    <header className="border-b border-[#d9e4dd] bg-card">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Administration</span><ChevronRight className="h-3 w-3" /><span>Organization structure-GI</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#19392e] sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Maintain a traceable General Insurance organisation without duplicating people or their accounts.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { void refresh(); }} disabled={isFetching} className="gap-2 bg-card"><RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />Refresh</Button>{canManage && view === 'hierarchy' && <Button onClick={() => setNodeEditor('new')} className="gap-2"><Plus className="h-4 w-4" />Add entry</Button>}{canManage && view === 'managers' && <Button onClick={() => setManagerEditor('new')} className="gap-2"><Plus className="h-4 w-4" />Enroll manager</Button>}</div>
      </div>
    </header>
    <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <nav aria-label="GI organisation pages" className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">{views.map(item => { const Icon = item.icon; return <Link key={item.id} href={`/admin/gi-structure/${item.id}`} className={cn('flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors', view === item.id ? 'bg-[#e7f0e9] text-[#1f5849]' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="h-4 w-4" />{item.label}</Link>; })}</nav>
      {!user && <Notice>Sign in to view GI organisation setup.</Notice>}
      {isError && <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">GI structure could not be loaded</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage(error)}</p></div><Button variant="outline" onClick={() => { void refetch(); }}>Try again</Button></div>}
      {isLoading && <div aria-label="Loading GI structure" className="space-y-4">{[0, 1, 2].map(item => <div key={item} className="h-24 animate-pulse rounded-xl border bg-card" />)}</div>}
      {!isLoading && snapshot && <>
        {!canManage && <Notice>Read-only reporting view. Structure setup, enrollment and mapping actions are available to administrators and National Sales Admin.</Notice>}
        {view === 'dashboard' && <Dashboard snapshot={snapshot} />}
        {view === 'hierarchy' && <div className="space-y-5">
          <Notice>Imported Branches and Units remain <b>Pending setup</b> until reviewed. A setup link does not activate the organisation or its accounts.</Notice>
          <section className="rounded-xl border bg-card">
            <div className="flex flex-col gap-4 border-b p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Two-level GI hierarchy</p><h2 className="mt-1 text-lg font-semibold">Branch → Unit</h2><p className="mt-1 text-xs text-muted-foreground">{filteredNodes.length} displayed · {activeCount} active across the hierarchy</p></div><div className="flex flex-wrap gap-2 text-xs"><Badge variant="outline">{nodes.filter(node => node.level === 'BRANCH').length} Branches</Badge><Badge variant="outline">{nodes.filter(node => node.level === 'UNIT').length} Units</Badge></div></div>
              <div className="grid gap-2 sm:grid-cols-[minmax(200px,1fr)_170px_170px]">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, parent or manager" className="pl-9" /></div>
                <select aria-label="Show hierarchy level" value={levelFilter} onChange={event => setLevelFilter(event.target.value as 'ALL' | GiLevel)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">All levels</option><option value="BRANCH">Branch</option><option value="UNIT">Unit</option></select>
                <select aria-label="Filter by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">All statuses</option><option value="PENDING">Pending setup</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
              </div>
            </div>
            {!filteredNodes.length ? <div className="px-5 py-14 text-center"><Network className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold">{nodes.length ? 'No matching structure entries' : 'No GI hierarchy records yet'}</h3><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{nodes.length ? 'Adjust the level, search or status filter.' : 'Imported Branches and Units will appear here, or create the first Branch.'}</p>{canManage && !nodes.length && <Button onClick={() => setNodeEditor('new')} className="mt-4 gap-2"><Plus className="h-4 w-4" />Add Branch</Button>}</div>
              : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="bg-[#f6f8f6] text-left text-[11px] font-semibold uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-5 py-3">Organisation</th><th className="px-5 py-3">Reports to</th><th className="px-5 py-3">Accountable manager</th><th className="px-5 py-3">Availability</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{filteredNodes.map(node => <tr key={node.id} className="border-t align-top hover:bg-[#f7faf7]" data-testid={`row-gi-node-${node.id}`}>
                <td className="max-w-sm px-5 py-3.5"><b>{node.name}</b><div className="mt-1 text-xs text-muted-foreground">{levelLabel(node.level)}{node.source_reference_id != null ? ' · Imported record' : ''}</div>{node.level === 'UNIT' && <LinkedMedicalUnits units={snapshot.medical_units.filter(unit => unit.gi_unit_id === node.id)} />}</td><td className="px-5 py-3.5">{node.level === 'BRANCH' ? 'GI root' : node.parent_name || 'Branch not assigned'}</td><td className="px-5 py-3.5">{node.manager_name || <span className="text-muted-foreground">Not assigned</span>}</td><td className="px-5 py-3.5"><span className="text-xs">{node.available ? 'Operational' : 'Setup only'}</span></td><td className="px-5 py-3.5"><StatusPill status={node.status} /></td><td className="px-5 py-3.5 text-right"><div className="flex flex-wrap justify-end gap-2"><NodeViewAction node={node} snapshot={snapshot} />{canManage && <><Button size="sm" variant="outline" onClick={() => setNodeEditor(node)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit</Button><NodeStatusAction node={node} /></>}</div></td>
                <td className="hidden" />
              </tr>)}</tbody></table></div>}
          </section>
          {filteredNodes.map(node => <HistoryList key={`history-${node.id}`} entityType="NODE" entityKey={String(node.id)} identity={identity} />)}
        </div>}
        {view === 'managers' && <div className="space-y-5">
          <Notice>GI Manager designations reuse eligible Sales Manager identities. GI source IDs remain independent from verified employee accounts; duplicate designations never create duplicate users. A person may be assigned to multiple Units.</Notice>
          <section className="rounded-xl border bg-card">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Verified account links</p><h2 className="mt-1 text-lg font-semibold">GI Manager Enrollment</h2><p className="mt-1 text-xs text-muted-foreground">{managers.length} designations · {managers.filter(item => item.is_active).length} active · linked source references are not counted again</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={managerSearch} onChange={event => setManagerSearch(event.target.value)} placeholder="Search name, Unit or email" className="pl-9" /></div></div>
            {!filteredManagers.length ? <div className="px-5 py-14 text-center"><UsersRound className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">{managers.length ? 'No matching enrollments' : 'No GI Manager enrollments yet'}</p><p className="mt-1 text-sm text-muted-foreground">Enroll an existing eligible Sales Manager account for a GI category.</p>{canManage && <Button onClick={() => setManagerEditor('new')} className="mt-4 gap-2"><Plus className="h-4 w-4" />Enroll manager</Button>}</div>
              : <div className="divide-y">{filteredManagers.map(manager => {
                const sourceReference = snapshot.manager_references.find(reference => reference.enrollment_id === manager.id);
                const primaryUnit = nodes.find(node => node.level === 'UNIT' && node.code === manager.details.GI_UNIT_CODE);
                const earning = manager.details.EARN_RETAINER;
                return <article key={manager.id} className="p-4 sm:p-5">
                  {!!manager.source_unit_codes?.length&&<p className="mb-2 text-xs text-muted-foreground">Imported GI Units: {nodes.filter(node=>node.level==='UNIT'&&manager.source_unit_codes?.includes(node.code)).map(node=>node.name).join(', ')}</p>}
                  {!!manager.source_notes?.length&&<p className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">Some imported fields differed and were left blank for review. Open the designation to view the original import notes.</p>}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf2ec] text-[#28614f]"><UsersRound className="h-5 w-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{manager.employee_name}</h3><Badge variant="outline">{manager.level === 'BRANCH' ? 'Branch Coordinator' : 'Unit Manager'}</Badge><Badge variant="outline" className={manager.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'text-muted-foreground'}>{manager.is_active ? 'Active designation' : 'Inactive draft'}</Badge>{sourceReference && <Badge variant="outline" className="border-[#c5d8cb] bg-[#f0f6f1] text-[#3f604d]">Imported · linked {manager.is_active ? 'active' : 'draft'}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{manager.details.EMAIL || 'Email not provided'}</p><p className="mt-1 text-xs text-muted-foreground">GI designation · <span className="font-medium text-foreground">{manager.details.GI_UM_NAME || 'Name not recorded'}</span></p><p className="mt-1 text-xs text-muted-foreground">Primary GI Unit · <span className="font-medium text-foreground">{primaryUnit?.name || (manager.details.GI_UNIT_CODE ? 'Unresolved source Unit' : 'Not assigned')}</span>{manager.details.GI_UNIT_CODE && !primaryUnit && <span className="ml-1">({manager.details.GI_UNIT_CODE})</span>}</p>{!manager.user_eligible && <p className="mt-1 text-xs text-amber-800">The linked MIS account needs eligibility review; existing designations remain visible.</p>}</div></div>{canManage && <Button size="sm" variant="outline" onClick={() => setManagerEditor(manager)} className="gap-1.5 self-start"><Pencil className="h-3.5 w-3.5" />Edit designation</Button>}</div>
                  <p className="mt-2 break-words text-sm text-muted-foreground" data-testid={`gi-manager-mobile-${manager.id}`}>
                    Mobile Number · <span className="font-medium text-foreground">{manager.mobile_no || 'Not captured on user account'}</span>
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md bg-muted/30 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Retainer metadata</p><p className="mt-1 text-sm font-medium">{earning ? `Flag on · ${manager.details.RETAINER_AMT || 'Amount not set'}` : 'Flag off'}</p><p className="mt-1 text-xs text-muted-foreground">{manager.details.RET_EFF_UPTO ? `Source end date ${dateLabel(manager.details.RET_EFF_UPTO)}` : 'No source end date'}</p></div>
                    <p className="text-xs text-muted-foreground">HRMIS_CODE <span className="ml-1 font-medium text-foreground">{manager.details.HRMIS_CODE || '—'}</span></p>
                    <p className="text-xs text-muted-foreground">VALID_FROM <span className="ml-1 font-medium text-foreground">{dateLabel(manager.details.VALID_FROM)}</span></p>
                    <p className="text-xs text-muted-foreground">VALID_TO <span className="ml-1 font-medium text-foreground">{dateLabel(manager.details.VALID_TO)}</span></p>
                  </div>
                  {sourceReference && <p className="mt-3 text-xs text-muted-foreground">Source status · {sourceReference.source_active ? 'Marked active in import' : 'Marked inactive in import'}{sourceReference.review_note ? ` · ${sourceReference.review_note}` : ''}</p>}
                  <div className="mt-4"><HistoryList entityType="MANAGER" entityKey={String(manager.id)} identity={identity} /></div>
                </article>;
              })}</div>}
          </section>
          {!!unresolvedReferences.length && <section className="rounded-xl border border-amber-200 bg-card">
            <div className="border-b border-amber-200 bg-amber-50/70 p-4 sm:p-5"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-amber-900">Separate import review</p><h2 className="mt-1 text-lg font-semibold">GI designations needing an account link</h2><p className="mt-1 text-xs text-amber-900/80">These references are not enrollments and are excluded from the enrollment count. They are never matched to a person by name.</p></div>
            <div className="divide-y">{unresolvedReferences.map(reference => <article key={`${reference.level}-${reference.code}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{reference.name || 'Imported GI Manager reference'}</h3><Badge variant="outline">{reference.level === 'BRANCH' ? 'Branch Coordinator' : 'Unit Manager'}</Badge><Badge variant="outline" className={reference.source_active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'text-muted-foreground'}>Source marked {reference.source_active ? 'active' : 'inactive'}</Badge></div><p className="mt-1 text-sm font-medium text-amber-900">Needs account review</p>{reference.review_note && <p className="mt-1 text-xs leading-5 text-muted-foreground">{reference.review_note}</p>}</div>
            </article>)}</div>
          </section>}
        </div>}
        {view === 'medical-units' && <MappingWorkspace snapshot={snapshot} identity={identity} />}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6e3da] bg-[#eaf2ec] px-4 py-3 text-xs text-[#456454]"><span className="flex items-center gap-2"><CircleHelp className="h-4 w-4" />Structure, enrollment and mapping changes are versioned and reason-recorded.</span>{canManage && <span className="font-medium">Access: system administrators and National Sales Admin</span>}</div>
      </>}
    </main>
    {snapshot && nodeEditor && canManage && <NodeForm key={nodeEditor === 'new' ? 'new-node' : `node-${nodeEditor.id}`} node={nodeEditor === 'new' ? undefined : nodeEditor} snapshot={snapshot} onDone={closeEditors} onCancel={closeEditors} />}
    {snapshot && managerEditor && canManage && <ManagerForm key={managerEditor === 'new' ? 'new-manager' : `manager-${managerEditor.id}`} manager={managerEditor === 'new' ? undefined : managerEditor} snapshot={snapshot} onDone={closeEditors} onCancel={closeEditors} />}
  </div>;
}
