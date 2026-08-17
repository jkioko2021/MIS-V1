const API_BASE = "/api";

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface ApiResponse<T> { ok: boolean; data: T; total?: number; error?: string; }

// ── Business Tracking ──────────────────────────────────────────────────────
export interface BusinessFile {
  file_no: string;
  proposer_name: string;
  family_code: string;
  receive_dt: string;
  premium: number;
  file_status: string;
  business_type: string;
  client_type: string;
  business: string;
  agent_id: string;
  agent_name: string;
  is_mtiba: boolean;
  is_ipf: boolean;
  walk_in_client: string;
  rate_type: string;
  benefit_verified: string;
  medical_uw: boolean;
  allocated: boolean;
  invoiced: boolean;
  allocated_to: string;
  forwarded: boolean;
  forwarded_by: string;
  forward_date: string;
  is_complete: boolean;
  pay_ref_no: string;
  paid_amt: number;
  entered_by: string;
  created_at: string;
  note_count: number;
}

export interface BusinessSummary {
  detail: Array<{ file_status: string; business: string; client_type: string; count: number; total_premium: number }>;
  byStatus: Array<{ file_status: string; count: number; premium: number }>;
}

export const misApi = {
  productionMonth: () => get<ApiResponse<{ month_name: string; date_from: string; date_to: string; year: number }>>('/mis/production-month'),
  staffOnCall:     () => get<ApiResponse<{ staff_name: string; staff_mobile: string }>>('/mis/staff-on-call'),

  business: (params?: Record<string, string>) => get<ApiResponse<BusinessFile[]>>('/mis/business', params),
  businessFile:    (fileNo: string) => get<ApiResponse<BusinessFile & { notes: unknown[]; docs: unknown[] }>>(`/mis/business/${fileNo}`),
  businessSummary: () => get<ApiResponse<BusinessSummary>>('/mis/business/summary/counts'),

  agents:   () => get<ApiResponse<unknown[]>>('/mis/agents'),
  employees:(params?: Record<string, string>) => get<ApiResponse<unknown[]>>('/mis/employees', params),
  profiles: () => get<ApiResponse<unknown[]>>('/mis/profiles'),
  audit:    (params?: Record<string, string>) => get<ApiResponse<unknown[]>>('/mis/audit', params),

  riskDepts:     () => get<ApiResponse<unknown[]>>('/mis/risk/departments'),
  riskRisks:     (params?: Record<string, string>) => get<ApiResponse<unknown[]>>('/mis/risk/risks', params),
  riskDetail:    (code: string) => get<ApiResponse<unknown>>(`/mis/risk/risks/${code}`),
  riskDashboard: () => get<ApiResponse<{
    byDept: unknown[];
    top15: unknown[];
    overdue: unknown[];
    heatmap: { critical: number; high: number; medium: number; low_medium: number; low: number; total: number };
  }>>('/mis/risk/dashboard'),
};
