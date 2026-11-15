import { useMemo, useState } from 'react';
import { ArrowUpRight, FileSearch, Search } from 'lucide-react';
import type {
  OrganisationCandidate,
  OrganisationNode,
  SalesCatalogDefinition,
  SalesCatalogEntry,
  SalesCatalogSnapshot,
  SalesLevel,
} from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SourceReferenceDetails } from '@/pages/admin/sales-structure/catalogs/source-reference-details';
import { displayFieldLabel, displayReference } from '@/pages/admin/sales-structure/catalogs/catalog-display';
import { LEVEL_LABEL, pathNames } from './shared';
import { PendingManagerDetails } from './pending-hierarchy-row';

type MedicalEntry = SalesCatalogEntry & { source_reference_id?: number };
type MedicalCandidate = OrganisationCandidate & { medical_details?: Record<string, string | null> };
type MedicalNode = OrganisationNode & { medical_details?: Record<string, string | null> };

const CATALOG_FOR_LEVEL: Partial<Record<SalesLevel, string>> = {
  REGION: 'sales-regions',
  BRANCH: 'sales-branches',
  UNIT: 'sales-units',
};

const LEVELS: SalesLevel[] = ['REGION', 'BRANCH', 'UNIT'];

function importedEntries(snapshot: SalesCatalogSnapshot) {
  return snapshot.entries.filter((entry) =>
    LEVELS.some((level) => CATALOG_FOR_LEVEL[level] === entry.catalog) && !!entry.source_reference,
  ) as MedicalEntry[];
}

function entryLevel(entry: SalesCatalogEntry): SalesLevel | undefined {
  return LEVELS.find((level) => CATALOG_FOR_LEVEL[level] === entry.catalog);
}

function RecordStatus({ adopted }: { adopted: boolean }) {
  return adopted
    ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50/70 text-emerald-800">Adopted operational record</Badge>
    : <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-950">Pending setup</Badge>;
}

