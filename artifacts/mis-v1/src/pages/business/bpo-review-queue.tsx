import { useState } from 'react';
import { type BusinessFile } from '@/lib/mis-api';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function BpoReviewQueue({
  files,
  isLoading,
  isError,
  error,
  refetch,
  onSelectFile,
  sortBy,
  toggleSort,
}: {
  files: BusinessFile[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
  onSelectFile: (f: BusinessFile) => void;
  sortBy: string;
  toggleSort: (col: string) => void;
}) {
  const retailFiles = files.filter(f => f.client_type === 'R' && f.business === 'M' && f.business_type !== 'PR');
  const refundFiles = files.filter(f => f.business_type === 'PR');
  const otherFiles = files.filter(f => !retailFiles.includes(f) && !refundFiles.includes(f));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          Retail Review Queue
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{retailFiles.length}</Badge>
        </h3>
        <QueueTable
          files={retailFiles}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onSelectFile={onSelectFile}
          sortBy={sortBy}
          toggleSort={toggleSort}
        />
      </div>

      {otherFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Other BPO Review Files
            <Badge variant="secondary" className="bg-slate-500/10 text-slate-700 hover:bg-slate-500/20">{otherFiles.length}</Badge>
          </h3>
          <QueueTable
            files={otherFiles}
            isLoading={isLoading}
            isError={isError}
            error={error}
            refetch={refetch}
            onSelectFile={onSelectFile}
            sortBy={sortBy}
            toggleSort={toggleSort}
          />
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          Premium Refunds
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20">{refundFiles.length}</Badge>
        </h3>
        <QueueTable
          files={refundFiles}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onSelectFile={onSelectFile}
          sortBy={sortBy}
          toggleSort={toggleSort}
        />
      </div>
    </div>
  );
}

function QueueTable({ files, isLoading, isError, error, refetch, onSelectFile, sortBy, toggleSort }: any) {
  return (
    <div className="rounded-lg border bg-card overflow-x-auto shadow-sm">
      <table className="w-full min-w-[940px] text-sm">
        <thead>
          <tr className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wider">
            {[
              { key: 'bpo_forwarded_at', label: 'Forward Date', align: 'text-left' },
              { key: 'file_no', label: 'File No', align: 'text-left' },
              { key: 'proposer_name', label: 'Proposer', align: 'text-left' },
              { key: 'client_type', label: 'Client Type', align: 'text-left' },
              { key: 'business_type', label: 'Action', align: 'text-left' },
              { key: 'file_status', label: 'Status', align: 'text-left' },
              { key: 'entered_by', label: 'Entered By', align: 'text-left' },
              { key: 'source', label: 'Source', align: 'text-left' },
              { key: 'walk_in_client', label: 'Walk-In', align: 'text-center' },
            ].map(column => (
              <th key={column.key} className={`${column.align} px-3 py-3 font-semibold`}>
                <button
                  type="button"
                  onClick={() => toggleSort(column.key)}
                  className={cn('inline-flex items-center gap-1 hover:text-foreground', column.align === 'text-right' && 'ml-auto')}
                >
                  {column.label}
                  <ArrowUpDown className={cn('w-3 h-3', sortBy === column.key ? 'text-primary' : 'opacity-30')} />
                </button>
              </th>
            ))}
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b">
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="px-3 py-3"><Skeleton className="h-4" /></td>
                ))}
              </tr>
            ))
          ) : isError ? (
            <tr>
              <td colSpan={9} className="py-12 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive/70" />
                <p className="text-sm font-medium">Unable to load business tracking records.</p>
                <p className="text-xs text-muted-foreground mt-1">{String(error)}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
                  Try again
                </Button>
              </td>
            </tr>
          ) : files.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No files match your filters in this queue.
              </td>
            </tr>
          ) : files.map((f: any) => (
            <tr
              key={f.file_no}
              className="border-b hover:bg-muted/40 cursor-pointer group transition-colors"
              onClick={() => onSelectFile(f)}
            >
              <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {fmtDate(f.bpo_forwarded_at || f.created_at)}
              </td>
              <td className="px-3 py-3">
                <span className="font-mono text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded">{f.file_no}</span>
              </td>
              <td className="px-3 py-3 font-medium max-w-[200px] truncate">{f.proposer_name}</td>
              <td className="px-3 py-3 text-xs font-medium text-blue-600">
                {f.client_type === 'R' ? 'Retail' : f.client_type === 'S' ? 'SME' : 'Corporate'}
              </td>
              <td className="px-3 py-3 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit rounded px-2 py-0.5 inline-block mt-1">
                {f.business_type}
              </td>
              <td className="px-3 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-slate-50 text-slate-600">
                  {f.file_status}
                </span>
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-[120px]">
                {f.entered_by}
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {f.walk_in_client === 'Y' ? 'Walk-in' : 'Agency'}
              </td>
              <td className="px-3 py-3 text-center">
                {f.walk_in_client === 'Y' ? (
                  <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">YES</span>
                ) : (
                  <span className="text-xs text-muted-foreground opacity-50">—</span>
                )}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end">
                  <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-8px] group-hover:translate-x-0 duration-200" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
