DROP TRIGGER IF EXISTS update_ingredient_stock_updated_at ON ingredient_stock;
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;
DROP TRIGGER IF EXISTS update_ingredient_groups_updated_at ON ingredient_groups;

DROP TYPE IF EXISTS measurement_type;

DROP TABLE IF EXISTS ingredient_stock CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS ingredient_groups CASCADE;

DROP INDEX IF EXISTS idx_ingredient_stock_branch;
DROP INDEX IF EXISTS idx_ingredient_stock_ingredient;
DROP INDEX IF EXISTS idx_ingredients_group;

DROP INDEX IF EXISTS idx_ingredients_price_per_unit;
DROP INDEX IF EXISTS idx_ingredients_quantity;

