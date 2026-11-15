const USER_DEPARTMENTS = [
  'IT', 'MEMBERSHIP', 'CUST', 'MEDICAL', 'NONMEDICAL',
  'FINANCE', 'HR', 'COMPLIANCE', 'OPERATIONS', 'Sales', 'NSM', 'BPO',
];

// Preserve the exact saved value, including legacy department spellings.
export function userDepartmentChoices(savedDepartment?: string | null) {
  const saved = savedDepartment ?? '';
  const choices = USER_DEPARTMENTS.map(department =>
    saved && department.toLowerCase() === saved.trim().toLowerCase() ? saved : department);
  if (saved && !choices.includes(saved)) choices.push(saved);
  return choices;
}
