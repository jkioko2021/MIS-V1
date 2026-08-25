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
const sourceFile = path.join(artifactDir, "src/routes/business.ts");
const doublesFile = path.join(testDir, "doubles/business-route-deps.mjs");

let builtDir;
let businessRouter;

function normalise(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

class BusinessRouteState {
  constructor() {
    this.file = {
      file_no: "R-08/26/-000001",
      file_status: "REGISTERED",
      is_active: true,
      forwarded: false,
      is_complete: true,
      allocated: false,
      business: "M",
      medical_uw: false,
      invoiced: false,
      benefit_verified: "NO",
      product: null,
      to_pricing_dt: null,
      allocated_to: null,
      allocate_dt: null,
      walk_in_client: "N",
      client_type: "R",
      business_type: "N",
      rate_type: "S",
      receive_dt: "2026-08-19",
    };
    this.staff = new Map([
      ["eligible", { department: "MEMBERSHIP", activated: true, approved: true, locked: false, deleted: false }],
      ["inactive", { department: "MEMBERSHIP", activated: false, approved: true, locked: false, deleted: false }],
      ["wrong-department", { department: "FINANCE", activated: true, approved: true, locked: false, deleted: false }],
    ]);
    this.workItems = [];
    this.notes = [];
    this.audits = [];
    this.registers = 0;
    this.updates = 0;
    this.allocations = 0;
    this.locks = new Map();
  }

  eligibleStaff(usernames) {
    return usernames
      .filter((username) => {
        const staff = this.staff.get(username);
        return staff
          && ["MEMBERSHIP", "NONMEDICAL"].includes(staff.department)
          && staff.activated
          && staff.approved
          && !staff.locked
          && !staff.deleted;
      })
      .map((username) => ({ username }));
  }

  async acquire(key) {
    const previous = this.locks.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    this.locks.set(key, previous.then(() => current));
    await previous;
    return release;
  }

  async withTransaction(fn) {
    const client = { releases: [] };
    try {
      return await fn(client);
    } finally {
      for (const release of client.releases.reverse()) release();
    }
  }

  async query(sql, params = []) {
    const statement = normalise(sql);
    if (statement.includes("SELECT e.username FROM crm.employees e")) {
      return this.eligibleStaff(params[0]);
    }
    if (statement.includes("UPDATE crm.business_tracking SET allocated=TRUE")) {
      this.allocations += 1;
      this.file.allocated = true;
      this.file.allocated_to = params[0];
      this.file.file_status = "ALLOCATED";
      return [];
    }
    if (statement.includes("UPDATE crm.business_tracking SET proposer_name=")) {
      this.updates += 1;
      return [];
    }
    if (statement.includes("INSERT INTO crm.admin_audit_trail")) {
      this.audits.push({ action_type: params[1], description: params[2] });
      return [];
    }
    throw new Error(`Unhandled non-transactional query: ${statement}`);
  }

  async queryOne(sql, params = []) {
    const statement = normalise(sql);
    if (statement.includes("SELECT e.username FROM crm.employees e")
      && statement.includes("e.department='MEMBERSHIP'")) {
      const staff = this.staff.get(params[0]);
      return staff?.department === "MEMBERSHIP"
        && staff.activated
        && staff.approved
        && !staff.locked
        && !staff.deleted
        ? { username: params[0] }
        : null;
    }
    if (statement.includes("SELECT file_no, client_type, receive_dt FROM crm.business_tracking")) {
      return this.file
        ? { file_no: this.file.file_no, client_type: this.file.client_type, receive_dt: this.file.receive_dt }
        : null;
    }
    if (statement.includes("JOIN crm.profiles p")) {
      return null;
    }
    throw new Error(`Unhandled queryOne: ${statement} (${JSON.stringify(params)})`);
  }

  async txQuery(client, sql, params = []) {
    const statement = normalise(sql);
    if (statement.includes("pg_advisory_xact_lock(hashtext($1))")) {
      client.releases.push(await this.acquire(params[0]));
      return [];
    }
    if (statement.includes("pg_advisory_xact_lock($1)")) {
      client.releases.push(await this.acquire(`registration:${params[0]}`));
      return [];
    }
    if (statement.startsWith("SELECT file_status, forwarded, is_active FROM crm.business_tracking")) {
      return this.file ? [{
        file_status: this.file.file_status,
        forwarded: this.file.forwarded,
        is_active: this.file.is_active,
      }] : [];
    }
    if (statement.startsWith("SELECT file_no, is_active, file_status, client_type, business_type, rate_type, invoiced FROM crm.business_tracking")) {
      return this.file?.is_active ? [{
        file_no: this.file.file_no,
        is_active: this.file.is_active,
        file_status: this.file.file_status,
        client_type: this.file.client_type,
        business_type: this.file.business_type,
        rate_type: this.file.rate_type,
        invoiced: this.file.invoiced,
      }] : [];
    }
    if (statement.startsWith("SELECT file_status, is_complete, allocated, forwarded, business")) {
      return this.file?.is_active ? [{
        file_status: this.file.file_status,
        is_complete: this.file.is_complete,
        allocated: this.file.allocated,
        forwarded: this.file.forwarded,
        business: this.file.business,
        medical_uw: this.file.medical_uw,
        invoiced: this.file.invoiced,
        benefit_verified: this.file.benefit_verified,
        walk_in_client: this.file.walk_in_client,
        client_type: this.file.client_type,
      }] : [];
    }
    if (statement.startsWith("SELECT work_item_id FROM crm.business_work_items")) {
      return this.workItems
        .filter((item) => item.file_no === params[0] && item.work_status === "OPEN")
        .map((item) => ({ work_item_id: item.work_item_id }));
    }
    if (statement.startsWith("SELECT work_item_id, work_status FROM crm.business_work_items")) {
      return this.workItems
        .filter((item) => item.file_no === params[0] && item.queue_name === "BPO_REVIEW")
        .map((item) => ({ work_item_id: item.work_item_id, work_status: item.work_status }));
    }
    if (statement.startsWith("SELECT COUNT(*) AS cnt FROM crm.business_req")) {
      return [{ cnt: "0" }];
    }
    if (statement.includes("UPDATE crm.business_tracking SET is_active=FALSE")) {
      if (!this.file?.is_active || this.file.file_status !== "REGISTERED" || this.file.forwarded) return [];
      this.file.is_active = false;
      return [{ file_no: this.file.file_no }];
    }
    if (statement.includes("UPDATE crm.business_tracking SET") && statement.includes("forwarded=TRUE")) {
      if (!this.file?.is_active || this.file.file_status !== "REGISTERED" || this.file.forwarded) return [];
      this.file.forwarded = true;
      this.file.is_complete = true;
      this.file.file_status = params.find((value) => typeof value === "string" && value !== this.file.file_no)
        ?? "FORWARDED";
      return [{ file_no: this.file.file_no }];
    }
    if (statement.startsWith("INSERT INTO crm.business_work_items")) {
      let workItem = this.workItems.find((item) => item.file_no === params[0] && item.queue_name === "BPO_REVIEW");
      if (!workItem) {
        workItem = {
          work_item_id: this.workItems.length + 1,
          file_no: params[0],
          queue_name: "BPO_REVIEW",
          work_status: "OPEN",
        };
        this.workItems.push(workItem);
      } else {
        workItem.work_status = "OPEN";
      }
      return [{ work_item_id: workItem.work_item_id }];
    }
    if (statement.startsWith("INSERT INTO crm.business_tracking_notes")) {
      this.notes.push({ file_no: params[0], notes: params[2] });
      return [];
    }
    if (statement.startsWith("UPDATE crm.business_tracking SET product=")) {
      this.file.product = params[0];
      this.file.file_status = params[1];
      this.file.forwarded = !params[2];
      this.file.allocated = params[3];
      this.file.allocated_to = params[4];
      this.file.allocate_dt = params[6]
        ? null
        : params[3]
          ? "2026-08-25T00:00:00.000Z"
          : this.file.allocate_dt;
      this.file.benefit_verified = params[6]
        ? "NO"
        : params[5]
          ? "YES"
          : this.file.benefit_verified;
      if (params[6]) this.file.to_pricing_dt = "2026-08-25T00:00:00.000Z";
      this.file.is_complete = params[2] ? false : this.file.is_complete;
      this.file.ready_for_update = params[2] || params[7] ? false : true;
      return [{ to_pricing_dt: this.file.to_pricing_dt }];
    }
    if (statement.startsWith("UPDATE crm.business_work_items SET work_status='COMPLETED'")) {
      const workItem = this.workItems.find((item) => item.work_item_id === params[0]);
      if (workItem) workItem.work_status = "COMPLETED";
      return [];
    }
    if (statement.startsWith("INSERT INTO crm.admin_audit_trail")) {
      const actionType = statement.includes("'BT_DELETE'")
        ? "BT_DELETE"
        : statement.includes("'BT_ROUTE_BPO_REVIEW'")
          ? "BT_ROUTE_BPO_REVIEW"
          : params[1];
      this.audits.push({ action_type: actionType, description: params.at(-1) });
      return [];
    }
    if (statement.startsWith("SELECT file_no FROM crm.business_tracking")) {
      return [];
    }
    if (statement.startsWith("INSERT INTO crm.business_tracking")) {
      this.registers += 1;
      return [];
    }
    if (statement.startsWith("UPDATE crm.business_tracking SET allocated=TRUE")) {
      this.allocations += 1;
      return [];
    }
    throw new Error(`Unhandled transactional query: ${statement}`);
  }
}

async function withServer(state, action) {
  globalThis.__businessRouteTestState = state;
  const app = express();
  app.use(express.json());
  app.use(businessRouter);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const { port } = server.address();
  const request = async (method, pathname, body) => {
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const responseText = await response.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { raw: responseText };
    }
    return { status: response.status, body: responseBody };
  };
  try {
    return await action(request);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    delete globalThis.__businessRouteTestState;
  }
}

