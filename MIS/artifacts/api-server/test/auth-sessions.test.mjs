import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let dir;
let auth;
let otpPolicy;
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "auth-session-tests-"));
  await build({
    entryPoints: {
      auth: path.join(root, "src/lib/auth-middleware.ts"),
      policy: path.join(root, "src/lib/login-otp-policy.ts"),
    },
    outdir: dir, bundle: true, platform: "node", format: "esm",
    outExtension: { ".js": ".mjs" },
    banner: { js: 'import { createRequire } from "node:module"; const require=createRequire(import.meta.url);' },
    plugins: [{
      name: "auth-session-db-double",
      setup(b) {
        b.onResolve({ filter: /^\.\/(postgres|logger)$/ }, () => ({
          path: path.join(root, "test/doubles/auth-session-deps.mjs"),
        }));
      },
    }],
    logLevel: "silent",
  });
  auth = await import(pathToFileURL(path.join(dir, "auth.mjs")).href);
  otpPolicy = await import(pathToFileURL(path.join(dir, "policy.mjs")).href);
});
after(async () => {
  delete globalThis.__authSessionState;
  await rm(dir, { recursive: true, force: true });
});

const payload = {
  sub: 123, username: "synthetic-staff", name: "Test", profileId: 3,
  sid: "00000000-0000-4000-8000-000000000001",
};
async function verify(claims = payload, state = { active: true }, route = "/protected") {
  globalThis.__authSessionState = state;
  const req = { cookies: { mis_session: auth.signToken(claims) }, path: route };
  const result = { status: 200, next: false, cleared: false };
  const res = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; },
    clearCookie() { result.cleared = true; return this; },
  };
  await auth.requireAuth(req, res, () => { result.next = true; });
  return result;
}
test("database verification failure denies access with retryable 503, not a false logout", async () => {
  const r = await verify(payload, { fail: true });
  assert.equal(r.status, 503);
  assert.equal(r.next, false);
  assert.equal(r.cleared, false);
});
test("revoked session never proceeds to protected handler", async () => {
  const r = await verify(payload, { active: false });
  assert.equal(r.status, 401); assert.equal(r.next, false); assert.equal(r.cleared, true);
});
test("password-only staff remain authorized without OTP", async () => {
  assert.equal((await verify()).next, true);
});
async function withOtpFlag(value, run) {
  const previous = process.env.MIS_LOGIN_OTP_ENABLED;
  if (value === undefined) delete process.env.MIS_LOGIN_OTP_ENABLED;
  else process.env.MIS_LOGIN_OTP_ENABLED = value;
  try { return await run(); }
  finally {
    if (previous === undefined) delete process.env.MIS_LOGIN_OTP_ENABLED;
    else process.env.MIS_LOGIN_OTP_ENABLED = previous;
  }
}
test("admin persistent session must still have OTP verification when enabled", async () => withOtpFlag("true", async () => {
  const admin = { ...payload, username: process.env.MIS_LOGIN_OTP_USERNAME?.trim() || "admin" };
  assert.equal((await verify(admin)).status, 401);
  assert.equal((await verify({ ...admin, otpVerified: true })).next, true);
}));
test("explicitly disabled OTP allows password-only admin sessions without bypassing session or password guards", async () => withOtpFlag("false", async () => {
  const admin = { ...payload, username: process.env.MIS_LOGIN_OTP_USERNAME?.trim() || "admin" };
  assert.equal((await verify(admin)).next, true);
  assert.equal((await verify(admin, { active: false })).status, 401);
  assert.equal((await verify(admin, { fail: true })).status, 503);
  assert.equal((await verify({ ...admin, passwordChangeRequired: true })).status, 403);
  assert.equal((await verify({ ...admin, sid: undefined })).status, 401);
}));
test("OTP policy is enabled by default and invalid flags cannot silently disable it", async () => {
  const username = process.env.MIS_LOGIN_OTP_USERNAME?.trim() || "admin";
  for (const value of [undefined, "", "true", "invalid", "0"]) {
    await withOtpFlag(value, async () => {
      assert.equal(otpPolicy.requiresLoginOtp(username.toUpperCase()), true);
      assert.equal(otpPolicy.requiresLoginOtp("synthetic-non-otp-staff"), false);
    });
  }
  await withOtpFlag(" FALSE ", async () => {
    assert.equal(otpPolicy.requiresLoginOtp(username), false);
  });
});
test("expired password remains restricted, but password change and logout remain available", async () => {
  const expired = { ...payload, passwordChangeRequired: true };
  assert.equal((await verify(expired)).status, 403);
  for (const route of ["/auth/me", "/auth/change-password", "/auth/logout"]) {
    assert.equal((await verify(expired, { active: true }, route)).next, true);
  }
});
test("sessionless and malformed session identifiers cannot authenticate", async () => {
  for (const sid of [undefined, "not-a-uuid", "-".repeat(36)]) {
    assert.equal((await verify({ ...payload, sid })).status, 401);
  }
});
