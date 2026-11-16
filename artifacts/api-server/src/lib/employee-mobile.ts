/** Keep numbers as text so leading zeroes and international prefixes survive. */
export function employeeMobile(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('Mobile number must be text.');
  const mobile = value.trim();
  if (!mobile) return null;
  if (mobile.length > 50 || !/^\+?[0-9() .-]+$/.test(mobile) || !/[0-9]/.test(mobile)) {
    throw new Error('Enter a valid mobile number using digits, an optional + prefix, spaces, brackets or hyphens (maximum 50 characters).');
  }
  return mobile;
}
