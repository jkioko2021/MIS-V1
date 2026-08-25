import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.resolve(testDir, "..");
const sourceFile = path.join(artifactDir, "src/lib/refund-ledger.ts");
const doublesFile = path.join(testDir, "doubles/refund-ledger-deps.mjs");

let builtDir;
let getAllocatedRefundLedger;

before(async () => {
  builtDir = await mkdtemp(path.join(tmpdir(), "mis-refund-ledger-tests-"));
  const aliases = new Map([
    ["./sqlserver", doublesFile],
    ["./logger", doublesFile],
  ]);
  await build({
    entryPoints: [sourceFile],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: path.join(builtDir, "refund-ledger.mjs"),
    plugins: [{
      name: "refund-ledger-test-doubles",
      setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /.*/ }, args => {
          const replacement = aliases.get(args.path);
          return replacement ? { path: replacement } : undefined;
        });
      },
    }],
  });
  ({ getAllocatedRefundLedger } = await import(
    `${pathToFileURL(path.join(builtDir, "refund-ledger.mjs")).href}?test`
  ));
});

after(async () => {
  await rm(builtDir, { recursive: true, force: true });
});

function withState(overrides = {}) {
  const state = {
    database: null,
    inputs: [],
    statement: "",
    rows: [],
    error: null,
    ...overrides,
  };
  globalThis.__refundLedgerTestState = state;
  return state;
}

after(() => {
  delete globalThis.__refundLedgerTestState;
});

test("reads the CRM ledger with the exact active allocated filters and owner scope", async () => {
  const state = withState({
    rows: [{
      refund_id: "42",
      refund_no: "REF-42",
      file_no: "R-08/26/-000001",
      amount_paid: "12000.00",
      refund_amount: "3500.50",
      payee_name: "A. Payee",
      payee_email: "payee@example.test",
      payee_mobile: "+254700000000",
      refund_status: "PENDING",
      refund_type: "PREMIUM",
      request_dt: new Date("2026-08-20T00:00:00.000Z"),
      allocate_dt: new Date("2026-08-21T00:00:00.000Z"),
      allocate_to: "bpo-one",
      entered_by: "entry-one",
      client_type: "RET",
    }],
  });

  const result = await getAllocatedRefundLedger("bpo-one", false);

  assert.equal(state.database, "CRM");
  assert.deepEqual(state.inputs.map(input => input.value), ["bpo-one"]);
  assert.match(state.statement, /\[Requested\] = 1/);
  assert.match(state.statement, /\[Allocated\] = 1/);
  assert.match(state.statement, /\[Processed\] = 0/);
  assert.match(state.statement, /\[Is_Active\] = 1/);
  assert.match(state.statement, /AND \[Allocate_To\] = @allocatedTo/);
  assert.doesNotMatch(state.statement, /NOLOCK/);
  assert.equal(result.available, true);
  assert.equal(result.source, "legacy-crm");
  assert.deepEqual(result.records[0], {
    refund_id: 42,
    refund_no: "REF-42",
    file_no: "R-08/26/-000001",
    amount_paid: 12000,
    refund_amount: 3500.5,
    payee_name: "A. Payee",
    payee_email: "payee@example.test",
    payee_mobile: "+254700000000",
    refund_status: "PENDING",
    refund_type: "PREMIUM",
    request_dt: new Date("2026-08-20T00:00:00.000Z").toString(),
    allocate_dt: new Date("2026-08-21T00:00:00.000Z").toString(),
    allocate_to: "bpo-one",
    entered_by: "entry-one",
    client_type: "RET",
  });
});

test("SuperAdmin oversight reads all allocated ledger rows without an owner parameter", async () => {
  const state = withState();

  const result = await getAllocatedRefundLedger("ignored-user", true);

  assert.equal(state.database, "CRM");
  assert.deepEqual(state.inputs, []);
  assert.doesNotMatch(state.statement, /Allocate_To\] = @allocatedTo/);
  assert.equal(result.available, true);
  assert.deepEqual(result.records, []);
});

test("does not invent refund values when the authoritative source is unavailable", async () => {
  const state = withState({ error: new Error("connection refused") });

  const result = await getAllocatedRefundLedger("bpo-one", false);

  assert.equal(result.available, false);
  assert.equal(result.source, "unavailable");
  assert.deepEqual(result.records, []);
  assert.match(result.message, /temporarily unavailable/);
});