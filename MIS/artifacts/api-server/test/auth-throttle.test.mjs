import assert from "node:assert/strict";
import { test, after } from "node:test";
import { unlink } from "node:fs/promises";
import { build } from "esbuild";

const bundle = new URL(`./.tmp-throttle-${process.pid}.mjs`, import.meta.url);
await build({ entryPoints: [new URL("../src/lib/auth-throttle.ts", import.meta.url).pathname],
  outfile: bundle.pathname, bundle: true, platform: "node", format: "esm", packages: "external", logLevel: "silent" });
const { AuthThrottle, throttleAuth } = await import(bundle.href);
after(() => unlink(bundle).catch(() => {}));

test("throttle admits only the limit, returns retry seconds, and expires", async () => {
  const limiter = new AuthThrottle(10, 60000);
  const results = await Promise.all(Array.from({ length: 30 }, async () => limiter.take("login", "account", 10, 1000)));
  assert.equal(results.filter(r => r === 0).length, 10);
  assert(results.filter(r => r > 0).every(r => r === 60));
  assert.equal(limiter.take("login", "account", 10, 60500), 1);
  assert.equal(limiter.take("login", "account", 10, 61000), 0);
});

test("buckets isolate scopes and identities; saturation cannot evict live limits", () => {
  const limiter = new AuthThrottle(2, 60000);
  assert.equal(limiter.take("login", "one", 1, 0), 0);
  assert.equal(limiter.take("otp", "one", 1, 0), 0);
  assert.equal(limiter.take("login", "two", 1, 500), 60);
  assert.equal(limiter.buckets.size, 2);
  assert.equal(limiter.take("login", "one", 1, 500), 60);
  assert.equal(limiter.take("login", "two", 1, 60000), 0);
  assert.equal(limiter.buckets.size, 1);
  assert(!Array.from(limiter.buckets.keys()).some(k => k.includes("two")));
});

test("username normalization survives IP rotation and forwarded headers cannot rotate IP", () => {
  const login = throttleAuth("login");
  function attempt(username, ip) {
    let result = { passed: false, headers: {} };
    const res = { setHeader(k, v) { result.headers[k] = v; },
      status(s) { result.status = s; return this; }, json(body) { result.body = body; } };
    login({ body: { username }, ip, socket: {}, headers: { "x-forwarded-for": String(Math.random()) } },
      res, () => { result.passed = true; });
    return result;
  }
  for (let i = 0; i < 10; i++) assert(attempt("  Fixture_THROTTLE  ", `ip-${i}`).passed);
  const denied = attempt("fixture_throttle", "other-ip");
  assert.equal(denied.status, 429);
  assert(denied.headers["Retry-After"] > 0);
  assert.equal(denied.body.retryAfterSeconds, denied.headers["Retry-After"]);
  for (let i = 0; i < 60; i++) assert(attempt(`spray-${i}`, "single-ip").passed);
  assert.equal(attempt("new-account", "single-ip").status, 429);
});
