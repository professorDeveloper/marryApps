-- Remove cost calculation fields from goods table

ALTER TABLE goods DROP COLUMN IF EXISTS cost_price;
ALTER TABLE goods DROP COLUMN IF EXISTS profit;
ALTER TABLE goods DROP COLUMN IF EXISTS profit_margin;

-- Remove cost calculation fields from compounds table

ALTER TABLE compounds DROP COLUMN IF EXISTS cost_price;
ALTER TABLE compounds DROP COLUMN IF EXISTS profit;
ALTER TABLE compounds DROP COLUMN IF EXISTS profit_margin;
