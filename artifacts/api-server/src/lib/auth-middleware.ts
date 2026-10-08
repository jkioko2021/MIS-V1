import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "./logger";

const COOKIE_NAME = "mis_session";
const SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-change-me";

export interface JwtPayload {
  sub: number;          // employee_id
  username: string;
  name: string;
  profileId: number;
  passwordChangeRequired?: boolean;
  otpVerified?: boolean;
  iat?: number;
  exp?: number;
}

// Attach user to request if cookie is present
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, SECRET, { expiresIn: "8h" });
}

export function signOtpChallenge(employeeId: number, challengeId: string) {
  return jwt.sign({ sub: employeeId, temp: true, challengeId }, SECRET,
    { audience: "mis-login-otp", expiresIn: "5m" });
}

export function verifyOtpChallenge(token: string): { sub: number; challengeId: string } {
  const decoded = jwt.verify(token, SECRET, { audience: "mis-login-otp" });
  if (typeof decoded === "string" || decoded.temp !== true || !Number.isInteger(decoded.sub)
    || typeof decoded.challengeId !== "string"
    || !/^[0-9a-f-]{36}$/i.test(decoded.challengeId)) throw new Error("Invalid OTP challenge");
  return decoded as unknown as { sub: number; challengeId: string };
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, SECRET);
  if (typeof decoded === "string" || decoded.temp) throw new Error("Invalid session token");
  return decoded as unknown as JwtPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ ok: false, error: "Not authenticated" });
    return;
  }
  try {
    req.user = verifyToken(token);
    const otpUsername = process.env.MIS_LOGIN_OTP_USERNAME?.trim() || "admin";
    if (req.user.username?.toLowerCase() === otpUsername.toLowerCase() && !req.user.otpVerified) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.status(401).json({ ok: false, error: "Please sign in again with your email verification code." });
      return;
    }
    if (req.user.passwordChangeRequired
      && !["/auth/me", "/auth/change-password", "/auth/logout"].includes(req.path)) {
      res.status(403).json({ ok: false, code: "PASSWORD_CHANGE_REQUIRED", error: "Please change your expired password before continuing." });
      return;
    }
    next();
  } catch (err) {
    logger.warn({ err }, "Invalid session token");
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ ok: false, error: "Session expired. Please log in again." });
  }
}

export { COOKIE_NAME };
