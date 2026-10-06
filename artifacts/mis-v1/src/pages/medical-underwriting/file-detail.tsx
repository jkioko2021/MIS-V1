import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  FileUp,
  History,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  medicalApi,
  type HpcInput,
  type MedicalDetail,
  type MedicalFile,
  type MedicalReviewInput,
  type MedicalReviewResult,
  type MedicalUploadInput,
} from '@/lib/medical-underwriting-api';
import { DataField, dateLabel, errorText, isForbidden, moneyLabel, SectionHeading } from './shared';

type Envelope<T> = { ok: boolean; data: T; error?: string };
type DetailResult = Envelope<MedicalDetail>;
type Recipient = { username: string; fullname: string };
type ReviewAction = MedicalReviewInput['action'];
type Props = {
  fileNo: string;
  onClose: () => void;
  onCompletedReview: (action: ReviewAction, result: MedicalReviewResult) => void;
  onHpcSavedForCompletedFile: () => void;
};

const AML_RISK_RATES = ['Low', 'Medium', 'High'] as const;
const SUPPORTED_EXTENSIONS = ['.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.rar', '.zip'];
function emailDeliveryMessage(status: string) {
  if (status === 'SENT') return 'Email notification delivered.';
  if (status === 'WAITING_CONFIGURATION') return 'Email notification is waiting for mail configuration; it has not been sent.';
  if (status === 'PENDING') return 'Email notification is queued and has not yet been confirmed as sent.';
  if (status === 'RETRY') return 'Email notification needs retry; delivery is not confirmed.';
  if (status === 'NO_RECIPIENT') return 'No notification recipient was available, so no email was sent.';
  return `Email delivery state: ${status}.`;
}

