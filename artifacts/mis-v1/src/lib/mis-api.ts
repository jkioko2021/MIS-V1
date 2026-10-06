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
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

async function put<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  total?: number;
  page?: number;
  page_size?: number;
  error?: string;
}

// ── Business Tracking ──────────────────────────────────────────────────────
export interface BusinessFile {
  file_no: string;
  proposer_name: string;
  family_code: string | null;
  receive_dt: string;
  premium: number | null;
  file_status: string;
  business_type: string;
  client_type: string;
  business: string;
  agent_id: string | null;
  agent_name: string | null;
  is_mtiba: boolean;
  is_ipf: boolean;
  walk_in_client: string;
  walk_in_auth: string | null;
  rate_type: string;
  benefit_verified: string;
  product: string | null;
  medical_uw: boolean;
  allocated: boolean;
  allocated_to: string | null;
  allocate_dt: string | null;
  invoiced: boolean;
  forwarded: boolean;
  forwarded_by: string | null;
  forward_date: string | null;
  is_complete: boolean;
  ready_for_update: boolean;
  is_active: boolean;
  is_declined: boolean;
  pay_ref_no: string | null;
  paid_amt: number | null;
  invoice_no?: string | null;
  paid_status?: string | null;
  invoice_date?: string | null;
  entered_by: string;
  created_at: string;
  updated_at: string;
  note_count: number;
  // Extended columns
  nid: string | null;
  pin_no: string | null;
  county_code: string | null;
  card_type: string | null;
  gi_category: string | null;
  pay_mode: string | null;
  sector: string | null;
  cr12: boolean;
  cr12_ref: string | null;
  corp_category: string | null;
  client_sub_type: string | null;
  is_shwaari?: boolean;
  branch?: string | null;
  bpo_assigned_to?: string | null;
  bpo_forwarded_at?: string | null;
  to_pricing_dt?: string | null;
}

export interface BusinessReviewActionBody {
  action: 'RI' | 'A' | 'MU' | 'HO' | 'CA';
  allocated_to?: string;
  product: 'T' | 'S' | 'AS';
  comments: string;
  county_code?: string;
  nid?: string;
  pin_no?: string;
  business_type?: string;
  business?: string;
  card_type?: string;
  pay_mode?: string;
  queue_name?: string;
}

export interface AllocatedFileActionBody {
  action: 'C' | 'CA' | 'MU' | 'CL' | 'IT' | 'RI' | 'RM' | 'P';
  comments: string;
  invoice_no?: string;
  paid_status?: 'FULL-PAID' | 'PART-PAID' | 'NOT-PAID' | 'CR';
  assigned_to?: string;
}

export interface AllocatedFileActionOption {
  code: AllocatedFileActionBody['action'];
  label: string;
  destination: string;
  requires_invoice: boolean;
  requires_payment_status: boolean;
}

export interface AllocationRecipient {
  username: string;
  employee_name: string;
  department: string;
}

export interface AllocationDestination {
  action: AllocatedFileActionBody['action'];
  queue_name: string;
  team_name: string;
  file_status: string;
  needs_assignee: boolean;
  staff: AllocationRecipient[];
}

export interface AllocatedFileAmlStatus {
  required: boolean;
  uploaded: boolean;
  valid: boolean;
}

export interface BusinessNote {
  note_id: number;
  file_no: string;
  note_from: string;
  note_date: string;
  notes: string;
  is_active: boolean;
}

export interface BusinessDoc {
  id: number | null;
  file_no: string;
  req_id: number;
  req_name: string;
  applies_to: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  is_selected: boolean;
  upload_id: number | null;
}

export interface BusinessRequirement {
  req_id: number;
  req_code: string;
  req_name: string;
  applies_to: string;
}

export interface ConfigurableBusinessRequirement {
  req_id: number;
  req_code: number;
  req_name: string;
  applies_to: 'R' | 'C';
  is_active: boolean;
  code: number;
}

export interface BusinessRequirementInput {
  req_name: string;
  applies_to: 'R' | 'C';
  is_active: boolean;
  code: number;
}

export interface BusinessUpload {
  upload_id: number;
  file_no: string;
  req_id: number | null;
  filename: string;
  filesize: number | null;
  mime_type: string | null;
  storage_key: string;
  uploaded_by: string;
  uploaded_at: string;
  invoice_no?: string | null;
  amount?: number | null;
  policy_code?: string | null;
  risk_rate?: string | null;
  risk_reason?: string | null;
}

