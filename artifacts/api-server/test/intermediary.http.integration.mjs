// Exercises real HTTP/auth and SQL, using only synthetic users/agent; never calls a live core import.
import pg from "pg";
import bcrypt from "bcrypt";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const prefix = `agent_http_${randomUUID().slice(0, 8)}`;
const code = `QA_${randomUUID().slice(0, 8)}`;
const password = `${randomUUID()}Aa9!`;
const ids = [];
const api = async (path, cookie, method = "GET", body) => {
  const response = await fetch(`http://localhost:80/api${path}`, {
    method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  return { response, data };
};
try {
  await db.connect();
  const role = (await db.query("SELECT profile_id FROM crm.profiles WHERE profile_name='National Sales Admin'")).rows[0].profile_id;
  const cookies = [];
  for (const [index, profile] of [role, 3].entries()) {
    const name = `${prefix}_${index}`;
    const r = await db.query(`INSERT INTO crm.employees(username,employee_name,password_hash,profile_id,
      activated,approved,last_password_reset) VALUES($1,$1,$2,$3,true,true,now()) RETURNING employee_id`,
      [name, await bcrypt.hash(password, 10), profile]);
    ids.push(r.rows[0].employee_id);
    const login = await api("/auth/login", null, "POST", { username: name, password });
    assert.equal(login.response.status, 200, login.data.error);
    const cookie = login.response.headers.get("set-cookie")?.split(";")[0];
    assert(cookie?.startsWith("mis_session="));
    cookies.push(cookie);
  }
  await db.query(`INSERT INTO crm.tbl_mis_sales_intermediary(agent_code,agent_name,agent_type,
    registration_status,source_ref,agent_status) VALUES($1,$1,'INDEPENDENT','PENDING',$1,'DRAFT')`, [code]);
  const root = "/intermediary";
  assert.equal((await api(`${root}/options`)).response.status, 401);
  assert.equal((await api(`${root}/options`, cookies[1])).response.status, 403);
  const options = await api(`${root}/options`, cookies[0]);
  assert.equal(options.response.status, 200);
  assert.equal(typeof options.data.import_available, "boolean");
  // A missing configuration error is safe to exercise. Never run an enabled external extractor.
  if (!options.data.import_available) {
    const imp = await api(`${root}/import`, cookies[0], "POST");
    assert.equal(imp.response.status, 503);
    assert.equal(typeof imp.data.error, "string");
  }
  assert.equal((await api(`${root}/agents`, cookies[0], "POST", {})).response.status, 405);
  const listing = await api(`${root}/agents?registration_status=PENDING&search=${code}`, cookies[0]);
  assert.equal(listing.response.status, 200);
  assert.equal(listing.data.total, 1);
  const before = await api(`${root}/agents/${code}`, cookies[0]);
  assert.equal(before.response.status, 200);
  const input = { ...before.data.agent, notes: "Synthetic HTTP details capture", unit_code: "QA_UNIT",
    region_code: "QA_REGION", mobile_no: "0700000000", receive_date: "2026-11-01", contract_date: "2026-11-01" };
  const saved = await api(`${root}/agents/${code}`, cookies[0], "PATCH", input);
  assert.equal(saved.response.status, 200, saved.data.error);
  assert.equal(saved.data.agent.unit_code, "QA_UNIT");
  assert(saved.data.events.some(e => e.notes === input.notes));
  assert.equal((await api(`${root}/agents/${code}`, cookies[0], "PATCH", input)).response.status, 409);
  assert.equal((await api(`${root}/agents/${code}/actions`, cookies[1], "POST",
    { action: "NOTE", version: saved.data.agent.version, notes: "Forbidden change" })).response.status, 403);
  const completion = await api(`${root}/agents/${code}/actions`, cookies[0], "POST",
    { action: "COMPLETE_REGISTRATION", version: saved.data.agent.version, notes: "Missing compliance" });
  assert.equal(completion.response.status, 400);
  const badDocument = await api(`${root}/agents/${code}/documents/2147483647/confirm`, cookies[0], "POST");
  assert.equal(badDocument.response.status, 404);
  console.info("PASS: real HTTP authentication, National Sales Admin authorization, pending import queue, manual-create denial, saved details, retained notes, stale-write prevention and explicit incomplete-registration/configuration errors.");
} finally {
  await db.query("DELETE FROM crm.intermediary_events WHERE agent_code=$1", [code]).catch(() => {});
  await db.query("DELETE FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1", [code]).catch(() => {});
  if (ids.length) {
    await db.query("DELETE FROM crm.admin_audit_trail WHERE employee_id=ANY($1::int[])", [ids]).catch(() => {});
    await db.query("DELETE FROM crm.auth_sessions WHERE employee_id=ANY($1::int[])", [ids]).catch(() => {});
    await db.query("DELETE FROM crm.employees WHERE employee_id=ANY($1::int[])", [ids]).catch(() => {});
  }
  await db.end();
}
