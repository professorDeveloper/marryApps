CREATE TABLE IF NOT EXISTS deduction_item_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deduction_item_id UUID NOT NULL REFERENCES deduction_items(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,6) NOT NULL DEFAULT 0,
    stock_before NUMERIC(18,6) NOT NULL DEFAULT 0,
    stock_after NUMERIC(18,6) NOT NULL DEFAULT 0,
    price_per_unit NUMERIC(18,2) NOT NULL DEFAULT 0,
    amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_items_deduction_ingredient
ON deduction_items(deduction_id, ingredient_id)
WHERE deleted_at = 0 AND ingredient_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_items_deduction_good
ON deduction_items(deduction_id, good_id)
WHERE deleted_at = 0 AND good_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deduction_items_deduction_compound
ON deduction_items(deduction_id, compound_id)
WHERE deleted_at = 0 AND compound_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deduction_item_ingredients_deduction_item_id
ON deduction_item_ingredients(deduction_item_id)
WHERE deleted_at = 0;

CREATE INDEX IF NOT EXISTS idx_deduction_item_ingredients_ingredient_id
ON deduction_item_ingredients(ingredient_id)
WHERE deleted_at = 0;

CREATE TRIGGER update_deduction_item_ingredients_updated_at BEFORE UPDATE ON deduction_item_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE deductions
  ALTER COLUMN balance TYPE NUMERIC(18,2) USING balance::numeric;
