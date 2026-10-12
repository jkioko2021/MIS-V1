import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const directory = await mkdtemp(path.join(os.tmpdir(), "mis-local-adapters-"));
// Only this isolated test process changes environment. It never queries a database.
delete process.env.REPL_ID;
delete process.env.REPLIT_DEPLOYMENT;
Object.assign(process.env, {
  MIS_LOCAL_DEV: "1", NODE_ENV: "development",
  DATABASE_URL: "postgresql://localhost/mis_local",
  SESSION_SECRET: "synthetic-local-test-key-not-used-by-any-account",
  MIS_LOCAL_DATA_DIR: directory,
});

const apiRoot = fileURLToPath(new URL("..", import.meta.url));
const output = await build({
  stdin: {
    contents: `
      export * from "./src/lib/local-runtime";
      export * from "./src/lib/local-storage";
      export * from "./src/lib/document-storage";
      export { sendResendEmail } from "./src/lib/business-notifications";
      export { default as storageRouter } from "./src/routes/storage";
    `, resolveDir: apiRoot, loader: "ts",
  },
  bundle: true, write: false, platform: "node", format: "cjs",
  packages: "external",
  plugins: [{
    name: "isolated-auth-and-database",
    setup(builder) {
      builder.onResolve({ filter: /auth-middleware$/ }, () => ({ path: "auth", namespace: "test" }));
      builder.onResolve({ filter: /\/postgres$/ }, () => ({ path: "database", namespace: "test" }));
      builder.onLoad({ filter: /.*/, namespace: "test" }, args => ({
        contents: args.path === "auth" ? `
          export function requireAuth(req, res, next) {
            if (!req.headers["x-test-user"]) return res.sendStatus(401);
            req.user = { username: req.headers["x-test-user"] }; next();
          }
        ` : `
          export const txQuery = () => { throw new Error("No database access allowed in adapter tests"); };
          export const withTransaction = txQuery;
        `,
        loader: "js",
      }));
    },
  }],
});
const require = createRequire(import.meta.url);
const module = { exports: {} };
new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
const adapters = module.exports;
const express = require("express");
const app = express();
app.use("/api", adapters.localUploadRouter);
app.use(express.json());
app.use("/api", adapters.storageRouter);
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const storage = new adapters.ObjectStorageService();
const userHeaders = { "x-test-user": "local-test-user" };

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
  await rm(directory, { recursive: true, force: true });
});

test("local mode is opt-in and refuses cloud, production, remote databases, and weak secrets", () => {
  assert.equal(adapters.isLocalRuntime({}), false);
  const good = { MIS_LOCAL_DEV: "1", NODE_ENV: "development",
    DATABASE_URL: "postgresql://127.0.0.1/mis_local", SESSION_SECRET: "x".repeat(32) };
  assert.equal(adapters.isLocalRuntime(good), true);
  for (const override of [{ REPL_ID: "test-replit" }, { REPLIT_DEPLOYMENT: "1" },
    { NODE_ENV: "production" }, { DATABASE_URL: "postgresql://remote.example/mis" },
    { DATABASE_URL: "https://localhost" }, { SESSION_SECRET: "short" }]) {
    assert.throws(() => adapters.isLocalRuntime({ ...good, ...override }));
  }
});

test("local email captures privately and idempotently, with no provider call", async () => {
  const mail = { from: "local@example.test", to: "admin@example.test",
    subject: "Synthetic OTP test", text: "Synthetic verification code: 123456",
    idempotencyKey: "local-test-email" };
  await adapters.sendResendEmail(mail);
  await adapters.sendResendEmail(mail);
  const files = await readdir(path.join(directory, "mail"));
  assert.equal(files.length, 1);
  const filename = path.join(directory, "mail", files[0]);
  assert.equal(JSON.parse(await readFile(filename, "utf8")).text, mail.text);
  assert.equal((await stat(filename)).mode & 0o777, 0o600);
});

test("uploads require auth; JSON document bytes round-trip; used tickets cannot overwrite", async () => {
  const body = '{"document":"local-only"}';
  const request = { name: "example.json", size: Buffer.byteLength(body), contentType: "application/json" };
  const denied = await fetch(`${base}/api/storage/uploads/request-url`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
  });
  assert.equal(denied.status, 401);
  const response = await fetch(`${base}/api/storage/uploads/request-url`, {
    method: "POST", headers: { ...userHeaders, "Content-Type": "application/json" }, body: JSON.stringify(request),
  });
  assert.equal(response.status, 200);
  const ticket = await response.json();
  assert.match(ticket.objectPath, /^\/objects\/uploads\/[a-f0-9-]+$/);
  const unauthenticated = await fetch(base + ticket.uploadURL, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body,
  });
  assert.equal(unauthenticated.status, 401);
  const differentUser = await fetch(base + ticket.uploadURL, {
    method: "PUT", headers: { "x-test-user": "another-user", "Content-Type": "application/json" }, body,
  });
  assert.equal(differentUser.status, 403);
  const uploaded = await fetch(base + ticket.uploadURL, {
    method: "PUT", headers: { ...userHeaders, "Content-Type": "application/json" }, body,
  });
  assert.equal(uploaded.status, 204);
  const file = await storage.getObjectEntityFile(ticket.objectPath);
  const [metadata] = await file.getMetadata();
  assert.equal(Number(metadata.size), Buffer.byteLength(body));
  assert.equal(await (await storage.downloadObject(file)).text(), body);
  assert.equal((await stat(path.join(directory, "documents", file.id))).mode & 0o777, 0o600);
  const replay = await fetch(base + ticket.uploadURL, {
    method: "PUT", headers: { ...userHeaders, "Content-Type": "application/json" }, body,
  });
  assert.equal(replay.status, 409);
  assert.equal(await (await storage.downloadObject(file)).text(), body);
  const generic = await fetch(`${base}/api/storage${ticket.objectPath}`, { headers: userHeaders });
  assert.equal(generic.status, 403);
});

test("local storage rejects invalid metadata, tampered tickets, missing objects, and traversal", async () => {
  assert.throws(() => adapters.createLocalUpload("local-test-user", 26 * 1024 * 1024, "application/pdf"));
  assert.throws(() => adapters.createLocalUpload("local-test-user", 0, "application/pdf"));
  const url = adapters.createLocalUpload("local-test-user", 3, "text/plain");
  const ticket = url.split("/").pop();
  assert.throws(() => adapters.parseLocalTicket(ticket + "tampered"));
  const payload = JSON.parse(Buffer.from(ticket.split(".")[0], "base64url").toString());
  payload.expires = Date.now() - 1;
  const crypto = await import("node:crypto");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signed = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(encoded).digest("base64url");
  assert.throws(() => adapters.parseLocalTicket(`${encoded}.${signed}`));
  await assert.rejects(storage.getObjectEntityFile("/objects/uploads/../../private"));
  await assert.rejects(storage.getObjectEntityFile("/objects/uploads/00000000-0000-4000-8000-000000000000"));
  assert.equal(await storage.searchPublicObject("documents/private"), null);
});
