import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, ArrowDownToLine, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3,
  FileCheck2, FileText, LockKeyhole, RefreshCw, Search, ShieldCheck, UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { pricingReviewApi, type PricingDetail, type PricingFile, type PricingReviewInput } from '@/lib/pricing-review-api';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const PAGE_SIZE_FALLBACK = 25;
const dateLabel = (value?: string | null) => value
  ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  : '—';
const moneyLabel = (value?: string | number | null) => value == null || value === ''
  ? '—'
  : `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function PageSkeleton() {
  return <main className="min-h-[100dvh] animate-pulse bg-[#f3f6f2] p-5 sm:p-8"><div className="mx-auto max-w-[1480px] space-y-6"><div className="h-8 w-72 rounded bg-[#dce6dd]" /><div className="grid gap-5 lg:grid-cols-[350px_1fr]"><div className="h-[620px] rounded-2xl bg-[#e8eee7]" /><div className="h-[620px] rounded-2xl bg-[#e8eee7]" /></div></div></main>;
}

function AccessMessage({ forbidden = false }: { forbidden?: boolean }) {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f3f6f2] p-6"><section className="max-w-md rounded-2xl border border-[#d7e2d7] bg-[#fafbf7] p-8 text-center shadow-[0_18px_50px_-38px_rgba(24,58,57,.4)]"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8efe7] text-[#47766b]"><LockKeyhole size={21} /></span><h1 className="text-xl font-semibold text-[#203d38]">{forbidden ? 'Pricing review access required' : 'Sign in to review pricing files'}</h1><p className="mt-2 text-sm leading-6 text-[#74847a]">{forbidden ? 'This workspace is available to Pricing, SuperAdmin and System Admin profiles.' : 'Your staff session is not available. Sign in through the MIS portal to continue.'}</p></section></main>;
}

function DataPoint({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) {
  return <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#859187]">{label}</p><p className={`mt-1 break-words text-[13px] font-medium text-[#36534a] ${mono ? 'font-mono' : ''}`}>{value || '—'}</p></div>;
}

