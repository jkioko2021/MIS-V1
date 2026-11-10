import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, Check, CheckCircle2, CircleAlert,
  Clock3, FileCheck2, FileText, FolderOpen, LockKeyhole, RefreshCw, Search,
  ShieldCheck, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { filingApi, type FilingBusinessType, type FilingDetail, type FilingFile, type FilingUpload } from '@/lib/record-filing-api';

type Bucket = 'pending' | 'filed';
type BusinessType = FilingBusinessType | 'all';
const PAGE_SIZE_FALLBACK = 25;
const dateText = (value?: string | null) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const moneyText = (value?: string | number | null) => value == null || value === '' ? '—' : `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const typeNames: Record<FilingBusinessType, string> = {
  N: 'New business', R: 'Renewal', A: 'Amendment', T: 'Termination',
  RT: 'Reinstatement', CC: 'Category Change', PR: 'Premium Recon',
};
const typeName = (type: string) => typeNames[type as FilingBusinessType] ?? type;

function AccessMessage() {
  return <div className="flex min-h-[70vh] items-center justify-center bg-[#f2f6f3] p-6"><div className="max-w-md rounded-2xl border border-[#d9e5df] bg-[#fbfdfb] p-8 text-center shadow-[0_18px_50px_-38px_rgba(24,58,57,.45)]">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf2ee] text-[#3c7771]"><LockKeyhole size={21} /></div>
    <h1 className="text-xl font-semibold text-[#183a39]">Record Filing access required</h1>
    <p className="mt-2 text-sm leading-6 text-[#687b77]">This workspace is available to DPU, SuperAdmin and System Admin profiles.</p>
  </div></div>;
}

function DataPair({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#82918b]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[#36574f]">{value ?? '—'}</p></div>;
}

function QueueRow({ file, active, onSelect }: { file: FilingFile; active: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`w-full border-b border-[#edf1ee] px-4 py-3.5 text-left transition ${active ? 'bg-[#edf5f1] shadow-[inset_3px_0_0_#39766a]' : 'hover:bg-[#f7faf8]'}`} data-testid={`button-select-filing-${file.file_no}`}>
    <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] font-bold text-[#2e6259]">{file.file_no}</span><span className="rounded-full bg-[#e7efeb] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#607a71]">{file.business_type}</span></div>
    <p className="mt-1 truncate text-sm font-semibold text-[#294741]">{file.proposer_name}</p>
    <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[#82918b]"><span className="truncate">{file.business || typeName(file.business_type)}</span><span className="shrink-0">{dateText(file.receive_dt)}</span></div>
  </button>;
}

function FilingDetailPanel({ fileNo, bucket, onFiled }: { fileNo: string; bucket: Bucket; onFiled: (message: string) => void }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['record-filing-detail', fileNo],
    queryFn: () => filingApi.detail(fileNo),
    refetchOnWindowFocus: false,
  });
  const detail: FilingDetail | undefined = query.data?.data;
  const file = detail?.file;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comments, setComments] = useState('');
  const [notice, setNotice] = useState('');
  const submitLock = useRef(false);
  const mutation = useMutation({
    mutationFn: () => filingApi.file(fileNo, {
      action: 'F',
      expected_updated_at: file!.updated_at,
      upload_ids: selectedIds,
      ...(comments.trim() ? { comments: comments.trim() } : {}),
    }),
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['record-filing-list'] }),
        client.invalidateQueries({ queryKey: ['record-filing-detail', fileNo] }),
        client.invalidateQueries({ queryKey: ['business'] }),
        client.invalidateQueries({ queryKey: ['business-file', fileNo] }),
        client.invalidateQueries({ queryKey: ['business-uploads', fileNo] }),
        client.invalidateQueries({ queryKey: ['business-history', fileNo] }),
        client.invalidateQueries({ queryKey: ['business-allocated'] }),
        client.invalidateQueries({ queryKey: ['allocated-business'] }),
        client.invalidateQueries({ queryKey: ['allocated-business-file', fileNo] }),
        client.invalidateQueries({ queryKey: ['allocated-business-uploads', fileNo] }),
        client.invalidateQueries({ queryKey: ['allocated-business-history', fileNo] }),
        client.invalidateQueries({ queryKey: ['pricing-review-list'] }),
        client.invalidateQueries({ queryKey: ['pricing-review-detail', fileNo] }),
        client.invalidateQueries({ queryKey: ['allocation-destination'] }),
        client.invalidateQueries({ queryKey: ['allocated-refund-ledger'] }),
      ]);
      setSelectedIds([]);
      setComments('');
      const statuses = result.data.notification_statuses;
      const delivery = statuses.length
        ? ` Notification status: ${statuses.map(status => status === 'WAITING_CONFIGURATION' ? 'WAITING_CONFIGURATION — not sent' : status).join(', ')}.`
        : ' No notification status was returned.';
      const message = `File ${fileNo} is filed. ${result.data.filed_documents} document${result.data.filed_documents === 1 ? '' : 's'} recorded.${delivery}`;
      setNotice(message);
      onFiled(message);
    },
    onSettled: () => { submitLock.current = false; },
  });

  if (query.isLoading) return <div className="animate-pulse space-y-4 rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] p-6"><div className="h-7 w-52 rounded bg-[#e4eee8]" /><div className="h-24 rounded bg-[#edf3ef]" /><div className="h-44 rounded bg-[#edf3ef]" /></div>;
  if (query.isError || !detail || !file) return <section className="rounded-2xl border border-[#ead9ce] bg-[#fcf8f5] p-8 text-center"><CircleAlert className="mx-auto mb-2 text-[#ad614a]" size={22} /><p className="font-semibold text-[#754c3d]">File detail unavailable</p><p className="mt-2 text-sm text-[#8a7166]">{query.error instanceof Error ? query.error.message : 'The record could not be loaded.'}</p><button type="button" className="mt-4 rounded-lg border border-[#ddc7bb] px-4 py-2 text-sm" onClick={() => query.refetch()} data-testid="button-retry-filing-detail">Retry</button></section>;

  const isFiled = bucket === 'filed' || file.filed || file.file_status.toUpperCase() === 'FILED';
  const toggleUpload = (upload: FilingUpload) => {
    if (isFiled || upload.filed) return;
    setSelectedIds(current => current.includes(upload.upload_id) ? current.filter(id => id !== upload.upload_id) : [...current, upload.upload_id]);
  };
  const submit = () => {
    if (submitLock.current || mutation.isPending || isFiled || !file.updated_at) return;
    submitLock.current = true;
    mutation.mutate();
  };

  return <section className="overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] shadow-[0_14px_44px_-38px_rgba(23,65,58,.45)]" data-testid={`detail-record-filing-${fileNo}`}>
    <header className="border-b border-[#dce8e2] bg-[#edf5f1] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-[#205b55] px-2.5 py-1 font-mono text-xs font-bold text-white">{file.file_no}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isFiled ? 'bg-[#e1efe7] text-[#317356]' : 'bg-[#f3ead6] text-[#8b6b2e]'}`}>{isFiled ? 'Filed' : file.file_status}</span><span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#658077]"><ShieldCheck size={13} /> Registration protected</span></div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#193a38]">{file.proposer_name}</h2>
      <p className="mt-1 text-xs text-[#71827e]">Received {dateText(file.receive_dt)} · Last updated {dateText(file.updated_at)}</p>
    </header>
    <div className="space-y-6 p-5 sm:p-6">
      {notice && <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#c7dfd2] bg-[#eef7f1] px-4 py-3 text-xs font-semibold leading-5 text-[#3b6d5a]" data-testid="status-filing-success"><span className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss success message" className="rounded p-1 hover:bg-[#e0eee5]" data-testid="button-dismiss-filing-success"><X size={14} /></button></div>}
      {mutation.isError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#ead9ce] bg-[#fcf8f5] px-4 py-3 text-xs leading-5 text-[#754c3d]" data-testid="status-filing-error"><CircleAlert size={15} className="mt-0.5 shrink-0" /><span>{mutation.error instanceof Error ? mutation.error.message : 'Filing could not be completed. Retry when ready.'}<button type="button" onClick={() => mutation.reset()} className="ml-2 font-bold underline">Dismiss</button></span></div>}

      <section><div className="mb-3 flex items-center gap-2"><FileText size={15} className="text-[#588076]" /><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Registration & invoice · read only</h3></div><div className="grid gap-x-6 gap-y-4 rounded-xl border border-[#e3ebe6] bg-[#f7faf8] p-4 sm:grid-cols-3">
        <DataPair label="Business / proposer" value={file.business} /><DataPair label="Business type" value={typeName(file.business_type)} /><DataPair label="Client type" value={file.client_type} />
        <DataPair label="Invoice number" value={file.invoice_no} /><DataPair label="Premium" value={moneyText(file.premium)} /><DataPair label="Entered by" value={file.entered_by} />
        <DataPair label="Allocated to" value={file.allocated_to} /><DataPair label="Policy generated" value={file.policy_generated ? 'Yes' : 'No'} /><DataPair label="Policy dispatched" value={file.policy_dispatched ? 'Yes' : 'No'} />
      </div></section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Documents for filing</h3><p className="mt-1 text-xs text-[#82918b]">{isFiled ? 'Filed records are read-only.' : 'Select documents to include. Selection is optional.'}</p></div><span className="rounded-full bg-[#e9f1ed] px-2.5 py-1 text-[10px] font-semibold text-[#58736a]">{selectedIds.length} selected</span></div>
        {detail.uploads.length === 0 ? <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f8fbf9] px-4 py-8 text-center"><FolderOpen className="mx-auto mb-2 text-[#86a097]" size={23} /><p className="text-sm font-semibold text-[#44625a]">No uploaded documents</p><p className="mt-1 text-xs text-[#8a9993]">Documents added to this registration will appear here.</p></div> : <div className="overflow-hidden rounded-xl border border-[#e1eae4]">
          {detail.uploads.map(upload => {
            const checked = selectedIds.includes(upload.upload_id) || upload.filed;
            return <div key={upload.upload_id} className="flex items-center gap-3 border-b border-[#edf1ee] bg-[#fffefa] px-3 py-3 last:border-b-0" data-testid={`row-filing-upload-${upload.upload_id}`}>
              <input type="checkbox" aria-label={`Select ${upload.filename} for filing`} checked={checked} disabled={isFiled || upload.filed} onChange={() => toggleUpload(upload)} className="h-4 w-4 accent-[#327568] disabled:opacity-70" data-testid={`checkbox-filing-upload-${upload.upload_id}`} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#35564f]">{upload.filename}</p><p className="mt-0.5 truncate text-[10px] text-[#82918b]">{upload.req_name} · {upload.uploaded_by} · {dateText(upload.uploaded_at)}</p></div>
              {upload.filed ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e1efe7] px-2 py-1 text-[9px] font-bold uppercase text-[#39725a]"><Check size={11} /> Filed</span> : <a href={filingApi.downloadUrl(fileNo, upload.upload_id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#68817a] hover:bg-[#edf4f0]" aria-label={`Download ${upload.filename}`} title="Download document" data-testid={`link-download-filing-upload-${upload.upload_id}`}><ArrowDownToLine size={15} /></a>}
            </div>;
          })}
        </div>}
      </section>

      <section><div className="mb-2 flex items-center justify-between"><label htmlFor={`filing-comments-${fileNo}`} className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Filing note <span className="font-medium normal-case tracking-normal text-[#82918b]">· optional</span></label><span className="font-mono text-[10px] text-[#82918b]">{comments.length}/250</span></div><textarea id={`filing-comments-${fileNo}`} value={comments} onChange={event => setComments(event.target.value.slice(0, 250))} maxLength={250} disabled={isFiled} rows={3} placeholder="Add a brief filing note…" className="w-full resize-y rounded-lg border border-[#d6e2dc] bg-[#fffefa] px-3 py-2.5 text-sm text-[#24443e] outline-none transition placeholder:text-[#9baaa4] focus:border-[#4c8274] focus:ring-2 focus:ring-[#4c8274]/15 disabled:bg-[#f4f7f4]" data-testid="input-record-filing-comments" /></section>

      <section><div className="mb-3 flex items-center gap-2"><Clock3 size={15} className="text-[#588076]" /><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Retained notes & filing history</h3></div>
        {detail.notes.length > 0 && <div className="mb-3 space-y-2">{detail.notes.map(note => <article key={note.note_id} className="rounded-lg border border-[#e3ebe6] bg-[#f8fbf9] p-3" data-testid={`record-filing-note-${note.note_id}`}><div className="flex flex-wrap justify-between gap-2 text-[10px] text-[#82918b]"><span className="font-semibold text-[#567269]">{note.note_from}</span><span>{dateText(note.note_date)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#49645c]">{note.notes}</p></article>)}</div>}
        {detail.reviews.length > 0 ? <div className="space-y-2">{detail.reviews.map(review => <article key={review.filing_id} className="rounded-lg border border-[#dce8e1] bg-[#f3f8f4] p-3" data-testid={`record-filing-history-${review.filing_id}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#39725a]"><FileCheck2 size={14} /> Filed by {review.filed_by}</span><span className="text-[10px] text-[#82918b]">{dateText(review.filed_at)}</span></div><p className="mt-2 text-xs leading-5 text-[#49645c]">{review.comments || 'No filing note recorded.'}</p><p className="mt-1 text-[10px] text-[#82918b]">{review.upload_ids.length} document{review.upload_ids.length === 1 ? '' : 's'} included</p></article>)}</div> : <p className="rounded-lg bg-[#f8fbf9] px-3 py-3 text-xs text-[#82918b]">No filing history recorded.</p>}
      </section>

      {!isFiled && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ece7] pt-4"><p className="max-w-sm text-[10px] leading-4 text-[#82918b]">Filing records this file as complete. Document selection and note are optional.</p><button type="button" onClick={submit} disabled={mutation.isPending || !detail.reviewable || !file.updated_at} className="inline-flex items-center gap-2 rounded-lg bg-[#28675d] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#20584f] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-file-record">{mutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}{mutation.isPending ? 'Filing…' : 'File record'}</button></footer>}
      {isFiled && <div className="flex items-center gap-2 rounded-lg bg-[#eef5f0] px-3 py-3 text-xs font-semibold text-[#517366]"><LockKeyhole size={14} /> This file is filed and read-only.</div>}
    </div>
  </section>;
}

