import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const project = fileURLToPath(new URL("../../", import.meta.url));
const fixture = await mkdtemp(path.join(os.tmpdir(), "mis-local-launcher-"));
await mkdir(path.join(fixture, "scripts/src"), { recursive: true });
const script = path.join(fixture, "scripts/src/local-dev.mjs");
await copyFile(path.join(project, "scripts/src/local-dev.mjs"), script);
await copyFile(path.join(project, ".env.local.example"), path.join(fixture, ".env.local.example"));
const env = { PATH: process.env.PATH, HOME: fixture };
test.after(() => rm(fixture, { recursive: true, force: true }));

test("initializer creates a private unique local config without exposing or overwriting secrets", async () => {
  const initialized = await exec(process.execPath, [script, "init"], { env });
  const filename = path.join(fixture, ".env.local");
  const content = await readFile(filename, "utf8");
  assert.match(content, /SESSION_SECRET=[a-f0-9]{64}/);
  assert.ok(!initialized.stdout.includes(content.match(/SESSION_SECRET=(.*)/)[1]));
  assert.ok(content.includes(JSON.stringify(path.join(fixture, ".local-dev"))));
  assert.equal((await stat(filename)).mode & 0o777, 0o600);
  await assert.rejects(exec(process.execPath, [script, "init"], { env }), /already exists/);
  assert.equal(await readFile(filename, "utf8"), content);
});

test("launcher refuses Replit, production, and unconfigured database placeholders", async () => {
  await assert.rejects(exec(process.execPath, [script, "check"],
    { env: { ...env, REPL_ID: "synthetic-replit" } }), /own computer/);
  await assert.rejects(exec(process.execPath, [script, "check"],
    { env: { ...env, NODE_ENV: "production" } }), /own computer/);
  await assert.rejects(exec(process.execPath, [script, "check"], { env }), /Replace the placeholders/);
});

test("launcher rejects remote database even when loaded from its local config", async () => {
  const filename = path.join(fixture, ".env.local");
  const content = await readFile(filename, "utf8");
  await writeFile(filename, content.replace(/^DATABASE_URL=.*$/m, "DATABASE_URL=postgresql://remote.example/mis"));
  await assert.rejects(exec(process.execPath, [script, "mail"], { env }), /not a remote database/);
});
