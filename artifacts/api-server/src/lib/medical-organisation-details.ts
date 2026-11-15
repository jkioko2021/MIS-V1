// These are the operating fields on the existing Medical Structure catalogs.
// Identity, ancestry, managers and active status remain authoritative node columns.
export const medicalFields: Record<string, Record<string, number>> = {
  NATIONAL: {},
  REGION: { VALID_FROM: 10, VALID_TO: 10 },
  BRANCH: { BRANCH_TYPE: 50, SPECIALITY: 5, GI_BRANCH: 50 },
  UNIT: { UNIT_TYPE: 50, SPECIALITY: 5, YEAR: 4, VALID_FROM: 10, VALID_TO: 10, MIS_NO: 20, GI_UNIT: 50 },
};
export function sourceMedicalDetails(level: string, source: Record<string, unknown> = {}) {
  return Object.fromEntries(Object.keys(medicalFields[level] ?? {}).map(key => {
    const value = source[key] == null ? null : String(source[key]).trim();
    return [key, !value || value.toLowerCase() === "null" ? null : value];
  })) as Record<string, string | null>;
}
export function validateMedicalDetails(
  level: string, values: Record<string, string | null>,
  fail: (message: string) => never = message => { throw new Error(message); },
) {
  const fields = medicalFields[level] ?? {};
  for (const key of Object.keys(values)) if (!Object.hasOwn(fields, key))
    fail(`${key} is not an editable Medical ${level.toLowerCase()} field. Maintain identity, reporting parents and managers through their dedicated fields.`);
  const result = sourceMedicalDetails(level, values);
  for (const [key, value] of Object.entries(result)) {
    if (!value) continue;
    if (value.length > fields[key]) fail(`${key} must not exceed ${fields[key]} characters.`);
    if (["VALID_FROM", "VALID_TO"].includes(key)) {
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
        fail(`${key} must be a real calendar date.`);
    }
    if (key === "YEAR" && !/^\d{4}$/.test(value)) fail("YEAR must contain four digits.");
  }
  if (result.VALID_FROM && result.VALID_TO && result.VALID_FROM > result.VALID_TO)
    fail("Valid To must be on or after Valid From.");
  return result;
}
