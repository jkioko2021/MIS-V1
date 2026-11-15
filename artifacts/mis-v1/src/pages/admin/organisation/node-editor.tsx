import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetOrganisationAgentsQueryKey, getGetOrganisationQueryKey, getGetSalesStructureQueryKey,
  useCreateSalesStructureNode, useUpdateSalesStructureNode,
} from '@workspace/api-client-react';
import type {
  OrganisationCandidate, OrganisationNode, SalesCatalogSnapshot, SalesLevel, SalesManager, SalesNodeInput, SalesNodeUpdate,
} from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, RefreshCw } from 'lucide-react';
import { errorMessage, errorStatus, INPUT_CLASS, LEVELS, LEVEL_LABEL } from './shared';

type MedicalValues = Record<string, string | null>;
type CandidateWithMedical = OrganisationCandidate & { medical_details?: MedicalValues };
type NodeWithMedical = OrganisationNode & { medical_details?: MedicalValues };

const MEDICAL_FIELDS: Record<'REGION' | 'BRANCH' | 'UNIT', Array<{ key: string; label: string; input: 'date' | 'text' | 'select' }>> = {
  REGION: [
    { key: 'VALID_FROM', label: 'Valid from', input: 'date' },
    { key: 'VALID_TO', label: 'Valid to', input: 'date' },
  ],
  BRANCH: [
    { key: 'BRANCH_TYPE', label: 'Branch type', input: 'text' },
    { key: 'SPECIALITY', label: 'Speciality', input: 'text' },
    { key: 'GI_BRANCH', label: 'GI branch', input: 'select' },
  ],
  UNIT: [
    { key: 'UNIT_TYPE', label: 'Unit type', input: 'text' },
    { key: 'SPECIALITY', label: 'Speciality', input: 'text' },
    { key: 'YEAR', label: 'Year', input: 'text' },
    { key: 'VALID_FROM', label: 'Valid from', input: 'date' },
    { key: 'VALID_TO', label: 'Valid to', input: 'date' },
    { key: 'MIS_NO', label: 'MIS number', input: 'text' },
    { key: 'GI_UNIT', label: 'GI unit', input: 'select' },
  ],
};

const MEDICAL_MAX_LENGTH: Record<string, number> = {
  VALID_FROM: 10,
  VALID_TO: 10,
  BRANCH_TYPE: 50,
  SPECIALITY: 5,
  UNIT_TYPE: 50,
  YEAR: 4,
  MIS_NO: 20,
};

const MEDICAL_CATALOG: Partial<Record<SalesLevel, string>> = {
  REGION: 'sales-regions',
  BRANCH: 'sales-branches',
  UNIT: 'sales-units',
};

function changedMedicalDetails(fields: Array<{ key: string }>, values: MedicalValues, original: MedicalValues) {
  return Object.fromEntries(fields.flatMap(({ key }) => {
    const value = values[key]?.trim() || null;
    const previous = original[key]?.trim() || null;
    return value === previous ? [] : [[key, value]];
  })) as MedicalValues;
}

