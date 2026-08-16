-- Revert: Remove is_active column from ingredient_stock_movements
DROP INDEX IF EXISTS idx_ingredient_stock_movements_is_active;

ALTER TABLE ingredient_stock_movements
DROP COLUMN IF EXISTS is_active;
