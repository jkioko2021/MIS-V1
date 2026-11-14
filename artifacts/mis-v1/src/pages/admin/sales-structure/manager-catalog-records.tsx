import { useMemo, useState } from 'react';
import { ClipboardList, Eye, PencilLine } from 'lucide-react';
import type { SalesCatalogDefinition, SalesCatalogEntry, SalesCatalogSnapshot, SalesLevel } from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CatalogEditor } from './catalogs/catalog-editor';
import { SourceReferenceDetails } from './catalogs/source-reference-details';

const LEGACY_CATEGORIES = {
  'unit-managers': 'UNIT',
  'regional-managers': 'REGION',
} as const;

function levelLabel(level: keyof typeof LEGACY_CATEGORIES) {
  return level === 'unit-managers' ? 'Unit Manager' : 'Regional Manager';
}

export function ManagerCatalogRecords({
  snapshot,
  loading,
  error,
  onRetry,
  category,
  status,
  search,
}: {
  snapshot?: SalesCatalogSnapshot;
  loading: boolean;
  error?: string;
  onRetry: () => void;
  category: 'all' | SalesLevel;
  status: 'all' | 'active' | 'inactive';
  search: string;
}) {
  const [editing, setEditing] = useState<{ catalog: string; entry: SalesCatalogEntry } | null>(null);
  const [sourceDetails, setSourceDetails] = useState<{ definition: SalesCatalogDefinition; entry: SalesCatalogEntry } | null>(null);
  const records = useMemo(() => {
    if (!snapshot) return [];
    return (Object.keys(LEGACY_CATEGORIES) as Array<keyof typeof LEGACY_CATEGORIES>).flatMap(catalog => {
      const mappedLevel = LEGACY_CATEGORIES[catalog];
      if (category !== 'all' && category !== mappedLevel) return [];
      const definition = snapshot.definitions.find(item => item.key === catalog);
      if (!definition) return [];
      return snapshot.entries.filter(entry => entry.catalog === catalog)
        .filter(entry => status === 'all' || (status === 'active' ? entry.is_active : !entry.is_active))
        .filter(entry => {
          const linkedUser = !entry.source_reference && entry.employee_id != null
            ? snapshot.users.find(person => person.employee_id === entry.employee_id)
            : undefined;
          const text = [
            entry.name,
            entry.source_file ?? '',
            ...(entry.source_issues ?? []),
            ...Object.values(entry.values).map(value => value ?? ''),
            linkedUser?.employee_name ?? '',
            linkedUser?.username ?? '',
          ].join(' ').toLowerCase();
          return text.includes(search.trim().toLowerCase());
        })
        .map(entry => ({ catalog, definition, entry, level: mappedLevel }));
    }).sort((a, b) => a.level.localeCompare(b.level) || a.entry.name.localeCompare(b.entry.name));
  }, [snapshot, category, status, search]);
  const activeOperations = records.filter(item => !item.entry.source_reference && item.entry.is_active).length;
  const sourceCount = records.filter(item => item.entry.source_reference).length;

  return (
    <>
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm" data-testid="manager-catalog-records">
        <div className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold tracking-tight">Existing Unit and Regional Manager records</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Catalog records remain separate from manager designations. Imported identities are not matched to MIS accounts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{records.length} visible</Badge>
            <Badge variant="outline" className="border-[#cdded5] bg-[#f1f6f2] text-[#285b4b]">{activeOperations} editable active</Badge>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">{sourceCount} imported read-only</Badge>
          </div>
        </div>
        {loading ? <div className="space-y-3 p-5" aria-label="Loading existing manager records">{[0, 1, 2].map(index => <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/60" />)}</div>
          : error ? <Alert variant="destructive" className="m-4" data-testid="alert-manager-catalog-error"><ClipboardList className="h-4 w-4" /><AlertTitle>Existing catalog records unavailable</AlertTitle><AlertDescription className="flex items-center justify-between gap-3"><span>{error}</span><Button variant="outline" onClick={onRetry} data-testid="button-retry-manager-catalogs">Retry</Button></AlertDescription></Alert>
            : records.length === 0 ? <div className="px-6 py-10 text-center" data-testid="empty-manager-catalog-records"><ClipboardList className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No matching operational or source records</p><p className="mt-1 text-xs text-muted-foreground">Try another category, status or search.</p></div>
              : <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-[#f6f8f6] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <tr><th className="px-5 py-3">Manager record</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">MIS account link</th><th className="px-5 py-3">Origin</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Details</th></tr>
                  </thead>
                  <tbody>
                    {records.map(({ catalog, definition, entry, level }) => {
                      const linkedUser = !entry.source_reference && entry.employee_id != null
                        ? snapshot?.users.find(person => person.employee_id === entry.employee_id)
                        : undefined;
                      return (
                        <tr key={`${catalog}-${entry.id}`} className="border-t hover:bg-[#f7f9f7]" data-testid={`row-manager-catalog-${catalog}-${entry.id}`}>
                          <td className="px-5 py-3.5"><p className="font-medium">{entry.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{catalog === 'unit-managers' ? 'Unit manager catalog' : 'Regional manager catalog'}</p></td>
                          <td className="px-5 py-3.5"><Badge variant="outline" className="border-[#cdded5] bg-[#f1f6f2] text-[#285b4b]">{levelLabel(catalog)}</Badge></td>
                          <td className="px-5 py-3.5">{entry.source_reference ? <span className="text-amber-800">Imported identity · unverified</span> : linkedUser ? <span>{linkedUser.employee_name}<span className="block text-xs text-muted-foreground">{linkedUser.username}</span></span> : <span className="text-muted-foreground">No linked MIS account</span>}</td>
                          <td className="px-5 py-3.5">{entry.source_reference ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">Imported · read-only</Badge> : <Badge variant="outline">Operational record</Badge>}</td>
                          <td className="px-5 py-3.5"><Badge variant="outline" className={entry.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'}>{entry.is_active ? 'Active' : 'Inactive'}</Badge></td>
                          <td className="px-5 py-3.5 text-right">
                            {entry.source_reference
                              ? <Button variant="outline" size="sm" onClick={() => setSourceDetails({ definition, entry })} className="gap-1.5" data-testid={`button-view-manager-source-${entry.id}`}><Eye className="h-3.5 w-3.5" />View source</Button>
                              : <Button variant="outline" size="sm" onClick={() => setEditing({ catalog, entry })} className="gap-1.5" data-testid={`button-edit-manager-catalog-${entry.id}`}><PencilLine className="h-3.5 w-3.5" />Edit record</Button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>}
        <div className="border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground">Original metadata is kept in its catalog. Enrollment, imported references, and Manager Mapping are not synchronized or automatically linked.</div>
      </section>
      {snapshot && editing && <CatalogEditor key={`${editing.catalog}-${editing.entry.id}`} catalog={editing.catalog} definition={snapshot.definitions.find(item => item.key === editing.catalog)!} snapshot={snapshot} entry={editing.entry} onClose={() => setEditing(null)} />}
      {snapshot && sourceDetails && <SourceReferenceDetails entry={sourceDetails.entry} definition={sourceDetails.definition} snapshot={snapshot} onClose={() => setSourceDetails(null)} />}
    </>
  );
}
