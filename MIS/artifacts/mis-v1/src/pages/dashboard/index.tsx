import { useQuery } from '@tanstack/react-query';
import { misApi, type BusinessSummary } from '@/lib/mis-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText, Users, Shield, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, XCircle, Loader2
} from 'lucide-react';

// ── Status badge colours ───────────────────────────────────────────────────────
const STATUS_COLOURS: Record<string, string> = {
  'REGISTERED':           'bg-slate-100 text-slate-700',
  'FORWARDED':            'bg-blue-100 text-blue-700',
  'RETURNED-INCOMPLETE':  'bg-amber-100 text-amber-700',
  'MEDICAL UW-REVIEW':    'bg-purple-100 text-purple-700',
  'BENEFIT VERIFICATION': 'bg-orange-100 text-orange-700',
  'ALLOCATED':            'bg-cyan-100 text-cyan-700',
  'INVOICED':             'bg-green-100 text-green-700',
  'DISPATCHED':           'bg-emerald-100 text-emerald-700',
  'DECLINED':             'bg-red-100 text-red-700',
  'POLICY ISSUED':        'bg-teal-100 text-teal-700',
};

const RISK_COLOURS = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  'low-medium': 'bg-yellow-200',
  low: 'bg-green-300',
};

function fmt(n: number | string | null | undefined) {
  if (n == null) return '—';
  const num = Number(n);
  if (num >= 1_000_000) return `KES ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `KES ${(num / 1_000).toFixed(0)}K`;
  return `KES ${num.toLocaleString()}`;
}

function StatCard({ title, value, subtitle, icon: Icon, colour }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; colour: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-2.5 rounded-lg ${colour}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: btSum, isLoading: btLoading } = useQuery({
    queryKey: ['business-summary'],
    queryFn: misApi.businessSummary,
  });
  const { data: riskDash, isLoading: riskLoading } = useQuery({
    queryKey: ['risk-dashboard'],
    queryFn: misApi.riskDashboard,
  });
  const { data: prodMonth } = useQuery({
    queryKey: ['prod-month'],
    queryFn: misApi.productionMonth,
  });
  const { data: onCall } = useQuery({
    queryKey: ['on-call'],
    queryFn: misApi.staffOnCall,
  });

  const byStatus = btSum?.data?.byStatus ?? [];
  const totalFiles = byStatus.reduce((s, r) => s + Number(r.count), 0);
  const totalPremium = byStatus.reduce((s, r) => s + Number(r.premium ?? 0), 0);
  const pendingCount = byStatus
    .filter(r => !['INVOICED','DISPATCHED','POLICY ISSUED','DECLINED'].includes(r.file_status))
    .reduce((s, r) => s + Number(r.count), 0);

  const heatmap = riskDash?.data?.heatmap;
  const top15 = riskDash?.data?.top15 as Array<Record<string,unknown>> ?? [];
  const overdue = riskDash?.data?.overdue as Array<Record<string,unknown>> ?? [];

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">MIS Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {prodMonth?.data
              ? `Active production month: ${prodMonth.data.month_name} · ${prodMonth.data.date_from} → ${prodMonth.data.date_to}`
              : 'Loading production month…'}
          </p>
        </div>
        {onCall?.data && (
          <div className="text-sm text-right">
            <p className="text-muted-foreground">On-call today</p>
            <p className="font-semibold">{onCall.data.staff_name}</p>
            <p className="text-muted-foreground">{onCall.data.staff_mobile}</p>
          </div>
        )}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {btLoading ? (
          Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard title="Total Files" value={totalFiles} subtitle="This production month" icon={FileText} colour="bg-blue-500" />
            <StatCard title="Pending" value={pendingCount} subtitle="Awaiting action" icon={Clock} colour="bg-amber-500" />
            <StatCard title="Total Premium" value={fmt(totalPremium)} subtitle="All active files" icon={TrendingUp} colour="bg-green-600" />
            <StatCard title="Risk Items" value={heatmap ? Number(heatmap.total) : '—'} subtitle={heatmap ? `${Number(heatmap.critical)+Number(heatmap.high)} high/critical` : ''} icon={Shield} colour="bg-red-500" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Business pipeline by status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Business Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {btLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <div className="space-y-2">
                {byStatus.map(row => (
                  <div key={row.file_status} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-44 text-center shrink-0 ${STATUS_COLOURS[row.file_status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {row.file_status}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${totalFiles ? (Number(row.count)/totalFiles)*100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{row.count}</span>
                    <span className="text-xs text-muted-foreground w-24 text-right">{fmt(row.premium)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk heat map */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" /> Risk Exposure Heat Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : heatmap ? (
              <div className="space-y-3">
                {[
                  { label: 'Critical (>40)', key: 'critical' as const, colour: 'bg-red-500' },
                  { label: 'High (26–40)', key: 'high' as const, colour: 'bg-orange-400' },
                  { label: 'Medium (15–25)', key: 'medium' as const, colour: 'bg-yellow-400' },
                  { label: 'Low-Medium (7–14)', key: 'low_medium' as const, colour: 'bg-yellow-200' },
                  { label: 'Low (1–6)', key: 'low' as const, colour: 'bg-green-300' },
                ].map(({ label, key, colour }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-sm shrink-0 ${colour}`} />
                    <span className="text-sm flex-1">{label}</span>
                    <span className="font-bold">{Number(heatmap[key])}</span>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div className={`h-full rounded-full ${colour}`}
                        style={{ width: `${Number(heatmap.total) ? (Number(heatmap[key])/Number(heatmap.total))*100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  {overdue.length} action(s) behind schedule
                </p>
              </div>
            ) : <p className="text-sm text-muted-foreground">No risk data</p>}
          </CardContent>
        </Card>

        {/* Top risks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Top 15 Risks by Residual Exposure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left pb-2 pr-4 font-medium">Code</th>
                      <th className="text-left pb-2 pr-4 font-medium">Risk Title</th>
                      <th className="text-left pb-2 pr-4 font-medium">Department</th>
                      <th className="text-right pb-2 font-medium">R-Exposure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top15.map((r, i) => {
                      const level = r.risk_level as keyof typeof RISK_COLOURS;
                      return (
                        <tr key={String(r.risk_code)} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{String(r.risk_code)}</td>
                          <td className="py-2 pr-4 max-w-xs truncate">{String(r.risk_title)}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{String(r.depart_name)}</td>
                          <td className="py-2 text-right">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full text-white ${RISK_COLOURS[level] ?? 'bg-gray-400'}`}>
                              {String(r.r_risk_exposure)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