function PricingFileDetail({ fileNo, onReviewed }: { fileNo: string; onReviewed: (status: string, owner: string | null) => void }) {
  const client = useQueryClient();
  const [comments, setComments] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [requirementId, setRequirementId] = useState('');
  const [localError, setLocalError] = useState('');
  const detailQuery = useQuery({
    queryKey: ['pricing-review-detail', fileNo],
    queryFn: () => pricingReviewApi.detail(fileNo),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
  const detail: PricingDetail | undefined = detailQuery.data?.data;
  const file = detail?.file;

  const invalidateRelated = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['pricing-review-list'] }),
      client.invalidateQueries({ queryKey: ['pricing-review-detail', fileNo] }),
      client.invalidateQueries({ queryKey: ['business'] }),
      client.invalidateQueries({ queryKey: ['business-file', fileNo] }),
      client.invalidateQueries({ queryKey: ['business-uploads', fileNo] }),
      client.invalidateQueries({ queryKey: ['business-history', fileNo] }),
      client.invalidateQueries({ queryKey: ['business-allocated'] }),
      client.invalidateQueries({ queryKey: ['allocated-business-file', fileNo] }),
      client.invalidateQueries({ queryKey: ['allocated-business-uploads', fileNo] }),
      client.invalidateQueries({ queryKey: ['allocated-business-history', fileNo] }),
    ]);
  };

  const reviewMutation = useMutation({
    mutationFn: (input: PricingReviewInput) => pricingReviewApi.review(fileNo, input),
    onSuccess: async result => {
      await invalidateRelated();
      onReviewed(result.data.file_status, result.data.allocated_to);
    },
  });
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) throw new Error('Choose the approved rates matrix document first.');
      if (selectedDocument.size > MAX_UPLOAD_BYTES) throw new Error('Files must be 10 MB or smaller.');
      const reqId = Number(requirementId);
      if (!reqId || !detail?.requirements.some(item => item.req_id === reqId)) throw new Error('Choose a valid rates matrix requirement.');
      const storageKey = await pricingReviewApi.uploadBytes(selectedDocument);
      return pricingReviewApi.upload(fileNo, {
        req_id: reqId,
        filename: selectedDocument.name,
        filesize: selectedDocument.size,
        mime_type: selectedDocument.type || 'application/octet-stream',
        storage_key: storageKey,
      });
    },
    onSuccess: async () => {
      setSelectedDocument(null);
      setLocalError('');
      await invalidateRelated();
    },
  });

  if (detailQuery.isLoading) return <div className="animate-pulse space-y-4 rounded-2xl border border-[#dbe4d8] bg-[#fafbf7] p-6"><div className="h-8 w-56 rounded bg-[#e0e8df]" /><div className="h-28 rounded-xl bg-[#edf1e9]" /><div className="h-48 rounded-xl bg-[#edf1e9]" /></div>;
  if (detailQuery.isError || !detail || !file) return <section className="rounded-2xl border border-[#e6d9ce] bg-[#fbf7f2] p-8 text-center"><AlertCircle className="mx-auto mb-3 text-[#a5684b]" size={24} /><p className="font-semibold text-[#694b3d]">Pricing file could not be loaded</p><p className="mt-2 text-sm text-[#8b7669]">{detailQuery.error instanceof Error ? detailQuery.error.message : 'The record is unavailable right now.'}</p><button type="button" onClick={() => detailQuery.refetch()} className="mt-4 rounded-lg border border-[#ddcabe] px-4 py-2 text-sm font-semibold text-[#704f40]" data-testid="button-retry-pricing-detail">Try again</button></section>;

  const recipients = detail.allocation_recipients ?? [];
  const assignedRecipient = recipients.find(recipient => recipient.username === file.allocated_to);
  const recipientEligible = !!assignedRecipient;
  const submitReview = (action: 'YES' | 'NO') => {
    setLocalError('');
    if (!comments.trim()) {
      setLocalError('Add a comment before recording this decision.');
      return;
    }
    if (comments.trim().length > 250) {
      setLocalError('Comments must be 250 characters or fewer.');
      return;
    }
    if (action === 'YES' && !detail.has_rates_matrix) {
      setLocalError('An approved rates matrix must be uploaded before benefits can be approved.');
      return;
    }
    if (action === 'YES' && !recipientEligible) {
      setLocalError('Correct the assigned recipient through BPO Review before approval.');
      return;
    }
    reviewMutation.mutate({
      action, comments: comments.trim(), expected_updated_at: file.updated_at,
    });
  };

  return <section className="overflow-hidden rounded-2xl border border-[#d8e2d6] bg-[#fbfcf8] shadow-[0_16px_48px_-38px_rgba(32,62,51,.35)]" data-testid={`detail-pricing-file-${fileNo}`}>
    <header className="border-b border-[#dfe7db] bg-[#eef3e9] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-[#244d43] px-2.5 py-1 font-mono text-xs font-bold text-[#f3f5e8]" data-testid={`text-pricing-file-no-${fileNo}`}>{file.file_no}</span><span className="rounded-full bg-[#f4e8cc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#88622d]" data-testid={`status-pricing-file-${fileNo}`}>{file.file_status}</span>{file.reviewable && <span className="rounded-full bg-[#deeee4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3c735d]">Ready for review</span>}</div>
      <h2 className="mt-3 text-xl font-semibold tracking-[-.035em] text-[#203e37] sm:text-2xl">{file.proposer_name}</h2>
      <p className="mt-1 text-xs text-[#7a887d]">Received {dateLabel(file.receive_dt)} · Updated {dateLabel(file.updated_at)}</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d8e3d6] bg-[#f9fbf5] px-3 py-2 text-[11px] font-semibold text-[#5a766a]"><ShieldCheck size={14} className="text-[#50806b]" /> Allocation decision workspace</div>
    </header>

    <div className="space-y-7 p-5 sm:p-6">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#718175]"><FileCheck2 size={14} /> Business & allocation</h3>
        <div className="grid gap-x-6 gap-y-4 rounded-xl border border-[#e2e9de] bg-[#f7f9f3] p-4 sm:grid-cols-2 lg:grid-cols-3">
          <DataPoint label="Premium" value={moneyLabel(file.premium)} />
          <DataPoint label="Business type" value={file.business_type} />
          <DataPoint label="Client type" value={file.client_type} />
          <DataPoint label="Rate type" value={file.rate_type} />
          <DataPoint label="Current allocation owner" value={file.allocated_to} />
          <DataPoint label="Entered by" value={file.entered_by} />
          <DataPoint label="Benefits verified" value={file.benefit_verified} />
          <DataPoint label="Verified by" value={file.benefit_ver_by} />
          <DataPoint label="Verification date" value={dateLabel(file.benefit_ver_date)} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#718175]"><FileText size={14} /> Uploaded documents <span className="font-mono">{detail.uploads.length}</span></h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${detail.has_rates_matrix ? 'bg-[#deeee4] text-[#3d725a]' : 'bg-[#f4e9d8] text-[#946b35]'}`}>{detail.has_rates_matrix ? 'Rates matrix on file' : 'Rates matrix required'}</span></div>
        {detail.uploads.length ? <div className="space-y-2">{detail.uploads.map(upload => <article key={upload.upload_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e1e8dd] bg-[#f8faf5] px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#315046]">{upload.filename}</p><p className="mt-1 text-[10px] text-[#839086]">{upload.req_name} · {upload.uploaded_by} · {dateLabel(upload.uploaded_at)}</p></div><a href={pricingReviewApi.downloadUrl(fileNo, upload.upload_id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d1dfd2] bg-[#fcfdf9] px-3 text-xs font-semibold text-[#3d6c5a] hover:bg-[#edf3e9]" data-testid={`link-pricing-download-${upload.upload_id}`}><ArrowDownToLine size={13} /> Download</a></article>)}</div> : <p className="rounded-xl border border-dashed border-[#d4dfd2] p-5 text-center text-xs text-[#829087]">No documents have been attached to this file.</p>}

        <div className="mt-4 rounded-xl border border-[#dfe7db] bg-[#f6f8f1] p-4">
          <p className="text-xs font-semibold text-[#3b594d]">Upload approved rates matrix</p>
          <p className="mt-1 text-[11px] leading-5 text-[#839086]">Select the configured rates matrix requirement. Maximum file size: 10 MB.</p>
          {detail.requirements.length === 0 ? <div className="mt-3 rounded-lg border border-[#eadcc8] bg-[#fbf5ea] px-3 py-2 text-xs leading-5 text-[#886844]" role="status">No rates matrix requirement is configured. Ask an administrator to add the valid master entry before uploading.</div> : <>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <select value={requirementId} onChange={event => setRequirementId(event.target.value)} disabled={uploadMutation.isPending} className="h-10 min-w-0 rounded-lg border border-[#d7e1d5] bg-[#fcfdf9] px-3 text-xs text-[#39584b] disabled:opacity-60" data-testid="select-pricing-requirement">
                <option value="">Choose requirement</option>
                {detail.requirements.map(requirement => <option value={requirement.req_id} key={requirement.req_id}>{requirement.req_name}</option>)}
              </select>
              <input type="file" onChange={event => { setSelectedDocument(event.target.files?.[0] ?? null); setLocalError(''); }} disabled={uploadMutation.isPending} className="block h-10 w-full min-w-0 rounded-lg border border-[#d7e1d5] bg-[#fcfdf9] px-2 py-1 text-[11px] text-[#52695c] file:mr-2 file:rounded-md file:border-0 file:bg-[#e6eee2] file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-[#3d6956] disabled:opacity-60" data-testid="input-pricing-document" />
              <button type="button" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !selectedDocument || !requirementId || detail.requirements.length === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#355f4e] px-4 text-xs font-semibold text-[#f8f7ec] hover:bg-[#294e40] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-upload-pricing-document">{uploadMutation.isPending ? 'Uploading…' : 'Upload'}<UploadCloud size={14} /></button>
            </div>
            {selectedDocument && <p className="mt-2 text-[10px] text-[#76877a]">{selectedDocument.name} · {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB</p>}
          </>}
          {uploadMutation.isError && <p role="alert" className="mt-3 text-xs font-medium text-[#a14d3b]">{uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Document upload failed.'}</p>}
          {uploadMutation.isSuccess && <p role="status" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d765d]"><CheckCircle2 size={14} /> Document attached to the pricing file.</p>}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.17em] text-[#718175]">Saved notes <span className="font-mono">{detail.notes.length}</span></h3>
        {detail.notes.length ? <div className="space-y-2">{detail.notes.map(note => <article key={note.note_id} className="rounded-xl border border-[#e2e9de] bg-[#f8faf5] p-4"><div className="flex flex-wrap justify-between gap-2 text-[10px] text-[#859187]"><span className="font-semibold text-[#4b695a]">{note.note_from}</span><span>{dateLabel(note.note_date)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#4b6256]">{note.notes}</p></article>)}</div> : <p className="rounded-xl border border-dashed border-[#d4dfd2] p-5 text-center text-xs text-[#829087]">No saved notes for this file.</p>}
      </section>

      {detail.reviews.length > 0 && <section>
        <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#718175]"><Clock3 size={14} /> Pricing review history</h3>
        <div className="space-y-2">{detail.reviews.map(review => <article key={review.review_id} className="rounded-xl border border-[#e2e9de] bg-[#f8faf5] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${review.action === 'YES' ? 'bg-[#deeee4] text-[#3d725a]' : 'bg-[#f4e7d8] text-[#916544]'}`}>{review.action === 'YES' ? 'Approved' : 'Returned'}</span><span className="text-[10px] text-[#859187]">{review.reviewed_by} · {dateLabel(review.reviewed_at)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#4b6256]">{review.comments}</p></article>)}</div>
      </section>}

      <section className="rounded-2xl border border-[#dce5d9] bg-[#f5f7f0] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#29483d]">Record benefit decision</h3><p className="mt-1 text-xs leading-5 text-[#7c897e]">Comments are required for either outcome and saved with the review.</p></div><span className="rounded-md border border-[#dce5d9] bg-[#fbfcf8] px-2 py-1 font-mono text-[9px] text-[#78877c]">MAX 250 CHARACTERS</span></div>
        {file.reviewable && <div className="mt-4">
          <label htmlFor="pricing-allocation-recipient" className="text-xs font-semibold text-[#36534a]">Allocation Files recipient</label>
          <input id="pricing-allocation-recipient" readOnly value={assignedRecipient ? `${assignedRecipient.employee_name} (${assignedRecipient.username})` : file.allocated_to ?? 'Not allocated'} className="mt-2 w-full rounded-lg border border-[#d6e0d4] bg-[#f3f6f2] px-3 py-2 text-sm text-[#314e42]" data-testid="input-pricing-allocation-recipient" />
          {!recipientEligible && <p className="mt-2 text-xs text-[#90754f]">{file.allocated_to ? 'The allocated recipient is no longer eligible.' : 'This file has no allocated recipient.'} Correct the allocation through BPO Review before approval.</p>}
          <p className="mt-2 text-[10px] text-[#718175]">Automatically populated from the business allocation. Approval sends the file to this assigned BPO Admin; Return incomplete still goes to the original tracker.</p>
        </div>}
        <textarea value={comments} maxLength={250} onChange={event => setComments(event.target.value)} disabled={!file.reviewable || reviewMutation.isPending} placeholder="Explain the benefit verification outcome…" className="mt-4 min-h-24 w-full resize-y rounded-xl border border-[#d6e0d4] bg-[#fcfdf9] px-3 py-3 text-sm text-[#314e42] outline-none placeholder:text-[#a0aaa0] focus:border-[#84a38e] disabled:opacity-60" data-testid="input-pricing-review-comments" />
        <div className="mt-1 flex justify-between gap-3 text-[10px] text-[#8a968b]"><span>{!file.reviewable ? 'This file is no longer reviewable.' : 'A concise, specific reason helps the next team act.'}</span><span className="font-mono">{comments.length}/250</span></div>
        {(localError || reviewMutation.isError) && <p className="mt-3 rounded-lg border border-[#ebd4c7] bg-[#fbf2eb] px-3 py-2 text-xs font-medium text-[#9a5139]" role="alert" data-testid="status-pricing-review-error">{localError || (reviewMutation.error instanceof Error ? reviewMutation.error.message : 'The decision could not be saved.')}</p>}
        {reviewMutation.isPending && <p className="mt-3 text-xs font-medium text-[#648071]" role="status">Saving decision…</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!file.reviewable || reviewMutation.isPending || !detail.has_rates_matrix || !recipientEligible} onClick={() => submitReview('YES')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#315f4b] px-4 text-xs font-semibold text-[#f8f7ec] transition hover:bg-[#284f3e] disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-approve-pricing-benefits"><Check size={15} /> Approve benefits</button>
          <button type="button" disabled={!file.reviewable || reviewMutation.isPending} onClick={() => submitReview('NO')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d9c9b9] bg-[#fbf8f2] px-4 text-xs font-semibold text-[#8a5942] transition hover:bg-[#f7eee5] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-return-pricing-file"><ArrowLeft size={14} /> Return incomplete</button>
        </div>
        {!detail.has_rates_matrix && <p className="mt-3 text-[10px] leading-5 text-[#90754f]">Approval is unavailable until a rates matrix upload is recorded.</p>}
      </section>
    </div>
  </section>;
}

export default function PricingReviewPage() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState('');
  const [notice, setNotice] = useState('');
  const profileName = (user?.profileName ?? '').trim().toLowerCase();
  const allowed = !!user && (user.profileId === 1 || user.profileId === 2 || profileName === 'pricing' || profileName === 'superadmin' || profileName === 'system admin');
  const normalizedSearch = search.trim();
  const queueQuery = useQuery({
    queryKey: ['pricing-review-list', normalizedSearch, page],
    queryFn: () => pricingReviewApi.list(normalizedSearch, page),
    enabled: allowed,
    staleTime: 15_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const rows: PricingFile[] = queueQuery.data?.data ?? [];
  const total = queueQuery.data?.total ?? 0;
  const pageSize = queueQuery.data?.pageSize || PAGE_SIZE_FALLBACK;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading) return <PageSkeleton />;
  if (!user) return <AccessMessage />;
  if (!allowed) return <AccessMessage forbidden />;

  const finishReview = (resultStatus: string, owner: string | null) => {
    setSelectedFile('');
    setNotice(`Decision saved. File status: ${resultStatus}.${owner ? ` Assigned to ${owner}.` : ''}`);
  };

  return <main className="min-h-[100dvh] bg-[#f3f6f2] px-4 py-5 text-[#29453b] sm:px-6 sm:py-7">
    <div className="mx-auto max-w-[1480px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#758774]"><span className="h-px w-6 bg-[#a3b49a]" /> AAR MIS / Business Tracking</p><h1 className="mt-2 text-[28px] font-semibold tracking-[-.045em] text-[#203e37] sm:text-[34px]">Pricing Review</h1><p className="mt-1 max-w-2xl text-sm text-[#7a887d]">Verify benefits, confirm the approved rates matrix, then direct each corporate or SME file.</p></div>
        <div className="flex items-center gap-2 rounded-lg border border-[#d9e3d6] bg-[#fafbf7] px-3 py-2 text-[11px] font-medium text-[#64796b]"><ShieldCheck size={15} className="text-[#56806c]" /> {user.name}</div>
      </header>
      {notice && <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#cfe0d0] bg-[#edf5eb] px-4 py-3 text-xs font-semibold text-[#416b50]" role="status" data-testid="status-pricing-review-success"><CheckCircle2 size={15} />{notice}</div>}
      <div className="grid gap-5 lg:grid-cols-[350px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className={`${selectedFile ? 'hidden md:block' : ''} overflow-hidden rounded-2xl border border-[#d9e3d6] bg-[#fafbf7] shadow-[0_14px_44px_-38px_rgba(32,62,51,.35)]`}>
          <div className="border-b border-[#e3e9df] px-4 pb-4 pt-4">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#708274]">Pending allocations</p><p className="mt-1 text-xs text-[#859187]">Benefit verification queue</p></div><button type="button" onClick={() => queueQuery.refetch()} disabled={queueQuery.isFetching} aria-label="Refresh pricing queue" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#698072] hover:bg-[#edf2e9] disabled:opacity-50" data-testid="button-refresh-pricing-queue"><RefreshCw size={14} className={queueQuery.isFetching ? 'animate-spin' : ''} /></button></div>
            <label className="mt-4 flex h-10 items-center gap-2 rounded-lg border border-[#dce5d9] bg-[#fdfefb] px-3 text-[#829083] focus-within:border-[#95ad92]"><Search size={15} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); setSelectedFile(''); }} placeholder="File number or proposer…" className="min-w-0 flex-1 bg-transparent text-xs text-[#355147] outline-none placeholder:text-[#a0aaa0]" data-testid="input-pricing-search" /></label>
            <div className="mt-3 flex items-center justify-between text-[10px] text-[#859187]"><span>Corporate & SME files</span>{queueQuery.data && <span className="font-mono">{total} files</span>}</div>
          </div>
          <div className="max-h-[calc(100dvh-345px)] min-h-[270px] overflow-y-auto">
            {queueQuery.isLoading ? <div className="space-y-2 p-4">{[0,1,2,3].map(index => <div key={index} className="h-[100px] animate-pulse rounded-xl bg-[#edf1e9]" />)}</div>
              : queueQuery.isError ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><AlertCircle size={22} className="mb-2 text-[#a5684b]" /><p className="text-sm font-semibold text-[#674b3f]">Pricing queue did not load</p><p className="mt-1 text-xs text-[#8b7669]">{queueQuery.error instanceof Error ? queueQuery.error.message : 'The request failed.'}</p><button type="button" onClick={() => queueQuery.refetch()} className="mt-3 rounded-md border border-[#ddcabe] px-3 py-1.5 text-xs font-semibold text-[#704f40]" data-testid="button-retry-pricing-queue">Retry</button></div>
                : rows.length ? rows.map(file => <button key={file.file_no} type="button" onClick={() => { setSelectedFile(file.file_no); setNotice(''); }} className={`block w-full border-b border-[#edf0e9] px-4 py-4 text-left transition hover:bg-[#f3f6ee] ${selectedFile === file.file_no ? 'bg-[#edf3e8]' : ''}`} data-testid={`button-open-pricing-${file.file_no}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] font-bold text-[#3b6855]">{file.file_no}</span><span className="rounded-full bg-[#f3e9d7] px-2 py-1 text-[9px] font-bold uppercase text-[#886837]">{file.file_status}</span></div><p className="mt-2 truncate text-sm font-semibold text-[#36564a]">{file.proposer_name}</p><p className="mt-1 truncate text-[10px] text-[#859187]">{file.business_type ?? 'Business'} · {file.client_type ?? 'Client type —'} · {moneyLabel(file.premium)}</p><p className="mt-2 text-[9px] text-[#9aa398]">Received {dateLabel(file.receive_dt)}</p></button>)
                  : <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#e9efe5] text-[#76937d]"><FileText size={20} /></div><p className="text-sm font-semibold text-[#476254]">{normalizedSearch ? 'No matching files' : 'No files awaiting review'}</p><p className="mt-1 max-w-[220px] text-xs leading-5 text-[#89968b]">{normalizedSearch ? 'Try another file number or proposer name.' : 'New corporate and SME files assigned for benefit verification will appear here.'}</p></div>}
          </div>
          <footer className="flex items-center justify-between border-t border-[#e3e9df] bg-[#f7f9f3] px-4 py-3"><span className="font-mono text-[10px] text-[#839084]">PAGE {page} / {totalPages}</span><div className="flex gap-1"><button type="button" disabled={page <= 1 || queueQuery.isLoading} onClick={() => setPage(current => Math.max(1, current - 1))} aria-label="Previous pricing page" className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce5d9] bg-[#fbfcf8] text-[#5d7868] disabled:opacity-40" data-testid="button-pricing-previous"><ArrowLeft size={14} /></button><button type="button" disabled={page >= totalPages || queueQuery.isLoading} onClick={() => setPage(current => Math.min(totalPages, current + 1))} aria-label="Next pricing page" className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce5d9] bg-[#fbfcf8] text-[#5d7868] disabled:opacity-40" data-testid="button-pricing-next"><ArrowRight size={14} /></button></div></footer>
        </aside>
        <div className={`${selectedFile ? 'block' : 'hidden md:block'} min-w-0`}>
          {selectedFile ? <div className="space-y-3"><button type="button" onClick={() => setSelectedFile('')} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d7e2d5] bg-[#fafbf7] px-3 text-xs font-semibold text-[#557365] hover:bg-white md:hidden" data-testid="button-back-pricing-list"><ArrowLeft size={14} /> Back to queue</button><PricingFileDetail key={selectedFile} fileNo={selectedFile} onReviewed={(status, owner) => finishReview(status, owner)} /></div> : <div className="flex min-h-[540px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfdbcd] bg-[#f8faf5] px-8 text-center"><div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7eee2] text-[#507b65]"><FileCheck2 size={23} /></div><p className="text-base font-semibold text-[#3d5d4d]">Select a file to review</p><p className="mt-2 max-w-sm text-sm leading-6 text-[#849186]">Inspect its allocation details, saved notes and source documents before recording a benefit decision.</p></div>}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#dce5d9] pt-3 text-[10px] text-[#8b978a]"><span>Pricing · Business benefit verification</span><span className="font-mono">AAR / MIS</span></div>
    </div>
  </main>;
}
