import type { OrganisationCandidate, OrganisationNode } from '@workspace/api-client-react';

export function UnitOptions({units,pending=[]}:{units:OrganisationNode[];pending?:OrganisationCandidate[]}){
  const imported=pending.filter(candidate=>candidate.level==='UNIT'
    && !units.some(unit=>unit.code.trim().toUpperCase()===candidate.code.trim().toUpperCase()));
  return <>
    {[...units].sort((a,b)=>a.name.localeCompare(b.name)).map(unit=><option key={`node-${unit.id}`} value={unit.id}
      disabled={!unit.is_active||!unit.available}>{unit.name}</option>)}
    {!!imported.length&&<optgroup label="Pending Setup — unavailable for assignment">
      {[...imported].sort((a,b)=>a.name.localeCompare(b.name)).map(unit=><option
        key={`source-${unit.source_reference_id}`} value={`pending:${unit.source_reference_id}`} disabled>{unit.name}</option>)}
    </optgroup>}
  </>;
}
