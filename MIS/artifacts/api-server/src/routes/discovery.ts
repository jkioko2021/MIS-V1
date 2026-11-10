import { Router, type IRouter, type Request, type Response } from "express";
import { getPool, testConnection, sql } from "../lib/sqlserver";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type DatabaseParams = { database: string };
type TableParams = DatabaseParams & { schema: string; table: string };
type ProcedureParams = DatabaseParams & { schema: string; proc: string };
type ViewParams = DatabaseParams & { schema: string; view: string };

// ─── helpers ──────────────────────────────────────────────────────────────────

function handleError(res: Response, err: unknown, context: string) {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err, context }, "Discovery route error");
  res.status(500).json({ error: message, context });
}

// ─── connection status ─────────────────────────────────────────────────────────

router.get("/discovery/status", async (_req: Request, res: Response) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (err) {
    handleError(res, err, "status");
  }
});

// ─── databases ────────────────────────────────────────────────────────────────

router.get("/discovery/databases", async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        d.name,
        d.database_id,
        d.create_date,
        d.state_desc,
        d.recovery_model_desc,
        CAST(SUM(mf.size) * 8.0 / 1024 AS DECIMAL(10,2)) AS size_mb
      FROM sys.databases d
      LEFT JOIN sys.master_files mf ON d.database_id = mf.database_id
      WHERE d.name NOT IN ('master', 'tempdb', 'model', 'msdb')
        AND d.state_desc = 'ONLINE'
      GROUP BY d.name, d.database_id, d.create_date, d.state_desc, d.recovery_model_desc
      ORDER BY d.name
    `);
    res.json({ databases: result.recordset });
  } catch (err) {
    handleError(res, err, "databases");
  }
});

// ─── tables ───────────────────────────────────────────────────────────────────

router.get("/discovery/:database/tables", async (req: Request<DatabaseParams>, res: Response) => {
  const { database } = req.params;
  try {
    const pool = await getPool(database);
    const result = await pool.request().query(`
      SELECT 
        t.TABLE_SCHEMA,
        t.TABLE_NAME,
        t.TABLE_TYPE,
        p.rows AS row_count_estimate
      FROM INFORMATION_SCHEMA.TABLES t
      LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME
      LEFT JOIN sys.schemas ss ON ss.schema_id = st.schema_id AND ss.name = t.TABLE_SCHEMA
      LEFT JOIN sys.partitions p ON p.object_id = st.object_id AND p.index_id IN (0, 1)
      WHERE t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
    `);
    res.json({ tables: result.recordset });
  } catch (err) {
    handleError(res, err, "tables");
  }
});

// ─── views ────────────────────────────────────────────────────────────────────

router.get("/discovery/:database/views", async (req: Request<DatabaseParams>, res: Response) => {
  const { database } = req.params;
  try {
    const pool = await getPool(database);
    const result = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.VIEWS
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    res.json({ views: result.recordset });
  } catch (err) {
    handleError(res, err, "views");
  }
});

// ─── stored procedures ────────────────────────────────────────────────────────

router.get("/discovery/:database/procedures", async (req: Request<DatabaseParams>, res: Response) => {
  const { database } = req.params;
  try {
    const pool = await getPool(database);
    const result = await pool.request().query(`
      SELECT 
        ROUTINE_SCHEMA,
        ROUTINE_NAME,
        CREATED,
        LAST_ALTERED
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY ROUTINE_SCHEMA, ROUTINE_NAME
    `);
    res.json({ procedures: result.recordset });
  } catch (err) {
    handleError(res, err, "procedures");
  }
});

// ─── table columns ────────────────────────────────────────────────────────────

router.get(
  "/discovery/:database/tables/:schema/:table/columns",
  async (req: Request<TableParams>, res: Response) => {
    const { database, schema, table } = req.params;
    try {
      const pool = await getPool(database);
      const request = pool.request();
      request.input("schema", sql.NVarChar, schema);
      request.input("table", sql.NVarChar, table);

      const result = await request.query(`
        SELECT 
          c.ORDINAL_POSITION,
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.IS_NULLABLE,
          c.CHARACTER_MAXIMUM_LENGTH,
          c.NUMERIC_PRECISION,
          c.NUMERIC_SCALE,
          c.COLUMN_DEFAULT,
          CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY,
          CASE WHEN fk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_FOREIGN_KEY,
          fk.REFERENCED_TABLE AS FK_TABLE,
          fk.REFERENCED_COLUMN AS FK_COLUMN,
          COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku 
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
            AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            AND tc.TABLE_SCHEMA = @schema
            AND tc.TABLE_NAME = @table
        ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
        LEFT JOIN (
          SELECT 
            kcu.COLUMN_NAME,
            ccu.TABLE_NAME AS REFERENCED_TABLE,
            ccu.COLUMN_NAME AS REFERENCED_COLUMN
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
            ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
          JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
            ON tc.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
          JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
            ON rc.UNIQUE_CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
          WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND tc.TABLE_SCHEMA = @schema
            AND tc.TABLE_NAME = @table
        ) fk ON c.COLUMN_NAME = fk.COLUMN_NAME
        WHERE c.TABLE_SCHEMA = @schema AND c.TABLE_NAME = @table
        ORDER BY c.ORDINAL_POSITION
      `);
      res.json({ columns: result.recordset });
    } catch (err) {
      handleError(res, err, "columns");
    }
  }
);

// ─── data preview ─────────────────────────────────────────────────────────────

router.get(
  "/discovery/:database/tables/:schema/:table/preview",
  async (req: Request<TableParams>, res: Response) => {
    const { database, schema, table } = req.params;
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    try {
      const pool = await getPool(database);
      // Use quoted identifiers to prevent injection
      const safeSchema = schema.replace(/[^\w]/g, "");
      const safeTable = table.replace(/[^\w]/g, "");
      const result = await pool
        .request()
        .query(`SELECT TOP ${limit} * FROM [${safeSchema}].[${safeTable}]`);
      res.json({
        rows: result.recordset,
        columns: result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
        count: result.recordset.length,
      });
    } catch (err) {
      handleError(res, err, "preview");
    }
  }
);

// ─── row count ────────────────────────────────────────────────────────────────

router.get(
  "/discovery/:database/tables/:schema/:table/rowcount",
  async (req: Request<TableParams>, res: Response) => {
    const { database, schema, table } = req.params;
    try {
      const pool = await getPool(database);
      const request = pool.request();
      request.input("schema", sql.NVarChar, schema);
      request.input("table", sql.NVarChar, table);
      const result = await request.query(`
        SELECT SUM(p.rows) AS row_count
        FROM sys.tables t
        JOIN sys.schemas s ON t.schema_id = s.schema_id
        JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
        WHERE t.name = @table AND s.name = @schema
      `);
      res.json({ row_count: result.recordset[0]?.row_count ?? 0 });
    } catch (err) {
      handleError(res, err, "rowcount");
    }
  }
);

// ─── procedure definition ─────────────────────────────────────────────────────

router.get(
  "/discovery/:database/procedures/:schema/:proc/definition",
  async (req: Request<ProcedureParams>, res: Response) => {
    const { database, schema, proc } = req.params;
    try {
      const pool = await getPool(database);
      const request = pool.request();
      request.input("schema", sql.NVarChar, schema);
      request.input("proc", sql.NVarChar, proc);

      // Get definition
      const defResult = await request.query(`
        SELECT m.definition, p.create_date, p.modify_date
        FROM sys.procedures p
        JOIN sys.schemas s ON p.schema_id = s.schema_id
        JOIN sys.sql_modules m ON p.object_id = m.object_id
        WHERE s.name = @schema AND p.name = @proc
      `);

      // Get parameters
      const request2 = pool.request();
      request2.input("schema", sql.NVarChar, schema);
      request2.input("proc", sql.NVarChar, proc);
      const paramResult = await request2.query(`
        SELECT 
          p.name AS parameter_name,
          t.name AS data_type,
          p.max_length,
          p.is_output,
          p.has_default_value,
          p.default_value,
          p.parameter_id
        FROM sys.procedures sp
        JOIN sys.schemas s ON sp.schema_id = s.schema_id
        JOIN sys.parameters p ON sp.object_id = p.object_id
        JOIN sys.types t ON p.user_type_id = t.user_type_id
        WHERE s.name = @schema AND sp.name = @proc
        ORDER BY p.parameter_id
      `);

      res.json({
        definition: defResult.recordset[0],
        parameters: paramResult.recordset,
      });
    } catch (err) {
      handleError(res, err, "procedure-definition");
    }
  }
);

// ─── view definition ──────────────────────────────────────────────────────────

router.get(
  "/discovery/:database/views/:schema/:view/definition",
  async (req: Request<ViewParams>, res: Response) => {
    const { database, schema, view } = req.params;
    try {
      const pool = await getPool(database);
      const request = pool.request();
      request.input("schema", sql.NVarChar, schema);
      request.input("view", sql.NVarChar, view);
      const result = await request.query(`
        SELECT VIEW_DEFINITION
        FROM INFORMATION_SCHEMA.VIEWS
        WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @view
      `);
      res.json({ definition: result.recordset[0]?.VIEW_DEFINITION });
    } catch (err) {
      handleError(res, err, "view-definition");
    }
  }
);

// ─── indexes ──────────────────────────────────────────────────────────────────

router.get(
  "/discovery/:database/tables/:schema/:table/indexes",
  async (req: Request<TableParams>, res: Response) => {
    const { database, schema, table } = req.params;
    try {
      const pool = await getPool(database);
      const request = pool.request();
      request.input("schema", sql.NVarChar, schema);
      request.input("table", sql.NVarChar, table);
      const result = await request.query(`
        SELECT 
          i.name AS index_name,
          i.type_desc AS index_type,
          i.is_unique,
          i.is_primary_key,
          STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns
        FROM sys.tables t
        JOIN sys.schemas s ON t.schema_id = s.schema_id
        JOIN sys.indexes i ON t.object_id = i.object_id
        JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE s.name = @schema AND t.name = @table AND i.type > 0
        GROUP BY i.name, i.type_desc, i.is_unique, i.is_primary_key
        ORDER BY i.is_primary_key DESC, i.name
      `);
      res.json({ indexes: result.recordset });
    } catch (err) {
      handleError(res, err, "indexes");
    }
  }
);

// ─── search objects ───────────────────────────────────────────────────────────

router.get("/discovery/:database/search", async (req: Request<DatabaseParams>, res: Response) => {
  const { database } = req.params;
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.json({ results: [] });
    return;
  }

  try {
    const pool = await getPool(database);
    const request = pool.request();
    request.input("q", sql.NVarChar, `%${q}%`);
    const result = await request.query(`
      SELECT 'TABLE' AS type, TABLE_SCHEMA AS schema_name, TABLE_NAME AS object_name
      FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE @q
      UNION ALL
      SELECT 'VIEW', TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME LIKE @q
      UNION ALL
      SELECT 'PROCEDURE', ROUTINE_SCHEMA, ROUTINE_NAME
      FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME LIKE @q
      ORDER BY type, schema_name, object_name
    `);
    res.json({ results: result.recordset });
  } catch (err) {
    handleError(res, err, "search");
  }
});

export default router;
