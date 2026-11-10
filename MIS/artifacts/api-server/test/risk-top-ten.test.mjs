import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const webRequire = createRequire(new URL("../../mis-v1/package.json", import.meta.url));
const { createElement } = webRequire("react");
const { renderToStaticMarkup } = webRequire("react-dom/server");
const compiled = await build({
  entryPoints: [new URL("../../mis-v1/src/pages/risk/risk-top-ten.tsx", import.meta.url).pathname],
  bundle: true, write: false, format: "cjs", platform: "node", target: "node22", jsx: "automatic",
  plugins: [{ name: "shared-react", setup(builder) {
    builder.onResolve({ filter: /^react(?:\/.*)?$/ }, args => ({
      path: webRequire.resolve(args.path), external: true,
    }));
  }}],
});
const componentModule = { exports: {} };
Function("require", "module", "exports", compiled.outputFiles[0].text)(webRequire, componentModule, componentModule.exports);
const RiskTopTen = componentModule.exports.default;
const risk = (i, extra = {}) => ({
  risk_code: `R${i}`, risk_title: `Ranked risk ${i}`, department: "Finance", depart_code: "D1",
  risk_score: 25, risk_ranking: "Critical", residual_exposure: 12.5,
  open_actions: 1, behind_schedule_actions: 0, overdue_actions: 0,
  impact_ordinal: 5, likelihood_ordinal: 5, ...extra,
});
const html = props => renderToStaticMarkup(createElement(RiskTopTen, { loading: false, overallAccess: true, onSelect: () => {}, ...props }));

test("actual top-ten component renders one capped list without a departmental list or selector", () => {
  const risks = Array.from({ length: 13 }, (_, i) => risk(i));
  const markup = html({
    overall: risks, overallRankedCount: 13, overallUnrankedCount: 2,
    departments: [
      { depart_code: "D1", department: "Finance", total_ranked: 13, total_unranked: 2, risks },
      { depart_code: "D2", department: "Claims", total_ranked: 1, total_unranked: 0, risks: [risk(30, { depart_code: "D2" })] },
    ],
  });
  assert.match(markup, /Top 10 overall/);
  assert.doesNotMatch(markup, /Top 10 by department|Choose department for top ten risks|Claims/);
  assert.equal((markup.match(/aria-label="Rank \d+"/g) ?? []).length, 10);
  assert.equal((markup.match(/>View risk(?:<| )/g) ?? []).length, 10);
  assert.doesNotMatch(markup, /Ranked risk 1[012]</);
});

test("short and empty top-ten results render safely without inventing rows or scores", () => {
  const markup = html({
    overall: [risk(0)], overallRankedCount: 1, overallUnrankedCount: 3,
    departments: [{ depart_code: "D1", department: "Finance", total_ranked: 1, total_unranked: 3, risks: [risk(0)] }],
  });
  assert.equal((markup.match(/aria-label="Rank \d+"/g) ?? []).length, 1);
  const empty = html({ overall: [], overallRankedCount: 0, overallUnrankedCount: 5, departments: [] });
  assert.match(empty, /No ranked risks/);
  assert.doesNotMatch(empty, /aria-label="Rank \d+"/);
});

test("champion/owner rendering makes assigned-department scope explicit rather than claiming an organization-wide ranking", () => {
  const markup = html({ overallAccess: false, overall: [risk(0)], overallRankedCount: 1,
    overallUnrankedCount: 0, departments: [] });
  assert.match(markup, /Top 10 in my departments/);
  assert.match(markup, /No other departments are included/);
  assert.doesNotMatch(markup, /Top 10 overall/);
});

test("dashboard swaps priority and top-ten positions while preserving document and keyboard order", async () => {
  const source = await readFile(new URL("../../mis-v1/src/pages/risk/risk-dashboard.tsx", import.meta.url), "utf8");
  const metrics = source.indexOf("{topMetric}");
  const priority = source.indexOf("{priorityPanel}");
  const matrix = source.indexOf('<Panel title="Impact × likelihood assessment matrix"');
  const topTen = source.indexOf("<RiskTopTen");
  assert(metrics >= 0 && priority > metrics && matrix > priority && topTen > matrix);
});
