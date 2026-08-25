import { AlertCircle, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BusinessDoc } from '@/lib/mis-api';

export type AllocationDocumentTransaction = {
  reqId: number | '';
  invoiceNo: string;
  amount: string;
  policyCode: string;
  riskRate: string;
  riskReason: string;
};

type Props = {
  documents: BusinessDoc[];
  value: AllocationDocumentTransaction;
  file: File | null;
  isUploading: boolean;
  riskReasonSourceAvailable: boolean;
  riskReasonSourceMessage?: string;
  riskReasonOptions: Array<{ value: string; label: string }>;
  onChange: (next: AllocationDocumentTransaction) => void;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
};

function documentFlags(name: string) {
  const normalized = name.toLowerCase();
  const isCreditNote = normalized.includes('credit note');
  return {
    isCreditNote,
    isInvoice: normalized.includes('invoice') && !isCreditNote,
    isAmlRisk: /aml\s*risk|risk\s*rating/.test(normalized),
  };
}

export function BusinessTransactionPanel({
  documents,
  value,
  file,
  isUploading,
  riskReasonSourceAvailable,
  riskReasonSourceMessage,
  riskReasonOptions,
  onChange,
  onFileChange,
  onUpload,
}: Props) {
  const selectedDocument = documents.find(document => document.req_id === value.reqId);
  const flags = selectedDocument ? documentFlags(selectedDocument.req_name) : null;
  const fileExtension = file ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
  const uploadValidationMessage =
    !selectedDocument
      ? null
      : !file
        ? 'Choose a document file before uploading.'
        : file.size <= 0 || file.size > 10 * 1024 * 1024
          ? 'Documents must be between 1 byte and 10 MB.'
          : !['.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.rar', '.zip'].includes(fileExtension)
            ? 'Upload a supported Word, Excel, image, PDF, RAR, or ZIP document.'
            : (flags?.isInvoice || flags?.isCreditNote) &&
                (value.invoiceNo.trim().length < 1 || value.invoiceNo.trim().length > 25)
              ? 'Enter an invoice or credit-note number between 1 and 25 characters.'
              : flags?.isCreditNote &&
                  (!value.amount.trim() ||
                    !Number.isFinite(Number(value.amount)) ||
                    Number(value.amount) < 0)
                ? 'Enter a valid non-negative amount for a credit note.'
                : flags?.isAmlRisk && !riskReasonSourceAvailable
                  ? riskReasonSourceMessage ?? 'AML rating reasons are currently unavailable.'
                  : flags?.isAmlRisk &&
                      (!value.riskRate.trim() || !value.riskReason.trim())
                    ? 'Select an AML risk rate and rating reason.'
                    : null;
  const canUpload =
    !!selectedDocument &&
    !!file &&
    !isUploading &&
    !uploadValidationMessage;

  return (
    <section className="mb-5 rounded-xl border border-[#bfd9d5] bg-[#f7fbfa] p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#dff1ed] p-2 text-[#176861]">
          <FileUp className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#28746e]">
            Invoice / Credit Note
          </p>
          <h4 className="mt-0.5 font-semibold text-[#173d38]">Transaction details and evidence</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Document types come from this file’s selected checklist. Files are stored privately and linked to this allocation record.
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed bg-background px-3 py-2 text-sm text-muted-foreground">
          No document requirements are selected for this file.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="transaction-document-type">Invoice / Credit Note</Label>
            <select
              id="transaction-document-type"
              data-testid="select-transaction-document"
              value={value.reqId}
              onChange={event =>
                onChange({
                  reqId: event.target.value ? Number(event.target.value) : '',
                  invoiceNo: '',
                  amount: '',
                  policyCode: '',
                  riskRate: '',
                  riskReason: '',
                })
              }
              disabled={isUploading}
              className="h-9 w-full rounded-md border border-[#b9d5d0] bg-background px-2 text-sm"
            >
              <option value="">Select document type…</option>
              {documents.map(document => (
                <option key={document.req_id} value={document.req_id}>
                  {document.req_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transaction-invoice-number">Invoice / Cr No</Label>
            <Input
              id="transaction-invoice-number"
              value={value.invoiceNo}
              maxLength={25}
              onChange={event => onChange({ ...value, invoiceNo: event.target.value })}
              placeholder="Reference number"
              disabled={isUploading}
            />
            {!flags?.isInvoice && !flags?.isCreditNote && (
              <p className="text-xs text-muted-foreground">
                Used for invoice, credit-note, and Cashier workflows.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transaction-credit-amount">Amount</Label>
            <Input
              id="transaction-credit-amount"
              data-testid="input-transaction-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={value.amount}
              onChange={event => {
                const nextValue = event.target.value;
                if (nextValue === '' || /^\d*(\.\d*)?$/.test(nextValue)) {
                  onChange({ ...value, amount: nextValue });
                }
              }}
              placeholder="0.00"
              disabled={isUploading}
            />
            {!flags?.isCreditNote && (
              <p className="text-xs text-muted-foreground">
                Required when the selected document is a credit note.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transaction-policy-code">Policy Code</Label>
            <Input
              id="transaction-policy-code"
              value={value.policyCode}
              maxLength={100}
              onChange={event => onChange({ ...value, policyCode: event.target.value })}
              placeholder="Policy code, if applicable"
              disabled={isUploading}
            />
            {!flags?.isInvoice && !flags?.isAmlRisk && (
              <p className="text-xs text-muted-foreground">
                Used when required by the selected document or workflow.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transaction-aml-rate">AML Risk Rate</Label>
            <select
              id="transaction-aml-rate"
              value={value.riskRate}
              onChange={event => onChange({ ...value, riskRate: event.target.value })}
              disabled={isUploading || !riskReasonSourceAvailable || !flags?.isAmlRisk}
              className="h-9 w-full rounded-md border border-[#b9d5d0] bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="">
                {!flags?.isAmlRisk
                  ? 'Not required for selected document'
                  : !riskReasonSourceAvailable
                    ? 'Unavailable'
                    : 'Select rate…'}
              </option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transaction-aml-reason">Rating Reason</Label>
            <select
              id="transaction-aml-reason"
              data-testid="select-transaction-aml-reason"
              value={value.riskReason}
              onChange={event => onChange({ ...value, riskReason: event.target.value })}
              disabled={isUploading || !riskReasonSourceAvailable || !flags?.isAmlRisk}
              className="h-9 w-full rounded-md border border-[#b9d5d0] bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="">
                {!flags?.isAmlRisk
                  ? 'Not required for selected document'
                  : !riskReasonSourceAvailable
                    ? 'Unavailable'
                    : 'Select reason…'}
              </option>
              {riskReasonOptions.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {!riskReasonSourceAvailable && (
            <div className="sm:col-span-2 flex gap-2 rounded-md border border-[#e9c98d] bg-[#fff6df] p-3 text-xs leading-5 text-[#855c16]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {flags?.isAmlRisk
                  ? riskReasonSourceMessage ?? 'AML rating reasons are currently unavailable.'
                  : 'AML fields are inactive unless an AML risk document is selected.'}
              </span>
            </div>
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="transaction-file">Upload</Label>
            <Input
              id="transaction-file"
              data-testid="input-transaction-file"
              type="file"
              accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.pdf,.rar,.zip"
              onChange={event => onFileChange(event.target.files?.[0] ?? null)}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported: Word, Excel, image, PDF, RAR, or ZIP. Maximum 10 MB.
            </p>
          </div>

          {uploadValidationMessage && (
            <p className="sm:col-span-2 text-xs font-medium text-[#855c16]" role="alert">
              {uploadValidationMessage}
            </p>
          )}

          <Button
            type="button"
            data-testid="button-upload-transaction-document"
            onClick={onUpload}
            disabled={!canUpload}
            className="gap-1.5 sm:col-span-2"
          >
            <FileUp className="h-4 w-4" />
            {isUploading ? 'Uploading document…' : 'Upload document'}
          </Button>
        </div>
      )}
    </section>
  );
}