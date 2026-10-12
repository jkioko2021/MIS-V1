import assert from "node:assert/strict";

// Runs inside the existing isolated register fixture. Only synthetic references
// are edited; shared approved factors and their users are never changed.
export async function verifyRankingStability({pool, ok, api, assessment, assessed, prefix, riskCode}) {
  const impactCode = `${prefix}I`, likelihoodCode = `${prefix}L`;
  const path = `/records/${riskCode}`;
  let saved = assessed;
  const factors = {i_rate:70.13,l_rate:.42};
  const save = async extra => {
    saved = await ok(path,"champion","PUT",{
      ...assessment,...factors,...extra,expected_updated_at:saved.updated_at,
    });
    return saved;
  };
  try {
    await pool.query(`INSERT INTO risk.impact_factors(impact_code,impact_factor,rate_factor,rate)
      VALUES($1,'Major',70.13,'Synthetic')`,[impactCode]);
    await pool.query(`INSERT INTO risk.likelihood_factors(likelihood_code,likelihood_factor,rating,qualification_criteria)
      VALUES($1,'Possible',.42,'Synthetic ranking fixture')`,[likelihoodCode]);
    await save({risk_impact:impactCode,risk_likelihood:likelihoodCode});
    const original=structuredClone(saved.ranking_snapshot);
    assert.deepEqual(original,{
      impact:{code:impactCode,label:"Major",ordinal:4},
      likelihood:{code:likelihoodCode,label:"Possible",ordinal:3},
    });
    assert.equal(Number(saved.i_risk_exposure),29.45);
    assert.equal(Number(saved.r_risk_exposure),19.64);
    const persisted=await ok(path,"champion","GET");
    assert.deepEqual(persisted.risk.ranking_snapshot,original);
    const list=await ok(`/records?access=update&depart_code=${assessment.depart_code}&period_id=${assessment.period_id}`,"champion","GET");
    assert.deepEqual(list.find(row=>row.risk_code===riskCode).ranking_snapshot,original);
    assert.equal((await api(path,"unrelated")).status,403);
    await pool.query("UPDATE risk.impact_factors SET impact_factor='Renamed synthetic impact',rate_factor=40.13,is_active=false WHERE impact_code=$1",[impactCode]);
    await pool.query("UPDATE risk.likelihood_factors SET likelihood_factor='Renamed synthetic likelihood',rating=.22,is_active=false WHERE likelihood_code=$1",[likelihoodCode]);
    for(let i=0;i<2;i++) {
      await save({comments:`Ordinary save after catalog edit ${i}`});
      assert.deepEqual(saved.ranking_snapshot,original);
      assert.equal(Number(saved.i_risk_exposure),29.45);
      assert.equal(Number(saved.r_risk_exposure),19.64);
    }
    assert.equal((await api(path,"champion","PUT",{
      ...assessment,...factors,expected_updated_at:saved.updated_at,reassess_ranking:true,
    })).status,400,"Retired or reweighted factors require an active selection");
    await pool.query("UPDATE risk.impact_factors SET impact_factor='Minor',rate_factor=70.13,is_active=true WHERE impact_code=$1",[impactCode]);
    await pool.query("UPDATE risk.likelihood_factors SET likelihood_factor='Rare',rating=.42,is_active=true WHERE likelihood_code=$1",[likelihoodCode]);
    await save({});
    assert.deepEqual(saved.ranking_snapshot,original,"Reactivation must not silently refresh weights");
    await save({reassess_ranking:true});
    assert.equal(saved.ranking_snapshot.impact.ordinal,2);
    assert.equal(saved.ranking_snapshot.likelihood.ordinal,1);
    assert.equal(Number(saved.i_risk_exposure),29.45,"Matrix weights do not affect exposure");
    assert.equal(Number(saved.r_risk_exposure),19.64);
    const reloaded=await ok(path,"champion","GET");
    assert.equal(reloaded.risk.ranking_snapshot.impact.label,"Minor");
    const event=reloaded.history.find(item=>item.action==="ASSESSED");
    assert.deepEqual(event.snapshot.before.ranking_snapshot,original);
    assert.equal(event.snapshot.after.ranking_snapshot.impact.ordinal,2);
    // Selecting the same numeric factor is an explicit reassessment of that
    // axis, even without the refresh-both checkbox.
    await pool.query("UPDATE risk.impact_factors SET impact_factor='Moderate' WHERE impact_code=$1",[impactCode]);
    await save({risk_impact:impactCode});
    assert.equal(saved.ranking_snapshot.impact.ordinal,3);
    assert.equal(saved.ranking_snapshot.likelihood.ordinal,1);
    // Ambiguous numeric matches must never pick an arbitrary first identity.
    await pool.query(`INSERT INTO risk.impact_factors(impact_code,impact_factor,rate_factor,rate)
      VALUES($1,'Major',70.13,'Synthetic')`,[`${impactCode}X`]);
    saved=await ok(path,"champion","PUT",{...assessment,expected_updated_at:saved.updated_at,reassess_ranking:true});
    assert.equal(saved.ranking_snapshot.impact,null);
    assert.equal(saved.ranking_snapshot.likelihood,null);
    await save({});
    assert.equal(saved.ranking_snapshot.impact,null);
    await save({risk_impact:impactCode});
    assert.equal(saved.ranking_snapshot.impact.code,impactCode);
    assert.equal(saved.ranking_snapshot.impact.ordinal,3);
    // Return the fixture to its original unknown legacy values for the existing
    // workflow, exposure, root-cause and history assertions.
    saved=await ok(path,"champion","PUT",{...assessment,expected_updated_at:saved.updated_at,reassess_ranking:true});
    assert.deepEqual(saved.ranking_snapshot,{impact:null,likelihood:null});
    assert.equal(Number(saved.r_risk_exposure),13.33);
    return saved;
  } finally {
    await pool.query("DELETE FROM risk.impact_factors WHERE impact_code=ANY($1::text[])",[[impactCode,`${impactCode}X`]]);
    await pool.query("DELETE FROM risk.likelihood_factors WHERE likelihood_code=$1",[likelihoodCode]);
  }
}
