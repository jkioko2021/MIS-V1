import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("register lists retain server totals and dashboard analytics do not use the capped list", async () => {
  const source = await readFile(new URL("../../mis-v1/src/pages/risk/index.tsx", import.meta.url), "utf8");
  assert.match(source, /recordsQuery\.data\?\.totals/);
  assert.match(source, /!recordsQuery\.isError && !recordsFailure/);
  assert.match(source, /activeCount = recordTotals\?\.active_risks/);
  assert.match(source, /assessedCount = recordTotals\?\.assessed_risks/);
  assert.match(source, /useRiskAnalytics\(username/);
  assert.match(source, /<RiskDashboard[^>]*data=/);
  assert.match(source, /envelopeData<RiskAnalyticsResponseData>\(analyticsQuery\.data\)/);
  assert.doesNotMatch(source, /openRecords\.length|records\.filter\(item => item\.assessment_updated/);
  assert.match(source, /totalRecords=\{activeCount\}/);
});

test("record lists disclose the displayed subset instead of claiming it is the full scope", async () => {
  const source = await readFile(new URL("../../mis-v1/src/pages/risk/risk-details.tsx", import.meta.url), "utf8");
  assert.match(source, /totalRecords > records\.length/);
  assert.match(source, /Showing \$\{records\.length\} of \$\{totalRecords\} matching risks/);
});