function walkInPayload(user) {
  return {
    client_type: "R",
    business_type: "N",
    business: "M",
    proposer_name: "Walk-in client",
    agent_id: "AGENT-1",
    walk_in_client: "Y",
    allocated_to: user,
    walk_in_auth: "eligible",
  };
}

function fileEndpoint(fileNo) {
  return `/business/${encodeURIComponent(fileNo)}`;
}

before(async () => {
  builtDir = await mkdtemp(path.join(tmpdir(), "mis-business-route-tests-"));
  const aliases = new Map([
    ["../lib/postgres", doublesFile],
    ["../lib/auth-middleware", doublesFile],
    ["../lib/business-permissions", doublesFile],
    ["../lib/logger", doublesFile],
  ]);
  await build({
    entryPoints: [sourceFile],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: path.join(builtDir, "business-router.mjs"),
    banner: {
      js: `import { createRequire } from "node:module";
const require = createRequire(import.meta.url);`,
    },
    plugins: [{
      name: "business-route-test-doubles",
      setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /.*/ }, (args) => {
          const replacement = aliases.get(args.path);
          return replacement ? { path: replacement } : undefined;
        });
      },
    }],
  });
  ({ default: businessRouter } = await import(`${pathToFileURL(path.join(builtDir, "business-router.mjs")).href}?test`));
});

