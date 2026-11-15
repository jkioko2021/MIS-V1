import type { OrganisationCandidate, OrganisationNode, SalesLevel } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LEVEL_LABEL } from './shared';

const PARENT_LEVEL: Partial<Record<SalesLevel, SalesLevel>> = {
  REGION: 'NATIONAL', BRANCH: 'REGION', UNIT: 'BRANCH',
};

export function PendingManagerDetails({ candidate }: { candidate: OrganisationCandidate }) {
  return <span className={candidate.linked_manager_name ? 'font-medium text-foreground' : ''}>
    {candidate.linked_manager_name ?? '—'}
  </span>;
}

export function PendingHierarchyRow({ candidate, nodes, candidates, onSetup, onReassign }: {
  candidate: OrganisationCandidate;
  nodes: OrganisationNode[];
  candidates: OrganisationCandidate[];
  onSetup: (candidate: OrganisationCandidate) => void;
  onReassign?: (candidate: OrganisationCandidate) => void;
}) {
  const expected = PARENT_LEVEL[candidate.level];
  const sameParent = (entry: OrganisationNode | OrganisationCandidate) =>
    entry.level === expected && entry.code.trim().toUpperCase() === candidate.parent_code?.trim().toUpperCase();
  const importedParent = candidate.parent_code
    ? nodes.find(sameParent)?.name ?? candidates.find(sameParent)?.name
    : undefined;
  return <tr className="border-t bg-amber-50/30 hover:bg-amber-50/60"
    data-testid={`row-pending-hierarchy-${candidate.source_reference_id}`}>
    <td className="px-5 py-3.5">
      <b>{candidate.name}</b>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{candidate.code}</span><span>·</span><span>{LEVEL_LABEL[candidate.level]}</span>
      </div>
    </td>
    <td className="px-5 py-3.5">
      {candidate.level === 'REGION' && candidate.linked_national_name ? `National: ${candidate.linked_national_name}`
        : importedParent ? `Imported parent: ${importedParent}` : expected === 'NATIONAL' ? 'National mapping required' : 'Parent mapping required'}
      {candidate.level !== 'REGION' && candidate.linked_national_name
        && <p className="mt-1 text-xs text-muted-foreground">National: {candidate.linked_national_name}</p>}
      <p className="mt-1 text-xs text-muted-foreground">Not yet an operational link</p>
    </td>
    <td className="px-5 py-3.5"><PendingManagerDetails candidate={candidate} /></td>
    <td className="px-5 py-3.5 text-xs text-muted-foreground">Not available for agent assignment</td>
    <td className="px-5 py-3.5"><div className="flex flex-col items-start gap-1.5">
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-950">Pending Setup</Badge>
      {candidate.branch_approved && <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-900">Approved for setup</Badge>}
    </div></td>
    <td className="px-5 py-3.5 text-right"><div className="flex justify-end gap-2">
      {onReassign && <Button size="sm" variant="outline" onClick={() => onReassign(candidate)}>Reassign manager</Button>}
      <Button size="sm" variant="outline" onClick={() => onSetup(candidate)}>Complete setup</Button>
    </div></td>
  </tr>;
}
