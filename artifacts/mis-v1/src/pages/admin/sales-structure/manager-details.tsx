import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Eye, RefreshCw, Search, UserRoundCheck } from 'lucide-react';
import {
  getGetOrganisationQueryKey,
  getGetSalesManagerMappingsQueryKey,
  getGetSalesStructureQueryKey,
  useEnrollSalesManager,
  useUpdateSalesManagerEnrollment,
} from '@workspace/api-client-react';
import type { SalesLevel, SalesManager, SalesManagerDetails, SalesManagerInput, SalesStaff } from '@workspace/api-client-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LEVELS: SalesLevel[] = ['UNIT', 'REGION', 'BRANCH', 'NATIONAL'];
const LEVEL_LABEL: Record<SalesLevel, string> = {
  UNIT: 'Unit Manager',
  REGION: 'Regional Manager',
  BRANCH: 'Branch Manager',
  NATIONAL: 'National Sales Manager',
};

function hasUsableMisCode(code?: string | null) {
  return !!code && code.length <= 50 && code.trim() === code && /^[A-Za-z0-9_-]+$/.test(code);
}

function enrollmentUnavailableReason(staff: SalesStaff, duplicate: boolean) {
  const reasons = [
    !hasUsableMisCode(staff.emp_code) ? 'MIS code missing or invalid' : '',
    duplicate ? 'Already enrolled in this category' : '',
  ].filter(Boolean);
  return reasons.join('; ');
}

type ManagerDetailsDraft = SalesManagerDetails;

const BLANK_DETAILS: ManagerDetailsDraft = {
  code: '',
  name: '',
  email: '',
  hrmis_code: '',
  mobile_no: '',
  h_tax: '',
  mis_emp_code: '',
  valid_from: '',
  valid_to: '',
};

function detailsFromStaff(staff?: SalesStaff): ManagerDetailsDraft {
  const empCode = staff?.emp_code ?? '';
  return {
    ...BLANK_DETAILS,
    code: empCode,
    name: staff?.employee_name ?? '',
    email: staff?.email ?? '',
    mis_emp_code: empCode,
  };
}

function detailsFromManager(manager: SalesManager): ManagerDetailsDraft {
  const saved = manager.details;
  const code = manager.emp_code ?? '';
  return {
    code,
    name: manager.employee_name,
    email: saved?.email?.trim() ? saved.email : manager.account_email ?? '',
    hrmis_code: saved?.hrmis_code ?? '',
    mobile_no: saved?.mobile_no ?? '',
    h_tax: saved?.h_tax ?? '',
    mis_emp_code: code,
    valid_from: saved?.valid_from ?? '',
    valid_to: saved?.valid_to ?? '',
  };
}

function validCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validateDetails(details: ManagerDetailsDraft) {
  if (!details.code.trim()) return 'CODE is required. Select an existing MIS user with a code.';
  if (details.code.length > 50 || !/^[A-Za-z0-9_-]+$/.test(details.code)) return 'CODE must be at most 50 letters, numbers, underscores or hyphens.';
  if (!details.name.trim()) return 'NAME is required.';
  if (details.name.length > 150) return 'NAME must be 150 characters or fewer.';
  if (!details.email.trim() || details.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) return 'Enter a valid manager contact EMAIL (254 characters or fewer).';
  if (!details.hrmis_code.trim() || details.hrmis_code.length > 50) return 'HRMIS_CODE is required and must be 50 characters or fewer.';
  if (!details.mobile_no.trim() || details.mobile_no.length > 50) return 'MOBILE_NO is required and must be 50 characters or fewer.';
  if (!details.h_tax || !/^(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$/.test(details.h_tax)) return 'H_TAX is required; enter a non-negative decimal with up to 9 integer and 6 fractional digits.';
  if (!details.mis_emp_code.trim() || details.mis_emp_code.length > 50) return 'MIS_EMP_CODE is required and must be 50 characters or fewer.';
  if (!validCalendarDate(details.valid_from)) return 'VALID_FROM must be a real calendar date.';
  if (!validCalendarDate(details.valid_to)) return 'VALID_TO must be a real calendar date.';
  if (details.valid_to < details.valid_from) return 'VALID_TO must be on or after VALID_FROM.';
  return '';
}

function isConflict(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const record = error as { status?: number; statusCode?: number; response?: { status?: number }; message?: string };
  return record.status === 409 || record.statusCode === 409 || record.response?.status === 409 || /409|stale|changed since/i.test(record.message ?? '');
}

function errorText(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'The change could not be saved. Your draft remains available.';
}

function DetailsField({
  id,
  label,
  value,
  onChange,
  disabled,
  readOnly,
  type = 'text',
  maxLength,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}<span className="ml-1 text-destructive">*</span></Label>
      <Input id={id} type={type} value={value} readOnly={readOnly} disabled={disabled} maxLength={maxLength}
        inputMode={id === 'manager-detail-h-tax' ? 'decimal' : undefined}
        onChange={event => onChange?.(event.target.value)}
        className={readOnly ? 'bg-muted/45 text-muted-foreground' : undefined}
        data-testid={`input-${id}`} />
      {hint && <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ManagerDetailsForm({
  users,
  managers,
  initialLevel,
  manager,
  onClose,
  onSaved,
  refreshStructure,
  refreshManager,
}: {
  users: SalesStaff[];
  managers: SalesManager[];
  initialLevel: SalesLevel;
  manager?: SalesManager;
  onClose: () => void;
  onSaved: (saved: { level: SalesLevel; is_active: boolean }) => void;
  refreshStructure: () => Promise<unknown>;
  refreshManager: (id: number) => Promise<SalesManager | undefined>;
}) {
  const queryClient = useQueryClient();
  const enroll = useEnrollSalesManager();
  const update = useUpdateSalesManagerEnrollment();
  const [editManager, setEditManager] = useState(manager);
  const [employeeId, setEmployeeId] = useState(manager ? String(manager.employee_id) : '');
  const [level, setLevel] = useState<SalesLevel>(manager?.level ?? initialLevel);
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<ManagerDetailsDraft>(() => manager ? detailsFromManager(manager) : detailsFromStaff());
  const [isActive, setIsActive] = useState(manager?.is_active ?? true);
  const [version, setVersion] = useState(manager?.version ?? 0);
  const [validationError, setValidationError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [staleConflict, setStaleConflict] = useState(false);
  const [latestManager, setLatestManager] = useState<SalesManager>();
  const [rebaseNotice, setRebaseNotice] = useState('');
  const isEditing = !!editManager;
  const pending = enroll.isPending || update.isPending;
  const matchingUsers = useMemo(() => {
    // Deduplicate the visible names, never the underlying accounts or assignments.
    // Prefer a usable account deterministically; do not guess or merge identities.
    const byName = new Map<string, SalesStaff>();
    const ordered = [...users].sort((a, b) =>
      Number(a.user_eligible === false) - Number(b.user_eligible === false)
      || Number(!hasUsableMisCode(a.emp_code)) - Number(!hasUsableMisCode(b.emp_code))
      || a.employee_id - b.employee_id);
    for (const staff of ordered) {
      const name = staff.employee_name.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
      if (!byName.has(name)) byName.set(name, staff);
    }
    return [...byName.values()].filter(staff =>
      `${staff.employee_name} ${staff.email ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
    ).sort((a, b) => a.employee_name.localeCompare(b.employee_name));
  }, [users, search]);
  const selectedUser = users.find(staff => String(staff.employee_id) === employeeId);
  const duplicate = !isEditing && managers.some(item => item.employee_id === Number(employeeId) && item.level === level);
  const missingCodeCount = users.filter(staff => !hasUsableMisCode(staff.emp_code)).length;
  const hasValidAccountCode = isEditing
    ? hasUsableMisCode(editManager?.emp_code)
    : hasUsableMisCode(selectedUser?.emp_code);
  const selectedUserEligible = !selectedUser || selectedUser.user_eligible !== false;
  const accountCanBeActive = isEditing ? editManager?.user_eligible !== false : selectedUserEligible;
  const latestIdentityChanged = !!latestManager && !!editManager && (
    latestManager.employee_id !== editManager.employee_id
    || latestManager.level !== editManager.level
    || latestManager.emp_code !== editManager.emp_code
    || latestManager.employee_name !== editManager.employee_name
  );
  const canSubmit = !pending && !staleConflict && !duplicate
    && (!isActive || accountCanBeActive)
    && (isEditing || (!!selectedUser && hasValidAccountCode));

  const updateDetails = (key: keyof ManagerDetailsDraft, value: string) => {
    setDetails(previous => ({ ...previous, [key]: value }));
    setValidationError('');
    setSaveError('');
  };

  const refreshCurrentManager = async () => {
    if (!manager) return;
    const latest = await refreshManager(manager.id);
    if (!latest) {
      setSaveError('The latest manager version could not be loaded. Your draft is unchanged; retry refresh.');
      return;
    }
    setLatestManager(latest);
    setSaveError('');
  };

  const rebaseKeepingDraft = () => {
    if (!latestManager || latestIdentityChanged) return;
    setVersion(latestManager.version);
    setStaleConflict(false);
    setSaveError('');
    setRebaseNotice(`Your draft is unchanged and is now based on the refreshed record version. Review each field before saving.`);
  };

  const reloadLatestDetails = () => {
    if (!latestManager) return;
    setEditManager(latestManager);
    setLevel(latestManager.level);
    setDetails(detailsFromManager(latestManager));
    setIsActive(latestManager.is_active);
    setVersion(latestManager.version);
    setStaleConflict(false);
    setSaveError('');
    setRebaseNotice('Latest saved manager details loaded. Review them before saving.');
  };

  const save = () => {
    if (!editManager) {
      if (!selectedUser) {
        setValidationError('Choose an eligible Sales user.');
        return;
      }
      if (selectedUser.user_eligible === false && isActive) {
        setValidationError('This account is not active and approved. Save an inactive designation; its login account will remain unchanged.');
        return;
      }
      if (!hasUsableMisCode(selectedUser.emp_code)) {
        setValidationError('Choose an existing Sales user with a usable MIS code.');
        return;
      }
      if (duplicate) {
        setValidationError('This user already has a manager designation in the selected category.');
        return;
      }
    }
    const issue = validateDetails(details);
    if (issue) {
      setValidationError(issue);
      return;
    }
    if (!canSubmit) return;
    setValidationError('');
    setSaveError('');
    setRebaseNotice('');
    if (editManager) {
      update.mutate({ id: editManager.id, data: { is_active: isActive, version, details } }, {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getGetOrganisationQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getGetSalesManagerMappingsQueryKey() }),
          ]);
          await refreshStructure();
          onSaved({ level, is_active: isActive });
          onClose();
        },
        onError: async error => {
          setSaveError(errorText(error));
          if (isConflict(error)) {
            setStaleConflict(true);
            setLatestManager(undefined);
          }
        },
      });
      return;
    }
    if (!selectedUser) return;
    const input: SalesManagerInput = {
      employee_id: selectedUser.employee_id,
      level,
      is_active: isActive,
      details,
    };
    enroll.mutate({ data: input }, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetOrganisationQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesStructureQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetSalesManagerMappingsQueryKey() }),
        ]);
        await refreshStructure();
        onSaved({ level, is_active: isActive });
        onClose();
      },
      onError: error => setSaveError(errorText(error)),
    });
  };

  const handleAccountChange = (id: string) => {
    const account = users.find(staff => String(staff.employee_id) === id);
    const alreadyEnrolled = !!account && managers.some(item => item.employee_id === account.employee_id && item.level === level);
    if (id && account && (!hasUsableMisCode(account.emp_code) || alreadyEnrolled)) {
      setEmployeeId('');
      setDetails(detailsFromStaff());
      setValidationError(enrollmentUnavailableReason(account, alreadyEnrolled)
        || 'This Sales user is not eligible for manager enrollment.');
      setSaveError('');
      return;
    }
    setEmployeeId(id);
    setDetails(detailsFromStaff(account));
    setIsActive(account?.user_eligible !== false);
    setValidationError('');
    setSaveError('');
    setRebaseNotice('');
  };

  const titleName = editManager?.employee_name ?? selectedUser?.employee_name ?? 'New manager';

  return (
    <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
      <DialogContent className="max-h-[94dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f1ec] text-[#28614f]"><UserRoundCheck className="h-5 w-5" /></span>
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#598071]">{isEditing ? 'Manager record details' : 'New manager designation'}</p><DialogTitle>{isEditing ? `Edit details · ${titleName}` : 'Enroll manager'}</DialogTitle></div>
          </div>
          <p className="text-sm leading-5 text-muted-foreground">Identity and category remain linked to an existing MIS account. Contact details here never change the employee account.</p>
        </DialogHeader>

        <div className="grid gap-x-4 gap-y-4 py-2 sm:grid-cols-2">
          {isEditing ? (
            <>
              <div className="space-y-1.5"><Label>Manager category (CATEGORY)</Label><div className="flex h-10 items-center rounded-md border bg-muted/45 px-3 text-sm">{LEVEL_LABEL[level]}</div><p className="text-[11px] text-muted-foreground">Category is fixed to preserve existing assignments.</p></div>
              <div className="space-y-1.5"><Label>Linked MIS user</Label><div className="flex min-h-10 items-center break-words rounded-md border bg-muted/45 px-3 py-2 text-sm">{[editManager?.employee_name, editManager?.account_email].filter(Boolean).join(' · ')}</div></div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="manager-level">Manager category (CATEGORY)</Label>
                <select id="manager-level" value={level} disabled={pending} onChange={event => {
                  const nextLevel = event.target.value as SalesLevel;
                  setLevel(nextLevel);
                  setEmployeeId('');
                  setDetails(detailsFromStaff());
                  setIsActive(true);
                  setValidationError('');
                  setSaveError('');
                }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" data-testid="select-manager-level">
                  {LEVELS.map(item => <option key={item} value={item}>{LEVEL_LABEL[item]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:row-span-2">
                <Label htmlFor="staff-search">Existing Sales user</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="staff-search" value={search} disabled={pending} onChange={event => setSearch(event.target.value)} placeholder="Search by name or email" className="pl-9" data-testid="input-search-staff" /></div>
                <select value={employeeId} disabled={pending} onChange={event => handleAccountChange(event.target.value)} size={Math.min(Math.max(matchingUsers.length, 2), 6)} className="w-full rounded-md border border-input bg-background p-1 text-sm disabled:opacity-60" aria-label="Choose existing staff account" data-testid="select-manager-staff">
                  {matchingUsers.length ? <option value="">Choose Sales user</option> : <option value="">{users.length === 0 ? 'No Sales users available' : 'No matching Sales users'}</option>}
                  {matchingUsers.map(staff => {
                    const alreadyEnrolled = managers.some(item => item.employee_id === staff.employee_id && item.level === level);
                    const unavailableReason = enrollmentUnavailableReason(staff, alreadyEnrolled);
                    return <option key={staff.employee_id} value={staff.employee_id} disabled={!!unavailableReason} title={unavailableReason || staff.eligibility_note || undefined}>{[staff.employee_name, staff.email].filter(Boolean).join(' · ')}</option>;
                  })}
                </select>
                {selectedUser && <p className="break-words text-xs text-muted-foreground">Selected account: {[selectedUser.employee_name, selectedUser.email].filter(Boolean).join(' · ')}</p>}
                <p className="text-xs leading-5 text-muted-foreground">Sales-only user list. Inactive users can be selected to prepare an inactive manager designation. Their login remains disabled; activate and approve the account through User Enrollment before enabling the designation.</p>
                {users.length === 0 && <p className="text-xs text-amber-800">No Sales users are available for manager enrollment.</p>}
                {missingCodeCount > 0 && <p className="text-xs leading-5 text-amber-800">{missingCodeCount} Sales user{missingCodeCount === 1 ? ' has' : 's have'} no usable MIS code and cannot be enrolled. Codes must come from the existing user record.</p>}
              </div>
            </>
          )}

          <DetailsField id="manager-detail-code" label="CODE" value={details.code} disabled={pending} readOnly hint="Read-only; copied from the selected MIS user’s existing code." />
          <DetailsField id="manager-detail-name" label="NAME" value={details.name} disabled={pending} readOnly hint="Read-only; uses the linked user’s actual name." />
          <DetailsField id="manager-detail-email" label="EMAIL" value={details.email} onChange={value => updateDetails('email', value)} disabled={pending} maxLength={254} hint="Manager contact only. Editing this does not update the MIS account email." />
          <DetailsField id="manager-detail-hrmis-code" label="HRMIS_CODE" value={details.hrmis_code} onChange={value => updateDetails('hrmis_code', value)} disabled={pending} maxLength={50} />
          <DetailsField id="manager-detail-mobile-no" label="MOBILE_NO" value={details.mobile_no} onChange={value => updateDetails('mobile_no', value)} disabled={pending} maxLength={50} hint="Stored as typed, including leading zeroes and phone punctuation." />
          <DetailsField id="manager-detail-h-tax" label="H_TAX" value={details.h_tax} onChange={value => updateDetails('h_tax', value)} disabled={pending} maxLength={16} hint="Decimal text, up to 9 integer and 6 fractional digits; trailing zeroes are retained." />
          <DetailsField id="manager-detail-mis-emp-code" label="MIS_EMP_CODE" value={details.mis_emp_code} disabled={pending} readOnly hint="Read-only; copied from the selected MIS user’s existing code." />
          <DetailsField id="manager-detail-valid-from" label="VALID_FROM" type="date" value={details.valid_from} onChange={value => updateDetails('valid_from', value)} disabled={pending} />
          <DetailsField id="manager-detail-valid-to" label="VALID_TO" type="date" value={details.valid_to} onChange={value => updateDetails('valid_to', value)} disabled={pending} />

          <label className="flex min-h-10 items-center gap-3 rounded-md border bg-muted/15 px-3 py-2 sm:col-span-2">
            <input type="checkbox" checked={isActive} disabled={pending || (!accountCanBeActive && !isActive)} onChange={event => setIsActive(event.target.checked)} className="h-4 w-4 accent-[#28614f]" data-testid="checkbox-manager-designation-active" />
            <span><span className="block text-sm font-medium">ACTIVE · {isActive ? 'Active designation' : 'Inactive designation'}</span><span className="text-xs text-muted-foreground">This changes manager designation availability only, not employee account activation.</span></span>
          </label>
        </div>

        {!hasValidAccountCode && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>MIS code is unavailable</AlertTitle><AlertDescription>The linked account has no code. CODE and MIS_EMP_CODE must use the existing user code and cannot be generated or edited here.</AlertDescription></Alert>}
        {rebaseNotice && <Alert data-testid="status-manager-rebase"><Check className="h-4 w-4" /><AlertTitle>Draft retained</AlertTitle><AlertDescription>{rebaseNotice}</AlertDescription></Alert>}
        {staleConflict && editManager && <Alert variant="destructive" data-testid="alert-manager-version-conflict"><AlertCircle className="h-4 w-4" /><AlertTitle>This manager record changed</AlertTitle><AlertDescription className="space-y-2"><span>Your details draft is unchanged. Refresh the latest record, then explicitly keep this draft on the new version or reload the latest saved details.</span>{latestManager && <span className="block">Latest record refreshed at version {latestManager.version}. {latestIdentityChanged ? 'The linked MIS identity or code also changed; reload the latest saved details before continuing.' : 'Review your draft against the latest saved values before continuing.'}</span>}</AlertDescription>
          <div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={pending} onClick={refreshCurrentManager} data-testid="button-refresh-manager-version"><RefreshCw className="mr-2 h-4 w-4" />Refresh latest record</Button>{latestManager && <><Button type="button" variant="outline" disabled={latestIdentityChanged} onClick={rebaseKeepingDraft} data-testid="button-keep-manager-draft">Keep my draft on latest version</Button><Button type="button" variant="outline" onClick={reloadLatestDetails} data-testid="button-reload-manager-details">Reload latest saved details</Button></>}</div>
        </Alert>}
        {(validationError || saveError) && <Alert variant="destructive" data-testid="alert-manager-details-error"><AlertCircle className="h-4 w-4" /><AlertTitle>Could not save manager details</AlertTitle><AlertDescription>{validationError || saveError}</AlertDescription></Alert>}

        <DialogFooter className="sticky bottom-0 -mx-1 border-t bg-background/95 px-1 pt-3 backdrop-blur">
          <Button variant="outline" onClick={onClose} disabled={pending} data-testid="button-cancel-manager-details">Cancel</Button>
          <Button onClick={save} disabled={!canSubmit} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-save-manager-details">
            {pending ? <><RefreshCw className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />{isEditing ? 'Save details' : 'Enroll manager'}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManagerDetailsView({ manager, onClose, onEdit }: {
  manager: SalesManager;
  onClose: () => void;
  onEdit: () => void;
}) {
  const details = manager.details;
  const fields: Array<[string, string]> = [
    ['CODE', manager.emp_code ?? 'Not captured'],
    ['NAME', manager.employee_name],
    ['EMAIL', details?.email ?? 'Details not captured'],
    ['HRMIS_CODE', details?.hrmis_code ?? 'Details not captured'],
    ['MOBILE_NO', details?.mobile_no ?? 'Details not captured'],
    ['H_TAX', details?.h_tax ?? 'Details not captured'],
    ['MIS_EMP_CODE', manager.emp_code ?? 'Not captured'],
    ['VALID_FROM', details?.valid_from ?? 'Details not captured'],
    ['VALID_TO', details?.valid_to ?? 'Details not captured'],
    ['CATEGORY', LEVEL_LABEL[manager.level]],
  ];
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f1ec] text-[#28614f]"><Eye className="h-5 w-5" /></span><div><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#598071]">Manager details</p><DialogTitle>{manager.employee_name}</DialogTitle></div></div>
          <p className="text-sm text-muted-foreground">{LEVEL_LABEL[manager.level]} · {manager.username}</p>
        </DialogHeader>
        {!details && <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Details not captured</AlertTitle><AlertDescription>This legacy manager designation has no saved manager details. Edit it to complete required fields; no values will be invented.</AlertDescription></Alert>}
        <dl className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
          {fields.map(([label, value]) => <div key={label} className="min-w-0 bg-card p-3"><dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd></div>)}
          <div className="bg-card p-3"><dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">ACTIVE</dt><dd className="mt-1 text-sm">{manager.is_active ? 'Active designation' : 'Inactive designation'}</dd></div>
        </dl>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={onEdit} className="gap-2 bg-[#1f5849] hover:bg-[#174536]" data-testid="button-edit-manager-details"><Check className="h-4 w-4" />Edit details</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
