import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, CheckCircle2, CircleAlert,
  Clock3, FileText, FolderOpen, LockKeyhole, RefreshCw, Search, ShieldCheck, UserRound, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { giApi, type GiDecisionBody, type GiFileDetail } from '@/lib/gi-api';
import type { BusinessFile } from '@/lib/mis-api';

const PAGE_SIZE = 25;
const isAdmin = (profileId?: number) => profileId === 1 || profileId === 2;
const giRole = (user: ReturnType<typeof useAuth>['user']) => {
  const profile = (user?.profileName ?? '').trim().toLowerCase();
  const department = (user?.department ?? '').trim().toLowerCase();
  return isAdmin(user?.profileId)
    || ['gi', 'nonmedical', 'non medical', 'general insurance'].includes(profile)
    || ['gi', 'nonmedical', 'non medical', 'general insurance'].includes(department);
};
const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const money = (value?: number | null) => value == null ? '—' : `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const conflictMessage = (error: unknown) => {
  const status = (error as { status?: number })?.status;
  if (status === 409 || status === 412) return 'This file changed after it was opened. Refresh the detail and review the latest status before submitting again.';
  return error instanceof Error ? error.message : 'The decision could not be saved. Please try again.';
};

function AccessMessage() {
  return <main className="flex min-h-[70vh] items-center justify-center bg-[#f1f6f2] p-6"><section className="max-w-md rounded-2xl border border-[#d9e5df] bg-[#fbfdfb] p-8 text-center shadow-sm"><LockKeyhole className="mx-auto mb-4 text-[#4c8274]" size={25} /><h1 className="text-xl font-semibold text-[#193a38]">GI workspace access required</h1><p className="mt-2 text-sm leading-6 text-[#687b77]">This queue is available to General Insurance / Non-Medical staff and administrators.</p></section></main>;
}

function DetailPanel({ fileNo, onUpdated }: { fileNo: string; onUpdated: (message: string) => void }) {
  const client = useQueryClient();
  const [action, setAction] = useState<'A' | 'RI'>('A');
  const [assignedTo, setAssignedTo] = useState('');
  const [comments, setComments] = useState('');
  const submitLock = useRef(false);
  const detailQuery = useQuery({
    queryKey: ['gi-file-detail', fileNo],
    queryFn: () => giApi.detail(fileNo),
    refetchOnWindowFocus: false,
  });
  const staffQuery = useQuery({ queryKey: ['gi-staff'], queryFn: giApi.staff, staleTime: 30_000 });
  const detail: GiFileDetail | undefined = detailQuery.data?.data;
  const file = detail?.file;
  const staff = staffQuery.data?.data ?? [];
  const decision = useMutation({
    mutationFn: (body: GiDecisionBody) => giApi.decide(fileNo, body),
    onSuccess: async result => {
      const notification = result.data.notification_status
        ? `Email status: ${result.data.notification_status}.`
        : 'No email delivery status was returned.';
      const message = `${fileNo} moved to ${result.data.file_status} (${result.data.queue_name}). ${notification}`;
      onUpdated(message);
      setComments('');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['gi-allocate-list'] }),
        client.invalidateQueries({ queryKey: ['business-allocated', 'gi'] }),
        client.invalidateQueries({ queryKey: ['gi-file-detail', fileNo] }),
        client.invalidateQueries({ queryKey: ['allocated-business-file', 'gi', fileNo] }),
        client.invalidateQueries({ queryKey: ['allocated-business-uploads', 'gi', fileNo] }),
        client.invalidateQueries({ queryKey: ['allocated-business-history', 'gi', fileNo] }),
      ]);
      await detailQuery.refetch();
    },
    onSettled: () => { submitLock.current = false; },
  });
  const submit = () => {
    if (submitLock.current || decision.isPending || !file?.updated_at) return;
    if (comments.trim().length < 1 || comments.trim().length > 250) return;
    if (action === 'A' && !staff.some(person => person.username === assignedTo)) return;
    submitLock.current = true;
    decision.mutate({
      action,
      ...(action === 'A' ? { assigned_to: assignedTo } : {}),
      comments: comments.trim(),
      expected_updated_at: file.updated_at,
    });
  };

  if (detailQuery.isLoading) return <section className="animate-pulse space-y-4 rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] p-6"><div className="h-7 w-52 rounded bg-[#e4eee8]" /><div className="h-24 rounded bg-[#edf3ef]" /><div className="h-40 rounded bg-[#edf3ef]" /></section>;
  if (detailQuery.isError || !detail || !file) return <section className="rounded-2xl border border-[#ead9ce] bg-[#fcf8f5] p-8 text-center"><CircleAlert className="mx-auto mb-2 text-[#ad614a]" size={22} /><p className="font-semibold text-[#754c3d]">File detail unavailable</p><p className="mt-2 text-sm text-[#8a7166]">{detailQuery.error instanceof Error ? detailQuery.error.message : 'The registration could not be loaded.'}</p><button type="button" onClick={() => detailQuery.refetch()} className="mt-4 rounded-lg border border-[#ddc7bb] px-4 py-2 text-sm" data-testid="button-retry-gi-detail">Retry</button></section>;

  const fields: Array<[string, string | number | null | undefined]> = [
    ['Business', file.business], ['Business type', file.business_type], ['Client type', file.client_type],
    ['Product', file.product], ['Category', file.gi_category], ['Receive date', fmtDate(file.receive_dt)],
    ['Premium', money(file.premium)], ['Agent', file.agent_name], ['Allocated to', file.allocated_to],
    ['National ID', file.nid], ['KRA PIN', file.pin_no], ['County', file.county_code],
    ['Payment reference', file.pay_ref_no], ['Entered by', file.entered_by], ['Last updated', fmtDate(file.updated_at)],
  ];
  return <section className="overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] shadow-[0_14px_44px_-38px_rgba(23,65,58,.45)]" data-testid={`gi-detail-${fileNo}`}>
    <header className="border-b border-[#dce8e2] bg-[#edf5f1] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-[#205b55] px-2.5 py-1 font-mono text-xs font-bold text-white">{file.file_no}</span><span className="rounded-full bg-[#e7efeb] px-2.5 py-1 text-[10px] font-bold uppercase text-[#607a71]">{file.file_status}</span><span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#658077]"><ShieldCheck size={13} /> Registration read only</span></div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#193a38]">{file.proposer_name}</h2>
      <p className="mt-1 text-xs text-[#71827e]">Received {fmtDate(file.receive_dt)} · Updated {fmtDate(file.updated_at)}</p>
    </header>
    <div className="space-y-6 p-5 sm:p-6">
      {decision.isSuccess && <p role="status" className="rounded-xl border border-[#c7dfd2] bg-[#eef7f1] px-4 py-3 text-xs font-semibold leading-5 text-[#3b6d5a]" data-testid="status-gi-decision-success">{fileNo} decision saved. Notification status: {decision.data.data.notification_status ?? 'not returned'}.</p>}
      {decision.isError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#ead9ce] bg-[#fcf8f5] px-4 py-3 text-xs leading-5 text-[#754c3d]" data-testid="status-gi-decision-error"><CircleAlert size={15} className="mt-0.5 shrink-0" /><span>{conflictMessage(decision.error)} {(decision.error as { status?: number })?.status === 409 || (decision.error as { status?: number })?.status === 412 ? <button type="button" onClick={() => { decision.reset(); void detailQuery.refetch(); }} className="ml-1 font-bold underline" data-testid="button-refresh-gi-conflict">Reload latest details</button> : <button type="button" onClick={() => decision.reset()} className="ml-1 font-bold underline">Dismiss</button>}</span></div>}
      <section><div className="mb-3 flex items-center gap-2"><FileText size={15} className="text-[#588076]" /><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Original registration · read only</h3></div><div className="grid gap-x-6 gap-y-4 rounded-xl border border-[#e3ebe6] bg-[#f7faf8] p-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#82918b]">{label}</p><p className="mt-1 break-words text-sm font-medium text-[#36574f]">{value || '—'}</p></div>)}</div></section>
      <section><div className="mb-3 flex items-center gap-2"><FolderOpen size={15} className="text-[#588076]" /><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Registration documents</h3></div>
        {detail.uploads.length ? <div className="overflow-hidden rounded-xl border border-[#e1eae4]">{detail.uploads.map(upload => <div key={upload.upload_id} className="flex items-center gap-3 border-b border-[#edf1ee] px-3 py-3 last:border-0" data-testid={`row-gi-upload-${upload.upload_id}`}><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#35564f]">{upload.filename}</p><p className="mt-0.5 truncate text-[10px] text-[#82918b]">{upload.req_name || 'Document'} · {upload.uploaded_by} · {fmtDate(upload.uploaded_at)}</p></div><a href={giApi.downloadUrl(fileNo, upload.upload_id)} target="_blank" rel="noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#68817a] hover:bg-[#edf4f0]" aria-label={`Download ${upload.filename}`} data-testid={`link-download-gi-upload-${upload.upload_id}`}><ArrowDownToLine size={15} /></a></div>)}</div> : <div className="rounded-xl border border-dashed border-[#d7e4dc] bg-[#f8fbf9] px-4 py-8 text-center"><FolderOpen className="mx-auto mb-2 text-[#86a097]" size={23} /><p className="text-sm font-semibold text-[#44625a]">No uploaded documents</p><p className="mt-1 text-xs text-[#8a9993]">Files attached to the registration will appear here.</p></div>}
      </section>
      <section><div className="mb-3 flex items-center gap-2"><Clock3 size={15} className="text-[#588076]" /><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">Retained notes</h3></div>
        {detail.notes.length ? <div className="space-y-2">{detail.notes.map(note => <article key={note.note_id} className="rounded-lg border border-[#e3ebe6] bg-[#f8fbf9] p-3" data-testid={`gi-note-${note.note_id}`}><div className="flex flex-wrap justify-between gap-2 text-[10px] text-[#82918b]"><span className="font-semibold text-[#567269]">{note.note_from}</span><span>{fmtDate(note.note_date)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#49645c]">{note.notes}</p></article>)}</div> : <p className="rounded-lg border border-dashed border-[#d7e4dc] p-5 text-center text-xs text-[#82918b]">No notes recorded for this file.</p>}
      </section>
      <section className="rounded-xl border border-[#d4e6e0] bg-[#f3f8f5] p-4">
        <div className="mb-3 flex items-center gap-2"><UserRound size={15} className="text-[#588076]" /><h3 className="text-[10px] font-bold uppercase tracking-[.17em] text-[#6d847d]">GI decision</h3></div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-semibold text-[#49645c]">Decision<select value={action} onChange={event => setAction(event.target.value as 'A' | 'RI')} disabled={decision.isPending} className="h-10 w-full rounded-lg border border-[#d6e2dc] bg-[#fffefa] px-3 text-sm font-medium text-[#294540]" data-testid="select-gi-decision"><option value="A">Allocate</option><option value="RI">Return incomplete</option></select></label>
          {action === 'A' && <label className="space-y-1.5 text-xs font-semibold text-[#49645c]">Active GI recipient{staffQuery.isLoading ? <span className="block h-10 animate-pulse rounded-lg bg-[#e5eee9]" /> : <select value={assignedTo} onChange={event => setAssignedTo(event.target.value)} disabled={decision.isPending || staffQuery.isError} className="h-10 w-full rounded-lg border border-[#d6e2dc] bg-[#fffefa] px-3 text-sm font-medium text-[#294540]" data-testid="select-gi-recipient"><option value="">Choose an active staff member</option>{staff.map(person => <option key={person.username} value={person.username}>{person.employee_name} · {person.username}</option>)}</select>}{staffQuery.isError && <span className="block text-[11px] font-normal text-[#ad614a]">Staff list unavailable. <button type="button" onClick={() => staffQuery.refetch()} className="underline">Retry</button></span>}{!staffQuery.isLoading && !staffQuery.isError && staff.length === 0 && <span className="block text-[11px] font-normal text-[#8a7166]">No active GI recipients are available.</span>}</label>}
        </div>
        <label className="mt-3 block space-y-1.5 text-xs font-semibold text-[#49645c]" htmlFor={`gi-comments-${fileNo}`}>Explanatory comments <span className="font-normal">· required, 1–250 characters</span><textarea id={`gi-comments-${fileNo}`} value={comments} onChange={event => setComments(event.target.value.slice(0, 250))} maxLength={250} rows={3} disabled={decision.isPending} placeholder="Explain why this file is being allocated or returned…" className="w-full resize-y rounded-lg border border-[#d6e2dc] bg-[#fffefa] px-3 py-2.5 text-sm font-normal text-[#24443e] outline-none placeholder:text-[#9baaa4] focus:border-[#4c8274] focus:ring-2 focus:ring-[#4c8274]/15" data-testid="input-gi-comments" /><span className="block text-right font-mono text-[10px] text-[#82918b]">{comments.trim().length}/250</span></label>
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e0eae4] pt-4"><p className="max-w-sm text-[10px] leading-4 text-[#82918b]">Each decision records an auditable handoff and may send a notification. Delivery status is shown after submission.</p><button type="button" onClick={submit} disabled={decision.isPending || comments.trim().length < 1 || (action === 'A' && (!assignedTo || staffQuery.isLoading || staffQuery.isError || !staff.some(person => person.username === assignedTo)))} className="inline-flex items-center gap-2 rounded-lg bg-[#28675d] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#20584f] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-submit-gi-decision">{decision.isPending ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}{decision.isPending ? 'Saving decision…' : action === 'A' ? 'Allocate file' : 'Return incomplete'}</button></footer>
      </section>
    </div>
  </section>;
}

function QueueRow({ file, active, onSelect }: { file: BusinessFile; active: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`w-full border-b border-[#edf1ee] px-4 py-3.5 text-left transition ${active ? 'bg-[#edf5f1] shadow-[inset_3px_0_0_#39766a]' : 'hover:bg-[#f7faf8]'}`} data-testid={`button-select-gi-${file.file_no}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] font-bold text-[#2e6259]">{file.file_no}</span><span className="rounded-full bg-[#e7efeb] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#607a71]">{file.file_status}</span></div><p className="mt-1 truncate text-sm font-semibold text-[#294741]">{file.proposer_name}</p><div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#82918b]"><span>{file.business_type} · {file.client_type}</span><span>{fmtDate(file.receive_dt)}</span></div></button>;
}

