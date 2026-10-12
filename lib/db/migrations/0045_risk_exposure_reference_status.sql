ALTER TABLE risk.exposure_bands ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
