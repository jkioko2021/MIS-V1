import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronDown, Download, FileUp, RefreshCw, ShieldCheck } from 'lucide-react';
import type { RiskOptionsResponseData, RiskImportPreviewResponse, RiskImportResultResponse } from '@workspace/api-client-react';
import { useConfirmRiskRegisterImport, usePreviewRiskRegisterImport } from '@workspace/api-client-react';
import { buttonClass, dateLabel, envelopeData, envelopeError, ErrorNotice, Field, fieldClass, queryError, secondaryButton } from './risk-ui';

const MAX_BYTES = 60 * 1024;

type PreviewData = RiskImportPreviewResponse['data'];
type ConfirmData = RiskImportResultResponse['data'];

function buildSample(options: RiskOptionsResponseData) {
  const o = options;
  const dept = o.departments?.[0]?.depart_code ?? 'FIN';
  const open = (o.periods ?? []).find(p => String(p.status ?? '').toLowerCase() === 'open');
  return {
    records: [{
      legacy_risk_code: 'LEG-2023-014',
      depart_code: dept,
      period_from: open?.period_from?.slice(0, 10) ?? '2024-01-01',
      period_to: open?.period_to?.slice(0, 10) ?? '2024-06-30',
      objective_code: o.objectives?.find(item => item.depart_code === dept)?.obj_code ?? 'REPLACE_OBJECTIVE',
      risk_title: 'Delayed premium reconciliation',
      risk_description: 'Bank statements reconciled monthly instead of weekly.\nUnmatched receipts accumulate.',
      risk_category: o.categories?.[0]?.category_code ?? 'REPLACE_CATEGORY',
      risk_consequence: 'Misstated receivables and delayed cover confirmation.',
      i_rate: 72.5,
      l_rate: 41.25,
      control_effectiveness: 0.375,
      current_contr: 'Monthly reconciliation by finance officer.',
      desired_contr_effe: 'Weekly automated matching with exception queue.',
      root_causes: [{
        root_cause: 'Manual matching of bank lines',
        current_contr: 'Spreadsheet matching',
        mitigations: 'Introduce automated bank feed matching',
        due_date: '2024-05-31',
        action_status: o.action_statuses?.[0]?.status ?? 'REPLACE_STATUS',
        action_owner: 'legacy.username (provenance only)',
      }],
    }],
  };
}

const byteLength = (s: string) => new TextEncoder().encode(s).length;

