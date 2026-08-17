import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Database, Table2, Eye, Code2, Search, ChevronRight,
  RefreshCw, AlertCircle, CheckCircle2, Loader2, Key,
  Link, Hash, ArrowUpDown, Calendar, Type, Sigma,
  FileCode2, GitBranch
} from 'lucide-react';
import { discoveryApi, type Database as DBMeta, type TableMeta, type ViewMeta, type ProcedureMeta, type ColumnMeta } from '@/lib/discovery-api';
import { cn } from '@/lib/utils';

// ─── types ────────────────────────────────────────────────────────────────────

type ObjectType = 'table' | 'view' | 'procedure';

interface SelectedObject {
  type: ObjectType;
  schema: string;
  name: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function typeIcon(dt: string) {
  const t = dt.toLowerCase();
  if (['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'].includes(t))
    return <Sigma className="w-3 h-3 text-blue-500" />;
  if (['varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext'].includes(t))
    return <Type className="w-3 h-3 text-green-500" />;
  if (['datetime', 'datetime2', 'date', 'time', 'smalldatetime', 'datetimeoffset'].includes(t))
    return <Calendar className="w-3 h-3 text-purple-500" />;
  if (['bit'].includes(t)) return <Hash className="w-3 h-3 text-orange-500" />;
  return <Type className="w-3 h-3 text-gray-400" />;
}

function formatColType(col: ColumnMeta) {
  let type = col.DATA_TYPE;
  if (col.CHARACTER_MAXIMUM_LENGTH) {
    type += col.CHARACTER_MAXIMUM_LENGTH === -1 ? '(MAX)' : `(${col.CHARACTER_MAXIMUM_LENGTH})`;
  } else if (col.NUMERIC_PRECISION != null) {
    type += col.NUMERIC_SCALE != null ? `(${col.NUMERIC_PRECISION},${col.NUMERIC_SCALE})` : `(${col.NUMERIC_PRECISION})`;
  }
  return type;
}

function formatNumber(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString();
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ db }: { db: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['discovery-status'],
    queryFn: discoveryApi.status,
    retry: 1,
    staleTime: 30_000,
  });

  return (
    <div className="flex items-center gap-2">
      {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      {!isLoading && (isError || !data?.ok) && (
        <Badge variant="destructive" className="text-xs gap-1">
          <AlertCircle className="w-3 h-3" /> Disconnected
        </Badge>
      )}
      {!isLoading && data?.ok && (
        <Badge className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-600">
          <CheckCircle2 className="w-3 h-3" /> Connected
        </Badge>
      )}
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()}>
        <RefreshCw className="w-3 h-3" />
      </Button>
      {db && <span className="text-xs text-muted-foreground font-mono">{db}</span>}
    </div>
  );
}

