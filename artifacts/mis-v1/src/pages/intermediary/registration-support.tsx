import { useEffect, useRef, useState } from 'react';
import {
  useActionIntermediary,
  useConfirmIntermediaryUpload,
  useRequestIntermediaryUpload,
} from '@workspace/api-client-react';
import type { IntermediaryActionInput, IntermediaryDetail, IntermediaryLicence, IntermediaryUploadInputContentType as UploadMime } from '@workspace/api-client-react';
import { ArrowDownToLine, Check, FileCheck2, FilePlus2, FileText, Pencil, Plus, ShieldAlert, Users } from 'lucide-react';
import { ApiMessage, Button, Field, NoteField, StatusPill, SuccessMessage, Toggle } from './form-components';

type LicenceDraft = {
  licence_id: string; licence_no: string; valid_from: string; valid_to: string;
  ira_compliant: boolean; kyc_compliant: boolean; contract_signed: boolean; waiver: boolean; waiver_reason: string;
};
type DirectorDraft = { director_id: string; director_version: string; name: string; email: string; mobile_no: string; pin_no: string; nid_no: string };
type UploadIntent = { upload_url: string; document_id: number; file: File; mime: UploadMime; title: string; type: 'C001' | 'C002' };
const EMPTY_LICENCE = (): LicenceDraft => {
  const year = new Date().getFullYear();
  return { licence_id: '', licence_no: '', valid_from: `${year}-01-01`, valid_to: `${year}-12-31`, ira_compliant: true, kyc_compliant: true, contract_signed: true, waiver: false, waiver_reason: '' };
};
const EMPTY_DIRECTOR: DirectorDraft = { director_id: '', director_version: '', name: '', email: '', mobile_no: '', pin_no: '', nid_no: '' };
const MIME_BY_EXT: Record<string, UploadMime> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip', rar: 'application/vnd.rar',
};
const ALLOWED_MIME = new Set(Object.values(MIME_BY_EXT));

export type RegistrationSection = 'licence-documents' | 'directors' | 'review';

