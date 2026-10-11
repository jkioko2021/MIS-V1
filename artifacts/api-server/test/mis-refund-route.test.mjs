import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import { build } from "esbuild";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.resolve(testDir, "..");
const sourceFile = path.join(artifactDir, "src/routes/mis.ts");
const doublesFile = path.join(testDir, "doubles/mis-refund-route-deps.mjs");

let builtDir;
let misRouter;

before(async () => {
  builtDir = await mkdtemp(path.join(tmpdir(), "mis-refund-route-tests-"));
  const aliases = new Map([
    ["../lib/postgres", doublesFile],
    ["../lib/auth-middleware", doublesFile],
    ["../lib/business-permissions", doublesFile],
    ["../lib/logger", doublesFile],
    ["../lib/refund-ledger", doublesFile],
  ]);
  await build({
    entryPoints: [sourceFile],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: path.join(builtDir, "mis-router.mjs"),
    banner: { js: `import { createRequire } from "node:module"; const require = createRequire(import.meta.url);` },
    plugins: [{
      name: "mis-refund-route-doubles",
      setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /.*/ }, args => {
          const replacement = aliases.get(args.path);
          return replacement ? { path: replacement } : undefined;
        });
      },
    }],
  });
  ({ default: misRouter } = await import(`${pathToFileURL(path.join(builtDir, "mis-router.mjs")).href}?test`));
});

after(async () => {
  await rm(builtDir, { recursive: true, force: true });
});

function state(overrides = {}) {
  return {
    user: { username: "bpo-one", profileId: 2, sub: 10 },
    ledger: {
      available: true,
      records: [{
        refund_id: 1,
        refund_no: "REF-1",
        file_no: "FILE-1",
        amount_paid: 1500,
        refund_amount: 500,
        payee_name: "Payee One",
        payee_email: "payee@example.test",
        payee_mobile: "+254700000000",
        refund_status: "REQUESTED",
        refund_type: "PREMIUM",
        request_dt: "2026-08-20",
        allocate_dt: "2026-08-21",
        allocate_to: "bpo-one",
        entered_by: "entry-one",
        client_type: "R",
      }],
    },
    ledgerCalls: [],
    queries: [],
    ...overrides,
  };
}

async function requestWith(testState, pathname) {
  globalThis.__misRefundRouteTestState = testState;
  const app = express();
  app.use(misRouter);
  const server = await new Promise(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${pathname}`);
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    delete globalThis.__misRefundRouteTestState;
  }
}

test("refund summary denies callers without membership allocation permission", async () => {
  const testState = state({ canAccessMembershipAllocated: false });
  const response = await requestWith(testState, "/mis/business/allocated/refunds-summary");

  assert.equal(response.status, 403);
  assert.deepEqual(testState.ledgerCalls, []);
});

test("refund summary scopes a BPO administrator to their CRM ledger owner", async () => {
  const testState = state();
  const response = await requestWith(testState, "/mis/business/allocated/refunds-summary");

  assert.equal(response.status, 200);
  assert.deepEqual(testState.ledgerCalls, [{ allocatedTo: "bpo-one", isSuperAdmin: false }]);
  assert.equal(response.body.data.total_refund_amount, 500);
  assert.equal(response.body.data.records[0].payee_name, "Payee One");
});

test("refund summary gives SuperAdmin oversight without an owner restriction", async () => {
  const testState = state({ user: { username: "root", profileId: 1, sub: 1 } });
  const response = await requestWith(testState, "/mis/business/allocated/refunds-summary");

  assert.equal(response.status, 200);
  assert.deepEqual(testState.ledgerCalls, [{ allocatedTo: "root", isSuperAdmin: true }]);
});

test("refund summary hides records and amounts when CRM is unavailable", async () => {
  const testState = state({
    ledger: { available: false, records: [], message: "The authoritative refund ledger is temporarily unavailable." },
  });
  const response = await requestWith(testState, "/mis/business/allocated/refunds-summary");

  assert.equal(response.status, 200);
  assert.equal(response.body.data.available, false);
  assert.deepEqual(response.body.data.records, []);
  assert.equal(response.body.data.total_refund_amount, null);
});

test("Allocation Files keeps active allocated-file visibility predicates", async () => {
  const testState = state();
  const response = await requestWith(testState, "/mis/business/allocated");

  assert.equal(response.status, 200);
  const statements = testState.queries.map(entry => entry.statement).join("\n");
  assert.match(statements, /bt\.is_active = TRUE/);
  assert.match(statements, /bt\.allocated = TRUE/);
  assert.match(statements, /bt\.file_status = 'ALLOCATED'/);
  assert.match(statements, /bt\.allocated_to = \$1/);
});