function ObjectTreeSection({
  label, icon, items, selectedObj, onSelect, objectType, schemaKey, nameKey, extraLabel,
}: {
  label: string;
  icon: React.ReactNode;
  items: Record<string, unknown>[] | undefined;
  selectedObj: SelectedObject | null;
  onSelect: (o: SelectedObject) => void;
  objectType: ObjectType;
  schemaKey: string;
  nameKey: string;
  extraLabel?: (item: Record<string, unknown>) => string;
}) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState('');

  const filtered = (items ?? []).filter((it) =>
    (it[nameKey] as string).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-1">
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground rounded transition-colors">
          <ChevronRight className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} />
          {icon}
          <span>{label}</span>
          <span className="ml-auto text-muted-foreground/60">{items?.length ?? 0}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {(items?.length ?? 0) > 8 && (
          <div className="px-2 pb-1">
            <Input
              placeholder={`Filter ${label.toLowerCase()}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-6 text-xs"
            />
          </div>
        )}
        <div className="space-y-px">
          {filtered.map((item) => {
            const schema = item[schemaKey] as string;
            const name = item[nameKey] as string;
            const isSelected =
              selectedObj?.type === objectType &&
              selectedObj.schema === schema &&
              selectedObj.name === name;
            return (
              <button
                key={`${schema}.${name}`}
                onClick={() => onSelect({ type: objectType, schema, name })}
                className={cn(
                  'flex items-center gap-1.5 w-full pl-7 pr-2 py-1 text-xs text-left rounded transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground/80'
                )}
              >
                <span className="font-mono truncate flex-1">{name}</span>
                {extraLabel && (
                  <span className={cn('text-[10px] shrink-0', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {extraLabel(item)}
                  </span>
                )}
                {schema !== 'dbo' && (
                  <span className={cn('text-[10px] font-mono shrink-0', isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground/60')}>
                    {schema}
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && filter && (
            <p className="pl-7 py-1 text-xs text-muted-foreground italic">No matches</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── column detail panel ──────────────────────────────────────────────────────

function ColumnsTab({ db, schema, table }: { db: string; schema: string; table: string }) {
  const { data: columns, isLoading, isError, error } = useQuery({
    queryKey: ['columns', db, schema, table],
    queryFn: () => discoveryApi.columns(db, schema, table),
    enabled: !!db && !!schema && !!table,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Column</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nullable</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Default</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Flags</th>
          </tr>
        </thead>
        <tbody>
          {columns?.map((col) => (
            <tr key={col.COLUMN_NAME} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="px-3 py-1.5 text-muted-foreground">{col.ORDINAL_POSITION}</td>
              <td className="px-3 py-1.5 font-mono">
                <div className="flex items-center gap-1.5">
                  {col.IS_PRIMARY_KEY ? <Key className="w-3 h-3 text-amber-500 shrink-0" /> : typeIcon(col.DATA_TYPE)}
                  <span className={cn(col.IS_PRIMARY_KEY && 'font-semibold text-amber-700 dark:text-amber-400')}>
                    {col.COLUMN_NAME}
                  </span>
                  {col.IS_FOREIGN_KEY === 1 && (
                    <Link className="w-3 h-3 text-blue-400 shrink-0" title={`FK → ${col.FK_TABLE}.${col.FK_COLUMN}`} />
                  )}
                </div>
              </td>
              <td className="px-3 py-1.5 font-mono text-blue-600 dark:text-blue-400">{formatColType(col)}</td>
              <td className="px-3 py-1.5 text-muted-foreground">{col.IS_NULLABLE}</td>
              <td className="px-3 py-1.5 font-mono text-muted-foreground truncate max-w-[150px]">
                {col.COLUMN_DEFAULT ?? '—'}
              </td>
              <td className="px-3 py-1.5">
                <div className="flex gap-1 flex-wrap">
                  {col.IS_IDENTITY === 1 && <Badge variant="secondary" className="text-[10px] h-4 px-1">IDENTITY</Badge>}
                  {col.IS_PRIMARY_KEY === 1 && <Badge className="text-[10px] h-4 px-1 bg-amber-500">PK</Badge>}
                  {col.IS_FOREIGN_KEY === 1 && <Badge variant="outline" className="text-[10px] h-4 px-1 text-blue-500 border-blue-300">FK</Badge>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── data preview panel ───────────────────────────────────────────────────────

function PreviewTab({ db, schema, table }: { db: string; schema: string; table: string }) {
  const [limit, setLimit] = useState(100);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['preview', db, schema, table, limit],
    queryFn: () => discoveryApi.preview(db, schema, table, limit),
    enabled: !!db,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message={(error as Error).message} />;

  const { rows = [], columns = [] } = data ?? {};

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <span className="text-xs text-muted-foreground">Showing {rows.length} rows</span>
        <div className="ml-auto flex gap-2">
          {[50, 100, 200, 500].map((n) => (
            <Button
              key={n}
              variant={limit === n ? 'default' : 'outline'}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => { setLimit(n); refetch(); }}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="text-xs w-max min-w-full">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap border-r border-border/30 last:border-r-0">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                {columns.map((col) => {
                  const val = row[col];
                  const display = val === null ? <span className="text-muted-foreground/50 italic">NULL</span>
                    : val instanceof Date ? new Date(val as string).toISOString()
                    : typeof val === 'boolean' ? String(val)
                    : String(val);
                  return (
                    <td key={col} className="px-3 py-1.5 whitespace-nowrap font-mono border-r border-border/20 last:border-r-0 max-w-[200px] truncate">
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            No rows returned
          </div>
        )}
      </div>
    </div>
  );
}

// ─── indexes panel ────────────────────────────────────────────────────────────

function IndexesTab({ db, schema, table }: { db: string; schema: string; table: string }) {
  const { data: indexes, isLoading, isError, error } = useQuery({
    queryKey: ['indexes', db, schema, table],
    queryFn: () => discoveryApi.indexes(db, schema, table),
    enabled: !!db,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="overflow-auto p-3">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Index Name</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Columns</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Flags</th>
          </tr>
        </thead>
        <tbody>
          {indexes?.map((idx) => (
            <tr key={idx.index_name} className="border-b border-border/50 hover:bg-muted/30">
              <td className="px-3 py-1.5 font-mono">{idx.index_name}</td>
              <td className="px-3 py-1.5 text-muted-foreground">{idx.index_type}</td>
              <td className="px-3 py-1.5 font-mono text-blue-600 dark:text-blue-400">{idx.columns}</td>
              <td className="px-3 py-1.5">
                <div className="flex gap-1">
                  {idx.is_primary_key && <Badge className="text-[10px] h-4 px-1 bg-amber-500">PK</Badge>}
                  {idx.is_unique && !idx.is_primary_key && <Badge variant="secondary" className="text-[10px] h-4 px-1">UNIQUE</Badge>}
                </div>
              </td>
            </tr>
          ))}
          {indexes?.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground text-xs italic">No indexes</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── procedure panel ──────────────────────────────────────────────────────────

function ProcedurePanel({ db, schema, proc }: { db: string; schema: string; proc: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['proc-def', db, schema, proc],
    queryFn: () => discoveryApi.procedureDefinition(db, schema, proc),
    enabled: !!db,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message={(error as Error).message} />;

  return (
    <Tabs defaultValue="definition" className="h-full flex flex-col">
      <div className="border-b px-3 pt-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-sm font-mono">{schema}.{proc}</span>
          <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">PROCEDURE</Badge>
        </div>
        <TabsList className="h-7">
          <TabsTrigger value="definition" className="text-xs h-6">Definition</TabsTrigger>
          <TabsTrigger value="parameters" className="text-xs h-6">Parameters ({data?.parameters.length ?? 0})</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="definition" className="flex-1 overflow-auto m-0 p-3">
        <pre className="text-xs font-mono bg-muted/50 rounded-md p-4 overflow-auto whitespace-pre-wrap leading-relaxed text-foreground/90">
          {data?.definition?.definition ?? 'Definition not available'}
        </pre>
      </TabsContent>
      <TabsContent value="parameters" className="flex-1 overflow-auto m-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Direction</th>
            </tr>
          </thead>
          <tbody>
            {data?.parameters.map((p) => (
              <tr key={p.parameter_id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-3 py-1.5 text-muted-foreground">{p.parameter_id}</td>
                <td className="px-3 py-1.5 font-mono">{p.parameter_name}</td>
                <td className="px-3 py-1.5 font-mono text-blue-600 dark:text-blue-400">{p.data_type}</td>
                <td className="px-3 py-1.5">
                  <Badge variant={p.is_output ? 'secondary' : 'outline'} className="text-[10px] h-4 px-1">
                    {p.is_output ? 'OUTPUT' : 'INPUT'}
                  </Badge>
                </td>
              </tr>
            ))}
            {data?.parameters.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground italic">No parameters</td></tr>
            )}
          </tbody>
        </table>
      </TabsContent>
    </Tabs>
  );
}

// ─── view panel ───────────────────────────────────────────────────────────────

function ViewPanel({ db, schema, view }: { db: string; schema: string; view: string }) {
  const { data: definition, isLoading, isError, error } = useQuery({
    queryKey: ['view-def', db, schema, view],
    queryFn: () => discoveryApi.viewDefinition(db, schema, view),
    enabled: !!db,
  });

  const { data: columns } = useQuery({
    queryKey: ['columns', db, schema, view],
    queryFn: () => discoveryApi.columns(db, schema, view),
    enabled: !!db,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message={(error as Error).message} />;

  return (
    <Tabs defaultValue="columns" className="h-full flex flex-col">
      <div className="border-b px-3 pt-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm font-mono">{schema}.{view}</span>
          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">VIEW</Badge>
        </div>
        <TabsList className="h-7">
          <TabsTrigger value="columns" className="text-xs h-6">Columns ({columns?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="definition" className="text-xs h-6">Definition</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="columns" className="flex-1 overflow-auto m-0">
        <ColumnsTab db={db} schema={schema} table={view} />
      </TabsContent>
      <TabsContent value="definition" className="flex-1 overflow-auto m-0 p-3">
        <pre className="text-xs font-mono bg-muted/50 rounded-md p-4 overflow-auto whitespace-pre-wrap leading-relaxed">
          {definition ?? 'Definition not available'}
        </pre>
      </TabsContent>
    </Tabs>
  );
}

// ─── table panel ─────────────────────────────────────────────────────────────

function TablePanel({ db, schema, table }: { db: string; schema: string; table: string }) {
  const { data: columns } = useQuery({
    queryKey: ['columns', db, schema, table],
    queryFn: () => discoveryApi.columns(db, schema, table),
    enabled: !!db,
  });

  const { data: rowCount } = useQuery({
    queryKey: ['rowcount', db, schema, table],
    queryFn: () => discoveryApi.rowcount(db, schema, table),
    enabled: !!db,
  });

  return (
    <Tabs defaultValue="columns" className="h-full flex flex-col">
      <div className="border-b px-3 pt-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Table2 className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-sm font-mono">{schema}.{table}</span>
          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">TABLE</Badge>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" /> {formatNumber(rowCount ?? null)} rows
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> {columns?.length ?? 0} columns
            </span>
          </div>
        </div>
        <TabsList className="h-7">
          <TabsTrigger value="columns" className="text-xs h-6">Columns</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs h-6">Data Preview</TabsTrigger>
          <TabsTrigger value="indexes" className="text-xs h-6">Indexes</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="columns" className="flex-1 overflow-auto m-0">
        <ColumnsTab db={db} schema={schema} table={table} />
      </TabsContent>
      <TabsContent value="preview" className="flex-1 overflow-hidden m-0 flex flex-col">
        <PreviewTab db={db} schema={schema} table={table} />
      </TabsContent>
      <TabsContent value="indexes" className="flex-1 overflow-auto m-0">
        <IndexesTab db={db} schema={schema} table={table} />
      </TabsContent>
    </Tabs>
  );
}

// ─── utils ────────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2 text-destructive">
      <AlertCircle className="w-5 h-5" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── search overlay ───────────────────────────────────────────────────────────

function SearchOverlay({
  db, onSelect, onClose,
}: {
  db: string;
  onSelect: (o: SelectedObject) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const { data: results, isLoading } = useQuery({
    queryKey: ['search', db, q],
    queryFn: () => discoveryApi.search(db, q),
    enabled: q.length > 1,
    staleTime: 10_000,
  });

  const typeIconMap: Record<string, React.ReactNode> = {
    TABLE: <Table2 className="w-3.5 h-3.5 text-emerald-500" />,
    VIEW: <Eye className="w-3.5 h-3.5 text-blue-500" />,
    PROCEDURE: <Code2 className="w-3.5 h-3.5 text-purple-500" />,
  };
  const typeMap: Record<string, ObjectType> = { TABLE: 'table', VIEW: 'view', PROCEDURE: 'procedure' };

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-16" onClick={onClose}>
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search tables, views, procedures..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        <ScrollArea className="max-h-80">
          {results?.map((r) => (
            <button
              key={`${r.type}.${r.schema_name}.${r.object_name}`}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted transition-colors text-left"
              onClick={() => { onSelect({ type: typeMap[r.type], schema: r.schema_name, name: r.object_name }); onClose(); }}
            >
              {typeIconMap[r.type]}
              <span className="font-mono text-sm">{r.object_name}</span>
              <span className="text-xs text-muted-foreground ml-auto">{r.schema_name}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1">{r.type}</Badge>
            </button>
          ))}
          {q.length > 1 && results?.length === 0 && !isLoading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results for "{q}"</div>
          )}
          {q.length <= 1 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters to search</div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [selectedObj, setSelectedObj] = useState<SelectedObject | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const { data: databases, isLoading: dbLoading, isError: dbError } = useQuery({
    queryKey: ['databases'],
    queryFn: discoveryApi.databases,
    retry: 1,
  });

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', selectedDb],
    queryFn: () => discoveryApi.tables(selectedDb),
    enabled: !!selectedDb,
  });

  const { data: views } = useQuery({
    queryKey: ['views', selectedDb],
    queryFn: () => discoveryApi.views(selectedDb),
    enabled: !!selectedDb,
  });

  const { data: procedures } = useQuery({
    queryKey: ['procedures', selectedDb],
    queryFn: () => discoveryApi.procedures(selectedDb),
    enabled: !!selectedDb,
  });

  // Auto-select first database
  useEffect(() => {
    if (databases && databases.length > 0 && !selectedDb) {
      setSelectedDb(databases[0].name);
    }
  }, [databases, selectedDb]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = useCallback((o: SelectedObject) => setSelectedObj(o), []);

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-12 border-b bg-background/95 backdrop-blur-sm shrink-0 z-10">
        <Database className="w-4 h-4 text-primary" />
        <h1 className="font-semibold text-sm">Database Discovery</h1>
        <div className="w-px h-4 bg-border" />
        <StatusBadge db={selectedDb} />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-3.5 h-3.5" />
            Search
            <kbd className="ml-1 text-[10px] bg-muted px-1 rounded">⌘K</kbd>
          </Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left sidebar */}
        <ResizablePanel defaultSize={22} minSize={16} maxSize={35}>
          <div className="flex flex-col h-full">
            {/* DB selector */}
            <div className="px-2 py-2 border-b shrink-0">
              {dbLoading && (
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading databases...
                </div>
              )}
              {dbError && (
                <div className="px-2 py-2 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Cannot connect to server
                </div>
              )}
              {databases && (
                <div className="space-y-px">
                  {databases.map((db) => (
                    <button
                      key={db.name}
                      onClick={() => { setSelectedDb(db.name); setSelectedObj(null); }}
                      className={cn(
                        'flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-left transition-colors',
                        selectedDb === db.name
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <Database className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono truncate flex-1">{db.name}</span>
                      <span className={cn('text-[10px] shrink-0', selectedDb === db.name ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {db.size_mb} MB
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Object tree */}
            <ScrollArea className="flex-1">
              <div className="p-1">
                {tablesLoading && (
                  <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading objects...
                  </div>
                )}
                {selectedDb && !tablesLoading && (
                  <>
                    <ObjectTreeSection
                      label="Tables"
                      icon={<Table2 className="w-3 h-3" />}
                      items={tables as unknown as Record<string, unknown>[]}
                      selectedObj={selectedObj}
                      onSelect={handleSelect}
                      objectType="table"
                      schemaKey="TABLE_SCHEMA"
                      nameKey="TABLE_NAME"
                      extraLabel={(it) => it.row_count_estimate != null ? formatNumber(it.row_count_estimate as number) : ''}
                    />
                    <ObjectTreeSection
                      label="Views"
                      icon={<Eye className="w-3 h-3" />}
                      items={views as unknown as Record<string, unknown>[]}
                      selectedObj={selectedObj}
                      onSelect={handleSelect}
                      objectType="view"
                      schemaKey="TABLE_SCHEMA"
                      nameKey="TABLE_NAME"
                    />
                    <ObjectTreeSection
                      label="Stored Procedures"
                      icon={<Code2 className="w-3 h-3" />}
                      items={procedures as unknown as Record<string, unknown>[]}
                      selectedObj={selectedObj}
                      onSelect={handleSelect}
                      objectType="procedure"
                      schemaKey="ROUTINE_SCHEMA"
                      nameKey="ROUTINE_NAME"
                    />
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Footer stats */}
            {selectedDb && !tablesLoading && (
              <div className="border-t px-3 py-2 text-[11px] text-muted-foreground flex gap-3 shrink-0">
                <span className="flex items-center gap-1"><Table2 className="w-3 h-3" />{tables?.length ?? 0}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views?.length ?? 0}</span>
                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{procedures?.length ?? 0}</span>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main content */}
        <ResizablePanel defaultSize={78}>
          <div className="h-full overflow-hidden">
            {!selectedDb && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Database className="w-10 h-10 opacity-20" />
                <p className="text-sm">Select a database to explore</p>
              </div>
            )}
            {selectedDb && !selectedObj && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <div className="flex gap-6">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                      <Table2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">{tables?.length ?? 0}</span>
                    <span className="text-xs">Tables</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">{views?.length ?? 0}</span>
                    <span className="text-xs">Views</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                      <Code2 className="w-6 h-6 text-purple-500" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">{procedures?.length ?? 0}</span>
                    <span className="text-xs">Procedures</span>
                  </div>
                </div>
                <p className="text-sm mt-2">Select an object from the sidebar</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSearch(true)}>
                  <Search className="w-3.5 h-3.5" /> Search objects
                </Button>
              </div>
            )}
            {selectedObj?.type === 'table' && (
              <TablePanel db={selectedDb} schema={selectedObj.schema} table={selectedObj.name} />
            )}
            {selectedObj?.type === 'view' && (
              <ViewPanel db={selectedDb} schema={selectedObj.schema} view={selectedObj.name} />
            )}
            {selectedObj?.type === 'procedure' && (
              <ProcedurePanel db={selectedDb} schema={selectedObj.schema} proc={selectedObj.name} />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Search overlay */}
      {showSearch && selectedDb && (
        <SearchOverlay db={selectedDb} onSelect={handleSelect} onClose={() => setShowSearch(false)} />
      )}
    </div>
  );
}
