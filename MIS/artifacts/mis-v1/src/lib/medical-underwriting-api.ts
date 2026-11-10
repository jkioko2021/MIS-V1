import type { MedicalDocumentInput } from '@workspace/api-client-react';
export type MedicalFile = {
  file_no: string; proposer_name: string; family_code: string | null;
  receive_dt: string; premium: string | number; file_status: string;
  business_type: string; client_type: string; agent_id: string | null;
  benefit_verified: string | null; entered_by: string; updated_at: string;
  invoice_no: string | null; paid_status: string | null; pay_ref_no: string | null;
  paid_amt: string | number | null; mu_revert: boolean; lateral_movement: boolean;
  assigned_to: string | null; reviewable: boolean;
};
export type MedicalReviewInput = {
  action: 'C' | 'F' | 'RI' | 'H' | 'D'; comments: string;
  hpc: boolean; lateral_movement: boolean; expected_updated_at: string;
  invoice_no?: string; paid_status?: string;
};
export type MedicalReviewResult = {
  file_status: string;
  notification?: { email_status: string };
};
export type HpcInput = {
  member_no: string; member_name: string; proposer_name: string; client_type: 'R' | 'C';
  condition: string; disease_code?: string; diagnosed_date?: string;
  mobile?: string; email?: string; source?: string; followup_date?: string; notes?: string;
};
export type MedicalUploadInput = MedicalDocumentInput;
export type MedicalDetail = {
  file: MedicalFile;
  notes: { note_id: number; note_from: string; notes: string; note_date: string }[];
  uploads: { upload_id: number; filename: string; req_name: string; uploaded_by: string;
    uploaded_at: string; invoice_no: string | null; amount: string | null; policy_code: string | null }[];
  reviews: { review_id: number; action: string; comments: string; reviewed_by: string;
    reviewed_at: string; hpc: boolean; lateral_movement: boolean; destination: string | null }[];
  requirements: { req_id: number; req_name: string }[];
  hpc: (HpcInput & { hpc_id: number; registered_by: string; registered_at: string })[];
};
type Envelope<T> = { ok: boolean; data: T; error?: string };
const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/medical-underwriting`;
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    credentials: 'include',
    ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error ?? 'Unable to complete the medical review request.');
  return data;
}
const filePath = (fileNo: string) => `/files/${encodeURIComponent(fileNo)}`;
export const medicalApi = {
  list: (queue: 'pending' | 'hold' | 'declined' | 'reverted', search = '', page = 1) =>
    request<Envelope<MedicalFile[]> & { total: number; page: number; pageSize: number }>(`?${new URLSearchParams({ queue, search, page: String(page) })}`),
  detail: (fileNo: string) => request<Envelope<MedicalDetail>>(filePath(fileNo)),
  review: (fileNo: string, input: MedicalReviewInput) => request<Envelope<MedicalReviewResult>>(`${filePath(fileNo)}/review`, input),
  saveHpc: (fileNo: string, input: HpcInput) => request<Envelope<{ hpc_id: number }>>(`${filePath(fileNo)}/hpc`, input),
  upload: (fileNo: string, input: MedicalUploadInput) => request<Envelope<{ upload_id: number }>>(`${filePath(fileNo)}/uploads`, input),
  downloadUrl: (fileNo: string, uploadId: number) => `${base}${filePath(fileNo)}/uploads/${uploadId}/download`,
  uploadBytes: async (file: File) => {
    const response = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage/uploads/request-url`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Unable to prepare document upload.');
    const stored = await fetch(data.uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
    if (!stored.ok) throw new Error('Document upload failed.');
    return data.objectPath as string;
  },
};
