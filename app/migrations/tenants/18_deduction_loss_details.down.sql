ALTER TABLE deductions
  ALTER COLUMN balance TYPE DECIMAL(15,2) USING balance::decimal(15,2);

DROP INDEX IF EXISTS uq_deduction_items_deduction_compound;
DROP INDEX IF EXISTS uq_deduction_items_deduction_good;
DROP INDEX IF EXISTS uq_deduction_items_deduction_ingredient;

DROP TRIGGER IF EXISTS update_deduction_item_ingredients_updated_at ON deduction_item_ingredients;

DROP INDEX IF EXISTS idx_deduction_item_ingredients_ingredient_id;
DROP INDEX IF EXISTS idx_deduction_item_ingredients_deduction_item_id;

DROP TABLE IF EXISTS deduction_item_ingredients;
