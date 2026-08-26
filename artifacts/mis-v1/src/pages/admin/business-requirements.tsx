import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle, FileCog, Pencil, Plus, RefreshCw, Search,
} from 'lucide-react';
import {
  misApi,
  type BusinessRequirementInput,
  type ConfigurableBusinessRequirement,
} from '@/lib/mis-api';
import { cn } from '@/lib/utils';

type RequirementForm = Omit<BusinessRequirementInput, 'code'> & { code: string };

const EMPTY_FORM: RequirementForm = {
  doc_code: '',
  doc_name: '',
  business_type: 'B',
  client: 'R',
  active: true,
  code: '1',
};

function requirementToForm(requirement?: ConfigurableBusinessRequirement): RequirementForm {
  if (!requirement) return EMPTY_FORM;
  return {
    doc_code: requirement.doc_code,
    doc_name: requirement.doc_name,
    business_type: requirement.business_type,
    client: requirement.client,
    active: requirement.active === 1,
    code: String(requirement.code),
  };
}

function clientLabel(client: 'R' | 'C') {
  return client === 'R' ? 'Retail' : 'Corporate';
}

function RequirementDialog({
  requirement,
  onClose,
}: {
  requirement?: ConfigurableBusinessRequirement;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!requirement;
  const [form, setForm] = useState<RequirementForm>(() => requirementToForm(requirement));
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const input: BusinessRequirementInput = {
        ...form,
        code: Number(form.code),
      };
      return isEdit
        ? misApi.updateBusinessRequirement(requirement.doc_id, input)
        : misApi.createBusinessRequirement(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurable-business-requirements'] });
      toast({
        title: isEdit ? 'Requirement updated' : 'Requirement added',
        description: `${form.doc_code.trim().toUpperCase()} is ready for Business Tracking.`,
      });
      onClose();
    },
    onError: (reason: Error) => setError(reason.message),
  });

  const canSave = Boolean(
    form.doc_code.trim()
    && form.doc_name.trim()
    && form.business_type.trim()
    && Number.isInteger(Number(form.code))
    && Number(form.code) > 0,
  );

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCog className="h-5 w-5 text-blue-600" />
            {isEdit ? `Edit ${requirement.doc_code}` : 'Add Business Requirement'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="requirement-code">Requirement code <span className="text-destructive">*</span></Label>
            <Input
              id="requirement-code"
              value={form.doc_code}
              onChange={(event) => setForm((current) => ({
                ...current,
                doc_code: event.target.value.toUpperCase(),
              }))}
              placeholder="e.g. RET46"
              maxLength={20}
              className="font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Unique code used to identify the document requirement.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requirement-order">Display code <span className="text-destructive">*</span></Label>
            <Input
              id="requirement-order"
              type="number"
              min="1"
              step="1"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Controls the order within the client checklist.</p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="requirement-name">Requirement name <span className="text-destructive">*</span></Label>
            <Input
              id="requirement-name"
              value={form.doc_name}
              onChange={(event) => setForm((current) => ({ ...current, doc_name: event.target.value }))}
              placeholder="e.g. Signed application form"
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Business type <span className="text-destructive">*</span></Label>
            <Select
              value={form.business_type}
              onValueChange={(value) => setForm((current) => ({ ...current, business_type: value }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="B">B — Business Tracking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Client <span className="text-destructive">*</span></Label>
            <Select
              value={form.client}
              onValueChange={(value) => setForm((current) => ({
                ...current,
                client: value as 'R' | 'C',
              }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="R">Retail</SelectItem>
                <SelectItem value="C">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">Active requirement</span>
              <span className="block text-xs text-muted-foreground">
                Active requirements are available for selection in new Business Tracking files.
              </span>
            </span>
          </label>

          {error && (
            <Alert variant="destructive" className="sm:col-span-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Couldn’t save requirement</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSave || mutation.isPending}
            className="min-w-32"
          >
            {mutation.isPending
              ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              : isEdit ? 'Save changes' : 'Add requirement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessRequirementsPage() {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('active');
  const [dialogRequirement, setDialogRequirement] = useState<ConfigurableBusinessRequirement | null | undefined>(undefined);

  const params = {
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(clientFilter !== 'all' ? { client: clientFilter } : {}),
    ...(activeFilter !== 'all' ? { active: activeFilter } : {}),
  };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['configurable-business-requirements', search, clientFilter, activeFilter],
    queryFn: () => misApi.configurableBusinessRequirements(params),
  });
  const requirements = data?.data ?? [];
  const dialogOpen = dialogRequirement !== undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileCog className="h-6 w-6 text-blue-600" />
            Configure Business Req
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintain the document requirements available in Business Tracking.
          </p>
        </div>
        <Button data-testid="button-add-req" onClick={() => setDialogRequirement(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add requirement
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search code or requirement name…"
            className="pl-9"
            data-testid="input-search-req"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger data-testid="select-req-client" aria-label="Filter by client" className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              <SelectItem value="R">Retail</SelectItem>
              <SelectItem value="C">Corporate</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger data-testid="select-req-status" aria-label="Filter by status" className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh requirements" aria-label="Refresh requirements">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn’t load requirements</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Please refresh and try again.'}
          </AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />Loading requirements…
          </div>
        ) : requirements.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileCog className="mx-auto h-9 w-9 text-muted-foreground/40" />
            <p className="mt-3 font-medium">No matching requirements</p>
            <p className="mt-1 text-sm text-muted-foreground">Adjust the filters or add a new document requirement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Requirement</th>
                  <th className="px-4 py-3">Business type</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-center">Display code</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement, index) => (
                  <tr
                    key={requirement.doc_id}
                    className={cn('border-t transition-colors hover:bg-blue-50/30', index % 2 !== 0 && 'bg-muted/5')}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{requirement.doc_id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{requirement.doc_name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{requirement.doc_code}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline">{requirement.business_type}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={requirement.client === 'R' ? 'border-blue-200 text-blue-700' : 'border-violet-200 text-violet-700'}>
                        {clientLabel(requirement.client)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{requirement.code}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={requirement.active === 1 ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-500'}
                      >
                        {requirement.active === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-edit-req-${requirement.doc_id}`}
                        onClick={() => setDialogRequirement(requirement)}
                        className="gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{isLoading ? 'Loading requirements…' : `${requirements.length} requirement${requirements.length === 1 ? '' : 's'} shown`}</span>
        {isFetching && !isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
      </div>

      {dialogOpen && (
        <RequirementDialog
          key={dialogRequirement?.doc_id ?? 'new'}
          requirement={dialogRequirement ?? undefined}
          onClose={() => setDialogRequirement(undefined)}
        />
      )}
    </div>
  );
}