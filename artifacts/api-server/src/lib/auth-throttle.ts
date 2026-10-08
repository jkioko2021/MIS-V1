import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import { verifyOtpChallenge } from "./auth-middleware";

// Process-local admission control. Never retain passwords, codes, JWTs or raw identities.
// Do not evict live buckets: spraying identities must not reset existing limits.
export class AuthThrottle {
  private buckets = new Map<string, { count: number; until: number }>();
  constructor(private maxBuckets = 10000, private windowMs = 60000) {}

  take(scope: string, identity: string, limit: number, now = Date.now()): number {
    for (const [key, bucket] of this.buckets) {
      if (bucket.until <= now) this.buckets.delete(key);
    }
    const key = `${scope}:${createHash("sha256").update(identity).digest("hex")}`;
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= this.maxBuckets) {
        const earliest = Math.min(...Array.from(this.buckets.values(), b => b.until));
        return Math.max(1, Math.ceil((earliest - now) / 1000));
      }
      bucket = { count: 0, until: now + this.windowMs };
      this.buckets.set(key, bucket);
    }
    if (bucket.count >= limit) return Math.max(1, Math.ceil((bucket.until - now) / 1000));
    bucket.count++;
    return 0;
  }
}

const throttle = new AuthThrottle();

export function throttleAuth(endpoint: "login" | "otp"): RequestHandler {
  return (req, res, next) => {
    // Express's socket-derived IP is trusted; do not accept arbitrary forwarded headers.
    let retry = throttle.take(`${endpoint}:ip`, req.ip ?? req.socket.remoteAddress ?? "unknown", 60);
    if (!retry && endpoint === "login" && typeof req.body?.username === "string") {
      retry = throttle.take("login:username", req.body.username.trim().toLowerCase(), 10);
    }
    if (!retry && endpoint === "otp" && typeof req.body?.tempToken === "string") {
      try {
        const claims = verifyOtpChallenge(req.body.tempToken);
        // A signed account ID is stable across renewed challenges and IP changes.
        retry = throttle.take("otp:account", String(claims.sub), 20);
      } catch { /* Invalid challenges still consume the IP allowance. */ }
    }
    if (retry) {
      res.setHeader("Retry-After", retry);
      res.status(429).json({ ok: false, error: `Too many sign-in attempts. Please try again in ${retry} seconds.`,
        retryAfterSeconds: retry });
      return;
    }
    next();
  };
}
