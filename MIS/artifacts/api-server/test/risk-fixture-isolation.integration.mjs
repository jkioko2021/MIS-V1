// Development-only regression check. Runs the real workflow fixture script,
// keeps two independent sets, injects failures, and cleans up only its own sets.
// Run: node test/risk-fixture-isolation.integration.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile, stat, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const script = fileURLToPath(new URL("./risk-register.integration.mjs", import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const retained = new Set();

async function run(args = [], preload) {
  const nodeArgs = preload ? ["--import", `data:text/javascript,${encodeURIComponent(preload)}`] : [];
  const child = spawn(process.execPath, [...nodeArgs, script, ...args], {
    env: process.env, stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "", stderr = "";
  child.stdout.on("data", data => { stdout += data; });
  child.stderr.on("data", data => { stderr += data; });
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  const path = stdout.match(/^Risk fixture manifest: (.+)$/m)?.[1];
  if (path) retained.add(path); // Also track failed runs if their cleanup breaks.
  return { code, stdout, stderr, path };
}
async function keep() {
  const result = await run(["--keep"]);
  assert.equal(result.code, 0, result.stderr);
  assert(result.path, "Each run must announce its private manifest.");
  const fixture = JSON.parse(await readFile(result.path, "utf8"));
  assert.equal((await stat(result.path)).mode & 0o777, 0o600);
  return { path: result.path, fixture };
}
async function remove(path) {
  const result = await run(["--cleanup", path]);
  assert.equal(result.code, 0, result.stderr);
  retained.delete(path);
  await assert.rejects(access(path), { code: "ENOENT" });
}
async function checkRows(fixture, present) {
  for (const [sql, selectors, count] of [
    ["SELECT count(*)::int AS n FROM crm.employees WHERE username=ANY($1::text[])", fixture.users, 4],
    ["SELECT count(*)::int AS n FROM risk.departments WHERE depart_code=ANY($1::text[])", fixture.departments, 2],
    ["SELECT count(*)::int AS n FROM risk.risk_master WHERE depart_code=ANY($1::text[])", fixture.departments, 1],
    ["SELECT count(*)::int AS n FROM risk.periods WHERE period_id=ANY($1::int[])", fixture.periods, 1],
    [`SELECT count(*)::int AS n FROM crm.auth_sessions s
      JOIN crm.employees e ON e.employee_id=s.employee_id WHERE e.username=ANY($1::text[])`, fixture.users, 4],
  ]) {
    const { rows: [row] } = await pool.query(sql, [selectors]);
    assert.equal(row.n, present ? count : 0, sql);
  }
  const { rows: [notifications] } = await pool.query(
    "SELECT count(*)::int AS n FROM risk.review_notifications WHERE depart_code=ANY($1::text[])",
    [fixture.departments]);
  if (present) assert(notifications.n > 0, "Submitted fixtures must exercise notification cleanup.");
  else assert.equal(notifications.n, 0, "Cleanup must remove the fixture's review notifications.");
}
async function failKeptRun(endpoint, action) {
  // Capture session/period IDs privately before failing an actual API request,
  // without adding failure switches to the fixture script or application.
  const preload = `
    import {readFile,writeFile} from "node:fs/promises";
    import pg from ${JSON.stringify(import.meta.resolve("pg"))};
    const original=globalThis.fetch;
    globalThis.fetch=async(url,...args)=>{
      if(String(url).endsWith(${JSON.stringify(endpoint)}) &&
        (!${JSON.stringify(action ?? null)} || JSON.parse(args[0]?.body ?? "{}").action===${JSON.stringify(action ?? null)})){
        // The runner's stdout is not accessible here; identify this child by
        // intercepting the manifest announcement instead of scanning /tmp.
        const fixture=JSON.parse(await readFile(manifest,"utf8"));
        const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
        try {
          const {rows}=await pool.query("SELECT s.session_id FROM crm.auth_sessions s JOIN crm.employees e ON e.employee_id=s.employee_id WHERE e.username=ANY($1::text[])",[fixture.users]);
          const {rows:notifications}=await pool.query("SELECT notification_id FROM risk.review_notifications WHERE depart_code=ANY($1::text[])",[fixture.departments]);
          await writeFile(manifest+".failure",JSON.stringify({...fixture,sessions:rows.map(r=>r.session_id),notifications:notifications.map(r=>r.notification_id)}),{mode:0o600,flag:"wx"});
        } finally {await pool.end();}
        throw new Error("Injected risk fixture failure");
      }
      return original(url,...args);
    };
    let manifest;
    const log=console.log;
    console.log=(...args)=>{
      const match=String(args[0]).match(/^Risk fixture manifest: (.+)$/);
      if(match) manifest=match[1];
      log(...args);
    };
  `;
  const result = await run(["--keep"], preload);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /Injected risk fixture failure/);
  assert(result.path);
  const snapshotPath = result.path + ".failure";
  try {
    const fixture = JSON.parse(await readFile(snapshotPath, "utf8"));
    assert.equal(fixture.users.length, 4, "Failure must occur after account creation.");
    assert.equal(fixture.sessions.length, 4);
    if (endpoint !== "/periods") assert.equal(fixture.periods.length, 1);
    if (action === "RETURN") {
      assert(fixture.notifications.length > 0, "Late failure must exercise notification cleanup.");
    }
    await checkRows(fixture, false);
    const { rows: [row] } = await pool.query(
      "SELECT count(*)::int AS n FROM crm.auth_sessions WHERE session_id=ANY($1::uuid[])", [fixture.sessions]);
    assert.equal(row.n, 0, "Failed-run authentication sessions must cascade away.");
    await assert.rejects(access(result.path), { code: "ENOENT" });
    retained.delete(result.path);
  } finally {
    await rm(snapshotPath, { force: true });
  }
}

try {
  const first = await keep();
  const firstManifest = await readFile(first.path, "utf8");
  const second = await keep();
  assert.notEqual(first.path, second.path);
  assert.notEqual(first.fixture.prefix, second.fixture.prefix);
  await checkRows(first.fixture, true);
  await checkRows(second.fixture, true);
  assert.equal(await readFile(first.path, "utf8"), firstManifest);
  const { rows: departments } = await pool.query(
    "SELECT depart_name FROM risk.departments WHERE depart_code=ANY($1::text[])",
    [[...first.fixture.departments, ...second.fixture.departments]]);
  assert.equal(new Set(departments.map(row => row.depart_name)).size, 4);

  // Fail with --keep after accounts/departments and again after a period exists.
  await failKeptRun("/periods");
  await failKeptRun("/assignments");
  await failKeptRun("/workflow", "RETURN");
  await checkRows(first.fixture, true);
  await checkRows(second.fixture, true);
  assert.equal(await readFile(first.path, "utf8"), firstManifest);

  // A tampered selector must be rejected before it can delete the other run.
  const invalidPath = first.path + ".invalid";
  try {
    await writeFile(invalidPath, JSON.stringify({
      ...first.fixture, users: [...first.fixture.users, second.fixture.users[0]],
    }), { mode: 0o600, flag: "wx" });
    assert.notEqual((await run(["--cleanup", invalidPath])).code, 0);
    await checkRows(first.fixture, true);
    await checkRows(second.fixture, true);
  } finally {
    await rm(invalidPath, { force: true });
  }
  await remove(first.path);
  await checkRows(first.fixture, false);
  await checkRows(second.fixture, true);
  await remove(second.path);
  await checkRows(second.fixture, false);

  const ordinary = await run();
  assert.equal(ordinary.code, 0, ordinary.stderr);
  await assert.rejects(access(ordinary.path), { code: "ENOENT" });
  retained.delete(ordinary.path);
  console.log("Risk fixture isolation passed: two retained runs coexist; failed --keep runs remove accounts, sessions, departments, periods and review notifications; scoped cleanup rejects foreign selectors and preserves other runs; ordinary runs self-clean.");
} finally {
  try {
    for (const path of retained) {
      try { await access(path); } catch (error) {
        if (error.code === "ENOENT") continue;
        throw error;
      }
      await remove(path);
    }
  } finally {
    await pool.end();
  }
}