export function MedicalFileDetail({
  fileNo,
  onClose,
  onCompletedReview,
  onHpcSavedForCompletedFile,
}: Props) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState('');
  const [action, setAction] = useState<ReviewAction | ''>('');
  const [lastCompletedAction, setLastCompletedAction] = useState<ReviewAction | null>(null);
  const [hpc, setHpc] = useState(false);
  const [lateralMovement, setLateralMovement] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [invoice, setInvoice] = useState('');
  const [paidStatus, setPaidStatus] = useState('');
  const [documentReq, setDocumentReq] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docInvoice, setDocInvoice] = useState('');
  const [docAmount, setDocAmount] = useState('');
  const [docPolicy, setDocPolicy] = useState('');
  const [riskRate, setRiskRate] = useState('');
  const [riskReason, setRiskReason] = useState('');
  const [hpcForm, setHpcForm] = useState<HpcInput>({
    member_no: '',
    member_name: '',
    proposer_name: '',
    client_type: 'R',
    condition: '',
    disease_code: '',
    diagnosed_date: '',
    mobile: '',
    email: '',
    source: '',
    followup_date: '',
    notes: '',
  });

  const detailQuery = useQuery<DetailResult>({
    queryKey: ['medical-underwriting-detail', fileNo],
    queryFn: () => medicalApi.detail(fileNo),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const recipientQuery = useQuery<Envelope<Recipient[]>>({
    queryKey: ['medical-underwriting-recipients'],
    queryFn: medicalApi.recipients,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const detail = detailQuery.data?.data;
  const file = detail?.file;
  const isDeclined = /declin/i.test(file?.file_status ?? '');
  const canRegisterHpc = !isDeclined || file?.mu_revert === true;
  const requirements = detail?.requirements ?? [];
  const chosenReq = requirements.find(item => String(item.req_id) === documentReq);
  const reqName = chosenReq?.req_name.toLowerCase() ?? '';
  const isCreditNote = reqName.includes('credit note');
  const isInvoiceDoc = reqName.includes('invoice') && !isCreditNote;
  const isAmlRisk = /aml\s*risk|risk\s*rating/.test(reqName);
  const activeRecipients = recipientQuery.data?.data ?? [];
  const reviewable = file?.reviewable === true;
  const initializedFile = useRef(false);
  useEffect(() => {
    if (!file || initializedFile.current) return;
    initializedFile.current = true;
    setHpc(file.mu_revert);
    setLateralMovement(file.lateral_movement);
    setInvoice(file.invoice_no ?? '');
    setPaidStatus(file.paid_status ?? '');
    setHpcForm(previous => ({
      ...previous,
      member_no: file.family_code || file.file_no,
      proposer_name: file.proposer_name,
      client_type: file.client_type === 'R' ? 'R' : 'C',
    }));
  }, [file]);

  const refreshQueues = () =>
    queryClient.invalidateQueries({ queryKey: ['medical-underwriting-queue'] });
  const refreshFileAndQueues = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['medical-underwriting-detail', fileNo] }),
      refreshQueues(),
    ]);
  };

  const reviewMutation = useMutation({
    mutationFn: (requestedAction: ReviewAction) => {
      const currentFile = file;
      if (!currentFile || !currentFile.reviewable) {
        throw new Error('This file is no longer available for review actions.');
      }
      if (!comments.trim()) throw new Error('A review note is required.');
      if (comments.trim().length > 250) throw new Error('Review notes must be 250 characters or fewer.');
      if (requestedAction === 'C' && (!invoice.trim() || !paidStatus)) {
        throw new Error('Cashier handoff requires an invoice number and payment status.');
      }
      if (requestedAction === 'F' && !recipient) throw new Error('Select an active membership recipient.');
      return medicalApi.review(fileNo, {
        action: requestedAction,
        comments: comments.trim(),
        hpc,
        lateral_movement: lateralMovement,
        expected_updated_at: currentFile.updated_at,
        ...(requestedAction === 'C' ? { invoice_no: invoice.trim(), paid_status: paidStatus } : {}),
        ...(requestedAction === 'F' ? { allocated_to: recipient } : {}),
      });
    },
    onSuccess: async (response, completedAction) => {
      setLastCompletedAction(completedAction);
      setAction('');
      setComments('');
      if (completedAction === 'H') await refreshFileAndQueues();
      else {
        await refreshQueues();
        onCompletedReview(completedAction, response.data);
      }
    },
  });

  const hpcMutation = useMutation({
    mutationFn: () => {
      const required: (keyof HpcInput)[] = ['member_no', 'member_name', 'proposer_name', 'condition'];
      if (required.some(key => !String(hpcForm[key] ?? '').trim())) {
        throw new Error('Complete member number, member name, proposer name and condition.');
      }
      return medicalApi.saveHpc(fileNo, {
        ...hpcForm,
        member_no: hpcForm.member_no.trim(),
        member_name: hpcForm.member_name.trim(),
        proposer_name: hpcForm.proposer_name.trim(),
        condition: hpcForm.condition.trim(),
      });
    },
    onSuccess: async () => {
      if (!file?.reviewable) {
        await refreshQueues();
        onHpcSavedForCompletedFile();
        return;
      }
      setHpc(false);
      await refreshFileAndQueues();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const currentFile = file;
      const selectedRequirement = chosenReq;
      const localFile = selectedFile;
      if (!currentFile || !currentFile.reviewable) {
        throw new Error('Documents can only be added while the file is reviewable.');
      }
      if (!localFile || !selectedRequirement) throw new Error('Choose a document requirement and file.');
      if (localFile.size <= 0 || localFile.size > 10 * 1024 * 1024) {
        throw new Error('Documents must be between 1 byte and 10 MB.');
      }
      const extension = `.${localFile.name.split('.').pop()?.toLowerCase()}`;
      if (!SUPPORTED_EXTENSIONS.includes(extension)) {
        throw new Error('Upload a supported Word, Excel, image, PDF, RAR, or ZIP document.');
      }
      if ((isInvoiceDoc || isCreditNote) && (!docInvoice.trim() || docInvoice.trim().length > 25)) {
        throw new Error('Enter an invoice or credit-note number between 1 and 25 characters.');
      }
      if (
        isCreditNote &&
        (!docAmount.trim() || !/^\d+(\.\d+)?$/.test(docAmount.trim()) || !Number.isFinite(Number(docAmount)) || Number(docAmount) < 0)
      ) {
        throw new Error('Enter a valid non-negative amount for a credit note.');
      }
      if (docPolicy.length > 100) throw new Error('Policy code must be 100 characters or fewer.');
      if (isAmlRisk && (!AML_RISK_RATES.includes(riskRate as (typeof AML_RISK_RATES)[number]) || !riskReason.trim())) {
        throw new Error('AML risk documents require a risk rate and rating reason.');
      }
      const storageKey = await medicalApi.uploadBytes(localFile);
      const payload: MedicalUploadInput = {
        req_id: selectedRequirement.req_id,
        filename: localFile.name,
        filesize: localFile.size,
        mime_type: localFile.type || 'application/octet-stream',
        storage_key: storageKey,
        ...((isInvoiceDoc || isCreditNote) ? { invoice_no: docInvoice.trim() } : {}),
        ...(isCreditNote ? { amount: docAmount.trim() } : {}),
        ...(docPolicy.trim() ? { policy_code: docPolicy.trim() } : {}),
        ...(isAmlRisk ? { risk_rate: riskRate, risk_reason: riskReason.trim() } : {}),
      };
      return medicalApi.upload(fileNo, payload);
    },
    onSuccess: async () => {
      setSelectedFile(null);
      setDocumentReq('');
      setDocInvoice('');
      setDocAmount('');
      setDocPolicy('');
      setRiskRate('');
      setRiskReason('');
      await refreshFileAndQueues();
    },
  });

  if (detailQuery.isLoading) {
    return (
      <section className="min-w-0 animate-pulse rounded-2xl border border-[#dce7e1] bg-[#fbfdfb] p-6">
        <div className="mb-6 h-7 w-52 rounded bg-[#e2ece6]" />
        <div className="grid gap-4 sm:grid-cols-2"><div className="h-24 rounded bg-[#edf3ef]" /><div className="h-24 rounded bg-[#edf3ef]" /></div>
        <div className="mt-6 h-52 rounded bg-[#edf3ef]" />
      </section>
    );
  }
  if (detailQuery.isError || !detail || !file) {
    return (
      <section className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-[#e6d8cf] bg-[#fbf9f6] p-8 text-center">
        <AlertCircle className="mb-3 text-[#a15b42]" size={25} />
        <h2 className="font-semibold text-[#573c34]">
          {isForbidden(detailQuery.error) ? 'Medical review access required' : 'File detail unavailable'}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-[#806d66]">
          {isForbidden(detailQuery.error)
            ? 'Your profile cannot access this medical record. Contact a system administrator if this access is unexpected.'
            : errorText(detailQuery.error)}
        </p>
        <button
          type="button"
          onClick={() => detailQuery.refetch()}
          className="mt-4 rounded-md border border-[#d9c5bc] px-3 py-2 text-sm font-medium text-[#68493e] hover:bg-white"
          data-testid="button-retry-medical-detail"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#d9e5df] bg-[#fbfdfb] shadow-[0_16px_45px_-38px_rgba(23,65,58,.46)]" data-testid={`detail-medical-file-${fileNo}`}>
      <header className="border-b border-[#dce8e2] bg-[#edf5f1] px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#205b55] px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-[#f5faf7]">{file.file_no}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${file.mu_revert ? 'bg-[#fff0d6] text-[#8e6222]' : 'bg-[#deeee8] text-[#31756d]'}`}>{file.file_status}</span>
              {file.mu_revert && <span className="text-[10px] font-semibold uppercase tracking-wider text-[#986c2e]">Reverted to Medical UW</span>}
            </div>
            <h1 className="mt-3 truncate text-xl font-semibold tracking-[-.025em] text-[#183a39] sm:text-2xl">{file.proposer_name}</h1>
            <p className="mt-1 text-xs text-[#71827e]">Received {dateLabel(file.receive_dt)} <span className="mx-1.5">·</span>{file.client_type === 'R' ? 'Retail' : file.client_type === 'C' ? 'Corporate' : file.client_type}<span className="mx-1.5">·</span>{file.business_type}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d5e2dc] bg-[#f8fbf9] text-[#56716b] hover:bg-white md:hidden" aria-label="Close file" data-testid="button-close-medical-detail"><X size={17} /></button>
        </div>
      </header>

      <div className="space-y-8 p-5 sm:p-7">
        {!reviewable && (
          <div className="flex items-start gap-3 rounded-xl border border-[#e7d9be] bg-[#fff8e9] p-4 text-[#795a2b]" role="status">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Review actions are complete</p>
              <p className="mt-1 text-xs leading-5">This file can only receive an HPC registration. Review decisions and document uploads are unavailable.</p>
            </div>
          </div>
        )}

        <section>
          <SectionHeading eyebrow="Original record · read only" title="Registration & payment" />
          <div className="grid gap-x-5 gap-y-5 rounded-xl border border-[#e3ebe6] bg-[#f7faf8] p-4 sm:grid-cols-2 xl:grid-cols-3">
            <DataField label="File number" value={file.file_no} />
            <DataField label="Proposer" value={file.proposer_name} />
            <DataField label="Family code" value={file.family_code} />
            <DataField label="Client type" value={file.client_type === 'R' ? 'Retail' : file.client_type === 'C' ? 'Corporate' : file.client_type} />
            <DataField label="Business type" value={file.business_type} />
            <DataField label="Received" value={dateLabel(file.receive_dt)} />
            <DataField label="Premium" value={moneyLabel(file.premium)} />
            <DataField label="Paid amount" value={moneyLabel(file.paid_amt)} />
            <DataField label="Paid status" value={file.paid_status} />
            <DataField label="Invoice number" value={file.invoice_no} />
            <DataField label="Payment reference" value={file.pay_ref_no} />
            <DataField label="Benefit verified" value={file.benefit_verified} />
            <DataField label="Entered by" value={file.entered_by} />
            <DataField label="Assigned to" value={file.assigned_to} />
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Secure record" title="Documents" count={detail.uploads.length} />
          <div className="space-y-2">
            {detail.uploads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#cbd9d2] bg-[#f8fbf9] px-5 py-7 text-center">
                <FileText className="mx-auto mb-2 text-[#9aaea6]" size={22} />
                <p className="text-sm font-medium text-[#4c6660]">No documents have been uploaded</p>
                <p className="mt-1 text-xs text-[#82938e]">Use a current requirement below to add a file to this membership record.</p>
              </div>
            ) : detail.uploads.map(upload => (
              <div key={upload.upload_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e1eae5] bg-[#f8fbf9] px-4 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e4efea] text-[#44766d]"><FileText size={15} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#284541]">{upload.filename}</p>
                    <p className="mt-0.5 text-xs text-[#7b8d87]">{upload.req_name} · {upload.uploaded_by} · {dateLabel(upload.uploaded_at)}</p>
                    {(upload.invoice_no || upload.amount || upload.policy_code) && <p className="mt-1 font-mono text-[10px] text-[#637873]">{[upload.invoice_no && `Invoice ${upload.invoice_no}`, upload.amount && moneyLabel(upload.amount), upload.policy_code && `Policy ${upload.policy_code}`].filter(Boolean).join(' · ')}</p>}
                  </div>
                </div>
                <a href={medicalApi.downloadUrl(fileNo, upload.upload_id)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#ceded6] bg-white px-3 text-xs font-semibold text-[#32665f] hover:bg-[#eff6f2]" data-testid={`link-download-upload-${upload.upload_id}`}><ArrowDownToLine size={13} /> Download</a>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-[#dce8e2] bg-[#f3f8f5] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#315a53]"><FileUp size={16} /> Add document</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-[#546c66]">Requirement
                <select disabled={!reviewable || uploadMutation.isPending} value={documentReq} onChange={event => {
                  setDocumentReq(event.target.value);
                  setDocInvoice('');
                  setDocAmount('');
                  setDocPolicy('');
                  setRiskRate('');
                  setRiskReason('');
                }} className="h-10 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal text-[#294540] disabled:opacity-60" data-testid="select-document-requirement">
                  <option value="">Choose a requirement</option>
                  {requirements.map(requirement => <option key={requirement.req_id} value={requirement.req_id}>{requirement.req_name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-[#546c66]">File
                <input type="file" accept={SUPPORTED_EXTENSIONS.join(',')} disabled={!reviewable || uploadMutation.isPending} onChange={event => setSelectedFile(event.target.files?.[0] ?? null)} className="block h-10 w-full rounded-lg border border-[#cfddd6] bg-white px-2 py-1.5 text-xs text-[#526a64] file:mr-2 file:rounded-md file:border-0 file:bg-[#e6f0ea] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-[#32665f] disabled:opacity-60" data-testid="input-document-file" />
                <span className="block text-[10px] font-normal text-[#82938e]">Supported formats · maximum 10 MB</span>
              </label>
              {(isInvoiceDoc || isCreditNote) && (
                <label className="space-y-1.5 text-xs font-semibold text-[#546c66]">
                  Invoice / credit-note number <span className="text-[#a4543e]">required</span>
                  <input disabled={!reviewable || uploadMutation.isPending} value={docInvoice} maxLength={25} onChange={event => setDocInvoice(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal disabled:opacity-60" data-testid="input-document-invoice" />
                </label>
              )}
              {isCreditNote && (
                <label className="space-y-1.5 text-xs font-semibold text-[#546c66]">
                  Amount <span className="text-[#a4543e]">required for credit note</span>
                  <input disabled={!reviewable || uploadMutation.isPending} type="number" min="0" step="any" value={docAmount} onChange={event => setDocAmount(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal disabled:opacity-60" data-testid="input-document-amount" />
                </label>
              )}
              {(isInvoiceDoc || isCreditNote) && (
                <label className="space-y-1.5 text-xs font-semibold text-[#546c66]">
                  Policy code <span className="font-normal text-[#84938e]">optional</span>
                  <input disabled={!reviewable || uploadMutation.isPending} value={docPolicy} maxLength={100} onChange={event => setDocPolicy(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal disabled:opacity-60" data-testid="input-document-policy" />
                </label>
              )}
              {isAmlRisk && <>
                <label className="space-y-1.5 text-xs font-semibold text-[#546c66]">AML risk rate
                  <select disabled={!reviewable || uploadMutation.isPending} value={riskRate} onChange={event => setRiskRate(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal disabled:opacity-60" data-testid="select-document-risk-rate">
                    <option value="">Select risk rate</option>
                    {AML_RISK_RATES.map(rate => <option key={rate} value={rate}>{rate}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-[#546c66]">Rating reason
                  <input disabled={!reviewable || uploadMutation.isPending} value={riskReason} maxLength={4000} onChange={event => setRiskReason(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal disabled:opacity-60" data-testid="input-document-risk-reason" />
                </label>
              </>}
            </div>
            {uploadMutation.isError && <p role="alert" className="mt-3 text-xs font-medium text-[#a14b39]">{errorText(uploadMutation.error)}</p>}
            {uploadMutation.isSuccess && <p className="mt-3 text-xs font-semibold text-[#36776d]" role="status">Document attached to the medical file.</p>}
            <div className="mt-3 flex justify-end">
              <button type="button" disabled={!reviewable || uploadMutation.isPending} onClick={() => uploadMutation.mutate()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#27655e] px-4 text-xs font-semibold text-white transition hover:bg-[#1f574f] disabled:cursor-not-allowed disabled:opacity-55" data-testid="button-upload-medical-document">{uploadMutation.isPending ? 'Uploading…' : 'Upload document'}<ArrowRight size={13} /></button>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Medical declaration" title="HPC member registration" count={detail.hpc.length} />
          {detail.hpc.length > 0 && <div className="mb-4 overflow-hidden rounded-xl border border-[#e0e9e3]">
            <div className="grid grid-cols-3 bg-[#edf5f1] px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] text-[#6b817a]"><span>Member</span><span>Proposer / client</span><span>Condition</span></div>
            {detail.hpc.map((entry, index) => <div key={entry.hpc_id} className={`grid grid-cols-3 gap-2 px-3 py-3 text-xs ${index ? 'border-t border-[#e8efeb]' : ''}`}>
              <div><p className="font-mono font-semibold text-[#31524d]">{entry.member_no}</p><p className="mt-1 text-[#637871]">{entry.member_name}</p></div>
              <div><p className="font-medium text-[#425e57]">{entry.proposer_name}</p><p className="mt-1 text-[#84928d]">{entry.client_type === 'R' ? 'Retail' : 'Corporate'}</p></div>
              <div><p className="font-medium text-[#425e57]">{entry.condition}</p><p className="mt-1 text-[#84928d]">{entry.disease_code || 'No disease code'} · {entry.diagnosed_date ? dateLabel(entry.diagnosed_date) : 'Date not recorded'}</p></div>
            </div>)}
          </div>}
          {canRegisterHpc && <div className="rounded-xl border border-[#dce8e2] bg-[#f7faf8] p-4">
            <p className="mb-3 text-xs font-semibold text-[#45665e]">Register a member with a pre-existing condition</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {([
                ['member_no', 'Member number', true, 100],
                ['member_name', 'Member name', true, 200],
                ['proposer_name', 'Proposer name', true, 200],
                ['condition', 'Condition', true, 4000],
                ['disease_code', 'Disease code', false, 100],
                ['mobile', 'Contact mobile', false, 40],
                ['email', 'Contact email', false, 254],
                ['source', 'Source', false, 200],
              ] as const).map(([key, label, required, maxLength]) => <label key={key} className="space-y-1 text-[11px] font-semibold text-[#5d746e]">{label}{required && <span className="text-[#b45e47]"> *</span>}
                <input value={String(hpcForm[key] ?? '')} onChange={event => setHpcForm(previous => ({ ...previous, [key]: event.target.value }))} maxLength={maxLength} className="h-9 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal text-[#294540] outline-none focus:border-[#6b9a8d] focus:ring-2 focus:ring-[#6b9a8d]/15" data-testid={`input-hpc-${key}`} />
              </label>)}
              <label className="space-y-1 text-[11px] font-semibold text-[#5d746e]">Client type<span className="text-[#b45e47]"> *</span>
                <select value={hpcForm.client_type} onChange={event => setHpcForm(previous => ({ ...previous, client_type: event.target.value as 'R' | 'C' }))} className="h-9 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal text-[#294540]" data-testid="select-hpc-client-type"><option value="R">Retail</option><option value="C">Corporate</option></select>
              </label>
              <label className="space-y-1 text-[11px] font-semibold text-[#5d746e]">Diagnosed date<input type="date" value={hpcForm.diagnosed_date ?? ''} onChange={event => setHpcForm(previous => ({ ...previous, diagnosed_date: event.target.value }))} className="h-9 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal" data-testid="input-hpc-diagnosed-date" /></label>
              <label className="space-y-1 text-[11px] font-semibold text-[#5d746e]">Follow-up date<input type="date" value={hpcForm.followup_date ?? ''} onChange={event => setHpcForm(previous => ({ ...previous, followup_date: event.target.value }))} className="h-9 w-full rounded-lg border border-[#cfddd6] bg-white px-3 text-sm font-normal" data-testid="input-hpc-followup-date" /></label>
              <label className="space-y-1 text-[11px] font-semibold text-[#5d746e] sm:col-span-2 xl:col-span-3">Registration notes<textarea value={hpcForm.notes ?? ''} onChange={event => setHpcForm(previous => ({ ...previous, notes: event.target.value }))} maxLength={4000} rows={2} className="w-full resize-y rounded-lg border border-[#cfddd6] bg-white px-3 py-2 text-sm font-normal" data-testid="input-hpc-notes" /></label>
            </div>
            {hpcMutation.isError && <p role="alert" className="mt-3 text-xs font-medium text-[#a14b39]">{errorText(hpcMutation.error)}</p>}
            {hpcMutation.isSuccess && reviewable && <p className="mt-3 text-xs font-semibold text-[#36776d]" role="status">HPC registration saved. This returned file is now back in review.</p>}
            <div className="mt-3 flex justify-end"><button type="button" onClick={() => hpcMutation.mutate()} disabled={hpcMutation.isPending || (isDeclined && !file.mu_revert)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#527969] px-4 text-xs font-semibold text-white hover:bg-[#41685a] disabled:opacity-55" data-testid="button-save-hpc">{hpcMutation.isPending ? 'Saving…' : 'Save HPC registration'}<Check size={14} /></button></div>
          </div>}
        </section>

        <section>
          <SectionHeading eyebrow="Accountable handoff" title="Tracking notes & review history" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#678078]"><UserRound size={14} /> Tracking notes</p>
              {detail.notes.length ? <div className="max-h-72 space-y-2 overflow-auto pr-1">{detail.notes.map(note => <article key={note.note_id} className="rounded-lg border border-[#e2ebe5] bg-[#f8fbf9] p-3"><div className="flex justify-between gap-3 text-[10px] text-[#82918c]"><span className="font-semibold text-[#47665d]">{note.note_from}</span><span>{dateLabel(note.note_date)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#435d56]">{note.notes}</p></article>)}</div> : <p className="rounded-lg border border-dashed border-[#cfddd5] p-5 text-center text-xs text-[#82918c]">No tracking notes recorded.</p>}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#678078]"><History size={14} /> Review history</p>
              {detail.reviews.length ? <div className="max-h-72 space-y-2 overflow-auto pr-1">{detail.reviews.map(review => <article key={review.review_id} className="relative rounded-lg border border-[#e2ebe5] bg-[#f8fbf9] p-3 pl-4 before:absolute before:bottom-3 before:left-0 before:top-3 before:w-[2px] before:bg-[#71a194]"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-[#315950]">{review.action}</span><span className="text-[10px] text-[#82918c]">{dateLabel(review.reviewed_at)}</span></div><p className="mt-1 text-[10px] text-[#71847d]">{review.reviewed_by}{review.destination ? ` · To ${review.destination}` : ''}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#435d56]">{review.comments}</p><div className="mt-2 flex gap-1.5">{review.hpc && <span className="rounded bg-[#e4efe9] px-2 py-0.5 text-[9px] font-bold text-[#477264]">HPC</span>}{review.lateral_movement && <span className="rounded bg-[#e7edf2] px-2 py-0.5 text-[9px] font-bold text-[#52697c]">Lateral movement</span>}</div></article>)}</div> : <p className="rounded-lg border border-dashed border-[#cfddd5] p-5 text-center text-xs text-[#82918c]">No reviews have been recorded.</p>}
            </div>
          </div>
        </section>

        {reviewable && (
          <section className="rounded-2xl border border-[#cbded4] bg-[#edf5f1] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d8e9e1] text-[#34736a]"><ShieldCheck size={17} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#244a43]">Record your decision</p>
                <p className="mt-1 text-xs leading-5 text-[#71847d]">Every action requires a concise note for the next owner. Your decision is linked to the current file version.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-[11px] font-bold uppercase tracking-[.1em] text-[#627a72] sm:col-span-2">Review note <span className="normal-case tracking-normal text-[#a4543e]">Required · max 250 characters</span>
                <textarea value={comments} onChange={event => setComments(event.target.value.slice(0, 250))} rows={3} placeholder="State the finding and the next step for the receiving team." className="w-full resize-y rounded-lg border border-[#cadbd2] bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#294540] outline-none placeholder:text-[#9aaba4] focus:border-[#6e9b8e] focus:ring-2 focus:ring-[#6e9b8e]/15" data-testid="input-medical-review-note" />
                <span className="block text-right font-mono text-[10px] font-normal normal-case tracking-normal text-[#80928b]">{comments.length}/250</span>
              </label>
              {action === 'C' && <>
                <label className="space-y-1 text-[11px] font-semibold text-[#58716a]">Invoice number<input value={invoice} onChange={event => setInvoice(event.target.value)} maxLength={25} className="h-10 w-full rounded-lg border border-[#cadbd2] bg-white px-3 text-sm font-normal" data-testid="input-cashier-invoice" /></label>
                <label className="space-y-1 text-[11px] font-semibold text-[#58716a]">Payment status<select value={paidStatus} onChange={event => setPaidStatus(event.target.value)} className="h-10 w-full rounded-lg border border-[#cadbd2] bg-white px-3 text-sm font-normal" data-testid="select-cashier-payment-status"><option value="">Select payment status</option><option value="FULL">FULL</option><option value="PART">PART</option><option value="NOT-PAID">NOT-PAID</option></select></label>
              </>}
              {action === 'F' && <label className="space-y-1 text-[11px] font-semibold text-[#58716a] sm:col-span-2">Active membership recipient<select value={recipient} onChange={event => setRecipient(event.target.value)} className="h-10 w-full rounded-lg border border-[#cadbd2] bg-white px-3 text-sm font-normal" data-testid="select-medical-recipient"><option value="">Select recipient</option>{activeRecipients.map(item => <option key={item.username} value={item.username}>{item.fullname} · {item.username}</option>)}</select>{recipientQuery.isError && <span className="block pt-1 text-xs text-[#a14b39]">Could not load active recipients: {errorText(recipientQuery.error)}</span>}</label>}
              <div className="flex flex-wrap gap-x-5 gap-y-2 sm:col-span-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#4e6961]"><input type="checkbox" checked={hpc} onChange={event => setHpc(event.target.checked)} className="h-4 w-4 accent-[#34736a]" data-testid="checkbox-review-hpc" /> HPC flag</label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#4e6961]"><input type="checkbox" checked={lateralMovement} onChange={event => setLateralMovement(event.target.checked)} className="h-4 w-4 accent-[#34736a]" data-testid="checkbox-review-lateral-movement" /> New waiver / lateral movement</label>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {([
                ['C', 'Cashier', 'bg-[#397a6d] hover:bg-[#2e6c60]'],
                ['F', 'Forward', 'bg-[#326a73] hover:bg-[#285e67]'],
                ['RI', 'Return incomplete', 'bg-[#9a7440] hover:bg-[#856235]'],
                ['H', 'Hold', 'bg-[#7b6d5e] hover:bg-[#685b4e]'],
                ['D', 'Decline', 'bg-[#9a574c] hover:bg-[#84483e]'],
              ] as const).map(([code, label, classes]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setAction(code);
                    setLastCompletedAction(null);
                    reviewMutation.reset();
                  }}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${classes} ${action === code ? 'ring-2 ring-[#244a43] ring-offset-2 ring-offset-[#edf5f1]' : ''}`}
                  data-testid={`button-action-${code.toLowerCase()}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {reviewMutation.isError && <p role="alert" className="mt-3 rounded-lg bg-[#fff0eb] px-3 py-2 text-xs font-medium text-[#934a37]">{errorText(reviewMutation.error)}</p>}
            {reviewMutation.isSuccess && lastCompletedAction === 'H' && <div className="mt-3 rounded-lg bg-[#f1ede7] px-3 py-2 text-xs font-medium text-[#6f5b45]" role="status">
              <p>Review recorded. File status remains {reviewMutation.data?.data.file_status}; it is on hold and remains available for review.</p>
              {reviewMutation.data?.data.notification?.email_status && <p className="mt-1">{emailDeliveryMessage(reviewMutation.data.data.notification.email_status)}</p>}
            </div>}
            {action && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8e5dd] pt-4">
              <p className="text-xs text-[#73867f]">Selected action: <strong className="text-[#315a51]">{action === 'RI' ? 'Return incomplete' : action === 'C' ? 'Cashier' : action === 'F' ? 'Forward' : action === 'H' ? 'Hold' : 'Decline'}</strong></p>
              <button type="button" disabled={reviewMutation.isPending || comments.trim().length === 0} onClick={() => reviewMutation.mutate(action)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#214f49] px-5 text-xs font-bold text-white transition hover:bg-[#183f39] disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-submit-medical-review">{reviewMutation.isPending ? 'Recording…' : 'Record review'}<ArrowRight size={14} /></button>
            </div>}
          </section>
        )}
      </div>
    </section>
  );
}
