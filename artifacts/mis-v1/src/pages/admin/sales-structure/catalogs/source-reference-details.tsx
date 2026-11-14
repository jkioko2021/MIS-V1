import { AlertTriangle, FileText, Link2Off } from 'lucide-react';
import type { SalesCatalogDefinition, SalesCatalogEntry } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function rawValue(value: string | null | undefined) {
  if (value === null) return 'NULL';
  if (value === undefined) return 'Not supplied';
  if (value === '') return '(blank)';
  return value;
}

export function SourceReferenceDetails({
  entry,
  definition,
  onClose,
}: {
  entry: SalesCatalogEntry;
  definition: SalesCatalogDefinition;
  onClose: () => void;
}) {
  const originalId = entry.values.ID;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[94dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">Reference source</Badge>
            <Badge variant="outline" className={entry.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-100 text-slate-600'}>
              {entry.is_active ? 'Active in source' : 'Inactive in source'}
            </Badge>
          </div>
          <DialogTitle className="pt-1">{definition.title} · read-only reference</DialogTitle>
          <p className="text-sm leading-5 text-muted-foreground">
            Original source values are preserved verbatim. This reference row is not an operational enrollment and cannot be edited, assigned or activated here.
          </p>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Original source ID</p>
            <p className="mt-1 break-all font-mono text-sm" data-testid="text-source-original-id">{rawValue(originalId)}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Source file</p>
            <p className="mt-1 flex items-center gap-2 break-all text-sm" data-testid="text-source-file"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" />{entry.source_file || 'Not recorded'}</p>
          </div>
        </div>

        {definition.manager && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-950">
            <Link2Off className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm leading-5"><strong>Unlinked to an MIS user.</strong> Source manager records have no verified employee mapping. This row does not create or imply a user enrollment.</p>
          </div>
        )}

        {!!entry.source_issues?.length && (
          <section className="rounded-lg border border-amber-300 bg-amber-50/70 p-4" data-testid="source-issues">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
              <AlertTriangle className="h-4 w-4" />Import notes and unresolved references
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-amber-950">
              {entry.source_issues.map((issue, index) => <li key={`${index}-${issue}`}>{issue}</li>)}
            </ul>
          </section>
        )}

        <section aria-label="Original field values">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Original row fields</h3>
              <p className="mt-1 text-xs text-muted-foreground">Raw source strings; leading zeroes, nulls and blanks are not normalized.</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{definition.fields.length} fields</span>
          </div>
          <div className="max-h-[42dvh] overflow-y-auto rounded-lg border">
            <dl className="grid gap-px bg-border sm:grid-cols-2">
              {definition.fields.map((field) => (
                <div key={field.key} className="min-w-0 bg-card p-3 sm:p-3.5" data-testid={`source-field-${field.key}`}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{field.label} <span className="ml-1 font-mono normal-case tracking-normal">{field.key}</span></dt>
                  <dd className="mt-1 whitespace-pre-wrap break-all font-mono text-xs leading-5 text-foreground">{rawValue(entry.values[field.key])}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <DialogFooter>
          <Button onClick={onClose} className="bg-[#1f5849] hover:bg-[#174536]" data-testid="button-close-source-reference">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
