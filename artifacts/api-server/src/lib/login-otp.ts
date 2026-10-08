import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { withTransaction, query } from "./postgres";
import { sendResendEmail, type EmailSender } from "./business-notifications";
import { signOtpChallenge, verifyOtpChallenge } from "./auth-middleware";

export function requiresLoginOtp(username: string) {
  return username.toLowerCase() === (process.env.MIS_LOGIN_OTP_USERNAME?.trim() || "admin").toLowerCase();
}

export class OtpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export interface LoginEmployee {
  employee_id: number; username: string; employee_name: string; password_hash: string;
  department: string | null; profile_id: number; profile_name: string | null;
  last_password_reset: string | null;
}

const stamp = (text: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "dev-secret-change-me")
  .update(text).digest("hex");

export async function issueLoginOtp(emp: LoginEmployee, send: EmailSender = sendResendEmail) {
  const to = process.env.MIS_LOGIN_OTP_EMAIL?.trim();
  const from = process.env.MIS_LOGIN_OTP_FROM?.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !from) {
    throw new OtpError(503, "Login email delivery is not configured. Contact your administrator.");
  }
  const id = randomUUID();
  const code = String(randomInt(100000, 1000000));
  await withTransaction(async client => {
    await client.query("SELECT employee_id FROM crm.employees WHERE employee_id=$1 FOR UPDATE", [emp.employee_id]);
    const { rows: [latest] } = await client.query(
      `SELECT generated_at FROM crm.login_otp_challenges WHERE employee_id=$1
       ORDER BY generated_at DESC LIMIT 1`, [emp.employee_id]);
    if (latest && Date.now() - new Date(latest.generated_at).getTime() < 60000) {
      throw new OtpError(429, "Please wait one minute before requesting another code.");
    }
    await client.query("UPDATE crm.login_otp_challenges SET used=TRUE WHERE employee_id=$1 AND NOT used", [emp.employee_id]);
    await client.query(`INSERT INTO crm.login_otp_challenges
      (challenge_id,employee_id,token_hash,credential_stamp,recipient_stamp)
      VALUES($1,$2,$3,$4,$5)`, [id, emp.employee_id, stamp(`${id}:${code}`),
      stamp(emp.password_hash), stamp(to)]);
    await client.query("UPDATE crm.employees SET failed_attempts=0 WHERE employee_id=$1", [emp.employee_id]);
  });
  try {
    await send({ from, to, subject: "Your MIS login verification code",
      text: `Your MIS login code is ${code}.\n\nIt expires in 5 minutes and can only be used once. Do not share this code. If you did not request this login, contact your administrator.`,
      idempotencyKey: `mis-login-${id}` });
    await query("UPDATE crm.login_otp_challenges SET sent=TRUE WHERE challenge_id=$1", [id]);
  } catch {
    await query("UPDATE crm.login_otp_challenges SET used=TRUE WHERE challenge_id=$1", [id]);
    throw new OtpError(503, "Could not send your verification code. Please try again in one minute.");
  }
  const [local, domain] = to.split("@");
  return { step: "otp" as const, tempToken: signOtpChallenge(emp.employee_id, id),
    maskedEmail: `${local[0]}***@${domain}`, expiresInSeconds: 300 };
}

export async function consumeLoginOtp(tempToken: string, code: string): Promise<LoginEmployee> {
  let claims: ReturnType<typeof verifyOtpChallenge>;
  try { claims = verifyOtpChallenge(tempToken); }
  catch { throw new OtpError(401, "Verification expired. Please sign in again."); }
  const result = await withTransaction(async client => {
    const { rows: [row] } = await client.query<LoginEmployee & {
      token_hash: string; credential_stamp: string; recipient_stamp: string;
      sent: boolean; used: boolean; attempts: number; expires_at: string;
      activated: boolean; approved: boolean; employee_locked: boolean; is_deleted: boolean; profile_active: boolean;
    }>(`SELECT c.*,e.username,e.employee_name,e.password_hash,e.department,e.profile_id,
        e.last_password_reset,e.activated,e.approved,e.employee_locked,e.is_deleted,
        p.profile_name,p.is_active AS profile_active
        FROM crm.login_otp_challenges c JOIN crm.employees e ON e.employee_id=c.employee_id
        JOIN crm.profiles p ON p.profile_id=e.profile_id
        WHERE c.challenge_id=$1 AND c.employee_id=$2 FOR UPDATE OF c,e`,
    [claims.challengeId, claims.sub]);
    if (!row || row.used || !row.sent || new Date(row.expires_at).getTime() <= Date.now()
      || !row.activated || !row.approved || row.employee_locked || row.is_deleted || !row.profile_active
      || !requiresLoginOtp(row.username) || row.credential_stamp !== stamp(row.password_hash)
      || row.recipient_stamp !== stamp(process.env.MIS_LOGIN_OTP_EMAIL?.trim() || "")) {
      return { error: new OtpError(401, "Verification is no longer valid. Please sign in again.") };
    }
    if (row.attempts >= 3) return { error: new OtpError(403, "Too many code attempts. Please sign in again.") };
    const actual = Buffer.from(stamp(`${claims.challengeId}:${code}`), "hex");
    const expected = Buffer.from(row.token_hash, "hex");
    if (expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
      await client.query("UPDATE crm.login_otp_challenges SET attempts=attempts+1 WHERE challenge_id=$1", [claims.challengeId]);
      return { error: new OtpError(row.attempts === 2 ? 403 : 401,
        row.attempts === 2 ? "Too many code attempts. Please sign in again." : "Incorrect verification code.") };
    }
    await client.query("UPDATE crm.login_otp_challenges SET used=TRUE WHERE challenge_id=$1", [claims.challengeId]);
    return { employee: row };
  });
  if (result.error) throw result.error;
  return result.employee!;
}
