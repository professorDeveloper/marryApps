-- Add cost calculation fields to goods table
-- These fields are auto-calculated when calculations are added/updated/deleted

ALTER TABLE goods ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE goods ADD COLUMN IF NOT EXISTS profit DECIMAL(15,2) DEFAULT 0;
ALTER TABLE goods ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,4) DEFAULT 0;

-- Add cost calculation fields to compounds table
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS profit DECIMAL(15,2) DEFAULT 0;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,4) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN goods.cost_price IS 'Total preparation cost (sum of all calculations total_cost)';
COMMENT ON COLUMN goods.profit IS 'Profit = price - cost_price';
COMMENT ON COLUMN goods.profit_margin IS 'Profit margin percentage = (profit / cost_price) * 100';

COMMENT ON COLUMN compounds.cost_price IS 'Total preparation cost (sum of all calculations total_cost)';
COMMENT ON COLUMN compounds.profit IS 'Profit = price - cost_price';
COMMENT ON COLUMN compounds.profit_margin IS 'Profit margin percentage = (profit / cost_price) * 100';
