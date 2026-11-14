import { Clock3, History, RefreshCw } from 'lucide-react';
import type { SalesManagerMappingEvent } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';

export function AssignmentHistory({
  events,
  loading,
  error,
  onRefresh,
}: {
  events?: SalesManagerMappingEvent[];
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><History className="h-4 w-4 text-[#477665]" /><h3 className="font-semibold">Assignment history</h3></div>
        <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} aria-label="Refresh history" data-testid="button-refresh-history"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>
      {loading ? <div className="mt-4 space-y-3"><div className="h-16 animate-pulse rounded-lg bg-muted" /><div className="h-16 animate-pulse rounded-lg bg-muted" /></div>
        : error ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">History could not be loaded. <button className="underline" onClick={onRefresh}>Try again</button></div>
          : !events?.length ? <div className="mt-5 rounded-lg border border-dashed p-5 text-center"><Clock3 className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No changes recorded</p><p className="mt-1 text-xs text-muted-foreground">Future assignments and removals will appear here.</p></div>
            : <ol className="mt-4 space-y-4">{events.map(event => <li key={event.id} className="relative border-l border-[#d9e5dd] pl-4 pb-1 last:border-0" data-testid={`history-event-${event.id}`}>
              <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[#5c8a73] ring-4 ring-card" />
              <p className="text-sm font-medium">{event.action === 'ASSIGNED' ? 'Manager assigned' : event.action === 'REASSIGNED' ? 'Manager replaced' : 'Manager unassigned'}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.before_manager_name ? `${event.before_manager_name} → ` : ''}{event.after_manager_name ?? 'Not assigned'}</p>
              {(event.transfer_from_name || event.transfer_to_name) && <p className="mt-1 text-xs leading-5 text-muted-foreground">Moved from {event.transfer_from_name ?? 'source team'} to {event.transfer_to_name ?? 'destination team'}</p>}
              {event.note && <p className="mt-2 rounded-md bg-[#f5f7f5] p-2 text-xs leading-5">{event.note}</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">{new Date(event.created_at).toLocaleString()} · {event.actor}</p>
            </li>)}</ol>}
    </section>
  );
}
