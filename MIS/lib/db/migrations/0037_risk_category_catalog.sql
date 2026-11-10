-- Add supplied category codes without removing historical categories or their references.
BEGIN;
INSERT INTO risk.categories(category_code,category_name,is_active) VALUES
 ('CAT_01','Strategic',true),
 ('CAT_02','Operational',true),
 ('CAT_03','Insurance',true),
 ('CAT_04','Concentration',true),
 ('CAT_05','Balance sheet and market',true),
 ('CAT_06','Liquidity',true),
 ('CAT_07','Counterparty default',true),
 ('CAT_08','Contagion and related party',true),
 ('CAT_09','Legal and regulatory',true),
 ('CAT_10','Reinsurance',true)
ON CONFLICT (category_code) DO UPDATE SET category_name=EXCLUDED.category_name,is_active=true;
COMMIT;
