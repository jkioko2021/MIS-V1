import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "esbuild";

test("review email URLs and scoped landing validation", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "risk-review-links-"));
  try {
    const load = async (relative, name) => {
      const outfile = path.join(dir, `${name}.mjs`);
      await build({ entryPoints: [fileURLToPath(new URL(relative, import.meta.url))],
        outfile, bundle: true, platform: "node", format: "esm" });
      return import(pathToFileURL(outfile).href);
    };
    const { riskReviewLink } = await load("../src/lib/risk-review-link.ts", "server");
    const { parseReviewLink, reviewScopeError, reviewAvailability } = await load("../../mis-v1/src/pages/risk/review-link.ts", "client");
    for (const base of ["https://mis.example.test", "https://mis.example.test/", "https://mis.example.test/nested/mis/"]) {
      const link = new URL(riskReviewLink("Dept & /é", 23, base));
      assert.equal(link.pathname, `${new URL(base).pathname.replace(/\/$/, "")}/risk/review`);
      assert.deepEqual(parseReviewLink(link.search), { department: "Dept & /é", period: "23" });
      assert.equal(link.searchParams.size, 2, "scope only, no tokens or snapshots");
    }
    for (const bad of ["", "not a url", "http://mis.example.test", "//evil.test", "https://user:password@mis.example.test",
      "https://mis.example.test/?x=1", "https://mis.example.test/#token", "https://workspace.replit.dev", "https://localhost"]) {
      assert.equal(riskReviewLink("Dept", 23, bad), null, bad);
    }
    for (const period of [0, -1, 1.5, Infinity, 2147483648, Number.MAX_SAFE_INTEGER + 1]) assert.equal(riskReviewLink("Dept", period, "https://mis.example.test"), null);
    for (const query of ["depart_code=B", "period_id=23", "depart_code=B&period_id=0",
      "depart_code=B&period_id=1.5", "depart_code=B&period_id=23&period_id=24",
      "depart_code=B&depart_code=A&period_id=23", "depart_code=B&period_id=9007199254740992"]) {
      assert.equal(parseReviewLink(query), "invalid", query);
    }
    assert.equal(parseReviewLink(""), null);
    const scope = parseReviewLink("depart_code=B&period_id=23");
    assert.equal(reviewScopeError(scope, [{ depart_code: "A" }, { depart_code: "B" }], [{ period_id: 23 }]), "");
    assert.match(reviewScopeError(scope, [{ depart_code: "A" }], [{ period_id: 23 }]), /no longer available to you/);
    assert.match(reviewScopeError(scope, [{ depart_code: "B" }], [{ period_id: 24 }]), /reporting period/);
    assert.equal(reviewAvailability("SUBMITTED"), "");
    for (const status of ["RETURNED", "CLOSED", "REVIEWED", "NOT_SUBMITTED"]) assert.match(reviewAvailability(status), /no longer awaiting review/);
    const app = await readFile(new URL("../../mis-v1/src/App.tsx", import.meta.url), "utf8");
    const login = await readFile(new URL("../../mis-v1/src/pages/login/index.tsx", import.meta.url), "utf8");
    assert.match(app, /if \(!user \|\| passwordExpired\) return <LoginPage \/>/);
    assert.match(app, /base=\{import\.meta\.env\.BASE_URL/);
    assert.match(login, /window\.location\.reload\(\)/, "password renewal retains the full URL");
    assert.doesNotMatch(login, /setLocation|window\.location\.(?:href|assign|replace)/, "sign-in does not discard or redirect the scope");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
