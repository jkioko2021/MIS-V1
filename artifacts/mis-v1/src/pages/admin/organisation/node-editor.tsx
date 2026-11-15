import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetOrganisationAgentsQueryKey, getGetOrganisationQueryKey, getGetSalesStructureQueryKey,
  useCreateSalesStructureNode, useUpdateSalesStructureNode,
} from '@workspace/api-client-react';
import type {
  OrganisationCandidate, OrganisationNode, SalesLevel, SalesManager, SalesNodeInput, SalesNodeUpdate,
} from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';
import { errorMessage, errorStatus, INPUT_CLASS, LEVELS, LEVEL_LABEL } from './shared';

export function NodeEditor({ node, nodes, candidates, managers, onCancel, onSaved, onRefresh }: {
  node?: OrganisationNode;
  nodes: OrganisationNode[];
  candidates: OrganisationCandidate[];
  managers: SalesManager[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
  onRefresh: () => Promise<unknown>;
}) {
  const client = useQueryClient();
  const create = useCreateSalesStructureNode();
  const update = useUpdateSalesStructureNode();
  const [level, setLevel] = useState<SalesLevel>(node?.level ?? 'NATIONAL');
  const [candidateId, setCandidateId] = useState('');
  const selectedCandidate = candidates.find((candidate) => candidate.source_reference_id === Number(candidateId));
  const [code, setCode] = useState(node?.code ?? '');
  const [name, setName] = useState(node?.name ?? '');
  const [parentId, setParentId] = useState(node?.parent_id == null ? '' : String(node.parent_id));
  const [managerId, setManagerId] = useState(node?.manager_id == null ? '' : String(node.manager_id));
  const [active, setActive] = useState(node?.is_active ?? true);
  const [version, setVersion] = useState(node?.version ?? 0);
  useEffect(() => {
    if (node?.version && node.version !== version) setVersion(node.version);
  }, [node?.version, version]);

  const parentLevel: SalesLevel | null = level === 'REGION' ? 'NATIONAL' : level === 'BRANCH' ? 'REGION' : level === 'UNIT' ? 'BRANCH' : null;
  const currentParent = nodes.find((entry) => entry.id === node?.parent_id);
  const parentOptions = parentLevel ? nodes.filter((entry) => entry.level === parentLevel && entry.id !== node?.id
    && (entry.available || entry.id === node?.parent_id)) : [];
  const managerOptions = managers.filter((manager) =>
    manager.level === level && ((manager.is_active && manager.user_eligible) || manager.id === node?.manager_id));
  const parentCode = nodes.find((item) => item.id === Number(parentId))?.code ?? '';
  const missingSourceParent = (parentCodeFromSource: string | null | undefined) => {
    const value = (parentCodeFromSource ?? '').trim();
    return !value || value.toLowerCase() === 'null';
  };
  const sourceCandidates = candidates.filter((candidate) => {
    if (candidate.level !== level) return false;
    if (level === 'NATIONAL') return missingSourceParent(candidate.parent_code);
    return missingSourceParent(candidate.parent_code) || candidate.parent_code === parentCode;
  });
  const currentError = create.error || update.error;
  const saving = create.isPending || update.isPending;
  const activeChildren = node ? nodes.some((item) => item.parent_id === node.id && item.is_active) : false;
  const valid = name.trim().length > 0 && managerId !== ''
    && (node || /^[A-Za-z0-9_-]{1,40}$/.test(code.trim()))
    && (level === 'NATIONAL' || Boolean(parentId))
    && !(node?.is_active && !active && activeChildren)
    && (!selectedCandidate || selectedCandidate.code === code);

  const refreshVersion = async () => {
    create.reset();
    update.reset();
    await onRefresh();
  };
  const invalidateOrganisation = async () => Promise.all([
    client.invalidateQueries({ queryKey: getGetOrganisationQueryKey() }),
    client.invalidateQueries({ queryKey: getGetOrganisationAgentsQueryKey() }),
    client.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
  ]);
  const save = () => {
    if (!valid || saving) return;
    const parent = parentId ? Number(parentId) : null;
    const manager = Number(managerId);
    if (node) {
      const data: SalesNodeUpdate = { name: name.trim(), parent_id: parent, manager_id: manager, is_active: active, version };
      update.mutate({ id: node.id, data }, { onSuccess: async () => {
        await invalidateOrganisation();
        await onSaved();
      } });
    } else {
      const data: SalesNodeInput = {
        code: (selectedCandidate?.code ?? code).trim(),
        name: (selectedCandidate?.name ?? name).trim(),
        level,
        parent_id: parent,
        manager_id: manager,
        is_active: active,
        ...(selectedCandidate ? { source_reference_id: selectedCandidate.source_reference_id } : {}),
      };
      create.mutate({ data }, { onSuccess: async () => {
        await invalidateOrganisation();
        await onSaved();
      } });
    }
  };
  const changeParent = (value: string) => {
    setParentId(value);
    const nextParent = nodes.find(entry => entry.id === Number(value));
    if (selectedCandidate && !missingSourceParent(selectedCandidate.parent_code)
      && selectedCandidate.parent_code?.trim().toUpperCase() !== nextParent?.code.toUpperCase()) {
      // Discard only an incompatible source link, never the administrator's draft.
      setCandidateId('');
    }
  };

  return <section className="rounded-xl border border-[#cbd9d1] bg-[#f4f8f5] p-4 shadow-sm sm:p-6" data-testid="panel-node-editor">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">Structure maintenance</p>
        <h2 className="mt-1 text-lg font-semibold">{node ? `Edit ${LEVEL_LABEL[node.level].toLowerCase()}` : 'Add a hierarchy entry'}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Build from the top down. Use an available parent and an eligible manager at the same level. Existing imported records are matched in place.</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel}>Close</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {!node && <div className="space-y-1.5">
        <Label htmlFor="org-level">Hierarchy level</Label>
        <select id="org-level" className={INPUT_CLASS} value={level} onChange={(event) => {
          setLevel(event.target.value as SalesLevel); setCandidateId(''); setCode(''); setName(''); setParentId(''); setManagerId('');
        }}>
          {LEVELS.map((item) => <option key={item} value={item}>{LEVEL_LABEL[item]}</option>)}
        </select>
      </div>}
      {!node && <div className="space-y-1.5">
        <Label htmlFor="org-source-candidate">Imported organisation match</Label>
        <select id="org-source-candidate" className={INPUT_CLASS} value={candidateId} onChange={(event) => {
          const value = event.target.value;
          setCandidateId(value);
          const candidate = candidates.find((item) => item.source_reference_id === Number(value));
          if (candidate) { setCode(candidate.code); setName(candidate.name); }
          else { setCode(''); setName(''); }
        }}>
          <option value="">Create new record</option>
          {sourceCandidates.map((candidate) => <option key={candidate.source_reference_id} value={candidate.source_reference_id}>{candidate.code} — {candidate.name}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">Source code and name are preserved exactly when reusing an imported organisation.</p>
      </div>}
      {!node && <div className="space-y-1.5">
        <Label htmlFor="org-code">Unique code</Label>
        <Input id="org-code" value={code} disabled={!!selectedCandidate} onChange={(event) => setCode(event.target.value)} maxLength={40} placeholder="Organisation code" />
      </div>}
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Display name <span className="text-destructive">*</span></Label>
        <Input id="org-name" value={name} disabled={!!selectedCandidate} onChange={(event) => setName(event.target.value)} maxLength={150} placeholder="Name shown in reporting" />
      </div>
      {parentLevel && <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="org-parent">{LEVEL_LABEL[parentLevel]} parent <span className="text-destructive">*</span></Label>
        <select id="org-parent" className={INPUT_CLASS} value={parentId} onChange={(event) => changeParent(event.target.value)}>
          <option value="">Choose an available {LEVEL_LABEL[parentLevel].toLowerCase()}</option>
          {parentOptions.map((parent) => <option key={parent.id} value={parent.id}>{parent.code} — {parent.name}{!parent.available ? ' (retained current parent)' : ''}</option>)}
        </select>
        {!parentOptions.length && <p className="text-xs text-amber-800">Create an available {LEVEL_LABEL[parentLevel].toLowerCase()} first. A missing parent cannot be inferred or fabricated.</p>}
        {currentParent && !currentParent.available && currentParent.id === Number(parentId) && <p className="text-xs text-amber-800">The current unavailable parent is retained for historical context. Choose an available parent to reparent this entry.</p>}
      </div>}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="org-manager">Assigned manager <span className="text-destructive">*</span></Label>
        <select id="org-manager" className={INPUT_CLASS} value={managerId} onChange={(event) => setManagerId(event.target.value)}>
          <option value="">Choose an eligible manager</option>
          {managerOptions.map((manager) => <option key={manager.id} value={manager.id}>{manager.employee_name} · {manager.username}</option>)}
        </select>
        {!managerOptions.length && <p className="text-xs text-amber-800">No eligible manager at this level. Enroll or activate a manager before saving.</p>}
      </div>
      <label className="flex items-start gap-3 rounded-lg border bg-card px-3 py-3 sm:col-span-2">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="mt-1 accent-[#28614f]" />
        <span><b className="block text-sm">Active structure entry</b><small className="text-xs leading-5 text-muted-foreground">Inactive entries remain available for reference, but not as new parents or agent destinations.</small></span>
      </label>
      {node?.is_active && !active && activeChildren && <Alert className="sm:col-span-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Active children must be moved first</AlertTitle><AlertDescription>This entry still has active child organisations and cannot be deactivated.</AlertDescription></Alert>}
    </div>
    {currentError && <Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Could not save entry</AlertTitle><AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>{errorMessage(currentError)}</span>{errorStatus(currentError) === 409 && node && <Button variant="outline" size="sm" onClick={() => { void refreshVersion(); }}>Refresh latest version</Button>}</AlertDescription></Alert>}
    <div className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button onClick={save} disabled={!valid || saving} className="gap-2 bg-[#1f5849] hover:bg-[#174536]">
        {saving ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />{node ? 'Save changes' : 'Create entry'}</>}
      </Button>
    </div>
  </section>;
}
