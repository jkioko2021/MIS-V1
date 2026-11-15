import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReassignOrganisationSourceManager, getGetOrganisationQueryKey } from '@workspace/api-client-react';
import type { OrganisationCandidate, SalesStaff } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { errorMessage } from './shared';

export function SourceManagerDialog({candidate,users,onClose}:{
  candidate:OrganisationCandidate;users:SalesStaff[];onClose:()=>void;
}){
  const [employee,setEmployee]=useState(candidate.linked_manager_employee_id?String(candidate.linked_manager_employee_id):'');
  const [reason,setReason]=useState('');
  const save=useReassignOrganisationSourceManager();
  const client=useQueryClient();
  const branch=candidate.level==='BRANCH';
  return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent>
    <DialogHeader><DialogTitle>Reassign manager — {candidate.name}</DialogTitle></DialogHeader>
    <Label htmlFor="pending-manager">Assigned manager</Label>
    <SearchableSelect id="pending-manager" value={employee} onValueChange={setEmployee}
      placeholder={branch?'No manager':'Select a Sales Manager'} searchPlaceholder="Search name or email…"
      options={[...(branch?[{value:'',label:'No manager'}]:[]),...users.map(user=>({
        value:String(user.employee_id),label:user.employee_name,description:user.email??undefined,disabled:user.user_eligible===false,
      }))]}/>
    <Label htmlFor="manager-change-reason">Reason for reassignment</Label>
    <textarea id="manager-change-reason" className="min-h-24 rounded-md border p-3 text-sm" value={reason} maxLength={1000}
      onChange={event=>setReason(event.target.value)}/>
    <p className="text-xs text-muted-foreground">This updates the pending setup only. It does not activate the hierarchy or the manager's category enrollment.</p>
    {save.error&&<p role="alert" className="text-sm text-destructive">{errorMessage(save.error)}</p>}
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button disabled={save.isPending||(!branch&&!employee)||!reason.trim()||!candidate.setup_version}
        onClick={()=>save.mutate({id:candidate.source_reference_id,data:{
          employee_id:employee?Number(employee):null,version:candidate.setup_version!,reason:reason.trim(),
        }},{onSuccess:async()=>{await client.invalidateQueries({queryKey:getGetOrganisationQueryKey()});onClose();}})}>
        {save.isPending?'Saving…':'Save reassignment'}
      </Button></div>
  </DialogContent></Dialog>;
}
