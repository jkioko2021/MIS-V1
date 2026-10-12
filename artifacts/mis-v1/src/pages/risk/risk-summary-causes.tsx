import { useState } from 'react';
import type { RiskOptionsResponseData, RiskRecord, RiskRootCause } from '@workspace/api-client-react';
import { useRiskRecord } from './use-risk-register';
import { dateLabel, envelopeData, envelopeError, ErrorNotice, queryError, SkeletonRows } from './risk-ui';

export default function RiskSummaryCauses({ username, riskCode, staff }: {
  username: string; riskCode: string; staff: RiskOptionsResponseData['staff'];
}) {
  const [expanded, setExpanded] = useState(false);
  const query = useRiskRecord(username, expanded ? riskCode : '');
  const detail = envelopeData<{ risk: RiskRecord; root_causes: RiskRootCause[] }>(query.data);
  const failure = query.data ? envelopeError(query.data) : undefined;
  return <details data-testid={`root-causes-${riskCode}`} onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary className="cursor-pointer whitespace-nowrap text-xs font-semibold text-primary">View root causes</summary>
    {expanded && <div className="mt-3 max-h-80 min-w-64 max-w-sm space-y-3 overflow-y-auto pr-2">
      {query.isLoading ? <SkeletonRows />
        : failure || query.isError ? <ErrorNotice message={failure || queryError(query.error)} onRetry={() => query.refetch()} />
          : !detail ? <p className="text-xs text-muted-foreground">Loading saved root causes…</p>
            : !detail.root_causes.length ? <p className="text-xs text-muted-foreground">No root causes saved for this risk. Add at least one before submitting.</p>
              : detail.root_causes.map((cause, index) => <article key={cause.root_id} className="rounded-lg border border-border bg-card p-3 text-xs">
                <h4 className="font-bold">Root cause {index + 1}</h4>
                <p className="mt-1 whitespace-pre-wrap break-words">{cause.root_cause}</p>
                <dl className="mt-3 space-y-2">
                  <div><dt className="font-semibold">Current controls</dt><dd className="whitespace-pre-wrap break-words text-muted-foreground">{cause.current_contr || 'Not recorded'}</dd></div>
                  <div><dt className="font-semibold">Mitigation / action</dt><dd className="whitespace-pre-wrap break-words text-muted-foreground">{cause.mitigations || 'Not recorded'}</dd></div>
                  <div><dt className="font-semibold">Action owner</dt><dd>{staff.find(person => person.username === cause.action_owner)?.employee_name || cause.action_owner || 'Not assigned'}</dd></div>
                  <div><dt className="font-semibold">Due date</dt><dd>{cause.due_date ? dateLabel(cause.due_date) : 'Not recorded'}</dd></div>
                  <div><dt className="font-semibold">Status</dt><dd>{cause.action_status}</dd></div>
                </dl>
              </article>)}
    </div>}
  </details>;
}
