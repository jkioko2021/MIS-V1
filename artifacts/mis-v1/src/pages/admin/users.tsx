import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Search, MoreVertical, Shield, Lock, LockOpen,
  CheckCircle, XCircle, KeyRound, Pencil, RefreshCw,
  Users, AlertCircle, Copy, Check, Mail, MailWarning,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API = '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  employee_id: number;
  emp_code: string;
  username: string;
  employee_name: string;
  email: string | null;
  department: string | null;
  profile_id: number;
  profile_name: string;
  activated: boolean;
  employee_locked: boolean;
  approved: boolean;
  failed_attempts: number;
  last_login_date: string | null;
  last_password_reset: string | null;
  created_at: string;
  added_by: string | null;
}

interface Profile { profile_id: number; profile_name: string; }

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { credentials: 'include', ...init });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

const DEPARTMENTS = [
  'IT', 'MEMBERSHIP', 'CUST', 'MEDICAL', 'NONMEDICAL',
  'FINANCE', 'HR', 'COMPLIANCE', 'OPERATIONS', 'NSM',
];

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ emp }: { emp: Employee }) {
  if (emp.employee_locked)
    return <Badge variant="destructive" className="text-xs gap-1 font-normal"><Lock className="w-3 h-3" />Locked</Badge>;
  if (!emp.approved)
    return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1 font-normal"><AlertCircle className="w-3 h-3" />Pending Approval</Badge>;
  if (!emp.activated)
    return <Badge variant="outline" className="text-xs text-slate-500 gap-1 font-normal"><XCircle className="w-3 h-3" />Inactive</Badge>;
  return <Badge variant="outline" className="text-xs text-green-700 border-green-300 gap-1 font-normal"><CheckCircle className="w-3 h-3" />Active</Badge>;
}

