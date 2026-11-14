import { createHash } from "node:crypto";
export const MANAGER_CATALOGS = ["unit-managers", "regional-managers", "gi-unit-managers", "gi-coordinators"];
const normalized = value => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const meaningful = value => {
  const text = normalized(value);
  return text && !/^(null|none|n\/a|na|tba|-|0+)$/.test(text) ? text : "";
};
const digest = value => createHash("sha256").update(value).digest("hex");
const keys = row => ["HRMIS_CODE", "MIS_EMP_CODE"].map(key => meaningful(row.data[key]))
  .filter(Boolean);

// Intentionally no fuzzy names, source-code-to-account guessing, or permission changes.
export function planManagerUsers(rows, users, identities = [], sourceLinks = []) {
  const buckets = new Map(); const emailNames = new Map(); const held = []; const groups = [];
  const linked = new Map(sourceLinks.map(row => [row.source_record_id, row]));
  for (const row of rows) {
    const name = normalized(row.name); const email = meaningful(row.data.EMAIL);
    if (!name || /^(vacant|null|none|n\/a|tba)$/.test(name)) {
      held.push({ rows: [row], reason: "No confirmed person name" }); continue;
    }
    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)) {
      held.push({ rows: [row], reason: "Invalid source email; correct before account creation" }); continue;
    }
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push({ row, email });
    if (email) {
      if (!emailNames.has(email)) emailNames.set(email, new Set());
      emailNames.get(email).add(name);
    }
  }
  for (const [name, entries] of buckets) {
    const emails = [...new Set(entries.map(entry => entry.email).filter(Boolean))];
    const sourceRows = entries.map(entry => entry.row);
    const hold = reason => held.push({ rows: sourceRows, reason });
    if (emails.length > 1) { hold("Same name has different email addresses; identity review required"); continue; }
    const email = emails[0] || null;
    if (email && emailNames.get(email).size > 1) { hold("Email is shared by different names; do not merge people"); continue; }
    const confirmed = entries.filter(entry => entry.email);
    const confirmedKeys = new Set(confirmed.flatMap(entry => keys(entry.row)));
    const accepted = email ? entries.filter(entry => entry.email || keys(entry.row).some(key => confirmedKeys.has(key))) : entries;
    const excluded = entries.filter(entry => !accepted.includes(entry));
    for (const entry of excluded) held.push({ rows: [entry.row], reason: "Missing email and no corroborating employee identifier" });
    if (!accepted.length) continue;
    if (!email && (!keys(accepted[0].row).length
        || accepted.some(entry => !keys(entry.row).some(key => keys(accepted[0].row).includes(key))))) {
      held.push({ rows: accepted.map(entry => entry.row), reason: "Missing email and ambiguous or missing identity identifiers" }); continue;
    }
    const identityKey = digest(`${name}|${email ?? keys(accepted[0].row).sort().join("|")}`);
    const groupRows = accepted.map(entry => entry.row);
    const identity = identities.find(item => item.identity_key === identityKey);
    const account = identity && users.find(user => user.employee_id === identity.employee_id);
    if (groupRows.some(row => {
      const link = linked.get(row.id);
      return link && (link.identity_key !== identityKey || link.source_row_sha256 !== row.row_sha256);
    })) { held.push({ rows: groupRows, reason: "Previously linked source identity changed; review required" }); continue; }
    if (identity && (!account || account.is_deleted)) {
      held.push({ rows: groupRows, reason: "Previously imported account is unavailable; do not recreate it" }); continue;
    }
    const username = email && email.length <= 100 ? email : `sales.${identityKey.slice(0, 24)}`;
    const collision = users.find(user => !user.is_deleted && user.employee_id !== account?.employee_id
      && (normalized(user.username) === username || (email && normalized(user.email) === email)));
    if (collision) { held.push({ rows: groupRows, reason: "Existing account may match; verify it rather than create or merge another" }); continue; }
    groups.push({ identityKey, rows: groupRows, name: groupRows[0].name.trim(), email,
      username, account, warnings: email ? "" : "Email missing; complete contact details before login setup" });
  }
  return { groups, held };
}
