import type { ApiResponse, BusinessFile, BusinessNote, BusinessUpload } from '@/lib/mis-api';

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

export interface GiStaff {
  username: string;
  employee_name: string;
}

export interface GiFileDetail {
  file: BusinessFile;
  notes: BusinessNote[];
  uploads: Array<BusinessUpload & { req_name: string }>;
}

export interface GiQueueResponse {
  ok: boolean;
  data: BusinessFile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GiDecisionResponse {
  file_status: string;
  queue_name: string;
  notification_status: string | null;
}

export interface GiDecisionBody {
  action: 'A' | 'RI';
  assigned_to?: string;
  comments: string;
  expected_updated_at: string;
}

async function read<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error ?? `Request failed (${response.status})`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

export const giApi = {
  list: (search: string, page: number) => {
    const params = new URLSearchParams({ search, page: String(page) });
    return read<GiQueueResponse>(`${apiBase}/gi/allocate?${params.toString()}`);
  },
  staff: () => read<ApiResponse<GiStaff[]>>(`${apiBase}/gi/staff`),
  detail: (fileNo: string) =>
    read<ApiResponse<GiFileDetail>>(`${apiBase}/gi/files/${encodeURIComponent(fileNo)}`),
  decide: (fileNo: string, body: GiDecisionBody) =>
    fetch(`${apiBase}/gi/files/${encodeURIComponent(fileNo)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    }).then(async response => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) {
        const error = new Error(payload.error ?? `Request failed (${response.status})`) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }
      return payload as ApiResponse<GiDecisionResponse>;
    }),
  downloadUrl: (fileNo: string, uploadId: number) =>
    `${apiBase}/gi/files/${encodeURIComponent(fileNo)}/uploads/${uploadId}/download`,
};
