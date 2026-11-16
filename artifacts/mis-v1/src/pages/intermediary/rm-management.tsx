import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, ArrowRightLeft, Ban, Building2, Check, ChevronLeft,
  ChevronRight, Clock3, FileClock, LoaderCircle, Pencil, Plus, RefreshCw, Search, ShieldCheck,
  UserRound, Users, X,
} from 'lucide-react';
import {
  getGetIntermediaryOptionsQueryKey,
  getGetOrganisationAgentsQueryKey,
  getGetOrganisationQueryKey,
  getGetRmAgentsQueryKey,
  getGetRmManagementQueryKey,
  getListIntermediariesQueryKey,
  useCommitRmTransfer,
  useGetRmAgents,
  useGetRmManagement,
  usePreviewRmTransfer,
  useSaveRmManager,
  type RmAgent,
  type RmManagerInput,
  type RmManagerRecord,
  type RmTransferPreview,
} from '@workspace/api-client-react';
import { useAuth } from '@/lib/auth-context';
import { identityQueryKey } from '@/pages/admin/organisation/shared';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import './rm-management.css';

type Category = 'C' | 'R';
type TransferMode = 'SELECTED' | 'ALL';
type SourceMode = 'unassigned' | 'all' | 'manager' | 'manual';
type ManagerDraft = Pick<RmManagerInput, 'code' | 'name' | 'class_code' | 'category' | 'year' | 'version'> & {
  reason: string;
  active: boolean;
};

const PAGE_SIZE = 25;
const MAX_SELECTED = 500;
const MAX_TRANSFER = 5000;
const UNASSIGNED_OPTION = '__unassigned__';
const ALL_AGENTS_OPTION = '__all_agents__';
const MANUAL_OPTION = '__manual__';
const MANAGER_OPTION_PREFIX = '__code__:';

function categoryLabel(category: Category) {
  return category === 'C' ? 'Corporate' : 'Retail';
}

function getErrorText(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const status = 'status' in error ? Number((error as { status?: unknown }).status) : 0;
    if (status === 409) return 'This record changed since it was loaded. Refresh the workspace and review the latest version before trying again.';
    if ('data' in error) {
      const data = (error as { data?: unknown }).data;
      if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') return data.error;
    }
    if ('message' in error && typeof error.message === 'string' && error.message) return error.message;
  }
  return fallback;
}

function SourceBadge({ code, name }: { code: string | null; name: string | null }) {
  if (!code) return <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">Unassigned</span>;
  if (name?.trim()) return <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-800">{name} <span className="font-mono">· {code}</span></span>;
  return <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">Unmapped legacy code · <span className="font-mono">{code}</span></span>;
}

