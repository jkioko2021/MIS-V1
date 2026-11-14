import type { SalesCatalogEntry } from "@workspace/api-zod";

const ORGANIZATIONS = new Set(["sales-units", "sales-branches", "sales-regions", "gi-units", "gi-branches"]);
const key = (row: SalesCatalogEntry) => `${row.catalog}:${row.code}`;

/** Operational rows take precedence, including inactive rows. Source managers are never eligible. */
export function organizationLookups(enrollments: SalesCatalogEntry[], sources: SalesCatalogEntry[]) {
  const lookups = new Map(enrollments.map(row => [key(row), row]));
  const grouped = new Map<string, SalesCatalogEntry[]>();
  for (const row of sources) {
    if (!ORGANIZATIONS.has(row.catalog)) continue;
    const id = key(row);
    grouped.set(id, [...(grouped.get(id) ?? []), row]);
  }
  for (const [id, rows] of grouped) {
    // Do not guess which of several differing historical rows a code refers to.
    if (!lookups.has(id) && rows.length === 1) lookups.set(id, rows[0]);
  }
  return lookups;
}

export function organizationLookupKey(row: SalesCatalogEntry) { return key(row); }
