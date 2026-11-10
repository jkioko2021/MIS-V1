/** OTP stays enabled by default; only an explicit false disables it. */
export function requiresLoginOtp(username: string): boolean {
  if (process.env.MIS_LOGIN_OTP_ENABLED?.trim().toLowerCase() === "false") return false;
  const otpUsername = process.env.MIS_LOGIN_OTP_USERNAME?.trim() || "admin";
  return username.toLowerCase() === otpUsername.toLowerCase();
}
