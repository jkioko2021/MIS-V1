import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { misApi, type BusinessFile, type BusinessNote, type BusinessDoc, type BusinessUpload, type AuditEntry } from '@/lib/mis-api';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, FileText, Download, MessageSquare, SendHorizontal, AlertCircle, Clock, Pencil, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="text-sm font-medium bg-muted/30 px-3 py-2 rounded-md border border-transparent">{value || '—'}</div>
    </div>
  );
}

function SearchableSelect({ value, onChange, options, placeholder }: any) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal h-9">
          {selected ? selected.label : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((o: any) => (
                <CommandItem key={o.value} value={o.label} onSelect={() => { onChange(o.value); setOpen(false); }}>
                  <Check className={cn('mr-2 h-4 w-4', value === o.value ? 'opacity-100' : 'opacity-0')} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function BpoReviewSheet({ fileNo, onClose }: { fileNo: string; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('register');
  
  // Action form state
  const [product, setProduct] = useState<'T' | 'S' | 'AS' | ''>('');
  const [action, setAction] = useState<'RI' | 'A' | 'MU' | 'HO' | 'CA' | ''>('');
  const [allocatedTo, setAllocatedTo] = useState('');
  const [comments, setComments] = useState('');
  const [editingDetails, setEditingDetails] = useState(false);
  const [reviewFields, setReviewFields] = useState({
    business_type: '',
    business: '',
    nid: '',
    pin_no: '',
    county_code: '',
    card_type: '',
    pay_mode: '',
  });

  // Data fetching
  const { data: fileRes, isLoading } = useQuery({
    queryKey: ['business-file', fileNo],
    queryFn: () => misApi.businessFile(fileNo),
  });
  
  const { data: uploadsRes } = useQuery({
    queryKey: ['business-uploads', fileNo],
    queryFn: () => misApi.businessListUploads(fileNo),
  });
  
  const { data: historyRes } = useQuery({
    queryKey: ['business-history', fileNo],
    queryFn: () => misApi.businessGetHistory(fileNo),
  });

  const { data: membersAdminRes } = useQuery({
    queryKey: ['walk-in-staff'],
    queryFn: () => misApi.walkInStaff(),
  });

  const file = fileRes?.data as (BusinessFile & { notes: BusinessNote[]; docs: BusinessDoc[] }) | undefined;
  const uploads = (uploadsRes?.data ?? []) as BusinessUpload[];
  const history = (historyRes?.data ?? []) as AuditEntry[];
  const membersAdminOptions = (membersAdminRes?.data ?? [])
    .filter(employee => employee.department === 'MEMBERSHIP')
    .map(employee => ({ value: employee.username, label: employee.employee_name }));
  const docs = file?.docs ?? [];
  const notes = file?.notes ?? [];

  useEffect(() => {
    if (!file) return;
    setReviewFields({
      business_type: file.business_type ?? '',
      business: file.business ?? '',
      nid: file.nid ?? '',
      pin_no: file.pin_no ?? '',
      county_code: file.county_code ?? '',
      card_type: file.card_type ?? '',
      pay_mode: file.pay_mode ?? '',
    });
  }, [file]);

  const updateMut = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('File details are not loaded.');
      const fileWithWalkInAuth = file as BusinessFile & { walk_in_auth?: string | null };
      return misApi.businessUpdate(fileNo, {
        proposer_name: file.proposer_name,
        family_code: file.family_code ?? '',
        receive_dt: file.receive_dt,
        business_type: reviewFields.business_type,
        business: reviewFields.business,
        agent_id: file.agent_id ?? '',
        nid: reviewFields.nid,
        pin_no: reviewFields.pin_no,
        county_code: reviewFields.county_code,
        card_type: reviewFields.card_type,
        pay_mode: reviewFields.pay_mode,
        gi_category: file.gi_category ?? '',
        pay_ref_no: file.pay_ref_no ?? '',
        paid_amt: file.paid_amt ?? null,
        rate_type: file.rate_type ?? 'S',
        walk_in_client: file.walk_in_client,
        walk_in_auth: fileWithWalkInAuth.walk_in_auth ?? '',
        allocated_to: file.allocated_to ?? '',
        is_mtiba: file.is_mtiba,
        is_ipf: file.is_ipf,
        medical_uw: file.medical_uw,
        benefit_verified: file.benefit_verified,
        invoiced: file.invoiced,
      });
    },
    onSuccess: () => {
      toast({ title: 'Review details updated' });
      setEditingDetails(false);
      qc.invalidateQueries({ queryKey: ['business-file', fileNo] });
      qc.invalidateQueries({ queryKey: ['business'] });
    },
    onError: (error) => toast({ title: 'Unable to update file', description: String(error), variant: 'destructive' }),
  });

  const reviewMut = useMutation({
    mutationFn: () => misApi.businessReviewAction(fileNo, {
      action: action as any,
      product: product as any,
      allocated_to: allocatedTo,
      comments,
      queue_name: 'BPO_REVIEW_RETAIL',
    }),
    onSuccess: () => {
      toast({ title: 'Action recorded successfully' });
      qc.invalidateQueries({ queryKey: ['business'] });
      onClose();
    },
    onError: (e) => toast({ title: 'Action failed', description: String(e), variant: 'destructive' }),
  });

  function handleSubmit() {
    if (!product) { toast({ title: 'Validation', description: 'Product is required.', variant: 'destructive' }); return; }
    if (!action) { toast({ title: 'Validation', description: 'Action is required.', variant: 'destructive' }); return; }
    if (action === 'A' && !allocatedTo) { toast({ title: 'Validation', description: 'Membership Admin is required for Allocation.', variant: 'destructive' }); return; }
    if (!comments.trim()) { toast({ title: 'Validation', description: 'Notes are required.', variant: 'destructive' }); return; }
    
    reviewMut.mutate();
  }

  if (isLoading || !file) {
    return (
      <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full max-w-4xl p-6 sm:max-w-4xl">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-48 rounded bg-muted" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-4xl p-0 flex flex-col sm:max-w-4xl border-l shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary font-mono px-2 py-0.5 rounded text-sm font-semibold">{file.file_no}</span>
              <h2 className="text-xl font-bold tracking-tight">{file.proposer_name}</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Review and allocation workspace</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={editingDetails ? 'secondary' : 'outline'}
            onClick={() => setEditingDetails(value => !value)}
            disabled={updateMut.isPending}
            className="gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            {editingDetails ? 'Cancel Edit' : 'Edit Details'}
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: Details and Data */}
          <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="online">Online Products</TabsTrigger>
              </TabsList>

              <TabsContent value="register" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <ReadOnlyField label="Receive Date" value={fmtDate(file.receive_dt)} />
                  <ReadOnlyField label="Proposer" value={file.proposer_name} />
                  <ReadOnlyField label="Client Type" value={file.client_type === 'R' ? 'Retail' : file.client_type === 'S' ? 'SME' : 'Corporate'} />
                  {editingDetails ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">National ID</Label>
                      <Input value={reviewFields.nid} onChange={event => setReviewFields(fields => ({ ...fields, nid: event.target.value }))} className="h-9" />
                    </div>
                  ) : <ReadOnlyField label="National ID" value={file.nid} />}
                  {editingDetails ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">KRA PIN</Label>
                      <Input value={reviewFields.pin_no} onChange={event => setReviewFields(fields => ({ ...fields, pin_no: event.target.value }))} className="h-9" />
                    </div>
                  ) : <ReadOnlyField label="KRA PIN" value={file.pin_no} />}
                  <ReadOnlyField label="Agent" value={file.agent_name} />
                  {editingDetails ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">County</Label>
                      <Input value={reviewFields.county_code} onChange={event => setReviewFields(fields => ({ ...fields, county_code: event.target.value }))} className="h-9" />
                    </div>
                  ) : <ReadOnlyField label="County" value={file.county_code} />}
                  {editingDetails ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Business Coverage</Label>
                      <Select value={reviewFields.business} onValueChange={value => setReviewFields(fields => ({ ...fields, business: value }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Medical</SelectItem>
                          <SelectItem value="N">Non-Medical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : <ReadOnlyField label="Business Coverage" value={file.business === 'M' ? 'Medical' : 'Non-Medical'} />}
                  {editingDetails ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Action Type</Label>
                      <Select value={reviewFields.business_type} onValueChange={value => setReviewFields(fields => ({ ...fields, business_type: value }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N">New</SelectItem>
                          <SelectItem value="R">Renewal</SelectItem>
                          <SelectItem value="A">Addon</SelectItem>
                          <SelectItem value="T">Termination</SelectItem>
                          <SelectItem value="RT">Reinstatement</SelectItem>
                          <SelectItem value="CC">Category Change</SelectItem>
                          <SelectItem value="PR">Premium Recon</SelectItem>
                          <SelectItem value="NE">Nill Endorsement</SelectItem>
                          <SelectItem value="FT">Fund Topup</SelectItem>
                          <SelectItem value="SU">Suspension</SelectItem>
                          <SelectItem value="LS">Lift Suspension</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : <ReadOnlyField label="Action Type" value={file.business_type} />}
                  <ReadOnlyField label="Entered By" value={file.entered_by} />
                  <ReadOnlyField label="Medical Underwriting" value={file.medical_uw ? 'YES' : 'NO'} />
                </div>
                {editingDetails && (
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={() => updateMut.mutate()} disabled={updateMut.isPending} className="gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      {updateMut.isPending ? 'Saving…' : 'Save Details'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documentation" className="space-y-4">
                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="p-3 border-b bg-muted/40 font-semibold text-sm">Document Checklist</div>
                  {docs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                      <FileText className="w-8 h-8 opacity-20 mb-2" />
                      No document requirements selected
                    </div>
                  ) : (
                    <div className="divide-y">
                      {docs.map(doc => {
                        const upload = uploads.find(u => u.req_id === doc.req_id);
                        return (
                          <div key={doc.req_id} className="flex flex-col gap-2 p-3 text-sm hover:bg-muted/40 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {doc.is_selected ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <X className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{doc.req_name}</div>
                                {upload ? (
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="text-xs text-muted-foreground">
                                      Uploaded by {upload.uploaded_by} on {fmtDate(upload.uploaded_at)}
                                    </div>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/api/storage/objects${upload.storage_key}`, '_blank')}>
                                      <Download className="w-3 h-3 mr-1.5" /> Download
                                    </Button>
                                  </div>
                                ) : doc.is_selected ? (
                                  <div className="text-xs text-amber-600 font-medium mt-1">Pending upload</div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <ReadOnlyField label="Paid Amount" value={fmt(file.paid_amt)} />
                  {editingDetails ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Mode</Label>
                      <Select value={reviewFields.pay_mode} onValueChange={value => setReviewFields(fields => ({ ...fields, pay_mode: value }))}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MPESA">MPESA</SelectItem>
                          <SelectItem value="EFT">EFT</SelectItem>
                          <SelectItem value="CHEQ">CHEQ</SelectItem>
                          <SelectItem value="IPF">IPF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : <ReadOnlyField label="Payment Mode" value={file.pay_mode} />}
                  <ReadOnlyField label="Payment Reference" value={file.pay_ref_no} />
                </div>
              </TabsContent>

              <TabsContent value="online" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {editingDetails ? (
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Card Type</Label>
                      <Select value={reviewFields.card_type} onValueChange={value => setReviewFields(fields => ({ ...fields, card_type: value }))}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select card type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTIBA">MTIBA</SelectItem>
                          <SelectItem value="SMART">SMART</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : <ReadOnlyField label="Card Type" value={file.card_type} />}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Notes and History section */}
            <div className="mt-8 space-y-8">
              {notes.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Notes</h3>
                  <div className="space-y-2">
                    {notes.map(n => (
                      <div key={n.note_id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold">{n.note_from}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(n.note_date)}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{n.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">File History</h3>
                <div className="space-y-4">
                  {history.map((entry, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5" />
                        {idx !== history.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="text-sm font-semibold">{entry.action}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{entry.details}</div>
                        <div className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fmtDate(entry.done_at)} by {entry.done_by}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Action Area */}
          <div className="w-80 border-l bg-card flex flex-col">
            <div className="p-4 border-b font-bold text-sm bg-primary/5 text-primary flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> BPO Action Panel
            </div>
            
            <ScrollArea className="flex-1 p-5">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</Label>
                  <Select value={product} onValueChange={(v: any) => setProduct(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T">Traditional</SelectItem>
                      <SelectItem value="S">Shwaari</SelectItem>
                      <SelectItem value="AS">Afya Shwaari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</Label>
                  <Select value={action} onValueChange={(v: any) => { setAction(v); if(v !== 'A') setAllocatedTo(''); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Allocate-Membership</SelectItem>
                      <SelectItem value="RI">Return-Incomplete</SelectItem>
                      <SelectItem value="MU">Medical UW</SelectItem>
                      <SelectItem value="HO">Hold</SelectItem>
                      <SelectItem value="CA">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {action === 'A' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forward To (Admin)</Label>
                    <SearchableSelect
                      value={allocatedTo}
                      onChange={setAllocatedTo}
                      options={membersAdminOptions}
                      placeholder="Select admin..."
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Short Notes</Label>
                  <Textarea
                    placeholder="Provide context for this action..."
                    className="h-28 text-sm resize-none"
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-5 border-t bg-muted/20">
              <Button 
                className="w-full h-10 gap-2 font-bold shadow-md hover:shadow-lg transition-shadow" 
                onClick={handleSubmit}
                disabled={reviewMut.isPending}
              >
                <SendHorizontal className="w-4 h-4" />
                {reviewMut.isPending ? 'Processing...' : 'Submit Decision'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
