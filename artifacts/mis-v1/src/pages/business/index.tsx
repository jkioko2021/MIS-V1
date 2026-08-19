import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { misApi, type BusinessFile, type BusinessNote, type BusinessDoc, type BusinessRequirement, type SalesAgent, type Employee, type BpoReviewer, type BusinessUpload, type AuditEntry } from '@/lib/mis-api';
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
  ChevronRight, Building2, User, Upload, Paperclip, AlertCircle, History,
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
const BLANK_VALUE = '__blank__';

const STATUSES = [
  'REGISTERED','FORWARDED','RETURNED-INCOMPLETE',
  'MEDICAL UW-REVIEW','BENEFIT VERIFICATION','ALLOCATED','INVOICED',
];

const BUSINESS_ACTIONS: { value: string; label: string }[] = [
  { value: 'N',  label: 'New' },
  { value: 'R',  label: 'Renewal' },
  { value: 'A',  label: 'Addon' },
  { value: 'T',  label: 'Termination' },
  { value: 'RT', label: 'Reinstatement' },
  { value: 'CC', label: 'Category Change' },
  { value: 'PR', label: 'Premium Recon' },
  { value: 'NE', label: 'Nill_Endr' },
  { value: 'FT', label: 'Fund_Topup' },
  { value: 'SU', label: 'Suspension' },
  { value: 'LS', label: 'Lift Suspension' },
];

const ACTION_LABEL: Record<string, string> = Object.fromEntries(BUSINESS_ACTIONS.map(a => [a.value, a.label]));

const PAY_MODES   = ['MPESA', 'EFT', 'CHEQ', 'IPF'];
const CARD_TYPES  = ['MTIBA', 'SMART'];
const GI_CATS     = ['Non-Motor', 'Motor'];
const SECTORS     = [
  'Agriculture','Banking & Finance','Construction','Education','Energy',
  'Government & Public Sector','Healthcare','Hospitality & Tourism',
  'IT & Technology','Legal & Professional Services','Manufacturing',
  'Media & Entertainment','NGO & Non-Profit','Real Estate','Retail & Trade',
  'Telecommunications','Transport & Logistics','Other',
];
const CORP_CATS   = ['Public', 'Private'];
const SAMPLE_AGENTS: SalesAgent[] = [
  {
    agent_id: '2013031715171911335500911',
    agent_name: 'KISIMA MEDICAL AND GENERAL INSURANCE AGENCY LTD',
    agent_email: null,
    agent_phone: null,
    agency_code: null,
    is_active: true,
  },
  {
    agent_id: '2013031707142198798700016',
    agent_name: 'GREAT FIVE INS. BROKERS',
    agent_email: null,
    agent_phone: null,
    agency_code: null,
    is_active: true,
  },
  {
    agent_id: '2013031707142198798700097',
    agent_name: 'CAPSTONE INSURANCE AGENCY',
    agent_email: null,
    agent_phone: null,
    agency_code: null,
    is_active: true,
  },
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
  business: 'M' | 'N' | '';
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
  cr12_ref: string;
  corp_category: string;
  sector: string;
  client_sub_type: string;
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
    business_type: '',
    business: '',
    proposer_name: '',
    family_code: '',
    receive_dt: today(),
    nid: '', pin_no: '', walk_in_client: 'Y', walk_in_auth: '', card_type: '', is_mtiba: false, is_ipf: false,
    cr12: false, cr12_ref: '', corp_category: '', sector: '', client_sub_type: '',
    agent_id: '', county_code: '', gi_category: '', rate_type: 'S',
    pay_ref_no: '', paid_amt: '', pay_mode: '',
    allocated_to: '', medical_uw: false, benefit_verified: 'NO', invoiced: false,
  };
}

