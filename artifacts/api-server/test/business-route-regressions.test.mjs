import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import { build } from "esbuild";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.resolve(testDir, "..");
const sourceFile = path.join(artifactDir, "src/routes/business.ts");
const doublesFile = path.join(testDir, "doubles/business-route-deps.mjs");
const queueMigrationFile = path.resolve(artifactDir, "../../lib/db/migrations/0005_split_bpo_review_queues.sql");

let builtDir;
let businessRouter;

function normalise(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

class BusinessRouteState {
  constructor({ clientType = "R", fileStatus = "REGISTERED", forwarded = false } = {}) {
    this.file = {
      file_no: `${clientType}-08/26/-000001`,
      file_status: fileStatus,
      is_active: true,
      forwarded,
      is_complete: !forwarded,
      allocated: false,
      business: "M",
      medical_uw: false,
      invoiced: false,
      benefit_verified: "NO",
      product: null,
      to_pricing_dt: null,
      invoice_no: null,
      paid_status: null,
      paid: false,
      allocated_to: null,
      allocate_dt: null,
      walk_in_client: "N",
      client_type: clientType,
      business_type: "N",
      rate_type: "S",
      receive_dt: "2026-08-19",
    };
    this.staff = new Map([
      ["eligible", { department: "BPO", activated: true, approved: true, locked: false, deleted: false }],
      ["walk-in-eligible", { department: "MEMBERSHIP", activated: true, approved: true, locked: false, deleted: false }],
      ["cashier-eligible", { department: "FINANCE", activated: true, approved: true, locked: false, deleted: false }],
      ["medical-eligible", { department: "MEDICAL UNDERWRITING", activated: true, approved: true, locked: false, deleted: false }],
      ["it-eligible", { department: "IT", activated: true, approved: true, locked: false, deleted: false }],
      ["retention-eligible", { department: "RETENTION", activated: true, approved: true, locked: false, deleted: false }],
      ["inactive", { department: "BPO", activated: false, approved: true, locked: false, deleted: false }],
      ["wrong-department", { department: "FINANCE", activated: true, approved: true, locked: false, deleted: false }],
    ]);
    this.workItems = [];
    this.notes = [];
    this.audits = [];
    this.registers = 0;
    this.updates = 0;
    this.allocations = 0;
    this.locks = new Map();
    this.selectedDocumentCount = 1;
    this.missingUploadCount = 0;
    this.amlReportUploaded = true;
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
    const snapshot = {
      file: structuredClone(this.file),
      workItems: structuredClone(this.workItems),
      notes: structuredClone(this.notes),
      audits: structuredClone(this.audits),
    };
    try {
      return await fn(client);
    } catch (error) {
      this.file = snapshot.file;
      this.workItems = snapshot.workItems;
      this.notes = snapshot.notes;
      this.audits = snapshot.audits;
      throw error;
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
      && statement.includes("e.department='BPO'")) {
      const staff = this.staff.get(params[0]);
        return staff?.department === "BPO"
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
    if (statement.includes("department='BPO'")) {
      return this.staff.get(params[0])?.department === "BPO"
        && this.staff.get(params[0])?.activated
        && this.staff.get(params[0])?.approved
        && !this.staff.get(params[0])?.locked
        && !this.staff.get(params[0])?.deleted
        ? { username: params[0] }
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
    if (statement.includes("SELECT e.username FROM crm.employees e")
      && statement.includes("e.department = ANY($2::text[])")
      && statement.includes("FOR UPDATE")) {
      const staff = this.staff.get(params[0]);
      return staff && params[1].includes(staff.department) && staff.activated && staff.approved && !staff.locked && !staff.deleted
        ? [{ username: params[0] }]
        : [];
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
    if (statement.startsWith("SELECT file_no, is_active, file_status, allocated, allocated_to, benefit_verified, business_type")) {
      return this.file?.is_active ? [{
        file_no: this.file.file_no,
        is_active: this.file.is_active,
        file_status: this.file.file_status,
        allocated: this.file.allocated,
        allocated_to: this.file.allocated_to,
        benefit_verified: this.file.benefit_verified,
        business_type: this.file.business_type,
        entered_by: "business-entry",
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
    if (statement.startsWith("SELECT file_no, is_active, client_type FROM crm.business_tracking")) {
      return this.file?.is_active ? [{
        file_no: this.file.file_no,
        is_active: this.file.is_active,
        client_type: this.file.client_type,
      }] : [];
    }
    if (statement.startsWith("SELECT work_item_id FROM crm.business_work_items") && statement.includes("queue_name=$2")) {
      return this.workItems
        .filter((item) => item.file_no === params[0]
          && item.queue_name === params[1]
          && item.work_status === "OPEN")
        .map((item) => ({ work_item_id: item.work_item_id }));
    }
    if (statement.startsWith("SELECT work_item_id FROM crm.business_work_items")) {
      return this.workItems
        .filter((item) => item.file_no === params[0] && item.work_status === "OPEN")
        .map((item) => ({ work_item_id: item.work_item_id }));
    }
    if (statement.startsWith("SELECT work_item_id, work_status FROM crm.business_work_items")) {
      return this.workItems
        .filter((item) => item.file_no === params[0] && item.queue_name === params[1])
        .map((item) => ({ work_item_id: item.work_item_id, work_status: item.work_status }));
    }
    if (statement.startsWith("SELECT COUNT(*)") && statement.includes("business_doc_checklist")) {
      return [{
        selected_count: String(this.selectedDocumentCount),
        missing_upload_count: String(this.missingUploadCount),
      }];
    }
    if (statement.startsWith("SELECT COUNT(*) AS cnt FROM crm.business_req")) {
      return [{ cnt: "0" }];
    }
    if (statement.startsWith("SELECT EXISTS ( SELECT 1 FROM crm.business_uploads bu JOIN crm.business_req br")) {
      return [{ uploaded: this.amlReportUploaded }];
    }
    if (statement.includes("UPDATE crm.business_tracking SET is_active=FALSE")) {
      if (!this.file?.is_active || this.file.file_status !== "REGISTERED" || this.file.forwarded) return [];
      this.file.is_active = false;
      return [{ file_no: this.file.file_no }];
    }
    if (statement.includes("UPDATE crm.business_tracking SET") && statement.includes("forwarded=TRUE")) {
      if (!this.file?.is_active
        || !["REGISTERED", "RETURNED-INCOMPLETE"].includes(this.file.file_status)
        || this.file.forwarded) return [];
      this.file.forwarded = true;
      this.file.is_complete = true;
      this.file.file_status = statement.includes("allocated_to=$1") ? params[1] : params[0];
      return [{ file_no: this.file.file_no }];
    }
    if (statement.startsWith("SELECT file_status FROM crm.business_tracking")) {
      return this.file ? [{ file_status: this.file.file_status }] : [];
    }
    if (statement.startsWith("INSERT INTO crm.business_work_items") && statement.includes("'MEDICAL_UNDERWRITING'")) {
      let workItem = this.workItems.find(item => item.file_no === params[0] && item.queue_name === "MEDICAL_UNDERWRITING");
      if (!workItem) {
        workItem = { work_item_id: this.workItems.length + 100, file_no: params[0], queue_name: "MEDICAL_UNDERWRITING" };
        this.workItems.push(workItem);
      }
      Object.assign(workItem, { work_status: "OPEN", assigned_to: null, assigned_by: params[1], forwarded_by: params[1] });
      return [];
    }
    if (statement.startsWith("INSERT INTO crm.business_work_items")) {
      const workStatus = /VALUES\s*\(\$1,\s*\$2,\s*'OPEN'/.test(statement) ? "OPEN" : params[2];
      let workItem = this.workItems.find((item) => item.file_no === params[0] && item.queue_name === params[1]);
      if (!workItem) {
        workItem = {
          work_item_id: this.workItems.length + 1,
          file_no: params[0],
          queue_name: params[1],
          work_status: workStatus,
        };
        this.workItems.push(workItem);
      } else {
        workItem.work_status = workStatus;
      }
      return [{ work_item_id: workItem.work_item_id }];
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
        : params[5] || (params[3] && ["C", "S"].includes(this.file.client_type) && this.file.rate_type !== "C")
          ? "YES"
          : this.file.benefit_verified;
      if (params[6]) this.file.to_pricing_dt = "2026-08-25T00:00:00.000Z";
      this.file.is_complete = params[2] ? false : this.file.is_complete;
      this.file.ready_for_update = params[2] || params[7] || params[9] ? false : true;
      if (params[9]) this.file.medical_uw = true;
      return [{ to_pricing_dt: this.file.to_pricing_dt }];
    }
    if (statement.startsWith("UPDATE crm.business_tracking SET file_status=$1,") && statement.includes("invoice_no=CASE WHEN")) {
      const [newStatus, returnIncomplete, storesInvoice, invoiceNo, storesPayment, paidStatus, paid] = params;
      this.file.file_status = newStatus;
      this.file.forwarded = returnIncomplete ? false : this.file.forwarded;
      this.file.allocated = false;
      this.file.allocated_to = null;
      this.file.allocate_dt = null;
      this.file.is_complete = returnIncomplete ? false : this.file.is_complete;
      this.file.ready_for_update = returnIncomplete ? false : true;
      if (storesInvoice) {
        this.file.invoice_no = invoiceNo;
      }
      if (storesPayment) {
        this.file.paid_status = paidStatus;
        this.file.paid = paid;
      }
      return [{ file_status: this.file.file_status }];
    }
    if (statement.startsWith("UPDATE crm.business_tracking") && statement.includes("forwarded=CASE WHEN")) {
      const [newStatus, returnIncomplete, allocated, allocatedTo, hold] = params;
      this.file.file_status = newStatus;
      this.file.forwarded = !returnIncomplete;
      this.file.allocated = allocated;
      this.file.allocated_to = allocated ? allocatedTo : null;
      this.file.is_complete = !returnIncomplete;
      this.file.ready_for_update = !returnIncomplete && !hold;
      return [];
    }
    if (statement.startsWith("UPDATE crm.business_work_items SET work_status='COMPLETED'") && statement.includes("WHERE file_no=$1")) {
      for (const workItem of this.workItems) {
        if (workItem.file_no === params[0] && workItem.work_status === "OPEN" && workItem.queue_name !== params[1]) workItem.work_status = "COMPLETED";
      }
      return [];
    }
    if (statement.startsWith("UPDATE crm.business_work_items")) {
      const workItem = this.workItems.find((item) => item.work_item_id === params[0]);
      if (workItem) workItem.work_status = "COMPLETED";
      return [];
    }
    if (statement.startsWith("INSERT INTO crm.business_tracking_notes")) {
      this.notes.push({ file_no: params[0], notes: params[2] });
      return [];
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
    walk_in_auth: "walk-in-eligible",
  };
}

function fileEndpoint(fileNo) {
  return `/business/${encodeURIComponent(fileNo)}`;
}

function bpoQueue(clientType) {
  return clientType === "R" ? "BPO_REVIEW_RETAIL" : "BPO_REVIEW_CORPORATE_SME";
}

function seedOpenWorkItem(state, workItemId = 1) {
  state.workItems.push({
    work_item_id: workItemId,
    file_no: state.file.file_no,
    queue_name: bpoQueue(state.file.client_type),
    work_status: "OPEN",
  });
}

function reviewPayload(queueName, action, product = "T") {
  return {
    action,
    product,
    comments: `${action} decision recorded`,
    queue_name: queueName,
  };
}

before(async () => {
  builtDir = await mkdtemp(path.join(tmpdir(), "mis-business-route-tests-"));
  const aliases = new Map([
    ["../lib/postgres", doublesFile],
    ["./postgres", doublesFile],
    ["./logger", doublesFile],
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

test("migration maps legacy BPO work items from the authoritative client type", async () => {
  const migration = await readFile(queueMigrationFile, "utf8");
  const compact = normalise(migration);

  assert.match(compact, /UPDATE crm\.business_work_items wi SET queue_name = CASE/);
  assert.match(compact, /WHEN bt\.client_type = 'R' THEN 'BPO_REVIEW_RETAIL'/);
  assert.match(compact, /WHEN bt\.client_type IN \('S', 'C'\) THEN 'BPO_REVIEW_CORPORATE_SME'/);
  assert.match(compact, /FROM crm\.business_tracking bt WHERE bt\.file_no = wi\.file_no/);
  assert.match(compact, /wi\.queue_name IN \(\s*'BPO_REVIEW', 'BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME'\s*\)/);
  assert.match(compact, /CHECK \(queue_name IN \('BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME'\)\)/);
});

test("forwarding creates the client-type-specific BPO queue and transitions the file", async () => {
  for (const [clientType, expectedQueue] of [
    ["R", "BPO_REVIEW_RETAIL"],
    ["S", "BPO_REVIEW_CORPORATE_SME"],
    ["C", "BPO_REVIEW_CORPORATE_SME"],
  ]) {
    const state = new BusinessRouteState({ clientType });
    const result = await withServer(
      state,
      (request) => request("POST", `${fileEndpoint(state.file.file_no)}/forward`, {
        comments: "Ready for BPO review.",
      }),
    );

    assert.equal(result.status, 200, clientType);
    assert.equal(result.body.data.queue_name, expectedQueue);
    assert.equal(state.file.file_status, "FORWARDED");
    assert.equal(state.file.forwarded, true);
    assert.deepEqual(state.workItems, [{
      work_item_id: 1,
      file_no: state.file.file_no,
      queue_name: expectedQueue,
      work_status: "OPEN",
    }]);
    assert.equal(state.notes.length, 1);
    assert.match(state.notes[0].notes, new RegExp(expectedQueue));
  }
});

test("a corporate file cannot be reviewed through the Retail queue", async () => {
  const state = new BusinessRouteState({ clientType: "C", fileStatus: "FORWARDED", forwarded: true });
  seedOpenWorkItem(state, 42);
  const before = structuredClone(state.file);

  const result = await withServer(
    state,
    (request) => request(
      "POST",
      `${fileEndpoint(state.file.file_no)}/review-action`,
      reviewPayload("BPO_REVIEW_RETAIL", "CA"),
    ),
  );

  assert.equal(result.status, 409);
  assert.equal(result.body.error, "The supplied BPO queue does not match this file.");
  assert.deepEqual(state.file, before);
  assert.equal(state.workItems[0].work_status, "OPEN");
  assert.equal(state.notes.length, 0);
  assert.equal(state.audits.length, 0);
});

test("BPO Medical UW decisions open one shared medical work item for Retail, Corporate and SME", async () => {
  for (const clientType of ["R", "C", "S"]) {
    const state = new BusinessRouteState({ clientType, fileStatus: "FORWARDED", forwarded: true });
    seedOpenWorkItem(state, 42);
    state.notes.push({ note_id: 99, notes: "Original registration note" });
    state.workItems.push({
      work_item_id: 43, file_no: state.file.file_no, queue_name: "MEDICAL_UNDERWRITING",
      work_status: "COMPLETED", assigned_to: "old-reviewer",
    });
    const result = await withServer(state, request => request("POST", `${fileEndpoint(state.file.file_no)}/review-action`, {
      action: "MU", product: "T", comments: "Medical review needed",
      queue_name: clientType === "R" ? "BPO_REVIEW_RETAIL" : "BPO_REVIEW_CORPORATE_SME",
    }));
    assert.equal(result.status, 200);
    assert.equal(state.file.file_status, "MEDICAL UW-REVIEW");
    assert.equal(state.file.medical_uw, true);
    assert.equal(state.file.ready_for_update, false);
    assert.equal(state.workItems.find(item => item.work_item_id === 42).work_status, "COMPLETED");
    const medical = state.workItems.filter(item => item.queue_name === "MEDICAL_UNDERWRITING");
    assert.equal(medical.length, 1);
    assert.equal(medical[0].work_status, "OPEN");
    assert.equal(medical[0].assigned_to, null);
    assert.equal(state.notes.length, 2);
    assert.equal(state.notes[0].notes, "Original registration note");
    assert.equal(state.audits.length, 1);
  }
});

test("saved tracking notes cannot be deleted or hidden through the API", async () => {
  const state = new BusinessRouteState({ clientType: "R" });
  state.notes.push({ note_id: 99, notes: "Permanent tracking history", is_active: true });
  const before = structuredClone(state.notes);
  const result = await withServer(state, request =>
    request("DELETE", `${fileEndpoint(state.file.file_no)}/notes/99`));
  assert.equal(result.status, 405);
  assert.equal(result.body.ok, false);
  assert.match(result.body.error, /cannot be deleted/);
  assert.deepEqual(state.notes, before);
});

test("Retail Hold completes the Retail work item with the matching file status", async () => {
  const state = new BusinessRouteState({ clientType: "R", fileStatus: "FORWARDED", forwarded: true });
  seedOpenWorkItem(state, 7);

  const result = await withServer(
    state,
    (request) => request(
      "POST",
      `${fileEndpoint(state.file.file_no)}/review-action`,
      reviewPayload("BPO_REVIEW_RETAIL", "HO"),
    ),
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.data.file_status, "ON HOLD");
  assert.equal(result.body.data.queue_name, "BPO_REVIEW_RETAIL");
  assert.equal(state.file.file_status, "ON HOLD");
  assert.equal(state.file.forwarded, true);
  assert.equal(state.file.ready_for_update, false);
  assert.equal(state.workItems[0].work_status, "COMPLETED");
  assert.equal(state.notes.length, 1);
  assert.equal(state.audits[0].action_type, "BT_BPO_HO");
});

test("Corporate/SME Cashier completes the Corporate/SME work item with CASHIER status", async () => {
  const state = new BusinessRouteState({ clientType: "S", fileStatus: "FORWARDED", forwarded: true });
  seedOpenWorkItem(state, 8);

  const result = await withServer(
    state,
    (request) => request(
      "POST",
      `${fileEndpoint(state.file.file_no)}/review-action`,
      reviewPayload("BPO_REVIEW_CORPORATE_SME", "CA", "AS"),
    ),
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.data.file_status, "CASHIER");
  assert.equal(result.body.data.queue_name, "BPO_REVIEW_CORPORATE_SME");
  assert.equal(state.file.file_status, "CASHIER");
  assert.equal(state.file.forwarded, true);
  assert.equal(state.workItems[0].work_status, "COMPLETED");
  assert.equal(state.notes.length, 1);
  assert.equal(state.audits[0].action_type, "BT_BPO_CA");
});

test("Return-Incomplete closes the old work item and allows the same file to be re-forwarded", async () => {
  const state = new BusinessRouteState({ clientType: "C", fileStatus: "FORWARDED", forwarded: true });
  seedOpenWorkItem(state, 9);
  const queueName = "BPO_REVIEW_CORPORATE_SME";

  const returned = await withServer(
    state,
    (request) => request(
      "POST",
      `${fileEndpoint(state.file.file_no)}/review-action`,
      reviewPayload(queueName, "RI"),
    ),
  );

  assert.equal(returned.status, 200);
  assert.equal(state.file.file_status, "RETURNED-INCOMPLETE");
  assert.equal(state.file.forwarded, false);
  assert.equal(state.file.is_complete, false);
  assert.equal(state.workItems[0].work_status, "COMPLETED");

  const forwarded = await withServer(
    state,
    (request) => request("POST", `${fileEndpoint(state.file.file_no)}/forward`, {
      comments: "Corrections received; return to BPO.",
    }),
  );

  assert.equal(forwarded.status, 200);
  assert.equal(forwarded.body.data.queue_name, queueName);
  assert.equal(state.file.file_status, "FORWARDED");
  assert.equal(state.file.forwarded, true);
  assert.equal(state.file.is_complete, true);
  assert.equal(state.workItems.length, 1, "re-forward must reopen the original work item");
  assert.equal(state.workItems[0].work_item_id, 9);
  assert.equal(state.workItems[0].queue_name, queueName);
  assert.equal(state.workItems[0].work_status, "OPEN");
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

test("only Custom-rate Corporate and SME allocations hand off to Pricing across business types", async () => {
  for (const clientType of ["C", "S"]) for (const rateType of ["C", "S"]) for (const businessType of ["N", "R", "E"]) {
    const state = new BusinessRouteState();
    state.file.client_type = clientType;
    state.file.business_type = businessType;
    state.file.rate_type = rateType;
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
    if (rateType === "S") {
      assert.equal(result.body.data.file_status, "ALLOCATED");
      assert.equal(result.body.data.allocation_route, "STANDARD_ALLOCATION");
      assert.equal(result.body.data.pricing_handoff_at, null);
      assert.equal(state.file.benefit_verified, "YES");
      assert.equal(state.file.allocated_to, "eligible");
      assert(!state.workItems.some(item => item.queue_name === "PRICING_REVIEW"));
      continue;
    }
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
    assert.equal(state.workItems.find(item => item.queue_name === "PRICING_REVIEW")?.work_status, "OPEN");
    assert.match(state.audits.at(-1).description, /Afya Shwaari, BENEFIT VERIFICATION.*Route: PRICING_HANDOFF/);
  }
});

test("SME allocations enter Pricing while queue mismatches remain isolated", async () => {
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
  assert.equal(smeResult.body.data.file_status, "BENEFIT VERIFICATION");
  assert.equal(smeResult.body.data.allocation_route, "PRICING_HANDOFF");
  assert(smeState.file.to_pricing_dt);

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

test("allocated-file Cashier handoff persists payment context and releases the allocation", async () => {
  const state = new BusinessRouteState({ fileStatus: "ALLOCATED", forwarded: true });
  state.file.allocated = true;
  state.file.allocated_to = "business-entry";
  state.file.allocate_dt = "2026-08-25T00:00:00.000Z";
  state.file.benefit_verified = "YES";

  const invalid = await withServer(
    state,
    (request) => request("POST", `${fileEndpoint(state.file.file_no)}/allocation-action`, {
      action: "C",
      comments: "Ready for cashier.",
      invoice_no: "too-short",
      paid_status: "FULL-PAID",
    }),
  );
  assert.equal(invalid.status, 400);
  assert.equal(state.file.file_status, "ALLOCATED");
  assert.equal(state.file.allocated, true);
  assert.equal(state.notes.length, 0);

  const result = await withServer(
    state,
    (request) => request("POST", `${fileEndpoint(state.file.file_no)}/allocation-action`, {
      action: "C",
      comments: "Invoice attached and payment confirmed.",
      invoice_no: "INV-20260825-00000001",
      paid_status: "FULL-PAID",
      assigned_to: "cashier-eligible",
    }),
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.data.file_status, "CASHIER");
  assert.equal(state.file.file_status, "CASHIER");
  assert.equal(state.file.allocated, false);
  assert.equal(state.file.allocated_to, null);
  assert.equal(state.file.allocate_dt, null);
  assert.equal(state.file.invoice_no, "INV-20260825-00000001");
  assert.equal(state.file.paid_status, "FULL-PAID");
  assert.equal(state.file.paid, true);
  assert.match(state.notes.at(-1).notes, /Allocation → CASHIER.*cashier-eligible.*FULL-PAID/);
  assert.equal(state.audits.at(-1).action_type, "BT_ALLOCATED_C");
});

test("allocated-file Cashier handoff rejects new or renewal files without an AML report", async () => {
  const state = new BusinessRouteState({ fileStatus: "ALLOCATED", forwarded: true });
  state.file.allocated = true;
  state.file.allocated_to = "business-entry";
  state.file.benefit_verified = "YES";
  state.amlReportUploaded = false;

  const result = await withServer(
    state,
    (request) => request("POST", `${fileEndpoint(state.file.file_no)}/allocation-action`, {
      action: "C",
      comments: "Ready for cashier.",
      invoice_no: "INV-20260825-00000001",
      paid_status: "FULL-PAID",
    }),
  );

  assert.equal(result.status, 409);
  assert.match(result.body.error, /AML Report/);
  assert.equal(state.file.file_status, "ALLOCATED");
  assert.equal(state.file.allocated, true);
  assert.equal(state.notes.length, 0);
  assert.equal(state.audits.length, 0);
});

test("allocated-file actions require completed benefit verification", async () => {
  const state = new BusinessRouteState({ fileStatus: "ALLOCATED", forwarded: true });
  state.file.allocated = true;
  state.file.allocated_to = "business-entry";
  state.file.benefit_verified = "NO";

  const result = await withServer(
    state,
    (request) => request("POST", `${fileEndpoint(state.file.file_no)}/allocation-action`, {
      action: "RI",
      comments: "Missing information.",
    }),
  );

  assert.equal(result.status, 409);
  assert.equal(state.file.file_status, "ALLOCATED");
  assert.equal(state.file.allocated, true);
  assert.equal(state.notes.length, 0);
  assert.equal(state.audits.length, 0);
});