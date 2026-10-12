// Run after client-ratings.integration.mjs --keep, then clean up using that
// script. Reuses its synthetic private object and authorization fixture.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";

if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const fixturePath = "/tmp/mis-client-rating-fixtures.json";
const f = JSON.parse(await readFile(fixturePath, "utf8"));
assert.match(f.prefix, /^CRTEST_[a-f0-9]{8}$/);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function api(path, data) {
  const response = await fetch(`http://localhost:80/api${path}`, {
    method: data ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Cookie: `mis_session=${f.cookies.admin}` },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
try {
  const fileNo = `${f.prefix}_MED_CAPTURE`;
  if (!f.files.includes(fileNo)) f.files.push(fileNo);
  await writeFile(fixturePath, JSON.stringify(f), { mode: 0o600 });
  await pool.query(`INSERT INTO crm.business_tracking
    (file_no,proposer_name,business_type,client_type,business,rate_type,benefit_verified,entered_by,
     medical_uw,forwarded,ready_for_update,file_status)
    VALUES($1,$2,'N','C','M','S','YES',$3,TRUE,TRUE,FALSE,'MEDICAL UW-REVIEW')
    ON CONFLICT(file_no) DO NOTHING`,
  [fileNo, `${f.prefix} Synthetic Medical Client`, f.accounts.admin.username]);
  const { rows: [uploaded] } = await pool.query(`SELECT filesize FROM crm.business_uploads
    WHERE storage_key=$1 LIMIT 1`, [f.objects[0]]);
  const path = `/medical-underwriting/files/${encodeURIComponent(fileNo)}/uploads`;
  const metadata = { req_id: f.amlReqId, filename: "Synthetic Medical AML.pdf", filesize: Number(uploaded.filesize),
    mime_type: "application/pdf", storage_key: f.objects[0] };
  const proof = await api(path, metadata);
  assert.equal(proof.status, 201, proof.body.error);
  const classification = { ...metadata, risk_rate: "Medium", risk_reason: f.reason, policy_code: fileNo };
  for (const system of [undefined, "CLAPI"]) {
    const invalid = await api(path, { ...classification, originating_system: system });
    assert.equal(invalid.status, 400);
  }
  assert.equal((await api(path, { ...metadata, originating_system: "eOx" })).status, 400);
  for (const system of ["eOx", "AIMS"]) {
    const captured = await api(path, { ...classification, originating_system: system });
    assert.equal(captured.status, 201, captured.body.error);
  }
  const ratings = await api(`/client-ratings?search_by=policy&search=${fileNo}`);
  assert.equal(ratings.status, 200);
  assert.deepEqual(ratings.body.data.records.map(row => row.system).sort(), ["AIMS", "eOx"]);
  assert(ratings.body.data.records.every(row => row.risk_rating === "Medium" && row.reason === f.reason));
  console.log("Medical AML checks passed: explicit system capture persists to Client Rating, unapproved/missing systems denied, proof-only uploads unchanged.");
} finally { await pool.end(); }
