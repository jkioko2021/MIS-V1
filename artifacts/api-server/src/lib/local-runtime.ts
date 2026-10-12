import path from "node:path";

/** Local adapters are opt-in and must never run in a Replit workspace/deployment. */
export function isLocalRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.MIS_LOCAL_DEV !== "1") return false;
  if (env.NODE_ENV === "production" || env.REPL_ID || env.REPLIT_DEPLOYMENT) {
    throw new Error("Local development adapters cannot run on Replit or in production.");
  }
  const database = new URL(env.DATABASE_URL || "postgresql://localhost/mis_local");
  if (!["postgres:", "postgresql:"].includes(database.protocol)
    || !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
    throw new Error("Local development mode requires a loopback PostgreSQL database.");
  }
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error("Local development requires a SESSION_SECRET of at least 32 characters.");
  }
  return true;
}

export function localDataDirectory() {
  if (!isLocalRuntime()) throw new Error("Local development mode is not enabled.");
  if (!process.env.MIS_LOCAL_DATA_DIR) throw new Error("MIS_LOCAL_DATA_DIR is required.");
  return path.resolve(process.env.MIS_LOCAL_DATA_DIR);
}
