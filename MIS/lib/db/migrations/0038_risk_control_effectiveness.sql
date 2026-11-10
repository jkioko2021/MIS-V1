BEGIN;
CREATE TABLE IF NOT EXISTS risk.control_effectiveness (
  eff_factor varchar(50) PRIMARY KEY,
  qual_criteria text NOT NULL,
  rating numeric(8,6) NOT NULL CHECK (rating >= 0 AND rating <= 1),
  is_active boolean NOT NULL DEFAULT true
);
INSERT INTO risk.control_effectiveness(eff_factor,qual_criteria,rating,is_active) VALUES
 ('Very Good','Risk exposure is effectively controlled and managed.',0.9,true),
 ('Good','Majority of risk exposure is effectively controlled and managed.',0.8,true),
 ('Satisfactory','There could be room for some improvement.',0.65,true),
 ('Weak','Some of the risk exposure appears to be controlled, but there are major deficiencies.',0.4,true),
 ('Ineffective','Control measures are ineffective.',0.2,true)
ON CONFLICT (eff_factor) DO UPDATE SET qual_criteria=EXCLUDED.qual_criteria,rating=EXCLUDED.rating,is_active=true;
COMMIT;