function fileToForm(f: BusinessFile): FormState {
  return {
    client_type: f.client_type === 'C' ? 'C' : 'R',
    business_type: f.business_type ?? '',
    business: f.business === 'N' ? 'N' : 'M',
    proposer_name: f.proposer_name ?? '',
    family_code: f.family_code ?? '',
    receive_dt: f.receive_dt ? f.receive_dt.split('T')[0] : today(),
    nid: f.nid ?? '', pin_no: f.pin_no ?? '',
    walk_in_client: (f.walk_in_client ?? 'N') as 'Y' | 'N',
    walk_in_auth: f.walk_in_auth ?? '',
    card_type: f.card_type ?? '',
    is_mtiba: !!f.is_mtiba, is_ipf: !!f.is_ipf,
    cr12: !!f.cr12, cr12_ref: f.cr12_ref ?? '', corp_category: f.corp_category ?? '', sector: f.sector ?? '', client_sub_type: f.client_sub_type ?? '',
    agent_id: f.agent_id ?? '', county_code: f.county_code ?? '',
    gi_category: f.gi_category ?? '', rate_type: (f.rate_type ?? 'S') as 'S' | 'C',
    pay_ref_no: f.pay_ref_no ?? '', paid_amt: f.paid_amt != null ? String(f.paid_amt) : '',
    pay_mode: f.pay_mode === 'CHEQUE' ? 'CHEQ' : (f.pay_mode ?? ''),
    allocated_to: f.allocated_to ?? '', medical_uw: !!f.medical_uw,
    benefit_verified: (f.benefit_verified ?? 'NO') as 'YES' | 'NO', invoiced: !!f.invoiced,
  };
}

