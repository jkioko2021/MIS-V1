import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

let dir, importer;
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(),"mis-import-tests-"));
  await build({
    entryPoints:[fileURLToPath(new URL("../src/lib/risk-import.ts",import.meta.url))],
    outfile:path.join(dir,"importer.mjs"),bundle:true,platform:"node",format:"esm",logLevel:"silent",
    plugins:[{name:"import-db-double",setup(b) {
      b.onResolve({filter:/^\.\/postgres$/},()=>({path:"db-double",namespace:"test"}));
      b.onLoad({filter:/.*/,namespace:"test"},()=>({contents:`
        export async function query() { throw Error("Unexpected global DB call"); }
        export async function txQuery(client,sql,params) { return (await client.query(sql,params)).rows; }
      `,loader:"js"}));
    }}],
  });
  importer = await import(pathToFileURL(path.join(dir,"importer.mjs")).href);
});
after(async () => { await rm(dir,{recursive:true,force:true}); });

const row = {
  legacy_risk_code:"LEG-1",depart_code:"D",objective_code:"O",risk_category:"C",
  period_from:"2026-01-01",period_to:"2026-03-31",
  risk_title:"Legacy test",risk_description:" first\nsecond ",risk_consequence:"Consequence",
  i_rate:10,l_rate:5,control_effectiveness:0.333333,
  root_causes:[{root_cause:" cause\nnext ",current_contr:" control\nnext ",mitigations:" note\nnext ",
    due_date:"2026-03-01",action_status:"Closed",action_owner:"old.user"}],
  submitted:true,sign_off:true,risk_id:123,entered_by:"old.user",
};
const source = records => JSON.stringify({records});
function database(overrides={}) {
  const tables = {
    departments:[{depart_code:"D"}],objectives:[{depart_code:"D",obj_code:"O"}],
    categories:[{category_code:"C"}],action_statuses:[{status_name:"Closed"}],
    periods:[{period_id:1,period_from:"2026-01-01",period_to:"2026-03-31",status:"OPEN"}],
    department_summary:[],risk_master:[],register_history:[],...overrides,
  };
  const queries = [];
  return {queries,query:async sql => {
    queries.push(sql);
    assert.match(sql,/^SELECT /,"Preview must never write");
    if (sql.includes("current_database()")) return {rows:[{db:overrides.db ?? "test",host:"127.0.0.1",port:5432}]};
    const table = sql.match(/FROM risk\.(\w+)/)?.[1];
    assert(table && table in tables,sql);
    return {rows:tables[table]};
  }};
}
test("source format, batch and byte limits fail before any DB calls",() => {
  for (const input of ["broken","[]",'{"ratings":[]}',source([]),source(Array(201).fill(row)),"x".repeat(61441),
    source([{...row,extra:"\0"}])]) {
    assert(importer.parseImportSource(input).errors.length,input.slice(0,30));
  }
  assert.deepEqual(importer.parseImportSource(source([row])).rawRows,[row]);
});
test("preview is read-only; multiline values and legacy provenance are preserved",async () => {
  const client = database();
  const preview = await importer.validateImport(client,source([row]));
  assert.equal(preview.valid,true);
  assert.equal(preview.rows[0].inherent,50);
  assert.equal(preview.rows[0].residual,33.33);
  assert.deepEqual(preview.validRows[0].raw,row);
  assert.equal(preview.validRows[0].input.risk_description,row.risk_description);
  assert.equal(preview.validRows[0].input.root_causes[0].mitigations,row.root_causes[0].mitigations);
  assert.equal(preview.validRows[0].input.sign_off,undefined);
  assert.equal(preview.validRows[0].input.root_causes[0].action_owner,undefined);
});
test("preview rejects inactive, mismatched and workflow-locked targets",async () => {
  for (const overrides of [
    {departments:[]},{objectives:[{depart_code:"OTHER",obj_code:"O"}]},
    {categories:[]},{action_statuses:[]},{periods:[]},
    {department_summary:[{depart_code:"D",period_from:row.period_from,period_to:row.period_to,reviewed:true}]},
    {risk_master:[{risk_code:"leg-1"}]},{register_history:[{code:"LEG-1"}]},
  ]) assert.equal((await importer.validateImport(database(overrides),source([row]))).valid,false);
});
test("invalid fractions, scores, dates and duplicate source codes cannot receive a valid preview",async () => {
  for (const changes of [
    {control_effectiveness:33.33},{control_effectiveness:"0.5"},{control_effectiveness:0.1234567},
    {i_rate:1.001},{l_rate:0},{r_risk_exposure:99},{i_risk_rate:99},
    {period_from:"2026-02-30"},{period_from:"0000-01-01"},
  ]) assert.equal((await importer.validateImport(database(),source([{...row,...changes}]))).valid,false);
  const duplicate = await importer.validateImport(database(),source([row,{...row,legacy_risk_code:"leg-1"}]));
  assert.equal(duplicate.valid,false);
  assert(duplicate.rows.every(r=>r.errors.length));
});
test("confirmation token binds exact source, label, current account, database and expires",async () => {
  const client = database(), text = source([row]);
  const token = await importer.issuePreviewToken(client,"manager","Source",text);
  await importer.verifyPreviewToken(client,"manager","Source",text,token.preview_token);
  for (const [db,actor,name,src,t] of [
    [client,"other.admin","Source",text,token.preview_token],
    [client,"manager","Changed",text,token.preview_token],
    [client,"manager","Source",text+" ",token.preview_token],
    [database({db:"other_database"}),"manager","Source",text,token.preview_token],
    [client,"manager","Source",text,token.preview_token+"forged"],
  ]) await assert.rejects(importer.verifyPreviewToken(db,actor,name,src,t),/Preview|preview/);
  const now = Date.now;
  try {
    Date.now = () => now()+16*60*1000;
    await assert.rejects(importer.verifyPreviewToken(client,"manager","Source",text,token.preview_token),/expired/);
  } finally { Date.now = now; }
});
