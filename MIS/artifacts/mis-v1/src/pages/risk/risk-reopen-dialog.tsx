import { useGetRiskRegisterReopenScope, getGetRiskRegisterReopenScopeQueryKey, type RiskReopenScope } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buttonClass, secondaryButton, envelopeData, envelopeError, ErrorNotice, queryError, StatusPill } from './risk-ui';

export default function RiskReopenDialog({ username, departCode, periodId, comments, mutating, error, onClose, onConfirm }: {
  username: string; departCode: string; periodId: number; comments: string;
  mutating: boolean; error: string; onClose: () => void; onConfirm: (token: string) => void;
}) {
  const params = { depart_code: departCode, period_id: periodId };
  const query = useGetRiskRegisterReopenScope(params, { query: {
    queryKey: [...getGetRiskRegisterReopenScopeQueryKey(params), 'actor', username],
    enabled: Boolean(username && departCode && periodId), staleTime: 0, gcTime: 0,
    refetchOnMount: 'always', refetchOnWindowFocus: true,
  } });
  const scope = envelopeData<RiskReopenScope>(query.data);
  const failure = query.isError ? queryError(query.error) : query.data ? envelopeError(query.data) : undefined;
  const ready = query.isSuccess && !query.isFetching && !failure &&
    scope?.depart_code === departCode && scope?.period_id === periodId;
  const selected = scope?.departments.find(row => row.affected);
  return <Dialog open onOpenChange={open => { if (!open && !mutating) onClose(); }}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto" onInteractOutside={event => event.preventDefault()}
      onEscapeKeyDown={event => { if (mutating) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle>Confirm department reopening</DialogTitle>
        <DialogDescription>Only the selected department will require reassessment. Review the shared reporting-period effect before continuing.</DialogDescription>
      </DialogHeader>
      {query.isFetching && <p className="text-sm">Checking the current period and department registers…</p>}
      {failure && <><ErrorNotice message={failure} /><button className={secondaryButton} onClick={() => query.refetch()}>Retry scope check</button></>}
      {scope && <div className="space-y-4 text-sm">
        <p><strong>Reporting period: {scope.period_from} – {scope.period_to}</strong><br />
          {scope.period_status === 'CLOSED' ? 'The shared period changes from CLOSED to OPEN for all departments.' : 'The shared reporting period is already OPEN and will remain OPEN.'}
        </p>
        <p><strong>{selected?.depart_name ?? departCode}</strong>: reset submission, review, sign-off and closure. Reassess all {selected?.total_risks ?? 0} active risks, including those with closed actions.</p>
        <p>Saved scores and rankings, root causes, closed actions, prior notes and history are retained. Every other department’s workflow and assessment completion remain unchanged.</p>
        <p>Opening the shared period lifts its period-wide edit lock. Any other register that was not individually closed keeps its saved workflow state below and may become editable under that state.</p>
        <div className="space-y-2">
          <h4 className="font-semibold">Other department registers — unchanged saved states</h4>
          {scope.departments.filter(row => !row.affected).map(row => <div key={row.depart_code} className="flex items-center justify-between gap-3 rounded-md border p-2">
            <span>{row.depart_name} ({row.depart_code}) · {row.total_risks} active risks</span><StatusPill status={row.workflow_status} />
          </div>)}
          {scope.departments.length === 1 && <p>No other department registers in this period.</p>}
        </div>
        <p>The period can be closed again only after every registered active department is signed off. Previously closed departments keep their closure details and history.</p>
        <p className="break-words rounded-md bg-secondary p-3"><strong>Decision comment:</strong> {comments}</p>
      </div>}
      {error && <><ErrorNotice message={error} /><button disabled={mutating || query.isFetching} className={secondaryButton} onClick={() => query.refetch()}>Refresh reopening scope</button></>}
      <div className="flex justify-end gap-2">
        <button className={secondaryButton} disabled={mutating} onClick={onClose}>Cancel</button>
        <button className={buttonClass} disabled={!ready || mutating || !comments.trim()} onClick={() => { if (ready && scope) onConfirm(scope.confirmation_token); }}>
          {mutating ? 'Reopening…' : 'Reopen selected department only'}
        </button>
      </div>
    </DialogContent>
  </Dialog>;
}
