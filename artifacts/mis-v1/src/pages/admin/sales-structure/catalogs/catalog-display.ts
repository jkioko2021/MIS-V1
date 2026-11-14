import type { SalesCatalogEntry, SalesCatalogField, SalesCatalogSnapshot } from '@workspace/api-client-react';

const LABELS: Record<string, string> = {
  UNIT_CODE: 'Unit', BRANCH_CODE: 'Branch', BR_CODE: 'Branch', REGION_CODE: 'Region',
  R_CODE: 'Region', NSM_CODE: 'National', GI_UNIT_CODE: 'GI Unit', GI_UNIT: 'GI Unit',
  GI_BRANCH: 'GI Branch', UNIT_MGR_ID: 'Unit manager', BRANCH_MGR_ID: 'Branch manager',
  REGION_MGR_ID: 'Regional manager', CORD_MGR_ID: 'GI coordinator',
};

export function displayFieldLabel(field: SalesCatalogField, catalog: string) {
  if (catalog === 'gi-units' && field.key === 'REGION_CODE') return 'GI Branch';
  if (catalog === 'gi-units' && field.key === 'CORD_MGR_ID') return 'GI Unit manager';
  return LABELS[field.key] ?? field.label.replace(/\s*\([^)]*\)/g, '');
}

export function displayReference(entry: SalesCatalogEntry, field: SalesCatalogField, snapshot: SalesCatalogSnapshot) {
  const code = entry.values[field.key]?.trim();
  if (!code || code.toUpperCase() === 'NULL') return 'Not assigned';
  let names: string[];
  if (field.reference === 'nationals') {
    names = snapshot.nationals.filter(node => node.code === code).map(node => node.name);
  } else if (field.reference === 'branch-managers') {
    names = snapshot.branch_managers.filter(manager => String(manager.id) === code).map(manager => manager.employee_name);
  } else {
    let matches = snapshot.entries.filter(row => row.catalog === field.reference && row.code === code);
    const sameOrigin = matches.filter(row => !!row.source_reference === !!entry.source_reference);
    if (sameOrigin.length) matches = sameOrigin;
    names = matches.map(row => row.name);
  }
  const unique = [...new Set(names.map(name => name.trim().replace(/\s+/g, ' ')).filter(Boolean))];
  return unique.length === 1 ? unique[0] : unique.length ? 'Needs mapping' : 'Not mapped';
}

export function visibleDetailField(field: SalesCatalogField, codeField: string) {
  if (field.reference) return true;
  return field.key !== codeField && field.key !== 'ID' && !/_(?:ID|CODE)$/.test(field.key);
}
