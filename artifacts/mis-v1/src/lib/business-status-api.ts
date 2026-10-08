const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/business-status`;

export interface StatusFile {
  file_no: string;
  proposer_name: string;
  receive_dt: string;
  business_type: string;
  client_type: string;
  business: string;
  product: string | null;
  file_status: string;
  entered_by: string;
  updated_at: string;
  forwarded: boolean;
  invoiced: boolean;
  receipted: boolean;
  filed: boolean;
  is_completed: boolean;
  current_queue: string | null;
  responsible_username: string | null;
  responsible_name: string | null;
  can_view_details: boolean;
}
export interface StatusMovement {
  work_item_id: number;
  queue_name: string;
  work_status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  assigned_by: string | null;
  forwarded_by: string | null;
  forwarded_at: string;
  created_at: string;
  updated_at: string;
}
export interface StatusDocument {
  upload_id: number;
  filename: string;
  req_name: string | null;
  code: string | null;
  filesize: number | null;
  mime_type: string | null;
  uploaded_by: string;
  uploaded_at: string;
  invoice_no: string | null;
  amount: number | null;
  policy_code: string | null;
  risk_rate: string | null;
  risk_reason: string | null;
}
export interface StatusDetail {
  file: StatusFile;
  movements: StatusMovement[];
  notes: { note_id: number; note_from: string; note_date: string; notes: string }[];
  documents: StatusDocument[];
  financial: null | {
    premium: number | null; paid_amt: number | null; paid_status: string | null;
    pay_ref_no: string | null; invoice_no: string | null; invoice_date: string | null;
    receipt_no: string | null; receipt_date: string | null;
  };
  restriction_reason: string | null;
}
export interface StatusFilters {
  search?: string;
  search_by?: 'F' | 'P';
  business_type?: string;
  client_type?: string;
  status?: string;
  include_completed?: boolean;
  page?: number;
}
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { credentials: 'include' });
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error ?? 'Unable to load business status.');
  return body;
}
export const businessStatusApi = {
  list(filters: StatusFilters) {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') p.set(key, String(value));
    }
    return get<{ ok: true; data: StatusFile[]; total: number; page: number;
      pageSize: number; scopeLabel: string }>(`?${p}`);
  },
  options() {
    return get<{ ok: true; data: { statuses: string[]; businessTypes: string[];
      scopeLabel: string } }>('/options');
  },
  detail(fileNo: string) {
    return get<{ ok: true; data: StatusDetail }>(`/files/${encodeURIComponent(fileNo)}`);
  },
  downloadUrl(fileNo: string, uploadId: number) {
    return `${base}/files/${encodeURIComponent(fileNo)}/documents/${uploadId}/download`;
  },
};