export function MedicalRecords({
  snapshot,
  isLoading,
  isError,
  error,
  onRetry,
  nodes,
  candidates,
  level,
  showAllRecords = false,
  onAdopt,
}: {
  snapshot?: SalesCatalogSnapshot;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  nodes: OrganisationNode[];
  candidates: OrganisationCandidate[];
  level?: SalesLevel;
  showAllRecords?: boolean;
  onAdopt: (candidate: OrganisationCandidate) => void;
}) {
  const [search, setSearch] = useState('');
  const [sourceView, setSourceView] = useState<{ entry: SalesCatalogEntry; definition: SalesCatalogDefinition } | null>(null);
  const records = useMemo(() => snapshot ? importedEntries(snapshot) : [], [snapshot]);
  const levelRecords = useMemo(() => records.filter((entry) => !level || entryLevel(entry) === level), [records, level]);
  const filtered = useMemo(() => levelRecords.filter((entry) => {
    const linked = nodes.find((node) => node.level === entryLevel(entry) && node.code.toLowerCase() === entry.code.toLowerCase());
    const details = snapshot?.definitions.find((definition) => definition.key === entry.catalog);
    const referenceText = details && snapshot
      ? details.fields.filter((field) => field.reference).map((field) => displayReference(entry, field, snapshot)).join(' ')
      : '';
    return `${entry.code} ${entry.name} ${entry.source_file ?? ''} ${linked?.name ?? ''} ${referenceText}`
      .toLowerCase().includes(search.trim().toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code)), [levelRecords, nodes, search, snapshot]);

  const countFor = (target: SalesLevel) => records.filter((entry) => entryLevel(entry) === target).length;
  const linkedCountFor = (target: SalesLevel) => records.filter((entry) =>
    entryLevel(entry) === target && nodes.some((node) => node.level === target && node.code.toLowerCase() === entry.code.toLowerCase()),
  ).length;

  if (level === undefined && !showAllRecords) {
    return <section className="rounded-xl border border-[#d6e3da] bg-[#f7faf7] p-4 sm:p-5" data-testid="medical-import-counts">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#547666]">Imported Medical records</p>
          <h2 className="mt-1 text-lg font-semibold text-[#19392e]">Source records remain separate from the live hierarchy</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Read-only imports are counted separately. An adopted source row links to its operational node; it is not a second hierarchy entry.</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#bfd2c5] bg-card text-[#315b49]">Not active hierarchy</Badge>
      </div>
      {isLoading ? <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Loading imported Medical counts">
        {LEVELS.map((item) => <div key={item} className="h-[82px] animate-pulse rounded-lg bg-[#e8f0ea]" />)}
      </div> : isError ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
        <span>{error instanceof Error ? error.message : 'Imported Medical records could not be loaded.'}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>Retry imported records</Button>
      </div> : <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {LEVELS.map((item) => {
          const total = countFor(item);
          const linked = linkedCountFor(item);
          return <div key={item} className="rounded-lg border border-[#dce7df] bg-card px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Imported {LEVEL_LABEL[item]}</p>
            <p className="mt-1 text-2xl font-semibold text-[#244b3b]" data-testid={`count-imported-${item.toLowerCase()}`}>{total}</p>
            <p className="text-xs text-muted-foreground">{total - linked} pending setup · {linked} linked to operational node</p>
          </div>;
        })}
      </div>}
    </section>;
  }

  return <section className="overflow-hidden rounded-xl border border-[#d6e3da] bg-card shadow-sm" data-testid={`medical-imported-${level?.toLowerCase() ?? 'all'}`}>
    <div className="flex flex-col gap-3 border-b bg-[#f7faf7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Previously imported Medical {level ? level === 'BRANCH' ? 'branches' : `${LEVEL_LABEL[level].toLowerCase()}s` : 'records'}</h2>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-950">Read-only source</Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Search and review the original source rows beside their operational hierarchy status.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Imported manager records are not manager enrollments and do not qualify someone for an assignment.</p>
      </div>
      <div className="relative sm:w-[310px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, name or assignment" className="pl-9" aria-label="Search imported Medical records" data-testid="input-search-medical-records" />
      </div>
    </div>
    {isLoading ? <div className="space-y-3 p-5" aria-label="Loading imported Medical records">
      {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-muted/50" />)}
    </div> : isError ? <div className="flex flex-col items-center px-5 py-10 text-center">
      <FileSearch className="h-8 w-8 text-rose-700" />
      <h3 className="mt-3 font-semibold">Imported records unavailable</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{error instanceof Error ? error.message : 'The Medical source catalog could not be loaded.'}</p>
      <Button variant="outline" onClick={onRetry} className="mt-4">Retry</Button>
    </div> : filtered.length === 0 ? <div className="px-5 py-12 text-center">
      <FileSearch className="mx-auto h-8 w-8 text-[#678675]" />
      <h3 className="mt-3 font-semibold">{levelRecords.length ? 'No matching imported records' : level ? `No imported ${LEVEL_LABEL[level].toLowerCase()} records found` : 'No imported organisational records found'}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-5 text-muted-foreground">{levelRecords.length ? 'Try a different search term.' : 'The source catalog currently contains no records at this level.'}</p>
    </div> : <div className="divide-y">
      {filtered.map((entry) => {
        const recordLevel = entryLevel(entry);
        const linkedNode = nodes.find((node) => node.level === recordLevel && node.code.toLowerCase() === entry.code.toLowerCase());
        const candidate = candidates.find((item) =>
          item.level === recordLevel && item.source_reference_id === (entry.source_reference_id ?? entry.id),
        ) ?? candidates.find((item) => item.level === recordLevel && item.code.toLowerCase() === entry.code.toLowerCase());
        const definition = snapshot?.definitions.find((item) => item.key === entry.catalog);
        const keyFields = definition?.fields.filter((field) => field.reference) ?? [];
        return <article key={`${entry.catalog}-${entry.id}`} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5" data-testid={`medical-source-record-${entry.catalog}-${entry.id}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[#214638]">{entry.name}</h3>
              <span className="font-mono text-xs text-muted-foreground">{entry.code}</span>
              <RecordStatus adopted={!!linkedNode} />
              {!linkedNode && candidate?.branch_approved && <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-900">Approved for setup</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{LEVEL_LABEL[recordLevel!]} · original imported Medical source</p>
            {keyFields.length > 0 && snapshot && <div className="mt-3 rounded-lg bg-muted/25 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Imported source relationships · original values</p>
              <dl className="grid gap-2 sm:grid-cols-3">
                {keyFields.map((field) => <div key={field.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{displayFieldLabel(field, entry.catalog)}</dt>
                  <dd className="mt-0.5 break-words text-xs">{displayReference(entry, field, snapshot)}</dd>
                </div>)}
              </dl>
            </div>}
            {!linkedNode && candidate && <div className="mt-2 text-sm"><PendingManagerDetails candidate={candidate} /></div>}
            <div className="mt-2 rounded-lg border border-[#dce7df] bg-[#f7faf7] px-3 py-2 text-xs leading-5">
              <p className="font-semibold text-[#315b49]">Current operational hierarchy</p>
              {linkedNode
                ? <p className="mt-0.5 text-muted-foreground">
                  {pathNames(linkedNode.path) || linkedNode.name} · {linkedNode.is_active ? 'Active' : 'Inactive'}{linkedNode.manager_name ? ` · Manager: ${linkedNode.manager_name}` : ' · Manager not assigned'}
                </p>
                : <p className="mt-0.5 text-muted-foreground">Not adopted yet. No operational parent or manager is inferred from the imported source relationships.</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {definition && <Button variant="outline" size="sm" onClick={() => setSourceView({ entry, definition })} className="gap-1.5" data-testid={`button-view-medical-source-${entry.id}`}>
              <FileSearch className="h-3.5 w-3.5" />Full source details
            </Button>}
            {!linkedNode && <Button size="sm" onClick={() => candidate && onAdopt(candidate)} disabled={!candidate} className="gap-1.5 bg-[#1f5849] hover:bg-[#174536]" data-testid={`button-adopt-medical-source-${entry.id}`}>
              Configure hierarchy <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>}
          </div>
          {!linkedNode && !candidate && <p className="text-xs text-amber-900 sm:col-span-2">This imported row is not currently eligible as a hierarchy candidate. Refresh source data or create a valid node after its required parent and manager are available.</p>}
        </article>;
      })}
      <div className="flex flex-wrap justify-between gap-2 border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
        <span>{filtered.length} shown · {levelRecords.length} imported source records</span>
        <span>Original records are read-only; adoption creates or configures a separate operational node.</span>
      </div>
    </div>}
    {sourceView && snapshot && <SourceReferenceDetails entry={sourceView.entry} definition={sourceView.definition} snapshot={snapshot} onClose={() => setSourceView(null)} />}
  </section>;
}
