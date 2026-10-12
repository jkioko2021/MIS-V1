import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

const { outputFiles } = await build({
  entryPoints: ["src/lib/aml-systems.ts"], bundle: true, write: false,
  format: "esm", platform: "node",
});
const { AML_ORIGINATING_SYSTEMS, amlSystemValidation } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);
const classification = { reqName: "AML Risk Rating", riskRate: "High", riskReason: "Approved reason" };
test("only verified exact legacy systems can be saved on classifications", () => {
  assert.deepEqual(AML_ORIGINATING_SYSTEMS, ["eOx", "AIMS"]);
  for (const system of AML_ORIGINATING_SYSTEMS) {
    assert.equal(amlSystemValidation({ ...classification, system }), null);
  }
  for (const system of [undefined, null, "", " ", "CLAPI", "eox", 12, ["AIMS"]]) {
    assert.match(amlSystemValidation({ ...classification, system }), /approved/);
  }
});
test("proof-only AML Reports remain valid; new optional classifications need a system", () => {
  assert.equal(amlSystemValidation({ reqName: "AML Report", riskRate: "", riskReason: "", system: undefined }), null);
  assert.match(amlSystemValidation({ ...classification, reqName: "AML Report", system: undefined }), /approved/);
  assert.equal(amlSystemValidation({ ...classification, reqName: "AML Report", system: "AIMS" }), null);
});
test("system metadata cannot be attached to ordinary documents or without a classification", () => {
  assert.match(amlSystemValidation({ ...classification, reqName: "System Invoice", system: "eOx" }), /only available/);
  assert.match(amlSystemValidation({ ...classification, riskRate: "", riskReason: "", system: "AIMS" }), /risk rate/);
});
