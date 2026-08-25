import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { query, queryOne } from "../lib/postgres";
import {
  signToken,
  signTempToken,
  verifyTempToken,
  requireAuth,
  COOKIE_NAME,
} from "../lib/auth-middleware";
import { logger } from "../lib/logger";

const router = Router();

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax" as const,
    maxAge,
  };
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ ok: false, error: "Username and password required." });
    return;
  }

  try {
    const emp = await queryOne<{
      employee_id: number;
      username: string;
      employee_name: string;
      password_hash: string;
      activated: boolean;
      employee_locked: boolean;
      approved: boolean;
      failed_attempts: number;
      last_password_reset: string | null;
      profile_id: number;
    }>(`
      SELECT employee_id, username, employee_name, password_hash,
             activated, employee_locked, approved, failed_attempts,
             last_password_reset, profile_id
      FROM crm.employees
      WHERE username = $1 AND is_deleted = FALSE
    `, [username]);

    if (!emp) {
      res.status(401).json({ ok: false, error: "Invalid username or password." });
      return;
    }

    // Account state checks
    if (!emp.activated) {
      res.status(403).json({ ok: false, error: "Account not activated. Contact your administrator." });
      return;
    }
    if (!emp.approved) {
      res.status(403).json({ ok: false, error: "Account pending approval. Contact your administrator." });
      return;
    }
    if (emp.employee_locked) {
      res.status(403).json({ ok: false, error: "Account locked after too many failed attempts. Contact your administrator." });
      return;
    }

    // Password config
    const config = await queryOne<{ lockout_count: number; pass_reset_days: number }>(
      "SELECT lockout_count, pass_reset_days FROM crm.password_config LIMIT 1"
    );
    const lockoutCount = config?.lockout_count ?? 3;
    const resetDays = config?.pass_reset_days ?? 30;

    // Verify password
    const valid = await bcrypt.compare(password, emp.password_hash);
    if (!valid) {
      const newAttempts = emp.failed_attempts + 1;
      const shouldLock = newAttempts >= lockoutCount;
      await query(
        `UPDATE crm.employees SET failed_attempts = $1, employee_locked = $2, updated_at = NOW() WHERE employee_id = $3`,
        [newAttempts, shouldLock, emp.employee_id]
      );
      if (shouldLock) {
        res.status(403).json({ ok: false, error: "Too many failed attempts. Account locked. Contact your administrator." });
      } else {
        res.status(401).json({ ok: false, error: "Invalid username or password.", attemptsLeft: lockoutCount - newAttempts });
      }
      return;
    }

    // Reset failed attempts on success
    await query(
      `UPDATE crm.employees SET failed_attempts = 0, updated_at = NOW() WHERE employee_id = $1`,
      [emp.employee_id]
    );

    // Check password expiry
    const passwordExpired = emp.last_password_reset
      ? (() => {
          const reset = new Date(emp.last_password_reset);
          const diff = (Date.now() - reset.getTime()) / (1000 * 60 * 60 * 24);
          return diff > resetDays;
        })()
      : true;

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await query(
      `DELETE FROM crm.otp_tokens WHERE employee_id = $1`,
      [emp.employee_id]
    );
    const otpRow = await queryOne<{ id: number }>(
      `INSERT INTO crm.otp_tokens (employee_id, token) VALUES ($1, $2) RETURNING id`,
      [emp.employee_id, otp]
    );

    // Temp token carries employee_id for the OTP step
    const tempToken = signTempToken({ employeeId: emp.employee_id });

    // Audit
    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1, 'LOGIN_OTP_SENT', $2)`,
      [emp.employee_id, `OTP sent for login; passwordExpired=${passwordExpired}`]
    ).catch(() => {});

    logger.info({ username, otpId: otpRow?.id }, "OTP generated for login");

    res.json({
      ok: true,
      step: "otp",
      tempToken,
      passwordExpired,
      // In dev, expose the OTP so testers can log in without email
      ...(process.env["NODE_ENV"] !== "production" ? { devOtp: otp } : {}),
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ ok: false, error: "Login failed. Please try again." });
  }
});

// ─── POST /auth/verify-otp ───────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req: Request, res: Response) => {
  const { tempToken, otp } = req.body as { tempToken?: string; otp?: string };

  if (!tempToken || !otp) {
    res.status(400).json({ ok: false, error: "tempToken and otp required." });
    return;
  }

  let employeeId: number;
  try {
    const decoded = verifyTempToken(tempToken);
    employeeId = decoded.sub;
  } catch {
    res.status(401).json({ ok: false, error: "Session expired. Please log in again." });
    return;
  }

  try {
    const tokenRow = await queryOne<{
      id: number;
      token: string;
      expires_at: string;
      used: boolean;
      attempts: number;
    }>(
      `SELECT id, token, expires_at, used, attempts FROM crm.otp_tokens WHERE employee_id = $1 ORDER BY id DESC LIMIT 1`,
      [employeeId]
    );

    if (!tokenRow || tokenRow.used) {
      res.status(401).json({ ok: false, error: "OTP invalid or already used." });
      return;
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      res.status(401).json({ ok: false, error: "OTP expired. Please log in again." });
      return;
    }
    if (tokenRow.attempts >= 3) {
      res.status(403).json({ ok: false, error: "Too many OTP attempts. Please log in again." });
      return;
    }

    const otpMatch = tokenRow.token.trim() === otp.trim();
    if (!otpMatch) {
      await query(`UPDATE crm.otp_tokens SET attempts = attempts + 1 WHERE id = $1`, [tokenRow.id]);
      res.status(401).json({ ok: false, error: "Incorrect OTP.", attemptsLeft: 3 - (tokenRow.attempts + 1) });
      return;
    }

    // Mark OTP used
    await query(`UPDATE crm.otp_tokens SET used = TRUE WHERE id = $1`, [tokenRow.id]);

    // Load employee for JWT
    const emp = await queryOne<{
      employee_id: number;
      username: string;
      employee_name: string;
      department: string | null;
      profile_id: number;
      profile_name: string;
      last_password_reset: string | null;
    }>(
      `SELECT e.employee_id, e.username, e.employee_name, e.department, e.profile_id,
              e.last_password_reset, p.profile_name
       FROM crm.employees e
       JOIN crm.profiles p ON p.profile_id = e.profile_id
       WHERE e.employee_id = $1`,
      [employeeId]
    );

    if (!emp) {
      res.status(500).json({ ok: false, error: "Employee not found." });
      return;
    }

    // Update last login
    await query(
      `UPDATE crm.employees SET last_login_date = NOW(), active_session = TRUE, updated_at = NOW() WHERE employee_id = $1`,
      [employeeId]
    );

    // Check password expiry
    const config = await queryOne<{ pass_reset_days: number }>(
      "SELECT pass_reset_days FROM crm.password_config LIMIT 1"
    );
    const resetDays = config?.pass_reset_days ?? 30;
    const passwordExpired = emp.last_password_reset
      ? (Date.now() - new Date(emp.last_password_reset).getTime()) / (1000 * 60 * 60 * 24) > resetDays
      : true;

    const sessionToken = signToken({
      sub: emp.employee_id,
      username: emp.username,
      name: emp.employee_name,
      profileId: emp.profile_id,
    });

    // Audit
    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1, 'LOGIN_SUCCESS', $2)`,
      [employeeId, `OTP verified; session started`]
    ).catch(() => {});

    res.cookie(COOKIE_NAME, sessionToken, cookieOpts(8 * 60 * 60 * 1000));

    res.json({
      ok: true,
      user: {
        id: emp.employee_id,
        username: emp.username,
        name: emp.employee_name,
        profileId: emp.profile_id,
         profileName: emp.profile_name,
         department: emp.department,
      },
      passwordExpired,
    });
  } catch (err) {
    logger.error({ err }, "OTP verification error");
    res.status(500).json({ ok: false, error: "OTP verification failed." });
  }
});