export interface AmlRiskReasonSource {
  available: boolean;
  reasons: Array<{ value: string; label: string }>;
  message?: string;
}

export interface AuditEntry {
  done_by: string;
  action: string;
  details: string;
  done_at: string;
}

export interface SalesAgent {
  agent_id: string;
  agent_name: string;
  agent_email: string | null;
  agent_phone: string | null;
  agency_code: string | null;
  is_active: boolean;
}

export interface Employee {
  employee_id: number;
  username: string;
  employee_name: string;
  department: string;
}

export interface BpoReviewer {
  username: string;
  employee_name: string;
  department: string | null;
}

export interface BusinessSummary {
  detail: Array<{ file_status: string; business: string; client_type: string; count: number; total_premium: number }>;
  byStatus: Array<{ file_status: string; count: number; premium: number }>;
}

export interface AllocatedRefundLedgerSummary {
  available: boolean;
  message?: string;
  allocated_count: number;
  allocated_admin_count: number;
  total_amount_paid: number | null;
  total_refund_amount: number | null;
  records: Array<{
    refund_id: number | null;
    refund_no: string | null;
    file_no: string | null;
    amount_paid: number | null;
    refund_amount: number | null;
    payee_name: string | null;
    payee_email: string | null;
    payee_mobile: string | null;
    refund_status: string | null;
    refund_type: string | null;
    request_dt: string | null;
    allocate_dt: string | null;
    allocate_to: string | null;
    entered_by: string | null;
    client_type: string | null;
  }>;
}