after(async () => {
  await rm(builtDir, { recursive: true, force: true });
});

test("concurrent delete and BPO forward commit exactly one valid outcome", async () => {
  const state = new BusinessRouteState();
  const result = await withServer(state, async (request) => Promise.all([
    request("DELETE", fileEndpoint(state.file.file_no)),
    request("POST", `${fileEndpoint(state.file.file_no)}/forward`, { comments: "Ready for BPO review." }),
  ]));

  const committed = result.filter(({ status }) => status === 200);
  assert.equal(committed.length, 1, "only delete or forward may commit");

  if (!state.file.is_active) {
    assert.equal(state.file.forwarded, false);
    assert.equal(state.workItems.length, 0);
    assert.equal(state.notes.length, 0);
    assert.deepEqual(state.audits.map((entry) => entry.action_type), ["BT_DELETE"]);
    assert.equal(result.find(({ status }) => status !== 200)?.status, 404);
  } else {
    assert.equal(state.file.forwarded, true);
    assert.equal(state.workItems.length, 1);
    assert.equal(state.notes.length, 1);
    assert.deepEqual(state.audits.map((entry) => entry.action_type), ["BT_ROUTE_BPO_REVIEW"]);
    assert.equal(result.find(({ status }) => status !== 200)?.status, 409);
  }
});

