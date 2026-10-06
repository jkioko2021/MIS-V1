import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, Banknote, Check, CircleAlert,
  Clock3, FileCheck2, FileText, LoaderCircle, LockKeyhole, Paperclip,
  RefreshCw, Search, ShieldCheck, Upload, X,
} from 'lucide-react';
import { staffWorkspaceApi, type CashierDetail, type CashierFile, type CashierReviewInput } from '@/lib/staff-workspace-api';
import { useAuth } from '@/lib/auth-context';

type Bucket = 'inbox' | 'credit-control';
type ReviewAction = CashierReviewInput['action'];
type PaidStatus = CashierReviewInput['paid_status'];

const dateText = (value?: string | null) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const moneyText = (value?: string | number | null) => value == null || value === '' ? '—' : `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const actionLabels: Record<ReviewAction, string> = { M: 'Receipted', CC: 'Credit Control', RM: 'Return to Membership', RI: 'Return to original tracker' };
const inputClass = 'w-full rounded-lg border border-[#d6e2dc] bg-[#fffefa] px-3 py-2.5 text-sm text-[#24443e] outline-none transition focus:border-[#4c8274] focus:ring-2 focus:ring-[#4c8274]/15';

function DataPair({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#82918b]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[#36574f]">{value ?? '—'}</p></div>;
}

function FileDetail({ fileNo, username, bucket, onReviewed }: { fileNo: string; username: string; bucket: Bucket; onReviewed: (message: string) => void }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['cashier-file', username, bucket, fileNo],
    queryFn: () => staffWorkspaceApi.cashierDetail(fileNo),
    // Detail stays still while staff are preparing a review; queue polling remains independent.
    refetchOnWindowFocus: false,
  });
  const detail: CashierDetail | undefined = query.data?.data;
  const file = detail?.file;
  const systemReceiptReq = detail?.requirements.find(req => req.req_name.trim().toLowerCase() === 'system receipt')
    ?? detail?.requirements.find(req => req.req_name.toLowerCase().includes('system receipt'));
  const [action, setAction] = useState<ReviewAction>('M');
  const [paidStatus, setPaidStatus] = useState<PaidStatus | ''>('');
  const [receiptNo, setReceiptNo] = useState('');
  const [comments, setComments] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedUpload, setSelectedUpload] = useState('');
  const mutation = useMutation({
    mutationFn: (input: CashierReviewInput) => staffWorkspaceApi.cashierReview(fileNo, input),
    onSuccess: async (_response, input) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['cashier-handoffs'] }),
        client.invalidateQueries({ queryKey: ['cashier-file'] }),
        client.invalidateQueries({ queryKey: ['business'] }),
        client.invalidateQueries({ queryKey: ['business-file'] }),
        client.invalidateQueries({ queryKey: ['business-allocated'] }),
        client.invalidateQueries({ queryKey: ['allocated-business-file'] }),
        client.invalidateQueries({ queryKey: ['allocated-business-uploads'] }),
        client.invalidateQueries({ queryKey: ['allocated-business-history'] }),
        client.invalidateQueries({ queryKey: ['staff-notifications'] }),
      ]);
      const label = actionLabels[input.action];
      onReviewed(`${fileNo} reviewed: ${label}.`);
    },
  });

  if (query.isLoading) return <div className="animate-pulse space-y-4 rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] p-6"><div className="h-7 w-52 rounded bg-[#e4eee8]" /><div className="h-24 rounded bg-[#edf3ef]" /><div className="h-44 rounded bg-[#edf3ef]" /></div>;
  if (query.isError || !detail || !file) return <section className="rounded-2xl border border-[#ead9ce] bg-[#fcf8f5] p-8 text-center"><p className="font-semibold text-[#754c3d]">File detail unavailable</p><p className="mt-2 text-sm text-[#8a7166]">{query.error instanceof Error ? query.error.message : 'The record could not be loaded.'}</p><button className="mt-4 rounded-lg border border-[#ddc7bb] px-4 py-2 text-sm" onClick={() => query.refetch()} data-testid="button-retry-cashier-detail">Retry</button></section>;

  const validInvoice = Boolean(file.invoiced && file.invoice_no?.trim());
  const canReceipted = Boolean(validInvoice && detail.has_system_receipt && (paidStatus === 'FULL-PAID' || paidStatus === 'PART-PAID') && receiptNo.trim() && receiptNo.trim().length <= 50);
  const actionDisabledReason = action === 'RM' && !detail.return_membership_to
    ? 'This file has no eligible original Allocation Files sender. Return to Membership is unavailable.'
    : action === 'M' && !validInvoice ? 'A valid, issued invoice is required before receipting.'
      : action === 'M' && !detail.has_system_receipt ? 'Upload the required System Receipt before receipting.'
          : action === 'M' && paidStatus === 'NOT-PAID' ? 'Receipting requires FULL-PAID or PART-PAID status.'
        : action === 'M' && !receiptNo.trim() ? 'Enter the receipt number to complete receipting.'
          : action === 'M' && receiptNo.trim().length > 50 ? 'Receipt number must be 50 characters or fewer.'
            : action === 'CC' && paidStatus === 'FULL-PAID' ? 'Credit Control cannot be marked FULL-PAID.'
              : '';
  const canSubmit = !!paidStatus && comments.trim().length > 0 && comments.trim().length <= 250
    && (action !== 'M' || canReceipted)
    && !(action === 'RM' && !detail.return_membership_to)
    && !(action === 'CC' && paidStatus === 'FULL-PAID')
    && !mutation.isPending && !uploading;

  const uploadFile = async (incoming: File | undefined) => {
    if (!incoming) return;
    setUploadError('');
    setSelectedUpload('');
    if (!systemReceiptReq) {
      setUploadError('System Receipt is not listed as an upload requirement for this file.');
      return;
    }
    if (incoming.size > 10 * 1024 * 1024) {
      setUploadError('The file exceeds the 10 MB limit.');
      return;
    }
    setUploading(true);
    try {
      const storageKey = await staffWorkspaceApi.cashierUploadBytes(incoming);
      await staffWorkspaceApi.cashierUpload(fileNo, {
        req_id: systemReceiptReq.req_id,
        filename: incoming.name,
        filesize: incoming.size,
        mime_type: incoming.type || 'application/octet-stream',
        storage_key: storageKey,
      });
      setSelectedUpload(incoming.name);
      await query.refetch();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Receipt upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!file.updated_at || !canSubmit || !paidStatus) return;
    mutation.mutate({
      action,
      paid_status: paidStatus,
      comments: comments.trim(),
      ...(action === 'M' ? { receipt_no: receiptNo.trim() } : {}),
      expected_updated_at: file.updated_at,
    });
  };

  return <section className="overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] shadow-[0_14px_44px_-38px_rgba(23,65,58,.45)]" data-testid={`detail-cashier-file-${fileNo}`}>
    <header className="border-b border-[#dce8e2] bg-[#edf5f1] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-[#205b55] px-2.5 py-1 font-mono text-xs font-bold text-white">{file.file_no}</span><span className="rounded-full bg-[#deeee8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#31756d]">{file.file_status}</span><span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#658077]"><ShieldCheck size={13} /> Source record protected</span></div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#193a38]">{file.proposer_name}</h2>
      <p className="mt-1 text-xs text-[#71827e]">Received {dateText(file.receive_dt)} · Last updated {dateText(file.updated_at)}</p>
    </header>
    <div className="space-y-6 p-5 sm:p-6">
      <section><h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Invoice handoff · read only</h3><div className="grid gap-x-6 gap-y-4 rounded-xl border border-[#e3ebe6] bg-[#f7faf8] p-4 sm:grid-cols-3">
        <DataPair label="Invoice number" value={file.invoice_no} /><DataPair label="Business" value={file.business} /><DataPair label="Business type" value={file.business_type} />
        <DataPair label="Payment reference" value={file.pay_ref_no} /><DataPair label="Payment mode" value={file.pay_mode} /><DataPair label="Amount recorded" value={moneyText(file.paid_amt)} />
        <DataPair label="Premium" value={moneyText(file.premium)} /><DataPair label="Entered by" value={file.entered_by} /><DataPair label="Forwarded by" value={file.forwarded_by} />
        <DataPair label="Assigned to" value={file.assigned_to} /><DataPair label="Handoff date" value={dateText(file.to_cashier_dt)} /><DataPair label="Invoiced" value={file.invoiced ? 'Yes' : 'No'} />
      </div></section>

      <section className="rounded-xl border border-[#dfe8e3] bg-[#f9fbf9] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Review decision</h3><p className="mt-1 text-xs text-[#82918b]">Record a traceable disposition and review note.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f1ed] px-2.5 py-1 text-[10px] font-semibold text-[#58736a]"><Clock3 size={12} /> Expected record version locked</span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(['M', 'CC', 'RM', 'RI'] as ReviewAction[]).map(code => <button key={code} type="button" onClick={() => setAction(code)} className={`rounded-lg border px-3 py-3 text-left transition ${action === code ? 'border-[#39766a] bg-[#eaf3ee] text-[#23584e] ring-1 ring-[#39766a]/20' : 'border-[#dfe8e3] bg-[#fffefa] text-[#60756e] hover:bg-[#f2f7f4]'}`} data-testid={`button-cashier-action-${code}`}><span className="block text-xs font-bold">{actionLabels[code]}</span><span className="mt-1 block text-[10px] leading-4 opacity-80">{code === 'M' ? 'Receipt recorded; partial payment routes to Credit Control.' : code === 'CC' ? 'Move into the Credit Control pending-payment queue.' : code === 'RM' ? 'Restore to the original Membership allocation sender.' : 'Return to the original tracker register.'}</span></button>)}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#506b63]">Payment status <span className="text-[#a45c40]">Required</span></span><select value={paidStatus} onChange={e => setPaidStatus(e.target.value as PaidStatus | '')} className={inputClass} data-testid="select-cashier-paid-status"><option value="">Select payment status</option><option value="FULL-PAID">Full paid</option><option value="PART-PAID">Part paid</option><option value="NOT-PAID">Not paid</option></select></label>
          {action === 'M' && <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#506b63]">Receipt number <span className="text-[#a45c40]">Required</span></span><input value={receiptNo} onChange={e => setReceiptNo(e.target.value)} maxLength={50} className={inputClass} placeholder="Enter receipt reference" data-testid="input-cashier-receipt-number" /><span className="mt-1 block text-right text-[10px] text-[#84938d]">{receiptNo.length}/50</span></label>}
          {action === 'RM' && <div className="rounded-lg border border-[#dfe8e3] bg-[#fffefa] p-3 text-xs"><p className="font-semibold text-[#506b63]">Return destination</p><p className="mt-1 text-[#73847d]">{detail.return_membership_to ?? 'No eligible original allocation sender'}</p></div>}
        </div>
        {action === 'M' && <div className="mt-4 rounded-lg border border-[#dfe8e3] bg-[#fffefa] p-3">
          <div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf3ee] text-[#4c796d]"><FileCheck2 size={16} /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#45655c]">System Receipt document</p><p className="mt-1 text-[11px] text-[#85928d]">{detail.has_system_receipt ? 'A receipt document is attached to this file.' : `Upload the required ${systemReceiptReq?.req_name ?? 'System Receipt'} to enable receipting.`}</p>{selectedUpload && <p className="mt-1 truncate text-[11px] font-semibold text-[#327164]">{selectedUpload}</p>}</div><label className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#ccddd4] bg-white px-3 py-2 text-[11px] font-semibold text-[#35665b] hover:bg-[#f1f7f3] ${uploading || !systemReceiptReq ? 'pointer-events-none opacity-50' : ''}`}><input type="file" className="sr-only" disabled={uploading || !systemReceiptReq} onChange={e => { void uploadFile(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} accept=".pdf,.png,.jpg,.jpeg" data-testid="input-cashier-system-receipt" />{uploading ? <LoaderCircle size={13} className="animate-spin" /> : <Upload size={13} />}{uploading ? 'Uploading' : 'Attach receipt'}</label></div>
          <p className="mt-2 pl-11 text-[10px] text-[#87958f]">PDF or image · maximum 10 MB · securely uploaded to the protected file.</p>
          {uploadError && <p className="mt-2 pl-11 text-xs text-[#a14c38]" role="alert">{uploadError}</p>}
        </div>}
        {actionDisabledReason && <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fff3e8] px-3 py-2.5 text-xs leading-5 text-[#8c5439]" role="status"><CircleAlert size={14} className="mt-0.5 shrink-0" />{actionDisabledReason}</p>}
        <label className="mt-4 block"><span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#506b63]"><span>Accountable review note <span className="text-[#a45c40]">Required · maximum 250 characters</span></span><span className={comments.trim().length > 0 ? 'text-[#347264]' : 'text-[#82918b]'}>{comments.trim().length}/250</span></span><textarea value={comments} maxLength={250} onChange={e => setComments(e.target.value)} rows={5} className={`${inputClass} resize-y`} placeholder="Document what was checked, any variance, and the reason for this decision. Existing handoff notes are retained separately." data-testid="textarea-cashier-review-comments" /></label>
        {mutation.isError && <p className="mt-3 rounded-lg bg-[#fff2ed] px-3 py-2.5 text-xs text-[#934b38]" role="alert">{mutation.error instanceof Error ? mutation.error.message : 'Review could not be saved. Your note remains in the form; please retry.'}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="max-w-md text-[10px] leading-4 text-[#87958f]">Review actions update the file workflow. They do not charge funds or send email.</p><button type="button" onClick={submit} disabled={!canSubmit} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#205b55] px-4 text-xs font-bold text-white transition hover:bg-[#174a45] disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-submit-cashier-review">{mutation.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}{mutation.isPending ? 'Saving review…' : `Submit ${actionLabels[action]}`}</button></div>
      </section>

      {detail.related_payments.length > 0 && <section className="rounded-xl border border-[#e5e6d8] bg-[#fcfbf1] p-4"><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#7c7955]">Shared payment reference · context only</h3><p className="mt-1 text-xs leading-5 text-[#89866c]">These are local records with the same payment reference. They are context for review, not proof of external reconciliation.</p><div className="mt-3 divide-y divide-[#eeecdf]">{detail.related_payments.map((payment, index) => <div key={`${payment.file_no}-${index}`} className="grid gap-1 py-2 text-xs sm:grid-cols-[1fr_1.5fr_1fr_1fr]"><span className="font-mono font-semibold text-[#665f41]">{payment.file_no}</span><span className="truncate text-[#706c56]">{payment.proposer_name}</span><span className="text-[#706c56]">{moneyText(payment.paid_amt)} / {moneyText(payment.premium)}</span><span className="text-[#706c56]">{payment.paid_status ?? 'Unrecorded'}</span></div>)}</div></section>}

      <section><h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]"><FileText size={14} /> Protected source documents <span className="font-mono">{detail.uploads.length}</span></h3>
        {detail.uploads.length ? <div className="space-y-2">{detail.uploads.map(upload => <div key={upload.upload_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e1eae5] bg-[#f8fbf9] px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#284541]">{upload.filename}</p><p className="mt-1 text-xs text-[#7b8d87]">{upload.req_name} · {upload.uploaded_by} · {dateText(upload.uploaded_at)}</p></div><a href={staffWorkspaceApi.cashierDownloadUrl(fileNo, upload.upload_id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#ceded6] bg-white px-3 text-xs font-semibold text-[#32665f] hover:bg-[#eff6f2]" data-testid={`link-cashier-download-${upload.upload_id}`}><ArrowDownToLine size={13} /> Download</a></div>)}</div> : <p className="rounded-xl border border-dashed border-[#cfddd5] p-5 text-center text-xs text-[#82918c]">No source documents attached to this handoff.</p>}
      </section>
      <section><h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Handoff notes · preserved <span className="font-mono">{detail.notes.length}</span></h3>
        {detail.notes.length ? <div className="space-y-2">{detail.notes.map(note => <article key={note.note_id} className="rounded-xl border border-[#e2ebe5] bg-[#f8fbf9] p-4"><div className="flex justify-between gap-3 text-[10px] text-[#82918c]"><span className="font-semibold text-[#47665d]">{note.note_from}</span><span>{dateText(note.note_date)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#435d56]">{note.notes}</p></article>)}</div> : <p className="rounded-xl border border-dashed border-[#cfddd5] p-5 text-center text-xs text-[#82918c]">No handoff notes recorded.</p>}
      </section>
      {detail.reviews.length > 0 && <section><h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Review history <span className="font-mono">{detail.reviews.length}</span></h3><div className="space-y-2">{detail.reviews.map(review => <article key={review.review_id} className="rounded-xl border border-[#e2ebe5] bg-[#f8fbf9] p-4"><div className="flex flex-wrap justify-between gap-2 text-[10px]"><span className="font-bold uppercase tracking-wide text-[#3d6a5e]">{actionLabels[review.action as ReviewAction] ?? review.action} · {review.paid_status}</span><span className="text-[#82918c]">{review.reviewed_by} · {dateText(review.reviewed_at)}</span></div>{review.receipt_no && <p className="mt-2 text-xs text-[#536e64]">Receipt {review.receipt_no}</p>}<p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#435d56]">{review.comments}</p></article>)}</div></section>}
    </div>
  </section>;
}

export default function CashierPage() {
  const { user, loading } = useAuth();
  const profileName = (user?.profileName ?? '').trim().toLowerCase();
  const allowed = !!user && (user.profileId === 1 || user.profileId === 2 || user.profileId === 6 || ['finance', 'cashier', 'superadmin', 'system admin'].includes(profileName));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const [bucket, setBucket] = useState<Bucket>('inbox');
  const [success, setSuccess] = useState('');
  const query = useQuery({
    queryKey: ['cashier-handoffs', user?.username, bucket, search.trim(), page],
    queryFn: () => staffWorkspaceApi.cashier(search.trim(), page, bucket),
    staleTime: 15_000, refetchInterval: 15_000, enabled: allowed,
  });
  const rows: CashierFile[] = query.data?.data ?? [];
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.pageSize || 25)));
  const resetSelection = () => { setSelected(''); setSuccess(''); };
  if (loading) return <main className="min-h-[100dvh] animate-pulse bg-[#f1f6f2] p-8"><div className="mx-auto h-12 max-w-5xl rounded-lg bg-[#e4eee8]" /></main>;
  if (!allowed) return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f1f6f2] p-6"><section className="max-w-md rounded-2xl border border-[#d8e5df] bg-[#fbfdfb] p-8 text-center"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf2ee] text-[#3c7771]"><LockKeyhole size={21} /></span><h1 className="text-xl font-semibold text-[#183a39]">Finance access required</h1><p className="mt-2 text-sm leading-6 text-[#687b77]">Cashier Review is available to Finance, Cashier, SuperAdmin and System Admin profiles.</p></section></main>;

  return <main className="min-h-[100dvh] bg-[#f1f6f2] px-4 py-5 text-[#203c3a] sm:px-6 sm:py-7">
    <div className="mx-auto max-w-[1480px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#557e74]"><span className="h-px w-6 bg-[#8eaea2]" /> AAR MIS / Business Tracking</p><h1 className="mt-2 text-[28px] font-semibold tracking-[-.045em] text-[#193a38] sm:text-[34px]">Cashier Review</h1><p className="mt-1 max-w-2xl text-sm text-[#758681]">Review invoice handoffs, retain accountable notes and route each file to its next team.</p></div><div className="flex items-center gap-2 rounded-lg border border-[#d9e5df] bg-[#f9fcfa] px-3 py-2 text-[11px] font-medium text-[#637a73]"><Banknote size={15} className="text-[#468176]" /> Staff workspace</div></header>
      {success && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#bed9cc] bg-[#eaf5ee] px-4 py-3 text-sm font-semibold text-[#28634f]" role="status" data-testid="status-cashier-review-success"><span className="flex items-center gap-2"><Check size={16} />{success}</span><button onClick={() => setSuccess('')} aria-label="Dismiss success message" className="rounded p-1 hover:bg-[#dcefe3]" data-testid="button-dismiss-cashier-success"><X size={14} /></button></div>}
      <div className="grid gap-5 lg:grid-cols-[370px_minmax(0,1fr)]">
        <aside className={`${selected ? 'hidden md:block' : ''} overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb]`}>
          <div className="border-b border-[#e4ece7] p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d847d]">{bucket === 'inbox' ? 'Handoff inbox' : 'Credit Control'}</p><button onClick={() => query.refetch()} disabled={query.isFetching} aria-label="Refresh handoffs" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#68817a] hover:bg-[#edf4f0] disabled:opacity-50" data-testid="button-refresh-cashier"><RefreshCw size={14} className={query.isFetching ? 'animate-spin' : ''} /></button></div>
            <div className="mt-3 grid grid-cols-2 rounded-lg bg-[#eef4f0] p-1"><button onClick={() => { setBucket('inbox'); setPage(1); resetSelection(); }} className={`rounded-md px-2 py-2 text-[11px] font-semibold ${bucket === 'inbox' ? 'bg-white text-[#315f56] shadow-sm' : 'text-[#7d8b85]'}`} data-testid="button-cashier-inbox">Inbox</button><button onClick={() => { setBucket('credit-control'); setPage(1); resetSelection(); }} className={`rounded-md px-2 py-2 text-[11px] font-semibold ${bucket === 'credit-control' ? 'bg-white text-[#315f56] shadow-sm' : 'text-[#7d8b85]'}`} data-testid="button-cashier-credit-control">Credit Control</button></div>
            <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-[#dce7e1] bg-white px-3 text-[#7b8d87]"><Search size={15} /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); resetSelection(); }} placeholder="Search file or proposer…" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#9baaa4]" data-testid="input-cashier-search" /></label><p className="mt-3 text-[10px] text-[#83928d]">{query.data ? `${query.data.total} ${bucket === 'inbox' ? 'handoff files' : 'pending-payment files'}` : 'Updated every 15 seconds'}</p></div>
          <div className="max-h-[calc(100dvh-365px)] min-h-[280px] overflow-y-auto">
            {query.isLoading ? <div className="space-y-2 p-4">{[0,1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-[#edf3ef]" />)}</div> : query.isError ? <div className="p-7 text-center"><p className="text-sm font-semibold text-[#65483e]">Handoffs did not load</p><p className="mt-1 text-xs text-[#8a7770]">{query.error instanceof Error ? query.error.message : 'Try again.'}</p><button onClick={() => query.refetch()} className="mt-3 rounded-md border border-[#d8c8c0] px-3 py-1.5 text-xs font-semibold" data-testid="button-retry-cashier">Retry</button></div> : rows.length ? rows.map(file => <button key={file.file_no} onClick={() => { setSelected(file.file_no); setSuccess(''); }} className={`block w-full border-b border-[#edf1ee] px-4 py-4 text-left transition hover:bg-[#f3f8f5] ${selected === file.file_no ? 'bg-[#edf5f1]' : ''}`} data-testid={`button-open-cashier-${file.file_no}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] font-bold text-[#315f56]">{file.file_no}</span><span className="rounded-full bg-[#e4eee8] px-2 py-1 text-[9px] font-bold uppercase text-[#53766c]">{file.file_status}</span></div><p className="mt-2 truncate text-sm font-semibold text-[#36574f]">{file.proposer_name}</p><p className="mt-1 text-[10px] text-[#82918b]">{file.invoice_no ? `Invoice ${file.invoice_no}` : 'No invoice number'} · {file.paid_status ?? 'Payment not recorded'}</p></button>) : <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><FileText size={22} className="mb-3 text-[#9aaea6]" /><p className="text-sm font-semibold text-[#44625a]">{search ? 'No matching handoffs' : bucket === 'inbox' ? 'Inbox is clear' : 'No pending-payment files'}</p><p className="mt-1 text-xs leading-5 text-[#8a9993]">{search ? 'Try another file number or proposer.' : 'Files routed to this queue will appear here.'}</p></div>}
          </div>
          <footer className="flex items-center justify-between border-t border-[#e4ece7] bg-[#f8fbf9] px-4 py-3"><span className="font-mono text-[10px] text-[#82918b]">PAGE {page} / {pages}</span><div className="flex gap-1"><button disabled={page <= 1 || query.isLoading} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Previous cashier page" className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] disabled:opacity-40" data-testid="button-cashier-previous"><ArrowLeft size={14} /></button><button disabled={page >= pages || query.isLoading} onClick={() => setPage(p => Math.min(pages, p + 1))} aria-label="Next cashier page" className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] disabled:opacity-40" data-testid="button-cashier-next"><ArrowRight size={14} /></button></div></footer>
        </aside>
        <div className={`${selected ? 'block' : 'hidden md:block'} min-w-0`}>{selected && user ? <div className="space-y-3"><button onClick={() => setSelected('')} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d7e3dc] bg-[#fbfdfb] px-3 text-xs font-semibold text-[#527169] md:hidden" data-testid="button-back-cashier-list"><ArrowLeft size={14} /> Back to handoffs</button><FileDetail key={`${bucket}-${selected}`} fileNo={selected} username={user.username} bucket={bucket} onReviewed={message => { setSuccess(message); setSelected(''); }} /></div> : <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbdad2] bg-[#f8fbf9] px-8 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4eee8] text-[#4f7d70]"><Paperclip size={23} /></div><p className="text-base font-semibold text-[#34564e]">Select an invoice handoff</p><p className="mt-2 max-w-sm text-sm leading-6 text-[#81918a]">Review source records, confirm documents and leave a decision note. Shared payment references are context, not external reconciliation.</p></div>}</div>
      </div>
    </div>
  </main>;
}
