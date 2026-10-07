export type FilingFile = {
  file_no: string; proposer_name: string; receive_dt: string;
  premium: string | number | null; file_status: string;
  business_type: string; client_type: string; business: string;
  invoice_no: string | null; entered_by: string | null;
  allocated_to: string | null; updated_at: string;
  receipted: boolean; updated: boolean; policy_generated: boolean;
  policy_signed: boolean; policy_dispatched: boolean;
  filed: boolean; filed_by: string | null; filed_date: string | null;
};
export type FilingUpload = {
  upload_id: number; filename: string; req_name: string;
  uploaded_by: string; uploaded_at: string;
  filed: boolean; filed_by: string | null; filed_date: string | null;
};
export type FilingDetail = {
  file: FilingFile; reviewable: boolean;
  notes: { note_id: number; note_from: string; note_date: string; notes: string }[];
  uploads: FilingUpload[];
  reviews: { filing_id: number; filed_by: string; filed_at: string; comments: string; upload_ids: number[] }[];
};
type Envelope<T> = { ok: boolean; data: T };
type FilingList = Envelope<FilingFile[]> & {
  total: number; page: number; pageSize: number;
  counts: { N: number; R: number; A: number };
};
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/record-filing`;
const filePath = (fileNo: string) => `/files/${encodeURIComponent(fileNo)}`;
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    credentials: 'include',
    ...(body === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to complete the Record Filing request.');
  return result as T;
}
export const filingApi = {
  list: (params: { bucket?: 'pending' | 'filed'; business_type?: 'N' | 'R' | 'A' | 'all'; search?: string; page?: number }) =>
    request<FilingList>(`?${new URLSearchParams(Object.entries(params).map(([k,v]) => [k,String(v)]))}`),
  detail: (fileNo: string) => request<Envelope<FilingDetail>>(filePath(fileNo)),
  file: (fileNo: string, input: { action: 'F'; expected_updated_at: string; upload_ids: number[]; comments?: string }) =>
    request<Envelope<{ file_status: 'FILED'; filed_documents: number; notification_statuses: string[] }>>(`${filePath(fileNo)}/file`, input),
  downloadUrl: (fileNo: string, uploadId: number) => `${base}${filePath(fileNo)}/uploads/${uploadId}/download`,
};
