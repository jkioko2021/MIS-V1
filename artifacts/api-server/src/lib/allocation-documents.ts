// These operational documents are available during allocation for every client
// type, independently of the registration checklist's legacy applicability.
export const ALLOCATION_DOCUMENT_NAMES = [
  "system receipt", "policy schedule", "system invoice", "aml report",
];
export function isAllocationDocument(name: string): boolean {
  return ALLOCATION_DOCUMENT_NAMES.includes(name.trim().toLowerCase());
}
