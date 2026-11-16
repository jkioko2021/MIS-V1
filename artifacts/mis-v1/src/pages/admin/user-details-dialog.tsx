import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/** Only the safe fields returned by the user-management list are displayed. */
export interface UserDetails {
  employee_id: number;
  emp_code: string | null;
  username: string;
  employee_name: string;
  email: string | null;
  mobile_no: string | null;
  department: string | null;
  profile_name: string | null;
  activated: boolean;
  approved: boolean;
  employee_locked: boolean;
  failed_attempts: number;
  last_login_date: string | null;
  last_password_reset: string | null;
  created_at: string | null;
  added_by: string | null;
}

function dateLabel(value: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function UserDetailsDialog({ employee, onClose }: {
  employee: UserDetails; onClose: () => void;
}) {
  const rows: [string, string][] = [
    ['Full name', employee.employee_name],
    ['User code', employee.emp_code || 'Not assigned'],
    ['Username', employee.username],
    ['Email address', employee.email || 'Not captured'],
    ['Mobile number', employee.mobile_no || 'Not captured'],
    ['Department', employee.department || 'Not assigned'],
    ['Profile', employee.profile_name || 'Not assigned'],
    ['Account status', employee.activated ? 'Active' : 'Inactive'],
    ['Approval status', employee.approved ? 'Approved' : 'Pending approval'],
    ['Login access', employee.employee_locked ? 'Locked' : 'Unlocked'],
    ['Failed login attempts', String(employee.failed_attempts ?? 0)],
    ['Last login', dateLabel(employee.last_login_date)],
    ['Last password reset', dateLabel(employee.last_password_reset)],
    ['Enrolled on', dateLabel(employee.created_at)],
    ['Enrolled by', employee.added_by || 'Not recorded'],
  ];
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto" data-testid="user-details-dialog">
      <DialogHeader>
        <DialogTitle>User Details — {employee.employee_name}</DialogTitle>
        <DialogDescription>Read-only account information. Use Edit Details to make changes.</DialogDescription>
      </DialogHeader>
      <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 py-3 sm:grid-cols-2">
        {rows.map(([label, value]) => <div key={label} className="min-w-0 border-b pb-3">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd>
        </div>)}
      </dl>
      <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
