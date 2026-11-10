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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Progress } from '@/components/ui/progress';
import {
  Search, RefreshCw, FileText, Plus, CheckCircle2, Circle,
  SendHorizontal, ArrowUpRight, Trash2, MessageSquare, FileCheck,
  ChevronRight, ChevronLeft, Building2, User, Upload, Paperclip, AlertCircle,
  Check, ChevronsUpDown, ArrowUpDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BpoReviewQueue } from './bpo-review-queue';
import { BpoCorporateQueue } from './bpo-corporate-queue';
import { BpoReviewSheet } from './bpo-review-sheet';
import { BpoCorporateSheet } from './bpo-corporate-sheet';

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
const GI_CATS     = [{ value: 'Non_Motor', label: 'Non-Motor' }, { value: 'Motor', label: 'Motor' }];
const CORP_CATS   = ['Public', 'Private'];

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

type TrackingClientType = 'R' | 'S' | 'C';

function clientTypeLabel(clientType: string): string {
  if (clientType === 'R') return 'Retail';
  if (clientType === 'S') return 'SME';
  return 'Corporate';
}

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormState {
  client_type: TrackingClientType;
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

function blankForm(clientType: TrackingClientType = 'R'): FormState {
  return {
    client_type: clientType,
    business_type: '',
    business: '',
    proposer_name: '',
    family_code: '',
    receive_dt: today(),
    nid: '', pin_no: '', walk_in_client: 'Y', walk_in_auth: '', card_type: '', is_mtiba: false, is_ipf: false,
    cr12: false, cr12_ref: '', corp_category: '', sector: '', client_sub_type: clientType === 'R' ? '' : clientType,
    agent_id: '', county_code: '', gi_category: '', rate_type: 'S',
    pay_ref_no: '', paid_amt: '', pay_mode: '',
    allocated_to: '', medical_uw: false, benefit_verified: 'YES', invoiced: false,
  };
}

function fileToForm(f: BusinessFile): FormState {
  return {
    client_type: f.client_type === 'R' ? 'R' : f.client_type === 'S' ? 'S' : 'C',
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
    cr12: !!f.cr12, cr12_ref: f.cr12_ref ?? '', corp_category: f.corp_category ?? '', sector: f.sector ?? '', client_sub_type: f.client_type === 'R' ? '' : f.client_type,
    agent_id: f.agent_id ?? '', county_code: f.county_code ?? '',
    gi_category: f.gi_category === 'Non-Motor' ? 'Non_Motor' : (f.gi_category ?? ''),
    rate_type: (f.rate_type ?? 'S') as 'S' | 'C',
    pay_ref_no: f.pay_ref_no ?? '', paid_amt: f.paid_amt != null ? String(f.paid_amt) : '',
    pay_mode: f.pay_mode === 'CHEQUE' ? 'CHEQ' : (f.pay_mode ?? ''),
    allocated_to: f.allocated_to ?? '', medical_uw: !!f.medical_uw,
    benefit_verified: (f.benefit_verified ?? (f.client_type === 'R' || f.rate_type === 'S' ? 'YES' : 'NO')) as 'YES' | 'NO', invoiced: !!f.invoiced,
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

function SearchableSelect({ value, onChange, options, placeholder, searchPlaceholder, disabled }: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-8 w-full justify-between px-3 text-sm font-normal"
        >
          <span className="truncate">{selected?.label ?? placeholder ?? 'Select…'}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="!z-[9999] w-[--radix-popover-trigger-width] min-w-[260px] max-h-[min(420px,calc(100dvh-1.5rem))] overflow-hidden p-0 bg-white dark:bg-card shadow-xl ring-1 ring-black/10"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? 'Search…'} />
          <CommandList>
            <CommandEmpty>No matching option found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="clear-selection"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Clear selection
                </CommandItem>
              )}
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={[option.value]}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-3.5 w-3.5', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
  initialClientType?: TrackingClientType;
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
  const { data: agentsRes, isLoading: agentsLoading, isError: agentsError } = useQuery({
    queryKey: ['agents', 'sales-intermediary'], queryFn: misApi.agents, staleTime: 120_000,
  });
  const { data: walkInStaffRes } = useQuery({ queryKey: ['walk-in-staff'], queryFn: misApi.walkInStaff, staleTime: 120_000 });
  const { data: bpoReviewersRes } = useQuery({ queryKey: ['bpo-reviewers'], queryFn: () => misApi.bpoReviewers(), staleTime: 120_000 });
  const { data: countiesRes } = useQuery({ queryKey: ['counties'], queryFn: misApi.counties, staleTime: Infinity });
  const { data: sectorsRes } = useQuery({ queryKey: ['business-sectors'], queryFn: misApi.sectors, staleTime: 300_000 });

  const agents: SalesAgent[] = (agentsRes?.data ?? []) as SalesAgent[];
  const walkInStaff: Employee[] = (walkInStaffRes?.data ?? []) as Employee[];
  const bpoReviewers: BpoReviewer[] = (bpoReviewersRes?.data ?? []) as BpoReviewer[];
  const counties: string[]    = (countiesRes?.data ?? []) as string[];
  const sectors: string[]     = (sectorsRes?.data ?? []) as string[];

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
    setForm(f => ({
      ...f, [k]: v,
      ...(k === 'rate_type' && v !== f.rate_type
        ? { benefit_verified: f.client_type === 'R' || v === 'S' ? 'YES' : 'NO' }
        : {}),
    }));
  }

  function setClientType(clientType: TrackingClientType) {
    setForm(current => ({
      ...current,
      client_type: clientType,
      benefit_verified: clientType === 'R' || current.rate_type === 'S' ? 'YES' : 'NO',
      ...(clientType === 'R'
        ? {
            cr12: false,
            cr12_ref: '',
            corp_category: '',
            sector: '',
            client_sub_type: '',
          }
        : {
            nid: '',
            pin_no: '',
            walk_in_client: 'N' as const,
            walk_in_auth: '',
            allocated_to: '',
            is_mtiba: false,
            is_ipf: false,
            client_sub_type: clientType,
          }),
    }));
  }

  const isRetail = form.client_type === 'R';
  const isCorp   = form.client_type !== 'R';

  // Forward dialog state
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [deleteDocument, setDeleteDocument] = useState<{ uploadId: number; filename: string } | null>(null);
  const [forwardToUser, setForwardToUser] = useState('');
  const [forwardComments, setForwardComments] = useState('');
  const [registrationTab, setRegistrationTab] = useState<'details' | 'documents' | 'notes'>('details');
  const forwardsToGi = form.business === 'N';

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
    mutationFn: () => misApi.businessForward(activeFileNo!, {
      ...(forwardsToGi ? {} : { to_user: forwardToUser }),
      comments: forwardComments,
    }),
    onSuccess: (res) => {
      const newStatus = res.data.new_status;
      const queueLabel = res.data.queue_name === 'GI_ALLOCATE' ? 'GI-Allocate' : 'BPO Review';
      toast({
        title: res.data.already_routed ? `Already routed to ${queueLabel}` : `Sent to ${queueLabel}`,
        description: res.data.already_routed
          ? `The existing ${queueLabel} work item was kept unchanged.`
          : `${queueLabel} work item created. File status updated to ${newStatus}.`,
      });
      setShowForwardDialog(false);
      setForwardToUser('');
      setForwardComments('');
      qc.invalidateQueries({ queryKey: ['business'] });
      qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] });
      qc.invalidateQueries({ queryKey: ['business-history', activeFileNo] });
      onClose();
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

  const selectDocMut = useMutation({
    mutationFn: (reqId: number) => misApi.businessAckDoc(activeFileNo!, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] }),
    onError: (e) => toast({ title: 'Unable to select document', description: String(e), variant: 'destructive' }),
  });

  const deselectDocMut = useMutation({
    mutationFn: (reqId: number) => misApi.businessUnAckDoc(activeFileNo!, reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-file', activeFileNo] }),
    onError: (e) => toast({ title: 'Unable to remove document', description: String(e), variant: 'destructive' }),
  });

  // Removing a file keeps its document selected, so Forward remains unavailable
  // until a replacement is uploaded.
  const deleteUploadMut = useMutation({
    mutationFn: async ({ uploadId }: { uploadId: number }) => {
      await misApi.businessDeleteUpload(activeFileNo!, uploadId);
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
    if (form.paid_amt || form.pay_mode) {
      const paidAmount = Number(form.paid_amt);
      if (!form.paid_amt || !Number.isFinite(paidAmount) || paidAmount < 0) {
        toast({ title: 'Validation', description: 'Paid amount must be a valid non-negative number.', variant: 'destructive' }); return;
      }
      if (!form.pay_mode) {
        toast({ title: 'Validation', description: 'Select a payment mode for the paid amount.', variant: 'destructive' }); return;
      }
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
    if (isRetail && form.walk_in_client === 'Y' && !form.walk_in_auth) {
      toast({ title: 'Validation', description: 'Select the Membership Admin who authorised the walk-in file.', variant: 'destructive' }); return;
    }
    if (isCorp) {
      if (form.business_type === 'N' && !form.cr12_ref.trim()) {
        toast({ title: 'Validation', description: 'CR12 reference number is required for new SME/Corporate business.', variant: 'destructive' }); return;
      }
      if (form.business_type === 'N' && !form.county_code) {
        toast({ title: 'Validation', description: 'County is required for new SME/Corporate business.', variant: 'destructive' }); return;
      }
      if (form.business_type === 'N' && !form.corp_category) {
        toast({ title: 'Validation', description: 'Business Category is required for new SME/Corporate business.', variant: 'destructive' }); return;
      }
      if (form.business_type === 'N' && !form.sector) {
        toast({ title: 'Validation', description: 'Industry Sector is required for new SME/Corporate business.', variant: 'destructive' }); return;
      }
      if (form.business === 'N' && !form.gi_category) {
        toast({ title: 'Validation', description: 'GI Category is required for Non-Medical business.', variant: 'destructive' }); return;
      }
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

  // Document selection
  function isSelected(reqId: number) {
    return docChecklist.some(d => d.req_id === reqId && d.is_selected);
  }
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
  const selectedRequirements = requirements.filter(r => isSelected(r.req_id));
  const selectedCount = selectedRequirements.length;
  const uploadedSelectedCount = selectedRequirements.filter(r => uploads.some(u => u.req_id === r.req_id)).length;
  const allSelectedDocumentsUploaded = selectedCount > 0 && uploadedSelectedCount === selectedCount;

  // Audit / workflow history
  const { data: historyRes } = useQuery({
    queryKey: ['business-history', activeFileNo],
    queryFn: () => misApi.businessGetHistory(activeFileNo!),
    enabled: activeMode === 'edit' && !!activeFileNo,
    staleTime: 30_000,
  });
  const history: AuditEntry[] = (historyRes?.data ?? []) as AuditEntry[];

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
    ? `Register ${clientTypeLabel(form.client_type)} File`
    : (existingFile?.file_no ?? activeFileNo ?? 'File Details');

  return (
    <Sheet open onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:w-[720px] sm:max-w-[720px] h-[100dvh] min-h-0 gap-0 overflow-hidden p-0 flex flex-col !bg-white dark:!bg-card border-l-2 border-slate-200">
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
                    {clientTypeLabel(form.client_type)}{existingFile ? ` · ${existingFile.business === 'M' ? 'Medical' : 'Non-Medical'}` : ''}
                  </span>
                  {existingFile?.entered_by && (
                    <span className="text-xs text-muted-foreground">· by {existingFile.entered_by}</span>
                  )}
                </div>
              )}
            </div>
            {activeMode === 'register' && (
              <div className="flex rounded-lg border bg-muted p-0.5 shrink-0">
                {(['R', 'S', 'C'] as const).map(ct => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => setClientType(ct)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      form.client_type === ct
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {ct === 'R' ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                    {clientTypeLabel(ct)}
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
                { value: 'documents' as const, label: `Document Upload${activeMode === 'edit' && selectedCount > 0 ? ` (${uploadedSelectedCount}/${selectedCount})` : ''}`, icon: FileCheck },
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Business Action" required>
                  <SelectField value={form.business_type} onChange={v => set('business_type', v)} options={BUSINESS_ACTIONS} placeholder="Blank" />
                </Field>
                <Field label="Coverage Type" required>
                  <SelectField value={form.business} onChange={v => set('business', v as FormState['business'])} options={[{ value: 'M', label: 'Medical' }, { value: 'N', label: 'Non Medical' }]} placeholder="Blank" />
                </Field>
                <Field label="Receive Date">
                  <Input
                    type="date"
                    value={form.receive_dt}
                    readOnly
                    aria-readonly="true"
                    className="h-8 text-sm bg-muted/60 cursor-not-allowed"
                  />
                </Field>
                <Field label="Rate Type">
                  <SelectField value={form.rate_type} onChange={v => set('rate_type', v as 'S' | 'C')} options={[{ value: 'S', label: 'Standard' }, { value: 'C', label: 'Corporate' }]} />
                </Field>
              </div>

              <SectionHeader title="Proposer Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Proposer Name" required>
                  <TextInput value={form.proposer_name} onChange={v => set('proposer_name', v)} placeholder="Full name…" />
                </Field>
                <Field label="Family / Policy Code">
                  <TextInput value={form.family_code} onChange={v => set('family_code', v)} placeholder="e.g. AAR-12345" />
                </Field>

                {isRetail && (
                  <>
                    <Field label="Client Type">
                      <Input value="Retail" readOnly disabled aria-readonly="true" className="h-8 text-sm bg-muted/60 cursor-not-allowed" />
                    </Field>
                    <Field label="National ID (NID)">
                      <TextInput value={form.nid} onChange={v => set('nid', v)} placeholder="ID number…" />
                    </Field>
                    <Field label="KRA PIN">
                      <TextInput value={form.pin_no} onChange={v => set('pin_no', v)} placeholder="PIN certificate no." />
                    </Field>
                    <div className="sm:col-span-2 flex flex-wrap items-center gap-4 sm:gap-6">
                      <CheckRow checked={form.walk_in_client === 'Y'} onChange={v => set('walk_in_client', v ? 'Y' : 'N')} label="Walk-in Client (Customer Service Only)" />
                      <CheckRow checked={form.is_mtiba} onChange={v => set('is_mtiba', v)} label="M-TIBA Card" />
                      <CheckRow checked={form.is_ipf} onChange={v => set('is_ipf', v)} label="IPF (Insurance Premium Financing)" />
                    </div>
                    {form.walk_in_client === 'Y' && (
                      <Field label="Walk-in Authorised By" required>
                        <SearchableSelect
                          value={form.walk_in_auth}
                          onChange={v => set('walk_in_auth', v)}
                            options={walkInStaff.map(e => ({ value: e.username, label: `${e.employee_name} — ${e.department}` }))}
                            placeholder="Select authoriser…"
                            searchPlaceholder="Search Membership or Nonmedical staff…"
                        />
                      </Field>
                    )}
                  </>
                )}

                {isCorp && (
                  <>
                    <Field label="Client Type">
                      <Input value={clientTypeLabel(form.client_type)} readOnly disabled aria-readonly="true" className="h-8 text-sm bg-muted/60 cursor-not-allowed" />
                    </Field>
                    <Field label="Business Category" required={form.business_type === 'N'}>
                      <SelectField value={form.corp_category} onChange={v => set('corp_category', v)} options={CORP_CATS.map(c => ({ value: c, label: c }))} placeholder="Blank" />
                    </Field>
                    <Field label="Industry Sector" required={form.business_type === 'N'}>
                      <SearchableSelect
                        value={form.sector}
                        onChange={v => set('sector', v)}
                        options={sectors.map(s => ({ value: s, label: s }))}
                        placeholder="Select sector…"
                        searchPlaceholder="Search sectors…"
                      />
                    </Field>
                    <Field label="CR12 Reference No." required={form.business_type === 'N'}>
                      <TextInput value={form.cr12_ref} onChange={v => set('cr12_ref', v)} placeholder="e.g. CR12/2024/00123" />
                    </Field>
                    <div className="sm:col-span-2 flex items-center gap-6">
                      <CheckRow checked={form.cr12} onChange={v => set('cr12', v)} label="CR12 / Certificate of Incorporation submitted" />
                    </div>
                  </>
                )}
              </div>

              <SectionHeader title="Classification" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Agent Name / Broker" required>
                  <SearchableSelect
                    value={form.agent_id}
                    onChange={v => set('agent_id', v)}
                    options={[
                      ...agents.filter(a => a.is_active || a.agent_id === form.agent_id)
                        .map(a => ({ value: a.agent_id, label: a.agent_name })),
                      ...(form.agent_id && !agents.some(a => a.agent_id === form.agent_id) && existingFile?.agent_name
                        ? [{ value: form.agent_id, label: existingFile.agent_name }] : []),
                    ]}
                    disabled={agentsLoading || agentsError}
                    placeholder={agentsLoading ? 'Loading agent names…' : 'Select agent or broker…'}
                    searchPlaceholder="Search agents and brokers…"
                  />
                  {agentsError && <p role="alert" className="text-xs text-destructive">Unable to load agent names. Please try again.</p>}
                </Field>
                <Field label="County" required={(isRetail && form.business === 'N') || (isCorp && form.business_type === 'N')}>
                  <SearchableSelect
                    value={form.county_code}
                    onChange={v => set('county_code', v)}
                    options={counties.map(c => ({ value: c, label: c }))}
                    placeholder="Select county…"
                    searchPlaceholder="Search counties…"
                  />
                </Field>
                <Field label="GI Category" required={form.business === 'N'}>
                  <SelectField value={form.gi_category} onChange={v => set('gi_category', v)} options={GI_CATS} placeholder="Blank" />
                </Field>
                <Field label="Card Type">
                  <SelectField value={form.card_type} onChange={v => set('card_type', v)} options={CARD_TYPES.map(c => ({ value: c, label: c }))} placeholder="Blank" />
                </Field>
              </div>

              <SectionHeader title="Payment" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Payment Reference No.">
                  <TextInput value={form.pay_ref_no} onChange={v => set('pay_ref_no', v)} placeholder="e.g. MPESA ref…" />
                </Field>
                <Field label="Paid Amount (KES)">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.paid_amt}
                    onChange={e => set('paid_amt', e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeMode === 'edit' || (isRetail && form.walk_in_client === 'Y')) && (
                      <>
                        <Field label="Allocated To *">
                          <SearchableSelect
                            value={form.allocated_to}
                            onChange={v => set('allocated_to', v)}
                            options={walkInStaff.map(e => ({ value: e.username, label: `${e.employee_name} — ${e.department}` }))}
                            placeholder="Assign to employee…"
                            searchPlaceholder="Search Membership or Nonmedical staff…"
                          />
                        </Field>
                        <Field label="Benefit Verified">
                          <SelectField value={form.benefit_verified} onChange={v => set('benefit_verified', v as 'YES' | 'NO')} options={[{ value: 'YES', label: 'Yes — Verified' }, { value: 'NO', label: 'No — Pending' }]} />
                        </Field>
                      </>
                    )}
                    {activeMode === 'edit' && (
                      <div className="sm:col-span-2 flex flex-wrap items-center gap-4 sm:gap-6">
                        <CheckRow checked={form.medical_uw} onChange={v => set('medical_uw', v)} label="Medical UW Reviewed" />
                        <CheckRow checked={form.invoiced} onChange={v => set('invoiced', v)} label="Invoiced" />
                      </div>
                    )}
                    {activeMode === 'register' && (
                      <div className="sm:col-span-2 flex justify-end pt-1">
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
                  <SectionHeader title={`Documents${selectedCount > 0 ? ` (${uploadedSelectedCount}/${selectedCount} uploaded)` : ''}`} />

                  {/* Progress banner */}
                  <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${allSelectedDocumentsUploaded ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50/70'}`}>
                    {allSelectedDocumentsUploaded
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-semibold ${allSelectedDocumentsUploaded ? 'text-green-800' : 'text-amber-800'}`}>
                        {allSelectedDocumentsUploaded
                          ? 'Selected documents are ready to forward'
                          : selectedCount === 0
                          ? 'Select the documents you need to upload'
                          : `${selectedCount - uploadedSelectedCount} selected document(s) still need an upload`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Choose only the documents needed for this file. Forward becomes available after every selected document is uploaded.
                      </p>
                    </div>
                  </div>

                  {/* Document rows */}
                  <div className="space-y-2">
                    {requirements.map(r => {
                      const selected = isSelected(r.req_id);
                      const docUpload = uploads.find(u => u.req_id === r.req_id);
                      return (
                        <div key={r.req_id} className={`rounded-xl border transition-colors ${docUpload ? 'border-green-200 bg-green-50/40' : selected ? 'border-blue-200 bg-blue-50/40' : 'border-border bg-card'}`}>
                          <div className="flex items-start justify-between gap-3 p-3.5">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => selected ? deselectDocMut.mutate(r.req_id) : selectDocMut.mutate(r.req_id)}
                                disabled={!!docUpload || selectDocMut.isPending || deselectDocMut.isPending}
                                aria-label={`Select ${r.req_name} for upload`}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600 disabled:cursor-not-allowed"
                              />
                              {docUpload
                                ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                : selected
                                ? <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                : <Circle className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                              }
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium leading-snug">{r.req_name}</p>
                                  {selected && !docUpload && <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0">Selected</Badge>}
                                </div>
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
                                ) : selected ? <p className="text-xs text-blue-700 mt-0.5">Upload a file to include this document in the handover.</p> : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {docUpload ? (
                                <>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => { setUploadFor(r); setPendingFile(null); }}>
                                    <Upload className="w-3 h-3" /> Replace
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteDocument({ uploadId: docUpload.upload_id, filename: docUpload.filename })}
                                    disabled={deleteUploadMut.isPending}>
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </Button>
                                </>
                              ) : selected ? (
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => { setUploadFor(r); setPendingFile(null); }}>
                                  <Upload className="w-3 h-3" /> Upload
                                </Button>
                              ) : null}
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
          {/* Document readiness sits just above the action row throughout the workflow */}
          <div className="px-5 py-2.5 border-b flex items-center justify-between bg-slate-50 dark:bg-muted/30">
            {activeMode === 'edit' ? (
              <>
              <span className="text-sm font-medium">Selected Documents</span>
              {allSelectedDocumentsUploaded ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to forward
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium">
                  {uploadedSelectedCount}/{selectedCount} uploaded
                </span>
              )}
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-muted-foreground">Selected Documents</span>
                <span className="text-xs text-muted-foreground">Save details to choose documents</span>
              </>
            )}
          </div>

          {/* Action buttons row */}
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 bg-background">
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
                  disabled={activeMode !== 'edit' || !allSelectedDocumentsUploaded || forwardMut.isPending}
                  title={activeMode !== 'edit'
                    ? 'Save the registration details before forwarding'
                    : !allSelectedDocumentsUploaded
                    ? 'Select documents and upload every selected file before forwarding'
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
                Forward to {forwardsToGi ? 'GI-Allocate' : 'BPO Review'} — {activeFileNo}
              </DialogTitle>
              <DialogDescription>
                {forwardsToGi
                  ? 'This routes the non-medical registration to GI-Allocate for General Insurance review. Add a handover note; GI will assign the file to an active recipient.'
                  : 'This creates an active BPO Review work item for the same file. Add a handover note and optionally assign a reviewer.'}
              </DialogDescription>
            </DialogHeader>
            {!allSelectedDocumentsUploaded && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Select the needed documents and upload every selected file before forwarding.</span>
              </div>
            )}
            <div className="space-y-4 py-2">
              {!forwardsToGi && <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assign BPO Reviewer</Label>
                <SearchableSelect
                  value={forwardToUser}
                  onChange={setForwardToUser}
                  options={bpoReviewers.map(e => ({ value: e.username, label: e.employee_name }))}
                  placeholder="Leave unassigned for the BPO queue…"
                  searchPlaceholder="Search BPO reviewers…"
                />
              </div>}
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
                  <><ArrowUpRight className="w-3.5 h-3.5" /> {forwardsToGi ? 'Send to GI-Allocate' : 'Forward File'}</>
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

        <AlertDialog open={!!deleteDocument} onOpenChange={open => !open && setDeleteDocument(null)}>
          <AlertDialogContent className="z-[220]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDocument
                  ? `${deleteDocument.filename} will be removed from this file and the requirement will return to pending.`
                  : 'The document will be removed from this file.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteUploadMut.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                disabled={deleteUploadMut.isPending}
                onClick={event => {
                  event.preventDefault();
                  if (!deleteDocument) return;
                  deleteUploadMut.mutate(
                    { uploadId: deleteDocument.uploadId },
                    { onSuccess: () => setDeleteDocument(null) },
                  );
                }}
              >
                {deleteUploadMut.isPending ? 'Deleting…' : 'Delete document'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type BusinessQueue = 'register' | 'bpo-retail' | 'bpo-corporate-sme';

export default function BusinessTrackingPage({ initialQueue = 'register' }: { initialQueue?: BusinessQueue }) {
  const { user } = useAuth();
  const [queue, setQueue]             = useState<BusinessQueue>(initialQueue);
  const [clientTab, setClientTab]     = useState<'ALL' | TrackingClientType>('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchBy, setSearchBy]       = useState<'P' | 'F'>('P');
  const [searchDraft, setSearchDraft] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(20);
  const [sortBy, setSortBy]           = useState('created_at');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<BusinessFile | null>(null);
  const [sheet, setSheet]             = useState<{ mode: 'closed' | 'register' | 'edit'; fileNo?: string; clientType?: TrackingClientType }>({ mode: 'closed' });
  const qc = useQueryClient();
  const { toast } = useToast();

  const params: Record<string, string> = {
    queue,
    page: String(page),
    page_size: String(pageSize),
    sort_by: sortBy,
    sort_dir: sortDir,
  };
  if (statusFilter) params.status = statusFilter;
  if (clientTab !== 'ALL') params.client_type = clientTab;
  if (appliedSearch) {
    params.search = appliedSearch;
    params.search_by = searchBy;
  }

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['business', queue, clientTab, statusFilter, appliedSearch, searchBy, page, pageSize, sortBy, sortDir],
    queryFn: () => misApi.business(params),
    staleTime: 30_000,
    refetchInterval: queue === 'register' ? 15_000 : false,
  });

  const files: BusinessFile[] = data?.data ?? [];
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const canDelete = ['superadmin', 'system admin'].includes((user?.profileName ?? '').trim().toLowerCase());

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setQueue(initialQueue);
    setStatusFilter('');
    setPage(1);
  }, [initialQueue]);

  const deleteBusinessMut = useMutation({
    mutationFn: (fileNo: string) => misApi.businessDelete(fileNo),
    onSuccess: () => {
      toast({ title: 'Tracking record deleted', description: 'The file was removed from active tracking.' });
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['business'] });
    },
    onError: (mutationError) => {
      toast({ title: 'Unable to delete record', description: String(mutationError), variant: 'destructive' });
    },
  });

  // Status counts for pills
  const countByStatus = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = files.filter(f => f.file_status === s).length;
    return acc;
  }, {});

  function openEdit(f: BusinessFile) {
    setSheet({ mode: 'edit', fileNo: f.file_no, clientType: f.client_type as TrackingClientType });
  }

  function openRegister(ct: TrackingClientType) {
    setSheet({ mode: 'register', clientType: ct });
  }

  function closeSheet() {
    setSheet({ mode: 'closed' });
  }

  function applySearch() {
    setPage(1);
    setAppliedSearch(searchDraft.trim());
  }

  function clearSearch() {
    setSearchDraft('');
    setAppliedSearch('');
    setPage(1);
  }

  function toggleSort(column: string) {
    setPage(1);
    if (sortBy === column) {
      setSortDir(direction => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  // Summary stats
  const total    = totalRecords;
  const medical  = files.filter(f => f.business === 'M').length;
  const nonMed   = files.filter(f => f.business === 'N').length;
  const retail   = files.filter(f => f.client_type === 'R').length;
  const sme      = files.filter(f => f.client_type === 'S').length;
  const corporate = files.filter(f => f.client_type === 'C').length;
  const pending  = files.filter(f => f.file_status === 'REGISTERED').length;
  const forwarded = files.filter(f => f.file_status === 'FORWARDED').length;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-screen-2xl mx-auto">
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
            <Button size="sm" className="gap-1.5" onClick={() => openRegister(clientTab === 'ALL' ? 'R' : clientTab)}>
              <Plus className="w-4 h-4" /> Register File
            </Button>
          )}
        </div>
      </div>

      {/* Summary stat cards */}
      {!isLoading && files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {[
            { label: 'Total Files',  value: total,    color: 'text-foreground' },
            { label: 'Retail',       value: retail,   color: 'text-blue-600' },
            { label: 'SME',          value: sme,      color: 'text-purple-600' },
            { label: 'Corporate',    value: corporate, color: 'text-purple-600' },
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
          {(['ALL', 'R', 'S', 'C'] as const).map(ct => (
            <button
              key={ct}
              onClick={() => { setClientTab(ct); setPage(1); }}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                clientTab === ct
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {ct === 'ALL' ? 'All Files' : ct === 'R' ? 'Retail' : ct === 'S' ? 'SME' : 'Corporate'}
              {ct === 'R' && <span className="ml-1.5 text-xs text-muted-foreground">({retail})</span>}
              {ct === 'S' && <span className="ml-1.5 text-xs text-muted-foreground">({sme})</span>}
              {ct === 'C' && <span className="ml-1.5 text-xs text-muted-foreground">({corporate})</span>}
            </button>
          ))}
        </div>

        {/* Search + status pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={searchBy} onValueChange={value => { setSearchBy(value as 'P' | 'F'); setPage(1); }}>
            <SelectTrigger className="h-8 w-full sm:w-[155px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P">Proposer Name</SelectItem>
              <SelectItem value="F">File No.</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-8 text-sm"
              placeholder={searchBy === 'F' ? 'Enter file number…' : 'Enter proposer name…'}
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applySearch();
                }
              }}
            />
          </div>
          <Button size="sm" onClick={applySearch} disabled={isFetching} className="gap-1.5">
            <Search className="w-3.5 h-3.5" />
            {isFetching && appliedSearch ? 'Searching…' : 'Search'}
          </Button>
          {(searchDraft || appliedSearch) && (
            <Button size="sm" variant="outline" onClick={clearSearch} className="gap-1.5">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => { setStatusFilter(''); setPage(1); }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                !statusFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'
              }`}
            >
              All
            </button>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(prev => prev === s ? '' : s); setPage(1); }}
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

      {/* Main Content Area */}
      {queue === 'bpo-retail' ? (
        <BpoReviewQueue
          files={files}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onSelectFile={openEdit}
          sortBy={sortBy}
          toggleSort={toggleSort}
        />
      ) : queue === 'bpo-corporate-sme' ? (
        <BpoCorporateQueue
          files={files}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onSelectFile={openEdit}
          sortBy={sortBy}
          toggleSort={toggleSort}
        />
      ) : (
        <div className="rounded-lg border overflow-x-auto bg-card shadow-sm">
          <table className="w-full min-w-[940px] text-sm">
            <thead>
              <tr className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wider">
                {[
                  { key: 'file_no', label: 'File No', align: 'text-left' },
                  { key: 'proposer_name', label: 'Proposer', align: 'text-left' },
                  { key: 'client_type', label: 'Type', align: 'text-left' },
                  { key: 'business_type', label: 'Action', align: 'text-left' },
                  { key: 'file_status', label: 'Status', align: 'text-left' },
                  { key: 'agent_name', label: 'Agent', align: 'text-left' },
                  { key: 'paid_amt', label: 'Paid', align: 'text-right' },
                  { key: 'receive_dt', label: 'Received', align: 'text-left' },
                  { key: 'note_count', label: 'Notes', align: 'text-left' },
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
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-3 py-2.5"><Skeleton className="h-4" /></td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={10} className="py-12 text-center">
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
                <td colSpan={10} className="py-16 text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No files match your filters.
                  {queue === 'register' && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => openRegister(clientTab === 'ALL' ? 'R' : clientTab)}>
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
                      {clientTypeLabel(f.client_type)}
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
                  <div className="flex items-center justify-end gap-1">
                    {canDelete && queue === 'register' && f.file_status === 'REGISTERED' && !f.forwarded && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${f.file_no}`}
                        onClick={event => {
                          event.stopPropagation();
                          setDeleteTarget(f);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* File count footer */}
      {!isLoading && !isError && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {totalRecords === 0
              ? 'No files'
              : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalRecords)} of ${totalRecords}`}
            {' '}in {queue === 'bpo-retail' || queue === 'bpo-corporate-sme' ? 'BPO Review' : 'Register'} queue
          </p>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={value => { setPageSize(Number(value)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[105px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="min-w-[78px] text-center text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(current => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || isFetching}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sheet */}
      {sheet.mode !== 'closed' && (
        queue === 'bpo-retail' && sheet.fileNo ? (
          <BpoReviewSheet
            key={sheet.fileNo}
            fileNo={sheet.fileNo}
            onClose={closeSheet}
          />
        ) : queue === 'bpo-corporate-sme' && sheet.fileNo ? (
          <BpoCorporateSheet
            key={sheet.fileNo}
            fileNo={sheet.fileNo}
            onClose={closeSheet}
          />
        ) : (
          <BusinessSheet
            key={sheet.mode === 'register' ? `register-${sheet.clientType}` : sheet.fileNo}
            mode={sheet.mode}
            fileNo={sheet.fileNo}
            initialClientType={sheet.clientType ?? (clientTab === 'ALL' ? 'R' : clientTab as TrackingClientType)}
            onClose={closeSheet}
            onSaved={(fn) => {
              closeSheet();
              qc.invalidateQueries({ queryKey: ['business'] });
              setSheet({ mode: 'edit', fileNo: fn });
            }}
          />
        )
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tracking record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${deleteTarget.file_no} for ${deleteTarget.proposer_name} will be removed from active tracking. Notes, documents, and audit history will be retained.`
                : 'This record will be removed from active tracking.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusinessMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              disabled={deleteBusinessMut.isPending}
              onClick={event => {
                event.preventDefault();
                if (deleteTarget) deleteBusinessMut.mutate(deleteTarget.file_no);
              }}
            >
              {deleteBusinessMut.isPending ? 'Deleting…' : 'Delete record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
