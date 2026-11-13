// Isolated development fixtures only; no SQL Server or external email calls.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcrypt";

if (process.env.NODE_ENV === "production") throw new Error("Development only.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const prefix = `sales_setup_${randomUUID().slice(0, 8)}`;
const adminName = `${prefix}_admin`;
const password = `${randomUUID()}Aa9!`;
const ids = [];
const root = "/admin/sales-structure";
async function api(path, cookie, method = "GET", body) {
  const response = await fetch(`http://localhost:80/api${path}`, {
    method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
try {
  await db.connect();
  const normalProfile = (await db.query(`SELECT profile_id FROM crm.profiles
    WHERE is_active AND profile_id NOT IN (1,2) ORDER BY profile_id LIMIT 1`)).rows[0].profile_id;
  const cookies = [];
  for (const [index, profile] of [1, normalProfile].entries()) {
    const username = index === 0 ? adminName : `${prefix}_staff`;
    const result = await db.query(`INSERT INTO crm.employees
      (username,employee_name,password_hash,profile_id,activated,approved,last_password_reset)
      VALUES($1,$1,$2,$3,true,true,now()) RETURNING employee_id`,
    [username, await bcrypt.hash(password, 10), profile]);
    ids.push(result.rows[0].employee_id);
    const login = await api("/auth/login", null, "POST", { username, password });
    assert.equal(login.status, 200, login.data.error);
    assert(login.cookie?.startsWith("mis_session="));
    cookies.push(login.cookie);
  }
  const [admin, normal] = cookies;
  assert.equal((await api(root)).status, 401);
  assert.equal((await api(root, normal)).status, 403);
  const managers = new Map();
  for (const level of ["NATIONAL", "REGION", "BRANCH", "UNIT"]) {
    const enrolled = await api(`${root}/managers`, admin, "POST", { employee_id: ids[1], level });
    assert.equal(enrolled.status, 201, enrolled.data.error);
    managers.set(level, enrolled.data.id);
  }
  assert.equal((await api(`${root}/managers`, admin, "POST", { employee_id: ids[1], level: "UNIT" })).status, 409);
  assert.equal((await api(`${root}/managers`, normal, "POST", { employee_id: ids[1], level: "UNIT" })).status, 403);
  assert.equal((await api(`${root}/managers/${managers.get("UNIT")}`, normal, "PATCH", { is_active: false, version: 1 })).status, 403);
  const nodes = new Map();
  let parent = null;
  for (const level of ["NATIONAL", "REGION", "BRANCH", "UNIT"]) {
    const body = { code: `${prefix}_${level}`, name: `${prefix} ${level}`,
      level, parent_id: parent, manager_id: managers.get(level), is_active: true };
    const created = await api(`${root}/nodes`, admin, "POST", body);
    assert.equal(created.status, 201, created.data.error);
    nodes.set(level, { ...body, id: created.data.id, version: created.data.version });
    parent = created.data.id;
  }
  const initial = await api(root, admin);
  assert.equal(initial.status, 200);
  for (const node of nodes.values()) {
    const saved = initial.data.nodes.find(row => row.id === node.id);
    assert.equal(saved.code, node.code.toUpperCase());
    assert.equal(saved.manager_id, node.manager_id);
  }
  assert.equal(initial.data.managers.filter(m => m.employee_id === ids[1]).length, 4);
  assert.equal((await db.query("SELECT profile_id FROM crm.employees WHERE employee_id=$1", [ids[1]])).rows[0].profile_id, normalProfile,
    "Manager enrollment must not modify the ordinary login profile.");
  const unit = nodes.get("UNIT");
  const unitPatch = { name: `${prefix} changed unit`, parent_id: unit.parent_id, manager_id: unit.manager_id, is_active: true, version: 1 };
  assert.equal((await api(`${root}/nodes/${unit.id}`, normal, "PATCH", unitPatch)).status, 403);
  assert.equal((await api(`${root}/nodes`, normal, "POST", nodes.get("NATIONAL"))).status, 403);
  assert.equal((await api(`${root}/nodes/${unit.id}`, admin, "PATCH", { ...unitPatch, manager_id: managers.get("BRANCH") })).status, 400);
  assert.equal((await api(`${root}/nodes/${unit.id}`, admin, "PATCH", { ...unitPatch, parent_id: nodes.get("NATIONAL").id })).status, 400);
  assert.equal((await api(`${root}/nodes/${unit.id}`, admin, "PATCH", { ...unitPatch, name: "   " })).status, 400);
  assert.equal((await api(`${root}/nodes`, admin, "POST", nodes.get("NATIONAL"))).status, 409);
  const changed = await api(`${root}/nodes/${unit.id}`, admin, "PATCH", unitPatch);
  assert.equal(changed.status, 200, changed.data.error);
  assert.equal(changed.data.version, 2);
  assert.equal((await api(`${root}/nodes/${unit.id}`, admin, "PATCH", unitPatch)).status, 409);
  const region = nodes.get("REGION");
  assert.equal((await api(`${root}/nodes/${region.id}`, admin, "PATCH", { ...region, is_active: false })).status, 400);
  assert.equal((await api(`${root}/managers/${managers.get("UNIT")}`, admin, "PATCH", { is_active: false, version: 1 })).status, 400);
  await db.query("UPDATE crm.employees SET employee_locked=true WHERE employee_id=$1", [ids[1]]);
  const locked = await api(root, admin);
  assert(!locked.data.users.some(u => u.employee_id === ids[1]));
  assert(locked.data.managers.filter(m => m.employee_id === ids[1]).every(m => !m.user_eligible));
  assert.equal((await api(`${root}/nodes/${unit.id}`, admin, "PATCH", { ...unitPatch, version: 2 })).status, 400);
  await db.query("UPDATE crm.employees SET employee_locked=false WHERE employee_id=$1", [ids[1]]);
  const unassigned = await api(`${root}/nodes/${unit.id}`, admin, "PATCH", { ...unitPatch, version: 2, manager_id: null });
  assert.equal(unassigned.status, 200, unassigned.data.error);
  const disabled = await api(`${root}/managers/${managers.get("UNIT")}`, admin, "PATCH", { is_active: false, version: 1 });
  assert.equal(disabled.status, 200, disabled.data.error);
  assert.equal((await api(`${root}/nodes/${unit.id}`, admin, "PATCH", { ...unitPatch, version: 3 })).status, 400);
  assert.equal((await api(`${root}/managers/${managers.get("UNIT")}`, admin, "PATCH", { is_active: true, version: 1 })).status, 409);
  assert.equal((await api(`${root}/managers/${managers.get("UNIT")}`, admin, "PATCH", { is_active: true, version: 2 })).status, 200);
  // Race an empty parent's deactivation against creating an active child.
  const extraRegion = await api(`${root}/nodes`, admin, "POST", {
    code: `${prefix}_REG2`, name: `${prefix} Region 2`, level: "REGION",
    parent_id: nodes.get("NATIONAL").id, manager_id: null, is_active: true,
  });
  assert.equal(extraRegion.status, 201, extraRegion.data.error);
  const [deactivate, createChild] = await Promise.all([
    api(`${root}/nodes/${extraRegion.data.id}`, admin, "PATCH", {
      name: `${prefix} Region 2`, parent_id: nodes.get("NATIONAL").id, manager_id: null, is_active: false, version: 1,
    }),
    api(`${root}/nodes`, admin, "POST", {
      code: `${prefix}_BR2`, name: `${prefix} Branch 2`, level: "BRANCH",
      parent_id: extraRegion.data.id, manager_id: null, is_active: true,
    }),
  ]);
  assert((deactivate.status === 200 && createChild.status === 400) || (deactivate.status === 400 && createChild.status === 201));
  const invalid = await db.query(`SELECT n.id FROM crm.sales_structure_nodes n
    JOIN crm.sales_structure_nodes p ON p.id=n.parent_id WHERE n.created_by=$1 AND n.is_active AND NOT p.is_active`, [adminName]);
  assert.equal(invalid.rowCount, 0);
  const events = await db.query("SELECT before_data,after_data FROM crm.sales_setup_events WHERE actor=$1", [adminName]);
  assert(events.rowCount >= 12);
  assert(events.rows.some(e => e.before_data?.manager_id === unit.manager_id && e.after_data?.manager_id === null));
  console.info("PASS: admin-only hierarchy, all four manager levels, unchanged staff profiles, saved mappings, validation, stale writes, locked users, deactivation dependencies, atomic hierarchy races and retained audit history.");
} finally {
  await db.query("DELETE FROM crm.sales_setup_events WHERE actor=$1", [adminName]);
  for (const level of ["UNIT", "BRANCH", "REGION", "NATIONAL"]) {
    await db.query("DELETE FROM crm.sales_structure_nodes WHERE created_by=$1 AND level=$2", [adminName, level]);
  }
  await db.query("DELETE FROM crm.sales_manager_enrollments WHERE created_by=$1", [adminName]);
  if (ids.length) {
    await db.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::text[])", [[adminName, `${prefix}_staff`]]);
    await db.query("DELETE FROM crm.auth_sessions WHERE employee_id=ANY($1::int[])", [ids]);
    await db.query("DELETE FROM crm.employees WHERE employee_id=ANY($1::int[])", [ids]);
  }
  await db.end();
}
