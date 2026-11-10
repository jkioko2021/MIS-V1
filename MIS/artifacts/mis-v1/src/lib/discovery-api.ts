const API_BASE = "/api";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ConnectionStatus {
  ok: boolean;
  server: string;
  version?: string;
  error?: string;
}

export interface Database {
  name: string;
  database_id: number;
  create_date: string;
  state_desc: string;
  recovery_model_desc: string;
  size_mb: number;
}

export interface TableMeta {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  TABLE_TYPE: string;
  row_count_estimate: number | null;
}

export interface ViewMeta {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
}

export interface ProcedureMeta {
  ROUTINE_SCHEMA: string;
  ROUTINE_NAME: string;
  CREATED: string;
  LAST_ALTERED: string;
}

export interface ColumnMeta {
  ORDINAL_POSITION: number;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  NUMERIC_PRECISION: number | null;
  NUMERIC_SCALE: number | null;
  COLUMN_DEFAULT: string | null;
  IS_PRIMARY_KEY: number;
  IS_FOREIGN_KEY: number;
  FK_TABLE: string | null;
  FK_COLUMN: string | null;
  IS_IDENTITY: number;
}

export interface IndexMeta {
  index_name: string;
  index_type: string;
  is_unique: boolean;
  is_primary_key: boolean;
  columns: string;
}

export interface PreviewResult {
  rows: Record<string, unknown>[];
  columns: string[];
  count: number;
}

export interface ProcedureDefinition {
  definition: {
    definition: string;
    create_date: string;
    modify_date: string;
  } | null;
  parameters: Array<{
    parameter_name: string;
    data_type: string;
    max_length: number;
    is_output: boolean;
    has_default_value: boolean;
    default_value: unknown;
    parameter_id: number;
  }>;
}

export interface SearchResult {
  type: "TABLE" | "VIEW" | "PROCEDURE";
  schema_name: string;
  object_name: string;
}

export const discoveryApi = {
  status: () => apiFetch<ConnectionStatus>("/discovery/status"),

  databases: () =>
    apiFetch<{ databases: Database[] }>("/discovery/databases").then(
      (r) => r.databases
    ),

  tables: (db: string) =>
    apiFetch<{ tables: TableMeta[] }>(`/discovery/${encodeURIComponent(db)}/tables`).then(
      (r) => r.tables
    ),

  views: (db: string) =>
    apiFetch<{ views: ViewMeta[] }>(`/discovery/${encodeURIComponent(db)}/views`).then(
      (r) => r.views
    ),

  procedures: (db: string) =>
    apiFetch<{ procedures: ProcedureMeta[] }>(
      `/discovery/${encodeURIComponent(db)}/procedures`
    ).then((r) => r.procedures),

  columns: (db: string, schema: string, table: string) =>
    apiFetch<{ columns: ColumnMeta[] }>(
      `/discovery/${encodeURIComponent(db)}/tables/${encodeURIComponent(schema)}/${encodeURIComponent(table)}/columns`
    ).then((r) => r.columns),

  preview: (db: string, schema: string, table: string, limit = 100) =>
    apiFetch<PreviewResult>(
      `/discovery/${encodeURIComponent(db)}/tables/${encodeURIComponent(schema)}/${encodeURIComponent(table)}/preview?limit=${limit}`
    ),

  rowcount: (db: string, schema: string, table: string) =>
    apiFetch<{ row_count: number }>(
      `/discovery/${encodeURIComponent(db)}/tables/${encodeURIComponent(schema)}/${encodeURIComponent(table)}/rowcount`
    ).then((r) => r.row_count),

  indexes: (db: string, schema: string, table: string) =>
    apiFetch<{ indexes: IndexMeta[] }>(
      `/discovery/${encodeURIComponent(db)}/tables/${encodeURIComponent(schema)}/${encodeURIComponent(table)}/indexes`
    ).then((r) => r.indexes),

  procedureDefinition: (db: string, schema: string, proc: string) =>
    apiFetch<ProcedureDefinition>(
      `/discovery/${encodeURIComponent(db)}/procedures/${encodeURIComponent(schema)}/${encodeURIComponent(proc)}/definition`
    ),

  viewDefinition: (db: string, schema: string, view: string) =>
    apiFetch<{ definition: string }>(
      `/discovery/${encodeURIComponent(db)}/views/${encodeURIComponent(schema)}/${encodeURIComponent(view)}/definition`
    ).then((r) => r.definition),

  search: (db: string, q: string) =>
    apiFetch<{ results: SearchResult[] }>(
      `/discovery/${encodeURIComponent(db)}/search?q=${encodeURIComponent(q)}`
    ).then((r) => r.results),
};
