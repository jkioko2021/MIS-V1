import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "esbuild";

let dir, latestDepartmentReviews;
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "mis-department-reviews-"));
  const outfile = path.join(dir, "reviews.mjs");
  await build({
    entryPoints: [path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../mis-v1/src/pages/risk/department-reviews.ts")],
    outfile, bundle: true, platform: "node", format: "esm", logLevel: "silent",
  });
  ({ latestDepartmentReviews } = await import(pathToFileURL(outfile).href));
});
after(async () => { await rm(dir, { recursive: true, force: true }); });

test("all-period department cards keep only the latest period, without merging workflow decisions", () => {
  const old = { depart_code: "D-01-202111", period_id: 1, period_from: "2026-01-01", total_risks: 8, workflow_status: "SIGNED_OFF" };
  const recent = { ...old, period_id: 4, period_from: "2026-10-01", total_risks: 3, workflow_status: "OPEN" };
  const rows = Object.freeze([old, recent]);
  assert.deepEqual(latestDepartmentReviews(rows), [recent]);
  assert.equal(old.total_risks, 8);
  assert.equal(old.workflow_status, "SIGNED_OFF");
});
test("department cards follow supplied code order even when names match historical aliases", () => {
  const later = { depart_code: "D-01-202111", period_id: 4, period_from: "2026-10-01" };
  const earlier = { depart_code: "D-01-202101", period_id: 4, period_from: "2026-10-01" };
  assert.deepEqual(latestDepartmentReviews([later, earlier, { ...later }]).map(row => row.depart_code), ["D-01-202101", "D-01-202111"]);
});
test("empty and single-period results remain safe and unchanged", () => {
  assert.deepEqual(latestDepartmentReviews([]), []);
  const row = { depart_code: "D-01-202111", period_id: 4, period_from: "2026-10-01" };
  assert.deepEqual(latestDepartmentReviews([row]), [row]);
});