// ─── Field components ─────────────────────────────────────────────────────────
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
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
    <Select value={value || BLANK_VALUE} onValueChange={v => onChange(v === BLANK_VALUE ? '' : v)}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder={placeholder ?? 'Select…'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={BLANK_VALUE}>{placeholder ?? 'Blank'}</SelectItem>
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
    <div className="flex items-center gap-3 pt-3 -mx-5 px-5 py-2 bg-slate-50 dark:bg-muted/40 border-y border-slate-200 dark:border-border">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{title}</span>
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
  // A new registration becomes an editable file in this same sheet as soon as
  // the server assigns its file number. This keeps registration, documents,
  // notes, and forwarding in one uninterrupted SME/Corp workflow.
  const [activeFileNo, setActiveFileNo] = useState<string | undefined>(fileNo);
  const activeMode: 'register' | 'edit' = activeFileNo ? 'edit' : mode;

  // Reference data
  const { data: agentsRes } = useQuery({ queryKey: ['agents'], queryFn: misApi.agents, staleTime: 120_000 });
  const { data: employeesRes } = useQuery({ queryKey: ['employees-membership'], queryFn: () => misApi.employees({ department: 'MEMBERSHIP', activated: 'true', approved: 'true' }), staleTime: 120_000 });
  const { data: bpoReviewersRes } = useQuery({ queryKey: ['bpo-reviewers'], queryFn: () => misApi.bpoReviewers(), staleTime: 120_000 });
  const { data: countiesRes } = useQuery({ queryKey: ['counties'], queryFn: misApi.counties, staleTime: Infinity });

  const liveAgents: SalesAgent[] = (agentsRes?.data ?? []) as SalesAgent[];
  const agents: SalesAgent[] = [
    ...SAMPLE_AGENTS,
    ...liveAgents.filter(agent => !SAMPLE_AGENTS.some(sample => sample.agent_id === agent.agent_id)),
  ];
  const employees: Employee[] = (employeesRes?.data ?? []) as Employee[];
  const bpoReviewers: BpoReviewer[] = (bpoReviewersRes?.data ?? []) as BpoReviewer[];
  const counties: string[]    = (countiesRes?.data ?? []) as string[];

  // Existing file data (edit mode)
  const { data: fileRes, isLoading: fileLoading } = useQuery({
    queryKey: ['business-file', activeFileNo],
    queryFn: () => misApi.businessFile(activeFileNo!),
    enabled: activeMode === 'edit' && !!activeFileNo,
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

  // Forward dialog state
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardToUser, setForwardToUser] = useState('');
  const [forwardComments, setForwardComments] = useState('');
  const [registrationTab, setRegistrationTab] = useState<'details' | 'documents' | 'notes'>('details');

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const registerMut = useMutation({
    mutationFn: () => misApi.businessRegister(form as unknown as Partial<BusinessFile>),
    onSuccess: (res) => {
      setActiveFileNo(res.data.file_no);
      setRegistrationTab('documents');
      toast({ title: 'File registered', description: `File No: ${res.data.file_no}. Continue below to upload documents, add notes, and forward.` });
      qc.invalidateQueries({ queryKey: ['business'] });
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: () => misApi.businessUpdate(activeFileNo!, form as unknown as Partial<BusinessFile>),
    onSuccess: () => {
      toast({ title: 'File updated' });
      qc.invalidateQueries({ queryKey: ['business'] });
      qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] });
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const forwardMut = useMutation({
    mutationFn: () => misApi.businessForward(activeFileNo!, { to_user: forwardToUser, comments: forwardComments }),
    onSuccess: (res) => {
      const newStatus = res.data.new_status;
      toast({
        title: res.data.already_routed ? 'Already in BPO Review' : 'Sent to BPO Review',
        description: res.data.already_routed ? 'The existing BPO work item was kept unchanged.' : `BPO work item created. File status updated to ${newStatus}.`,
      });
      setShowForwardDialog(false);
      setForwardToUser('');
      setForwardComments('');
      qc.invalidateQueries({ queryKey: ['business'] });
      qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] });
      qc.invalidateQueries({ queryKey: ['business-history', activeFileNo] });
    },
    onError: (e) => toast({ title: 'Cannot forward', description: String(e), variant: 'destructive' }),
  });

  const addNoteMut = useMutation({
    mutationFn: (text: string) => misApi.businessAddNote(activeFileNo!, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] });
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const deleteNoteMut = useMutation({
    mutationFn: (noteId: number) => misApi.businessDeleteNote(activeFileNo!, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] }),
  });

  const ackDocMut = useMutation({
    mutationFn: (reqId: number) => misApi.businessAckDoc(activeFileNo!, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] }),
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  const unAckDocMut = useMutation({
    mutationFn: (reqId: number) => misApi.businessUnAckDoc(activeFileNo!, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] }),
  });

  // Delete an uploaded file and remove its acknowledgement
  const deleteUploadMut = useMutation({
    mutationFn: async ({ uploadId, reqId }: { uploadId: number; reqId: number }) => {
      await misApi.businessDeleteUpload(activeFileNo!, uploadId);
      await misApi.businessUnAckDoc(activeFileNo!, reqId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] });
      qc.invalidateQueries({ queryKey: ['business-uploads', activeFileNo] });
      qc.invalidateQueries({ queryKey: ['business-history', activeFileNo] });
      toast({ title: 'Document removed' });
    },
    onError: (e) => toast({ title: 'Error removing document', description: String(e), variant: 'destructive' }),
  });

  function handleSave() {
    if (!form.proposer_name.trim()) {
      toast({ title: 'Validation', description: 'Proposer name is required.', variant: 'destructive' }); return;
    }
    if (!form.business_type) {
      toast({ title: 'Validation', description: 'Business action is required.', variant: 'destructive' }); return;
    }
    if (!form.business) {
      toast({ title: 'Validation', description: 'Coverage type (Medical/Non-Medical) is required.', variant: 'destructive' }); return;
    }
    if (!form.agent_id) {
      toast({ title: 'Validation', description: 'Sales agent/broker is required.', variant: 'destructive' }); return;
    }
    // Retail Non-Medical: NID, County, PIN and GI Category are all mandatory (legacy rule)
    if (isRetail && form.business === 'N') {
      if (!form.nid.trim()) {
        toast({ title: 'Validation', description: 'National ID is required for Non-Medical Retail.', variant: 'destructive' }); return;
      }
      if (!form.county_code) {
        toast({ title: 'Validation', description: 'County is required for Non-Medical Retail.', variant: 'destructive' }); return;
      }
      if (!form.pin_no.trim()) {
        toast({ title: 'Validation', description: 'KRA PIN is required for Non-Medical Retail.', variant: 'destructive' }); return;
      }
      if (!form.gi_category) {
        toast({ title: 'Validation', description: 'GI Category is required for Non-Medical.', variant: 'destructive' }); return;
      }
    }
    // Walk-in: Membership Admin must be selected
    if (isRetail && form.walk_in_client === 'Y' && !form.allocated_to) {
      toast({ title: 'Validation', description: 'Select a Membership Admin to allocate the walk-in file.', variant: 'destructive' }); return;
    }
    if (activeMode === 'register') registerMut.mutate();
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
  const isComplete = requirements.length === 0 || ackedCount === requirements.length;
  const isSaving = registerMut.isPending || updateMut.isPending;

  // ─── Upload dialog state ─────────────────────────────────────────────────────
  const [uploadFor, setUploadFor] = useState<BusinessRequirement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Uploads for this file
  const { data: uploadsRes } = useQuery({
    queryKey: ['business-uploads', activeFileNo],
    queryFn: () => misApi.businessListUploads(activeFileNo!),
    enabled: activeMode === 'edit' && !!activeFileNo,
    staleTime: 30_000,
  });
  const uploads: BusinessUpload[] = (uploadsRes?.data ?? []) as BusinessUpload[];

  // Audit / workflow history
  const { data: historyRes } = useQuery({
    queryKey: ['business-history', activeFileNo],
    queryFn: () => misApi.businessGetHistory(activeFileNo!),
    enabled: activeMode === 'edit' && !!activeFileNo,
    staleTime: 30_000,
  });
  const history: AuditEntry[] = (historyRes?.data ?? []) as AuditEntry[];

  const markCompleteMut = useMutation({
    mutationFn: (complete: boolean) => misApi.businessMarkComplete(activeFileNo!, complete),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] });
      qc.invalidateQueries({ queryKey: ['business-history', activeFileNo] });
    },
    onError: (e) => toast({ title: 'Error', description: String(e), variant: 'destructive' }),
  });

  async function handleUpload() {
    if (!pendingFile || !activeFileNo || !uploadFor) return;
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
      await misApi.businessRecordUpload(activeFileNo, {
        req_id: uploadFor.req_id,
        filename: pendingFile.name,
        filesize: pendingFile.size,
        mime_type: pendingFile.type || 'application/octet-stream',
        storage_key: objectPath,
      });
      setUploadProgress(100);

      toast({ title: 'Document uploaded', description: `${pendingFile.name} uploaded and acknowledged.` });
      qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] });
      qc.invalidateQueries({ queryKey: ['business-uploads', activeFileNo] });
      setUploadFor(null);
      setPendingFile(null);
    } catch (err) {
      toast({ title: 'Upload failed', description: String(err), variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  const title = activeMode === 'register'
    ? `Register ${isRetail ? 'Retail' : 'SME/Corp'} File`
    : (existingFile?.file_no ?? activeFileNo ?? 'File Details');

  return (
    <Sheet open onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[720px] sm:max-w-[720px] h-[100dvh] min-h-0 gap-0 overflow-hidden p-0 flex flex-col !bg-white dark:!bg-card border-l-2 border-slate-200">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" /> {title}
              </SheetTitle>
              {activeMode === 'edit' && activeFileNo && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {existingFile && <StatusBadge status={existingFile.file_status} />}
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    File No. <span className="font-mono">{activeFileNo}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isRetail ? 'Retail' : 'SME/Corp'}{existingFile ? ` · ${existingFile.business === 'M' ? 'Medical' : 'Non-Medical'}` : ''}
                  </span>
                  {existingFile?.entered_by && (
                    <span className="text-xs text-muted-foreground">· by {existingFile.entered_by}</span>
                  )}
                </div>
              )}
            </div>
            {activeMode === 'register' && (
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

        {/* Register workflow tabs */}
        {activeMode === 'edit' && fileLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div role="tablist" aria-label="Registration workflow" className="mx-5 mt-3 flex gap-1 rounded-lg border bg-muted/40 p-1 shrink-0">
              {[
                { value: 'details' as const, label: 'Details', icon: FileText },
                { value: 'documents' as const, label: `Document Upload${activeMode === 'edit' && requirements.length > 0 ? ` (${ackedCount}/${requirements.length})` : ''}`, icon: FileCheck },
                { value: 'notes' as const, label: `Notes${notes.length ? ` (${notes.length})` : ''}`, icon: MessageSquare },
              ].map(tab => {
                const Icon = tab.icon;
                const selected = registrationTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setRegistrationTab(tab.value)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <ScrollArea className="flex-1 mt-2">
            <div className="px-5 pb-4 space-y-3">

              {/* ── Registration / Edit Form ─────────────────────────────── */}
              {registrationTab === 'details' && (
                <>
              <SectionHeader title="File Information" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Business Action" required>
                  <SelectField value={form.business_type} onChange={v => set('business_type', v)} options={BUSINESS_ACTIONS} placeholder="Blank" />
                </Field>
                <Field label="Coverage Type" required>
                  <SelectField value={form.business} onChange={v => set('business', v as FormState['business'])} options={[{ value: 'M', label: 'Medical' }, { value: 'N', label: 'Non Medical' }]} placeholder="Blank" />
                </Field>
                <Field label="Receive Date">
                  <Input type="date" value={form.receive_dt} onChange={e => set('receive_dt', e.target.value)} className="h-8 text-sm" />
                </Field>
                <Field label="Rate Type">
                  <SelectField value={form.rate_type} onChange={v => set('rate_type', v as 'S' | 'C')} options={[{ value: 'S', label: 'Standard' }, { value: 'C', label: 'Corporate' }]} />
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
                        <SelectField value={form.walk_in_auth} onChange={v => set('walk_in_auth', v)} options={employees.map(e => ({ value: e.username, label: e.employee_name }))} placeholder="Select authoriser…" />
                      </Field>
                    )}
                  </>
                )}

                {isCorp && (
                  <>
                    <Field label="Business Category">
                      <SelectField value={form.corp_category} onChange={v => set('corp_category', v)} options={CORP_CATS.map(c => ({ value: c, label: c }))} placeholder="Blank" />
                    </Field>
                    <Field label="Industry Sector">
                      <SelectField value={form.sector} onChange={v => set('sector', v)} options={SECTORS.map(s => ({ value: s, label: s }))} placeholder="Blank" />
                    </Field>
                    <Field label="CR12 Reference No.">
                      <TextInput value={form.cr12_ref} onChange={v => set('cr12_ref', v)} placeholder="e.g. CR12/2024/00123" />
                    </Field>
                    <div className="col-span-2 flex items-center gap-6">
                      <CheckRow checked={form.cr12} onChange={v => set('cr12', v)} label="CR12 / Certificate of Incorporation submitted" />
                    </div>
                  </>
                )}
              </div>

              <SectionHeader title="Classification" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Agent / Broker" required>
                  <Select value={form.agent_id || BLANK_VALUE} onValueChange={v => set('agent_id', v === BLANK_VALUE ? '' : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Blank" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BLANK_VALUE}>Blank</SelectItem>
                      {agents.filter(a => a.is_active).map(a => <SelectItem key={a.agent_id} value={a.agent_id}>{a.agent_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="County">
                  <Select value={form.county_code || BLANK_VALUE} onValueChange={v => set('county_code', v === BLANK_VALUE ? '' : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Blank" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BLANK_VALUE}>Blank</SelectItem>
                      {counties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="GI Category">
                  <SelectField value={form.gi_category} onChange={v => set('gi_category', v)} options={GI_CATS.map(g => ({ value: g, label: g }))} placeholder="Blank" />
                </Field>
                <Field label="Client Type">
                  <SelectField value={form.client_sub_type} onChange={v => set('client_sub_type', v)} options={[{ value: 'S', label: 'SME' }, { value: 'C', label: 'CORPORATE' }]} placeholder="Blank" />
                </Field>
                {isRetail && form.is_mtiba && (
                  <Field label="Card Type">
                    <SelectField value={form.card_type} onChange={v => set('card_type', v)} options={CARD_TYPES.map(c => ({ value: c, label: c }))} placeholder="Blank" />
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
                  <SelectField value={form.pay_mode} onChange={v => set('pay_mode', v)} options={PAY_MODES.map(p => ({ value: p, label: p }))} placeholder="Blank" />
                </Field>
              </div>

              {/* Processing Status / registration action area */}
              {(activeMode === 'edit' || activeMode === 'register') && (
                <>
                  <SectionHeader title={
                    activeMode === 'edit'
                      ? 'Processing Status'
                      : isRetail && form.walk_in_client === 'Y'
                      ? 'Walk-in Allocation'
                      : 'Registration Actions'
                  } />
                  <div className="grid grid-cols-2 gap-3">
                    {(activeMode === 'edit' || (isRetail && form.walk_in_client === 'Y')) && (
                      <>
                        <Field label="Allocated To *">
                          <Select value={form.allocated_to} onValueChange={v => set('allocated_to', v)}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Assign to employee…" /></SelectTrigger>
                            <SelectContent>{employees.map(e => <SelectItem key={e.username} value={e.username}>{e.employee_name}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label="Benefit Verified">
                          <SelectField value={form.benefit_verified} onChange={v => set('benefit_verified', v as 'YES' | 'NO')} options={[{ value: 'YES', label: 'Yes — Verified' }, { value: 'NO', label: 'No — Pending' }]} />
                        </Field>
                      </>
                    )}
                    {activeMode === 'edit' && (
                      <div className="col-span-2 flex items-center gap-6">
                        <CheckRow checked={form.medical_uw} onChange={v => set('medical_uw', v)} label="Medical UW Reviewed" />
                        <CheckRow checked={form.invoiced} onChange={v => set('invoiced', v)} label="Invoiced" />
                      </div>
                    )}
                    {activeMode === 'register' && (
                      <div className="col-span-2 flex justify-end pt-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="gap-1.5 whitespace-nowrap"
                          aria-label="Save and generate file number"
                        >
                          {isSaving ? (
                            <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving…</>
                          ) : (
                            <><Plus className="w-3.5 h-3.5" /> Save &amp; Generate File No.</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
                </>
              )}

              {/* ── Document Upload ────────────────────────────────────────── */}
              {registrationTab === 'documents' && (
                activeMode === 'edit' ? (
                <>
                  <SectionHeader title={`Documents ${requirements.length > 0 ? `(${ackedCount}/${requirements.length})` : ''}`} />

                  {/* Progress banner */}
                  <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${isComplete ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50/70'}`}>
                    {isComplete
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-semibold ${isComplete ? 'text-green-800' : 'text-amber-800'}`}>
                        {isComplete ? 'All documents acknowledged' : `${requirements.length - ackedCount} document(s) still pending`}
                      </p>
                      <p className="text-xs text-muted-foreground">{ackedCount} of {requirements.length} acknowledged · Upload or click Acknowledge</p>
                    </div>
                  </div>

                  {/* Document rows */}
                  <div className="space-y-2">
                    {requirements.map(r => {
                      const acked = isAcknowledged(r.req_id);
                      const info  = getAckInfo(r.req_id);
                      const docUpload = uploads.find(u => u.req_id === r.req_id);
                      return (
                        <div key={r.req_id} className={`rounded-xl border transition-colors ${acked ? 'border-green-200 bg-green-50/40' : 'border-border bg-card'}`}>
                          <div className="flex items-start justify-between gap-3 p-3.5">
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
                                    <a href={`/api/storage/objects${docUpload.storage_key}`} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]" onClick={e => e.stopPropagation()}>
                                      {docUpload.filename}
                                    </a>
                                    {docUpload.filesize != null && <span className="text-xs text-muted-foreground shrink-0">· {fmtBytes(docUpload.filesize)}</span>}
                                    <span className="text-xs text-muted-foreground shrink-0">· {docUpload.uploaded_by}</span>
                                  </div>
                                ) : acked && info ? (
                                  <p className="text-xs text-muted-foreground mt-0.5">Acknowledged by {info.acknowledged_by} · {fmtDate(info.acknowledged_at)}</p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {docUpload ? (
                                <>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => { setUploadFor(r); setPendingFile(null); }}>
                                    <Upload className="w-3 h-3" /> Replace
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => deleteUploadMut.mutate({ uploadId: docUpload.upload_id, reqId: r.req_id })} disabled={deleteUploadMut.isPending}>
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {!acked && (
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => { setUploadFor(r); setPendingFile(null); }}>
                                      <Upload className="w-3 h-3" /> Upload
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm"
                                    className={`h-7 text-xs gap-1 ${acked ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10' : 'hover:bg-accent'}`}
                                    onClick={() => acked ? unAckDocMut.mutate(r.req_id) : ackDocMut.mutate(r.req_id)}
                                    disabled={ackDocMut.isPending || unAckDocMut.isPending}>
                                    {acked ? <><Trash2 className="w-3 h-3" /> Remove</> : 'Acknowledge'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {requirements.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-25" />
                        <p className="text-sm">No document requirements found.</p>
                      </div>
                    )}
                  </div>

                </>
              ) : (
                <div className="rounded-xl border border-dashed px-5 py-10 text-center text-muted-foreground">
                  <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium text-foreground">Save the registration details first</p>
                  <p className="text-xs mt-1">A file number is required before supporting documents can be uploaded.</p>
                </div>
              )
              )}

              {/* ── Notes ─────────────────────────────────────────────────── */}
              {registrationTab === 'notes' && (
                activeMode === 'edit' ? (
                <>
                  <SectionHeader title={`Notes${notes.length > 0 ? ` (${notes.length})` : ''}`} />
                  <div className="flex gap-2">
                    <Textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Type a note… (Ctrl+Enter to submit)"
                      className="text-sm resize-none h-16 flex-1"
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(); }}
                    />
                    <Button size="sm" className="shrink-0 self-end" onClick={handleAddNote} disabled={!noteText.trim() || addNoteMut.isPending}>
                      <SendHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  {notes.length > 0 && (
                    <div className="space-y-2">
                      {notes.map(n => (
                        <div key={n.note_id} className="border rounded-lg p-3 group">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{n.note_from}</span>
                              <span className="text-xs text-muted-foreground">{fmtDate(n.note_date)}</span>
                            </div>
                            <button onClick={() => deleteNoteMut.mutate(n.note_id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{n.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Workflow History ───────────────────────────────────── */}
                  {history.length > 0 && (
                    <>
                      <SectionHeader title={`History (${history.length})`} />
                      <div className="space-y-2">
                        {history.map((h, i) => {
                          const colorMap: Record<string, string> = {
                            BT_REGISTER: 'bg-green-100 text-green-700 border-green-200',
                            BT_UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
                            BT_FORWARD: 'bg-purple-100 text-purple-700 border-purple-200',
                            BT_UPLOAD: 'bg-teal-100 text-teal-700 border-teal-200',
                            BT_DOC_COMPLETE: 'bg-amber-100 text-amber-700 border-amber-200',
                            BT_DOC_INCOMPLETE: 'bg-red-100 text-red-700 border-red-200',
                          };
                          const labelMap: Record<string, string> = {
                            BT_REGISTER: 'Registered', BT_UPDATE: 'Updated', BT_FORWARD: 'Forwarded',
                            BT_UPLOAD: 'Doc Uploaded', BT_DOC_COMPLETE: 'Docs Complete', BT_DOC_INCOMPLETE: 'Docs Incomplete',
                          };
                          return (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 mt-0.5 ${colorMap[h.action] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {labelMap[h.action] ?? h.action}
                              </span>
                              <p className="text-xs text-muted-foreground flex-1 min-w-0 break-words leading-relaxed">{h.details}</p>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-medium">{h.done_by}</div>
                                <div className="text-xs text-muted-foreground">{fmtDate(h.done_at)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-dashed px-5 py-10 text-center text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium text-foreground">Save the registration details first</p>
                  <p className="text-xs mt-1">A file number is required before notes can be attached to this registration.</p>
                </div>
              )
              )}

            </div>
          </ScrollArea>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t shrink-0">
          {/* Documentation Complete sits just above the action row throughout the workflow */}
          <div className="px-5 py-2.5 border-b flex items-center justify-between bg-slate-50 dark:bg-muted/30">
            {activeMode === 'edit' ? (
              <>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={existingFile?.is_complete ?? isComplete}
                  onChange={e => markCompleteMut.mutate(e.target.checked)}
                  disabled={markCompleteMut.isPending}
                  className="w-4 h-4 rounded border-gray-300 accent-green-600 cursor-pointer"
                />
                <span className="text-sm font-medium">Documentation Complete</span>
              </label>
              {(existingFile?.is_complete ?? isComplete) ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Marked complete
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium">
                  {ackedCount}/{requirements.length} docs acknowledged
                </span>
              )}
              </>
            ) : (
              <>
                <label className="flex items-center gap-2.5 cursor-not-allowed select-none opacity-60">
                  <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-sm font-medium">Documentation Complete</span>
                </label>
                <span className="text-xs text-muted-foreground">Save Details to enable</span>
              </>
            )}
          </div>

          {/* Action buttons row */}
          <div className="px-5 py-3 flex items-center justify-between gap-2 bg-background">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <div className="flex gap-2">
              {activeMode === 'edit' && (
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 whitespace-nowrap" aria-label="Save changes">
                  {isSaving ? (
                    <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving…</>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
              {!existingFile?.forwarded && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowForwardDialog(true)}
                  disabled={activeMode !== 'edit' || !existingFile?.is_complete || !isComplete || forwardMut.isPending}
                  title={activeMode !== 'edit'
                    ? 'Save the registration details before forwarding'
                    : !existingFile?.is_complete || !isComplete
                    ? 'Complete all required documents before forwarding'
                    : 'Forward to the next verification level'}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Forward
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* ── Forward Dialog ─────────────────────────────────────────────── */}
        <Dialog open={showForwardDialog} onOpenChange={v => { if (!v && !forwardMut.isPending) setShowForwardDialog(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                Forward to BPO Review — {activeFileNo}
              </DialogTitle>
              <DialogDescription>
                This creates an active BPO Review work item for the same file. Add a handover note and optionally assign a reviewer.
              </DialogDescription>
            </DialogHeader>
            {!(existingFile?.is_complete) && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Complete the documents section and tick <strong>Documentation Complete</strong> before forwarding.</span>
              </div>
            )}
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assign BPO Reviewer</Label>
                <Select value={forwardToUser} onValueChange={setForwardToUser}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Leave unassigned for the BPO queue…" />
                  </SelectTrigger>
                  <SelectContent>
                    {bpoReviewers.map(e => (
                      <SelectItem key={e.username} value={e.username}>{e.employee_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Comments <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={forwardComments}
                  onChange={e => setForwardComments(e.target.value)}
                  placeholder="Required — add handover notes or reason for forwarding…"
                  className="text-sm resize-none h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForwardDialog(false)} disabled={forwardMut.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!forwardComments.trim()) {
                    toast({ title: 'Comments required', description: 'Add a handover note before forwarding.', variant: 'destructive' });
                    return;
                  }
                  forwardMut.mutate();
                }}
                disabled={forwardMut.isPending}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                {forwardMut.isPending ? (
                  <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Forwarding…</>
                ) : (
                  <><ArrowUpRight className="w-3.5 h-3.5" /> Forward File</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
  const [queue, setQueue]             = useState<'register' | 'bpo-review'>('register');
  const [clientTab, setClientTab]     = useState<'ALL' | 'R' | 'C'>('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]           = useState('');
  const [sheet, setSheet]             = useState<{ mode: 'closed' | 'register' | 'edit'; fileNo?: string; clientType?: 'R' | 'C' }>({ mode: 'closed' });
  const qc = useQueryClient();

  const params: Record<string, string> = {};
  params.queue = queue;
  if (statusFilter) params.status = statusFilter;
  if (clientTab !== 'ALL') params.client_type = clientTab;
  if (search) params.search = search;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['business', queue, clientTab, statusFilter, search],
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
          {queue === 'register' && (
            <Button size="sm" className="gap-1.5" onClick={() => openRegister(clientTab === 'C' ? 'C' : 'R')}>
              <Plus className="w-4 h-4" /> Register File
            </Button>
          )}
        </div>
      </div>

      {/* Work queues */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setQueue('register'); setStatusFilter(''); }}
          className={`rounded-lg border px-3 py-2 text-left transition-colors ${
            queue === 'register' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:bg-muted'
          }`}
        >
          <span className="block text-sm font-semibold">Register Queue</span>
          <span className="block text-xs text-muted-foreground">New files awaiting forwarding</span>
        </button>
        <button
          onClick={() => { setQueue('bpo-review'); setStatusFilter(''); }}
          className={`rounded-lg border px-3 py-2 text-left transition-colors ${
            queue === 'bpo-review' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:bg-muted'
          }`}
        >
          <span className="block text-sm font-semibold">BPO Review Queue</span>
          <span className="block text-xs text-muted-foreground">Forwarded files needing BPO review</span>
        </button>
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
              <th className="text-left px-3 py-2.5 font-medium">{queue === 'bpo-review' ? 'BPO Reviewer' : 'Agent'}</th>
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
                  {queue === 'register' && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => openRegister(clientTab === 'C' ? 'C' : 'R')}>
                        <Plus className="w-4 h-4 mr-1.5" /> Register First File
                      </Button>
                    </div>
                  )}
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
                  {queue === 'bpo-review' ? (f.bpo_assigned_to ?? 'Unassigned') : (f.agent_name ?? '—')}
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
          {files.length} file{files.length !== 1 ? 's' : ''} in {queue === 'bpo-review' ? 'BPO Review' : 'Register'} queue
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
