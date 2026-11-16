import { useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSaveGiManager, getGetGiStructureQueryKey } from '@workspace/api-client-react';
import type { GiLevel, GiManager, GiManagerDetails, GiManagerInput, GiStructureSnapshot, SalesStaff } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '../organisation/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Props = {
  manager?: GiManager;
  snapshot: GiStructureSnapshot;
  onDone: () => void;
  onCancel: () => void;
};

const emptyDetails: GiManagerDetails = {
  GI_UM_ID: '',
  GI_UM_NAME: '',
  GI_UNIT_CODE: '',
  EMAIL: '',
  HRMIS_CODE: '',
  MIS_EMP_CODE: '',
  EARN_RETAINER: false,
  NSM_CODE: '',
  VALID_FROM: '',
  VALID_TO: '',
  JOIN_DATE: '',
  RET_EFF_UPTO: '',
  RETAINER_AMT: '',
};

const categoryLabel = (level: GiLevel) => level === 'BRANCH' ? 'Branch Coordinator' : 'Unit Manager';
const levelAllowed = (user: SalesStaff, level: GiLevel) => user.user_eligible !== false
  && !(user.inactive_manager_categories ?? []).includes(level);

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block min-w-0 space-y-1.5"><span className="text-sm font-medium">{label}</span>{children}{hint && <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>}</label>;
}

