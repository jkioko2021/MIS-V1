import type { RiskLookup, RiskRootCause } from '@workspace/api-client-react';
import { dateLabel, StatusPill } from './risk-ui';

export default function RiskRootCauseTable({ roots, staff, selectedRootId, mutating, onSelect }: {
  roots: RiskRootCause[]; staff: RiskLookup[]; selectedRootId: string;
  mutating: boolean; onSelect: (root: RiskRootCause) => void;
}) {
  const ownerName = (root: RiskRootCause) => {
    const person = staff.find(item => item.username === root.action_owner);
    return person?.employee_name
      ? `${person.employee_name} · ${root.action_owner}`
      : root.action_owner || 'Not assigned';
  };
  const selectButton = (root: RiskRootCause) => <button type="button" aria-label={`Select root cause: ${root.root_cause}`} disabled={mutating} onClick={() => onSelect(root)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted disabled:opacity-50">
    {String(root.root_id) === selectedRootId ? 'Selected' : 'Select'}
  </button>;
  if (!roots.length) return <p className="mb-4 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">No saved root causes. Add the first cause and its action plan below.</p>;
  return <div className="mb-5 min-w-0" data-testid="saved-root-causes">
    <p className="mb-2 text-xs font-semibold">{roots.length} saved root {roots.length === 1 ? 'cause' : 'causes'}</p>
    <div className="hidden max-w-full overflow-x-auto rounded-lg border border-border md:block">
      <table className="w-full min-w-[900px] text-left text-xs">
        <caption className="sr-only">Saved root causes and action plans</caption>
        <thead className="bg-muted/60"><tr>{['Select', 'Root cause', 'Current controls', 'Mitigations', 'Due date', 'Action owner', 'Action status'].map(label => <th key={label} className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-border">{roots.map(root => <tr key={root.root_id} data-testid={`saved-root-${root.root_id}`} className={root.action_status === 'Behind schedule' ? 'bg-rose-50' : String(root.root_id) === selectedRootId ? 'bg-primary/5' : ''}>
          <td className="px-3 py-3 align-top">{selectButton(root)}</td>
          <td className="max-w-64 whitespace-pre-wrap break-words px-3 py-3 align-top">{root.root_cause}</td>
          <td className="max-w-64 whitespace-pre-wrap break-words px-3 py-3 align-top">{root.current_contr || 'Not recorded'}</td>
          <td className="max-w-64 whitespace-pre-wrap break-words px-3 py-3 align-top">{root.mitigations || 'Not recorded'}</td>
          <td className="whitespace-nowrap px-3 py-3 align-top">{root.due_date ? dateLabel(root.due_date) : 'Not recorded'}</td>
          <td className="max-w-48 break-words px-3 py-3 align-top">{ownerName(root)}</td>
          <td className="px-3 py-3 align-top"><StatusPill status={root.action_status} /></td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="space-y-3 md:hidden">{roots.map(root => <article key={root.root_id} className={`rounded-lg border p-3 text-xs ${root.action_status === 'Behind schedule' ? 'border-rose-300 bg-rose-50' : String(root.root_id) === selectedRootId ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">Root cause & action plan</span>{selectButton(root)}</div>
      <dl className="space-y-3">
        <div><dt className="font-semibold">Root cause</dt><dd className="mt-1 whitespace-pre-wrap break-words">{root.root_cause}</dd></div>
        <div><dt className="font-semibold">Current controls</dt><dd className="mt-1 whitespace-pre-wrap break-words">{root.current_contr || 'Not recorded'}</dd></div>
        <div><dt className="font-semibold">Mitigations</dt><dd className="mt-1 whitespace-pre-wrap break-words">{root.mitigations || 'Not recorded'}</dd></div>
        <div><dt className="font-semibold">Due date</dt><dd className="mt-1">{root.due_date ? dateLabel(root.due_date) : 'Not recorded'}</dd></div>
        <div><dt className="font-semibold">Action owner</dt><dd className="mt-1 break-words">{ownerName(root)}</dd></div>
        <div><dt className="font-semibold">Action status</dt><dd className="mt-1"><StatusPill status={root.action_status} /></dd></div>
      </dl>
    </article>)}</div>
  </div>;
}
