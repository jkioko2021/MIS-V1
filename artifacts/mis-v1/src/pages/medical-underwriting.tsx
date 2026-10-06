import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { medicalApi, type MedicalFile, type MedicalReviewInput } from '@/lib/medical-underwriting-api';
import { MedicalFileDetail } from './medical-underwriting/file-detail';
import { errorText, isForbidden, QueueRow } from './medical-underwriting/shared';

type Queue = 'pending' | 'reverted';
type Envelope<T> = { ok: boolean; data: T; error?: string };
type QueueResult = Envelope<MedicalFile[]> & { total: number; page: number; pageSize: number };
const PAGE_SIZE_FALLBACK = 25;
const ALLOWED_PROFILES = [1, 2, 5];
const ALLOWED_PROFILE_NAMES = ['medical uw', 'superadmin', 'system admin'];

function PageSkeleton() {
  return (
    <div className="min-h-[70vh] animate-pulse bg-[#f3f7f4] p-5 sm:p-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="h-8 w-64 rounded bg-[#dce8e2]" />
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="h-[600px] rounded-xl bg-[#e7efea]" />
          <div className="h-[600px] rounded-xl bg-[#e7efea]" />
        </div>
      </div>
    </div>
  );
}

function AccessMessage({ forbidden = false }: { forbidden?: boolean }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f3f7f4] p-6">
      <div className="max-w-md rounded-2xl border border-[#d8e5df] bg-[#fbfdfb] p-8 text-center shadow-[0_18px_50px_-38px_rgba(24,58,57,.45)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf2ee] text-[#3c7771]"><LockKeyhole size={21} /></div>
        <h1 className="text-xl font-semibold text-[#183a39]">{forbidden ? 'Medical review access required' : 'Sign in to review membership files'}</h1>
        <p className="mt-2 text-sm leading-6 text-[#687b77]">
          {forbidden
            ? 'This workspace is available to Medical UW, SuperAdmin and System Admin profiles.'
            : 'Your staff session is not available. Sign in through the MIS portal to continue.'}
        </p>
      </div>
    </div>
  );
}

