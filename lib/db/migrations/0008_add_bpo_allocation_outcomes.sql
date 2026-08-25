-- Keep the product selected during BPO review on the original business file.
-- Pricing handoffs are durable so downstream teams can audit the route without
-- relying on notification delivery or transient work-item state.
ALTER TABLE crm.business_tracking
  ADD COLUMN IF NOT EXISTS product VARCHAR(50),
  ADD COLUMN IF NOT EXISTS to_pricing_dt TIMESTAMPTZ;