export default function GiAllocatePage() {
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { const previous = document.title; document.title = 'GI-Allocate | AAR MIS'; return () => { document.title = previous; }; }, []);
  const access = giRole(user);
  const list = useQuery({
    queryKey: ['gi-allocate-list', search, page],
    queryFn: () => giApi.list(search, page),
    enabled: access,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
  const rows = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const pageSize = list.data?.pageSize ?? PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (authLoading) return <main className="min-h-[100dvh] animate-pulse bg-[#f1f6f2] p-6"><div className="mx-auto max-w-[1480px]"><div className="h-8 w-64 rounded bg-[#dce8e2]" /><div className="mt-6 grid gap-5 lg:grid-cols-[350px_1fr]"><div className="h-[620px] rounded-2xl bg-[#e7efea]" /><div className="h-[620px] rounded-2xl bg-[#e7efea]" /></div></div></main>;
  if (!user || !access) return <AccessMessage />;

  return <main className="min-h-[100dvh] bg-[#f1f6f2] px-4 py-5 text-[#203c3a] sm:px-6 sm:py-7">
    <div className="mx-auto max-w-[1480px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#557e74]"><span className="h-px w-6 bg-[#8eaea2]" /> AAR MIS / Business Tracking</p><h1 className="mt-2 text-[28px] font-semibold tracking-[-.045em] text-[#193a38] sm:text-[34px]">GI-Allocate</h1><p className="mt-1 max-w-2xl text-sm text-[#758681]">Route non-medical registrations to an active GI colleague, or return incomplete files with a clear explanation.</p></div><div className="flex items-center gap-2 rounded-lg border border-[#d9e5df] bg-[#f9fcfa] px-3 py-2 text-[11px] font-medium text-[#637a73]"><ShieldCheck size={15} className="text-[#468176]" /> {user.name}</div></header>
      {notice && <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#c7dfd2] bg-[#eef7f1] px-4 py-3 text-xs font-semibold leading-5 text-[#3b6d5a]" data-testid="status-gi-queue-success"><span className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0" />{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss message" className="rounded p-1 hover:bg-[#e0eee5]" data-testid="button-dismiss-gi-notice"><X size={14} /></button></div>}
      <div className="grid gap-5 lg:grid-cols-[350px_minmax(0,1fr)] xl:grid-cols-[370px_minmax(0,1fr)]">
        <aside className={`${selectedFile ? 'hidden md:block' : ''} overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] shadow-[0_14px_44px_-38px_rgba(23,65,58,.45)]`}>
          <div className="border-b border-[#e4ece7] px-4 pb-3 pt-4"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d847d]">GI registration queue</p><button type="button" onClick={() => list.refetch()} disabled={list.isFetching} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#68817a] hover:bg-[#edf4f0] disabled:opacity-50" aria-label="Refresh GI queue" data-testid="button-refresh-gi-queue"><RefreshCw size={14} className={list.isFetching ? 'animate-spin' : ''} /></button></div>
            <form className="mt-3 flex gap-2" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(searchDraft.trim()); }}><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#dce7e1] bg-white px-3 text-[#7b8d87] focus-within:border-[#74a195]"><Search size={15} /><input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder="Search file or proposer…" className="min-w-0 flex-1 bg-transparent text-xs text-[#294540] outline-none placeholder:text-[#9baaa4]" data-testid="input-gi-search" /></label><button type="submit" className="rounded-lg bg-[#28675d] px-3 text-xs font-bold text-white hover:bg-[#20584f]" data-testid="button-search-gi">Search</button></form>
            <div className="mt-3 flex items-center justify-between text-[10px] text-[#83928d]"><span>Non-medical files</span>{!list.isLoading && !list.isError && <span className="font-mono">{total} files</span>}</div>
          </div>
          <div className="max-h-[calc(100dvh-300px)] min-h-[270px] overflow-y-auto">
            {list.isLoading ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-[92px] animate-pulse rounded-lg bg-[#edf3ef]" />)}</div>
              : list.isError ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><CircleAlert className="mb-2 text-[#ad614a]" size={22} /><p className="text-sm font-semibold text-[#65483e]">Queue did not load</p><p className="mt-1 text-xs text-[#8a7770]">{list.error instanceof Error ? list.error.message : 'The GI queue is unavailable.'}</p><button type="button" onClick={() => list.refetch()} className="mt-3 rounded-md border border-[#d8c8c0] px-3 py-1.5 text-xs font-semibold text-[#704c40]" data-testid="button-retry-gi-queue">Retry</button></div>
                : rows.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4ef] text-[#7b998e]"><FolderOpen size={20} /></div><p className="text-sm font-semibold text-[#44625a]">{search ? 'No matching files' : 'Nothing waiting for GI allocation'}</p><p className="mt-1 max-w-[220px] text-xs leading-5 text-[#8a9993]">{search ? 'Try another file number or proposer name.' : 'New non-medical registrations will appear here when ready for review.'}</p></div>
                  : rows.map(file => <QueueRow key={file.file_no} file={file} active={selectedFile === file.file_no} onSelect={() => { setSelectedFile(file.file_no); }} />)}
          </div>
          <footer className="flex items-center justify-between border-t border-[#e4ece7] bg-[#f8fbf9] px-4 py-3"><span className="font-mono text-[10px] text-[#82918b]">PAGE {page} / {pages} · 25 per page</span><div className="flex gap-1"><button type="button" disabled={page <= 1 || list.isLoading} onClick={() => setPage(current => Math.max(1, current - 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] hover:bg-[#edf4f0] disabled:opacity-40" aria-label="Previous page" data-testid="button-gi-previous-page"><ArrowLeft size={14} /></button><button type="button" disabled={page >= pages || list.isLoading} onClick={() => setPage(current => Math.min(pages, current + 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] hover:bg-[#edf4f0] disabled:opacity-40" aria-label="Next page" data-testid="button-gi-next-page"><ArrowRight size={14} /></button></div></footer>
        </aside>
        <div className={selectedFile ? '' : 'hidden md:block'}>{selectedFile ? <><button type="button" onClick={() => setSelectedFile('')} className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#dce7e1] bg-[#fbfdfb] px-3 py-2 text-xs font-semibold text-[#55746b] md:hidden" data-testid="button-back-to-gi-queue"><ArrowLeft size={14} /> Back to queue</button><DetailPanel key={selectedFile} fileNo={selectedFile} onUpdated={message => { setNotice(message); void list.refetch(); }} /></> : <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d3e1d9] bg-[#f8fbf9] px-6 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf2ed] text-[#578075]"><FileText size={24} /></div><p className="text-sm font-semibold text-[#44625a]">Choose a registration to review</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#8a9993]">The original registration, retained notes and uploaded documents stay read-only while you decide the next GI handoff.</p></div>}</div>
      </div>
    </div>
  </main>;
}
