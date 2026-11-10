import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const fixture = JSON.parse(await readFile("/tmp/mis-risk-admin-fixtures.json", "utf8"));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const code = `T${fixture.prefix.slice(-6)}`;
const username = fixture.accounts.admin.username;
const root = "/risk-administration/references";
async function api(catalog, method = "GET", body, suffix = "", role = "admin") {
  const res = await fetch(`http://localhost:80/api${root}/${catalog}${suffix}`, {
    method, headers: { Cookie: `mis_session=${fixture.cookies[role]}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
}
const payloads = {
  impact: { code, label: "Synthetic impact", rating: 22.25, rate_label: "Low", matrix_weight: 4 },
  likelihood: { code, label: "Synthetic likelihood", rating: .333111, description: "Synthetic qualitative criteria", matrix_weight: 2 },
  reasons: { code: `T${fixture.prefix.slice(-2)}`, label: "Synthetic AML reason" },
};
try {
  for (const catalog of ["exposure", "impact", "likelihood", "reasons"]) {
    const list = await api(catalog);
    assert.equal(list.status, 200, JSON.stringify(list.body)); assert.ok(list.body.data.length);
    assert.equal((await api(catalog, "GET", undefined, "", "champion")).status, 403);
    assert.equal((await api(catalog, "GET", undefined, "", "owner")).status, 403);
  }
  for (const [catalog, input] of Object.entries(payloads)) {
    const created = await api(catalog, "POST", input);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const before = created.body.data;
    assert.equal(before.code, input.code);
    const update = { ...input, label: `${input.label} updated`, is_active: true, expected: before };
    delete update.code;
    const modified = await api(catalog, "PATCH", update, `/${input.code}`);
    assert.equal(modified.status, 200, JSON.stringify(modified.body));
    assert.equal(modified.body.data.label, update.label);
    assert.equal((await api(catalog, "PATCH", update, `/${input.code}`)).status, 409);
    assert.equal((await api(catalog, "POST", input)).status, 409);
    const retired = await api(catalog, "PATCH", { ...update, expected: modified.body.data, is_active: false }, `/${input.code}`);
    assert.equal(retired.status, 200); assert.equal(retired.body.data.is_active, false);
  }
  assert.equal((await api("likelihood", "POST", { ...payloads.likelihood, code: `${code}X`, rating: 1.1 })).status, 400);
  assert.equal((await api("impact", "POST", { ...payloads.impact, code: `${code}X`, rating: 22.255 })).status, 400);
  const bands = (await api("exposure")).body.data;
  const band = bands.find(row => row.risk_type === "I" && row.minimum === 41);
  assert.ok(band);
  assert.equal((await api("exposure", "POST", { code: "I:41.01", label: "Synthetic", risk_type: "I", minimum: 41.01, maximum: 50, description: "Synthetic treatment" })).status, 409);
  assert.equal((await api("exposure", "PATCH", { label: band.label, description: band.description,
    risk_type: band.risk_type, minimum: band.minimum, maximum: band.maximum,
    is_active: band.is_active, expected: band }, `/${band.code}`)).status, 200);
  console.log("New reference APIs passed: four loaded catalogs, protected access, create/modify/retire, stale updates, duplicates, decimal/fraction validation, immutable exposure identity and overlap prevention.");
} finally {
  // Remove only synthetic records and this synthetic actor's catalog audit events.
  await pool.query("DELETE FROM risk.impact_factors WHERE impact_code=$1", [code]);
  await pool.query("DELETE FROM risk.likelihood_factors WHERE likelihood_code=$1", [code]);
  await pool.query("DELETE FROM crm.aml_risk_reasons WHERE reason_code=$1", [payloads.reasons.code]);
  await pool.query("DELETE FROM risk.register_history WHERE actor=$1 AND snapshot->>'catalog' IN ('impact','likelihood','exposure','reasons')", [username]);
  await pool.end();
}
