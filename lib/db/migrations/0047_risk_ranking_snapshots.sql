BEGIN;
ALTER TABLE risk.risk_master ADD COLUMN IF NOT EXISTS ranking_snapshot jsonb;
-- Freeze only explicitly stored, still-verifiable approved identities. A raw
-- legacy number (or stale identity from an unmatched custom factor) is not proof
-- of a matrix position. Retired references remain valid historical evidence.
UPDATE risk.risk_master r SET ranking_snapshot=jsonb_build_object(
  'impact', (SELECT jsonb_build_object('code',i.impact_code,'label',i.impact_factor,
    'ordinal',COALESCE(CASE i.impact_code WHEN 'IMP_01' THEN 5 WHEN 'IMP_02' THEN 4
      WHEN 'IMP_03' THEN 3 WHEN 'IMP_04' THEN 2 WHEN 'IMP_05' THEN 1 END,
      CASE lower(trim(i.impact_factor)) WHEN 'catastrophic' THEN 5 WHEN 'major' THEN 4
        WHEN 'moderate' THEN 3 WHEN 'minor' THEN 2 WHEN 'insignificant' THEN 1 END))
    FROM risk.impact_factors i WHERE i.impact_code=r.risk_impact AND i.rate_factor=r.i_rate),
  'likelihood', (SELECT jsonb_build_object('code',l.likelihood_code,'label',l.likelihood_factor,
    'ordinal',COALESCE(CASE l.likelihood_code WHEN 'LIK_01' THEN 5 WHEN 'LIK_02' THEN 4
      WHEN 'LIK_03' THEN 3 WHEN 'LIK_04' THEN 2 WHEN 'LIK_05' THEN 1 END,
      CASE lower(trim(l.likelihood_factor)) WHEN 'certain' THEN 5 WHEN 'likely' THEN 4
        WHEN 'possible' THEN 3 WHEN 'unlikely' THEN 2 WHEN 'rare' THEN 1 END))
    FROM risk.likelihood_factors l WHERE l.likelihood_code=r.risk_likelihood AND l.rating=r.l_rate))
WHERE ranking_snapshot IS NULL;
COMMIT;
