import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, writeFile, chmod } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { checkDocumentMetadata } from "./document-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envFile = path.join(root, ".env.local");
const command = process.argv[2];
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const children = new Set();

function localEnvironment() {
  if (process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT || process.env.NODE_ENV === "production") {
    throw new Error("Run local:* on your own computer, not inside Replit or production.");
  }
  if (!existsSync(envFile)) throw new Error("Run pnpm local:init first, then edit .env.local.");
  // Node's env-file parser handles quoted passwords without shell evaluation.
  process.loadEnvFile(envFile);
  const env = { ...process.env };
  if (env.MIS_LOCAL_DEV !== "1" || env.NODE_ENV !== "development"
    || env.REPL_ID || env.REPLIT_DEPLOYMENT) throw new Error("Invalid local development configuration.");
  let database;
  try { database = new URL(env.DATABASE_URL); }
  catch { throw new Error("Set DATABASE_URL to your local PostgreSQL database."); }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)
    || !["postgres:", "postgresql:"].includes(database.protocol)) {
    throw new Error("DATABASE_URL must target PostgreSQL on this computer, not a remote database.");
  }
  if (env.DATABASE_URL.includes("REPLACE_") || env.SESSION_SECRET?.includes("REPLACE_")
    || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error("Replace the placeholders in .env.local before continuing.");
  }
  env.MIS_LOCAL_DATA_DIR = path.resolve(root, env.MIS_LOCAL_DATA_DIR || ".local-dev");
  return env;
}

function run(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpm, args, { cwd: root, env, stdio: "inherit" });
    children.add(child);
    child.once("error", reject);
    child.once("exit", code => {
      children.delete(child);
      code === 0 ? resolve() : reject(new Error(`Command exited with code ${code ?? "signal"}.`));
    });
  });
}

async function build(env) {
  await run(["run", "typecheck"], { ...env, BASE_PATH: "/", PORT: "5173" });
  await run(["--filter", "@workspace/api-server", "run", "build"], env);
  await run(["--filter", "@workspace/mis-v1", "run", "build"], { ...env, BASE_PATH: "/", PORT: "5173" });
}

async function checkDatabase(env) {
  const require = createRequire(path.join(root, "artifacts/api-server/package.json"));
  const { Client } = require("pg");
  const client = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const required = ["employees", "profiles", "menu_access", "business_tracking",
      "business_req", "business_uploads", "business_work_items", "login_otp_challenges",
      "auth_sessions", "business_notifications"];
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='crm' AND table_name=ANY($1)",
      [required]);
    const found = new Set(result.rows.map(row => row.table_name));
    const missing = required.filter(table => !found.has(table));
    if (missing.length) throw new Error(`Database setup incomplete. Missing tables: ${missing.join(", ")}. Use the clean baseline on an empty database or restore an approved complete backup; see docs/LOCAL_DEVELOPMENT.md.`);
    await checkDocumentMetadata(client);
    const user = await client.query(
      "SELECT 1 FROM crm.employees WHERE lower(username)=lower($1) AND NOT is_deleted LIMIT 1",
      [env.MIS_LOGIN_OTP_USERNAME || "admin"]);
    if (!user.rowCount) throw new Error("Configured OTP account is missing. For a clean baseline, explicitly run local:db:admin; for a restored database, use its approved account.");
    console.info("Local database connected; core tables and configured OTP account are present.");
    console.info("This is a setup check, not an exhaustive workflow/schema validation.");
  } catch (error) {
    // Database connection errors may include credentials or network details: do not print them.
    if (String(error.message).startsWith("Database setup incomplete.") || String(error.message).startsWith("Configured ")) throw error;
    throw new Error("Local database check failed. Check PostgreSQL, your local credentials, and restored schema.");
  } finally { await client.end().catch(() => {}); }
}

