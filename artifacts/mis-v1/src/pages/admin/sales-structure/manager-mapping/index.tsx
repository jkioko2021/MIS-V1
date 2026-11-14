import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowRight, Check, ChevronDown, GitBranch,
  LoaderCircle, ShieldCheck, UserRound, UsersRound,
} from 'lucide-react';
import {
  getGetSalesCatalogsQueryKey,
  getGetSalesManagerMappingHistoryQueryKey,
  getGetSalesManagerMappingsQueryKey,
  useGetSalesManagerMappingHistory,
  useGetSalesManagerMappings,
  useSaveSalesManagerMapping,
} from '@workspace/api-client-react';
import type {
  SalesLevel, SalesMappingCatalog, SalesMappingOrganization, SalesManagerMappingInput, SalesManagerMappingSource,
} from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { SalesStructureGuard, SalesStructureHeader } from '../shared';
import { AssignmentHistory } from './assignment-history';
import { MoveDestinationPicker, MoveReviewPanel } from './move-panels';

const LEVELS: { catalog: SalesMappingCatalog; label: string; manager: string; level: string }[] = [
  { catalog: 'sales-regions', label: 'Region', manager: 'Regional manager', level: 'REGION' },
  { catalog: 'sales-branches', label: 'Branch', manager: 'Branch manager', level: 'BRANCH' },
  { catalog: 'sales-units', label: 'Unit', manager: 'Unit manager', level: 'UNIT' },
];

type AssignmentReviewSnapshot = {
  kind: 'assignment';
  input: SalesManagerMappingInput;
  organizationName: string;
  regionName: string;
  branchName: string | null;
  previousManagerName: string;
  nextManagerName: string;
  requiresReason: boolean;
};

type MoveSourceSnapshot = {
  moveFrom: SalesManagerMappingSource;
  employeeId: number;
  managerName: string;
  organizationName: string;
  regionName: string;
  branchName: string | null;
  path: string;
};

type MoveReviewSnapshot = {
  kind: 'move';
  input: SalesManagerMappingInput;
  sourceName: string;
  destinationName: string;
  destinationPath: string;
  managerName: string;
  destinationManagerName: string;
  destinationHasSameManager: boolean;
};

type MappingReviewSnapshot = AssignmentReviewSnapshot | MoveReviewSnapshot;

function toMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'The mapping could not be saved. Your choices are still here.';
}

function ManagerMappingWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const username = user?.username ?? '';
  const snapshotKey = [...getGetSalesManagerMappingsQueryKey(), username];
  const { data, isLoading, isError, error, refetch, isFetching } = useGetSalesManagerMappings({
    query: { queryKey: snapshotKey, staleTime: 30_000, refetchOnMount: 'always', refetchOnWindowFocus: true },
  });
  const [catalog, setCatalog] = useState<SalesMappingCatalog>('sales-regions');
  const [regionCode, setRegionCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState<MappingReviewSnapshot | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [moveSource, setMoveSource] = useState<MoveSourceSnapshot | null>(null);
  const [destinationRegionCode, setDestinationRegionCode] = useState('');
  const [destinationBranchCode, setDestinationBranchCode] = useState('');
  const [destinationCode, setDestinationCode] = useState('');
  const [moveSuccess, setMoveSuccess] = useState('');
  const [conflictReview, setConflictReview] = useState(false);
  const [formError, setFormError] = useState('');
  const saveMapping = useSaveSalesManagerMapping();

  const organizations = data?.organizations ?? [];
  const selected = organizations.find(item => item.catalog === catalog && item.code === organizationCode);
  const current = data?.assignments.find(item => item.catalog === catalog && item.organization_code === organizationCode);
  const destination = organizations.find(item => item.catalog === catalog && item.code === destinationCode);
  const destinationAssignment = data?.assignments.find(item => item.catalog === catalog && item.organization_code === destinationCode);
  const scopeRegions = useMemo(() => organizations.filter(item => item.level === 'REGION')
    .sort((a, b) => a.name.localeCompare(b.name)), [organizations]);
  const mappedNeedsAttention = useMemo(() => new Set((data?.assignments ?? [])
    .map(row => `${row.catalog}:${row.organization_code}`)), [data?.assignments]);
  const branches = useMemo(() => organizations.filter(item => item.level === 'BRANCH'
    && (item.region_code === regionCode || ((!item.eligible || !item.is_active) && mappedNeedsAttention.has(`${item.catalog}:${item.code}`))))
    .sort((a, b) => a.name.localeCompare(b.name)), [organizations, regionCode, mappedNeedsAttention]);
  const units = useMemo(() => organizations.filter(item => item.level === 'UNIT'
    && ((item.region_code === regionCode && item.branch_code === branchCode)
      || ((!item.eligible || !item.is_active) && mappedNeedsAttention.has(`${item.catalog}:${item.code}`))))
    .sort((a, b) => a.name.localeCompare(b.name)), [organizations, regionCode, branchCode, mappedNeedsAttention]);
  const level = LEVELS.find(item => item.catalog === catalog)!;
  const historyParams = { catalog, organization_code: organizationCode };
  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useGetSalesManagerMappingHistory(
    historyParams,
    { query: { queryKey: [...getGetSalesManagerMappingHistoryQueryKey(historyParams), username], enabled: !!selected, staleTime: 30_000, refetchOnMount: 'always', refetchOnWindowFocus: true } },
  );
  const categoryEligibleUsers = useMemo(() => (data?.users ?? []).filter(person =>
    !(person.inactive_manager_categories ?? []).includes(level.level as SalesLevel),
  ), [data?.users, level.level]);
  const staff = useMemo(() => categoryEligibleUsers.filter(person =>
    `${person.employee_name} ${person.username}`.toLowerCase().includes(search.trim().toLowerCase()),
  ).sort((a, b) => a.employee_name.localeCompare(b.employee_name)), [categoryEligibleUsers, search]);
  const existingManagerId = current?.employee_id == null ? '' : String(current.employee_id);
  const hasChanged = employeeId !== existingManagerId;
  const needsReason = current?.employee_id != null && employeeId !== String(current.employee_id);
  const isEligibleTarget = !employeeId || (selected?.eligible === true
    && categoryEligibleUsers.some(person => String(person.employee_id) === employeeId));
  const frozenSourceOrganization = moveSource
    ? organizations.find(item => item.catalog === catalog && item.code === moveSource.moveFrom.organization_code)
    : undefined;
  const frozenSourceAssignment = moveSource
    ? data?.assignments.find(item => item.catalog === catalog && item.organization_code === moveSource.moveFrom.organization_code)
    : undefined;
  const moveSourceChanged = !!moveSource && (
    !frozenSourceOrganization
    || !frozenSourceAssignment
    || frozenSourceAssignment.version !== moveSource.moveFrom.expected_version
    || frozenSourceAssignment.employee_id !== moveSource.employeeId
    || frozenSourceOrganization.hierarchy_version !== moveSource.moveFrom.hierarchy_version
  );
  const moveManagerStillEligible = !!moveSource && categoryEligibleUsers.some(person => person.employee_id === moveSource.employeeId);
  const destinationPath = destination
    ? [destination.region_name ?? destination.name, destination.branch_name, destination.level === 'BRANCH' ? destination.name : null].filter(Boolean).join(' / ')
    : '';
  const moveSourcePath = moveSource?.path ?? '';

  const clearSelection = () => {
    setOrganizationCode('');
    setEmployeeId('');
    setNote('');
    setReviewOpen(false);
    setReviewSnapshot(null);
    setMoveMode(false);
    setMoveSource(null);
    setDestinationRegionCode('');
    setDestinationBranchCode('');
    setDestinationCode('');
    setConflictReview(false);
    setFormError('');
    setMoveSuccess('');
  };
  const changeCatalog = (next: SalesMappingCatalog) => {
    clearSelection();
    setRegionCode('');
    setBranchCode('');
    setCatalog(next);
    setMoveSuccess('');
  };
  const chooseRegion = (code: string) => {
    setRegionCode(code);
    setBranchCode('');
    if (catalog === 'sales-regions') {
      setOrganizationCode(code);
      const assignment = data?.assignments.find(row => row.catalog === 'sales-regions' && row.organization_code === code);
      setEmployeeId(assignment?.employee_id == null ? '' : String(assignment.employee_id));
      setReviewOpen(false);
      setReviewSnapshot(null);
      setConflictReview(false);
      setNote('');
      setFormError('');
      setMoveSuccess('');
    } else clearSelection();
  };
  const chooseBranch = (code: string) => {
    const branch = organizations.find(item => item.catalog === 'sales-branches' && item.code === code);
    setBranchCode(code);
    setRegionCode(branch?.region_code ?? '');
    if (catalog === 'sales-branches') {
      setOrganizationCode(code);
      const assignment = data?.assignments.find(row => row.catalog === catalog && row.organization_code === code);
      setEmployeeId(assignment?.employee_id == null ? '' : String(assignment.employee_id));
      setReviewOpen(false);
      setReviewSnapshot(null);
      setConflictReview(false);
      setNote('');
      setFormError('');
      setMoveSuccess('');
    } else clearSelection();
  };
  const chooseOrganization = (code: string) => {
    const unit = organizations.find(item => item.catalog === 'sales-units' && item.code === code);
    setRegionCode(unit?.region_code ?? regionCode);
    setBranchCode(unit?.branch_code ?? '');
    setOrganizationCode(code);
    const assignment = data?.assignments.find(row => row.catalog === catalog && row.organization_code === code);
    setEmployeeId(assignment?.employee_id == null ? '' : String(assignment.employee_id));
    setNote('');
    setReviewOpen(false);
    setReviewSnapshot(null);
    setConflictReview(false);
    setFormError('');
    setMoveSuccess('');
  };

  const startMove = () => {
    if (!selected || !current || current.employee_id == null) return;
    const activeManager = categoryEligibleUsers.find(person => person.employee_id === current.employee_id);
    if (!activeManager) {
      setFormError('This manager is not in the active eligible MIS user list and cannot be moved.');
      return;
    }
    setMoveSource({
      moveFrom: {
        organization_code: selected.code,
        expected_version: current.version,
        hierarchy_version: selected.hierarchy_version,
      },
      employeeId: activeManager.employee_id,
      managerName: activeManager.employee_name,
      organizationName: selected.name,
      regionName: selected.region_name ?? selected.name,
      branchName: selected.branch_name ?? (selected.level === 'BRANCH' ? selected.name : null),
      path: [selected.region_name ?? selected.name, selected.branch_name, selected.level === 'BRANCH' ? selected.name : selected.level === 'UNIT' ? selected.name : null].filter(Boolean).join(' / '),
    });
    setMoveMode(true);
    setDestinationRegionCode('');
    setDestinationBranchCode('');
    setDestinationCode('');
    setReviewSnapshot(null);
    setReviewOpen(false);
    setNote('');
    setFormError('');
    setConflictReview(false);
    setMoveSuccess('');
  };

  const cancelMove = () => {
    setMoveMode(false);
    setMoveSource(null);
    setDestinationRegionCode('');
    setDestinationBranchCode('');
    setDestinationCode('');
    setReviewSnapshot(null);
    setReviewOpen(false);
    setNote('');
    setFormError('');
    setConflictReview(false);
  };

  const reviewMove = () => {
    if (!moveSource || !destination || moveSourceChanged || !moveManagerStillEligible) return;
    const input: SalesManagerMappingInput = {
      catalog,
      organization_code: destination.code,
      employee_id: moveSource.employeeId,
      expected_version: destinationAssignment?.version ?? 0,
      hierarchy_version: destination.hierarchy_version,
      note: note.trim(),
      move_from: moveSource.moveFrom,
    };
    setReviewSnapshot({
      kind: 'move',
      input,
      sourceName: moveSource.organizationName,
      destinationName: destination.name,
      destinationPath,
      managerName: moveSource.managerName,
      destinationManagerName: destinationAssignment?.employee_id == null
        ? 'Not assigned'
        : destinationAssignment.employee_name ?? 'Current manager unavailable',
      destinationHasSameManager: destinationAssignment?.employee_id === moveSource.employeeId,
    });
    setReviewOpen(true);
    setConflictReview(false);
    setFormError('');
  };

  const isConflict = (value: unknown) => {
    if (!value || typeof value !== 'object') return false;
    const record = value as { status?: number; response?: { status?: number }; message?: string };
    return record.status === 409 || record.response?.status === 409 || /409|stale|changed since/i.test(record.message ?? '');
  };
  const refreshForConflict = async () => {
    await Promise.all([refetch(), refetchHistory()]);
    setConflictReview(true);
    setReviewOpen(false);
    setReviewSnapshot(null);
    setFormError('The organization or assignment changed since review. Current values have been refreshed. Review the change again before confirming.');
  };
  const submit = () => {
    const frozen = reviewSnapshot;
    if (!frozen) return;
    if ((frozen.kind === 'move' || frozen.requiresReason) && (frozen.input.note?.trim().length ?? 0) < 3) {
      setFormError('Enter a reason of at least 3 characters for replacing or unassigning this manager.');
      return;
    }
    setFormError('');
    saveMapping.mutate({ data: frozen.input }, {
      onSuccess: async (assignment) => {
        queryClient.setQueryData(snapshotKey, (old: typeof data | undefined) => {
          if (!old) return old;
          if (frozen.kind === 'move' && frozen.input.move_from) {
            const sourceRow = old.assignments.find(row => row.catalog === frozen.input.catalog
              && row.organization_code === frozen.input.move_from?.organization_code);
            const assignments = old.assignments.filter(row => !(
              row.catalog === assignment.catalog
              && (row.organization_code === assignment.organization_code
                || row.organization_code === frozen.input.move_from?.organization_code)
            ));
            if (sourceRow) assignments.push({
              ...sourceRow,
              employee_id: null,
              employee_name: null,
              user_eligible: false,
              version: frozen.input.move_from.expected_version + 1,
              updated_at: assignment.updated_at,
              updated_by: assignment.updated_by,
            });
            assignments.push(assignment);
            return { ...old, assignments };
          }
          return {
            ...old,
            assignments: [
              ...old.assignments.filter(row => !(row.catalog === assignment.catalog && row.organization_code === assignment.organization_code)),
              assignment,
            ],
          };
        });
        setReviewOpen(false);
        setReviewSnapshot(null);
        setConflictReview(false);
        setNote('');
        if (frozen.kind === 'move') {
          setMoveSuccess(`${frozen.managerName} was moved to ${frozen.destinationName}. ${frozen.sourceName} is now unassigned.`);
          setEmployeeId('');
          setMoveMode(false);
          setMoveSource(null);
          setDestinationRegionCode('');
          setDestinationBranchCode('');
          setDestinationCode('');
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetSalesManagerMappingsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesManagerMappingHistoryQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesCatalogsQueryKey() }),
        ]);
      },
      onError: async (saveError) => {
        if (isConflict(saveError)) await refreshForConflict();
        else setFormError(toMessage(saveError));
      },
    });
  };

  if (isLoading) return <div className="space-y-4"><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>;
  if (isError || !data) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Manager mappings unavailable</AlertTitle><AlertDescription className="flex items-center justify-between gap-3">{toMessage(error)}<Button variant="outline" onClick={() => refetch()} data-testid="button-retry-mappings">Retry</Button></AlertDescription></Alert>;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#d8e2dc] bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#477665]"><GitBranch className="h-4 w-4" />Accountable ownership</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#173c34]">Map an MIS manager to a team</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Choose a team by name, verify its place in the hierarchy, then assign one active MIS user. A manager can oversee multiple teams.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-[#f4f7f4] px-3 py-2 text-xs text-[#45665a]"><ShieldCheck className="h-4 w-4" />Source records remain unchanged</div>
        </div>
        {moveSuccess && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-950" role="status" data-testid="status-manager-moved">{moveSuccess}</div>}
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Team level">
          {LEVELS.map(item => <button key={item.catalog} type="button" role="tab" aria-selected={catalog === item.catalog}
            disabled={saveMapping.isPending || moveMode} onClick={() => changeCatalog(item.catalog)} className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${catalog === item.catalog ? 'border-[#1f5849] bg-[#1f5849] text-white' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}
            data-testid={`tab-mapping-${item.level.toLowerCase()}`}>{item.label}</button>)}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <HierarchySelect label="Region" value={regionCode} options={scopeRegions} onChange={chooseRegion} placeholder="Choose a region" disabled={saveMapping.isPending || moveMode} />
          {catalog !== 'sales-regions' && <HierarchySelect label="Branch" value={branchCode} options={branches} onChange={chooseBranch} placeholder={regionCode ? 'Choose a branch' : 'Choose a branch or mapped team needing attention'} disabled={saveMapping.isPending || moveMode || (!regionCode && branches.length === 0)} />}
          {catalog === 'sales-units' && <HierarchySelect label="Unit" value={organizationCode} options={units} onChange={chooseOrganization} placeholder={branchCode ? 'Choose a unit' : 'Choose a unit or mapped team needing attention'} disabled={saveMapping.isPending || moveMode || (!branchCode && units.length === 0)} />}
          {catalog === 'sales-branches' && <div className="rounded-lg border border-dashed border-[#cad8d0] bg-[#f7f9f7] p-3 text-sm text-muted-foreground"><span className="block text-[11px] font-semibold uppercase tracking-wider">Next level</span><span className="mt-1 block">Select a branch to continue.</span></div>}
          {catalog === 'sales-regions' && <div className="rounded-lg border border-dashed border-[#cad8d0] bg-[#f7f9f7] p-3 text-sm text-muted-foreground"><span className="block text-[11px] font-semibold uppercase tracking-wider">Hierarchy</span><span className="mt-1 block">Region manager ownership is independent of lower-level mappings.</span></div>}
        </div>
        {selected && <div className="mt-5 grid gap-4 rounded-xl border border-[#dce5df] bg-[#f5f8f5] p-4 sm:grid-cols-[1fr_auto] sm:items-center" data-testid="selected-organization">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#638073]">Confirmed hierarchy</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#203f35]">
              {selected.region_name ?? selected.name}
              {selected.level !== 'REGION' && <><ChevronDown className="h-3.5 w-3.5 rotate-[-90deg] text-[#8ba398]" />{selected.branch_name ?? (selected.level === 'BRANCH' ? selected.name : '')}</>}
              {selected.level === 'UNIT' && <><ChevronDown className="h-3.5 w-3.5 rotate-[-90deg] text-[#8ba398]" />{selected.name}</>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{selected.source_reference ? 'Imported organization · read-only' : 'Organization record'} · {selected.is_active ? 'Active' : 'Inactive'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.eligible ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Hierarchy valid</Badge> : <Badge variant="destructive">Needs attention</Badge>}
            {!!selected.issues.length && <Badge variant="outline">{selected.issues.length} issue{selected.issues.length === 1 ? '' : 's'}</Badge>}
          </div>
          {!!selected.issues.length && <div className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">{selected.issues.join(' · ')}</div>}
        </div>}
      </section>

      {selected && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#638073]">{level.manager}</p><h3 className="mt-1 text-lg font-semibold">{selected.name}</h3><p className="mt-1 text-sm text-muted-foreground">{level.label} ownership</p></div>
              {current?.employee_id != null ? <Badge className="bg-[#e8f2ec] text-[#245744] hover:bg-[#e8f2ec]">Assigned</Badge> : <Badge variant="outline">Not assigned</Badge>}
          </div>
          <div className="mt-5 rounded-lg border bg-[#f8faf8] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e3eee7] text-[#2d654f]"><UserRound className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Current manager</p><p className="truncate text-sm font-semibold" data-testid="current-manager">{current?.employee_id == null ? 'Not assigned' : current.employee_name ?? 'Current manager unavailable'}</p>{current?.employee_id != null && !categoryEligibleUsers.some(person => person.employee_id === current.employee_id) && <p className="mt-1 text-xs text-amber-800">This manager is unavailable for this category. Choose an active eligible MIS user to assign a replacement.</p>}</div>
              {current?.employee_id != null && <span className="text-xs text-muted-foreground">v{current.version}</span>}
            </div>
          </div>
          {current?.employee_id != null && !moveMode && <div className="mt-3 flex justify-end">
            <Button variant="outline" disabled={saveMapping.isPending || !categoryEligibleUsers.some(person => person.employee_id === current.employee_id)}
              onClick={startMove} className="gap-2" data-testid="button-start-manager-move">
              <ArrowRight className="h-4 w-4" />Move manager to another {level.label.toLowerCase()}
            </Button>
          </div>}
          {current?.employee_id != null && !categoryEligibleUsers.some(person => person.employee_id === current.employee_id) && !moveMode && <p className="mt-2 text-right text-xs text-amber-800">Only an active manager eligible for this category can be moved.</p>}

          {!moveMode && <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between"><Label htmlFor="mapping-manager">Select active MIS user</Label><span className="text-xs text-muted-foreground">{staff.length} shown</span></div>
            <Input aria-label="Filter users" placeholder="Find by name or username" value={search} disabled={saveMapping.isPending} onChange={event => setSearch(event.target.value)} data-testid="input-manager-search" />
            <select id="mapping-manager" value={employeeId} disabled={saveMapping.isPending} onChange={event => { setEmployeeId(event.target.value); setFormError(''); setReviewSnapshot(null); setReviewOpen(false); }}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" data-testid="select-mapping-manager">
              <option value="">Not assigned — unassign current manager</option>
              {current?.employee_id != null && !categoryEligibleUsers.some(person => person.employee_id === current.employee_id) && <option value={String(current.employee_id)}>{current.employee_name ?? 'Current manager'} · unavailable for this category</option>}
              {staff.map(person => <option key={person.employee_id} value={person.employee_id}>{person.employee_name} · {person.username}</option>)}
            </select>
            {current?.employee_id != null && <p className="text-xs leading-5 text-muted-foreground">Replacing or removing the current manager requires a reason. The same MIS user may be assigned to other teams.</p>}
            {(selected.source_reference || !selected.eligible || !selected.is_active) && <p className="rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-950">{selected.source_reference ? 'This imported organization cannot be edited. Manager ownership can still be managed here; the source record is not changed. ' : ''}{selected.issues.join(' ') || (!selected.eligible || !selected.is_active ? 'Only eligible, active organizations can receive a manager mapping.' : '')}</p>}
          </div>}
          {!moveMode && needsReason && <div className="mt-4 space-y-2"><Label htmlFor="mapping-reason">Reason <span className="text-destructive">required</span></Label><textarea id="mapping-reason" value={note} onChange={event => setNote(event.target.value)} disabled={saveMapping.isPending} rows={3} maxLength={1000} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" placeholder="Explain why ownership is changing or ending." data-testid="textarea-mapping-reason" /><p className="text-right text-xs text-muted-foreground">{note.trim().length}/1000 characters · at least 3 required</p></div>}
          {moveMode && moveSource && <div className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-[#cbdcd1] bg-[#f6f9f6] p-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#638073]">Moving assigned manager</p><p className="mt-1 text-sm font-semibold">{moveSource.managerName}</p><p className="mt-1 text-xs text-muted-foreground">Origin: {moveSource.organizationName} · will be cleared</p></div>
              {moveSourceChanged && <Badge variant="destructive">Source changed</Badge>}
            </div>
            {moveSourceChanged && <Alert variant="destructive" data-testid="alert-move-source-changed"><AlertTriangle className="h-4 w-4" /><AlertTitle>Choose the source again</AlertTitle><AlertDescription>The source manager assignment or hierarchy changed after you started this move. This move is blocked; restart from the current team assignment to explicitly select a source again.</AlertDescription><Button variant="outline" className="mt-3" disabled={saveMapping.isPending} onClick={cancelMove} data-testid="button-restart-move-source">Choose source again</Button></Alert>}
            {!moveSourceChanged && !moveManagerStillEligible && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Manager is no longer eligible</AlertTitle><AlertDescription>The source manager must remain an active eligible MIS user to move.</AlertDescription></Alert>}
            <MoveDestinationPicker
              catalog={catalog}
              organizations={organizations}
              regionCode={destinationRegionCode}
              branchCode={destinationBranchCode}
              organizationCode={destinationCode}
              sourceCode={moveSource.moveFrom.organization_code}
              destination={destination}
              pending={saveMapping.isPending}
              onRegionChange={code => { setDestinationRegionCode(code); setDestinationBranchCode(''); setDestinationCode(''); setReviewSnapshot(null); setReviewOpen(false); }}
              onBranchChange={code => { setDestinationBranchCode(code); setDestinationCode(''); setReviewSnapshot(null); setReviewOpen(false); }}
              onOrganizationChange={code => { setDestinationCode(code); setReviewSnapshot(null); setReviewOpen(false); }}
            />
            {destination && destination.issues.length > 0 && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">{destination.issues.join(' ')}</p>}
            <div className="space-y-2"><Label htmlFor="move-reason">Reason <span className="text-destructive">required for every move</span></Label><textarea id="move-reason" value={note} onChange={event => { setNote(event.target.value); setReviewSnapshot(null); setReviewOpen(false); }} disabled={saveMapping.isPending} rows={3} maxLength={1000} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" placeholder="Explain why this manager is moving to another team." data-testid="textarea-move-reason" /><p className="text-right text-xs text-muted-foreground">{note.trim().length}/1000 characters · at least 3 required</p></div>
          </div>}
          {formError && <Alert variant={conflictReview ? 'default' : 'destructive'} className="mt-4" data-testid="alert-mapping-error"><AlertTriangle className="h-4 w-4" /><AlertTitle>{conflictReview ? 'Review required' : 'Action needed'}</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}
          {!moveMode && <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={saveMapping.isPending} onClick={() => { setEmployeeId(existingManagerId); setNote(''); setFormError(''); setReviewOpen(false); setReviewSnapshot(null); }} data-testid="button-reset-mapping">Reset</Button>
            <Button className="gap-2 bg-[#1f5849] hover:bg-[#174536]" disabled={saveMapping.isPending || !hasChanged || !isEligibleTarget}
              onClick={() => {
                if (!selected) return;
                const chosen = categoryEligibleUsers.find(person => String(person.employee_id) === employeeId);
                const requiresReason = needsReason;
                const input: SalesManagerMappingInput = {
                  catalog,
                  organization_code: selected.code,
                  employee_id: employeeId ? Number(employeeId) : null,
                  expected_version: current?.version ?? 0,
                  hierarchy_version: selected.hierarchy_version,
                  ...(requiresReason ? { note: note.trim() } : {}),
                };
                setReviewSnapshot({
                  kind: 'assignment',
                  input,
                  organizationName: selected.name,
                  regionName: selected.region_name ?? selected.name,
                  branchName: selected.branch_name ?? (selected.level === 'BRANCH' ? selected.name : null),
                  previousManagerName: current?.employee_id == null ? 'Not assigned' : current.employee_name ?? 'Current manager unavailable',
                  nextManagerName: employeeId ? chosen?.employee_name ?? 'Selected MIS user unavailable' : 'Not assigned',
                  requiresReason,
                });
                setConflictReview(false);
                setFormError('');
                setReviewOpen(true);
              }} data-testid="button-review-mapping">
              Review change <ArrowRight className="h-4 w-4" />
            </Button>
          </div>}
          {moveMode && <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={saveMapping.isPending} onClick={cancelMove} data-testid="button-cancel-move">Cancel move</Button>
            <Button className="gap-2 bg-[#1f5849] hover:bg-[#174536]"
              disabled={saveMapping.isPending || moveSourceChanged || !moveManagerStillEligible || !destination || destination.code === moveSource?.moveFrom.organization_code || !destination.eligible || !destination.is_active}
              onClick={reviewMove} data-testid="button-review-move">Review move <ArrowRight className="h-4 w-4" /></Button>
          </div>}
          {reviewOpen && reviewSnapshot?.kind === 'assignment' && !moveSourceChanged && <MappingReview snapshot={reviewSnapshot} pending={saveMapping.isPending}
            confirmDisabled={reviewSnapshot.requiresReason && (reviewSnapshot.input.note?.trim().length ?? 0) < 3}
            onBack={() => setReviewOpen(false)} onConfirm={submit} />}
          {reviewOpen && reviewSnapshot?.kind === 'move' && !moveSourceChanged && <MoveReviewPanel
            input={reviewSnapshot.input}
            sourceName={reviewSnapshot.sourceName}
            sourcePath={moveSourcePath}
            destinationName={reviewSnapshot.destinationName}
            destinationPath={reviewSnapshot.destinationPath}
            managerName={reviewSnapshot.managerName}
            destinationManagerName={reviewSnapshot.destinationManagerName}
            destinationHasSameManager={reviewSnapshot.destinationHasSameManager}
            confirmDisabled={!moveManagerStillEligible}
            pending={saveMapping.isPending}
            onBack={() => setReviewOpen(false)}
            onConfirm={submit}
          />}
        </section>

        <AssignmentHistory events={history} loading={historyLoading} error={historyError} onRefresh={() => refetchHistory()} />
      </div>}
      {!selected && <div className="rounded-xl border border-dashed border-[#cbd8d0] bg-[#f7f9f7] p-8 text-center"><UsersRound className="mx-auto h-7 w-7 text-[#648575]" /><p className="mt-3 font-medium text-[#234b3c]">Choose a team to view ownership</p><p className="mt-1 text-sm text-muted-foreground">Selections follow the organization hierarchy and display names rather than internal codes.</p></div>}
      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>{data.assignments.length} assignment records · including unassigned history rows</span><span className="inline-flex items-center gap-1">{isFetching ? <LoaderCircle className="h-3 w-3 animate-spin" /> : null}Live data</span></div>
    </div>
  );
}

function HierarchySelect({ label, value, options, onChange, placeholder, disabled }: {
  label: string; value: string; options: SalesMappingOrganization[]; onChange: (value: string) => void; placeholder: string; disabled?: boolean;
}) {
  return <div className="space-y-1.5"><Label>{label}</Label><select value={value} onChange={event => onChange(event.target.value)} disabled={disabled}
    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-55" data-testid={`select-hierarchy-${label.toLowerCase()}`}>
    <option value="">{placeholder}</option>
    {options.map(item => <option key={item.code} value={item.code}>{!item.eligible || !item.is_active ? 'Needs attention · ' : ''}{item.name}</option>)}
  </select></div>;
}

function MappingReview({ snapshot, pending, confirmDisabled, onBack, onConfirm }: {
  snapshot: AssignmentReviewSnapshot;
  pending: boolean;
  confirmDisabled: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-[#9dbdaf] bg-[#f0f6f1] p-4" data-testid="mapping-review">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#214a3a]"><ShieldCheck className="h-4 w-4" />Review before confirming</div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="rounded-md border bg-card p-3"><span className="block text-xs text-muted-foreground">Team</span><strong>{snapshot.organizationName}</strong><span className="block text-xs text-muted-foreground">{snapshot.regionName}{snapshot.branchName ? ` / ${snapshot.branchName}` : ''}</span></div>
        <ArrowRight className="hidden h-4 w-4 text-[#668878] sm:block" />
        <div className="rounded-md border bg-card p-3"><span className="block text-xs text-muted-foreground">Current manager</span><strong>{snapshot.previousManagerName}</strong><span className="mt-2 block text-xs text-muted-foreground">After confirmation</span><strong>{snapshot.nextManagerName}</strong>{snapshot.requiresReason && <span className="mt-1 block text-xs text-muted-foreground">Reason: {snapshot.input.note || 'Required before confirmation'}</span>}</div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">This review captures the hierarchy and assignment version now. If either changes before confirmation, the save will be rejected and require a fresh review.</p>
      <div className="mt-3 flex justify-end gap-2"><Button variant="outline" disabled={pending} onClick={onBack} data-testid="button-edit-review">Back to edit</Button><Button onClick={onConfirm} disabled={pending || confirmDisabled} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-confirm-mapping">{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />Confirm mapping</>}</Button></div>
    </div>
  );
}

export default function ManagerMappingPage() {
  return <SalesStructureGuard><SalesStructureHeader eyebrow="Medical Structure · ownership" title="Manager Mapping" description="Maintain accountable manager ownership across regions, branches and units. Changes are recorded in an auditable history."><Badge variant="outline" className="border-[#bfd1c7] bg-white/60 text-[#315e4e]">Admin workspace</Badge></SalesStructureHeader><div className="mx-auto max-w-[1480px] px-4 pb-12 sm:px-6 lg:px-8"><ManagerMappingWorkspace /></div></SalesStructureGuard>;
}
