import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("Update Register does not hide unassessed closed-action risks returned by the API", async () => {
  const source = await readFile(new URL("../../mis-v1/src/pages/risk/index.tsx", import.meta.url), "utf8");
  assert.match(source, /view: 'pending_assessment'/);
  assert.doesNotMatch(source, /item\.risk_status\s*!==\s*['"]Closed['"]/);
  assert.match(source, /pageCodes\.includes\(item\.depart_code\)/, "Department authorization remains");
});
