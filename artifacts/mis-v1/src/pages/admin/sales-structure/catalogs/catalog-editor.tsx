import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, CircleHelp, RefreshCw, UserRoundCheck } from 'lucide-react';
import {
  getGetSalesCatalogsQueryKey,
  getGetSalesStructureQueryKey,
  useCreateSalesCatalogEntry,
  useUpdateSalesCatalogEntry,
} from '@workspace/api-client-react';
import type {
  SalesCatalogDefinition,
  SalesCatalogEntry,
  SalesCatalogField,
  SalesCatalogSnapshot,
  SalesCatalogValues,
} from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { displayFieldLabel } from './catalog-display';

type CatalogEditorProps = {
  catalog: string;
  definition: SalesCatalogDefinition;
  snapshot: SalesCatalogSnapshot;
  entry?: SalesCatalogEntry;
  onClose: () => void;
};

function toErrorText(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'The catalog entry could not be saved. Your changes are still here; try again.';
}

function initialValues(definition: SalesCatalogDefinition, entry?: SalesCatalogEntry) {
  const values: Record<string, string> = {};
  for (const field of definition.fields) {
    values[field.key] = entry?.values[field.key] ?? '';
  }
  return values;
}

function fieldInputType(field: SalesCatalogField) {
  if (field.type === 'email') return 'email';
  if (field.type === 'date') return 'date';
  if (field.type === 'decimal') return 'number';
  if (field.type === 'integer') return 'number';
  return 'text';
}

