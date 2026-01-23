-- Down migration for 14_add_price_quantity_to_ingredients.up.sql
DROP INDEX IF EXISTS idx_ingredients_price_per_unit;
DROP INDEX IF EXISTS idx_ingredients_quantity;
