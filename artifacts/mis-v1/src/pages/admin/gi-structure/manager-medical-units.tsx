import type { GiManager, GiStructureSnapshot } from '@workspace/api-client-react';

export function managerMedicalUnitGroups(manager: GiManager, snapshot: GiStructureSnapshot) {
  const branches = new Set(snapshot.nodes
    .filter(node => node.level === 'BRANCH' && node.manager_id === manager.id)
    .map(node => node.id));
  return snapshot.nodes.filter(node => node.level === 'UNIT' && (
    manager.level === 'UNIT' ? node.manager_id === manager.id
      : node.parent_id !== null && branches.has(node.parent_id)
  )).map(node => ({
    giUnit: node,
    medicalUnits: snapshot.medical_units.filter(unit => unit.gi_unit_id === node.id),
  }));
}

export function ManagerMedicalUnits({ manager, snapshot }: {
  manager?: GiManager; snapshot: GiStructureSnapshot;
}) {
  const groups = manager ? managerMedicalUnitGroups(manager, snapshot) : [];
  const count = groups.reduce((total, group) => total + group.medicalUnits.length, 0);
  return <section className="mt-4 min-w-0 rounded-lg border bg-muted/20 p-4"
    aria-label="Mapped Medical Units" data-testid={`manager-medical-units-${manager?.id ?? 'new'}`}>
    <h3 className="text-sm font-semibold">Mapped Medical Units ({count})</h3>
    <p className="mt-1 text-xs text-muted-foreground">Current saved Medical Unit mappings through {manager?.level === 'BRANCH' ? 'the GI Units under this coordinator’s assigned Branches' : 'this manager’s assigned GI Units'}.</p>
    {!manager ? <p className="mt-3 text-sm text-muted-foreground">Save the enrollment and assign GI teams in Branch & Unit setup to display their Medical Unit mappings.</p>
      : !groups.length ? <p className="mt-3 text-sm text-muted-foreground">No GI Units are currently assigned to this designation.</p>
      : <div className="mt-3 space-y-3">
        {groups.map(({ giUnit, medicalUnits }) => <div key={giUnit.id} className="min-w-0 border-t pt-3">
          <p className="break-words text-sm font-medium">GI Unit · {giUnit.name}</p>
          {medicalUnits.length ? <ul className="mt-2 space-y-2">
            {medicalUnits.map(unit => <li key={unit.code} className="break-words text-sm">
              <span className="font-medium">{unit.name}</span>
              <span className="text-xs text-muted-foreground"> · {unit.branch_name || 'Medical Branch not assigned'} · {unit.mapping_available ? 'Operational' : 'Setup only'}</span>
            </li>)}
          </ul> : <p className="mt-1 text-xs text-muted-foreground">No Medical Units linked to this GI Unit.</p>}
        </div>)}
      </div>}
    {manager && <p className="mt-3 text-xs text-muted-foreground">Manage these links in Medical Unit mapping. This display does not change team assignments.</p>}
  </section>;
}
