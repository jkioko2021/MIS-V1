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
};
export type CashierDetail = {
  file: CashierFile;
  notes: { note_id: number; note_from: string; notes: string; note_date: string }[];
  uploads: { upload_id: number; filename: string; req_name: string; uploaded_by: string; uploaded_at: string }[];
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
  cashier: (search: string, page: number) => request<Envelope<CashierFile[]> & { total: number; page: number; pageSize: number }>(
    `/cashier?${new URLSearchParams({ search, page: String(page) })}`,
  ),
  cashierDetail: (fileNo: string) => request<Envelope<CashierDetail>>(`/cashier/files/${encodeURIComponent(fileNo)}`),
  cashierDownloadUrl: (fileNo: string, uploadId: number) => `${apiBase}/cashier/files/${encodeURIComponent(fileNo)}/uploads/${uploadId}/download`,
  notifications: () => request<Envelope<StaffNotification[]> & { unreadCount: number }>('/notifications'),
  markNotificationRead: (id: number) => request<{ ok: true }>(`/notifications/${id}/read`, { method: 'POST' }),
};
