import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { misApi, type BusinessFile, type BusinessNote, type BusinessDoc, type BusinessRequirement, type SalesAgent, type Employee, type BusinessUpload } from '@/lib/mis-api';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Search, RefreshCw, FileText, Plus, CheckCircle2, Circle,
  SendHorizontal, ArrowUpRight, Trash2, MessageSquare, FileCheck,
  ChevronRight, Building2, User, Upload, Paperclip, AlertCircle,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
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
  'REGISTERED','FORWARDED','RETURNED-INCOMPLETE',
  'MEDICAL UW-REVIEW','BENEFIT VERIFICATION','ALLOCATED','INVOICED',
];

const BUSINESS_ACTIONS: { value: string; label: string }[] = [
  { value: 'N',  label: 'New Business' },
  { value: 'R',  label: 'Renewal' },
  { value: 'A',  label: 'Addon' },
  { value: 'T',  label: 'Termination' },
  { value: 'RT', label: 'Reinstatement' },
  { value: 'CC', label: 'Category Change' },
  { value: 'PR', label: 'Premium Reconciliation' },
  { value: 'NE', label: 'Nill Endorsement' },
  { value: 'FT', label: 'Fund Top-up' },
  { value: 'SU', label: 'Suspension' },
  { value: 'LS', label: 'Lift Suspension' },
];

const ACTION_LABEL: Record<string, string> = Object.fromEntries(BUSINESS_ACTIONS.map(a => [a.value, a.label]));

