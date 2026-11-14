import assert from "node:assert/strict";
import { planManagerUsers } from "./sales-manager-user-plan.mjs";
let id = 0;
const row = (name, email, data = {}, catalog = "unit-managers") => ({
  id: ++id, catalog, code: `MANAGER_${id}`, name, data: { EMAIL: email, ...data }, row_sha256: `hash${id}`,
});
const person = row("One Sales Manager", "one@example.test", { HRMIS_CODE: "000123" });
const repeated = row(" ONE  SALES MANAGER ", "ONE@example.test", { HRMIS_CODE: "000123" }, "regional-managers");
const gi = row("One Sales Manager", "one@example.test", { HRMIS_CODE: "000123" }, "gi-unit-managers");
const rows = [person, repeated, gi];
const original = JSON.stringify(rows);
let plan = planManagerUsers(rows, []);
assert.equal(plan.groups.length, 1);
assert.equal(plan.groups[0].rows.length, 3, "Multiple Medical/GI assignments must share one normal user");
assert.equal(plan.held.length, 0);
assert.equal(JSON.stringify(rows), original);
const identity = { identity_key: plan.groups[0].identityKey, employee_id: 42 };
const account = { employee_id: 42, username: "one@example.test", email: "one@example.test", is_deleted: false };
plan = planManagerUsers(rows, [account], [identity],
  [{ source_record_id: person.id, identity_key: identity.identity_key, source_row_sha256: person.row_sha256 }]);
assert.equal(plan.groups[0].account.employee_id, 42);
assert.equal(plan.groups.length, 1);
assert.equal(planManagerUsers(rows, [account]).groups.length, 0, "Do not guess an existing account match without provenance");
assert.equal(planManagerUsers(rows, [account], [identity], [{
  source_record_id: person.id, identity_key: identity.identity_key, source_row_sha256: "changed",
}]).groups.length, 0, "Source drift must not silently redirect a previous account link");
plan = planManagerUsers([row("Same Person", "first@example.test"), row("Same Person", "second@example.test")], []);
assert.equal(plan.groups.length, 0);
assert.equal(plan.held[0].rows.length, 2);
plan = planManagerUsers([row("Different Person A", "shared@example.test"), row("Different Person B", "shared@example.test")], []);
assert.equal(plan.groups.length, 0, "A shared email does not authorize merging different people");
plan = planManagerUsers([row("No Identity", null)], []);
assert.equal(plan.groups.length, 0);
plan = planManagerUsers([row("Missing Email", null, { HRMIS_CODE: "000123" })], []);
assert.equal(plan.groups.length, 1);
assert.equal(plan.groups[0].email, null);
plan = planManagerUsers([row("Invalid Email", "not-an-email")], []);
assert.equal(plan.groups.length, 0);
plan = planManagerUsers([row("Person A", "a@example.test", { MIS_EMP_CODE: "LEGACY_SHARED" }),
  row("Person B", "b@example.test", { MIS_EMP_CODE: "LEGACY_SHARED" })], []);
assert.equal(plan.groups.length, 2, "Conflicting legacy employee codes must not merge differently named people");
console.log("PASS: one account per confirmed person across Medical/GI repeats; reruns reuse proven accounts; ambiguous names/shared emails, invalid contacts, missing identities and changed source links are held; source rows unchanged.");
