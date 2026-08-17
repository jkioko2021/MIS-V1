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
  Users, AlertCircle, Copy, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API = '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  employee_id: number;
  emp_code: string;
  username: string;
  employee_name: string;
  email: string;
  department: string;
  profile_id: number;
  profile_name: string;
  activated: boolean;
  employee_locked: boolean;
  approved: boolean;
  failed_attempts: number;
  last_login_date: string | null;
  last_password_reset: string | null;
  created_at: string;
}

interface Profile { profile_id: number; profile_name: string; }

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { credentials: 'include', ...init });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

const DEPARTMENTS = ['IT','MEMBERSHIP','CUST','MEDICAL','NONMEDICAL','FINANCE','HR','COMPLIANCE','OPERATIONS','NSM'];

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ emp }: { emp: Employee }) {
  if (emp.employee_locked) return <Badge variant="destructive" className="text-xs gap-1"><Lock className="w-3 h-3"/>Locked</Badge>;
  if (!emp.approved)  return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1"><AlertCircle className="w-3 h-3"/>Pending Approval</Badge>;
  if (!emp.activated) return <Badge variant="outline" className="text-xs text-slate-500 gap-1"><XCircle className="w-3 h-3"/>Inactive</Badge>;
  return <Badge variant="outline" className="text-xs text-green-700 border-green-300 gap-1"><CheckCircle className="w-3 h-3"/>Active</Badge>;
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
    username: employee?.username ?? '',
    employee_name: employee?.employee_name ?? '',
    email: employee?.email ?? '',
    department: employee?.department ?? '',
    profile_id: String(employee?.profile_id ?? ''),
    activated: employee?.activated ?? false,
    approved: employee?.approved ?? false,
    password: '',
  });
  const [error, setError] = useState('');

  const set = (k: string) => (v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return apiFetch(`/admin/employees/${employee!.employee_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee_name: form.employee_name, email: form.email, department: form.department, profile_id: Number(form.profile_id) }),
        });
      } else {
        return apiFetch('/admin/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, profile_id: Number(form.profile_id) }),
        });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-employees'] }); onClose(); },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            {isEdit ? 'Edit User' : 'Enroll New User'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Username <span className="text-red-500">*</span></Label>
                <Input value={form.username} onChange={e => set('username')(e.target.value)} placeholder="j.mwangi" />
              </div>
              <div className="space-y-1.5">
                <Label>Initial Password</Label>
                <Input type="password" value={form.password} onChange={e => set('password')(e.target.value)} placeholder="AAR@2024! (default)" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input value={form.employee_name} onChange={e => set('employee_name')(e.target.value)} placeholder="James Mwangi" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="j.mwangi@aar.co.ke" />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={set('department')}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Profile / Role <span className="text-red-500">*</span></Label>
            <Select value={form.profile_id} onValueChange={set('profile_id')}>
              <SelectTrigger><SelectValue placeholder="Assign a profile…" /></SelectTrigger>
              <SelectContent>{profiles.map(p => <SelectItem key={p.profile_id} value={String(p.profile_id)}>{p.profile_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.activated} onChange={e => set('activated')(e.target.checked)} className="w-4 h-4 rounded" />
              Activated
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.approved} onChange={e => set('approved')(e.target.checked)} className="w-4 h-4 rounded" />
              Approved
            </label>
          </div>

          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.employee_name || !form.profile_id || (!isEdit && !form.username)}>
            {mutation.isPending ? <><RefreshCw className="w-3 h-3 mr-2 animate-spin" />Saving…</> : isEdit ? 'Save Changes' : 'Enroll User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reset Password Result Dialog ─────────────────────────────────────────────
function TempPasswordDialog({ password, onClose }: { password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex gap-2 items-center"><KeyRound className="w-4 h-4 text-amber-500" />Temporary Password</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Share this temporary password with the user. They will be required to change it on first login.</p>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <code className="flex-1 font-mono text-sm text-amber-800 tracking-wider">{password}</code>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data: empData, isLoading } = useQuery({
    queryKey: ['admin-employees', search, statusFilter],
    queryFn: () => apiFetch(`/admin/employees?search=${encodeURIComponent(search)}&status=${statusFilter !== 'all' ? statusFilter : ''}`),
  });

  const { data: profileData } = useQuery({
    queryKey: ['admin-profiles-list'],
    queryFn: () => apiFetch('/admin/profiles'),
  });

  const employees: Employee[] = empData?.data ?? [];
  const profiles: Profile[] = profileData?.data ?? [];

  const action = useCallback((path: string, body: object) =>
    apiFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(() => qc.invalidateQueries({ queryKey: ['admin-employees'] })),
  [qc]);

  const handleReset = useCallback(async (id: number) => {
    const data = await apiFetch(`/admin/employees/${id}/reset-password`, { method: 'POST' });
    setTempPassword(data.tempPassword);
    qc.invalidateQueries({ queryKey: ['admin-employees'] });
  }, [qc]);

  const STATUS_FILTERS = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'locked', label: 'Locked' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" />User Enrollment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage employee accounts, access and account status</p>
        </div>
        <Button onClick={() => setEnrollOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />Enroll User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, username or code…" className="pl-9 h-9" />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              {['Code','Name','Username','Department','Profile','Status','Last Login','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Loading…</div>
              </td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No employees found</td></tr>
            ) : employees.map((emp, i) => (
              <tr key={emp.employee_id} className={cn('border-b last:border-0 hover:bg-muted/20 transition-colors', i % 2 === 0 ? '' : 'bg-muted/5')}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{emp.emp_code}</td>
                <td className="px-4 py-3 font-medium">{emp.employee_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{emp.username}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{emp.department || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Shield className="w-3 h-3 text-blue-500" />{emp.profile_name}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge emp={emp} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {emp.last_login_date ? new Date(emp.last_login_date).toLocaleDateString('en-GB') : '—'}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setEditEmployee(emp)} className="gap-2">
                        <Pencil className="w-3.5 h-3.5" />Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => action(`/admin/employees/${emp.employee_id}/activate`, { activate: !emp.activated })}
                        className="gap-2"
                      >
                        {emp.activated ? <><XCircle className="w-3.5 h-3.5" />Deactivate</> : <><CheckCircle className="w-3.5 h-3.5" />Activate</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => action(`/admin/employees/${emp.employee_id}/approve`, { approve: !emp.approved })}
                        className="gap-2"
                      >
                        {emp.approved ? <><XCircle className="w-3.5 h-3.5" />Revoke Approval</> : <><CheckCircle className="w-3.5 h-3.5 text-green-600" />Approve Account</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => action(`/admin/employees/${emp.employee_id}/lock`, { lock: !emp.employee_locked })}
                        className={cn('gap-2', emp.employee_locked ? 'text-green-700' : 'text-red-600 focus:text-red-600')}
                      >
                        {emp.employee_locked ? <><LockOpen className="w-3.5 h-3.5" />Unlock Account</> : <><Lock className="w-3.5 h-3.5" />Lock Account</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleReset(emp.employee_id)} className="gap-2 text-amber-700 focus:text-amber-700">
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
        <p className="text-xs text-muted-foreground">
          {employees.length} {employees.length === 1 ? 'user' : 'users'} ·{' '}
          {employees.filter(e => e.activated && e.approved && !e.employee_locked).length} active ·{' '}
          {employees.filter(e => e.employee_locked).length} locked
        </p>
      )}

      {/* Dialogs */}
      {(enrollOpen || editEmployee) && (
        <EnrollDialog
          open
          onClose={() => { setEnrollOpen(false); setEditEmployee(null); }}
          profiles={profiles}
          employee={editEmployee}
        />
      )}
      {tempPassword && <TempPasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />}
    </div>
  );
}
