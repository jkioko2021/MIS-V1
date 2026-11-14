import { getPool } from "./sqlserver";
import { withTransaction } from "./postgres";
import { IntermediaryError, parseMaster, masterColumns } from "./intermediary";

/** Explicit source selection keeps repository connectivity deferred until configured. */
export function coreImportConfiguration() {
  if (process.env.MIS_AGENT_CORE_SOURCE !== "legacy-sqlserver")
    return { import_available: false, import_reason: "The agent data repository connection is deferred. Configure SQL Server access to DB_MASTER_AGENTS.dbo.TBL_MIS_SALES_INTERMEDIARY before importing." };
  if (!process.env.MSSQL_HOST || !process.env.MSSQL_USER || !process.env.MSSQL_PASSWORD)
    return { import_available: false, import_reason: "The agent data repository SQL Server connection is not configured." };
  return { import_available: true, import_reason: null };
}

/** Upstream populates the repository; MIS only reads active, uncoded identities. */
export async function pullCoreAgents() {
  const config = coreImportConfiguration();
  if (!config.import_available) throw new IntermediaryError(503, config.import_reason!);
  try {
    const pool = await getPool("DB_MASTER_AGENTS");
    const result = await pool.request().query(`
      SELECT TOP (10001) REF_NO AS source_ref,AGENT_CODE AS agent_code,USER_ID AS user_id,
        AGENT_NAME AS agent_name,AGENT_TYPE AS agent_type,
        CONVERT(varchar(10),COALESCE(TRY_CONVERT(date,Receive_Date,23),TRY_CONVERT(date,Receive_Date,103)),23) AS receive_date,
        CONVERT(varchar(10),COALESCE(TRY_CONVERT(date,Contract_Date,23),TRY_CONVERT(date,Contract_Date,103)),23) AS contract_date,
        UNIT_CODE AS unit_code,BRANCH_CODE AS branch_code,REGION_CODE AS region_code,
        EMAIL AS email,MOBILE_NO AS mobile_no,SEC_MOBILE_NO AS secondary_mobile,HRMIS_CODE AS hrmis_code,
        PIN_NO AS pin_no,NID_NO AS nid_no,RMS_CODE_CORP AS rms_code_corp,RMS_CODE_RET AS rms_code_ret,
        GI_CODE AS gi_code,COMMISSION_RATE AS commission_rate,CONVERT(varchar(30),PAY_MODE) AS pay_mode,
        CAST(COALESCE(ETIMS_VERIFIED,0) AS bit) AS etims_verified
      FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY]
      WHERE COALESCE(CODED,0)=0 AND ACTIVE=1 ORDER BY ID`);
    return result.recordset as Record<string, unknown>[];
  } catch {
    throw new IntermediaryError(503, "Unable to read the agent data repository. Check SQL Server connectivity and SELECT access to DB_MASTER_AGENTS.dbo.TBL_MIS_SALES_INTERMEDIARY. No MIS records were imported.");
  }
}

/** Inserts only new core identities; repeated imports never overwrite MIS work. */
export async function importCoreRows(rows: Record<string, unknown>[], actor: string) {
  if (rows.length > 10000) throw new IntermediaryError(400, "Core import exceeds 10,000 records. Narrow the core extract before importing.");
  const identities = new Set<string>();
  const parsed = rows.map((row, index) => {
    const normalized = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]));
    const data = parseMaster({ ...normalized, agent_type: normalized.agent_type || "UNCLASSIFIED",
      notes: "Imported from the core system; MIS details pending." });
    if (identities.has(data.agent_code)) throw new IntermediaryError(400, `Core extract contains a duplicate identity at record ${index + 1}. No records imported.`);
    identities.add(data.agent_code);
    const ref = String(normalized.source_ref || data.agent_code);
    if (ref.length > 64) throw new IntermediaryError(400, "A core source reference exceeds the supported length.");
    return { data, ref };
  });
  return withTransaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(7345202)");
    let imported = 0, skipped = 0;
    for (const { data, ref } of parsed) {
      const result = await client.query(`INSERT INTO crm.tbl_mis_sales_intermediary
        (agent_code,${masterColumns.join(",")},agent_status,registration_status,source_ref,source_imported_at,imported_by)
        VALUES($1,${masterColumns.map((_, i) => `$${i + 2}`).join(",")},'DRAFT','PENDING',$${masterColumns.length + 2},now(),$${masterColumns.length + 3})
        ON CONFLICT(agent_code) DO NOTHING RETURNING agent_code`,
      [data.agent_code, ...masterColumns.map(k => data[k] ?? (k === "etims_verified" ? false : null)), ref, actor]);
      if (result.rowCount) {
        imported++;
        await client.query(`INSERT INTO crm.intermediary_events(agent_code,action,notes,actor)
          VALUES($1,'CORE_IMPORTED','Imported from core; complete MIS details before activation.',$2)`, [data.agent_code, actor]);
      } else skipped++;
    }
    return { imported, skipped, message: `Imported ${imported} new agent${imported === 1 ? "" : "s"}; ${skipped} existing record${skipped === 1 ? "" : "s"} left unchanged.` };
  });
}
