export type CashierFile = {
  file_no: string;
  proposer_name: string;
  file_status: string;
  receive_dt: string;
  invoice_no: string | null;
  paid_status: string | null;
  premium: string | number | null;
  entered_by: string | null;
  assigned_to: string | null;
  updated_at: string;
  business: string;
  business_type: string;
  client_type: string;
  invoiced: boolean;
  receipted: boolean;
  receipt_no: string | null;
  pay_ref_no: string | null;
  paid_amt: string | number | null;
  pay_mode: string | null;
  to_cashier_dt: string | null;
  forwarded_by: string | null;
};
export type CashierDetail = {
  file: CashierFile;
  notes: { note_id: number; note_from: string; notes: string; note_date: string }[];
  uploads: { upload_id: number; filename: string; req_name: string; uploaded_by: string; uploaded_at: string }[];
  requirements: { req_id: number; req_name: string }[];
  has_system_receipt: boolean;
  return_membership_to: string | null;
  related_payments: { file_no: string; proposer_name: string; premium: string | number | null; paid_amt: string | number | null; paid_status: string | null }[];
  reviews: { review_id: number; action: string; paid_status: string; receipt_no: string | null; comments: string; reviewed_by: string; reviewed_at: string }[];
};
export type CashierReviewInput = {
  action: 'M' | 'RM' | 'RI' | 'CC';
  paid_status: 'FULL-PAID' | 'PART-PAID' | 'NOT-PAID';
  comments: string;
  receipt_no?: string;
  expected_updated_at: string;
};
export type StaffNotification = {
  notification_id: number;
  file_no: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  email_status: 'WAITING_CONFIGURATION' | 'PENDING' | 'SENT' | 'RETRY' | 'NO_RECIPIENT' | string;
};
type Envelope<T> = { ok: boolean; data: T; error?: string };
const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { ...init, credentials: 'include' });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'The MIS service could not complete this request.');
  return payload as T;
}
export const staffWorkspaceApi = {
  cashier: (search: string, page: number, bucket: 'inbox' | 'credit-control' = 'inbox') => request<Envelope<CashierFile[]> & { total: number; page: number; pageSize: number }>(
    `/cashier?${new URLSearchParams({ search, page: String(page), bucket })}`,
  ),
  cashierDetail: (fileNo: string) => request<Envelope<CashierDetail>>(`/cashier/files/${encodeURIComponent(fileNo)}`),
  cashierDownloadUrl: (fileNo: string, uploadId: number) => `${apiBase}/cashier/files/${encodeURIComponent(fileNo)}/uploads/${uploadId}/download`,
  cashierReview: (fileNo: string, input: CashierReviewInput) => request<Envelope<{ file_status: string; queue_name: string | null }>>(
    `/cashier/files/${encodeURIComponent(fileNo)}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
  cashierUpload: (fileNo: string, input: { req_id: number; filename: string; filesize: number; mime_type: string; storage_key: string }) =>
    request<Envelope<{ upload_id: number }>>(`/cashier/files/${encodeURIComponent(fileNo)}/uploads`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
  cashierUploadBytes: async (file: File): Promise<string> => {
    const response = await fetch(`${apiBase}/storage/uploads/request-url`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Unable to prepare receipt upload.');
    const stored = await fetch(data.uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
    if (!stored.ok) throw new Error('Receipt upload failed.');
    return data.objectPath;
  },
  notifications: () => request<Envelope<StaffNotification[]> & { unreadCount: number }>('/notifications'),
  markNotificationRead: (id: number) => request<{ ok: true }>(`/notifications/${id}/read`, { method: 'POST' }),
};
