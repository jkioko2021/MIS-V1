import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { misApi, type BusinessFile } from '@/lib/mis-api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, RefreshCw, FileText, MessageSquare, FileCheck } from 'lucide-react';

const STATUS_COLOURS: Record<string, string> = {
  'REGISTERED':           'bg-slate-100 text-slate-700 border-slate-200',
  'FORWARDED':            'bg-blue-100 text-blue-700 border-blue-200',
  'RETURNED-INCOMPLETE':  'bg-amber-100 text-amber-700 border-amber-200',
  'MEDICAL UW-REVIEW':    'bg-purple-100 text-purple-700 border-purple-200',
  'BENEFIT VERIFICATION': 'bg-orange-100 text-orange-700 border-orange-200',
  'ALLOCATED':            'bg-cyan-100 text-cyan-700 border-cyan-200',
  'INVOICED':             'bg-green-100 text-green-700 border-green-200',
  'DISPATCHED':           'bg-emerald-100 text-emerald-700 border-emerald-200',
  'DECLINED':             'bg-red-100 text-red-700 border-red-200',
  'POLICY ISSUED':        'bg-teal-100 text-teal-700 border-teal-200',
};

const STATUSES = [
  'All','REGISTERED','FORWARDED','RETURNED-INCOMPLETE',
  'MEDICAL UW-REVIEW','BENEFIT VERIFICATION','ALLOCATED','INVOICED',
];

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return `KES ${Number(n).toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  );
}

function FileDetail({ fileNo, onClose }: { fileNo: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['business-file', fileNo],
    queryFn: () => misApi.businessFile(fileNo),
    enabled: !!fileNo,
  });

  const file = data?.data;
  const notes = (file as Record<string, unknown> & { notes?: Array<Record<string,unknown>> })?.notes ?? [];
  const docs  = (file as Record<string, unknown> & { docs?: Array<Record<string,unknown>> })?.docs ?? [];

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> {fileNo}
          </SheetTitle>
          {file && <StatusBadge status={String((file as Record<string,unknown>).file_status)} />}
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-32" /></div>
        ) : file ? (
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Notes ({notes.length})</TabsTrigger>
              <TabsTrigger value="docs" className="flex-1">Docs ({docs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4 pr-4">
                  {([
                    ['Proposer', (file as Record<string,unknown>).proposer_name],
                    ['Family Code', (file as Record<string,unknown>).family_code],
                    ['Received', (file as Record<string,unknown>).receive_dt],
                    ['Business Type', (file as Record<string,unknown>).business_type === 'N' ? 'New' : 'Renewal'],
                    ['Client Type', (file as Record<string,unknown>).client_type === 'C' ? 'Corporate' : 'Retail'],
                    ['Business', (file as Record<string,unknown>).business === 'M' ? 'Medical' : 'Non-Medical'],
                    ['Agent', (file as Record<string,unknown>).agent_name],
                    ['Rate Type', (file as Record<string,unknown>).rate_type === 'C' ? 'Corporate' : 'Standard'],
                    ['Premium', fmt(Number((file as Record<string,unknown>).premium))],
                    ['Paid Amount', fmt(Number((file as Record<string,unknown>).paid_amt))],
                    ['Pay Reference', (file as Record<string,unknown>).pay_ref_no],
                    ['Benefit Verified', (file as Record<string,unknown>).benefit_verified],
                    ['Medical UW', (file as Record<string,unknown>).medical_uw ? 'Yes' : 'No'],
                    ['Walk-In', (file as Record<string,unknown>).walk_in_client === 'Y' ? 'Yes' : 'No'],
                    ['M-Tiba', (file as Record<string,unknown>).is_mtiba ? 'Yes' : 'No'],
                    ['IPF', (file as Record<string,unknown>).is_ipf ? 'Yes' : 'No'],
                    ['Entered By', (file as Record<string,unknown>).entered_by],
                    ['Allocated To', (file as Record<string,unknown>).allocated_to],
                    ['Forward Date', (file as Record<string,unknown>).forward_date],
                  ] as [string, unknown][]).map(([label, val]) => val != null && val !== '' && (
                    <div key={label} className="flex justify-between text-sm gap-4">
                      <span className="text-muted-foreground shrink-0">{label}</span>
                      <span className="font-medium text-right">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <ScrollArea className="h-[calc(100vh-200px)]">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  <div className="space-y-3 pr-4">
                    {notes.map((n, i) => (
                      <div key={i} className="border rounded-lg p-3 text-sm">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="font-medium">{String(n.note_from)}</span>
                          <span>{new Date(String(n.note_date)).toLocaleString()}</span>
                        </div>
                        <p>{String(n.notes)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="docs" className="mt-4">
              <ScrollArea className="h-[calc(100vh-200px)]">
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents acknowledged.</p>
                ) : (
                  <div className="space-y-2 pr-4">
                    {docs.map((d, i) => (
                      <div key={i} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                        <span>{String(d.req_name)}</span>
                        <Badge variant={d.doc_id ? 'default' : 'secondary'}>
                          {d.doc_id ? 'Uploaded' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">File not found.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function BusinessTrackingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const params: Record<string, string> = {};
  if (statusFilter !== 'All') params.status = statusFilter;
  if (search) params.search = search;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['business', statusFilter, search],
    queryFn: () => misApi.business(params),
    staleTime: 30_000,
  });

  const files: BusinessFile[] = data?.data ?? [];

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Business Tracking</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} file(s)</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, file no, ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground text-xs">
                <th className="text-left p-3 font-medium">File No</th>
                <th className="text-left p-3 font-medium">Proposer</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Agent</th>
                <th className="text-right p-3 font-medium">Premium</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length: 8}).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({length:8}).map((_,j) => (
                      <td key={j} className="p-3"><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    No files match your filters.
                  </td>
                </tr>
              ) : (
                files.map(f => (
                  <tr
                    key={f.file_no}
                    className="border-b hover:bg-muted/40 cursor-pointer"
                    onClick={() => setSelectedFile(f.file_no)}
                  >
                    <td className="p-3 font-mono text-xs font-medium text-primary">{f.file_no}</td>
                    <td className="p-3 font-medium max-w-[180px] truncate">{f.proposer_name}</td>
                    <td className="p-3"><StatusBadge status={f.file_status} /></td>
                    <td className="p-3">
                      <span className="text-xs">
                        {f.client_type === 'C' ? 'Corp' : 'Ret'} · {f.business === 'M' ? 'Med' : 'Non-Med'}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs max-w-[120px] truncate">{f.agent_name}</td>
                    <td className="p-3 text-right font-medium">{fmt(f.premium)}</td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(f.receive_dt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{f.note_count > 0 ? `${f.note_count} note(s)` : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedFile && (
        <FileDetail fileNo={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
}
