import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import { transform } from "esbuild";

const require = createRequire(import.meta.url);
const file = new URL("../src/lib/intermediary-core-import.ts", import.meta.url);
const { code } = await transform(await readFile(file, "utf8"), {
  loader: "ts", format: "cjs", target: "es2022",
});

function fixture({ configured = true, credentials = true, fail = false } = {}) {
  const calls = [];
  const rows = [{ source_ref: "TEST_REF", agent_code: "TEST_AGENT",
    user_id: "0001234567890123456789", mobile_no: "0700000000", commission_rate: 0.1 }];
  class IntermediaryError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  const module = { exports: {} };
  const env = {
    ...(configured ? { MIS_AGENT_CORE_SOURCE: "legacy-sqlserver" } : {}),
    ...(credentials ? { MSSQL_HOST: "fixture", MSSQL_USER: "fixture", MSSQL_PASSWORD: "fixture" } : {}),
  };
  vm.runInNewContext(code, {
    module, exports: module.exports, process: { env },
    require(name) {
      if (name === "./sqlserver") return {
        async getPool(database) {
          calls.push({ database });
          if (fail) throw new Error("private SQL diagnostic");
          // No execute/input/write methods: attempts to extract or write fail the test.
          return { request: () => ({ async query(sql) { calls.push({ sql }); return { recordset: rows }; } }) };
        },
      };
      if (name === "./postgres") return {
        withTransaction() { throw new Error("Repository reads must not write to PostgreSQL"); },
      };
      if (name === "./intermediary") return { IntermediaryError };
      return require(name);
    },
  });
  return { lib: module.exports, calls, rows };
}

test("repository import stays deferred without explicit configuration or credentials", async () => {
  for (const options of [{ configured: false }, { credentials: false }]) {
    const { lib, calls } = fixture(options);
    assert.equal(lib.coreImportConfiguration().import_available, false);
    await assert.rejects(lib.pullCoreAgents(), e => e.status === 503);
    assert.equal(calls.length, 0);
  }
});

test("repository import only selects active uncoded agents, without extraction or source writes", async () => {
  const { lib, calls, rows } = fixture();
  assert.equal(await lib.pullCoreAgents(), rows);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].database, "DB_MASTER_AGENTS");
  const sql = calls[1].sql;
  assert.match(sql, /SELECT TOP \(10001\)/);
  assert.match(sql, /FROM \[DB_MASTER_AGENTS\]\.\[dbo\]\.\[TBL_MIS_SALES_INTERMEDIARY\]/);
  assert.match(sql, /WHERE COALESCE\(CODED,0\)=0 AND ACTIVE=1 ORDER BY ID/);
  assert.doesNotMatch(sql, /\b(EXEC(?:UTE)?|INSERT|UPDATE|DELETE|MERGE)\b/i);
  for (const mapping of ["REF_NO AS source_ref", "AGENT_CODE AS agent_code",
    "USER_ID AS user_id", "COMMISSION_RATE AS commission_rate", "MOBILE_NO AS mobile_no"]) {
    assert(sql.includes(mapping));
  }
  assert.equal(rows[0].user_id, "0001234567890123456789");
  assert.equal(rows[0].mobile_no, "0700000000");
});

test("repository errors name SELECT access and do not leak SQL diagnostics", async () => {
  const { lib } = fixture({ fail: true });
  await assert.rejects(lib.pullCoreAgents(), e => {
    assert.equal(e.status, 503);
    assert.match(e.message, /SELECT access to DB_MASTER_AGENTS\.dbo\.TBL_MIS_SALES_INTERMEDIARY/);
    assert.match(e.message, /No MIS records were imported/);
    assert.doesNotMatch(e.message, /private SQL diagnostic|MIS_SALES_AGEN_EXTRACT/);
    return true;
  });
});
