-- Remove price_per_unit and quantity columns from ingredients table
ALTER TABLE ingredients
DROP COLUMN IF EXISTS price_per_unit,
DROP COLUMN IF EXISTS quantity;

-- Drop indexes
DROP INDEX IF EXISTS idx_ingredients_price_per_unit;
DROP INDEX IF EXISTS idx_ingredients_quantity;
