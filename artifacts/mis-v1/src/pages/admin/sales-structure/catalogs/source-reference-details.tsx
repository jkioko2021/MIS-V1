import { AlertTriangle, Link2Off } from 'lucide-react';
import type { SalesCatalogDefinition, SalesCatalogEntry, SalesCatalogSnapshot } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { displayFieldLabel, displayReference, visibleDetailField } from './catalog-display';

function rawValue(value: string | null | undefined) {
  if (value === null) return 'NULL';
  if (value === undefined) return 'Not supplied';
  if (value === '') return '(blank)';
  return value;
}

export function SourceReferenceDetails({
  entry,
  definition,
  snapshot,
  onClose,
}: {
  entry: SalesCatalogEntry;
  definition: SalesCatalogDefinition;
  snapshot: SalesCatalogSnapshot;
  onClose: () => void;
}) {
  const fields = definition.fields.filter(field => visibleDetailField(field, definition.code_field));
  const issueText = (issue: string) => issue.replace(/\b[A-Z][A-Z0-9_]+\b/g, key => {
    const field = definition.fields.find(item => item.key === key);
    return field ? displayFieldLabel(field, entry.catalog) : key;
  });
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
          <DialogTitle className="pt-1">{entry.name}</DialogTitle>
          <p className="text-sm leading-5 text-muted-foreground">
            {definition.title} · read-only reference. Assignments are shown by name; identifiers remain stored unchanged.
          </p>
        </DialogHeader>

        {definition.manager && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-950">
            <Link2Off className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm leading-5"><strong>Unlinked to an MIS user.</strong> Source manager records have no verified employee mapping. This row does not create or imply a user enrollment.</p>
          </div>
        )}

        {(() => {
          const managerField = entry.catalog === 'sales-units' ? 'UNIT_MGR_ID'
            : entry.catalog === 'sales-branches' ? 'BRANCH_MGR_ID'
              : entry.catalog === 'sales-regions' ? 'REGION_MGR_ID' : '';
          const assignment = managerField ? snapshot.manager_assignments?.find(row =>
            row.catalog === entry.catalog && row.organization_code === entry.code,
          ) : undefined;
          return assignment ? (
            <div className="rounded-lg border border-[#cbdcd1] bg-[#f1f6f2] p-3" data-testid="source-current-manager">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#547666]">Current manager</p>
              <p className="mt-1 text-sm font-semibold text-[#244b3b]">{assignment.employee_name ?? 'Not assigned'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Verified ownership is maintained in Manager Mapping; original imported manager data remains unchanged.</p>
            </div>
          ) : null;
        })()}

        {!!entry.source_issues?.length && (
          <section className="rounded-lg border border-amber-300 bg-amber-50/70 p-4" data-testid="source-issues">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
              <AlertTriangle className="h-4 w-4" />Import notes and unresolved references
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-amber-950">
              {entry.source_issues.map((issue, index) => <li key={`${index}-${issue}`}>{issueText(issue)}</li>)}
            </ul>
          </section>
        )}

        <section aria-label="Record details">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Record details</h3>
              <p className="mt-1 text-xs text-muted-foreground">Unresolved assignments are marked without changing the original data.</p>
            </div>
            <span className="text-xs text-muted-foreground">{fields.length} details</span>
          </div>
          <div className="max-h-[42dvh] overflow-y-auto rounded-lg border">
            <dl className="grid gap-px bg-border sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="min-w-0 bg-card p-3 sm:p-3.5" data-testid={`source-field-${field.key}`}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{displayFieldLabel(field, entry.catalog)}</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-foreground">{field.reference ? displayReference(entry, field, snapshot) : rawValue(entry.values[field.key])}</dd>
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