// ─── POST /auth/change-password ──────────────────────────────────────────────
router.post("/auth/change-password", requireAuth, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ ok: false, error: "Current and new password required." });
    return;
  }

  const userId = req.user!.sub;

  try {
    const emp = await queryOne<{ password_hash: string }>(
      `SELECT password_hash FROM crm.employees WHERE employee_id = $1`,
      [userId]
    );
    if (!emp) { res.status(404).json({ ok: false, error: "User not found." }); return; }

    const valid = await bcrypt.compare(currentPassword, emp.password_hash);
    if (!valid) {
      res.status(401).json({ ok: false, error: "Current password is incorrect." });
      return;
    }

    // Password policy
    const config = await queryOne<{
      min_length: number;
      require_numeric: boolean;
      require_special: boolean;
      require_capital: boolean;
    }>("SELECT min_length, require_numeric, require_special, require_capital FROM crm.password_config LIMIT 1");

    const minLen = config?.min_length ?? 8;
    const errors: string[] = [];
    if (newPassword.length < minLen) errors.push(`At least ${minLen} characters`);
    if (config?.require_capital && !/[A-Z]/.test(newPassword)) errors.push("At least one uppercase letter");
    if (config?.require_numeric && !/[0-9]/.test(newPassword)) errors.push("At least one number");
    if (config?.require_special && !/[^A-Za-z0-9]/.test(newPassword)) errors.push("At least one special character");
    if (errors.length) {
      res.status(400).json({ ok: false, error: "Password policy not met.", details: errors });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE crm.employees SET password_hash = $1, last_password_reset = CURRENT_DATE, failed_attempts = 0, updated_at = NOW() WHERE employee_id = $2`,
      [newHash, userId]
    );

    // History entry
    await query(
      `INSERT INTO crm.password_history (employee_id, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, newHash]
    ).catch(() => {});

    await query(
      `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1, 'PASSWORD_CHANGED', 'User changed password')`,
      [userId]
    ).catch(() => {});

    res.json({ ok: true, message: "Password changed successfully." });
  } catch (err) {
    logger.error({ err }, "Change password error");
    res.status(500).json({ ok: false, error: "Failed to change password." });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post("/auth/logout", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  await query(
    `UPDATE crm.employees SET active_session = FALSE, updated_at = NOW() WHERE employee_id = $1`,
    [userId]
  ).catch(() => {});
  await query(
    `INSERT INTO crm.admin_audit_trail (employee_id, action, details) VALUES ($1, 'LOGOUT', 'User logged out')`,
    [userId]
  ).catch(() => {});
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  const u = req.user!;
  try {
    const profile = await queryOne<{ profile_name: string; department: string | null; menu_access: string[] }>(
      `SELECT p.profile_name,
              e.department,
              ARRAY_AGG(ma.sub_menu_name ORDER BY ma.menu_order) FILTER (WHERE ma.can_access = TRUE) AS menu_access
       FROM crm.employees e
       JOIN crm.profiles p ON p.profile_id = e.profile_id
       LEFT JOIN crm.menu_access ma ON ma.profile_id = p.profile_id
       WHERE e.employee_id = $1
       GROUP BY p.profile_name, e.department`,
      [u.sub]
    );
    res.json({
      ok: true,
      user: {
        id: u.sub,
        username: u.username,
        name: u.name,
        profileId: u.profileId,
        profileName: profile?.profile_name,
         department: profile?.department,
        menuAccess: profile?.menu_access ?? [],
      },
    });
  } catch (err) {
    logger.error({ err }, "Auth me error");
    res.json({ ok: true, user: { id: u.sub, username: u.username, name: u.name, profileId: u.profileId } });
  }
});

export default router;
