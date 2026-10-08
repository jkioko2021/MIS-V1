// Real development database and managed API; synthetic accounts only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (process.env.NODE_ENV === "production") throw new Error("Development fixtures only");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prefix = `SESSION_${randomUUID().slice(0, 8)}`;
const profiles = [];
const users = [];
const base = "http://localhost:80/api";
let assertions = 0;
const check = (actual, expected, message) => { assert.equal(actual, expected, message); assertions++; };
const api = async (path, method = "GET", body, cookie) => {
  const r = await fetch(`${base}${path}`, {
    method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, body: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] };
};
const login = async u => {
  const r = await api("/auth/login", "POST", { username: u.username, password: u.password });
  check(r.status, 200, "staff password login succeeds");
  check(r.body.step, "authenticated", "staff remains password-only");
  assert(r.cookie);
  return r.cookie;
};
const protectedStatus = async cookie => (await api("/admin/menu-master", "GET", undefined, cookie)).status;

try {
  // The explicit migration must already be installed.
  await pool.query("SELECT session_id FROM crm.auth_sessions LIMIT 0");
  for (const label of ["target", "other", "operator"]) {
    const { rows: [p] } = await pool.query(
      "INSERT INTO crm.profiles(profile_name,profile_type) VALUES($1,'ADMIN') RETURNING profile_id",
      [`${prefix}_${label}`]);
    profiles.push(p.profile_id);
    const password = `Test-Aa9!${randomUUID()}`;
    const { rows: [u] } = await pool.query(`INSERT INTO crm.employees
      (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset)
      VALUES($1,$2,$3,$4,TRUE,TRUE,CURRENT_DATE) RETURNING employee_id,username`,
    [`${prefix}_${label}`, await bcrypt.hash(password, 4), `${prefix} ${label}`, p.profile_id]);
    users.push({ ...u, profile_id: p.profile_id, password });
  }
  const [target, other, operator] = users;
  const peerPassword = `Peer-Aa9!${randomUUID()}`;
  const { rows: [peerRow] } = await pool.query(`INSERT INTO crm.employees
    (username,password_hash,employee_name,profile_id,activated,approved,last_password_reset)
    VALUES($1,$2,$3,$4,TRUE,TRUE,CURRENT_DATE) RETURNING employee_id,username`,
  [`${prefix}_peer`, await bcrypt.hash(peerPassword, 4), `${prefix} peer`, target.profile_id]);
  const peer = { ...peerRow, profile_id: target.profile_id, password: peerPassword };
  users.push(peer);
  const adminCookie = await login(operator);
  const unaffected = await login(other);
  const first = await login(target);
  const second = await login(target);
  check(await protectedStatus(first), 200, "live session accepted");
  check((await api("/auth/logout", "POST", {}, first)).status, 200, "logout succeeds");
  check(await protectedStatus(first), 401, "copied logged-out cookie rejected outside auth/me");
  check(await protectedStatus(second), 200, "logout keeps another same-user session");
  check(await protectedStatus(unaffected), 200, "logout keeps unrelated staff");

  const changedPassword = `Changed-Aa9!${randomUUID()}`;
  const changed = await api("/auth/change-password", "POST",
    { currentPassword: target.password, newPassword: changedPassword }, second);
  check(changed.status, 200, "password change succeeds");
  target.password = changedPassword;
  check(await protectedStatus(second), 401, "old password cookie rejected");
  check(await protectedStatus(changed.cookie), 200, "replacement password session accepted");
  check(await protectedStatus(unaffected), 200, "password change keeps other staff");

  const staleCookies = [first, second, changed.cookie];
  for (const [action, body, restore] of [
    ["lock", { lock: true }, { lock: false }],
    ["activate", { activate: false }, { activate: true }],
    ["approve", { approve: false }, { approve: true }],
  ]) {
    const before = await login(target);
    check((await api(`/admin/employees/${target.employee_id}/${action}`, "POST", body, adminCookie)).status, 200, action);
    check(await protectedStatus(before), 401, `${action} revokes session`);
    check(await protectedStatus(unaffected), 200, `${action} keeps other staff`);
    check((await api(`/admin/employees/${target.employee_id}/${action}`, "POST", restore, adminCookie)).status, 200, `${action} restored`);
    check(await protectedStatus(before), 401, `${action} restoration must not resurrect old cookie`);
    staleCookies.push(before);
  }

  const resetCookie = await login(target);
  const reset = await api(`/admin/employees/${target.employee_id}/reset-password`, "POST", {}, adminCookie);
  check(reset.status, 200, "admin reset succeeds");
  check(await protectedStatus(resetCookie), 401, "admin reset invalidates copied cookie");
  target.password = reset.body.tempPassword;
  const resetSession = await login(target);
  check((await api("/auth/me", "GET", undefined, resetSession)).body.passwordExpired, true, "reset still requires password change");
  check((await api("/auth/change-password", "POST",
    { currentPassword: target.password, newPassword: changedPassword }, resetSession)).status, 200, "reset password can be changed");
  target.password = changedPassword;
  staleCookies.push(resetCookie, resetSession);

  const beforeProfile = await login(target);
  const peerBeforeProfile = await login(peer);
  check((await api(`/admin/profiles/${target.profile_id}`, "PUT",
    { profile_name: `${prefix}_renamed`, profile_type: "ADMIN", is_active: true }, adminCookie)).status, 200, "profile edit succeeds");
  check(await protectedStatus(beforeProfile), 401, "profile edit revokes assigned staff");
  check(await protectedStatus(peerBeforeProfile), 401, "profile edit revokes all assigned staff");
  check(await protectedStatus(unaffected), 200, "profile edit keeps other profiles");
  staleCookies.push(beforeProfile);
  const beforeAccess = await login(target);
  const peerBeforeAccess = await login(peer);
  check((await api(`/admin/profiles/${target.profile_id}/access`, "PUT", { items: [{
    main_menu_name: "Dashboard", sub_menu_name: "Overview", page_url: "/", menu_order: 10,
    can_access: true, can_add: false, can_edit: false, can_delete: false, read_only: true,
  }] }, adminCookie)).status, 200, "access save succeeds");
  check(await protectedStatus(beforeAccess), 401, "access edit revokes affected sessions");
  check(await protectedStatus(peerBeforeAccess), 401, "access edit revokes all assigned staff");
  check(await protectedStatus(unaffected), 200, "access edit keeps unrelated sessions");
  staleCookies.push(beforeAccess);
  const beforeEmptyAccess = await login(target);
  check((await api(`/admin/profiles/${target.profile_id}/access`, "PUT", { items: [] }, adminCookie)).status, 200, "empty access save succeeds");
  check(await protectedStatus(beforeEmptyAccess), 401, "empty access replacement revokes");
  staleCookies.push(beforeEmptyAccess);
  const beforeDeactivateProfile = await login(target);
  check((await api(`/admin/profiles/${target.profile_id}`, "PUT",
    { profile_name: `${prefix}_renamed`, is_active: false }, adminCookie)).status, 200, "profile disabled");
  check(await protectedStatus(beforeDeactivateProfile), 401, "inactive profile denied");
  await pool.query("UPDATE crm.profiles SET is_active=TRUE WHERE profile_id=$1", [target.profile_id]);
  check(await protectedStatus(beforeDeactivateProfile), 401, "profile reactivation does not restore cookie");
  staleCookies.push(beforeDeactivateProfile);

  const beforeReassign = await login(target);
  const peerBeforeReassign = await login(peer);
  check((await api(`/admin/employees/${target.employee_id}`, "PUT",
    { employee_name: `${prefix} target`, profile_id: other.profile_id }, adminCookie)).status, 200, "employee reassignment succeeds");
  target.profile_id = other.profile_id;
  check(await protectedStatus(beforeReassign), 401, "old profile claims rejected");
  check(await protectedStatus(unaffected), 200, "employee reassignment keeps peers");
  check(await protectedStatus(peerBeforeReassign), 200, "reassigning one employee keeps previous-profile peers");
  staleCookies.push(beforeReassign);
  const beforeAutoLock = await login(target);
  const { rows: [config] } = await pool.query("SELECT lockout_count FROM crm.password_config LIMIT 1");
  for (let i = 0; i < (config?.lockout_count ?? 3); i++) {
    await api("/auth/login", "POST", { username: target.username, password: "incorrect" });
  }
  check(await protectedStatus(beforeAutoLock), 401, "automatic failed-login lock revokes");
  await api(`/admin/employees/${target.employee_id}/lock`, "POST", { lock: false }, adminCookie);
  check(await protectedStatus(beforeAutoLock), 401, "unlock never restores automatic-lock cookie");
  staleCookies.push(beforeAutoLock);
  const beforeDeleted = await login(target);
  await pool.query("UPDATE crm.employees SET is_deleted=TRUE WHERE employee_id=$1", [target.employee_id]);
  check(await protectedStatus(beforeDeleted), 401, "soft-deleted employee rejected on protected API");
  await pool.query("UPDATE crm.employees SET is_deleted=FALSE WHERE employee_id=$1", [target.employee_id]);
  check(await protectedStatus(beforeDeleted), 401, "restoring deleted employee never restores sessions");
  staleCookies.push(beforeDeleted);
  const fresh = await login(target);
  // A rolled-back security mutation must not revoke a valid session.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE crm.employees SET employee_locked=TRUE WHERE employee_id=$1", [target.employee_id]);
    await client.query("ROLLBACK");
  } finally { client.release(); }
  check(await protectedStatus(fresh), 200, "rolled-back account change leaves session valid");
  check((await api("/auth/me", "GET", undefined, fresh)).body.user.profileId, other.profile_id, "new login has current profile");
  for (const old of staleCookies) check(await protectedStatus(old), 401, "old cookie never resurrects");

  // Missing/unknown persistent sessions and expired rows are rejected despite valid signatures.
  const legacy = jwt.sign({ sub: target.employee_id, username: target.username, profileId: target.profile_id },
    process.env.SESSION_SECRET ?? "dev-secret-change-me", { expiresIn: "8h" });
  check(await protectedStatus(`mis_session=${legacy}`), 401, "legacy JWT rejected");
  const forged = jwt.sign({ sub: target.employee_id, username: target.username,
    profileId: target.profile_id, sid: randomUUID() },
  process.env.SESSION_SECRET ?? "dev-secret-change-me", { expiresIn: "8h" });
  check(await protectedStatus(`mis_session=${forged}`), 401, "unknown session rejected");
  const sid = jwt.decode(fresh.split("=")[1]).sid;
  await pool.query("UPDATE crm.auth_sessions SET expires_at=NOW()-INTERVAL '1 second' WHERE session_id=$1", [sid]);
  check(await protectedStatus(fresh), 401, "database expiry enforced");
  check(await protectedStatus(unaffected), 200, "unaffected staff stays signed in throughout");
  console.log(`Session revocation API checks passed (${assertions} assertions).`);
} finally {
  const ids = users.map(u => u.employee_id);
  await pool.query("DELETE FROM crm.admin_audit_trail WHERE username=ANY($1::varchar[])",
    [users.map(u => u.username)]);
  await pool.query("DELETE FROM crm.password_history WHERE employee_id=ANY($1::int[])", [ids]);
  await pool.query("DELETE FROM crm.employees WHERE employee_id=ANY($1::int[])", [ids]);
  await pool.query("DELETE FROM crm.menu_access WHERE profile_id=ANY($1::int[])", [profiles]);
  await pool.query("DELETE FROM crm.profiles WHERE profile_id=ANY($1::int[])", [profiles]);
  await pool.end();
}
