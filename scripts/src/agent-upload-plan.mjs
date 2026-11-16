import { createHash } from "node:crypto";
import path from "node:path";

const headers = [
  "Receive_Date", "REF_NO", "USER_ID", "AGENT_NAME", "AGENT_TYPE", "UNIT_CODE",
  "BRANCH_CODE", "REGION_CODE", "EMAIL", "MOBILE_NO", "HRMIS_CODE", "PIN_NO",
  "H_TAX", "NSM_CODE", "RMS_CODE_CORP", "RMS_CODE_RET", "Contract_Signed",
  "Contract_Date", "Contract_End_Date", "Entry_Date", "AGENT_STATUS", "GI_CODE",
];
const nullValue = value => !value.trim() || value.trim().toUpperCase() === "NULL" ? null : value.trim();
const mapping = {
  REF_NO: ["agent_code", 30], USER_ID: ["user_id", 64], AGENT_NAME: ["agent_name", 250],
  AGENT_TYPE: ["agent_type", 50], UNIT_CODE: ["unit_code", 30], BRANCH_CODE: ["branch_code", 30],
  REGION_CODE: ["region_code", 30], EMAIL: ["email", 254], MOBILE_NO: ["mobile_no", 32],
  HRMIS_CODE: ["hrmis_code", 32], PIN_NO: ["pin_no", 32], RMS_CODE_CORP: ["rms_code_corp", 32],
  RMS_CODE_RET: ["rms_code_ret", 32], AGENT_STATUS: ["agent_status", 50], GI_CODE: ["gi_code", 30],
};

export function planAgentUpload(text, sourceFile) {
  const digest = createHash("sha256").update(text).digest("hex");
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines.shift()?.split("\t").join("|") !== headers.join("|"))
    throw Error("The uploaded agent headers do not match the 22-column extract.");
  const seen = new Set();
  const rows = [];
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const cells = line.split("\t");
    if (cells.length !== headers.length) throw Error(`Row ${index + 2}: expected 22 tab-separated columns.`);
    const raw = Object.fromEntries(headers.map((key, i) => [key, cells[i]]));
    const row = {};
    for (const [key, [target, max]] of Object.entries(mapping)) {
      row[target] = nullValue(raw[key]);
      if (row[target]?.length > max) throw Error(`Row ${index + 2}: ${key} exceeds ${max} characters.`);
    }
    if (!row.agent_code || !/^[a-zA-Z0-9_\/-]+$/.test(row.agent_code)
      || !row.agent_name || !row.agent_type || !row.agent_status)
      throw Error(`Row ${index + 2}: agent identity, name, type and status are required.`);
    if (seen.has(row.agent_code)) throw Error(`Row ${index + 2}: duplicate agent code.`);
    seen.add(row.agent_code);
    for (const [source, target] of [["Receive_Date", "receive_date"], ["Contract_Date", "contract_date"], ["Contract_End_Date", null]]) {
      const value = nullValue(raw[source]);
      if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))
        || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value))
        throw Error(`Row ${index + 2}: ${source} is not a valid calendar date.`);
      if (target) row[target] = value;
    }
    const issues = [];
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
      issues.push("Source email has invalid formatting; original value retained for correction.");
    if (!row.unit_code) issues.push("No Medical Unit code supplied; complete the assignment during MIS registration.");
    row.registration_status = "PENDING";
    row.source_ref = row.agent_code;
    row.source_data = {
      source_file: path.basename(sourceFile), file_sha256: digest,
      source_line: index + 2, data: raw, issues,
    };
    rows.push(row);
  }
  if (!rows.length || rows.length > 10000) throw Error("The upload must contain 1–10,000 agents.");
  return { rows, digest, invalidEmails: rows.filter(row => row.source_data.issues.some(issue => issue.startsWith("Source email"))).length };
}
