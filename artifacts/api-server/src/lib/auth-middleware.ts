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

export function signTempToken(payload: { employeeId: number }): string {
  return jwt.sign({ sub: payload.employeeId, temp: true }, SECRET, { expiresIn: "5m" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

export function verifyTempToken(token: string): { sub: number } {
  const decoded = jwt.verify(token, SECRET) as { sub: number; temp?: boolean };
  if (!decoded.temp) throw new Error("Not a temp token");
  return decoded;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ ok: false, error: "Not authenticated" });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    logger.warn({ err }, "Invalid session token");
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ ok: false, error: "Session expired. Please log in again." });
  }
}

export { COOKIE_NAME };