async function main() {
  if (command === "init") {
    if (process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT) {
      throw new Error("Initialize on your local computer, not in Replit.");
    }
    const template = await readFile(path.join(root, ".env.local.example"), "utf8");
    const content = template
      .replace("REPLACE_WITH_RANDOM_64_CHARACTER_SECRET", randomBytes(32).toString("hex"))
      .replace("REPLACE_WITH_ABSOLUTE_PATH_TO_PROJECT/.local-dev",
        JSON.stringify(path.join(root, ".local-dev")));
    await writeFile(envFile, content, { flag: "wx", mode: 0o600 });
    console.info("Created private .env.local. Set its local database password, then run pnpm local:check.");
    return;
  }
  const env = localEnvironment();
  await mkdir(env.MIS_LOCAL_DATA_DIR, { recursive: true, mode: 0o700 });
  await chmod(env.MIS_LOCAL_DATA_DIR, 0o700);
  if (command === "check") {
    await checkDatabase(env);
    console.info("Local email capture and disk storage are enabled. Replit services will not be contacted.");
    return;
  }
  if (command === "db-init" || command === "db-admin" || command === "db-metadata") {
    if (process.argv.length !== 3) throw new Error("Database commands take no arguments; never pass passwords on the command line.");
    const { bootstrapDatabase, provisionAdmin, promptAdminPassword, repairLocalDocumentMetadata } = await import("./local-database.mjs");
    if (command === "db-init") {
      await bootstrapDatabase(env);
      console.info("Clean local baseline and synthetic reference catalogs created. No employee or business records were copied.");
      console.info("Run pnpm local:db:admin to explicitly provision your test administrator.");
    } else if (command === "db-metadata") {
      await repairLocalDocumentMetadata(env);
      console.info("Local document metadata ready. Existing notes and historical values were not changed.");
    } else {
      await provisionAdmin(env, await promptAdminPassword());
      console.info("Synthetic administrator created. OTP, password expiry and session security remain enabled.");
    }
    return;
  }
  if (command === "mail") {
    const directory = path.join(env.MIS_LOCAL_DATA_DIR, "mail");
    const filenames = await readdir(directory).catch(error => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const messages = [];
    for (const filename of filenames.filter(name => /^[a-f0-9]{64}\.json$/.test(name))) {
      messages.push(JSON.parse(await readFile(path.join(directory, filename), "utf8")));
    }
    messages.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    for (const email of messages.slice(-5)) {
      console.info(`\n${email.capturedAt}\nTo: ${email.to}\nSubject: ${email.subject}\n${email.text}`);
    }
    if (!messages.length) console.info("No local emails yet. Start the app and request an admin login OTP.");
    console.info("Development messages may contain OTP codes. Do not share this output.");
    return;
  }
  if (command === "build") { await build(env); return; }
  if (command !== "dev" && command !== "debug") throw new Error("Unknown local command.");
  await checkDatabase(env);
  await run(["--filter", "@workspace/api-server", "run", "build"], env);
  const api = spawn(process.execPath, [
    ...(command === "debug" ? ["--inspect=127.0.0.1:9229"] : []),
    "--enable-source-maps", path.join(root, "artifacts/api-server/dist/index.mjs"),
  ], { cwd: root, env: { ...env, PORT: "8080" }, stdio: "inherit" });
  const web = spawn(pnpm, ["--filter", "@workspace/mis-v1", "run", "dev", "--host", "127.0.0.1"],
    { cwd: root, env: { ...env, PORT: "5173", BASE_PATH: "/" }, stdio: "inherit" });
  children.add(api); children.add(web);
  console.info("Open http://localhost:5173. Use pnpm local:mail in another terminal to read local OTP emails.");
  await new Promise((resolve, reject) => {
    for (const child of [api, web]) {
      child.once("error", reject);
      child.once("exit", code => code === 0 ? resolve() : reject(new Error("A local service stopped.")));
    }
  });
}

const stop = () => { for (const child of children) child.kill("SIGTERM"); };
process.once("SIGINT", () => { stop(); process.exit(130); });
process.once("SIGTERM", () => { stop(); process.exit(143); });
try { await main(); }
catch (error) {
  console.error(error.code === "EEXIST" ? ".env.local already exists; it was not overwritten." : error.message);
  process.exitCode = 1;
} finally { stop(); }
