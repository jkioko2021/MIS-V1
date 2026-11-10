import { Clock3 } from 'lucide-react';
import type { MedicalFile } from '@/lib/medical-underwriting-api';

export const dateLabel = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const moneyLabel = (value?: string | number | null) =>
  value == null || value === ''
    ? '—'
    : `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export const isForbidden = (error: unknown) =>
  /\b403\b|forbidden|not authorized|access denied/i.test(errorText(error));

export function SectionHeading({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#377e79]">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-[-.02em] text-[#183a39]">{title}</h2>
      </div>
      {count !== undefined && (
        <span className="rounded-full bg-[#e7f0ed] px-2.5 py-1 font-mono text-xs text-[#426763]">{count}</span>
      )}
    </div>
  );
}

export function DataField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 border-l-2 border-[#d2e2dc] pl-3">
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#718582]">{label}</p>
      <p
        className="mt-1 break-words text-sm font-medium text-[#243f3d]"
        data-testid={`field-${label.toLowerCase().replaceAll(' ', '-')}`}
      >
        {value || '—'}
      </p>
    </div>
  );
}

export function QueueRow({
  file,
  active,
  onSelect,
}: {
  file: MedicalFile;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`button-open-file-${file.file_no}`}
      className={`group w-full border-b border-[#e8eeea] px-4 py-4 text-left transition-colors hover:bg-[#f3f8f5] ${
        active ? 'bg-[#edf5f1] shadow-[inset_3px_0_0_#357b74]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[12px] font-bold tracking-wide text-[#214f4b]">{file.file_no}</span>
        {file.mu_revert && (
          <span className="rounded bg-[#fff0d6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#94651f]">
            Returned
          </span>
        )}
      </div>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-[#203c3a]">{file.proposer_name}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#758783]">
        <span>{file.client_type === 'R' ? 'Retail' : 'Corporate'} · {file.business_type || 'Membership'}</span>
        <span className="font-mono">{dateLabel(file.receive_dt)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#42645f]">{moneyLabel(file.premium)}</span>
        <span className="flex items-center gap-1 text-[10px] text-[#82928e]">
          <Clock3 size={12} />
          {file.reviewable ? file.file_status : 'HPC registration only'}
        </span>
      </div>
    </button>
  );
}