test("inactive and already-forwarded files cannot create BPO side effects", async () => {
  for (const preset of [
    { name: "inactive", apply: (state) => { state.file.is_active = false; }, expectedStatus: 404 },
    { name: "already forwarded", apply: (state) => { state.file.forwarded = true; state.file.file_status = "FORWARDED"; }, expectedStatus: 409 },
  ]) {
    const state = new BusinessRouteState();
    preset.apply(state);
    const result = await withServer(
      state,
      (request) => request("POST", `${fileEndpoint(state.file.file_no)}/forward`, { comments: "Retry BPO routing." }),
    );
    assert.equal(result.status, preset.expectedStatus, preset.name);
    assert.equal(state.workItems.length, 0, `${preset.name} must not create a work item`);
    assert.equal(state.notes.length, 0, `${preset.name} must not create a note`);
    assert.equal(state.audits.length, 0, `${preset.name} must not create an audit entry`);
  }
});

test("register, update, and allocate reject invalid walk-in staff without side effects", async () => {
  for (const user of ["missing-user", "inactive", "wrong-department"]) {
    const registerState = new BusinessRouteState();
    const register = await withServer(
      registerState,
      (request) => request("POST", "/business/register", walkInPayload(user)),
    );
    assert.equal(register.status, 400, `register must reject ${user}`);
    assert.equal(registerState.registers, 0);
    assert.equal(registerState.audits.length, 0);

    const updateState = new BusinessRouteState();
    const update = await withServer(
      updateState,
      (request) => request("PUT", fileEndpoint(updateState.file.file_no), walkInPayload(user)),
    );
    assert.equal(update.status, 400, `update must reject ${user}`);
    assert.equal(updateState.updates, 0);
    assert.equal(updateState.audits.length, 0);

    const allocateState = new BusinessRouteState();
    const allocate = await withServer(
      allocateState,
      (request) => request("POST", `${fileEndpoint(allocateState.file.file_no)}/allocate`, { allocated_to: user }),
    );
    assert.equal(allocate.status, 400, `allocate must reject ${user}`);
    assert.equal(allocateState.allocations, 0);
  }
});

function openBpoReviewWorkItem(state, queueName) {
  state.file.file_status = "FORWARDED";
  state.file.forwarded = true;
  state.workItems.push({
    work_item_id: 1,
    file_no: state.file.file_no,
    queue_name: queueName,
    work_status: "OPEN",
  });
}

test("an invoiced Retail allocation persists product and verifies benefits without changing its status", async () => {
  const state = new BusinessRouteState();
  state.file.invoiced = true;
  openBpoReviewWorkItem(state, "BPO_REVIEW_RETAIL");
  state.file.file_status = "INVOICED";

  const result = await withServer(
    state,
    (request) => request("POST", `${fileEndpoint(state.file.file_no)}/review-action`, {
      action: "A",
      product: "S",
      allocated_to: "eligible",
      comments: "Invoiced membership allocation.",
      queue_name: "BPO_REVIEW_RETAIL",
    }),
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data, {
    file_status: "INVOICED",
    work_item_id: 1,
    queue_name: "BPO_REVIEW_RETAIL",
    allocation_route: "STANDARD_ALLOCATION",
    pricing_handoff_at: null,
  });
  assert.equal(state.file.product, "S");
  assert.equal(state.file.file_status, "INVOICED");
  assert.equal(state.file.benefit_verified, "YES");
  assert.equal(state.file.allocated, true);
  assert.equal(state.file.allocated_to, "eligible");
  assert.equal(state.workItems[0].work_status, "COMPLETED");
  assert.match(state.audits.at(-1).description, /Shwaari, INVOICED.*Route: STANDARD_ALLOCATION/);
});

