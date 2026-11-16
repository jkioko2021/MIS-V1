import { createHash } from "node:crypto";

export type ExtractKind = "users" | "agents" | "relationship-managers";
export type ExtractRecord = { line: number; values: Record<string, string> };
export class DataImportError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const extractTemplates = {
  "relationship-managers": {
    headers: ["RE_CODE", "RE_NAME", "CLASS_CODE", "C_CODE", "YEAR", "IS_ACTIVE"],
    max_rows: 5000,
    notes: ["All six columns are required. Keep RE_CODE as text to preserve leading zeros.",
      "C_CODE is C (Corporate) or R (Retail); IS_ACTIVE is 1 or 0; YEAR is a four-digit reporting year.",
      "Corporate names resolve against agents RMS_CODE_CORP and Retail names against RMS_CODE_RET.",
      "Existing code/category/year entries are skipped, never overwritten. This creates reference records, not login accounts."],
  },
  users: {
    headers: ["EMP_CODE", "USERNAME", "NAME", "EMAIL", "MOBILE_NO", "DEPARTMENT", "PROFILE_NAME"],
    max_rows: 500,
    notes: ["EMP_CODE, USERNAME, NAME and an existing PROFILE_NAME are required.",
      "New accounts are inactive and unapproved. Set a password, approve and activate individually in User Enrollment.",
      "Do not include passwords or activation flags. Existing identities are never changed.",
      "Use UTF-8 CSV or tab-separated TXT/TSV. Keep identifiers and phone numbers as text."],
  },
  agents: {
    headers: ["Receive_Date", "AGENT_CODE", "USER_ID", "AGENT_NAME", "AGENT_TYPE", "UNIT_CODE",
      "BRANCH_CODE", "REGION_CODE", "EMAIL", "MOBILE_NO", "HRMIS_CODE", "PIN_NO", "H_TAX",
      "NSM_CODE", "RMS_CODE_CORP", "RMS_CODE_RET", "Contract_Signed", "Contract_Date",
      "Contract_End_Date", "Entry_Date", "AGENT_STATUS", "GI_CODE"],
    max_rows: 5000,
    notes: ["AGENT_CODE (or REF_NO), AGENT_NAME and AGENT_TYPE are required. Dates use YYYY-MM-DD.",
      "New agents remain pending MIS registration. Existing agents are skipped, not overwritten.",
      "UNIT_CODE links only to an available Medical Unit. GI_CODE identifies a GI Unit and resolves its eligible assigned manager.",
      "Missing/unavailable mappings and malformed source emails are retained and flagged for correction. No accounts or teams are activated.",
      "Use UTF-8 CSV or tab-separated TXT/TSV. Keep identifiers, payroll codes and phone numbers as text."],
  },
};
const aliases: Record<string, string> = { REF_NO: "AGENT_CODE", EMPLOYEE_NAME: "NAME" };
const forbidden = /PASSWORD|SECRET|TOKEN|CREDENTIAL|^(ACTIVATED|APPROVED|PASSWORD_HASH|PROFILE_ID|IS_ADMIN)$/;
export function parseExtract(kind: ExtractKind, content: string): ExtractRecord[] {
  if (!content || Buffer.byteLength(content, "utf8") > 2_000_000 || content.includes("\0"))
    throw new DataImportError(400, "Provide a UTF-8 text extract up to 2 MB without null bytes.");
  const text = content.replace(/^\uFEFF/, "");
  const delimiter = text.split(/\r?\n/, 1)[0].includes("\t") ? "\t" : ",";
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [], cell = "", quoted = false, closed = false, line = 1, start = 1;
  const pushRow = () => {
    cells.push(cell);
    if (cells.some(v => v.trim())) rows.push({ line: start, cells });
    if (rows.length > extractTemplates[kind].max_rows + 1)
      throw new DataImportError(400, `Maximum ${extractTemplates[kind].max_rows} data rows per extract.`);
    cells = []; cell = ""; closed = false;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else { cell += c; if (c === "\n") line++; }
    } else if (c === delimiter) {
      cells.push(cell); cell = ""; closed = false;
      if (cells.length > 100) throw new DataImportError(400, "Maximum 100 columns.");
    } else if (c === "\n" || c === "\r") {
      pushRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
      line++; start = line;
    } else if (c === '"' && !cell && !closed) quoted = true;
    else if (c === '"' || closed) throw new DataImportError(400, `Malformed quoted value at line ${line}.`);
    else cell += c;
  }
  if (quoted) throw new DataImportError(400, "An extract value has an unclosed quote.");
  if (cell || cells.length || closed) pushRow();
  const header = rows.shift();
  if (!header || !rows.length) throw new DataImportError(400, "Include a header row and at least one data row.");
  const headers = header.cells.map(v => v.trim().toUpperCase().replace(/[\s-]+/g, "_"));
  const normalized = headers.map(h => aliases[h] ?? h);
  if (headers.some(h => !h || h.length > 80) || new Set(normalized).size !== headers.length)
    throw new DataImportError(400, "Column names must be nonempty and unique, including equivalent aliases.");
  if (headers.some(h => forbidden.test(h))) throw new DataImportError(400, "Passwords, credentials, profile IDs and approval/activation flags must not be uploaded.");
  const required = kind === "users" ? ["EMP_CODE", "USERNAME", "NAME", "PROFILE_NAME"]
    : kind === "agents" ? ["AGENT_CODE", "AGENT_NAME", "AGENT_TYPE"] : extractTemplates["relationship-managers"].headers;
  if (required.some(h => !normalized.includes(h))) throw new DataImportError(400, `Required headers: ${required.join(", ")}.`);
  return rows.map(row => {
    if (row.cells.length !== headers.length)
      throw new DataImportError(400, `Line ${row.line}: expected ${headers.length} columns, found ${row.cells.length}.`);
    if (row.cells.some(v => v.length > 4000)) throw new DataImportError(400, `Line ${row.line}: a value exceeds 4,000 characters.`);
    return { line: row.line, values: Object.fromEntries(headers.map((h, i) => [h, row.cells[i]])) };
  });
}
export const extractValue = (record: ExtractRecord, key: string) => {
  const raw = record.values[key] ?? Object.entries(aliases).filter(([, to]) => to === key)
    .map(([from]) => record.values[from]).find(v => v !== undefined);
  return !raw?.trim() || raw.trim().toUpperCase() === "NULL" ? null : raw.trim();
};
export const extractDigest = (kind: ExtractKind, records: ExtractRecord[]) =>
  createHash("sha256").update(kind).update(JSON.stringify(records)).digest("hex");
export function calendarDate(value: string | null) {
  return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value);
}
