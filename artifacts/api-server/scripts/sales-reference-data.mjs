import { createHash } from "node:crypto";

const hash = value => createHash("sha256").update(value).digest("hex");
const normalized = value => !value?.trim() || value.trim() === "NULL" ? null : value.trim();
export function parseSalesReferenceTsv(text, definitions) {
  const headerKeys = new Map(definitions.map(d => [d.fields.map(f => f.key).join("\t"), d]));
  const rows = [], sections = new Set();
  let definition;
  for (const [index, line] of text.replace(/^\uFEFF/, "").split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const header = headerKeys.get(line);
    if (header) {
      if (sections.has(header.key)) throw new Error(`Repeated section ${header.title}.`);
      sections.add(header.key); definition = header; continue;
    }
    if (!definition) throw new Error(`Unknown section header at line ${index + 1}.`);
    const cells = line.split("\t");
    if (cells.length !== definition.fields.length) throw new Error(`Column count mismatch at line ${index + 1}.`);
    const values = Object.fromEntries(definition.fields.map((f, i) => [f.key, cells[i]]));
    const code = normalized(values[definition.code_field]), name = normalized(values[definition.name_field]);
    if (!code || code.length > 50 || !name || name.length > 150) throw new Error(`Missing or oversized identity at line ${index + 1}.`);
    rows.push({ catalog: definition.key, code, name, values, source_line: index + 1,
      row_sha256: hash(JSON.stringify(values)), manager: definition.manager });
  }
  if (!rows.length) throw new Error("No source records were found.");
  return { rows, file_sha256: hash(text) };
}

export function referenceIssues(row, definitions, available, today) {
  const issues = [];
  const def = definitions.find(d => d.key === row.catalog);
  if (def.manager) issues.push("Reference only: no MIS user account has been verified or linked. No account access is granted.");
  for (const field of def.fields.filter(f => f.reference)) {
    const code = normalized(row.values[field.key]);
    if (!code) continue;
    const matches = available.filter(e => e.catalog === field.reference && e.code === code);
    if (!matches.length) issues.push(`${field.key}: the referenced code is not present in the supplied records or enrolled catalogs.`);
    else if (matches.length > 1) issues.push(`${field.key}: multiple source assignments share this manager identifier; verify the intended assignment.`);
  }
  const email = normalized(row.values.EMAIL);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push("EMAIL contains a legacy placeholder or invalid address; the supplied value was preserved.");
  const validTo = normalized(row.values.VALID_TO);
  if (validTo && /^\d{4}-\d{2}-\d{2}$/.test(validTo) && validTo < today)
    issues.push(`The source validity ended on ${validTo}; no validity dates were extended.`);
  if (def.manager && available.filter(e => e.catalog === row.catalog && e.code === row.code).length > 1)
    issues.push("Manager identifier occurs in more than one source assignment. Each assignment has been retained separately.");
  // Preserve mismatches instead of guessing that one side of a historical relationship is correct.
  if (row.catalog === "sales-units") {
    const managerId = normalized(row.values.UNIT_MGR_ID);
    const matches = available.filter(e => e.catalog === "unit-managers" && e.code === managerId);
    if (matches.length && !matches.some(e => normalized(e.values.UNIT_CODE) === row.code))
      issues.push("UNIT_MGR_ID points to a manager listed against a different unit; the source mapping was not changed.");
  }
  if (row.catalog === "gi-units") {
    const managerId = normalized(row.values.CORD_MGR_ID);
    const matches = available.filter(e => e.catalog === "gi-unit-managers" && e.code === managerId);
    if (matches.length && !matches.some(e => normalized(e.values.GI_UNIT_CODE) === row.code))
      issues.push("CORD_MGR_ID points to a GI manager listed against a different unit; the source mapping was not changed.");
  }
  return issues;
}

/** Caller supplies the transaction; only the source-reference table is written. */
export async function importSalesReferences(client, text, filename, actor, definitions) {
  const parsed = parseSalesReferenceTsv(text, definitions);
  await client.query("SELECT pg_advisory_xact_lock(82026,55)");
  const enrolled = (await client.query(`SELECT catalog,code,data AS "values" FROM crm.sales_catalog_entries`)).rows;
  const nationals = (await client.query(`SELECT code FROM crm.sales_structure_nodes WHERE level='NATIONAL'`)).rows
    .map(e => ({ catalog: "nationals", code: e.code, values: {} }));
  const branchManagers = (await client.query(`SELECT id FROM crm.sales_manager_enrollments WHERE level='BRANCH'`)).rows
    .map(e => ({ catalog: "branch-managers", code: String(e.id), values: {} }));
  const today = (await client.query("SELECT current_date::text AS today")).rows[0].today;
  const available = [...parsed.rows, ...enrolled, ...nationals, ...branchManagers];
  let inserted = 0, skipped = 0, flagged = 0;
  const counts = {};
  for (const row of parsed.rows) {
    counts[row.catalog] = (counts[row.catalog] ?? 0) + 1;
    const issues = referenceIssues(row, definitions, available, today);
    if (issues.length) flagged++;
    const result = await client.query(`INSERT INTO crm.sales_catalog_source_records
      (catalog,code,name,source_file,file_sha256,source_line,row_sha256,data,issues,imported_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)
      ON CONFLICT(catalog,row_sha256) DO NOTHING RETURNING id`,
    [row.catalog, row.code, row.name, filename, parsed.file_sha256, row.source_line,
      row.row_sha256, JSON.stringify(row.values), JSON.stringify(issues), actor]);
    if (result.rowCount) inserted++; else skipped++;
  }
  return { total: parsed.rows.length, inserted, skipped, flagged, counts };
}