export function NodeEditor({ node, nodes, candidates, managers, catalogSnapshot, initialCandidate, onCancel, onSaved, onRefresh }: {
  node?: OrganisationNode;
  nodes: OrganisationNode[];
  candidates: OrganisationCandidate[];
  managers: SalesManager[];
  catalogSnapshot?: SalesCatalogSnapshot;
  initialCandidate?: OrganisationCandidate;
  onCancel: () => void;
  onSaved: () => Promise<void>;
  onRefresh: () => Promise<unknown>;
}) {
  const client = useQueryClient();
  const create = useCreateSalesStructureNode();
  const update = useUpdateSalesStructureNode();
  const initialMedicalCandidate = initialCandidate as CandidateWithMedical | undefined;
  const initialMedicalNode = node as NodeWithMedical | undefined;
  const [level, setLevel] = useState<SalesLevel>(node?.level ?? initialCandidate?.level ?? 'NATIONAL');
  const [candidateId, setCandidateId] = useState(initialCandidate ? String(initialCandidate.source_reference_id) : '');
  const selectedCandidate = (candidates.find((candidate) => candidate.source_reference_id === Number(candidateId))
    ?? (initialMedicalCandidate?.source_reference_id === Number(candidateId) ? initialMedicalCandidate : undefined)) as CandidateWithMedical | undefined;
  const [code, setCode] = useState(node?.code ?? initialCandidate?.code ?? '');
  const [name, setName] = useState(node?.name ?? initialCandidate?.name ?? '');
  const [parentId, setParentId] = useState(node?.parent_id == null ? '' : String(node.parent_id));
  const [managerId, setManagerId] = useState(node?.manager_id == null ? '' : String(node.manager_id));
  const [active, setActive] = useState(node?.is_active ?? true);
  const [version, setVersion] = useState(node?.version ?? 0);
  const [medicalDetails, setMedicalDetails] = useState<MedicalValues>(
    initialMedicalNode?.medical_details ?? initialMedicalCandidate?.medical_details ?? {},
  );
  const originalMedicalDetails = useRef<MedicalValues>(
    initialMedicalNode?.medical_details ?? initialMedicalCandidate?.medical_details ?? {},
  );
  const editorRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (node?.version && node.version !== version) setVersion(node.version);
  }, [node?.version, version]);
  useEffect(() => {
    if (initialCandidate?.source_reference_id) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [initialCandidate?.source_reference_id]);

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
    if (candidate.source_reference_id === Number(candidateId)) return true;
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
      const nodeMedicalFields = MEDICAL_FIELDS[node.level as 'REGION' | 'BRANCH' | 'UNIT'];
      const medicalData = nodeMedicalFields
        ? changedMedicalDetails(nodeMedicalFields, medicalDetails, originalMedicalDetails.current)
        : undefined;
      const data: SalesNodeUpdate = {
        name: name.trim(), parent_id: parent, manager_id: manager, is_active: active, version,
        ...(medicalData && Object.keys(medicalData).length ? { medical_details: medicalData } : {}),
      };
      update.mutate({ id: node.id, data }, { onSuccess: async () => {
        await invalidateOrganisation();
        await onSaved();
      } });
    } else {
      const levelMedicalFields = MEDICAL_FIELDS[level as 'REGION' | 'BRANCH' | 'UNIT'];
      const applicableMedicalDetails = levelMedicalFields
        ? changedMedicalDetails(levelMedicalFields, medicalDetails, originalMedicalDetails.current)
        : undefined;
      const data: SalesNodeInput = {
        code: (selectedCandidate?.code ?? code).trim(),
        name: (selectedCandidate?.name ?? name).trim(),
        level,
        parent_id: parent,
        manager_id: manager,
        is_active: active,
        ...(selectedCandidate ? { source_reference_id: selectedCandidate.source_reference_id } : {}),
        ...(applicableMedicalDetails && Object.keys(applicableMedicalDetails).length ? { medical_details: applicableMedicalDetails } : {}),
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
      originalMedicalDetails.current = {};
    }
  };

  return <section ref={editorRef} className="scroll-mt-16 rounded-xl border border-[#cbd9d1] bg-[#f4f8f5] p-4 shadow-sm sm:p-6" data-testid="panel-node-editor">
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
          setLevel(event.target.value as SalesLevel); setCandidateId(''); setCode(''); setName(''); setParentId(''); setManagerId(''); setMedicalDetails({});
          originalMedicalDetails.current = {};
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
          const medicalCandidate = candidate as CandidateWithMedical | undefined;
          if (candidate) {
            const defaults = medicalCandidate?.medical_details ?? {};
            setCode(candidate.code); setName(candidate.name); setMedicalDetails(defaults); originalMedicalDetails.current = defaults;
          } else {
            setCode(''); setName(''); setMedicalDetails({}); originalMedicalDetails.current = {};
          }
        }}>
          <option value="">Create new record</option>
          {sourceCandidates.map((candidate) => <option key={candidate.source_reference_id} value={candidate.source_reference_id}>{candidate.name}</option>)}
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
      {level !== 'NATIONAL' && <section className="space-y-3 rounded-lg border border-[#d6e3da] bg-card p-4 sm:col-span-2">
        <div>
          <h3 className="text-sm font-semibold text-[#244b3b]">Medical organisation details</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Source values are prefilled when available. Parent and region are derived from the hierarchy; manager assignment remains a separate eligibility-checked choice.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(MEDICAL_FIELDS[level as 'REGION' | 'BRANCH' | 'UNIT'] ?? []).map((field) => {
            const catalogKey = MEDICAL_CATALOG[level];
            const definition = catalogSnapshot?.definitions.find((item) => item.key === catalogKey);
            const reference = definition?.fields.find((item) => item.key === field.key)?.reference
              ?? (field.key === 'GI_BRANCH' ? 'gi-branches' : field.key === 'GI_UNIT' ? 'gi-units' : null);
            const choiceEntries = field.input === 'select' && reference
              ? (catalogSnapshot?.entries.filter((entry) =>
                entry.catalog === reference && (!entry.source_reference || entry.organization_choice),
              ) ?? []).sort((a, b) => Number(!!a.source_reference) - Number(!!b.source_reference) || a.name.localeCompare(b.name))
              : [];
            const choices = choiceEntries.filter((entry, index) =>
              choiceEntries.findIndex((candidate) => candidate.code.toUpperCase() === entry.code.toUpperCase()) === index,
            );
            const value = medicalDetails[field.key] ?? '';
            const fieldId = `medical-${field.key.toLowerCase()}`;
            return <div key={field.key} className="space-y-1.5">
              <Label htmlFor={fieldId}>{field.label}</Label>
              {field.input === 'select' ? <select
                id={fieldId}
                className={INPUT_CLASS}
                value={value}
                onChange={(event) => setMedicalDetails((current) => ({ ...current, [field.key]: event.target.value || null }))}
              >
                <option value="">Not linked</option>
                {value && !choices.some((entry) => entry.code === value) && <option value={value}>Previously selected item unavailable</option>}
                {choices.map((entry) => <option key={`${entry.catalog}-${entry.code}`} value={entry.code}>{entry.name}</option>)}
              </select> : <Input
                id={fieldId}
                type={field.input}
                value={value}
                onChange={(event) => setMedicalDetails((current) => ({ ...current, [field.key]: event.target.value || null }))}
                maxLength={MEDICAL_MAX_LENGTH[field.key] ?? 100}
              />}
            </div>;
          })}
        </div>
      </section>}
      {parentLevel && <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="org-parent">{LEVEL_LABEL[parentLevel]} parent <span className="text-destructive">*</span></Label>
        <select id="org-parent" className={INPUT_CLASS} value={parentId} onChange={(event) => changeParent(event.target.value)}>
          <option value="">Choose an available {LEVEL_LABEL[parentLevel].toLowerCase()}</option>
          {parentOptions.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}{!parent.available ? ' (retained current parent)' : ''}</option>)}
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
        <p className="text-xs text-muted-foreground">Only users with the Sales Manager profile and an eligible enrollment in this category can be assigned.</p>
        {!managerOptions.length && <p className="text-xs text-amber-800">No eligible manager at this level. Assign the Sales Manager profile in User Enrollment, then complete or activate the matching Manager Enrollment.</p>}
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
