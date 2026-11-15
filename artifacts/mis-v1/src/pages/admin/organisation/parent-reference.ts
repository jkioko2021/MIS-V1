import type { OrganisationCandidate, OrganisationNode, SalesLevel } from '@workspace/api-client-react';

export const PARENT_LEVEL: Partial<Record<SalesLevel, SalesLevel>> = {
  REGION:'NATIONAL',BRANCH:'REGION',UNIT:'BRANCH',
};
export function importedParentReference(candidate:OrganisationCandidate|undefined,
  nodes:OrganisationNode[],candidates:OrganisationCandidate[]){
  if(!candidate)return null;
  const level=PARENT_LEVEL[candidate.level];
  const code=candidate.parent_code?.trim().toUpperCase();
  if(!level||!code||code==='NULL')return null;
  const operational=nodes.filter(node=>node.level===level&&(node.code??'').trim().toUpperCase()===code);
  if(operational.length===1){
    const node=operational[0];
    return {value:String(node.id),name:node.name,pending:false,
      national:node.path?.find(part=>part.level==='NATIONAL')?.name??null,manager:node.manager_name??null};
  }
  if(operational.length)return null;
  const sources=candidates.filter(source=>source.level===level&&source.code.trim().toUpperCase()===code);
  if(sources.length!==1)return null;
  const source=sources[0];
  return {value:`pending:${source.source_reference_id}`,name:source.name,pending:true,
    national:source.linked_national_name??null,manager:source.linked_manager_name??null};
}
