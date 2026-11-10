// Development only. Uses synthetic admin fixtures, never real staff or risks.
// Prerequisite: node test/risk-administration.integration.mjs --keep
import assert from "node:assert/strict";
import { readFile, writeFile, rm } from "node:fs/promises";
import pg from "pg";
if (process.env.NODE_ENV === "production") throw new Error("Development tests only.");
const fixture = JSON.parse(await readFile("/tmp/mis-risk-admin-fixtures.json", "utf8"));
assert.match(fixture.prefix, /^RATEST_[a-f0-9]{8}$/i);
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
const manifest = "/tmp/mis-risk-matrix-fixtures.json";
const depart = fixture.departments[0], code = `W${fixture.prefix.slice(-8)}`;
let period, riskCode;
async function api(path, role="manager", method="GET", data) {
  const r = await fetch(`http://localhost:80/api${path}`, {
    method, headers:{"Content-Type":"application/json", ...(role ? {Cookie:`mis_session=${fixture.cookies[role]}`} : {})},
    ...(data ? {body:JSON.stringify(data)} : {}),
  });
  return {status:r.status,body:await r.json()};
}
async function ok(path, role, method, data, status=200) {
  const r = await api(path,role,method,data);
  assert.equal(r.status,status,JSON.stringify(r.body));
  assert.equal(r.body.ok,true);
  return r.body.data;
}
const root = "/risk-administration/references";
const score = record => {
  const {impact,likelihood} = record.ranking_snapshot ?? {};
  return impact?.ordinal != null && likelihood?.ordinal != null ? impact.ordinal * likelihood.ordinal : null;
};
const impactInput = {code,label:"Synthetic matrix impact",rating:22.25,rate_label:"Low",matrix_weight:4};
const likelihoodInput = {code,label:"Synthetic matrix likelihood",rating:.33,description:"Synthetic criteria",matrix_weight:3};
async function cleanup() {
  if (!period) {
    try { ({period,riskCode} = JSON.parse(await readFile(manifest,"utf8"))); } catch (error) { if (error.code!=="ENOENT") throw error; }
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (riskCode) {
      await client.query("DELETE FROM risk.register_history WHERE risk_code=$1",[riskCode]);
      await client.query("DELETE FROM risk.root_causes WHERE risk_code=$1",[riskCode]);
      await client.query("DELETE FROM risk.risk_master WHERE risk_code=$1",[riskCode]);
    }
    if (period) {
      await client.query("DELETE FROM risk.department_summary WHERE depart_code=$1 AND (period_from,period_to) IN (SELECT period_from,period_to FROM risk.periods WHERE period_id=$2)",[depart,period]);
      await client.query("DELETE FROM risk.periods WHERE period_id=$1",[period]);
    }
    await client.query("DELETE FROM risk.objectives WHERE depart_code=$1 AND obj_code=$2",[depart,code]);
    await client.query("DELETE FROM risk.categories WHERE category_code=$1",[code]);
    await client.query("DELETE FROM risk.impact_factors WHERE impact_code=$1 OR impact_code=$2",[code,`${code}D`]);
    await client.query("DELETE FROM risk.likelihood_factors WHERE likelihood_code=$1",[code]);
    await client.query("DELETE FROM risk.register_history WHERE actor=ANY($1::text[]) AND snapshot->'after'->>'code'=ANY($2::text[])",[Object.values(fixture.accounts).map(a=>a.username),[code,`${code}D`]]);
    await client.query("COMMIT"); await rm(manifest,{force:true});
  } catch(e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
}
try {
  if (process.argv.includes("--cleanup")) {
    await cleanup();
  } else {
    for (const [catalog,input] of [["impact",impactInput],["likelihood",likelihoodInput]]) {
      for (const role of ["champion","owner"]) {
        assert.equal((await api(`${root}/${catalog}`,role)).status,403);
        assert.equal((await api(`${root}/${catalog}`,role,"POST",input)).status,403);
        assert.equal((await api(`${root}/${catalog}/${code}`,role,"PATCH",{...input,is_active:false})).status,403);
      }
      assert.equal((await api(`${root}/${catalog}`,null)).status,401);
      for (const invalid of [0,6,2.5,"3",null]) {
        assert.equal((await api(`${root}/${catalog}`,"admin","POST",{...input,matrix_weight:invalid})).status,400);
      }
      const {matrix_weight,...withoutWeight} = input;
      assert.equal((await api(`${root}/${catalog}`,"admin","POST",withoutWeight)).status,400);
      const row = await ok(`${root}/${catalog}`,catalog==="impact"?"manager":"admin","POST",input,201);
      assert.equal(row.matrix_weight,input.matrix_weight); assert.equal(row.rating,input.rating);
      assert.equal((await api(`${root}/${catalog}/${code}`,"manager","PATCH",{
        label:row.label,rating:row.rating,description:catalog==="likelihood"?row.description:undefined,
        rate_label:catalog==="impact"?row.rate_label:undefined,is_active:true,matrix_weight:6,expected:row,
      })).status,400);
      assert.equal((await ok(`${root}/${catalog}`,"admin")).find(r=>r.code===code).matrix_weight,input.matrix_weight);
    }
    const approved = await ok(`${root}/impact`,"manager");
    for(let i=1;i<=5;i++) assert.equal(approved.find(r=>r.code===`IMP_0${i}`).matrix_weight,6-i);
    const lApproved = await ok(`${root}/likelihood`,"manager");
    for(let i=1;i<=5;i++) assert.equal(lApproved.find(r=>r.code===`LIK_0${i}`).matrix_weight,6-i);
    await ok(`${root}/categories`,"manager","POST",{code,label:"Synthetic matrix category"},201);
    await ok(`${root}/objectives`,"manager","POST",{code,label:"Synthetic matrix objective",depart_code:depart},201);
    const {rows:[p]} = await pool.query(`INSERT INTO risk.periods(period_from,period_to)
      SELECT make_date(year,1,1),make_date(year,3,31) FROM generate_series(2400,2699) year
      WHERE NOT EXISTS(SELECT 1 FROM risk.periods WHERE period_from<=make_date(year,12,31) AND period_to>=make_date(year,1,1))
      ORDER BY year LIMIT 1 RETURNING period_id`);
    period = p.period_id;
    await writeFile(manifest,JSON.stringify({period}),{mode:0o600});
    const input = {depart_code:depart,period_id:period,objective_code:code,risk_title:"Synthetic matrix risk",
      risk_description:"Synthetic risk description",risk_category:code,risk_consequence:"Synthetic consequence"};
    const created = await ok("/risk-register/records","champion","POST",input,201);
    riskCode = created.risk_code;
    await writeFile(manifest,JSON.stringify({period,riskCode,code,depart}),{mode:0o600});
    await ok(`/risk-register/records/${riskCode}/root-causes`,"champion","POST",{
      root_cause:"Synthetic cause",mitigations:"Synthetic completed mitigation",due_date:"2099-01-01",
      action_owner:fixture.accounts.champion.username,action_status:"Closed",expected_updated_at:created.updated_at,
    });
    const detail = async() => (await ok(`/risk-register/records/${riskCode}`,"champion")).risk;
    const assess = async(extra={}) => {
      const current = await detail();
      return ok(`/risk-register/records/${riskCode}`,"champion","PUT",{
        ...input,i_rate:22.25,l_rate:.33,control_effectiveness:.5,
        comments:"Explicit synthetic reassessment",expected_updated_at:current.updated_at,reassess_ranking:true,...extra,
      });
    };
    const first = await assess();
    assert.equal(score(first),12); assert.equal(first.ranking_snapshot.impact.code,code);
    const before = await detail(); assert.equal(before.risk_status,"Closed");
    let reference = (await ok(`${root}/impact`,"manager")).find(r=>r.code===code);
    const update = {label:reference.label,rating:reference.rating,rate_label:reference.rate_label,is_active:true,matrix_weight:2,expected:reference};
    reference = await ok(`${root}/impact/${code}`,"manager","PATCH",update);
    assert.equal(reference.rating,22.25); assert.equal(reference.matrix_weight,2);
    assert.equal((await api(`${root}/impact/${code}`,"manager","PATCH",update)).status,409);
    const reloaded = await detail();
    assert.equal(score(reloaded),12); assert.equal(reloaded.i_risk_exposure,before.i_risk_exposure);
    assert.equal(reloaded.r_risk_exposure,before.r_risk_exposure); assert.equal(reloaded.risk_status,"Closed");
    assert.equal(reloaded.updated_at,before.updated_at);
    assert.equal(score(await assess({reassess_ranking:false})),12,"Ordinary save retains the original weights");
    const reassessed = await assess(); assert.equal(score(reassessed),6);
    const retired = await ok(`${root}/impact/${code}`,"admin","PATCH",{...update,expected:reference,is_active:false});
    assert.equal(retired.matrix_weight,2); assert.equal(retired.rating,22.25);
    assert.equal(score(await detail()),6);
    assert.equal((await ok("/risk-register/options","champion")).impact_factors.some(r=>r.code===code),false);
    reference = await ok(`${root}/impact/${code}`,"manager","PATCH",{...update,expected:retired,is_active:true});
    // Exact identity selection disambiguates factors with different matrix weights.
    await ok(`${root}/impact`,"manager","POST",{...impactInput,code:`${code}D`,matrix_weight:5},201);
    assert.equal(score(await assess({risk_impact:`${code}D`})),15);
    assert.equal(score(await assess({risk_impact:code})),6);
    assert.equal(score(await assess({i_rate:23.25})),null);
    await pool.query("DELETE FROM risk.impact_factors WHERE impact_code=$1",[`${code}D`]);
    assert.equal(score(await detail()),null,"Unknown snapshot stays unknown until explicit reassessment");
    assert.equal(score(await assess()),6);
    console.log("PASS: matrix create/edit/retire permissions, integer validation, approved defaults, factor preservation, stale updates, option reload, saved scores and Closed/root-action stability, explicit reassessment, ambiguous weights.");
    if(!process.argv.includes("--keep")) await cleanup();
  }
} catch(e) { await cleanup(); throw e; } finally { await pool.end(); }
