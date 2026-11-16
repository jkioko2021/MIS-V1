import type { PoolClient } from "pg";
import type { DataImportRow } from "@workspace/api-zod";
import { giNodes, giManagersSql } from "./gi-structure-data";
import { extractValue as v, calendarDate, type ExtractKind, type ExtractRecord } from "./data-extract";

export const agentFields: Record<string, [string, number]> = {
  AGENT_CODE: ["agent_code", 30], AGENT_NAME: ["agent_name", 250], AGENT_TYPE: ["agent_type", 50],
  USER_ID: ["user_id", 64], UNIT_CODE: ["unit_code", 30], BRANCH_CODE: ["branch_code", 30],
  REGION_CODE: ["region_code", 30], EMAIL: ["email", 254], MOBILE_NO: ["mobile_no", 32],
  HRMIS_CODE: ["hrmis_code", 32], PIN_NO: ["pin_no", 32], NID_NO: ["nid_no", 32],
  RMS_CODE_CORP: ["rms_code_corp", 32], RMS_CODE_RET: ["rms_code_ret", 32], GI_CODE: ["gi_code", 30],
};
export async function validateExtract(client: PoolClient, kind: ExtractKind, records: ExtractRecord[]) {
  const users = kind === "users" ? (await client.query("SELECT emp_code,username,email FROM crm.employees")).rows : [];
  const profiles = kind === "users" ? (await client.query("SELECT profile_id,profile_name FROM crm.profiles WHERE is_active")).rows : [];
  const existing = kind === "agents" ? (await client.query("SELECT agent_code,source_ref FROM crm.tbl_mis_sales_intermediary")).rows : [];
  const units = kind === "agents" ? (await client.query(`SELECT n.id,n.code,n.name,p.available FROM crm.sales_structure_nodes n
    JOIN crm.organisation_paths p ON p.id=n.id WHERE n.level='UNIT'`)).rows : [];
  const pending = kind === "agents" ? (await client.query("SELECT code,name FROM crm.sales_catalog_source_records WHERE catalog='sales-units'")).rows : [];
  const gi = kind === "agents" ? await giNodes(client) : [];
  const managers = kind === "agents" ? (await client.query(giManagersSql)).rows : [];
  const seen = new Set<string>();
  const rmExisting = kind === "relationship-managers" ? (await client.query("SELECT re_code,c_code,reporting_year FROM crm.relationship_managers")).rows : [];
  const rows: DataImportRow[] = [];
  const prepared: { record: ExtractRecord; values: Record<string, any>; unitId: number | null; giCode: string | null }[] = [];
  for (const record of records) {
    const errors: string[] = [], warnings: string[] = [];
    const result: DataImportRow = { line: record.line, state: "NEW", values: { ...record.values }, errors, warnings };
    const data: Record<string, any> = {};
    let unitId: number | null = null, giCode: string | null = null;
    const limited = (key: string, max: number, required = false) => {
      const value = v(record, key);
      if (required && !value) errors.push(`${key} is required.`);
      if (value && value.length > max) errors.push(`${key} exceeds ${max} characters.`);
      return value;
    };
    if (kind === "relationship-managers") {
      data.re_code = limited("RE_CODE", 32, true);
      data.re_name = limited("RE_NAME", 200, true);
      data.class_code = limited("CLASS_CODE", 50, true);
      data.c_code = limited("C_CODE", 1, true)?.toUpperCase();
      const year = v(record, "YEAR");
      data.reporting_year = Number(year);
      if (!year || !/^\d{4}$/.test(year) || data.reporting_year < 1900 || data.reporting_year > 2100) errors.push("YEAR must be between 1900 and 2100.");
      if (!["C", "R"].includes(data.c_code)) errors.push("C_CODE must be C or R.");
      const active = v(record, "IS_ACTIVE");
      if (!["0", "1"].includes(active ?? "")) errors.push("IS_ACTIVE must be 1 or 0.");
      data.is_active = active === "1";
      const identity = `${data.re_code}:${data.c_code}:${year}`;
      if (seen.has(identity)) errors.push("Duplicate relationship manager code/category/year in this extract.");
      seen.add(identity);
      if (rmExisting.some(r => r.re_code === data.re_code && r.c_code === data.c_code && r.reporting_year === data.reporting_year)) {
        result.state = "SKIP"; warnings.push("Existing relationship manager for this category/year: no changes will be made.");
      }
    } else if (kind === "users") {
      for (const [key, field, max, required] of [
        ["EMP_CODE","emp_code",50,true],["USERNAME","username",100,true],["NAME","employee_name",200,true],
        ["EMAIL","email",200,false],["MOBILE_NO","mobile_no",50,false],["DEPARTMENT","department",100,false],
      ] as const) data[field] = limited(key, max, required);
      const profileName = limited("PROFILE_NAME", 200, true);
      const profile = profiles.filter(p => p.profile_name.trim().toLowerCase() === profileName?.toLowerCase());
      if (profile.length !== 1) errors.push("PROFILE_NAME must match one existing active profile.");
      else data.profile_id = profile[0].profile_id;
      const matches = users.filter(u => u.username.toLowerCase() === data.username?.toLowerCase()
        || u.emp_code?.toLowerCase() === data.emp_code?.toLowerCase()
        || (data.email && u.email?.toLowerCase() === data.email.toLowerCase()));
      if (matches.length) {
        if (matches.length === 1 && matches[0].username.toLowerCase() === data.username?.toLowerCase()
          && matches[0].emp_code?.toLowerCase() === data.emp_code?.toLowerCase()) {
          result.state = "SKIP"; warnings.push("Existing account: no changes will be made.");
        } else errors.push("User code, username or email conflicts with a different existing identity.");
      }
      for (const key of ["EMP_CODE", "USERNAME", "EMAIL"]) {
        const value = v(record, key)?.toLowerCase();
        if (!value) continue;
        const identity = `${key}:${value}`;
        if (seen.has(identity)) errors.push(`Duplicate ${key} within the extract.`);
        seen.add(identity);
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("EMAIL is invalid.");
      if (result.state === "NEW" && !errors.length) warnings.push("Account will remain inactive and unapproved; password setup is required.");
    } else {
      for (const [key, [field, max]] of Object.entries(agentFields))
        data[field] = limited(key, max, ["AGENT_CODE", "AGENT_NAME", "AGENT_TYPE"].includes(key));
      if (data.agent_code && !/^[a-zA-Z0-9_\/-]+$/.test(data.agent_code)) errors.push("AGENT_CODE has unsupported characters.");
      const identity = data.agent_code?.toUpperCase();
      if (seen.has(identity)) errors.push("Duplicate AGENT_CODE within the extract.");
      if (identity) seen.add(identity);
      if (existing.some(a => a.agent_code.toUpperCase() === identity)) {
        result.state = "SKIP"; warnings.push("Existing agent: profile, assignments and history will not change.");
      } else if (existing.some(a => a.source_ref === data.agent_code)) errors.push("AGENT_CODE conflicts with an existing source reference.");
      const coded = v(record, "CODED");
      if (coded && !["0", "1"].includes(coded)) errors.push("CODED must be 0 or 1 when supplied.");
      if (coded === "1") { result.state = "SKIP"; warnings.push("Already coded in the source system: only uncoded agents are imported."); }
      for (const [key, field] of [["RECEIVE_DATE", "receive_date"], ["CONTRACT_DATE", "contract_date"], ["CONTRACT_END_DATE", ""]]) {
        const value = v(record, key);
        if (!calendarDate(value)) errors.push(`${key} must be a real YYYY-MM-DD date.`);
        if (field) data[field] = value;
      }
      data.agent_status = limited("AGENT_STATUS", 50) ?? "ACTIVE";
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) warnings.push("Invalid source email retained; correct during MIS registration.");
      const matching = units.filter(u => u.code.trim().toUpperCase() === data.unit_code?.toUpperCase());
      if (matching.length === 1 && matching[0].available) {
        unitId = matching[0].id; result.values.MEDICAL_UNIT_NAME = matching[0].name;
      } else {
        result.values.MEDICAL_UNIT_NAME = matching[0]?.name ?? pending.find(u => u.code.trim().toUpperCase() === data.unit_code?.toUpperCase())?.name ?? null;
        warnings.push("Medical Unit missing, ambiguous or awaiting setup: no operational Unit assignment.");
      }
      const giUnit = gi.filter(n => n.code === data.gi_code && n.level === "UNIT" && n.available);
      const manager = giUnit.length === 1 ? managers.find(m => m.id === giUnit[0].manager_id && m.level === "UNIT" && m.user_eligible) : undefined;
      if (manager) {
        giCode = manager.details?.GI_UM_ID?.trim() || manager.emp_code;
        result.values.GI_MANAGER_NAME = manager.employee_name;
      } else warnings.push("GI Unit missing, ambiguous or unavailable: GI manager requires review.");
    }
    if (errors.length) result.state = "ERROR";
    rows.push(result); prepared.push({ record, values: data, unitId, giCode });
  }
  const summary = {
    total: rows.length, new: rows.filter(r => r.state === "NEW").length,
    skipped: rows.filter(r => r.state === "SKIP").length, errors: rows.filter(r => r.state === "ERROR").length,
    warnings: rows.filter(r => r.warnings.length).length, imported: 0,
  };
  return { rows, summary, prepared };
}