export function RegistrationSupport({ code, detail, version, activeSection = 'licence-documents', readOnly = false, onActionSuccess, onInvalidate, onReload }: {
  code: string; detail: IntermediaryDetail; version: number; readOnly?: boolean;
  activeSection?: RegistrationSection;
  onActionSuccess: (result: IntermediaryDetail) => void; onInvalidate: (code?: string) => Promise<void>; onReload: () => Promise<void>;
}) {
  const [licence, setLicence] = useState<LicenceDraft>(EMPTY_LICENCE);
  const [director, setDirector] = useState<DirectorDraft>(EMPTY_DIRECTOR);
  const [licenceNote, setLicenceNote] = useState('');
  const [directorNote, setDirectorNote] = useState('');
  const [documentType, setDocumentType] = useState<'C001' | 'C002'>('C001');
  const [documentTitle, setDocumentTitle] = useState('New Application/Licence');
  const [file, setFile] = useState<File | null>(null);
  const [uploadIntent, setUploadIntent] = useState<UploadIntent | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState('');
  const [transferring, setTransferring] = useState(false);
  const initializedFor = useRef('');
  const action = useActionIntermediary();
  const requestUpload = useRequestIntermediaryUpload();
  const confirmUpload = useConfirmIntermediaryUpload();
  const isPending = transferring || action.isPending || requestUpload.isPending || confirmUpload.isPending;
  const yearNow = new Date().getFullYear();
  const yearOptions = Array.from({ length: yearNow - 1999 + 10 }, (_, index) => yearNow + 10 - index);

  useEffect(() => {
    if (initializedFor.current !== code) {
      initializedFor.current = code;
      setLicence(EMPTY_LICENCE()); setDirector({ ...EMPTY_DIRECTOR });
      setLicenceNote(''); setDirectorNote('');
      setDocumentType('C001'); setDocumentTitle('New Application/Licence'); setFile(null); setUploadIntent(null);
      setError(null); setSuccess('');
    }
  }, [code]);
  const runAction = (data: Omit<IntermediaryActionInput, 'version'>) => {
    if (!code || !version) { setError(new Error('Load the initialized agent version before saving support records.')); return; }
    setError(null); setSuccess('');
    action.mutate({ code, data: { ...data, version } as IntermediaryActionInput }, {
      onSuccess: result => {
        onActionSuccess(result);
        if (data.action === 'SAVE_LICENCE') {
          const savedId = data.licence_id;
          const savedLicence = result.licences.find(item => savedId ? item.licence_id === savedId : item.licence_no === data.licence_no && item.valid_from === data.valid_from && item.valid_to === data.valid_to);
          if (savedLicence) setLicence({
            licence_id: String(savedLicence.licence_id), licence_no: savedLicence.licence_no,
            valid_from: savedLicence.valid_from, valid_to: savedLicence.valid_to,
            ira_compliant: savedLicence.ira_compliant, kyc_compliant: savedLicence.kyc_compliant,
            contract_signed: savedLicence.contract_signed, waiver: savedLicence.waiver ?? false,
            waiver_reason: savedLicence.waiver_reason ?? '',
          });
        }
        if (data.action === 'SAVE_LICENCE' || data.action === 'SUBMIT_LICENCE') setLicenceNote('');
        if (data.action === 'SAVE_DIRECTOR') { setDirectorNote(''); setDirector({ ...EMPTY_DIRECTOR }); }
        setSuccess(data.action === 'SAVE_LICENCE' ? 'Licence record saved.' : data.action === 'SAVE_DIRECTOR' ? 'Director record saved.' : 'Licence submitted for independent verification.');
        void onInvalidate(code);
      },
      onError: err => setError(err),
    });
  };
  const saveLicence = () => {
    if (!licence.licence_no.trim() || !licence.valid_from || !licence.valid_to || licence.valid_to < licence.valid_from || !licenceNote.trim()) {
      setError(new Error('Licence number, a valid date range and a change note are required.'));
      return;
    }
    if (licence.waiver && !licence.waiver_reason.trim()) { setError(new Error('Document the waiver reason before saving.')); return; }
    runAction({
      action: 'SAVE_LICENCE', notes: licenceNote.trim(),
      licence_id: licence.licence_id ? Number(licence.licence_id) : undefined,
      licence_no: licence.licence_no.trim(), valid_from: licence.valid_from, valid_to: licence.valid_to,
      ira_compliant: licence.ira_compliant, kyc_compliant: licence.kyc_compliant, contract_signed: licence.contract_signed,
      waiver: licence.waiver, waiver_reason: licence.waiver ? licence.waiver_reason.trim() : null,
    });
  };
  const submitLicence = (record: IntermediaryLicence) => {
    if (!detail.documents.length) { setError(new Error('A confirmed supporting document is required. A waiver never waives documentation.')); return; }
    if (!licenceNote.trim()) { setError(new Error('Add a licence change note before submission.')); return; }
    runAction({ action: 'SUBMIT_LICENCE', licence_id: record.licence_id, notes: licenceNote.trim() });
  };
  const chooseLicence = (record: IntermediaryLicence) => {
    if (readOnly) return;
    setLicence({
      licence_id: String(record.licence_id), licence_no: record.licence_no, valid_from: record.valid_from, valid_to: record.valid_to,
      ira_compliant: record.ira_compliant, kyc_compliant: record.kyc_compliant, contract_signed: record.contract_signed,
      waiver: record.waiver ?? false, waiver_reason: record.waiver_reason ?? '',
    });
    setLicenceNote(''); setError(null); setSuccess('');
  };
  const saveDirector = () => {
    if (!director.name.trim() || !directorNote.trim()) { setError(new Error('Director full name and an accountable change note are required.')); return; }
    runAction({
      action: 'SAVE_DIRECTOR', notes: directorNote.trim(), name: director.name.trim(),
      director_id: director.director_id ? Number(director.director_id) : undefined,
      director_version: director.director_version ? Number(director.director_version) : undefined,
      email: director.email.trim() || null, mobile_no: director.mobile_no.trim() || null,
      pin_no: director.pin_no.trim() || null, nid_no: director.nid_no.trim() || null,
    });
  };
  const editDirector = (item: IntermediaryDetail['directors'][number]) => {
    if (readOnly) return;
    setDirector({ director_id: String(item.director_id), director_version: String(item.version), name: item.name, email: item.email ?? '', mobile_no: item.mobile_no ?? '', pin_no: item.pin_no ?? '', nid_no: item.nid_no ?? '' });
    setDirectorNote(''); setError(null); setSuccess('');
  };
  const setYear = (year: number) => setLicence(current => ({ ...current, valid_from: `${year}-01-01`, valid_to: `${year}-12-31` }));
  const resolveMime = (selected: File): UploadMime | null => {
    const extension = selected.name.split('.').pop()?.toLowerCase() ?? '';
    const mapped = MIME_BY_EXT[extension];
    if (!mapped) return null;
    if (!selected.type) return mapped;
    return ALLOWED_MIME.has(selected.type as UploadMime) ? selected.type as UploadMime : mapped;
  };
  const startUpload = async () => {
    if (!file || !code || !documentTitle.trim()) { setError(new Error('Select a document type, title and file first.')); return; }
    if (file.size < 1 || file.size > 25 * 1024 * 1024) { setError(new Error('Choose a file between 1 byte and 25 MiB.')); return; }
    const mime = resolveMime(file);
    if (!mime) { setError(new Error('Supported formats: PDF, JPEG, PNG, GIF, Word, Excel, ZIP and RAR.')); return; }
    setError(null); setSuccess('');
    try {
      const response = await requestUpload.mutateAsync({ code, data: {
        title: documentTitle.trim(), document_type: documentType, file_name: file.name, content_type: mime, file_size: file.size,
      } });
      setUploadIntent({ upload_url: response.upload_url, document_id: response.document_id, file, mime, title: documentTitle.trim(), type: documentType });
      await transferAndConfirm({ upload_url: response.upload_url, document_id: response.document_id, file, mime, title: documentTitle.trim(), type: documentType });
    } catch (uploadError) { setError(uploadError); }
  };
  const transferAndConfirm = async (intent: UploadIntent) => {
    setTransferring(true);
    try {
      const uploadUrl = intent.upload_url.startsWith('/')
        ? new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${intent.upload_url}`, window.location.origin).toString()
        : intent.upload_url;
      const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': intent.mime }, body: intent.file });
      if (!put.ok) throw new Error(`File transfer failed (${put.status}). Retry will reuse the existing upload request.`);
      const result = await confirmUpload.mutateAsync({ code, id: intent.document_id });
      setUploadIntent(null); setFile(null); setSuccess(`Confirmed ${intent.title} document.`); setError(null);
      onActionSuccess(result); await onInvalidate(code);
    } catch (uploadError) { setError(uploadError); }
    finally { setTransferring(false); }
  };
  const reloadConflict = async () => {
    if (!window.confirm('Reload the latest agent version? This will discard the unsaved licence, director and document form drafts for this record.')) return;
    await onReload();
    setLicence(EMPTY_LICENCE()); setDirector({ ...EMPTY_DIRECTOR });
    setLicenceNote(''); setDirectorNote(''); setDocumentType('C001'); setDocumentTitle('New Application/Licence');
    setFile(null); setUploadIntent(null); setError(null);
    setSuccess('Latest version loaded. Unsaved support-record drafts were discarded.');
  };
  const downloadUrl = (id: number) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/intermediary/agents/${encodeURIComponent(code)}/documents/${id}/download`;
  const licensedDocs = detail.documents;

  return <div className="im-registration-support">
    <div className="im-support-heading"><div><div className="im-section-index">REGISTRATION SUPPORT · SAVED VERSION {version}</div><h3>{activeSection === 'licence-documents' ? 'Licence & documents' : activeSection === 'directors' ? 'Directors' : 'Retained history'}</h3><p>Supporting drafts remain in this workspace when you move between stages.</p></div><span className="im-version">v{version}</span></div>
    {!!error && <ApiMessage error={error} onRetry={uploadIntent ? () => void transferAndConfirm(uploadIntent) : undefined} />}
    {isConflict(error) && <div className="im-alert im-alert-warn im-conflict-reload"><div><strong>Another administrator changed this record.</strong><p>Your current support-record draft is retained. Reload only after confirming that it can be discarded.</p></div><Button variant="quiet" onClick={() => void reloadConflict()}>Reload current details</Button></div>}
    {success && <SuccessMessage>{success}</SuccessMessage>}

    <section className="im-support-section" hidden={activeSection !== 'licence-documents'}>
      <div className="im-support-section-head"><span><FileCheck2 size={16} /></span><div><b>IRA / Contract Details</b><small>Licence dates, compliance declarations and waiver audit trail</small></div></div>
      <div className="im-form-grid im-support-grid">
        <label className="im-field"><span>Document Name</span><select disabled={readOnly} value={documentType} onChange={event => { const type = event.target.value as 'C001' | 'C002'; setDocumentType(type); setDocumentTitle(type === 'C001' ? 'New Application/Licence' : 'Others'); }}><option value="C001">C001 · New Application/Licence</option><option value="C002">C002 · Others</option></select></label>
        <Field label="Licence No" value={licence.licence_no} onChange={value => setLicence(current => ({ ...current, licence_no: value }))} disabled={readOnly} />
        <label className="im-field"><span>Year</span><select disabled={readOnly} value={licence.valid_from.slice(0, 4)} onChange={event => setYear(Number(event.target.value))}>{yearOptions.map(year => <option key={year} value={year}>{year}</option>)}</select><small>Selection sets Valid From to 1 Jan and Valid To to 31 Dec.</small></label>
        <Field label="Valid From" type="date" value={licence.valid_from} onChange={value => setLicence(current => ({ ...current, valid_from: value }))} disabled={readOnly} required />
        <Field label="Valid To" type="date" value={licence.valid_to} onChange={value => setLicence(current => ({ ...current, valid_to: value }))} disabled={readOnly} required />
      </div>
      <div className="im-compliance-checks"><Toggle label="Contract Signed" checked={licence.contract_signed} onChange={value => setLicence(current => ({ ...current, contract_signed: value }))} /><Toggle label="IRA Compliance" checked={licence.ira_compliant} onChange={value => setLicence(current => ({ ...current, ira_compliant: value }))} /><Toggle label="KYC Compliance" checked={licence.kyc_compliant} onChange={value => setLicence(current => ({ ...current, kyc_compliant: value }))} /></div>
      <div className={`im-waiver-box ${licence.waiver ? 'requested' : ''}`}>
        <Toggle label="Request compliance waiver" checked={licence.waiver} onChange={value => setLicence(current => ({ ...current, waiver: value, waiver_reason: value ? current.waiver_reason : '' }))} />
        <p>A waiver is a request for an independent reviewer to accept documented exceptions. It never verifies a licence automatically, waives required documents, or waives current valid dates.</p>
        {licence.waiver && <label className="im-field"><span>Waiver reason <b className="im-required">*</b></span><textarea value={licence.waiver_reason} required maxLength={4000} disabled={readOnly} onChange={event => setLicence(current => ({ ...current, waiver_reason: event.target.value }))} placeholder="Describe each compliance exception and supporting rationale." /></label>}
      </div>
      {!readOnly && <>
        <NoteField value={licenceNote} onChange={setLicenceNote} label="Comments / licence change note" />
        <div className="im-form-footer"><span>Valid dates and a documented reason are required where waiver is requested.</span><Button disabled={isPending || !licenceNote.trim()} onClick={saveLicence}>{licence.licence_id ? 'Save licence changes' : 'Save licence'} <Check size={14} /></Button></div>
      </>}
      <div className="im-history-list">
        <div className="im-history-title">Licence history <span>{detail.licences.length}</span></div>
        {detail.licences.length === 0 ? <p className="im-support-empty">No licence records have been saved.</p> : detail.licences.map(item => <article className="im-support-row" key={item.licence_id}>
          <div className="im-support-row-main"><FileCheck2 size={16} /><div><b>{item.licence_no}</b><small>{item.valid_from} — {item.valid_to} · Entered by {item.entered_by}{item.reviewed_by ? ` · Reviewed by ${item.reviewed_by}` : ''}</small>
            <small className="im-flags">{item.contract_signed ? 'Contract signed' : 'Contract missing'} · {item.ira_compliant ? 'IRA compliant' : 'IRA exception'} · {item.kyc_compliant ? 'KYC compliant' : 'KYC exception'}{item.waiver ? ` · WAIVER REQUESTED: ${item.waiver_reason || 'Reason not supplied'}` : ''}</small>
          </div></div><StatusPill status={item.status} />
          {!readOnly && ['DRAFT', 'DECLINED'].includes(item.status) && <div className="im-support-row-actions"><Button variant="quiet" onClick={() => chooseLicence(item)}><Pencil size={13} /> Edit</Button><Button disabled={isPending || !detail.documents.length || !licenceNote.trim()} onClick={() => submitLicence(item)}>Submit for review</Button></div>}
        </article>)}
      </div>
    </section>

    <section className="im-support-section" hidden={activeSection !== 'licence-documents'}>
      <div className="im-support-section-head"><span><FileText size={16} /></span><div><b>Supporting Documents</b><small>Files are transferred directly to secure object storage; only metadata is recorded by MIS.</small></div></div>
      {!readOnly && <div className="im-document-upload">
        <div className="im-form-grid im-support-grid">
          <label className="im-field"><span>Document Name</span><select value={documentType} onChange={event => { const type = event.target.value as 'C001' | 'C002'; setDocumentType(type); setDocumentTitle(type === 'C001' ? 'New Application/Licence' : 'Others'); }}><option value="C001">C001 · New Application/Licence</option><option value="C002">C002 · Others</option></select></label>
          <Field label="Document title" value={documentTitle} onChange={setDocumentTitle} required />
          <label className="im-field"><span>Choose file</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={event => setFile(event.target.files?.[0] ?? null)} /><small>PDF, image, Word, Excel, ZIP or RAR · maximum 25 MiB</small></label>
        </div>
        <div className="im-form-footer"><span>{uploadIntent ? `Pending upload: ${uploadIntent.file.name}` : file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MiB` : 'Select a file to attach evidence.'}</span>
          {uploadIntent ? <Button disabled={isPending} onClick={() => void transferAndConfirm(uploadIntent)}>{isPending ? 'Transferring…' : 'Retry transfer / confirm'}</Button> : <Button disabled={!file || !documentTitle.trim() || isPending} onClick={() => void startUpload()}><FilePlus2 size={14} />{isPending ? 'Preparing upload…' : 'Upload & confirm'}</Button>}
        </div>
      </div>}
      <div className="im-history-list">
        <div className="im-history-title">Attached documentation <span>{licensedDocs.length}</span></div>
        {licensedDocs.length === 0 ? <p className="im-support-empty">No confirmed supporting documents. Waivers do not waive this requirement.</p> : licensedDocs.map(document => <a className="im-support-document" href={downloadUrl(document.document_id)} target="_blank" rel="noreferrer" key={document.document_id}>
          <FileText size={16} /><span><b>{document.title}</b><small>{document.document_type || 'Type not returned'} · {document.file_name} · {(document.file_size / 1024 / 1024).toFixed(2)} MiB · {document.uploaded_by} · {new Date(document.created_at).toLocaleDateString()}</small></span><ArrowDownToLine size={15} />
        </a>)}
      </div>
    </section>

    <section className="im-support-section" hidden={activeSection !== 'directors'}>
      <div className="im-support-section-head"><span><Users size={16} /></span><div><b>Directors</b><small>Director updates are versioned; historical notes are append-only.</small></div></div>
      {!readOnly && <div className="im-director-form">
        <div className="im-form-grid im-support-grid">
          <Field label="Full Name" value={director.name} onChange={value => setDirector(current => ({ ...current, name: value }))} required />
          <Field label="ID Number" value={director.nid_no} onChange={value => setDirector(current => ({ ...current, nid_no: value }))} />
          <Field label="Mobile" value={director.mobile_no} onChange={value => setDirector(current => ({ ...current, mobile_no: value }))} />
          <Field label="Email" type="email" value={director.email} onChange={value => setDirector(current => ({ ...current, email: value }))} />
          <Field label="PIN" value={director.pin_no} onChange={value => setDirector(current => ({ ...current, pin_no: value }))} />
        </div>
        <NoteField value={directorNote} onChange={setDirectorNote} label="Director change note" />
        <div className="im-form-footer"><span>{director.director_id ? `Editing director ${director.director_id} · version ${director.director_version}` : 'New director record'}</span><div className="im-director-actions">{director.director_id && <Button variant="quiet" onClick={() => { setDirector(EMPTY_DIRECTOR); setDirectorNote(''); }}>Cancel edit</Button>}<Button disabled={isPending || !directorNote.trim() || !director.name.trim()} onClick={saveDirector}><Plus size={14} /> Save director</Button></div></div>
      </div>}
      <div className="im-history-list">
        <div className="im-history-title">Director register <span>{detail.directors.length}</span></div>
        {detail.directors.length === 0 ? <p className="im-support-empty">No director records have been saved.</p> : detail.directors.map(item => <article className="im-support-row" key={item.director_id}>
          <div className="im-support-row-main"><span className="im-avatar">{item.name.slice(0, 1).toUpperCase()}</span><div><b>{item.name}</b><small>ID {item.nid_no || '—'} · Mobile {item.mobile_no || '—'} · {item.email || '—'} · PIN {item.pin_no || '—'}</small><small>Director record version {item.version}</small></div></div>
          {!readOnly && <Button variant="quiet" onClick={() => editDirector(item)}><Pencil size={13} /> Edit</Button>}
        </article>)}
      </div>
    </section>
    <section className="im-support-section" hidden={activeSection !== 'review'}>
      <div className="im-history-list">
        <div className="im-history-title">Historical notes & actions <span>{detail.events.length}</span></div>
        {detail.events.length === 0 ? <p className="im-support-empty">No historical notes retained.</p> : [...detail.events].reverse().map(event => <article className="im-support-note" key={event.event_id}><div><b>{event.action.replaceAll('_', ' ')}</b><small>{new Date(event.created_at).toLocaleString()} · {event.actor}</small></div><p>{event.notes}</p></article>)}
      </div>
      <div className="im-support-footer"><ShieldAlert size={14} /><span>Waiver requests remain unverified until an independent authorized reviewer explicitly accepts the documented exception.</span></div>
    </section>
  </div>;
}

export function EmptyRegistrationSupport({ activeSection = 'licence-documents' }: { activeSection?: RegistrationSection }) {
  return <fieldset disabled className="im-registration-support im-registration-disabled" style={{ border: 0, margin: 0, minWidth: 0 }}>
    <div className="im-alert im-alert-warn"><ShieldAlert size={16} /><span>Select or import a core-registered identity in step 1 before editing or creating support records. No manual identity creation is available.</span></div>
    <div className="im-support-heading"><div><div className="im-section-index">SUPPORTING RECORDS</div><h3>{activeSection === 'licence-documents' ? 'Licence & documents' : activeSection === 'directors' ? 'Directors' : 'Review & complete'}</h3><p>These forms are inspectable but disabled until a core identity is selected.</p></div></div>
    <section className="im-support-section" hidden={activeSection !== 'licence-documents'} aria-disabled="true"><div className="im-support-section-head"><span><FileCheck2 size={16} /></span><div><b>IRA / Contract Details</b><small>Licence dates, compliance declarations, waiver request and reason</small></div></div>
      <div className="im-form-grid im-support-grid"><Field label="Document Name" value="C001 · New Application/Licence" onChange={() => undefined} disabled /><Field label="Licence No" value="" onChange={() => undefined} disabled /><Field label="Year" value={String(new Date().getFullYear())} onChange={() => undefined} disabled /><Field label="Valid From" type="date" value="" onChange={() => undefined} disabled /><Field label="Valid To" type="date" value="" onChange={() => undefined} disabled /></div>
      <div className="im-compliance-checks"><Toggle label="Contract Signed" checked={false} onChange={() => undefined} /><Toggle label="IRA Compliance" checked={false} onChange={() => undefined} /><Toggle label="KYC Compliance" checked={false} onChange={() => undefined} /></div>
      <div className="im-waiver-box"><Toggle label="Request compliance waiver" checked={false} onChange={() => undefined} /><p>A waiver request requires a documented reason and independent review. It does not waive documents or current valid dates.</p></div>
      <div className="im-history-title">Licence history · 0</div><p className="im-support-empty">No record selected.</p>
    </section>
    <section className="im-support-section" hidden={activeSection !== 'licence-documents'} aria-disabled="true"><div className="im-support-section-head"><span><FileText size={16} /></span><div><b>Supporting Documents</b><small>C001 New Application/Licence · C002 Others</small></div></div>
      <div className="im-form-grid im-support-grid"><Field label="Document title" value="" onChange={() => undefined} disabled /><Field label="Choose file" value="" onChange={() => undefined} disabled /></div><p className="im-support-empty">No confirmed supporting documents. Waivers do not waive this requirement.</p>
    </section>
    <section className="im-support-section" hidden={activeSection !== 'directors'} aria-disabled="true"><div className="im-support-section-head"><span><Users size={16} /></span><div><b>Directors</b><small>Full Name, ID Number, Mobile, Email, PIN and retained change notes</small></div></div>
      <div className="im-form-grid im-support-grid"><Field label="Full Name" value="" onChange={() => undefined} disabled /><Field label="ID Number" value="" onChange={() => undefined} disabled /><Field label="Mobile" value="" onChange={() => undefined} disabled /><Field label="Email" value="" onChange={() => undefined} disabled /><Field label="PIN" value="" onChange={() => undefined} disabled /></div><p className="im-support-empty">No director selected.</p>
    </section>
    <section className="im-support-section" hidden={activeSection !== 'review'}>
      <h3>Complete registration</h3>
      <NoteField value="" onChange={() => undefined} label="Registration completion note" />
      <label className="im-complete-check"><input type="checkbox" checked={false} readOnly /><span><b>Is Complete</b><small>Select an imported agent and satisfy all completion requirements first.</small></span></label>
      <Button disabled>Complete registration</Button>
      <div className="im-history-list"><div className="im-history-title">Historical notes & actions</div><p className="im-support-empty">Select an identity to inspect retained history.</p></div>
    </section>
  </fieldset>;
}

function isConflict(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 409);
}
