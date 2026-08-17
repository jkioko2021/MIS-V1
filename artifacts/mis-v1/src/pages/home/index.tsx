import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { misApi } from '@/lib/mis-api';
import {
  FileText, Shield, Users, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, Activity,
  BarChart3, TrendingUp, UserCheck, Building2,
  FolderOpen, Layers, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtKES(n: number | null | undefined) {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayFmt() {
  return new Date().toLocaleDateString('en-KE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent, loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border bg-card p-5 flex flex-col gap-3',
      'transition-shadow hover:shadow-md',
    )}>
      {/* accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-1 rounded-t-2xl', accent)} />

      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', accent.replace('bg-', 'bg-').replace('-500', '-100'))}>
          <Icon className={cn('w-4.5 h-4.5', accent.replace('bg-', 'text-'))} />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function ActionCard({
  href, icon: Icon, label, desc, accent,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  accent: string;
}) {
  return (
    <Link href={href}>
      <div className={cn(
        'group flex items-center gap-4 rounded-xl border bg-card p-4 cursor-pointer',
        'transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5',
      )}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accent)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}

// ─── Business Dashboard Tab ───────────────────────────────────────────────────
function BusinessTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['business-summary'],
    queryFn: misApi.businessSummary,
    staleTime: 60_000,
  });

  const byStatus = data?.data?.byStatus ?? [];
  const totalFiles = byStatus.reduce((s, r: any) => s + Number(r.count), 0);
  const totalPremium = byStatus.reduce((s, r: any) => s + Number(r.premium || 0), 0);

  const pending = byStatus
    .filter((r: any) => !['INVOICED', 'DISPATCHED', 'POLICY ISSUED', 'DECLINED'].includes(r.file_status))
    .reduce((s, r: any) => s + Number(r.count), 0);

  const invoiced = byStatus
    .filter((r: any) => r.file_status === 'INVOICED')
    .reduce((s, r: any) => s + Number(r.count), 0);

  const forwardedRow = byStatus.find((r: any) => r.file_status === 'FORWARDED');
  const forwarded = Number(forwardedRow?.count ?? 0);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Files" value={isLoading ? '—' : totalFiles} icon={FolderOpen}
          accent="bg-blue-500" loading={isLoading} sub="All time" />
        <StatCard label="Pending" value={isLoading ? '—' : pending} icon={Clock}
          accent="bg-amber-500" loading={isLoading} sub="Active pipeline" />
        <StatCard label="Invoiced" value={isLoading ? '—' : invoiced} icon={CheckCircle2}
          accent="bg-emerald-500" loading={isLoading} sub="Ready to dispatch" />
        <StatCard label="Total Premium" value={isLoading ? '—' : fmtKES(totalPremium)} icon={TrendingUp}
          accent="bg-indigo-500" loading={isLoading} sub="Cumulative value" />
      </div>

      {/* Pipeline status breakdown */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">File Pipeline</h3>
            <p className="text-xs text-muted-foreground">Status distribution across all files</p>
          </div>
          <Link href="/business">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {byStatus.map((row: any) => {
              const pct = totalFiles > 0 ? Math.round((row.count / totalFiles) * 100) : 0;
              const colorMap: Record<string, string> = {
                'REGISTERED': 'bg-blue-500',
                'FORWARDED': 'bg-violet-500',
                'BENEFIT VERIFICATION': 'bg-amber-500',
                'MEDICAL UW-REVIEW': 'bg-orange-500',
                'RETURNED-INCOMPLETE': 'bg-red-400',
                'INVOICED': 'bg-emerald-500',
                'ALLOCATED': 'bg-cyan-500',
              };
              const bar = colorMap[row.file_status] ?? 'bg-slate-400';
              return (
                <div key={row.file_status} className="flex items-center gap-3">
                  <div className="w-36 shrink-0 text-xs text-muted-foreground font-medium truncate">
                    {row.file_status}
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-12 text-right text-xs font-semibold tabular-nums">{row.count}</div>
                  <div className="w-16 text-right text-xs text-muted-foreground tabular-nums">{fmtKES(row.premium)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard href="/business" icon={FileText} accent="bg-blue-500"
            label="Open Business Tracking" desc="View & manage the full file pipeline" />
          <ActionCard href="/business" icon={BarChart3} accent="bg-indigo-500"
            label="Pipeline Overview" desc={`${pending} files pending action`} />
        </div>
      </div>
    </div>
  );
}

// ─── User Management Tab ─────────────────────────────────────────────────────
function UsersTab() {
  const { data: empData, isLoading: empLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => misApi.employees(),
    staleTime: 120_000,
  });
  const { data: profileData, isLoading: profLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: misApi.profiles,
    staleTime: 120_000,
  });

  const employees: any[] = (empData?.data ?? []) as any[];
  const profiles: any[] = (profileData?.data ?? []) as any[];
  const loading = empLoading || profLoading;

  const departments = [...new Set(employees.map((e: any) => e.department).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={loading ? '—' : employees.length} icon={Users}
          accent="bg-violet-500" loading={loading} sub="Staff accounts" />
        <StatCard label="Departments" value={loading ? '—' : departments.length} icon={Building2}
          accent="bg-blue-500" loading={loading} sub="Unique departments" />
        <StatCard label="Access Profiles" value={loading ? '—' : profiles.length} icon={Layers}
          accent="bg-indigo-500" loading={loading} sub="Role definitions" />
        <StatCard label="System Access" value={loading ? '—' : employees.length} icon={UserCheck}
          accent="bg-emerald-500" loading={loading} sub="Enrolled users" />
      </div>

      {/* Department breakdown */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Staff by Department</h3>
            <p className="text-xs text-muted-foreground">Users grouped by department</p>
          </div>
          <Link href="/admin/users">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              Manage Users <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : departments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No department data available.</p>
        ) : (
          <div className="space-y-2">
            {departments.map(dept => {
              const count = employees.filter((e: any) => e.department === dept).length;
              const pct = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
              return (
                <div key={dept} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-xs text-muted-foreground font-medium truncate">{dept}</div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-8 text-right text-xs font-semibold tabular-nums">{count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard href="/admin/users" icon={Users} accent="bg-violet-500"
            label="User Enrollment" desc="Add and manage staff accounts" />
          <ActionCard href="/admin/profiles" icon={Layers} accent="bg-indigo-500"
            label="Profiles & Access" desc="Configure roles and access rights" />
        </div>
      </div>
    </div>
  );
}

// ─── Risk Management Tab ─────────────────────────────────────────────────────
function RiskTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['risk-dashboard'],
    queryFn: misApi.riskDashboard,
    staleTime: 60_000,
  });

  const hm = data?.data?.heatmap;
  const overdue: any[] = (data?.data?.overdue ?? []) as any[];
  const top15: any[] = (data?.data?.top15 ?? []) as any[];

  const RISK_COLORS: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    low_medium: 'bg-yellow-400',
    low: 'bg-emerald-400',
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Risks" value={isLoading ? '—' : (hm?.total ?? '—')} icon={Activity}
          accent="bg-rose-500" loading={isLoading} sub="Registered items" />
        <StatCard label="Critical / High" value={isLoading ? '—' : `${hm?.critical ?? 0} / ${hm?.high ?? 0}`}
          icon={AlertTriangle} accent="bg-red-500" loading={isLoading} sub="Highest priority" />
        <StatCard label="Medium" value={isLoading ? '—' : (hm?.medium ?? '—')} icon={BarChart3}
          accent="bg-amber-500" loading={isLoading} sub="Watch items" />
        <StatCard label="Overdue Actions" value={isLoading ? '—' : overdue.length} icon={Clock}
          accent="bg-orange-500" loading={isLoading} sub="Behind schedule" />
      </div>

      {/* Heatmap summary + top risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Heatmap distribution */}
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-1">Risk Exposure Heat Map</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution by severity level</p>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)}</div>
          ) : hm ? (
            <div className="space-y-2.5">
              {(['critical', 'high', 'medium', 'low_medium', 'low'] as const).map(level => {
                const count = hm[level] ?? 0;
                const pct = hm.total > 0 ? Math.round((count / hm.total) * 100) : 0;
                return (
                  <div key={level} className="flex items-center gap-3">
                    <div className="w-24 shrink-0">
                      <Badge variant="outline" className={cn(
                        'text-xs capitalize border-0 font-semibold',
                        level === 'critical' && 'bg-red-100 text-red-700',
                        level === 'high' && 'bg-orange-100 text-orange-700',
                        level === 'medium' && 'bg-amber-100 text-amber-700',
                        level === 'low_medium' && 'bg-yellow-100 text-yellow-700',
                        level === 'low' && 'bg-emerald-100 text-emerald-700',
                      )}>
                        {level.replace('_', '-')}
                      </Badge>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div className={cn('h-full rounded-full', RISK_COLORS[level])}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-8 text-right text-xs font-semibold tabular-nums">{count}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
          )}
        </div>

        {/* Overdue actions */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Overdue Actions</h3>
              <p className="text-xs text-muted-foreground">{overdue.length} items behind schedule</p>
            </div>
            <Link href="/risk">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                View Register <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : overdue.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No overdue actions — great work!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {overdue.slice(0, 8).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-50/60 border border-red-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{a.risk_title ?? a.title ?? a.action_desc ?? 'Action required'}</p>
                    <p className="text-xs text-muted-foreground">{a.department ?? a.dept ?? ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard href="/risk" icon={Shield} accent="bg-rose-500"
            label="Open Risk Register" desc="View department risks and scoring" />
          <ActionCard href="/risk" icon={AlertTriangle} accent="bg-orange-500"
            label="Overdue Actions" desc={`${overdue.length} action(s) need attention`} />
        </div>
      </div>
    </div>
  );
}

// ─── Module config ────────────────────────────────────────────────────────────
type ModuleId = 'business' | 'users' | 'risk';

const MODULES: { id: ModuleId; label: string; icon: React.ElementType; accent: string; badge?: string }[] = [
  { id: 'business', label: 'Business Tracking', icon: FileText, accent: 'blue' },
  { id: 'users',    label: 'User Management',   icon: Users,    accent: 'violet' },
  { id: 'risk',     label: 'Risk Management',   icon: Shield,   accent: 'rose' },
];

const ACCENT_TAB_ACTIVE: Record<string, string> = {
  blue:   'border-blue-500 text-blue-600 bg-blue-50',
  violet: 'border-violet-500 text-violet-600 bg-violet-50',
  rose:   'border-rose-500 text-rose-600 bg-rose-50',
};
const ACCENT_ICON_ACTIVE: Record<string, string> = {
  blue:   'text-blue-500',
  violet: 'text-violet-500',
  rose:   'text-rose-500',
};

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const [active, setActive] = useState<ModuleId>('business');

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-8 relative overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-white/5" />

        <div className="relative flex items-end justify-between max-w-6xl">
          <div>
            <p className="text-slate-400 text-sm mb-1">{todayFmt()}</p>
            <h1 className="text-2xl font-bold text-white">
              {greeting()}, {user?.name ?? 'there'} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome to the AAR Insurance Management Information System
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System operational
          </div>
        </div>
      </div>

      {/* ── Module tabs ───────────────────────────────────────────────────────── */}
      <div className="bg-card border-b px-8">
        <div className="flex gap-1 max-w-6xl -mb-px">
          {MODULES.map(mod => {
            const isActive = active === mod.id;
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => setActive(mod.id)}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-4 text-sm font-medium border-b-2 transition-all',
                  'focus:outline-none whitespace-nowrap',
                  isActive
                    ? cn('border-b-2', ACCENT_TAB_ACTIVE[mod.accent])
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? ACCENT_ICON_ACTIVE[mod.accent] : 'text-muted-foreground')} />
                {mod.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <div className="px-8 py-6 max-w-6xl mx-auto">
        {active === 'business' && <BusinessTab />}
        {active === 'users'    && <UsersTab />}
        {active === 'risk'     && <RiskTab />}
      </div>
    </div>
  );
}