function PageSkeleton() {
  return <main className="min-h-[100dvh] animate-pulse bg-[#f2f6f3] px-4 py-5 sm:px-6 sm:py-7"><div className="mx-auto max-w-[1480px]"><div className="h-8 w-64 rounded bg-[#dce8e2]" /><div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]"><div className="h-[620px] rounded-2xl bg-[#e7efea]" /><div className="h-[620px] rounded-2xl bg-[#e7efea]" /></div></div></main>;
}

export default function RecordFilingPage() {
  useEffect(() => { const previous = document.title; document.title = 'Record Filing | AAR MIS'; return () => { document.title = previous; }; }, []);
  const { user, loading: authLoading } = useAuth();
  const profileName = (user?.profileName ?? '').trim().toLowerCase();
  const access = !!user && (user.profileId === 1 || user.profileId === 2 || profileName === 'dpu');
  const [bucket, setBucket] = useState<Bucket>('pending');
  const [businessType, setBusinessType] = useState<BusinessType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState('');
  const [queueNotice, setQueueNotice] = useState('');
  const normalizedSearch = search.trim();
  const queueQuery = useQuery({
    queryKey: ['record-filing-list', bucket, businessType, normalizedSearch, page],
    queryFn: () => filingApi.list({ bucket, business_type: businessType, search: normalizedSearch, page }),
    enabled: access,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const rows = queueQuery.data?.data ?? [];
  const total = queueQuery.data?.total ?? 0;
  const pageSize = queueQuery.data?.pageSize || PAGE_SIZE_FALLBACK;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const changeBucket = (next: Bucket) => { setBucket(next); setPage(1); setSelectedFile(''); setQueueNotice(''); };
  if (authLoading) return <PageSkeleton />;
  if (!user || !access) return <AccessMessage />;

  return <main className="min-h-[100dvh] bg-[#f1f6f2] px-4 py-5 text-[#203c3a] sm:px-6 sm:py-7">
    <div className="mx-auto max-w-[1480px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#557e74]"><span className="h-px w-6 bg-[#8eaea2]" /> AAR MIS / Business Tracking</p><h1 className="mt-2 text-[28px] font-semibold tracking-[-.045em] text-[#193a38] sm:text-[34px]">Record Filing</h1><p className="mt-1 max-w-2xl text-sm text-[#758681]">File completed business records and keep an auditable document trail.</p></div><div className="flex items-center gap-2 rounded-lg border border-[#d9e5df] bg-[#f9fcfa] px-3 py-2 text-[11px] font-medium text-[#637a73]"><ShieldCheck size={15} className="text-[#468176]" /> {user.name}</div></header>
      {queueNotice && <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#c7dfd2] bg-[#eef7f1] px-4 py-3 text-xs font-semibold text-[#3b6d5a]" data-testid="status-filing-queue"><span className="flex items-center gap-2"><CheckCircle2 size={15} />{queueNotice}</span><button type="button" onClick={() => setQueueNotice('')} aria-label="Dismiss message" className="rounded p-1 hover:bg-[#e0eee5]" data-testid="button-dismiss-filing-queue"><X size={14} /></button></div>}
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[370px_minmax(0,1fr)]">
        <aside className={`${selectedFile ? 'hidden md:block' : ''} overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] shadow-[0_14px_44px_-38px_rgba(23,65,58,.45)]`}>
          <div className="border-b border-[#e4ece7] px-4 pb-3 pt-4">
            <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d847d]">{bucket === 'pending' ? 'Filing queue' : 'Filed history'}</p><button type="button" onClick={() => queueQuery.refetch()} disabled={queueQuery.isFetching} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#68817a] hover:bg-[#edf4f0] disabled:opacity-50" aria-label="Refresh queue" data-testid="button-refresh-filing-queue"><RefreshCw size={14} className={queueQuery.isFetching ? 'animate-spin' : ''} /></button></div>
            <div className="mt-3 grid grid-cols-2 rounded-lg bg-[#edf3ef] p-1">{(['pending', 'filed'] as Bucket[]).map(item => <button type="button" key={item} onClick={() => changeBucket(item)} className={`rounded-md px-2 py-2 text-xs font-semibold transition ${bucket === item ? 'bg-[#fbfdfb] text-[#285a52] shadow-sm' : 'text-[#7b8c86] hover:text-[#47665e]'}`} data-testid={`tab-filing-${item}`}>{item === 'pending' ? 'To file' : 'Filed history'}</button>)}</div>
            <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-[#f4f7f5] p-1">{(['all', 'N', 'R', 'A', 'T', 'RT', 'CC', 'PR'] as BusinessType[]).map(type => <button type="button" key={type} title={type === 'all' ? 'All business types' : typeName(type)} onClick={() => { setBusinessType(type); setPage(1); setSelectedFile(''); }} className={`rounded-md px-1.5 py-1.5 text-[10px] font-bold transition ${businessType === type ? 'bg-[#dfece5] text-[#285a52]' : 'text-[#82918b] hover:bg-white'}`} data-testid={`filter-filing-type-${type}`}>{type === 'all' ? 'All' : type}</button>)}</div>
            <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-[#dce7e1] bg-white px-3 text-[#7b8d87] focus-within:border-[#74a195]"><Search size={15} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search file or proposer…" className="min-w-0 flex-1 bg-transparent text-xs text-[#294540] outline-none placeholder:text-[#9baaa4]" data-testid="input-filing-search" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="rounded p-1 hover:bg-[#edf3ef]" data-testid="button-clear-filing-search"><X size={13} /></button>}</label>
            <div className="mt-3 flex items-center justify-between text-[10px] text-[#83928d]"><span>{businessType === 'all' ? 'All business types' : typeName(businessType)}</span>{!queueQuery.isLoading && !queueQuery.isError && <span className="font-mono">{total} files</span>}</div>
            <div className="mt-2 flex flex-wrap gap-3 text-[9px] font-semibold uppercase tracking-wide text-[#82918b]">{(Object.keys(typeNames) as FilingBusinessType[]).map(type => <span key={type} title={typeName(type)}>{type} <b className="font-mono text-[#476a60]">{queueQuery.data?.counts[type] ?? '—'}</b></span>)}</div>
          </div>
          <div className="max-h-[calc(100dvh-365px)] min-h-[270px] overflow-y-auto">
            {queueQuery.isLoading ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map(index => <div key={index} className="h-[92px] animate-pulse rounded-lg bg-[#edf3ef]" />)}</div>
              : queueQuery.isError ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><CircleAlert className="mb-2 text-[#ad614a]" size={22} /><p className="text-sm font-semibold text-[#65483e]">Queue did not load</p><p className="mt-1 text-xs text-[#8a7770]">{queueQuery.error instanceof Error ? queueQuery.error.message : 'The filing queue is unavailable.'}</p><button type="button" onClick={() => queueQuery.refetch()} className="mt-3 rounded-md border border-[#d8c8c0] px-3 py-1.5 text-xs font-semibold text-[#704c40]" data-testid="button-retry-filing-queue">Retry</button></div>
                : rows.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4ef] text-[#7b998e]"><FolderOpen size={20} /></div><p className="text-sm font-semibold text-[#44625a]">{normalizedSearch ? 'No matching files' : bucket === 'pending' ? 'Nothing waiting to be filed' : 'No filed records yet'}</p><p className="mt-1 max-w-[220px] text-xs leading-5 text-[#8a9993]">{normalizedSearch ? 'Try a different file number or proposer name.' : bucket === 'pending' ? 'Completed files will appear here when they are ready for filing.' : 'Filed records will be retained here for reference.'}</p></div>
                  : rows.map(file => <QueueRow key={file.file_no} file={file} active={selectedFile === file.file_no} onSelect={() => { setSelectedFile(file.file_no); setQueueNotice(''); }} />)}
          </div>
          <footer className="flex items-center justify-between border-t border-[#e4ece7] bg-[#f8fbf9] px-4 py-3"><span className="font-mono text-[10px] text-[#82918b]">PAGE {page} / {totalPages}</span><div className="flex gap-1"><button type="button" disabled={page <= 1 || queueQuery.isLoading} onClick={() => setPage(current => Math.max(1, current - 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] hover:bg-[#edf4f0] disabled:opacity-40" aria-label="Previous page" data-testid="button-filing-previous-page"><ArrowLeft size={14} /></button><button type="button" disabled={page >= totalPages || queueQuery.isLoading} onClick={() => setPage(current => Math.min(totalPages, current + 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] hover:bg-[#edf4f0] disabled:opacity-40" aria-label="Next page" data-testid="button-filing-next-page"><ArrowRight size={14} /></button></div></footer>
        </aside>
        <div className={selectedFile ? '' : 'hidden md:block'}>
          {selectedFile ? <><button type="button" onClick={() => setSelectedFile('')} className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#dce7e1] bg-[#fbfdfb] px-3 py-2 text-xs font-semibold text-[#55746b] md:hidden" data-testid="button-back-to-filing-queue"><ArrowLeft size={14} /> Back to queue</button><FilingDetailPanel key={`${selectedFile}-${bucket}`} fileNo={selectedFile} bucket={bucket} onFiled={message => { setQueueNotice(message); setSelectedFile(''); }} /></> : <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d3e1d9] bg-[#f8fbf9] px-6 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf2ed] text-[#578075]"><FileCheck2 size={24} /></div><p className="text-sm font-semibold text-[#44625a]">Choose a file to review</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#8a9993]">Select a record from the {bucket === 'pending' ? 'filing queue' : 'filed history'} to review its registration, documents and filing trail.</p></div>}
        </div>
      </div>
    </div>
  </main>;
}