test("Custom-rate Corporate New and Renewal allocations hand off to Pricing", async () => {
  for (const businessType of ["N", "R"]) {
    const state = new BusinessRouteState();
    state.file.client_type = "C";
    state.file.business_type = businessType;
    state.file.rate_type = "C";
    openBpoReviewWorkItem(state, "BPO_REVIEW_CORPORATE_SME");
    state.file.benefit_verified = "YES";
    state.file.allocate_dt = "2026-08-24T00:00:00.000Z";

    const result = await withServer(
      state,
      (request) => request("POST", `${fileEndpoint(state.file.file_no)}/review-action`, {
        action: "A",
        product: "AS",
        allocated_to: "eligible",
        comments: `Custom-rate ${businessType === "N" ? "new" : "renewal"} allocation.`,
        queue_name: "BPO_REVIEW_CORPORATE_SME",
      }),
    );

    assert.equal(result.status, 200, businessType);
    assert.equal(result.body.data.file_status, "BENEFIT VERIFICATION");
    assert.equal(result.body.data.allocation_route, "PRICING_HANDOFF");
    assert.ok(result.body.data.pricing_handoff_at);
    assert.equal(state.file.product, "AS");
    assert.equal(state.file.allocated, true);
    assert.equal(state.file.allocated_to, "eligible");
    assert.equal(state.file.benefit_verified, "NO");
    assert.equal(state.file.allocate_dt, null);
    assert.ok(state.file.to_pricing_dt);
    assert.equal(state.workItems[0].work_status, "COMPLETED");
    assert.match(state.audits.at(-1).description, /Afya Shwaari, BENEFIT VERIFICATION.*Route: PRICING_HANDOFF/);
  }
});

test("SME Custom-rate allocations and queue mismatches keep existing BPO behavior isolated", async () => {
  const smeState = new BusinessRouteState();
  smeState.file.client_type = "S";
  smeState.file.business_type = "N";
  smeState.file.rate_type = "C";
  openBpoReviewWorkItem(smeState, "BPO_REVIEW_CORPORATE_SME");

  const smeResult = await withServer(
    smeState,
    (request) => request("POST", `${fileEndpoint(smeState.file.file_no)}/review-action`, {
      action: "A",
      product: "T",
      allocated_to: "eligible",
      comments: "SME allocation remains standard.",
      queue_name: "BPO_REVIEW_CORPORATE_SME",
    }),
  );
  assert.equal(smeResult.status, 200);
  assert.equal(smeResult.body.data.file_status, "ALLOCATED");
  assert.equal(smeResult.body.data.allocation_route, "STANDARD_ALLOCATION");
  assert.equal(smeState.file.to_pricing_dt, null);

  const retailState = new BusinessRouteState();
  openBpoReviewWorkItem(retailState, "BPO_REVIEW_RETAIL");
  const mismatchResult = await withServer(
    retailState,
    (request) => request("POST", `${fileEndpoint(retailState.file.file_no)}/review-action`, {
      action: "A",
      product: "T",
      allocated_to: "eligible",
      comments: "Wrong queue must be rejected.",
      queue_name: "BPO_REVIEW_CORPORATE_SME",
    }),
  );
  assert.equal(mismatchResult.status, 409);
  assert.equal(retailState.file.product, null);
  assert.equal(retailState.workItems[0].work_status, "OPEN");
});