import { ArrowRight, Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { SalesMappingCatalog, SalesMappingOrganization, SalesManagerMappingInput } from '@workspace/api-client-react';

export function MoveDestinationPicker({
  catalog,
  organizations,
  regionCode,
  branchCode,
  organizationCode,
  sourceCode,
  destination,
  pending,
  onRegionChange,
  onBranchChange,
  onOrganizationChange,
}: {
  catalog: SalesMappingCatalog;
  organizations: SalesMappingOrganization[];
  regionCode: string;
  branchCode: string;
  organizationCode: string;
  sourceCode: string;
  destination?: SalesMappingOrganization;
  pending: boolean;
  onRegionChange: (code: string) => void;
  onBranchChange: (code: string) => void;
  onOrganizationChange: (code: string) => void;
}) {
  const regions = organizations.filter(item => item.level === 'REGION').sort((a, b) => a.name.localeCompare(b.name));
  const branches = organizations.filter(item => item.level === 'BRANCH' && item.region_code === regionCode).sort((a, b) => a.name.localeCompare(b.name));
  const units = organizations.filter(item => item.level === 'UNIT'
    && item.region_code === regionCode && item.branch_code === branchCode).sort((a, b) => a.name.localeCompare(b.name));
  const options = catalog === 'sales-regions' ? regions : catalog === 'sales-branches' ? branches : units;
  return (
    <div className="space-y-4 rounded-xl border border-[#cadbd1] bg-[#f6f9f6] p-4" data-testid="move-destination-picker">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#638073]">Same-level destination</p>
        <p className="mt-1 text-sm text-muted-foreground">Choose a different {catalog === 'sales-regions' ? 'region' : catalog === 'sales-branches' ? 'branch' : 'unit'} for this manager. The move is one atomic change.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5"><Label htmlFor="move-region">Region</Label><select id="move-region" value={regionCode} disabled={pending} onChange={event => onRegionChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" data-testid="select-move-region"><option value="">Choose a region</option>{regions.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        {catalog === 'sales-units' && <div className="space-y-1.5"><Label htmlFor="move-branch">Branch</Label><select id="move-branch" value={branchCode} disabled={pending || !regionCode} onChange={event => onBranchChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" data-testid="select-move-branch"><option value="">Choose a branch</option>{branches.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>}
        {catalog !== 'sales-regions' && <div className="space-y-1.5"><Label htmlFor="move-team">{catalog === 'sales-branches' ? 'Destination branch' : 'Destination unit'}</Label><select id="move-team" value={organizationCode} disabled={pending || (catalog === 'sales-units' && !branchCode)} onChange={event => onOrganizationChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" data-testid="select-move-team"><option value="">Choose destination</option>{options.map(item => <option key={item.code} value={item.code}>{item.name}{!item.eligible || !item.is_active ? ' · needs attention' : ''}</option>)}</select></div>}
        {catalog === 'sales-regions' && <div className="space-y-1.5"><Label htmlFor="move-region-destination">Destination region</Label><select id="move-region-destination" value={organizationCode} disabled={pending} onChange={event => onOrganizationChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" data-testid="select-move-team"><option value="">Choose destination</option>{regions.map(item => <option key={item.code} value={item.code}>{item.name}{!item.eligible || !item.is_active ? ' · needs attention' : ''}</option>)}</select></div>}
      </div>
      {destination && <div className={`rounded-lg border p-3 ${destination.code === sourceCode ? 'border-amber-300 bg-amber-50 text-amber-950' : destination.eligible && destination.is_active ? 'border-[#cbdcd1] bg-white text-[#244b3b]' : 'border-amber-300 bg-amber-50 text-amber-950'}`} data-testid="move-destination-summary">
        <p className="text-xs font-semibold uppercase tracking-wider">Destination team</p>
        <p className="mt-1 text-sm font-semibold">{destination.name}</p>
        <p className="mt-1 text-xs">{destination.region_name ?? destination.name}{destination.branch_name ? ` / ${destination.branch_name}` : ''}{destination.level === 'BRANCH' && destination.region_name ? ` / ${destination.name}` : ''}</p>
        {destination.code === sourceCode && <p className="mt-2 text-xs">Choose a different team from the selected origin.</p>}
        {(!destination.eligible || !destination.is_active) && <p className="mt-2 text-xs">{destination.issues.join(' ') || 'This destination must be active and have a valid hierarchy.'}</p>}
      </div>}
    </div>
  );
}

export function MoveReviewPanel({
  input,
  sourceName,
  sourcePath,
  destinationName,
  destinationPath,
  managerName,
  destinationManagerName,
  destinationHasSameManager,
  confirmDisabled,
  pending,
  onBack,
  onConfirm,
}: {
  input: SalesManagerMappingInput;
  sourceName: string;
  sourcePath: string;
  destinationName: string;
  destinationPath: string;
  managerName: string;
  destinationManagerName: string;
  destinationHasSameManager: boolean;
  confirmDisabled: boolean;
  pending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const note = input.note?.trim() ?? '';
  return (
    <div className="mt-5 rounded-xl border border-[#9dbdaf] bg-[#f0f6f1] p-4" data-testid="move-review">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#214a3a]"><ShieldCheck className="h-4 w-4" />Review manager move</div>
      <div className="mt-3 rounded-md border bg-card p-3">
        <p className="text-xs text-muted-foreground">Manager</p><p className="text-sm font-semibold">{managerName}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div><span className="block text-xs text-muted-foreground">Origin · will be cleared</span><strong>{sourceName}</strong><span className="block text-xs text-muted-foreground">{sourcePath}</span></div>
          <ArrowRight className="hidden h-4 w-4 text-[#668878] sm:block" />
          <div><span className="block text-xs text-muted-foreground">Destination</span><strong>{destinationName}</strong><span className="block text-xs text-muted-foreground">{destinationPath}</span></div>
        </div>
      </div>
      <div className="mt-3 rounded-md border bg-card p-3 text-sm">
        <p className="text-xs text-muted-foreground">Destination’s current manager</p>
        <p className="font-semibold">{destinationManagerName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{destinationHasSameManager ? 'The manager is already assigned here; the selected origin will still be cleared.' : destinationManagerName === 'Not assigned' ? 'The destination is currently unassigned.' : 'This destination manager will be replaced as part of the atomic move.'}</p>
      </div>
      <p className="mt-3 rounded-md bg-white/70 p-3 text-xs leading-5"><span className="font-semibold">Reason:</span> {note || 'Enter a reason of at least 3 characters before confirming.'}</p>
      {confirmDisabled && <p className="mt-2 text-xs text-amber-900">The source manager is no longer an active eligible MIS user. Refresh and choose the source again before moving.</p>}
      <p className="mt-2 text-[11px] text-muted-foreground">Source and destination versions are frozen in this review. The origin is not retained as an additional assignment.</p>
      <div className="mt-3 flex justify-end gap-2"><Button variant="outline" disabled={pending} onClick={onBack} data-testid="button-edit-move-review">Back to edit</Button><Button onClick={onConfirm} disabled={pending || confirmDisabled || note.length < 3} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-confirm-move">{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Moving…</> : <><Check className="h-4 w-4" />Confirm move</>}</Button></div>
    </div>
  );
}