export default function RiskImportPanel({ options }: { options: RiskOptionsResponseData }) {
  const client = useQueryClient();
  const o = options;
  const [sourceName, setSourceName] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ConfirmData | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [reading, setReading] = useState(false);
  const sample = useMemo(() => JSON.stringify(buildSample(options), null, 2), [options]);
  const bytes = byteLength(sourceText);
  const tooBig = bytes > MAX_BYTES;

  const previewM = usePreviewRiskRegisterImport();
  const confirmM = useConfirmRiskRegisterImport();
  const busy = reading || previewM.isPending || confirmM.isPending;

  const reset = () => { setPreview(null); setAgreed(false); setError(''); setResult(null); };
  const changeText = (v: string) => { setSourceText(v); reset(); };
  const changeName = (v: string) => { setSourceName(v); reset(); };

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_BYTES) { reset(); setError(`File is ${(file.size / 1024).toFixed(1)} KB — the limit is 60 KB.`); return; }
    setReading(true);
    try {
      const t = await file.text();
      setSourceText(t);
      setSourceName(file.name);
      reset();
    } catch { reset(); setError('Unable to read this file. Try pasting the JSON instead.'); }
    finally { setReading(false); }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([sample], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'legacy-risk-import-template.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const runPreview = () => {
    setError(''); setResult(null); setPreview(null); setAgreed(false);
    previewM.mutate({ data: { source_name: sourceName.trim(), source_text: sourceText } }, {
      onSuccess: (res: unknown) => {
        const failure = envelopeError(res);
        if (failure) { setError(failure); return; }
        setPreview(envelopeData<PreviewData>(res) ?? null);
      },
      onError: (e: unknown) => { setError(queryError(e)); setPreview(null); setAgreed(false); },
    });
  };

  const canConfirm = Boolean(preview?.valid && preview.preview_token && agreed && !tooBig && !busy);
  const runConfirm = () => {
    if (!preview?.preview_token || !canConfirm) return;
    setError('');
    confirmM.mutate({ data: { source_name: sourceName.trim(), source_text: sourceText, preview_token: preview.preview_token, environment: preview.environment, confirm: true } }, {
      onSuccess: (res: unknown) => {
        const failure = envelopeError(res);
        if (failure) { setError(failure); return; }
        setResult(envelopeData<ConfirmData>(res) ?? null);
        setPreview(null); setAgreed(false);
        client.invalidateQueries({ predicate: q => q.queryKey.some(p => typeof p === 'string' && (p.startsWith('/api/risk-register') || p === 'risk-register')) });
      },
      onError: (e: unknown) => { setError(queryError(e)); setPreview(null); setAgreed(false); },
    });
  };

  const openPeriods = (o.periods ?? []).filter(p => String(p.status ?? '').toLowerCase() === 'open');
  const refList = (label: string, list: string[]) => <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="mt-1 flex max-h-48 flex-wrap gap-1 overflow-auto">{list.length ? list.map((item, i) => {
      return <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-[Space_Mono] text-[11px]">{item}</code>;
    }) : <span className="text-xs text-muted-foreground">None available</span>}</div>
  </div>;

  return <section className="space-y-5">
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><div>
        <strong>Insert-only legacy import.</strong> New risks are created; <em>no existing records are updated</em>. The import never changes client AML ratings, workflow sign-off, closures, usernames, or permissions. Historical <code>action_owner</code> and any extra legacy fields are kept only as raw provenance history. Files are read in your browser — nothing is stored as an upload.
      </div></div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <fieldset disabled={busy} className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-[Manrope] text-lg font-bold">1 · Source</h3>
        <Field label="Source label" hint="e.g. Legacy ERM export, Finance Q2 2024">
          <input className={fieldClass} value={sourceName} maxLength={200} onChange={e => changeName(e.target.value)} data-testid="input-import-source-name" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <label className={`${secondaryButton} cursor-pointer`}><FileUp className="h-4 w-4" />Choose JSON file
            <input type="file" accept=".json,application/json" className="sr-only" data-testid="input-import-file" onChange={e => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <button type="button" className={secondaryButton} onClick={() => { changeText(sample); if (!sourceName) setSourceName('Template sample'); }}>Use sample</button>
          <button type="button" className={secondaryButton} onClick={download}><Download className="h-4 w-4" />Download template</button>
          {sourceText && <button type="button" className={secondaryButton} onClick={() => changeText('')}>Clear</button>}
        </div>
        <Field label="JSON source" hint={`${(bytes / 1024).toFixed(1)} KB of 60 KB (UTF-8)`}>
          <textarea className={`${fieldClass} min-h-64 font-[Space_Mono] text-xs`} spellCheck={false} value={sourceText} onChange={e => changeText(e.target.value)} placeholder='{"records": [ ... ]}' data-testid="textarea-import-source" />
        </Field>
        {tooBig && <ErrorNotice message="Source exceeds the 60 KB limit. Split it into smaller batches." />}
        <button className={buttonClass} disabled={!sourceText.trim() || !sourceName.trim() || tooBig || previewM.isPending} onClick={runPreview} data-testid="button-import-preview">
          {previewM.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Validate &amp; preview
        </button>
      </fieldset>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-sm">
        <h3 className="font-[Manrope] text-lg font-bold">Format</h3>
        <p className="text-muted-foreground">Top-level <code>{'{ "records": [ ... ] }'}</code>. Each record:</p>
        <ul className="space-y-1 text-xs leading-5">
          <li><code>legacy_risk_code</code> — unique source identifier; department, objective and category must use approved active codes.</li>
          <li><code>period_from</code>, <code>period_to</code> — YYYY-MM-DD matching an open period</li>
          <li><code>risk_title</code>, <code>risk_description</code>, <code>risk_consequence</code></li>
          <li><code>i_rate</code>, <code>l_rate</code> — positive, ≤ 100, up to 2 decimals</li>
          <li><code>control_effectiveness</code> — <strong>fraction 0..1</strong> (e.g. 0.375, not 37.5), up to 6 decimals</li>
          <li><code>current_contr</code>, <code>desired_contr_effe</code></li>
          <li><code>root_causes</code>: [{'{'}root_cause, current_contr, mitigations, due_date, action_status{'}'}]</li>
          <li className="text-muted-foreground">Historical <code>action_owner</code> and unknown fields: raw history only.</li>
        </ul>
        <div className="space-y-3 border-t border-border pt-3">
          <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Open periods</div>
            <div className="mt-1 flex flex-wrap gap-1">{openPeriods.length ? openPeriods.map(p => <code key={p.period_id} className="rounded bg-muted px-1.5 py-0.5 font-[Space_Mono] text-[11px]">{p.period_from?.slice(0, 10)} → {p.period_to?.slice(0, 10)}</code>) : <span className="text-xs text-rose-700">No open period — open one before importing.</span>}</div></div>
          {refList('Departments', o.departments.map(d => d.depart_code ?? '—'))}
          {refList('Objectives (department)', o.objectives.map(d => `${d.obj_code} (${d.depart_code})`))}
          {refList('Categories', o.categories.map(d => d.category_code ?? '—'))}
          {refList('Action status names', (o.action_statuses ?? []).map(d => d.status))}
        </div>
      </div>
    </div>

    {error && <ErrorNotice message={error} />}
    {result && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <strong>Imported {result.imported} risk{result.imported === 1 ? '' : 's'} into {result.environment}.</strong>
      {result.risk_codes.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{result.risk_codes.map(c => <code key={c} className="rounded bg-white/70 px-1.5 py-0.5 font-[Space_Mono] text-[11px]">{c}</code>)}</div>}
    </div>}

    {preview && <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[Manrope] text-lg font-bold">2 · Preview</h3>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1 font-bold">Env: {preview.environment}</span>
          <span className={`rounded-full px-2.5 py-1 font-bold ${preview.valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{preview.valid ? 'Valid' : 'Invalid'}</span>
          {preview.expires_at && <span className="rounded-full bg-muted px-2.5 py-1">Token expires {dateLabel(preview.expires_at)} {new Date(preview.expires_at).toLocaleTimeString()}</span>}
        </div>
      </div>
      {preview.errors.length > 0 && <ul className="space-y-1 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{preview.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground"><tr>
            {['Row', 'Legacy code', 'Dept', 'Title', 'Period', 'Inherent', 'Residual', 'Errors / warnings'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}
          </tr></thead>
          <tbody>{preview.rows.map(r => <tr key={r.row} className={`border-t border-border align-top ${r.errors.length ? 'bg-rose-50/60' : ''}`}>
            <td className="px-3 py-2 font-[Space_Mono]">{r.row}</td>
            <td className="px-3 py-2 font-[Space_Mono]">{r.legacy_risk_code ?? '—'}</td>
            <td className="px-3 py-2">{r.depart_code ?? '—'}</td>
            <td className="px-3 py-2">{r.risk_title ?? '—'}</td>
            <td className="px-3 py-2">{r.period_id ?? '—'}</td>
            <td className="px-3 py-2 font-[Space_Mono]">{r.inherent ?? '—'}</td>
            <td className="px-3 py-2 font-[Space_Mono]">{r.residual ?? '—'}</td>
            <td className="px-3 py-2">
              {r.errors.map((e, i) => <div key={`e${i}`} className="text-rose-800">✕ {e}</div>)}
              {r.warnings.map((w, i) => <div key={`w${i}`} className="flex gap-1 text-amber-800"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{w}</div>)}
              {!r.errors.length && !r.warnings.length && <span className="text-emerald-700">OK</span>}
            </td>
          </tr>)}</tbody>
        </table>
      </div>
      <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => setShowRaw(v => !v)}>
        <ChevronDown className={`h-3.5 w-3.5 transition ${showRaw ? 'rotate-180' : ''}`} />{showRaw ? 'Hide' : 'Show'} raw source
      </button>
      {showRaw && <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 font-[Space_Mono] text-[11px]">{sourceText}</pre>}

      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-[Manrope] text-lg font-bold">3 · Confirm</h3>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={agreed} disabled={!preview.valid || !preview.preview_token} onChange={e => setAgreed(e.target.checked)} data-testid="checkbox-import-confirm" />
          <span>I confirm inserting {preview.rows.length} new risk{preview.rows.length === 1 ? '' : 's'} into the <strong>{preview.environment}</strong> environment. Insert only — no existing records, AML, sign-off, closures or usernames will change.</span>
        </label>
        <button className={buttonClass} disabled={!canConfirm} onClick={runConfirm} data-testid="button-import-confirm">
          {confirmM.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}Import into {preview.environment}
        </button>
      </div>
    </div>}
  </section>;
}
