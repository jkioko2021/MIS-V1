import { useState } from 'react';
import type { GiMedicalUnit, GiNode, GiStructureSnapshot } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function LinkedMedicalUnits({ units }: { units: GiMedicalUnit[] }) {
  return <div className="mt-2 min-w-0 text-xs">
    <p className="font-medium text-muted-foreground">Linked Medical Units ({units.length})</p>
    {units.length ? <ul className="mt-1 space-y-1">
      {units.map(unit => <li key={unit.code} className="break-words">
        {unit.name}
        <span className="text-muted-foreground"> · {unit.branch_name || 'Branch not assigned'} · {unit.mapping_available ? 'Operational' : 'Setup only'}</span>
      </li>)}
    </ul> : <p className="mt-1 text-muted-foreground">No Medical Units linked.</p>}
  </div>;
}

export function NodeViewAction({ node, snapshot }: { node: GiNode; snapshot: GiStructureSnapshot }) {
  const [open, setOpen] = useState(false);
  const isUnit = node.level === 'UNIT';
  const manager = snapshot.managers.find(item => item.id === node.manager_id);
  const children = snapshot.nodes.filter(item => item.level === 'UNIT' && item.parent_id === node.id);
  const linked = snapshot.medical_units.filter(item => item.gi_unit_id === node.id);
  const rows = [
    ['Name', node.name],
    ['Level', isUnit ? 'GI Unit' : 'GI Branch'],
    ['Status', node.status === 'ACTIVE' ? 'Active' : node.status === 'INACTIVE' ? 'Inactive' : 'Pending setup'],
    ['Availability', node.available ? 'Operational' : 'Setup only'],
    ['Parent Branch', isUnit ? node.parent_name || 'Not assigned' : 'Not applicable'],
    ['Assigned manager', node.manager_name || manager?.employee_name || 'Not assigned'],
    ['Manager mobile number', manager?.mobile_no || 'Not captured on user account'],
    ['Manager email', manager?.email || 'Not captured on user account'],
  ];
  return <>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)} data-testid={`button-view-gi-node-${node.id}`}>View</Button>
    {open && <Dialog open onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isUnit ? 'GI Unit' : 'GI Branch'} Details — {node.name}</DialogTitle>
          <DialogDescription>Read-only setup details and current links. Use Edit or Medical Unit mapping to make changes.</DialogDescription>
        </DialogHeader>
        <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => <div key={label} className="min-w-0 border-b pb-3">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-sm">{value}</dd>
          </div>)}
        </dl>
        {isUnit ? <section aria-label="Linked Medical Units">
          <LinkedMedicalUnits units={linked} />
          {!linked.length && <p className="mt-2 text-xs text-muted-foreground">Link Medical Units through Medical Unit mapping.</p>}
        </section> : <section aria-label="GI Units in this Branch">
          <h3 className="text-sm font-semibold">GI Units ({children.length})</h3>
          {children.length ? <ul className="mt-2 space-y-2">{children.map(child => <li key={child.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">{child.name}</p>
            <LinkedMedicalUnits units={snapshot.medical_units.filter(unit => unit.gi_unit_id === child.id)} />
          </li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No GI Units assigned to this Branch.</p>}
        </section>}
        <DialogFooter><Button onClick={() => setOpen(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>}
  </>;
}