export function CatalogEditor({ catalog, definition, snapshot, entry, onClose }: CatalogEditorProps) {
  const queryClient = useQueryClient();
  const createEntry = useCreateSalesCatalogEntry();
  const updateEntry = useUpdateSalesCatalogEntry();
  const [values, setValues] = useState(() => initialValues(definition, entry));
  const [employeeId, setEmployeeId] = useState(entry?.employee_id == null ? '' : String(entry.employee_id));
  const [userSearch, setUserSearch] = useState('');
  const [isActive, setIsActive] = useState(entry?.is_active ?? true);
  const [validationError, setValidationError] = useState('');
  const pending = createEntry.isPending || updateEntry.isPending;
  const error = createEntry.error || updateEntry.error;
  const selectedUser = snapshot.users.find((staff) => String(staff.employee_id) === employeeId);
  const users = useMemo(() => snapshot.users
    .filter((staff) => `${staff.employee_name} ${staff.username} ${staff.employee_id}`.toLowerCase().includes(userSearch.trim().toLowerCase()))
    .slice(0, 80), [snapshot.users, userSearch]);
  const referenceChoices = (reference: string) => {
    if (reference === 'nationals') {
      return snapshot.nationals.map((node) => ({ value: node.code, label: node.name, active: node.is_active }));
    }
    if (reference === 'branch-managers') {
      return snapshot.branch_managers.map((manager) => ({
        value: String(manager.id),
        label: manager.employee_name,
        active: manager.is_active && manager.user_eligible,
      }));
    }
    return snapshot.entries
      .filter((item) => item.catalog === reference && (!item.source_reference || item.organization_choice))
      .map((item) => ({ value: item.code, label: item.name, active: item.is_active }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setValidationError('');
  };

  const validate = () => {
    if (definition.manager && !employeeId) return 'Choose an existing MIS user for this manager enrollment.';
    for (const field of definition.fields) {
      if (field.read_only || field.key === 'ACTIVE') continue;
      const value = values[field.key] ?? '';
      if (field.required && !value.trim()) return `${field.label} is required.`;
      if (!value) continue;
      if (field.max_length > 0 && value.length > field.max_length) return `${field.label} must be ${field.max_length} characters or fewer.`;
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `Enter a valid email address for ${field.label}.`;
      if (field.type === 'integer' && !/^-?\d+$/.test(value)) return `${field.label} must be a whole number.`;
      if (field.type === 'decimal' && !/^-?\d+(?:\.\d+)?$/.test(value)) return `${field.label} must be a valid number.`;
    }
    return '';
  };

  const save = async () => {
    if (entry?.source_reference) return;
    const issue = validate();
    if (issue) {
      setValidationError(issue);
      return;
    }
    const payloadValues: SalesCatalogValues = {};
    for (const field of definition.fields) {
      if (field.read_only || field.key === 'ACTIVE') continue;
      const value = values[field.key] ?? '';
      payloadValues[field.key] = field.type === 'flag'
        ? (value === '' ? null : value === '1' ? '1' : '0')
        : value.trim() === '' ? null : value;
    }
    const data = {
      values: payloadValues,
      employee_id: definition.manager ? Number(employeeId) : null,
      is_active: isActive,
    };
    const refreshCatalogs = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetSalesCatalogsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
      ]);
    };
    if (entry) {
      updateEntry.mutate({ catalog, id: entry.id, data: { ...data, version: entry.version } }, {
        onSuccess: async () => {
          await refreshCatalogs();
          onClose();
        },
      });
    } else {
      createEntry.mutate({ catalog, data }, {
        onSuccess: async () => {
          await refreshCatalogs();
          onClose();
        },
      });
    }
  };

  if (entry?.source_reference) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f1ec] text-[#28614f]">
              {definition.manager ? <UserRoundCheck className="h-5 w-5" /> : <CircleHelp className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#598071]">{entry ? 'Edit catalog record' : 'New catalog record'}</p>
              <DialogTitle>{entry ? `Edit ${definition.title}` : `Add to ${definition.title}`}</DialogTitle>
            </div>
          </div>
          <p className="text-sm leading-5 text-muted-foreground">
            {definition.manager
              ? 'Use an existing MIS account. This enrollment records a sales role only and does not change account access or profile.'
              : 'Maintain the operational record and its sales mappings. Deactivate records instead of deleting them.'}
          </p>
        </DialogHeader>

        <div className="grid gap-x-4 gap-y-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Record ID</Label>
            <div className="flex h-10 items-center rounded-md border bg-muted/35 px-3 font-mono text-sm text-muted-foreground" data-testid="catalog-record-id">
              {entry ? entry.id : 'Generated when saved'}
            </div>
            <p className="text-[11px] text-muted-foreground">System-assigned; not editable.</p>
          </div>
          <label className="flex min-h-10 items-center gap-3 rounded-md border bg-muted/20 px-3 py-2 sm:mt-6">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-[#28614f]"
              data-testid="checkbox-catalog-active"
            />
            <span>
              <span className="block text-sm font-medium">{isActive ? 'Active record' : 'Inactive record'}</span>
              <span className="text-xs text-muted-foreground">Activation is maintained separately from field values.</span>
            </span>
          </label>

          {definition.manager && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="catalog-manager-user">MIS user <span className="text-destructive">*</span></Label>
              {entry ? (
                <div className="flex h-10 items-center rounded-md border bg-muted/35 px-3 text-sm" data-testid="catalog-manager-employee">
                  {selectedUser ? `${selectedUser.employee_name} · ${selectedUser.username}` : `Employee ID ${employeeId}`}
                  <span className="ml-auto text-xs text-muted-foreground">Fixed after enrollment</span>
                </div>
              ) : (
                <>
                  <Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Filter existing staff by name, username or ID" data-testid="input-catalog-user-search" />
                  <select
                    id="catalog-manager-user"
                    value={employeeId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setEmployeeId(nextId);
                      const user = snapshot.users.find((staff) => String(staff.employee_id) === nextId);
                      const nameField = definition.fields.find((field) => field.key === definition.name_field);
                      if (user && nameField && !values[nameField.key]?.trim()) updateValue(nameField.key, user.employee_name);
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    data-testid="select-catalog-manager-user"
                  >
                    <option value="">Choose an existing MIS user</option>
                    {users.map((staff) => <option key={staff.employee_id} value={staff.employee_id}>{staff.employee_name} · {staff.username}</option>)}
                  </select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Manager identity stays linked to the existing account; no profile, password or permissions are modified.
                  </p>
                </>
              )}
            </div>
          )}

          {definition.fields.map((field) => {
            if (field.key === 'ACTIVE') return null;
            const value = values[field.key] ?? '';
            const locked = field.read_only || (entry && field.key === definition.code_field);
            const id = `catalog-field-${field.key}`;
            const label = displayFieldLabel(field, catalog);
            const required = field.required && !field.read_only;
            const currentReferenceValue = value;
            if (field.read_only) {
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={id}>{field.label}</Label>
                  <Input
                    id={id}
                    value={field.key === 'ID' ? (entry ? String(entry.id) : 'Assigned when saved') : entry ? (entry.values[field.key] ?? '') : 'Assigned by the system'}
                    disabled
                    data-testid={`field-readonly-${field.key}`}
                  />
                  <p className="text-[11px] text-muted-foreground">{field.key === 'APPROVED_BY' ? 'Recorded by the server after approval.' : 'Read-only system field.'}</p>
                </div>
              );
            }
            const referenceOptions = field.reference ? referenceChoices(field.reference) : [];
            const existingValueUnavailable = !!entry && !!currentReferenceValue && !referenceOptions.some((option) => option.value === currentReferenceValue);
            const matchingValueInactive = !!entry && referenceOptions.some((option) => option.value === currentReferenceValue && !option.active);
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={id}>
                  {label}{required && <span className="ml-1 text-destructive">*</span>}
                  {locked && <span className="ml-2 text-[10px] font-normal text-muted-foreground">Fixed after creation</span>}
                </Label>
                {field.reference ? (
                  <select
                    id={id}
                    value={value}
                    disabled={!!locked}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-70"
                    data-testid={`field-${field.key}`}
                  >
                    <option value="">Choose {label.toLowerCase()}</option>
                    {existingValueUnavailable && <option value={currentReferenceValue}>Saved selection unavailable — choose a replacement</option>}
                    {referenceOptions.map((option) => (
                      <option key={option.value} value={option.value} disabled={!option.active && option.value !== currentReferenceValue}>
                        {option.label}{!option.active ? ' (inactive)' : ''}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'flag' ? (
                  <select
                    id={id}
                    value={value}
                    disabled={!!locked}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-70"
                    data-testid={`field-${field.key}`}
                  >
                    <option value="">Not set</option>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                ) : (
                  <Input
                    id={id}
                    type={fieldInputType(field)}
                    value={value}
                    disabled={!!locked}
                    maxLength={field.max_length || undefined}
                    step={field.type === 'decimal' ? 'any' : field.type === 'integer' ? '1' : undefined}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                    data-testid={`field-${field.key}`}
                  />
                )}
                {field.reference && matchingValueInactive && (
                  <p className="text-xs text-amber-800">This saved selection is inactive. Choose an active replacement before saving this as an active record.</p>
                )}
                {field.key === definition.code_field && entry && (
                  <p className="text-[11px] text-muted-foreground">The catalog code is immutable after creation.</p>
                )}
              </div>
            );
          })}
        </div>

        {(validationError || error) && (
          <Alert variant="destructive" data-testid="alert-catalog-save-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not save this record</AlertTitle>
            <AlertDescription>{validationError || toErrorText(error)}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="sticky bottom-0 -mx-1 border-t bg-background/95 px-1 pt-3 backdrop-blur">
          <Button variant="outline" onClick={onClose} disabled={pending} data-testid="button-cancel-catalog-entry">Cancel</Button>
          <Button onClick={save} disabled={pending} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-save-catalog-entry">
            {pending ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />{entry ? 'Save changes' : 'Create record'}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