export default function MedicalUnderwritingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Medical Underwriting Review | AAR MIS';
    return () => { document.title = previousTitle; };
  }, []);
  const { user, loading: authLoading } = useAuth();
  const [queue, setQueue] = useState<Queue>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState('');
  const [queueNotice, setQueueNotice] = useState('');
  const normalizedSearch = search.trim();
  const profileName = (user?.profileName ?? '').trim().toLowerCase();
  const access = !!user && (ALLOWED_PROFILES.includes(user.profileId) || ALLOWED_PROFILE_NAMES.includes(profileName));

  const queueQuery = useQuery<QueueResult>({
    queryKey: ['medical-underwriting-queue', queue, normalizedSearch, page],
    queryFn: () => medicalApi.list(queue, normalizedSearch, page),
    enabled: access,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const rows = queueQuery.data?.data ?? [];
  const total = queueQuery.data?.total ?? 0;
  const pageSize = queueQuery.data?.pageSize || PAGE_SIZE_FALLBACK;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (authLoading) return <PageSkeleton />;
  if (!user) return <AccessMessage />;
  if (!access) return <AccessMessage forbidden />;

  const changeQueue = (next: Queue) => {
    setQueue(next);
    setPage(1);
    setSelectedFile('');
    setQueueNotice('');
  };
  const closeAfterReview = (_action: MedicalReviewInput['action']) => setSelectedFile('');
  const closeAfterCompletedHpc = () => {
    setSelectedFile('');
    setQueueNotice('HPC registration saved. This completed file no longer needs medical review.');
  };

  return (
    <main className="min-h-[100dvh] bg-[#f1f6f2] px-4 py-5 text-[#203c3a] sm:px-6 sm:py-7">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#557e74]"><span className="h-px w-6 bg-[#8eaea2]" /> AAR MIS / Operations</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-.045em] text-[#193a38] sm:text-[34px]">Medical Underwriting Review</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#758681]">Review insurer membership files. Record the decision, then hand off to the right team.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#d9e5df] bg-[#f9fcfa] px-3 py-2 text-[11px] font-medium text-[#637a73]"><ShieldCheck size={15} className="text-[#468176]" /> {user.name}</div>
        </header>

        {queueNotice && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#c7dfd2] bg-[#eef7f1] px-4 py-3 text-xs font-semibold text-[#3b6d5a]" role="status" data-testid="status-medical-queue-success">
            <span className="flex items-center gap-2"><CheckCircle2 size={15} />{queueNotice}</span>
            <button type="button" onClick={() => setQueueNotice('')} aria-label="Dismiss success message" className="rounded p-1 hover:bg-[#e0eee5]"><X size={14} /></button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className={`${selectedFile ? 'hidden md:block' : ''} overflow-hidden rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] shadow-[0_14px_44px_-38px_rgba(23,65,58,.45)]`}>
            <div className="border-b border-[#e4ece7] px-4 pb-3 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d847d]">Review inbox</p>
                <button type="button" onClick={() => queueQuery.refetch()} disabled={queueQuery.isFetching} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#68817a] hover:bg-[#edf4f0] disabled:opacity-50" aria-label="Refresh queue" data-testid="button-refresh-medical-queue"><RefreshCw size={14} className={queueQuery.isFetching ? 'animate-spin' : ''} /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 rounded-lg bg-[#edf3ef] p-1">
                {(['pending', 'reverted'] as Queue[]).map(item => <button type="button" key={item} onClick={() => changeQueue(item)} className={`rounded-md px-2 py-2 text-xs font-semibold transition ${queue === item ? 'bg-[#fbfdfb] text-[#285a52] shadow-sm' : 'text-[#7b8c86] hover:text-[#47665e]'}`} data-testid={`tab-medical-${item}`}>{item === 'pending' ? 'Pending review' : 'Reverted / HPC'}</button>)}
              </div>
              <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-[#dce7e1] bg-white px-3 text-[#7b8d87] focus-within:border-[#74a195]">
                <Search size={15} />
                <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search file or proposer…" className="min-w-0 flex-1 bg-transparent text-xs text-[#294540] outline-none placeholder:text-[#9baaa4]" data-testid="input-medical-queue-search" />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="rounded p-1 hover:bg-[#edf3ef]"><X size={13} /></button>}
              </label>
              <div className="mt-3 flex items-center justify-between text-[10px] text-[#83928d]">
                <span>{queue === 'pending' ? 'Awaiting medical review' : 'Awaiting HPC registration'}</span>
                {!queueQuery.isLoading && !queueQuery.isError && <span className="font-mono">{total} files</span>}
              </div>
            </div>
            <div className="max-h-[calc(100dvh-330px)] min-h-[270px] overflow-y-auto">
              {queueQuery.isLoading ? (
                <div className="space-y-2 p-4">{[0, 1, 2, 3].map(index => <div key={index} className="h-[100px] animate-pulse rounded-lg bg-[#edf3ef]" />)}</div>
              ) : queueQuery.isError ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <AlertCircle className="mb-2 text-[#ad614a]" size={22} />
                  <p className="text-sm font-semibold text-[#65483e]">{isForbidden(queueQuery.error) ? 'Medical review access required' : 'Queue did not load'}</p>
                  <p className="mt-1 text-xs text-[#8a7770]">{isForbidden(queueQuery.error) ? 'Your staff profile is not permitted to view these files.' : errorText(queueQuery.error)}</p>
                  <button type="button" onClick={() => queueQuery.refetch()} className="mt-3 rounded-md border border-[#d8c8c0] px-3 py-1.5 text-xs font-semibold text-[#704c40]" data-testid="button-retry-medical-queue">Retry</button>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4ef] text-[#7b998e]"><CheckCircle2 size={20} /></div>
                  <p className="text-sm font-semibold text-[#44625a]">{normalizedSearch ? 'No matching files' : queue === 'pending' ? 'All clear for now' : 'No files returned'}</p>
                  <p className="mt-1 max-w-[220px] text-xs leading-5 text-[#8a9993]">{normalizedSearch ? 'Try a different file number or proposer name.' : queue === 'pending' ? 'New insurer membership files will appear here when they need medical review.' : 'Files flagged for HPC registration will appear here.'}</p>
                </div>
              ) : rows.map(file => (
                <QueueRow key={file.file_no} file={file} active={selectedFile === file.file_no} onSelect={() => setSelectedFile(file.file_no)} />
              ))}
            </div>
            <footer className="flex items-center justify-between border-t border-[#e4ece7] bg-[#f8fbf9] px-4 py-3">
              <span className="font-mono text-[10px] text-[#82918b]">PAGE {page} / {totalPages}</span>
              <div className="flex gap-1">
                <button type="button" disabled={page <= 1 || queueQuery.isLoading} onClick={() => setPage(current => Math.max(1, current - 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] hover:bg-[#edf4f0] disabled:opacity-40" aria-label="Previous page" data-testid="button-medical-previous-page"><ArrowLeft size={14} /></button>
                <button type="button" disabled={page >= totalPages || queueQuery.isLoading} onClick={() => setPage(current => Math.min(totalPages, current + 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dce7e1] bg-white text-[#5d7770] hover:bg-[#edf4f0] disabled:opacity-40" aria-label="Next page" data-testid="button-medical-next-page"><ArrowRight size={14} /></button>
              </div>
            </footer>
          </aside>

          <div className={`${selectedFile ? 'block' : 'hidden md:block'} min-w-0`}>
            {selectedFile ? (
              <div className="space-y-3">
                <button type="button" onClick={() => setSelectedFile('')} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d7e3dc] bg-[#fbfdfb] px-3 text-xs font-semibold text-[#527169] hover:bg-white md:hidden" data-testid="button-back-to-medical-queue"><ArrowLeft size={14} /> Back to queue</button>
                <MedicalFileDetail
                  key={selectedFile}
                  fileNo={selectedFile}
                  onClose={() => setSelectedFile('')}
                  onCompletedReview={closeAfterReview}
                  onHpcSavedForCompletedFile={closeAfterCompletedHpc}
                />
              </div>
            ) : (
              <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbdad2] bg-[#f8fbf9] px-8 text-center">
                <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4eee8] text-[#4f7d70]"><FileText size={23} /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#f8fbf9] bg-[#a9c8b9]" /></div>
                <p className="text-base font-semibold text-[#34564e]">Select a membership file</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[#81918a]">Its registration, payment record and review trail will appear here before you commit a handoff.</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-[#dce7e0] pt-3 text-[10px] text-[#8a9992]">
          <span>Medical underwriting · Staff review workspace</span>
          <span className="font-mono">AAR / MIS</span>
        </div>
      </div>
    </main>
  );
}