function ManagerStatus({ manager, snapshotYear }: { manager: RmManagerRecord; snapshotYear: number }) {
  const future = manager.year > snapshotYear;
  const label = future ? 'FUTURE' : !manager.is_current ? 'HISTORICAL' : manager.active ? 'ACTIVE' : 'INACTIVE';
  const cls = future ? 'bg-amber-100 text-amber-900' : !manager.is_current ? 'bg-slate-100 text-slate-600' : manager.active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900';
  return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold tracking-[.08em] ${cls}`}>{label}</span>;
}

function LoadingList() {
  return <div className="space-y-3 p-5" aria-label="Loading relationship manager data">{[0, 1, 2].map((key) => <div key={key} className="h-4 animate-pulse rounded bg-muted" />)}</div>;
}

function isConflict(error: unknown) {
  return !!error && typeof error === 'object' && 'status' in error && Number((error as { status?: unknown }).status) === 409;
}

export default function RelationshipManagerManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const identity = user ? { id: user.id, profileId: user.profileId } : null;
  const snapshotKey = identityQueryKey(getGetRmManagementQueryKey(), identity);
  const snapshot = useGetRmManagement({
    query: {
      queryKey: snapshotKey,
      enabled: !!user,
      staleTime: 30_000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });
  const saveManagerMutation = useSaveRmManager();
  const previewMutation = usePreviewRmTransfer();
  const commitMutation = useCommitRmTransfer();
  const lockRef = useRef(false);
  const previewEpoch = useRef(0);

  const [category, setCategory] = useState<Category>('C');
  const [managerSearch, setManagerSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [agentPage, setAgentPage] = useState(1);
  const [sourceMode, setSourceMode] = useState<SourceMode>('unassigned');
  const [sourceCode, setSourceCode] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [transferMode, setTransferMode] = useState<TransferMode>('SELECTED');
  const [transferReason, setTransferReason] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => new Set());
  const [previewResult, setPreviewResult] = useState<RmTransferPreview | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [managerDialog, setManagerDialog] = useState(false);
  const [managerForm, setManagerForm] = useState<ManagerDraft | null>(null);
  const [managerError, setManagerError] = useState('');
  const [deactivateManager, setDeactivateManager] = useState<RmManagerRecord | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateError, setDeactivateError] = useState('');

  const managers = snapshot.data?.managers ?? [];
  const organisation = snapshot.data?.organisation;
  const regions = organisation?.regions ?? [];
  const branches = organisation?.branches ?? [];
  const units = organisation?.units ?? [];
  const currentYear = snapshot.data?.year ?? new Date().getFullYear();
  const categoryManagers = useMemo(
    () => managers.filter((manager) => manager.category === category),
    [managers, category],
  );
  const targetManagers = useMemo(
    () => categoryManagers.filter((manager) => manager.is_current && manager.active),
    [categoryManagers],
  );
  const sourceManagerChoices = useMemo(() => {
    const byCode = new Map<string, RmManagerRecord>();
    for (const manager of [...categoryManagers].sort((a, b) =>
      Number(b.is_current) - Number(a.is_current) || b.year - a.year,
    )) {
      if (!byCode.has(manager.code)) byCode.set(manager.code, manager);
    }
    return [...byCode.values()];
  }, [categoryManagers]);
  const branchChoices = useMemo(
    () => regionCode ? branches.filter((branch) => branch.parent_code === regionCode) : branches,
    [branches, regionCode],
  );
  const unitChoices = useMemo(
    () => branchCode
      ? units.filter((unit) => unit.parent_code === branchCode)
      : regionCode ? units.filter((unit) => unit.region_code === regionCode) : units,
    [units, branchCode, regionCode],
  );

  const agentParams = useMemo(() => ({
    category,
    ...(sourceMode === 'unassigned'
      ? { unassigned: true }
      : sourceMode === 'all' ? {}
        : sourceCode.length > 0 ? { manager_code: sourceCode } : {}),
    ...(transferMode === 'SELECTED' && agentSearch.trim() ? { search: agentSearch.trim() } : {}),
    ...(regionCode ? { region_code: regionCode } : {}),
    ...(branchCode ? { branch_code: branchCode } : {}),
    ...(unitCode ? { unit_code: unitCode } : {}),
    page: agentPage,
  }), [category, sourceMode, sourceCode, agentSearch, agentPage, transferMode, regionCode, branchCode, unitCode]);
  const canLoadAgents = !!user && (sourceMode === 'unassigned' || sourceMode === 'all' || sourceCode.trim().length > 0);
  const agentQuery = useGetRmAgents(agentParams, {
    query: {
      queryKey: identityQueryKey(getGetRmAgentsQueryKey(agentParams), identity),
      enabled: canLoadAgents,
      staleTime: 30_000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  });

  const mutationBusy = saveManagerMutation.isPending || previewMutation.isPending || commitMutation.isPending || lockRef.current;
  const selectedList = [...selectedCodes];
  const currentPageCodes = agentQuery.data?.items.map((agent) => agent.code) ?? [];
  const currentPageAllSelected = currentPageCodes.length > 0 && currentPageCodes.every((code) => selectedCodes.has(code));
  const totalAgentPages = Math.max(1, Math.ceil((agentQuery.data?.total ?? 0) / PAGE_SIZE));
  const allScopeCount = agentQuery.data?.total ?? 0;
  const sameSourceAndTarget = sourceMode !== 'unassigned' && !!sourceCode && sourceCode === targetCode;
  const sourceReady = sourceMode === 'unassigned' || sourceMode === 'all' || sourceCode.trim().length > 0;
  const hasOrgScope = !!(regionCode || branchCode || unitCode);
  const groupScopeRequired = sourceMode === 'all' && transferMode === 'ALL' && !hasOrgScope;
  const transferCountReady = transferMode === 'SELECTED'
    ? selectedCodes.size > 0 && selectedCodes.size <= MAX_SELECTED
    : allScopeCount > 0 && allScopeCount <= MAX_TRANSFER;
  const canPreviewTransfer = !!user && !mutationBusy && sourceReady && !!targetCode
    && targetManagers.some((manager) => manager.code === targetCode)
    && !sameSourceAndTarget && !groupScopeRequired && transferCountReady
    && transferReason.trim().length >= 3 && !agentQuery.isFetching;
  const previewExpired = !!previewResult && Date.parse(previewResult.expires_at) <= Date.now();
  const canCommitPreview = !!previewResult && previewResult.status === 'PREVIEW'
    && previewResult.changes > 0 && !previewExpired && !mutationBusy;

  function clearTransferPreview(clearError = true) {
    previewEpoch.current += 1;
    setPreviewResult(null);
    setConfirmTransfer(false);
    if (clearError) setTransferError('');
    setSuccessMessage('');
  }

  function changeCategory(next: Category) {
    if (mutationBusy || next === category) return;
    clearTransferPreview();
    setCategory(next);
    setSourceMode('unassigned');
    setSourceCode('');
    setTargetCode('');
    setSelectedCodes(new Set());
    setAgentSearch('');
    setAgentPage(1);
  }

  function changeSource(value: string) {
    if (mutationBusy) return;
    clearTransferPreview();
    setSelectedCodes(new Set());
    setAgentPage(1);
    if (value === UNASSIGNED_OPTION) {
      setSourceMode('unassigned'); setSourceCode('');
    } else if (value === ALL_AGENTS_OPTION) {
      setSourceMode('all'); setSourceCode('');
      setTransferMode('SELECTED');
    } else if (value === MANUAL_OPTION) {
      setSourceMode('manual'); setSourceCode('');
    } else if (value.startsWith(MANAGER_OPTION_PREFIX)) {
      setSourceMode('manager'); setSourceCode(value.slice(MANAGER_OPTION_PREFIX.length));
    } else {
      setSourceMode('manual'); setSourceCode(value);
    }
  }

  function resetOrgAssignmentScope() {
    clearTransferPreview();
    setSelectedCodes(new Set());
    setAgentPage(1);
  }

  function changeRegion(nextCode: string) {
    if (mutationBusy) return;
    let nextBranch = branchCode;
    let nextUnit = unitCode;
    if (nextCode && nextBranch) {
      const branch = branches.find((item) => item.code === nextBranch);
      if (!branch || branch.parent_code !== nextCode) {
        nextBranch = '';
        nextUnit = '';
      }
    }
    if (nextCode && nextUnit) {
      const unit = units.find((item) => item.code === nextUnit);
      if (!unit || unit.region_code !== nextCode) nextUnit = '';
    }
    resetOrgAssignmentScope();
    setRegionCode(nextCode);
    setBranchCode(nextBranch);
    setUnitCode(nextUnit);
  }

  function changeBranch(nextCode: string) {
    if (mutationBusy) return;
    let nextRegion = regionCode;
    let nextUnit = unitCode;
    const branch = nextCode ? branches.find((item) => item.code === nextCode) : undefined;
    if (!nextCode) nextUnit = '';
    else {
      const parentRegion = branch?.parent_code;
      if (parentRegion && regions.some((region) => region.code === parentRegion)) nextRegion = parentRegion;
      const unit = nextUnit ? units.find((item) => item.code === nextUnit) : undefined;
      if (unit && unit.parent_code !== nextCode) nextUnit = '';
    }
    resetOrgAssignmentScope();
    setRegionCode(nextRegion);
    setBranchCode(nextCode);
    setUnitCode(nextUnit);
  }

  function changeUnit(nextCode: string) {
    if (mutationBusy) return;
    let nextRegion = regionCode;
    let nextBranch = branchCode;
    if (nextCode) {
      const unit = units.find((item) => item.code === nextCode);
      const parentBranch = unit?.parent_code
        ? branches.find((branch) => branch.code === unit.parent_code)
        : undefined;
      if (parentBranch) {
        nextBranch = parentBranch.code;
        const parentRegion = parentBranch.parent_code;
        nextRegion = parentRegion && regions.some((region) => region.code === parentRegion) ? parentRegion : '';
      } else {
        nextBranch = '';
        const ancestorRegion = unit?.region_code;
        if (ancestorRegion && regions.some((region) => region.code === ancestorRegion)) nextRegion = ancestorRegion;
      }
    }
    resetOrgAssignmentScope();
    setRegionCode(nextRegion);
    setBranchCode(nextBranch);
    setUnitCode(nextCode);
  }

  function toggleSelected(code: string, selected: boolean) {
    if (mutationBusy) return;
    if (selected && !selectedCodes.has(code) && selectedCodes.size >= MAX_SELECTED) {
      setTransferError(`Select up to ${MAX_SELECTED} agents. Clear selections or use the all-from-source transfer mode.`);
      return;
    }
    setTransferError('');
    clearTransferPreview(false);
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (selected) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  function togglePageSelection() {
    if (mutationBusy) return;
    const next = new Set(selectedCodes);
    if (currentPageAllSelected) currentPageCodes.forEach((code) => next.delete(code));
    else {
      const additional = currentPageCodes.filter((code) => !next.has(code));
      if (next.size + additional.length > MAX_SELECTED) {
        setTransferError(`This page would exceed the ${MAX_SELECTED}-agent selection limit. Clear selections or use all-from-source mode.`);
        return;
      }
      additional.forEach((code) => next.add(code));
    }
    clearTransferPreview(false);
    setTransferError('');
    setSelectedCodes(next);
  }

  function openCreateManager() {
    if (mutationBusy) return;
    setManagerError('');
    setManagerForm({ code: '', name: '', class_code: '', category, year: currentYear, version: 0, reason: '', active: true });
    setManagerDialog(true);
  }

  function openEditManager(manager: RmManagerRecord) {
    if (mutationBusy) return;
    setManagerError('');
    setManagerForm({
      code: manager.code, name: manager.name, class_code: manager.class_code,
      category: manager.category, year: manager.year, version: manager.version, reason: '', active: manager.active,
    });
    setManagerDialog(true);
  }

  async function invalidateRelated() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetRmManagementQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetRmAgentsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetIntermediaryOptionsQueryKey() }),
      queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === 'string'
          && query.queryKey[0].startsWith('/api/intermediary/agents/'),
      }),
      queryClient.invalidateQueries({ queryKey: getListIntermediariesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetOrganisationQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetOrganisationAgentsQueryKey() }),
    ]);
  }

  async function saveManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!managerForm || lockRef.current || mutationBusy) return;
    if (!managerForm.code.trim() || !managerForm.name.trim() || !managerForm.class_code.trim() || managerForm.reason.trim().length < 3) {
      setManagerError('Enter a code, name, class code and a reason of at least 3 characters.');
      return;
    }
    if (managerForm.version === 0 && managers.some((manager) =>
      manager.code === managerForm.code && manager.category === managerForm.category && manager.year === managerForm.year,
    )) {
      setManagerError('This code, category and year already exist. Edit the existing year-specific record instead of adding a duplicate.');
      return;
    }
    lockRef.current = true;
    setManagerError('');
    try {
      const data: RmManagerInput = {
        code: managerForm.code,
        name: managerForm.name.trim(),
        class_code: managerForm.class_code.trim(),
        category: managerForm.category,
        year: managerForm.year,
        active: managerForm.active,
        version: managerForm.version,
        reason: managerForm.reason.trim(),
      };
      await saveManagerMutation.mutateAsync({ data });
      setManagerDialog(false);
      setManagerForm(null);
      setSuccessMessage(`Relationship manager ${managerForm.version === 0 ? 'added' : 'updated'} for ${categoryLabel(managerForm.category)}.`);
      await invalidateRelated();
    } catch (error) {
      setManagerError(getErrorText(error, 'Could not save this relationship manager. Review the fields and retry.'));
      if (isConflict(error)) await invalidateRelated();
    } finally { lockRef.current = false; }
  }

  async function confirmDeactivate() {
    const manager = deactivateManager;
    if (!manager || lockRef.current || mutationBusy) return;
    if (manager.is_current && manager.agent_count > 0) {
      setDeactivateError('This current manager still has assigned agents. Reassign those agents before deactivation.');
      return;
    }
    if (deactivateReason.trim().length < 3) {
      setDeactivateError('Enter a reason of at least 3 characters.');
      return;
    }
    lockRef.current = true;
    setDeactivateError('');
    try {
      await saveManagerMutation.mutateAsync({ data: {
        code: manager.code, name: manager.name, class_code: manager.class_code,
        category: manager.category, year: manager.year, active: false,
        version: manager.version, reason: deactivateReason.trim(),
      } });
      setDeactivateManager(null);
      setDeactivateReason('');
      setSuccessMessage(`${manager.name} was deactivated for ${categoryLabel(manager.category)}.`);
      await invalidateRelated();
    } catch (error) {
      setDeactivateError(getErrorText(error, 'Could not deactivate this relationship manager.'));
      if (isConflict(error)) await invalidateRelated();
    } finally { lockRef.current = false; }
  }

  async function requestTransferPreview() {
    if (!canPreviewTransfer || lockRef.current || groupScopeRequired) return;
    const epoch = previewEpoch.current;
    lockRef.current = true;
    setTransferError('');
    setSuccessMessage('');
    try {
      const result = await previewMutation.mutateAsync({ data: {
        category,
        mode: sourceMode === 'all' && transferMode === 'ALL' ? 'GROUP' : transferMode,
        ...(regionCode ? { region_code: regionCode } : {}),
        ...(branchCode ? { branch_code: branchCode } : {}),
        ...(unitCode ? { unit_code: unitCode } : {}),
        from_code: sourceMode === 'unassigned' || sourceMode === 'all' ? null : sourceCode,
        to_code: targetCode,
        agent_codes: transferMode === 'SELECTED' ? selectedList : [],
        reason: transferReason.trim(),
      } });
      if (epoch !== previewEpoch.current) return;
      if (result.category !== category || result.status !== 'PREVIEW') {
        setTransferError('The server returned an unexpected transfer preview. No assignments were changed; refresh the workspace and review again.');
        return;
      }
      if (result.total > MAX_TRANSFER) {
        setTransferError(`The server preview contains more than ${MAX_TRANSFER} agents. Narrow the source scope before previewing.`);
        return;
      }
      setPreviewResult(result);
      setConfirmTransfer(true);
    } catch (error) {
      if (epoch === previewEpoch.current) {
        setTransferError(getErrorText(error, 'Could not prepare this transfer. Refresh the source list and try again.'));
      }
    } finally { lockRef.current = false; }
  }

  async function commitTransfer() {
    if (!previewResult || !canCommitPreview || lockRef.current) return;
    if (Date.parse(previewResult.expires_at) <= Date.now()) {
      clearTransferPreview(false);
      setTransferError('This preview expired after 15 minutes. Build a new preview before committing.');
      return;
    }
    const id = previewResult.id;
    lockRef.current = true;
    setTransferError('');
    try {
      const result = await commitMutation.mutateAsync({ id });
      if (result.category !== category) {
        setPreviewResult(null);
        setConfirmTransfer(false);
        setTransferError('The server returned a different manager category than this transfer. The result was not treated as a successful update; refresh assignments before continuing.');
        await invalidateRelated();
        return;
      }
      if (result.status !== 'COMMITTED') {
        setPreviewResult(result);
        setConfirmTransfer(true);
        setTransferError('The server refreshed this transfer instead of committing it. No assignments changed; review this updated snapshot and confirm again.');
        return;
      }
      setPreviewResult(result);
      setConfirmTransfer(false);
      setSelectedCodes(new Set());
      setSuccessMessage(`${result.changes.toLocaleString()} ${categoryLabel(result.category).toLowerCase()} agent assignment${result.changes === 1 ? '' : 's'} updated.`);
      await invalidateRelated();
    } catch (error) {
      setConfirmTransfer(false);
      setPreviewResult(null);
      const conflict = isConflict(error);
      setTransferError(conflict
        ? 'Agents or assignments changed after preview. The preview was discarded; refresh the list and preview again. Nothing was retried automatically.'
        : getErrorText(error, 'The transfer did not complete. Preview the current assignments before trying again.'));
      if (conflict) {
        await queryClient.invalidateQueries({ queryKey: getGetRmAgentsQueryKey() });
        await queryClient.invalidateQueries({ queryKey: getGetRmManagementQueryKey() });
      }
    } finally { lockRef.current = false; }
  }

  const filteredManagers = categoryManagers.filter((manager) => {
    const text = `${manager.code} ${manager.name} ${manager.class_code} ${manager.year}`.toLowerCase();
    return text.includes(managerSearch.trim().toLowerCase());
  });

  return (
    <div className="rm-management min-h-[100dvh] bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><span>Intermediary Management</span><ChevronRight className="h-3 w-3" /><span>RM_RE Management</span></div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Retention operations · accountability workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Relationship managers <span className="font-medium text-muted-foreground">/ RM_RE</span></h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Maintain year-specific manager references and route Corporate or Retail agency relationships with a reviewed, version-checked transfer.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rm-button rm-quiet" onClick={() => { void snapshot.refetch(); }} disabled={snapshot.isFetching || mutationBusy} data-testid="button-refresh-rm">
              <RefreshCw className={`h-4 w-4 ${snapshot.isFetching ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" className="rm-button rm-primary" onClick={openCreateManager} disabled={mutationBusy} data-testid="button-add-rm"><Plus className="h-4 w-4" /> Add manager</button>
          </div>
        </header>

        {!user && <div role="alert" className="rm-alert rm-alert-error"><AlertCircle className="h-4 w-4" />Sign in with an authorized Retention Admin account to access this workspace.</div>}
        {snapshot.isError && <div role="alert" className="rm-alert rm-alert-error"><AlertCircle className="h-4 w-4" /><span>{getErrorText(snapshot.error, 'Relationship manager data could not be loaded.')}</span><button type="button" className="underline" onClick={() => void snapshot.refetch()}>Retry</button></div>}
        {successMessage && <div role="status" className="rm-alert rm-alert-success"><Check className="h-4 w-4" />{successMessage}<button type="button" aria-label="Dismiss success message" onClick={() => setSuccessMessage('')}><X className="h-4 w-4" /></button></div>}

        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(370px,.75fr)]">
          <section className="rm-card overflow-hidden" aria-labelledby="manager-list-title">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span><div><p className="rm-eyebrow">01 / Reference register</p><h2 id="manager-list-title" className="text-base font-semibold">Manager records · {snapshot.data?.year ?? '…'}</h2></div></div>
              <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Relationship manager category">
                {(['C', 'R'] as Category[]).map((value) => <button type="button" key={value} role="tab" aria-selected={category === value} onClick={() => changeCategory(value)} disabled={mutationBusy} className={`rounded-md px-3 py-2 text-xs font-bold ${category === value ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`tab-rm-${value}`}>{categoryLabel(value)} <span className="font-mono">{value}</span></button>)}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="rm-input w-full pl-9" value={managerSearch} onChange={(event) => setManagerSearch(event.target.value)} placeholder="Find by name or code" aria-label="Search relationship managers" data-testid="input-search-rm" /></label>
              <span className="text-xs text-muted-foreground">{filteredManagers.length} records · year-specific history retained</span>
            </div>
            {snapshot.isLoading ? <LoadingList /> : !filteredManagers.length ? <div className="rm-empty"><Building2 className="h-5 w-5" /><b>No manager records in this category</b><span>Add a Corporate or Retail reference to begin.</span></div> : (
              <div className="rm-table-scroll">
                <table className="rm-table">
                  <thead><tr><th>Manager / code</th><th>Class</th><th>Year</th><th>Assignments</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>{filteredManagers.map((manager) => <tr key={`${manager.category}-${manager.year}-${manager.code}`} data-testid={`row-rm-${manager.category}-${manager.year}-${manager.code}`}>
                    <td><b>{manager.name}</b><small className="font-mono">{manager.code}</small></td>
                    <td className="font-mono">{manager.class_code}</td>
                    <td className="font-mono">{manager.year}</td>
                    <td><span className="font-mono">{manager.agent_count.toLocaleString()}</span><small>{categoryLabel(manager.category)} agents</small></td>
                    <td><ManagerStatus manager={manager} snapshotYear={currentYear} /></td>
                    <td><div className="flex justify-end gap-1">
                      <button type="button" className="rm-icon-button" aria-label={`Edit ${manager.name}`} onClick={() => openEditManager(manager)} disabled={mutationBusy} data-testid={`button-edit-rm-${manager.code}`}><Pencil className="h-4 w-4" /></button>
                      {manager.active && <button type="button" className="rm-icon-button danger" aria-label={`Deactivate ${manager.name}`} title={manager.is_current && manager.agent_count > 0 ? 'Reassign agents before deactivation' : 'Deactivate manager'} onClick={() => { setDeactivateManager(manager); setDeactivateReason(''); setDeactivateError(''); }} disabled={mutationBusy || (manager.is_current && manager.agent_count > 0)} data-testid={`button-deactivate-rm-${manager.code}`}><Ban className="h-4 w-4" /></button>}
                    </div></td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-3 text-[10px] text-muted-foreground sm:px-5"><ShieldCheck className="h-4 w-4 text-primary" />Code, category and year form the versioned reference identity. Editing never replaces an agent identity.</div>
          </section>

          <section className="rm-card overflow-hidden" aria-labelledby="history-title">
            <div className="flex items-center justify-between border-b border-border p-4 sm:px-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileClock className="h-4 w-4" /></span><div><p className="rm-eyebrow">Audit record</p><h2 id="history-title" className="text-base font-semibold">Recent changes</h2></div></div><span className="text-[10px] text-muted-foreground">Latest 100</span></div>
            {snapshot.isLoading ? <LoadingList /> : !snapshot.data?.history.length ? <div className="rm-empty"><Clock3 className="h-5 w-5" /><b>No changes recorded</b><span>Manager updates and assignment moves appear here.</span></div> : (
              <div className="max-h-[460px] divide-y divide-border overflow-auto">
                {snapshot.data.history.map((entry) => <article key={entry.id} className="px-4 py-3 sm:px-5" data-testid={`history-rm-${entry.id}`}>
                  <div className="flex items-start justify-between gap-3"><b className="text-xs">{entry.description || entry.action}</b><time className="shrink-0 text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</time></div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{entry.reason}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{entry.actor} · {entry.action}</p>
                </article>)}
              </div>
            )}
          </section>
        </div>

        <section className="rm-card overflow-hidden" aria-labelledby="assign-title">
          <div className="border-b border-border p-4 sm:px-5 sm:py-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ArrowRightLeft className="h-4 w-4" /></span><div><p className="rm-eyebrow">02 / Agent accountability</p><h2 id="assign-title" className="text-base font-semibold">Assign or move agents</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Corporate and Retail assignments are managed independently. Transfers apply only to the selected category and previewed agent snapshot.</p></div></div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-2 text-[11px] font-semibold"><Users className="mr-1 inline h-3.5 w-3.5" />{selectedCodes.size} selected</span>
                {selectedCodes.size > 0 && <button type="button" className="rm-button rm-quiet !min-h-8 !px-3" disabled={mutationBusy} onClick={() => { clearTransferPreview(); setSelectedCodes(new Set()); }} data-testid="button-clear-rm-selection">Clear selection</button>}
              </div>
            </div>
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="rm-label"><span>Source manager scope</span><select className="rm-input" value={sourceMode === 'unassigned' ? UNASSIGNED_OPTION : sourceMode === 'all' ? ALL_AGENTS_OPTION : sourceMode === 'manual' ? MANUAL_OPTION : `${MANAGER_OPTION_PREFIX}${sourceCode}`} onChange={(event) => changeSource(event.target.value)} disabled={mutationBusy} data-testid="select-rm-source">
                <option value={UNASSIGNED_OPTION}>Unassigned</option>
                <option value={ALL_AGENTS_OPTION}>All agents · organisation scope for bulk</option>
                {sourceManagerChoices.map((manager) => <option key={manager.code} value={`${MANAGER_OPTION_PREFIX}${manager.code}`}>{manager.name} · {manager.code}{manager.year > currentYear ? ' · future' : !manager.active || !manager.is_current ? ` · ${manager.is_current ? 'inactive' : 'legacy'}` : ''}</option>)}
                <option value={MANUAL_OPTION}>Enter legacy / unmapped source code…</option>
              </select></label>
              {sourceMode === 'manual' && <label className="rm-label"><span>Exact source code</span><input className="rm-input font-mono" value={sourceCode} onChange={(event) => { clearTransferPreview(); setSourceCode(event.target.value); setSelectedCodes(new Set()); setAgentPage(1); }} disabled={mutationBusy} placeholder="Keep leading zeroes" data-testid="input-rm-source-code" /><small>No numeric conversion is applied.</small></label>}
              <label className="rm-label"><span>Move to current active manager</span><select className="rm-input" value={targetCode} onChange={(event) => { clearTransferPreview(); setTargetCode(event.target.value); }} disabled={mutationBusy || targetManagers.length === 0} data-testid="select-rm-target">
                <option value="">Select {categoryLabel(category)} manager</option>
                {targetManagers.map((manager) => <option key={`${manager.year}-${manager.code}`} value={manager.code}>{manager.name} · {manager.code}</option>)}
              </select><small>Only current, active {categoryLabel(category)} references can receive assignments.</small></label>
              <label className="rm-label"><span>Transfer scope</span><select className="rm-input" value={transferMode} onChange={(event) => { clearTransferPreview(); setTransferMode(event.target.value as TransferMode); setSelectedCodes(new Set()); setAgentPage(1); }} disabled={mutationBusy} data-testid="select-rm-transfer-mode">
                <option value="SELECTED">Selected agents only</option><option value="ALL">All agents in source scope</option>
              </select><small>{transferMode === 'ALL'
                ? sourceMode === 'all'
                  ? 'Group mode moves every agent in the selected organisation scope, regardless of current manager.'
                  : 'Unassigned includes only agents without a manager. Region, Branch and Unit filters narrow the source group.'
                : `Select up to ${MAX_SELECTED} agents across pages. Organisation filters narrow the list.`}</small></label>
              <label className="rm-label"><span>Region · optional</span><select className="rm-input" value={regionCode} onChange={(event) => changeRegion(event.target.value)} disabled={mutationBusy} data-testid="select-rm-region">
                <option value="">All regions</option>
                {regions.map((region) => <option key={region.code} value={region.code}>{region.name}{region.reference_only ? ' · Imported reference (not activated)' : ''}</option>)}
              </select></label>
              <label className="rm-label"><span>Branch · optional</span><select className="rm-input" value={branchCode} onChange={(event) => changeBranch(event.target.value)} disabled={mutationBusy} data-testid="select-rm-branch">
                <option value="">All branches</option>
                {branchChoices.map((branch) => <option key={branch.code} value={branch.code}>{branch.name}{branch.reference_only ? ' · Imported reference (not activated)' : ''}</option>)}
              </select></label>
              <label className="rm-label"><span>Unit · optional</span><select className="rm-input" value={unitCode} onChange={(event) => changeUnit(event.target.value)} disabled={mutationBusy} data-testid="select-rm-unit">
                <option value="">All Units</option>
                {unitChoices.map((unit) => <option key={unit.code} value={unit.code}>{unit.name}{unit.reference_only ? ' · Imported reference (not activated)' : ''}</option>)}
              </select></label>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Organisation choices only filter agent scope. Imported references are shown as not activated and are never activated or written by RM_RE. Selecting a known Branch or Unit fills its known parent filters.</p>
            {sourceMode === 'manager' && sourceCode && <p className="mt-3 text-[10px] text-muted-foreground">Source code is sent exactly as shown: <span className="font-mono font-bold text-foreground">{sourceCode}</span>. Inactive and historical source codes remain selectable.</p>}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="rm-input w-full pl-9" value={agentSearch} onChange={(event) => { clearTransferPreview(); setAgentSearch(event.target.value); setAgentPage(1); }} placeholder={transferMode === 'ALL' ? 'Search unavailable for all-source mode' : 'Search agent name or exact code'} aria-label="Search agents by name or code" disabled={mutationBusy || transferMode === 'ALL'} data-testid="input-search-rm-agents" /></label>
                <div className="flex items-center gap-3 text-xs text-muted-foreground"><span>{agentQuery.data?.total.toLocaleString() ?? '—'} agents in scope</span>{transferMode === 'SELECTED' && <button type="button" className="font-semibold text-primary hover:underline" onClick={togglePageSelection} disabled={mutationBusy || !currentPageCodes.length}>{currentPageAllSelected ? 'Clear page' : 'Select page'}</button>}</div>
              </div>
              {transferMode === 'ALL' && allScopeCount > MAX_TRANSFER && <div role="alert" className="rm-alert rm-alert-warn m-4"><AlertCircle className="h-4 w-4" />This scope contains {allScopeCount.toLocaleString()} agents. The maximum transfer is {MAX_TRANSFER.toLocaleString()}; narrow the source or use selected-agent mode.</div>}
              {sourceMode === 'manual' && !sourceCode.length && <div className="rm-empty"><UserRound className="h-5 w-5" /><b>Enter an exact legacy source code</b><span>Leading zeroes are preserved. The code can be outside the current manager catalog.</span></div>}
              {canLoadAgents && agentQuery.isLoading ? <LoadingList /> : agentQuery.isError ? <div role="alert" className="rm-alert rm-alert-error m-4"><AlertCircle className="h-4 w-4" />{getErrorText(agentQuery.error, 'Could not load agents for this source scope.')}<button type="button" className="underline" onClick={() => void agentQuery.refetch()}>Retry</button></div> : canLoadAgents && !agentQuery.data?.items.length ? <div className="rm-empty"><Users className="h-5 w-5" /><b>No agents found in this scope</b><span>Try another source manager, remove search text or review the unassigned scope.</span></div> : canLoadAgents && agentQuery.data && (
                <>
                  <div className="rm-table-scroll">
                    <table className="rm-table">
                      <thead><tr>{transferMode === 'SELECTED' && <th className="w-10"><span className="sr-only">Select</span></th>}<th>Agent</th><th>Current {categoryLabel(category)} manager</th><th>Record version</th></tr></thead>
                      <tbody>{agentQuery.data.items.map((agent) => <tr key={agent.code} data-testid={`row-rm-agent-${agent.code}`}>
                        {transferMode === 'SELECTED' && <td><input type="checkbox" aria-label={`Select ${agent.name}`} checked={selectedCodes.has(agent.code)} onChange={(event) => toggleSelected(agent.code, event.target.checked)} disabled={mutationBusy} data-testid={`checkbox-rm-agent-${agent.code}`} /></td>}
                        <td><b>{agent.name}</b><small className="font-mono">{agent.code}</small></td>
                        <td><SourceBadge code={agent.current_code} name={agent.current_name} /></td>
                        <td className="font-mono text-muted-foreground">{agent.version}</td>
                      </tr>)}</tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5"><span>Page {agentQuery.data.page} of {totalAgentPages} · {agentQuery.data.page_size} per page</span><div className="flex gap-1"><button type="button" className="rm-icon-button" aria-label="Previous agent page" onClick={() => { clearTransferPreview(); setAgentPage((page) => Math.max(1, page - 1)); }} disabled={mutationBusy || agentPage <= 1} data-testid="button-rm-prev-page"><ChevronLeft className="h-4 w-4" /></button><button type="button" className="rm-icon-button" aria-label="Next agent page" onClick={() => { clearTransferPreview(); setAgentPage((page) => Math.min(totalAgentPages, page + 1)); }} disabled={mutationBusy || agentPage >= totalAgentPages} data-testid="button-rm-next-page"><ChevronRight className="h-4 w-4" /></button></div></div>
                </>
              )}
              {!canLoadAgents && sourceMode !== 'manual' && <div className="rm-empty"><Users className="h-5 w-5" /><b>Select a source scope</b><span>Choose unassigned agents or a manager code to load its assigned agents.</span></div>}
            </div>

            <aside className="border-t border-border bg-muted/25 p-4 sm:p-5 xl:border-l xl:border-t-0">
              <p className="rm-eyebrow">Transfer authorization</p>
              <div className="mt-3 rounded-lg border border-border bg-card p-3"><div className="flex items-center gap-2 text-xs font-semibold"><ArrowRightLeft className="h-4 w-4 text-primary" />{transferMode === 'ALL' ? `${allScopeCount.toLocaleString()} ${sourceMode === 'all' ? 'agents in selected organisation group' : 'agents in source and organisation scope'}` : `${selectedCodes.size} selected agent${selectedCodes.size === 1 ? '' : 's'}`}</div><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{categoryLabel(category)} only. The other manager category is not changed.</p></div>
              <label className="rm-label mt-4"><span>Reason for this transfer <b className="text-destructive">*</b></span><textarea className="rm-input min-h-24 resize-y" value={transferReason} onChange={(event) => { clearTransferPreview(); setTransferReason(event.target.value); }} disabled={mutationBusy} maxLength={1000} placeholder="Record the operational reason for this reassignment" data-testid="textarea-rm-transfer-reason" /><small>Required, 3–1,000 characters. Any edit invalidates the preview.</small></label>
              {sameSourceAndTarget && <p className="rm-inline-error"><AlertCircle className="h-4 w-4" />Target must differ from the source manager.</p>}
              {transferMode === 'SELECTED' && selectedCodes.size > MAX_SELECTED && <p className="rm-inline-error"><AlertCircle className="h-4 w-4" />Selected-agent maximum is {MAX_SELECTED}.</p>}
              {groupScopeRequired && <p className="rm-inline-error"><AlertCircle className="h-4 w-4" />Choose a Region, Branch or Unit before assigning an entire organisation group.</p>}
              {transferMode === 'ALL' && allScopeCount > MAX_TRANSFER && <p className="rm-inline-error"><AlertCircle className="h-4 w-4" />Scope exceeds the {MAX_TRANSFER.toLocaleString()}-agent maximum.</p>}
              {transferError && <p className="rm-inline-error" role="alert"><AlertCircle className="h-4 w-4" />{transferError}</p>}
              <button type="button" className="rm-button rm-primary mt-4 w-full" onClick={() => void requestTransferPreview()} disabled={!canPreviewTransfer} data-testid="button-preview-rm-transfer">
                {previewMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{previewMutation.isPending ? 'Building preview…' : 'Preview assignment changes'}
              </button>
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Preview is a 15-minute server snapshot. Only agents listed in it can change after confirmation; conflicts require a fresh preview.</p>
            </aside>
          </div>
        </section>
      </div>

      <Dialog open={managerDialog} onOpenChange={(open) => { if (open || (!mutationBusy && !lockRef.current)) setManagerDialog(open); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-xl">
          <DialogHeader><p className="rm-eyebrow">{managerForm?.version === 0 ? 'New year-specific reference' : 'Versioned reference'}</p><DialogTitle>{managerForm?.version === 0 ? 'Add relationship manager' : 'Edit manager details'}</DialogTitle><DialogDescription>Relationship manager references are not MIS login accounts. Code, category and year are fixed on existing records.</DialogDescription></DialogHeader>
          {managerForm && <form className="space-y-4" onSubmit={(event) => void saveManager(event)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rm-label"><span>Exact manager code</span><input className="rm-input font-mono" value={managerForm.code} onChange={(event) => setManagerForm({ ...managerForm, code: event.target.value })} disabled={managerForm.version !== 0 || mutationBusy} maxLength={32} required placeholder="Leading zeroes are preserved" data-testid="input-rm-manager-code" /></label>
              <label className="rm-label"><span>Manager name</span><input className="rm-input" value={managerForm.name} onChange={(event) => setManagerForm({ ...managerForm, name: event.target.value })} disabled={mutationBusy} maxLength={200} required data-testid="input-rm-manager-name" /></label>
              <label className="rm-label"><span>Class code</span><input className="rm-input font-mono" value={managerForm.class_code} onChange={(event) => setManagerForm({ ...managerForm, class_code: event.target.value })} disabled={mutationBusy} maxLength={50} required data-testid="input-rm-class-code" /></label>
              <div className="rm-label"><span>Category · year</span><div className="flex min-h-10 items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary">{categoryLabel(managerForm.category)} ({managerForm.category})</span><span className="font-mono text-sm">{managerForm.year}</span></div></div>
            </div>
            <label className="rm-label"><span>Change reason <b className="text-destructive">*</b></span><textarea className="rm-input min-h-20 resize-y" value={managerForm.reason} onChange={(event) => setManagerForm({ ...managerForm, reason: event.target.value })} disabled={mutationBusy} minLength={3} maxLength={1000} required placeholder="Record why this reference is being added or changed" data-testid="textarea-rm-manager-reason" /></label>
            {managerError && <p className="rm-inline-error" role="alert"><AlertCircle className="h-4 w-4" />{managerError}</p>}
            <DialogFooter><button type="button" className="rm-button rm-quiet" onClick={() => setManagerDialog(false)} disabled={mutationBusy}>Cancel</button><button type="submit" className="rm-button rm-primary" disabled={mutationBusy || managerForm.reason.trim().length < 3}>{saveManagerMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saveManagerMutation.isPending ? 'Saving…' : 'Save reference'}</button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deactivateManager} onOpenChange={(open) => { if (open || (!mutationBusy && !lockRef.current)) setDeactivateManager(open ? deactivateManager : null); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
          {deactivateManager && <>
            <DialogHeader><p className="rm-eyebrow">Controlled deactivation</p><DialogTitle>Deactivate {deactivateManager.name}?</DialogTitle><DialogDescription>The year-specific reference remains in history. If it has current agent assignments, reassign them before deactivation.</DialogDescription></DialogHeader>
            <div className="rounded-lg bg-muted/50 p-3 text-xs"><b>{deactivateManager.name}</b><p className="mt-1 font-mono text-muted-foreground">{deactivateManager.code} · {categoryLabel(deactivateManager.category)} · {deactivateManager.year}</p><p className="mt-2 text-muted-foreground">{deactivateManager.agent_count.toLocaleString()} assigned agents</p></div>
            {deactivateManager.is_current && deactivateManager.agent_count > 0 && <p className="rm-inline-error"><AlertCircle className="h-4 w-4" />Reassign all agents before deactivating this current record.</p>}
            <label className="rm-label"><span>Deactivation reason <b className="text-destructive">*</b></span><textarea className="rm-input min-h-20 resize-y" value={deactivateReason} onChange={(event) => setDeactivateReason(event.target.value)} disabled={mutationBusy} maxLength={1000} placeholder="Explain why this manager reference is being deactivated" data-testid="textarea-rm-deactivate-reason" /></label>
            {deactivateError && <p className="rm-inline-error" role="alert"><AlertCircle className="h-4 w-4" />{deactivateError}</p>}
            <DialogFooter><button type="button" className="rm-button rm-quiet" onClick={() => setDeactivateManager(null)} disabled={mutationBusy}>Cancel</button><button type="button" className="rm-button rm-danger" onClick={() => void confirmDeactivate()} disabled={mutationBusy || (deactivateManager.is_current && deactivateManager.agent_count > 0) || deactivateReason.trim().length < 3}>{saveManagerMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}{saveManagerMutation.isPending ? 'Deactivating…' : 'Confirm deactivation'}</button></DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmTransfer && !!previewResult} onOpenChange={(open) => { if (open || (!commitMutation.isPending && !lockRef.current)) setConfirmTransfer(open); }}>
        {previewResult && <DialogContent className="w-[calc(100%-2rem)] max-w-4xl" onEscapeKeyDown={(event) => { if (commitMutation.isPending || lockRef.current) event.preventDefault(); }} onInteractOutside={(event) => { if (commitMutation.isPending || lockRef.current) event.preventDefault(); }}>
          <DialogHeader><p className="rm-eyebrow">Snapshot review · {previewResult.status}</p><DialogTitle>{previewResult.status === 'COMMITTED' ? 'Transfer complete' : 'Confirm agent reassignment'}</DialogTitle><DialogDescription>{categoryLabel(previewResult.category)} relationships only. {previewResult.changes.toLocaleString()} of {previewResult.total.toLocaleString()} snapshot agents will change to {previewResult.target_name}. Organisation scope: {previewResult.scope_label || 'No organisational filter'}.</DialogDescription></DialogHeader>
          {previewExpired && previewResult.status === 'PREVIEW' && <p className="rm-inline-error" role="alert"><Clock3 className="h-4 w-4" />This preview expired. Close it and build a new snapshot; expired previews cannot be committed.</p>}
          <div className="grid gap-2 sm:grid-cols-4"><div className="rounded-lg bg-muted/50 p-3"><small className="rm-eyebrow">Category</small><b className="mt-1 block text-sm">{categoryLabel(previewResult.category)}</b></div><div className="rounded-lg bg-muted/50 p-3"><small className="rm-eyebrow">Will change</small><b className="mt-1 block font-mono text-lg">{previewResult.changes.toLocaleString()}</b></div><div className="rounded-lg bg-muted/50 p-3"><small className="rm-eyebrow">Organisation scope</small><b className="mt-1 block text-xs">{previewResult.scope_label || 'No organisational filter'}</b></div><div className="rounded-lg bg-muted/50 p-3"><small className="rm-eyebrow">Preview expires</small><b className="mt-1 block text-xs">{new Date(previewResult.expires_at).toLocaleString()}</b></div></div>
          <div className="max-h-[42vh] overflow-auto rounded-lg border border-border">
            <table className="rm-table min-w-[620px]"><thead><tr><th>Agent</th><th>From</th><th>To</th><th>Result</th></tr></thead><tbody>{previewResult.items.slice(0, 100).map((item) => <tr key={item.code}><td><b>{item.name}</b><small className="font-mono">{item.code}</small></td><td><SourceBadge code={item.current_code} name={item.current_name} /></td><td>{item.will_change ? <span className="text-xs font-semibold text-primary">{previewResult.target_name}</span> : <span className="text-xs text-muted-foreground">No change</span>}</td><td><span className={`text-[10px] font-bold ${item.will_change ? 'text-emerald-700' : 'text-muted-foreground'}`}>{item.will_change ? 'WILL MOVE' : 'UNCHANGED'}</span></td></tr>)}</tbody></table>
            {previewResult.items.length > 100 && <p className="border-t border-border p-2 text-center text-[10px] text-muted-foreground">Showing first 100 of {previewResult.items.length.toLocaleString()} server-previewed agents. Commit is limited to this exact snapshot.</p>}
          </div>
          {transferError && <p className="rm-inline-error" role="alert"><AlertCircle className="h-4 w-4" />{transferError}</p>}
          <DialogFooter><button type="button" className="rm-button rm-quiet" onClick={() => setConfirmTransfer(false)} disabled={commitMutation.isPending}>Cancel</button>{previewResult.status === 'PREVIEW' && <button type="button" className="rm-button rm-primary" onClick={() => void commitTransfer()} disabled={!canCommitPreview} data-testid="button-commit-rm-transfer">{commitMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}{commitMutation.isPending ? 'Applying snapshot…' : `Confirm ${previewResult.changes.toLocaleString()} changes`}</button>}</DialogFooter>
          {commitMutation.isError && <p className="rm-inline-error" role="alert"><AlertCircle className="h-4 w-4" />{getErrorText(commitMutation.error, 'The transfer did not complete. Build a fresh preview.')}</p>}
        </DialogContent>}
      </Dialog>
    </div>
  );
}

