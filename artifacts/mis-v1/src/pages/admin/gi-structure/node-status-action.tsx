import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetGiStructureQueryKey, useSaveGiStructureNode } from '@workspace/api-client-react';
import type { GiNode } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '../organisation/shared';

export function NodeStatusAction({ node }: { node: GiNode }) {
  const [selected, setSelected] = useState<GiNode | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const mutation = useSaveGiStructureNode();
  const { toast } = useToast();
  const activating = (selected ?? node).status !== 'ACTIVE';
  const action = activating ? 'Activate' : 'Deactivate';
  const save = async () => {
    if (!selected || reason.trim().length < 3 || mutation.isPending) return;
    try {
      await mutation.mutateAsync({ data: {
        id: selected.id, version: selected.version, code: selected.code, name: selected.name,
        level: selected.level, parent_id: selected.parent_id, manager_id: selected.manager_id,
        status: activating ? 'ACTIVE' : 'INACTIVE', reason: reason.trim(),
      } });
      await queryClient.invalidateQueries({ queryKey: getGetGiStructureQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ['/api/gi-structure/history'] });
      toast({ title: activating ? 'GI entry activated' : 'GI entry deactivated', description: selected.name });
      setSelected(null);
    } catch {
      // Keep confirmation and reason open; the server's blocker is shown below.
    }
  };
  return <>
    <Button size="sm" variant="outline" onClick={() => { mutation.reset(); setReason(''); setSelected(node); }}
      data-testid={`button-gi-status-${node.id}`}>{node.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</Button>
    {selected && <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) setSelected(null); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{action} {selected.level === 'BRANCH' ? 'Branch' : 'Unit'} — {selected.name}</DialogTitle>
          <DialogDescription>{activating
            ? 'Activation checks the assigned manager and parent Branch before making this entry available.'
            : 'Deactivation makes this entry unavailable for new use. Active child Units and Medical mappings must be resolved first. Existing records and history are retained.'}</DialogDescription>
        </DialogHeader>
        <Label htmlFor={`gi-status-reason-${node.id}`}>Reason for {activating ? 'activation' : 'deactivation'}</Label>
        <Textarea id={`gi-status-reason-${node.id}`} value={reason} maxLength={1000} disabled={mutation.isPending}
          onChange={event => setReason(event.target.value)} placeholder="Enter at least 3 characters for the audit trail" />
        {mutation.error && <p role="alert" className="text-sm text-destructive">{errorMessage(mutation.error)}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={mutation.isPending} onClick={() => setSelected(null)}>Cancel</Button>
          <Button disabled={mutation.isPending || reason.trim().length < 3} onClick={save}>{mutation.isPending ? 'Saving…' : `${action} ${selected.level === 'BRANCH' ? 'Branch' : 'Unit'}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </>;
}
