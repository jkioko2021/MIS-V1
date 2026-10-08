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
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "auth-session-tests-"));
  await build({
    entryPoints: [path.join(root, "src/lib/auth-middleware.ts")],
    outfile: path.join(dir, "auth.mjs"), bundle: true, platform: "node", format: "esm",
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
test("admin persistent session must still have OTP verification", async () => {
  const admin = { ...payload, username: process.env.MIS_LOGIN_OTP_USERNAME?.trim() || "admin" };
  assert.equal((await verify(admin)).status, 401);
  assert.equal((await verify({ ...admin, otpVerified: true })).next, true);
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