const PAY_MODES   = ['MPESA', 'EFT', 'CHEQUE', 'IPF'];
const CARD_TYPES  = ['MTIBA', 'SMART'];
const GI_CATS     = ['Non-Motor', 'Motor'];
const SECTORS     = [
  'Agriculture','Banking & Finance','Construction','Education','Energy',
  'Government & Public Sector','Healthcare','Hospitality & Tourism',
  'IT & Technology','Legal & Professional Services','Manufacturing',
  'Media & Entertainment','NGO & Non-Profit','Real Estate','Retail & Trade',
  'Telecommunications','Transport & Logistics','Other',
];
const CORP_CATS   = [
  'SME (Small Business)','Medium Enterprise','Large Corporate',
  'Government Agency','Parastatal','NGO/Association',
  'International Organization','Embassy/Diplomatic Mission','Other',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function fmtBytes(b: number | null | undefined) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormState {
  client_type: 'R' | 'C';
  business_type: string;
  business: 'M' | 'N';
  proposer_name: string;
  family_code: string;
  receive_dt: string;
  // Retail
  nid: string;
  pin_no: string;
  walk_in_client: 'Y' | 'N';
  walk_in_auth: string;
  card_type: string;
  is_mtiba: boolean;
  is_ipf: boolean;
  // Corporate
  cr12: boolean;
  corp_category: string;
  sector: string;
  // Shared classification
  agent_id: string;
  county_code: string;
  gi_category: string;
  rate_type: 'S' | 'C';
  // Payment
  pay_ref_no: string;
  paid_amt: string;
  pay_mode: string;
  // Processing (edit only)
  allocated_to: string;
  medical_uw: boolean;
  benefit_verified: 'YES' | 'NO';
  invoiced: boolean;
}

function blankForm(clientType: 'R' | 'C' = 'R'): FormState {
  return {
    client_type: clientType,
    business_type: 'N',
    business: 'M',
    proposer_name: '',
    family_code: '',
    receive_dt: today(),
    nid: '', pin_no: '', walk_in_client: 'N', walk_in_auth: '', card_type: '', is_mtiba: false, is_ipf: false,
    cr12: false, corp_category: '', sector: '',
    agent_id: '', county_code: '', gi_category: '', rate_type: 'S',
    pay_ref_no: '', paid_amt: '', pay_mode: '',
    allocated_to: '', medical_uw: false, benefit_verified: 'NO', invoiced: false,
  };
}

function fileToForm(f: BusinessFile): FormState {
  return {
    client_type: f.client_type as 'R' | 'C',
    business_type: f.business_type,
    business: f.business as 'M' | 'N',
    proposer_name: f.proposer_name ?? '',
    family_code: f.family_code ?? '',
    receive_dt: f.receive_dt ? f.receive_dt.split('T')[0] : today(),
    nid: f.nid ?? '', pin_no: f.pin_no ?? '',
    walk_in_client: (f.walk_in_client ?? 'N') as 'Y' | 'N',
    walk_in_auth: f.walk_in_auth ?? '',
    card_type: f.card_type ?? '',
    is_mtiba: !!f.is_mtiba, is_ipf: !!f.is_ipf,
    cr12: !!f.cr12, corp_category: f.corp_category ?? '', sector: f.sector ?? '',
    agent_id: f.agent_id ?? '', county_code: f.county_code ?? '',
    gi_category: f.gi_category ?? '', rate_type: (f.rate_type ?? 'S') as 'S' | 'C',
    pay_ref_no: f.pay_ref_no ?? '', paid_amt: f.paid_amt != null ? String(f.paid_amt) : '',
    pay_mode: f.pay_mode ?? '',
    allocated_to: f.allocated_to ?? '', medical_uw: !!f.medical_uw,
    benefit_verified: (f.benefit_verified ?? 'NO') as 'YES' | 'NO', invoiced: !!f.invoiced,
  };
}

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder={placeholder ?? 'Select…'} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TextInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-8 text-sm ${className ?? ''}`}
    />
  );
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-gray-300"
      />
      {label}
    </label>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─── Business Sheet ───────────────────────────────────────────────────────────
interface BusinessSheetProps {
  mode: 'register' | 'edit';
  initialClientType?: 'R' | 'C';
  fileNo?: string;
  onClose: () => void;
  onSaved?: (fileNo: string) => void;
}

function BusinessSheet({ mode, initialClientType = 'R', fileNo, onClose, onSaved }: BusinessSheetProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Reference data
  const { data: agentsRes } = useQuery({ queryKey: ['agents'], queryFn: misApi.agents, staleTime: 120_000 });
  const { data: employeesRes } = useQuery({ queryKey: ['employees-membership'], queryFn: () => misApi.employees({ department: 'MEMBERSHIP', activated: 'true', approved: 'true' }), staleTime: 120_000 });
  const { data: countiesRes } = useQuery({ queryKey: ['counties'], queryFn: misApi.counties, staleTime: Infinity });

  const agents: SalesAgent[]  = (agentsRes?.data ?? []) as SalesAgent[];
  const employees: Employee[] = (employeesRes?.data ?? []) as Employee[];
  const counties: string[]    = (countiesRes?.data ?? []) as string[];

  // Existing file data (edit mode)
  const { data: fileRes, isLoading: fileLoading } = useQuery({
    queryKey: ['business-file', fileNo],
    queryFn: () => misApi.businessFile(fileNo!),
    enabled: mode === 'edit' && !!fileNo,
  });
  const existingFile = fileRes?.data as (BusinessFile & { notes: BusinessNote[]; docs: BusinessDoc[] }) | undefined;

  // Form state
  const [form, setForm] = useState<FormState>(() =>
    mode === 'register' ? blankForm(initialClientType) : blankForm(initialClientType)
  );

  // When file loads (edit mode), hydrate form
  useEffect(() => {
    if (existingFile) setForm(fileToForm(existingFile));
  }, [existingFile]);

  // Doc requirements filtered by client type
  const { data: reqsRes } = useQuery({
    queryKey: ['requirements', form.client_type],
    queryFn: () => misApi.businessRequirements(form.client_type),
    staleTime: 120_000,
  });
  const requirements: BusinessRequirement[] = (reqsRes?.data ?? []) as BusinessRequirement[];
  const docChecklist: BusinessDoc[] = existingFile?.docs ?? [];

  // Notes
  const notes: BusinessNote[] = existingFile?.notes ?? [];

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  const isRetail = form.client_type === 'R';
  const isCorp   = form.client_type === 'C';

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const registerMut = useMutation({
    mutationFn: () => misApi.businessRegister(form as unknown as Partial<BusinessFile>),
    onSuccess: (res) => {
      toast({ title: 'File registered', description: `File No: ${res.data.file_no}` });
      qc.invalidateQueries({ queryKey: ['business'] });
      onSaved?.(res.data.file_no);
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: () => misApi.businessUpdate(fileNo!, form as unknown as Partial<BusinessFile>),
    onSuccess: () => {
      toast({ title: 'File updated' });
      qc.invalidateQueries({ queryKey: ['business'] });
      qc.invalidateQueries({ queryKey: ['business-file', fileNo] });
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const forwardMut = useMutation({
    mutationFn: () => misApi.businessForward(fileNo!),
    onSuccess: () => {
      toast({ title: 'File forwarded', description: 'Status updated to FORWARDED.' });
      qc.invalidateQueries({ queryKey: ['business'] });
      qc.invalidateQueries({ queryKey: ['business-file', fileNo] });
    },
    onError: (e) => toast({ title: 'Cannot forward', description: String(e), variant: 'destructive' }),
  });

  const addNoteMut = useMutation({
    mutationFn: (text: string) => misApi.businessAddNote(fileNo!, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-file', fileNo] });
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const deleteNoteMut = useMutation({
    mutationFn: (noteId: number) => misApi.businessDeleteNote(fileNo!, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', fileNo] }),
  });

  const ackDocMut = useMutation({
    mutationFn: (reqId: number) => misApi.businessAckDoc(fileNo!, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', fileNo] }),
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const unAckDocMut = useMutation({
    mutationFn: (reqId: number) => misApi.businessUnAckDoc(fileNo!, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', fileNo] }),
  });

  function handleSave() {
    if (!form.proposer_name.trim()) {
      toast({ title: 'Validation', description: 'Proposer name is required.', variant: 'destructive' }); return;
    }
    if (!form.business_type) {
      toast({ title: 'Validation', description: 'Business action is required.', variant: 'destructive' }); return;
    }
    if (mode === 'register') registerMut.mutate();
    else updateMut.mutate();
  }

  // Note form
  const [noteText, setNoteText] = useState('');
  function handleAddNote() {
    if (!noteText.trim()) return;
    addNoteMut.mutate(noteText.trim(), { onSuccess: () => setNoteText('') });
  }

  // Document ack
  function isAcknowledged(reqId: number) {
    return docChecklist.some(d => d.req_id === reqId);
  }
  function getAckInfo(reqId: number) {
    return docChecklist.find(d => d.req_id === reqId);
  }

  const ackedCount = requirements.filter(r => isAcknowledged(r.req_id)).length;
  const isComplete = ackedCount === requirements.length && requirements.length > 0;
  const isSaving = registerMut.isPending || updateMut.isPending;

  // ─── Upload dialog state ─────────────────────────────────────────────────────
  const [uploadFor, setUploadFor] = useState<BusinessRequirement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Uploads for this file
  const { data: uploadsRes } = useQuery({
    queryKey: ['business-uploads', fileNo],
    queryFn: () => misApi.businessListUploads(fileNo!),
    enabled: mode === 'edit' && !!fileNo,
    staleTime: 30_000,
  });
  const uploads: BusinessUpload[] = (uploadsRes?.data ?? []) as BusinessUpload[];

  async function handleUpload() {
    if (!pendingFile || !fileNo || !uploadFor) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      // 1. Get presigned URL from the API server
      const urlRes = await fetch('/api/storage/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: pendingFile.name,
          size: pendingFile.size,
          contentType: pendingFile.type || 'application/octet-stream',
        }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadURL, objectPath } = await urlRes.json();
      setUploadProgress(35);

      // 2. PUT file bytes directly to GCS via presigned URL
      const uploadRes = await fetch(uploadURL, {
        method: 'PUT',
        body: pendingFile,
        headers: { 'Content-Type': pendingFile.type || 'application/octet-stream' },
      });
      if (!uploadRes.ok) throw new Error('Upload to storage failed');
      setUploadProgress(75);

      // 3. Record in DB and auto-acknowledge the requirement
      await misApi.businessRecordUpload(fileNo, {
        req_id: uploadFor.req_id,
        filename: pendingFile.name,
        filesize: pendingFile.size,
        mime_type: pendingFile.type || 'application/octet-stream',
        storage_key: objectPath,
      });
      setUploadProgress(100);

      toast({ title: 'Document uploaded', description: `${pendingFile.name} uploaded and acknowledged.` });
      qc.invalidateQueries({ queryKey: ['business-file', fileNo] });
      qc.invalidateQueries({ queryKey: ['business-uploads', fileNo] });
      setUploadFor(null);
      setPendingFile(null);
    } catch (err) {
      toast({ title: 'Upload failed', description: String(err), variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  const title = mode === 'register'
    ? `Register ${isRetail ? 'Retail' : 'SME/Corp'} File`
    : (existingFile?.file_no ?? fileNo ?? 'File Details');

  return (
    <Sheet open onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[680px] sm:max-w-[680px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" /> {title}
              </SheetTitle>
              {mode === 'edit' && existingFile && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <StatusBadge status={existingFile.file_status} />
                  <span className="text-xs text-muted-foreground">
                    {isRetail ? 'Retail' : 'SME/Corp'} · {existingFile.business === 'M' ? 'Medical' : 'Non-Medical'}
                  </span>
                  {existingFile.entered_by && (
                    <span className="text-xs text-muted-foreground">· by {existingFile.entered_by}</span>
                  )}
                </div>
              )}
            </div>
            {/* Client type toggle — only for new registration */}
            {mode === 'register' && (
              <div className="flex rounded-lg border bg-muted p-0.5 shrink-0">
                {(['R','C'] as const).map(ct => (
                  <button
                    key={ct}
                    onClick={() => set('client_type', ct)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      form.client_type === ct
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ct === 'R' ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                    {ct === 'R' ? 'Retail' : 'SME/Corp'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Body */}
        {mode === 'edit' && fileLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : (
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-5 mt-3 w-auto shrink-0 justify-start h-9">
              <TabsTrigger value="details" className="text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Details
              </TabsTrigger>
              {mode === 'edit' && (
                <>
                  <TabsTrigger value="docs" className="text-xs gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    Documents {requirements.length > 0 && (
                      <span className={`ml-1 text-xs font-medium ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                        {ackedCount}/{requirements.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Notes {notes.length > 0 && `(${notes.length})`}
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* ── DETAILS TAB ──────────────────────────────────────────────── */}
            <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="px-5 pb-4 space-y-3">
                  <SectionHeader title="File Information" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Business Action" required>
                      <SelectField
                        value={form.business_type}
                        onChange={v => set('business_type', v)}
                        options={BUSINESS_ACTIONS}
                        placeholder="Select action…"
                      />
                    </Field>
                    <Field label="Coverage Type" required>
                      <SelectField
                        value={form.business}
                        onChange={v => set('business', v as 'M' | 'N')}
                        options={[{ value: 'M', label: 'Medical' }, { value: 'N', label: 'Non-Medical' }]}
                      />
                    </Field>
                    <Field label="Receive Date">
                      <Input
                        type="date"
                        value={form.receive_dt}
                        onChange={e => set('receive_dt', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </Field>
                    <Field label="Rate Type">
                      <SelectField
                        value={form.rate_type}
                        onChange={v => set('rate_type', v as 'S' | 'C')}
                        options={[{ value: 'S', label: 'Standard' }, { value: 'C', label: 'Corporate' }]}
                      />
                    </Field>
                  </div>

                  <SectionHeader title="Proposer Details" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Proposer Name" required>
                      <TextInput value={form.proposer_name} onChange={v => set('proposer_name', v)} placeholder="Full name…" />
                    </Field>
                    <Field label="Family / Policy Code">
                      <TextInput value={form.family_code} onChange={v => set('family_code', v)} placeholder="e.g. AAR-12345" />
                    </Field>

                    {/* Retail-only fields */}
                    {isRetail && (
                      <>
                        <Field label="National ID (NID)">
                          <TextInput value={form.nid} onChange={v => set('nid', v)} placeholder="ID number…" />
                        </Field>
                        <Field label="KRA PIN">
                          <TextInput value={form.pin_no} onChange={v => set('pin_no', v)} placeholder="PIN certificate no." />
                        </Field>
                        <div className="col-span-2 flex items-center gap-6">
                          <CheckRow checked={form.walk_in_client === 'Y'} onChange={v => set('walk_in_client', v ? 'Y' : 'N')} label="Walk-in Client" />
                          <CheckRow checked={form.is_mtiba} onChange={v => set('is_mtiba', v)} label="M-TIBA Card" />
                          <CheckRow checked={form.is_ipf} onChange={v => set('is_ipf', v)} label="IPF (Insurance Premium Financing)" />
                        </div>
                        {form.walk_in_client === 'Y' && (
                          <Field label="Walk-in Authorised By">
                            <SelectField
                              value={form.walk_in_auth}
                              onChange={v => set('walk_in_auth', v)}
                              options={employees.map(e => ({ value: e.username, label: e.employee_name }))}
                              placeholder="Select authoriser…"
                            />
                          </Field>
                        )}
                      </>
                    )}

                    {/* Corporate-only fields */}
                    {isCorp && (
                      <>
                        <Field label="Corporate Category">
                          <SelectField
                            value={form.corp_category}
                            onChange={v => set('corp_category', v)}
                            options={CORP_CATS.map(c => ({ value: c, label: c }))}
                            placeholder="Select category…"
                          />
                        </Field>
                        <Field label="Industry Sector">
                          <SelectField
                            value={form.sector}
                            onChange={v => set('sector', v)}
                            options={SECTORS.map(s => ({ value: s, label: s }))}
                            placeholder="Select sector…"
                          />
                        </Field>
                        <div className="col-span-2">
                          <CheckRow checked={form.cr12} onChange={v => set('cr12', v)} label="CR12 / Certificate of Incorporation submitted" />
                        </div>
                      </>
                    )}
                  </div>

                  <SectionHeader title="Classification" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Sales Agent">
                      <Select value={form.agent_id} onValueChange={v => set('agent_id', v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Assign agent…" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.filter(a => a.is_active).map(a => (
                            <SelectItem key={a.agent_id} value={a.agent_id}>{a.agent_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="County">
                      <Select value={form.county_code} onValueChange={v => set('county_code', v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select county…" />
                        </SelectTrigger>
                        <SelectContent>
                          {counties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    {form.business === 'N' && (
                      <Field label="GI Category (Non-Medical)">
                        <SelectField
                          value={form.gi_category}
                          onChange={v => set('gi_category', v)}
                          options={GI_CATS.map(g => ({ value: g, label: g }))}
                          placeholder="Non-Medical category…"
                        />
                      </Field>
                    )}
                    {isRetail && form.is_mtiba && (
                      <Field label="Card Type">
                        <SelectField
                          value={form.card_type}
                          onChange={v => set('card_type', v)}
                          options={CARD_TYPES.map(c => ({ value: c, label: c }))}
                          placeholder="Select card type…"
                        />
                      </Field>
                    )}
                  </div>

                  <SectionHeader title="Payment" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Payment Reference No.">
                      <TextInput value={form.pay_ref_no} onChange={v => set('pay_ref_no', v)} placeholder="e.g. MPESA ref…" />
                    </Field>
                    <Field label="Paid Amount (KES)">
                      <TextInput value={form.paid_amt} onChange={v => set('paid_amt', v)} placeholder="0.00" />
                    </Field>
                    <Field label="Payment Mode">
                      <SelectField
                        value={form.pay_mode}
                        onChange={v => set('pay_mode', v)}
                        options={PAY_MODES.map(p => ({ value: p, label: p }))}
                        placeholder="Select mode…"
                      />
                    </Field>
                  </div>

                  {/* Processing section — only in edit mode */}
                  {mode === 'edit' && (
                    <>
                      <SectionHeader title="Processing Status" />
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Allocated To">
                          <Select value={form.allocated_to} onValueChange={v => set('allocated_to', v)}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Assign to employee…" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map(e => (
                                <SelectItem key={e.username} value={e.username}>{e.employee_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Benefit Verified">
                          <SelectField
                            value={form.benefit_verified}
                            onChange={v => set('benefit_verified', v as 'YES' | 'NO')}
                            options={[{ value: 'YES', label: 'Yes — Verified' }, { value: 'NO', label: 'No — Pending' }]}
                          />
                        </Field>
                        <div className="col-span-2 flex items-center gap-6">
                          <CheckRow checked={form.medical_uw} onChange={v => set('medical_uw', v)} label="Medical UW Reviewed" />
                          <CheckRow checked={form.invoiced} onChange={v => set('invoiced', v)} label="Invoiced" />
                        </div>
                      </div>

                      {/* Forward info banner */}
                      {existingFile && (
                        <div className={`rounded-lg border p-3 text-xs space-y-1 ${isComplete ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                          <div className="flex items-center gap-1.5 font-medium">
                            {isComplete
                              ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /><span className="text-green-700">All documents acknowledged</span></>
                              : <><Circle className="w-3.5 h-3.5 text-amber-600" /><span className="text-amber-700">Documentation incomplete ({ackedCount}/{requirements.length} docs)</span></>
                            }
                          </div>
                          {existingFile.forward_date && (
                            <p className="text-muted-foreground">
                              Forwarded {fmtDate(existingFile.forward_date)} by {existingFile.forwarded_by}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── DOCUMENTS TAB ────────────────────────────────────────────── */}
            <TabsContent value="docs" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full">
                <div className="px-5 py-4 space-y-3">

                  {/* Summary banner */}
                  <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                    isComplete
                      ? 'border-green-200 bg-green-50'
                      : 'border-amber-200 bg-amber-50/70'
                  }`}>
                    {isComplete
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-semibold ${isComplete ? 'text-green-800' : 'text-amber-800'}`}>
                        {isComplete ? 'All documents complete' : `${requirements.length - ackedCount} document(s) still pending`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ackedCount} of {requirements.length} acknowledged · Upload files or click Acknowledge
                      </p>
                    </div>
                  </div>

                  {/* Document rows */}
                  {requirements.map(r => {
                    const acked = isAcknowledged(r.req_id);
                    const info = getAckInfo(r.req_id);
                    const docUpload = uploads.find(u => u.req_id === r.req_id);

                    return (
                      <div
                        key={r.req_id}
                        className={`rounded-xl border transition-colors ${
                          acked ? 'border-green-200 bg-green-50/40' : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 p-3.5">
                          {/* Left: icon + text */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {acked
                              ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                              : <Circle className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                            }
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug">{r.req_name}</p>
                              {docUpload ? (
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <Paperclip className="w-3 h-3 text-blue-500 shrink-0" />
                                  <a
                                    href={`/api/storage/objects${docUpload.storage_key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {docUpload.filename}
                                  </a>
                                  {docUpload.filesize != null && (
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      · {fmtBytes(docUpload.filesize)}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    · {docUpload.uploaded_by}
                                  </span>
                                </div>
                              ) : acked && info ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Acknowledged by {info.acknowledged_by} · {fmtDate(info.acknowledged_at)}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {/* Right: action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!acked && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                                onClick={() => { setUploadFor(r); setPendingFile(null); }}
                              >
                                <Upload className="w-3 h-3" /> Upload
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 text-xs gap-1 ${
                                acked
                                  ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                  : 'hover:bg-accent'
                              }`}
                              onClick={() => acked ? unAckDocMut.mutate(r.req_id) : ackDocMut.mutate(r.req_id)}
                              disabled={ackDocMut.isPending || unAckDocMut.isPending}
                            >
                              {acked
                                ? <><Trash2 className="w-3 h-3" /> Remove</>
                                : 'Acknowledge'
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {requirements.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                      <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-25" />
                      <p className="text-sm">No document requirements found.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── NOTES TAB ────────────────────────────────────────────────── */}
            <TabsContent value="notes" className="flex-1 overflow-hidden mt-0">
              <div className="flex flex-col h-full">
                {/* Add note */}
                <div className="px-5 py-3 border-b shrink-0">
                  <div className="flex gap-2">
                    <Textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Type a note…"
                      className="text-sm resize-none h-16"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote();
                      }}
                    />
                    <Button
                      size="sm"
                      className="shrink-0 self-end"
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || addNoteMut.isPending}
                    >
                      <SendHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ctrl+Enter to submit</p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="px-5 py-3 space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No notes yet.</p>
                    ) : notes.map(n => (
                      <div key={n.note_id} className="border rounded-lg p-3 group">
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{n.note_from}</span>
                            <span className="text-xs text-muted-foreground">{fmtDate(n.note_date)}</span>
                          </div>
                          <button
                            onClick={() => deleteNoteMut.mutate(n.note_id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{n.notes}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer actions */}
        <div className="px-5 py-3 border-t shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            {mode === 'edit' && !existingFile?.forwarded && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => forwardMut.mutate()}
                disabled={forwardMut.isPending}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Forward
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
              {isSaving ? (
                <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving…</>
              ) : mode === 'register' ? (
                <><Plus className="w-3.5 h-3.5" /> Register File</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
        {/* ── Upload Dialog ──────────────────────────────────────────────── */}
        <Dialog
          open={!!uploadFor}
          onOpenChange={v => { if (!v && !isUploading) { setUploadFor(null); setPendingFile(null); } }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload Document
              </DialogTitle>
              {uploadFor && (
                <DialogDescription>
                  {uploadFor.req_name}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Drop zone */}
              <label
                className={`relative flex flex-col items-center justify-center w-full h-44 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none ${
                  isUploading
                    ? 'opacity-50 pointer-events-none border-muted-foreground/20 bg-muted/30'
                    : isDragging
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : pendingFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/40'
                }`}
                onDragOver={e => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (!isUploading) {
                    const f = e.dataTransfer.files[0];
                    if (f) setPendingFile(f);
                  }
                }}
              >
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setPendingFile(f); }}
                  disabled={isUploading}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv,.txt"
                />
                {pendingFile ? (
                  <div className="text-center px-6 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <FileCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-green-800 truncate max-w-[300px]">{pendingFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fmtBytes(pendingFile.size)} · Click to change</p>
                  </div>
                ) : (
                  <div className="text-center px-6 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium">
                      Drop file here or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, JPG, PNG — up to 10 MB</p>
                  </div>
                )}
              </label>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setUploadFor(null); setPendingFile(null); }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!pendingFile || isUploading}
                className="gap-1.5"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload &amp; Acknowledge
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BusinessTrackingPage() {
  const [clientTab, setClientTab]     = useState<'ALL' | 'R' | 'C'>('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [sheet, setSheet]             = useState<{ mode: 'closed' | 'register' | 'edit'; fileNo?: string; clientType?: 'R' | 'C' }>({ mode: 'closed' });
  const qc = useQueryClient();

  const params: Record<string, string> = {};
  if (statusFilter) params.status = statusFilter;
  if (clientTab !== 'ALL') params.client_type = clientTab;
  if (search) params.search = search;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['business', clientTab, statusFilter, search],
    queryFn: () => misApi.business(params),
    staleTime: 30_000,
  });

  const files: BusinessFile[] = data?.data ?? [];

  // Status counts for pills
  const countByStatus = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = files.filter(f => f.file_status === s).length;
    return acc;
  }, {});

  function openEdit(f: BusinessFile) {
    setSheet({ mode: 'edit', fileNo: f.file_no, clientType: f.client_type as 'R' | 'C' });
  }

  function openRegister(ct: 'R' | 'C') {
    setSheet({ mode: 'register', clientType: ct });
  }

  function closeSheet() {
    setSheet({ mode: 'closed' });
  }

  // Summary stats
  const total    = files.length;
  const medical  = files.filter(f => f.business === 'M').length;
  const nonMed   = files.filter(f => f.business === 'N').length;
  const retail   = files.filter(f => f.client_type === 'R').length;
  const corp     = files.filter(f => f.client_type === 'C').length;
  const pending  = files.filter(f => f.file_status === 'REGISTERED').length;
  const forwarded = files.filter(f => f.file_status === 'FORWARDED').length;

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Register and track business files through the underwriting pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => openRegister(clientTab === 'C' ? 'C' : 'R')}>
            <Plus className="w-4 h-4" /> Register File
          </Button>
        </div>
      </div>

      {/* Summary stat cards */}
      {!isLoading && files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Total Files',  value: total,    color: 'text-foreground' },
            { label: 'Retail',       value: retail,   color: 'text-blue-600' },
            { label: 'SME/Corp',     value: corp,     color: 'text-purple-600' },
            { label: 'Medical',      value: medical,  color: 'text-teal-600' },
            { label: 'Non-Medical',  value: nonMed,   color: 'text-orange-600' },
            { label: 'Pending',      value: pending,  color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border bg-card p-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Client type tabs + filters */}
      <div className="space-y-2">
        {/* Client type tabs */}
        <div className="flex items-center gap-4 border-b">
          {(['ALL', 'R', 'C'] as const).map(ct => (
            <button
              key={ct}
              onClick={() => setClientTab(ct)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                clientTab === ct
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {ct === 'ALL' ? 'All Files' : ct === 'R' ? '👤 Retail' : '🏢 SME/Corp'}
              {ct === 'R' && <span className="ml-1.5 text-xs text-muted-foreground">({retail})</span>}
              {ct === 'C' && <span className="ml-1.5 text-xs text-muted-foreground">({corp})</span>}
            </button>
          ))}
        </div>

        {/* Search + status pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-8 text-sm"
              placeholder="Search name, file no, reference…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setStatusFilter('')}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                !statusFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'
              }`}
            >
              All
            </button>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(prev => prev === s ? '' : s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                {s} {countByStatus[s] > 0 && `(${countByStatus[s]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
              <th className="text-left px-3 py-2.5 font-medium">File No</th>
              <th className="text-left px-3 py-2.5 font-medium">Proposer</th>
              <th className="text-left px-3 py-2.5 font-medium">Type</th>
              <th className="text-left px-3 py-2.5 font-medium">Action</th>
              <th className="text-left px-3 py-2.5 font-medium">Status</th>
              <th className="text-left px-3 py-2.5 font-medium">Agent</th>
              <th className="text-right px-3 py-2.5 font-medium">Paid</th>
              <th className="text-left px-3 py-2.5 font-medium">Received</th>
              <th className="text-left px-3 py-2.5 font-medium">Notes</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-3 py-2.5"><Skeleton className="h-4" /></td>
                  ))}
                </tr>
              ))
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No files match your filters.
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => openRegister(clientTab === 'C' ? 'C' : 'R')}>
                      <Plus className="w-4 h-4 mr-1.5" /> Register First File
                    </Button>
                  </div>
                </td>
              </tr>
            ) : files.map(f => (
              <tr
                key={f.file_no}
                className="border-b hover:bg-muted/40 cursor-pointer group"
                onClick={() => openEdit(f)}
              >
                <td className="px-3 py-2.5">
                  <span className="font-mono text-xs font-semibold text-primary">{f.file_no}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium max-w-[160px] truncate">{f.proposer_name}</div>
                  {f.family_code && <div className="text-xs text-muted-foreground truncate max-w-[160px]">{f.family_code}</div>}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-xs font-medium ${f.client_type === 'R' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {f.client_type === 'R' ? 'Retail' : 'SME/Corp'}
                    </span>
                    <span className="text-xs text-muted-foreground">{f.business === 'M' ? 'Medical' : 'Non-Medical'}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {ACTION_LABEL[f.business_type] ?? f.business_type}
                </td>
                <td className="px-3 py-2.5"><StatusBadge status={f.file_status} /></td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate">
                  {f.agent_name ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-right text-xs font-medium">
                  {f.paid_amt != null ? fmt(f.paid_amt) : '—'}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {fmtDate(f.receive_dt)}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {f.note_count > 0 ? (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{f.note_count}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* File count footer */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''} · {forwarded} forwarded · {pending} pending
        </p>
      )}

      {/* Sheet */}
      {sheet.mode !== 'closed' && (
        <BusinessSheet
          key={sheet.mode === 'register' ? `register-${sheet.clientType}` : sheet.fileNo}
          mode={sheet.mode}
          fileNo={sheet.fileNo}
          initialClientType={sheet.clientType ?? (clientTab === 'C' ? 'C' : 'R')}
          onClose={closeSheet}
          onSaved={(fn) => {
            closeSheet();
            qc.invalidateQueries({ queryKey: ['business'] });
            setSheet({ mode: 'edit', fileNo: fn });
          }}
        />
      )}
    </div>
  );
}
