-- Migration 14: Add indices for price_per_unit and quantity columns
-- Note: price_per_unit and quantity columns are now added directly in the ingredients table (migration 6)
-- This migration only creates indices for these columns for query performance

CREATE INDEX IF NOT EXISTS idx_ingredients_price_per_unit ON ingredients(price_per_unit) WHERE deleted_at = 0;
CREATE INDEX IF NOT EXISTS idx_ingredients_quantity ON ingredients(quantity) WHERE deleted_at = 0;
