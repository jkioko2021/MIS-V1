import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, BadgeCheck, Banknote, BriefcaseBusiness,
  CalendarDays, Check, ChevronRight, CircleAlert, Clock3, FileCheck2, FileSearch,
  FileText, Filter, FolderOpen, LockKeyhole, RefreshCw, Search, ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { businessStatusApi, type StatusDetail, type StatusFile, type StatusFilters } from '@/lib/business-status-api';

const PAGE_SIZE = 25;
const BUSINESS_TYPES: Array<[string, string]> = [
  ['N', 'New'], ['R', 'Renewal'], ['A', 'Addon'], ['T', 'Termination'],
  ['RT', 'Reinstatement'], ['CC', 'Category Change'], ['PR', 'Premium Recon'],
];
const CLIENT_TYPES: Array<[string, string]> = [['R', 'Retail'], ['C', 'Corporate'], ['S', 'SME']];
const businessLabel = (code: string) => BUSINESS_TYPES.find(([value]) => value === code)?.[1] ?? code;
const clientLabel = (code: string) => CLIENT_TYPES.find(([value]) => value === code)?.[1] ?? code;
const dateLabel = (value?: string | null, time = false) => value
  ? new Date(value).toLocaleString('en-GB', time
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' })
  : '—';
const moneyLabel = (value?: number | null) => value == null ? '—'
  : `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const readable = (value: string | null | undefined) => value || '—';
const isPolicy = (doc: StatusDetail['documents'][number]) =>
  (doc.req_name ?? '').trim().toLowerCase() === 'policy schedule'
  || String(doc.code ?? '').trim().toUpperCase() === 'RET36';
const isAml = (doc: StatusDetail['documents'][number]) =>
  `${doc.req_name ?? ''} ${doc.filename} ${doc.code ?? ''}`.toLowerCase().includes('aml');

function Milestone({ label, done }: { label: string; done: boolean }) {
  return <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-semibold ${done ? 'border-[#c8ded4] bg-[#edf6f1] text-[#386b5a]' : 'border-[#e6e9e5] bg-[#f7f8f5] text-[#9aa49d]'}`} data-testid={`milestone-${label.toLowerCase()}`}>
    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${done ? 'bg-[#4a8a73] text-white' : 'border border-[#c8d0ca]'}`}>{done && <Check size={10} />}</span>{label}
  </div>;
}

function DetailPanel({ fileNo, onClose }: { fileNo: string; onClose: () => void }) {
  const { user } = useAuth();
  const actor = [user?.username ?? null, user?.profileId ?? null, user?.profileName ?? null, user?.department ?? null];
  const detailQuery = useQuery({
    queryKey: ['business-status-detail', ...actor, fileNo],
    queryFn: () => businessStatusApi.detail(fileNo),
    enabled: !!user && !!fileNo,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
  const [policyOnly, setPolicyOnly] = useState(false);
  useEffect(() => { setPolicyOnly(false); }, [fileNo]);
  const detail = detailQuery.data?.data;
  const file = detail?.file;
  const docs = detail?.documents ?? [];
  const shownDocs = policyOnly ? docs.filter(isPolicy) : docs;
  const amlDocs = docs.filter(isAml);
  return <div className="fixed inset-0 z-50 flex justify-end" role="presentation" data-testid="business-status-detail-overlay">
    <button type="button" aria-label="Close business detail" onClick={onClose} className="absolute inset-0 bg-[#172e2a]/40 backdrop-blur-[2px]" data-testid="button-close-status-backdrop" />
    <section role="dialog" aria-modal="true" aria-label="Business file details" className="relative flex h-full w-full max-w-[780px] flex-col border-l border-[#d8e4dd] bg-[#fbfcf8] shadow-2xl" data-testid="panel-business-status-detail">
      <header className="shrink-0 border-b border-[#dce6df] bg-[#eef5ef] px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.19em] text-[#5f8071]"><span className="h-px w-5 bg-[#8ca998]" /> Business record · read only</p>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#607a6e] hover:bg-[#e0ebe3]" aria-label="Close detail" data-testid="button-close-status-detail"><X size={17} /></button>
        </div>
        {file ? <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-[#245e50] px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-white" data-testid="text-status-detail-file-number">{file.file_no}</span><span className="rounded-full border border-[#d7e1d8] bg-[#f9fbf7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5c7164]">{file.file_status}</span>{file.is_completed && <span className="rounded-full bg-[#e7eee5] px-2.5 py-1 text-[10px] font-bold uppercase text-[#69806e]">Completed</span>}</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-.035em] text-[#203e36] sm:text-2xl" data-testid="text-status-detail-proposer">{file.proposer_name}</h2>
          <p className="mt-1 text-xs text-[#71837a]">{businessLabel(file.business_type)} · {clientLabel(file.client_type)} · Received {dateLabel(file.receive_dt)}</p>
        </div> : <div className="mt-4"><h2 className="text-xl font-semibold text-[#203e36]">Business file</h2><p className="mt-1 text-xs text-[#71837a]">{fileNo}</p></div>}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7" data-testid="status-detail-scroll">
        {detailQuery.isLoading ? <div className="space-y-4 animate-pulse" aria-label="Loading file detail"><div className="h-24 rounded-xl bg-[#e9f0e9]" /><div className="h-36 rounded-xl bg-[#e9f0e9]" /><div className="h-48 rounded-xl bg-[#e9f0e9]" /></div>
          : detailQuery.isError || !detail || !file ? <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-[#e5d4ca] bg-[#fcf7f2] p-7 text-center" role="alert" data-testid="status-detail-error"><CircleAlert className="mb-3 text-[#a65f46]" size={23} /><h3 className="font-semibold text-[#6c493d]">File detail unavailable</h3><p className="mt-2 max-w-md text-xs leading-5 text-[#8a7167]">{detailQuery.error instanceof Error ? detailQuery.error.message : 'The current record could not be loaded.'}</p><button type="button" onClick={() => detailQuery.refetch()} className="mt-4 rounded-lg border border-[#ddc9bd] bg-white px-4 py-2 text-xs font-bold text-[#704f41]" data-testid="button-retry-status-detail">Retry</button></div>
          : <div className="space-y-6">
            <section className="rounded-xl border border-[#dce7dd] bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2"><FileCheck2 size={16} className="text-[#4d806d]" /><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#638171]">Progress milestones</h3></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Milestone label="Forwarded" done={file.forwarded} /><Milestone label="Invoiced" done={file.invoiced} /><Milestone label="Receipted" done={file.receipted} /><Milestone label="Filed" done={file.filed} />
              </div>
              <div className="mt-4 grid gap-3 border-t border-[#edf0eb] pt-4 sm:grid-cols-3">
                <Info label="Current queue" value={file.current_queue} /><Info label="Responsible" value={file.responsible_name || file.responsible_username} /><Info label="Last updated" value={dateLabel(file.updated_at, true)} />
              </div>
            </section>
            <section>
              <SectionHeading icon={<Banknote size={15} />} title="Financial snapshot" />
              {detail.financial ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{([
                ['Premium', moneyLabel(detail.financial.premium)], ['Paid amount', moneyLabel(detail.financial.paid_amt)],
                ['Payment status', readable(detail.financial.paid_status)], ['Payment reference', readable(detail.financial.pay_ref_no)],
                ['Invoice number', readable(detail.financial.invoice_no)], ['Invoice date', dateLabel(detail.financial.invoice_date)],
                ['Receipt number', readable(detail.financial.receipt_no)], ['Receipt date', dateLabel(detail.financial.receipt_date)],
              ] as Array<[string, string]>).map(([label, value]) => <InfoCard key={label} label={label} value={value} />)}</div>
                : <PrivacyNotice reason={detail.restriction_reason} />}
            </section>
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeading icon={<FolderOpen size={15} />} title="Documents" count={shownDocs.length} />
                <button type="button" onClick={() => setPolicyOnly(value => !value)} aria-pressed={policyOnly} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${policyOnly ? 'border-[#9bb9a5] bg-[#eaf3eb] text-[#35684f]' : 'border-[#dce5dd] bg-white text-[#697d70] hover:bg-[#f4f7f3]'}`} data-testid="button-filter-policy-documents"><Filter size={13} /> Policy schedules {policyOnly && <Check size={12} />}</button>
              </div>
              {file.can_view_details === false ? <PrivacyNotice reason={detail.restriction_reason} compact />
                : shownDocs.length ? <div className="mt-3 divide-y divide-[#edf0eb] overflow-hidden rounded-xl border border-[#e0e8e0] bg-white">
                  {shownDocs.map(doc => <article key={doc.upload_id} className="flex items-start gap-3 px-3 py-3.5 sm:px-4" data-testid={`row-status-document-${doc.upload_id}`}>
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf4ee] text-[#5b806d]"><FileText size={15} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-[#355349]">{doc.filename}</p>
                      <p className="mt-1 text-[10px] leading-4 text-[#839087]">{doc.req_name || 'Document'}{doc.code ? ` · ${doc.code}` : ''} · {doc.uploaded_by} · {dateLabel(doc.uploaded_at, true)}</p>
                      {(doc.invoice_no || doc.amount != null || doc.policy_code || doc.risk_rate || doc.risk_reason) && <p className="mt-1 text-[10px] leading-4 text-[#5d7569]">{[
                        doc.invoice_no && `Invoice ${doc.invoice_no}`, doc.amount != null && moneyLabel(doc.amount),
                        doc.policy_code && `Policy ${doc.policy_code}`, doc.risk_rate && `Risk ${doc.risk_rate}`,
                        doc.risk_reason && `Risk reason: ${doc.risk_reason}`,
                      ].filter(Boolean).join(' · ')}</p>}
                    </div>
                    <a href={businessStatusApi.downloadUrl(fileNo, doc.upload_id)} target="_blank" rel="noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e1e9e1] text-[#547766] hover:bg-[#eef5ef]" aria-label={`Download ${doc.filename}`} data-testid={`link-download-status-document-${doc.upload_id}`}><ArrowDownToLine size={15} /></a>
                  </article>)}
                </div> : <div className="mt-3 rounded-xl border border-dashed border-[#d5e1d7] bg-[#f8faf6] px-4 py-8 text-center"><FolderOpen className="mx-auto mb-2 text-[#91a499]" size={22} /><p className="text-sm font-semibold text-[#536d5f]">{policyOnly ? 'No policy schedules found' : 'No documents recorded'}</p><p className="mt-1 text-xs text-[#849188]">{policyOnly ? 'Documents marked Policy Schedule or RET36 will appear here.' : 'Uploaded documents will appear on this record.'}</p></div>}
              {file.can_view_details && <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${amlDocs.length ? 'border-[#cddfd1] bg-[#eff6ef] text-[#4c7057]' : 'border-[#e4e8df] bg-[#f7f8f4] text-[#748076]'}`} data-testid="status-aml-metadata"><ShieldCheck size={14} className="mt-0.5 shrink-0" /><span><strong>AML document metadata:</strong> {amlDocs.length ? `${amlDocs.length} AML document${amlDocs.length === 1 ? '' : 's'} on record${amlDocs.some(isPolicy) ? ', including one in the policy filter' : ''}.` : 'No AML document is identified in the available document metadata.'}</span></div>}
            </section>
            <section>
              <SectionHeading icon={<Clock3 size={15} />} title="Movement history" count={detail.movements.length} />
              {detail.movements.length ? <div className="mt-3 space-y-0" data-testid="status-movement-history">
                {detail.movements.map((movement, index) => <article key={movement.work_item_id} className="relative flex gap-3 pb-5 last:pb-0" data-testid={`row-status-movement-${movement.work_item_id}`}>
                  {index < detail.movements.length - 1 && <span className="absolute bottom-0 left-[7px] top-4 w-px bg-[#dce7dd]" />}
                  <span className="relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-[#8eae98] bg-[#f9fbf7]" />
                  <div className="min-w-0 flex-1 rounded-lg border border-[#e4eae3] bg-white px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><p className="text-sm font-semibold text-[#38564a]">{movement.queue_name}</p><span className="text-[10px] text-[#89948b]">{dateLabel(movement.forwarded_at, true)}</span></div>
                    <p className="mt-1 text-xs text-[#66796e]">{movement.work_status}{movement.assigned_name ? ` · ${movement.assigned_name}` : movement.assigned_to ? ` · ${movement.assigned_to}` : ''}</p>
                    {(movement.forwarded_by || movement.assigned_by) && <p className="mt-1 text-[10px] text-[#929c93]">{movement.forwarded_by ? `Forwarded by ${movement.forwarded_by}` : `Assigned by ${movement.assigned_by}`}</p>}
                  </div>
                </article>)}
              </div> : <EmptyInline text="No movement history is available." />}
            </section>
            <section>
              <SectionHeading icon={<FileSearch size={15} />} title="Retained notes" count={detail.notes.length} />
              {file.can_view_details === false ? <PrivacyNotice reason={detail.restriction_reason} compact />
                : detail.notes.length ? <div className="mt-3 space-y-2">{detail.notes.map(note => <article key={note.note_id} className="rounded-lg border border-[#e3e9e1] bg-white p-3.5" data-testid={`row-status-note-${note.note_id}`}><div className="flex flex-wrap justify-between gap-2 text-[10px] text-[#849087]"><span className="font-semibold text-[#587163]">{note.note_from}</span><span>{dateLabel(note.note_date, true)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#50675a]">{note.notes}</p></article>)}</div> : <EmptyInline text="No retained notes are available." />}
            </section>
          </div>}
      </div>
      <footer className="shrink-0 border-t border-[#e0e8df] bg-[#f7f9f5] px-5 py-3 text-[10px] text-[#879188] sm:px-7">Read-only status view · refreshed every 30 seconds <span className="ml-1">{detailQuery.dataUpdatedAt ? `· Updated ${dateLabel(new Date(detailQuery.dataUpdatedAt).toISOString(), true)}` : ''}</span></footer>
    </section>
  </div>;
}

function SectionHeading({ icon, title, count }: { icon: ReactNode; title: string; count?: number }) {
  return <div className="flex items-center gap-2 text-[#56806b]">{icon}<h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#668171]">{title}</h3>{count !== undefined && <span className="rounded-full bg-[#edf2eb] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#728275]">{count}</span>}</div>;
}
function Info({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#8a968b]">{label}</p><p className="mt-1 break-words text-xs font-semibold text-[#456052]" data-testid={`text-status-${label.toLowerCase().replaceAll(' ', '-')}`}>{readable(value)}</p></div>;
}
function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-[#e2e9e0] bg-white px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-[#89958a]">{label}</p><p className="mt-1 break-words text-xs font-semibold text-[#496052]">{value}</p></div>;
}
function PrivacyNotice({ reason, compact = false }: { reason: string | null; compact?: boolean }) {
  return <div className={`flex items-start gap-3 rounded-xl border border-[#e2dfcf] bg-[#f8f6ed] text-[#756e54] ${compact ? 'mt-3 p-3' : 'mt-3 p-4'}`} data-testid="status-privacy-restriction"><LockKeyhole size={16} className="mt-0.5 shrink-0 text-[#8f835b]" /><div><p className="text-xs font-bold">Restricted information</p><p className="mt-1 text-xs leading-5">{reason || 'Financial information, documents and retained notes are restricted by your current access scope. File status and movement history remain visible.'}</p></div></div>;
}
function EmptyInline({ text }: { text: string }) {
  return <p className="mt-3 rounded-lg border border-dashed border-[#dbe4da] bg-[#f8faf6] px-4 py-5 text-center text-xs text-[#859087]">{text}</p>;
}

function StatusRow({ file, onSelect }: { file: StatusFile; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className="group grid w-full gap-3 border-b border-[#e9ede7] px-4 py-4 text-left transition-colors hover:bg-[#f5f8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7da18a] sm:grid-cols-[minmax(0,1.4fr)_minmax(125px,.8fr)_minmax(115px,.75fr)_auto] sm:items-center sm:px-5" data-testid={`button-open-status-${file.file_no}`}>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] font-bold text-[#356753]">{file.file_no}</span><span className="rounded-full border border-[#dce6dc] bg-[#f9fbf7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#6c7e70]">{file.file_status}</span>{file.is_completed && <span className="text-[9px] font-bold uppercase tracking-wide text-[#89928a]">History</span>}</div>
      <p className="mt-1 truncate text-sm font-semibold text-[#304b3e]">{file.proposer_name}</p>
      <p className="mt-1 truncate text-[10px] text-[#889389]">{file.business} · {businessLabel(file.business_type)} · {clientLabel(file.client_type)}{file.product ? ` · ${file.product}` : ''}</p>
    </div>
    <div className="flex items-center gap-2 sm:block"><span className="text-[9px] font-bold uppercase tracking-[.11em] text-[#9aa398] sm:hidden">Queue</span><div className="min-w-0 truncate text-xs font-medium text-[#5c7465]">{file.current_queue || 'No active queue'}</div><div className="mt-1 truncate text-[10px] text-[#929c92]">{file.responsible_name || file.responsible_username || 'Unassigned'}</div></div>
    <div className="flex items-center justify-between gap-3 sm:block"><div className="flex items-center gap-2 text-[10px] text-[#879288]"><CalendarDays size={12} /><span>Received {dateLabel(file.receive_dt)}</span></div><div className="mt-1 text-[9px] text-[#a0a89f]">Updated {dateLabel(file.updated_at, true)}</div></div>
    <div className="flex items-center justify-between gap-3 sm:justify-end"><div className="flex flex-wrap gap-1.5"><MiniMilestone label="Fwd" value={file.forwarded} /><MiniMilestone label="Inv" value={file.invoiced} /><MiniMilestone label="Rcpt" value={file.receipted} /><MiniMilestone label="File" value={file.filed} /></div><ChevronRight size={16} className="shrink-0 text-[#a2aea2] transition-transform group-hover:translate-x-0.5 group-hover:text-[#4f7e64]" /></div>
  </button>;
}
function MiniMilestone({ label, value }: { label: string; value: boolean }) {
  return <span title={`${label}: ${value ? 'complete' : 'pending'}`} className={`rounded px-1.5 py-1 font-mono text-[8px] font-bold ${value ? 'bg-[#e9f2e8] text-[#47745a]' : 'bg-[#f1f2ee] text-[#9ba39a]'}`}>{label} {value ? 'OK' : '—'}</span>;
}

export default function BusinessStatusPage() {
  const { user } = useAuth();
  const actor = [user?.username ?? null, user?.profileId ?? null, user?.profileName ?? null, user?.department ?? null];
  const [searchDraft, setSearchDraft] = useState('');
  const [filters, setFilters] = useState<StatusFilters>({ search_by: 'F', include_completed: false, page: 1 });
  const [selectedFile, setSelectedFile] = useState('');
  const [advanced, setAdvanced] = useState(false);
  useEffect(() => { const previous = document.title; document.title = 'Business Status | AAR MIS'; return () => { document.title = previous; }; }, []);
  const optionsQuery = useQuery({
    queryKey: ['business-status-options', ...actor],
    queryFn: () => businessStatusApi.options(),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
  const listQuery = useQuery({
    queryKey: ['business-status-list', ...actor, filters],
    queryFn: () => businessStatusApi.list(filters),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
  const data = listQuery.data;
  const rows = data?.data ?? [];
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize || PAGE_SIZE)));
  const page = filters.page ?? 1;
  const businessTypes = useMemo(() => {
    const dynamic = optionsQuery.data?.data.businessTypes ?? [];
    return Array.from(new Set([...BUSINESS_TYPES.map(([code]) => code), ...dynamic]));
  }, [optionsQuery.data]);
  const setFilter = <K extends keyof StatusFilters>(key: K, value: StatusFilters[K]) =>
    setFilters(current => ({ ...current, [key]: value, page: 1 }));
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters(current => ({ ...current, search: searchDraft.trim() || undefined, page: 1 }));
  };
  return <main className="min-h-[100dvh] bg-[#f2f5ef] px-4 py-5 text-[#294238] sm:px-6 sm:py-7" data-testid="page-business-status">
    <div className="mx-auto max-w-[1450px]">
      <header className="relative mb-6 overflow-hidden rounded-2xl border border-[#dce7dc] bg-[#eaf2e9] px-5 py-6 sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-[#ccddcd] opacity-80" /><div className="pointer-events-none absolute -right-1 top-2 h-44 w-44 rounded-full border border-[#d2e1d2]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#62806e]"><span className="h-px w-6 bg-[#8aaa93]" /> AAR MIS <span className="text-[#a1b2a2]">/</span> Business Tracking</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-.05em] text-[#203e34] sm:text-[36px]" data-testid="heading-business-status">Business Status</h1><p className="mt-1 max-w-xl text-sm leading-6 text-[#6b8072]">Follow a business file from registration through handoff, receipt and filing.</p></div>
          <div className="flex items-center gap-2 rounded-lg border border-[#d5e2d5] bg-[#f8faf6] px-3 py-2 text-[10px] font-semibold text-[#63806e]" data-testid="status-scope-label"><ShieldCheck size={14} className="text-[#518269]" />{data?.scopeLabel || optionsQuery.data?.data.scopeLabel || 'Records shown are limited by your current access'}</div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[#dce5dc] bg-[#f8faf6] px-3 py-2 text-[10px] text-[#708375]"><Clock3 size={13} /> Auto refresh · 30 sec</div>
        </div>
      </header>
      <section className="overflow-hidden rounded-2xl border border-[#dce5dc] bg-[#fbfcf9] shadow-[0_16px_45px_-40px_rgba(37,73,53,.4)]" aria-label="Business status search">
        <div className="border-b border-[#e5ebe3] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="flex items-center gap-2"><BriefcaseBusiness size={15} className="text-[#5a8067]" /><h2 className="text-sm font-semibold text-[#365447]">Find a business file</h2></div><p className="mt-1 text-[10px] text-[#89958a]">Search by file number or proposer. Access is checked against your live profile.</p></div>
            <button type="button" onClick={() => void listQuery.refetch()} disabled={listQuery.isFetching} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dce5dc] bg-white px-3 text-[11px] font-semibold text-[#64796a] hover:bg-[#f4f7f2] disabled:opacity-50" data-testid="button-refresh-business-status"><RefreshCw size={13} className={listQuery.isFetching ? 'animate-spin' : ''} /> Refresh</button>
          </div>
          <form onSubmit={submitSearch} className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-[#dbe5db] bg-white px-3 text-[#829184] focus-within:border-[#83a48a] focus-within:ring-2 focus-within:ring-[#83a48a]/15"><Search size={16} /><input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder={filters.search_by === 'P' ? 'Proposer name…' : 'F file number…'} className="min-w-0 flex-1 bg-transparent text-sm text-[#304d40] outline-none placeholder:text-[#a4ada3]" aria-label="Search business files" data-testid="input-business-status-search" /></label>
            <select value={filters.search_by ?? 'F'} onChange={event => setFilter('search_by', event.target.value as 'F' | 'P')} aria-label="Search field" className="h-11 rounded-lg border border-[#dbe5db] bg-white px-3 text-xs font-semibold text-[#607366] outline-none focus:border-[#83a48a]" data-testid="select-business-status-search-by"><option value="F">File number</option><option value="P">Proposer</option></select>
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#316d55] px-5 text-xs font-bold text-white transition-colors hover:bg-[#285e48]" data-testid="button-search-business-status"><Search size={14} /> Search</button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SelectFilter label="Business type" testId="select-business-status-business-type" value={filters.business_type ?? ''} onChange={value => setFilter('business_type', value || undefined)}><option value="">All business types</option>{businessTypes.map(code => <option key={code} value={code}>{businessLabel(code)}</option>)}</SelectFilter>
            <SelectFilter label="Client type" testId="select-business-status-client-type" value={filters.client_type ?? ''} onChange={value => setFilter('client_type', value || undefined)}><option value="">All client types</option>{CLIENT_TYPES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</SelectFilter>
            <SelectFilter label="Status" testId="select-business-status-status" value={filters.status ?? ''} onChange={value => setFilter('status', value || undefined)}><option value="">All statuses</option>{optionsQuery.data?.data.statuses.map(status => <option key={status} value={status}>{status}</option>)}</SelectFilter>
            <button type="button" onClick={() => setAdvanced(value => !value)} aria-expanded={advanced} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold text-[#657a6b] hover:bg-[#f0f4ee]" data-testid="button-toggle-status-filters"><Filter size={13} /> More filters</button>
            <button type="button" onClick={() => { setSearchDraft(''); setFilters({ search_by: 'F', include_completed: false, page: 1 }); }} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-semibold text-[#8b968b] hover:bg-[#f0f4ee]" data-testid="button-clear-status-filters"><X size={12} /> Clear</button>
          </div>
          {advanced && <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-[#edf0eb] pt-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#617568]"><input type="checkbox" checked={!!filters.include_completed} onChange={event => setFilter('include_completed', event.target.checked)} className="h-4 w-4 accent-[#397457]" data-testid="checkbox-include-completed" /> Include filed and completed history</label>
            <p className="text-[10px] text-[#929c92]">Completed records are excluded until requested.</p>
          </div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e9ede7] bg-[#f8faf6] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-[10px] text-[#728174]"><span className="h-1.5 w-1.5 rounded-full bg-[#71a17c]" /><span>{data?.scopeLabel || 'Visible records in your current scope'}</span></div>
          <span className="font-mono text-[10px] font-semibold text-[#718072]" data-testid="text-business-status-result-count">{data ? `${data.total.toLocaleString()} records` : listQuery.isLoading ? 'Loading records' : ''}</span>
        </div>
        <div>
          {listQuery.isLoading ? <div className="space-y-0 p-4" aria-label="Loading business statuses">{[0, 1, 2, 3, 4].map(index => <div key={index} className="grid animate-pulse gap-3 border-b border-[#edf0eb] py-4 sm:grid-cols-4"><div className="space-y-2"><div className="h-3 w-32 rounded bg-[#e8eee6]" /><div className="h-4 w-48 rounded bg-[#e8eee6]" /><div className="h-3 w-36 rounded bg-[#eef2ec]" /></div><div className="h-8 rounded bg-[#eef2ec]" /><div className="h-8 rounded bg-[#eef2ec]" /><div className="h-8 rounded bg-[#eef2ec]" /></div>)}</div>
            : listQuery.isError ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center" role="alert" data-testid="status-business-list-error"><CircleAlert className="mb-3 text-[#a85f48]" size={24} /><p className="text-sm font-semibold text-[#69493e]">Business status could not load</p><p className="mt-2 max-w-md text-xs leading-5 text-[#89756c]">{listQuery.error instanceof Error ? listQuery.error.message : 'The status service is unavailable. Your search is unchanged.'}</p><button type="button" onClick={() => listQuery.refetch()} className="mt-4 rounded-lg border border-[#dfcbc0] bg-white px-4 py-2 text-xs font-semibold text-[#735042]" data-testid="button-retry-business-status">Retry search</button></div>
              : rows.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center" data-testid="status-business-list-empty"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3eb] text-[#72917a]"><FileSearch size={22} /></div><h3 className="text-sm font-semibold text-[#486153]">{filters.search || filters.business_type || filters.client_type || filters.status ? 'No matching business files' : 'No visible business files'}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[#899489]">{filters.search || filters.business_type || filters.client_type || filters.status ? 'Try a different file number, proposer or filter. Results are always limited by your current access scope.' : 'Files you own, recorded handoffs and current team inbox items will appear here when available.'}</p></div>
                : <div>{rows.map(file => <StatusRow key={file.file_no} file={file} onSelect={() => setSelectedFile(file.file_no)} />)}</div>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ebe3] bg-[#f8faf6] px-4 py-3 sm:px-5">
          <p className="font-mono text-[9px] text-[#8a958a]" data-testid="text-business-status-pagination">PAGE {page} / {pages} · {data?.pageSize ?? PAGE_SIZE} per page</p>
          <div className="flex items-center gap-1.5"><button type="button" disabled={page <= 1 || listQuery.isFetching} onClick={() => setFilters(current => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce5dc] bg-white text-[#61786a] hover:bg-[#eef4ed] disabled:opacity-40" aria-label="Previous page" data-testid="button-business-status-previous"><ArrowLeft size={15} /></button><button type="button" disabled={page >= pages || listQuery.isFetching} onClick={() => setFilters(current => ({ ...current, page: Math.min(pages, (current.page ?? 1) + 1) }))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce5dc] bg-white text-[#61786a] hover:bg-[#eef4ed] disabled:opacity-40" aria-label="Next page" data-testid="button-business-status-next"><ArrowRight size={15} /></button></div>
        </footer>
      </section>
      <p className="mt-3 flex items-center gap-1.5 px-1 text-[10px] leading-4 text-[#89958a]"><BadgeCheck size={12} className="shrink-0 text-[#77937a]" /> Status and movement visibility is scoped server-side. Financial details, notes and documents appear only when permitted.</p>
    </div>
    {selectedFile && <DetailPanel fileNo={selectedFile} onClose={() => setSelectedFile('')} />}
  </main>;
}

function SelectFilter({ label, testId, value, onChange, children }: { label: string; testId: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="inline-flex"><select value={value} onChange={event => onChange(event.target.value)} className="h-9 max-w-full rounded-lg border border-[#dce5dc] bg-white px-3 text-[10px] font-semibold text-[#697c6d] outline-none focus:border-[#83a48a]" aria-label={label} data-testid={testId}>{children}</select></label>;
}
