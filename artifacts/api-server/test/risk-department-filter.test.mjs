import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "esbuild";

let dir, selection, pageDepartments;
const frontend = new URL("../../mis-v1/src/pages/risk/", import.meta.url);
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "mis-risk-filter-"));
  for (const name of ["department-filter", "risk-access"]) {
    const outfile = path.join(dir, `${name}.mjs`);
    await build({ entryPoints: [fileURLToPath(new URL(`${name}.ts`, frontend))], outfile, bundle: true, platform: "node", format: "esm" });
  }
  selection = (await import(pathToFileURL(path.join(dir, "department-filter.mjs")))).riskDepartmentSelection;
  pageDepartments = (await import(pathToFileURL(path.join(dir, "risk-access.mjs")))).riskPageDepartments;
});
after(async () => { if (dir) await rm(dir, { recursive: true, force: true }); });

const all = [{ depart_code: "EMPTY" }, { depart_code: "RISKS" }, { depart_code: "OTHER" }];
for (const [label, actor, serverDepartments] of [
  ["management oversight", { can_manage: true, champion_departments: [], owner_departments: [] }, all],
  ["champion-only scope", { can_manage: false, champion_departments: ["RISKS"], owner_departments: [] }, [all[1]]],
  ["multi-department owner", { can_manage: false, champion_departments: [], owner_departments: ["EMPTY", "RISKS"] }, all.slice(0, 2)],
]) {
  test(`${label}: untouched dashboard omits the department restriction`, () => {
    const codes = pageDepartments(actor, "dashboard");
    const departments = serverDepartments.filter(d => codes === null || codes.includes(d.depart_code));
    assert.equal(selection("dashboard", undefined, departments), "");
    assert.ok(departments.some(d => d.depart_code === "RISKS"));
  });
}

test("review retains its explicit default; Update keeps the incoming all-scope assessment queue", () => {
  const actor = { can_manage: false, champion_departments: ["RISKS"], owner_departments: ["EMPTY", "RISKS"] };
  for (const page of ["update", "review"]) {
    const permitted = all.filter(d => pageDepartments(actor, page).includes(d.depart_code));
    assert.equal(selection(page, undefined, permitted), page === "update" ? "" : "EMPTY");
    assert.equal(selection(page, "RISKS", permitted), "RISKS");
    assert.equal(selection(page, "", permitted), "");
  }
  assert.equal(selection("review", "RISKS", all.slice(0, 2)), "RISKS");
});

test("refreshes preserve deliberate choices; revoked choices clear without choosing another department", () => {
  assert.equal(selection("dashboard", "RISKS", [...all]), "RISKS");
  assert.equal(selection("dashboard", "", [...all]), "");
  assert.equal(selection("review", "OTHER", all.slice(0, 2)), "");
  assert.equal(selection("dashboard", undefined, []), "");
});

test("page choices and account state are isolated; query caches retain actor keys", async () => {
  const workspace = await readFile(new URL("index.tsx", frontend), "utf8");
  const hooks = await readFile(new URL("use-risk-register.ts", frontend), "utf8");
  assert.match(workspace, /riskDepartmentSelection\(activePage, departmentChoices\[activePage\], departments\)/);
  assert.match(workspace, /\.\.\.choices, \[activePage\]: value/);
  assert.match(workspace, /<RiskRegisterWorkspace key=\{user\?\.username \?\? ''\}/);
  assert.match(workspace, /savedOptions\?\.actor\?\.username === username/);
  assert.match(hooks, /\[\.\.\.key, 'actor', username\]/);
  assert.equal((hooks.match(/const key = identityKey\(username,/g) ?? []).length, 5);
});