function FormNotice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return <div className={cn('rounded-lg border px-4 py-3 text-sm leading-6', tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-[#d6e3da] bg-[#eaf2ec] text-[#385c4c]')}>{children}</div>;
}

function ManagerOverlay({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-[#142b25]/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="gi-manager-dialog-title" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#d9e4dd] bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
      <header className="sticky top-0 z-10 border-b bg-card/95 px-5 py-4 backdrop-blur sm:px-7"><div className="flex items-start justify-between gap-4"><div><h2 id="gi-manager-dialog-title" className="text-xl font-semibold text-[#19392e]">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">GI designation details stay separate from the verified MIS account. No user or login account is created.</p></div><Button variant="ghost" size="sm" onClick={onClose} aria-label="Close enrollment">Close</Button></div></header>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  </div>;
}

function Reason({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Field label="Reason for change" hint="Required for the audit trail.">
    <Textarea value={value} onChange={event => onChange(event.target.value)} maxLength={1000} rows={3} placeholder="Explain why this designation is being enrolled or changed" data-testid="input-gi-manager-reason" />
  </Field>;
}

export function ManagerForm({ manager, snapshot, onDone, onCancel }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const saveManager = useSaveGiManager();
  const [level, setLevel] = useState<GiLevel>(manager?.level ?? 'UNIT');
  const [employeeId, setEmployeeId] = useState(manager ? String(manager.employee_id) : '');
  // Enrollment edits must not silently activate or deactivate a designation.
  const isActive = manager?.is_active ?? false;
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState<GiManagerDetails>(manager?.details ?? emptyDetails);
  const selected = snapshot.manager_users.find(user => String(user.employee_id) === employeeId);
  const update = (field: keyof GiManagerDetails, value: string | boolean) => setDetails(current => ({ ...current, [field]: value }));
  const chooseAccount = (value: string) => {
    setEmployeeId(value);
    const account = snapshot.manager_users.find(user => String(user.employee_id) === value);
    if (!account) return;
    setDetails(current => ({
      ...current,
      GI_UM_ID: account.emp_code || '',
      GI_UM_NAME: account.employee_name,
      EMAIL: account.email || '',
      MIS_EMP_CODE: account.emp_code || '',
    }));
  };
  const userOptions = snapshot.manager_users.map(user => ({
    value: String(user.employee_id),
    label: `${user.employee_name}${user.email ? ` · ${user.email}` : ''}`,
    description: `${user.emp_code || 'MIS code not available'}${user.user_eligible === false ? ` · ${user.eligibility_note || 'Not eligible'}` : ''}`,
    disabled: (!!manager && user.employee_id !== manager.employee_id)
      || (!manager && !levelAllowed(user, level)),
  }));
  const nationalOptions = [
    { value: '', label: 'No National designation', description: 'Optional' },
    ...snapshot.nationals.map(national => ({ value: national.code, label: national.name, description: 'National Sales Manager' })),
  ];
  if (details.NSM_CODE && !nationalOptions.some(option => option.value === details.NSM_CODE)) {
    nationalOptions.push({ value: details.NSM_CODE, label: `Unresolved National · ${details.NSM_CODE}`, description: 'Retained imported value; no National mapping was inferred' });
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.EMAIL);
  const validForActivation = !!selected
    && selected.user_eligible !== false
    && levelAllowed(selected, level)
    && !!details.GI_UM_ID.trim()
    && !!details.GI_UM_NAME.trim()
    && !!details.EMAIL.trim()
    && emailValid
    && !!details.VALID_FROM
    && !!details.VALID_TO
    && (!details.EARN_RETAINER || (!!details.JOIN_DATE && !!details.RET_EFF_UPTO && !!details.RETAINER_AMT.trim()));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || reason.trim().length < 3 || (isActive && !validForActivation)) return;
    try {
      await saveManager.mutateAsync({ data: {
        id: manager?.id ?? null,
        version: manager?.version ?? 0,
        employee_id: selected.employee_id,
        level: manager?.level ?? level,
        is_active: isActive,
        details,
        reason: reason.trim(),
      } satisfies GiManagerInput });
      await queryClient.invalidateQueries({ queryKey: getGetGiStructureQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ['/api/gi-structure/history'] });
      toast({ title: 'GI Manager enrollment saved', description: `${categoryLabel(level)} designation was recorded.` });
      onDone();
    } catch (error) {
      toast({ title: 'Could not save enrollment', description: errorMessage(error), variant: 'destructive' });
    }
  };

  return <ManagerOverlay title={manager ? 'Edit GI Manager designation' : 'Enroll a GI Manager'} onClose={onCancel}>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Enrollment category" hint="Category cannot be changed after the designation is created.">
          <select disabled={!!manager} value={level} onChange={event => { setLevel(event.target.value as GiLevel); setEmployeeId(''); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="BRANCH">Branch Coordinator</option><option value="UNIT">Unit Manager</option></select>
        </Field>
        <Field label="Verified MIS Sales Manager account" hint="This existing account is the verified employee link, separate from GI_UM_ID.">
          <SearchableSelect id="gi-enrollment-user" value={employeeId} options={userOptions} onValueChange={chooseAccount} placeholder="Choose an eligible account" searchPlaceholder="Search by name or email…" emptyMessage="No eligible Sales Manager accounts." disabled={!!manager} />
        </Field>
        <Field label="Mobile Number" hint="Captured in Administration → User Enrollment. Edit the user account to update it.">
          <Input id="gi-manager-mobile" type="tel" value={selected?.mobile_no ?? manager?.mobile_no ?? ''} readOnly placeholder="Not captured on user account" />
        </Field>
      </div>
      {selected?.user_eligible === false && <FormNotice tone="warning">{selected.eligibility_note || 'This MIS account is not eligible for an active GI Manager designation. It may remain as an inactive draft.'}</FormNotice>}
      <FormNotice>{manager ? 'Saving preserves the existing designation status and imported Unit metadata.' : 'New enrollments are saved as inactive drafts.'} Assign managers to GI Units through Hierarchy Setup.</FormNotice>
      {!!manager?.source_notes?.length && <FormNotice tone="warning"><b>Original import review notes</b><ul className="mt-1 list-disc pl-5">{manager.source_notes.map(note=><li key={note}>{note}</li>)}</ul></FormNotice>}

      <section className="rounded-lg border p-4 sm:p-5">
        <div className="mb-4"><h3 className="font-semibold">GI source designation</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">These are original GI register fields. They are not aliases for the linked MIS account.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GI_UM_ID" hint={manager ? 'Original designation ID is immutable.' : selected && !selected.emp_code ? 'No MIS account code is available; enter the original GI designation ID.' : 'May default from the account code, but remains a separate GI identifier.'}>
            <Input value={details.GI_UM_ID} readOnly={!!manager} onChange={event => update('GI_UM_ID', event.target.value)} maxLength={50} />
          </Field>
          <Field label="GI_UM_NAME"><Input value={details.GI_UM_NAME} onChange={event => update('GI_UM_NAME', event.target.value)} maxLength={150} /></Field>
          <Field label="EMAIL"><Input type="email" value={details.EMAIL} onChange={event => update('EMAIL', event.target.value)} maxLength={254} /></Field>
          <Field label="MIS_EMP_CODE" hint="Optional source field; it is never replaced with a username."><Input value={details.MIS_EMP_CODE} onChange={event => update('MIS_EMP_CODE', event.target.value)} maxLength={50} /></Field>
          <Field label="HRMIS_CODE" hint="Optional for imported or incomplete records."><Input value={details.HRMIS_CODE} onChange={event => update('HRMIS_CODE', event.target.value)} maxLength={50} /></Field>
          <Field label="NSM_CODE" hint="Optional; select an existing National or retain the imported unresolved value.">
            <SearchableSelect id="gi-manager-national" value={details.NSM_CODE} options={nationalOptions} onValueChange={value => update('NSM_CODE', value)} placeholder="Choose National Sales Manager" searchPlaceholder="Search Nationals…" emptyMessage="No matching National found." />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border p-4 sm:p-5">
        <div className="mb-4"><h3 className="font-semibold">Designation validity</h3><p className="mt-1 text-xs text-muted-foreground">VALID_TO governs category activation. Retainer end dates do not expire the manager designation.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="VALID_FROM"><Input type="date" value={details.VALID_FROM} onChange={event => update('VALID_FROM', event.target.value)} /></Field>
          <Field label="VALID_TO"><Input type="date" value={details.VALID_TO} onChange={event => update('VALID_TO', event.target.value)} /></Field>
        </div>
      </section>

      <section className="rounded-lg border p-4 sm:p-5">
        <div className="mb-4"><h3 className="font-semibold">Retainer metadata</h3><p className="mt-1 text-xs text-muted-foreground">Stored as source data only. Saving this record does not trigger a payout.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2.5">
            <Checkbox id="gi-manager-earn-retainer" checked={details.EARN_RETAINER} onCheckedChange={value => update('EARN_RETAINER', value === true)} />
            <label htmlFor="gi-manager-earn-retainer" className="cursor-pointer"><span className="block text-sm font-medium">EARN_RETAINER</span><span className="block text-xs text-muted-foreground">Preserve metadata even when off.</span></label>
          </div>
          <Field label="RETAINER_AMT" hint="Decimal amount is kept as a string without rounding."><Input type="text" inputMode="decimal" value={details.RETAINER_AMT} onChange={event => update('RETAINER_AMT', event.target.value)} maxLength={25} /></Field>
          <Field label="JOIN_DATE"><Input type="date" value={details.JOIN_DATE} onChange={event => update('JOIN_DATE', event.target.value)} /></Field>
          <Field label="RET_EFF_UPTO"><Input type="date" value={details.RET_EFF_UPTO} onChange={event => update('RET_EFF_UPTO', event.target.value)} /></Field>
        </div>
      </section>
      {isActive && !validForActivation && <FormNotice tone="warning">This active designation requires a designation ID, name, valid email, validity dates and an eligible verified MIS account. An earned retainer requires join/end dates and an amount. Complete these details to save without changing its status.</FormNotice>}
      {details.NSM_CODE && !snapshot.nationals.some(national => national.code === details.NSM_CODE) && <FormNotice tone="warning">The National value is unresolved and retained from the imported record. It has not been inferred or replaced.</FormNotice>}
      <Reason value={reason} onChange={setReason} />
      {saveManager.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(saveManager.error)}</p>}
      <div className="flex flex-col-reverse justify-end gap-2 border-t pt-4 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saveManager.isPending || !selected || reason.trim().length < 3 || (isActive && !validForActivation)}>{saveManager.isPending ? 'Saving…' : 'Save designation'}</Button>
      </div>
    </form>
  </ManagerOverlay>;
}
