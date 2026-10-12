import { AlertCircle, ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';

export const fieldClass = 'mt-1 w-full min-w-0 max-w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-55';
export const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-45';
export const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-45';

export function text(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}
export function dateLabel(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
export function envelopeData<T>(response: unknown): T | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const result = response as { ok?: boolean; data?: T };
  return result.ok === true ? result.data : undefined;
}
export function envelopeError(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') return 'The server returned an empty response.';
  const result = response as { ok?: boolean; error?: unknown };
  return result.ok === false ? text(result.error, 'The request was not accepted.') : undefined;
}
export function queryError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Could not load risk register information. Try again.';
}
export function prettyKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}
export function Snapshot({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">No snapshot recorded</span>;
  if (typeof value !== 'object') return <span>{text(value)}</span>;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return <span className="text-muted-foreground">Empty snapshot</span>;
  return <div className="grid gap-2 sm:grid-cols-2">{entries.map(([key, val]) => (
    <div key={key} className="rounded-md bg-muted/60 p-2.5">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{prettyKey(key)}</div>
      <div className="whitespace-pre-wrap break-words text-xs">{typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : text(val)}</div>
    </div>
  ))}</div>;
}
export function StatusPill({ status }: { status?: string }) {
  const normalized = (status ?? '').toLowerCase();
  const palette = normalized.includes('behind') || normalized.includes('return') ? 'bg-rose-100 text-rose-800'
    : normalized.includes('sign') || normalized.includes('closed') || normalized.includes('review') ? 'bg-emerald-100 text-emerald-800'
      : normalized.includes('submit') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${palette}`}>{status || 'Not started'}{normalized === 'behind schedule' ? ' · At risk' : ''}</span>;
}
export function RiskStatusPill({ risk }: { risk: { risk_status?: string; at_risk?: boolean; behind_schedule_count?: number } }) {
  return <span className="inline-flex flex-wrap items-center gap-1.5" aria-label={`Risk status: ${risk.risk_status ?? 'Open'}${risk.at_risk ? ', At risk' : ''}`}>
    <StatusPill status={risk.risk_status ?? 'Open'} />
    {risk.at_risk && <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800" title={`${risk.behind_schedule_count ?? 1} root cause(s) behind schedule`}>At risk</span>}
  </span>;
}
export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="flex-1">{message}</div>
    {onRetry && <button className="font-semibold underline" onClick={onRetry}>Retry</button>}
  </div>;
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
    <div><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><ClipboardList className="h-5 w-5" /></div>
      <h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p></div>
  </div>;
}
export function SkeletonRows() {
  return <div className="space-y-3" aria-label="Loading risk data">{[0, 1, 2].map(item => <div key={item} className="h-[72px] animate-pulse rounded-xl bg-muted" />)}</div>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block min-w-0 max-w-full break-words text-xs font-semibold text-foreground">{label}{children}{hint && <span className="mt-1 block text-[11px] font-normal text-muted-foreground">{hint}</span>}</label>;
}
export function Exposure({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/65 p-3"><div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 font-[Space_Mono] text-lg font-bold">{value}</div></div>;
}
