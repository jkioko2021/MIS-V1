import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  FolderOpen,
  History,
  Inbox,
  LifeBuoy,
  LockKeyhole,
  RefreshCw,
  Search,
  SendHorizontal,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  BusinessTransactionPanel,
  type AllocationDocumentTransaction,
} from '@/components/business/BusinessTransactionPanel';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  misApi,
  type AuditEntry,
  type AllocatedFileActionOption,
  type AllocatedFileAmlStatus,
  type AllocatedRefundLedgerSummary,
  type BusinessDoc,
  type BusinessFile,
  type BusinessNote,
  type BusinessUpload,
} from '@/lib/mis-api';
import { cn } from '@/lib/utils';

const PRODUCT_LABELS: Record<string, string> = {
  T: 'Traditional',
  S: 'Shwaari',
  AS: 'Afya Shwaari',
};

const ACTION_LABELS: Record<string, string> = {
  N: 'New',
  R: 'Renewal',
  A: 'Addon',
  T: 'Termination',
  RT: 'Reinstatement',
  CC: 'Category Change',
  PR: 'Premium Recon',
  NE: 'Nill Endorsement',
  FT: 'Fund Topup',
  SU: 'Suspension',
  LS: 'Lift Suspension',
};

const fmtDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const fmtMoney = (value?: number | null) =>
  value == null
    ? '—'
    : `KES ${Number(value).toLocaleString('en-KE', {
        minimumFractionDigits: 2,
      })}`;

const clientTypeLabel = (value: string) =>
  value === 'R' ? 'Retail' : value === 'S' ? 'SME' : 'Corporate';

const yesNo = (value: boolean | string | null | undefined) =>
  value === true || value === 'Y' || value === 'YES' ? 'Yes' : 'No';

const statusClass = (status: string) =>
  status === 'BENEFIT VERIFICATION'
    ? 'border-[#e9c98d] bg-[#fff6df] text-[#855c16]'
    : status === 'ALLOCATED'
      ? 'border-[#9dd9d4] bg-[#e4f5f2] text-[#176861]'
      : 'border-border bg-muted text-muted-foreground';

function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  const testId = `field-${label.toLowerCase().replaceAll(' ', '-')}`;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
        {label}
      </p>
      <p
        data-testid={testId}
        className="min-h-9 rounded-md border border-[#dae4e1] bg-[#f7faf8] px-3 py-2 text-sm font-medium text-foreground"
      >
        {value || '—'}
      </p>
    </div>
  );
}

type DetailedFile = BusinessFile & {
  notes: BusinessNote[];
  docs: BusinessDoc[];
};