// ─── Email cell ───────────────────────────────────────────────────────────────
function EmailCell({ email }: { email: string | null }) {
  if (!email) return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400 italic">
      <MailWarning className="w-3 h-3" />not set
    </span>
  );
  return (
    <a href={`mailto:${email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline hover:text-blue-800 transition-colors" onClick={e => e.stopPropagation()}>
      <Mail className="w-3 h-3 shrink-0" />{email}
    </a>
  );
}

// ─── Enroll / Edit Dialog ─────────────────────────────────────────────────────
function EnrollDialog({
  open, onClose, profiles, employee,
}: {
  open: boolean;
  onClose: () => void;
  profiles: Profile[];
  employee?: Employee | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!employee;

  const [form, setForm] = useState({
    username:      employee?.username      ?? '',
    employee_name: employee?.employee_name ?? '',
    email:         employee?.email         ?? '',
    department:    employee?.department    ?? '',
    profile_id:    String(employee?.profile_id ?? ''),
    activated:     employee?.activated     ?? true,
    approved:      employee?.approved      ?? false,
    password:      '',
  });
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const setField = (k: string) => (v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const emailError = emailTouched && form.email && !isValidEmail(form.email)
    ? 'Enter a valid email address'
    : emailTouched && !form.email
    ? 'Email is required'
    : '';

  const canSubmit = !!(
    form.employee_name.trim() &&
    form.profile_id &&
    form.email.trim() &&
    isValidEmail(form.email) &&
    (isEdit || form.username.trim())
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return apiFetch(`/admin/employees/${employee!.employee_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_name: form.employee_name.trim(),
            email:         form.email.trim(),
            department:    form.department,
            profile_id:    Number(form.profile_id),
          }),
        });
      }
      return apiFetch('/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:      form.username.trim(),
          employee_name: form.employee_name.trim(),
          email:         form.email.trim(),
          department:    form.department,
          profile_id:    Number(form.profile_id),
          activated:     form.activated,
          approved:      form.approved,
          password:      form.password || undefined,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-employees'] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            {isEdit ? `Edit — ${employee!.employee_name}` : 'Enroll New User'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">

          {/* Username + Password (enroll only) */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3 pb-3 border-b">
              <div className="space-y-1.5">
                <Label>Username <span className="text-red-500">*</span></Label>
                <Input
                  autoFocus
                  value={form.username}
                  onChange={e => setField('username')(e.target.value)}
                  placeholder="j.mwangi"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Used to sign in</p>
              </div>
              <div className="space-y-1.5">
                <Label>Initial Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setField('password')(e.target.value)}
                  placeholder="Default: AAR@2024!"
                />
                <p className="text-xs text-muted-foreground">Blank = system default</p>
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input
              autoFocus={isEdit}
              value={form.employee_name}
              onChange={e => setField('employee_name')(e.target.value)}
              placeholder="James Mwangi"
            />
          </div>

          {/* Email — prominent, required */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => { setField('email')(e.target.value); setEmailTouched(false); }}
              onBlur={() => setEmailTouched(true)}
              placeholder="j.mwangi@aar.co.ke"
              className={cn(emailError ? 'border-red-400 focus-visible:ring-red-300' : '')}
            />
            {emailError
              ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{emailError}</p>
              : <p className="text-xs text-muted-foreground">Used for OTP delivery and account notifications</p>
            }
          </div>

          {/* Department + Profile */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={v => setField('department')(v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Profile / Role <span className="text-red-500">*</span></Label>
              <Select value={form.profile_id} onValueChange={v => setField('profile_id')(v)}>
                <SelectTrigger><SelectValue placeholder="Assign a profile…" /></SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.profile_id} value={String(p.profile_id)}>
                      {p.profile_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-5 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.activated}
                onChange={e => setField('activated')(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span>Activated</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.approved}
                onChange={e => setField('approved')(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span>Approved</span>
            </label>
          </div>

          {/* Enrolled-by info on edit */}
          {isEdit && employee!.added_by && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t">
              <Calendar className="w-3 h-3" />
              Enrolled {fmtDate(employee!.created_at)} by <strong>{employee!.added_by}</strong>
            </p>
          )}

          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { setEmailTouched(true); if (canSubmit) mutation.mutate(); }}
            disabled={mutation.isPending}
            className="min-w-[110px]"
          >
            {mutation.isPending
              ? <><RefreshCw className="w-3 h-3 mr-2 animate-spin" />Saving…</>
              : isEdit ? 'Save Changes' : 'Enroll User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Temp Password Dialog ──────────────────────────────────────────────────────
function TempPasswordDialog({ password, onClose }: { password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <KeyRound className="w-4 h-4 text-amber-500" />Temporary Password
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Share this temporary password with the user. They will be required to change it on first login.
          </p>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <code className="flex-1 font-mono text-base text-amber-800 tracking-widest">{password}</code>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copy}>
              {copied
                ? <Check className="w-3.5 h-3.5 text-green-600" />
                : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The account is now unlocked and failed-attempt counter has been reset.
          </p>
        </div>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Missing-email banner ──────────────────────────────────────────────────────
function MissingEmailBanner({ count, onFilter }: { count: number; onFilter: () => void }) {
  if (count === 0) return null;
  return (
    <button
      onClick={onFilter}
      className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left hover:bg-amber-100 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <MailWarning className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">
          {count} user{count !== 1 ? 's' : ''} missing an email address
        </p>
        <p className="text-xs text-amber-600">Click to filter · An email is required for OTP delivery</p>
      </div>
      <span className="text-xs text-amber-600 group-hover:underline">Show</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailFilter, setEmailFilter]   = useState(false);
  const [enrollOpen, setEnrollOpen]     = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data: empData, isLoading } = useQuery({
    queryKey: ['admin-employees', search, statusFilter],
    queryFn: () => apiFetch(
      `/admin/employees?search=${encodeURIComponent(search)}&status=${statusFilter !== 'all' ? statusFilter : ''}`
    ),
  });

  const { data: profileData } = useQuery({
    queryKey: ['admin-profiles-list'],
    queryFn: () => apiFetch('/admin/profiles'),
  });

  const allEmployees: Employee[] = empData?.data ?? [];
  const profiles:    Profile[]   = profileData?.data ?? [];

  const employees = emailFilter
    ? allEmployees.filter(e => !e.email)
    : allEmployees;

  const missingEmail = allEmployees.filter(e => !e.email).length;

  const action = useCallback((path: string, body: object) =>
    apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(() => qc.invalidateQueries({ queryKey: ['admin-employees'] }))
      .catch((e: Error) => alert(e.message)),
  [qc]);

  const handleReset = useCallback(async (id: number) => {
    try {
      const data = await apiFetch(`/admin/employees/${id}/reset-password`, { method: 'POST' });
      setTempPassword(data.tempPassword);
      qc.invalidateQueries({ queryKey: ['admin-employees'] });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    }
  }, [qc]);

  const STATUS_FILTERS = [
    { value: 'all',      label: 'All Users' },
    { value: 'active',   label: 'Active' },
    { value: 'pending',  label: 'Pending Approval' },
    { value: 'locked',   label: 'Locked' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enrol employees, manage accounts and assign profiles
          </p>
        </div>
        <Button onClick={() => setEnrollOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />Enrol User
        </Button>
      </div>

      {/* Missing-email warning */}
      <MissingEmailBanner
        count={missingEmail}
        onFilter={() => { setEmailFilter(f => !f); setStatusFilter('all'); setSearch(''); }}
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setEmailFilter(false); }}
            placeholder="Name, username, email or code…"
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setEmailFilter(false); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === f.value && !emailFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >{f.label}</button>
          ))}
          {emailFilter && (
            <button
              onClick={() => setEmailFilter(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1"
            >
              <MailWarning className="w-3 h-3" />Missing email <X className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {['Code', 'Employee', 'Username', 'Department', 'Profile', 'Status', 'Enrolled', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />Loading…
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  {emailFilter ? 'All users have email addresses — great!' : 'No users found'}
                </td>
              </tr>
            ) : employees.map((emp, i) => (
              <tr
                key={emp.employee_id}
                className={cn(
                  'border-b last:border-0 hover:bg-blue-50/30 transition-colors',
                  i % 2 !== 0 ? 'bg-muted/5' : '',
                )}
              >
                {/* Code */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{emp.emp_code}</span>
                </td>

                {/* Employee: name + email */}
                <td className="px-4 py-3">
                  <div className="font-medium leading-tight">{emp.employee_name}</div>
                  <div className="mt-0.5">
                    <EmailCell email={emp.email} />
                  </div>
                </td>

                {/* Username */}
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{emp.username}</td>

                {/* Department */}
                <td className="px-4 py-3">
                  {emp.department
                    ? <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{emp.department}</span>
                    : <span className="text-xs text-muted-foreground">—</span>}
                </td>

                {/* Profile */}
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                    <Shield className="w-3 h-3 text-blue-500 shrink-0" />
                    {emp.profile_name}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3"><StatusBadge emp={emp} /></td>

                {/* Enrolled date */}
                <td className="px-4 py-3">
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(emp.created_at)}
                  </div>
                  {emp.added_by && (
                    <div className="text-xs text-muted-foreground/60 mt-0.5">by {emp.added_by}</div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => setEditEmployee(emp)}
                        className="gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => action(`/admin/employees/${emp.employee_id}/activate`, { activate: !emp.activated })}
                        className="gap-2"
                      >
                        {emp.activated
                          ? <><XCircle className="w-3.5 h-3.5" />Deactivate</>
                          : <><CheckCircle className="w-3.5 h-3.5" />Activate</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => action(`/admin/employees/${emp.employee_id}/approve`, { approve: !emp.approved })}
                        className="gap-2"
                      >
                        {emp.approved
                          ? <><XCircle className="w-3.5 h-3.5" />Revoke Approval</>
                          : <><CheckCircle className="w-3.5 h-3.5 text-green-600" />Approve Account</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => action(`/admin/employees/${emp.employee_id}/lock`, { lock: !emp.employee_locked })}
                        className={cn(
                          'gap-2',
                          emp.employee_locked ? 'text-green-700' : 'text-red-600 focus:text-red-600',
                        )}
                      >
                        {emp.employee_locked
                          ? <><LockOpen className="w-3.5 h-3.5" />Unlock Account</>
                          : <><Lock className="w-3.5 h-3.5" />Lock Account</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleReset(emp.employee_id)}
                        className="gap-2 text-amber-700 focus:text-amber-700"
                      >
                        <KeyRound className="w-3.5 h-3.5" />Reset Password
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      {!isLoading && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {employees.length} {employees.length === 1 ? 'user' : 'users'}
            {emailFilter ? ' without email' : ''} ·{' '}
            {allEmployees.filter(e => e.activated && e.approved && !e.employee_locked).length} active ·{' '}
            {allEmployees.filter(e => e.employee_locked).length} locked
          </span>
          {missingEmail > 0 && !emailFilter && (
            <span className="flex items-center gap-1 text-amber-600">
              <MailWarning className="w-3 h-3" />
              {missingEmail} missing email
            </span>
          )}
        </div>
      )}

      {/* Dialogs */}
      {(enrollOpen || editEmployee) && (
        <EnrollDialog
          key={editEmployee?.employee_id ?? 'new'}
          open
          onClose={() => { setEnrollOpen(false); setEditEmployee(null); }}
          profiles={profiles}
          employee={editEmployee}
        />
      )}
      {tempPassword && (
        <TempPasswordDialog
          password={tempPassword}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  );
}

// tiny X icon used inline
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
