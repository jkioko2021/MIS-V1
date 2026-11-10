import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSendRiskWorkflowReminder, type RiskDepartmentSummary } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buttonClass, dateLabel, envelopeError, ErrorNotice, Field, fieldClass, queryError, secondaryButton, StatusPill } from './risk-ui';

export default function RiskStatusWorkflow({ row, onFeedback }: { row: RiskDepartmentSummary; onFeedback: (message: string, isError?: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const client = useQueryClient();
  const reminder = useSendRiskWorkflowReminder();
  const users = row.pending_users ?? [];
  const eligible = Boolean(row.reminder_available && row.period_id);
  const send = () => {
    if (!eligible || reminder.isPending) return;
    setError(''); setResult('');
    reminder.mutate({ data: { depart_code: row.depart_code, period_id: row.period_id!, expected_status: row.workflow_status as 'OPEN' | 'SUBMITTED' | 'REVIEWED' | 'SIGNED_OFF', comments: note.trim() } }, {
      onSuccess: response => {
        const failure = envelopeError(response);
        if (failure) { setError(failure); onFeedback(failure, true); }
        else { setResult(response.data.message); onFeedback(response.data.message); setOpen(false); setNote(''); }
      },
      onError: failure => { const message = queryError(failure); setError(message); onFeedback(message, true); },
      onSettled: () => { void client.invalidateQueries({ predicate: query => query.queryKey.some(key => typeof key === 'string' && key.startsWith('/api/risk-register/summary')) }); },
    });
  };
  return <div className="min-w-56 space-y-2">
    <StatusPill status={row.workflow_status} />
    <p className="text-xs font-semibold">{row.pending_action ?? 'Checking pending action…'}</p>
    <p className="text-xs text-muted-foreground">Pending with: {row.pending_role ?? '—'}</p>
    {users.length > 0 && <ul className="space-y-1 text-xs">{users.map(person => <li key={person.username}>{person.name}{person.name !== person.username && <span className="text-muted-foreground"> ({person.username})</span>}</li>)}</ul>}
    {!eligible && row.reminder_unavailable_reason && <p className="max-w-xs text-xs text-muted-foreground">{row.reminder_unavailable_reason}</p>}
    {row.total_risks > 0 && row.workflow_status !== 'CLOSED' && <button type="button" className={`${secondaryButton} text-xs`} disabled={!eligible || reminder.isPending || Boolean(result)} onClick={() => { setOpen(true); setError(''); }}>
      {result ? 'Reminder attempted' : 'Send reminder email'}
    </button>}
    {result && <p role="status" className="max-w-xs text-xs">{result}</p>}
    <Dialog open={open} onOpenChange={value => { if (!reminder.isPending) setOpen(value); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto" onInteractOutside={event => { if (reminder.isPending) event.preventDefault(); }}
        onEscapeKeyDown={event => { if (reminder.isPending) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Send workflow reminder</DialogTitle>
          <DialogDescription>{row.depart_name} · {dateLabel(row.period_from)} – {dateLabel(row.period_to)}</DialogDescription></DialogHeader>
        <p className="text-sm"><strong>Action required:</strong> {row.pending_action}</p>
        <p className="text-sm"><strong>Recipients:</strong> {users.map(person => person.name).join(', ')}</p>
        <p className="text-xs text-muted-foreground">Recipients are checked again when sending. The email includes the department, period, current status and required action. Only one reminder attempt per department is allowed every 10 minutes.</p>
        <Field label="Additional message (optional)"><textarea className={fieldClass} value={note} maxLength={2000} onChange={event => setNote(event.target.value)} rows={3} /></Field>
        {error && <ErrorNotice message={error} />}
        <div className="flex justify-end gap-2"><button type="button" className={secondaryButton} disabled={reminder.isPending} onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className={buttonClass} disabled={!eligible || reminder.isPending} onClick={send}>{reminder.isPending ? 'Sending…' : 'Send reminder'}</button></div>
      </DialogContent>
    </Dialog>
  </div>;
}
