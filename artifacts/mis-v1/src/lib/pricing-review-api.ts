export type PricingFile = {
  file_no: string;
  proposer_name: string;
  receive_dt: string;
  premium: string | number | null;
  file_status: string;
  business_type: string | null;
  client_type: string | null;
  rate_type: string | null;
  allocated_to: string | null;
  entered_by: string | null;
  benefit_verified: string | null;
  benefit_ver_by: string | null;
  benefit_ver_date: string | null;
  updated_at: string;
  reviewable: boolean;
};

export type PricingDetail = {
  file: PricingFile;
  notes: { note_id: number; note_from: string; notes: string; note_date: string }[];
  uploads: { upload_id: number; filename: string; req_name: string; uploaded_by: string; uploaded_at: string }[];
  reviews: { review_id: number; action: string; comments: string; reviewed_by: string; reviewed_at: string }[];
  requirements: { req_id: number; req_name: string }[];
  has_rates_matrix: boolean;
  allocation_recipients: { username: string; employee_name: string }[];
};

export type PricingReviewInput = {
  action: 'YES' | 'NO';
  comments: string;
  expected_updated_at: string;
  allocated_to?: string;
};

type Envelope<T> = { ok: boolean; data: T; error?: string };
const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;
const base = `${apiBase}/pricing-review`;

async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...(body === undefined ? {} : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to complete the pricing review request.');
  return result as T;
}

const filePath = (fileNo: string) => `/files/${encodeURIComponent(fileNo)}`;

export const pricingReviewApi = {
  list: (search = '', page = 1) => request<Envelope<PricingFile[]> & { total: number; page: number; pageSize: number }>(
    `${base}?${new URLSearchParams({ search, page: String(page) })}`,
  ),
  detail: (fileNo: string) => request<Envelope<PricingDetail>>(`${base}${filePath(fileNo)}`),
  review: (fileNo: string, input: PricingReviewInput) =>
    request<Envelope<{ file_status: string; allocated_to: string | null }>>(`${base}${filePath(fileNo)}/review`, input),
  upload: (fileNo: string, input: { req_id: number; filename: string; filesize: number; mime_type: string; storage_key: string }) =>
    request<Envelope<{ upload_id: number }>>(`${base}${filePath(fileNo)}/uploads`, input),
  downloadUrl: (fileNo: string, uploadId: number) => `${base}${filePath(fileNo)}/uploads/${uploadId}/download`,
  uploadBytes: async (file: File) => {
    const response = await fetch(`${apiBase}/storage/uploads/request-url`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream' }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error ?? 'Unable to prepare document upload.');
    const stored = await fetch(result.uploadURL, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    if (!stored.ok) throw new Error('Document upload failed while transferring the file.');
    return result.objectPath as string;
  },
};
