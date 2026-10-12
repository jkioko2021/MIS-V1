import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createInterface } from "node:readline/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root, "artifacts/api-server/package.json"));
const { Client } = require("pg");
const bcrypt = require("bcrypt");

// Repeat the safety gate here: callers cannot bypass the launcher's guard by
// importing this module or supplying a remote URL as a function argument.
export function assertLocalDatabase(env) {
  const url = new URL(env.DATABASE_URL);
  if (env.MIS_LOCAL_DEV !== "1" || env.NODE_ENV !== "development"
    || env.REPL_ID || env.REPLIT_DEPLOYMENT || process.env.REPL_ID
    || process.env.REPLIT_DEPLOYMENT || process.env.NODE_ENV === "production"
    || !["postgres:", "postgresql:"].includes(url.protocol)
    || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || [...url.searchParams.keys()].some(key => !["sslmode"].includes(key))) {
    throw new Error("Clean database commands require standalone local development and a loopback PostgreSQL URL without connection overrides.");
  }
}

async function transaction(env, action) {
  assertLocalDatabase(env);
  const client = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let began = false;
  try {
    await client.connect();
    await client.query("BEGIN");
    began = true;
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SELECT pg_advisory_xact_lock(6969001)");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    if (began) await client.query("ROLLBACK").catch(() => {});
    // Never include database connection details, query parameters or hashes.
    if (error instanceof LocalSetupError) throw error;
    throw new Error("Local database operation failed and was rolled back. Check PostgreSQL, local credentials and baseline compatibility.");
  } finally { await client.end().catch(() => {}); }
}

class LocalSetupError extends Error {}

export async function bootstrapDatabase(env) {
  return transaction(env, async client => {
    const occupied = await client.query(`SELECT 1 FROM pg_namespace n
      WHERE n.nspname IN ('crm','sales','commission','risk')
      UNION ALL SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog','information_schema')
        AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'
        AND c.relkind IN ('r','p','v','m','S','f') LIMIT 1`);
    if (occupied.rowCount) throw new LocalSetupError("Bootstrap refused: database is not empty. Create a separate empty local database; nothing was changed.");
    await client.query(await readFile(path.join(root, "lib/db/migrations/local-baseline/001_schema.sql"), "utf8"));
    // Reuse the canonical security migration, excluding its outer transaction:
    // the baseline, triggers and reference seed commit/roll back together.
    const sessions = await readFile(path.join(root, "lib/db/migrations/0034_persistent_auth_sessions.sql"), "utf8");
    await client.query(sessions.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, ""));
    await client.query(await readFile(path.join(root, "lib/db/migrations/local-baseline/002_reference_data.sql"), "utf8"));
  });
}

export function validateAdminPassword(password) {
  if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 72
    || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    throw new LocalSetupError("Choose a password with at least 12 characters, uppercase, number and special character (at most 72 UTF-8 bytes).");
  }
}

export async function provisionAdmin(env, password) {
  assertLocalDatabase(env);
  validateAdminPassword(password);
  const username = env.MIS_LOGIN_OTP_USERNAME || "admin";
  const email = env.MIS_LOGIN_OTP_EMAIL || "admin@example.test";
  if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(username) || !/^[^@\s]+@example\.test$/.test(email)) {
    throw new LocalSetupError("Use a simple configured OTP username and an @example.test local email address.");
  }
  const hash = await bcrypt.hash(password, 12);
  return transaction(env, async client => {
    const marker = await client.query("SELECT to_regclass('crm.local_bootstrap') AS marker");
    if (!marker.rows[0]?.marker) throw new LocalSetupError("Admin provisioning requires the separate clean local baseline, not a restored database.");
    const version = await client.query("SELECT baseline_version FROM crm.local_bootstrap WHERE singleton");
    if (version.rows[0]?.baseline_version !== 1) throw new LocalSetupError("Unsupported local baseline version.");
    await client.query("LOCK TABLE crm.employees IN SHARE ROW EXCLUSIVE MODE");
    const existing = await client.query("SELECT 1 FROM crm.employees LIMIT 1");
    if (existing.rowCount) throw new LocalSetupError("Admin provisioning refused: an employee already exists. No password or account was changed; use normal account administration.");
    const profile = await client.query("SELECT 1 FROM crm.profiles WHERE profile_id=1 AND profile_name='SuperAdmin' AND is_active");
    if (!profile.rowCount) throw new LocalSetupError("The clean SuperAdmin profile is missing or inactive.");
    const result = await client.query(`INSERT INTO crm.employees
      (emp_code,username,password_hash,employee_name,email,department,profile_id,
       activated,approved,approved_by,date_approved,last_password_reset,added_by)
      VALUES ('LOCAL-ADMIN',$1,$2,'Synthetic Local Administrator',$3,'LOCAL',1,
        true,true,'LOCAL-PROVISIONING',CURRENT_DATE,CURRENT_DATE,'LOCAL-PROVISIONING')
      RETURNING employee_id`, [username,hash,email]);
    await client.query("INSERT INTO crm.password_history(employee_id,password_hash) VALUES ($1,$2)",
      [result.rows[0].employee_id,hash]);
    await client.query(`INSERT INTO crm.admin_audit_trail(username,action_type,description)
      VALUES ($1,'LOCAL_ADMIN_PROVISIONED','Explicit synthetic local administrator provisioning')`,[username]);
  });
}

// Passwords are never command-line arguments or persisted environment settings.
// Interactive entry is hidden; EOF/Ctrl+C reject rather than creating an account.
export async function promptAdminPassword() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new LocalSetupError("Run local:db:admin in an interactive terminal. Passwords cannot be supplied through arguments or environment variables.");
  const read = label => new Promise((resolve,reject) => {
    process.stdout.write(label);
    let value = "";
    const previousRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const done = error => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(previousRaw);
      process.stdin.pause();
      process.stdout.write("\n");
      error ? reject(error) : resolve(value);
    };
    const onData = chunk => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003" || char === "\u0004") { done(new LocalSetupError("Admin provisioning cancelled.")); return; }
        if (char === "\r" || char === "\n") { done(); return; }
        if (char === "\u007f" || char === "\b") value = [...value].slice(0,-1).join("");
        else if (char >= " " && Buffer.byteLength(value) < 256) value += char;
      }
    };
    process.stdin.on("data",onData);
  });
  const password = await read("Choose local test admin password (hidden): ");
  validateAdminPassword(password);
  const confirmation = await read("Confirm password (hidden): ");
  if (password !== confirmation) throw new LocalSetupError("Passwords do not match; no account was created.");
  const prompt = createInterface({input:process.stdin,output:process.stdout});
  try {
    if (await prompt.question("Type PROVISION to create the synthetic administrator: ") !== "PROVISION")
      throw new LocalSetupError("Admin provisioning cancelled.");
  } finally { prompt.close(); }
  return password;
}