export const misApi = {
  productionMonth: () => get<ApiResponse<{ month_name: string; date_from: string; date_to: string; year: number }>>('/mis/production-month'),
  staffOnCall:     () => get<ApiResponse<{ staff_name: string; staff_mobile: string }>>('/mis/staff-on-call'),

  // Business tracking - reads
  business:        (params?: Record<string, string>) => get<ApiResponse<BusinessFile[]>>('/mis/business', params),
  businessAllocated: (params?: Record<string, string>) => get<ApiResponse<BusinessFile[]>>('/mis/business/allocated', params),
  businessAllocatedFile: (fileNo: string) => get<ApiResponse<BusinessFile & { notes: BusinessNote[]; docs: BusinessDoc[] }>>(`/mis/business/allocated/${encodeURIComponent(fileNo)}`),
  businessFile:    (fileNo: string) => get<ApiResponse<BusinessFile & { notes: BusinessNote[]; docs: BusinessDoc[] }>>(`/mis/business/${encodeURIComponent(fileNo)}`),
  businessSummary: () => get<ApiResponse<BusinessSummary>>('/mis/business/summary/counts'),

  // Business tracking - writes
  businessRegister: (body: Partial<BusinessFile>) =>
    post<ApiResponse<{ file_no: string }>>('/business/register', body),
  businessUpdate: (fileNo: string, body: Partial<BusinessFile>) =>
    put<ApiResponse<void>>(`/business/${encodeURIComponent(fileNo)}`, body),
  businessDelete: (fileNo: string) =>
    del<ApiResponse<void>>(`/business/${encodeURIComponent(fileNo)}`),
  businessReviewAction: (fileNo: string, body: BusinessReviewActionBody) =>
    post<ApiResponse<{
      file_status: string;
      work_item_id: number;
      queue_name: 'BPO_REVIEW_RETAIL' | 'BPO_REVIEW_CORPORATE_SME';
      allocation_route: 'STANDARD_ALLOCATION' | 'PRICING_HANDOFF';
      pricing_handoff_at: string | null;
    }>>(`/business/${encodeURIComponent(fileNo)}/review-action`, body),
  businessAllocatedFileAction: (fileNo: string, body: AllocatedFileActionBody) =>
    post<ApiResponse<{ file_status: string; work_item_id?: number; queue_name: string; team_name: string }>>(`/business/${encodeURIComponent(fileNo)}/allocation-action`, body),
  businessAllocatedActionOptions: () =>
    get<ApiResponse<AllocatedFileActionOption[]>>('/business/allocated/action-options'),
  businessAllocatedRefundsSummary: () =>
    get<ApiResponse<AllocatedRefundLedgerSummary>>('/mis/business/allocated/refunds-summary'),
  allocationDestination: (action: AllocatedFileActionBody['action']) =>
    get<ApiResponse<AllocationDestination>>('/business/allocation-destinations', { action }),
  businessAllocatedAmlStatus: (fileNo: string) =>
    get<ApiResponse<AllocatedFileAmlStatus>>(`/business/allocated/${encodeURIComponent(fileNo)}/aml-status`),
  businessForward: (fileNo: string, body?: { to_user?: string; comments?: string }) =>
    post<ApiResponse<{ new_status: string; queue_name: 'BPO_REVIEW_RETAIL' | 'BPO_REVIEW_CORPORATE_SME'; work_item_id?: number; already_routed: boolean }>>(`/business/${encodeURIComponent(fileNo)}/forward`, body),
  businessAllocate: (fileNo: string, allocated_to: string) =>
    post<ApiResponse<void>>(`/business/${encodeURIComponent(fileNo)}/allocate`, { allocated_to }),
  businessAddNote: (fileNo: string, notes: string) =>
    post<ApiResponse<{ note_id: number }>>(`/business/${encodeURIComponent(fileNo)}/notes`, { notes }),
  businessAckDoc: (fileNo: string, reqId: number) =>
    post<ApiResponse<void>>(`/business/${encodeURIComponent(fileNo)}/checklist/${reqId}`),
  businessUnAckDoc: (fileNo: string, reqId: number) =>
    del<ApiResponse<void>>(`/business/${encodeURIComponent(fileNo)}/checklist/${reqId}`),

  // History & documentation complete
  businessAllocatedHistory: (fileNo: string) =>
    get<ApiResponse<AuditEntry[]>>(`/business/allocated/${encodeURIComponent(fileNo)}/history`),
  businessGetHistory: (fileNo: string) =>
    get<ApiResponse<AuditEntry[]>>(`/business/${encodeURIComponent(fileNo)}/history`),
  businessMarkComplete: (fileNo: string, complete: boolean) =>
    post<ApiResponse<void>>(`/business/${encodeURIComponent(fileNo)}/mark-complete`, { complete }),

  // Document uploads
  businessAllocatedUploads: (fileNo: string) =>
    get<ApiResponse<BusinessUpload[]>>(`/business/allocated/${encodeURIComponent(fileNo)}/uploads`),
  businessListUploads: (fileNo: string) =>
    get<ApiResponse<BusinessUpload[]>>(`/business/${encodeURIComponent(fileNo)}/uploads`),
  businessRecordUpload: (fileNo: string, body: {
    req_id?: number; filename: string; filesize?: number;
    mime_type?: string; storage_key: string;
  }) => post<ApiResponse<{ upload_id: number }>>(`/business/${encodeURIComponent(fileNo)}/uploads`, body),
  businessAllocatedRecordUpload: (fileNo: string, body: {
    req_id: number; filename: string; filesize?: number;
    mime_type?: string; storage_key: string;
    invoice_no?: string; amount?: string; policy_code?: string; risk_rate?: string; risk_reason?: string;
  }) => post<ApiResponse<{ upload_id: number }>>(`/business/allocated/${encodeURIComponent(fileNo)}/uploads`, body),
  businessDeleteUpload: (fileNo: string, uploadId: number) =>
    del<ApiResponse<void>>(`/business/${encodeURIComponent(fileNo)}/uploads/${uploadId}`),

  // Reference data
  businessRequirements: (client_type?: string) =>
    get<ApiResponse<BusinessRequirement[]>>('/business/requirements', client_type ? { client_type } : undefined),
  configurableBusinessRequirements: (params?: Record<string, string>) =>
    get<ApiResponse<ConfigurableBusinessRequirement[]>>('/admin/business-requirements', params),
  createBusinessRequirement: (body: BusinessRequirementInput) =>
    post<ApiResponse<ConfigurableBusinessRequirement>>('/admin/business-requirements', body),
  updateBusinessRequirement: (docId: number, body: BusinessRequirementInput) =>
    put<ApiResponse<ConfigurableBusinessRequirement>>(`/admin/business-requirements/${docId}`, body),
  amlRiskReasons: () => get<ApiResponse<AmlRiskReasonSource>>('/business/aml/risk-reasons'),
  bpoReviewers: () => get<ApiResponse<BpoReviewer[]>>('/business/bpo-reviewers'),
  walkInStaff: () => get<ApiResponse<Employee[]>>('/business/walk-in-staff'),
  counties: () => get<ApiResponse<string[]>>('/business/counties'),
  sectors: () => get<ApiResponse<string[]>>('/business/sectors'),

  agents:   () => get<ApiResponse<SalesAgent[]>>('/mis/agents'),
  employees:(params?: Record<string, string>) => get<ApiResponse<Employee[]>>('/mis/employees', params),
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