function Unavailable({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[#c8d8d4] bg-[#f7faf8] px-6 text-center">
      <LockKeyhole className="mb-3 h-7 w-7 text-[#7c9a95]" />
      <p className="font-semibold text-[#31524e]">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function AllocatedFileSheet({
  fileNo,
  onClose,
  workspace = 'membership',
}: {
  fileNo: string;
  onClose: () => void;
  workspace?: 'membership' | 'gi';
}) {
  const isGi = workspace === 'gi';
  const [tab, setTab] = useState('register');
  const [action, setAction] = useState<AllocatedFileActionOption['code'] | ''>('');
  const [comments, setComments] = useState('');
  const [paidStatus, setPaidStatus] = useState<'FULL-PAID' | 'PART-PAID' | 'NOT-PAID' | 'CR' | ''>('');
  const [assignedTo, setAssignedTo] = useState('');
  const [documentTransaction, setDocumentTransaction] = useState<AllocationDocumentTransaction>({
    reqId: '',
    invoiceNo: '',
    amount: '',
    policyCode: '',
    riskRate: '',
    riskReason: '',
    originatingSystem: '',
  });
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fileRes, isLoading, isError } = useQuery({
    queryKey: ['allocated-business-file', workspace, fileNo],
    queryFn: () => misApi.businessAllocatedFile(fileNo),
    enabled: !!fileNo,
  });
  const { data: uploadsRes } = useQuery({
    queryKey: ['allocated-business-uploads', workspace, fileNo],
    queryFn: () => misApi.businessAllocatedUploads(fileNo),
    enabled: !!fileNo,
  });
  const { data: historyRes } = useQuery({
    queryKey: ['allocated-business-history', workspace, fileNo],
    queryFn: () => misApi.businessAllocatedHistory(fileNo),
    enabled: !!fileNo,
  });
  const {
    data: actionOptionsRes,
    isError: actionOptionsError,
    isLoading: actionOptionsLoading,
  } = useQuery({
    queryKey: ['allocated-business-action-options', workspace],
    queryFn: () => misApi.businessAllocatedActionOptions(),
    refetchInterval: 30_000,
  });
  const { data: amlStatusRes } = useQuery({
    queryKey: ['allocated-business-aml-status', workspace, fileNo],
    queryFn: () => misApi.businessAllocatedAmlStatus(fileNo),
    enabled: !!fileNo,
  });
  const { data: amlRiskReasonSourceRes } = useQuery({
    queryKey: ['aml-risk-reason-source'],
    queryFn: () => misApi.amlRiskReasons(),
    refetchInterval: 30_000,
  });
  const { data: amlSystemsRes } = useQuery({
    queryKey: ['aml-originating-systems'],
    queryFn: () => misApi.amlOriginatingSystems(),
    refetchInterval: 30_000,
  });
  const { data: destinationRes, isLoading: destinationLoading } = useQuery({
    queryKey: ['allocation-destination', workspace, action],
    queryFn: () => misApi.allocationDestination(action as AllocatedFileActionOption['code']),
    enabled: !!action,
  });

  const file = fileRes?.data as DetailedFile | undefined;
  const uploads = (uploadsRes?.data ?? []) as BusinessUpload[];
  const history = (historyRes?.data ?? []) as AuditEntry[];
  const pricingEligible = file?.rate_type === 'C' && file?.benefit_verified === 'NO';
  const giActions: AllocatedFileActionOption['code'][] = ['C', 'RI'];
  const actionOptions = ((actionOptionsRes?.data ?? []) as AllocatedFileActionOption[])
    .filter(option => workspace === 'gi' ? giActions.includes(option.code) : option.code !== 'P' || pricingEligible);
  const amlStatus = amlStatusRes?.data as AllocatedFileAmlStatus | undefined;
  const amlRiskReasonSource = amlRiskReasonSourceRes?.data;
  const selectedAction = actionOptions.find(option => option.code === action);
  const invoiceRequired = selectedAction?.requires_invoice === true;
  const paymentRequired = selectedAction?.requires_payment_status === true;
  const destination = destinationRes?.data;
  const benefitsVerified = file?.benefit_verified === 'YES';
  const canForward = workspace === 'gi' || benefitsVerified || (action === 'P' && pricingEligible);
  const notes = file?.notes ?? [];
  const docs = file?.docs ?? [];
  const selectedDocuments = docs.filter(doc => doc.is_selected);
  const invoiceRequirement = docs.find(doc => doc.req_name.trim().toLowerCase() === 'system invoice');
  const savedInvoiceNo = uploads.find(upload => upload.req_id === invoiceRequirement?.req_id && upload.invoice_no)?.invoice_no
    || file?.invoice_no || '';
  useEffect(() => {
    if (!fileRes || !uploadsRes || !savedInvoiceNo) return;
    // Restore saved evidence when reopening, without overwriting an in-progress edit.
    setDocumentTransaction(previous => previous.invoiceNo ? previous : { ...previous, invoiceNo: savedInvoiceNo });
  }, [fileRes, uploadsRes, savedInvoiceNo]);

  const actionMutation = useMutation({
    mutationFn: () =>
      misApi.businessAllocatedFileAction(fileNo, {
        action: action as AllocatedFileActionOption['code'],
        comments,
        invoice_no: invoiceRequired ? savedInvoiceNo : undefined,
        paid_status:
          paymentRequired
            ? (paidStatus as 'FULL-PAID' | 'PART-PAID' | 'NOT-PAID' | 'CR')
            : undefined,
        assigned_to: destination?.needs_assignee ? assignedTo : undefined,
      }),
    onSuccess: async response => {
      const notificationStatus = response.data.notification_status;
      const notificationMessage = notificationStatus === 'WAITING_CONFIGURATION'
        ? 'Notification saved; email was not sent because mail configuration is pending.'
        : notificationStatus === 'SENT'
          ? 'Notification email sent.'
          : notificationStatus
            ? `Notification status: ${notificationStatus}. Email delivery is not confirmed.`
            : 'No notification status was returned.';
      toast({
        title: 'Allocation action completed',
        description: workspace === 'gi' && action === 'RI'
          ? `The file moved to ${response.data.file_status}. ${notificationMessage}`
          : `The file moved to ${response.data.file_status}.${workspace === 'gi' ? ` ${notificationMessage}` : ''}`,
      });
      onClose();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['business-allocated', workspace] }),
        queryClient.invalidateQueries({
          queryKey: ['allocated-business-file', workspace, fileNo],
          refetchType: 'none',
        }),
        queryClient.invalidateQueries({
          queryKey: ['allocated-business-history', workspace, fileNo],
          refetchType: 'none',
        }),
        queryClient.invalidateQueries({ queryKey: ['business'] }),
        queryClient.invalidateQueries({ queryKey: ['pricing-review-list'] }),
        queryClient.invalidateQueries({ queryKey: ['pricing-review-detail', fileNo] }),
      ]);
    },
    onError: error =>
      toast({
        title: 'Action failed',
        description: String(error),
        variant: 'destructive',
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const document = selectedDocuments.find(item => item.req_id === documentTransaction.reqId);
      if (!document || !pendingDocumentFile) {
        throw new Error('Select a document type and file before uploading.');
      }
      if (document.req_name.toLowerCase().includes('invoice') &&
          !document.req_name.toLowerCase().includes('credit note') &&
          (documentTransaction.invoiceNo.trim().length < 20 || documentTransaction.invoiceNo.trim().length > 25)) {
        throw new Error('Invoice number is required. Enter 20–25 characters before uploading the invoice document.');
      }
      if (pendingDocumentFile.size > 10 * 1024 * 1024) {
        throw new Error('Documents must be 10 MB or smaller.');
      }

      const uploadUrlResponse = await fetch('/api/storage/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: pendingDocumentFile.name,
          size: pendingDocumentFile.size,
          contentType: pendingDocumentFile.type || 'application/octet-stream',
        }),
      });
      if (!uploadUrlResponse.ok) {
        throw new Error('Unable to prepare a secure document upload.');
      }
      const { uploadURL, objectPath } = await uploadUrlResponse.json();
      const objectUploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: pendingDocumentFile,
        headers: { 'Content-Type': pendingDocumentFile.type || 'application/octet-stream' },
      });
      if (!objectUploadResponse.ok) {
        throw new Error('The document could not be uploaded to private storage.');
      }

      return misApi.businessAllocatedRecordUpload(fileNo, {
        req_id: document.req_id,
        filename: pendingDocumentFile.name,
        filesize: pendingDocumentFile.size,
        mime_type: pendingDocumentFile.type || 'application/octet-stream',
        storage_key: objectPath,
        invoice_no: documentTransaction.invoiceNo || undefined,
        amount: documentTransaction.amount || undefined,
        policy_code: documentTransaction.policyCode || undefined,
        risk_rate: documentTransaction.riskRate || undefined,
        risk_reason: documentTransaction.riskReason || undefined,
        originating_system: documentTransaction.riskRate || documentTransaction.riskReason
          ? documentTransaction.originatingSystem || undefined : undefined,
      });
    },
    onSuccess: async () => {
      toast({ title: 'Document uploaded', description: 'The document has been added to this allocation record.' });
      setDocumentTransaction(previous => ({
        reqId: '',
        invoiceNo: previous.invoiceNo,
        amount: '',
        policyCode: '',
        riskRate: '',
        riskReason: '',
        originatingSystem: '',
      }));
      setPendingDocumentFile(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allocated-business-file', workspace, fileNo] }),
        queryClient.invalidateQueries({ queryKey: ['allocated-business-uploads', workspace, fileNo] }),
        queryClient.invalidateQueries({ queryKey: ['allocated-business-aml-status', workspace, fileNo] }),
        queryClient.invalidateQueries({ queryKey: ['allocated-business-history', workspace, fileNo] }),
      ]);
    },
    onError: error =>
      toast({
        title: 'Document upload failed',
        description: String(error),
        variant: 'destructive',
      }),
  });

  function submitAction(): void {
    if (!canForward) {
      toast({ title: 'Benefit verification required', description: 'Only eligible rate C business can be sent to Pricing before benefits are verified.', variant: 'destructive' });
      return;
    }
    if (!action) {
      toast({
        title: 'Action required',
        description: 'Select a permitted allocation handoff.',
        variant: 'destructive',
      });
      return;
    }
    if (!comments.trim()) {
      toast({
        title: 'Notes required',
        description: 'Add a short handover note before continuing.',
        variant: 'destructive',
      });
      return;
    }
    if (
      invoiceRequired &&
      (savedInvoiceNo.trim().length < 20 ||
        savedInvoiceNo.trim().length > 25)
    ) {
      toast({
        title: 'Invoice upload needed',
        description: 'Upload System Invoice with a valid invoice number before forwarding. The saved invoice reference will be used automatically.',
        variant: 'destructive',
      });
      return;
    }
    if (paymentRequired && !paidStatus) {
      toast({
        title: 'Payment status required',
        description: 'Select the payment status for this action.',
        variant: 'destructive',
      });
      return;
    }
    if (destination?.needs_assignee && !assignedTo) {
      toast({ title: 'Recipient required', description: `Select an active ${destination.team_name} recipient.`, variant: 'destructive' });
      return;
    }
    actionMutation.mutate();
  }

  return (
    <Sheet open={!!fileNo} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l-[#bdd0cc] bg-[#fbfdfc] p-0 sm:max-w-4xl"
      >
        <SheetHeader className="border-b border-[#d8e5e1] bg-[#edf6f3] px-5 py-5 pr-12 text-left sm:px-7">
          {file ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#195f5a] px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-[#f1fbf8]">
                  {file.file_no}
                </span>
                <Badge variant="outline" className={statusClass(file.file_status)}>
                  {file.file_status}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  allocated {fmtDate(file.allocate_dt)}
                </span>
              </div>
              <SheetTitle className="text-xl tracking-tight">
                {file.proposer_name}
              </SheetTitle>
              <SheetDescription>
                {ACTION_LABELS[file.business_type] ?? file.business_type} ·{' '}
                {clientTypeLabel(file.client_type)} ·{' '}
                {PRODUCT_LABELS[file.product ?? ''] ??
                  file.product ??
                  'Product not specified'}
              </SheetDescription>
            </>
          ) : (
            <>
              <SheetTitle>Allocated membership record</SheetTitle>
              <SheetDescription>Loading the original registration record…</SheetDescription>
            </>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="space-y-4 p-7">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : isError || !file ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center p-7 text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-destructive/70" />
              <p className="font-medium">Unable to load this allocated file.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The file may have moved to another operational queue.
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-7">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-[#e3efec] p-1 sm:grid-cols-5">
                  <TabsTrigger value="register" className="gap-1.5 py-2 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    Register
                  </TabsTrigger>
                  <TabsTrigger
                    value="documentation"
                    className="gap-1.5 py-2 text-xs"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Documentation
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="gap-1.5 py-2 text-xs">
                    Payment
                  </TabsTrigger>
                  <TabsTrigger value="online" className="gap-1.5 py-2 text-xs">
                    Online Products
                  </TabsTrigger>
                  <TabsTrigger value="members" className="gap-1.5 py-2 text-xs">
                    Member List
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="register" className="mt-6 space-y-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#28746e]">
                      Registration record
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      Proposer and membership details
                    </h3>
                  </div>
                  <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    {([
                      ['Receive Date', fmtDate(file.receive_dt)],
                      ['Client Type', clientTypeLabel(file.client_type)],
                      ['Action', ACTION_LABELS[file.business_type] ?? file.business_type],
                      ['Product', PRODUCT_LABELS[file.product ?? ''] ?? file.product],
                      ['Coverage', file.business === 'M' ? 'Medical' : 'Non-Medical'],
                      ['Walk-in Client', yesNo(file.walk_in_client)],
                      ['Walk-in Authorized By', file.walk_in_auth],
                      ['Agent', file.agent_name],
                      ['Allocated To', file.allocated_to],
                      ['Benefit Verified', file.benefit_verified],
                      [
                        'Rate Type',
                        file.rate_type === 'C'
                          ? 'Custom Rates'
                          : file.rate_type === 'S'
                            ? 'Standard Rates'
                            : file.rate_type,
                      ],
                      ['National ID', file.nid],
                      ['KRA PIN', file.pin_no],
                      ['County', file.county_code],
                      ['Sector', file.sector],
                      ['Category', file.gi_category],
                      ['Card Type', file.card_type],
                      ['Premium', fmtMoney(file.premium)],
                      ['Paid Amount', fmtMoney(file.paid_amt)],
                      ['Payment Mode', file.pay_mode],
                      ['Payment Reference', file.pay_ref_no],
                      ['Entered By', file.entered_by],
                    ] as Array<[string, ReactNode]>).map(([label, value]) => (
                      <ReadOnlyField key={label} label={label} value={value} />
                    ))}
                  </div>

                </TabsContent>

                <TabsContent value="documentation" className="mt-6">
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#28746e]">
                      Checklist
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      Required documentation
                    </h3>
                  </div>
                  {amlStatus?.required && (
                    <div
                      className={cn(
                        'mb-4 rounded-lg border p-3 text-sm',
                        amlStatus.valid
                          ? 'border-[#9dd9d4] bg-[#e4f5f2] text-[#176861]'
                          : 'border-[#e9c98d] bg-[#fff6df] text-[#855c16]',
                      )}
                    >
                      <p className="font-semibold">
                        AML report {amlStatus.uploaded ? 'available' : 'required'}
                      </p>
                      <p className="mt-0.5 text-xs">
                        {amlStatus.uploaded
                          ? 'This New/Renewal file can be handed to Cashier once the remaining handoff checks are complete.'
                          : 'Upload an AML Report before handing this New/Renewal file to Cashier.'}
                      </p>
                    </div>
                  )}
                  <div className="overflow-hidden rounded-lg border bg-card">
                    {docs.length === 0 ? (
                      <div className="p-10 text-center text-sm text-muted-foreground">
                        <FolderOpen className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        No document requirements selected.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {docs.map(doc => {
                          const upload = uploads.find(item => item.req_id === doc.req_id);
                          return (
                            <div key={doc.req_id} className="flex items-start gap-3 p-4">
                              <CheckCircle2
                                className={cn(
                                  'mt-0.5 h-4 w-4',
                                  upload
                                    ? 'text-emerald-600'
                                    : 'text-muted-foreground/40',
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{doc.req_name}</p>
                                {upload ? (
                                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                     <div>
                                       <p>{upload.filename} · uploaded {fmtDate(upload.uploaded_at)}</p>
                                       {upload.risk_rate && <p>AML {upload.risk_rate} · {upload.risk_reason} · System: {upload.originating_system || 'Not captured'}</p>}
                                       {(upload.invoice_no || upload.amount != null || upload.policy_code || upload.risk_rate) && (
                                         <p className="mt-0.5">
                                           {[
                                             upload.invoice_no && `Ref ${upload.invoice_no}`,
                                             upload.amount != null && fmtMoney(upload.amount),
                                             upload.policy_code && `Policy ${upload.policy_code}`,
                                             upload.risk_rate && `${upload.risk_rate} risk`,
                                           ]
                                             .filter(Boolean)
                                             .join(' · ')}
                                         </p>
                                       )}
                                     </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() =>
                                        window.open(
                                          `/api/business/allocated/${encodeURIComponent(fileNo)}/uploads/${upload.upload_id}/download`,
                                          '_blank',
                                        )
                                      }
                                    >
                                      View document
                                    </Button>
                                  </div>
                                ) : doc.is_selected ? (
                                  <p className="mt-1 text-xs font-medium text-amber-600">
                                    Pending upload
                                  </p>
                                ) : (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Not selected
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="mt-6">
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#28746e]">
                      Financial context
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">Payment record</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReadOnlyField label="Premium" value={fmtMoney(file.premium)} />
                    <ReadOnlyField label="Paid Amount" value={fmtMoney(file.paid_amt)} />
                    <ReadOnlyField label="Payment Mode" value={file.pay_mode} />
                    <ReadOnlyField
                      label="Payment Reference"
                      value={file.pay_ref_no}
                    />
                    <ReadOnlyField label="Invoice Number" value={file.invoice_no} />
                    <ReadOnlyField label="Paid Status" value={file.paid_status} />
                  </div>
                </TabsContent>

                <TabsContent value="online" className="mt-6">
                  <Unavailable
                    title="Online product source unavailable"
                    detail="This workspace does not have a current online-products data source for the selected membership. No legacy-only rows are shown."
                  />
                </TabsContent>
                <TabsContent value="members" className="mt-6">
                  <Unavailable
                    title="Member list source unavailable"
                    detail="A member list is not available from the current system schema for this file. Contact the registry team if additional source data is required."
                  />
                </TabsContent>
              </Tabs>

              <div className="mt-8 border-t border-[#d8e5e1] pt-6">
                <Tabs defaultValue="notes">
                  <TabsList className="bg-transparent p-0">
                    <TabsTrigger value="notes" className="gap-1.5 px-3 text-xs">
                      <Inbox className="h-3.5 w-3.5" />
                      Notes
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {notes.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1.5 px-3 text-xs">
                      <History className="h-3.5 w-3.5" />
                      History
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="notes" className="mt-4 space-y-3">
                    {notes.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No notes recorded for this file.
                      </div>
                    ) : (
                      notes.map(note => (
                        <div key={note.note_id} className="rounded-lg border bg-card p-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <UserRound className="h-3.5 w-3.5" />
                            <span className="font-semibold text-foreground">
                              {note.note_from}
                            </span>
                            <span>·</span>
                            <span>{fmtDate(note.note_date)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm">{note.notes}</p>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="history" className="mt-4">
                    {history.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No audit history recorded.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {history.map((entry, index) => (
                          <div key={`${entry.done_at}-${index}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                              {index < history.length - 1 && (
                                <div className="mt-1 h-full w-px bg-border" />
                              )}
                            </div>
                            <div className="pb-3">
                              <p className="text-sm font-semibold">{entry.action}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {entry.details}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                                <Clock3 className="h-3 w-3" />
                                {fmtDate(entry.done_at)} by {entry.done_by}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="mt-8 border-t border-[#d8e5e1] pt-6">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#28746e]">
                    {workspace === 'gi' ? 'GI handoff workflow' : 'Invoice / Credit Note workflow'}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{workspace === 'gi' ? 'Resolve assigned file' : 'Review and forward'}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Complete the document, payment, and accountable-destination steps from one place.
                  </p>
                </div>

                <BusinessTransactionPanel
                  documents={selectedDocuments}
                  value={documentTransaction}
                  file={pendingDocumentFile}
                  isUploading={uploadMutation.isPending}
                  riskReasonSourceAvailable={amlRiskReasonSource?.available ?? false}
                  riskReasonSourceMessage={amlRiskReasonSource?.message}
                  riskReasonOptions={amlRiskReasonSource?.reasons ?? []}
                  systemOptions={amlSystemsRes?.data?.systems ?? []}
                  onChange={setDocumentTransaction}
                  onFileChange={setPendingDocumentFile}
                  onUpload={() => uploadMutation.mutate()}
                />

                <div className="rounded-xl border border-[#a9d7d1] bg-[#e7f5f2] p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#195f5a]">
                    <SendHorizontal className="h-4 w-4" />
                    {isGi ? 'GI routing decision' : 'Forward allocation'}
                  </div>
                  {!isGi && !benefitsVerified && (
                    <p className="mt-1 text-xs text-[#356c67]">
                      {pricingEligible
                        ? 'Benefits are not verified. Select Pricing Review to forward this rate C business for review. Other destinations remain blocked until benefits are verified.'
                        : 'You may select an Action, but benefit verification must be complete before forwarding this file.'}
                    </p>
                  )}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="allocated-action">Action</Label>
                        <select
                          id="allocated-action"
                          data-testid="select-allocated-action"
                          value={action}
                          onChange={event => {
                            setAction(event.target.value as AllocatedFileActionOption['code'] | '');
                            setPaidStatus('');
                            setAssignedTo('');
                          }}
                          disabled={
                            actionMutation.isPending ||
                            actionOptionsLoading ||
                            actionOptionsError
                          }
                          className="h-9 w-full rounded-md border border-[#b9d5d0] bg-background px-2 text-sm"
                        >
                          <option value="">
                            {actionOptionsLoading ? 'Loading permitted actions…' : 'Select action…'}
                          </option>
                          {actionOptions.map(option => (
                            <option key={option.code} value={option.code}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {actionOptionsError && (
                          <p className="text-xs text-destructive">
                            Permitted handoffs could not be loaded. Please refresh and try again.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="allocated-forward-to">Forward to</Label>
                        <Input
                          id="allocated-forward-to"
                          value={destination ? `${destination.team_name} · ${destination.queue_name}` : selectedAction?.destination ?? 'Select an action first'}
                          readOnly
                          aria-live="polite"
                          className="bg-[#f2f8f6] text-[#356c67]"
                        />
                        <p className="text-xs text-muted-foreground">
                          {destination ? `Final file status: ${destination.file_status}` : 'Destination is determined by the permitted workflow action.'}
                        </p>
                      </div>
                      {destination?.needs_assignee && (
                        <div className="space-y-1.5">
                          <Label htmlFor="allocated-assignee">Accountable recipient</Label>
                          <select
                            id="allocated-assignee"
                            value={assignedTo}
                            onChange={event => setAssignedTo(event.target.value)}
                            disabled={!canForward || destinationLoading || actionMutation.isPending}
                            className="h-9 w-full rounded-md border border-[#b9d5d0] bg-background px-2 text-sm"
                          >
                            <option value="">Select {destination.team_name} recipient…</option>
                            {destination.staff.map(staff => <option key={staff.username} value={staff.username}>{staff.employee_name} ({staff.username})</option>)}
                          </select>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="allocated-payment-status">Payment</Label>
                        <select
                          id="allocated-payment-status"
                          data-testid="select-payment-status"
                          value={paidStatus}
                          onChange={event => setPaidStatus(event.target.value as typeof paidStatus)}
                          disabled={!canForward || !paymentRequired}
                          className="h-9 w-full rounded-md border border-[#b9d5d0] bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="">
                            {paymentRequired ? 'Select status…' : 'Required for Cashier, Closed, or RM'}
                          </option>
                          <option value="FULL-PAID">Full paid</option>
                          <option value="PART-PAID">Part paid</option>
                          <option value="NOT-PAID">Not paid</option>
                            <option value="CR">Credit note</option>
                        </select>
                        {!paymentRequired && (
                          <p className="text-xs text-muted-foreground">
                            Payment status is collected for Cashier, Closed, and RM handoffs.
                          </p>
                        )}
                      </div>
                      <ReadOnlyField label="Entered By" value={file.entered_by} />
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="allocated-action-notes">Notes</Label>
                        <Textarea
                          id="allocated-action-notes"
                          data-testid="input-handover-notes"
                          value={comments}
                          onChange={event => setComments(event.target.value)}
                          placeholder="Briefly explain the handover…"
                          rows={3}
                        />
                      </div>
                      <Button
                        data-testid="button-confirm-handover"
                        onClick={submitAction}
                        disabled={actionMutation.isPending || !canForward}
                        className="gap-1.5 sm:col-span-2"
                      >
                        <SendHorizontal className="h-4 w-4" />
                        {actionMutation.isPending
                          ? 'Saving action…'
                          : isGi
                            ? action === 'RI' ? 'Return to Register' : 'Forward to Cashier'
                            : 'Forward'}
                      </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function SortButton({
  label,
  column,
  sortBy,
  onSort,
}: {
  label: string;
  column: string;
  sortBy: string;
  onSort: (column: string) => void;
}) {
  return (
    <button
      type="button"
      data-testid={`sort-${column}`}
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 font-bold hover:text-foreground"
    >
      {label}
      <ArrowUpDown
        className={cn('h-3 w-3', sortBy === column ? 'text-primary' : 'opacity-30')}
      />
    </button>
  );
}

export default function AllocatedFilesPage({ workspace = 'membership' }: { workspace?: 'membership' | 'gi' }) {
  const { user } = useAuth();
  const isGi = workspace === 'gi';
  const profileLower = (user?.profileName ?? '').trim().toLowerCase();
  const departmentLower = (user?.department ?? '').trim().toLowerCase();
  const giRoleNames = ['gi', 'nonmedical', 'non medical', 'general insurance'];
  const giAccess = !!user && (
    user.profileId === 1 || user.profileId === 2
    || giRoleNames.includes(profileLower)
    || giRoleNames.includes(departmentLower)
  );
  useEffect(() => {
    const previous = document.title;
    document.title = isGi ? 'GI-Allocated | AAR MIS' : 'Allocated Files | AAR MIS';
    return () => { document.title = previous; };
  }, [isGi]);
  const [searchBy, setSearchBy] = useState<'P' | 'F'>('P');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [clientType, setClientType] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [sortBy, setSortBy] = useState('walk_in_client');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
    sort_by: sortBy,
    sort_dir: sortDir,
  };
  if (isGi) params.workspace = 'gi';
  if (search) {
    params.search = search;
    params.search_by = searchBy;
  }
  if (clientType) params.client_type = clientType;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      'business-allocated',
      workspace,
      search,
      searchBy,
      clientType,
      page,
      pageSize,
      sortBy,
      sortDir,
    ],
    queryFn: () => misApi.businessAllocated(params),
    staleTime: 30_000,
    enabled: !isGi || giAccess,
  });
  const {
    data: refundLedgerRes,
    isLoading: refundLedgerLoading,
    isFetching: refundLedgerFetching,
    refetch: refetchRefundLedger,
  } = useQuery({
    queryKey: ['allocated-refund-ledger', workspace],
    queryFn: () => misApi.businessAllocatedRefundsSummary(),
    staleTime: 30_000,
    retry: false,
    enabled: !isGi,
  });
  const files = data?.data ?? [];
  const total = data?.total ?? 0;
  const refundLedger: AllocatedRefundLedgerSummary | undefined = refundLedgerRes?.data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isSuperAdmin = user?.profileName?.trim().toLowerCase() === 'superadmin';
  const profileName = user?.profileName ?? 'BPO administrator';

  const applySearch = () => {
    setPage(1);
    setSearch(searchDraft.trim());
  };
  const clearSearch = () => {
    setPage(1);
    setSearchDraft('');
    setSearch('');
  };
  const sort = (column: string) => {
    setPage(1);
    if (sortBy === column) {
      setSortDir(value => (value === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  if (isGi && !giAccess) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f1f6f2] p-6">
        <div className="max-w-md rounded-2xl border border-[#d9e5df] bg-[#fbfdfb] p-8 text-center shadow-sm">
          <LockKeyhole className="mx-auto mb-4 h-6 w-6 text-[#4c8274]" />
          <h1 className="text-xl font-semibold text-[#193a38]">GI-Allocated access required</h1>
          <p className="mt-2 text-sm leading-6 text-[#687b77]">This queue is available to General Insurance / Non-Medical staff and administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#eef4f2]">
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-xl border border-[#b8d2ce] bg-[#1d625d] px-5 py-6 text-[#f3fbf9] shadow-sm sm:px-7">
          <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-[24px] border-[#4d9189]/20" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#b9e2dc]">
                <LifeBuoy className="h-4 w-4" />
                Operations workspace
                <span className="opacity-50">/</span>
                allocation queue
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {isGi ? 'GI-Allocated' : <>Membership update <span className="font-normal text-[#b9e2dc]">— invoice</span></>}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#d1ebe7]">
                {isGi
                  ? (isSuperAdmin ? 'Oversight view of allocated non-medical files.' : 'Non-medical files assigned to your account.')
                  : isSuperAdmin
                  ? 'Oversight queue for all allocated membership files.'
                  : 'Work queue for membership updates assigned to your account.'}{' '}
                {!isGi && 'Walk-in files surface first for fast handling.'}
              </p>
            </div>
            <Button
              data-testid="button-refresh-allocated"
              variant="outline"
              size="sm"
              onClick={() => {
                void Promise.all([refetch(), ...(isGi ? [] : [refetchRefundLedger()])]);
              }}
              disabled={isFetching || (!isGi && refundLedgerFetching)}
              className="border-[#8fc4bd] bg-transparent text-[#f3fbf9] hover:bg-[#397a74]"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', (isFetching || (!isGi && refundLedgerFetching)) && 'animate-spin')} />
              Refresh queue
            </Button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[#cbded9] bg-[#fbfdfc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
              {isGi ? (isSuperAdmin ? 'GI allocated files' : 'Assigned to you') : isSuperAdmin ? 'Allocated files' : 'Assigned to you'}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p data-testid="text-allocation-total" className="font-mono text-3xl font-bold text-[#195f5a]">
                {total}
              </p>
              <UserRound className="h-5 w-5 text-[#6a9d96]" />
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {isGi ? (isSuperAdmin ? 'Administrator oversight' : user?.username) : isSuperAdmin ? 'All administrators' : user?.username}
            </p>
          </div>
          <div className="rounded-lg border border-[#cbded9] bg-[#fbfdfc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
              {isGi ? 'Non-medical on page' : 'Medical on page'}
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-mono text-3xl font-bold text-[#195f5a]">
                {files.filter(file => isGi ? file.business !== 'M' : file.business === 'M').length}
              </p>
              <CheckCircle2 className="h-5 w-5 text-[#6a9d96]" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isGi ? 'GI operational scope' : 'Benefit verification complete'}
            </p>
          </div>
          <div className="rounded-lg border border-[#cbded9] bg-[#fbfdfc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
              Signed in as
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="truncate text-lg font-bold text-[#31524e]">{profileName}</p>
              <Clock3 className="h-5 w-5 text-[#c8943c]" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isSuperAdmin ? 'Oversight view' : isGi ? 'Personal GI queue' : 'Personal allocation queue'}
            </p>
          </div>
          {!isGi && <div data-testid="allocated-refund-summary" className="rounded-lg border border-[#ead5a9] bg-[#fffaf0] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a651c]">
              Refunds allocated
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p data-testid="text-allocated-refund-count" className="font-mono text-3xl font-bold text-[#855c16]">
                {refundLedgerLoading ? '…' : refundLedger?.available ? refundLedger.allocated_count : '—'}
              </p>
              <FileText className="h-5 w-5 text-[#c8943c]" />
            </div>
            <p className="mt-1 text-xs text-[#8a651c]">
              {refundLedgerLoading
                ? 'Checking the CRM refund ledger…'
                : refundLedger?.available
                  ? `${refundLedger.allocated_admin_count} administrator${refundLedger.allocated_admin_count === 1 ? '' : 's'} in scope`
                  : 'CRM refund source unavailable'}
            </p>
          </div>}
        </section>

        {!isGi && <section
          data-testid="allocated-refund-details"
          className="overflow-hidden rounded-xl border border-[#ead5a9] bg-[#fffdf7] shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0dfba] bg-[#fff7e6] px-4 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#855c16]">
                <FileText className="h-4 w-4" />
                Allocated refunds
              </div>
              <p className="mt-1 text-xs text-[#8a651c]">
                Live, read-only amounts and payee details from the CRM refund ledger.
              </p>
            </div>
            {refundLedger?.available && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-[#e7c985] bg-white px-2.5 py-1 font-semibold text-[#855c16]">
                  Refund amount: {fmtMoney(refundLedger.total_refund_amount)}
                </span>
                <span className="rounded-full border border-[#e7c985] bg-white px-2.5 py-1 font-semibold text-[#855c16]">
                  Amount paid: {fmtMoney(refundLedger.total_amount_paid)}
                </span>
              </div>
            )}
          </div>
          {refundLedgerLoading ? (
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : !refundLedger?.available ? (
            <div className="flex min-h-28 items-center gap-3 px-4 py-6 text-sm text-[#855c16]">
              <LockKeyhole className="h-5 w-5 shrink-0 text-[#c8943c]" />
              <div>
                <p className="font-semibold">Refund ledger unavailable</p>
                <p className="mt-1 text-xs text-[#8a651c]">
                  {refundLedger?.message ?? 'The CRM refund ledger could not be reached. Refund amounts and payee details are hidden.'}
                </p>
              </div>
            </div>
          ) : refundLedger.records.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No active, requested, allocated, and unprocessed refunds are currently in your scope.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead>
                  <tr className="border-b border-[#f0dfba] bg-[#fffaf0] text-left text-[10px] uppercase tracking-[.12em] text-[#8a651c]">
                    <th className="px-4 py-3">Refund no.</th>
                    <th className="px-4 py-3">File no.</th>
                    <th className="px-4 py-3">Payee</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-right">Refund amount</th>
                    <th className="px-4 py-3 text-right">Amount paid</th>
                    <th className="px-4 py-3">Status</th>
                    {isSuperAdmin && <th className="px-4 py-3">Allocated to</th>}
                  </tr>
                </thead>
                <tbody>
                  {refundLedger.records.map(refund => (
                    <tr
                      key={refund.refund_id ?? refund.refund_no ?? `${refund.file_no}-${refund.allocate_dt}`}
                      data-testid={`row-allocated-refund-${refund.refund_id ?? refund.refund_no ?? refund.file_no}`}
                      className="border-b border-[#f7e8ca] last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#855c16]">
                        {refund.refund_no ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{refund.file_no ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{refund.payee_name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{refund.payee_email ?? '—'}</div>
                        <div className="mt-0.5">{refund.payee_mobile ?? '—'}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-[#855c16]">
                        {fmtMoney(refund.refund_amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{fmtMoney(refund.amount_paid)}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded-full border border-[#ead5a9] bg-[#fffaf0] px-2 py-1 font-medium text-[#855c16]">
                          {refund.refund_status ?? '—'}
                        </span>
                      </td>
                      {isSuperAdmin && <td className="px-4 py-3 text-xs font-medium">{refund.allocate_to ?? '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>}

        <section className="rounded-lg border border-[#cbded9] bg-[#fbfdfc] p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <Label htmlFor="allocated-search" className="sr-only">
                Search allocated files
              </Label>
              <div className="relative min-w-[190px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#62918b]" />
                <Input
                  id="allocated-search"
                  data-testid="input-allocated-search"
                  value={searchDraft}
                  onChange={event => setSearchDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') applySearch();
                  }}
                  placeholder={
                    searchBy === 'F' ? 'Search by file number' : 'Search by proposer name'
                  }
                  className="border-[#cbded9] bg-[#f7faf8] pl-9"
                />
              </div>
              <select
                aria-label="Search field"
                data-testid="select-search-field"
                value={searchBy}
                onChange={event => {
                  setSearchBy(event.target.value as 'P' | 'F');
                  setPage(1);
                }}
                className="h-9 rounded-md border border-[#cbded9] bg-[#f7faf8] px-2 text-sm"
              >
                <option value="P">Proposer Name</option>
                <option value="F">File No.</option>
              </select>
              <Button data-testid="button-search-allocated" size="sm" onClick={applySearch}>
                Search
              </Button>
              {search && (
                <Button data-testid="button-clear-search" size="sm" variant="ghost" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 border-t border-[#e0ebe8] pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
                Client
              </span>
              {[
                { value: '', label: 'All' },
                { value: 'R', label: 'Retail' },
                { value: 'S', label: 'SME' },
                { value: 'C', label: 'Corporate' },
              ].map(option => (
                <Button
                  key={option.value || 'all'}
                  data-testid={`filter-client-${option.value || 'all'}`}
                  size="sm"
                  variant={clientType === option.value ? 'default' : 'outline'}
                  onClick={() => {
                    setClientType(option.value);
                    setPage(1);
                  }}
                  className="h-8"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#cbded9] bg-[#fbfdfc] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#dbe8e4] bg-[#e5f0ed] px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-[#31524e]">Business update queue</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select a record to review its registration and complete the operational handoff.
              </p>
            </div>
            <span className="font-mono text-xs text-[#397a74]">
              {isFetching ? 'SYNCING' : 'READY'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead>
                <tr className="border-b border-[#dbe8e4] bg-[#f3f8f6] text-left text-[10px] uppercase tracking-[.12em] text-muted-foreground">
                  {[
                    ['Receive Date', 'receive_dt'],
                    ['Allocate Date', 'allocate_dt'],
                    ['File No.', 'file_no'],
                    ['Proposer', 'proposer_name'],
                    ['Client', 'client_type'],
                    ['Action', 'business_type'],
                    ['Walk-in', 'walk_in_client'],
                  ].map(([label, column]) => (
                    <th key={column} className="px-4 py-3">
                      <SortButton label={label} column={column} sortBy={sortBy} onSort={sort} />
                    </th>
                  ))}
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">
                    <SortButton label="Allocated To" column="allocated_to" sortBy={sortBy} onSort={sort} />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton label="Status" column="file_status" sortBy={sortBy} onSort={sort} />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b">
                      {Array.from({ length: 11 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-4">
                          <Skeleton className="h-4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={11} className="py-14 text-center">
                      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive/70" />
                      <p className="font-medium">Unable to load the allocation queue.</p>
                      <p className="mt-1 text-xs text-muted-foreground">{String(error)}</p>
                      <Button data-testid="button-retry-allocated" size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
                        Try again
                      </Button>
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center">
                      <FileText className="mx-auto mb-3 h-9 w-9 text-[#84aaa4]" />
                      <p className="font-semibold text-[#31524e]">No allocated files found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {search || clientType
                          ? 'Try clearing your filters.'
                          : 'Files allocated to your account will appear here.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  files.map(file => (
                    <tr
                      key={file.file_no}
                      data-testid={`row-allocated-${file.file_no}`}
                      tabIndex={0}
                      className="group cursor-pointer border-b border-[#e4eeeb] transition-colors hover:bg-[#edf7f4] focus:bg-[#edf7f4] last:border-0"
                      onClick={() => setSelectedFile(file.file_no)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          setSelectedFile(file.file_no);
                        }
                      }}
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{fmtDate(file.receive_dt)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">{fmtDate(file.allocate_dt)}</td>
                      <td className="px-4 py-4"><span className="rounded bg-[#e5f2ef] px-2 py-1 font-mono text-xs font-bold text-[#195f5a]">{file.file_no}</span></td>
                      <td className="max-w-[210px] truncate px-4 py-4 font-semibold">{file.proposer_name}</td>
                      <td className="px-4 py-4 text-xs font-bold text-[#397a74]">{clientTypeLabel(file.client_type)}</td>
                      <td className="px-4 py-4 text-xs">{ACTION_LABELS[file.business_type] ?? file.business_type}</td>
                      <td className="px-4 py-4 text-xs"><span className={cn('rounded-full border px-2 py-1 font-medium', file.walk_in_client === 'Y' ? 'border-[#a8d6c7] bg-[#e8f6ef] text-[#247052]' : 'border-[#d4dfdc] bg-[#f4f7f6] text-[#607570]')}>{file.walk_in_client === 'Y' ? 'Walk-in' : 'Agency'}</span></td>
                      <td className="px-4 py-4 text-xs">{PRODUCT_LABELS[file.product ?? ''] ?? file.product ?? '—'}</td>
                      <td className="px-4 py-4 text-xs font-medium">{file.allocated_to || '—'}</td>
                      <td className="px-4 py-4"><span data-testid={`status-${file.file_no}`} className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(file.file_status)}`}>{file.file_status}</span></td>
                       <td className="px-4 py-4 text-right">
                         <Button
                           type="button"
                           size="sm"
                           variant="outline"
                           data-testid={`button-open-allocated-${file.file_no}`}
                           onClick={event => {
                             event.stopPropagation();
                             setSelectedFile(file.file_no);
                           }}
                           className="h-8 border-[#a8d1ca] bg-[#f7fbfa] text-xs text-[#28746e] hover:bg-[#e5f3ef]"
                         >
                           Open
                         </Button>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dbe8e4] bg-[#f3f8f6] px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {total === 0 ? '0 files' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} files`}
            </p>
            <div className="flex items-center gap-2">
              <Button data-testid="button-previous-page" size="sm" variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</Button>
              <span className="min-w-[90px] text-center text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button data-testid="button-next-page" size="sm" variant="outline" disabled={page >= totalPages || isFetching} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>Next</Button>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
          <LifeBuoy className="h-3.5 w-3.5 text-[#397a74]" />
          Registration, refund amounts, and payee details are read-only. Refund processing controls remain separate from this view.
        </p>
      </div>
      {selectedFile && (
        <AllocatedFileSheet
          fileNo={selectedFile}
          onClose={() => setSelectedFile(null)}
          workspace={workspace}
        />
      )}
    </div>
  );
}