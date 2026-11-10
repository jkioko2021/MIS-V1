// These operational documents are available during allocation for every client
// type, independently of the registration checklist's legacy applicability.
export const ALLOCATION_DOCUMENT_NAMES = [
  "system invoice", "aml report",
];
export const EXCLUDED_ALLOCATION_DOCUMENT_NAMES = ["system receipt", "policy schedule"];
export function isExcludedAllocationDocument(name: string): boolean {
  return EXCLUDED_ALLOCATION_DOCUMENT_NAMES.includes(name.trim().toLowerCase());
}
export function isAllocationDocument(name: string): boolean {
  return ALLOCATION_DOCUMENT_NAMES.includes(name.trim().toLowerCase());
}
