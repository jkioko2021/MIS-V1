import sql from "mssql";
import { logger } from "./logger";

export interface ConnectionConfig {
  host: string;
  port?: number;
  instance?: string;
  user: string;
  password: string;
  database?: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}

function getDefaultConfig(): ConnectionConfig {
  const host = process.env.MSSQL_HOST;
  const user = process.env.MSSQL_USER;
  const password = process.env.MSSQL_PASSWORD;
  const instance = process.env.MSSQL_INSTANCE?.trim() || undefined;
  const configuredPort = process.env.MSSQL_PORT?.trim();
  const port = configuredPort
    ? Number(configuredPort)
    : instance
      ? undefined
      : 1433;
  const encrypt = process.env.MSSQL_ENCRYPT !== "false";
  const trustServerCertificate = process.env.MSSQL_TRUST_SERVER_CERT === "true";

  if (!host || !user || !password) {
    throw new Error(
      "Missing required SQL Server environment variables: MSSQL_HOST, MSSQL_USER, MSSQL_PASSWORD"
    );
  }

  if (port !== undefined && (!Number.isInteger(port) || port <= 0 || port > 65535)) {
    throw new Error(`Invalid MSSQL_PORT value: "${configuredPort}"`);
  }

  return { host, port, instance, user, password, encrypt, trustServerCertificate };
}

const pools = new Map<string, sql.ConnectionPool>();

export async function getPool(database?: string): Promise<sql.ConnectionPool> {
  const key = database ?? "__master__";

  if (pools.has(key)) {
    const pool = pools.get(key)!;
    if (pool.connected) return pool;
    pools.delete(key);
  }

  const cfg = getDefaultConfig();
  const config: sql.config = {
    server: cfg.host,
    ...(cfg.port !== undefined ? { port: cfg.port } : {}),
    user: cfg.user,
    password: cfg.password,
    database: database,
    options: {
      encrypt: cfg.encrypt ?? true,
      trustServerCertificate: cfg.trustServerCertificate ?? false,
      ...(cfg.instance ? { instanceName: cfg.instance } : {}),
      enableArithAbort: true,
      connectTimeout: 30000,
      requestTimeout: 60000,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  logger.info(
    { server: cfg.host, instance: cfg.instance, port: cfg.port, database },
    "Opening SQL Server connection pool",
  );
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  pools.set(key, pool);
  return pool;
}

export async function testConnection(): Promise<{ ok: boolean; server: string; version?: string; error?: string }> {
  const cfg = getDefaultConfig();
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT @@VERSION AS version, @@SERVERNAME AS server_name");
    const row = result.recordset[0];
    return { ok: true, server: cfg.host, version: row?.version };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "SQL Server connection test failed");
    return { ok: false, server: cfg.host, error: message };
  }
}

export { sql };
