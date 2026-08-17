import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { misApi } from '@/lib/mis-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

type Risk = Record<string, unknown>;
type DeptSummary = Record<string, unknown>;

const HEAT: Record<string, { bg: string; text: string; label: string }> = {
  critical:   { bg: 'bg-red-500',     text: 'text-white', label: 'Critical' },
  high:       { bg: 'bg-orange-400',  text: 'text-white', label: 'High' },
  medium:     { bg: 'bg-yellow-400',  text: 'text-gray-900', label: 'Medium' },
  'low-medium':{ bg: 'bg-yellow-200', text: 'text-gray-900', label: 'Low-Med' },
  low:        { bg: 'bg-green-300',   text: 'text-gray-900', label: 'Low' },
};

function RiskBadge({ level }: { level: string }) {
  const h = HEAT[level] ?? { bg: 'bg-gray-200', text: 'text-gray-700', label: level };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${h.bg} ${h.text}`}>
      {h.label}
    </span>
  );
}

function WorkflowBadge({ done }: { done: boolean }) {
  return done
    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
    : <XCircle className="w-4 h-4 text-muted-foreground" />;
}

function RiskDetail({ riskCode, onClose }: { riskCode: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['risk-detail', riskCode],
    queryFn: () => misApi.riskDetail(riskCode),
  });

  const risk = data?.data as Risk & { root_causes?: Risk[] };

  return (
    <Sheet open onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[520px] sm:max-w-[520px]">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-mono text-sm">{riskCode}</SheetTitle>
          {risk && <p className="text-base font-semibold">{String(risk.risk_title)}</p>}
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-8" />)}</div>
        ) : risk ? (
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="scoring" className="flex-1">Scoring</TabsTrigger>
              <TabsTrigger value="causes" className="flex-1">Root Causes ({(risk.root_causes ?? []).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-4 pr-4 text-sm">
                  {([
                    ['Department',   risk.depart_name],
                    ['Category',     risk.category_name],
                    ['Period',       `${risk.period_from} → ${risk.period_to}`],
                    ['Description',  risk.risk_description],
                    ['Consequence',  risk.risk_consequence],
                    ['Current Controls', risk.current_contr],
                    ['Desired Controls', risk.desired_contr_effe],
                    ['Entered By',   risk.entered_by],
                  ] as [string, unknown][]).map(([label, val]) => val != null && val !== '' && (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="font-medium">{String(val)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="scoring" className="mt-4">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['Impact', risk.risk_impact, risk.i_rate],
                    ['Likelihood', risk.risk_likelihood, risk.l_rate],
                    ['Inherent Exposure', null, risk.i_risk_exposure],
                    ['Inherent Rate', null, risk.i_risk_rate],
                    ['Control Effectiveness', null, `${risk.perceived_contr_eff}%`],
                    ['Residual Rate', null, risk.r_risk_rate],
                    ['Residual Exposure', null, risk.r_risk_exposure],
                  ] as [string, unknown, unknown][]).map(([label, text, rate]) => (
                    <div key={label} className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      {text != null && <p className="font-medium">{String(text)}</p>}
                      {rate != null && (
                        <p className="text-2xl font-bold text-primary">{String(rate)}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-muted-foreground text-xs">Overall level:</span>
                  <RiskBadge level={String(risk.risk_level ?? '')} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="causes" className="mt-4">
              <ScrollArea className="h-[calc(100vh-220px)]">
                {(risk.root_causes ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No root causes recorded.</p>
                ) : (
                  <div className="space-y-4 pr-4">
                    {(risk.root_causes ?? []).map((rc, i) => (
                      <div key={i} className="border rounded-lg p-3 text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{String(rc.root_cause)}</p>
                          <Badge variant={
                            rc.action_status === 'Closed' ? 'default' :
                            rc.action_status === 'Behind schedule' ? 'destructive' : 'secondary'
                          }>
                            {String(rc.action_status)}
                          </Badge>
                        </div>
                        {rc.mitigations && <p className="text-xs text-muted-foreground"><strong>Mitigation:</strong> {String(rc.mitigations)}</p>}
                        {rc.action_owner && <p className="text-xs"><strong>Owner:</strong> {String(rc.action_owner)}</p>}
                        {rc.due_date && <p className="text-xs text-muted-foreground"><strong>Due:</strong> {String(rc.due_date)}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function RiskRegisterPage() {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>('All');

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['risk-dashboard'],
    queryFn: misApi.riskDashboard,
  });

  const params: Record<string,string> = {};
  if (deptFilter !== 'All') params.depart_code = deptFilter;

  const { data: risksData, isLoading: risksLoading } = useQuery({
    queryKey: ['risk-risks', deptFilter],
    queryFn: () => misApi.riskRisks(params),
  });

  const depts = dashData?.data?.byDept as DeptSummary[] ?? [];
  const risks = risksData?.data as Risk[] ?? [];
  const overdue = dashData?.data?.overdue as Risk[] ?? [];
  const hm = dashData?.data?.heatmap;

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" /> Risk Register
        </h1>
        <p className="text-sm text-muted-foreground">Active period: July – December 2026</p>
      </div>

      {/* Heat map summary */}
      {hm && (
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Critical', key: 'critical' as const, bg: 'bg-red-500 text-white' },
            { label: 'High', key: 'high' as const, bg: 'bg-orange-400 text-white' },
            { label: 'Medium', key: 'medium' as const, bg: 'bg-yellow-400 text-gray-900' },
            { label: 'Low-Med', key: 'low_medium' as const, bg: 'bg-yellow-200 text-gray-900' },
            { label: 'Low', key: 'low' as const, bg: 'bg-green-300 text-gray-900' },
          ].map(({ label, key, bg }) => (
            <div key={key} className={`rounded-lg p-4 text-center ${bg}`}>
              <p className="text-3xl font-bold">{Number(hm[key])}</p>
              <p className="text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Department workflow status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Department Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashLoading ? (
              Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-10" />)
            ) : depts.map(d => (
              <div
                key={String(d.depart_code)}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  deptFilter === String(d.depart_code) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => setDeptFilter(
                  deptFilter === String(d.depart_code) ? 'All' : String(d.depart_code)
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{String(d.depart_name)}</p>
                  <p className="text-xs text-muted-foreground">{String(d.total_risks ?? 0)} risks · avg {String(d.avg_exposure ?? '—')}</p>
                </div>
                <div className="flex gap-1 shrink-0" title="Submitted → Reviewed → Signed Off">
                  <WorkflowBadge done={Boolean(d.submitted)} />
                  <WorkflowBadge done={Boolean(d.reviewed)} />
                  <WorkflowBadge done={Boolean(d.sign_off)} />
                </div>
              </div>
            ))}
            {depts.length === 0 && !dashLoading && (
              <p className="text-xs text-muted-foreground">No departments found.</p>
            )}
          </CardContent>
        </Card>

        {/* Risk list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">
              {deptFilter === 'All' ? 'All Risks' : `${deptFilter} Risks`} ({risks.length})
            </h2>
            {deptFilter !== 'All' && (
              <button className="text-xs text-primary" onClick={() => setDeptFilter('All')}>
                Clear filter
              </button>
            )}
          </div>

          <div className="space-y-2">
            {risksLoading ? (
              Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-16" />)
            ) : risks.map(r => (
              <div
                key={String(r.risk_code)}
                onClick={() => setSelectedRisk(String(r.risk_code))}
                className="border rounded-lg p-3 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{String(r.risk_code)}</span>
                      <RiskBadge level={String(r.risk_level)} />
                    </div>
                    <p className="font-medium text-sm truncate">{String(r.risk_title)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {String(r.depart_name)} · {String(r.category_name)} · {String(r.root_cause_count)} root cause(s)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold">{String(r.r_risk_exposure ?? '—')}</p>
                    <p className="text-xs text-muted-foreground">R-Exposure</p>
                  </div>
                </div>
              </div>
            ))}
            {risks.length === 0 && !risksLoading && (
              <p className="text-sm text-muted-foreground p-4">No risks found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Overdue actions */}
      {overdue.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-4 h-4" /> Behind-Schedule Actions ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdue.map((o, i) => (
                <div key={i} className="flex items-center gap-3 text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{String(o.risk_code)}</span>
                  <span className="flex-1 truncate">{String(o.root_cause)}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{String(o.action_owner)}</span>
                  <span className="text-xs text-red-600 font-medium shrink-0">Due: {String(o.due_date).split('T')[0]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedRisk && <RiskDetail riskCode={selectedRisk} onClose={() => setSelectedRisk(null)} />}
    </div>
  );
}
