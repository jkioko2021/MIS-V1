import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { query, queryOne } from "../lib/postgres";
import {
  signToken,
  requireAuth,
  COOKIE_NAME,
} from "../lib/auth-middleware";
import { logger } from "../lib/logger";
import { requiresLoginOtp, issueLoginOtp, consumeLoginOtp, OtpError, type LoginEmployee } from "../lib/login-otp";

const router = Router();

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

async function startSession(emp: LoginEmployee, res: Response, otpVerified = false) {
  const config = await queryOne<{ pass_reset_days: number }>(
    "SELECT pass_reset_days FROM crm.password_config LIMIT 1");
  const passwordExpired = emp.last_password_reset
    ? (Date.now() - new Date(emp.last_password_reset).getTime()) / 86400000 > (config?.pass_reset_days ?? 30)
    : true;
  await query(`UPDATE crm.employees SET failed_attempts=0,last_login_date=NOW(),
    active_session=TRUE,updated_at=NOW() WHERE employee_id=$1`, [emp.employee_id]);
  const token = signToken({ sub: emp.employee_id, username: emp.username, name: emp.employee_name,
    profileId: emp.profile_id, passwordChangeRequired: passwordExpired, otpVerified });
  await query(`INSERT INTO crm.admin_audit_trail (username,action_type,description)
    VALUES($1,'LOGIN_SUCCESS',$2)`, [emp.username, otpVerified ? "Password and email OTP verified" : "Password authenticated"])
    .catch(() => {});
  res.cookie(COOKIE_NAME, token, cookieOpts(8 * 60 * 60 * 1000));
  res.json({ ok: true, step: "authenticated", passwordExpired,
    user: { id: emp.employee_id, username: emp.username, name: emp.employee_name,
      profileId: emp.profile_id, profileName: emp.profile_name, department: emp.department } });
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
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
      profile_name: string | null;
      profile_active: boolean | null;
      department: string | null;
    }>(`
      SELECT e.employee_id, e.username, e.employee_name, e.password_hash,
             e.activated, e.employee_locked, e.approved, e.failed_attempts,
             e.last_password_reset, e.profile_id, e.department,
             p.profile_name, p.is_active AS profile_active
      FROM crm.employees e
      LEFT JOIN crm.profiles p ON p.profile_id = e.profile_id
      WHERE e.username = $1 AND e.is_deleted = FALSE
    `, [username.trim()]);

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
    if (!emp.profile_active) {
      res.status(403).json({ ok: false, error: "Account profile is inactive. Contact your administrator." });
      return;
    }

    // Password config
    const config = await queryOne<{ lockout_count: number; pass_reset_days: number }>(
      "SELECT lockout_count, pass_reset_days FROM crm.password_config LIMIT 1"
    );
    const lockoutCount = config?.lockout_count ?? 3;

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

    if (requiresLoginOtp(emp.username)) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.json({ ok: true, ...await issueLoginOtp(emp) });
      return;
    }
    await startSession(emp, res);
  } catch (err) {
    if (err instanceof OtpError) {
      res.status(err.status).json({ ok: false, error: err.message });
      return;
    }
    logger.error({ err }, "Login error");
    res.status(500).json({ ok: false, error: "Login failed. Please try again." });
  }
});

router.post("/auth/verify-otp", async (req: Request, res: Response) => {
  const { tempToken, otp } = req.body ?? {};
  if (typeof tempToken !== "string" || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
    res.status(400).json({ ok: false, error: "Enter the 6-digit verification code." });
    return;
  }
  try { await startSession(await consumeLoginOtp(tempToken, otp.trim()), res, true); }
  catch (err) {
    if (err instanceof OtpError) res.status(err.status).json({ ok: false, error: err.message });
    else {
      logger.error("Login OTP verification failed.");
      res.status(500).json({ ok: false, error: "Unable to verify your code. Please sign in again." });
    }
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

    const sessionToken = signToken({
      sub: req.user!.sub, username: req.user!.username,
      name: req.user!.name, profileId: req.user!.profileId,
      otpVerified: req.user!.otpVerified,
    });
    res.cookie(COOKIE_NAME, sessionToken, cookieOpts(8 * 60 * 60 * 1000));
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
    const profile = await queryOne<{
      profile_name: string; profile_id: number; department: string | null;
      last_password_reset: string | null; menu_access: string[];
    }>(
      `SELECT p.profile_name,
               e.profile_id, e.department, e.last_password_reset,
              ARRAY_AGG(ma.sub_menu_name ORDER BY ma.menu_order) FILTER (WHERE ma.can_access = TRUE) AS menu_access
       FROM crm.employees e
       JOIN crm.profiles p ON p.profile_id = e.profile_id
       LEFT JOIN crm.menu_access ma ON ma.profile_id = p.profile_id
        WHERE e.employee_id = $1 AND e.activated=TRUE AND e.approved=TRUE
          AND e.employee_locked=FALSE AND e.is_deleted=FALSE AND p.is_active=TRUE
        GROUP BY p.profile_name, e.profile_id, e.department, e.last_password_reset`,
      [u.sub]
    );
    if (!profile) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.status(401).json({ ok: false, error: "Account is no longer authorized. Please sign in again." });
      return;
    }
    const config = await queryOne<{ pass_reset_days: number }>(
      "SELECT pass_reset_days FROM crm.password_config LIMIT 1"
    );
    const passwordExpired = profile.last_password_reset
      ? (Date.now() - new Date(profile.last_password_reset).getTime()) / 86400000 > (config?.pass_reset_days ?? 30)
      : true;
    res.json({
      ok: true,
      passwordExpired: passwordExpired || Boolean(u.passwordChangeRequired),
      user: {
        id: u.sub,
        username: u.username,
        name: u.name,
        profileId: profile.profile_id,
        profileName: profile?.profile_name,
         department: profile?.department,
        menuAccess: profile?.menu_access ?? [],
      },
    });
  } catch (err) {
    logger.error({ err }, "Auth me error");
    res.status(503).json({ ok: false, error: "Unable to verify your session. Please try again." });
  }
});

export default router;
